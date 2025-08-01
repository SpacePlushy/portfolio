#!/bin/bash

# =============================================================================
# COMPREHENSIVE BACKUP SCRIPT
# =============================================================================
# Automated backup script for portfolio image optimization system
# Usage: ./backup.sh [redis|images|config|monitoring|all]

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_DIR="${BACKUP_DIR:-/tmp/portfolio-backups}"
LOG_FILE="${LOG_FILE:-/var/log/portfolio-backup.log}"

# Backup configuration
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PREFIX="portfolio-backup-${TIMESTAMP}"

# Digital Ocean Spaces configuration
DO_SPACES_ENDPOINT="${DO_SPACES_ENDPOINT:-nyc3.digitaloceanspaces.com}"
DO_SPACES_BUCKET="${DO_SPACES_BUCKET:-portfolio-backups}"
DO_SPACES_REGION="${DO_SPACES_REGION:-nyc3}"

# Redis configuration
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
REDIS_BACKUP_PATH="${BACKUP_DIR}/redis"

# Image cache configuration
IMAGE_CACHE_PATH="${IMAGE_CACHE_PATH:-/app/.cache/images}"
IMAGE_BACKUP_PATH="${BACKUP_DIR}/images"

# Configuration backup paths
CONFIG_PATHS=(
    "/app/astro.config.mjs"
    "/app/package.json"
    "/app/tsconfig.json"
    "/app/monitoring"
    "/app/deploy"
)
CONFIG_BACKUP_PATH="${BACKUP_DIR}/config"

# Monitoring backup paths
MONITORING_PATHS=(
    "/prometheus"
    "/app/monitoring"
    "/var/log/portfolio"
)
MONITORING_BACKUP_PATH="${BACKUP_DIR}/monitoring"

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $*" | tee -a "$LOG_FILE"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

create_backup_dir() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir"
        log "Created backup directory: $dir"
    fi
}

compress_directory() {
    local source_dir="$1"
    local output_file="$2"
    
    if [[ -d "$source_dir" ]]; then
        tar -czf "$output_file" -C "$(dirname "$source_dir")" "$(basename "$source_dir")"
        log "Compressed $source_dir to $output_file"
        
        # Verify compression
        if tar -tzf "$output_file" > /dev/null 2>&1; then
            log_success "Compression verification passed for $output_file"
        else
            log_error "Compression verification failed for $output_file"
            return 1
        fi
    else
        log_error "Source directory does not exist: $source_dir"
        return 1
    fi
}

upload_to_spaces() {
    local local_file="$1"
    local remote_path="$2"
    
    if command -v s3cmd > /dev/null 2>&1; then
        # Using s3cmd
        s3cmd put "$local_file" "s3://${DO_SPACES_BUCKET}/${remote_path}" \
            --host="$DO_SPACES_ENDPOINT" \
            --host-bucket="%(bucket)s.$DO_SPACES_ENDPOINT" \
            --encrypt
        
        log_success "Uploaded $local_file to s3://${DO_SPACES_BUCKET}/${remote_path}"
    elif command -v aws > /dev/null 2>&1; then
        # Using AWS CLI configured for DO Spaces
        aws s3 cp "$local_file" "s3://${DO_SPACES_BUCKET}/${remote_path}" \
            --endpoint-url "https://$DO_SPACES_ENDPOINT" \
            --region "$DO_SPACES_REGION"
        
        log_success "Uploaded $local_file to s3://${DO_SPACES_BUCKET}/${remote_path}"
    else
        log_error "Neither s3cmd nor aws CLI found. Cannot upload to Digital Ocean Spaces"
        return 1
    fi
}

calculate_checksum() {
    local file="$1"
    sha256sum "$file" | awk '{print $1}'
}

send_notification() {
    local message="$1"
    local severity="${2:-info}"
    
    # Slack notification
    if [[ -n "${BACKUP_ALERT_WEBHOOK:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🔄 Backup ${severity}: ${message}\"}" \
            "$BACKUP_ALERT_WEBHOOK"
    fi
    
    # Email notification (if configured)
    if [[ -n "${BACKUP_EMAIL:-}" ]] && command -v mail > /dev/null 2>&1; then
        echo "$message" | mail -s "Portfolio Backup ${severity}" "$BACKUP_EMAIL"
    fi
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

backup_redis() {
    log "Starting Redis backup..."
    
    create_backup_dir "$REDIS_BACKUP_PATH"
    
    local redis_dump_file="${REDIS_BACKUP_PATH}/redis-${TIMESTAMP}.rdb"
    local redis_archive="${REDIS_BACKUP_PATH}/redis-${TIMESTAMP}.tar.gz"
    
    # Create Redis dump
    if command -v redis-cli > /dev/null 2>&1; then
        # Trigger background save
        redis-cli -u "$REDIS_URL" BGSAVE
        
        # Wait for background save to complete
        while [[ "$(redis-cli -u "$REDIS_URL" LASTSAVE)" == "$(redis-cli -u "$REDIS_URL" LASTSAVE)" ]]; do
            sleep 1
        done
        
        # Copy the dump file
        redis-cli -u "$REDIS_URL" --rdb "$redis_dump_file"
        
        if [[ -f "$redis_dump_file" ]]; then
            # Compress the dump
            gzip "$redis_dump_file"
            local compressed_dump="${redis_dump_file}.gz"
            
            # Calculate checksum
            local checksum=$(calculate_checksum "$compressed_dump")
            echo "$checksum  $(basename "$compressed_dump")" > "${compressed_dump}.sha256"
            
            # Upload to Digital Ocean Spaces
            upload_to_spaces "$compressed_dump" "redis-backups/$(basename "$compressed_dump")"
            upload_to_spaces "${compressed_dump}.sha256" "redis-backups/$(basename "$compressed_dump").sha256"
            
            log_success "Redis backup completed: $compressed_dump"
            return 0
        else
            log_error "Failed to create Redis dump file"
            return 1
        fi
    else
        log_error "redis-cli not found. Cannot backup Redis"
        return 1
    fi
}

backup_images() {
    log "Starting image cache backup..."
    
    create_backup_dir "$IMAGE_BACKUP_PATH"
    
    if [[ -d "$IMAGE_CACHE_PATH" ]]; then
        local image_archive="${IMAGE_BACKUP_PATH}/images-${TIMESTAMP}.tar.gz"
        
        # Create incremental backup using rsync
        local sync_dir="${IMAGE_BACKUP_PATH}/sync"
        create_backup_dir "$sync_dir"
        
        # Sync with deduplication
        rsync -av --delete --link-dest="$sync_dir" "$IMAGE_CACHE_PATH/" "$sync_dir/"
        
        # Create compressed archive
        compress_directory "$sync_dir" "$image_archive"
        
        if [[ -f "$image_archive" ]]; then
            # Calculate checksum
            local checksum=$(calculate_checksum "$image_archive")
            echo "$checksum  $(basename "$image_archive")" > "${image_archive}.sha256"
            
            # Upload to Digital Ocean Spaces
            upload_to_spaces "$image_archive" "image-backups/$(basename "$image_archive")"
            upload_to_spaces "${image_archive}.sha256" "image-backups/$(basename "$image_archive").sha256"
            
            log_success "Image backup completed: $image_archive"
            return 0
        else
            log_error "Failed to create image backup archive"
            return 1
        fi
    else
        log "Image cache directory does not exist: $IMAGE_CACHE_PATH"
        return 0
    fi
}

backup_config() {
    log "Starting configuration backup..."
    
    create_backup_dir "$CONFIG_BACKUP_PATH"
    
    local config_archive="${CONFIG_BACKUP_PATH}/config-${TIMESTAMP}.tar.gz"
    local temp_config_dir="${CONFIG_BACKUP_PATH}/temp"
    
    create_backup_dir "$temp_config_dir"
    
    # Copy configuration files
    for config_path in "${CONFIG_PATHS[@]}"; do
        if [[ -e "$config_path" ]]; then
            # Preserve directory structure
            local relative_path="${config_path#/}"
            local dest_dir="$(dirname "$temp_config_dir/$relative_path")"
            create_backup_dir "$dest_dir"
            
            cp -r "$config_path" "$dest_dir/"
            log "Copied $config_path to backup"
        else
            log "Configuration path does not exist: $config_path"
        fi
    done
    
    # Create archive
    if [[ -d "$temp_config_dir" ]] && [[ -n "$(ls -A "$temp_config_dir")" ]]; then
        compress_directory "$temp_config_dir" "$config_archive"
        
        # Calculate checksum
        local checksum=$(calculate_checksum "$config_archive")
        echo "$checksum  $(basename "$config_archive")" > "${config_archive}.sha256"
        
        # Upload to Digital Ocean Spaces
        upload_to_spaces "$config_archive" "config-backups/$(basename "$config_archive")"
        upload_to_spaces "${config_archive}.sha256" "config-backups/$(basename "$config_archive").sha256"
        
        # Cleanup temp directory
        rm -rf "$temp_config_dir"
        
        log_success "Configuration backup completed: $config_archive"
        return 0
    else
        log_error "No configuration files found to backup"
        return 1
    fi
}

backup_monitoring() {
    log "Starting monitoring data backup..."
    
    create_backup_dir "$MONITORING_BACKUP_PATH"
    
    local monitoring_archive="${MONITORING_BACKUP_PATH}/monitoring-${TIMESTAMP}.tar.gz"
    local temp_monitoring_dir="${MONITORING_BACKUP_PATH}/temp"
    
    create_backup_dir "$temp_monitoring_dir"
    
    # Copy monitoring data
    for monitoring_path in "${MONITORING_PATHS[@]}"; do
        if [[ -e "$monitoring_path" ]]; then
            local relative_path="${monitoring_path#/}"
            local dest_dir="$(dirname "$temp_monitoring_dir/$relative_path")"
            create_backup_dir "$dest_dir"
            
            # Use rsync for efficient copying with exclusions
            rsync -av --exclude="*.tmp" --exclude="*.lock" \
                "$monitoring_path/" "$dest_dir/$(basename "$monitoring_path")/"
            log "Copied $monitoring_path to backup"
        else
            log "Monitoring path does not exist: $monitoring_path"
        fi
    done
    
    # Create archive
    if [[ -d "$temp_monitoring_dir" ]] && [[ -n "$(ls -A "$temp_monitoring_dir")" ]]; then
        compress_directory "$temp_monitoring_dir" "$monitoring_archive"
        
        # Calculate checksum
        local checksum=$(calculate_checksum "$monitoring_archive")
        echo "$checksum  $(basename "$monitoring_archive")" > "${monitoring_archive}.sha256"
        
        # Upload to Digital Ocean Spaces
        upload_to_spaces "$monitoring_archive" "monitoring-backups/$(basename "$monitoring_archive")"
        upload_to_spaces "${monitoring_archive}.sha256" "monitoring-backups/$(basename "$monitoring_archive").sha256"
        
        # Cleanup temp directory
        rm -rf "$temp_monitoring_dir"
        
        log_success "Monitoring backup completed: $monitoring_archive"
        return 0
    else
        log_error "No monitoring data found to backup"
        return 1
    fi
}

cleanup_old_backups() {
    log "Cleaning up old local backup files..."
    
    # Keep only the last 3 local backups
    find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +3 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -type f -name "*.rdb.gz" -mtime +3 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -type f -name "*.sha256" -mtime +3 -delete 2>/dev/null || true
    
    log "Local backup cleanup completed"
}

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

validate_backup() {
    local backup_file="$1"
    local checksum_file="${backup_file}.sha256"
    
    if [[ -f "$checksum_file" ]]; then
        local expected_checksum=$(awk '{print $1}' "$checksum_file")
        local actual_checksum=$(calculate_checksum "$backup_file")
        
        if [[ "$expected_checksum" == "$actual_checksum" ]]; then
            log_success "Backup validation passed: $backup_file"
            return 0
        else
            log_error "Backup validation failed: $backup_file"
            log_error "Expected: $expected_checksum"
            log_error "Actual: $actual_checksum"
            return 1
        fi
    else
        log_error "Checksum file not found: $checksum_file"
        return 1
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    local backup_type="${1:-all}"
    local exit_code=0
    
    log "Starting backup process: $backup_type"
    log "Backup timestamp: $TIMESTAMP"
    log "Backup directory: $BACKUP_DIR"
    
    # Create main backup directory
    create_backup_dir "$BACKUP_DIR"
    
    # Execute backups based on type
    case "$backup_type" in
        redis)
            backup_redis || exit_code=$?
            ;;
        images)
            backup_images || exit_code=$?
            ;;
        config)
            backup_config || exit_code=$?
            ;;
        monitoring)
            backup_monitoring || exit_code=$?
            ;;
        all)
            backup_redis || exit_code=$?
            backup_images || exit_code=$?
            backup_config || exit_code=$?
            backup_monitoring || exit_code=$?
            ;;
        *)
            log_error "Invalid backup type: $backup_type"
            log "Usage: $0 [redis|images|config|monitoring|all]"
            exit 1
            ;;
    esac
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send notification
    if [[ $exit_code -eq 0 ]]; then
        send_notification "Backup completed successfully: $backup_type" "success"
        log_success "All backup operations completed successfully"
    else
        send_notification "Backup failed: $backup_type" "error"
        log_error "Some backup operations failed"
    fi
    
    log "Backup process finished with exit code: $exit_code"
    exit $exit_code
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Trap signals for cleanup
trap 'log "Backup script interrupted"; exit 130' INT TERM

# Check dependencies
REQUIRED_COMMANDS=(tar gzip rsync sha256sum)
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command -v "$cmd" > /dev/null 2>&1; then
        log_error "Required command not found: $cmd"
        exit 1
    fi
done

# Execute main function
main "$@"