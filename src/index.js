// Main entry point for programmatic usage
const { DocumentProcessor } = require('./core/documentProcessor');
const { MermaidRenderer } = require('./renderers/mermaidRenderer');
const { DOCXConverter } = require('./converters/docxConverter');
const { PDFConverter } = require('./converters/pdfConverter');
const { OutputManager } = require('./output/outputManager');
const { TempFileManager } = require('./core/tempFileManager');
const { FileValidator, validateInput } = require('./validators/fileValidator');
const { loadConfig } = require('./utils/configLoader');
const { logger } = require('./utils/logger');
const { 
  FileConverterError, 
  ERROR_CODES, 
  EXIT_CODES,
  ErrorHandler 
} = require('./utils/errors');

// Main API class for programmatic usage
class FileConverter {
  constructor(options = {}) {
    this.processor = new DocumentProcessor(options);
  }

  async convert(inputPath, options = {}) {
    const mergedOptions = { ...this.processor.options, ...options };
    const processor = new DocumentProcessor(mergedOptions);
    
    return await processor.processDocument(inputPath);
  }

  async validateInput(inputPath) {
    return await validateInput(inputPath);
  }

  async loadConfig(configPath = null) {
    return await loadConfig(configPath);
  }

  setVerbose(verbose) {
    logger.setVerbose(verbose);
  }

  setSilent(silent) {
    logger.setSilent(silent);
  }
}

// Convenience functions for direct usage
async function convertMarkdown(inputPath, options = {}) {
  const converter = new FileConverter(options);
  return await converter.convert(inputPath);
}

async function convertToPDF(inputPath, outputPath, options = {}) {
  const pdfConverter = new PDFConverter(options);
  return await pdfConverter.convert(inputPath, outputPath);
}

async function convertToDOCX(inputPath, outputPath, options = {}) {
  const docxConverter = new DOCXConverter(options);
  return await docxConverter.convert(inputPath, outputPath);
}

async function renderMermaidDiagrams(markdownContent, outputDir, options = {}) {
  const renderer = new MermaidRenderer(options);
  const diagrams = await renderer.extractDiagrams(markdownContent);
  return await renderer.renderAll(diagrams, outputDir);
}

// Export all classes and functions
module.exports = {
  // Main classes
  FileConverter,
  DocumentProcessor,
  MermaidRenderer,
  DOCXConverter,
  PDFConverter,
  OutputManager,
  TempFileManager,
  FileValidator,
  
  // Utility classes
  ErrorHandler,
  
  // Convenience functions
  convertMarkdown,
  convertToPDF,
  convertToDOCX,
  renderMermaidDiagrams,
  validateInput,
  loadConfig,
  
  // Constants
  ERROR_CODES,
  EXIT_CODES,
  
  // Errors
  FileConverterError,
  
  // Logger
  logger
};