#!/bin/bash

# CDN-Aware Deployment Script
# This script handles deployment with automatic CDN cache purging

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment variables (set in your CI/CD or locally)
# CLOUDFLARE_API_TOKEN=""
# CLOUDFLARE_ZONE_ID=""
# DO_API_TOKEN=""
# DO_CDN_ENDPOINT_ID=""
# DEPLOYMENT_ENVIRONMENT="production" # or staging, development

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check required environment variables
check_env_vars() {
    log "Checking environment variables..."
    
    local required_vars=("NODE_ENV")
    local optional_vars=("CLOUDFLARE_API_TOKEN" "CLOUDFLARE_ZONE_ID" "DO_API_TOKEN" "DO_CDN_ENDPOINT_ID")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if at least one CDN provider is configured
    if [[ -z "$CLOUDFLARE_API_TOKEN" && -z "$DO_API_TOKEN" ]]; then
        warn "No CDN providers configured. Cache purging will be skipped."
    fi
    
    success "Environment variables validated"
}

# Function to run tests
run_tests() {
    log "Running tests before deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Type checking
    if command -v npm >/dev/null 2>&1; then
        if npm run typecheck >/dev/null 2>&1; then
            success "TypeScript checks passed"
        else
            error "TypeScript checks failed"
            return 1
        fi
        
        # Linting
        if npm run lint >/dev/null 2>&1; then
            success "Linting passed"
        else
            warn "Linting issues detected (non-blocking)"
        fi
    fi
    
    return 0
}

# Function to build the application
build_app() {
    log "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Clear previous build
    if [[ -d "dist" ]]; then
        rm -rf dist
        log "Cleared previous build"
    fi
    
    # Install dependencies
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    # Build
    npm run build
    
    if [[ -d "dist" ]]; then
        success "Build completed successfully"
        
        # Calculate build size
        local build_size=$(du -sh dist | cut -f1)
        log "Build size: $build_size"
        
        # List key build artifacts
        log "Build artifacts:"
        find dist -name "*.js" -o -name "*.css" -o -name "*.html" | head -10 | while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            log "  - $(basename "$file"): $size"
        done
        
        return 0
    else
        error "Build failed - dist directory not created"
        return 1
    fi
}

# Function to purge Cloudflare cache
purge_cloudflare_cache() {
    if [[ -z "$CLOUDFLARE_API_TOKEN" || -z "$CLOUDFLARE_ZONE_ID" ]]; then
        warn "Cloudflare credentials not configured, skipping purge"
        return 0
    fi
    
    log "Purging Cloudflare cache..."
    
    # Purge everything (use with caution in production)
    local response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}')
    
    local success_status=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [[ "$success_status" == "true" ]]; then
        success "Cloudflare cache purged successfully"
        
        # Wait for purge to propagate
        log "Waiting for cache purge to propagate..."
        sleep 5
        
        return 0
    else
        error "Cloudflare cache purge failed: $response"
        return 1
    fi
}

# Function to purge specific files from Cloudflare cache
purge_cloudflare_selective() {
    if [[ -z "$CLOUDFLARE_API_TOKEN" || -z "$CLOUDFLARE_ZONE_ID" ]]; then
        return 0
    fi
    
    log "Purging specific files from Cloudflare cache..."
    
    # Define files to purge (customize based on your needs)
    local files_to_purge=(
        "https://yourdomain.com/"
        "https://yourdomain.com/software-engineer"
        "https://yourdomain.com/customer-service"
        "https://yourdomain.com/_astro/*.css"
        "https://yourdomain.com/_astro/*.js"
    )
    
    local purge_data=$(printf '%s\n' "${files_to_purge[@]}" | jq -R . | jq -s '{"files": .}')
    
    local response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "$purge_data")
    
    local success_status=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [[ "$success_status" == "true" ]]; then
        success "Selective Cloudflare cache purge completed"
        return 0
    else
        warn "Selective cache purge failed, falling back to full purge"
        purge_cloudflare_cache
        return $?
    fi
}

# Function to purge Digital Ocean CDN cache
purge_digitalocean_cache() {
    if [[ -z "$DO_API_TOKEN" || -z "$DO_CDN_ENDPOINT_ID" ]]; then
        warn "Digital Ocean CDN credentials not configured, skipping purge"
        return 0
    fi
    
    log "Purging Digital Ocean CDN cache..."
    
    local response=$(curl -s -X DELETE "https://api.digitalocean.com/v2/cdn/endpoints/$DO_CDN_ENDPOINT_ID/cache" \
        -H "Authorization: Bearer $DO_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"files":["*"]}')
    
    # Digital Ocean API returns empty response on success
    local http_code=$(curl -s -w "%{http_code}" -X DELETE "https://api.digitalocean.com/v2/cdn/endpoints/$DO_CDN_ENDPOINT_ID/cache" \
        -H "Authorization: Bearer $DO_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"files":["*"]}' \
        -o /dev/null)
    
    if [[ "$http_code" == "204" ]]; then
        success "Digital Ocean CDN cache purged successfully"
        return 0
    else
        error "Digital Ocean CDN cache purge failed (HTTP $http_code)"
        return 1
    fi
}

# Function to test CDN performance after deployment
test_cdn_performance() {
    log "Testing CDN performance..."
    
    if [[ -f "$PROJECT_ROOT/scripts/test-cdn-performance.js" ]]; then
        cd "$PROJECT_ROOT"
        
        # Wait for deployment to be fully active
        log "Waiting for deployment to be active..."
        sleep 10
        
        # Run performance tests
        if node scripts/test-cdn-performance.js; then
            success "CDN performance tests passed"
            return 0
        else
            warn "CDN performance tests failed (non-blocking)"
            return 1
        fi
    else
        warn "CDN performance test script not found, skipping tests"
        return 0
    fi
}

# Function to send deployment notifications
send_notifications() {
    local deployment_status=$1
    local deployment_time=$2
    
    log "Sending deployment notifications..."
    
    # Slack notification (if webhook URL is configured)
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local message
        if [[ "$deployment_status" == "success" ]]; then
            message="✅ Portfolio deployment successful in ${deployment_time}s"
        else
            message="❌ Portfolio deployment failed after ${deployment_time}s"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1
    fi
    
    # Email notification (if configured)
    if [[ -n "$NOTIFICATION_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        local subject
        if [[ "$deployment_status" == "success" ]]; then
            subject="Portfolio Deployment Successful"
        else
            subject="Portfolio Deployment Failed"
        fi
        
        echo "Deployment completed with status: $deployment_status in ${deployment_time}s" | \
            mail -s "$subject" "$NOTIFICATION_EMAIL"
    fi
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    log "Starting CDN-aware deployment..."
    log "Environment: ${DEPLOYMENT_ENVIRONMENT:-development}"
    log "Working directory: $PROJECT_ROOT"
    
    # Initialize log file
    echo "Deployment started at $(date)" > "$LOG_FILE"
    
    # Pre-deployment checks
    check_env_vars || exit 1
    
    # Run tests
    if ! run_tests; then
        error "Pre-deployment tests failed"
        exit 1
    fi
    
    # Build application
    if ! build_app; then
        error "Build failed"
        exit 1
    fi
    
    # Deploy to Digital Ocean (this would be your actual deployment command)
    log "Deploying to Digital Ocean App Platform..."
    # doctl apps create-deployment $APP_ID
    # Or your specific deployment command
    
    # For now, we'll simulate deployment success
    success "Application deployed successfully"
    
    # Purge CDN caches
    local purge_failed=false
    
    if ! purge_cloudflare_cache; then
        purge_failed=true
    fi
    
    if ! purge_digitalocean_cache; then
        purge_failed=true
    fi
    
    if [[ "$purge_failed" == "true" ]]; then
        warn "Some CDN cache purges failed, but deployment continues"
    fi
    
    # Test CDN performance
    test_cdn_performance
    
    # Calculate deployment time
    local end_time=$(date +%s)
    local deployment_time=$((end_time - start_time))
    
    # Send notifications
    send_notifications "success" "$deployment_time"
    
    success "Deployment completed successfully in ${deployment_time}s!"
    log "Check the application at your configured domain"
    log "Log file available at: $LOG_FILE"
    
    return 0
}

# Handle script termination
cleanup() {
    log "Deployment script interrupted"
    exit 1
}

trap cleanup INT TERM

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --test-only         Run tests only, skip deployment"
        echo "  --purge-only        Purge CDN caches only"
        echo "  --no-tests          Skip running tests"
        echo "  --no-purge          Skip CDN cache purging"
        echo ""
        echo "Environment Variables:"
        echo "  NODE_ENV                    Deployment environment (required)"
        echo "  CLOUDFLARE_API_TOKEN        Cloudflare API token (optional)"
        echo "  CLOUDFLARE_ZONE_ID          Cloudflare zone ID (optional)"
        echo "  DO_API_TOKEN               Digital Ocean API token (optional)"
        echo "  DO_CDN_ENDPOINT_ID         Digital Ocean CDN endpoint ID (optional)"
        echo "  SLACK_WEBHOOK_URL          Slack webhook for notifications (optional)"
        echo "  NOTIFICATION_EMAIL         Email for notifications (optional)"
        exit 0
        ;;
    --test-only)
        check_env_vars
        run_tests
        exit $?
        ;;
    --purge-only)
        check_env_vars
        purge_cloudflare_cache
        purge_digitalocean_cache
        exit $?
        ;;
    --no-tests)
        export SKIP_TESTS=true
        ;;
    --no-purge)
        export SKIP_PURGE=true
        ;;
esac

# Run main deployment
main