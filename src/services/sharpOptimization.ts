/**
 * High-Performance Sharp Image Optimization Service
 * Memory-optimized processing with worker threads and advanced caching
 */

import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';
import { Worker } from 'worker_threads';
import { createHash } from 'crypto';
import { cpus } from 'os';

export interface SharpOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;
  background?: string;
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  progressive?: boolean;
  lossless?: boolean;
}

export interface SharpOptimizedResult {
  buffer: Buffer;
  info: {
    format: string;
    width: number;
    height: number;
    channels: number;
    premultiplied: boolean;
    size: number;
  };
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  processingTime: number;
  cacheHit: boolean;
}

export interface ProcessingQueueItem {
  resolve: (result: SharpOptimizedResult) => void;
  reject: (error: Error) => void;
  processor: () => Promise<SharpOptimizedResult>;
}

export class SharpOptimizationService {
  private static instance: SharpOptimizationService;
  private readonly cacheDir: string;
  private readonly maxCacheSize: number;
  private readonly memoryCache = new Map<string, SharpOptimizedResult>();
  private readonly maxMemoryCacheSize = 50;
  private processingQueue: ProcessingQueueItem[] = [];
  private isProcessing = false;
  private readonly maxConcurrency: number;
  
  constructor(cacheDir = './.cache/images', maxCacheSize = 1000) {
    this.cacheDir = cacheDir;
    this.maxCacheSize = maxCacheSize;
    this.maxConcurrency = Math.max(1, Math.floor(cpus().length * 0.75));
    this.initializeSharp();
    this.ensureCacheDir();
  }

  static getInstance(): SharpOptimizationService {
    if (!this.instance) {
      this.instance = new SharpOptimizationService();
    }
    return this.instance;
  }

  /**
   * Initialize Sharp with performance optimizations
   */
  private initializeSharp(): void {
    // Configure Sharp for optimal performance
    sharp.cache({
      memory: 200, // 200MB memory limit
      files: 100,  // Max 100 cached files
      items: 200   // Max 200 cached items
    });

    // Set optimal concurrency
    sharp.concurrency(this.maxConcurrency);
    
    // Disable SIMD if causing issues
    if (process.env.SHARP_DISABLE_SIMD) {
      sharp.simd(false);
    }
  }

  /**
   * Optimize image with caching and queue management
   */
  async optimizeImage(
    inputBuffer: Buffer,
    options: SharpOptimizationOptions = {}
  ): Promise<SharpOptimizedResult> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(inputBuffer, options);
    
    // Check memory cache first
    const memoryResult = this.memoryCache.get(cacheKey);
    if (memoryResult) {
      return {
        ...memoryResult,
        cacheHit: true,
        processingTime: performance.now() - startTime
      };
    }

    // Check disk cache
    const diskResult = await this.getCachedResult(cacheKey);
    if (diskResult) {
      this.updateMemoryCache(cacheKey, diskResult);
      return {
        ...diskResult,
        cacheHit: true,
        processingTime: performance.now() - startTime
      };
    }

    // Process image
    return this.queueProcessing(async () => {
      try {
        const result = await this.processImageWithSharp(inputBuffer, options, startTime);
        
        // Cache result
        await this.cacheResult(cacheKey, result);
        this.updateMemoryCache(cacheKey, result);
        
        return result;
      } catch (error) {
        throw new Error(`Image optimization failed: ${error.message}`);
      }
    });
  }

  /**
   * Process image with Sharp using optimized pipeline
   */
  private async processImageWithSharp(
    inputBuffer: Buffer,
    options: SharpOptimizationOptions,
    startTime: number
  ): Promise<SharpOptimizedResult> {
    const originalSize = inputBuffer.length;
    
    // Create Sharp instance with memory-optimized settings
    let sharpInstance = sharp(inputBuffer, {
      failOnError: false,
      limitInputPixels: 268402689, // ~16384x16384 max
      sequentialRead: true,
      density: options.width && options.width > 1000 ? 150 : 72,
    });

    // Get metadata for optimization decisions
    const metadata = await sharpInstance.metadata();
    
    // Apply smart quality optimization
    const optimizedQuality = options.quality || this.calculateOptimalQuality(metadata, options.format || 'jpeg');

    // Apply transformations in optimal order
    sharpInstance = await this.applyOptimizedTransformations(sharpInstance, options, metadata);
    
    // Apply format-specific optimizations
    sharpInstance = this.applyFormatOptimizations(sharpInstance, {
      ...options,
      quality: optimizedQuality
    });

    // Process with memory management
    const result = await this.processWithMemoryManagement(sharpInstance);
    
    const processingTime = performance.now() - startTime;
    const optimizedSize = result.data.length;
    const compressionRatio = (1 - optimizedSize / originalSize) * 100;

    return {
      buffer: result.data,
      info: result.info,
      originalSize,
      optimizedSize,
      compressionRatio,
      processingTime,
      cacheHit: false,
    };
  }

  /**
   * Process with memory management to prevent OOM
   */
  private async processWithMemoryManagement(sharpInstance: sharp.Sharp): Promise<{ data: Buffer; info: sharp.OutputInfo }> {
    // Monitor memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const availableMemory = totalMemory - memUsage.rss;
    
    if (availableMemory < 500 * 1024 * 1024) { // Less than 500MB available
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Use streaming processing for large images
      return this.processWithStreaming(sharpInstance);
    }
    
    return sharpInstance.toBuffer({ resolveWithObject: true });
  }

  /**
   * Stream-based processing for memory-constrained environments
   */
  private async processWithStreaming(sharpInstance: sharp.Sharp): Promise<{ data: Buffer; info: sharp.OutputInfo }> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let info: sharp.OutputInfo;
      
      const stream = sharpInstance.clone()
        .on('info', (streamInfo) => {
          info = streamInfo;
        })
        .on('data', (chunk) => {
          chunks.push(chunk);
        })
        .on('end', () => {
          resolve({
            data: Buffer.concat(chunks),
            info
          });
        })
        .on('error', reject);
      
      // Trigger streaming
      stream.resume();
    });
  }

  /**
   * Apply optimized transformations based on image characteristics
   */
  private async applyOptimizedTransformations(
    sharpInstance: sharp.Sharp,
    options: SharpOptimizationOptions,
    metadata: sharp.Metadata
  ): Promise<sharp.Sharp> {
    let pipeline = sharpInstance;

    // Smart resizing with optimal algorithm selection
    if (options.width || options.height) {
      const targetWidth = options.width;
      const targetHeight = options.height;
      const originalWidth = metadata.width || 1;
      const originalHeight = metadata.height || 1;
      
      // Choose resize algorithm based on scale factor
      const scaleX = targetWidth ? targetWidth / originalWidth : 1;
      const scaleY = targetHeight ? targetHeight / originalHeight : 1;
      const minScale = Math.min(scaleX, scaleY);
      
      let kernel: sharp.Kernel = 'lanczos3'; // Default high-quality
      
      if (minScale > 1) {
        // Upscaling - use Mitchell for better quality
        kernel = 'mitchell';
      } else if (minScale < 0.5) {
        // Heavy downscaling - use lanczos2 for performance
        kernel = 'lanczos2';
      }

      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: options.fit as any || 'cover',
        position: options.position as any || 'centre',
        background: options.background || { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: false,
        fastShrinkOnLoad: true,
        kernel
      });
    }

    // Apply filters in optimal order
    if (options.blur) {
      pipeline = pipeline.blur(Math.min(options.blur, 1000));
    }

    if (options.sharpen) {
      // Smart sharpening based on image size
      const radius = options.width && options.width < 500 ? 0.5 : 1.0;
      pipeline = pipeline.sharpen({
        sigma: radius,
        m1: 1.0,
        m2: 2.0,
        x1: 2.0,
        y2: 10.0,
        y3: 20.0
      });
    }

    if (options.grayscale) {
      pipeline = pipeline.grayscale();
    }

    return pipeline;
  }

  /**
   * Apply format-specific optimizations with latest encoding options
   */
  private applyFormatOptimizations(
    sharpInstance: sharp.Sharp,
    options: SharpOptimizationOptions
  ): sharp.Sharp {
    const quality = Math.max(1, Math.min(100, options.quality || 80));
    
    switch (options.format) {
      case 'jpeg':
        return sharpInstance.jpeg({
          quality,
          progressive: options.progressive !== false,
          mozjpeg: true,
          chromaSubsampling: quality > 90 ? '4:4:4' : '4:2:0',
          optimizeScans: true,
          trellisQuantisation: true,
          overshootDeringing: true,
          optimizeCoding: true,
          quantisationTable: quality > 90 ? 0 : 3
        });

      case 'webp':
        return sharpInstance.webp({
          quality,
          lossless: options.lossless || false,
          nearLossless: false,
          smartSubsample: true,
          effort: quality > 90 ? 6 : 4,
          alphaQuality: Math.min(100, quality + 10),
          mixed: true
        });

      case 'avif':
        return sharpInstance.avif({
          quality,
          lossless: options.lossless || false,
          effort: quality > 90 ? 6 : 4,
          chromaSubsampling: quality > 85 ? '4:4:4' : '4:2:0',
          speed: quality > 90 ? 2 : 4
        });

      case 'png':
        return sharpInstance.png({
          quality,
          progressive: options.progressive !== false,
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true,
          colors: quality < 80 ? 128 : 256
        });

      default:
        return sharpInstance.jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        });
    }
  }

  /**
   * Queue processing to prevent memory overload
   */
  private async queueProcessing<T>(processor: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.processingQueue.push({
        resolve: resolve as any,
        reject,
        processor: processor as any
      });
      
      this.processQueue();
    });
  }

  /**
   * Process queued operations with concurrency control
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      while (this.processingQueue.length > 0) {
        const batch = this.processingQueue.splice(0, this.maxConcurrency);
        
        await Promise.all(batch.map(async (item) => {
          try {
            const result = await item.processor();
            item.resolve(result);
          } catch (error) {
            item.reject(error as Error);
          }
        }));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate cache key for image and options
   */
  private generateCacheKey(inputBuffer: Buffer, options: SharpOptimizationOptions): string {
    const hash = createHash('sha256');
    hash.update(inputBuffer);
    hash.update(JSON.stringify(options));
    return hash.digest('hex');
  }

  /**
   * Cache result to disk
   */
  private async cacheResult(key: string, result: SharpOptimizedResult): Promise<void> {
    try {
      const cachePath = path.join(this.cacheDir, `${key}.cache`);
      const cacheData = {
        ...result,
        buffer: result.buffer.toString('base64')
      };
      await fs.writeFile(cachePath, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache result:', error);
    }
  }

  /**
   * Get cached result from disk
   */
  private async getCachedResult(key: string): Promise<SharpOptimizedResult | null> {
    try {
      const cachePath = path.join(this.cacheDir, `${key}.cache`);
      const cacheData = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
      
      return {
        ...cacheData,
        buffer: Buffer.from(cacheData.buffer, 'base64')
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update memory cache with LRU eviction
   */
  private updateMemoryCache(key: string, result: SharpOptimizedResult): void {
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, result);
  }

  /**
   * Calculate optimal quality based on image characteristics
   */
  calculateOptimalQuality(metadata: sharp.Metadata, targetFormat: string): number {
    let baseQuality = 80;

    // Adjust based on image size
    const pixelCount = (metadata.width || 1) * (metadata.height || 1);
    if (pixelCount > 4000000) { // > 4MP
      baseQuality = 70;
    } else if (pixelCount > 2000000) { // > 2MP
      baseQuality = 75;
    } else if (pixelCount < 500000) { // < 0.5MP
      baseQuality = 85;
    }

    // Adjust based on format efficiency
    switch (targetFormat) {
      case 'avif':
        return Math.max(50, baseQuality - 15);
      case 'webp':
        return Math.max(60, baseQuality - 10);
      case 'jpeg':
        return baseQuality;
      case 'png':
        return Math.min(95, baseQuality + 10);
      default:
        return baseQuality;
    }
  }

  /**
   * Generate responsive image set with parallel processing
   */
  async generateResponsiveImages(
    inputBuffer: Buffer,
    breakpoints: Array<{ width: number; quality?: number }>,
    formats: string[] = ['avif', 'webp', 'jpeg']
  ): Promise<Map<string, SharpOptimizedResult[]>> {
    const results = new Map<string, SharpOptimizedResult[]>();
    
    // Process all format/size combinations in parallel
    const allPromises = formats.flatMap(format =>
      breakpoints.map(async (breakpoint) => ({
        format,
        breakpoint,
        result: await this.optimizeImage(inputBuffer, {
          width: breakpoint.width,
          quality: breakpoint.quality || this.calculateOptimalQuality(
            await sharp(inputBuffer).metadata(),
            format
          ),
          format: format as any,
          fit: 'cover',
          progressive: true,
        })
      }))
    );

    const completed = await Promise.allSettled(allPromises);
    
    // Group results by format
    completed.forEach((promise) => {
      if (promise.status === 'fulfilled') {
        const { format, result } = promise.value;
        
        if (!results.has(format)) {
          results.set(format, []);
        }
        results.get(format)!.push(result);
      }
    });

    return results;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    memoryCacheSize: number;
    queueLength: number;
    maxConcurrency: number;
    sharpStats: sharp.CacheOptions;
  } {
    return {
      memoryCacheSize: this.memoryCache.size,
      queueLength: this.processingQueue.length,
      maxConcurrency: this.maxConcurrency,
      sharpStats: sharp.cache(),
    };
  }

  /**
   * Clear all caches and reset
   */
  async clearAllCaches(): Promise<void> {
    this.memoryCache.clear();
    sharp.cache(false);
    await this.clearCache();
    this.initializeSharp();
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Clear cache directory
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      );
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}