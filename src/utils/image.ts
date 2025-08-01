/**
 * Image optimization utilities
 * Browser capability detection, format selection, and optimization helpers
 */

import type {
  ImageFormat,
  BrowserCapabilities,
  ImageOptimizationParams,
  ResponsiveSource,
  BreakpointConfig,
  ImageDimensions,
  OptimizedImageSource,
} from '../types/image';

/**
 * Default breakpoint configuration matching Tailwind CSS
 */
export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Detect browser capabilities for image optimization
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  // Default capabilities for SSR
  const defaultCapabilities: BrowserCapabilities = {
    supportsWebP: false,
    supportsAVIF: false,
    supportsLazyLoading: false,
    supportsIntersectionObserver: false,
    devicePixelRatio: 1,
  };

  // Return defaults if running on server
  if (typeof window === 'undefined') {
    return defaultCapabilities;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  const capabilities: BrowserCapabilities = {
    supportsWebP: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    supportsAVIF: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
    supportsLazyLoading: 'loading' in HTMLImageElement.prototype,
    supportsIntersectionObserver: 'IntersectionObserver' in window,
    devicePixelRatio: window.devicePixelRatio || 1,
  };

  // Detect connection type if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    capabilities.connectionType = connection.effectiveType;
  }

  return capabilities;
}

/**
 * Get optimal image format based on browser capabilities and preferences
 */
export function getOptimalFormat(
  preferredFormats: ImageFormat[] = ['avif', 'webp', 'jpeg'],
  capabilities?: BrowserCapabilities
): ImageFormat {
  const caps = capabilities || detectBrowserCapabilities();
  
  for (const format of preferredFormats) {
    switch (format) {
      case 'avif':
        if (caps.supportsAVIF) return 'avif';
        break;
      case 'webp':
        if (caps.supportsWebP) return 'webp';
        break;
      case 'jpeg':
      case 'png':
      case 'gif':
        return format;
    }
  }
  
  return 'jpeg'; // Ultimate fallback
}

/**
 * Generate responsive image sources for different breakpoints
 */
export function generateResponsiveSources(
  baseSrc: string,
  responsive: ResponsiveSource[],
  baseParams: ImageOptimizationParams = {}
): OptimizedImageSource[] {
  const capabilities = detectBrowserCapabilities();
  
  return responsive.map((source) => {
    const format = source.format || getOptimalFormat(['avif', 'webp', 'jpeg'], capabilities);
    const quality = source.quality || baseParams.quality || 80;
    
    const params = new URLSearchParams({
      w: source.width.toString(),
      ...(source.height && { h: source.height.toString() }),
      q: quality.toString(),
      f: format,
      ...(baseParams.fit && { fit: baseParams.fit }),
    });
    
    const optimizedSrc = `${baseSrc}?${params.toString()}`;
    
    // Generate srcSet for different pixel densities
    const srcSet = [1, 2].map(density => {
      if (density === 1) return `${optimizedSrc} 1x`;
      
      const hdParams = new URLSearchParams(params);
      hdParams.set('w', (source.width * density).toString());
      if (source.height) {
        hdParams.set('h', (source.height * density).toString());
      }
      
      return `${baseSrc}?${hdParams.toString()} ${density}x`;
    }).join(', ');
    
    const sizes = generateSizesAttribute([source]);
    
    return {
      src: optimizedSrc,
      srcSet,
      sizes,
      format,
      width: source.width,
      height: source.height || Math.round(source.width * 0.75), // Default aspect ratio
      quality,
    };
  });
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(responsive: ResponsiveSource[]): string {
  if (responsive.length === 0) return '100vw';
  
  // Sort by breakpoint width
  const sorted = [...responsive].sort((a, b) => {
    const aWidth = DEFAULT_BREAKPOINTS[a.breakpoint];
    const bWidth = DEFAULT_BREAKPOINTS[b.breakpoint];
    return bWidth - aWidth; // Descending order
  });
  
  const sizes: string[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const source = sorted[i];
    const breakpointWidth = DEFAULT_BREAKPOINTS[source.breakpoint];
    
    if (i === sorted.length - 1) {
      // Last item (smallest breakpoint)
      sizes.push(`${source.width}px`);
    } else {
      sizes.push(`(min-width: ${breakpointWidth}px) ${source.width}px`);
    }
  }
  
  return sizes.join(', ');
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Get dimensions maintaining aspect ratio
 */
export function getDimensionsWithAspectRatio(
  targetWidth: number,
  originalDimensions: ImageDimensions
): ImageDimensions {
  const aspectRatio = originalDimensions.aspectRatio || 
    calculateAspectRatio(originalDimensions.width, originalDimensions.height);
  
  return {
    width: targetWidth,
    height: Math.round(targetWidth / aspectRatio),
    aspectRatio,
  };
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#f3f4f6'
): string {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return `data:image/svg+xml;base64,${btoa(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/></svg>`
    )}`;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create gradient for more realistic blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, adjustBrightness(color, -10));
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * Build optimized image URL with parameters
 */
export function buildOptimizedImageUrl(
  baseSrc: string,
  params: ImageOptimizationParams,
  capabilities?: BrowserCapabilities
): string {
  const caps = capabilities || detectBrowserCapabilities();
  const format = getOptimalFormat(
    params.format ? [params.format] : ['avif', 'webp', 'jpeg'],
    caps
  );
  
  const urlParams = new URLSearchParams();
  
  if (params.width) urlParams.set('w', params.width.toString());
  if (params.height) urlParams.set('h', params.height.toString());
  if (params.quality) urlParams.set('q', params.quality.toString());
  if (format) urlParams.set('f', format);
  if (params.fit) urlParams.set('fit', params.fit);
  if (params.blur) urlParams.set('blur', params.blur.toString());
  if (params.brightness) urlParams.set('brightness', params.brightness.toString());
  if (params.contrast) urlParams.set('contrast', params.contrast.toString());
  if (params.saturation) urlParams.set('saturation', params.saturation.toString());
  
  return `${baseSrc}?${urlParams.toString()}`;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'high'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = priority;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Check if image URL is valid and accessible
 */
export function validateImageUrl(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true); // Assume valid on server
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/**
 * Get image natural dimensions
 */
export function getImageDimensions(src: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot get image dimensions on server'));
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: calculateAspectRatio(img.naturalWidth, img.naturalHeight),
      });
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}