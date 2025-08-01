/**
 * Comprehensive Performance Monitoring for Image Optimization
 * Real-time metrics collection, analysis, and alerting
 */

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'image_load' | 'image_optimize' | 'cache_hit' | 'cache_miss' | 'error';
  duration?: number;
  size?: number;
  format?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceBudget {
  imageLoadTime: number; // Max load time in ms
  totalImageSize: number; // Max total image size per page in bytes
  lcp: number; // Largest Contentful Paint in ms
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay in ms
  cacheHitRate: number; // Minimum cache hit rate (0-1)
}

export interface AlertRule {
  id: string;
  metric: keyof PerformanceBudget;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  duration: number; // How long the condition must persist (ms)
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface PerformanceAlert {
  id: string;
  rule: AlertRule;
  value: number;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private alerts: PerformanceAlert[] = [];
  private alertRules: AlertRule[] = [];
  private budget: PerformanceBudget;
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;

  constructor() {
    this.budget = {
      imageLoadTime: 2000, // 2 seconds
      totalImageSize: 5 * 1024 * 1024, // 5MB
      lcp: 2500, // 2.5 seconds
      cls: 0.1, // 0.1 CLS score
      fid: 100, // 100ms
      cacheHitRate: 0.8, // 80%
    };

    this.setupDefaultAlertRules();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      await this.setupWebVitalsObservers();
      this.setupResourceObserver();
      this.setupNavigationObserver();
      this.setupCustomImageObservers();
      
      // Start periodic analysis
      setInterval(() => this.analyzeMetrics(), 30000); // Every 30 seconds
      
      this.isInitialized = true;
      console.log('Performance monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Maintain max metrics limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Dispatch event for real-time monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-metric', {
        detail: fullMetric
      }));
    }
  }

  /**
   * Set performance budget
   */
  setPerformanceBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const fullRule: AlertRule = {
      ...rule,
      id: this.generateId(),
    };
    
    this.alertRules.push(fullRule);
    return fullRule.id;
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats(): {
    metrics: {
      imageLoadTime: { avg: number; p95: number; p99: number };
      cacheHitRate: number;
      errorRate: number;
      totalImageSize: number;
    };
    webVitals: {
      lcp?: number;
      fid?: number;
      cls?: number;
    };
    budgetCompliance: Record<keyof PerformanceBudget, boolean>;
    activeAlerts: number;
  } {
    const imageMetrics = this.metrics.filter(m => 
      m.type === 'image_load' || m.type === 'image_optimize'
    );
    
    const loadTimes = imageMetrics
      .filter(m => m.duration)
      .map(m => m.duration!)
      .sort((a, b) => a - b);

    const cacheHits = this.metrics.filter(m => m.type === 'cache_hit').length;
    const cacheTotal = this.metrics.filter(m => 
      m.type === 'cache_hit' || m.type === 'cache_miss'
    ).length;

    const errors = this.metrics.filter(m => m.type === 'error').length;
    const totalRequests = this.metrics.length;

    const totalImageSize = imageMetrics
      .filter(m => m.size)
      .reduce((sum, m) => sum + m.size!, 0);

    return {
      metrics: {
        imageLoadTime: {
          avg: loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b) / loadTimes.length : 0,
          p95: loadTimes.length > 0 ? loadTimes[Math.floor(loadTimes.length * 0.95)] : 0,
          p99: loadTimes.length > 0 ? loadTimes[Math.floor(loadTimes.length * 0.99)] : 0,
        },
        cacheHitRate: cacheTotal > 0 ? cacheHits / cacheTotal : 0,
        errorRate: totalRequests > 0 ? errors / totalRequests : 0,
        totalImageSize,
      },
      webVitals: this.getWebVitals(),
      budgetCompliance: this.checkBudgetCompliance(),
      activeAlerts: this.alerts.filter(a => !a.resolved).length,
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: Record<string, any>;
    recommendations: string[];
    issues: string[];
  } {
    const stats = this.getPerformanceStats();
    const recommendations: string[] = [];
    const issues: string[] = [];

    // Analyze image load times
    if (stats.metrics.imageLoadTime.avg > this.budget.imageLoadTime) {
      issues.push(`Average image load time (${stats.metrics.imageLoadTime.avg}ms) exceeds budget (${this.budget.imageLoadTime}ms)`);
      recommendations.push('Consider optimizing image formats (AVIF/WebP) and sizes');
    }

    // Analyze cache performance
    if (stats.metrics.cacheHitRate < this.budget.cacheHitRate) {
      issues.push(`Cache hit rate (${(stats.metrics.cacheHitRate * 100).toFixed(1)}%) below target (${(this.budget.cacheHitRate * 100)}%)`);
      recommendations.push('Review caching strategy and TTL settings');
    }

    // Analyze Web Vitals
    if (stats.webVitals.lcp && stats.webVitals.lcp > this.budget.lcp) {
      issues.push(`LCP (${stats.webVitals.lcp}ms) exceeds budget (${this.budget.lcp}ms)`);
      recommendations.push('Optimize critical image loading and preload above-the-fold images');
    }

    if (stats.webVitals.cls && stats.webVitals.cls > this.budget.cls) {
      issues.push(`CLS (${stats.webVitals.cls}) exceeds budget (${this.budget.cls})`);
      recommendations.push('Set explicit width/height attributes on images to prevent layout shifts');
    }

    // Error rate analysis
    if (stats.metrics.errorRate > 0.05) { // 5% error threshold
      issues.push(`High error rate detected (${(stats.metrics.errorRate * 100).toFixed(1)}%)`);
      recommendations.push('Review error logs and implement better fallback mechanisms');
    }

    return {
      summary: {
        ...stats,
        timestamp: Date.now(),
        metricsCount: this.metrics.length,
      },
      recommendations,
      issues,
    };
  }

  /**
   * Setup Web Vitals observers
   */
  private async setupWebVitalsObservers(): Promise<void> {
    if (!('PerformanceObserver' in window)) return;

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric({
          type: 'image_load',
          duration: lastEntry.startTime,
          metadata: { metric: 'lcp', element: lastEntry.target },
        });
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach(entry => {
          this.recordMetric({
            type: 'image_load',
            duration: entry.processingStart - entry.startTime,
            metadata: { metric: 'fid' },
          });
        });
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }

    // CLS Observer
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            this.recordMetric({
              type: 'image_load',
              duration: entry.value * 1000, // Convert to ms equivalent
              metadata: { metric: 'cls', sources: entry.sources },
            });
          }
        });
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }
  }

  /**
   * Setup resource observer for image loading
   */
  private setupResourceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        
        entries.forEach(entry => {
          if (entry.initiatorType === 'img' || 
              entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i)) {
            
            this.recordMetric({
              type: 'image_load',
              duration: entry.responseEnd - entry.startTime,
              size: entry.transferSize || entry.encodedBodySize,
              source: entry.name,
              metadata: {
                cacheHit: entry.transferSize === 0,
                compressionRatio: entry.encodedBodySize > 0 
                  ? (1 - entry.transferSize / entry.encodedBodySize) * 100 
                  : 0,
              },
            });
          }
        });
      });
      
      resourceObserver.observe({ type: 'resource', buffered: true });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      console.warn('Resource observer setup failed:', error);
    }
  }

  /**
   * Setup navigation observer
   */
  private setupNavigationObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceNavigationTiming[];
        
        entries.forEach(entry => {
          this.recordMetric({
            type: 'image_load',
            duration: entry.loadEventEnd - entry.navigationStart,
            metadata: {
              metric: 'page_load',
              domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
              firstPaint: entry.loadEventStart - entry.navigationStart,
            },
          });
        });
      });
      
      navigationObserver.observe({ type: 'navigation', buffered: true });
      this.observers.set('navigation', navigationObserver);
    } catch (error) {
      console.warn('Navigation observer setup failed:', error);
    }
  }

  /**
   * Setup custom image observers
   */
  private setupCustomImageObservers(): void {
    // Listen for custom image events
    window.addEventListener('optimized-image-loaded', ((event: CustomEvent) => {
      this.recordMetric({
        type: 'image_load',
        duration: event.detail.loadTime,
        source: event.detail.src,
        metadata: { custom: true },
      });
    }) as EventListener);

    window.addEventListener('optimized-image-error', ((event: CustomEvent) => {
      this.recordMetric({
        type: 'error',
        source: event.detail.src,
        metadata: { error: event.detail.error },
      });
    }) as EventListener);

    // Listen for cache events
    window.addEventListener('image-cache-hit', ((event: CustomEvent) => {
      this.recordMetric({
        type: 'cache_hit',
        source: event.detail.src,
        metadata: event.detail,
      });
    }) as EventListener);

    window.addEventListener('image-cache-miss', ((event: CustomEvent) => {
      this.recordMetric({
        type: 'cache_miss',
        source: event.detail.src,
        metadata: event.detail,
      });
    }) as EventListener);
  }

  /**
   * Analyze metrics and trigger alerts
   */
  private analyzeMetrics(): void {
    const stats = this.getPerformanceStats();
    
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      const currentValue = this.getMetricValue(stats, rule.metric);
      const isViolation = this.checkThreshold(currentValue, rule.threshold, rule.operator);

      if (isViolation) {
        this.triggerAlert(rule, currentValue);
      }
    });
  }

  /**
   * Get current Web Vitals
   */
  private getWebVitals(): { lcp?: number; fid?: number; cls?: number } {
    const vitals: { lcp?: number; fid?: number; cls?: number } = {};

    const lcpMetrics = this.metrics.filter(m => m.metadata?.metric === 'lcp');
    if (lcpMetrics.length > 0) {
      vitals.lcp = lcpMetrics[lcpMetrics.length - 1].duration;
    }

    const fidMetrics = this.metrics.filter(m => m.metadata?.metric === 'fid');
    if (fidMetrics.length > 0) {
      vitals.fid = fidMetrics[fidMetrics.length - 1].duration;
    }

    const clsMetrics = this.metrics.filter(m => m.metadata?.metric === 'cls');
    if (clsMetrics.length > 0) {
      vitals.cls = clsMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / 1000;
    }

    return vitals;
  }

  /**
   * Check budget compliance
   */
  private checkBudgetCompliance(): Record<keyof PerformanceBudget, boolean> {
    const stats = this.getPerformanceStats();
    
    return {
      imageLoadTime: stats.metrics.imageLoadTime.avg <= this.budget.imageLoadTime,
      totalImageSize: stats.metrics.totalImageSize <= this.budget.totalImageSize,
      lcp: !stats.webVitals.lcp || stats.webVitals.lcp <= this.budget.lcp,
      cls: !stats.webVitals.cls || stats.webVitals.cls <= this.budget.cls,
      fid: !stats.webVitals.fid || stats.webVitals.fid <= this.budget.fid,
      cacheHitRate: stats.metrics.cacheHitRate >= this.budget.cacheHitRate,
    };
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-image-load-time',
        metric: 'imageLoadTime',
        threshold: this.budget.imageLoadTime * 1.5,
        operator: 'gt',
        duration: 60000, // 1 minute
        severity: 'medium',
        enabled: true,
      },
      {
        id: 'low-cache-hit-rate',
        metric: 'cacheHitRate',
        threshold: this.budget.cacheHitRate * 0.7,
        operator: 'lt',
        duration: 300000, // 5 minutes
        severity: 'medium',
        enabled: true,
      },
      {
        id: 'critical-lcp',
        metric: 'lcp',
        threshold: this.budget.lcp * 2,
        operator: 'gt',
        duration: 30000, // 30 seconds
        severity: 'critical',
        enabled: true,
      },
    ];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMetricValue(stats: any, metric: keyof PerformanceBudget): number {
    switch (metric) {
      case 'imageLoadTime':
        return stats.metrics.imageLoadTime.avg;
      case 'totalImageSize':
        return stats.metrics.totalImageSize;
      case 'lcp':
        return stats.webVitals.lcp || 0;
      case 'cls':
        return stats.webVitals.cls || 0;
      case 'fid':
        return stats.webVitals.fid || 0;
      case 'cacheHitRate':
        return stats.metrics.cacheHitRate;
      default:
        return 0;
    }
  }

  private checkThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, value: number): void {
    const alertId = `${rule.id}-${Date.now()}`;
    
    const alert: PerformanceAlert = {
      id: alertId,
      rule,
      value,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.push(alert);

    // Dispatch alert event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-alert', {
        detail: alert
      }));
    }

    console.warn(`Performance Alert: ${rule.metric} = ${value} (threshold: ${rule.threshold})`);
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();