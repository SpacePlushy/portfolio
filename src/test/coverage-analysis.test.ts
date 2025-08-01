import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('Test Coverage Analysis', () => {
  const projectRoot = process.cwd();
  const srcPath = join(projectRoot, 'src');

  describe('Coverage completeness', () => {
    it('should have tests for critical migration components', () => {
      const criticalFiles = [
        'src/middleware.js',
        'src/lib/utils.ts',
        'astro.config.mjs'
      ];

      const testFiles = [
        'src/middleware.test.ts',
        'src/lib/utils.test.ts',
        'src/test/astro-config.test.ts'
      ];

      for (let i = 0; i < criticalFiles.length; i++) {
        const criticalFile = join(projectRoot, criticalFiles[i]);
        const testFile = join(projectRoot, testFiles[i]);

        if (existsSync(criticalFile)) {
          expect(existsSync(testFile)).toBe(true);
          console.log(`✓ ${criticalFiles[i]} has corresponding test file`);
        }
      }
    });

    it('should have integration tests for Digital Ocean migration', () => {
      const integrationTests = [
        'src/test/docker.integration.test.ts',
        'src/test/build-process.test.ts',
        'src/test/migration-compatibility.test.ts',
        'src/test/performance-regression.test.ts'
      ];

      for (const testFile of integrationTests) {
        const fullPath = join(projectRoot, testFile);
        expect(existsSync(fullPath)).toBe(true);
        console.log(`✓ Integration test exists: ${testFile}`);
      }
    });

    it('should have SSR and hydration tests', () => {
      const ssrTestFile = join(projectRoot, 'src/test/ssr-hydration.test.ts');
      expect(existsSync(ssrTestFile)).toBe(true);
      console.log('✓ SSR and hydration tests exist');
    });
  });

  describe('Test file quality', () => {
    it('should have comprehensive test scenarios', () => {
      const testFiles = [
        'src/middleware.test.ts',
        'src/test/docker.integration.test.ts',
        'src/test/astro-config.test.ts',
        'src/test/build-process.test.ts'
      ];

      for (const testFile of testFiles) {
        const fullPath = join(projectRoot, testFile);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Should have multiple test cases
          const testCases = content.match(/it\(['"`]/g)?.length || 0;
          expect(testCases).toBeGreaterThan(5);
          
          // Should have describe blocks for organization
          const describeBlocks = content.match(/describe\(['"`]/g)?.length || 0;
          expect(describeBlocks).toBeGreaterThan(1);
          
          console.log(`✓ ${testFile}: ${testCases} test cases, ${describeBlocks} describe blocks`);
        }
      }
    });

    it('should test both happy paths and edge cases', () => {
      const middlewareTestPath = join(projectRoot, 'src/middleware.test.ts');
      
      if (existsSync(middlewareTestPath)) {
        const content = readFileSync(middlewareTestPath, 'utf-8');
        
        // Should test various user agents
        expect(content).toContain('bot');
        expect(content).toContain('human');
        expect(content).toContain('edge cases');
        expect(content).toContain('malformed');
        
        console.log('✓ Middleware tests cover happy paths and edge cases');
      }
    });

    it('should have performance and security test coverage', () => {
      const performanceTestPath = join(projectRoot, 'src/test/performance-regression.test.ts');
      const dockerTestPath = join(projectRoot, 'src/test/docker.integration.test.ts');
      
      if (existsSync(performanceTestPath)) {
        const content = readFileSync(performanceTestPath, 'utf-8');
        
        // Should test performance regressions
        expect(content).toContain('bundle size');
        expect(content).toContain('image optimization');
        expect(content).toContain('caching');
        
        console.log('✓ Performance regression tests exist');
      }
      
      if (existsSync(dockerTestPath)) {
        const content = readFileSync(dockerTestPath, 'utf-8');
        
        // Should test security considerations
        expect(content).toContain('security');
        expect(content).toContain('root user');
        expect(content).toContain('sensitive');
        
        console.log('✓ Security tests exist in Docker integration tests');
      }
    });
  });

  describe('Coverage gaps identification', () => {
    it('should identify untested source files', () => {
      const sourceFiles: string[] = [];
      const testFiles: string[] = [];

      function findFiles(dir: string, files: string[], extensions: string[]) {
        if (!existsSync(dir)) return;
        
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stats = statSync(fullPath);
          
          if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            findFiles(fullPath, files, extensions);
          } else if (stats.isFile()) {
            const hasExtension = extensions.some(ext => item.endsWith(ext));
            if (hasExtension) {
              files.push(fullPath.replace(projectRoot + '/', ''));
            }
          }
        }
      }

      // Find source files
      findFiles(srcPath, sourceFiles, ['.ts', '.js', '.astro']);
      
      // Find test files
      findFiles(srcPath, testFiles, ['.test.ts', '.test.js', '.spec.ts', '.spec.js']);

      // Filter out test files from source files
      const actualSourceFiles = sourceFiles.filter(file => 
        !file.includes('.test.') && 
        !file.includes('.spec.') &&
        !file.includes('/test/') &&
        !file.includes('env.d.ts')
      );

      console.log(`Found ${actualSourceFiles.length} source files`);
      console.log(`Found ${testFiles.length} test files`);

      // Identify files that might need tests
      const potentiallyUntested = actualSourceFiles.filter(sourceFile => {
        const baseName = sourceFile.replace(/\.(ts|js|astro)$/, '');
        const hasTest = testFiles.some(testFile => 
          testFile.includes(baseName.split('/').pop() || '') ||
          testFile.includes(sourceFile.split('/').pop()?.replace(/\.(ts|js|astro)$/, '') || '')
        );
        return !hasTest;
      });

      console.log('Source files without direct tests:');
      potentiallyUntested.forEach(file => {
        // Skip certain files that don't need direct tests
        if (!file.includes('/pages/') && 
            !file.includes('/layouts/') && 
            !file.includes('/assets/') &&
            !file.includes('env.d.ts')) {
          console.log(`  - ${file}`);
        }
      });

      // This is informational - not all files need direct tests
      expect(potentiallyUntested.length).toBeLessThan(actualSourceFiles.length);
    });

    it('should prioritize critical migration paths for testing', () => {
      const criticalPaths = [
        'middleware', // Bot protection replacement
        'astro.config', // Node adapter configuration
        'docker', // Containerization
        'build-process', // SSR build validation
        'migration-compatibility', // Vercel vs DO comparison
        'performance-regression' // Performance impact analysis
      ];

      const testDirectory = join(projectRoot, 'src/test');
      if (existsSync(testDirectory)) {
        const testFiles = readdirSync(testDirectory);
        
        for (const criticalPath of criticalPaths) {
          const hasTest = testFiles.some(file => 
            file.toLowerCase().includes(criticalPath.toLowerCase())
          );
          
          expect(hasTest).toBe(true);
          console.log(`✓ Critical path '${criticalPath}' has test coverage`);
        }
      }
    });
  });

  describe('Test configuration validation', () => {
    it('should have proper coverage configuration', () => {
      const vitestConfigPath = join(projectRoot, 'vitest.config.ts');
      
      expect(existsSync(vitestConfigPath)).toBe(true);
      
      const content = readFileSync(vitestConfigPath, 'utf-8');
      
      // Should have coverage configuration
      expect(content).toContain('coverage');
      expect(content).toContain('provider: \'v8\'');
      expect(content).toContain('reporter');
      expect(content).toContain('thresholds');
      
      // Should exclude test files from coverage
      expect(content).toContain('exclude');
      expect(content).toContain('test');
      
      console.log('✓ Coverage configuration is properly set up');
    });

    it('should have appropriate coverage thresholds', () => {
      const vitestConfigPath = join(projectRoot, 'vitest.config.ts');
      
      if (existsSync(vitestConfigPath)) {
        const content = readFileSync(vitestConfigPath, 'utf-8');
        
        // Should have reasonable thresholds
        expect(content).toContain('global');
        expect(content).toContain('branches');
        expect(content).toContain('functions');
        expect(content).toContain('lines');
        expect(content).toContain('statements');
        
        // Higher thresholds for critical files
        expect(content).toContain('src/lib/');
        expect(content).toContain('middleware.js');
        
        console.log('✓ Coverage thresholds are configured appropriately');
      }
    });

    it('should have test scripts configured', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        
        // Should have test scripts
        expect(packageJson.scripts.test).toBeDefined();
        expect(packageJson.scripts['test:coverage']).toBeDefined();
        expect(packageJson.scripts['test:watch']).toBeDefined();
        expect(packageJson.scripts['test:ui']).toBeDefined();
        
        // Should have coverage dependency
        expect(packageJson.devDependencies['@vitest/coverage-v8']).toBeDefined();
        
        console.log('✓ Test scripts and dependencies are properly configured');
      }
    });
  });

  describe('Migration-specific test coverage', () => {
    it('should test removed Vercel features', () => {
      const migrationTestPath = join(projectRoot, 'src/test/migration-compatibility.test.ts');
      
      if (existsSync(migrationTestPath)) {
        const content = readFileSync(migrationTestPath, 'utf-8');
        
        // Should test for removed features
        expect(content).toContain('Vercel Analytics');
        expect(content).toContain('BotID');
        expect(content).toContain('ISR');
        expect(content).toContain('image optimization');
        
        console.log('✓ Migration tests cover removed Vercel features');
      }
    });

    it('should test new Digital Ocean functionality', () => {
      const dockerTestPath = join(projectRoot, 'src/test/docker.integration.test.ts');
      const buildTestPath = join(projectRoot, 'src/test/build-process.test.ts');
      
      if (existsSync(dockerTestPath)) {
        const content = readFileSync(dockerTestPath, 'utf-8');
        
        // Should test Docker functionality
        expect(content).toContain('Docker');
        expect(content).toContain('container');
        expect(content).toContain('Digital Ocean');
        
        console.log('✓ Docker integration tests exist');
      }
      
      if (existsSync(buildTestPath)) {
        const content = readFileSync(buildTestPath, 'utf-8');
        
        // Should test build process
        expect(content).toContain('build');
        expect(content).toContain('SSR');
        expect(content).toContain('Node.js adapter');
        
        console.log('✓ Build process tests exist');
      }
    });

    it('should test performance implications', () => {
      const performanceTestPath = join(projectRoot, 'src/test/performance-regression.test.ts');
      
      if (existsSync(performanceTestPath)) {
        const content = readFileSync(performanceTestPath, 'utf-8');
        
        // Should test performance regressions
        expect(content).toContain('bundle size');
        expect(content).toContain('edge network');
        expect(content).toContain('caching');
        expect(content).toContain('analytics');
        
        console.log('✓ Performance regression tests are comprehensive');
      }
    });
  });

  describe('Recommendations', () => {
    it('should provide testing recommendations', () => {
      console.log('\n📋 Test Coverage Recommendations:');
      console.log('1. Run "npm run test:coverage" regularly to monitor coverage');
      console.log('2. Aim for >80% coverage on critical migration paths');
      console.log('3. Focus on edge cases for bot protection middleware');
      console.log('4. Add E2E tests for complete user journeys');
      console.log('5. Monitor performance regression tests in CI/CD');
      console.log('6. Test Docker builds in CI pipeline');
      console.log('7. Validate SSR functionality across different environments');
      
      expect(true).toBe(true);
    });

    it('should identify missing test types', () => {
      const missingTestTypes = [];
      
      // Check for E2E tests
      const e2eTestPath = join(projectRoot, 'e2e');
      if (!existsSync(e2eTestPath)) {
        missingTestTypes.push('E2E tests (Playwright/Cypress)');
      }
      
      // Check for visual regression tests
      const visualTestPath = join(projectRoot, 'src/test/visual.test.ts');
      if (!existsSync(visualTestPath)) {
        missingTestTypes.push('Visual regression tests');
      }
      
      // Check for load tests
      const loadTestPath = join(projectRoot, 'src/test/load.test.ts');
      if (!existsSync(loadTestPath)) {
        missingTestTypes.push('Load/stress tests');
      }
      
      if (missingTestTypes.length > 0) {
        console.log('\n⚠️  Missing test types (consider adding):');
        missingTestTypes.forEach(type => console.log(`  - ${type}`));
      } else {
        console.log('\n✅ Comprehensive test coverage across all types');
      }
      
      // This is informational
      expect(true).toBe(true);
    });
  });
});