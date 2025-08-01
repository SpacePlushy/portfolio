#!/bin/bash

# =============================================================================
# ROLLBACK SCRIPT
# =============================================================================
# Emergency rollback script for Digital Ocean App Platform deployments
# Usage: ./rollback.sh [production|staging] [deployment-id|previous|auto]

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="${LOG_FILE:-/var/log/portfolio-rollback.log}"

# Rollback configuration
ENVIRONMENT="${1:-production}"
ROLLBACK_TARGET="${2:-auto}"
ROLLBACK_TIMEOUT=600     # 10 minutes
HEALTH_CHECK_TIMEOUT=300 # 5 minutes

# Digital Ocean configuration
case "$ENVIRONMENT" in
    production)
        APP_ID="${DO_PRODUCTION_APP_ID}"
        DOMAIN="${PRODUCTION_URL:-https://frankpalmisano.com}"
        ;;
    staging)
        APP_ID="${DO_STAGING_APP_ID}"
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
    log "Checking rollback dependencies..."
    
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
    
    log_success "All dependencies check passed"
}

get_deployment_list() {
    log "Getting deployment history..."
    
    doctl apps list-deployments "$APP_ID" --format ID,Phase,CreatedAt,UpdatedAt --no-header | head -10
}

get_current_deployment() {
    log "Getting current deployment..."
    
    local current_deployment
    current_deployment=$(doctl apps list-deployments "$APP_ID" --format ID,Phase --no-header | grep ACTIVE | head -1)
    
    if [[ -n "$current_deployment" ]]; then
        echo "$current_deployment" | awk '{print $1}'
    else
        log_error "No active deployment found"
        return 1
    fi
}

get_previous_deployment() {
    log "Getting previous successful deployment..."
    
    # Get deployments, skip the current one, find the first successful one
    local previous_deployment
    previous_deployment=$(doctl apps list-deployments "$APP_ID" --format ID,Phase --no-header | grep -v ACTIVE | grep -E "(SUPERSEDED)" | head -1)
    
    if [[ -n "$previous_deployment" ]]; then
        echo "$previous_deployment" | awk '{print $1}'
    else
        log_error "No previous deployment found"
        return 1
    fi
}

wait_for_rollback() {
    local deployment_id="$1"
    local timeout="${2:-$ROLLBACK_TIMEOUT}"
    local start_time=$(date +%s)
    
    log "Waiting for rollback to deployment $deployment_id (timeout: ${timeout}s)..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            log_error "Rollback timeout after ${timeout}s"
            return 1
        fi
        
        local deployment_info
        deployment_info=$(doctl apps get-deployment "$APP_ID" "$deployment_id" --format Phase,Progress --no-header)
        local phase=$(echo "$deployment_info" | awk '{print $1}')
        local progress=$(echo "$deployment_info" | awk '{print $2}')
        
        log "Rollback status: $phase ($progress)"
        
        case "$phase" in
            ACTIVE)
                log_success "Rollback completed successfully"
                return 0
                ;;
            ERROR|CANCELED)
                log_error "Rollback failed with status: $phase"
                return 1
                ;;
            PENDING_BUILD|PENDING_DEPLOY|BUILDING|DEPLOYING)
                sleep 15
                ;;
            *)
                log_warning "Unknown rollback phase: $phase"
                sleep 15
                ;;
        esac
    done
}

health_check_after_rollback() {
    local url="$1"
    local timeout="${2:-$HEALTH_CHECK_TIMEOUT}"
    local start_time=$(date +%s)
    
    log "Performing post-rollback health check on $url..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            log_error "Post-rollback health check timeout after ${timeout}s"
            return 1
        fi
        
        # Check main health endpoint
        if curl -f -s --max-time 10 "$url/api/health" > /dev/null 2>&1; then
            log "Main health check passed"
            
            # Check image service health
            if curl -f -s --max-time 10 "$url/api/image/health" > /dev/null 2>&1; then
                log_success "All post-rollback health checks passed"
                return 0
            else
                log "Image service health check failed, retrying..."
            fi
        else
            log "Main health check failed, retrying..."
        fi
        
        sleep 10
    done
}

send_rollback_notification() {
    local message="$1"
    local status="${2:-info}"
    local rollback_id="${3:-unknown}"
    
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
                \"text\": \"🔄 Rollback ${status}\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [{
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    }, {
                        \"title\": \"Rollback ID\",
                        \"value\": \"$rollback_id\",
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
        echo "$message" | mail -s "Rollback $status: $ENVIRONMENT" "$NOTIFICATION_EMAIL" || true
    fi
}

# =============================================================================
# ROLLBACK FUNCTIONS
# =============================================================================

show_deployment_history() {
    log "Deployment History for $ENVIRONMENT:"
    echo "=================================="
    echo "ID                                   Phase      Created                Updated"
    echo "=================================="
    get_deployment_list
    echo "=================================="
}

confirm_rollback() {
    local target_deployment="$1"
    local current_deployment="$2"
    
    echo ""
    log_warning "ROLLBACK CONFIRMATION REQUIRED"
    echo "=================================="
    echo "Environment: $ENVIRONMENT"
    echo "Current Deployment: $current_deployment"
    echo "Target Deployment:  $target_deployment"
    echo "Domain: $DOMAIN"
    echo "=================================="
    echo ""
    
    if [[ "${FORCE_ROLLBACK:-false}" == "true" ]]; then
        log "Force rollback enabled, skipping confirmation"
        return 0
    fi
    
    read -p "Are you sure you want to proceed with this rollback? (type 'yes' to confirm): " confirmation
    
    if [[ "$confirmation" != "yes" ]]; then
        log "Rollback cancelled by user"
        exit 0
    fi
    
    log "Rollback confirmed by user"
}

determine_rollback_target() {
    local current_deployment
    current_deployment=$(get_current_deployment)
    
    case "$ROLLBACK_TARGET" in
        auto)
            log "Auto-determining rollback target..."
            
            # Try to get from backup metadata first
            if [[ -f "${PROJECT_ROOT}/backup/deployment-metadata.env" ]]; then
                source "${PROJECT_ROOT}/backup/deployment-metadata.env"
                if [[ -n "${BACKUP_DEPLOYMENT_ID:-}" ]]; then
                    log "Using backup deployment ID: $BACKUP_DEPLOYMENT_ID"
                    echo "$BACKUP_DEPLOYMENT_ID"
                    return 0
                fi
            fi
            
            # Fall back to previous deployment
            get_previous_deployment
            ;;
        previous)
            log "Rolling back to previous deployment..."
            get_previous_deployment
            ;;
        *)
            # Assume it's a specific deployment ID
            log "Rolling back to specific deployment: $ROLLBACK_TARGET"
            
            # Validate deployment ID exists
            if doctl apps get-deployment "$APP_ID" "$ROLLBACK_TARGET" > /dev/null 2>&1; then
                echo "$ROLLBACK_TARGET"
            else
                log_error "Deployment ID not found: $ROLLBACK_TARGET"
                return 1
            fi
            ;;
    esac
}

create_rollback_backup() {
    local current_deployment="$1"
    
    log "Creating rollback backup..."
    
    # Create rollback backup directory
    local rollback_backup_dir="${PROJECT_ROOT}/backup/rollback-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$rollback_backup_dir"
    
    # Export current app configuration
    doctl apps spec get "$APP_ID" > "${rollback_backup_dir}/pre-rollback-app-spec.yaml"
    
    # Store rollback metadata
    cat > "${rollback_backup_dir}/rollback-metadata.env" << EOF
ROLLBACK_TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
ROLLBACK_ENVIRONMENT=$ENVIRONMENT
PRE_ROLLBACK_DEPLOYMENT_ID=$current_deployment
ROLLBACK_TARGET_ID=$ROLLBACK_TARGET
ROLLBACK_INITIATED_BY=${USER:-system}
ROLLBACK_REASON=${ROLLBACK_REASON:-manual}
EOF
    
    log_success "Rollback backup created in: $rollback_backup_dir"
}

execute_rollback() {
    local target_deployment="$1"
    
    log "Executing rollback to deployment: $target_deployment..."
    
    # Check if we have a backup app spec for this deployment
    local rollback_spec=""
    if [[ -f "${PROJECT_ROOT}/backup/app-spec-${target_deployment}.yaml" ]]; then
        rollback_spec="${PROJECT_ROOT}/backup/app-spec-${target_deployment}.yaml"
        log "Using backup app spec for rollback"
    else
        log_warning "No backup app spec found, using current spec"
        rollback_spec="${PROJECT_ROOT}/.do/app.yaml"
        if [[ "$ENVIRONMENT" == "staging" ]]; then
            rollback_spec="${PROJECT_ROOT}/.do/app.staging.yaml"
        fi
    fi
    
    # Initiate rollback deployment
    local rollback_deployment_output
    rollback_deployment_output=$(doctl apps update "$APP_ID" --spec "$rollback_spec" --format ID --no-header 2>&1)
    
    if [[ $? -eq 0 && -n "$rollback_deployment_output" ]]; then
        local rollback_deployment_id="$rollback_deployment_output"
        log_success "Rollback deployment initiated: $rollback_deployment_id"
        
        # Send notification
        send_rollback_notification "Rollback initiated to deployment $target_deployment" "info" "$rollback_deployment_id"
        
        # Wait for rollback to complete
        if wait_for_rollback "$rollback_deployment_id"; then
            log_success "Rollback deployment completed"
            echo "$rollback_deployment_id"
        else
            log_error "Rollback deployment failed"
            return 1
        fi
    else
        log_error "Failed to initiate rollback: $rollback_deployment_output"
        return 1
    fi
}

validate_rollback() {
    local rollback_deployment_id="$1"
    
    log "Validating rollback deployment: $rollback_deployment_id..."
    
    # Wait for services to stabilize
    sleep 30
    
    # Perform health checks
    if health_check_after_rollback "$DOMAIN"; then
        log_success "Post-rollback health checks passed"
    else
        log_error "Post-rollback health checks failed"
        return 1
    fi
    
    # Basic functionality test
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN" || echo "000")
    
    if [[ "$response_code" == "200" ]]; then
        log_success "Website is responding correctly (HTTP $response_code)"
    else
        log_error "Website not responding correctly (HTTP $response_code)"
        return 1
    fi
    
    log_success "Rollback validation completed successfully"
    return 0
}

# =============================================================================
# MAIN ROLLBACK FLOW
# =============================================================================

main() {
    local start_time=$(date +%s)
    local exit_code=0
    
    log "Starting rollback process for $ENVIRONMENT environment"
    log "Rollback target: $ROLLBACK_TARGET"
    
    # Pre-rollback checks
    check_dependencies
    
    # Show deployment history for context
    if [[ "${SHOW_HISTORY:-true}" == "true" ]]; then
        show_deployment_history
    fi
    
    # Get current deployment
    local current_deployment
    current_deployment=$(get_current_deployment)
    if [[ $? -ne 0 ]]; then
        log_error "Could not determine current deployment"
        exit 1
    fi
    
    log "Current deployment: $current_deployment"
    
    # Determine rollback target
    local target_deployment
    target_deployment=$(determine_rollback_target)
    if [[ $? -ne 0 || -z "$target_deployment" ]]; then
        log_error "Could not determine rollback target"
        exit 1
    fi
    
    log "Rollback target: $target_deployment"
    
    # Check if we're already on the target deployment
    if [[ "$current_deployment" == "$target_deployment" ]]; then
        log_warning "Already on target deployment $target_deployment"
        exit 0
    fi
    
    # Confirm rollback
    confirm_rollback "$target_deployment" "$current_deployment"
    
    # Create rollback backup
    create_rollback_backup "$current_deployment"
    
    # Send rollback start notification
    send_rollback_notification "Rollback started from $current_deployment to $target_deployment" "info" "$target_deployment"
    
    # Execute rollback
    local rollback_deployment_id
    rollback_deployment_id=$(execute_rollback "$target_deployment")
    if [[ $? -ne 0 ]]; then
        log_error "Rollback execution failed"
        exit_code=1
    fi
    
    # Validate rollback
    if [[ $exit_code -eq 0 && -n "$rollback_deployment_id" ]]; then
        if validate_rollback "$rollback_deployment_id"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            log_success "Rollback completed successfully in ${duration}s"
            log_success "Rollback deployment ID: $rollback_deployment_id"
            
            send_rollback_notification "Rollback completed successfully in ${duration}s to deployment $target_deployment" "success" "$rollback_deployment_id"
        else
            log_error "Rollback validation failed"
            send_rollback_notification "Rollback completed but validation failed - manual check required" "warning" "$rollback_deployment_id"
            exit_code=1
        fi
    else
        log_error "Rollback failed"
        send_rollback_notification "Rollback failed - manual intervention required" "error" "unknown"
        exit_code=1
    fi
    
    log "Rollback process finished with exit code: $exit_code"
    exit $exit_code
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Trap signals for cleanup
trap 'log "Rollback script interrupted"; exit 130' INT TERM

# Show usage if no arguments
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <environment> [rollback-target]"
    echo ""
    echo "Arguments:"
    echo "  environment     : production or staging"
    echo "  rollback-target : deployment-id, 'previous', or 'auto' (default: auto)"
    echo ""
    echo "Examples:"
    echo "  $0 production                    # Auto-rollback to previous deployment"
    echo "  $0 production previous           # Rollback to previous deployment"
    echo "  $0 production abc123def456       # Rollback to specific deployment"
    echo ""
    echo "Environment Variables:"
    echo "  FORCE_ROLLBACK=true             # Skip confirmation prompt"
    echo "  SHOW_HISTORY=false              # Skip deployment history display"
    echo "  ROLLBACK_REASON='reason'        # Reason for rollback (for logging)"
    exit 1
fi

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "${PROJECT_ROOT}/backup"

# Execute main rollback flow
main "$@"