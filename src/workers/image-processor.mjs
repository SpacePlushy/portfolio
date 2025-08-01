/**
 * Image Processing Worker Thread
 * Offloads CPU-intensive image processing to prevent main thread blocking
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpus } from 'os';
import sharp from 'sharp';

if (isMainThread) {
  // Main thread - Simplified version for production compatibility
  class ImageProcessorPool {
    constructor(poolSize = cpus().length) {
      this.poolSize = poolSize;
      this.workers = [];
      this.queue = [];
      this.roundRobinIndex = 0;
      this.isInitialized = false;
    }

    async initialize() {
      if (this.isInitialized) return;

      // Create worker pool
      for (let i = 0; i < this.poolSize; i++) {
        const worker = new Worker(__filename, {
          workerData: { workerId: i }
        });

        worker.on('error', (error) => {
          console.error(`Worker ${i} error:`, error);
          this.restartWorker(i);
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            console.error(`Worker ${i} exited with code ${code}`);
            this.restartWorker(i);
          }
        });

        this.workers.push({
          worker,
          busy: false,
          processed: 0,
          errors: 0,
        });
      }

      this.isInitialized = true;
      console.log(`Image processor pool initialized with ${this.poolSize} workers`);
    }

    async processImage(inputBuffer, options = {}) {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return new Promise((resolve, reject) => {
        const task = {
          inputBuffer,
          options,
          resolve,
          reject,
          createdAt: Date.now(),
        };

        // Find available worker or queue the task
        const availableWorker = this.findAvailableWorker();
        if (availableWorker) {
          this.assignTask(availableWorker, task);
        } else {
          this.queue.push(task);
        }
      });
    }

    async processBatch(images, options = {}) {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const batchSize = Math.min(images.length, this.poolSize);
      const batches = [];
      
      // Split into batches
      for (let i = 0; i < images.length; i += batchSize) {
        batches.push(images.slice(i, i + batchSize));
      }

      const results = [];
      
      // Process batches sequentially to avoid overwhelming workers
      for (const batch of batches) {
        const batchPromises = batch.map(image => 
          this.processImage(image.buffer, { ...options, ...image.options })
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
      }

      return results;
    }

    findAvailableWorker() {
      // Round-robin selection with load balancing
      let attempts = 0;
      while (attempts < this.workers.length) {
        const worker = this.workers[this.roundRobinIndex];
        this.roundRobinIndex = (this.roundRobinIndex + 1) % this.workers.length;
        
        if (!worker.busy) {
          return worker;
        }
        attempts++;
      }
      return null;
    }

    assignTask(workerInfo, task) {
      workerInfo.busy = true;
      
      const messageHandler = (result) => {
        workerInfo.busy = false;
        workerInfo.processed++;
        
        if (result.success) {
          // Convert base64 back to Buffer
          result.data.buffer = Buffer.from(result.data.buffer, 'base64');
          task.resolve(result.data);
        } else {
          workerInfo.errors++;
          task.reject(new Error(result.error));
        }

        // Process next queued task
        this.processQueue();
        
        // Remove event listener
        workerInfo.worker.off('message', messageHandler);
      };

      workerInfo.worker.on('message', messageHandler);
      
      // Send task to worker
      workerInfo.worker.postMessage({
        type: 'process',
        data: {
          inputBuffer: task.inputBuffer.toString('base64'),
          options: task.options,
        },
      });
    }

    processQueue() {
      if (this.queue.length === 0) return;
      
      const availableWorker = this.findAvailableWorker();
      if (availableWorker) {
        const task = this.queue.shift();
        this.assignTask(availableWorker, task);
      }
    }

    restartWorker(index) {
      const oldWorker = this.workers[index];
      if (oldWorker) {
        oldWorker.worker.terminate();
      }

      const worker = new Worker(__filename, {
        workerData: { workerId: index }
      });

      worker.on('error', (error) => {
        console.error(`Restarted worker ${index} error:`, error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Restarted worker ${index} exited with code ${code}`);
        }
      });

      this.workers[index] = {
        worker,
        busy: false,
        processed: 0,
        errors: 0,
      };
    }

    getStats() {
      return {
        poolSize: this.poolSize,
        queueLength: this.queue.length,
        workers: this.workers.map((w, i) => ({
          id: i,
          busy: w.busy,
          processed: w.processed,
          errors: w.errors,
        })),
        totalProcessed: this.workers.reduce((sum, w) => sum + w.processed, 0),
        totalErrors: this.workers.reduce((sum, w) => sum + w.errors, 0),
      };
    }

    async shutdown() {
      await Promise.all(
        this.workers.map(w => w.worker.terminate())
      );
      this.workers = [];
      this.queue = [];
      this.isInitialized = false;
    }
  }

}

export default ImageProcessorPool;

if (!isMainThread) {
  // Worker thread - Image processing
  const workerId = workerData.workerId;
  
  // Configure Sharp for worker thread
  sharp.cache({
    memory: 50, // 50MB per worker
    files: 20,
    items: 50,
  });

  console.log(`Image worker ${workerId} started`);

  parentPort.on('message', async (message) => {
    if (message.type === 'process') {
      try {
        const { inputBuffer, options } = message.data;
        const buffer = Buffer.from(inputBuffer, 'base64');
        
        const result = await processImageInWorker(buffer, options);
        
        parentPort.postMessage({
          success: true,
          data: {
            ...result,
            buffer: result.buffer.toString('base64'), // Convert to base64 for transfer
          },
        });
      } catch (error) {
        parentPort.postMessage({
          success: false,
          error: error.message,
        });
      }
    }
  });

  async function processImageInWorker(inputBuffer, options = {}) {
    const startTime = process.hrtime.bigint();
    const originalSize = inputBuffer.length;

    // Create Sharp instance
    let sharpInstance = sharp(inputBuffer, {
      failOnError: false,
      limitInputPixels: 268402689,
      sequentialRead: true,
    });

    // Get metadata
    // const metadata = await sharpInstance.metadata(); // Currently unused

    // Apply transformations
    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        position: options.position || 'centre',
        background: options.background || { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: false,
        fastShrinkOnLoad: true,
      });
    }

    // Apply filters
    if (options.blur) {
      sharpInstance = sharpInstance.blur(Math.min(options.blur, 1000));
    }

    if (options.sharpen) {
      sharpInstance = sharpInstance.sharpen();
    }

    if (options.grayscale) {
      sharpInstance = sharpInstance.grayscale();
    }

    // Apply format optimizations
    const quality = Math.max(1, Math.min(100, options.quality || 80));
    
    switch (options.format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: options.progressive !== false,
          mozjpeg: true,
        });
        break;

      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          lossless: options.lossless || false,
          effort: 4,
        });
        break;

      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          lossless: options.lossless || false,
          effort: 4,
        });
        break;

      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          compressionLevel: 9,
          progressive: options.progressive !== false,
        });
        break;

      default:
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: true,
        });
    }

    // Process image
    const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });
    
    const endTime = process.hrtime.bigint();
    const processingTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    const optimizedSize = data.length;
    const compressionRatio = (1 - optimizedSize / originalSize) * 100;

    return {
      buffer: data,
      info,
      originalSize,
      optimizedSize,
      compressionRatio,
      processingTime,
      workerId,
    };
  }

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`Worker ${workerId} shutting down gracefully`);
    process.exit(0);
  });
}