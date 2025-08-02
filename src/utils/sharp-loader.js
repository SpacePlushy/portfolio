/**
 * Production-ready Sharp loader with proper initialization
 * Handles memory constraints and graceful degradation
 */

let sharpInstance = null;
let initializationPromise = null;
let initializationError = null;
let initializationStatus = 'not-started';

// Configuration based on environment
const SHARP_CONFIG = {
  cache: {
    memory: parseInt(process.env.SHARP_CACHE_MEMORY || '50'), // MB
    files: parseInt(process.env.SHARP_CACHE_FILES || '20'),
    items: parseInt(process.env.SHARP_CACHE_ITEMS || '100')
  },
  concurrency: parseInt(process.env.SHARP_CONCURRENCY || '1'),
  simd: process.env.SHARP_SIMD !== 'false' // Enable SIMD by default
};

/**
 * Get Sharp instance with lazy loading
 * @returns {Promise<import('sharp')>}
 */
export async function getSharp() {
  // Return cached instance if available
  if (sharpInstance) {
    return sharpInstance;
  }
  
  // Throw cached error if initialization failed
  if (initializationError) {
    throw initializationError;
  }
  
  // Wait for ongoing initialization
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Start new initialization
  initializationPromise = initializeSharp();
  
  try {
    sharpInstance = await initializationPromise;
    return sharpInstance;
  } catch (error) {
    initializationError = error;
    throw error;
  } finally {
    initializationPromise = null;
  }
}

/**
 * Initialize Sharp with production settings
 */
async function initializeSharp() {
  initializationStatus = 'initializing';
  
  try {
    console.log('[Sharp] Starting initialization...');
    const startTime = Date.now();
    
    // Dynamic import with error handling
    let sharp;
    try {
      const sharpModule = await import('sharp');
      sharp = sharpModule.default;
    } catch (importError) {
      console.error('[Sharp] Failed to import module:', importError.message);
      initializationStatus = 'failed';
      throw new Error(`Sharp module import failed: ${importError.message}`);
    }
    
    // Configure Sharp for production
    try {
      // Set cache limits
      sharp.cache(SHARP_CONFIG.cache);
      
      // Set concurrency based on available resources
      const concurrency = determineOptimalConcurrency();
      sharp.concurrency(concurrency);
      
      // Enable/disable SIMD
      sharp.simd(SHARP_CONFIG.simd);
      
      console.log(`[Sharp] Configuration applied:`, {
        cache: SHARP_CONFIG.cache,
        concurrency,
        simd: SHARP_CONFIG.simd
      });
    } catch (configError) {
      console.error('[Sharp] Configuration failed:', configError.message);
      // Continue anyway - Sharp might work with defaults
    }
    
    // Verify Sharp is functional
    try {
      await verifySharpFunctionality(sharp);
    } catch (verifyError) {
      console.error('[Sharp] Functionality verification failed:', verifyError.message);
      initializationStatus = 'degraded';
      // Continue anyway - basic functionality might still work
    }
    
    const initTime = Date.now() - startTime;
    console.log(`[Sharp] Initialization completed in ${initTime}ms`);
    initializationStatus = 'ready';
    
    return sharp;
  } catch (error) {
    initializationStatus = 'failed';
    console.error('[Sharp] Initialization failed:', error.message);
    throw new Error(`Sharp initialization failed: ${error.message}`);
  }
}

/**
 * Determine optimal concurrency based on system resources
 */
function determineOptimalConcurrency() {
  // Check memory constraints
  const totalMemory = process.memoryUsage().heapTotal / 1024 / 1024; // MB
  
  // For low memory environments (< 512MB), use single thread
  if (totalMemory < 512) {
    return 1;
  }
  
  // Use configured value or default based on memory
  return SHARP_CONFIG.concurrency || (totalMemory < 1024 ? 2 : 4);
}

/**
 * Verify Sharp functionality with minimal test
 */
async function verifySharpFunctionality(sharp) {
  const testStart = Date.now();
  
  try {
    // Create minimal 1x1 pixel image
    const buffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    })
    .png({ compressionLevel: 0 }) // Fastest compression
    .toBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Test image generation failed');
    }
    
    console.log(`[Sharp] Functionality verified in ${Date.now() - testStart}ms`);
    return true;
  } catch (error) {
    throw new Error(`Functionality test failed: ${error.message}`);
  }
}

/**
 * Check if Sharp is ready
 */
export function isSharpReady() {
  return sharpInstance !== null && initializationStatus === 'ready';
}

/**
 * Get Sharp status for health checks
 */
export function getSharpStatus() {
  switch (initializationStatus) {
    case 'ready':
      return {
        status: 'healthy',
        message: 'Sharp image processing ready',
        ready: true,
        config: SHARP_CONFIG
      };
      
    case 'degraded':
      return {
        status: 'degraded',
        message: 'Sharp partially initialized',
        ready: true,
        warning: 'Some features may not work'
      };
      
    case 'failed':
      return {
        status: 'unhealthy',
        message: 'Sharp initialization failed',
        ready: false,
        error: initializationError?.message
      };
      
    case 'initializing':
      return {
        status: 'degraded',
        message: 'Sharp initialization in progress',
        ready: false
      };
      
    default:
      return {
        status: 'degraded',
        message: 'Sharp not yet initialized',
        ready: false
      };
  }
}

/**
 * Pre-warm Sharp for optimal performance
 * Call this after server startup to prepare Sharp
 */
export async function prewarmSharp() {
  try {
    console.log('[Sharp] Starting pre-warm...');
    const sharp = await getSharp();
    
    // Perform a slightly more complex operation to warm up
    const warmupBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .resize(50, 50)
    .jpeg({ quality: 80 })
    .toBuffer();
    
    if (!warmupBuffer) {
      throw new Error('Pre-warm operation failed');
    }
    
    console.log('[Sharp] Pre-warm completed successfully');
    return true;
  } catch (error) {
    console.error('[Sharp] Pre-warm failed:', error.message);
    return false;
  }
}

/**
 * Reset Sharp state (useful for testing)
 */
export function resetSharp() {
  sharpInstance = null;
  initializationPromise = null;
  initializationError = null;
  initializationStatus = 'not-started';
}