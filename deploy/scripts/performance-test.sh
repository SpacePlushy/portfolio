#!/bin/bash

# =============================================================================
# PERFORMANCE TESTING SCRIPT
# =============================================================================
# Comprehensive performance testing for the image optimization system
# Usage: ./performance-test.sh [environment] [test-type] [duration]

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="${LOG_FILE:-/var/log/portfolio-perf-test.log}"

# Test configuration
ENVIRONMENT="${1:-staging}"
TEST_TYPE="${2:-baseline}"
DURATION="${3:-300}"  # 5 minutes default

# Test URLs
case "$ENVIRONMENT" in
    production)
        BASE_URL="https://frankpalmisano.com"
        ;;
    staging)
        BASE_URL="https://portfolio-staging.ondigitalocean.app"
        ;;
    local)
        BASE_URL="http://localhost:4321"
        ;;
    *)
        echo "ERROR: Invalid environment. Use 'production', 'staging', or 'local'"
        exit 1
        ;;
esac

# Test configuration
TEST_RESULTS_DIR="${PROJECT_ROOT}/test-results/performance"
TEST_IMAGES_DIR="${PROJECT_ROOT}/test-images"
CONCURRENT_USERS=50
RAMP_UP_TIME=60

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

check_dependencies() {
    log "Checking performance testing dependencies..."
    
    local required_tools=("curl" "jq" "bc")
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" > /dev/null 2>&1; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check if k6 is available for load testing
    if command -v k6 > /dev/null 2>&1; then
        log "k6 load testing tool found"
        K6_AVAILABLE=true
    else
        log "k6 not found, will use alternative methods"
        K6_AVAILABLE=false
    fi
    
    # Check if Apache Bench is available
    if command -v ab > /dev/null 2>&1; then
        log "Apache Bench (ab) found"
        AB_AVAILABLE=true
    else
        log "Apache Bench not found"
        AB_AVAILABLE=false
    fi
    
    log_success "Dependency check completed"
}

create_test_directories() {
    mkdir -p "$TEST_RESULTS_DIR"
    mkdir -p "$TEST_IMAGES_DIR"
    
    # Create test images if they don't exist
    if [[ ! -f "$TEST_IMAGES_DIR/small.jpg" ]]; then
        log "Creating test images..."
        # Create simple test images using ImageMagick if available
        if command -v convert > /dev/null 2>&1; then
            convert -size 100x100 xc:red "$TEST_IMAGES_DIR/small.jpg"
            convert -size 800x600 xc:blue "$TEST_IMAGES_DIR/medium.jpg"
            convert -size 2048x1536 xc:green "$TEST_IMAGES_DIR/large.jpg"
            log "Test images created"
        else
            log "ImageMagick not found, please provide test images manually"
        fi
    fi
}

# =============================================================================
# BASIC PERFORMANCE TESTS
# =============================================================================

test_endpoint_response_time() {
    local endpoint="$1"
    local name="$2"
    local iterations=10
    
    log "Testing response time for $name ($endpoint)..."
    
    local total_time=0
    local successful_requests=0
    local failed_requests=0
    
    local results_file="${TEST_RESULTS_DIR}/${name}_response_times.txt"
    echo "# Response times for $name" > "$results_file"
    echo "# Timestamp,ResponseTime(s),HTTPCode" >> "$results_file"
    
    for i in $(seq 1 $iterations); do
        local start_time=$(date +%s.%3N)
        local response_time
        local http_code
        
        if response_time=$(curl -w "%{time_total}" -s -o /dev/null "$endpoint" 2>/dev/null); then
            http_code=$(curl -w "%{http_code}" -s -o /dev/null "$endpoint" 2>/dev/null)
            
            if [[ "$http_code" -ge 200 && "$http_code" -lt 400 ]]; then
                total_time=$(echo "$total_time + $response_time" | bc -l)
                successful_requests=$((successful_requests + 1))
                echo "$(date +%s),$response_time,$http_code" >> "$results_file"
            else
                failed_requests=$((failed_requests + 1))
                echo "$(date +%s),error,$http_code" >> "$results_file"
            fi
        else
            failed_requests=$((failed_requests + 1))
            echo "$(date +%s),error,000" >> "$results_file"
        fi
        
        sleep 1
    done
    
    if [[ $successful_requests -gt 0 ]]; then
        local avg_time=$(echo "scale=3; $total_time / $successful_requests" | bc -l)
        log "$name - Average response time: ${avg_time}s, Success rate: $((successful_requests * 100 / iterations))%"
        
        # Store results for summary
        echo "$name,$avg_time,$successful_requests,$failed_requests" >> "${TEST_RESULTS_DIR}/summary.csv"
    else
        log_error "$name - All requests failed"
    fi
}

test_basic_endpoints() {
    log "Starting basic endpoint performance tests..."
    
    # Initialize summary file
    echo "Endpoint,AvgResponseTime(s),SuccessfulRequests,FailedRequests" > "${TEST_RESULTS_DIR}/summary.csv"
    
    # Test basic endpoints
    test_endpoint_response_time "$BASE_URL" "homepage"
    test_endpoint_response_time "$BASE_URL/api/health" "health_check"
    
    # Test image optimization if test image exists
    if [[ -f "$TEST_IMAGES_DIR/medium.jpg" ]]; then
        log "Testing image optimization endpoint..."
        
        local optimization_times=()
        local successful_optimizations=0
        
        for i in {1..5}; do
            local start_time=$(date +%s.%3N)
            local response
            
            if response=$(curl -s -w "%{time_total}" -X POST \
                -F "image=@${TEST_IMAGES_DIR}/medium.jpg" \
                "$BASE_URL/api/image/optimize" 2>/dev/null); then
                
                local response_time=$(echo "$response" | tail -1)
                optimization_times+=("$response_time")
                successful_optimizations=$((successful_optimizations + 1))
                
                log "Image optimization $i: ${response_time}s"
            else
                log_error "Image optimization $i failed"
            fi
            
            sleep 2
        done
        
        if [[ $successful_optimizations -gt 0 ]]; then
            local total_time=0
            for time in "${optimization_times[@]}"; do
                total_time=$(echo "$total_time + $time" | bc -l)
            done
            local avg_time=$(echo "scale=3; $total_time / $successful_optimizations" | bc -l)
            
            log "Image optimization - Average time: ${avg_time}s, Success rate: $((successful_optimizations * 100 / 5))%"
            echo "image_optimization,$avg_time,$successful_optimizations,$((5 - successful_optimizations))" >> "${TEST_RESULTS_DIR}/summary.csv"
        fi
    fi
    
    log_success "Basic endpoint tests completed"
}

# =============================================================================
# LOAD TESTING FUNCTIONS
# =============================================================================

run_load_test_with_k6() {
    local test_script="${TEST_RESULTS_DIR}/k6-script.js"
    
    log "Creating k6 load test script..."
    
    cat > "$test_script" << EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '${RAMP_UP_TIME}s', target: ${CONCURRENT_USERS} },
        { duration: '${DURATION}s', target: ${CONCURRENT_USERS} },
        { duration: '${RAMP_UP_TIME}s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
        http_req_failed: ['rate<0.1'], // error rate must be below 10%
    },
};

export default function() {
    // Test homepage
    let response = http.get('${BASE_URL}');
    check(response, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    sleep(1);
    
    // Test health endpoint
    response = http.get('${BASE_URL}/api/health');
    check(response, {
        'health status is 200': (r) => r.status === 200,
        'health response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}
EOF
    
    log "Running k6 load test..."
    local test_output="${TEST_RESULTS_DIR}/k6-results.json"
    
    if k6 run --out json="$test_output" "$test_script"; then
        log_success "k6 load test completed successfully"
        
        # Parse results
        if [[ -f "$test_output" ]]; then
            log "Analyzing k6 results..."
            # Extract key metrics from JSON output
            local avg_response_time
            avg_response_time=$(jq -r '.metrics.http_req_duration.values.avg' "$test_output" 2>/dev/null || echo "N/A")
            local p95_response_time
            p95_response_time=$(jq -r '.metrics.http_req_duration.values."p(95)"' "$test_output" 2>/dev/null || echo "N/A")
            local error_rate
            error_rate=$(jq -r '.metrics.http_req_failed.values.rate' "$test_output" 2>/dev/null || echo "N/A")
            
            log "k6 Results - Avg Response Time: ${avg_response_time}ms, P95: ${p95_response_time}ms, Error Rate: ${error_rate}"
        fi
    else
        log_error "k6 load test failed"
        return 1
    fi
}

run_load_test_with_ab() {
    log "Running Apache Bench load test..."
    
    local total_requests=$((CONCURRENT_USERS * DURATION / 10))  # Approximate
    local ab_output="${TEST_RESULTS_DIR}/ab-results.txt"
    
    if ab -c "$CONCURRENT_USERS" -n "$total_requests" -g "${TEST_RESULTS_DIR}/ab-gnuplot.tsv" "$BASE_URL/" > "$ab_output" 2>&1; then
        log_success "Apache Bench test completed"
        
        # Extract key metrics
        local requests_per_sec
        requests_per_sec=$(grep "Requests per second" "$ab_output" | awk '{print $4}')
        local mean_response_time
        mean_response_time=$(grep "Time per request" "$ab_output" | head -1 | awk '{print $4}')
        local failed_requests
        failed_requests=$(grep "Failed requests" "$ab_output" | awk '{print $3}')
        
        log "AB Results - RPS: ${requests_per_sec}, Mean Response Time: ${mean_response_time}ms, Failed: ${failed_requests}"
    else
        log_error "Apache Bench test failed"
        return 1
    fi
}

run_custom_load_test() {
    log "Running custom load test with curl..."
    
    local pids=()
    local results_file="${TEST_RESULTS_DIR}/custom-load-test.csv"
    
    echo "timestamp,response_time,http_code,endpoint" > "$results_file"
    
    # Function to run concurrent requests
    run_concurrent_requests() {
        local endpoint="$1"
        local endpoint_name="$2"
        local end_time=$(($(date +%s) + DURATION))
        
        while [[ $(date +%s) -lt $end_time ]]; do
            local start_time=$(date +%s.%3N)
            local response_time
            local http_code
            
            if response_time=$(curl -w "%{time_total}" -s -o /dev/null "$endpoint" 2>/dev/null); then
                http_code=$(curl -w "%{http_code}" -s -o /dev/null "$endpoint" 2>/dev/null)
                echo "$(date +%s),$response_time,$http_code,$endpoint_name" >> "$results_file"
            fi
            
            sleep $(echo "scale=2; $RANDOM / 32767 * 2" | bc)  # Random sleep 0-2 seconds
        done
    }
    
    log "Starting $CONCURRENT_USERS concurrent users for ${DURATION}s..."
    
    # Start concurrent processes
    for i in $(seq 1 $CONCURRENT_USERS); do
        if [[ $((i % 3)) -eq 0 ]]; then
            run_concurrent_requests "$BASE_URL/api/health" "health" &
        else
            run_concurrent_requests "$BASE_URL" "homepage" &
        fi
        pids+=($!)
    done
    
    # Wait for all processes to complete
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    log_success "Custom load test completed"
    
    # Analyze results
    if [[ -f "$results_file" ]]; then
        local total_requests
        total_requests=$(tail -n +2 "$results_file" | wc -l)
        local successful_requests
        successful_requests=$(tail -n +2 "$results_file" | awk -F',' '$3 >= 200 && $3 < 400' | wc -l)
        local avg_response_time
        avg_response_time=$(tail -n +2 "$results_file" | awk -F',' 'BEGIN{sum=0; count=0} $3 >= 200 && $3 < 400 {sum+=$2; count++} END{if(count>0) print sum/count; else print 0}')
        
        log "Custom Load Test Results:"
        log "  Total Requests: $total_requests"
        log "  Successful Requests: $successful_requests"
        log "  Success Rate: $(echo "scale=2; $successful_requests * 100 / $total_requests" | bc)%"
        log "  Average Response Time: ${avg_response_time}s"
    fi
}

# =============================================================================
# STRESS TESTING FUNCTIONS
# =============================================================================

run_stress_test() {
    log "Starting stress test..."
    
    local stress_users=$((CONCURRENT_USERS * 2))
    local stress_duration=$((DURATION / 2))
    
    log "Stress test parameters: $stress_users users for ${stress_duration}s"
    
    # Use k6 if available, otherwise use custom method
    if [[ "$K6_AVAILABLE" == "true" ]]; then
        run_stress_test_with_k6 "$stress_users" "$stress_duration"
    else
        run_custom_stress_test "$stress_users" "$stress_duration"
    fi
}

run_stress_test_with_k6() {
    local users="$1"
    local duration="$2"
    local test_script="${TEST_RESULTS_DIR}/k6-stress-script.js"
    
    cat > "$test_script" << EOF
import http from 'k6/http';
import { check } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: ${users} },
        { duration: '${duration}s', target: ${users} },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<10000'], // Allow higher response times under stress
        http_req_failed: ['rate<0.2'], // Allow higher error rates under stress
    },
};

export default function() {
    let response = http.get('${BASE_URL}');
    check(response, {
        'status is not 500': (r) => r.status !== 500,
    });
}
EOF
    
    local test_output="${TEST_RESULTS_DIR}/k6-stress-results.json"
    
    if k6 run --out json="$test_output" "$test_script"; then
        log_success "k6 stress test completed"
    else
        log_error "k6 stress test failed or showed concerning results"
    fi
}

run_custom_stress_test() {
    local users="$1"
    local duration="$2"
    
    log "Running custom stress test with $users concurrent users..."
    
    local pids=()
    local results_file="${TEST_RESULTS_DIR}/stress-test-results.csv"
    
    echo "timestamp,response_time,http_code,user_id" > "$results_file"
    
    # Start stress test users
    for i in $(seq 1 "$users"); do
        (
            local end_time=$(($(date +%s) + duration))
            while [[ $(date +%s) -lt $end_time ]]; do
                local response_time
                local http_code
                
                if response_time=$(curl -w "%{time_total}" -s -o /dev/null "$BASE_URL" 2>/dev/null); then
                    http_code=$(curl -w "%{http_code}" -s -o /dev/null "$BASE_URL" 2>/dev/null)
                    echo "$(date +%s),$response_time,$http_code,$i" >> "$results_file"
                fi
                
                # Very short sleep to maintain high load
                sleep 0.1
            done
        ) &
        pids+=($!)
        
        # Stagger user start times slightly
        sleep 0.1
    done
    
    # Wait for all stress test users to complete
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    log_success "Custom stress test completed"
    
    # Analyze stress test results
    analyze_stress_results "$results_file"
}

analyze_stress_results() {
    local results_file="$1"
    
    if [[ ! -f "$results_file" ]]; then
        log_error "Results file not found: $results_file"
        return 1
    fi
    
    log "Analyzing stress test results..."
    
    local total_requests
    total_requests=$(tail -n +2 "$results_file" | wc -l)
    local successful_requests
    successful_requests=$(tail -n +2 "$results_file" | awk -F',' '$3 >= 200 && $3 < 400' | wc -l)
    local server_errors
    server_errors=$(tail -n +2 "$results_file" | awk -F',' '$3 >= 500' | wc -l)
    
    log "Stress Test Analysis:"
    log "  Total Requests: $total_requests"
    log "  Successful Requests: $successful_requests"
    log "  Server Errors (5xx): $server_errors"
    log "  Success Rate: $(echo "scale=2; $successful_requests * 100 / $total_requests" | bc)%"
    log "  Error Rate: $(echo "scale=2; $server_errors * 100 / $total_requests" | bc)%"
    
    # Check if system handled stress well
    local error_rate
    error_rate=$(echo "scale=2; $server_errors * 100 / $total_requests" | bc)
    
    if (( $(echo "$error_rate < 5" | bc -l) )); then
        log_success "System handled stress test well (error rate: ${error_rate}%)"
    elif (( $(echo "$error_rate < 20" | bc -l) )); then
        log "System showed some strain under stress (error rate: ${error_rate}%)"
    else
        log_error "System struggled under stress (error rate: ${error_rate}%)"
    fi
}

# =============================================================================
# IMAGE PROCESSING PERFORMANCE TESTS
# =============================================================================

test_image_processing_performance() {
    log "Starting image processing performance tests..."
    
    if [[ ! -d "$TEST_IMAGES_DIR" ]] || [[ -z "$(ls -A "$TEST_IMAGES_DIR")" ]]; then
        log "No test images found, skipping image processing tests"
        return 0
    fi
    
    local image_results_file="${TEST_RESULTS_DIR}/image-processing-results.csv"
    echo "image_file,file_size,processing_time,http_code,optimized_size" > "$image_results_file"
    
    for image_file in "$TEST_IMAGES_DIR"/*.{jpg,jpeg,png,gif}; do
        if [[ -f "$image_file" ]]; then
            test_single_image_optimization "$image_file" "$image_results_file"
        fi
    done
    
    # Analyze image processing results
    analyze_image_processing_results "$image_results_file"
}

test_single_image_optimization() {
    local image_file="$1"
    local results_file="$2"
    local image_name
    image_name=$(basename "$image_file")
    
    log "Testing image optimization for $image_name..."
    
    local file_size
    file_size=$(stat -f%z "$image_file" 2>/dev/null || stat -c%s "$image_file" 2>/dev/null || echo "0")
    
    local start_time=$(date +%s.%3N)
    local temp_output
    temp_output=$(mktemp)
    local http_code
    
    # Test image optimization
    http_code=$(curl -w "%{http_code}" -s -X POST \
        -F "image=@${image_file}" \
        -o "$temp_output" \
        "$BASE_URL/api/image/optimize" 2>/dev/null || echo "000")
    
    local end_time=$(date +%s.%3N)
    local processing_time
    processing_time=$(echo "$end_time - $start_time" | bc)
    
    local optimized_size=0
    if [[ "$http_code" == "200" ]] && [[ -f "$temp_output" ]]; then
        optimized_size=$(stat -f%z "$temp_output" 2>/dev/null || stat -c%s "$temp_output" 2>/dev/null || echo "0")
    fi
    
    # Clean up temp file
    rm -f "$temp_output"
    
    # Record results
    echo "$image_name,$file_size,$processing_time,$http_code,$optimized_size" >> "$results_file"
    
    # Log individual result
    if [[ "$http_code" == "200" ]]; then
        local compression_ratio
        compression_ratio=$(echo "scale=3; $optimized_size / $file_size" | bc)
        log "  $image_name: ${processing_time}s, ${file_size} -> ${optimized_size} bytes (${compression_ratio}x)"
    else
        log_error "  $image_name: Failed with HTTP $http_code"
    fi
}

analyze_image_processing_results() {
    local results_file="$1"
    
    log "Analyzing image processing performance..."
    
    local total_images
    total_images=$(tail -n +2 "$results_file" | wc -l)
    local successful_optimizations
    successful_optimizations=$(tail -n +2 "$results_file" | awk -F',' '$4 == 200' | wc -l)
    
    if [[ $successful_optimizations -eq 0 ]]; then
        log_error "No successful image optimizations"
        return 1
    fi
    
    local avg_processing_time
    avg_processing_time=$(tail -n +2 "$results_file" | awk -F',' '$4 == 200 {sum+=$3; count++} END{if(count>0) print sum/count; else print 0}')
    
    local avg_compression_ratio
    avg_compression_ratio=$(tail -n +2 "$results_file" | awk -F',' '$4 == 200 && $2 > 0 && $5 > 0 {sum+=$5/$2; count++} END{if(count>0) print sum/count; else print 0}')
    
    log "Image Processing Performance Analysis:"
    log "  Total Images Tested: $total_images"
    log "  Successful Optimizations: $successful_optimizations"
    log "  Success Rate: $(echo "scale=2; $successful_optimizations * 100 / $total_images" | bc)%"
    log "  Average Processing Time: ${avg_processing_time}s"
    log "  Average Compression Ratio: ${avg_compression_ratio}"
    
    # Performance thresholds
    local processing_time_threshold=10.0
    local compression_ratio_threshold=0.8
    
    if (( $(echo "$avg_processing_time < $processing_time_threshold" | bc -l) )); then
        log_success "Image processing time is acceptable (< ${processing_time_threshold}s)"
    else
        log_error "Image processing time is too slow (> ${processing_time_threshold}s)"
    fi
    
    if (( $(echo "$avg_compression_ratio < $compression_ratio_threshold" | bc -l) )); then
        log_success "Image compression is effective (ratio: ${avg_compression_ratio})"
    else
        log "Image compression could be improved (ratio: ${avg_compression_ratio})"
    fi
}

# =============================================================================
# PERFORMANCE REPORT GENERATION
# =============================================================================

generate_performance_report() {
    local report_file="${TEST_RESULTS_DIR}/performance-report.html"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    log "Generating performance report..."
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report - $ENVIRONMENT</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .metric { background-color: #e8f4fd; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Test Type:</strong> $TEST_TYPE</p>
        <p><strong>Duration:</strong> ${DURATION}s</p>
        <p><strong>Concurrent Users:</strong> $CONCURRENT_USERS</p>
        <p><strong>Generated:</strong> $timestamp</p>
        <p><strong>Base URL:</strong> $BASE_URL</p>
    </div>

    <div class="section">
        <h2>Test Summary</h2>
EOF
    
    # Add summary table if available
    if [[ -f "${TEST_RESULTS_DIR}/summary.csv" ]]; then
        echo "        <table>" >> "$report_file"
        echo "            <tr><th>Endpoint</th><th>Avg Response Time (s)</th><th>Successful Requests</th><th>Failed Requests</th></tr>" >> "$report_file"
        
        while IFS=',' read -r endpoint avg_time success failed; do
            if [[ "$endpoint" != "Endpoint" ]]; then  # Skip header
                echo "            <tr><td>$endpoint</td><td>$avg_time</td><td>$success</td><td>$failed</td></tr>" >> "$report_file"
            fi
        done < "${TEST_RESULTS_DIR}/summary.csv"
        
        echo "        </table>" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <div class="metric">
            <strong>Response Time Targets:</strong>
            <ul>
                <li>Homepage: &lt; 2 seconds</li>
                <li>API Health: &lt; 0.5 seconds</li>
                <li>Image Optimization: &lt; 10 seconds</li>
            </ul>
        </div>
        <div class="metric">
            <strong>Success Rate Target:</strong> &gt; 99%
        </div>
        <div class="metric">
            <strong>Error Rate Target:</strong> &lt; 1%
        </div>
    </div>

    <div class="section">
        <h2>Test Files</h2>
        <ul>
EOF
    
    # List generated files
    for file in "$TEST_RESULTS_DIR"/*.{csv,txt,json,tsv} 2>/dev/null; do
        if [[ -f "$file" ]]; then
            local filename
            filename=$(basename "$file")
            echo "            <li><a href=\"$filename\">$filename</a></li>" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF
        </ul>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Monitor response times and scale services if consistently above targets</li>
            <li>Investigate any endpoints with high error rates</li>
            <li>Optimize image processing if taking longer than 10 seconds</li>
            <li>Consider implementing additional caching for frequently accessed content</li>
            <li>Review and optimize database queries if response times are degrading</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Performance report generated: $report_file"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    local start_time=$(date +%s)
    
    log "Starting performance testing for $ENVIRONMENT environment"
    log "Test type: $TEST_TYPE, Duration: ${DURATION}s, Users: $CONCURRENT_USERS"
    
    # Setup
    check_dependencies
    create_test_directories
    
    # Run tests based on type
    case "$TEST_TYPE" in
        baseline)
            test_basic_endpoints
            ;;
        load)
            if [[ "$K6_AVAILABLE" == "true" ]]; then
                run_load_test_with_k6
            elif [[ "$AB_AVAILABLE" == "true" ]]; then
                run_load_test_with_ab
            else
                run_custom_load_test
            fi
            ;;
        stress)
            run_stress_test
            ;;
        image)
            test_image_processing_performance
            ;;
        full)
            test_basic_endpoints
            if [[ "$K6_AVAILABLE" == "true" ]]; then
                run_load_test_with_k6
            else
                run_custom_load_test
            fi
            run_stress_test
            test_image_processing_performance
            ;;
        *)
            log_error "Invalid test type: $TEST_TYPE"
            log "Valid types: baseline, load, stress, image, full"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_performance_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Performance testing completed in ${duration}s"
    log "Results saved in: $TEST_RESULTS_DIR"
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Show usage if no arguments
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <environment> [test-type] [duration]"
    echo ""
    echo "Arguments:"
    echo "  environment : production, staging, or local"
    echo "  test-type   : baseline, load, stress, image, or full (default: baseline)"
    echo "  duration    : test duration in seconds (default: 300)"
    echo ""
    echo "Examples:"
    echo "  $0 staging baseline 60"
    echo "  $0 production load 300"
    echo "  $0 staging full 600"
    exit 1
fi

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$TEST_RESULTS_DIR"

# Trap signals for cleanup
trap 'log "Performance test interrupted"; exit 130' INT TERM

# Execute main function
main "$@"