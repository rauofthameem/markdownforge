const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const markdownIt = require('markdown-it');
const { logger } = require('../utils/logger');
const { FileConverterError, ERROR_CODES } = require('../utils/errors');

class PDFConverter {
  constructor(options = {}) {
    this.options = {
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      theme: 'default',
      displayHeaderFooter: false,
      headerTemplate: '',
      footerTemplate: '',
      printBackground: true,
      ...options
    };

    this.browser = null;
    this.markdown = markdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: false
    }).enable(['image']);
  }

  async convert(markdownPath, outputPath, originalMarkdownPath = null) {
    try {
      logger.debug(`Converting ${markdownPath} to PDF...`);

      // Read markdown content
      const markdownContent = await fs.readFile(markdownPath, 'utf-8');
      
      // Store the original markdown file's directory for relative path resolution
      // Use originalMarkdownPath if provided (for temp files), otherwise use markdownPath
      const baseMarkdownPath = originalMarkdownPath || markdownPath;
      this.markdownDir = path.dirname(path.resolve(baseMarkdownPath));
      
      // Convert markdown to HTML
      const htmlContent = this.generateHTML(markdownContent);
      
      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Initialize browser if needed
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const page = await this.browser.newPage();

      try {
        // Set content and wait for resources to load
        await page.setContent(htmlContent, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        // Generate PDF
        await page.pdf({
          path: outputPath,
          format: this.options.format,
          margin: this.options.margin,
          displayHeaderFooter: this.options.displayHeaderFooter,
          headerTemplate: this.options.headerTemplate,
          footerTemplate: this.options.footerTemplate,
          printBackground: this.options.printBackground,
          preferCSSPageSize: true
        });

        await page.close();

        // Verify output file
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
          throw new Error('Generated PDF file is empty');
        }

        logger.debug(`PDF file created: ${outputPath} (${this.formatFileSize(stats.size)})`);

        return {
          success: true,
          path: outputPath,
          size: stats.size
        };

      } finally {
        if (page && !page.isClosed()) {
          await page.close();
        }
      }

    } catch (error) {
      logger.error(`PDF conversion failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateHTML(markdownContent) {
    // Pre-process markdown to handle admonitions
    let processedMarkdown = this.preprocessAdmonitions(markdownContent);
    
    // Pre-process markdown images to HTML since markdown-it doesn't handle file:// URLs
    processedMarkdown = this.preprocessImages(processedMarkdown);
    
    // Convert markdown to HTML
    let htmlBody = this.markdown.render(processedMarkdown);
    
    // Convert local image paths to base64 data URLs for reliable PDF rendering
    htmlBody = this.convertImagesToBase64(htmlBody);
    
    // Get CSS based on theme
    const css = this.getThemeCSS();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        ${css}
    </style>
</head>
<body>
    <div class="container">
        ${htmlBody}
    </div>
</body>
</html>`;
  }

  preprocessImages(markdownContent) {
    // Convert markdown image syntax to HTML img tags for file:// URLs
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    
    return markdownContent.replace(imageRegex, (match, altText, src) => {
      // Convert to HTML img tag
      return `<img src="${src}" alt="${altText}" style="max-width: 100%; height: auto;">`;
    });
  }

  preprocessAdmonitions(markdownContent) {
    // Convert admonitions to HTML divs that can be styled
    const lines = markdownContent.split('\n');
    const processedLines = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Check for admonition start
      if (line.startsWith('!!!')) {
        const match = line.match(/^!!!\s+(\w+)(?:\s+"([^"]*)")?/);
        if (match) {
          const [, type, title] = match;
          const titleText = title || type.charAt(0).toUpperCase() + type.slice(1);
          
          // Start admonition div
          processedLines.push(`<div class="admonition admonition-${type.toLowerCase()}">`);
          processedLines.push(`<div class="admonition-title">${titleText}</div>`);
          processedLines.push('<div class="admonition-content">');
          
          // Process content lines
          i++;
          while (i < lines.length) {
            const contentLine = lines[i];
            if (contentLine.startsWith('    ') || contentLine.trim() === '') {
              // Remove 4-space indentation and add to content
              const cleanLine = contentLine.replace(/^ {4}/, '');
              if (cleanLine.trim() !== '') {
                processedLines.push(cleanLine);
              }
              i++;
            } else {
              break;
            }
          }
          
          // Close admonition div
          processedLines.push('</div>');
          processedLines.push('</div>');
          processedLines.push(''); // Add empty line after admonition
          continue;
        }
      }
      
      processedLines.push(line);
      i++;
    }
    
    return processedLines.join('\n');
  }

  getThemeCSS() {
    const baseCSS = `
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: none;
            margin: 0;
            padding: 0;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
            line-height: 1.25;
        }
        
        h1 { font-size: 2rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        h2 { font-size: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
        h3 { font-size: 1.25rem; }
        h4 { font-size: 1rem; }
        h5 { font-size: 0.875rem; }
        h6 { font-size: 0.85rem; }
        
        p {
            margin-bottom: 1rem;
        }
        
        a {
            color: #0366d6;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        ul, ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
        }
        
        li {
            margin-bottom: 0.25rem;
        }
        
        blockquote {
            margin: 1rem 0;
            padding: 0 1rem;
            color: #6a737d;
            border-left: 4px solid #dfe2e5;
        }
        
        code {
            background-color: rgba(27,31,35,0.05);
            border-radius: 3px;
            font-size: 85%;
            margin: 0;
            padding: 0.2em 0.4em;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        
        pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            font-size: 85%;
            line-height: 1.45;
            overflow: auto;
            padding: 16px;
            margin-bottom: 1rem;
        }
        
        pre code {
            background-color: transparent;
            border: 0;
            display: inline;
            line-height: inherit;
            margin: 0;
            max-width: auto;
            overflow: visible;
            padding: 0;
            word-wrap: normal;
        }
        
        table {
            border-collapse: collapse;
            border-spacing: 0;
            width: 100%;
            margin-bottom: 1rem;
        }
        
        table th,
        table td {
            border: 1px solid #dfe2e5;
            padding: 6px 13px;
        }
        
        table th {
            background-color: #f6f8fa;
            font-weight: 600;
        }
        
        table tr:nth-child(2n) {
            background-color: #f6f8fa;
        }
        
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1rem auto;
        }
        
        hr {
            border: none;
            border-top: 1px solid #eee;
            margin: 2rem 0;
        }
        
        /* Admonition Styles */
        .admonition {
            margin: 1.5rem 0;
            padding: 0;
            border-radius: 6px;
            border-left: 4px solid;
            overflow: hidden;
        }
        
        .admonition-title {
            font-weight: bold;
            padding: 0.75rem 1rem;
            margin: 0;
            font-size: 1rem;
        }
        
        .admonition-content {
            padding: 0.75rem 1rem;
            margin: 0;
        }
        
        .admonition-content > *:first-child {
            margin-top: 0;
        }
        
        .admonition-content > *:last-child {
            margin-bottom: 0;
        }
        
        /* Warning admonition */
        .admonition-warning {
            border-left-color: #FF6B35;
        }
        .admonition-warning .admonition-title {
            background-color: #FFF4E6;
            color: #FF6B35;
        }
        .admonition-warning .admonition-title::before {
            content: "⚠️ ";
        }
        .admonition-warning .admonition-content {
            background-color: #FFFBF5;
        }
        
        /* Note admonition */
        .admonition-note {
            border-left-color: #0066CC;
        }
        .admonition-note .admonition-title {
            background-color: #E6F3FF;
            color: #0066CC;
        }
        .admonition-note .admonition-title::before {
            content: "📝 ";
        }
        .admonition-note .admonition-content {
            background-color: #F8FCFF;
        }
        
        /* Info admonition */
        .admonition-info {
            border-left-color: #17A2B8;
        }
        .admonition-info .admonition-title {
            background-color: #E6F9FC;
            color: #17A2B8;
        }
        .admonition-info .admonition-title::before {
            content: "ℹ️ ";
        }
        .admonition-info .admonition-content {
            background-color: #F8FDFE;
        }
        
        /* Tip admonition */
        .admonition-tip {
            border-left-color: #28A745;
        }
        .admonition-tip .admonition-title {
            background-color: #E6F7E6;
            color: #28A745;
        }
        .admonition-tip .admonition-title::before {
            content: "💡 ";
        }
        .admonition-tip .admonition-content {
            background-color: #F8FDF8;
        }
        
        /* Danger admonition */
        .admonition-danger {
            border-left-color: #DC3545;
        }
        .admonition-danger .admonition-title {
            background-color: #FFE6E6;
            color: #DC3545;
        }
        .admonition-danger .admonition-title::before {
            content: "🚨 ";
        }
        .admonition-danger .admonition-content {
            background-color: #FFFBFB;
        }
        
        @media print {
            body {
                font-size: 12pt;
            }
            
            h1 { font-size: 18pt; }
            h2 { font-size: 16pt; }
            h3 { font-size: 14pt; }
            h4 { font-size: 12pt; }
            h5 { font-size: 11pt; }
            h6 { font-size: 10pt; }
            
            pre, code {
                background-color: #f5f5f5 !important;
                -webkit-print-color-adjust: exact;
            }
            
            .admonition {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .admonition-title,
            .admonition-content {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            a {
                color: #000 !important;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    `;

    // Add theme-specific styles
    switch (this.options.theme) {
      case 'github':
        return baseCSS + this.getGitHubThemeCSS();
      case 'academic':
        return baseCSS + this.getAcademicThemeCSS();
      default:
        return baseCSS;
    }
  }

  getGitHubThemeCSS() {
    return `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif;
            font-size: 16px;
            line-height: 1.5;
            word-wrap: break-word;
        }
        
        h1, h2 {
            border-bottom: 1px solid #eaecef;
            padding-bottom: 0.3em;
        }
        
        code {
            background-color: rgba(27,31,35,0.05);
            border-radius: 6px;
            font-size: 85%;
            margin: 0;
            padding: 0.2em 0.4em;
        }
        
        pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            font-size: 85%;
            line-height: 1.45;
            overflow: auto;
            padding: 16px;
        }
    `;
  }

  getAcademicThemeCSS() {
    return `
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            text-align: justify;
        }
        
        .container {
            max-width: 700px;
        }
        
        h1 {
            text-align: center;
            font-size: 18pt;
            margin-bottom: 2rem;
        }
        
        h2 {
            font-size: 14pt;
            margin-top: 1.5rem;
        }
        
        h3 {
            font-size: 12pt;
            font-style: italic;
        }
        
        p {
            text-indent: 1.5em;
            margin-bottom: 0.5rem;
        }
        
        blockquote {
            font-style: italic;
            margin: 1rem 2rem;
            border-left: none;
        }
        
        @media print {
            body {
                font-size: 11pt;
            }
        }
    `;
  }

  async initializeBrowser() {
    try {
      logger.debug('Launching Puppeteer browser for PDF generation...');
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        timeout: 30000
      });
      
      logger.debug('PDF browser launched successfully');
      
    } catch (error) {
      throw new FileConverterError(
        `Failed to launch browser for PDF generation: ${error.message}`,
        ERROR_CODES.PUPPETEER_LAUNCH_FAILED,
        { originalError: error }
      );
    }
  }

  async cleanup() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.debug('PDF browser closed successfully');
      } catch (error) {
        logger.warn(`Failed to close PDF browser: ${error.message}`);
      }
    }
  }

  convertImagesToBase64(htmlContent) {
    // Find all img tags with file:// or local file paths
    const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
    
    return htmlContent.replace(imgRegex, (match, beforeSrc, src, afterSrc) => {
      try {
        // Handle file:// URLs and absolute paths
        let filePath = src;
        if (src.startsWith('file://')) {
          filePath = src.replace('file://', '');
        }
        
        // Handle relative paths by resolving them from the markdown file's directory
        if (!path.isAbsolute(filePath)) {
          // Use the markdown file's directory as the base for relative paths
          const baseDir = this.markdownDir || process.cwd();
          filePath = path.resolve(baseDir, filePath);
        }
        
        logger.debug(`Resolving image path: ${src} -> ${filePath}`);
        
        // Check if file exists
        if (fs.existsSync(filePath)) {
          // Read file and convert to base64
          const fileBuffer = fs.readFileSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          
          // Determine MIME type
          let mimeType = 'image/png'; // default
          if (ext === '.jpg' || ext === '.jpeg') {
            mimeType = 'image/jpeg';
          } else if (ext === '.svg') {
            mimeType = 'image/svg+xml';
          } else if (ext === '.gif') {
            mimeType = 'image/gif';
          }
          
          const base64Data = fileBuffer.toString('base64');
          const dataUrl = `data:${mimeType};base64,${base64Data}`;
          
          logger.debug(`Embedded image: ${path.basename(filePath)} (${this.formatFileSize(fileBuffer.length)})`);
          return `<img${beforeSrc}src="${dataUrl}"${afterSrc}>`;
        } else {
          logger.warn(`Image file not found: ${filePath}`);
        }
      } catch (error) {
        logger.warn(`Failed to convert image to base64: ${src} - ${error.message}`);
      }
      
      // Return original if conversion failed
      return match;
    });
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = { PDFConverter };