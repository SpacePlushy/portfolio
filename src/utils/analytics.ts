/**
 * Analytics Utility Functions
 * Helper functions for working with the analytics system
 */

import type { AnalyticsConfig, AnalyticsProvider, AnalyticsEnvironment } from '@/types/analytics';

/**
 * Parse analytics configuration from environment variables
 */
export function parseAnalyticsConfig(env: Partial<AnalyticsEnvironment>): AnalyticsConfig {
  const provider = (env.ANALYTICS_PROVIDER || 'none') as AnalyticsProvider;
  
  return {
    provider,
    
    // Parse provider-specific configurations
    ga4: provider === 'ga4' && env.GA4_MEASUREMENT_ID ? {
      measurementId: env.GA4_MEASUREMENT_ID,
      config: env.GA4_CONFIG_OPTIONS ? JSON.parse(env.GA4_CONFIG_OPTIONS) : {}
    } : undefined,
    
    plausible: provider === 'plausible' && env.PLAUSIBLE_DOMAIN ? {
      domain: env.PLAUSIBLE_DOMAIN,
      src: env.PLAUSIBLE_SRC || 'https://plausible.io/js/script.js',
      options: env.PLAUSIBLE_OPTIONS ? JSON.parse(env.PLAUSIBLE_OPTIONS) : {}
    } : undefined,
    
    custom: provider === 'custom' && env.CUSTOM_ANALYTICS_SRC ? {
      src: env.CUSTOM_ANALYTICS_SRC,
      config: env.CUSTOM_ANALYTICS_CONFIG ? JSON.parse(env.CUSTOM_ANALYTICS_CONFIG) : {}
    } : undefined,
    
    // Parse privacy settings
    privacy: {
      consentRequired: env.ANALYTICS_CONSENT_REQUIRED !== 'false',
      anonymizeIP: env.ANALYTICS_ANONYMIZE_IP !== 'false',
      cookieLess: env.ANALYTICS_COOKIE_LESS === 'true'
    },
    
    // Parse feature flags
    features: {
      trackPerformance: env.ANALYTICS_TRACK_PERFORMANCE !== 'false',
      trackErrors: env.ANALYTICS_TRACK_ERRORS !== 'false',
      debug: env.ANALYTICS_DEBUG === 'true' || process.env.NODE_ENV === 'development'
    }
  };
}

/**
 * Validate analytics configuration
 */
export function validateAnalyticsConfig(config: AnalyticsConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (config.provider === 'ga4' && !config.ga4?.measurementId) {
    errors.push('GA4 provider requires GA4_MEASUREMENT_ID environment variable');
  }
  
  if (config.provider === 'plausible' && !config.plausible?.domain) {
    errors.push('Plausible provider requires PLAUSIBLE_DOMAIN environment variable');
  }
  
  if (config.provider === 'custom' && !config.custom?.src) {
    errors.push('Custom provider requires CUSTOM_ANALYTICS_SRC environment variable');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get analytics provider display name
 */
export function getProviderDisplayName(provider: AnalyticsProvider): string {
  switch (provider) {
    case 'ga4':
      return 'Google Analytics 4';
    case 'plausible':
      return 'Plausible Analytics';
    case 'custom':
      return 'Custom Analytics';
    case 'none':
    default:
      return 'No Analytics';
  }
}

/**
 * Check if analytics tracking is enabled for current environment
 */
export function isAnalyticsEnabled(config: AnalyticsConfig): boolean {
  if (config.provider === 'none') return false;
  
  const validation = validateAnalyticsConfig(config);
  return validation.valid;
}

/**
 * Client-side analytics helpers (for use in browser)
 */
export const clientAnalytics = {
  /**
   * Track a custom event (works with any provider)
   */
  trackEvent(name: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.AnalyticsManager) {
      window.AnalyticsManager.trackEvent(name, properties);
    }
  },
  
  /**
   * Track a page view (works with any provider)
   */
  trackPageView(path?: string, title?: string) {
    if (typeof window !== 'undefined' && window.AnalyticsManager) {
      const actualPath = path || window.location.pathname;
      const actualTitle = title || document.title;
      window.AnalyticsManager.trackPageView(actualPath, actualTitle);
    }
  },
  
  /**
   * Check if analytics consent has been given
   */
  hasConsent(): boolean {
    if (typeof window !== 'undefined' && window.AnalyticsManager) {
      return window.AnalyticsManager.consentGiven;
    }
    return false;
  },
  
  /**
   * Grant or revoke analytics consent
   */
  setConsent(granted: boolean) {
    if (typeof window !== 'undefined' && window.AnalyticsManager) {
      window.AnalyticsManager.setConsent(granted);
    }
  },
  
  /**
   * Check if analytics is initialized and ready
   */
  isReady(): boolean {
    if (typeof window !== 'undefined' && window.AnalyticsManager) {
      return window.AnalyticsManager.initialized;
    }
    return false;
  }
};

/**
 * Analytics event helpers - pre-defined common events
 */
export const events = {
  // Navigation events
  pageView: (path: string, title?: string) => 
    clientAnalytics.trackPageView(path, title),
  
  // User interaction events
  buttonClick: (buttonName: string, location?: string) => 
    clientAnalytics.trackEvent('button_click', { button_name: buttonName, location }),
  
  linkClick: (url: string, text?: string, external?: boolean) => 
    clientAnalytics.trackEvent('link_click', { url, text, external }),
  
  formSubmit: (formName: string, success?: boolean) => 
    clientAnalytics.trackEvent('form_submit', { form_name: formName, success }),
  
  // Content engagement events
  fileDownload: (filename: string, type?: string) => 
    clientAnalytics.trackEvent('file_download', { filename, type }),
  
  videoPlay: (videoTitle: string, duration?: number) => 
    clientAnalytics.trackEvent('video_play', { video_title: videoTitle, duration }),
  
  searchQuery: (query: string, results?: number) => 
    clientAnalytics.trackEvent('search', { query, results }),
  
  // E-commerce events (if applicable)
  productView: (productId: string, productName?: string, category?: string) => 
    clientAnalytics.trackEvent('product_view', { product_id: productId, product_name: productName, category }),
  
  // Custom portfolio events
  portfolioView: (projectName: string, category?: string) => 
    clientAnalytics.trackEvent('portfolio_view', { project_name: projectName, category }),
  
  contactAttempt: (method: string) => 
    clientAnalytics.trackEvent('contact_attempt', { method }),
  
  themeToggle: (theme: string) => 
    clientAnalytics.trackEvent('theme_toggle', { theme }),
  
  errorEncountered: (errorType: string, message?: string) => 
    clientAnalytics.trackEvent('error_encountered', { error_type: errorType, message })
};