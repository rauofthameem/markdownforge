# Installation

MarkdownForge can be used in multiple ways depending on your needs. The recommended approach is using `npx` for zero-installation usage.

## Prerequisites

- **Node.js** >= 16.0.0
- **Pandoc** (for DOCX conversion) - [Installation Guide](https://pandoc.org/installing.html)

The tool will automatically check for dependencies and provide installation instructions if needed.

## npx Usage (Recommended)

No installation required! Just use `npx`:

```bash
npx markdownforge your-document.md
```

This approach:
- ✅ Always uses the latest version
- ✅ No global package pollution
- ✅ Works immediately without setup
- ✅ Perfect for CI/CD environments

## Global Installation

Install globally for frequent use:

```bash
npm install -g markdownforge
markdownforge your-document.md
```

Benefits:
- Faster execution (no download time)
- Works offline after initial install
- Shorter command syntax

## Local Installation

Add to your project dependencies:

```bash
# Install as dependency
npm install markdownforge

# Install as dev dependency
npm install --save-dev markdownforge
```

Then use via npm scripts or npx:

```bash
# Via npx
npx markdownforge document.md

# Via npm script in package.json
{
  "scripts": {
    "docs": "markdownforge README.md --output ./dist"
  }
}
```

## Dependency Installation

### Pandoc (Required for DOCX)

Pandoc is required for DOCX conversion. Install it based on your platform:

#### macOS
```bash
# Using Homebrew
brew install pandoc

# Using MacPorts
sudo port install pandoc
```

#### Windows
```bash
# Using Chocolatey
choco install pandoc

# Using Scoop
scoop install pandoc
```

Or download from [pandoc.org](https://pandoc.org/installing.html)

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install pandoc

# CentOS/RHEL/Fedora
sudo yum install pandoc
# or
sudo dnf install pandoc

# Arch Linux
sudo pacman -S pandoc
```

### Verification

Verify your installation:

```bash
# Check Node.js version
node --version

# Check Pandoc installation
pandoc --version

# Test MarkdownForge
npx markdownforge --version
```

## Docker Usage

For containerized environments:

```dockerfile
FROM node:18-alpine

# Install Pandoc
RUN apk add --no-cache pandoc

# Install MarkdownForge
RUN npm install -g markdownforge

# Your app setup...
```

## Troubleshooting

### Common Issues

#### Pandoc Not Found
```
Error: Pandoc not found. Please install Pandoc to enable DOCX conversion.
```
**Solution**: Install Pandoc from [pandoc.org](https://pandoc.org/installing.html)

#### Puppeteer Launch Failed
```
Error: Failed to launch Chrome browser
```
**Solution**: Install Chrome dependencies:
- **Ubuntu/Debian**: `sudo apt-get install -y chromium-browser`
- **CentOS/RHEL**: `sudo yum install -y chromium`

#### Permission Denied
```
Error: EACCES: permission denied, mkdir './output'
```
**Solution**: Check directory permissions or use a different output directory

#### Node.js Version
```
Error: MarkdownForge requires Node.js >= 16.0.0
```
**Solution**: Update Node.js to version 16 or higher

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
npx markdownforge document.md --verbose
```

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 16.0.0 | 18.0.0+ |
| RAM | 512MB | 1GB+ |
| Disk Space | 100MB | 500MB+ |
| Pandoc | 2.0+ | Latest |

## Next Steps

Once installed, check out the [Quick Start](quickstart.md) guide to begin using MarkdownForge.