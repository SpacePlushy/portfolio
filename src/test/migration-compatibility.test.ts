import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Migration Compatibility Tests', () => {
  const projectRoot = process.cwd();

  describe('Removed Vercel features', () => {
    it('should not reference Vercel Analytics', () => {
      // Check all source files for Vercel Analytics references
      const filesToCheck = [
        'src/components/Analytics.astro',
        'src/layouts/Layout.astro',
        'astro.config.mjs'
      ];

      for (const filePath of filesToCheck) {
        const fullPath = join(projectRoot, filePath);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Should not contain Vercel Analytics references
          expect(content).not.toContain('@vercel/analytics');
          expect(content).not.toContain('vercel/analytics');
          expect(content).not.toContain('va.track');
          expect(content).not.toContain('Analytics from "@vercel/analytics"');
          expect(content).not.toContain('webAnalytics: { enabled: true }');
        }
      }
    });

    it('should not reference BotID protection', () => {
      // Check for BotID references that should be removed
      const filesToCheck = [
        'src/middleware.js',
        'src/components/BotIDProtection.astro',
        'src/pages/api/contact.js',
        'package.json'
      ];

      for (const filePath of filesToCheck) {
        const fullPath = join(projectRoot, filePath);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Should not contain BotID references
          expect(content).not.toContain('botid');
          expect(content).not.toContain('initBotId');
          expect(content).not.toContain('checkBotId');
          expect(content).not.toContain('BotIDProtection');
        }
      }
    });

    it('should not reference ISR (Incremental Static Regeneration)', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        
        // Should not contain ISR configuration
        expect(content).not.toContain('isr:');
        expect(content).not.toContain('expiration:');
        expect(content).not.toContain('ISR');
        expect(content).not.toContain('revalidate');
      }
    });

    it('should not reference Vercel image optimization', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        
        // Should not contain Vercel image service configuration
        expect(content).not.toContain('imageService: true');
        expect(content).not.toContain('imagesConfig');
        expect(content).not.toContain('formats: [');
        expect(content).not.toContain('minimumCacheTTL');
      }
    });

    it('should not reference vercel.json configuration', () => {
      const vercelJsonPath = join(projectRoot, 'vercel.json');
      
      // vercel.json should not exist in Digital Ocean migration
      expect(existsSync(vercelJsonPath)).toBe(false);
    });
  });

  describe('Replaced functionality', () => {
    it('should have custom bot protection instead of BotID', () => {
      const middlewarePath = join(projectRoot, 'src/middleware.js');
      
      expect(existsSync(middlewarePath)).toBe(true);
      
      const content = readFileSync(middlewarePath, 'utf-8');
      
      // Should have custom bot detection logic
      expect(content).toContain('bot|crawler|spider|scraper|wget|curl');
      expect(content).toContain('likely_bot');
      expect(content).toContain('likely_human');
      expect(content).toContain('user-agent');
    });

    it('should use Node.js adapter instead of Vercel adapter', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Should use Node.js adapter
      expect(content).toContain('@astrojs/node');
      expect(content).toContain("mode: 'standalone'");
      
      // Should not use Vercel adapter
      expect(content).not.toContain('@astrojs/vercel');
    });

    it('should have Docker configuration for containerized deployment', () => {
      const dockerfilePath = join(projectRoot, 'Dockerfile');
      
      expect(existsSync(dockerfilePath)).toBe(true);
      
      const content = readFileSync(dockerfilePath, 'utf-8');
      
      // Should be configured for Digital Ocean deployment
      expect(content).toContain('node:20-alpine');
      expect(content).toContain('EXPOSE 8080');
      expect(content).toContain('ENV HOST=0.0.0.0');
      expect(content).toContain('ENV PORT=8080');
    });

    it('should have Digital Ocean App Platform configuration', () => {
      const appYamlPath = join(projectRoot, 'app.yaml');
      
      if (existsSync(appYamlPath)) {
        const content = readFileSync(appYamlPath, 'utf-8');
        
        // Should have Digital Ocean specific configuration
        expect(content).toContain('name:');
        expect(content).toContain('instance_size_slug:');
        expect(content).toContain('instance_count:');
      }
    });
  });

  describe('Maintained functionality', () => {
    it('should maintain SSR (Server-Side Rendering)', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Should maintain server-side rendering
      expect(content).toContain("output: 'server'");
    });

    it('should maintain React integration', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Should maintain React support
      expect(content).toContain('@astrojs/react');
      expect(content).toContain('react()');
    });

    it('should maintain Tailwind CSS styling', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Should maintain Tailwind CSS
      expect(content).toContain('tailwindcss');
    });

    it('should maintain component structure', () => {
      // Key components should still exist
      const componentPaths = [
        'src/components/Hero.astro',
        'src/components/AboutSection.astro',
        'src/components/SkillsSection.astro',
        'src/components/ContactSection.astro',
        'src/layouts/Layout.astro'
      ];

      for (const componentPath of componentPaths) {
        const fullPath = join(projectRoot, componentPath);
        expect(existsSync(fullPath)).toBe(true);
      }
    });

    it('should maintain routing structure', () => {
      // Key pages should still exist
      const pagePaths = [
        'src/pages/index.astro',
        'src/pages/software-engineer.astro',
        'src/pages/customer-service.astro'
      ];

      for (const pagePath of pagePaths) {
        const fullPath = join(projectRoot, pagePath);
        expect(existsSync(fullPath)).toBe(true);
      }
    });
  });

  describe('Configuration compatibility', () => {
    it('should maintain TypeScript configuration', () => {
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      
      expect(existsSync(tsconfigPath)).toBe(true);
      
      const content = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      
      // Should maintain TypeScript strict mode
      expect(content.extends).toBe('astro/tsconfigs/strict');
      
      // Should maintain path aliases
      expect(content.compilerOptions?.paths).toBeDefined();
      expect(content.compilerOptions?.paths?.['@/*']).toBeDefined();
    });

    it('should maintain package.json scripts', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      
      expect(existsSync(packageJsonPath)).toBe(true);
      
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Should maintain core scripts
      expect(packageJson.scripts.dev).toBe('astro dev');
      expect(packageJson.scripts.build).toBe('astro build');
      expect(packageJson.scripts.preview).toBe('astro preview');
      
      // Should have new production start script
      expect(packageJson.scripts.start).toBe('node ./dist/server/entry.mjs');
    });

    it('should maintain environment type definitions', () => {
      const envDtsPath = join(projectRoot, 'src/env.d.ts');
      
      expect(existsSync(envDtsPath)).toBe(true);
      
      const content = readFileSync(envDtsPath, 'utf-8');
      
      // Should maintain Astro client types
      expect(content).toContain('astro/client');
    });
  });

  describe('Performance implications', () => {
    it('should acknowledge loss of edge network benefits', () => {
      // This is a documentation test - the migration loses Vercel's edge network
      // We should document this performance trade-off
      
      const readmePath = join(projectRoot, 'README.md');
      const performanceAnalysisPath = join(projectRoot, 'PERFORMANCE_ANALYSIS_PR15.md');
      
      // Either README or performance analysis should document the edge network loss
      let documentsPerformanceImpact = false;
      
      if (existsSync(readmePath)) {
        const readme = readFileSync(readmePath, 'utf-8');
        if (readme.includes('edge') || readme.includes('CDN') || readme.includes('performance')) {
          documentsPerformanceImpact = true;
        }
      }
      
      if (existsSync(performanceAnalysisPath)) {
        const analysis = readFileSync(performanceAnalysisPath, 'utf-8');
        if (analysis.includes('edge') || analysis.includes('TTFB') || analysis.includes('performance')) {
          documentsPerformanceImpact = true;
        }
      }
      
      // Should document performance implications
      expect(documentsPerformanceImpact).toBe(true);
    });

    it('should acknowledge loss of automatic ISR caching', () => {
      // Digital Ocean deployment loses automatic ISR - this should be documented
      const performanceAnalysisPath = join(projectRoot, 'PERFORMANCE_ANALYSIS_PR15.md');
      
      if (existsSync(performanceAnalysisPath)) {
        const content = readFileSync(performanceAnalysisPath, 'utf-8');
        
        // Should document ISR loss
        expect(content).toContain('ISR') || expect(content).toContain('caching');
      }
    });

    it('should acknowledge loss of automatic image optimization', () => {
      // Vercel's automatic image optimization is lost
      const performanceAnalysisPath = join(projectRoot, 'PERFORMANCE_ANALYSIS_PR15.md');
      
      if (existsSync(performanceAnalysisPath)) {
        const content = readFileSync(performanceAnalysisPath, 'utf-8');
        
        // Should document image optimization loss
        expect(content).toContain('image') || expect(content).toContain('AVIF') || expect(content).toContain('WebP');
      }
    });
  });

  describe('Security considerations', () => {
    it('should maintain equivalent bot protection', () => {
      const middlewarePath = join(projectRoot, 'src/middleware.js');
      
      expect(existsSync(middlewarePath)).toBe(true);
      
      const content = readFileSync(middlewarePath, 'utf-8');
      
      // Should provide similar bot protection capabilities
      expect(content).toContain('/api/');
      expect(content).toContain('user-agent');
      expect(content).toContain('bot');
      expect(content).toContain('locals.botCheck');
    });

    it('should not expose sensitive configuration', () => {
      const configFiles = [
        'astro.config.mjs',
        'Dockerfile',
        'app.yaml'
      ];

      for (const configFile of configFiles) {
        const fullPath = join(projectRoot, configFile);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Should not contain hardcoded secrets
          expect(content).not.toContain('password');
          expect(content).not.toContain('secret');
          expect(content).not.toContain('key');
          expect(content).not.toContain('token');
        }
      }
    });

    it('should maintain HTTPS redirect capability', () => {
      // Digital Ocean App Platform handles HTTPS automatically
      // But we should verify no HTTP-only configuration
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        
        // Should not force HTTP
        expect(content).not.toContain('https: false');
        expect(content).not.toContain('secure: false');
      }
    });
  });

  describe('Deployment readiness', () => {
    it('should be ready for containerized deployment', () => {
      // Should have all required files for Docker deployment
      expect(existsSync(join(projectRoot, 'Dockerfile'))).toBe(true);
      expect(existsSync(join(projectRoot, 'package.json'))).toBe(true);
      
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
      
      // Should have production start script
      expect(packageJson.scripts.start).toBe('node ./dist/server/entry.mjs');
    });

    it('should be compatible with Digital Ocean App Platform', () => {
      // Should use port 8080 (Digital Ocean default)
      const dockerfilePath = join(projectRoot, 'Dockerfile');
      
      if (existsSync(dockerfilePath)) {
        const content = readFileSync(dockerfilePath, 'utf-8');
        
        expect(content).toContain('EXPOSE 8080');
        expect(content).toContain('ENV PORT=8080');
      }
    });

    it('should maintain development workflow', () => {
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
      
      // Development commands should still work
      expect(packageJson.scripts.dev).toBe('astro dev');
      expect(packageJson.scripts.build).toBe('astro build');
      expect(packageJson.scripts.preview).toBe('astro preview');
      
      // Should have testing commands
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.typecheck).toBeDefined();
    });
  });

  describe('Backwards compatibility', () => {
    it('should maintain API endpoint structure', () => {
      // API endpoints should still work with new middleware
      const middlewarePath = join(projectRoot, 'src/middleware.js');
      
      if (existsSync(middlewarePath)) {
        const content = readFileSync(middlewarePath, 'utf-8');
        
        // Should handle all /api/* routes
        expect(content).toContain('/api/');
        expect(content).toContain('startsWith');
      }
    });

    it('should maintain component hydration patterns', () => {
      // Component hydration should work the same way
      const componentPaths = [
        'src/components/ThemeToggle.astro',
        'src/components/ContactSection.astro'
      ];

      for (const componentPath of componentPaths) {
        const fullPath = join(projectRoot, componentPath);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Should maintain client directive patterns
          if (content.includes('client:')) {
            expect(
              content.includes('client:load') ||
              content.includes('client:visible') ||
              content.includes('client:idle')
            ).toBe(true);
          }
        }
      }
    });

    it('should maintain static asset serving', () => {
      // Static assets should still be served correctly
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        
        // Should not disable static asset handling
        expect(content).not.toContain('assets: false');
        expect(content).not.toContain('static: false');
      }
    });
  });
});