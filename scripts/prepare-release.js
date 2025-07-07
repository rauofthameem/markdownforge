#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Release preparation script for MarkdownForge
 * Performs pre-release checks and validations
 */

const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠️'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  step: (msg) => console.log(chalk.cyan('🔄'), msg),
};

class ReleasePreparation {
  constructor() {
    this.packagePath = path.join(__dirname, '..', 'package.json');
    this.package = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    log.info('Starting release preparation checks...\n');

    try {
      await this.checkGitStatus();
      await this.checkPackageIntegrity();
      await this.runTests();
      await this.checkDependencies();
      await this.validatePackageFields();
      await this.checkDocumentation();
      await this.generateReleaseNotes();

      this.printSummary();
      
      if (this.errors.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      log.error(`Release preparation failed: ${error.message}`);
      process.exit(1);
    }
  }

  async checkGitStatus() {
    log.step('Checking git status...');
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        this.warnings.push('Working directory has uncommitted changes');
        log.warning('Working directory has uncommitted changes');
      } else {
        log.success('Working directory is clean');
      }

      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      if (branch !== 'main' && branch !== 'master') {
        this.warnings.push(`Currently on branch '${branch}', consider releasing from main/master`);
        log.warning(`Currently on branch '${branch}'`);
      } else {
        log.success(`On ${branch} branch`);
      }
    } catch (_error) {
      this.errors.push('Git status check failed');
      log.error('Git status check failed');
    }
  }

  async checkPackageIntegrity() {
    log.step('Checking package integrity...');
    
    try {
      // Check if package.json is valid
      if (!this.package.name || !this.package.version) {
        this.errors.push('Package name or version is missing');
        return;
      }

      // Check version format
      const versionRegex = /^\d+\.\d+\.\d+(-[\w\d\-.]+)?$/;
      if (!versionRegex.test(this.package.version)) {
        this.errors.push(`Invalid version format: ${this.package.version}`);
      } else {
        log.success(`Version: ${this.package.version}`);
      }

      // Check required fields
      const requiredFields = ['description', 'main', 'bin', 'repository', 'license'];
      for (const field of requiredFields) {
        if (!this.package[field]) {
          this.errors.push(`Missing required field: ${field}`);
        }
      }

      // Check files array
      if (!this.package.files || this.package.files.length === 0) {
        this.warnings.push('No files array specified in package.json');
      }

      log.success('Package integrity check completed');
    } catch (_error) {
      this.errors.push('Package integrity check failed');
      log.error('Package integrity check failed');
    }
  }

  async runTests() {
    log.step('Running test suite...');
    
    try {
      execSync('npm test', { stdio: 'pipe' });
      log.success('All tests passed');
    } catch (_error) {
      this.errors.push('Tests failed');
      log.error('Tests failed - fix before releasing');
    }
  }

  async checkDependencies() {
    log.step('Checking dependencies...');
    
    try {
      // Check for security vulnerabilities
      try {
        execSync('npm audit --audit-level=moderate', { stdio: 'pipe' });
        log.success('No security vulnerabilities found');
      } catch (_error) {
        this.warnings.push('Security vulnerabilities detected');
        log.warning('Security vulnerabilities detected - consider fixing');
      }

      // Check for outdated dependencies
      try {
        const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
        const outdatedPackages = JSON.parse(outdated || '{}');
        const count = Object.keys(outdatedPackages).length;
        
        if (count > 0) {
          this.warnings.push(`${count} outdated dependencies found`);
          log.warning(`${count} outdated dependencies found`);
        } else {
          log.success('All dependencies are up to date');
        }
      } catch (error) {
        // npm outdated returns exit code 1 when outdated packages exist
        if (error.stdout) {
          const outdatedPackages = JSON.parse(error.stdout || '{}');
          const count = Object.keys(outdatedPackages).length;
          if (count > 0) {
            this.warnings.push(`${count} outdated dependencies found`);
            log.warning(`${count} outdated dependencies found`);
          }
        }
      }
    } catch (_error) {
      this.warnings.push('Dependency check failed');
      log.warning('Dependency check failed');
    }
  }

  async validatePackageFields() {
    log.step('Validating package fields...');
    
    // Check author information
    if (!this.package.author || this.package.author.name === 'Your Name') {
      this.warnings.push('Author information needs to be updated');
      log.warning('Author information needs to be updated');
    }

    // Check repository URL
    if (this.package.repository && this.package.repository.url) {
      const repoUrl = this.package.repository.url;
      if (repoUrl.includes('github.com/rauofthameem/markdownforge')) {
        log.success('Repository URL is configured');
      } else {
        this.warnings.push('Repository URL may need updating');
      }
    }

    // Check keywords
    if (!this.package.keywords || this.package.keywords.length < 3) {
      this.warnings.push('Consider adding more keywords for better discoverability');
    }

    log.success('Package field validation completed');
  }

  async checkDocumentation() {
    log.step('Checking documentation...');
    
    const requiredDocs = [
      'README.md',
      'LICENSE',
      '.github/DEPLOYMENT.md'
    ];

    for (const doc of requiredDocs) {
      const docPath = path.join(__dirname, '..', doc);
      if (!fs.existsSync(docPath)) {
        this.warnings.push(`Missing documentation: ${doc}`);
        log.warning(`Missing documentation: ${doc}`);
      } else {
        const content = fs.readFileSync(docPath, 'utf8');
        if (content.length < 100) {
          this.warnings.push(`Documentation seems incomplete: ${doc}`);
        }
      }
    }

    log.success('Documentation check completed');
  }

  async generateReleaseNotes() {
    log.step('Generating release notes preview...');
    
    try {
      // Get the latest tag
      let latestTag;
      try {
        latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      } catch (_error) {
        latestTag = null;
      }

      if (latestTag) {
        const commits = execSync(`git log --pretty=format:"- %s" ${latestTag}..HEAD`, { encoding: 'utf8' });
        if (commits.trim()) {
          log.info('\nRelease notes preview:');
          console.log(chalk.gray('─'.repeat(50)));
          console.log(commits);
          console.log(chalk.gray('─'.repeat(50)));
        } else {
          this.warnings.push('No new commits since last release');
          log.warning('No new commits since last release');
        }
      } else {
        log.info('This will be the initial release');
      }
    } catch (_error) {
      this.warnings.push('Could not generate release notes preview');
    }
  }

  printSummary() {
    console.log('\n' + chalk.bold('📋 Release Preparation Summary'));
    console.log('═'.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      log.success('All checks passed! Ready for release 🚀');
      console.log('\nTo create a release, run:');
      console.log(chalk.cyan('  npm run release:patch  # for bug fixes'));
      console.log(chalk.cyan('  npm run release:minor  # for new features'));
      console.log(chalk.cyan('  npm run release:major  # for breaking changes'));
    } else {
      if (this.errors.length > 0) {
        console.log(chalk.red(`\n❌ ${this.errors.length} error(s) found:`));
        this.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
        console.log(chalk.red('\nPlease fix these errors before releasing.'));
      }

      if (this.warnings.length > 0) {
        console.log(chalk.yellow(`\n⚠️  ${this.warnings.length} warning(s):`));
        this.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)));
        console.log(chalk.yellow('\nThese warnings should be addressed but won\'t block the release.'));
      }
    }
  }
}

// Run the release preparation
if (require.main === module) {
  const prep = new ReleasePreparation();
  prep.run().catch(error => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = ReleasePreparation;