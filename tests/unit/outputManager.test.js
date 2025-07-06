const { OutputManager } = require('../../src/output/outputManager');
const fs = require('fs-extra');
const path = require('path');

// Mock fs-extra
jest.mock('fs-extra');

describe('OutputManager', () => {
  let outputManager;
  const testOutputDir = '/test/output';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs methods
    fs.ensureDir.mockResolvedValue();
    fs.pathExists.mockResolvedValue(false);
    fs.writeFile.mockResolvedValue();
    fs.readdir.mockResolvedValue([]);
    fs.stat.mockResolvedValue({ 
      isFile: () => true, 
      size: 1024, 
      mtime: new Date(),
      birthtime: new Date()
    });
    fs.access.mockResolvedValue();
    fs.remove.mockResolvedValue();
    
    outputManager = new OutputManager(testOutputDir);
  });

  describe('constructor', () => {
    test('should create OutputManager with output directory', () => {
      expect(outputManager).toBeInstanceOf(OutputManager);
      expect(outputManager.outputDir).toBe(path.resolve(testOutputDir));
    });

    test('should create OutputManager with default directory', () => {
      const defaultManager = new OutputManager();
      expect(defaultManager.outputDir).toBe(path.resolve('./output'));
    });
  });

  describe('ensureOutputDir', () => {
    test('should create output directory', async () => {
      await outputManager.ensureOutputDir();
      
      expect(fs.ensureDir).toHaveBeenCalledWith(path.resolve(testOutputDir));
    });

    test('should handle directory creation errors', async () => {
      fs.ensureDir.mockRejectedValue(new Error('Permission denied'));

      await expect(outputManager.ensureOutputDir()).rejects.toThrow('Failed to create output directory');
    });
  });

  describe('getOutputPath', () => {
    test('should return full output path with format', async () => {
      const baseName = 'test';
      const format = 'pdf';
      
      const result = await outputManager.getOutputPath(baseName, format);

      expect(result).toBe(path.join(path.resolve(testOutputDir), 'test.pdf'));
      expect(fs.ensureDir).toHaveBeenCalled();
    });

    test('should handle different formats', async () => {
      const result = await outputManager.getOutputPath('document', 'docx');

      expect(result).toBe(path.join(path.resolve(testOutputDir), 'document.docx'));
    });
  });

  describe('checkWritePermissions', () => {
    test('should return true when write permissions exist', async () => {
      fs.access.mockResolvedValue();

      const result = await outputManager.checkWritePermissions();

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith(path.resolve(testOutputDir), fs.constants.W_OK);
    });

    test('should return false when write permissions denied', async () => {
      fs.access.mockRejectedValue(new Error('Permission denied'));

      const result = await outputManager.checkWritePermissions();

      expect(result).toBe(false);
    });
  });

  describe('getAvailableSpace', () => {
    test('should return available space info', async () => {
      const result = await outputManager.getAvailableSpace();

      expect(result.available).toBe(true);
      expect(result.path).toBe(path.resolve(testOutputDir));
      expect(fs.stat).toHaveBeenCalledWith(path.resolve(testOutputDir));
    });

    test('should handle stat errors', async () => {
      fs.stat.mockRejectedValue(new Error('Directory not found'));

      const result = await outputManager.getAvailableSpace();

      expect(result.available).toBe(false);
      expect(result.error).toBe('Directory not found');
    });
  });

  describe('cleanupOldFiles', () => {
    test('should clean up old files', async () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      fs.readdir.mockResolvedValue(['old-file.pdf', 'recent-file.pdf']);
      fs.stat
        .mockResolvedValueOnce({ isFile: () => true, mtime: oldDate })
        .mockResolvedValueOnce({ isFile: () => true, mtime: new Date() });

      const result = await outputManager.cleanupOldFiles();

      expect(result).toBe(1);
      expect(fs.remove).toHaveBeenCalledWith(path.join(path.resolve(testOutputDir), 'old-file.pdf'));
    });

    test('should handle cleanup errors gracefully', async () => {
      fs.readdir.mockRejectedValue(new Error('Access denied'));

      const result = await outputManager.cleanupOldFiles();

      expect(result).toBe(0);
    });
  });

  describe('generateUniqueFileName', () => {
    test('should return original filename when no conflict', async () => {
      fs.pathExists.mockResolvedValue(false);

      const result = await outputManager.generateUniqueFileName('test', 'pdf');

      expect(result).toBe(path.join(path.resolve(testOutputDir), 'test.pdf'));
    });

    test('should generate unique filename when conflict exists', async () => {
      fs.pathExists
        .mockResolvedValueOnce(true)  // test.pdf exists
        .mockResolvedValueOnce(false); // test_1.pdf doesn't exist

      const result = await outputManager.generateUniqueFileName('test', 'pdf');

      expect(result).toBe(path.join(path.resolve(testOutputDir), 'test_1.pdf'));
    });

    test('should handle multiple conflicts', async () => {
      fs.pathExists
        .mockResolvedValueOnce(true)  // test.pdf exists
        .mockResolvedValueOnce(true)  // test_1.pdf exists
        .mockResolvedValueOnce(false); // test_2.pdf doesn't exist

      const result = await outputManager.generateUniqueFileName('test', 'pdf');

      expect(result).toBe(path.join(path.resolve(testOutputDir), 'test_2.pdf'));
    });
  });

  describe('validateOutputPath', () => {
    test('should validate existing writable path', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.access.mockResolvedValue();

      const result = await outputManager.validateOutputPath('/test/output/file.pdf');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle non-existent directory', async () => {
      fs.pathExists.mockResolvedValue(false);
      fs.ensureDir.mockResolvedValue();
      fs.access.mockResolvedValue();

      const result = await outputManager.validateOutputPath('/test/output/file.pdf');

      expect(result.valid).toBe(true);
      expect(fs.ensureDir).toHaveBeenCalled();
    });

    test('should detect permission issues', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.access.mockRejectedValue(new Error('Permission denied'));

      const result = await outputManager.validateOutputPath('/test/output/file.pdf');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getOutputSummary', () => {
    test('should generate summary for existing files', async () => {
      const outputPaths = ['/test/file1.pdf', '/test/file2.docx'];
      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });

      const result = await outputManager.getOutputSummary(outputPaths);

      expect(result.files).toHaveLength(2);
      expect(result.totalSize).toBe(2048);
      expect(result.formats).toEqual(['pdf', 'docx']);
    });

    test('should handle missing files', async () => {
      const outputPaths = ['/test/missing.pdf'];
      fs.pathExists.mockResolvedValue(false);

      const result = await outputManager.getOutputSummary(outputPaths);

      expect(result.files).toHaveLength(0);
      expect(result.totalSize).toBe(0);
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(outputManager.formatFileSize(0)).toBe('0 Bytes');
      expect(outputManager.formatFileSize(1024)).toBe('1 KB');
      expect(outputManager.formatFileSize(1048576)).toBe('1 MB');
      expect(outputManager.formatFileSize(1073741824)).toBe('1 GB');
    });

    test('should handle decimal values', () => {
      expect(outputManager.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('createOutputReport', () => {
    test('should create comprehensive report', async () => {
      const outputPaths = ['/test/file.pdf'];
      const processingTime = 5000;
      
      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });

      const result = await outputManager.createOutputReport(outputPaths, processingTime);

      expect(result.processingTime).toBe(processingTime);
      expect(result.outputDirectory).toBe(path.resolve(testOutputDir));
      expect(result.totalFiles).toBe(1);
      expect(result.files[0].size).toBe('1 KB');
    });
  });

  describe('utility methods', () => {
    test('getRelativePath should return relative path', () => {
      const filePath = '/some/absolute/path/file.pdf';
      const result = outputManager.getRelativePath(filePath);
      
      expect(typeof result).toBe('string');
    });

    test('isEmpty should check if directory is empty', async () => {
      fs.readdir.mockResolvedValue([]);

      const result = await outputManager.isEmpty();

      expect(result).toBe(true);
    });

    test('isEmpty should return false for non-empty directory', async () => {
      fs.readdir.mockResolvedValue(['file1.pdf']);

      const result = await outputManager.isEmpty();

      expect(result).toBe(false);
    });

    test('getDirectoryInfo should return directory information', async () => {
      fs.readdir.mockResolvedValue(['file1.pdf', 'file2.docx']);

      const result = await outputManager.getDirectoryInfo();

      expect(result.exists).toBe(true);
      expect(result.fileCount).toBe(2);
      expect(result.path).toBe(path.resolve(testOutputDir));
    });

    test('getDirectoryInfo should handle non-existent directory', async () => {
      fs.stat.mockRejectedValue(new Error('Directory not found'));

      const result = await outputManager.getDirectoryInfo();

      expect(result.exists).toBe(false);
      expect(result.error).toBe('Directory not found');
    });
  });

  describe('saveReport', () => {
    test('should save report to specified path', async () => {
      const report = { test: 'data' };
      const reportPath = '/test/report.json';

      const result = await outputManager.saveReport(report, reportPath);

      expect(fs.writeFile).toHaveBeenCalledWith(reportPath, JSON.stringify(report, null, 2));
      expect(result).toBe(reportPath);
    });

    test('should generate default path when none provided', async () => {
      const report = { test: 'data' };

      const result = await outputManager.saveReport(report);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(result).toContain('conversion-report-');
    });

    test('should handle save errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('Write failed'));

      const result = await outputManager.saveReport({ test: 'data' });

      expect(result).toBeNull();
    });
  });
});