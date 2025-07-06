const { FileValidator, validateInput } = require('../../src/validators/fileValidator');
const fs = require('fs-extra');
const path = require('path');

// Mock fs-extra
jest.mock('fs-extra');

describe('FileValidator', () => {
  const testFilePath = '/test/sample.md';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateInput', () => {
    test('should validate valid markdown file successfully', async () => {
      const mockStats = {
        isFile: () => true,
        size: 1024
      };
      const mockContent = '# Test Document\n\nThis is a test.';

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(mockContent);

      const result = await FileValidator.validateInput(testFilePath);

      expect(result).toEqual({
        valid: true,
        errors: [],
        path: path.resolve(testFilePath),
        size: 1024
      });
    });

    test('should reject non-existent file', async () => {
      fs.pathExists.mockResolvedValue(false);

      const result = await FileValidator.validateInput('nonexistent.md');

      expect(result).toEqual({
        valid: false,
        errors: ['File not found: nonexistent.md']
      });
    });

    test('should reject directory path', async () => {
      const mockStats = {
        isFile: () => false,
        size: 0
      };

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);

      const result = await FileValidator.validateInput('/test/directory');

      expect(result).toEqual({
        valid: false,
        errors: ['Path is not a file: /test/directory']
      });
    });

    test('should reject invalid file extensions', async () => {
      const mockStats = {
        isFile: () => true,
        size: 1024
      };
      const mockContent = 'test content';

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(mockContent);

      const result = await FileValidator.validateInput('/test/file.txt');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid file extension: .txt. Supported extensions: .md, .markdown');
    });

    test('should accept .markdown extension', async () => {
      const mockStats = {
        isFile: () => true,
        size: 1024
      };
      const mockContent = '# Test Document';

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(mockContent);

      const result = await FileValidator.validateInput('/test/file.markdown');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject files that are too large', async () => {
      const mockStats = {
        isFile: () => true,
        size: 60 * 1024 * 1024 // 60MB
      };
      const mockContent = '# Test Document';

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(mockContent);

      const result = await FileValidator.validateInput(testFilePath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('File too large'))).toBe(true);
    });

    test('should reject unreadable files', async () => {
      const mockStats = {
        isFile: () => true,
        size: 1024
      };

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);
      fs.access.mockRejectedValue(new Error('Permission denied'));

      const result = await FileValidator.validateInput(testFilePath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('File is not readable'))).toBe(true);
    });

    test('should reject empty files', async () => {
      const mockStats = {
        isFile: () => true,
        size: 0
      };

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue('   \n\t  '); // Only whitespace

      const result = await FileValidator.validateInput(testFilePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });

    test('should reject files with binary content', async () => {
      const mockStats = {
        isFile: () => true,
        size: 1024
      };
      const binaryContent = 'Some text\0with null bytes';

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(binaryContent);

      const result = await FileValidator.validateInput(testFilePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File appears to contain binary content');
    });

    test('should handle file read errors', async () => {
      const mockStats = {
        isFile: () => true,
        size: 1024
      };

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue(mockStats);
      fs.access.mockResolvedValue();
      fs.readFile.mockRejectedValue(new Error('Read error'));

      const result = await FileValidator.validateInput(testFilePath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Cannot read file content'))).toBe(true);
    });

    test('should handle general validation errors', async () => {
      fs.pathExists.mockRejectedValue(new Error('System error'));

      const result = await FileValidator.validateInput(testFilePath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Validation error'))).toBe(true);
    });
  });

  describe('validateOutputPath', () => {
    test('should validate valid output path', () => {
      fs.pathExistsSync.mockReturnValue(true);
      fs.accessSync.mockReturnValue();

      const result = FileValidator.validateOutputPath('/test/output/file.pdf');

      expect(result).toEqual({
        valid: true,
        errors: []
      });
    });

    test('should create output directory if it does not exist', () => {
      fs.pathExistsSync.mockReturnValue(false);
      fs.ensureDirSync.mockReturnValue();
      fs.accessSync.mockReturnValue();

      const result = FileValidator.validateOutputPath('/test/output/file.pdf');

      expect(fs.ensureDirSync).toHaveBeenCalledWith('/test/output');
      expect(result.valid).toBe(true);
    });

    test('should handle directory creation errors', () => {
      fs.pathExistsSync.mockReturnValue(false);
      fs.ensureDirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = FileValidator.validateOutputPath('/test/output/file.pdf');

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Cannot create output directory'))).toBe(true);
    });

    test('should handle write permission errors', () => {
      fs.pathExistsSync.mockReturnValue(true);
      fs.accessSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = FileValidator.validateOutputPath('/test/output/file.pdf');

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('No write permission'))).toBe(true);
    });

    test('should warn about existing output file', () => {
      const loggerWarnSpy = jest.spyOn(require('../../src/utils/logger').logger, 'warn').mockImplementation();
      
      fs.pathExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(true); // dir exists, file exists
      fs.accessSync.mockReturnValue();

      const result = FileValidator.validateOutputPath('/test/output/file.pdf');

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Output file already exists and will be overwritten')
      );
      expect(result.valid).toBe(true);
      
      loggerWarnSpy.mockRestore();
    });
  });

  describe('validateFormat', () => {
    test('should validate single valid format', () => {
      const result = FileValidator.validateFormat('pdf');

      expect(result).toEqual({
        valid: true,
        errors: [],
        formats: ['pdf']
      });
    });

    test('should validate array of valid formats', () => {
      const result = FileValidator.validateFormat(['pdf', 'docx']);

      expect(result).toEqual({
        valid: true,
        errors: [],
        formats: ['pdf', 'docx']
      });
    });

    test('should handle case insensitive formats', () => {
      const result = FileValidator.validateFormat(['PDF', 'DOCX']);

      expect(result).toEqual({
        valid: true,
        errors: [],
        formats: ['pdf', 'docx']
      });
    });

    test('should reject invalid formats', () => {
      const result = FileValidator.validateFormat(['html', 'txt']);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid format: html. Supported formats: pdf, docx');
      expect(result.errors).toContain('Invalid format: txt. Supported formats: pdf, docx');
    });

    test('should handle mixed valid and invalid formats', () => {
      const result = FileValidator.validateFormat(['pdf', 'html']);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid format: html. Supported formats: pdf, docx');
      expect(result.formats).toEqual(['pdf', 'html']);
    });
  });

  describe('containsBinaryContent', () => {
    test('should detect null bytes as binary content', () => {
      const content = 'Some text\0with null bytes';
      
      const result = FileValidator.containsBinaryContent(content);
      
      expect(result).toBe(true);
    });

    test('should detect high ratio of non-printable characters', () => {
      const content = '\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A'; // Mostly non-printable
      
      const result = FileValidator.containsBinaryContent(content);
      
      expect(result).toBe(true);
    });

    test('should not detect normal text as binary', () => {
      const content = '# Markdown Document\n\nThis is normal text with some symbols: @#$%^&*()';
      
      const result = FileValidator.containsBinaryContent(content);
      
      expect(result).toBe(false);
    });

    test('should handle empty content', () => {
      const result = FileValidator.containsBinaryContent('');
      
      expect(result).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(FileValidator.formatFileSize(0)).toBe('0 Bytes');
      expect(FileValidator.formatFileSize(512)).toBe('512 Bytes');
      expect(FileValidator.formatFileSize(1024)).toBe('1 KB');
      expect(FileValidator.formatFileSize(1536)).toBe('1.5 KB');
      expect(FileValidator.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(FileValidator.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    test('should handle large file sizes', () => {
      const result = FileValidator.formatFileSize(2.5 * 1024 * 1024 * 1024);
      expect(result).toBe('2.5 GB');
    });
  });

  describe('sanitizePath', () => {
    test('should normalize valid paths', () => {
      const result = FileValidator.sanitizePath('/test/./file.md');
      expect(result).toBe(path.normalize('/test/./file.md'));
    });

    test('should reject directory traversal attempts', () => {
      expect(() => {
        FileValidator.sanitizePath('../../../etc/passwd');
      }).toThrow('Invalid path: directory traversal detected');
    });

    test('should reject relative traversal attempts', () => {
      expect(() => {
        FileValidator.sanitizePath('../../sensitive/file.txt');
      }).toThrow('Invalid path: directory traversal detected');
    });

    test('should allow legitimate relative paths', () => {
      const result = FileValidator.sanitizePath('./docs/readme.md');
      expect(result).toBe(path.normalize('./docs/readme.md'));
    });
  });
});

describe('validateInput convenience function', () => {
  test('should call FileValidator.validateInput', async () => {
    const mockResult = { valid: true, errors: [] };
    const validateInputSpy = jest.spyOn(FileValidator, 'validateInput').mockResolvedValue(mockResult);

    const result = await validateInput('test.md');

    expect(validateInputSpy).toHaveBeenCalledWith('test.md');
    expect(result).toEqual(mockResult);
    
    validateInputSpy.mockRestore();
  });
});