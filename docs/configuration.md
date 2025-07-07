# Configuration

MarkdownForge supports extensive configuration for customizing conversion settings. You can configure the tool through CLI arguments, configuration files, or environment variables.

## Configuration Sources

Configuration is loaded in the following priority order (highest to lowest):

1. **Command-line arguments** (highest priority)
2. **Configuration files**
3. **Environment variables**
4. **Default values** (lowest priority)

## Configuration Files

MarkdownForge supports multiple configuration file formats in your project root:

- `.markdownforgerc` (JSON)
- `.markdownforgerc.json`
- `.markdownforgerc.yaml` / `.markdownforgerc.yml`
- `.markdownforgerc.js`
- `markdownforge.config.js`
- `package.json` (under `markdownforge` key)

### Basic Configuration

```json title=".markdownforgerc"
{
  "format": ["pdf", "docx"],
  "output": "./output",
  "theme": "default",
  "diagramFormat": "png",
  "verbose": false
}
```

### Advanced Configuration

```json title=".markdownforgerc"
{
  "format": ["pdf", "docx"],
  "output": "./dist/docs",
  "theme": "github",
  "diagramFormat": "svg",
  "verbose": true,
  "pdf": {
    "format": "A4",
    "margin": {
      "top": "1in",
      "right": "1in",
      "bottom": "1in",
      "left": "1in"
    },
    "displayHeaderFooter": false,
    "printBackground": true
  },
  "docx": {
    "formatting": {
      "headingSpacing": {
        "before": 400,
        "after": 200
      },
      "paragraphSpacing": {
        "before": 0,
        "after": 150
      },
      "fontSize": 22,
      "headingFontSizes": {
        "h1": 32,
        "h2": 28,
        "h3": 24,
        "h4": 22,
        "h5": 20,
        "h6": 18
      },
      "colors": {
        "headings": "2E74B5",
        "text": "000000",
        "code": "D73A49"
      },
      "alignment": {
        "paragraphs": "justified",
        "headings": "left"
      }
    }
  },
  "mermaid": {
    "theme": "default",
    "backgroundColor": "white",
    "width": 800,
    "height": 600
  }
}
```

## Configuration Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | Array | `["pdf", "docx"]` | Output formats |
| `output` | String | `"./output"` | Output directory |
| `theme` | String | `"default"` | Document theme |
| `diagramFormat` | String | `"png"` | Diagram output format |
| `verbose` | Boolean | `false` | Enable verbose logging |

### PDF Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pdf.format` | String | `"A4"` | Page format (A4, A3, Letter, Legal) |
| `pdf.margin.top` | String | `"1in"` | Top margin |
| `pdf.margin.right` | String | `"1in"` | Right margin |
| `pdf.margin.bottom` | String | `"1in"` | Bottom margin |
| `pdf.margin.left` | String | `"1in"` | Left margin |
| `pdf.displayHeaderFooter` | Boolean | `false` | Show header/footer |
| `pdf.printBackground` | Boolean | `true` | Print background graphics |

### DOCX Formatting Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `docx.formatting.headingSpacing.before` | Number | `400` | Space before headings (twips) |
| `docx.formatting.headingSpacing.after` | Number | `200` | Space after headings (twips) |
| `docx.formatting.paragraphSpacing.before` | Number | `0` | Space before paragraphs (twips) |
| `docx.formatting.paragraphSpacing.after` | Number | `150` | Space after paragraphs (twips) |
| `docx.formatting.fontSize` | Number | `22` | Default font size (half-points) |
| `docx.formatting.headingFontSizes.h1-h6` | Number | Various | Heading font sizes (half-points) |
| `docx.formatting.colors.headings` | String | `"2E74B5"` | Heading color (hex) |
| `docx.formatting.colors.text` | String | `"000000"` | Text color (hex) |
| `docx.formatting.colors.code` | String | `"D73A49"` | Code color (hex) |
| `docx.formatting.alignment.paragraphs` | String | `"justified"` | Paragraph alignment |
| `docx.formatting.alignment.headings` | String | `"left"` | Heading alignment |

!!! note "Spacing Units"
    Spacing values are in twips (1/20th of a point). Font sizes are in half-points (22 = 11pt).

### Mermaid Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mermaid.theme` | String | `"default"` | Mermaid theme |
| `mermaid.backgroundColor` | String | `"white"` | Background color |
| `mermaid.width` | Number | `800` | Diagram width |
| `mermaid.height` | Number | `600` | Diagram height |

## Environment Variables

You can also configure MarkdownForge using environment variables:

```bash
# Disable anonymous usage analytics
export MARKDOWNFORGE_ANALYTICS=false

# Custom temporary directory
export MARKDOWNFORGE_TEMP_DIR=/custom/temp/path

# Default output directory
export MARKDOWNFORGE_OUTPUT_DIR=./dist

# Default theme
export MARKDOWNFORGE_THEME=github
```

## Theme Configuration

### Built-in Themes

| Theme | Description | Best For |
|-------|-------------|----------|
| `default` | Clean, professional styling | General documents |
| `github` | GitHub-flavored styling | Technical documentation |
| `academic` | Academic paper formatting | Research papers, reports |

### Custom Themes

You can create custom themes by providing CSS files:

```bash
npx markdownforge document.md --theme ./custom-theme.css
```

Example custom theme:

```css title="custom-theme.css"
/* Custom MarkdownForge Theme */
body {
  font-family: 'Georgia', serif;
  line-height: 1.8;
  color: #2c3e50;
}

h1, h2, h3, h4, h5, h6 {
  color: #34495e;
  font-weight: 600;
}

code {
  background-color: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', monospace;
}

blockquote {
  border-left: 4px solid #3498db;
  padding-left: 1rem;
  margin-left: 0;
  font-style: italic;
}
```

## Configuration Examples

### Minimal Configuration

```json title=".markdownforgerc"
{
  "theme": "github",
  "output": "./docs"
}
```

### Academic Paper Setup

```json title=".markdownforgerc"
{
  "format": ["pdf"],
  "theme": "academic",
  "output": "./paper",
  "pdf": {
    "format": "A4",
    "margin": {
      "top": "1.5in",
      "right": "1in",
      "bottom": "1.5in",
      "left": "1in"
    }
  },
  "docx": {
    "formatting": {
      "fontSize": 24,
      "alignment": {
        "paragraphs": "justified"
      }
    }
  }
}
```

### Technical Documentation

```json title=".markdownforgerc"
{
  "format": ["pdf", "docx"],
  "theme": "github",
  "output": "./technical-docs",
  "diagramFormat": "svg",
  "verbose": true,
  "mermaid": {
    "theme": "default",
    "width": 1000,
    "height": 700
  }
}
```

### Package.json Configuration

```json title="package.json"
{
  "name": "my-project",
  "scripts": {
    "docs": "markdownforge README.md"
  },
  "markdownforge": {
    "format": ["pdf"],
    "theme": "github",
    "output": "./dist/docs"
  }
}
```

## JavaScript Configuration

For dynamic configuration, use a JavaScript file:

```javascript title="markdownforge.config.js"
module.exports = {
  format: process.env.NODE_ENV === 'production' ? ['pdf', 'docx'] : ['pdf'],
  theme: 'github',
  output: './dist/docs',
  verbose: process.env.DEBUG === 'true',
  pdf: {
    format: 'A4',
    margin: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in'
    }
  },
  // Dynamic configuration based on environment
  ...(process.env.NODE_ENV === 'production' && {
    docx: {
      formatting: {
        fontSize: 22,
        colors: {
          headings: '2E74B5'
        }
      }
    }
  })
};
```

## Validation

MarkdownForge validates your configuration and provides helpful error messages:

```bash
# Invalid configuration example
{
  "format": ["invalid-format"],  # Error: Invalid format
  "theme": "non-existent",       # Error: Theme not found
  "pdf": {
    "format": "INVALID"          # Error: Invalid PDF format
  }
}
```

## Configuration Tips

### 🎯 Best Practices

1. **Start simple** - Begin with basic configuration and add complexity as needed
2. **Use environment-specific configs** - Different settings for dev/prod
3. **Validate early** - Test configuration with small documents first
4. **Document your setup** - Include configuration rationale in comments

### 🔧 Common Patterns

```json
{
  // Development: Fast iteration
  "format": ["pdf"],
  "verbose": true,
  
  // Production: Complete output
  "format": ["pdf", "docx"],
  "verbose": false,
  
  // Academic: Proper formatting
  "theme": "academic",
  "pdf": {
    "format": "A4",
    "margin": { "top": "1.5in" }
  }
}
```

### 🚨 Common Mistakes

- **Incorrect paths** - Use relative paths from project root
- **Invalid JSON** - Validate JSON syntax
- **Wrong units** - Remember twips for spacing, half-points for fonts
- **Missing dependencies** - Ensure Pandoc is installed for DOCX

## Next Steps

- See [API Reference](api.md) for programmatic configuration
- Check [Examples](https://github.com/rauofthameem/markdownforge/tree/main/examples) for real-world configs
- Review [Deployment](deployment.md) for CI/CD configuration patterns