const { MermaidRenderer } = require('../../src/renderers/mermaidRenderer');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

// Mock dependencies
jest.mock('puppeteer');
jest.mock('fs-extra');

describe('MermaidRenderer', () => {
  let mermaidRenderer;
  let mockBrowser;
  let mockPage;
  const testOutputDir = '/test/output';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock page methods
    mockPage = {
      setViewport: jest.fn().mockResolvedValue(),
      setContent: jest.fn().mockResolvedValue(),
      waitForFunction: jest.fn().mockResolvedValue(),
      waitForTimeout: jest.fn().mockResolvedValue(),
      $: jest.fn().mockResolvedValue({ screenshot: jest.fn().mockResolvedValue() }),
      evaluate: jest.fn().mockResolvedValue('<svg>test</svg>'),
      close: jest.fn().mockResolvedValue()
    };
    
    // Mock browser methods
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue()
    };
    
    // Mock puppeteer launch
    puppeteer.launch.mockResolvedValue(mockBrowser);
    
    // Mock fs methods
    fs.writeFile.mockResolvedValue();
    
    mermaidRenderer = new MermaidRenderer();
  });

  describe('constructor', () => {
    test('should create MermaidRenderer with default options', () => {
      const renderer = new MermaidRenderer();
      expect(renderer.options).toEqual({
        format: 'png',
        theme: 'default',
        backgroundColor: 'white',
        width: 1200,
        height: 800
      });
      expect(renderer.browser).toBeNull();
      expect(renderer.diagramCounter).toBe(0);
    });

    test('should create MermaidRenderer with custom options', () => {
      const customOptions = {
        format: 'svg',
        theme: 'dark',
        backgroundColor: 'transparent',
        width: 1600,
        height: 1200
      };
      
      const renderer = new MermaidRenderer(customOptions);
      expect(renderer.options).toEqual(customOptions);
    });
  });

  describe('extractDiagrams', () => {
    test('should extract single mermaid diagram', async () => {
      const markdownContent = `
# Test Document

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

Some text.
      `;

      const diagrams = await mermaidRenderer.extractDiagrams(markdownContent);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0]).toEqual({
        code: 'graph TD\n    A --> B',
        index: 0,
        placeholder: '__MERMAID_DIAGRAM_0__',
        originalMatch: '```mermaid\ngraph TD\n    A --> B\n```'
      });
    });

    test('should extract multiple mermaid diagrams', async () => {
      const markdownContent = `
\`\`\`mermaid
graph TD
    A --> B
\`\`\`

\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello
\`\`\`
      `;

      const diagrams = await mermaidRenderer.extractDiagrams(markdownContent);

      expect(diagrams).toHaveLength(2);
      expect(diagrams[0].index).toBe(0);
      expect(diagrams[1].index).toBe(1);
      expect(diagrams[0].code).toContain('graph TD');
      expect(diagrams[1].code).toContain('sequenceDiagram');
      expect(diagrams[0].placeholder).toBe('__MERMAID_DIAGRAM_0__');
      expect(diagrams[1].placeholder).toBe('__MERMAID_DIAGRAM_1__');
    });

    test('should return empty array when no diagrams found', async () => {
      const markdownContent = `
# Test Document

No mermaid diagrams here.
      `;

      const diagrams = await mermaidRenderer.extractDiagrams(markdownContent);

      expect(diagrams).toHaveLength(0);
    });

    test('should handle malformed mermaid blocks', async () => {
      const markdownContent = `
\`\`\`mermaid
graph TD
    A --> B
\`\`\`

\`\`\`javascript
// This is not mermaid
console.log('test');
\`\`\`
      `;

      const diagrams = await mermaidRenderer.extractDiagrams(markdownContent);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].code).toContain('graph TD');
    });
  });

  describe('renderDiagram', () => {
    beforeEach(() => {
      mermaidRenderer.browser = mockBrowser;
    });

    test('should render diagram to PNG successfully', async () => {
      const diagramCode = 'graph TD\n    A --> B';
      const outputPath = path.join(testOutputDir, 'test-diagram.png');
      
      // Mock successful SVG detection
      mockPage.evaluate.mockResolvedValue(true);

      const result = await mermaidRenderer.renderDiagram(diagramCode, outputPath);

      expect(result.success).toBe(true);
      expect(result.path).toBe(outputPath);
      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2
      });
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.waitForFunction).toHaveBeenCalled();
    });

    test('should render diagram to SVG successfully', async () => {
      mermaidRenderer.options.format = 'svg';
      const diagramCode = 'graph TD\n    A --> B';
      const outputPath = path.join(testOutputDir, 'test-diagram.svg');
      
      // Mock SVG content extraction
      mockPage.evaluate
        .mockResolvedValueOnce(true) // SVG exists check
        .mockResolvedValueOnce('<svg>test diagram</svg>'); // SVG content

      const result = await mermaidRenderer.renderDiagram(diagramCode, outputPath);

      expect(result.success).toBe(true);
      expect(result.path).toBe(outputPath);
      expect(fs.writeFile).toHaveBeenCalledWith(outputPath, '<svg>test diagram</svg>');
    });

    test('should handle browser initialization', async () => {
      mermaidRenderer.browser = null;
      const diagramCode = 'graph TD\n    A --> B';
      const outputPath = path.join(testOutputDir, 'test-diagram.png');
      
      mockPage.evaluate.mockResolvedValue(true);

      const result = await mermaidRenderer.renderDiagram(diagramCode, outputPath);

      expect(puppeteer.launch).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('should handle rendering errors', async () => {
      const diagramCode = 'invalid mermaid';
      const outputPath = path.join(testOutputDir, 'test-diagram.png');
      
      mockPage.setContent.mockRejectedValue(new Error('Rendering failed'));

      const result = await mermaidRenderer.renderDiagram(diagramCode, outputPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rendering failed');
    });

    test('should handle missing diagram container', async () => {
      const diagramCode = 'graph TD\n    A --> B';
      const outputPath = path.join(testOutputDir, 'test-diagram.png');
      
      mockPage.$.mockResolvedValue(null); // No diagram container found

      const result = await mermaidRenderer.renderDiagram(diagramCode, outputPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('container not found');
    });

    test('should handle SVG not rendered', async () => {
      const diagramCode = 'graph TD\n    A --> B';
      const outputPath = path.join(testOutputDir, 'test-diagram.png');
      
      mockPage.evaluate.mockResolvedValue(false); // SVG not rendered

      const result = await mermaidRenderer.renderDiagram(diagramCode, outputPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('SVG not rendered');
    });

    test('should handle file write errors for SVG', async () => {
      mermaidRenderer.options.format = 'svg';
      const diagramCode = 'graph TD\n    A --> B';
      const outputPath = path.join(testOutputDir, 'test-diagram.svg');
      
      mockPage.evaluate
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce('<svg>test</svg>');
      fs.writeFile.mockRejectedValue(new Error('Write failed'));

      const result = await mermaidRenderer.renderDiagram(diagramCode, outputPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Write failed');
    });
  });

  describe('renderAll', () => {
    beforeEach(() => {
      mermaidRenderer.browser = mockBrowser;
      mockPage.evaluate.mockResolvedValue(true);
    });

    test('should render all diagrams successfully', async () => {
      const diagrams = [
        { code: 'graph TD\n    A --> B', placeholder: '__MERMAID_DIAGRAM_0__' },
        { code: 'sequenceDiagram\n    A->>B: Hello', placeholder: '__MERMAID_DIAGRAM_1__' }
      ];

      const results = await mermaidRenderer.renderAll(diagrams, testOutputDir);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].placeholder).toBe('__MERMAID_DIAGRAM_0__');
      expect(results[1].placeholder).toBe('__MERMAID_DIAGRAM_1__');
    });

    test('should handle mixed success and failure', async () => {
      const diagrams = [
        { code: 'graph TD\n    A --> B', placeholder: '__MERMAID_DIAGRAM_0__' },
        { code: 'invalid mermaid', placeholder: '__MERMAID_DIAGRAM_1__' }
      ];

      // First diagram succeeds, second fails
      mockPage.evaluate
        .mockResolvedValueOnce(true)  // First diagram SVG check
        .mockRejectedValueOnce(new Error('Invalid syntax')); // Second diagram fails

      const results = await mermaidRenderer.renderAll(diagrams, testOutputDir);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    test('should handle empty diagrams array', async () => {
      const results = await mermaidRenderer.renderAll([], testOutputDir);

      expect(results).toHaveLength(0);
    });
  });

  describe('createMermaidHTML', () => {
    test('should generate HTML with mermaid diagram', () => {
      const diagramCode = 'graph TD\n    A --> B';
      const html = mermaidRenderer.createMermaidHTML(diagramCode);

      expect(html).toContain('<div id="diagram-container">');
      expect(html).toContain(diagramCode);
      expect(html).toContain('background-color: white');
      expect(html).toContain("theme: 'default'");
    });

    test('should use custom theme in HTML', () => {
      mermaidRenderer = new MermaidRenderer({ theme: 'dark' });
      const html = mermaidRenderer.createMermaidHTML('graph TD\n    A --> B');

      expect(html).toContain("theme: 'dark'");
    });

    test('should include custom styling', () => {
      const html = mermaidRenderer.createMermaidHTML('graph TD\n    A --> B');

      expect(html).toContain('background-color: white');
      expect(html).toContain('font-family:');
    });

    test('should escape backticks in diagram code', () => {
      const diagramCode = 'graph TD\n    A --> B\n    B --> `special`';
      const html = mermaidRenderer.createMermaidHTML(diagramCode);

      expect(html).toContain('\\`special\\`');
    });
  });

  describe('initializeBrowser', () => {
    test('should launch puppeteer browser with correct options', async () => {
      await mermaidRenderer.initializeBrowser();

      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: 'new',
        args: expect.arrayContaining([
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]),
        timeout: 30000
      });
      expect(mermaidRenderer.browser).toBe(mockBrowser);
    });

    test('should handle browser launch errors', async () => {
      puppeteer.launch.mockRejectedValue(new Error('Browser launch failed'));

      await expect(mermaidRenderer.initializeBrowser()).rejects.toThrow('Failed to launch browser');
    });
  });

  describe('cleanup', () => {
    test('should close browser successfully', async () => {
      mermaidRenderer.browser = mockBrowser;

      await mermaidRenderer.cleanup();

      expect(mockBrowser.close).toHaveBeenCalled();
      expect(mermaidRenderer.browser).toBeNull();
    });

    test('should handle cleanup when no browser exists', async () => {
      mermaidRenderer.browser = null;

      await expect(mermaidRenderer.cleanup()).resolves.toBeUndefined();
    });

    test('should handle browser close errors', async () => {
      mermaidRenderer.browser = mockBrowser;
      mockBrowser.close.mockRejectedValue(new Error('Close failed'));

      await expect(mermaidRenderer.cleanup()).resolves.toBeUndefined();
      // Browser should NOT be set to null when close fails (actual behavior)
      expect(mermaidRenderer.browser).toBe(mockBrowser);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mermaidRenderer.browser = mockBrowser;
      mockPage.evaluate.mockResolvedValue(true);
    });

    test('should handle very large diagrams', async () => {
      const largeDiagram = {
        code: 'graph TD\n' + Array(100).fill(0).map((_, i) => `    A${i} --> A${i+1}`).join('\n'),
        placeholder: '__MERMAID_DIAGRAM_0__'
      };

      const result = await mermaidRenderer.renderDiagram(largeDiagram.code, '/test/large.png');

      expect(result.success).toBe(true);
    });

    test('should handle special characters in diagram code', async () => {
      const diagram = {
        code: 'graph TD\n    A["Special & chars"] --> B["More <special> chars"]',
        placeholder: '__MERMAID_DIAGRAM_0__'
      };

      const result = await mermaidRenderer.renderDiagram(diagram.code, '/test/special.png');

      expect(result.success).toBe(true);
    });

    test('should handle concurrent rendering', async () => {
      const diagrams = Array(5).fill(0).map((_, i) => ({
        code: `graph TD\n    A${i} --> B${i}`,
        placeholder: `__MERMAID_DIAGRAM_${i}__`
      }));

      const results = await mermaidRenderer.renderAll(diagrams, testOutputDir);

      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
    });

    test('should handle empty diagram code', async () => {
      const result = await mermaidRenderer.renderDiagram('', '/test/empty.png');

      expect(result.success).toBe(true); // Should still attempt to render
    });

    test('should handle transparent background', async () => {
      mermaidRenderer.options.backgroundColor = 'transparent';
      const mockScreenshot = jest.fn().mockResolvedValue();
      mockPage.$.mockResolvedValue({ screenshot: mockScreenshot });
      
      const result = await mermaidRenderer.renderDiagram('graph TD\n    A --> B', '/test/transparent.png');

      expect(result.success).toBe(true);
      expect(mockScreenshot).toHaveBeenCalledWith({
        path: '/test/transparent.png',
        omitBackground: true
      });
    });
  });
});