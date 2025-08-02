/**
 * Redis-based Image Caching Service
 * High-performance distributed caching with intelligent eviction
 */

import { createClient, type RedisClientType } from 'redis';
import { createHash } from 'crypto';

export interface RedisImageCacheConfig {
  url?: string;
  ttl?: number; // Time to live in seconds
  maxMemory?: string; // Redis max memory (e.g., '100mb')
  evictionPolicy?: 'allkeys-lru' | 'volatile-lru' | 'allkeys-lfu' | 'volatile-lfu';
  compression?: boolean;
  keyPrefix?: string;
}

export interface CachedImageData {
  buffer: Buffer;
  metadata: {
    format: string;
    width: number;
    height: number;
    size: number;
    quality: number;
    originalSize: number;
    compressionRatio: number;
  };
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  evictedKeys: number;
  keysByTTL: Record<string, number>;
}

export class RedisImageCache {
  private client: RedisClientType;
  private config: Required<RedisImageCacheConfig>;
  private isConnected = false;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
  };

  constructor(config: RedisImageCacheConfig = {}) {
    this.config = {
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: config.ttl || 3600, // 1 hour default
      maxMemory: config.maxMemory || '200mb',
      evictionPolicy: config.evictionPolicy || 'allkeys-lru',
      compression: config.compression ?? true,
      keyPrefix: config.keyPrefix || 'img:',
    };

    this.client = createClient({
      url: this.config.url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        connectTimeout: 5000,
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize Redis connection and configure memory settings
   */
  async initialize(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;

      // Configure Redis for optimal image caching
      await this.client.configSet('maxmemory', this.config.maxMemory);
      await this.client.configSet('maxmemory-policy', this.config.evictionPolicy);
      
      // Set optimal persistence settings for image cache
      await this.client.configSet('save', '900 1 300 10 60 10000'); // More frequent saves
      
      console.log('Redis image cache initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis image cache:', error);
      this.isConnected = false;
    }
  }

  /**
   * Cache an optimized image with metadata
   */
  async set(
    cacheKey: string,
    imageData: CachedImageData,
    customTTL?: number
  ): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const key = this.buildKey(cacheKey);
      const ttl = customTTL || this.config.ttl;
      
      // Prepare data for storage
      const cacheData = {
        ...imageData,
        buffer: this.config.compression 
          ? await this.compressBuffer(imageData.buffer)
          : imageData.buffer.toString('base64'),
        compressed: this.config.compression,
      };

      // Use pipeline for atomic operations
      const pipeline = this.client.multi();
      
      // Store main data
      pipeline.setEx(key, ttl, JSON.stringify(cacheData));
      
      // Store metadata separately for quick queries
      pipeline.hSet(`${key}:meta`, {
        format: imageData.metadata.format,
        width: imageData.metadata.width.toString(),
        height: imageData.metadata.height.toString(),
        size: imageData.metadata.size.toString(),
        createdAt: imageData.createdAt.toString(),
        lastAccessed: Date.now().toString(),
      });
      
      // Set TTL for metadata
      pipeline.expire(`${key}:meta`, ttl);
      
      // Update access tracking
      pipeline.zAdd('img:access', {
        score: Date.now(),
        value: key,
      });
      
      // Update size tracking
      pipeline.zAdd('img:sizes', {
        score: imageData.metadata.size,
        value: key,
      });

      await pipeline.exec();
      
      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('Redis cache set error:', error);
      return false;
    }
  }

  /**
   * Retrieve cached image data
   */
  async get(cacheKey: string): Promise<CachedImageData | null> {
    if (!this.isConnected) return null;

    try {
      const key = this.buildKey(cacheKey);
      const data = await this.client.get(key);
      
      if (!data) {
        this.stats.misses++;
        return null;
      }

      const cacheData = JSON.parse(data);
      
      // Decompress buffer if needed
      let buffer: Buffer;
      if (cacheData.compressed) {
        buffer = await this.decompressBuffer(cacheData.buffer);
      } else {
        buffer = Buffer.from(cacheData.buffer, 'base64');
      }

      const result: CachedImageData = {
        ...cacheData,
        buffer,
        lastAccessed: Date.now(),
        accessCount: (cacheData.accessCount || 0) + 1,
      };

      // Update access tracking asynchronously
      this.updateAccessTracking(key).catch(console.error);
      
      this.stats.hits++;
      return result;
    } catch (error) {
      console.error('Redis cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Check if key exists without retrieving data
   */
  async exists(cacheKey: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const key = this.buildKey(cacheKey);
      const exists = await this.client.exists(key);
      return exists > 0;
    } catch (error) {
      console.error('Redis cache exists error:', error);
      return false;
    }
  }

  /**
   * Delete cached image
   */
  async delete(cacheKey: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const key = this.buildKey(cacheKey);
      
      const pipeline = this.client.multi();
      pipeline.del(key);
      pipeline.del(`${key}:meta`);
      pipeline.zRem('img:access', key);
      pipeline.zRem('img:sizes', key);
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis cache delete error:', error);
      return false;
    }
  }

  /**
   * Get multiple cached images in a single operation
   */
  async mGet(cacheKeys: string[]): Promise<(CachedImageData | null)[]> {
    if (!this.isConnected || cacheKeys.length === 0) {
      return cacheKeys.map(() => null);
    }

    try {
      const keys = cacheKeys.map(key => this.buildKey(key));
      const results = await this.client.mGet(keys);
      
      return Promise.all(results.map(async (data, index) => {
        if (!data) {
          this.stats.misses++;
          return null;
        }

        try {
          const cacheData = JSON.parse(data);
          
          let buffer: Buffer;
          if (cacheData.compressed) {
            buffer = await this.decompressBuffer(cacheData.buffer);
          } else {
            buffer = Buffer.from(cacheData.buffer, 'base64');
          }

          this.stats.hits++;
          return {
            ...cacheData,
            buffer,
            lastAccessed: Date.now(),
            accessCount: (cacheData.accessCount || 0) + 1,
          };
        } catch (error) {
          console.error('Error parsing cached data:', error);
          this.stats.misses++;
          return null;
        }
      }));
    } catch (error) {
      console.error('Redis cache mGet error:', error);
      return cacheKeys.map(() => null);
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearByPattern(pattern: string): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}${pattern}`);
      
      if (keys.length === 0) return 0;

      const pipeline = this.client.multi();
      keys.forEach(key => {
        pipeline.del(key);
        pipeline.del(`${key}:meta`);
        pipeline.zRem('img:access', key);
        pipeline.zRem('img:sizes', key);
      });
      
      await pipeline.exec();
      return keys.length;
    } catch (error) {
      console.error('Redis cache clear by pattern error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.isConnected) {
      return {
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0,
        evictedKeys: 0,
        keysByTTL: {},
      };
    }

    try {
      const info = await this.client.info('memory');
      const keyCount = await this.client.dbSize();
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      
      // Calculate hit rate
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

      return {
        totalKeys: keyCount,
        memoryUsage,
        hitRate,
        evictedKeys: this.stats.evictions,
        keysByTTL: await this.getKeysByTTL(),
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0,
        evictedKeys: 0,
        keysByTTL: {},
      };
    }
  }

  /**
   * Optimize cache by removing least accessed items
   */
  async optimizeCache(): Promise<void> {
    if (!this.isConnected) return;

    try {
      // Get least accessed items
      const leastAccessed = await this.client.zRange('img:access', 0, 99); // Bottom 100
      
      // Get largest items
      const largestItems = await this.client.zRange('img:sizes', 0, 49, { REV: true }); // Top 50 largest
      
      // Remove items that are both old and large
      const toRemove = leastAccessed.filter(key => largestItems.includes(key));
      
      if (toRemove.length > 0) {
        const pipeline = this.client.multi();
        toRemove.forEach(key => {
          pipeline.del(key);
          pipeline.del(`${key}:meta`);
          pipeline.zRem('img:access', key);
          pipeline.zRem('img:sizes', key);
        });
        
        await pipeline.exec();
        this.stats.evictions += toRemove.length;
        
        console.log(`Optimized cache: removed ${toRemove.length} items`);
      }
    } catch (error) {
      console.error('Cache optimization error:', error);
    }
  }

  /**
   * Warm cache with frequently accessed images
   */
  async warmCache(imageKeys: string[]): Promise<void> {
    if (!this.isConnected) return;

    try {
      // Pre-populate access tracking for these keys
      const pipeline = this.client.multi();
      const now = Date.now();
      
      imageKeys.forEach((key, index) => {
        pipeline.zAdd('img:access', {
          score: now + index, // Slightly different scores
          value: this.buildKey(key),
        });
      });
      
      await pipeline.exec();
      console.log(`Warmed cache with ${imageKeys.length} image keys`);
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Private methods
  
  private buildKey(cacheKey: string): string {
    return `${this.config.keyPrefix}${cacheKey}`;
  }

  private async compressBuffer(buffer: Buffer): Promise<string> {
    const { gzip } = await import('zlib');
    const { promisify } = await import('util');
    const gzipAsync = promisify(gzip);
    
    try {
      const compressed = await gzipAsync(buffer);
      return compressed.toString('base64');
    } catch (error) {
      console.error('Compression error:', error);
      return buffer.toString('base64');
    }
  }

  private async decompressBuffer(compressedData: string): Promise<Buffer> {
    const { gunzip } = await import('zlib');
    const { promisify } = await import('util');
    const gunzipAsync = promisify(gunzip);
    
    try {
      const compressed = Buffer.from(compressedData, 'base64');
      return await gunzipAsync(compressed);
    } catch (error) {
      console.error('Decompression error:', error);
      return Buffer.from(compressedData, 'base64');
    }
  }

  private async updateAccessTracking(key: string): Promise<void> {
    try {
      await this.client.zAdd('img:access', {
        score: Date.now(),
        value: key,
      });
    } catch (error) {
      console.error('Access tracking error:', error);
    }
  }

  private async getKeysByTTL(): Promise<Record<string, number>> {
    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}*`);
      const ttls = await Promise.all(keys.map(key => this.client.ttl(key)));
      
      const buckets: Record<string, number> = {
        'expired': 0,
        '0-300': 0,
        '300-900': 0,
        '900-3600': 0,
        '3600+': 0,
      };

      ttls.forEach(ttl => {
        if (ttl === -2) buckets['expired']++;
        else if (ttl <= 300) buckets['0-300']++;
        else if (ttl <= 900) buckets['300-900']++;
        else if (ttl <= 3600) buckets['900-3600']++;
        else buckets['3600+']++;
      });

      return buckets;
    } catch (error) {
      console.error('Error getting keys by TTL:', error);
      return {};
    }
  }

  private setupEventHandlers(): void {
    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis client disconnected');
      this.isConnected = false;
    });
  }
}

// Generate cache key from image parameters
export function generateImageCacheKey(
  imagePath: string,
  options: Record<string, any>
): string {
  const hash = createHash('sha256');
  hash.update(imagePath);
  hash.update(JSON.stringify(options));
  return hash.digest('hex');
}

// Export singleton instance
export const redisImageCache = new RedisImageCache();

// Auto-initialize if Redis URL is available
if (process.env.REDIS_URL) {
  redisImageCache.initialize().catch(console.error);
}