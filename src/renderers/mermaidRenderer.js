const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../utils/logger');
const { FileConverterError, ERROR_CODES } = require('../utils/errors');

class MermaidRenderer {
  constructor(options = {}) {
    this.options = {
      format: 'png', // 'png' | 'svg'
      theme: 'default',
      backgroundColor: 'white',
      width: 1200,
      height: 800,
      ...options
    };
    
    this.browser = null;
    this.diagramCounter = 0;
  }

  async extractDiagrams(markdownContent) {
    const diagrams = [];
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    let match;
    let index = 0;

    while ((match = mermaidRegex.exec(markdownContent)) !== null) {
      const diagramCode = match[1].trim();
      const placeholder = `__MERMAID_DIAGRAM_${index}__`;
      
      diagrams.push({
        code: diagramCode,
        index,
        placeholder,
        originalMatch: match[0]
      });
      
      index++;
    }

    logger.debug(`Extracted ${diagrams.length} Mermaid diagrams`);
    return diagrams;
  }

  async renderDiagram(diagramCode, outputPath) {
    try {
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const page = await this.browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: this.options.width,
        height: this.options.height,
        deviceScaleFactor: 2 // For high-DPI rendering
      });

      // Create HTML content with Mermaid
      const htmlContent = this.createMermaidHTML(diagramCode);
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for modern Mermaid rendering to complete
      await page.waitForFunction(() => window.mermaidRendered === true, { timeout: 15000 });
      
      // Wait a bit more for any animations to complete
      await page.waitForTimeout(500);
      
      // Get the rendered diagram element
      const diagramElement = await page.$('#diagram-container');
      
      if (!diagramElement) {
        throw new Error('Mermaid diagram container not found after rendering');
      }

      // Check if SVG was actually rendered
      const svgExists = await page.evaluate(() => {
        return document.querySelector('#diagram-container svg') !== null;
      });

      if (!svgExists) {
        throw new Error('Mermaid diagram SVG not rendered');
      }

      // Take screenshot or get SVG based on format
      if (this.options.format === 'svg') {
        const svgContent = await page.evaluate(() => {
          const svg = document.querySelector('#diagram-container svg');
          return svg ? svg.outerHTML : null;
        });
        
        if (svgContent) {
          await fs.writeFile(outputPath, svgContent);
        } else {
          throw new Error('Failed to extract SVG content');
        }
      } else {
        // PNG format
        await diagramElement.screenshot({
          path: outputPath,
          omitBackground: this.options.backgroundColor === 'transparent'
        });
      }

      await page.close();
      
      logger.debug(`Rendered diagram: ${path.basename(outputPath)}`);
      
      return {
        success: true,
        path: outputPath
      };

    } catch (error) {
      logger.error(`Failed to render Mermaid diagram: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async renderAll(diagrams, outputDir) {
    const results = [];
    
    logger.info(`Rendering ${diagrams.length} diagram(s)...`);
    
    for (let i = 0; i < diagrams.length; i++) {
      const diagram = diagrams[i];
      const filename = `diagram-${i + 1}.${this.options.format}`;
      const outputPath = path.join(outputDir, filename);
      
      logger.debug(`Rendering diagram ${i + 1}/${diagrams.length}`);
      
      const result = await this.renderDiagram(diagram.code, outputPath);
      
      results.push({
        ...result,
        placeholder: diagram.placeholder,
        originalMatch: diagram.originalMatch
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    logger.info(`Successfully rendered ${successCount}/${diagrams.length} diagrams`);
    
    return results;
  }

  createMermaidHTML(diagramCode) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <script type="module" src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: ${this.options.backgroundColor};
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #diagram-container {
            width: 100%;
            min-height: 600px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #diagram-container svg {
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
        }
    </style>
</head>
<body>
    <div id="diagram-container"></div>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
        
        // Initialize Mermaid with modern configuration
        mermaid.initialize({
            startOnLoad: false,
            theme: '${this.options.theme}',
            securityLevel: 'loose',
            themeVariables: {
                background: '${this.options.backgroundColor}',
                primaryColor: '#ff6b6b',
                primaryTextColor: '#333',
                primaryBorderColor: '#ff6b6b',
                lineColor: '#333',
                secondaryColor: '#4ecdc4',
                tertiaryColor: '#45b7d1'
            },
            flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                curve: 'basis'
            },
            sequence: {
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                mirrorActors: true,
                bottomMarginAdj: 1,
                useMaxWidth: true,
                rightAngles: false,
                showSequenceNumbers: false
            },
            gantt: {
                titleTopMargin: 25,
                barHeight: 20,
                fontSizeFactor: 1,
                fontSize: 11,
                gridLineStartPadding: 35,
                bottomPadding: 50,
                rightPadding: 75
            }
        });
        
        // Modern rendering approach using mermaid.render()
        const renderDiagram = async () => {
            try {
                const diagramDefinition = \`${diagramCode.replace(/`/g, '\\`')}\`;
                const { svg } = await mermaid.render('diagram-svg', diagramDefinition);
                document.getElementById('diagram-container').innerHTML = svg;
                console.log('Mermaid rendering completed');
                
                // Signal completion for screenshot timing
                window.mermaidRendered = true;
            } catch (error) {
                console.error('Mermaid rendering failed:', error);
                document.getElementById('diagram-container').innerHTML =
                    '<div style="color: red; text-align: center;">Diagram rendering failed: ' + error.message + '</div>';
                window.mermaidRendered = true;
            }
        };
        
        // Start rendering
        renderDiagram();
    </script>
</body>
</html>`;
  }

  async initializeBrowser() {
    try {
      logger.debug('Launching Puppeteer browser...');
      
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
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=site-per-process'
        ],
        timeout: 30000
      });
      
      logger.debug('Puppeteer browser launched successfully');
      
    } catch (error) {
      throw new FileConverterError(
        `Failed to launch browser: ${error.message}`,
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
        logger.debug('Browser closed successfully');
      } catch (error) {
        logger.warn(`Failed to close browser: ${error.message}`);
      }
    }
  }
}

module.exports = { MermaidRenderer };