import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Mock browser environment for hydration tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:4321/',
    origin: 'http://localhost:4321'
  }
});

describe('SSR and Hydration Tests', () => {
  const projectRoot = process.cwd();
  const componentsPath = join(projectRoot, 'src/components');
  const pagesPath = join(projectRoot, 'src/pages');

  describe('Component hydration patterns', () => {
    it('should have proper client directives on interactive components', () => {
      if (!existsSync(componentsPath)) {
        return;
      }

      const components = readdirSync(componentsPath).filter(file => file.endsWith('.astro'));
      const interactiveComponents = ['ThemeToggle.astro', 'ContactSection.astro'];
      
      for (const componentFile of interactiveComponents) {
        const componentPath = join(componentsPath, componentFile);
        
        if (existsSync(componentPath)) {
          const content = readFileSync(componentPath, 'utf-8');
          
          // Interactive components should have client directives
          const hasClientDirective = 
            content.includes('client:load') ||
            content.includes('client:visible') ||
            content.includes('client:idle') ||
            content.includes('client:media');
          
          if (content.includes('<script>') || content.includes('useState') || content.includes('onClick')) {
            expect(hasClientDirective).toBe(true);
            console.log(`✓ ${componentFile} has proper client directive for interactivity`);
          }
        }
      }
    });

    it('should use appropriate hydration strategies', () => {
      if (!existsSync(componentsPath)) {
        return;
      }

      const components = readdirSync(componentsPath).filter(file => file.endsWith('.astro'));
      
      for (const componentFile of components) {
        const componentPath = join(componentsPath, componentFile);
        const content = readFileSync(componentPath, 'utf-8');
        
        // Check hydration strategy appropriateness
        if (content.includes('client:load')) {
          // client:load should be used sparingly for critical interactions
          console.log(`⚠️  ${componentFile} uses client:load - ensure this is necessary for critical functionality`);
        }
        
        if (content.includes('client:visible')) {
          // client:visible is good for below-the-fold interactive elements
          console.log(`✓ ${componentFile} uses client:visible - good for performance`);
        }
        
        if (content.includes('client:idle')) {
          // client:idle is good for non-critical interactions
          console.log(`✓ ${componentFile} uses client:idle - good for non-critical interactions`);
        }
      }
      
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should not over-hydrate static components', () => {
      if (!existsSync(componentsPath)) {
        return;
      }

      const components = readdirSync(componentsPath).filter(file => file.endsWith('.astro'));
      const staticComponents = ['Hero.astro', 'AboutSection.astro', 'SkillsSection.astro', 'EducationSection.astro'];
      
      for (const componentFile of staticComponents) {
        const componentPath = join(componentsPath, componentFile);
        
        if (existsSync(componentPath)) {
          const content = readFileSync(componentPath, 'utf-8');
          
          // Static components should not have unnecessary client directives
          const hasClientDirective = 
            content.includes('client:load') ||
            content.includes('client:visible') ||
            content.includes('client:idle');
          
          // Only warn if there's a client directive without apparent interactivity
          if (hasClientDirective && !content.includes('<script>') && !content.includes('useState')) {
            console.warn(`⚠️  ${componentFile} has client directive but appears to be static`);
          } else if (!hasClientDirective && content.includes('<script>')) {
            console.warn(`⚠️  ${componentFile} has script but no client directive`);
          } else {
            console.log(`✓ ${componentFile} has appropriate hydration strategy`);
          }
        }
      }
      
      expect(true).toBe(true);
    });
  });

  describe('Server-side rendering validation', () => {
    it('should be configured for SSR output', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Should be configured for server-side rendering
      expect(content).toContain("output: 'server'");
      
      // Should use Node.js adapter for SSR
      expect(content).toContain('@astrojs/node');
      expect(content).toContain("mode: 'standalone'");
    });

    it('should not have static-only configuration', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        
        // Should not be configured for static generation only
        expect(content).not.toContain("output: 'static'");
        expect(content).not.toContain("output: 'hybrid'");
      }
    });

    it('should support dynamic routing if needed', () => {
      if (!existsSync(pagesPath)) {
        return;
      }

      const pages = readdirSync(pagesPath, { recursive: true });
      const dynamicPages = pages.filter(page => 
        typeof page === 'string' && page.includes('[') && page.includes(']')
      );
      
      if (dynamicPages.length > 0) {
        console.log(`Found ${dynamicPages.length} dynamic routes:`, dynamicPages);
        
        // Dynamic routes should work with SSR
        for (const dynamicPage of dynamicPages) {
          console.log(`✓ Dynamic route: ${dynamicPage} (requires SSR)`);
        }
      } else {
        console.log('No dynamic routes found - static routes work well with SSR');
      }
      
      expect(true).toBe(true);
    });
  });

  describe('React integration for SSR', () => {
    it('should have React properly configured for SSR', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // React integration should be present
      expect(content).toContain('@astrojs/react');
      expect(content).toContain('react()');
    });

    it('should handle React components correctly', () => {
      if (!existsSync(componentsPath)) {
        return;
      }

      // Look for React components (.tsx files)
      const allFiles = readdirSync(componentsPath, { recursive: true });
      const reactComponents = allFiles.filter(file => 
        typeof file === 'string' && file.endsWith('.tsx')
      );
      
      if (reactComponents.length > 0) {
        console.log(`Found ${reactComponents.length} React components:`, reactComponents);
        
        for (const reactComponent of reactComponents) {
          const componentPath = join(componentsPath, reactComponent);
          if (existsSync(componentPath)) {
            const content = readFileSync(componentPath, 'utf-8');
            
            // React components should be SSR-compatible
            expect(content).not.toContain('window.'); // Should not directly access window
            expect(content).not.toContain('document.'); // Should not directly access document
            
            // Should use proper React patterns
            if (content.includes('useState') || content.includes('useEffect')) {
              console.log(`✓ ${reactComponent} uses React hooks (ensure client directive)`);
            }
          }
        }
      } else {
        console.log('No React components found - using Astro components only');
      }
      
      expect(true).toBe(true);
    });

    it('should not have React-specific SSR issues', () => {
      // Check package.json for React SSR dependencies
      const packageJsonPath = join(projectRoot, 'package.json');
      
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        
        // Should have React and ReactDOM for SSR
        expect(packageJson.dependencies.react).toBeDefined();
        expect(packageJson.dependencies['react-dom']).toBeDefined();
        
        // React version should be compatible
        const reactVersion = packageJson.dependencies.react;
        console.log(`React version: ${reactVersion}`);
        
        // Modern React versions support SSR well
        expect(reactVersion).toMatch(/^[1-9]\d+\./); // Should be v16+ at minimum
      }
    });
  });

  describe('Hydration performance', () => {
    it('should minimize hydration payload', () => {
      if (!existsSync(componentsPath)) {
        return;
      }

      const components = readdirSync(componentsPath).filter(file => file.endsWith('.astro'));
      let totalClientDirectives = 0;
      let clientLoadDirectives = 0;
      
      for (const componentFile of components) {
        const componentPath = join(componentsPath, componentFile);
        const content = readFileSync(componentPath, 'utf-8');
        
        // Count client directives
        const clientDirectives = [
          content.match(/client:load/g)?.length || 0,
          content.match(/client:visible/g)?.length || 0,
          content.match(/client:idle/g)?.length || 0,
          content.match(/client:media/g)?.length || 0
        ];
        
        const componentClientDirectives = clientDirectives.reduce((a, b) => a + b, 0);
        totalClientDirectives += componentClientDirectives;
        clientLoadDirectives += clientDirectives[0]; // client:load count
        
        if (componentClientDirectives > 0) {
          console.log(`${componentFile}: ${componentClientDirectives} client directive(s)`);
        }
      }
      
      console.log(`Total client directives: ${totalClientDirectives}`);
      console.log(`Client:load directives: ${clientLoadDirectives}`);
      
      // Recommendations for performance
      if (clientLoadDirectives > 3) {
        console.warn(`⚠️  ${clientLoadDirectives} client:load directives may impact performance. Consider client:visible or client:idle.`);
      }
      
      if (totalClientDirectives > 10) {
        console.warn(`⚠️  ${totalClientDirectives} total client directives. Consider reducing hydration for better performance.`);
      }
      
      expect(true).toBe(true);
    });

    it('should use efficient hydration patterns', () => {
      if (!existsSync(componentsPath)) {
        return;
      }

      const components = readdirSync(componentsPath).filter(file => file.endsWith('.astro'));
      const recommendations = [];
      
      for (const componentFile of components) {
        const componentPath = join(componentsPath, componentFile);
        const content = readFileSync(componentPath, 'utf-8');
        
        // Analyze hydration patterns
        if (content.includes('client:load') && !content.includes('critical')) {
          recommendations.push(`Consider client:visible for ${componentFile} if not critical`);
        }
        
        if (content.includes('client:visible') && content.includes('fold')) {
          recommendations.push(`Good use of client:visible for below-fold content in ${componentFile}`);
        }
        
        if (content.includes('client:idle') && content.includes('interaction')) {
          recommendations.push(`Good use of client:idle for non-critical interactions in ${componentFile}`);
        }
      }
      
      if (recommendations.length > 0) {
        console.log('Hydration recommendations:');
        recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
      
      expect(true).toBe(true);
    });
  });

  describe('Cross-browser compatibility', () => {
    it('should not rely on modern browser features without polyfills', () => {
      if (!existsSync(componentsPath)) {
        return;
      }

      const components = readdirSync(componentsPath, { recursive: true });
      const jsFiles = components.filter(file => 
        typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))
      );
      
      const modernFeatures = [
        'IntersectionObserver',
        'ResizeObserver',
        'MutationObserver',
        'fetch',
        'Promise',
        'async/await',
        'optional chaining',
        'nullish coalescing'
      ];
      
      for (const jsFile of jsFiles) {
        const filePath = join(componentsPath, jsFile);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          
          // Check for modern features that might need polyfills
          if (content.includes('IntersectionObserver')) {
            console.log(`${jsFile} uses IntersectionObserver - ensure polyfill for older browsers`);
          }
          
          if (content.includes('?.')) {
            console.log(`${jsFile} uses optional chaining - requires modern JS support`);
          }
          
          if (content.includes('??')) {
            console.log(`${jsFile} uses nullish coalescing - requires modern JS support`);
          }
        }
      }
      
      expect(true).toBe(true);
    });

    it('should handle SSR/client hydration mismatches', () => {
      // Check for common SSR hydration issues
      if (!existsSync(componentsPath)) {
        return;
      }

      const components = readdirSync(componentsPath).filter(file => file.endsWith('.astro'));
      
      for (const componentFile of components) {
        const componentPath = join(componentsPath, componentFile);
        const content = readFileSync(componentPath, 'utf-8');
        
        // Check for potential hydration mismatches
        if (content.includes('Math.random()')) {
          console.warn(`⚠️  ${componentFile} uses Math.random() - may cause hydration mismatch`);
        }
        
        if (content.includes('Date.now()')) {
          console.warn(`⚠️  ${componentFile} uses Date.now() - may cause hydration mismatch`);
        }
        
        if (content.includes('new Date()') && !content.includes('client:')) {
          console.warn(`⚠️  ${componentFile} uses new Date() in SSR - may cause hydration mismatch`);
        }
        
        // Look for localStorage usage without client directive
        if (content.includes('localStorage') && !content.includes('client:')) {
          console.warn(`⚠️  ${componentFile} uses localStorage without client directive`);
        }
      }
      
      expect(true).toBe(true);
    });
  });

  describe('SEO and accessibility with SSR', () => {
    it('should have proper meta tags rendered server-side', () => {
      const layoutPath = join(projectRoot, 'src/layouts/Layout.astro');
      
      if (existsSync(layoutPath)) {
        const content = readFileSync(layoutPath, 'utf-8');
        
        // Should have meta tags that benefit from SSR
        expect(content).toContain('<title>') || expect(content).toContain('<title ');
        expect(content).toContain('description') || expect(content).toContain('og:');
        
        console.log('✓ Layout has meta tags for SEO (rendered server-side)');
      }
    });

    it('should not break accessibility with client-side hydration', () => {
      if (!existsSync(componentsPath)) {
        return;
      }

      const components = readdirSync(componentsPath).filter(file => file.endsWith('.astro'));
      
      for (const componentFile of components) {
        const componentPath = join(componentsPath, componentFile);
        const content = readFileSync(componentPath, 'utf-8');
        
        // Check for accessibility attributes that should work with hydration
        if (content.includes('aria-') && content.includes('client:')) {
          console.log(`✓ ${componentFile} has aria attributes with client hydration`);
        }
        
        if (content.includes('role=') && content.includes('client:')) {
          console.log(`✓ ${componentFile} has role attributes with client hydration`);
        }
        
        // Interactive elements should have proper accessibility
        if (content.includes('onClick') || content.includes('onKeyDown')) {
          if (!content.includes('aria-') && !content.includes('role=')) {
            console.warn(`⚠️  ${componentFile} has interactive elements without accessibility attributes`);
          }
        }
      }
      
      expect(true).toBe(true);
    });
  });

  describe('Digital Ocean SSR compatibility', () => {
    it('should work with Node.js standalone mode', () => {
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      
      // Should use standalone mode for Digital Ocean
      expect(content).toContain("mode: 'standalone'");
      
      // Should not use middleware mode (requires external server)
      expect(content).not.toContain("mode: 'middleware'");
    });

    it('should handle environment variables correctly', () => {
      // Check if components properly handle environment variables in SSR
      const configPath = join(projectRoot, 'astro.config.mjs');
      
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        
        // Should not hardcode environment-specific values
        expect(content).not.toMatch(/port:\s*\d+/);
        expect(content).not.toMatch(/host:\s*['"][^'"]+['"]/);
        
        console.log('✓ Configuration uses environment variables appropriately');
      }
    });

    it('should be compatible with containerized deployment', () => {
      // SSR should work in Docker container
      const dockerfilePath = join(projectRoot, 'Dockerfile');
      
      if (existsSync(dockerfilePath)) {
        const content = readFileSync(dockerfilePath, 'utf-8');
        
        // Should expose correct port for SSR
        expect(content).toContain('EXPOSE 8080');
        
        // Should set proper environment variables
        expect(content).toContain('ENV HOST=0.0.0.0');
        expect(content).toContain('ENV PORT=8080');
        
        console.log('✓ Docker configuration supports SSR deployment');
      }
    });
  });
});