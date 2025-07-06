// Jest setup file for MarkdownForge tests
const { logger } = require('../src/utils/logger');

// Global test setup
beforeAll(() => {
  // Suppress logs during testing unless explicitly enabled
  logger.setSilent(true);
  
  // Set test timeout for integration tests
  jest.setTimeout(30000);
});

afterAll(() => {
  // Restore logger state
  logger.setSilent(false);
});

// Mock external dependencies that might not be available in test environment
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      goto: jest.fn(),
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
      close: jest.fn()
    }),
    close: jest.fn()
  })
}));

// Global test utilities
global.testUtils = {
  createMockFile: async (path, content = 'test content') => {
    const fs = require('fs-extra');
    await fs.ensureDir(require('path').dirname(path));
    await fs.writeFile(path, content);
  },
  
  cleanupPath: async (path) => {
    const fs = require('fs-extra');
    if (await fs.pathExists(path)) {
      await fs.remove(path);
    }
  }
};