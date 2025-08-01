/**
 * Analytics Configuration Types
 * Provides type safety for analytics providers and configurations
 */

export type AnalyticsProvider = 'ga4' | 'plausible' | 'custom' | 'none';

export interface GA4Config {
  anonymize_ip?: boolean;
  allow_google_signals?: boolean;
  allow_ad_personalization_signals?: boolean;
  send_page_view?: boolean;
  custom_map?: Record<string, string>;
  [key: string]: any;
}

export interface PlausibleConfig {
  api?: string;
  exclude?: string;
  include?: string;
  manual?: boolean;
  outbound_links?: boolean;
  file_downloads?: boolean;
  tagged_events?: boolean;
  revenue?: boolean;
  hash?: boolean;
  [key: string]: any;
}

export interface CustomAnalyticsConfig {
  endpoint?: string;
  apiKey?: string;
  trackingOptions?: Record<string, any>;
  [key: string]: any;
}

export interface AnalyticsEnvironment {
  ANALYTICS_PROVIDER: AnalyticsProvider;
  
  // Google Analytics 4
  GA4_MEASUREMENT_ID?: string;
  GA4_CONFIG_OPTIONS?: string; // JSON string
  
  // Plausible Analytics
  PLAUSIBLE_DOMAIN?: string;
  PLAUSIBLE_SRC?: string;
  PLAUSIBLE_OPTIONS?: string; // JSON string
  
  // Custom Analytics
  CUSTOM_ANALYTICS_SRC?: string;
  CUSTOM_ANALYTICS_CONFIG?: string; // JSON string
  
  // Privacy and Compliance
  ANALYTICS_CONSENT_REQUIRED?: string; // 'true' | 'false'
  ANALYTICS_ANONYMIZE_IP?: string; // 'true' | 'false'
  ANALYTICS_COOKIE_LESS?: string; // 'true' | 'false'
  
  // Feature Toggles
  ANALYTICS_TRACK_PERFORMANCE?: string; // 'true' | 'false'
  ANALYTICS_TRACK_ERRORS?: string; // 'true' | 'false'
  ANALYTICS_DEBUG?: string; // 'true' | 'false'
}

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  
  // Provider-specific configurations
  ga4?: {
    measurementId: string;
    config: GA4Config;
  };
  
  plausible?: {
    domain: string;
    src: string;
    options: PlausibleConfig;
  };
  
  custom?: {
    src: string;
    config: CustomAnalyticsConfig;
  };
  
  // Privacy settings
  privacy: {
    consentRequired: boolean;
    anonymizeIP: boolean;
    cookieLess: boolean;
  };
  
  // Feature flags
  features: {
    trackPerformance: boolean;
    trackErrors: boolean;
    debug: boolean;
  };
}

export interface ConsentStatus {
  granted: boolean;
  timestamp: number;
  version: string;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface PageViewEvent {
  path: string;
  title?: string;
  referrer?: string;
  timestamp?: number;
}

export interface PerformanceMetrics {
  dns_time?: number;
  connect_time?: number;
  request_time?: number;
  dom_load_time?: number;
  total_load_time?: number;
}

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS';
  value: number;
  rating: 'good' | 'needs_improvement' | 'poor';
  timestamp: number;
}

export interface ErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  timestamp: number;
}

export interface AnalyticsManager {
  initialized: boolean;
  provider: AnalyticsProvider;
  consentGiven: boolean;
  
  init(): void;
  checkConsent(): boolean;
  setConsent(granted: boolean): void;
  showConsentBanner(): void;
  
  trackEvent(name: string, properties?: Record<string, any>): void;
  trackPageView(path: string, title?: string): void;
  
  loadProvider(): void;
  loadGoogleAnalytics(): void;
  loadPlausible(): void;
  loadCustomAnalytics(): void;
  
  setupErrorTracking(): void;
  setupPerformanceTracking(): void;
}

// Global window extensions for analytics
declare global {
  interface Window {
    AnalyticsManager: AnalyticsManager;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    plausible?: (...args: any[]) => void;
    customAnalytics?: {
      track: (event: string, properties?: Record<string, any>) => void;
      pageview: (path: string, title?: string) => void;
      [key: string]: any;
    };
    customAnalyticsConfig?: CustomAnalyticsConfig;
  }
}

export {};