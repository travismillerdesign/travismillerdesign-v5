#!/usr/bin/env node

/**
 * TODO Scanner
 * Scans the codebase for TODO comments and lists them by file
 * Useful for remembering what needs to be done after being away from the project
 *
 * Usage: node list-todos.js
 * Or: npm run todos
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const SCAN_DIRS = ['src', 'lib', 'tests'];

// File extensions to search
const EXTENSIONS = ['.js', '.html', '.css', '.scss', '.md'];

// Directories to ignore
const IGNORE_DIRS = ['node_modules', 'dist', '.git'];

// TODO patterns to match
const TODO_PATTERNS = [
    /\/\/\s*TODO:?\s*(.+)/gi, // // TODO: or // TODO
    /\/\*\s*TODO:?\s*(.+?)\s*\*\//gi, // /* TODO: ... */
    /<!--\s*TODO:?\s*(.+?)\s*-->/gi, // <!-- TODO: ... -->
];

const todos = [];

/**
 * Check if a file should be scanned
 */
function shouldScanFile(filename) {
    return EXTENSIONS.some((ext) => filename.endsWith(ext));
}

/**
 * Recursively scan directory for TODO comments
 */
function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!IGNORE_DIRS.includes(entry.name)) {
                scanDirectory(fullPath);
            }
        } else if (entry.isFile() && shouldScanFile(entry.name)) {
            scanFile(fullPath);
        }
    }
}

/**
 * Scan a single file for TODO comments
 */
function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);

    lines.forEach((line, index) => {
        TODO_PATTERNS.forEach((pattern) => {
            pattern.lastIndex = 0; // Reset regex state
            const match = pattern.exec(line);
            if (match) {
                todos.push({
                    file: relativePath,
                    line: index + 1,
                    text: match[1].trim(),
                });
            }
        });
    });
}

/**
 * Group TODOs by file
 */
function groupTodosByFile() {
    const grouped = {};

    todos.forEach((todo) => {
        if (!grouped[todo.file]) {
            grouped[todo.file] = [];
        }
        grouped[todo.file].push(todo);
    });

    return grouped;
}

/**
 * Main execution
 */
function main() {
    console.log('🔍 Scanning for TODO comments...\n');

    // Scan all directories
    SCAN_DIRS.forEach((dir) => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            scanDirectory(fullPath);
        }
    });

    // Display results
    if (todos.length === 0) {
        console.log('✅ No TODO comments found! All done.\n');
        return;
    }

    const grouped = groupTodosByFile();
    const fileCount = Object.keys(grouped).length;

    console.log(`Found ${todos.length} TODO${todos.length === 1 ? '' : 's'} in ${fileCount} file${fileCount === 1 ? '' : 's'}:\n`);

    // Print grouped by file
    Object.keys(grouped)
        .sort()
        .forEach((file) => {
            console.log(`📄 ${file}`);
            grouped[file].forEach((todo) => {
                console.log(`   Line ${todo.line}: ${todo.text}`);
            });
            console.log();
        });
}

// Run the scanner
main();
