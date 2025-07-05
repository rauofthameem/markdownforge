# Admonitions Demo

This document demonstrates all supported admonition types in MarkdownForge.

## Warning Admonitions

!!! warning "🚧 Under Development"
    This feature is currently under development and may not be fully functional yet.

!!! warning
    This is a warning without a custom title - it will use the default "Warning" title.

## Information Admonitions

!!! info "Additional Information"
    This info admonition provides supplementary details that might be helpful for users.

!!! note "Important Note"
    This note contains important information that users should be aware of.

## Success and Tips

!!! success "Task Completed Successfully"
    The operation has been completed successfully. All files have been processed.

!!! tip "Pro Tip"
    Use the `--verbose` flag to see detailed processing information during conversion.

## Error and Danger

!!! error "Processing Failed"
    An error occurred during file processing. Please check your input file format.

!!! danger "Critical Security Warning"
    Never share your API keys or credentials in configuration files that are committed to version control.

## Usage Examples

Here's how these admonitions appear in both PDF and DOCX formats:

- **PDF**: Styled with colored borders, backgrounds, and icons
- **DOCX**: Formatted with colored text, backgrounds, and left borders

## Syntax

The basic syntax for admonitions is:

```markdown
!!! type "Optional Custom Title"
    Your content here with 4-space indentation
    
    Multiple paragraphs are supported
```

Supported types: `warning`, `info`, `note`, `tip`, `success`, `error`, `danger`