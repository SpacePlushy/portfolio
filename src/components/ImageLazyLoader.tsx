/**
 * Lightweight lazy loading component with minimal bundle impact
 * Uses native intersection observer with fallbacks
 */

import { useEffect, useRef, useState, type ComponentProps } from 'react';

interface ImageLazyLoaderProps extends ComponentProps<'img'> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ImageLazyLoader({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=',
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  className = '',
  ...props
}: ImageLazyLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(img);
          }
        },
        { threshold, rootMargin }
      );

      observer.observe(img);
      return () => observer.disconnect();
    } else {
      // Fallback for older browsers
      setIsInView(true);
    }
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${hasError ? 'bg-gray-200' : ''} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

// Preload utility for critical images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Critical image component (no lazy loading)
export function CriticalImage({ src, alt, ...props }: ComponentProps<'img'>) {
  return (
    <img
      src={src}
      alt={alt}
      loading="eager"
      decoding="sync"
      fetchPriority="high"
      {...props}
    />
  );
}