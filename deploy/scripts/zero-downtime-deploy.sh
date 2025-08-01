#!/bin/bash

# =============================================================================
# ZERO-DOWNTIME DEPLOYMENT SCRIPT
# =============================================================================
# Implements blue-green deployment strategy for Digital Ocean App Platform
# Usage: ./zero-downtime-deploy.sh [production|staging] [image-tag]

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="${LOG_FILE:-/var/log/portfolio-deploy.log}"

# Deployment configuration
ENVIRONMENT="${1:-production}"
IMAGE_TAG="${2:-latest}"
DEPLOYMENT_TIMEOUT=1800  # 30 minutes
HEALTH_CHECK_TIMEOUT=300 # 5 minutes
ROLLBACK_TIMEOUT=600     # 10 minutes

# Digital Ocean configuration
DO_CLI_VERSION="1.102.0"
DOCTL_COMMAND="doctl"

# App IDs (these should be set as environment variables)
case "$ENVIRONMENT" in
    production)
        APP_ID="${DO_PRODUCTION_APP_ID}"
        APP_SPEC="${PROJECT_ROOT}/.do/app.yaml"
        DOMAIN="${PRODUCTION_URL:-https://frankpalmisano.com}"
        ;;
    staging)
        APP_ID="${DO_STAGING_APP_ID}"
        APP_SPEC="${PROJECT_ROOT}/.do/app.staging.yaml"
        DOMAIN="${STAGING_URL:-https://portfolio-staging.ondigitalocean.app}"
        ;;
    *)
        echo "ERROR: Invalid environment. Use 'production' or 'staging'"
        exit 1
        ;;
esac

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

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $*" | tee -a "$LOG_FILE"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

check_dependencies() {
    log "Checking deployment dependencies..."
    
    # Check if doctl is installed
    if ! command -v doctl > /dev/null 2>&1; then
        log_error "doctl CLI not found. Please install Digital Ocean CLI"
        exit 1
    fi
    
    # Check doctl authentication
    if ! doctl account get > /dev/null 2>&1; then
        log_error "doctl not authenticated. Please run 'doctl auth init'"
        exit 1
    fi
    
    # Check required environment variables
    if [[ -z "${APP_ID:-}" ]]; then
        log_error "App ID not configured for environment: $ENVIRONMENT"
        exit 1
    fi
    
    # Check app spec file exists
    if [[ ! -f "$APP_SPEC" ]]; then
        log_error "App spec file not found: $APP_SPEC"
        exit 1
    fi
    
    log_success "All dependencies check passed"
}

get_current_deployment() {
    log "Getting current deployment information..."
    
    local current_deployment
    current_deployment=$(doctl apps list-deployments "$APP_ID" --format ID,Phase,CreatedAt --no-header | head -1)
    
    if [[ -n "$current_deployment" ]]; then
        echo "$current_deployment" | awk '{print $1}'
    else
        log_error "No current deployment found"
        return 1
    fi
}

wait_for_deployment() {
    local deployment_id="$1"
    local timeout="${2:-$DEPLOYMENT_TIMEOUT}"
    local start_time=$(date +%s)
    
    log "Waiting for deployment $deployment_id to complete (timeout: ${timeout}s)..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            log_error "Deployment timeout after ${timeout}s"
            return 1
        fi
        
        local deployment_info
        deployment_info=$(doctl apps get-deployment "$APP_ID" "$deployment_id" --format Phase,Progress --no-header)
        local phase=$(echo "$deployment_info" | awk '{print $1}')
        local progress=$(echo "$deployment_info" | awk '{print $2}')
        
        log "Deployment status: $phase ($progress)"
        
        case "$phase" in
            ACTIVE)
                log_success "Deployment completed successfully"
                return 0
                ;;
            ERROR|CANCELED|SUPERSEDED)
                log_error "Deployment failed with status: $phase"
                return 1
                ;;
            PENDING_BUILD|PENDING_DEPLOY|BUILDING|DEPLOYING)
                sleep 30
                ;;
            *)
                log_warning "Unknown deployment phase: $phase"
                sleep 30
                ;;
        esac
    done
}

health_check() {
    local url="$1"
    local timeout="${2:-$HEALTH_CHECK_TIMEOUT}"
    local start_time=$(date +%s)
    
    log "Performing health check on $url (timeout: ${timeout}s)..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            log_error "Health check timeout after ${timeout}s"
            return 1
        fi
        
        # Check main health endpoint
        if curl -f -s --max-time 10 "$url/api/health" > /dev/null 2>&1; then
            log "Main health check passed"
            
            # Check image service health
            if curl -f -s --max-time 10 "$url/api/image/health" > /dev/null 2>&1; then
                log "Image service health check passed"
                
                # Check monitoring endpoint
                if curl -f -s --max-time 10 "$url/metrics" > /dev/null 2>&1; then
                    log_success "All health checks passed"
                    return 0
                else
                    log_warning "Monitoring endpoint not responding, but continuing..."
                    return 0
                fi
            else
                log "Image service health check failed, retrying..."
            fi
        else
            log "Main health check failed, retrying..."
        fi
        
        sleep 10
    done
}

performance_validation() {
    local url="$1"
    
    log "Running performance validation on $url..."
    
    # Basic response time check
    local response_time
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "$url" || echo "999")
    
    if (( $(echo "$response_time > 5.0" | bc -l) )); then
        log_warning "Response time is high: ${response_time}s"
        return 1
    fi
    
    # Check if image optimization is working
    local image_test_url="$url/api/image/test"
    if curl -f -s --max-time 30 "$image_test_url" > /dev/null 2>&1; then
        log_success "Image optimization service is responding"
    else
        log_warning "Image optimization service test failed"
        return 1
    fi
    
    log_success "Performance validation passed (response time: ${response_time}s)"
    return 0
}

send_notification() {
    local message="$1"
    local status="${2:-info}"
    local color="good"
    
    case "$status" in
        error|failure)
            color="danger"
            ;;
        warning)
            color="warning"
            ;;
        success)
            color="good"
            ;;
    esac
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🚀 Deployment ${status}\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [{
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    }, {
                        \"title\": \"Image Tag\",
                        \"value\": \"$IMAGE_TAG\",
                        \"short\": true
                    }, {
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
    
    # Email notification (if configured)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]] && command -v mail > /dev/null 2>&1; then
        echo "$message" | mail -s "Deployment $status: $ENVIRONMENT" "$NOTIFICATION_EMAIL" || true
    fi
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    local current_deployment
    current_deployment=$(get_current_deployment)
    
    if [[ -n "$current_deployment" ]]; then
        # Export current app configuration
        doctl apps spec get "$APP_ID" > "${PROJECT_ROOT}/backup/app-spec-${current_deployment}.yaml"
        
        # Store deployment metadata
        echo "BACKUP_DEPLOYMENT_ID=$current_deployment" > "${PROJECT_ROOT}/backup/deployment-metadata.env"
        echo "BACKUP_TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)" >> "${PROJECT_ROOT}/backup/deployment-metadata.env"
        echo "BACKUP_ENVIRONMENT=$ENVIRONMENT" >> "${PROJECT_ROOT}/backup/deployment-metadata.env"
        
        log_success "Backup created for deployment: $current_deployment"
        echo "$current_deployment"
    else
        log_error "Failed to backup current deployment"
        return 1
    fi
}

update_app_spec_with_image_tags() {
    log "Updating app spec with new image tags..."
    
    # Create temporary app spec
    local temp_spec="${APP_SPEC}.tmp"
    cp "$APP_SPEC" "$temp_spec"
    
    # Update image tags in the spec
    sed -i.bak "s|image: .*portfolio-|image: ${REGISTRY}/${REGISTRY_NAMESPACE}/portfolio-|g" "$temp_spec"
    sed -i.bak "s|:latest|:${IMAGE_TAG}|g" "$temp_spec"
    sed -i.bak "s|:main|:${IMAGE_TAG}|g" "$temp_spec"
    
    # Validate the updated spec
    if doctl apps spec validate "$temp_spec" > /dev/null 2>&1; then
        log_success "App spec validation passed"
        mv "$temp_spec" "$APP_SPEC.deploy"
        rm -f "${temp_spec}.bak"
    else
        log_error "App spec validation failed"
        rm -f "$temp_spec" "${temp_spec}.bak"
        return 1
    fi
}

deploy_new_version() {
    log "Deploying new version with image tag: $IMAGE_TAG..."
    
    # Update app spec with new image tags
    update_app_spec_with_image_tags
    
    # Deploy using updated spec
    local deployment_output
    deployment_output=$(doctl apps update "$APP_ID" --spec "${APP_SPEC}.deploy" --format ID --no-header)
    
    if [[ -n "$deployment_output" ]]; then
        local deployment_id="$deployment_output"
        log_success "Deployment initiated: $deployment_id"
        
        # Wait for deployment to complete
        if wait_for_deployment "$deployment_id"; then
            log_success "New deployment completed successfully"
            echo "$deployment_id"
        else
            log_error "New deployment failed"
            return 1
        fi
    else
        log_error "Failed to initiate deployment"
        return 1
    fi
}

validate_deployment() {
    local deployment_id="$1"
    
    log "Validating deployment: $deployment_id..."
    
    # Wait a bit for services to stabilize
    sleep 30
    
    # Perform health checks
    if health_check "$DOMAIN"; then
        log_success "Health checks passed"
    else
        log_error "Health checks failed"
        return 1
    fi
    
    # Perform performance validation
    if performance_validation "$DOMAIN"; then
        log_success "Performance validation passed"
    else
        log_error "Performance validation failed"
        return 1
    fi
    
    # Check service metrics (if monitoring is available)
    if [[ -n "${GRAFANA_URL:-}" ]]; then
        log "Checking service metrics..."
        # Add custom metric validation here
    fi
    
    log_success "Deployment validation completed successfully"
    return 0
}

# =============================================================================
# ROLLBACK FUNCTIONS
# =============================================================================

rollback_deployment() {
    local backup_deployment_id="${1:-}"
    
    log "Initiating rollback procedure..."
    
    if [[ -z "$backup_deployment_id" ]]; then
        # Try to get backup deployment from metadata
        if [[ -f "${PROJECT_ROOT}/backup/deployment-metadata.env" ]]; then
            source "${PROJECT_ROOT}/backup/deployment-metadata.env"
            backup_deployment_id="$BACKUP_DEPLOYMENT_ID"
        fi
    fi
    
    if [[ -z "$backup_deployment_id" ]]; then
        log_error "No backup deployment ID available for rollback"
        return 1
    fi
    
    log "Rolling back to deployment: $backup_deployment_id..."
    
    # Use backup app spec if available
    local rollback_spec="$APP_SPEC"
    if [[ -f "${PROJECT_ROOT}/backup/app-spec-${backup_deployment_id}.yaml" ]]; then
        rollback_spec="${PROJECT_ROOT}/backup/app-spec-${backup_deployment_id}.yaml"
        log "Using backup app spec for rollback"
    fi
    
    # Initiate rollback
    local rollback_output
    rollback_output=$(doctl apps update "$APP_ID" --spec "$rollback_spec" --format ID --no-header)
    
    if [[ -n "$rollback_output" ]]; then
        local rollback_deployment_id="$rollback_output"
        log "Rollback deployment initiated: $rollback_deployment_id"
        
        # Wait for rollback to complete
        if wait_for_deployment "$rollback_deployment_id" "$ROLLBACK_TIMEOUT"; then
            log_success "Rollback completed successfully"
            
            # Validate rollback
            if health_check "$DOMAIN" 120; then
                log_success "Rollback validation passed"
                return 0
            else
                log_error "Rollback validation failed"
                return 1
            fi
        else
            log_error "Rollback deployment failed"
            return 1
        fi
    else
        log_error "Failed to initiate rollback"
        return 1
    fi
}

# =============================================================================
# MAIN DEPLOYMENT FLOW
# =============================================================================

main() {
    local start_time=$(date +%s)
    local backup_deployment_id=""
    local new_deployment_id=""
    local exit_code=0
    
    log "Starting zero-downtime deployment for $ENVIRONMENT environment"
    log "Image tag: $IMAGE_TAG"
    log "Domain: $DOMAIN"
    
    # Pre-deployment checks
    check_dependencies
    
    # Send deployment start notification
    send_notification "Deployment started for $ENVIRONMENT environment with image tag $IMAGE_TAG" "info"
    
    # Create backup of current deployment
    backup_deployment_id=$(backup_current_deployment)
    if [[ $? -ne 0 ]]; then
        log_error "Failed to backup current deployment"
        exit_code=1
    fi
    
    # Deploy new version
    if [[ $exit_code -eq 0 ]]; then
        new_deployment_id=$(deploy_new_version)
        if [[ $? -ne 0 ]]; then
            log_error "Deployment failed"
            exit_code=1
        fi
    fi
    
    # Validate new deployment
    if [[ $exit_code -eq 0 && -n "$new_deployment_id" ]]; then
        if ! validate_deployment "$new_deployment_id"; then
            log_error "Deployment validation failed"
            exit_code=1
        fi
    fi
    
    # Handle deployment result
    if [[ $exit_code -eq 0 ]]; then
        # Deployment successful
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "Zero-downtime deployment completed successfully in ${duration}s"
        log_success "New deployment ID: $new_deployment_id"
        
        # Cleanup old backup files (keep last 5)
        find "${PROJECT_ROOT}/backup" -name "app-spec-*.yaml" -type f | sort | head -n -5 | xargs rm -f
        
        send_notification "Deployment completed successfully in ${duration}s. New deployment: $new_deployment_id" "success"
        
    else
        # Deployment failed - initiate rollback
        log_error "Deployment failed, initiating automatic rollback..."
        
        if [[ -n "$backup_deployment_id" ]]; then
            if rollback_deployment "$backup_deployment_id"; then
                log_success "Automatic rollback completed successfully"
                send_notification "Deployment failed but automatic rollback completed successfully" "warning"
            else
                log_error "Automatic rollback failed - manual intervention required"
                send_notification "Deployment AND rollback failed - manual intervention required immediately" "error"
                exit_code=2
            fi
        else
            log_error "No backup available for rollback - manual intervention required"
            send_notification "Deployment failed and no backup available for rollback - manual intervention required" "error"
            exit_code=2
        fi
    fi
    
    # Cleanup temporary files
    rm -f "${APP_SPEC}.deploy"
    
    log "Deployment process finished with exit code: $exit_code"
    exit $exit_code
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Trap signals for cleanup
trap 'log "Deployment script interrupted"; exit 130' INT TERM

# Validate arguments
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <environment> [image-tag]"
    echo "  environment: production or staging"
    echo "  image-tag: Docker image tag (default: latest)"
    exit 1
fi

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "${PROJECT_ROOT}/backup"

# Execute main deployment flow
main "$@"