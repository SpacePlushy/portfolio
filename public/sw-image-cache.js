/**
 * Service Worker for Image Caching and Optimization
 * Implements stale-while-revalidate strategy with format negotiation
 */

const CACHE_NAME = 'images-v2';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 100; // Maximum number of images to cache

// Supported formats in order of preference
const SUPPORTED_FORMATS = ['avif', 'webp', 'jpeg', 'png'];

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanupOldCaches(),
      preloadCriticalImages()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle image requests
  if (!isImageRequest(request)) {
    return;
  }

  event.respondWith(handleImageRequest(request));
});

// Handle image requests with optimized caching
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Check if cached response is still valid
  if (cachedResponse && !isExpired(cachedResponse)) {
    // Return cached version and update in background
    updateInBackground(request, cache);
    return cachedResponse;
  }

  try {
    // Fetch optimized image
    const optimizedRequest = await optimizeImageRequest(request);
    const response = await fetch(optimizedRequest);
    
    if (response.ok) {
      // Cache the response
      await cacheResponse(cache, request, response.clone());
      return response;
    }
    
    // Return cached version if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return response;
  } catch (error) {
    // Network error - return cached version or fallback
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return createFallbackResponse();
  }
}

// Optimize image request based on client capabilities
async function optimizeImageRequest(request) {
  const url = new URL(request.url);
  const acceptHeader = request.headers.get('accept') || '';
  
  // Determine best format
  let format = 'jpeg';
  if (acceptHeader.includes('image/avif')) {
    format = 'avif';
  } else if (acceptHeader.includes('image/webp')) {
    format = 'webp';
  }
  
  // Apply format if not already specified
  if (!url.searchParams.has('f')) {
    url.searchParams.set('f', format);
  }
  
  // Apply quality optimization based on connection
  if (!url.searchParams.has('q')) {
    const quality = await getOptimalQuality();
    url.searchParams.set('q', quality.toString());
  }
  
  return new Request(url.toString(), {
    headers: request.headers,
    mode: request.mode,
    credentials: request.credentials
  });
}

// Get optimal quality based on connection speed
async function getOptimalQuality() {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 60;
      case '3g':
        return 75;
      case '4g':
      default:
        return 85;
    }
  }
  return 80; // Default quality
}

// Cache response with metadata
async function cacheResponse(cache, request, response) {
  // Add timestamp for expiry checking
  const responseWithTimestamp = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cached-at': Date.now().toString(),
    },
  });
  
  await cache.put(request, responseWithTimestamp);
  
  // Enforce cache size limit
  await enforCacheSizeLimit(cache);
}

// Check if cached response is expired
function isExpired(response) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return true;
  
  return Date.now() - parseInt(cachedAt) > CACHE_EXPIRY;
}

// Update cache in background
async function updateInBackground(request, cache) {
  try {
    const optimizedRequest = await optimizeImageRequest(request);
    const response = await fetch(optimizedRequest);
    
    if (response.ok) {
      await cacheResponse(cache, request, response);
    }
  } catch (error) {
    console.log('Background update failed:', error);
  }
}

// Enforce maximum cache size
async function enforCacheSizeLimit(cache) {
  const keys = await cache.keys();
  
  if (keys.length > MAX_CACHE_SIZE) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Check if request is for an image
function isImageRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  const acceptHeader = request.headers.get('accept') || '';
  
  return (
    acceptHeader.includes('image/') ||
    /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(pathname) ||
    url.searchParams.has('f') // Our optimized image URLs
  );
}

// Create fallback response for failed images
function createFallbackResponse() {
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="system-ui" font-size="16">
        Image not available
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  });
}

// Preload critical images
async function preloadCriticalImages() {
  const criticalImages = [
    '/assets/frank-headshot.png?f=avif&q=85&w=256',
    '/assets/frank-headshot.png?f=webp&q=85&w=256',
  ];
  
  const cache = await caches.open(CACHE_NAME);
  
  await Promise.allSettled(
    criticalImages.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.log('Failed to preload:', url, error);
      }
    })
  );
}

// Clean up old caches
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('images-') && name !== CACHE_NAME
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
});

async function getCacheStats() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  return {
    cacheSize: keys.length,
    maxCacheSize: MAX_CACHE_SIZE,
    cacheUtilization: (keys.length / MAX_CACHE_SIZE) * 100,
  };
}