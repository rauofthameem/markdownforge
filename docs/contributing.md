# Contributing

We welcome contributions to MarkdownForge! This guide will help you get started with contributing to the project.

## 🤝 Ways to Contribute

- **🐛 Bug Reports** - Help us identify and fix issues
- **💡 Feature Requests** - Suggest new features and improvements
- **📝 Documentation** - Improve docs, examples, and guides
- **🔧 Code Contributions** - Fix bugs, add features, improve performance
- **🧪 Testing** - Add tests, improve coverage, test edge cases
- **🎨 Design** - UI/UX improvements, themes, styling

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git
- Pandoc (for DOCX conversion testing)

### Development Setup

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/markdownforge.git
   cd markdownforge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Verify Setup**
   ```bash
   # Run tests
   npm test
   
   # Run linter
   npm run lint
   
   # Test CLI locally
   npm start -- examples/sample.md --verbose
   ```

### Project Structure

```
markdownforge/
├── bin/                    # CLI executable
├── src/                    # Source code
│   ├── core/              # Core processing logic
│   ├── converters/        # Format converters
│   ├── renderers/         # Diagram renderers
│   ├── utils/             # Utilities
│   └── validators/        # Input validation
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test fixtures
├── docs/                 # Documentation
├── examples/             # Example files
└── scripts/              # Build scripts
```

## 🐛 Reporting Bugs

### Before Reporting

1. **Search existing issues** - Check if the bug is already reported
2. **Test with latest version** - Use `npx markdownforge@latest`
3. **Minimal reproduction** - Create the smallest example that shows the bug

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Create file with content: '...'
2. Run command: 'npx markdownforge ...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., macOS 12.0]
- Node.js: [e.g., 18.0.0]
- MarkdownForge: [e.g., 1.0.0]
- Pandoc: [e.g., 2.19.2]

**Additional Context**
- Configuration file content
- Sample markdown file
- Full error output with --verbose
```

## 💡 Feature Requests

### Before Requesting

1. **Check existing requests** - Look through issues and discussions
2. **Consider scope** - Ensure it fits the project's goals
3. **Think about implementation** - Consider how it might work

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
Describe the problem this feature would solve.

**Proposed Solution**
How you envision this feature working.

**Alternatives Considered**
Other approaches you've considered.

**Additional Context**
Examples, mockups, or references.
```

## 🔧 Code Contributions

### Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make Changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run all tests
   npm test
   
   # Run specific test suite
   npm run test:unit
   npm run test:integration
   
   # Test with real files
   npm start -- examples/sample.md --verbose
   ```

4. **Commit Changes**
   ```bash
   # Use conventional commits
   git commit -m "feat: add new diagram type support"
   git commit -m "fix: resolve DOCX formatting issue"
   git commit -m "docs: update API documentation"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Coding Standards

#### JavaScript/Node.js

- **ES6+ syntax** - Use modern JavaScript features
- **Async/await** - Prefer over callbacks and raw promises
- **Error handling** - Always handle errors appropriately
- **JSDoc comments** - Document public APIs

```javascript
/**
 * Process a markdown document and convert to specified formats
 * @param {string} inputPath - Path to the markdown file
 * @param {Object} options - Conversion options
 * @param {string[]} options.format - Output formats ['pdf', 'docx']
 * @param {string} options.theme - Theme to use
 * @returns {Promise<Object>} Conversion results
 */
async function processDocument(inputPath, options = {}) {
  try {
    // Implementation
  } catch (error) {
    throw new Error(`Failed to process document: ${error.message}`);
  }
}
```

#### Testing

- **Unit tests** - Test individual functions and classes
- **Integration tests** - Test complete workflows
- **Test naming** - Descriptive test names

```javascript
describe('DocumentProcessor', () => {
  describe('processDocument', () => {
    it('should convert markdown to PDF successfully', async () => {
      // Test implementation
    });
    
    it('should handle missing input file gracefully', async () => {
      // Test error handling
    });
  });
});
```

#### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

### Pull Request Process

1. **PR Title** - Use conventional commit format
2. **Description** - Explain what and why
3. **Testing** - Describe how you tested the changes
4. **Documentation** - Update relevant docs
5. **Breaking Changes** - Clearly mark any breaking changes

#### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 📝 Documentation

### Types of Documentation

- **API Documentation** - JSDoc comments in code
- **User Guides** - Step-by-step instructions
- **Examples** - Real-world usage examples
- **Architecture** - System design and decisions

### Documentation Standards

- **Clear and concise** - Easy to understand
- **Examples included** - Show don't just tell
- **Up to date** - Keep in sync with code
- **Accessible** - Consider all skill levels

## 🧪 Testing

### Test Categories

1. **Unit Tests** - Individual functions/classes
2. **Integration Tests** - Complete workflows
3. **End-to-End Tests** - Full CLI usage
4. **Performance Tests** - Speed and memory usage

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

```javascript
// Unit test example
describe('MermaidRenderer', () => {
  let renderer;
  
  beforeEach(() => {
    renderer = new MermaidRenderer();
  });
  
  it('should extract mermaid diagrams from markdown', () => {
    const markdown = '```mermaid\ngraph TD\nA-->B\n```';
    const diagrams = renderer.extractDiagrams(markdown);
    
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].code).toContain('graph TD');
  });
});
```

## 🎨 Design Guidelines

### Themes

- **Consistent styling** - Follow established patterns
- **Accessibility** - Consider color contrast and readability
- **Print-friendly** - Work well in PDF format
- **Professional** - Suitable for business use

### UI/UX

- **Clear error messages** - Help users understand issues
- **Progress indicators** - Show processing status
- **Helpful defaults** - Work well out of the box
- **Flexible configuration** - Allow customization

## 🚀 Release Process

### Version Management

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Release Checklist

1. **Update version** in package.json
2. **Update CHANGELOG.md**
3. **Run full test suite**
4. **Update documentation**
5. **Create release PR**
6. **Tag release** after merge
7. **Publish to NPM**

## 🏆 Recognition

Contributors are recognized in:

- **README.md** - Contributors section
- **CHANGELOG.md** - Release notes
- **GitHub releases** - Release descriptions

## 📞 Getting Help

- **GitHub Discussions** - General questions and ideas
- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Real-time chat (coming soon)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MarkdownForge! 🚀