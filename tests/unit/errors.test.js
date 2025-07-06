const {
  FileConverterError,
  ERROR_CODES,
  EXIT_CODES,
  ErrorHandler,
  createInputError,
  createOutputError,
  createProcessingError,
  createDependencyError
} = require('../../src/utils/errors');

describe('FileConverterError', () => {
  test('should create error with message and code', () => {
    const error = new FileConverterError('Test error', ERROR_CODES.INPUT_INVALID);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FileConverterError);
    expect(error.name).toBe('FileConverterError');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ERROR_CODES.INPUT_INVALID);
    expect(error.details).toEqual({});
  });

  test('should create error with details', () => {
    const details = { filePath: 'test.md', size: 1024 };
    const error = new FileConverterError('Test error', ERROR_CODES.INPUT_TOO_LARGE, details);

    expect(error.details).toEqual(details);
  });

  test('should have proper stack trace', () => {
    const error = new FileConverterError('Test error', ERROR_CODES.PROCESSING_ERROR);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('FileConverterError');
  });

  test('should serialize to JSON correctly', () => {
    const details = { test: 'value' };
    const error = new FileConverterError('Test error', ERROR_CODES.CONFIG_INVALID, details);

    const json = error.toJSON();

    expect(json).toEqual({
      name: 'FileConverterError',
      message: 'Test error',
      code: ERROR_CODES.CONFIG_INVALID,
      details: details,
      stack: error.stack
    });
  });
});

describe('ERROR_CODES', () => {
  test('should contain all expected error codes', () => {
    expect(ERROR_CODES.INPUT_NOT_FOUND).toBe('INPUT_NOT_FOUND');
    expect(ERROR_CODES.INPUT_INVALID).toBe('INPUT_INVALID');
    expect(ERROR_CODES.INPUT_TOO_LARGE).toBe('INPUT_TOO_LARGE');
    expect(ERROR_CODES.INPUT_BINARY).toBe('INPUT_BINARY');
    expect(ERROR_CODES.OUTPUT_PERMISSION).toBe('OUTPUT_PERMISSION');
    expect(ERROR_CODES.OUTPUT_DISK_SPACE).toBe('OUTPUT_DISK_SPACE');
    expect(ERROR_CODES.OUTPUT_INVALID_PATH).toBe('OUTPUT_INVALID_PATH');
    expect(ERROR_CODES.PROCESSING_ERROR).toBe('PROCESSING_ERROR');
    expect(ERROR_CODES.MERMAID_RENDER_FAILED).toBe('MERMAID_RENDER_FAILED');
    expect(ERROR_CODES.PDF_GENERATION_FAILED).toBe('PDF_GENERATION_FAILED');
    expect(ERROR_CODES.DOCX_GENERATION_FAILED).toBe('DOCX_GENERATION_FAILED');
    expect(ERROR_CODES.PANDOC_NOT_FOUND).toBe('PANDOC_NOT_FOUND');
    expect(ERROR_CODES.PUPPETEER_LAUNCH_FAILED).toBe('PUPPETEER_LAUNCH_FAILED');
    expect(ERROR_CODES.DEPENDENCY_ERROR).toBe('DEPENDENCY_ERROR');
    expect(ERROR_CODES.CONFIG_INVALID).toBe('CONFIG_INVALID');
    expect(ERROR_CODES.CONFIG_NOT_FOUND).toBe('CONFIG_NOT_FOUND');
    expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ERROR_CODES.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
  });
});

describe('EXIT_CODES', () => {
  test('should contain all expected exit codes', () => {
    expect(EXIT_CODES.SUCCESS).toBe(0);
    expect(EXIT_CODES.GENERAL_ERROR).toBe(1);
    expect(EXIT_CODES.INPUT_ERROR).toBe(2);
    expect(EXIT_CODES.OUTPUT_ERROR).toBe(3);
    expect(EXIT_CODES.DEPENDENCY_ERROR).toBe(4);
    expect(EXIT_CODES.PROCESSING_ERROR).toBe(5);
    expect(EXIT_CODES.CONFIG_ERROR).toBe(6);
  });
});

describe('ErrorHandler', () => {
  describe('getExitCode', () => {
    test('should return correct exit code for input errors', () => {
      const error = new FileConverterError('Test', ERROR_CODES.INPUT_NOT_FOUND);
      expect(ErrorHandler.getExitCode(error)).toBe(EXIT_CODES.INPUT_ERROR);

      const error2 = new FileConverterError('Test', ERROR_CODES.INPUT_INVALID);
      expect(ErrorHandler.getExitCode(error2)).toBe(EXIT_CODES.INPUT_ERROR);

      const error3 = new FileConverterError('Test', ERROR_CODES.INPUT_TOO_LARGE);
      expect(ErrorHandler.getExitCode(error3)).toBe(EXIT_CODES.INPUT_ERROR);

      const error4 = new FileConverterError('Test', ERROR_CODES.INPUT_BINARY);
      expect(ErrorHandler.getExitCode(error4)).toBe(EXIT_CODES.INPUT_ERROR);
    });

    test('should return correct exit code for output errors', () => {
      const error = new FileConverterError('Test', ERROR_CODES.OUTPUT_PERMISSION);
      expect(ErrorHandler.getExitCode(error)).toBe(EXIT_CODES.OUTPUT_ERROR);

      const error2 = new FileConverterError('Test', ERROR_CODES.OUTPUT_DISK_SPACE);
      expect(ErrorHandler.getExitCode(error2)).toBe(EXIT_CODES.OUTPUT_ERROR);

      const error3 = new FileConverterError('Test', ERROR_CODES.OUTPUT_INVALID_PATH);
      expect(ErrorHandler.getExitCode(error3)).toBe(EXIT_CODES.OUTPUT_ERROR);
    });

    test('should return correct exit code for dependency errors', () => {
      const error = new FileConverterError('Test', ERROR_CODES.PANDOC_NOT_FOUND);
      expect(ErrorHandler.getExitCode(error)).toBe(EXIT_CODES.DEPENDENCY_ERROR);

      const error2 = new FileConverterError('Test', ERROR_CODES.PUPPETEER_LAUNCH_FAILED);
      expect(ErrorHandler.getExitCode(error2)).toBe(EXIT_CODES.DEPENDENCY_ERROR);

      const error3 = new FileConverterError('Test', ERROR_CODES.DEPENDENCY_ERROR);
      expect(ErrorHandler.getExitCode(error3)).toBe(EXIT_CODES.DEPENDENCY_ERROR);
    });

    test('should return correct exit code for processing errors', () => {
      const error = new FileConverterError('Test', ERROR_CODES.PROCESSING_ERROR);
      expect(ErrorHandler.getExitCode(error)).toBe(EXIT_CODES.PROCESSING_ERROR);

      const error2 = new FileConverterError('Test', ERROR_CODES.MERMAID_RENDER_FAILED);
      expect(ErrorHandler.getExitCode(error2)).toBe(EXIT_CODES.PROCESSING_ERROR);

      const error3 = new FileConverterError('Test', ERROR_CODES.PDF_GENERATION_FAILED);
      expect(ErrorHandler.getExitCode(error3)).toBe(EXIT_CODES.PROCESSING_ERROR);

      const error4 = new FileConverterError('Test', ERROR_CODES.DOCX_GENERATION_FAILED);
      expect(ErrorHandler.getExitCode(error4)).toBe(EXIT_CODES.PROCESSING_ERROR);
    });

    test('should return correct exit code for config errors', () => {
      const error = new FileConverterError('Test', ERROR_CODES.CONFIG_INVALID);
      expect(ErrorHandler.getExitCode(error)).toBe(EXIT_CODES.CONFIG_ERROR);

      const error2 = new FileConverterError('Test', ERROR_CODES.CONFIG_NOT_FOUND);
      expect(ErrorHandler.getExitCode(error2)).toBe(EXIT_CODES.CONFIG_ERROR);
    });

    test('should return general error for unknown codes', () => {
      const error = new FileConverterError('Test', 'UNKNOWN_CODE');
      expect(ErrorHandler.getExitCode(error)).toBe(EXIT_CODES.GENERAL_ERROR);
    });

    test('should return general error for non-FileConverterError', () => {
      const error = new Error('Regular error');
      expect(ErrorHandler.getExitCode(error)).toBe(EXIT_CODES.GENERAL_ERROR);
    });
  });

  describe('getUserFriendlyMessage', () => {
    test('should return user-friendly message for known error codes', () => {
      const error = new FileConverterError('File not found', ERROR_CODES.INPUT_NOT_FOUND);
      const message = ErrorHandler.getUserFriendlyMessage(error);

      expect(message).toContain('File not found');
      expect(message).toContain('Please check that the file path is correct');
    });

    test('should include additional suggestion from error details', () => {
      const error = new FileConverterError('Config error', ERROR_CODES.CONFIG_INVALID, {
        suggestion: 'Check line 5 of your config file'
      });
      const message = ErrorHandler.getUserFriendlyMessage(error);

      expect(message).toContain('Config error');
      expect(message).toContain('Please check your configuration file syntax');
      expect(message).toContain('Check line 5 of your config file');
    });

    test('should handle non-FileConverterError', () => {
      const error = new Error('Regular error');
      const message = ErrorHandler.getUserFriendlyMessage(error);

      expect(message).toBe('An unexpected error occurred: Regular error');
    });

    test('should return basic message for unknown error codes', () => {
      const error = new FileConverterError('Unknown error', 'UNKNOWN_CODE');
      const message = ErrorHandler.getUserFriendlyMessage(error);

      expect(message).toBe('Unknown error');
    });
  });

  describe('formatError', () => {
    test('should return user-friendly message in non-verbose mode', () => {
      const error = new FileConverterError('Test error', ERROR_CODES.INPUT_INVALID);
      const formatted = ErrorHandler.formatError(error, false);

      expect(formatted).toContain('Test error');
      expect(formatted).toContain('Please ensure the file is a valid Markdown file');
      expect(formatted).not.toContain('Error Details:');
    });

    test('should return detailed information in verbose mode', () => {
      const error = new FileConverterError('Test error', ERROR_CODES.INPUT_INVALID, {
        filePath: 'test.txt'
      });
      const formatted = ErrorHandler.formatError(error, true);

      expect(formatted).toContain('Test error');
      expect(formatted).toContain('Error Details:');
      expect(formatted).toContain('Type: FileConverterError');
      expect(formatted).toContain('Code: INPUT_INVALID');
      expect(formatted).toContain('filePath');
      expect(formatted).toContain('Stack Trace:');
    });

    test('should handle errors without details in verbose mode', () => {
      const error = new FileConverterError('Simple error', ERROR_CODES.PROCESSING_ERROR);
      const formatted = ErrorHandler.formatError(error, true);

      expect(formatted).toContain('Simple error');
      expect(formatted).toContain('Error Details:');
      expect(formatted).not.toContain('Details: {');
    });
  });

  describe('createError', () => {
    test('should create FileConverterError with specified parameters', () => {
      const details = { test: 'value' };
      const error = ErrorHandler.createError(ERROR_CODES.INPUT_INVALID, 'Test message', details);

      expect(error).toBeInstanceOf(FileConverterError);
      expect(error.code).toBe(ERROR_CODES.INPUT_INVALID);
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual(details);
    });
  });

  describe('wrapError', () => {
    test('should wrap original error with FileConverterError', () => {
      const originalError = new Error('Original error');
      const wrappedError = ErrorHandler.wrapError(
        originalError,
        ERROR_CODES.PROCESSING_ERROR,
        'Wrapped message',
        { context: 'test' }
      );

      expect(wrappedError).toBeInstanceOf(FileConverterError);
      expect(wrappedError.code).toBe(ERROR_CODES.PROCESSING_ERROR);
      expect(wrappedError.message).toBe('Wrapped message');
      expect(wrappedError.details.context).toBe('test');
      expect(wrappedError.details.originalError).toEqual({
        name: 'Error',
        message: 'Original error',
        stack: originalError.stack
      });
    });

    test('should use original error message if no message provided', () => {
      const originalError = new Error('Original error');
      const wrappedError = ErrorHandler.wrapError(originalError, ERROR_CODES.PROCESSING_ERROR);

      expect(wrappedError.message).toBe('Original error');
    });
  });

  describe('isRecoverable', () => {
    test('should return true for recoverable error codes', () => {
      const error1 = new FileConverterError('Test', ERROR_CODES.MERMAID_RENDER_FAILED);
      expect(ErrorHandler.isRecoverable(error1)).toBe(true);

      const error2 = new FileConverterError('Test', ERROR_CODES.NETWORK_ERROR);
      expect(ErrorHandler.isRecoverable(error2)).toBe(true);

      const error3 = new FileConverterError('Test', ERROR_CODES.TIMEOUT_ERROR);
      expect(ErrorHandler.isRecoverable(error3)).toBe(true);
    });

    test('should return false for non-recoverable error codes', () => {
      const error = new FileConverterError('Test', ERROR_CODES.INPUT_NOT_FOUND);
      expect(ErrorHandler.isRecoverable(error)).toBe(false);
    });

    test('should return false for non-FileConverterError', () => {
      const error = new Error('Regular error');
      expect(ErrorHandler.isRecoverable(error)).toBe(false);
    });
  });

  describe('handleAsync', () => {
    test('should return result when async function succeeds', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      
      const result = await ErrorHandler.handleAsync(
        asyncFn,
        ERROR_CODES.PROCESSING_ERROR,
        'Operation failed'
      );

      expect(result).toBe('success');
      expect(asyncFn).toHaveBeenCalled();
    });

    test('should wrap error when async function fails', async () => {
      const originalError = new Error('Original error');
      const asyncFn = jest.fn().mockRejectedValue(originalError);

      await expect(
        ErrorHandler.handleAsync(asyncFn, ERROR_CODES.PROCESSING_ERROR, 'Operation failed')
      ).rejects.toThrow(FileConverterError);

      // Test the wrapped error properties
      let thrownError;
      try {
        await ErrorHandler.handleAsync(asyncFn, ERROR_CODES.PROCESSING_ERROR, 'Operation failed');
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.code).toBe(ERROR_CODES.PROCESSING_ERROR);
      expect(thrownError.message).toBe('Operation failed');
      expect(thrownError.details.originalError.message).toBe('Original error');
    });
  });
});

describe('Utility error creation functions', () => {
  test('createInputError should create input error', () => {
    const details = { filePath: 'test.md' };
    const error = createInputError('Invalid input', details);

    expect(error).toBeInstanceOf(FileConverterError);
    expect(error.code).toBe(ERROR_CODES.INPUT_INVALID);
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual(details);
  });

  test('createOutputError should create output error', () => {
    const details = { outputPath: 'output.pdf' };
    const error = createOutputError('Output error', details);

    expect(error).toBeInstanceOf(FileConverterError);
    expect(error.code).toBe(ERROR_CODES.OUTPUT_PERMISSION);
    expect(error.message).toBe('Output error');
    expect(error.details).toEqual(details);
  });

  test('createProcessingError should create processing error', () => {
    const details = { step: 'conversion' };
    const error = createProcessingError('Processing failed', details);

    expect(error).toBeInstanceOf(FileConverterError);
    expect(error.code).toBe(ERROR_CODES.PROCESSING_ERROR);
    expect(error.message).toBe('Processing failed');
    expect(error.details).toEqual(details);
  });

  test('createDependencyError should create dependency error', () => {
    const details = { dependency: 'pandoc' };
    const error = createDependencyError('Dependency missing', details);

    expect(error).toBeInstanceOf(FileConverterError);
    expect(error.code).toBe(ERROR_CODES.DEPENDENCY_ERROR);
    expect(error.message).toBe('Dependency missing');
    expect(error.details).toEqual(details);
  });
});