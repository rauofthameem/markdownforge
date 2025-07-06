const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../utils/logger');

class FileValidator {
  static async validateInput(filePath) {
    const errors = [];
    
    try {
      // Normalize path
      const normalizedPath = path.resolve(filePath);
      
      // Check if file exists
      if (!await fs.pathExists(normalizedPath)) {
        errors.push(`File not found: ${filePath}`);
        return { valid: false, errors };
      }
      
      // Check if it's a file (not directory)
      const stats = await fs.stat(normalizedPath);
      if (!stats.isFile()) {
        errors.push(`Path is not a file: ${filePath}`);
        return { valid: false, errors };
      }
      
      // Check file extension
      const ext = path.extname(normalizedPath).toLowerCase();
      const validExtensions = ['.md', '.markdown'];
      if (!validExtensions.includes(ext)) {
        errors.push(`Invalid file extension: ${ext}. Supported extensions: ${validExtensions.join(', ')}`);
      }
      
      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (stats.size > maxSize) {
        errors.push(`File too large: ${this.formatFileSize(stats.size)}. Maximum size: ${this.formatFileSize(maxSize)}`);
      }
      
      // Check if file is readable
      try {
        await fs.access(normalizedPath, fs.constants.R_OK);
      } catch (error) {
        errors.push(`File is not readable: ${error.message}`);
      }
      
      // Validate file content
      try {
        const content = await fs.readFile(normalizedPath, 'utf-8');
        
        // Check if file is empty
        if (content.trim().length === 0) {
          errors.push('File is empty');
        }
        
        // Check for binary content (basic check)
        if (this.containsBinaryContent(content)) {
          errors.push('File appears to contain binary content');
        }
        
      } catch (error) {
        errors.push(`Cannot read file content: ${error.message}`);
      }
      
      return {
        valid: errors.length === 0,
        errors,
        path: normalizedPath,
        size: stats.size
      };
      
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return { valid: false, errors };
    }
  }
  
  static validateOutputPath(outputPath) {
    const errors = [];
    
    try {
      const normalizedPath = path.resolve(outputPath);
      const dir = path.dirname(normalizedPath);
      
      // Check if parent directory exists or can be created
      if (!fs.pathExistsSync(dir)) {
        try {
          fs.ensureDirSync(dir);
        } catch (error) {
          errors.push(`Cannot create output directory: ${error.message}`);
        }
      }
      
      // Check write permissions
      try {
        fs.accessSync(dir, fs.constants.W_OK);
      } catch (_error) {
        errors.push(`No write permission for output directory: ${dir}`);
      }
      
      // Check if output file already exists
      if (fs.pathExistsSync(normalizedPath)) {
        logger.warn(`Output file already exists and will be overwritten: ${normalizedPath}`);
      }
      
    } catch (error) {
      errors.push(`Output path validation error: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  static validateFormat(format) {
    const errors = [];
    const validFormats = ['pdf', 'docx'];
    
    if (!Array.isArray(format)) {
      format = [format];
    }
    
    for (const fmt of format) {
      if (!validFormats.includes(fmt.toLowerCase())) {
        errors.push(`Invalid format: ${fmt}. Supported formats: ${validFormats.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      formats: format.map(f => f.toLowerCase())
    };
  }
  
  static containsBinaryContent(content) {
    // Simple check for binary content
    // Look for null bytes or high percentage of non-printable characters
    const nullBytes = (content.match(/\0/g) || []).length;
    if (nullBytes > 0) return true;
    
    const nonPrintable = content.replace(/[\x20-\x7E\s]/g, '').length;
    const ratio = nonPrintable / content.length;
    
    return ratio > 0.3; // If more than 30% non-printable, likely binary
  }
  
  static formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  static sanitizePath(inputPath) {
    // Prevent directory traversal attacks
    const normalized = path.normalize(inputPath);
    
    if (normalized.includes('..')) {
      throw new Error('Invalid path: directory traversal detected');
    }
    
    return normalized;
  }
}

// Export convenience function
async function validateInput(filePath) {
  return await FileValidator.validateInput(filePath);
}

module.exports = {
  FileValidator,
  validateInput
};