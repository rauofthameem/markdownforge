const { logger } = require('../../src/utils/logger');

describe('Logger', () => {
  let originalConsole;

  beforeEach(() => {
    // Mock console methods
    originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    
    // Reset logger state
    logger.setSilent(false);
    logger.setVerbose(false);
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  });

  describe('basic logging', () => {
    test('should log info messages', () => {
      logger.info('Test info message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'), 
        'Test info message'
      );
    });

    test('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('✗'), 
        'Test error message'
      );
    });

    test('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠'), 
        'Test warning message'
      );
    });

    test('should log success messages', () => {
      logger.success('Test success message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✓'), 
        'Test success message'
      );
    });

    test('should log debug messages when verbose', () => {
      logger.setVerbose(true);
      logger.debug('Test debug message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔍'), 
        expect.any(String)
      );
    });

    test('should not log debug messages when not verbose', () => {
      logger.setVerbose(false);
      logger.debug('Test debug message');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('silent mode', () => {
    test('should not log when silent mode is enabled', () => {
      logger.setSilent(true);
      
      logger.info('Test info');
      logger.error('Test error');
      logger.warn('Test warning');
      logger.success('Test success');
      
      expect(console.info).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should resume logging when silent mode is disabled', () => {
      logger.setSilent(true);
      logger.info('Silent message');
      expect(console.log).not.toHaveBeenCalled();
      
      logger.setSilent(false);
      logger.info('Visible message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'), 
        'Visible message'
      );
    });
  });

  describe('verbose mode', () => {
    test('should enable verbose logging', () => {
      logger.setVerbose(true);
      logger.debug('Verbose debug message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔍'), 
        expect.any(String)
      );
    });

    test('should disable verbose logging', () => {
      logger.setVerbose(true);
      logger.setVerbose(false);
      logger.debug('Hidden debug message');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('log formatting', () => {
    test('should use symbols for different log levels', () => {
      logger.info('Test message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'), 
        'Test message'
      );
    });

    test('should use error symbol for errors', () => {
      logger.error('Test error');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('✗'), 
        'Test error'
      );
    });

    test('should format success messages with checkmark', () => {
      logger.success('Test success');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✓'), 
        'Test success'
      );
    });
  });

  describe('edge cases', () => {
    test('should handle undefined messages', () => {
      expect(() => logger.info(undefined)).not.toThrow();
    });

    test('should handle null messages', () => {
      expect(() => logger.info(null)).not.toThrow();
    });

    test('should handle empty string messages', () => {
      logger.info('');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'), 
        ''
      );
    });

    test('should handle object messages', () => {
      const testObj = { key: 'value' };
      logger.info(testObj);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'), 
        testObj
      );
    });

    test('should handle multiple arguments', () => {
      logger.info('Message', 'arg1', 'arg2');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'), 
        'Message', 
        'arg1', 
        'arg2'
      );
    });
  });

  describe('advanced features', () => {
    test('should format duration correctly', () => {
      expect(logger.formatDuration(500)).toBe('500ms');
      expect(logger.formatDuration(1500)).toBe('1.5s');
      expect(logger.formatDuration(65000)).toBe('1m 5s');
    });

    test('should create child logger with prefix', () => {
      const childLogger = logger.child('TEST');
      childLogger.info('Child message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'), 
        '[TEST] Child message'
      );
    });

    test('should handle timestamped logging', () => {
      logger.timestamped('info', 'Timestamped message');
      // The timestamped method calls info() which adds the symbol and formats the message
      expect(console.log).toHaveBeenCalled();
      const call = console.log.mock.calls[0];
      expect(call[0]).toEqual(expect.stringContaining('ℹ'));
      
      // Check that the message contains a timestamp and the expected text
      expect(call[1]).toContain('[');
      expect(call[1]).toContain(']');
      expect(call[1]).toContain('Timestamped message');
      expect(call[1]).toContain('Z]'); // Check for ISO timestamp ending
    });

    test('should create progress bar', () => {
      const progressBar = logger.createProgressBar(5, 10, 10);
      expect(progressBar).toContain('█');
      expect(progressBar).toContain('░');
    });

    test('should handle table display when not silent', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      logger.table(data);
      expect(console.log).toHaveBeenCalled();
    });

    test('should not display table when silent', () => {
      logger.setSilent(true);
      const data = [{ name: 'John', age: 30 }];
      logger.table(data);
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should handle empty table data', () => {
      logger.table([]);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'), 
        'No data to display'
      );
    });

    test('should create spinner when not silent', () => {
      const spinner = logger.spinner('Loading...');
      expect(spinner).toHaveProperty('start');
      expect(spinner).toHaveProperty('stop');
      expect(spinner).toHaveProperty('succeed');
      expect(spinner).toHaveProperty('fail');
    });

    test('should create no-op spinner when silent', () => {
      logger.setSilent(true);
      const spinner = logger.spinner('Loading...');
      expect(typeof spinner.start).toBe('function');
      expect(typeof spinner.stop).toBe('function');
    });
  });
});