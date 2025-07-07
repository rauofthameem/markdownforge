#!/bin/bash
set -e

echo "🚀 Preparing Docsify documentation site..."

# Create coverage directory in docs for Docsify
echo "📊 Setting up coverage report integration..."
mkdir -p ./docs/coverage-report

if [ -d "./coverage/lcov-report" ]; then
    echo "✅ Found coverage report, copying to docs..."
    cp -r ./coverage/lcov-report/* ./docs/coverage-report/
else
    echo "⚠️  No coverage report found, creating placeholder..."
    cat > ./docs/coverage-report/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Report Not Available</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #24292e; }
        p { color: #586069; font-size: 18px; line-height: 1.6; }
        .note { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Coverage Report Not Available</h1>
        <p>The test coverage report will be generated when tests are run with coverage enabled.</p>
        <div class="note">
            <p><strong>To generate coverage:</strong></p>
            <p><code>npm test -- --coverage</code></p>
        </div>
    </div>
</body>
</html>
EOF
fi

echo "✅ Docsify documentation site prepared successfully"
echo "📁 Documentation structure:"
ls -la ./docs/

echo "🎉 Documentation preparation complete!"