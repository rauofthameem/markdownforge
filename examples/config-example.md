# Configuration Examples

This document shows various configuration options for MarkdownForge.

## Basic Configuration

Create a `.markdownforgerc` file in your project root:

```json
{
  "format": ["pdf", "docx"],
  "output": "./output",
  "theme": "default",
  "verbose": false
}
```

## Advanced Configuration

```json
{
  "format": ["pdf", "docx"],
  "output": "./docs/output",
  "theme": "github",
  "diagramFormat": "png",
  "verbose": true,
  "pdf": {
    "format": "A4",
    "margin": {
      "top": "1in",
      "right": "1in", 
      "bottom": "1in",
      "left": "1in"
    },
    "printBackground": true
  },
  "docx": {
    "formatting": {
      "fontSize": 22,
      "colors": {
        "headings": "2E74B5",
        "text": "000000",
        "code": "0052CC"
      }
    }
  }
}
```

## Command Line Usage

!!! tip "Format Selection Fix"
    When using npm scripts, use `--` to separate npm options from CLI options:
    ```bash
    npm start -- document.md --format docx
    ```

### Basic Commands

```bash
# Forge to both PDF and DOCX
markdownforge document.md

# Forge to specific format
markdownforge document.md --format pdf
markdownforge document.md --format docx
markdownforge document.md --format pdf,docx

# Use specific theme
markdownforge document.md --theme github
markdownforge document.md --theme academic

# Specify output directory
markdownforge document.md --output ./my-output

# Enable verbose logging
markdownforge document.md --verbose
```

### Advanced Usage

```bash
# Use custom configuration file
markdownforge document.md --config ./my-config.json

# Specify output filename
markdownforge document.md --name "My Document"

# Combine multiple options
markdownforge document.md --format pdf --theme academic --output ./reports --verbose
```

!!! warning "NPM Script Usage"
    When using `npm start`, remember to use `--` before CLI arguments:
    ```bash
    npm start -- document.md --format docx --verbose
    ```

## Supported Themes

| Theme | Description | Best For |
|-------|-------------|----------|
| `default` | Clean, professional styling | General documents |
| `github` | GitHub-style markdown | Technical documentation |
| `academic` | Academic paper formatting | Research papers, reports |

## Output Formats

- **PDF**: High-quality, print-ready documents with proper styling
- **DOCX**: Microsoft Word compatible with full formatting support

!!! success "Configuration Complete"
    Your MarkdownForge is now configured and ready to use with all the features demonstrated in this document!