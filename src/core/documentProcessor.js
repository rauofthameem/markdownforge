const path = require('path');
const fs = require('fs-extra');
const { MermaidRenderer } = require('../renderers/mermaidRenderer');
const { DOCXConverter } = require('../converters/docxConverter');
const { PDFConverter } = require('../converters/pdfConverter');
const { OutputManager } = require('../output/outputManager');
const { TempFileManager } = require('./tempFileManager');
const { logger } = require('../utils/logger');
const { FileConverterError, ERROR_CODES } = require('../utils/errors');

class DocumentProcessor {
  constructor(options = {}) {
    this.options = {
      outputDir: './output',
      theme: 'default',
      diagramFormat: 'png',
      verbose: false,
      ...options,
      // Only set default format if not provided
      format: options.format || ['pdf', 'docx']
    };

    this.mermaidRenderer = new MermaidRenderer({
      format: this.options.diagramFormat,
      theme: this.options.mermaid?.theme || 'default',
      backgroundColor: this.options.mermaid?.backgroundColor || 'white'
    });

    this.docxConverter = new DOCXConverter(this.options.docx || {});
    this.pdfConverter = new PDFConverter({
      theme: this.options.theme,
      ...this.options.pdf
    });

    this.outputManager = new OutputManager(this.options.outputDir);
    this.tempFileManager = new TempFileManager();
  }

  async processDocument(inputPath) {
    const startTime = Date.now();
    let tempFiles = [];
    
    try {
      logger.info('Starting document processing...');
      
      // Validate input file exists
      if (!await fs.pathExists(inputPath)) {
        throw new FileConverterError(
          `Input file not found: ${inputPath}`,
          ERROR_CODES.INPUT_NOT_FOUND
        );
      }

      // Read input file
      const inputContent = await fs.readFile(inputPath, 'utf-8');
      const inputName = this.options.name || path.parse(inputPath).name;
      
      logger.info(`Processing file: ${path.basename(inputPath)}`);
      logger.info(`Output formats: ${this.options.format.join(', ')}`);

      // Store original input path for relative image resolution
      const originalInputPath = inputPath;
      
      // Step 1: Extract and render Mermaid diagrams
      logger.info('Extracting Mermaid diagrams...');
      const diagrams = await this.mermaidRenderer.extractDiagrams(inputContent);
      
      if (diagrams.length > 0) {
        logger.info(`Found ${diagrams.length} Mermaid diagram(s)`);
        
        // Create temp directory for diagrams
        const tempDir = await this.tempFileManager.createTempDir();
        tempFiles.push(tempDir);
        
        // Render all diagrams
        const renderedDiagrams = await this.mermaidRenderer.renderAll(diagrams, tempDir);
        
        // Copy diagrams to output directory for persistent access
        await this.outputManager.ensureOutputDir();
        const diagramsDir = path.join(this.options.outputDir, 'diagrams');
        await fs.ensureDir(diagramsDir);
        
        // Replace diagram placeholders in content
        let processedContent = inputContent;
        for (const diagram of renderedDiagrams) {
          if (diagram.success) {
            // Copy diagram to persistent location
            const diagramName = path.basename(diagram.path);
            const persistentPath = path.join(diagramsDir, diagramName);
            await fs.copy(diagram.path, persistentPath);
            
            // Use file:// protocol for reliable access in PDF
            const absolutePath = path.resolve(persistentPath);
            const fileUrl = `file://${absolutePath}`;
            const imageMarkdown = `![Diagram](${fileUrl})`;
            processedContent = processedContent.replace(diagram.originalMatch, imageMarkdown);
          }
        }

        // Write processed content to temp file
        const tempMarkdownPath = path.join(tempDir, 'processed.md');
        await fs.writeFile(tempMarkdownPath, processedContent);
        tempFiles.push(tempMarkdownPath);
        
        inputPath = tempMarkdownPath;
      } else {
        logger.info('No Mermaid diagrams found');
      }

      // Step 2: Ensure output directory exists
      await this.outputManager.ensureOutputDir();

      // Step 3: Convert to requested formats
      const outputs = [];
      const errors = [];

      for (const format of this.options.format) {
        try {
          logger.info(`Converting to ${format.toUpperCase()}...`);
          
          const outputPath = await this.outputManager.getOutputPath(inputName, format);
          
          if (format === 'pdf') {
            const result = await this.pdfConverter.convert(inputPath, outputPath, originalInputPath);
            if (result.success) {
              outputs.push(result.path);
              logger.success(`PDF created: ${path.basename(result.path)}`);
            } else {
              errors.push(`PDF conversion failed: ${result.error}`);
            }
          } else if (format === 'docx') {
            const result = await this.docxConverter.convert(inputPath, outputPath, originalInputPath);
            if (result.success) {
              outputs.push(result.path);
              logger.success(`DOCX created: ${path.basename(result.path)}`);
            } else {
              errors.push(`DOCX conversion failed: ${result.error}`);
            }
          } else {
            errors.push(`Unsupported format: ${format}`);
          }
        } catch (error) {
          errors.push(`${format.toUpperCase()} conversion error: ${error.message}`);
          logger.error(`Failed to convert to ${format}: ${error.message}`);
        }
      }

      // Step 4: Cleanup
      await this.cleanup(tempFiles);

      const duration = Date.now() - startTime;
      logger.info(`Processing completed in ${duration}ms`);

      return {
        success: outputs.length > 0,
        outputs,
        errors,
        duration
      };

    } catch (error) {
      // Cleanup on error
      await this.cleanup(tempFiles);
      
      if (error instanceof FileConverterError) {
        throw error;
      }
      
      throw new FileConverterError(
        `Document processing failed: ${error.message}`,
        ERROR_CODES.PROCESSING_ERROR,
        { originalError: error }
      );
    }
  }

  async cleanup(tempFiles = []) {
    try {
      logger.debug('Cleaning up temporary files...');
      
      for (const file of tempFiles) {
        if (await fs.pathExists(file)) {
          await fs.remove(file);
          logger.debug(`Removed: ${file}`);
        }
      }
      
      await this.tempFileManager.cleanup();
      await this.mermaidRenderer.cleanup();
      await this.pdfConverter.cleanup();
      
    } catch (error) {
      logger.warn(`Cleanup warning: ${error.message}`);
    }
  }

  async validateDependencies() {
    const issues = [];
    
    // Check Pandoc for DOCX conversion
    if (this.options.format.includes('docx')) {
      const pandocCheck = await this.docxConverter.checkPandocAvailability();
      if (!pandocCheck.available) {
        issues.push({
          type: 'warning',
          message: 'Pandoc not found. DOCX conversion will be unavailable.',
          suggestion: 'Install Pandoc from https://pandoc.org/installing.html'
        });
      }
    }

    return issues;
  }
}

module.exports = { DocumentProcessor };