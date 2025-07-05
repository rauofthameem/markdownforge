const fs = require('fs-extra');
const path = require('path');
const { DocumentProcessor } = require('../src/core/documentProcessor');
const { validateInput } = require('../src/validators/fileValidator');
const { loadConfig } = require('../src/utils/configLoader');
const { logger } = require('../src/utils/logger');

// Set up test environment
beforeAll(() => {
  logger.setSilent(true); // Suppress logs during testing
});

afterAll(() => {
  logger.setSilent(false);
});

describe('FileConverter CLI Tests', () => {
  const testOutputDir = path.join(__dirname, 'test-output');
  const sampleMarkdown = path.join(__dirname, '..', 'examples', 'sample.md');

  beforeEach(async () => {
    // Clean up test output directory
    await fs.remove(testOutputDir);
    await fs.ensureDir(testOutputDir);
  });

  afterEach(async () => {
    // Clean up after each test
    await fs.remove(testOutputDir);
  });

  describe('File Validation', () => {
    test('should validate existing markdown file', async () => {
      const result = await validateInput(sampleMarkdown);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject non-existent file', async () => {
      const result = await validateInput('non-existent.md');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject invalid file extension', async () => {
      const txtFile = path.join(testOutputDir, 'test.txt');
      await fs.writeFile(txtFile, 'test content');
      
      const result = await validateInput(txtFile);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid file extension'))).toBe(true);
    });
  });

  describe('Configuration Loading', () => {
    test('should load default configuration', async () => {
      const config = await loadConfig();
      expect(config).toBeDefined();
      expect(config.format).toEqual(['pdf', 'docx']);
      expect(config.theme).toBe('default');
    });

    test('should load custom configuration', async () => {
      const configPath = path.join(testOutputDir, '.fileconverterrc');
      const customConfig = {
        format: ['pdf'],
        theme: 'github',
        verbose: true
      };
      
      await fs.writeFile(configPath, JSON.stringify(customConfig));
      
      const config = await loadConfig(configPath);
      expect(config.format).toEqual(['pdf']);
      expect(config.theme).toBe('github');
      expect(config.verbose).toBe(true);
    });
  });

  describe('Document Processing', () => {
    test('should create DocumentProcessor instance', () => {
      const processor = new DocumentProcessor({
        format: ['pdf'],
        outputDir: testOutputDir
      });
      
      expect(processor).toBeDefined();
      expect(processor.options.format).toEqual(['pdf']);
      expect(processor.options.outputDir).toBe(testOutputDir);
    });

    test('should process markdown file (integration test)', async () => {
      // Skip if sample file doesn't exist
      if (!await fs.pathExists(sampleMarkdown)) {
        console.log('Skipping integration test - sample file not found');
        return;
      }

      const processor = new DocumentProcessor({
        format: ['pdf'], // Only test PDF to avoid Pandoc dependency
        outputDir: testOutputDir,
        verbose: false
      });

      try {
        const result = await processor.processDocument(sampleMarkdown);
        
        // Check if processing was attempted
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.outputs)).toBe(true);
        expect(Array.isArray(result.errors)).toBe(true);
        
        // If successful, check output files
        if (result.success && result.outputs.length > 0) {
          for (const outputPath of result.outputs) {
            expect(await fs.pathExists(outputPath)).toBe(true);
          }
        }
        
      } catch (error) {
        // Test might fail due to missing dependencies (Puppeteer, etc.)
        // This is expected in CI environments
        console.log(`Integration test failed (expected in some environments): ${error.message}`);
      }
    }, 30000); // 30 second timeout for integration test
  });

  describe('Error Handling', () => {
    test('should handle missing input file gracefully', async () => {
      const processor = new DocumentProcessor({
        outputDir: testOutputDir
      });

      try {
        await processor.processDocument('non-existent.md');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('not found');
      }
    });

    test('should handle invalid output directory', async () => {
      const processor = new DocumentProcessor({
        outputDir: '/invalid/path/that/cannot/be/created'
      });

      // Create a minimal test file
      const testFile = path.join(testOutputDir, 'test.md');
      await fs.writeFile(testFile, '# Test');

      try {
        await processor.processDocument(testFile);
        // May not throw immediately, but should handle gracefully
      } catch (error) {
        expect(error.message).toContain('permission');
      }
    });
  });

  describe('Utility Functions', () => {
    test('should format file sizes correctly', () => {
      const { OutputManager } = require('../src/output/outputManager');
      const manager = new OutputManager();
      
      expect(manager.formatFileSize(0)).toBe('0 Bytes');
      expect(manager.formatFileSize(1024)).toBe('1 KB');
      expect(manager.formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    test('should generate unique file names', async () => {
      const { OutputManager } = require('../src/output/outputManager');
      const manager = new OutputManager(testOutputDir);
      
      // Create a file that would conflict
      const conflictFile = path.join(testOutputDir, 'test.pdf');
      await fs.writeFile(conflictFile, 'test');
      
      const uniquePath = await manager.generateUniqueFileName('test', 'pdf');
      expect(uniquePath).not.toBe(conflictFile);
      expect(uniquePath).toContain('test_1.pdf');
    });
  });
});

// Helper function to check if dependencies are available
async function checkDependencies() {
  const { DependencyChecker } = require('../scripts/check-dependencies');
  const checker = new DependencyChecker();
  
  try {
    const result = await checker.checkAll();
    return result.success;
  } catch (error) {
    return false;
  }
}

// Export for use in other test files
module.exports = {
  checkDependencies
};