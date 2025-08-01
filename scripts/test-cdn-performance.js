#!/usr/bin/env node

/**
 * CDN Performance Testing Script
 * 
 * This script tests the CDN configuration and performance optimizations
 * for the portfolio website. It checks cache headers, compression,
 * security headers, and overall performance metrics.
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:4321',
  timeout: 10000,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  
  // Test endpoints and their expected cache behavior
  testEndpoints: {
    homepage: {
      path: '/',
      expectedCacheControl: /public.*max-age=300/,
      shouldCompress: true,
      expectedContentType: /text\/html/
    },
    css: {
      path: '/styles/global.css',
      expectedCacheControl: /public.*max-age=31536000.*immutable/,
      shouldCompress: true,
      expectedContentType: /text\/css/
    },
    javascript: {
      path: '/_astro/client.js',
      expectedCacheControl: /public.*max-age=31536000.*immutable/,
      shouldCompress: true,
      expectedContentType: /application\/javascript/
    },
    image: {
      path: '/assets/frank-headshot.png',
      expectedCacheControl: /public.*max-age=86400/,
      shouldCompress: false,
      expectedContentType: /image\//
    },
    api: {
      path: '/api/health',
      expectedCacheControl: /no-cache|max-age=60/,
      shouldCompress: false,
      expectedContentType: /application\/json/
    }
  },
  
  // Expected security headers
  securityHeaders: [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'referrer-policy',
    'content-security-policy'
  ],
  
  // Performance thresholds (in milliseconds)
  performanceThresholds: {
    ttfb: 500,      // Time to First Byte
    totalTime: 2000, // Total request time
    dnsLookup: 100,  // DNS resolution time
    connect: 200     // Connection time
  }
};

class CDNTester {
  constructor(config) {
    this.config = config;
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      performance: {
        averageResponseTime: 0,
        cacheHitRatio: 0,
        compressionRatio: 0
      }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting CDN Performance Tests');
    console.log(`📍 Base URL: ${this.config.baseUrl}`);
    console.log('=' .repeat(50));

    // Test each endpoint
    for (const [name, endpoint] of Object.entries(this.config.testEndpoints)) {
      await this.testEndpoint(name, endpoint);
    }

    // Run performance tests
    await this.testOverallPerformance();
    
    // Test CDN detection
    await this.testCDNDetection();

    // Generate report
    this.generateReport();
    
    return this.results;
  }

  async testEndpoint(name, endpoint) {
    console.log(`\n🔍 Testing ${name.toUpperCase()}: ${endpoint.path}`);
    
    const testResult = {
      name,
      endpoint: endpoint.path,
      tests: [],
      performance: {},
      status: 'unknown'
    };

    try {
      const startTime = performance.now();
      
      // Make request with compression headers
      const response = await fetch(`${this.config.baseUrl}${endpoint.path}`, {
        headers: {
          'Accept-Encoding': 'br, gzip, deflate',
          'User-Agent': this.config.userAgent,
          'Accept': '*/*'
        },
        timeout: this.config.timeout
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      testResult.performance.responseTime = responseTime;
      testResult.performance.status = response.status;
      testResult.performance.size = response.headers.get('content-length') || 'unknown';

      // Test 1: Response Status
      const statusTest = this.createTest(
        'HTTP Status',
        response.status === 200,
        `Expected 200, got ${response.status}`
      );
      testResult.tests.push(statusTest);

      // Test 2: Cache Control Headers
      const cacheControl = response.headers.get('cache-control');
      const cacheTest = this.createTest(
        'Cache Control',
        cacheControl && endpoint.expectedCacheControl.test(cacheControl),
        `Expected ${endpoint.expectedCacheControl}, got: ${cacheControl}`
      );
      testResult.tests.push(cacheTest);

      // Test 3: Content Type
      const contentType = response.headers.get('content-type');
      const contentTypeTest = this.createTest(
        'Content Type',
        contentType && endpoint.expectedContentType.test(contentType),
        `Expected ${endpoint.expectedContentType}, got: ${contentType}`
      );
      testResult.tests.push(contentTypeTest);

      // Test 4: Compression
      const contentEncoding = response.headers.get('content-encoding');
      const compressionTest = this.createTest(
        'Compression',
        endpoint.shouldCompress ? !!contentEncoding : true,
        endpoint.shouldCompress 
          ? `Expected compression, got: ${contentEncoding || 'none'}`
          : 'Compression not expected'
      );
      testResult.tests.push(compressionTest);

      // Test 5: Security Headers (only for HTML pages)
      if (endpoint.path === '/' || endpoint.path.endsWith('.html')) {
        await this.testSecurityHeaders(response, testResult);
      }

      // Test 6: Response Time
      const performanceTest = this.createTest(
        'Response Time',
        responseTime < this.config.performanceThresholds.totalTime,
        `${responseTime.toFixed(2)}ms (threshold: ${this.config.performanceThresholds.totalTime}ms)`
      );
      testResult.tests.push(performanceTest);

      // Test 7: ETag Header (for static assets)
      if (endpoint.path !== '/' && !endpoint.path.startsWith('/api/')) {
        const etag = response.headers.get('etag');
        const etagTest = this.createTest(
          'ETag Header',
          !!etag,
          `ETag: ${etag || 'missing'}`
        );
        testResult.tests.push(etagTest);
      }

      // Calculate test results
      const passed = testResult.tests.filter(t => t.passed).length;
      const total = testResult.tests.length;
      testResult.status = passed === total ? 'passed' : 'failed';

      this.logTestResults(testResult);

    } catch (error) {
      console.error(`❌ Error testing ${name}: ${error.message}`);
      testResult.status = 'error';
      testResult.error = error.message;
    }

    this.results.tests.push(testResult);
    this.updateSummary(testResult);
  }

  async testSecurityHeaders(response, testResult) {
    for (const headerName of this.config.securityHeaders) {
      const headerValue = response.headers.get(headerName);
      const securityTest = this.createTest(
        `Security Header: ${headerName}`,
        !!headerValue,
        `${headerName}: ${headerValue || 'missing'}`
      );
      testResult.tests.push(securityTest);
    }
  }

  async testCDNDetection() {
    console.log('\n🌐 Testing CDN Detection');
    
    try {
      const response = await fetch(`${this.config.baseUrl}/`, {
        headers: { 'User-Agent': this.config.userAgent }
      });

      const cdnHeaders = [
        'cf-ray',
        'x-cache',
        'x-served-by',
        'x-digitalocean-cache-status',
        'x-amz-cf-id'
      ];

      const detectedCDN = cdnHeaders.find(header => response.headers.get(header));
      
      if (detectedCDN) {
        console.log(`✅ CDN Detected: ${detectedCDN} = ${response.headers.get(detectedCDN)}`);
      } else {
        console.log('⚠️  No CDN headers detected - ensure CDN is properly configured');
      }

      // Check for custom CDN headers added by our middleware
      const cdnProvider = response.headers.get('x-cdn-provider');
      const cdnCache = response.headers.get('x-cdn-cache');
      
      if (cdnProvider) {
        console.log(`✅ CDN Provider detected by middleware: ${cdnProvider}`);
      }
      if (cdnCache) {
        console.log(`✅ CDN Cache status: ${cdnCache}`);
      }

    } catch (error) {
      console.error(`❌ CDN Detection failed: ${error.message}`);
    }
  }

  async testOverallPerformance() {
    console.log('\n⚡ Testing Overall Performance');
    
    const performanceTests = [];
    const iterations = 3;

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        const response = await fetch(`${this.config.baseUrl}/`, {
          headers: { 'User-Agent': this.config.userAgent }
        });
        const endTime = performance.now();
        
        performanceTests.push({
          responseTime: endTime - startTime,
          status: response.status,
          cacheStatus: response.headers.get('x-cache') || 'unknown'
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Performance test ${i + 1} failed: ${error.message}`);
      }
    }

    if (performanceTests.length > 0) {
      const avgResponseTime = performanceTests.reduce((sum, test) => sum + test.responseTime, 0) / performanceTests.length;
      const cacheHits = performanceTests.filter(test => test.cacheStatus.includes('HIT')).length;
      
      this.results.performance.averageResponseTime = avgResponseTime;
      this.results.performance.cacheHitRatio = (cacheHits / performanceTests.length) * 100;
      
      console.log(`📊 Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`📊 Cache Hit Ratio: ${this.results.performance.cacheHitRatio.toFixed(1)}%`);
      
      if (avgResponseTime > this.config.performanceThresholds.totalTime) {
        console.log(`⚠️  Response time exceeds threshold (${this.config.performanceThresholds.totalTime}ms)`);
      }
    }
  }

  createTest(name, passed, details) {
    return {
      name,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
  }

  logTestResults(testResult) {
    console.log(`\n📋 Results for ${testResult.name}:`);
    console.log(`   Status: ${testResult.status.toUpperCase()}`);
    console.log(`   Response Time: ${testResult.performance.responseTime?.toFixed(2)}ms`);
    console.log(`   Size: ${testResult.performance.size}`);
    
    testResult.tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`   ${icon} ${test.name}: ${test.details}`);
    });
  }

  updateSummary(testResult) {
    this.results.summary.total++;
    
    if (testResult.status === 'passed') {
      this.results.summary.passed++;
    } else if (testResult.status === 'failed') {
      this.results.summary.failed++;
    }
    
    // Count warnings (tests that passed but with sub-optimal values)
    const warnings = testResult.tests.filter(test => 
      test.passed && test.details.includes('threshold')
    ).length;
    this.results.summary.warnings += warnings;
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 CDN PERFORMANCE TEST REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed} ✅`);
    console.log(`   Failed: ${this.results.summary.failed} ❌`);
    console.log(`   Warnings: ${this.results.summary.warnings} ⚠️`);
    
    const successRate = (this.results.summary.passed / this.results.summary.total) * 100;
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    
    console.log(`\n🚀 Performance Metrics:`);
    console.log(`   Average Response Time: ${this.results.performance.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Cache Hit Ratio: ${this.results.performance.cacheHitRatio.toFixed(1)}%`);
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    
    if (this.results.performance.averageResponseTime > 1000) {
      console.log(`   - Response times are high. Consider CDN optimization or origin server tuning.`);
    }
    
    if (this.results.performance.cacheHitRatio < 70) {
      console.log(`   - Cache hit ratio is low. Review cache headers and CDN configuration.`);
    }
    
    if (this.results.summary.failed > 0) {
      console.log(`   - Some tests failed. Review the detailed results above.`);
    }
    
    if (successRate === 100) {
      console.log(`   - All tests passed! CDN configuration looks good. 🎉`);
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new CDNTester(TEST_CONFIG);
  
  tester.runAllTests()
    .then(results => {
      const exitCode = results.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

export { CDNTester, TEST_CONFIG };