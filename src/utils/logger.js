const chalk = require('chalk');

class Logger {
  constructor() {
    this.verbose = false;
    this.silent = false;
  }

  setVerbose(verbose) {
    this.verbose = verbose;
  }

  setSilent(silent) {
    this.silent = silent;
  }

  info(message, ...args) {
    if (!this.silent) {
      console.log(chalk.blue('ℹ'), message, ...args);
    }
  }

  success(message, ...args) {
    if (!this.silent) {
      console.log(chalk.green('✓'), message, ...args);
    }
  }

  warn(message, ...args) {
    if (!this.silent) {
      console.warn(chalk.yellow('⚠'), message, ...args);
    }
  }

  error(message, ...args) {
    if (!this.silent) {
      console.error(chalk.red('✗'), message, ...args);
    }
  }

  debug(message, ...args) {
    if (this.verbose && !this.silent) {
      console.log(chalk.gray('🔍'), chalk.gray(message), ...args);
    }
  }

  progress(message, current, total) {
    if (!this.silent) {
      const percentage = Math.round((current / total) * 100);
      const progressBar = this.createProgressBar(current, total);
      process.stdout.write(`\r${chalk.blue('⏳')} ${message} ${progressBar} ${percentage}%`);
      
      if (current === total) {
        process.stdout.write('\n');
      }
    }
  }

  createProgressBar(current, total, width = 20) {
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  table(data, headers) {
    if (this.silent) return;

    if (!Array.isArray(data) || data.length === 0) {
      this.info('No data to display');
      return;
    }

    // Calculate column widths
    const keys = headers || Object.keys(data[0]);
    const widths = keys.map(key => {
      const values = data.map(row => String(row[key] || ''));
      return Math.max(key.length, ...values.map(v => v.length));
    });

    // Print header
    const headerRow = keys.map((key, i) => key.padEnd(widths[i])).join(' | ');
    console.log(chalk.bold(headerRow));
    console.log(keys.map((_, i) => '-'.repeat(widths[i])).join('-|-'));

    // Print rows
    data.forEach(row => {
      const dataRow = keys.map((key, i) => String(row[key] || '').padEnd(widths[i])).join(' | ');
      console.log(dataRow);
    });
  }

  spinner(message) {
    if (this.silent) {
      return {
        start: () => {},
        stop: () => {},
        succeed: () => {},
        fail: () => {},
        text: ''
      };
    }

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let index = 0;
    let interval;

    return {
      start() {
        process.stdout.write(`${frames[0]} ${message}`);
        interval = setInterval(() => {
          index = (index + 1) % frames.length;
          process.stdout.write(`\r${frames[index]} ${message}`);
        }, 80);
      },
      
      stop() {
        if (interval) {
          clearInterval(interval);
          process.stdout.write('\r');
        }
      },
      
      succeed(successMessage) {
        this.stop();
        console.log(chalk.green('✓'), successMessage || message);
      },
      
      fail(errorMessage) {
        this.stop();
        console.log(chalk.red('✗'), errorMessage || message);
      },
      
      set text(newMessage) {
        message = newMessage;
      }
    };
  }

  // Format duration in human readable format
  formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  // Log with timestamp
  timestamped(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = chalk.gray(`[${timestamp}]`);
    
    switch (level) {
      case 'info':
        this.info(`${prefix} ${message}`, ...args);
        break;
      case 'success':
        this.success(`${prefix} ${message}`, ...args);
        break;
      case 'warn':
        this.warn(`${prefix} ${message}`, ...args);
        break;
      case 'error':
        this.error(`${prefix} ${message}`, ...args);
        break;
      case 'debug':
        this.debug(`${prefix} ${message}`, ...args);
        break;
      default:
        console.log(`${prefix} ${message}`, ...args);
    }
  }

  // Create a child logger with prefix
  child(prefix) {
    const childLogger = new Logger();
    childLogger.verbose = this.verbose;
    childLogger.silent = this.silent;
    
    const originalMethods = ['info', 'success', 'warn', 'error', 'debug'];
    originalMethods.forEach(method => {
      const originalMethod = childLogger[method];
      childLogger[method] = (message, ...args) => {
        originalMethod.call(childLogger, `[${prefix}] ${message}`, ...args);
      };
    });
    
    return childLogger;
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = { Logger, logger };