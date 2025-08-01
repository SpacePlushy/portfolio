/**
 * LazyImage - Advanced React component with Intersection Observer
 * 
 * Features:
 * - Intersection Observer API for performance
 * - Advanced lazy loading with customizable thresholds
 * - Blur placeholder with smooth transitions
 * - Error handling with retry logic
 * - Performance monitoring
 * - Accessibility compliance
 * - TypeScript support
 */

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  forwardRef,
  useMemo
} from 'react';
import './LazyImage.module.css';
import type { 
  LazyImageProps,
  LoadingState,
  IntersectionConfig,
  ImagePerformanceMetrics,
  ImageRef
} from '../types/image';
import {
  generateResponsiveSources,
  buildOptimizedImageUrl,
  generateBlurPlaceholder,
  preloadImage,
  debounce,
  prefersReducedMotion
} from '../utils/image';

/**
 * Custom hook for Intersection Observer
 */
function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  config: IntersectionConfig = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  
  const {
    root = null,
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true
  } = config;
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      setIsIntersecting(true);
      setHasIntersected(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        }
      },
      { root, rootMargin, threshold }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, triggerOnce, hasIntersected]);
  
  return { isIntersecting, hasIntersected };
}

/**
 * Custom hook for image loading with retry logic
 */
function useImageLoader(src: string, retryAttempts = 3, retryDelay = 1000) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [attempts, setAttempts] = useState(0);
  const [metrics, setMetrics] = useState<ImagePerformanceMetrics | null>(null);
  
  const loadImage = useCallback(async () => {
    if (!src || loadingState === 'loaded') return;
    
    setLoadingState('loading');
    const startTime = performance.now();
    
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = src;
      });
      
      const loadTime = performance.now() - startTime;
      setMetrics({
        loadTime,
        fileSize: 0, // Would need additional API call to get this
        format: src.includes('avif') ? 'avif' : src.includes('webp') ? 'webp' : 'jpeg',
        fromCache: loadTime < 50, // Heuristic for cache detection
        renderTime: performance.now(),
      });
      
      setLoadingState('loaded');
    } catch (error) {
      if (attempts < retryAttempts) {
        setTimeout(() => {
          setAttempts(prev => prev + 1);
          loadImage();
        }, retryDelay * Math.pow(2, attempts)); // Exponential backoff
      } else {
        setLoadingState('error');
      }
    }
  }, [src, loadingState, attempts, retryAttempts, retryDelay]);
  
  return { loadingState, loadImage, metrics, attempts };
}

/**
 * LazyImage component with advanced features
 */
export const LazyImage = forwardRef<ImageRef, LazyImageProps>(({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  optimization = {},
  responsive = [],
  loadingConfig = {},
  errorConfig = {},
  placeholder,
  blurDataURL,
  showLoadingSpinner = false,
  onLoad,
  onError,
  onIntersect,
  preload = false,
  criticalResource = false,
  role,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': testId,
  ...restProps
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Merge refs
  const mergedImageRef = useCallback((node: HTMLImageElement | null) => {
    imageRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);
  
  // Intersection Observer configuration
  const intersectionConfig: IntersectionConfig = {
    rootMargin: loadingConfig.rootMargin || '50px',
    threshold: loadingConfig.threshold || 0.1,
    triggerOnce: true,
  };
  
  const { isIntersecting, hasIntersected } = useIntersectionObserver(
    containerRef as React.RefObject<Element>,
    intersectionConfig
  );
  
  // Generate optimized image URL
  const optimizedSrc = useMemo(() => {
    if (!src) return '';
    return buildOptimizedImageUrl(src, {
      width: width || optimization.width,
      height: height || optimization.height,
      quality: optimization.quality || 80,
      format: optimization.format,
      fit: optimization.fit || 'cover',
      ...optimization,
    });
  }, [src, width, height, optimization]);
  
  // Image loading logic
  const shouldLoad = criticalResource || preload || hasIntersected;
  const { loadingState, loadImage, metrics } = useImageLoader(
    shouldLoad ? optimizedSrc : '',
    errorConfig.retryAttempts || 3,
    errorConfig.retryDelay || 1000
  );
  
  // Generate blur placeholder
  const placeholderSrc = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder === false) return '';
    if (typeof placeholder === 'string') return placeholder;
    
    return generateBlurPlaceholder(
      Math.min(width || 20, 20),
      Math.min(height || 15, 15),
      '#f3f4f6'
    );
  }, [blurDataURL, placeholder, width, height]);
  
  // Generate responsive sources
  const responsiveSources = useMemo(() => {
    if (responsive.length === 0 || !src) return [];
    return generateResponsiveSources(src, responsive, optimization);
  }, [src, responsive, optimization]);
  
  // Handle intersection changes
  useEffect(() => {
    onIntersect?.(isIntersecting);
  }, [isIntersecting, onIntersect]);
  
  // Load image when it should be loaded
  useEffect(() => {
    if (shouldLoad && loadingState === 'idle') {
      loadImage();
    }
  }, [shouldLoad, loadImage, loadingState]);
  
  // Preload critical images
  useEffect(() => {
    if (preload && optimizedSrc) {
      preloadImage(optimizedSrc, criticalResource ? 'high' : 'low');
    }
  }, [preload, optimizedSrc, criticalResource]);
  
  // Handle load success
  const handleLoad = useCallback((_event: React.SyntheticEvent<HTMLImageElement>) => {
    onLoad?.();
    
    // Dispatch performance metrics
    if (metrics) {
      const customEvent = new CustomEvent('lazy-image-loaded', {
        detail: { src: optimizedSrc, metrics }
      });
      document.dispatchEvent(customEvent);
    }
  }, [onLoad, metrics, optimizedSrc]);
  
  // Handle load error
  const handleError = useCallback((_event: React.SyntheticEvent<HTMLImageElement>) => {
    const error = new Error(`Failed to load image: ${optimizedSrc}`);
    onError?.(error);
    errorConfig.onError?.(error, 0);
    
    // Try fallback if available
    if (errorConfig.fallbackSrc && imageRef.current) {
      imageRef.current.src = errorConfig.fallbackSrc;
    }
  }, [onError, errorConfig, optimizedSrc]);
  
  // Debounced resize handler for responsive images
  const handleResize = useMemo(
    () => debounce(() => {
      // Trigger re-evaluation of responsive sources if needed
      if (responsive.length > 0) {
        // Implementation would go here
      }
    }, 250),
    [responsive]
  );
  
  useEffect(() => {
    if (responsive.length > 0) {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [handleResize, responsive]);
  
  // Generate CSS classes
  const containerClasses = [
    'lazy-image-container',
    className,
    loadingState === 'loading' && 'lazy-image-loading',
    loadingState === 'loaded' && 'lazy-image-loaded',
    loadingState === 'error' && 'lazy-image-error',
  ].filter(Boolean).join(' ');
  
  // Generate container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    ...style,
    ...(width && height && {
      aspectRatio: `${width} / ${height}`,
    }),
  };
  
  // Generate image styles
  const imageStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: 'auto',
    transition: prefersReducedMotion() ? 'none' : 'opacity 0.3s ease-in-out',
    opacity: loadingState === 'loaded' ? 1 : 0,
  };
  
  // Generate placeholder styles
  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: placeholderSrc ? `url(${placeholderSrc})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(10px)',
    transform: 'scale(1.1)',
    transition: prefersReducedMotion() ? 'none' : 'opacity 0.3s ease-in-out',
    opacity: loadingState === 'loaded' ? 0 : 1,
    pointerEvents: 'none' as const,
    zIndex: -1,
  };
  
  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={containerStyle}
      data-testid={testId}
    >
      {/* Main image or picture element */}
      {responsiveSources.length > 0 ? (
        <picture>
          {responsiveSources.map((source, index) => (
            <source
              key={index}
              srcSet={source.srcSet}
              sizes={source.sizes}
              type={`image/${source.format}`}
            />
          ))}
          <img
            ref={mergedImageRef}
            src={shouldLoad ? optimizedSrc : ''}
            alt={alt}
            width={width}
            height={height}
            style={imageStyle}
            onLoad={handleLoad}
            onError={handleError}
            role={role}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            loading={loadingConfig.lazy !== false ? 'lazy' : 'eager'}
            fetchPriority={loadingConfig.fetchPriority || 'auto'}
            {...restProps}
          />
        </picture>
      ) : (
        <img
          ref={mergedImageRef}
          src={shouldLoad ? optimizedSrc : ''}
          alt={alt}
          width={width}
          height={height}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          role={role}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          loading={loadingConfig.lazy !== false ? 'lazy' : 'eager'}
          fetchPriority={loadingConfig.fetchPriority || 'auto'}
          {...restProps}
        />
      )}
      
      {/* Blur placeholder */}
      {placeholderSrc && (
        <div
          className="lazy-image-placeholder"
          style={placeholderStyle}
          aria-hidden="true"
        />
      )}
      
      {/* Loading spinner */}
      {showLoadingSpinner && loadingState === 'loading' && (
        <div className="lazy-image-spinner" aria-hidden="true">
          <div className="lazy-image-spinner-inner" />
        </div>
      )}
      
      {/* Error state */}
      {loadingState === 'error' && (
        <div className="lazy-image-error-state" role="img" aria-label="Image failed to load">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          <span className="sr-only">Image failed to load</span>
        </div>
      )}
      
      {/* Custom placeholder content */}
      {typeof placeholder === 'object' && React.isValidElement(placeholder) && (
        <div className="lazy-image-custom-placeholder">
          {placeholder}
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;