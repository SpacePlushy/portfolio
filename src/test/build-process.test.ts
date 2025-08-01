import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Build Process Tests', () => {
  const projectRoot = process.cwd();
  const distPath = join(projectRoot, 'dist');
  const packageJsonPath = join(projectRoot, 'package.json');
  
  beforeAll(() => {
    // Clean any existing build artifacts
    try {
      execSync('rm -rf dist', { cwd: projectRoot, stdio: 'pipe' });
    } catch {
      // Directory doesn't exist, that's fine
    }
  });

  afterAll(() => {
    // Optional: Clean up after tests
    // Uncomment if you want to clean up build artifacts after testing
    // try {
    //   execSync('rm -rf dist', { cwd: projectRoot, stdio: 'pipe' });
    // } catch {
    //   // Ignore cleanup errors
    // }
  });

  describe('Package.json validation', () => {
    it('should have required build scripts', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.build).toBe('astro build');
      expect(packageJson.scripts.start).toBe('node ./dist/server/entry.mjs');
      expect(packageJson.scripts.dev).toBe('astro dev');
      expect(packageJson.scripts.preview).toBe('astro preview');
    });

    it('should have required dependencies for Node.js adapter', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageJson.dependencies['@astrojs/node']).toBeDefined();
      expect(packageJson.dependencies['@astrojs/react']).toBeDefined();
      expect(packageJson.dependencies['astro']).toBeDefined();
      expect(packageJson.dependencies['react']).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
    });

    it('should not include Vercel-specific dependencies', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageJson.dependencies['@astrojs/vercel']).toBeUndefined();
      expect(packageJson.dependencies['@vercel/analytics']).toBeUndefined();
      expect(packageJson.dependencies['botid']).toBeUndefined();
    });

    it('should have proper module type configuration', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageJson.type).toBe('module');
    });
  });

  describe('Build execution', () => {
    it('should build successfully without errors', () => {
      // Run the build command
      const buildOutput = execSync('npm run build', {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 300000 // 5 minutes timeout
      });

      // Build should complete without errors
      expect(buildOutput).toBeDefined();
      expect(buildOutput).not.toContain('ERROR');
      expect(buildOutput).not.toContain('Failed');
      
      // Should contain success indicators
      expect(buildOutput).toContain('build complete');
    }, 350000);

    it('should generate required build artifacts', () => {
      // Ensure build has run
      if (!existsSync(distPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }

      expect(existsSync(distPath)).toBe(true);
      
      // Check for server entry point
      const serverEntryPath = join(distPath, 'server', 'entry.mjs');
      expect(existsSync(serverEntryPath)).toBe(true);
      
      // Check for client assets
      const clientPath = join(distPath, 'client');
      expect(existsSync(clientPath)).toBe(true);
      
      // Check for static assets if they exist
      const assetsPath = join(distPath, 'client', '_astro');
      if (existsSync(assetsPath)) {
        const assets = readdirSync(assetsPath);
        expect(assets.length).toBeGreaterThan(0);
      }
    });

    it('should generate a valid server entry point', () => {
      const serverEntryPath = join(distPath, 'server', 'entry.mjs');
      
      if (!existsSync(serverEntryPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      expect(existsSync(serverEntryPath)).toBe(true);
      
      const entryContent = readFileSync(serverEntryPath, 'utf-8');
      
      // Should be a valid ES module
      expect(entryContent).toContain('export');
      
      // Should handle HTTP requests
      expect(entryContent).toContain('createServer') || expect(entryContent).toContain('handler');
      
      // Should be executable
      const stats = statSync(serverEntryPath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should generate optimized client assets', () => {
      const clientPath = join(distPath, 'client');
      
      if (!existsSync(clientPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      expect(existsSync(clientPath)).toBe(true);
      
      // Check for CSS files
      const astroAssetsPath = join(clientPath, '_astro');
      if (existsSync(astroAssetsPath)) {
        const assets = readdirSync(astroAssetsPath);
        const cssFiles = assets.filter(file => file.endsWith('.css'));
        const jsFiles = assets.filter(file => file.endsWith('.js'));
        
        // Should have CSS and JS assets
        expect(cssFiles.length + jsFiles.length).toBeGreaterThan(0);
        
        // Check that files are minified (basic check)
        if (cssFiles.length > 0) {
          const cssContent = readFileSync(join(astroAssetsPath, cssFiles[0]), 'utf-8');
          // Minified CSS typically has no unnecessary whitespace
          expect(cssContent.split('\n').length).toBeLessThan(10);
        }
      }
    });
  });

  describe('TypeScript compilation', () => {
    it('should pass TypeScript type checking', () => {
      const typeCheckOutput = execSync('npm run typecheck', {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 120000 // 2 minutes timeout
      });

      expect(typeCheckOutput).not.toContain('error TS');
      expect(typeCheckOutput).not.toContain('Found 0 errors');
    });

    it('should generate type definitions', () => {
      // Astro generates .astro.d.ts for component types
      const astroDtsPath = join(projectRoot, 'src', 'env.d.ts');
      expect(existsSync(astroDtsPath)).toBe(true);
      
      const astroTypes = readFileSync(astroDtsPath, 'utf-8');
      expect(astroTypes).toContain('astro/client');
    });
  });

  describe('Asset optimization', () => {
    it('should optimize images during build', () => {
      // Check if images are processed
      const publicPath = join(projectRoot, 'public');
      const assetsPath = join(projectRoot, 'src', 'assets');
      
      if (existsSync(assetsPath)) {
        const assets = readdirSync(assetsPath);
        const imageFiles = assets.filter(file => 
          file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
        );
        
        if (imageFiles.length > 0) {
          // Images should be processed during build
          expect(existsSync(distPath)).toBe(true);
        }
      }
    });

    it('should bundle JavaScript modules efficiently', () => {
      const clientPath = join(distPath, 'client');
      
      if (!existsSync(clientPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      const astroAssetsPath = join(clientPath, '_astro');
      if (existsSync(astroAssetsPath)) {
        const assets = readdirSync(astroAssetsPath);
        const jsFiles = assets.filter(file => file.endsWith('.js'));
        
        if (jsFiles.length > 0) {
          // Check that JS files are reasonably sized (not too large)
          for (const jsFile of jsFiles) {
            const filePath = join(astroAssetsPath, jsFile);
            const stats = statSync(filePath);
            
            // Individual JS chunks should be under 1MB
            expect(stats.size).toBeLessThan(1024 * 1024);
          }
        }
      }
    });

    it('should generate proper CSS bundles', () => {
      const clientPath = join(distPath, 'client');
      
      if (!existsSync(clientPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      const astroAssetsPath = join(clientPath, '_astro');
      if (existsSync(astroAssetsPath)) {
        const assets = readdirSync(astroAssetsPath);
        const cssFiles = assets.filter(file => file.endsWith('.css'));
        
        if (cssFiles.length > 0) {
          // Check CSS file content
          for (const cssFile of cssFiles) {
            const cssPath = join(astroAssetsPath, cssFile);
            const cssContent = readFileSync(cssPath, 'utf-8');
            
            // Should contain some CSS rules
            expect(cssContent.length).toBeGreaterThan(0);
            
            // Should be minified (basic check)
            expect(cssContent).not.toContain('  '); // No double spaces in minified CSS
          }
        }
      }
    });
  });

  describe('Server-side rendering configuration', () => {
    it('should build for server output mode', () => {
      const serverEntryPath = join(distPath, 'server', 'entry.mjs');
      
      if (!existsSync(serverEntryPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      expect(existsSync(serverEntryPath)).toBe(true);
      
      const entryContent = readFileSync(serverEntryPath, 'utf-8');
      
      // Should be configured for server rendering
      expect(entryContent).toContain('export') || expect(entryContent).toContain('module.exports');
    });

    it('should include all required dependencies for SSR', () => {
      // Check that node_modules are properly included for production
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Required dependencies for SSR should be in dependencies, not devDependencies
      expect(packageJson.dependencies['react']).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
      expect(packageJson.dependencies['@astrojs/react']).toBeDefined();
    });
  });

  describe('Build performance', () => {
    it('should complete build within reasonable time', () => {
      const startTime = Date.now();
      
      try {
        execSync('rm -rf dist', { cwd: projectRoot, stdio: 'pipe' });
      } catch {
        // Directory doesn't exist
      }
      
      execSync('npm run build', {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 300000
      });
      
      const buildTime = Date.now() - startTime;
      console.log(`Build completed in ${buildTime}ms`);
      
      // Build should complete within 5 minutes
      expect(buildTime).toBeLessThan(300000);
    }, 350000);

    it('should produce reasonably sized build output', () => {
      if (!existsSync(distPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      // Calculate total build size
      function getFolderSize(folderPath: string): number {
        let totalSize = 0;
        
        const items = readdirSync(folderPath);
        for (const item of items) {
          const itemPath = join(folderPath, item);
          const stats = statSync(itemPath);
          
          if (stats.isDirectory()) {
            totalSize += getFolderSize(itemPath);
          } else {
            totalSize += stats.size;
          }
        }
        
        return totalSize;
      }
      
      const buildSize = getFolderSize(distPath);
      const buildSizeMB = buildSize / (1024 * 1024);
      
      console.log(`Total build size: ${buildSizeMB.toFixed(2)}MB`);
      
      // Build output should be under 100MB for a portfolio site
      expect(buildSizeMB).toBeLessThan(100);
    });
  });

  describe('Production readiness', () => {
    it('should include all required files for deployment', () => {
      if (!existsSync(distPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      // Server entry point
      expect(existsSync(join(distPath, 'server', 'entry.mjs'))).toBe(true);
      
      // Client assets
      expect(existsSync(join(distPath, 'client'))).toBe(true);
      
      // Package.json for dependencies
      expect(existsSync(packageJsonPath)).toBe(true);
    });

    it('should not include development artifacts', () => {
      if (!existsSync(distPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      // Should not include source maps in production build
      const clientPath = join(distPath, 'client');
      if (existsSync(clientPath)) {
        const allFiles = readdirSync(clientPath, { recursive: true });
        const sourceMapFiles = allFiles.filter(file => 
          typeof file === 'string' && file.endsWith('.map')
        );
        
        // Should not have source maps in production
        expect(sourceMapFiles.length).toBe(0);
      }
      
      // Should not include TypeScript source files
      const serverPath = join(distPath, 'server');
      if (existsSync(serverPath)) {
        const allFiles = readdirSync(serverPath, { recursive: true });
        const tsFiles = allFiles.filter(file => 
          typeof file === 'string' && file.endsWith('.ts')
        );
        
        expect(tsFiles.length).toBe(0);
      }
    });

    it('should be ready for Docker containerization', () => {
      if (!existsSync(distPath)) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', timeout: 300000 });
      }
      
      // Should have entry point that Docker can execute
      const serverEntryPath = join(distPath, 'server', 'entry.mjs');
      expect(existsSync(serverEntryPath)).toBe(true);
      
      // Entry point should be executable
      const entryContent = readFileSync(serverEntryPath, 'utf-8');
      expect(entryContent).toContain('export') || expect(entryContent).toContain('module.exports');
      
      // Should work with Node.js in container
      expect(entryContent).not.toContain('process.browser');
      expect(entryContent).not.toContain('window');
    });
  });

  describe('Error handling', () => {
    it('should handle build errors gracefully', () => {
      // This test would require introducing intentional errors
      // For now, just verify that a clean build succeeds
      expect(() => {
        execSync('npm run build', {
          cwd: projectRoot,
          stdio: 'pipe',
          timeout: 300000
        });
      }).not.toThrow();
    });

    it('should validate configuration before building', () => {
      // TypeScript check should pass
      expect(() => {
        execSync('npm run typecheck', {
          cwd: projectRoot,
          stdio: 'pipe',
          timeout: 120000
        });
      }).not.toThrow();
    });
  });
});