const fs = require('fs-extra');
const path = require('path');
const { cosmiconfig } = require('cosmiconfig');
const Joi = require('joi');
const { logger } = require('./logger');
const { FileConverterError, ERROR_CODES } = require('./errors');

// Configuration schema for validation
const configSchema = Joi.object({
  format: Joi.array().items(Joi.string().valid('pdf', 'docx')).default(['pdf', 'docx']),
  output: Joi.string().default('./output'),
  theme: Joi.string().valid('default', 'github', 'academic').default('default'),
  diagramFormat: Joi.string().valid('png', 'svg').default('png'),
  verbose: Joi.boolean().default(false),
  
  pdf: Joi.object({
    format: Joi.string().valid('A4', 'A3', 'Letter', 'Legal').default('A4'),
    margin: Joi.object({
      top: Joi.string().default('1in'),
      right: Joi.string().default('1in'),
      bottom: Joi.string().default('1in'),
      left: Joi.string().default('1in')
    }).default(),
    displayHeaderFooter: Joi.boolean().default(false),
    headerTemplate: Joi.string().default(''),
    footerTemplate: Joi.string().default(''),
    printBackground: Joi.boolean().default(true)
  }).default(),
  
  docx: Joi.object({
    template: Joi.string().allow(null),
    referenceDoc: Joi.string().allow(null),
    pandocPath: Joi.string().default('pandoc'),
    formatting: Joi.object({
      headingSpacing: Joi.object({
        before: Joi.number().default(400),
        after: Joi.number().default(200)
      }).default(),
      paragraphSpacing: Joi.object({
        before: Joi.number().default(0),
        after: Joi.number().default(150)
      }).default(),
      sectionSpacing: Joi.object({
        before: Joi.number().default(300),
        after: Joi.number().default(200)
      }).default(),
      fontSize: Joi.number().default(22),
      headingFontSizes: Joi.object({
        h1: Joi.number().default(32),
        h2: Joi.number().default(28),
        h3: Joi.number().default(24),
        h4: Joi.number().default(22),
        h5: Joi.number().default(20),
        h6: Joi.number().default(18)
      }).default(),
      colors: Joi.object({
        headings: Joi.string().default('2E74B5'),
        text: Joi.string().default('000000'),
        code: Joi.string().default('D73A49')
      }).default(),
      alignment: Joi.object({
        paragraphs: Joi.string().valid('left', 'center', 'right', 'justified').default('justified'),
        headings: Joi.string().valid('left', 'center', 'right', 'justified').default('left')
      }).default()
    }).default()
  }).default(),
  
  mermaid: Joi.object({
    theme: Joi.string().valid('default', 'dark', 'forest', 'neutral').default('default'),
    backgroundColor: Joi.string().default('white'),
    width: Joi.number().integer().min(100).max(2000).default(800),
    height: Joi.number().integer().min(100).max(2000).default(600)
  }).default()
});

class ConfigLoader {
  constructor() {
    this.explorer = cosmiconfig('markdownforge', {
      searchPlaces: [
        'package.json',
        '.markdownforgerc',
        '.markdownforgerc.json',
        '.markdownforgerc.yaml',
        '.markdownforgerc.yml',
        '.markdownforgerc.js',
        'markdownforge.config.js'
      ]
    });
  }

  async loadConfig(configPath = null) {
    try {
      let result;
      
      if (configPath) {
        // Load specific config file
        result = await this.loadSpecificConfig(configPath);
      } else {
        // Search for config file
        result = await this.explorer.search();
      }
      
      const config = result ? result.config : {};
      
      // Validate and apply defaults
      const validatedConfig = await this.validateConfig(config);
      
      logger.debug(`Configuration loaded from: ${result ? result.filepath : 'defaults'}`);
      
      return validatedConfig;
      
    } catch (error) {
      if (error instanceof FileConverterError) {
        throw error;
      }
      
      throw new FileConverterError(
        `Failed to load configuration: ${error.message}`,
        ERROR_CODES.CONFIG_INVALID,
        { originalError: error }
      );
    }
  }

  async loadSpecificConfig(configPath) {
    const fullPath = path.resolve(configPath);
    
    if (!await fs.pathExists(fullPath)) {
      throw new FileConverterError(
        `Configuration file not found: ${configPath}`,
        ERROR_CODES.CONFIG_NOT_FOUND
      );
    }
    
    try {
      return await this.explorer.load(fullPath);
    } catch (error) {
      throw new FileConverterError(
        `Invalid configuration file: ${error.message}`,
        ERROR_CODES.CONFIG_INVALID,
        { configPath: fullPath }
      );
    }
  }

  async validateConfig(config) {
    try {
      const { error, value } = configSchema.validate(config, {
        allowUnknown: false,
        stripUnknown: true
      });
      
      if (error) {
        throw new FileConverterError(
          `Configuration validation failed: ${error.details.map(d => d.message).join(', ')}`,
          ERROR_CODES.CONFIG_INVALID,
          { validationErrors: error.details }
        );
      }
      
      // Additional validation for file paths
      await this.validateFilePaths(value);
      
      return value;
      
    } catch (error) {
      if (error instanceof FileConverterError) {
        throw error;
      }
      
      throw new FileConverterError(
        `Configuration validation error: ${error.message}`,
        ERROR_CODES.CONFIG_INVALID
      );
    }
  }

  async validateFilePaths(config) {
    const pathsToCheck = [];
    
    // Check DOCX template and reference doc
    if (config.docx.template) {
      pathsToCheck.push({ path: config.docx.template, type: 'DOCX template' });
    }
    
    if (config.docx.referenceDoc) {
      pathsToCheck.push({ path: config.docx.referenceDoc, type: 'DOCX reference document' });
    }
    
    for (const { path: filePath, type } of pathsToCheck) {
      const fullPath = path.resolve(filePath);
      
      if (!await fs.pathExists(fullPath)) {
        logger.warn(`${type} not found: ${filePath}`);
        continue;
      }
      
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        throw new FileConverterError(
          `${type} is not a file: ${filePath}`,
          ERROR_CODES.CONFIG_INVALID
        );
      }
    }
  }

  getDefaultConfig() {
    const { error, value } = configSchema.validate({});
    if (error) {
      throw new Error(`Default configuration is invalid: ${error.message}`);
    }
    return value;
  }

  async createExampleConfig(outputPath = '.fileconverterrc.example') {
    const exampleConfig = {
      format: ['pdf', 'docx'],
      output: './output',
      theme: 'default',
      diagramFormat: 'png',
      verbose: false,
      
      pdf: {
        format: 'A4',
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in'
        },
        displayHeaderFooter: false,
        printBackground: true
      },
      
      docx: {
        template: null,
        referenceDoc: null,
        pandocPath: 'pandoc',
        formatting: {
          headingSpacing: {
            before: 800,
            after: 400
          },
          paragraphSpacing: {
            before: 0,
            after: 300
          },
          sectionSpacing: {
            before: 1000,
            after: 500
          },
          fontSize: 22,
          headingFontSizes: {
            h1: 32,
            h2: 28,
            h3: 24,
            h4: 22,
            h5: 20,
            h6: 18
          },
          colors: {
            headings: '2E74B5',
            text: '000000',
            code: 'D73A49'
          }
        }
      },
      
      mermaid: {
        theme: 'default',
        backgroundColor: 'white',
        width: 800,
        height: 600
      }
    };
    
    const content = JSON.stringify(exampleConfig, null, 2);
    await fs.writeFile(outputPath, content);
    
    logger.info(`Example configuration created: ${outputPath}`);
    return outputPath;
  }

  mergeConfigs(baseConfig, overrideConfig) {
    // Deep merge configurations
    const merged = { ...baseConfig };
    
    for (const [key, value] of Object.entries(overrideConfig)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value) && merged[key]) {
          merged[key] = { ...merged[key], ...value };
        } else {
          merged[key] = value;
        }
      }
    }
    
    return merged;
  }

  async getConfigInfo() {
    try {
      const result = await this.explorer.search();
      
      if (!result) {
        return {
          found: false,
          path: null,
          config: this.getDefaultConfig()
        };
      }
      
      return {
        found: true,
        path: result.filepath,
        config: result.config
      };
    } catch (error) {
      return {
        found: false,
        path: null,
        config: this.getDefaultConfig(),
        error: error.message
      };
    }
  }
}

// Create singleton instance
const configLoader = new ConfigLoader();

// Convenience function
async function loadConfig(configPath = null) {
  return await configLoader.loadConfig(configPath);
}

module.exports = {
  ConfigLoader,
  configLoader,
  loadConfig,
  configSchema
};