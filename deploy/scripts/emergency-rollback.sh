#!/bin/bash

# =============================================================================
# EMERGENCY ROLLBACK SCRIPT
# =============================================================================
# Fast rollback script for critical production issues
# Usage: ./emergency-rollback.sh [production|staging] [deployment-id]

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="${LOG_FILE:-/var/log/portfolio-emergency-rollback.log}"

# Emergency rollback configuration
ENVIRONMENT="${1:-production}"
ROLLBACK_DEPLOYMENT_ID="${2:-}"
EMERGENCY_TIMEOUT=300  # 5 minutes maximum
HEALTH_CHECK_TIMEOUT=120  # 2 minutes for health validation

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
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] EMERGENCY: $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] EMERGENCY ERROR: $*" | tee -a "$LOG_FILE" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] EMERGENCY SUCCESS: $*" | tee -a "$LOG_FILE"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

check_emergency_dependencies() {
    log "Checking emergency rollback dependencies..."
    
    # Check if doctl is available
    if ! command -v doctl > /dev/null 2>&1; then
        log_error "doctl CLI not found"
        exit 1
    fi
    
    # Quick auth check
    if ! doctl account get > /dev/null 2>&1; then
        log_error "doctl not authenticated"
        exit 1
    fi
    
    # Check required environment variables
    if [[ -z "${APP_ID:-}" ]]; then
        log_error "App ID not configured for environment: $ENVIRONMENT"
        exit 1
    fi
    
    log_success "Emergency dependencies validated"
}

get_rollback_target() {
    log "Determining rollback target..."
    
    if [[ -n "$ROLLBACK_DEPLOYMENT_ID" ]]; then
        echo "$ROLLBACK_DEPLOYMENT_ID"
        return 0
    fi
    
    # Try to find the last stable deployment
    local deployments
    deployments=$(doctl apps list-deployments "$APP_ID" --format ID,Phase,CreatedAt --no-header | grep ACTIVE || true)
    
    if [[ -n "$deployments" ]]; then
        # Get the second most recent ACTIVE deployment (current should be first)
        local rollback_id
        rollback_id=$(echo "$deployments" | sed -n '2p' | awk '{print $1}')
        
        if [[ -n "$rollback_id" ]]; then
            log "Found rollback target: $rollback_id"
            echo "$rollback_id"
            return 0
        fi
    fi
    
    # Fallback: use backup spec if available
    local backup_spec
    backup_spec=$(find "${PROJECT_ROOT}/backup" -name "app-spec-*.yaml" -type f | sort -r | head -1 2>/dev/null || true)
    
    if [[ -n "$backup_spec" ]]; then
        log "Using backup spec: $backup_spec"
        echo "backup:$backup_spec"
        return 0
    fi
    
    log_error "No rollback target found"
    return 1
}

disable_problematic_features() {
    log "Disabling potentially problematic features..."
    
    # Create emergency app spec with features disabled
    local emergency_spec="${PROJECT_ROOT}/emergency-app.yaml"
    
    if [[ -f "${PROJECT_ROOT}/.do/app.yaml" ]]; then
        cp "${PROJECT_ROOT}/.do/app.yaml" "$emergency_spec"
        
        # Disable monitoring and new features
        sed -i.bak 's/ENABLE_MONITORING.*value: "true"/ENABLE_MONITORING\n        value: "false"/' "$emergency_spec"
        sed -i.bak 's/ENABLE_PROMETHEUS_METRICS.*value: "true"/ENABLE_PROMETHEUS_METRICS\n        value: "false"/' "$emergency_spec"
        sed -i.bak 's/FEATURE_.*value: "true"/FEATURE_ENHANCED_MONITORING\n        value: "false"/' "$emergency_spec"
        
        # Reduce resource requirements
        sed -i.bak 's/instance_size_slug: basic-s/instance_size_slug: basic-xxs/' "$emergency_spec"
        sed -i.bak 's/initial_delay_seconds: 30/initial_delay_seconds: 60/' "$emergency_spec"
        sed -i.bak 's/period_seconds: 15/period_seconds: 30/' "$emergency_spec"
        
        rm -f "${emergency_spec}.bak"
        
        log "Emergency configuration created"
        echo "$emergency_spec"
    else
        log_error "Base app spec not found"
        return 1
    fi
}

execute_emergency_rollback() {
    local rollback_target="$1"
    
    log "Executing emergency rollback to: $rollback_target"
    
    local rollback_spec
    local deployment_output
    
    if [[ "$rollback_target" == backup:* ]]; then
        # Using backup spec
        rollback_spec="${rollback_target#backup:}"
        log "Rolling back using backup spec: $rollback_spec"
    else
        # Create emergency spec with disabled features
        rollback_spec=$(disable_problematic_features)
        log "Rolling back using emergency spec with disabled features"
    fi
    
    # Validate the spec quickly
    if ! doctl apps spec validate "$rollback_spec" > /dev/null 2>&1; then
        log_error "Rollback spec validation failed"
        return 1
    fi
    
    # Execute rollback deployment
    deployment_output=$(doctl apps update "$APP_ID" --spec "$rollback_spec" --format ID --no-header 2>&1)
    
    if [[ -n "$deployment_output" ]] && [[ "$deployment_output" != *"error"* ]]; then
        local rollback_deployment_id="$deployment_output"
        log_success "Emergency rollback initiated: $rollback_deployment_id"
        
        # Wait for rollback with emergency timeout
        if wait_for_emergency_deployment "$rollback_deployment_id"; then
            log_success "Emergency rollback deployment completed"
            return 0
        else
            log_error "Emergency rollback deployment failed or timed out"
            return 1
        fi
    else
        log_error "Failed to initiate emergency rollback: $deployment_output"
        return 1
    fi
}

wait_for_emergency_deployment() {
    local deployment_id="$1"
    local start_time=$(date +%s)
    
    log "Waiting for emergency deployment: $deployment_id (timeout: ${EMERGENCY_TIMEOUT}s)"
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $EMERGENCY_TIMEOUT ]]; then
            log_error "Emergency deployment timeout after ${EMERGENCY_TIMEOUT}s"
            return 1
        fi
        
        local deployment_info
        deployment_info=$(doctl apps get-deployment "$APP_ID" "$deployment_id" --format Phase --no-header 2>&1 || echo "ERROR")
        
        log "Emergency deployment status: $deployment_info (${elapsed}s elapsed)"
        
        case "$deployment_info" in
            ACTIVE)
                log_success "Emergency deployment completed"
                return 0
                ;;
            ERROR|CANCELED|SUPERSEDED)
                log_error "Emergency deployment failed: $deployment_info"
                return 1
                ;;
            PENDING_BUILD|PENDING_DEPLOY|BUILDING|DEPLOYING)
                sleep 10  # Shorter sleep for emergency
                ;;
            *)
                log "Unknown deployment phase: $deployment_info"
                sleep 10
                ;;
        esac
    done
}

emergency_health_check() {
    local url="$1"
    local start_time=$(date +%s)
    
    log "Running emergency health check on $url (timeout: ${HEALTH_CHECK_TIMEOUT}s)"
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $HEALTH_CHECK_TIMEOUT ]]; then
            log_error "Emergency health check timeout"
            return 1
        fi
        
        # Try basic connectivity first
        if curl -f -s --max-time 5 "$url" > /dev/null 2>&1; then
            log "Basic connectivity check passed"
            
            # Try health endpoint
            if curl -f -s --max-time 10 "$url/api/health" > /dev/null 2>&1; then
                log_success "Health endpoint responding"
                return 0
            elif curl -f -s --max-time 5 "$url/api/readiness" > /dev/null 2>&1; then
                log_success "Readiness endpoint responding"
                return 0
            else
                log "Health endpoints not responding yet, but basic connectivity OK"
            fi
        else
            log "Basic connectivity check failed, retrying..."
        fi
        
        sleep 5
    done
}

send_emergency_notification() {
    local status="$1"
    local message="$2"
    
    # Send Slack notification if configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🚨 EMERGENCY ROLLBACK $status\",
                \"attachments\": [{
                    \"color\": \"danger\",
                    \"fields\": [{
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    }, {
                        \"title\": \"Status\",
                        \"value\": \"$status\",
                        \"short\": true
                    }, {
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date)\",
                        \"short\": false
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
    
    # Log for monitoring systems
    log "EMERGENCY_NOTIFICATION: $status - $message"
}

# =============================================================================
# MAIN EMERGENCY ROLLBACK FUNCTION
# =============================================================================

main() {
    local start_time=$(date +%s)
    local exit_code=0
    
    log "🚨 EMERGENCY ROLLBACK INITIATED for $ENVIRONMENT environment"
    log "Timestamp: $(date)"
    log "Executed by: ${USER:-unknown}"
    
    # Send initial notification
    send_emergency_notification "STARTED" "Emergency rollback initiated for $ENVIRONMENT"
    
    # Quick dependency check
    check_emergency_dependencies
    
    # Find rollback target
    local rollback_target
    rollback_target=$(get_rollback_target)
    if [[ $? -ne 0 ]]; then
        log_error "Could not determine rollback target"
        send_emergency_notification "FAILED" "Could not determine rollback target"
        exit 1
    fi
    
    # Execute emergency rollback
    if execute_emergency_rollback "$rollback_target"; then
        log_success "Emergency rollback deployment successful"
        
        # Validate the rollback
        log "Validating emergency rollback..."
        sleep 30  # Brief stabilization period
        
        if emergency_health_check "$DOMAIN"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            log_success "Emergency rollback completed successfully in ${duration}s"
            send_emergency_notification "COMPLETED" "Emergency rollback successful in ${duration}s"
            
            # Log recovery information
            log "🔄 RECOVERY INFORMATION:"
            log "  Environment: $ENVIRONMENT"
            log "  Rollback Target: $rollback_target"
            log "  Duration: ${duration}s"
            log "  Domain: $DOMAIN"
            log "  Status: OPERATIONAL"
            
        else
            log_error "Emergency rollback completed but health checks are failing"
            send_emergency_notification "PARTIAL" "Rollback deployed but health checks failing - manual intervention needed"
            exit_code=1
        fi
        
    else
        log_error "Emergency rollback deployment failed"
        send_emergency_notification "FAILED" "Emergency rollback deployment failed - immediate manual intervention required"
        exit_code=2
    fi
    
    # Cleanup emergency files
    rm -f "${PROJECT_ROOT}/emergency-app.yaml"
    
    log "Emergency rollback process completed with exit code: $exit_code"
    
    if [[ $exit_code -eq 0 ]]; then
        log "📋 NEXT STEPS:"
        log "1. Monitor application health and performance"
        log "2. Investigate root cause of the issue"
        log "3. Plan proper fix and controlled redeployment"
        log "4. Update incident documentation"
    else
        log "🚨 MANUAL INTERVENTION REQUIRED:"
        log "1. Check Digital Ocean App Platform console"
        log "2. Review application logs for errors"
        log "3. Consider manual app configuration"
        log "4. Escalate to senior engineering team"
    fi
    
    exit $exit_code
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Trap signals for cleanup
trap 'log "Emergency rollback script interrupted"; exit 130' INT TERM

# Validate arguments
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <environment> [deployment-id]"
    echo "  environment: production or staging"
    echo "  deployment-id: specific deployment to rollback to (optional)"
    echo ""
    echo "⚠️  WARNING: This is an EMERGENCY rollback script"
    echo "    Only use when immediate rollback is required"
    echo "    For planned rollbacks, use zero-downtime-deploy.sh"
    exit 1
fi

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "${PROJECT_ROOT}/backup"

# Execute emergency rollback
main "$@"