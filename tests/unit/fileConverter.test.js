const { FileConverter } = require('../../src/index');
const { DocumentProcessor } = require('../../src/core/documentProcessor');
const { validateInput } = require('../../src/validators/fileValidator');
const { loadConfig } = require('../../src/utils/configLoader');
const { logger } = require('../../src/utils/logger');
const path = require('path');

// Mock dependencies
jest.mock('../../src/core/documentProcessor');
jest.mock('../../src/validators/fileValidator');
jest.mock('../../src/utils/configLoader');

describe('FileConverter', () => {
  let fileConverter;
  let mockProcessor;
  const testOutputDir = path.join(__dirname, '../test-output');

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock processor instance
    mockProcessor = {
      options: { format: ['pdf'], outputDir: testOutputDir },
      processDocument: jest.fn()
    };
    
    DocumentProcessor.mockImplementation(() => mockProcessor);
    
    // Create FileConverter instance
    fileConverter = new FileConverter({
      format: ['pdf'],
      outputDir: testOutputDir
    });
  });

  afterEach(async () => {
    await global.testUtils.cleanupPath(testOutputDir);
  });

  describe('constructor', () => {
    test('should create FileConverter with default options', () => {
      const converter = new FileConverter();
      expect(converter).toBeInstanceOf(FileConverter);
      expect(DocumentProcessor).toHaveBeenCalledWith({});
    });

    test('should create FileConverter with custom options', () => {
      const options = { format: ['docx'], theme: 'github' };
      const converter = new FileConverter(options);
      expect(converter).toBeInstanceOf(FileConverter);
      expect(DocumentProcessor).toHaveBeenCalledWith(options);
    });
  });

  describe('convert', () => {
    test('should convert document with default options', async () => {
      const inputPath = 'test.md';
      const expectedResult = { success: true, outputs: ['test.pdf'] };
      
      mockProcessor.processDocument.mockResolvedValue(expectedResult);
      
      const result = await fileConverter.convert(inputPath);
      
      expect(DocumentProcessor).toHaveBeenCalledTimes(2); // Once in constructor, once in convert
      expect(mockProcessor.processDocument).toHaveBeenCalledWith(inputPath);
      expect(result).toEqual(expectedResult);
    });

    test('should convert document with merged options', async () => {
      const inputPath = 'test.md';
      const convertOptions = { theme: 'custom', verbose: true };
      const expectedResult = { success: true, outputs: ['test.pdf'] };
      
      mockProcessor.processDocument.mockResolvedValue(expectedResult);
      
      const result = await fileConverter.convert(inputPath, convertOptions);
      
      expect(DocumentProcessor).toHaveBeenCalledWith({
        format: ['pdf'],
        outputDir: testOutputDir,
        theme: 'custom',
        verbose: true
      });
      expect(result).toEqual(expectedResult);
    });

    test('should handle conversion errors', async () => {
      const inputPath = 'test.md';
      const error = new Error('Conversion failed');
      
      mockProcessor.processDocument.mockRejectedValue(error);
      
      await expect(fileConverter.convert(inputPath)).rejects.toThrow('Conversion failed');
    });
  });

  describe('validateInput', () => {
    test('should validate input file successfully', async () => {
      const inputPath = 'test.md';
      const expectedResult = { valid: true, errors: [] };
      
      validateInput.mockResolvedValue(expectedResult);
      
      const result = await fileConverter.validateInput(inputPath);
      
      expect(validateInput).toHaveBeenCalledWith(inputPath);
      expect(result).toEqual(expectedResult);
    });

    test('should return validation errors', async () => {
      const inputPath = 'invalid.txt';
      const expectedResult = { valid: false, errors: ['Invalid file extension'] };
      
      validateInput.mockResolvedValue(expectedResult);
      
      const result = await fileConverter.validateInput(inputPath);
      
      expect(result).toEqual(expectedResult);
    });
  });

  describe('loadConfig', () => {
    test('should load default config', async () => {
      const expectedConfig = { format: ['pdf'], theme: 'default' };
      
      loadConfig.mockResolvedValue(expectedConfig);
      
      const result = await fileConverter.loadConfig();
      
      expect(loadConfig).toHaveBeenCalledWith(null);
      expect(result).toEqual(expectedConfig);
    });

    test('should load config from specific path', async () => {
      const configPath = '.markdownforgerc';
      const expectedConfig = { format: ['docx'], theme: 'github' };
      
      loadConfig.mockResolvedValue(expectedConfig);
      
      const result = await fileConverter.loadConfig(configPath);
      
      expect(loadConfig).toHaveBeenCalledWith(configPath);
      expect(result).toEqual(expectedConfig);
    });
  });

  describe('logger methods', () => {
    test('should set verbose mode', () => {
      const setVerboseSpy = jest.spyOn(logger, 'setVerbose');
      
      fileConverter.setVerbose(true);
      
      expect(setVerboseSpy).toHaveBeenCalledWith(true);
    });

    test('should set silent mode', () => {
      const setSilentSpy = jest.spyOn(logger, 'setSilent');
      
      fileConverter.setSilent(true);
      
      expect(setSilentSpy).toHaveBeenCalledWith(true);
    });
  });
});