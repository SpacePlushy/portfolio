/**
 * Image optimization system types
 * Comprehensive type definitions for image handling, optimization, and display
 */

// Supported image formats in order of preference
export type ImageFormat = 'avif' | 'webp' | 'jpeg' | 'png' | 'gif';

// Image loading states
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

// Responsive breakpoints
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Image fit modes
export type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

// Priority levels for image loading
export type LoadingPriority = 'high' | 'medium' | 'low';

/**
 * Breakpoint configuration for responsive images
 */
export interface BreakpointConfig {
  xs: number;  // 0px
  sm: number;  // 640px
  md: number;  // 768px
  lg: number;  // 1024px
  xl: number;  // 1280px
  '2xl': number; // 1536px
}

/**
 * Responsive image source configuration
 */
export interface ResponsiveSource {
  breakpoint: Breakpoint;
  width: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
}

/**
 * Image dimensions interface
 */
export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio?: number;
}

/**
 * Image optimization parameters
 */
export interface ImageOptimizationParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: ObjectFit;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

/**
 * Optimized image source with multiple formats and sizes
 */
export interface OptimizedImageSource {
  src: string;
  srcSet: string;
  sizes: string;
  format: ImageFormat;
  width: number;
  height: number;
  quality: number;
}

/**
 * Complete optimized image data
 */
export interface OptimizedImageData {
  sources: OptimizedImageSource[];
  fallback: {
    src: string;
    width: number;
    height: number;
  };
  placeholder?: {
    src: string; // Low-quality placeholder or blur data URL
    width: number;
    height: number;
  };
  dimensions: ImageDimensions;
}

/**
 * Image loading configuration
 */
export interface ImageLoadingConfig {
  lazy?: boolean;
  priority?: LoadingPriority;
  rootMargin?: string;
  threshold?: number | number[];
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Error handling configuration
 */
export interface ImageErrorConfig {
  fallbackSrc?: string;
  retryAttempts?: number;
  retryDelay?: number;
  onError?: (error: Error, attempts: number) => void;
}

/**
 * Base props for all image components
 */
export interface BaseImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

/**
 * Props for OptimizedImage Astro component
 */
export interface OptimizedImageProps extends BaseImageProps {
  // Optimization settings
  quality?: number;
  format?: ImageFormat;
  formats?: ImageFormat[];
  fit?: ObjectFit;
  
  // Responsive settings
  responsive?: ResponsiveSource[];
  sizes?: string;
  
  // Loading settings
  loading?: 'lazy' | 'eager';
  priority?: LoadingPriority;
  placeholder?: boolean | string;
  blurDataURL?: string;
  
  // Error handling
  fallbackSrc?: string;
  onError?: string; // Astro component callback as string
  
  // Accessibility
  role?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Props for LazyImage React component
 */
export interface LazyImageProps extends BaseImageProps {
  // Optimization settings
  optimization?: ImageOptimizationParams;
  responsive?: ResponsiveSource[];
  
  // Loading configuration
  loadingConfig?: ImageLoadingConfig;
  errorConfig?: ImageErrorConfig;
  
  // Visual states
  placeholder?: React.ReactNode | string;
  blurDataURL?: string;
  showLoadingSpinner?: boolean;
  
  // Callbacks
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onIntersect?: (isIntersecting: boolean) => void;
  
  // Advanced options
  preload?: boolean;
  criticalResource?: boolean;
  
  // Accessibility
  role?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Intersection Observer configuration
 */
export interface IntersectionConfig {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

/**
 * Image cache entry
 */
export interface ImageCacheEntry {
  src: string;
  optimizedData: OptimizedImageData;
  timestamp: number;
  hits: number;
}

/**
 * Image service configuration
 */
export interface ImageServiceConfig {
  baseUrl: string;
  apiKey?: string;
  defaultQuality: number;
  defaultFormat: ImageFormat;
  cacheTTL: number;
  maxCacheSize: number;
  enableWebP: boolean;
  enableAVIF: boolean;
}

/**
 * Browser capability detection results
 */
export interface BrowserCapabilities {
  supportsWebP: boolean;
  supportsAVIF: boolean;
  supportsLazyLoading: boolean;
  supportsIntersectionObserver: boolean;
  connectionType?: 'slow-2g' | '2g' | '3g' | '4g';
  devicePixelRatio: number;
}

/**
 * Performance metrics for image loading
 */
export interface ImagePerformanceMetrics {
  loadTime: number;
  fileSize: number;
  format: ImageFormat;
  fromCache: boolean;
  renderTime?: number;
  firstPaint?: number;
}

/**
 * Image optimization API response
 */
export interface ImageOptimizationResponse {
  success: boolean;
  data?: OptimizedImageData;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metrics?: ImagePerformanceMetrics;
}

/**
 * Utility type for component ref forwarding
 */
export type ImageRef = HTMLImageElement | null;

/**
 * Event handlers type for image components
 */
export interface ImageEventHandlers {
  onLoad?: (event: Event) => void;
  onError?: (event: ErrorEvent) => void;
  onLoadStart?: (event: Event) => void;
  onProgress?: (event: ProgressEvent) => void;
}