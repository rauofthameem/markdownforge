# Mermaid Diagram Test

This document tests Mermaid diagram rendering in MarkdownForge.

## Sample Flowchart

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

## Sample Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant MarkdownForge
    participant PDF
    
    User->>MarkdownForge: Input Markdown
    MarkdownForge->>MarkdownForge: Process Mermaid
    MarkdownForge->>PDF: Generate Document
    PDF-->>User: Professional Document
```

## Regular Content

This is regular markdown content that should appear normally.