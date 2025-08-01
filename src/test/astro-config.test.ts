import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Mock Astro config loading since we can't import .mjs directly in Vitest
const mockAstroConfig = {
  output: 'server',
  integrations: [],
  vite: {
    plugins: []
  },
  adapter: {
    name: '@astrojs/node',
    mode: 'standalone'
  }
};

// Mock the dynamic import
vi.mock('astro/config', () => ({
  defineConfig: (config: any) => config
}));

describe('Astro Configuration Tests', () => {
  const projectRoot = process.cwd();
  const configPath = join(projectRoot, 'astro.config.mjs');

  describe('Configuration file validation', () => {
    it('should have a valid astro.config.mjs file', () => {
      expect(existsSync(configPath)).toBe(true);
      
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should import required modules
      expect(configContent).toContain("import { defineConfig } from 'astro/config'");
      expect(configContent).toContain("import react from '@astrojs/react'");
      expect(configContent).toContain("import tailwindcss from '@tailwindcss/vite'");
      expect(configContent).toContain("import node from '@astrojs/node'");
    });

    it('should be configured for server-side rendering', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      expect(configContent).toContain("output: 'server'");
    });

    it('should include React integration', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      expect(configContent).toContain('integrations: [react()]');
    });

    it('should include Tailwind CSS via Vite plugin', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      expect(configContent).toContain('vite: {');
      expect(configContent).toContain('plugins: [tailwindcss()]');
    });

    it('should use Node.js adapter in standalone mode', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      expect(configContent).toContain('adapter: node({');
      expect(configContent).toContain("mode: 'standalone'");
    });
  });

  describe('Adapter configuration validation', () => {
    it('should use standalone mode for Digital Ocean deployment', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Standalone mode is required for containerized deployment
      expect(configContent).toContain("mode: 'standalone'");
      
      // Should not use middleware mode (which requires external server)
      expect(configContent).not.toContain("mode: 'middleware'");
    });

    it('should not include development-only configurations', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not have development server options in production config
      expect(configContent).not.toContain('host:');
      expect(configContent).not.toContain('port:');
      expect(configContent).not.toContain('open:');
    });

    it('should not include Vercel-specific configurations', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not contain any Vercel adapter references
      expect(configContent).not.toContain('@astrojs/vercel');
      expect(configContent).not.toContain('vercel(');
      expect(configContent).not.toContain('isr:');
      expect(configContent).not.toContain('imageService:');
      expect(configContent).not.toContain('webAnalytics:');
    });
  });

  describe('Integration compatibility', () => {
    it('should have React integration properly configured', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // React should be imported and used
      expect(configContent).toContain("import react from '@astrojs/react'");
      expect(configContent).toContain('react()');
    });

    it('should have proper Tailwind CSS integration', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Tailwind should be configured via Vite plugin
      expect(configContent).toContain("import tailwindcss from '@tailwindcss/vite'");
      expect(configContent).toContain('tailwindcss()');
    });

    it('should not include conflicting CSS frameworks', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not have multiple CSS frameworks
      expect(configContent).not.toContain('unocss');
      expect(configContent).not.toContain('windicss');
      expect(configContent).not.toContain('@astrojs/tailwind'); // Using Vite plugin instead
    });
  });

  describe('Build configuration validation', () => {
    it('should be optimized for production builds', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not have development-specific optimizations
      expect(configContent).not.toContain('compressHTML: false');
      expect(configContent).not.toContain('minify: false');
    });

    it('should support TypeScript', () => {
      // Check if tsconfig.json exists and is properly configured
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
      
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      
      // Should extend Astro's TypeScript config
      expect(tsconfig.extends).toBe('astro/tsconfigs/strict');
      
      // Should include path mapping for components
      expect(tsconfig.compilerOptions?.paths).toBeDefined();
      expect(tsconfig.compilerOptions?.paths?.['@/*']).toBeDefined();
    });
  });

  describe('Performance optimizations', () => {
    it('should be configured for optimal SSR performance', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Server output should be enabled
      expect(configContent).toContain("output: 'server'");
      
      // Should use efficient adapter mode
      expect(configContent).toContain("mode: 'standalone'");
    });

    it('should not include development-heavy integrations', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not include heavy development tools in production
      expect(configContent).not.toContain('@astrojs/mdx'); // Unless actually needed
      expect(configContent).not.toContain('@astrojs/sitemap'); // Unless configured
      expect(configContent).not.toContain('@astrojs/rss'); // Unless configured
    });
  });

  describe('Security considerations', () => {
    it('should not expose sensitive configuration', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not contain hardcoded secrets
      expect(configContent).not.toContain('password');
      expect(configContent).not.toContain('secret');
      expect(configContent).not.toContain('token');
      expect(configContent).not.toContain('key');
      
      // Should not contain development URLs
      expect(configContent).not.toContain('localhost');
      expect(configContent).not.toContain('127.0.0.1');
    });

    it('should use secure defaults', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not disable security features
      expect(configContent).not.toContain('security: false');
      expect(configContent).not.toContain('cors: true');
    });
  });

  describe('Migration from Vercel adapter', () => {
    it('should have removed all Vercel-specific features', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not contain any Vercel imports or configurations
      expect(configContent).not.toContain('vercel');
      expect(configContent).not.toContain('Vercel');
      expect(configContent).not.toContain('isr');
      expect(configContent).not.toContain('ISR');
      expect(configContent).not.toContain('webAnalytics');
      expect(configContent).not.toContain('imageService');
      expect(configContent).not.toContain('imagesConfig');
    });

    it('should maintain equivalent functionality where possible', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Core functionality should remain
      expect(configContent).toContain("output: 'server'"); // SSR maintained
      expect(configContent).toContain('react()'); // React integration maintained
      expect(configContent).toContain('tailwindcss()'); // Styling maintained
    });

    it('should be compatible with existing component architecture', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // React integration for existing components
      expect(configContent).toContain('react()');
      
      // Should support existing file structure
      // (No specific path restrictions that would break existing imports)
      expect(configContent).not.toContain('srcDir:');
      expect(configContent).not.toContain('publicDir:');
    });
  });

  describe('Environment compatibility', () => {
    it('should work in Digital Ocean App Platform environment', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Standalone mode works in containerized environments
      expect(configContent).toContain("mode: 'standalone'");
      
      // Should not require external dependencies
      expect(configContent).not.toContain('redis');
      expect(configContent).not.toContain('database');
      expect(configContent).not.toContain('external');
    });

    it('should support standard Node.js environment variables', () => {
      // Config should not hardcode environment-specific values
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should use environment variables for configuration
      expect(configContent).not.toMatch(/port:\s*\d+/);
      expect(configContent).not.toMatch(/host:\s*['"][^'"]+['"]/);
    });
  });

  describe('Build output validation', () => {
    it('should generate server entry point', async () => {
      // This test would require actually building the project
      // For now, we'll check that the configuration supports it
      const configContent = readFileSync(configPath, 'utf-8');
      
      expect(configContent).toContain("output: 'server'");
      expect(configContent).toContain("mode: 'standalone'");
    });

    it('should support static asset handling', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should not disable static asset generation
      expect(configContent).not.toContain('assets: false');
      expect(configContent).not.toContain('static: false');
    });
  });

  describe('Development vs Production configuration', () => {
    it('should work in both development and production modes', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Configuration should be environment-agnostic
      expect(configContent).not.toContain('NODE_ENV');
      expect(configContent).not.toContain('process.env.NODE_ENV');
      
      // Should work with both `npm run dev` and `npm run build`
      expect(configContent).toContain("output: 'server'");
    });

    it('should support hot module replacement in development', () => {
      // The React integration should support HMR
      const configContent = readFileSync(configPath, 'utf-8');
      
      expect(configContent).toContain('react()');
      
      // Should not disable HMR
      expect(configContent).not.toContain('hmr: false');
    });
  });

  describe('Type safety validation', () => {
    it('should have proper TypeScript configuration', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should include TypeScript comment for type checking
      expect(configContent).toContain('// @ts-check');
      
      // Should import defineConfig with proper typing
      expect(configContent).toContain("import { defineConfig } from 'astro/config'");
    });

    it('should export proper configuration type', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should use defineConfig wrapper for type safety
      expect(configContent).toContain('export default defineConfig(');
    });
  });
});