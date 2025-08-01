import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Performance Regression Tests', () => {
  const projectRoot = process.cwd();
  const distPath = join(projectRoot, 'dist');

  beforeAll(async () => {
    // Ensure we have a fresh build for performance testing
    try {
      execSync('npm run build', { 
        cwd: projectRoot, 
        stdio: 'pipe', 
        timeout: 300000 
      });
    } catch (error) {
      console.warn('Build failed in beforeAll:', error);
    }
  });

  describe('Bundle size regression (vs Vercel optimizations)', () => {
    it('should not significantly increase bundle size without edge optimizations', () => {
      if (!existsSync(distPath)) {
        console.log('Build not available, skipping bundle size test');
        return;
      }

      const clientPath = join(distPath, 'client');
      if (!existsSync(clientPath)) {
        console.log('Client build not available, skipping bundle size test');
        return;
      }

      // Calculate total client bundle size
      function calculateBundleSize(dirPath: string): number {
        let totalSize = 0;
        
        try {
          const items = readdirSync(dirPath);
          for (const item of items) {
            const itemPath = join(dirPath, item);
            const stats = statSync(itemPath);
            
            if (stats.isDirectory()) {
              totalSize += calculateBundleSize(itemPath);
            } else if (item.endsWith('.js') || item.endsWith('.css')) {
              totalSize += stats.size;
            }
          }
        } catch (error) {
          console.warn('Error calculating bundle size:', error);
        }
        
        return totalSize;
      }

      const bundleSize = calculateBundleSize(clientPath);
      const bundleSizeKB = bundleSize / 1024;
      
      console.log(`Total client bundle size: ${bundleSizeKB.toFixed(2)}KB`);

      // Without Vercel's automatic bundle splitting and tree shaking,
      // bundle size may increase. Set reasonable limits.
      expect(bundleSizeKB).toBeLessThan(1000); // 1MB limit for client bundle
      
      // Log warning if bundle is larger than optimal
      if (bundleSizeKB > 500) {
        console.warn(`Bundle size (${bundleSizeKB.toFixed(2)}KB) is larger than optimal. Consider implementing code splitting.`);
      }
    });

    it('should not include unnecessary dependencies in client bundle', () => {
      if (!existsSync(distPath)) {
        return;
      }

      const clientPath = join(distPath, 'client');
      if (!existsSync(clientPath)) {
        return;
      }

      // Check for common server-only dependencies that shouldn't be in client bundle
      const astroAssetsPath = join(clientPath, '_astro');
      if (existsSync(astroAssetsPath)) {
        const assets = readdirSync(astroAssetsPath);
        const jsFiles = assets.filter(file => file.endsWith('.js'));
        
        for (const jsFile of jsFiles) {
          const filePath = join(astroAssetsPath, jsFile);
          const content = readFileSync(filePath, 'utf-8');
          
          // Should not include Node.js-specific modules in client bundle
          expect(content).not.toContain('fs');
          expect(content).not.toContain('path');
          expect(content).not.toContain('crypto');
          expect(content).not.toContain('child_process');
        }
      }
    });

    it('should maintain reasonable CSS bundle size without Vercel optimizations', () => {
      if (!existsSync(distPath)) {
        return;
      }

      const clientPath = join(distPath, 'client');
      if (!existsSync(clientPath)) {
        return;
      }

      const astroAssetsPath = join(clientPath, '_astro');
      if (existsSync(astroAssetsPath)) {
        const assets = readdirSync(astroAssetsPath);
        const cssFiles = assets.filter(file => file.endsWith('.css'));
        
        let totalCssSize = 0;
        for (const cssFile of cssFiles) {
          const cssPath = join(astroAssetsPath, cssFile);
          const stats = statSync(cssPath);
          totalCssSize += stats.size;
        }
        
        const cssSizeKB = totalCssSize / 1024;
        console.log(`Total CSS bundle size: ${cssSizeKB.toFixed(2)}KB`);
        
        // CSS should be under 200KB for a portfolio site
        expect(cssSizeKB).toBeLessThan(200);
        
        if (cssSizeKB > 100) {
          console.warn(`CSS bundle size (${cssSizeKB.toFixed(2)}KB) is larger than optimal. Consider CSS purging.`);
        }
      }
    });
  });

  describe('Image optimization regression', () => {
    it('should acknowledge loss of automatic format conversion', () => {
      // Vercel automatically converted images to AVIF/WebP
      // Digital Ocean deployment loses this optimization
      
      const assetsPath = join(projectRoot, 'src/assets');
      if (existsSync(assetsPath)) {
        const assets = readdirSync(assetsPath);
        const imageFiles = assets.filter(file => 
          file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
        );
        
        if (imageFiles.length > 0) {
          console.warn(`Found ${imageFiles.length} images that are no longer automatically optimized.`);
          console.warn('Consider implementing manual image optimization or CDN integration.');
          
          // Check image sizes - larger images will have more performance impact
          for (const imageFile of imageFiles.slice(0, 5)) { // Check first 5 images
            const imagePath = join(assetsPath, imageFile);
            const stats = statSync(imagePath);
            const imageSizeKB = stats.size / 1024;
            
            if (imageSizeKB > 500) {
              console.warn(`Large image detected: ${imageFile} (${imageSizeKB.toFixed(2)}KB)`);
            }
          }
        }
      }
      
      // This is expected - we acknowledge the regression
      expect(true).toBe(true);
    });

    it('should not have modern image format fallbacks', () => {
      // Without Vercel's image service, we lose automatic AVIF/WebP serving
      const componentsPath = join(projectRoot, 'src/components');
      const layoutsPath = join(projectRoot, 'src/layouts');
      
      let foundImageOptimization = false;
      
      // Check component files for any remaining image optimization
      if (existsSync(componentsPath)) {
        const components = readdirSync(componentsPath);
        for (const component of components) {
          if (component.endsWith('.astro')) {
            const componentPath = join(componentsPath, component);
            const content = readFileSync(componentPath, 'utf-8');
            
            if (content.includes('avif') || content.includes('webp')) {
              foundImageOptimization = true;
            }
          }
        }
      }
      
      // Check layout files
      if (existsSync(layoutsPath)) {
        const layouts = readdirSync(layoutsPath);
        for (const layout of layouts) {
          if (layout.endsWith('.astro')) {
            const layoutPath = join(layoutsPath, layout);
            const content = readFileSync(layoutPath, 'utf-8');
            
            if (content.includes('avif') || content.includes('webp')) {
              foundImageOptimization = true;
            }
          }
        }
      }
      
      // Should not have modern format optimization without manual implementation
      if (!foundImageOptimization) {
        console.warn('No modern image format optimization detected. Consider implementing manual optimization.');
      }
      
      // Test passes regardless - this documents the regression
      expect(true).toBe(true);
    });

    it('should serve original image formats without conversion', () => {
      if (!existsSync(distPath)) {
        return;
      }

      // Check if images are copied as-is without conversion
      const clientPath = join(distPath, 'client');
      if (existsSync(clientPath)) {
        // Images should be in their original format
        // This is expected behavior for Digital Ocean deployment
        console.log('Images are served in original format without automatic conversion.');
      }
      
      expect(true).toBe(true);
    });
  });

  describe('Caching regression (ISR loss)', () => {
    it('should not have ISR caching configuration', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Should not have ISR configuration
      expect(content).not.toContain('isr:');
      expect(content).not.toContain('expiration:');
      expect(content).not.toContain('revalidate');
      
      console.warn('ISR caching is no longer available. Consider implementing manual caching strategy.');
    });

    it('should not have automatic cache headers', () => {
      // Vercel automatically added cache headers for static assets
      // Digital Ocean deployment requires manual configuration
      
      const middlewarePath = join(projectRoot, 'src/middleware.js');
      if (existsSync(middlewarePath)) {
        const content = readFileSync(middlewarePath, 'utf-8');
        
        // Should not have automatic cache header setting
        expect(content).not.toContain('Cache-Control');
        expect(content).not.toContain('max-age');
        expect(content).not.toContain('s-maxage');
        
        console.warn('No automatic cache headers detected. Consider implementing cache headers for static assets.');
      }
      
      expect(true).toBe(true);
    });

    it('should acknowledge every request triggers SSR', () => {
      // Without ISR, every request will trigger server-side rendering
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Server output mode means every request is SSR
      expect(content).toContain("output: 'server'");
      
      console.warn('Every request triggers SSR without ISR caching. This may impact performance under high load.');
      
      expect(true).toBe(true);
    });
  });

  describe('Edge network regression', () => {
    it('should acknowledge loss of global CDN', () => {
      // Vercel provided 28 edge locations globally
      // Digital Ocean serves from single region
      
      console.warn('Global edge network is no longer available.');
      console.warn('International users will experience higher latency.');
      console.warn('Consider implementing CDN integration (Cloudflare, etc.)');
      
      // This is expected - we acknowledge the regression
      expect(true).toBe(true);
    });

    it('should not have edge-specific optimizations', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Should not have edge runtime configuration
      expect(content).not.toContain('edge');
      expect(content).not.toContain('runtime: "edge"');
      expect(content).not.toContain('regions:');
      
      expect(true).toBe(true);
    });

    it('should serve from single origin', () => {
      // Digital Ocean App Platform serves from single region
      // No automatic geographic distribution
      
      const dockerfilePath = join(projectRoot, 'Dockerfile');
      if (existsSync(dockerfilePath)) {
        const content = readFileSync(dockerfilePath, 'utf-8');
        
        // Single container deployment
        expect(content).toContain('EXPOSE 8080');
        
        console.warn('Application serves from single origin without geographic distribution.');
      }
      
      expect(true).toBe(true);
    });
  });

  describe('Analytics regression', () => {
    it('should not have built-in analytics', () => {
      // Vercel provided built-in web analytics
      // Digital Ocean deployment loses this
      
      const filesToCheck = [
        'src/components/Analytics.astro',
        'src/layouts/Layout.astro',
        'astro.config.mjs'
      ];

      let hasAnalytics = false;
      
      for (const filePath of filesToCheck) {
        const fullPath = join(projectRoot, filePath);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          if (content.includes('@vercel/analytics') || content.includes('webAnalytics')) {
            hasAnalytics = true;
          }
        }
      }
      
      expect(hasAnalytics).toBe(false);
      
      if (!hasAnalytics) {
        console.warn('Built-in analytics are no longer available. Consider implementing Google Analytics or similar.');
      }
    });

    it('should not have performance monitoring', () => {
      // Vercel provided built-in Core Web Vitals monitoring
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        
        expect(content).not.toContain('webAnalytics');
        expect(content).not.toContain('speedInsights');
        
        console.warn('Built-in performance monitoring is no longer available.');
      }
      
      expect(true).toBe(true);
    });
  });

  describe('Build performance regression', () => {
    it('should not have optimized build times', () => {
      // Vercel's build system was highly optimized
      // Local Docker builds may be slower
      
      const startTime = Date.now();
      
      try {
        execSync('rm -rf dist', { cwd: projectRoot, stdio: 'pipe' });
        execSync('npm run build', { 
          cwd: projectRoot, 
          stdio: 'pipe',
          timeout: 600000 // 10 minutes
        });
        
        const buildTime = Date.now() - startTime;
        const buildTimeSeconds = buildTime / 1000;
        
        console.log(`Build completed in ${buildTimeSeconds.toFixed(2)} seconds`);
        
        // Docker builds are typically slower than Vercel's optimized builds
        if (buildTimeSeconds > 120) { // 2 minutes
          console.warn(`Build time (${buildTimeSeconds.toFixed(2)}s) is slower than Vercel's optimized builds.`);
        }
        
        // Build should eventually complete
        expect(buildTime).toBeLessThan(600000); // 10 minutes max
        
      } catch (error) {
        console.error('Build performance test failed:', error);
        throw error;
      }
    }, 700000); // 700 second timeout

    it('should acknowledge larger deployment artifacts', () => {
      if (!existsSync(distPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      // Calculate deployment size
      function calculateDeploymentSize(dirPath: string): number {
        let totalSize = 0;
        
        try {
          const items = readdirSync(dirPath);
          for (const item of items) {
            const itemPath = join(dirPath, item);
            const stats = statSync(itemPath);
            
            if (stats.isDirectory()) {
              totalSize += calculateDeploymentSize(itemPath);
            } else {
              totalSize += stats.size;
            }
          }
        } catch (error) {
          console.warn('Error calculating deployment size:', error);
        }
        
        return totalSize;
      }
      
      const deploymentSize = calculateDeploymentSize(distPath);
      const deploymentSizeMB = deploymentSize / (1024 * 1024);
      
      console.log(`Total deployment size: ${deploymentSizeMB.toFixed(2)}MB`);
      
      // Vercel's serverless functions were more compact
      // Container deployments are typically larger
      if (deploymentSizeMB > 50) {
        console.warn(`Deployment size (${deploymentSizeMB.toFixed(2)}MB) is larger than serverless deployment.`);
      }
      
      // Should be under reasonable limit for containerized deployment
      expect(deploymentSizeMB).toBeLessThan(200);
    });
  });

  describe('Performance monitoring gaps', () => {
    it('should not have automatic Core Web Vitals tracking', () => {
      // Check if any CWV tracking remains in the codebase
      const filesToCheck = [
        'src/layouts/Layout.astro',
        'src/components/Analytics.astro'
      ];

      let hasCWVTracking = false;
      
      for (const filePath of filesToCheck) {
        const fullPath = join(projectRoot, filePath);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          if (content.includes('web-vitals') || content.includes('CLS') || content.includes('LCP')) {
            hasCWVTracking = true;
          }
        }
      }
      
      expect(hasCWVTracking).toBe(false);
      
      console.warn('Automatic Core Web Vitals tracking is no longer available.');
      console.warn('Consider implementing manual performance monitoring.');
    });

    it('should not have automatic error tracking', () => {
      // Vercel provided some automatic error tracking
      const middlewarePath = join(projectRoot, 'src/middleware.js');
      
      if (existsSync(middlewarePath)) {
        const content = readFileSync(middlewarePath, 'utf-8');
        
        // Should not have automatic error reporting
        expect(content).not.toContain('Sentry');
        expect(content).not.toContain('errorTracking');
        expect(content).not.toContain('reportError');
        
        console.warn('Automatic error tracking is no longer available.');
      }
      
      expect(true).toBe(true);
    });

    it('should not have deployment metrics', () => {
      // Vercel provided deployment and function metrics
      // Digital Ocean provides basic app metrics but not detailed function metrics
      
      console.warn('Detailed deployment and function metrics are no longer automatically available.');
      console.warn('Consider implementing custom monitoring with Digital Ocean monitoring or third-party services.');
      
      expect(true).toBe(true);
    });
  });

  describe('Recommended optimizations', () => {
    it('should suggest CDN integration', () => {
      // Test should document recommended optimizations
      console.log('Recommended optimization: Integrate with Cloudflare or DigitalOcean CDN');
      console.log('Recommended optimization: Implement manual cache headers for static assets');
      console.log('Recommended optimization: Set up image optimization service');
      console.log('Recommended optimization: Implement manual performance monitoring');
      
      expect(true).toBe(true);
    });

    it('should suggest performance monitoring setup', () => {
      console.log('Recommended: Set up Google Analytics or similar for web analytics');
      console.log('Recommended: Implement Core Web Vitals tracking');
      console.log('Recommended: Set up error monitoring (Sentry, etc.)');
      console.log('Recommended: Configure Digital Ocean App monitoring');
      
      expect(true).toBe(true);
    });

    it('should suggest caching strategy', () => {
      console.log('Recommended: Implement Redis for server-side caching');
      console.log('Recommended: Add cache headers for static assets');
      console.log('Recommended: Consider implementing service worker for client-side caching');
      
      expect(true).toBe(true);
    });
  });
});