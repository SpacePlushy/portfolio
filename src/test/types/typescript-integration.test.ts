import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { 
  ImageFormat, 
  LoadingState, 
  Breakpoint, 
  ObjectFit, 
  LoadingPriority,
  ImageDimensions,
  ImageOptimizationParams,
  OptimizedImageData,
  LazyImageProps,
  OptimizedImageProps,
  ImageServiceConfig,
  BrowserCapabilities,
  ImagePerformanceMetrics,
  ImageOptimizationResponse
} from '@/types/image';

import type {
  AnalyticsProvider,
  GA4Config,
  PlausibleConfig,
  AnalyticsConfig,
  ConsentStatus,
  AnalyticsEvent,
  PageViewEvent,
  PerformanceMetrics,
  WebVitalMetric,
  ErrorEvent,
  AnalyticsManager
} from '@/types/analytics';

describe('TypeScript Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image Types', () => {
    describe('Basic Types', () => {
      it('should validate ImageFormat type', () => {
        const validFormats: ImageFormat[] = ['avif', 'webp', 'jpeg', 'png', 'gif'];
        
        validFormats.forEach(format => {
          expect(typeof format).toBe('string');
          expect(['avif', 'webp', 'jpeg', 'png', 'gif']).toContain(format);
        });

        // TypeScript should catch invalid formats at compile time
        // This test just validates the type exists and has correct values
      });

      it('should validate LoadingState type', () => {
        const validStates: LoadingState[] = ['idle', 'loading', 'loaded', 'error'];
        
        validStates.forEach(state => {
          expect(typeof state).toBe('string');
          expect(['idle', 'loading', 'loaded', 'error']).toContain(state);
        });
      });

      it('should validate Breakpoint type', () => {
        const validBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        
        validBreakpoints.forEach(bp => {
          expect(typeof bp).toBe('string');
          expect(['xs', 'sm', 'md', 'lg', 'xl', '2xl']).toContain(bp);
        });
      });

      it('should validate ObjectFit type', () => {
        const validFits: ObjectFit[] = ['contain', 'cover', 'fill', 'none', 'scale-down'];
        
        validFits.forEach(fit => {
          expect(typeof fit).toBe('string');
          expect(['contain', 'cover', 'fill', 'none', 'scale-down']).toContain(fit);
        });
      });

      it('should validate LoadingPriority type', () => {
        const validPriorities: LoadingPriority[] = ['high', 'medium', 'low'];
        
        validPriorities.forEach(priority => {
          expect(typeof priority).toBe('string');
          expect(['high', 'medium', 'low']).toContain(priority);
        });
      });
    });

    describe('Interface Validation', () => {
      it('should validate ImageDimensions interface', () => {
        const dimensions: ImageDimensions = {
          width: 800,
          height: 600,
          aspectRatio: 800 / 600
        };

        expect(dimensions.width).toBe(800);
        expect(dimensions.height).toBe(600);
        expect(dimensions.aspectRatio).toBe(800 / 600);
        expect(typeof dimensions.width).toBe('number');
        expect(typeof dimensions.height).toBe('number');
        expect(typeof dimensions.aspectRatio).toBe('number');

        // Test required vs optional properties
        const minimalDimensions: ImageDimensions = {
          width: 400,
          height: 300
        };

        expect(minimalDimensions.aspectRatio).toBeUndefined();
      });

      it('should validate ImageOptimizationParams interface', () => {
        const fullParams: ImageOptimizationParams = {
          width: 800,
          height: 600,
          quality: 85,
          format: 'webp',
          fit: 'cover',
          blur: 2,
          brightness: 1.1,
          contrast: 1.0,
          saturation: 0.9
        };

        expect(fullParams.width).toBe(800);
        expect(fullParams.format).toBe('webp');
        expect(fullParams.fit).toBe('cover');
        expect(fullParams.quality).toBe(85);

        // Test all optional properties
        const emptyParams: ImageOptimizationParams = {};
        expect(Object.keys(emptyParams)).toHaveLength(0);
      });

      it('should validate OptimizedImageData interface', () => {
        const imageData: OptimizedImageData = {
          sources: [
            {
              src: '/image.webp',
              srcSet: '/image-400.webp 400w, /image-800.webp 800w',
              sizes: '(max-width: 768px) 400px, 800px',
              format: 'webp',
              width: 800,
              height: 600,
              quality: 85
            }
          ],
          fallback: {
            src: '/image.jpg',
            width: 800,
            height: 600
          },
          placeholder: {
            src: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
            width: 20,
            height: 15
          },
          dimensions: {
            width: 800,
            height: 600,
            aspectRatio: 4/3
          }
        };

        expect(Array.isArray(imageData.sources)).toBe(true);
        expect(imageData.sources).toHaveLength(1);
        expect(imageData.fallback.src).toBe('/image.jpg');
        expect(imageData.placeholder?.src).toContain('data:image');
        expect(imageData.dimensions.width).toBe(800);
      });

      it('should validate LazyImageProps interface', () => {
        const props: LazyImageProps = {
          src: '/test-image.jpg',
          alt: 'Test image',
          width: 800,
          height: 600,
          className: 'test-class',
          optimization: {
            format: 'webp',
            quality: 85
          },
          loadingConfig: {
            lazy: true,
            priority: 'medium',
            rootMargin: '50px'
          },
          errorConfig: {
            fallbackSrc: '/fallback.jpg',
            retryAttempts: 3
          },
          onLoad: () => console.log('loaded'),
          onError: (error: Error) => console.error(error)
        };

        expect(props.src).toBe('/test-image.jpg');
        expect(props.alt).toBe('Test image');
        expect(props.optimization?.format).toBe('webp');
        expect(props.loadingConfig?.lazy).toBe(true);
        expect(props.errorConfig?.retryAttempts).toBe(3);
        expect(typeof props.onLoad).toBe('function');
        expect(typeof props.onError).toBe('function');
      });

      it('should validate OptimizedImageProps interface', () => {
        const props: OptimizedImageProps = {
          src: '/astro-image.jpg',
          alt: 'Astro optimized image',
          width: 1200,
          height: 800,
          quality: 90,
          format: 'avif',
          formats: ['avif', 'webp', 'jpeg'],
          fit: 'cover',
          responsive: [
            { breakpoint: 'sm', width: 400 },
            { breakpoint: 'md', width: 800 },
            { breakpoint: 'lg', width: 1200 }
          ],
          sizes: '(max-width: 640px) 400px, (max-width: 768px) 800px, 1200px',
          loading: 'lazy',
          priority: 'high',
          placeholder: true,
          fallbackSrc: '/fallback.jpg'
        };

        expect(props.src).toBe('/astro-image.jpg');
        expect(props.format).toBe('avif');
        expect(Array.isArray(props.formats)).toBe(true);
        expect(props.formats).toContain('avif');
        expect(props.fit).toBe('cover');
        expect(Array.isArray(props.responsive)).toBe(true);
        expect(props.responsive?.[0].breakpoint).toBe('sm');
        expect(props.loading).toBe('lazy');
        expect(props.priority).toBe('high');
      });
    });

    describe('Service Configuration Types', () => {
      it('should validate ImageServiceConfig interface', () => {
        const config: ImageServiceConfig = {
          baseUrl: 'https://images.example.com',
          apiKey: 'test-api-key',
          defaultQuality: 85,
          defaultFormat: 'webp',
          cacheTTL: 3600,
          maxCacheSize: 100,
          enableWebP: true,
          enableAVIF: true
        };

        expect(config.baseUrl).toBe('https://images.example.com');
        expect(config.defaultFormat).toBe('webp');
        expect(config.enableWebP).toBe(true);
        expect(config.enableAVIF).toBe(true);
        expect(typeof config.cacheTTL).toBe('number');

        // Test minimal config
        const minimalConfig: ImageServiceConfig = {
          baseUrl: 'https://cdn.example.com',
          defaultQuality: 80,
          defaultFormat: 'jpeg',
          cacheTTL: 1800,
          maxCacheSize: 50,
          enableWebP: false,
          enableAVIF: false
        };

        expect(minimalConfig.apiKey).toBeUndefined();
      });

      it('should validate BrowserCapabilities interface', () => {
        const capabilities: BrowserCapabilities = {
          supportsWebP: true,
          supportsAVIF: false,
          supportsLazyLoading: true,
          supportsIntersectionObserver: true,
          connectionType: '4g',
          devicePixelRatio: 2
        };

        expect(capabilities.supportsWebP).toBe(true);
        expect(capabilities.supportsAVIF).toBe(false);
        expect(capabilities.connectionType).toBe('4g');
        expect(capabilities.devicePixelRatio).toBe(2);

        // Test optional properties
        const minimalCapabilities: BrowserCapabilities = {
          supportsWebP: true,
          supportsAVIF: true,
          supportsLazyLoading: true,
          supportsIntersectionObserver: true,
          devicePixelRatio: 1
        };

        expect(minimalCapabilities.connectionType).toBeUndefined();
      });

      it('should validate ImagePerformanceMetrics interface', () => {
        const metrics: ImagePerformanceMetrics = {
          loadTime: 250,
          fileSize: 45000,
          format: 'webp',
          fromCache: false,
          renderTime: 300,
          firstPaint: 280
        };

        expect(metrics.loadTime).toBe(250);
        expect(metrics.fileSize).toBe(45000);
        expect(metrics.format).toBe('webp');
        expect(metrics.fromCache).toBe(false);
        expect(typeof metrics.renderTime).toBe('number');
        expect(typeof metrics.firstPaint).toBe('number');
      });

      it('should validate ImageOptimizationResponse interface', () => {
        const successResponse: ImageOptimizationResponse = {
          success: true,
          data: {
            sources: [],
            fallback: { src: '/test.jpg', width: 800, height: 600 },
            dimensions: { width: 800, height: 600 }
          },
          metrics: {
            loadTime: 150,
            fileSize: 30000,
            format: 'webp',
            fromCache: true
          }
        };

        expect(successResponse.success).toBe(true);
        expect(successResponse.data).toBeDefined();
        expect(successResponse.error).toBeUndefined();

        const errorResponse: ImageOptimizationResponse = {
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'Unsupported image format',
            details: { format: 'xyz' }
          }
        };

        expect(errorResponse.success).toBe(false);
        expect(errorResponse.error?.code).toBe('INVALID_FORMAT');
        expect(errorResponse.data).toBeUndefined();
      });
    });
  });

  describe('Analytics Types', () => {
    describe('Basic Analytics Types', () => {
      it('should validate AnalyticsProvider type', () => {
        const validProviders: AnalyticsProvider[] = ['ga4', 'plausible', 'custom', 'none'];
        
        validProviders.forEach(provider => {
          expect(typeof provider).toBe('string');
          expect(['ga4', 'plausible', 'custom', 'none']).toContain(provider);
        });
      });

      it('should validate GA4Config interface', () => {
        const config: GA4Config = {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          send_page_view: true,
          custom_map: {
            'custom_dimension_1': 'user_type',
            'custom_dimension_2': 'subscription_status'
          },
          additional_config: 'custom_value'
        };

        expect(config.anonymize_ip).toBe(true);
        expect(config.allow_google_signals).toBe(false);
        expect(config.custom_map?.['custom_dimension_1']).toBe('user_type');
        expect(config.additional_config).toBe('custom_value');
      });

      it('should validate PlausibleConfig interface', () => {
        const config: PlausibleConfig = {
          api: 'https://plausible.io/api/event',
          exclude: '/admin/*,/internal/*',
          include: '/*',
          manual: false,
          outbound_links: true,
          file_downloads: true,
          tagged_events: true,
          revenue: false,
          hash: false,
          custom_domain: 'analytics.example.com'
        };

        expect(config.api).toBe('https://plausible.io/api/event');
        expect(config.outbound_links).toBe(true);
        expect(config.file_downloads).toBe(true);
        expect(config.custom_domain).toBe('analytics.example.com');
      });
    });

    describe('Analytics Configuration', () => {
      it('should validate AnalyticsConfig interface', () => {
        const config: AnalyticsConfig = {
          provider: 'ga4',
          ga4: {
            measurementId: 'GA_MEASUREMENT_ID',
            config: {
              anonymize_ip: true,
              send_page_view: true
            }
          },
          privacy: {
            consentRequired: true,
            anonymizeIP: true,
            cookieLess: false
          },
          features: {
            trackPerformance: true,
            trackErrors: true,
            debug: false
          }
        };

        expect(config.provider).toBe('ga4');
        expect(config.ga4?.measurementId).toBe('GA_MEASUREMENT_ID');
        expect(config.ga4?.config.anonymize_ip).toBe(true);
        expect(config.privacy.consentRequired).toBe(true);
        expect(config.features.trackPerformance).toBe(true);

        // Test different provider
        const plausibleConfig: AnalyticsConfig = {
          provider: 'plausible',
          plausible: {
            domain: 'example.com',
            src: 'https://plausible.io/js/script.js',
            options: {
              outbound_links: true
            }
          },
          privacy: {
            consentRequired: false,
            anonymizeIP: true,
            cookieLess: true
          },
          features: {
            trackPerformance: false,
            trackErrors: true,
            debug: true
          }
        };

        expect(plausibleConfig.provider).toBe('plausible');
        expect(plausibleConfig.plausible?.domain).toBe('example.com');
        expect(plausibleConfig.privacy.cookieLess).toBe(true);
      });

      it('should validate ConsentStatus interface', () => {
        const consent: ConsentStatus = {
          granted: true,
          timestamp: Date.now(),
          version: '1.0.0'
        };

        expect(consent.granted).toBe(true);
        expect(typeof consent.timestamp).toBe('number');
        expect(consent.version).toBe('1.0.0');
      });
    });

    describe('Event Types', () => {
      it('should validate AnalyticsEvent interface', () => {
        const event: AnalyticsEvent = {
          name: 'button_click',
          properties: {
            button_id: 'cta-primary',
            page: '/software-engineer',
            user_type: 'visitor'
          },
          timestamp: Date.now()
        };

        expect(event.name).toBe('button_click');
        expect(event.properties?.button_id).toBe('cta-primary');
        expect(typeof event.timestamp).toBe('number');

        // Test minimal event
        const minimalEvent: AnalyticsEvent = {
          name: 'page_scroll'
        };

        expect(minimalEvent.properties).toBeUndefined();
        expect(minimalEvent.timestamp).toBeUndefined();
      });

      it('should validate PageViewEvent interface', () => {
        const pageView: PageViewEvent = {
          path: '/software-engineer',
          title: 'Software Engineer Portfolio',
          referrer: 'https://google.com',
          timestamp: Date.now()
        };

        expect(pageView.path).toBe('/software-engineer');
        expect(pageView.title).toBe('Software Engineer Portfolio');
        expect(pageView.referrer).toBe('https://google.com');
        expect(typeof pageView.timestamp).toBe('number');
      });

      it('should validate WebVitalMetric interface', () => {
        const lcpMetric: WebVitalMetric = {
          name: 'LCP',
          value: 1250,
          rating: 'good',
          timestamp: Date.now()
        };

        expect(lcpMetric.name).toBe('LCP');
        expect(lcpMetric.value).toBe(1250);
        expect(lcpMetric.rating).toBe('good');
        expect(['good', 'needs_improvement', 'poor']).toContain(lcpMetric.rating);

        const clsMetric: WebVitalMetric = {
          name: 'CLS',
          value: 0.25,
          rating: 'poor',
          timestamp: Date.now()
        };

        expect(clsMetric.name).toBe('CLS');
        expect(clsMetric.rating).toBe('poor');
      });

      it('should validate ErrorEvent interface', () => {
        const error: ErrorEvent = {
          message: 'TypeError: Cannot read property of undefined',
          filename: '/js/bundle.js',
          lineno: 245,
          colno: 12,
          stack: 'TypeError: Cannot read property...\n    at function1 (/js/bundle.js:245:12)',
          timestamp: Date.now()
        };

        expect(error.message).toContain('TypeError');
        expect(error.filename).toBe('/js/bundle.js');
        expect(error.lineno).toBe(245);
        expect(error.colno).toBe(12);
        expect(error.stack).toContain('TypeError');
        expect(typeof error.timestamp).toBe('number');
      });

      it('should validate PerformanceMetrics interface', () => {
        const metrics: PerformanceMetrics = {
          dns_time: 45,
          connect_time: 120,
          request_time: 200,
          dom_load_time: 850,
          total_load_time: 1200
        };

        expect(metrics.dns_time).toBe(45);
        expect(metrics.connect_time).toBe(120);
        expect(metrics.request_time).toBe(200);
        expect(metrics.dom_load_time).toBe(850);
        expect(metrics.total_load_time).toBe(1200);

        // All properties are optional
        const partialMetrics: PerformanceMetrics = {
          total_load_time: 1500
        };

        expect(partialMetrics.dns_time).toBeUndefined();
        expect(partialMetrics.total_load_time).toBe(1500);
      });
    });

    describe('Analytics Manager Interface', () => {
      it('should validate AnalyticsManager interface structure', () => {
        // This test validates the interface structure exists and has correct method signatures
        // In a real implementation, this would be tested with an actual implementation
        
        const mockAnalyticsManager: AnalyticsManager = {
          initialized: false,
          provider: 'ga4',
          consentGiven: false,
          
          init: vi.fn(),
          checkConsent: vi.fn().mockReturnValue(false),
          setConsent: vi.fn(),
          showConsentBanner: vi.fn(),
          
          trackEvent: vi.fn(),
          trackPageView: vi.fn(),
          
          loadProvider: vi.fn(),
          loadGoogleAnalytics: vi.fn(),
          loadPlausible: vi.fn(),
          loadCustomAnalytics: vi.fn(),
          
          setupErrorTracking: vi.fn(),
          setupPerformanceTracking: vi.fn()
        };

        expect(typeof mockAnalyticsManager.init).toBe('function');
        expect(typeof mockAnalyticsManager.checkConsent).toBe('function');
        expect(typeof mockAnalyticsManager.trackEvent).toBe('function');
        expect(typeof mockAnalyticsManager.trackPageView).toBe('function');
        expect(mockAnalyticsManager.provider).toBe('ga4');
        expect(mockAnalyticsManager.initialized).toBe(false);
        expect(mockAnalyticsManager.consentGiven).toBe(false);

        // Test method calls
        mockAnalyticsManager.init();
        expect(mockAnalyticsManager.init).toHaveBeenCalled();

        const consentStatus = mockAnalyticsManager.checkConsent();
        expect(mockAnalyticsManager.checkConsent).toHaveBeenCalled();
        expect(consentStatus).toBe(false);

        mockAnalyticsManager.trackEvent('test_event', { property: 'value' });
        expect(mockAnalyticsManager.trackEvent).toHaveBeenCalledWith('test_event', { property: 'value' });

        mockAnalyticsManager.trackPageView('/test-page', 'Test Page');
        expect(mockAnalyticsManager.trackPageView).toHaveBeenCalledWith('/test-page', 'Test Page');
      });
    });
  });

  describe('Type Integration and Compatibility', () => {
    it('should allow proper type composition', () => {
      // Test that types can be composed and extended properly
      interface ExtendedImageProps extends LazyImageProps {
        customProperty: string;
        onCustomEvent: (data: any) => void;
      }

      const extendedProps: ExtendedImageProps = {
        src: '/extended-image.jpg',
        alt: 'Extended image',
        customProperty: 'custom-value',
        onCustomEvent: (data) => console.log(data),
        loadingConfig: {
          lazy: true,
          priority: 'high'
        }
      };

      expect(extendedProps.src).toBe('/extended-image.jpg');
      expect(extendedProps.customProperty).toBe('custom-value');
      expect(typeof extendedProps.onCustomEvent).toBe('function');
      expect(extendedProps.loadingConfig?.priority).toBe('high');
    });

    it('should allow proper union types', () => {
      // Test union types work correctly
      type ImageOrAnalyticsConfig = ImageServiceConfig | AnalyticsConfig;

      const imageConfig: ImageOrAnalyticsConfig = {
        baseUrl: 'https://images.example.com',
        defaultQuality: 85,
        defaultFormat: 'webp',
        cacheTTL: 3600,
        maxCacheSize: 100,
        enableWebP: true,
        enableAVIF: true
      };

      const analyticsConfig: ImageOrAnalyticsConfig = {
        provider: 'plausible',
        privacy: {
          consentRequired: true,
          anonymizeIP: true,
          cookieLess: false
        },
        features: {
          trackPerformance: true,
          trackErrors: true,
          debug: false
        }
      };

      expect('baseUrl' in imageConfig).toBe(true);
      expect('provider' in analyticsConfig).toBe(true);
    });

    it('should allow proper generic usage', () => {
      // Test generic type usage
      interface APIResponse<T> {
        success: boolean;
        data?: T;
        error?: string;
      }

      const imageResponse: APIResponse<OptimizedImageData> = {
        success: true,
        data: {
          sources: [],
          fallback: { src: '/test.jpg', width: 800, height: 600 },
          dimensions: { width: 800, height: 600 }
        }
      };

      const analyticsResponse: APIResponse<AnalyticsEvent> = {
        success: true,
        data: {
          name: 'page_view',
          properties: { path: '/' }
        }
      };

      expect(imageResponse.success).toBe(true);
      expect(imageResponse.data?.dimensions.width).toBe(800);
      expect(analyticsResponse.data?.name).toBe('page_view');
    });

    it('should validate optional vs required properties', () => {
      // Test that optional properties work correctly
      const minimalImageDimensions: ImageDimensions = {
        width: 400,
        height: 300
        // aspectRatio is optional
      };

      const fullImageDimensions: ImageDimensions = {
        width: 800,
        height: 600,
        aspectRatio: 4/3
      };

      expect(minimalImageDimensions.aspectRatio).toBeUndefined();
      expect(fullImageDimensions.aspectRatio).toBe(4/3);

      // Test required properties are enforced by TypeScript
      // This would be caught at compile time, not runtime
      expect(minimalImageDimensions.width).toBe(400);
      expect(minimalImageDimensions.height).toBe(300);
    });

    it('should validate discriminated unions', () => {
      // Test discriminated unions work correctly
      type ConfigByProvider = 
        | { provider: 'ga4'; ga4Config: GA4Config }
        | { provider: 'plausible'; plausibleConfig: PlausibleConfig }
        | { provider: 'none' };

      const ga4Config: ConfigByProvider = {
        provider: 'ga4',
        ga4Config: {
          anonymize_ip: true,
          send_page_view: true
        }
      };

      const plausibleConfig: ConfigByProvider = {
        provider: 'plausible',
        plausibleConfig: {
          outbound_links: true,
          file_downloads: true
        }
      };

      const noneConfig: ConfigByProvider = {
        provider: 'none'
      };

      expect(ga4Config.provider).toBe('ga4');
      expect(plausibleConfig.provider).toBe('plausible');
      expect(noneConfig.provider).toBe('none');

      // TypeScript ensures only the correct config is present
      if (ga4Config.provider === 'ga4') {
        expect(ga4Config.ga4Config.anonymize_ip).toBe(true);
      }
    });
  });

  describe('Type Compatibility with Libraries', () => {
    it('should be compatible with React prop types', () => {
      // Simulate React.CSSProperties compatibility
      const reactStyle: React.CSSProperties = {
        width: '100%',
        height: 'auto',
        objectFit: 'cover' as const
      };

      const imageProps: LazyImageProps = {
        src: '/test.jpg',
        alt: 'Test',
        style: reactStyle
      };

      expect(imageProps.style?.width).toBe('100%');
      expect(imageProps.style?.objectFit).toBe('cover');
    });

    it('should work with event handler types', () => {
      // Test event handler compatibility
      const handleLoad = (): void => {
        console.log('Image loaded');
      };

      const handleError = (error: Error): void => {
        console.error('Image error:', error);
      };

      const props: LazyImageProps = {
        src: '/test.jpg',
        alt: 'Test',
        onLoad: handleLoad,
        onError: handleError
      };

      expect(typeof props.onLoad).toBe('function');
      expect(typeof props.onError).toBe('function');

      // Test that handlers can be called with correct parameters
      if (props.onLoad) {
        props.onLoad(); // Should not throw
      }

      if (props.onError) {
        props.onError(new Error('Test error')); // Should not throw
      }
    });
  });

  describe('Environment and Runtime Type Safety', () => {
    it('should validate browser API compatibility', () => {
      // Test that browser capabilities align with actual browser APIs
      const capabilities: BrowserCapabilities = {
        supportsWebP: true,
        supportsAVIF: false,
        supportsLazyLoading: 'loading' in HTMLImageElement.prototype,
        supportsIntersectionObserver: typeof IntersectionObserver !== 'undefined',
        devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
      };

      expect(typeof capabilities.supportsLazyLoading).toBe('boolean');
      expect(typeof capabilities.supportsIntersectionObserver).toBe('boolean');
      expect(typeof capabilities.devicePixelRatio).toBe('number');
    });

    it('should validate performance API compatibility', () => {
      // Test that performance metrics align with Performance API
      const mockPerformanceEntry = {
        connectEnd: 150,
        connectStart: 100,
        domContentLoadedEventEnd: 1200,
        loadEventEnd: 1500,
        requestStart: 120,
        responseEnd: 300
      };

      const metrics: PerformanceMetrics = {
        dns_time: mockPerformanceEntry.connectEnd - mockPerformanceEntry.connectStart,
        connect_time: mockPerformanceEntry.connectEnd - mockPerformanceEntry.connectStart,
        request_time: mockPerformanceEntry.responseEnd - mockPerformanceEntry.requestStart,
        dom_load_time: mockPerformanceEntry.domContentLoadedEventEnd,
        total_load_time: mockPerformanceEntry.loadEventEnd
      };

      expect(metrics.dns_time).toBe(50);
      expect(metrics.connect_time).toBe(50);
      expect(metrics.request_time).toBe(180);
      expect(metrics.dom_load_time).toBe(1200);
      expect(metrics.total_load_time).toBe(1500);
    });
  });
});