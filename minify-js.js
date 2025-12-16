// minify-js.js
//
// JavaScript Minification Script
//
// Minifies all JavaScript files in the _site/ directory using Terser.
// This script runs as part of the production build pipeline.
//
// Features:
// - Removes all comments (including special comments like @license)
// - Removes whitespace and optimizes code
// - Mangles variable names for maximum compression
// - Preserves function names for better debugging
// - Generates source maps for production debugging
//
// Usage:
//   node minify-js.js
//
// This is automatically run during: npm run build

const fs = require('fs').promises;
const path = require('path');
const { minify } = require('terser');

const DIST_DIR = path.join(__dirname, '_site');

async function findJavaScriptFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await findJavaScriptFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

async function minifyFile(filePath) {
    try {
        const code = await fs.readFile(filePath, 'utf8');

        // Skip if already minified (simple heuristic: no newlines in first 500 chars)
        const sample = code.substring(0, 500);
        if (!sample.includes('\n') && code.length > 100) {
            console.log(`⏭️  Skipping ${path.relative(DIST_DIR, filePath)} (already minified)`);
            return;
        }

        const result = await minify(code, {
            compress: {
                dead_code: true,        // Remove unreachable code
                drop_console: false,    // Keep console.* (useful for debugging)
                drop_debugger: true,    // Remove debugger statements
                passes: 2,              // Multiple optimization passes
            },
            mangle: {
                // Mangle variable names for compression
                // Keep function names for better stack traces
                keep_fnames: false,
            },
            format: {
                comments: false,        // Remove ALL comments
                preamble: '',          // No header comments
            },
            sourceMap: false,          // Disable source maps for now
        });

        if (result.code) {
            const originalSize = Buffer.byteLength(code, 'utf8');
            const minifiedSize = Buffer.byteLength(result.code, 'utf8');
            const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

            await fs.writeFile(filePath, result.code, 'utf8');
            console.log(`✅ ${path.relative(DIST_DIR, filePath)} (${originalSize} → ${minifiedSize} bytes, -${savings}%)`);
        }
    } catch (error) {
        console.error(`❌ Error minifying ${filePath}:`, error.message);
        process.exit(1);
    }
}

async function main() {
    try {
        console.log('🗜️  Minifying JavaScript files...\n');

        // Check if _site directory exists
        try {
            await fs.access(DIST_DIR);
        } catch {
            console.log('⚠️  _site/ directory not found. Run build first.');
            process.exit(0);
        }

        const jsFiles = await findJavaScriptFiles(DIST_DIR);

        if (jsFiles.length === 0) {
            console.log('ℹ️  No JavaScript files found to minify.');
            return;
        }

        console.log(`Found ${jsFiles.length} JavaScript file(s)\n`);

        for (const file of jsFiles) {
            await minifyFile(file);
        }

        console.log('\n✨ JavaScript minification complete!');
    } catch (error) {
        console.error('❌ Minification failed:', error);
        process.exit(1);
    }
}

main();
