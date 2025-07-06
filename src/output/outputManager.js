const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../utils/logger');
const { FileConverterError, ERROR_CODES } = require('../utils/errors');

class OutputManager {
  constructor(outputDir = './output') {
    this.outputDir = path.resolve(outputDir);
  }

  async ensureOutputDir() {
    try {
      await fs.ensureDir(this.outputDir);
      logger.debug(`Output directory ensured: ${this.outputDir}`);
    } catch (error) {
      throw new FileConverterError(
        `Failed to create output directory: ${error.message}`,
        ERROR_CODES.OUTPUT_PERMISSION,
        { outputDir: this.outputDir }
      );
    }
  }

  async getOutputPath(baseName, format) {
    const fileName = `${baseName}.${format}`;
    const outputPath = path.join(this.outputDir, fileName);
    
    // Ensure the directory exists
    await this.ensureOutputDir();
    
    return outputPath;
  }

  async checkWritePermissions() {
    try {
      await fs.access(this.outputDir, fs.constants.W_OK);
      return true;
    } catch (_error) {
      return false;
    }
  }

  async getAvailableSpace() {
    try {
      await fs.stat(this.outputDir);
      // This is a simplified check - in a real implementation,
      // you might want to use a library like 'check-disk-space'
      return {
        available: true,
        path: this.outputDir
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  async cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && (now - stats.mtime.getTime()) > maxAge) {
          await fs.remove(filePath);
          cleanedCount++;
          logger.debug(`Cleaned up old file: ${file}`);
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} old file(s)`);
      }

      return cleanedCount;
    } catch (error) {
      logger.warn(`Failed to cleanup old files: ${error.message}`);
      return 0;
    }
  }

  async generateUniqueFileName(baseName, format) {
    let counter = 1;
    let fileName = `${baseName}.${format}`;
    let filePath = path.join(this.outputDir, fileName);

    while (await fs.pathExists(filePath)) {
      fileName = `${baseName}_${counter}.${format}`;
      filePath = path.join(this.outputDir, fileName);
      counter++;
    }

    return filePath;
  }

  async validateOutputPath(outputPath) {
    const errors = [];
    
    try {
      const dir = path.dirname(outputPath);
      
      // Check if directory exists or can be created
      if (!await fs.pathExists(dir)) {
        try {
          await fs.ensureDir(dir);
        } catch (error) {
          errors.push(`Cannot create output directory: ${error.message}`);
        }
      }
      
      // Check write permissions
      if (!await this.checkWritePermissions()) {
        errors.push(`No write permission for output directory: ${dir}`);
      }
      
      // Check if file already exists
      if (await fs.pathExists(outputPath)) {
        logger.warn(`Output file will be overwritten: ${outputPath}`);
      }
      
    } catch (error) {
      errors.push(`Output validation error: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async getOutputSummary(outputPaths) {
    const summary = {
      files: [],
      totalSize: 0,
      formats: new Set()
    };

    for (const outputPath of outputPaths) {
      try {
        if (await fs.pathExists(outputPath)) {
          const stats = await fs.stat(outputPath);
          const ext = path.extname(outputPath).slice(1);
          
          summary.files.push({
            path: outputPath,
            name: path.basename(outputPath),
            size: stats.size,
            format: ext,
            created: stats.birthtime
          });
          
          summary.totalSize += stats.size;
          summary.formats.add(ext);
        }
      } catch (error) {
        logger.warn(`Failed to get stats for ${outputPath}: ${error.message}`);
      }
    }

    summary.formats = Array.from(summary.formats);
    
    return summary;
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async createOutputReport(outputPaths, processingTime) {
    const summary = await this.getOutputSummary(outputPaths);
    
    const report = {
      timestamp: new Date().toISOString(),
      processingTime,
      outputDirectory: this.outputDir,
      files: summary.files.map(file => ({
        name: file.name,
        format: file.format,
        size: this.formatFileSize(file.size),
        path: file.path
      })),
      totalFiles: summary.files.length,
      totalSize: this.formatFileSize(summary.totalSize),
      formats: summary.formats
    };

    return report;
  }

  async saveReport(report, reportPath = null) {
    if (!reportPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      reportPath = path.join(this.outputDir, `conversion-report-${timestamp}.json`);
    }

    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      logger.debug(`Report saved: ${reportPath}`);
      return reportPath;
    } catch (error) {
      logger.warn(`Failed to save report: ${error.message}`);
      return null;
    }
  }

  // Get relative path for display purposes
  getRelativePath(filePath) {
    return path.relative(process.cwd(), filePath);
  }

  // Check if output directory is empty
  async isEmpty() {
    try {
      const files = await fs.readdir(this.outputDir);
      return files.length === 0;
    } catch (_error) {
      return true; // If directory doesn't exist, consider it empty
    }
  }

  // Get output directory info
  async getDirectoryInfo() {
    try {
      const stats = await fs.stat(this.outputDir);
      const files = await fs.readdir(this.outputDir);
      
      return {
        exists: true,
        path: this.outputDir,
        fileCount: files.length,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        exists: false,
        path: this.outputDir,
        error: error.message
      };
    }
  }
}

module.exports = { OutputManager };