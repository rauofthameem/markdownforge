const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { logger } = require('../utils/logger');

class TempFileManager {
  constructor() {
    this.tempFiles = new Set();
    this.tempDirs = new Set();
    this.baseTempDir = path.join(os.tmpdir(), 'fileconverter');
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createTempDir(prefix = 'temp') {
    try {
      const tempDirPath = path.join(this.baseTempDir, this.sessionId, `${prefix}_${Date.now()}`);
      await fs.ensureDir(tempDirPath);
      
      this.tempDirs.add(tempDirPath);
      logger.debug(`Created temp directory: ${tempDirPath}`);
      
      return tempDirPath;
    } catch (error) {
      logger.error(`Failed to create temp directory: ${error.message}`);
      throw error;
    }
  }

  async createTempFile(content, extension = '.tmp', prefix = 'temp') {
    try {
      const tempDir = await this.createTempDir();
      const fileName = `${prefix}_${Date.now()}.${extension}`;
      const tempFilePath = path.join(tempDir, fileName);
      
      if (typeof content === 'string') {
        await fs.writeFile(tempFilePath, content, 'utf-8');
      } else {
        await fs.writeFile(tempFilePath, content);
      }
      
      this.tempFiles.add(tempFilePath);
      logger.debug(`Created temp file: ${tempFilePath}`);
      
      return tempFilePath;
    } catch (error) {
      logger.error(`Failed to create temp file: ${error.message}`);
      throw error;
    }
  }

  async copyToTemp(sourcePath, extension = null) {
    try {
      const sourceExt = extension || path.extname(sourcePath);
      const baseName = path.basename(sourcePath, path.extname(sourcePath));
      const tempDir = await this.createTempDir();
      const tempFilePath = path.join(tempDir, `${baseName}_copy${sourceExt}`);
      
      await fs.copy(sourcePath, tempFilePath);
      
      this.tempFiles.add(tempFilePath);
      logger.debug(`Copied to temp: ${sourcePath} -> ${tempFilePath}`);
      
      return tempFilePath;
    } catch (error) {
      logger.error(`Failed to copy to temp: ${error.message}`);
      throw error;
    }
  }

  async getTempPath(fileName) {
    const tempDir = await this.createTempDir();
    return path.join(tempDir, fileName);
  }

  async cleanup() {
    let cleanedFiles = 0;
    let cleanedDirs = 0;

    try {
      // Clean up individual temp files
      for (const filePath of this.tempFiles) {
        try {
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            cleanedFiles++;
            logger.debug(`Removed temp file: ${filePath}`);
          }
        } catch (error) {
          logger.warn(`Failed to remove temp file ${filePath}: ${error.message}`);
        }
      }

      // Clean up temp directories
      for (const dirPath of this.tempDirs) {
        try {
          if (await fs.pathExists(dirPath)) {
            await fs.remove(dirPath);
            cleanedDirs++;
            logger.debug(`Removed temp directory: ${dirPath}`);
          }
        } catch (error) {
          logger.warn(`Failed to remove temp directory ${dirPath}: ${error.message}`);
        }
      }

      // Clean up session directory if empty
      const sessionDir = path.join(this.baseTempDir, this.sessionId);
      try {
        if (await fs.pathExists(sessionDir)) {
          const files = await fs.readdir(sessionDir);
          if (files.length === 0) {
            await fs.remove(sessionDir);
            logger.debug(`Removed empty session directory: ${sessionDir}`);
          }
        }
      } catch (error) {
        logger.debug(`Session directory cleanup skipped: ${error.message}`);
      }

      // Clear tracking sets
      this.tempFiles.clear();
      this.tempDirs.clear();

      if (cleanedFiles > 0 || cleanedDirs > 0) {
        logger.debug(`Cleanup completed: ${cleanedFiles} files, ${cleanedDirs} directories`);
      }

      return { files: cleanedFiles, directories: cleanedDirs };

    } catch (error) {
      logger.warn(`Cleanup error: ${error.message}`);
      return { files: cleanedFiles, directories: cleanedDirs, error: error.message };
    }
  }

  async cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      if (!await fs.pathExists(this.baseTempDir)) {
        return 0;
      }

      const sessions = await fs.readdir(this.baseTempDir);
      const now = Date.now();
      let cleanedSessions = 0;

      for (const session of sessions) {
        if (!session.startsWith('session_')) continue;

        const sessionPath = path.join(this.baseTempDir, session);
        
        try {
          const stats = await fs.stat(sessionPath);
          const age = now - stats.mtime.getTime();

          if (age > maxAge) {
            await fs.remove(sessionPath);
            cleanedSessions++;
            logger.debug(`Removed old session: ${session}`);
          }
        } catch (error) {
          logger.debug(`Failed to process session ${session}: ${error.message}`);
        }
      }

      if (cleanedSessions > 0) {
        logger.info(`Cleaned up ${cleanedSessions} old session(s)`);
      }

      return cleanedSessions;

    } catch (error) {
      logger.warn(`Failed to cleanup old sessions: ${error.message}`);
      return 0;
    }
  }

  async getSessionInfo() {
    const sessionDir = path.join(this.baseTempDir, this.sessionId);
    
    try {
      const info = {
        sessionId: this.sessionId,
        sessionDir,
        tempFiles: Array.from(this.tempFiles),
        tempDirs: Array.from(this.tempDirs),
        exists: await fs.pathExists(sessionDir)
      };

      if (info.exists) {
        const stats = await fs.stat(sessionDir);
        info.created = stats.birthtime;
        info.modified = stats.mtime;
        
        // Calculate total size
        let totalSize = 0;
        for (const filePath of this.tempFiles) {
          try {
            if (await fs.pathExists(filePath)) {
              const fileStats = await fs.stat(filePath);
              totalSize += fileStats.size;
            }
          } catch (error) {
            // Ignore individual file errors
          }
        }
        info.totalSize = totalSize;
      }

      return info;

    } catch (error) {
      return {
        sessionId: this.sessionId,
        sessionDir,
        error: error.message
      };
    }
  }

  // Register external temp file for cleanup
  registerTempFile(filePath) {
    this.tempFiles.add(filePath);
    logger.debug(`Registered external temp file: ${filePath}`);
  }

  // Register external temp directory for cleanup
  registerTempDir(dirPath) {
    this.tempDirs.add(dirPath);
    logger.debug(`Registered external temp directory: ${dirPath}`);
  }

  // Get temp file count
  getTempFileCount() {
    return this.tempFiles.size;
  }

  // Get temp directory count
  getTempDirCount() {
    return this.tempDirs.size;
  }

  // Check if a path is managed by this instance
  isManaged(filePath) {
    return this.tempFiles.has(filePath) || 
           Array.from(this.tempDirs).some(dir => filePath.startsWith(dir));
  }
}

module.exports = { TempFileManager };