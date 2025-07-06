const { DocumentProcessor } = require('../../src/core/documentProcessor');
const { MermaidRenderer } = require('../../src/renderers/mermaidRenderer');
const { DOCXConverter } = require('../../src/converters/docxConverter');
const { PDFConverter } = require('../../src/converters/pdfConverter');
const { OutputManager } = require('../../src/output/outputManager');
const { TempFileManager } = require('../../src/core/tempFileManager');
const { FileConverterError, ERROR_CODES } = require('../../src/utils/errors');
const fs = require('fs-extra');
const path = require('path');

// Mock all dependencies
jest.mock('../../src/renderers/mermaidRenderer');
jest.mock('../../src/converters/docxConverter');
jest.mock('../../src/converters/pdfConverter');
jest.mock('../../src/output/outputManager');
jest.mock('../../src/core/tempFileManager');
jest.mock('fs-extra');

describe('DocumentProcessor', () => {
  let processor;
  let mockMermaidRenderer;
  let mockDocxConverter;
  let mockPdfConverter;
  let mockOutputManager;
  let mockTempFileManager;
  const testOutputDir = path.join(__dirname, '../test-output');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock instances
    mockMermaidRenderer = {
      extractDiagrams: jest.fn(),
      renderAll: jest.fn(),
      cleanup: jest.fn()
    };
    mockDocxConverter = {
      convert: jest.fn(),
      checkPandocAvailability: jest.fn()
    };
    mockPdfConverter = {
      convert: jest.fn(),
      cleanup: jest.fn()
    };
    mockOutputManager = {
      ensureOutputDir: jest.fn(),
      getOutputPath: jest.fn()
    };
    mockTempFileManager = {
      createTempDir: jest.fn(),
      cleanup: jest.fn()
    };

    // Setup mock constructors
    MermaidRenderer.mockImplementation(() => mockMermaidRenderer);
    DOCXConverter.mockImplementation(() => mockDocxConverter);
    PDFConverter.mockImplementation(() => mockPdfConverter);
    OutputManager.mockImplementation(() => mockOutputManager);
    TempFileManager.mockImplementation(() => mockTempFileManager);

    // Setup fs-extra mocks
    fs.pathExists = jest.fn();
    fs.readFile = jest.fn();
    fs.writeFile = jest.fn();
    fs.ensureDir = jest.fn();
    fs.copy = jest.fn();
    fs.remove = jest.fn();
  });

  describe('constructor', () => {
    test('should create DocumentProcessor with default options', () => {
      processor = new DocumentProcessor();

      expect(processor.options).toEqual({
        outputDir: './output',
        theme: 'default',
        diagramFormat: 'png',
        verbose: false,
        format: ['pdf', 'docx']
      });

      expect(MermaidRenderer).toHaveBeenCalledWith({
        format: 'png',
        theme: 'default',
        backgroundColor: 'white'
      });
      expect(DOCXConverter).toHaveBeenCalledWith({});
      expect(PDFConverter).toHaveBeenCalledWith({ theme: 'default' });
      expect(OutputManager).toHaveBeenCalledWith('./output');
      expect(TempFileManager).toHaveBeenCalled();
    });

    test('should create DocumentProcessor with custom options', () => {
      const options = {
        outputDir: testOutputDir,
        theme: 'github',
        format: ['pdf'],
        diagramFormat: 'svg',
        mermaid: { theme: 'dark', backgroundColor: 'black' },
        docx: { template: 'custom' },
        pdf: { margin: '1in' }
      };

      processor = new DocumentProcessor(options);

      expect(processor.options).toEqual({
        outputDir: testOutputDir,
        theme: 'github',
        diagramFormat: 'svg',
        verbose: false,
        format: ['pdf'],
        mermaid: { theme: 'dark', backgroundColor: 'black' },
        docx: { template: 'custom' },
        pdf: { margin: '1in' }
      });

      expect(MermaidRenderer).toHaveBeenCalledWith({
        format: 'svg',
        theme: 'dark',
        backgroundColor: 'black'
      });
      expect(DOCXConverter).toHaveBeenCalledWith({ template: 'custom' });
      expect(PDFConverter).toHaveBeenCalledWith({ theme: 'github', margin: '1in' });
    });
  });

  describe('processDocument', () => {
    beforeEach(() => {
      processor = new DocumentProcessor({
        outputDir: testOutputDir,
        format: ['pdf']
      });
    });

    test('should throw error if input file does not exist', async () => {
      const inputPath = 'nonexistent.md';
      fs.pathExists.mockResolvedValue(false);

      await expect(processor.processDocument(inputPath)).rejects.toThrow(
        new FileConverterError(
          `Input file not found: ${inputPath}`,
          ERROR_CODES.INPUT_NOT_FOUND
        )
      );
    });

    test('should process document without Mermaid diagrams', async () => {
      const inputPath = 'test.md';
      const inputContent = '# Test Document\n\nThis is a test.';
      const outputPath = path.join(testOutputDir, 'test.pdf');

      // Setup mocks
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(inputContent);
      mockMermaidRenderer.extractDiagrams.mockResolvedValue([]);
      mockOutputManager.ensureOutputDir.mockResolvedValue();
      mockOutputManager.getOutputPath.mockResolvedValue(outputPath);
      mockPdfConverter.convert.mockResolvedValue({
        success: true,
        path: outputPath
      });

      const result = await processor.processDocument(inputPath);

      expect(fs.readFile).toHaveBeenCalledWith(inputPath, 'utf-8');
      expect(mockMermaidRenderer.extractDiagrams).toHaveBeenCalledWith(inputContent);
      expect(mockOutputManager.ensureOutputDir).toHaveBeenCalled();
      expect(mockPdfConverter.convert).toHaveBeenCalledWith(inputPath, outputPath, inputPath);
      expect(result).toEqual({
        success: true,
        outputs: [outputPath],
        errors: [],
        duration: expect.any(Number)
      });
    });

    test('should process document with Mermaid diagrams', async () => {
      const inputPath = 'test.md';
      const inputContent = '# Test\n\n```mermaid\ngraph TD\nA-->B\n```';
      const tempDir = '/tmp/test';
      const tempMarkdownPath = path.join(tempDir, 'processed.md');
      const outputPath = path.join(testOutputDir, 'test.pdf');
      const diagramPath = path.join(tempDir, 'diagram-1.png');
      const persistentDiagramPath = path.join(testOutputDir, 'diagrams', 'diagram-1.png');

      // Setup mocks
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(inputContent);
      mockMermaidRenderer.extractDiagrams.mockResolvedValue([
        { id: 'diagram-1', code: 'graph TD\nA-->B', originalMatch: '```mermaid\ngraph TD\nA-->B\n```' }
      ]);
      mockTempFileManager.createTempDir.mockResolvedValue(tempDir);
      mockMermaidRenderer.renderAll.mockResolvedValue([
        { success: true, path: diagramPath, originalMatch: '```mermaid\ngraph TD\nA-->B\n```' }
      ]);
      mockOutputManager.ensureOutputDir.mockResolvedValue();
      mockOutputManager.getOutputPath.mockResolvedValue(outputPath);
      mockPdfConverter.convert.mockResolvedValue({
        success: true,
        path: outputPath
      });

      const result = await processor.processDocument(inputPath);

      expect(mockTempFileManager.createTempDir).toHaveBeenCalled();
      expect(mockMermaidRenderer.renderAll).toHaveBeenCalledWith(
        expect.any(Array),
        tempDir
      );
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(testOutputDir, 'diagrams'));
      expect(fs.copy).toHaveBeenCalledWith(diagramPath, persistentDiagramPath);
      expect(fs.writeFile).toHaveBeenCalledWith(
        tempMarkdownPath,
        expect.stringContaining('![Diagram](file://')
      );
      expect(mockPdfConverter.convert).toHaveBeenCalledWith(
        tempMarkdownPath,
        outputPath,
        inputPath
      );
      expect(result.success).toBe(true);
    });

    test('should handle multiple output formats', async () => {
      processor = new DocumentProcessor({
        outputDir: testOutputDir,
        format: ['pdf', 'docx']
      });

      const inputPath = 'test.md';
      const inputContent = '# Test Document';
      const pdfPath = path.join(testOutputDir, 'test.pdf');
      const docxPath = path.join(testOutputDir, 'test.docx');

      // Setup mocks
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(inputContent);
      mockMermaidRenderer.extractDiagrams.mockResolvedValue([]);
      mockOutputManager.ensureOutputDir.mockResolvedValue();
      mockOutputManager.getOutputPath
        .mockResolvedValueOnce(pdfPath)
        .mockResolvedValueOnce(docxPath);
      mockPdfConverter.convert.mockResolvedValue({
        success: true,
        path: pdfPath
      });
      mockDocxConverter.convert.mockResolvedValue({
        success: true,
        path: docxPath
      });

      const result = await processor.processDocument(inputPath);

      expect(mockPdfConverter.convert).toHaveBeenCalledWith(inputPath, pdfPath, inputPath);
      expect(mockDocxConverter.convert).toHaveBeenCalledWith(inputPath, docxPath, inputPath);
      expect(result).toEqual({
        success: true,
        outputs: [pdfPath, docxPath],
        errors: [],
        duration: expect.any(Number)
      });
    });

    test('should handle conversion errors gracefully', async () => {
      const inputPath = 'test.md';
      const inputContent = '# Test Document';
      const outputPath = path.join(testOutputDir, 'test.pdf');

      // Setup mocks
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(inputContent);
      mockMermaidRenderer.extractDiagrams.mockResolvedValue([]);
      mockOutputManager.ensureOutputDir.mockResolvedValue();
      mockOutputManager.getOutputPath.mockResolvedValue(outputPath);
      mockPdfConverter.convert.mockResolvedValue({
        success: false,
        error: 'PDF conversion failed'
      });

      const result = await processor.processDocument(inputPath);

      expect(result).toEqual({
        success: false,
        outputs: [],
        errors: ['PDF conversion failed: PDF conversion failed'],
        duration: expect.any(Number)
      });
    });

    test('should handle unsupported formats', async () => {
      processor = new DocumentProcessor({
        outputDir: testOutputDir,
        format: ['html'] // Unsupported format
      });

      const inputPath = 'test.md';
      const inputContent = '# Test Document';

      // Setup mocks
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(inputContent);
      mockMermaidRenderer.extractDiagrams.mockResolvedValue([]);
      mockOutputManager.ensureOutputDir.mockResolvedValue();

      const result = await processor.processDocument(inputPath);

      expect(result).toEqual({
        success: false,
        outputs: [],
        errors: ['Unsupported format: html'],
        duration: expect.any(Number)
      });
    });

    test('should cleanup on error', async () => {
      const inputPath = 'test.md';
      const error = new Error('Processing error');

      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockRejectedValue(error);

      await expect(processor.processDocument(inputPath)).rejects.toThrow(
        FileConverterError
      );

      expect(mockTempFileManager.cleanup).toHaveBeenCalled();
      expect(mockMermaidRenderer.cleanup).toHaveBeenCalled();
      expect(mockPdfConverter.cleanup).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      processor = new DocumentProcessor();
    });

    test('should cleanup temporary files and dependencies', async () => {
      const tempFiles = ['/tmp/file1', '/tmp/file2'];
      
      fs.pathExists.mockResolvedValue(true);
      fs.remove.mockResolvedValue();

      await processor.cleanup(tempFiles);

      expect(fs.remove).toHaveBeenCalledTimes(2);
      expect(fs.remove).toHaveBeenCalledWith('/tmp/file1');
      expect(fs.remove).toHaveBeenCalledWith('/tmp/file2');
      expect(mockTempFileManager.cleanup).toHaveBeenCalled();
      expect(mockMermaidRenderer.cleanup).toHaveBeenCalled();
      expect(mockPdfConverter.cleanup).toHaveBeenCalled();
    });

    test('should handle cleanup errors gracefully', async () => {
      const tempFiles = ['/tmp/file1'];
      
      fs.pathExists.mockResolvedValue(true);
      fs.remove.mockRejectedValue(new Error('Cleanup failed'));

      // Should not throw
      await expect(processor.cleanup(tempFiles)).resolves.toBeUndefined();
    });
  });

  describe('validateDependencies', () => {
    test('should return no issues when dependencies are available', async () => {
      processor = new DocumentProcessor({ format: ['pdf'] });
      
      const issues = await processor.validateDependencies();
      
      expect(issues).toEqual([]);
    });

    test('should return warning when Pandoc is not available for DOCX', async () => {
      processor = new DocumentProcessor({ format: ['docx'] });
      
      mockDocxConverter.checkPandocAvailability.mockResolvedValue({
        available: false
      });

      const issues = await processor.validateDependencies();

      expect(issues).toEqual([{
        type: 'warning',
        message: 'Pandoc not found. DOCX conversion will be unavailable.',
        suggestion: 'Install Pandoc from https://pandoc.org/installing.html'
      }]);
    });
  });
});