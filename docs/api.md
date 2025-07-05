# File Converter CLI API Specification

## Command Line Interface

### Basic Usage
```bash
npx fileconverter <input-file> [options]
```

### Commands

#### Convert Command (Default)
```bash
npx fileconverter input.md --format pdf,docx --output ./output
```

**Arguments:**
- `<input-file>` - Path to the Markdown file to convert (required)

**Options:**
- `--format, -f` - Output formats: `pdf`, `docx`, or `pdf,docx` (default: `pdf,docx`)
- `--output, -o` - Output directory (default: `./output`)
- `--name, -n` - Base name for output files (default: input filename)
- `--theme, -t` - Theme for PDF output: `default`, `github`, `academic` (default: `default`)
- `--diagram-format` - Diagram output format: `png`, `svg` (default: `png`)
- `--verbose, -v` - Enable verbose logging
- `--help, -h` - Show help information
- `--version, -V` - Show version number

#### Examples
```bash
# Basic conversion to both PDF and DOCX
npx fileconverter document.md

# Convert to PDF only with custom output
npx fileconverter document.md --format pdf --output ./exports

# Convert with custom theme and verbose output
npx fileconverter document.md --theme github --verbose

# Convert with custom name
npx fileconverter document.md --name "final-report"
```

## Core API Components

### DocumentProcessor Class

```javascript
class DocumentProcessor {
    constructor(options = {}) {
        this.options = {
            format: ['pdf', 'docx'],
            outputDir: './output',
            theme: 'default',
            diagramFormat: 'png',
            verbose: false,
            ...options
        };
    }

    async processDocument(inputPath) {
        // Main processing pipeline
        // Returns: { success: boolean, outputs: string[], errors: string[] }
    }

    async validateInput(inputPath) {
        // Validate input file
        // Returns: { valid: boolean, errors: string[] }
    }

    async cleanup() {
        // Clean up temporary files and resources
    }
}
```

### MermaidRenderer Class

```javascript
class MermaidRenderer {
    constructor(options = {}) {
        this.options = {
            format: 'png', // 'png' | 'svg'
            theme: 'default',
            backgroundColor: 'white',
            width: 800,
            height: 600,
            ...options
        };
    }

    async extractDiagrams(markdownContent) {
        // Extract Mermaid diagrams from Markdown
        // Returns: Array<{ code: string, index: number, placeholder: string }>
    }

    async renderDiagram(diagramCode, outputPath) {
        // Render single diagram to file
        // Returns: { success: boolean, path: string, error?: string }
    }

    async renderAll(diagrams, outputDir) {
        // Render multiple diagrams
        // Returns: Array<{ success: boolean, path: string, placeholder: string }>
    }
}
```

### DOCXConverter Class

```javascript
class DOCXConverter {
    constructor(options = {}) {
        this.options = {
            pandocPath: 'pandoc',
            template: null,
            referenceDoc: null,
            ...options
        };
    }

    async convert(markdownPath, outputPath, diagrams = []) {
        // Convert Markdown to DOCX with embedded diagrams
        // Returns: { success: boolean, path: string, error?: string }
    }

    async checkPandocAvailability() {
        // Check if Pandoc is installed and accessible
        // Returns: { available: boolean, version?: string, error?: string }
    }
}
```

### PDFConverter Class

```javascript
class PDFConverter {
    constructor(options = {}) {
        this.options = {
            format: 'A4',
            margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
            theme: 'default',
            displayHeaderFooter: false,
            ...options
        };
    }

    async convert(markdownPath, outputPath, diagrams = []) {
        // Convert Markdown to PDF with embedded diagrams
        // Returns: { success: boolean, path: string, error?: string }
    }

    async generateHTML(markdownContent, diagrams) {
        // Generate HTML with embedded CSS and diagrams
        // Returns: string (HTML content)
    }
}
```

## Configuration Schema

### CLI Configuration File (`.fileconverterrc`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "format": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["pdf", "docx"]
      },
      "default": ["pdf", "docx"]
    },
    "output": {
      "type": "string",
      "default": "./output"
    },
    "theme": {
      "type": "string",
      "enum": ["default", "github", "academic"],
      "default": "default"
    },
    "diagramFormat": {
      "type": "string",
      "enum": ["png", "svg"],
      "default": "png"
    },
    "pdf": {
      "type": "object",
      "properties": {
        "format": {
          "type": "string",
          "enum": ["A4", "A3", "Letter", "Legal"],
          "default": "A4"
        },
        "margin": {
          "type": "object",
          "properties": {
            "top": { "type": "string", "default": "1in" },
            "right": { "type": "string", "default": "1in" },
            "bottom": { "type": "string", "default": "1in" },
            "left": { "type": "string", "default": "1in" }
          }
        },
        "displayHeaderFooter": {
          "type": "boolean",
          "default": false
        }
      }
    },
    "docx": {
      "type": "object",
      "properties": {
        "template": {
          "type": "string",
          "description": "Path to custom DOCX template"
        },
        "referenceDoc": {
          "type": "string",
          "description": "Path to reference document for styling"
        }
      }
    },
    "mermaid": {
      "type": "object",
      "properties": {
        "theme": {
          "type": "string",
          "enum": ["default", "dark", "forest", "neutral"],
          "default": "default"
        },
        "backgroundColor": {
          "type": "string",
          "default": "white"
        },
        "width": {
          "type": "number",
          "default": 800
        },
        "height": {
          "type": "number",
          "default": 600
        }
      }
    },
    "verbose": {
      "type": "boolean",
      "default": false
    }
  }
}
```

## Error Handling

### Error Types

```javascript
class FileConverterError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'FileConverterError';
        this.code = code;
        this.details = details;
    }
}

// Error Codes
const ERROR_CODES = {
    INPUT_NOT_FOUND: 'INPUT_NOT_FOUND',
    INPUT_INVALID: 'INPUT_INVALID',
    OUTPUT_PERMISSION: 'OUTPUT_PERMISSION',
    PANDOC_NOT_FOUND: 'PANDOC_NOT_FOUND',
    MERMAID_RENDER_FAILED: 'MERMAID_RENDER_FAILED',
    PDF_GENERATION_FAILED: 'PDF_GENERATION_FAILED',
    DOCX_GENERATION_FAILED: 'DOCX_GENERATION_FAILED',
    PUPPETEER_LAUNCH_FAILED: 'PUPPETEER_LAUNCH_FAILED'
};
```

### Exit Codes

```javascript
const EXIT_CODES = {
    SUCCESS: 0,
    GENERAL_ERROR: 1,
    INPUT_ERROR: 2,
    OUTPUT_ERROR: 3,
    DEPENDENCY_ERROR: 4,
    PROCESSING_ERROR: 5
};
```

## Event System

### Progress Events

```javascript
// Event emitter for progress tracking
const events = {
    'conversion.start': { file: string, formats: string[] },
    'conversion.progress': { step: string, progress: number },
    'conversion.complete': { outputs: string[], duration: number },
    'conversion.error': { error: Error, step: string },
    'diagram.render.start': { count: number },
    'diagram.render.progress': { current: number, total: number },
    'diagram.render.complete': { rendered: string[] },
    'cleanup.start': {},
    'cleanup.complete': { cleanedFiles: string[] }
};
```

## Plugin System (Future Enhancement)

### Plugin Interface

```javascript
class ConverterPlugin {
    constructor(name, version) {
        this.name = name;
        this.version = version;
    }

    // Plugin lifecycle hooks
    async beforeConversion(context) {}
    async afterConversion(context, result) {}
    async onError(error, context) {}

    // Format-specific hooks
    async beforePDFGeneration(htmlContent, options) {}
    async beforeDOCXGeneration(markdownContent, options) {}
    async beforeDiagramRender(diagramCode, options) {}
}
```

## Testing API

### Test Utilities

```javascript
// Test helper functions
const testUtils = {
    createTempMarkdown(content) {
        // Create temporary Markdown file for testing
    },
    
    mockPuppeteer() {
        // Mock Puppeteer for unit tests
    },
    
    mockPandoc() {
        // Mock Pandoc for unit tests
    },
    
    validateOutput(outputPath, expectedContent) {
        // Validate generated output files
    }
};
```

### Integration Test Framework

```javascript
describe('FileConverter Integration Tests', () => {
    test('converts markdown with mermaid diagrams to PDF', async () => {
        const processor = new DocumentProcessor({
            format: ['pdf'],
            outputDir: './test-output'
        });
        
        const result = await processor.processDocument('./fixtures/sample.md');
        
        expect(result.success).toBe(true);
        expect(result.outputs).toContain('./test-output/sample.pdf');
    });
});