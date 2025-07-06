const { TempFileManager } = require('../../src/core/tempFileManager');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Mock fs-extra and os
jest.mock('fs-extra');
jest.mock('os');

describe('TempFileManager', () => {
  let tempFileManager;
  const mockTempDir = '/tmp';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock os.tmpdir to return a consistent value
    os.tmpdir.mockReturnValue(mockTempDir);
    
    // Mock fs methods
    fs.ensureDir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.pathExists.mockResolvedValue(true);
    fs.remove.mockResolvedValue();
    fs.readdir.mockResolvedValue([]);
    fs.stat.mockResolvedValue({ mtime: new Date(), birthtime: new Date(), size: 1024 });
    
    tempFileManager = new TempFileManager();
  });

  describe('constructor', () => {
    test('should create TempFileManager with default settings', () => {
      expect(tempFileManager).toBeInstanceOf(TempFileManager);
      expect(tempFileManager.tempFiles).toBeInstanceOf(Set);
      expect(tempFileManager.tempDirs).toBeInstanceOf(Set);
      expect(tempFileManager.baseTempDir).toBe(path.join(mockTempDir, 'fileconverter'));
      expect(tempFileManager.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('generateSessionId', () => {
    test('should generate unique session IDs', () => {
      const id1 = tempFileManager.generateSessionId();
      const id2 = tempFileManager.generateSessionId();
      
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('createTempDir', () => {
    test('should create temporary directory with default prefix', async () => {
      const result = await tempFileManager.createTempDir();
      
      expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('temp_'));
      expect(result).toContain('temp_');
      expect(tempFileManager.tempDirs.has(result)).toBe(true);
    });

    test('should create temporary directory with custom prefix', async () => {
      const result = await tempFileManager.createTempDir('custom');
      
      expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('custom_'));
      expect(result).toContain('custom_');
      expect(tempFileManager.tempDirs.has(result)).toBe(true);
    });

    test('should handle directory creation errors', async () => {
      fs.ensureDir.mockRejectedValue(new Error('Permission denied'));

      await expect(tempFileManager.createTempDir()).rejects.toThrow('Permission denied');
    });
  });

  describe('createTempFile', () => {
    test('should create temporary file with string content', async () => {
      const content = 'test content';
      const result = await tempFileManager.createTempFile(content, 'txt');
      
      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), content, 'utf-8');
      expect(result).toContain('.txt');
      expect(tempFileManager.tempFiles.has(result)).toBe(true);
    });

    test('should create temporary file with buffer content', async () => {
      const content = Buffer.from('test content');
      const result = await tempFileManager.createTempFile(content, 'bin');
      
      expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), content);
      expect(result).toContain('.bin');
    });

    test('should create temporary file with default extension', async () => {
      const result = await tempFileManager.createTempFile('content');
      
      expect(result).toContain('.tmp');
    });

    test('should handle file creation errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('Disk full'));

      await expect(tempFileManager.createTempFile('content')).rejects.toThrow('Disk full');
    });
  });

  describe('copyToTemp', () => {
    test('should copy file to temporary location', async () => {
      const sourcePath = '/source/file.txt';
      
      const result = await tempFileManager.copyToTemp(sourcePath);
      
      expect(fs.copy).toHaveBeenCalledWith(sourcePath, expect.any(String));
      expect(result).toContain('file_copy.txt');
      expect(tempFileManager.tempFiles.has(result)).toBe(true);
    });

    test('should copy file with custom extension', async () => {
      const sourcePath = '/source/file.txt';
      
      const result = await tempFileManager.copyToTemp(sourcePath, '.pdf');
      
      expect(result).toContain('.pdf');
    });

    test('should handle copy errors', async () => {
      fs.copy.mockRejectedValue(new Error('Source file not found'));

      await expect(tempFileManager.copyToTemp('/nonexistent.txt'))
        .rejects.toThrow('Source file not found');
    });
  });

  describe('getTempPath', () => {
    test('should generate temporary file path', async () => {
      const result = await tempFileManager.getTempPath('test.txt');
      
      expect(result).toContain('test.txt');
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('cleanup', () => {
    test('should remove all temporary files and directories', async () => {
      const tempFile1 = '/tmp/file1.txt';
      const tempFile2 = '/tmp/file2.txt';
      const tempDir = '/tmp/dir';
      
      tempFileManager.tempFiles.add(tempFile1);
      tempFileManager.tempFiles.add(tempFile2);
      tempFileManager.tempDirs.add(tempDir);
      
      const result = await tempFileManager.cleanup();
      
      expect(fs.remove).toHaveBeenCalledWith(tempFile1);
      expect(fs.remove).toHaveBeenCalledWith(tempFile2);
      expect(fs.remove).toHaveBeenCalledWith(tempDir);
      expect(tempFileManager.tempFiles.size).toBe(0);
      expect(tempFileManager.tempDirs.size).toBe(0);
      expect(result.files).toBe(2);
      expect(result.directories).toBe(1);
    });

    test('should handle cleanup errors gracefully', async () => {
      const tempFile = '/tmp/file.txt';
      tempFileManager.tempFiles.add(tempFile);
      
      fs.remove.mockRejectedValue(new Error('Permission denied'));

      const result = await tempFileManager.cleanup();
      
      expect(tempFileManager.tempFiles.size).toBe(0);
      expect(result.files).toBe(0);
    });

    test('should skip non-existent files', async () => {
      const tempFile = '/tmp/nonexistent.txt';
      tempFileManager.tempFiles.add(tempFile);
      
      fs.pathExists.mockResolvedValue(false);

      const result = await tempFileManager.cleanup();
      
      expect(fs.remove).not.toHaveBeenCalled();
      expect(result.files).toBe(0);
    });
  });

  describe('cleanupOldSessions', () => {
    test('should remove old session directories', async () => {
      fs.readdir.mockResolvedValue(['session_123_abc', 'session_456_def', 'other_dir']);
      fs.stat.mockResolvedValue({ mtime: new Date(Date.now() - 25 * 60 * 60 * 1000) }); // 25 hours old
      
      const result = await tempFileManager.cleanupOldSessions();
      
      expect(fs.remove).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });

    test('should skip recent sessions', async () => {
      fs.readdir.mockResolvedValue(['session_123_abc']);
      fs.stat.mockResolvedValue({ mtime: new Date() }); // Recent
      
      const result = await tempFileManager.cleanupOldSessions();
      
      expect(fs.remove).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    test('should handle missing base directory', async () => {
      fs.pathExists.mockResolvedValue(false);
      
      const result = await tempFileManager.cleanupOldSessions();
      
      expect(result).toBe(0);
    });
  });

  describe('getSessionInfo', () => {
    test('should return session information', async () => {
      const result = await tempFileManager.getSessionInfo();
      
      expect(result.sessionId).toBe(tempFileManager.sessionId);
      expect(result.sessionDir).toContain(tempFileManager.sessionId);
      expect(result.tempFiles).toEqual([]);
      expect(result.tempDirs).toEqual([]);
    });

    test('should include size information when session exists', async () => {
      tempFileManager.tempFiles.add('/tmp/file.txt');
      
      const result = await tempFileManager.getSessionInfo();
      
      expect(result.totalSize).toBe(1024);
    });
  });

  describe('utility methods', () => {
    test('registerTempFile should add file to tracking', () => {
      const filePath = '/tmp/external.txt';
      
      tempFileManager.registerTempFile(filePath);
      
      expect(tempFileManager.tempFiles.has(filePath)).toBe(true);
    });

    test('registerTempDir should add directory to tracking', () => {
      const dirPath = '/tmp/external_dir';
      
      tempFileManager.registerTempDir(dirPath);
      
      expect(tempFileManager.tempDirs.has(dirPath)).toBe(true);
    });

    test('getTempFileCount should return correct count', () => {
      tempFileManager.tempFiles.add('/tmp/file1.txt');
      tempFileManager.tempFiles.add('/tmp/file2.txt');
      
      expect(tempFileManager.getTempFileCount()).toBe(2);
    });

    test('getTempDirCount should return correct count', () => {
      tempFileManager.tempDirs.add('/tmp/dir1');
      tempFileManager.tempDirs.add('/tmp/dir2');
      
      expect(tempFileManager.getTempDirCount()).toBe(2);
    });

    test('isManaged should detect managed files', () => {
      const filePath = '/tmp/managed.txt';
      const dirPath = '/tmp/managed_dir';
      
      tempFileManager.tempFiles.add(filePath);
      tempFileManager.tempDirs.add(dirPath);
      
      expect(tempFileManager.isManaged(filePath)).toBe(true);
      expect(tempFileManager.isManaged('/tmp/managed_dir/subfile.txt')).toBe(true);
      expect(tempFileManager.isManaged('/tmp/unmanaged.txt')).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle cleanup when no files tracked', async () => {
      const result = await tempFileManager.cleanup();
      
      expect(result.files).toBe(0);
      expect(result.directories).toBe(0);
    });

    test('should handle multiple cleanup calls', async () => {
      const tempFile = '/tmp/file.txt';
      tempFileManager.tempFiles.add(tempFile);
      
      await tempFileManager.cleanup();
      const result = await tempFileManager.cleanup(); // Second call
      
      expect(result.files).toBe(0);
    });
  });
});