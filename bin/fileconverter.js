#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { DocumentProcessor } = require('../src/core/documentProcessor');
const { validateInput } = require('../src/validators/fileValidator');
const { loadConfig } = require('../src/utils/configLoader');
const { logger } = require('../src/utils/logger');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('markdownforge')
  .description('Forge professional documents from Markdown with DOCX and PDF support, including Mermaid diagrams and admonitions')
  .version(packageJson.version)
  .argument('<input>', 'Input Markdown file path')
  .option('-f, --format <formats>', 'Output formats: pdf, docx, or pdf,docx', 'pdf,docx')
  .option('-o, --output <path>', 'Output directory or file path', './output')
  .option('-n, --name <name>', 'Base name for output files')
  .option('-t, --theme <theme>', 'Theme: default, github, academic', 'default')
  .option('--diagram-format <format>', 'Diagram format: png, svg', 'png')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--config <path>', 'Configuration file path')
  .action(async (input, options) => {
    try {
      // Set up logging
      logger.setVerbose(options.verbose);
      
      if (options.verbose) {
        logger.info(`MarkdownForge v${packageJson.version}`);
        logger.info(`Node.js ${process.version} on ${process.platform}`);
      }

      // Load configuration
      const config = await loadConfig(options.config);
      
      // Parse CLI format option
      const cliFormats = options.format.split(',').map(f => f.trim());
      
      // Handle output option - could be directory or filename
      let outputDir = options.output;
      let outputName = options.name;
      
      // If output looks like a filename (has extension), extract directory and name
      if (path.extname(options.output)) {
        outputDir = path.dirname(options.output);
        const baseName = path.basename(options.output, path.extname(options.output));
        outputName = outputName || baseName;
      }
      
      // Merge CLI options with config (CLI options take precedence)
      const mergedOptions = {
        ...config,
        ...options,
        format: cliFormats,
        outputDir: outputDir,
        name: outputName
      };

      // Validate input
      const validation = await validateInput(input);
      if (!validation.valid) {
        logger.error('Input validation failed:');
        validation.errors.forEach(error => logger.error(`  ${error}`));
        process.exit(2);
      }

      // Initialize processor
      const processor = new DocumentProcessor(mergedOptions);
      
      // Process document
      logger.info(`Converting ${chalk.cyan(input)}...`);
      const result = await processor.processDocument(input);

      if (result.success) {
        logger.success('Conversion completed successfully!');
        logger.info('Output files:');
        result.outputs.forEach(output => {
          logger.info(`  ${chalk.green('✓')} ${output}`);
        });
        
        // Ensure process exits cleanly
        process.exit(0);
      } else {
        logger.error('Conversion failed:');
        result.errors.forEach(error => logger.error(`  ${error}`));
        process.exit(5);
      }

    } catch (error) {
      logger.error(`Fatal error: ${error.message}`);
      if (options.verbose) {
        logger.error(error.stack);
      }
      process.exit(1);
    }
  });

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

program.parse();