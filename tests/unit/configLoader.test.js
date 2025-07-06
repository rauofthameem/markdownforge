const { ConfigLoader, configSchema } = require('../../src/utils/configLoader');
const { FileConverterError, ERROR_CODES } = require('../../src/utils/errors');
const fs = require('fs-extra');
const path = require('path');
const { cosmiconfig } = require('cosmiconfig');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('cosmiconfig');

describe('ConfigLoader', () => {
  let configLoader;
  let mockExplorer;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock explorer
    mockExplorer = {
      search: jest.fn(),
      load: jest.fn()
    };
    
    cosmiconfig.mockReturnValue(mockExplorer);
    
    configLoader = new ConfigLoader();
  });

  describe('constructor', () => {
    test('should create ConfigLoader with correct cosmiconfig setup', () => {
      expect(cosmiconfig).toHaveBeenCalledWith('markdownforge', {
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
    });
  });

  describe('loadConfig', () => {
    test('should load default config when no config file found', async () => {
      mockExplorer.search.mockResolvedValue(null);

      const config = await configLoader.loadConfig();

      expect(config).toEqual(expect.objectContaining({
        format: ['pdf', 'docx'],
        output: './output',
        theme: 'default',
        diagramFormat: 'png',
        verbose: false
      }));
      expect(mockExplorer.search).toHaveBeenCalled();
    });

    test('should load and validate config from search', async () => {
      const mockConfig = {
        format: ['pdf'],
        theme: 'github',
        verbose: true
      };
      
      mockExplorer.search.mockResolvedValue({
        config: mockConfig,
        filepath: '.markdownforgerc'
      });

      const config = await configLoader.loadConfig();

      expect(config).toEqual(expect.objectContaining({
        format: ['pdf'],
        theme: 'github',
        verbose: true
      }));
    });

    test('should load specific config file when path provided', async () => {
      const configPath = '.custom-config.json';
      const mockConfig = { format: ['docx'] };
      
      fs.pathExists.mockResolvedValue(true);
      mockExplorer.load.mockResolvedValue({
        config: mockConfig,
        filepath: configPath
      });

      const config = await configLoader.loadConfig(configPath);

      expect(fs.pathExists).toHaveBeenCalledWith(path.resolve(configPath));
      expect(mockExplorer.load).toHaveBeenCalledWith(path.resolve(configPath));
      expect(config.format).toEqual(['docx']);
    });

    test('should throw error when specific config file not found', async () => {
      const configPath = 'nonexistent.json';
      
      fs.pathExists.mockResolvedValue(false);

      await expect(configLoader.loadConfig(configPath)).rejects.toThrow(
        new FileConverterError(
          `Configuration file not found: ${configPath}`,
          ERROR_CODES.CONFIG_NOT_FOUND
        )
      );
    });

    test('should throw error when config file is invalid', async () => {
      const configPath = 'invalid.json';
      
      fs.pathExists.mockResolvedValue(true);
      mockExplorer.load.mockRejectedValue(new Error('Invalid JSON'));

      await expect(configLoader.loadConfig(configPath)).rejects.toThrow(
        new FileConverterError(
          'Invalid configuration file: Invalid JSON',
          ERROR_CODES.CONFIG_INVALID
        )
      );
    });

    test('should handle general loading errors', async () => {
      mockExplorer.search.mockRejectedValue(new Error('Search failed'));

      await expect(configLoader.loadConfig()).rejects.toThrow(
        new FileConverterError(
          'Failed to load configuration: Search failed',
          ERROR_CODES.CONFIG_INVALID
        )
      );
    });
  });

  describe('validateConfig', () => {
    test('should validate and apply defaults to empty config', async () => {
      fs.pathExists.mockResolvedValue(false); // No file paths to validate

      const config = await configLoader.validateConfig({});

      expect(config).toEqual(expect.objectContaining({
        format: ['pdf', 'docx'],
        output: './output',
        theme: 'default',
        diagramFormat: 'png',
        verbose: false,
        pdf: expect.any(Object),
        docx: expect.any(Object),
        mermaid: expect.any(Object)
      }));
    });

    test('should validate config with custom values', async () => {
      const customConfig = {
        format: ['pdf'],
        theme: 'github',
        verbose: true,
        pdf: {
          format: 'Letter',
          margin: { top: '0.5in' }
        }
      };

      fs.pathExists.mockResolvedValue(false);

      const config = await configLoader.validateConfig(customConfig);

      expect(config.format).toEqual(['pdf']);
      expect(config.theme).toBe('github');
      expect(config.verbose).toBe(true);
      expect(config.pdf.format).toBe('Letter');
      expect(config.pdf.margin.top).toBe('0.5in');
    });

    test('should throw error for invalid format values', async () => {
      const invalidConfig = {
        format: ['invalid-format']
      };

      await expect(configLoader.validateConfig(invalidConfig)).rejects.toThrow(
        FileConverterError
      );
    });

    test('should throw error for invalid theme values', async () => {
      const invalidConfig = {
        theme: 'invalid-theme'
      };

      await expect(configLoader.validateConfig(invalidConfig)).rejects.toThrow(
        FileConverterError
      );
    });

    test('should validate file paths when provided', async () => {
      const configWithPaths = {
        docx: {
          template: 'template.docx',
          referenceDoc: 'reference.docx'
        }
      };

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue({ isFile: () => true });

      const config = await configLoader.validateConfig(configWithPaths);

      expect(fs.pathExists).toHaveBeenCalledWith(path.resolve('template.docx'));
      expect(fs.pathExists).toHaveBeenCalledWith(path.resolve('reference.docx'));
      expect(fs.stat).toHaveBeenCalledTimes(2);
      expect(config.docx.template).toBe('template.docx');
    });

    test('should throw error when file path is not a file', async () => {
      const configWithPaths = {
        docx: {
          template: 'not-a-file'
        }
      };

      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue({ isFile: () => false });

      await expect(configLoader.validateConfig(configWithPaths)).rejects.toThrow(
        new FileConverterError(
          'DOCX template is not a file: not-a-file',
          ERROR_CODES.CONFIG_INVALID
        )
      );
    });
  });

  describe('getDefaultConfig', () => {
    test('should return valid default configuration', () => {
      const defaultConfig = configLoader.getDefaultConfig();

      expect(defaultConfig).toEqual(expect.objectContaining({
        format: ['pdf', 'docx'],
        output: './output',
        theme: 'default',
        diagramFormat: 'png',
        verbose: false
      }));
    });
  });

  describe('createExampleConfig', () => {
    test('should create example config file with default path', async () => {
      fs.writeFile.mockResolvedValue();

      const result = await configLoader.createExampleConfig();

      expect(fs.writeFile).toHaveBeenCalledWith(
        '.fileconverterrc.example',
        expect.stringContaining('"format"')
      );
      expect(result).toBe('.fileconverterrc.example');
    });

    test('should create example config file with custom path', async () => {
      const customPath = 'custom-config.json';
      fs.writeFile.mockResolvedValue();

      const result = await configLoader.createExampleConfig(customPath);

      expect(fs.writeFile).toHaveBeenCalledWith(
        customPath,
        expect.stringContaining('"format"')
      );
      expect(result).toBe(customPath);
    });
  });

  describe('mergeConfigs', () => {
    test('should merge simple properties', () => {
      const baseConfig = { format: ['pdf'], theme: 'default' };
      const overrideConfig = { theme: 'github', verbose: true };

      const merged = configLoader.mergeConfigs(baseConfig, overrideConfig);

      expect(merged).toEqual({
        format: ['pdf'],
        theme: 'github',
        verbose: true
      });
    });

    test('should deep merge nested objects', () => {
      const baseConfig = {
        pdf: { format: 'A4', margin: { top: '1in', bottom: '1in' } }
      };
      const overrideConfig = {
        pdf: { margin: { top: '0.5in' } }
      };

      const merged = configLoader.mergeConfigs(baseConfig, overrideConfig);

      expect(merged.pdf).toEqual({
        format: 'A4',
        margin: { top: '0.5in' }
      });
    });

    test('should ignore null and undefined values', () => {
      const baseConfig = { format: ['pdf'], theme: 'default' };
      const overrideConfig = { theme: null, verbose: undefined };

      const merged = configLoader.mergeConfigs(baseConfig, overrideConfig);

      expect(merged).toEqual({
        format: ['pdf'],
        theme: 'default'
      });
    });
  });

  describe('getConfigInfo', () => {
    test('should return config info when config found', async () => {
      const mockResult = {
        filepath: '.markdownforgerc',
        config: { format: ['pdf'] }
      };
      
      mockExplorer.search.mockResolvedValue(mockResult);

      const info = await configLoader.getConfigInfo();

      expect(info).toEqual({
        found: true,
        path: '.markdownforgerc',
        config: { format: ['pdf'] }
      });
    });

    test('should return default config info when no config found', async () => {
      mockExplorer.search.mockResolvedValue(null);

      const info = await configLoader.getConfigInfo();

      expect(info).toEqual({
        found: false,
        path: null,
        config: expect.objectContaining({
          format: ['pdf', 'docx'],
          theme: 'default'
        })
      });
    });

    test('should handle search errors gracefully', async () => {
      mockExplorer.search.mockRejectedValue(new Error('Search failed'));

      const info = await configLoader.getConfigInfo();

      expect(info).toEqual({
        found: false,
        path: null,
        config: expect.any(Object),
        error: 'Search failed'
      });
    });
  });
});

describe('loadConfig convenience function', () => {
  test('should call configLoader.loadConfig', async () => {
    const mockConfig = { format: ['pdf'] };
    
    // Create a spy on the configLoader instance
    const loadConfigSpy = jest.spyOn(require('../../src/utils/configLoader').configLoader, 'loadConfig')
      .mockResolvedValue(mockConfig);

    const { loadConfig: loadConfigFunc } = require('../../src/utils/configLoader');
    const result = await loadConfigFunc('test-config.json');

    expect(loadConfigSpy).toHaveBeenCalledWith('test-config.json');
    expect(result).toEqual(mockConfig);
    
    loadConfigSpy.mockRestore();
  });
});

describe('configSchema', () => {
  test('should validate valid configuration', () => {
    const validConfig = {
      format: ['pdf', 'docx'],
      theme: 'github',
      verbose: true
    };

    const { error, value } = configSchema.validate(validConfig);

    expect(error).toBeUndefined();
    expect(value).toEqual(expect.objectContaining(validConfig));
  });

  test('should reject invalid format values', () => {
    const invalidConfig = {
      format: ['invalid']
    };

    const { error } = configSchema.validate(invalidConfig);

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('must be one of');
  });

  test('should apply default values', () => {
    const { error, value } = configSchema.validate({});

    expect(error).toBeUndefined();
    expect(value).toEqual(expect.objectContaining({
      format: ['pdf', 'docx'],
      output: './output',
      theme: 'default',
      verbose: false
    }));
  });
});