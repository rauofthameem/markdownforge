#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');

const execAsync = promisify(exec);

class DependencyChecker {
  constructor() {
    this.checks = [
      {
        name: 'Node.js',
        command: 'node --version',
        required: true,
        minVersion: '16.0.0',
        installUrl: 'https://nodejs.org/'
      },
      {
        name: 'Pandoc',
        command: 'pandoc --version',
        required: false,
        description: 'Required for DOCX conversion',
        installUrl: 'https://pandoc.org/installing.html'
      }
    ];
  }

  async checkAll() {
    console.log(chalk.blue('🔍 Checking system dependencies...\n'));
    
    const results = [];
    let hasErrors = false;
    let hasWarnings = false;

    for (const check of this.checks) {
      const result = await this.checkDependency(check);
      results.push(result);
      
      if (!result.available && check.required) {
        hasErrors = true;
      } else if (!result.available && !check.required) {
        hasWarnings = true;
      }
    }

    this.printSummary(results, hasErrors, hasWarnings);
    
    return {
      success: !hasErrors,
      hasWarnings,
      results
    };
  }

  async checkDependency(check) {
    try {
      const { stdout } = await execAsync(check.command, { timeout: 5000 });
      const version = this.extractVersion(stdout);
      
      let versionValid = true;
      if (check.minVersion && version) {
        versionValid = this.compareVersions(version, check.minVersion) >= 0;
      }

      if (versionValid) {
        console.log(chalk.green('✓'), `${check.name} ${version ? `(${version})` : ''}`);
      } else {
        console.log(chalk.yellow('⚠'), `${check.name} ${version} (minimum required: ${check.minVersion})`);
      }

      return {
        name: check.name,
        available: versionValid,
        version,
        required: check.required
      };

    } catch (error) {
      const symbol = check.required ? chalk.red('✗') : chalk.yellow('⚠');
      const status = check.required ? 'REQUIRED' : 'OPTIONAL';
      
      console.log(symbol, `${check.name} - Not found (${status})`);
      
      if (check.description) {
        console.log(chalk.gray(`  ${check.description}`));
      }
      
      if (check.installUrl) {
        console.log(chalk.gray(`  Install from: ${check.installUrl}`));
      }

      return {
        name: check.name,
        available: false,
        error: error.message,
        required: check.required
      };
    }
  }

  extractVersion(output) {
    // Try to extract version number from command output
    const versionPatterns = [
      /v?(\d+\.\d+\.\d+)/,  // Standard semver
      /(\d+\.\d+)/,         // Major.minor
      /version\s+(\d+\.\d+\.\d+)/i,
      /(\d+\.\d+\.\d+\.\d+)/ // Extended version
    ];

    for (const pattern of versionPatterns) {
      const match = output.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  printSummary(results, hasErrors, hasWarnings) {
    console.log('\n' + chalk.blue('📋 Dependency Check Summary:'));
    console.log('─'.repeat(40));

    const available = results.filter(r => r.available).length;
    const total = results.length;
    
    console.log(`Available: ${chalk.green(available)}/${total}`);
    
    if (hasErrors) {
      console.log(chalk.red('\n❌ Missing required dependencies!'));
      console.log('Please install the missing dependencies before using FileConverter CLI.');
    } else if (hasWarnings) {
      console.log(chalk.yellow('\n⚠️  Some optional dependencies are missing.'));
      console.log('FileConverter CLI will work with limited functionality.');
    } else {
      console.log(chalk.green('\n✅ All dependencies are available!'));
      console.log('FileConverter CLI is ready to use.');
    }

    console.log('\n' + chalk.gray('Run with --verbose for detailed information.'));
  }

  async checkPuppeteerInstallation() {
    try {
      const puppeteer = require('puppeteer');
      console.log(chalk.green('✓'), 'Puppeteer is installed');
      
      // Try to launch browser to verify installation
      const browser = await puppeteer.launch({ headless: 'new' });
      await browser.close();
      console.log(chalk.green('✓'), 'Puppeteer browser launch test passed');
      
      return true;
    } catch (error) {
      console.log(chalk.red('✗'), `Puppeteer issue: ${error.message}`);
      return false;
    }
  }

  async performFullCheck() {
    const basicCheck = await this.checkAll();
    
    console.log('\n' + chalk.blue('🔍 Checking Node.js dependencies...'));
    const puppeteerCheck = await this.checkPuppeteerInstallation();
    
    return {
      ...basicCheck,
      puppeteerAvailable: puppeteerCheck
    };
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new DependencyChecker();
  
  const isVerbose = process.argv.includes('--verbose');
  const isQuiet = process.argv.includes('--quiet');
  
  if (isQuiet) {
    // Silent check, just exit with appropriate code
    checker.checkAll().then(result => {
      process.exit(result.success ? 0 : 1);
    });
  } else {
    checker.performFullCheck().then(result => {
      if (!result.success) {
        process.exit(1);
      }
    }).catch(error => {
      console.error(chalk.red('Dependency check failed:'), error.message);
      process.exit(1);
    });
  }
}

module.exports = { DependencyChecker };