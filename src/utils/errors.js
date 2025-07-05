class FileConverterError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'FileConverterError';
    this.code = code;
    this.details = details;
    
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileConverterError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack
    };
  }
}

const ERROR_CODES = {
  // Input errors
  INPUT_NOT_FOUND: 'INPUT_NOT_FOUND',
  INPUT_INVALID: 'INPUT_INVALID',
  INPUT_TOO_LARGE: 'INPUT_TOO_LARGE',
  INPUT_BINARY: 'INPUT_BINARY',
  
  // Output errors
  OUTPUT_PERMISSION: 'OUTPUT_PERMISSION',
  OUTPUT_DISK_SPACE: 'OUTPUT_DISK_SPACE',
  OUTPUT_INVALID_PATH: 'OUTPUT_INVALID_PATH',
  
  // Processing errors
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  MERMAID_RENDER_FAILED: 'MERMAID_RENDER_FAILED',
  PDF_GENERATION_FAILED: 'PDF_GENERATION_FAILED',
  DOCX_GENERATION_FAILED: 'DOCX_GENERATION_FAILED',
  
  // System errors
  PANDOC_NOT_FOUND: 'PANDOC_NOT_FOUND',
  PUPPETEER_LAUNCH_FAILED: 'PUPPETEER_LAUNCH_FAILED',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
  
  // Configuration errors
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INPUT_ERROR: 2,
  OUTPUT_ERROR: 3,
  DEPENDENCY_ERROR: 4,
  PROCESSING_ERROR: 5,
  CONFIG_ERROR: 6
};

class ErrorHandler {
  static getExitCode(error) {
    if (!(error instanceof FileConverterError)) {
      return EXIT_CODES.GENERAL_ERROR;
    }

    switch (error.code) {
      case ERROR_CODES.INPUT_NOT_FOUND:
      case ERROR_CODES.INPUT_INVALID:
      case ERROR_CODES.INPUT_TOO_LARGE:
      case ERROR_CODES.INPUT_BINARY:
        return EXIT_CODES.INPUT_ERROR;
        
      case ERROR_CODES.OUTPUT_PERMISSION:
      case ERROR_CODES.OUTPUT_DISK_SPACE:
      case ERROR_CODES.OUTPUT_INVALID_PATH:
        return EXIT_CODES.OUTPUT_ERROR;
        
      case ERROR_CODES.PANDOC_NOT_FOUND:
      case ERROR_CODES.PUPPETEER_LAUNCH_FAILED:
      case ERROR_CODES.DEPENDENCY_ERROR:
        return EXIT_CODES.DEPENDENCY_ERROR;
        
      case ERROR_CODES.PROCESSING_ERROR:
      case ERROR_CODES.MERMAID_RENDER_FAILED:
      case ERROR_CODES.PDF_GENERATION_FAILED:
      case ERROR_CODES.DOCX_GENERATION_FAILED:
        return EXIT_CODES.PROCESSING_ERROR;
        
      case ERROR_CODES.CONFIG_INVALID:
      case ERROR_CODES.CONFIG_NOT_FOUND:
        return EXIT_CODES.CONFIG_ERROR;
        
      default:
        return EXIT_CODES.GENERAL_ERROR;
    }
  }

  static getUserFriendlyMessage(error) {
    if (!(error instanceof FileConverterError)) {
      return `An unexpected error occurred: ${error.message}`;
    }

    const suggestions = {
      [ERROR_CODES.INPUT_NOT_FOUND]: 'Please check that the file path is correct and the file exists.',
      [ERROR_CODES.INPUT_INVALID]: 'Please ensure the file is a valid Markdown file (.md or .markdown).',
      [ERROR_CODES.INPUT_TOO_LARGE]: 'Please use a smaller file or split the content into multiple files.',
      [ERROR_CODES.PANDOC_NOT_FOUND]: 'Please install Pandoc from https://pandoc.org/installing.html',
      [ERROR_CODES.PUPPETEER_LAUNCH_FAILED]: 'Please ensure Chrome/Chromium is installed and accessible.',
      [ERROR_CODES.OUTPUT_PERMISSION]: 'Please check write permissions for the output directory.',
      [ERROR_CODES.MERMAID_RENDER_FAILED]: 'Please check your Mermaid diagram syntax.',
      [ERROR_CODES.CONFIG_INVALID]: 'Please check your configuration file syntax.'
    };

    const suggestion = suggestions[error.code];
    let message = error.message;
    
    if (suggestion) {
      message += `\n\nSuggestion: ${suggestion}`;
    }
    
    if (error.details.suggestion) {
      message += `\n\nAdditional info: ${error.details.suggestion}`;
    }

    return message;
  }

  static formatError(error, verbose = false) {
    const userMessage = this.getUserFriendlyMessage(error);
    
    if (!verbose) {
      return userMessage;
    }

    // Verbose error information
    let details = `Error Details:
  Type: ${error.name || 'Error'}
  Code: ${error.code || 'UNKNOWN'}
  Message: ${error.message}`;

    if (error.details && Object.keys(error.details).length > 0) {
      details += `\n  Details: ${JSON.stringify(error.details, null, 2)}`;
    }

    if (error.stack) {
      details += `\n  Stack Trace:\n${error.stack}`;
    }

    return `${userMessage}\n\n${details}`;
  }

  static createError(code, message, details = {}) {
    return new FileConverterError(message, code, details);
  }

  static wrapError(originalError, code, message, details = {}) {
    return new FileConverterError(
      message || originalError.message,
      code,
      {
        ...details,
        originalError: {
          name: originalError.name,
          message: originalError.message,
          stack: originalError.stack
        }
      }
    );
  }

  static isRecoverable(error) {
    if (!(error instanceof FileConverterError)) {
      return false;
    }

    const recoverableCodes = [
      ERROR_CODES.MERMAID_RENDER_FAILED,
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT_ERROR
    ];

    return recoverableCodes.includes(error.code);
  }

  static async handleAsync(asyncFn, errorCode, errorMessage) {
    try {
      return await asyncFn();
    } catch (error) {
      throw this.wrapError(error, errorCode, errorMessage);
    }
  }
}

// Utility functions for common error scenarios
const createInputError = (message, details) => 
  new FileConverterError(message, ERROR_CODES.INPUT_INVALID, details);

const createOutputError = (message, details) => 
  new FileConverterError(message, ERROR_CODES.OUTPUT_PERMISSION, details);

const createProcessingError = (message, details) => 
  new FileConverterError(message, ERROR_CODES.PROCESSING_ERROR, details);

const createDependencyError = (message, details) => 
  new FileConverterError(message, ERROR_CODES.DEPENDENCY_ERROR, details);

module.exports = {
  FileConverterError,
  ERROR_CODES,
  EXIT_CODES,
  ErrorHandler,
  createInputError,
  createOutputError,
  createProcessingError,
  createDependencyError
};