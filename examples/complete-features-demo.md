# MarkdownForge - Complete Features Demo

This document demonstrates all the features supported by MarkdownForge, including markdown formatting, tables, code blocks, admonitions, and more.

!!! info "About This Demo"
    This document showcases all supported markdown features and how they render in both PDF and DOCX formats.

## Text Formatting

Here are examples of **bold text**, *italic text*, and `inline code`. You can also combine them like ***bold and italic*** or **bold with `code`**.

## Headings

# Heading 1
## Heading 2  
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Lists

### Unordered Lists
- First item
- Second item with **bold text**
- Third item with *italic text*
  - Nested item
  - Another nested item
- Fourth item with `inline code`

### Ordered Lists
1. First numbered item
2. Second numbered item
3. Third numbered item with [a link](https://example.com)
4. Fourth numbered item

## Code Blocks

Here's a JavaScript code block:

```javascript
function convertMarkdown(input, options) {
    const processor = new DocumentProcessor(options);
    return processor.processDocument(input);
}

// Example usage
const result = await convertMarkdown('document.md', {
    format: ['pdf', 'docx'],
    theme: 'github'
});
```

Here's a Python code block:

```python
def process_document(file_path, output_format):
    """Process a markdown document and convert to specified format."""
    with open(file_path, 'r') as file:
        content = file.read()
    
    # Process the content
    result = convert_markdown(content, output_format)
    return result
```

## Tables

| Feature | PDF Support | DOCX Support | Notes |
|---------|-------------|--------------|-------|
| Headings | ✅ | ✅ | All 6 levels supported |
| **Bold Text** | ✅ | ✅ | Properly formatted |
| *Italic Text* | ✅ | ✅ | Properly formatted |
| `Code` | ✅ | ✅ | Monospace font |
| Tables | ✅ | ✅ | Auto-sized columns |
| Lists | ✅ | ✅ | Nested lists supported |
| Admonitions | ✅ | ✅ | 7 types supported |
| Mermaid Diagrams | ✅ | ✅ | Converted to images |

## Blockquotes

> This is a blockquote. It can contain multiple lines and will be styled appropriately in both PDF and DOCX formats.
> 
> Blockquotes can also contain **bold text**, *italic text*, and `inline code`.

## Admonitions Gallery

!!! warning "Warning Example"
    This is a warning admonition with custom styling and an icon.

!!! note "Important Note"
    Notes are perfect for highlighting important information that users should remember.

!!! tip "Helpful Tip"
    Tips provide useful advice and best practices for users.

!!! info "Information"
    Info admonitions provide additional context and supplementary details.

!!! success "Success Message"
    Success admonitions indicate completed tasks or positive outcomes.

!!! error "Error Message"
    Error admonitions highlight problems that need attention.

!!! danger "Critical Warning"
    Danger admonitions are for critical issues that require immediate action.

## Horizontal Rules

Content above the rule.

---

Content below the rule.

## Links and Images

Here's a [link to the GitHub repository](https://github.com/example/fileconverter).

Images are supported (when files exist):
![Sample Image](sample-image.png)

## Mixed Content Example

Here's a complex example combining multiple features:

!!! tip "Configuration Best Practices"
    When setting up your MarkdownForge, consider these recommendations:
    
    1. **Use configuration files** for consistent settings across projects
    2. **Set appropriate themes** based on your document type:
       - `github` for technical documentation
       - `academic` for research papers
       - `default` for general use
    3. **Enable verbose mode** during initial setup: `--verbose`
    
    Example configuration:
    ```json
    {
      "format": ["pdf", "docx"],
      "theme": "github",
      "output": "./output",
      "verbose": true
    }
    ```

## Command Line Examples

Convert a single file to both formats:
```bash
fileconverter document.md --format pdf,docx
```

Convert with specific theme:
```bash
fileconverter document.md --format pdf --theme academic
```

Use configuration file:
```bash
fileconverter document.md --config .fileconverterrc
```

## Conclusion

MarkdownForge supports a comprehensive set of markdown features, ensuring your documents look professional in both PDF and DOCX formats. All formatting, including admonitions, tables, code blocks, and text styling, is preserved during conversion.

!!! success "Ready to Use"
    Your MarkdownForge is now equipped with full admonition support and comprehensive markdown processing capabilities!