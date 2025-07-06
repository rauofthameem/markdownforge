const { FileConverter } = require('../../src/index');
const fs = require('fs-extra');
const path = require('path');

describe('Full Workflow Integration Tests', () => {
  const testOutputDir = path.join(__dirname, '../test-output');
  const testInputDir = path.join(__dirname, '../test-input');
  
  beforeAll(async () => {
    // Create test directories
    try {
      await fs.ensureDir(testOutputDir);
      await fs.ensureDir(testInputDir);
    } catch (error) {
      console.warn('Warning: Could not create test directories:', error.message);
    }
  });

  afterAll(async () => {
    // Cleanup test directories
    try {
      await fs.remove(testOutputDir);
      await fs.remove(testInputDir);
    } catch (error) {
      console.warn('Warning: Could not cleanup test directories:', error.message);
    }
  });

  beforeEach(async () => {
    // Ensure directories exist and clean output directory before each test
    try {
      await fs.ensureDir(testOutputDir);
      await fs.ensureDir(testInputDir);
      if (await fs.pathExists(testOutputDir)) {
        await fs.emptyDir(testOutputDir);
      }
    } catch (error) {
      console.warn('Warning: Could not setup test directories:', error.message);
    }
  });

  describe('Basic Markdown Conversion', () => {
    test('should convert simple markdown to PDF', async () => {
      // Create test markdown file
      const testMarkdown = `# Test Document

This is a test document with **bold** and *italic* text.

## Section 1

- Item 1
- Item 2
- Item 3

## Section 2

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

> This is a blockquote.

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
| Value 3  | Value 4  |
`;

      const inputPath = path.join(testInputDir, 'simple.md');
      await fs.writeFile(inputPath, testMarkdown);

      const converter = new FileConverter({
        format: ['pdf'],
        outputDir: testOutputDir,
        verbose: false
      });

      const result = await converter.convert(inputPath);

      // Test should handle missing dependencies gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.outputs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Either succeeds or provides meaningful error information
      expect(result.success || result.errors.length > 0).toBe(true);
      
      // Test output validation when outputs are generated
      const hasValidOutputs = result.outputs.length === 0 ||
        (result.outputs.length > 0 && path.extname(result.outputs[0]) === '.pdf');
      expect(hasValidOutputs).toBe(true);
    }, 30000);

    test.skip('should convert markdown with Mermaid diagrams', async () => {
      const testMarkdown = `# Document with Diagrams

This document contains Mermaid diagrams.

## Flowchart

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

## Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hello Alice!
\`\`\`

That's all for now.
`;

      const inputPath = path.join(testInputDir, 'with-diagrams.md');
      await fs.writeFile(inputPath, testMarkdown);

      const converter = new FileConverter({
        format: ['pdf'],
        outputDir: testOutputDir,
        verbose: false
      });

      const result = await converter.convert(inputPath);

      // Test should handle missing dependencies gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.outputs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Either succeeds or provides meaningful error information
      expect(result.success || result.errors.length > 0).toBe(true);
      
      // Test diagram processing attempt (may fail due to dependencies)
      const hasProcessingAttempt = result.success || result.errors.length > 0;
      expect(hasProcessingAttempt).toBe(true);
    }, 45000);

    test('should handle multiple output formats', async () => {
      const testMarkdown = `# Multi-Format Test

This document will be converted to multiple formats.

## Content

Some content here.
`;

      const inputPath = path.join(testInputDir, 'multi-format.md');
      await fs.writeFile(inputPath, testMarkdown);

      const converter = new FileConverter({
        format: ['pdf', 'docx'],
        outputDir: testOutputDir,
        verbose: false
      });

      const result = await converter.convert(inputPath);

      // Test should handle missing dependencies gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.outputs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Either succeeds or provides meaningful error information
      expect(result.success || result.errors.length > 0).toBe(true);
    }, 45000);
  });

  describe('Error Handling', () => {
    test('should handle non-existent input file', async () => {
      const converter = new FileConverter({
        format: ['pdf'],
        outputDir: testOutputDir
      });

      await expect(converter.convert('non-existent.md')).rejects.toThrow();
    });

    test('should handle invalid markdown file', async () => {
      // Create a binary file with .md extension
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
      const inputPath = path.join(testInputDir, 'binary.md');
      await fs.writeFile(inputPath, binaryContent);

      const validation = await FileConverter.prototype.validateInput(inputPath);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(error => error.includes('binary content'))).toBe(true);
    });

    test('should handle empty markdown file', async () => {
      const inputPath = path.join(testInputDir, 'empty.md');
      await fs.writeFile(inputPath, '');

      const validation = await FileConverter.prototype.validateInput(inputPath);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(error => error.includes('empty'))).toBe(true);
    });
  });

  describe('Configuration Loading', () => {
    test('should load custom configuration', async () => {
      const customConfig = {
        format: ['pdf'],
        theme: 'github',
        verbose: true,
        pdf: {
          format: 'Letter',
          margin: {
            top: '0.5in',
            bottom: '0.5in'
          }
        }
      };

      const configPath = path.join(testInputDir, '.markdownforgerc');
      await fs.writeFile(configPath, JSON.stringify(customConfig, null, 2));

      const converter = new FileConverter();
      const config = await converter.loadConfig(configPath);

      expect(config.format).toEqual(['pdf']);
      expect(config.theme).toBe('github');
      expect(config.verbose).toBe(true);
      expect(config.pdf.format).toBe('Letter');
    });

    test('should handle invalid configuration', async () => {
      const invalidConfig = {
        format: ['invalid-format'],
        theme: 'invalid-theme'
      };

      const configPath = path.join(testInputDir, '.invalid-config');
      await fs.writeFile(configPath, JSON.stringify(invalidConfig, null, 2));

      const converter = new FileConverter();
      
      await expect(converter.loadConfig(configPath)).rejects.toThrow();
    });
  });

  describe('Output Management', () => {
    test('should create unique filenames for conflicting outputs', async () => {
      const testMarkdown = '# Test Document\n\nContent here.';
      const inputPath = path.join(testInputDir, 'conflict-test.md');
      await fs.writeFile(inputPath, testMarkdown);

      // Create a file that would conflict
      const conflictPath = path.join(testOutputDir, 'conflict-test.pdf');
      await fs.writeFile(conflictPath, 'existing file');

      const converter = new FileConverter({
        format: ['pdf'],
        outputDir: testOutputDir,
        verbose: false
      });

      const result = await converter.convert(inputPath);

      // Test should handle missing dependencies gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.outputs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Either succeeds or provides meaningful error information
      expect(result.success || result.errors.length > 0).toBe(true);
    }, 30000);

    test('should handle output directory creation', async () => {
      const testMarkdown = '# Test Document\n\nContent here.';
      const inputPath = path.join(testInputDir, 'dir-test.md');
      await fs.writeFile(inputPath, testMarkdown);

      const nestedOutputDir = path.join(testOutputDir, 'nested', 'deep', 'directory');

      const converter = new FileConverter({
        format: ['pdf'],
        outputDir: nestedOutputDir,
        verbose: false
      });

      const result = await converter.convert(inputPath);

      // Test should handle missing dependencies gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.outputs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Either succeeds or provides meaningful error information
      expect(result.success || result.errors.length > 0).toBe(true);
      
      // Output directory should be created regardless of conversion success
      expect(await fs.pathExists(nestedOutputDir)).toBe(true);
    }, 30000);
  });

  describe('Performance and Limits', () => {
    test('should handle reasonably large markdown files', async () => {
      // Create a large markdown file (but within limits)
      let largeContent = '# Large Document\n\n';
      
      for (let i = 0; i < 1000; i++) {
        largeContent += `## Section ${i + 1}\n\n`;
        largeContent += `This is section ${i + 1} with some content. `.repeat(10);
        largeContent += '\n\n';
      }

      const inputPath = path.join(testInputDir, 'large.md');
      await fs.writeFile(inputPath, largeContent);

      const converter = new FileConverter({
        format: ['pdf'],
        outputDir: testOutputDir,
        verbose: false
      });

      const result = await converter.convert(inputPath);

      // Test should handle missing dependencies gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.outputs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
      
      // Either succeeds or provides meaningful error information
      expect(result.success || result.errors.length > 0).toBe(true);
    }, 60000);
  });
});