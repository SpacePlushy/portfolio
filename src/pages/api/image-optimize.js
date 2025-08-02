/**
 * Image Optimization API Endpoint
 * 
 * Provides image optimization services with format detection,
 * responsive sizing, and performance metrics.
 * 
 * Endpoint: /api/image-optimize
 * Methods: GET, POST
 */

import { 
  getOptimalFormat,
  generateResponsiveSources,
  buildOptimizedImageUrl,
  generateBlurPlaceholder
} from '../../utils/image.js';

/**
 * Validate image optimization parameters
 */
function validateParams(params) {
  const errors = [];
  
  if (!params.src) {
    errors.push('src parameter is required');
  }
  
  if (params.width && (isNaN(params.width) || params.width <= 0 || params.width > 4000)) {
    errors.push('width must be a positive number <= 4000');
  }
  
  if (params.height && (isNaN(params.height) || params.height <= 0 || params.height > 4000)) {
    errors.push('height must be a positive number <= 4000');
  }
  
  if (params.quality && (isNaN(params.quality) || params.quality < 1 || params.quality > 100)) {
    errors.push('quality must be between 1 and 100');
  }
  
  const validFormats = ['avif', 'webp', 'jpeg', 'png', 'gif'];
  if (params.format && !validFormats.includes(params.format)) {
    errors.push(`format must be one of: ${validFormats.join(', ')}`);
  }
  
  const validFits = ['contain', 'cover', 'fill', 'none', 'scale-down'];
  if (params.fit && !validFits.includes(params.fit)) {
    errors.push(`fit must be one of: ${validFits.join(', ')}`);
  }
  
  return errors;
}

/**
 * Parse optimization parameters from request
 */
function parseParams(url) {
  const searchParams = new URL(url).searchParams;
  
  return {
    src: searchParams.get('src'),
    width: searchParams.get('w') ? parseInt(searchParams.get('w')) : undefined,
    height: searchParams.get('h') ? parseInt(searchParams.get('h')) : undefined,
    quality: searchParams.get('q') ? parseInt(searchParams.get('q')) : 80,
    format: searchParams.get('f') || undefined,
    fit: searchParams.get('fit') || 'cover',
    blur: searchParams.get('blur') ? parseInt(searchParams.get('blur')) : undefined,
    brightness: searchParams.get('brightness') ? parseFloat(searchParams.get('brightness')) : undefined,
    contrast: searchParams.get('contrast') ? parseFloat(searchParams.get('contrast')) : undefined,
    saturation: searchParams.get('saturation') ? parseFloat(searchParams.get('saturation')) : undefined,
    responsive: searchParams.get('responsive') === 'true',
    placeholder: searchParams.get('placeholder') === 'true',
  };
}

/**
 * Generate responsive breakpoints
 */
function generateDefaultResponsive(baseWidth, baseHeight) {
  const breakpoints = [
    { breakpoint: 'sm', width: Math.min(640, baseWidth) },
    { breakpoint: 'md', width: Math.min(768, baseWidth) },
    { breakpoint: 'lg', width: Math.min(1024, baseWidth) },
    { breakpoint: 'xl', width: Math.min(1280, baseWidth) },
  ];
  
  return breakpoints
    .filter(bp => bp.width < baseWidth)
    .map(bp => ({
      ...bp,
      height: baseHeight ? Math.round((bp.width / baseWidth) * baseHeight) : undefined,
    }));
}

/**
 * GET handler - Image optimization with query parameters
 */
export async function GET({ request, url }) {
  const startTime = Date.now();
  
  try {
    // Parse parameters
    const params = parseParams(url);
    
    // Validate parameters
    const validationErrors = validateParams(params);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: validationErrors
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // Detect browser capabilities from Accept header
    const acceptHeader = request.headers.get('accept') || '';
    
    const browserCapabilities = {
      supportsWebP: acceptHeader.includes('image/webp'),
      supportsAVIF: acceptHeader.includes('image/avif'),
      supportsLazyLoading: true, // Assume modern browser
      supportsIntersectionObserver: true,
      devicePixelRatio: 1, // Default, would need client-side detection
    };
    
    // Determine optimal format
    const optimalFormat = params.format || getOptimalFormat(
      ['avif', 'webp', 'jpeg'],
      browserCapabilities
    );
    
    // Build optimized image URL
    const optimizedSrc = buildOptimizedImageUrl(params.src, {
      width: params.width,
      height: params.height,
      quality: params.quality,
      format: optimalFormat,
      fit: params.fit,
      blur: params.blur,
      brightness: params.brightness,
      contrast: params.contrast,
      saturation: params.saturation,
    });
    
    // Generate responsive sources if requested
    let responsiveSources = [];
    if (params.responsive && params.width) {
      const responsiveBreakpoints = generateDefaultResponsive(params.width, params.height);
      responsiveSources = generateResponsiveSources(
        params.src,
        responsiveBreakpoints,
        {
          quality: params.quality,
          format: optimalFormat,
          fit: params.fit,
        }
      );
    }
    
    // Generate placeholder if requested
    let placeholder = null;
    if (params.placeholder) {
      placeholder = {
        src: generateBlurPlaceholder(
          Math.min(params.width || 20, 20),
          Math.min(params.height || 15, 15),
          '#f3f4f6'
        ),
        width: Math.min(params.width || 20, 20),
        height: Math.min(params.height || 15, 15),
      };
    }
    
    // Build response data
    const responseData = {
      success: true,
      data: {
        sources: responsiveSources,
        fallback: {
          src: optimizedSrc,
          width: params.width || 0,
          height: params.height || 0,
        },
        placeholder,
        dimensions: {
          width: params.width || 0,
          height: params.height || 0,
          aspectRatio: params.width && params.height ? params.width / params.height : undefined,
        },
      },
      metrics: {
        processingTime: Date.now() - startTime,
        format: optimalFormat,
        browserCapabilities,
      },
    };
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Cache for 1 hour, CDN for 1 day
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      }
    });
    
  } catch (error) {
    console.error('Image optimization error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

/**
 * POST handler - Batch image optimization
 */
export async function POST({ request }) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    if (!Array.isArray(body.images)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_BODY',
          message: 'Request body must contain an "images" array'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (body.images.length > 10) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'TOO_MANY_IMAGES',
          message: 'Maximum 10 images per batch request'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Process each image
    const results = [];
    const browserCapabilities = {
      supportsWebP: request.headers.get('accept')?.includes('image/webp') || false,
      supportsAVIF: request.headers.get('accept')?.includes('image/avif') || false,
      supportsLazyLoading: true,
      supportsIntersectionObserver: true,
      devicePixelRatio: 1,
    };
    
    for (const imageParams of body.images) {
      try {
        const validationErrors = validateParams(imageParams);
        if (validationErrors.length > 0) {
          results.push({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid parameters',
              details: validationErrors
            }
          });
          continue;
        }
        
        const optimalFormat = imageParams.format || getOptimalFormat(
          ['avif', 'webp', 'jpeg'],
          browserCapabilities
        );
        
        const optimizedSrc = buildOptimizedImageUrl(imageParams.src, {
          width: imageParams.width,
          height: imageParams.height,
          quality: imageParams.quality || 80,
          format: optimalFormat,
          fit: imageParams.fit || 'cover',
        });
        
        let responsiveSources = [];
        if (imageParams.responsive && imageParams.width) {
          const responsiveBreakpoints = generateDefaultResponsive(
            imageParams.width,
            imageParams.height
          );
          responsiveSources = generateResponsiveSources(
            imageParams.src,
            responsiveBreakpoints,
            {
              quality: imageParams.quality || 80,
              format: optimalFormat,
              fit: imageParams.fit || 'cover',
            }
          );
        }
        
        results.push({
          success: true,
          data: {
            sources: responsiveSources,
            fallback: {
              src: optimizedSrc,
              width: imageParams.width || 0,
              height: imageParams.height || 0,
            },
            dimensions: {
              width: imageParams.width || 0,
              height: imageParams.height || 0,
              aspectRatio: imageParams.width && imageParams.height 
                ? imageParams.width / imageParams.height 
                : undefined,
            },
          },
        });
        
      } catch (error) {
        results.push({
          success: false,
          error: {
            code: 'PROCESSING_ERROR',
            message: 'Failed to process image',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          }
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: results,
      metrics: {
        processingTime: Date.now() - startTime,
        processedCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      }
    });
    
  } catch (error) {
    console.error('Batch image optimization error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    }
  });
}