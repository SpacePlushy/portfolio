/**
 * Service Worker Registration and Management
 */

export interface CacheStats {
  cacheSize: number;
  maxCacheSize: number;
  cacheUtilization: number;
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async register(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw-image-cache.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('SW registered:', this.registration.scope);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW is available
              this.notifyUpdate();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('SW registration failed:', error);
      return false;
    }
  }

  async getCacheStats(): Promise<CacheStats | null> {
    if (!this.registration?.active) return null;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration?.active?.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  async preloadCriticalImages(urls: string[]): Promise<void> {
    if (!this.registration?.active) return;

    this.registration.active.postMessage({
      type: 'PRELOAD_IMAGES',
      urls
    });
  }

  private notifyUpdate(): void {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  async updateServiceWorker(): Promise<void> {
    if (!this.registration) return;

    const newWorker = this.registration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
}

// Auto-register service worker
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    const swManager = ServiceWorkerManager.getInstance();
    await swManager.register();
  });
}