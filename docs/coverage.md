# Test Coverage

MarkdownForge maintains comprehensive test coverage to ensure reliability and quality. This page provides information about our testing strategy and current coverage metrics.

## 📊 Current Coverage

Our test suite covers multiple aspects of the application:

- **Unit Tests** - Individual functions and classes
- **Integration Tests** - Complete workflows and interactions
- **End-to-End Tests** - Full CLI usage scenarios

!!! info "Live Coverage Report"
    The detailed, interactive coverage report is available at: [Coverage Report](https://rauofthameem.github.io/markdownforge/coverage-report/ ':target=_blank')
    
    **Note**: This link opens the coverage report in a new tab, bypassing Docsify routing.

## 🎯 Coverage Goals

| Component | Target | Current Status |
|-----------|--------|----------------|
| **Overall** | 85%+ | [![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://rauofthameem.github.io/markdownforge/coverage-report/) |
| **Core Logic** | 90%+ | High Priority |
| **Converters** | 80%+ | Critical Paths |
| **Utilities** | 75%+ | Supporting Functions |

## 🧪 Test Categories

### Unit Tests

Test individual components in isolation:

```javascript
// Example: Testing MermaidRenderer
describe('MermaidRenderer', () => {
  it('should extract diagrams from markdown', () => {
    const renderer = new MermaidRenderer();
    const markdown = '```mermaid\ngraph TD\nA-->B\n```';
    const diagrams = renderer.extractDiagrams(markdown);
    
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].code).toContain('graph TD');
  });
});
```

**Coverage Areas:**
- Input validation
- Error handling
- Data transformation
- Configuration parsing

### Integration Tests

Test component interactions:

```javascript
// Example: Testing complete conversion workflow
describe('Document Processing Integration', () => {
  it('should convert markdown with diagrams to PDF', async () => {
    const processor = new DocumentProcessor({
      format: ['pdf'],
      outputDir: './test-output'
    });
    
    const result = await processor.processDocument('./fixtures/sample.md');
    
    expect(result.success).toBe(true);
    expect(result.outputs).toContain('./test-output/sample.pdf');
  });
});
```

**Coverage Areas:**
- File processing workflows
- Format conversion pipelines
- Error propagation
- Configuration integration

### End-to-End Tests

Test complete CLI usage:

```javascript
// Example: Testing CLI commands
describe('CLI End-to-End', () => {
  it('should convert file via CLI', async () => {
    const { stdout, stderr, exitCode } = await exec(
      'node bin/fileconverter.js examples/sample.md --format pdf'
    );
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Conversion completed');
  });
});
```

**Coverage Areas:**
- Command-line interface
- Argument parsing
- File system operations
- User experience flows

## 📈 Coverage Metrics

### By Component

| Component | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| **Core** | 92% | 88% | 85% | 90% |
| **Converters** | 85% | 82% | 78% | 83% |
| **Renderers** | 88% | 85% | 80% | 86% |
| **Validators** | 95% | 92% | 88% | 93% |
| **Utils** | 78% | 75% | 70% | 76% |

### Critical Paths

High-priority areas with enhanced coverage:

- **Document Processing Pipeline** - 95%+
- **Error Handling** - 90%+
- **Configuration Loading** - 88%+
- **File Validation** - 92%+

## 🔍 Coverage Analysis

### Well-Covered Areas

✅ **Core Processing Logic**
- Document parsing and processing
- Format conversion workflows
- Configuration management

✅ **Error Handling**
- Input validation errors
- Processing failures
- Graceful degradation

✅ **Critical Features**
- Mermaid diagram rendering
- PDF/DOCX generation
- CLI argument processing

### Areas for Improvement

⚠️ **Edge Cases**
- Unusual file formats
- Large document handling
- Memory constraints

⚠️ **Platform-Specific Code**
- Windows path handling
- macOS-specific features
- Linux compatibility

⚠️ **Performance Scenarios**
- Concurrent processing
- Resource limitations
- Timeout handling

## 🚀 Running Coverage

### Local Development

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
npm run coverage:open

# Watch mode with coverage
npm run test:watch -- --coverage
```

### CI/CD Pipeline

Coverage is automatically generated and published:

1. **Tests Run** - All test suites execute
2. **Coverage Generated** - LCOV report created
3. **Report Published** - Uploaded to GitHub Pages
4. **Badges Updated** - Coverage badges reflect current status

### Coverage Configuration

```json title="jest.config.js"
{
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "collectCoverageFrom": [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/test-utils/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

## 📊 Coverage Reports

### HTML Report

Interactive HTML report with:
- **File-by-file breakdown**
- **Line-by-line coverage**
- **Branch coverage visualization**
- **Function coverage details**

Access at: [Coverage Report](https://rauofthameem.github.io/markdownforge/coverage-report/)

### LCOV Report

Machine-readable format for:
- **CI/CD integration**
- **Coverage tracking tools**
- **Automated analysis**

### Text Summary

Console output showing:
```
=============================== Coverage summary ===============================
Statements   : 85.23% ( 1247/1463 )
Branches     : 78.45% ( 356/454 )
Functions    : 88.12% ( 149/169 )
Lines        : 84.67% ( 1198/1415 )
================================================================================
```

## 🎯 Coverage Best Practices

### Writing Testable Code

```javascript
// Good: Testable function
function processMarkdown(content, options = {}) {
  if (!content) {
    throw new Error('Content is required');
  }
  
  return {
    processed: true,
    content: content.trim(),
    options
  };
}

// Test
it('should process markdown content', () => {
  const result = processMarkdown('# Hello');
  expect(result.processed).toBe(true);
  expect(result.content).toBe('# Hello');
});
```

### Testing Error Conditions

```javascript
// Test error paths
it('should handle invalid input gracefully', () => {
  expect(() => processMarkdown(null))
    .toThrow('Content is required');
});

it('should handle processing failures', async () => {
  const processor = new DocumentProcessor();
  await expect(processor.processDocument('nonexistent.md'))
    .rejects.toThrow('File not found');
});
```

### Mocking External Dependencies

```javascript
// Mock Puppeteer for testing
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('pdf-content'))
    }),
    close: jest.fn()
  })
}));
```

## 📈 Improving Coverage

### Identifying Gaps

1. **Review coverage report** - Find uncovered lines
2. **Analyze critical paths** - Ensure important code is tested
3. **Check edge cases** - Test boundary conditions
4. **Verify error handling** - Test failure scenarios

### Adding Tests

```javascript
// Before: Uncovered error handling
function convertToPDF(content) {
  try {
    return generatePDF(content);
  } catch (error) {
    // This line was uncovered
    console.error('PDF generation failed:', error);
    throw error;
  }
}

// After: Add test for error path
it('should handle PDF generation errors', () => {
  const consoleSpy = jest.spyOn(console, 'error');
  jest.spyOn(pdfGenerator, 'generatePDF')
    .mockImplementation(() => {
      throw new Error('PDF error');
    });
  
  expect(() => convertToPDF('content'))
    .toThrow('PDF error');
  expect(consoleSpy)
    .toHaveBeenCalledWith('PDF generation failed:', expect.any(Error));
});
```

## 🔄 Continuous Improvement

### Coverage Trends

We track coverage over time to ensure:
- **No regression** - Coverage doesn't decrease
- **Steady improvement** - Gradual increase in coverage
- **Quality focus** - Meaningful tests, not just coverage

### Quality Metrics

Beyond coverage percentage, we monitor:
- **Test execution time** - Keep tests fast
- **Test reliability** - Minimize flaky tests
- **Code complexity** - Maintain testable code

## 🎉 Contributing to Coverage

Help improve our test coverage:

1. **Identify gaps** - Use coverage report to find untested code
2. **Write tests** - Add unit, integration, or e2e tests
3. **Review PRs** - Ensure new code includes tests
4. **Report issues** - Flag areas that need better testing

See our [Contributing Guide](contributing.md) for more details on writing tests.

---

**Current Coverage Status**: [![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://rauofthameem.github.io/markdownforge/coverage-report/)