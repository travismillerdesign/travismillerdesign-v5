// tests/asset-validator.test.js
//
// Test Suite for Asset Validation Utility
//
// Tests all validation functions in lib/asset-validator.js
// Run with: node tests/asset-validator.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the module to test
const {
    validateFileExists,
    validateDirectory,
    getFileSize,
    validateImageFile,
    validateVideoFile,
    findAllImages,
    findAllVideos
} = require('../lib/asset-validator');

// Test helpers
let testDir;
let testFiles = [];

function setup() {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-validator-test-'));
    console.log(`Created test directory: ${testDir}`);
}

function cleanup() {
    // Clean up test files and directory
    testFiles.forEach(file => {
        try {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        } catch (err) {
            console.warn(`Failed to delete ${file}: ${err.message}`);
        }
    });

    try {
        if (fs.existsSync(testDir)) {
            fs.rmdirSync(testDir, { recursive: true });
        }
    } catch (err) {
        console.warn(`Failed to delete test directory: ${err.message}`);
    }

    console.log('Cleaned up test directory\n');
}

function createTestFile(filename, sizeBytes = 100) {
    const filePath = path.join(testDir, filename);
    const buffer = Buffer.alloc(sizeBytes);
    fs.writeFileSync(filePath, buffer);
    testFiles.push(filePath);
    return filePath;
}

// Test suite
function runTests() {
    console.log('🧪 Running Asset Validator Tests\n');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    // Test 1: validateFileExists - valid file
    try {
        const testFile = createTestFile('test.jpg');
        assert.strictEqual(validateFileExists(testFile), true, 'Should return true for existing file');
        console.log('✓ Test 1: validateFileExists - valid file');
        passed++;
    } catch (err) {
        console.error('✗ Test 1 failed:', err.message);
        failed++;
    }

    // Test 2: validateFileExists - non-existent file
    try {
        assert.strictEqual(validateFileExists('/nonexistent/file.jpg'), false, 'Should return false for non-existent file');
        console.log('✓ Test 2: validateFileExists - non-existent file');
        passed++;
    } catch (err) {
        console.error('✗ Test 2 failed:', err.message);
        failed++;
    }

    // Test 3: validateFileExists - directory instead of file
    try {
        assert.strictEqual(validateFileExists(testDir), false, 'Should return false for directory');
        console.log('✓ Test 3: validateFileExists - directory check');
        passed++;
    } catch (err) {
        console.error('✗ Test 3 failed:', err.message);
        failed++;
    }

    // Test 4: validateDirectory - valid directory
    try {
        assert.strictEqual(validateDirectory(testDir), true, 'Should return true for existing directory');
        console.log('✓ Test 4: validateDirectory - valid directory');
        passed++;
    } catch (err) {
        console.error('✗ Test 4 failed:', err.message);
        failed++;
    }

    // Test 5: validateDirectory - non-existent directory
    try {
        assert.strictEqual(validateDirectory('/nonexistent/dir'), false, 'Should return false for non-existent directory');
        console.log('✓ Test 5: validateDirectory - non-existent directory');
        passed++;
    } catch (err) {
        console.error('✗ Test 5 failed:', err.message);
        failed++;
    }

    // Test 6: getFileSize - small file
    try {
        const testFile = createTestFile('small.jpg', 500);
        const size = getFileSize(testFile);
        assert.strictEqual(size, '500 B', 'Should return correct byte size');
        console.log('✓ Test 6: getFileSize - bytes');
        passed++;
    } catch (err) {
        console.error('✗ Test 6 failed:', err.message);
        failed++;
    }

    // Test 7: getFileSize - KB file
    try {
        const testFile = createTestFile('medium.jpg', 2048);
        const size = getFileSize(testFile);
        assert.strictEqual(size, '2.0 KB', 'Should return KB size');
        console.log('✓ Test 7: getFileSize - kilobytes');
        passed++;
    } catch (err) {
        console.error('✗ Test 7 failed:', err.message);
        failed++;
    }

    // Test 8: getFileSize - MB file
    try {
        const testFile = createTestFile('large.jpg', 2 * 1024 * 1024);
        const size = getFileSize(testFile);
        assert.strictEqual(size, '2.0 MB', 'Should return MB size');
        console.log('✓ Test 8: getFileSize - megabytes');
        passed++;
    } catch (err) {
        console.error('✗ Test 8 failed:', err.message);
        failed++;
    }

    // Test 9: validateImageFile - valid JPG
    try {
        const testFile = createTestFile('image.jpg', 1024);
        const result = validateImageFile(testFile);
        assert.strictEqual(result.valid, true, 'Should validate JPG file');
        assert.strictEqual(result.error, null, 'Should have no error');
        console.log('✓ Test 9: validateImageFile - valid JPG');
        passed++;
    } catch (err) {
        console.error('✗ Test 9 failed:', err.message);
        failed++;
    }

    // Test 10: validateImageFile - valid PNG
    try {
        const testFile = createTestFile('image.png', 1024);
        const result = validateImageFile(testFile);
        assert.strictEqual(result.valid, true, 'Should validate PNG file');
        console.log('✓ Test 10: validateImageFile - valid PNG');
        passed++;
    } catch (err) {
        console.error('✗ Test 10 failed:', err.message);
        failed++;
    }

    // Test 11: validateImageFile - invalid extension
    try {
        const testFile = createTestFile('image.txt', 1024);
        const result = validateImageFile(testFile);
        assert.strictEqual(result.valid, false, 'Should reject invalid extension');
        assert(result.error.includes('Invalid image extension'), 'Should have correct error message');
        console.log('✓ Test 11: validateImageFile - invalid extension');
        passed++;
    } catch (err) {
        console.error('✗ Test 11 failed:', err.message);
        failed++;
    }

    // Test 12: validateImageFile - empty file
    try {
        const testFile = createTestFile('empty.jpg', 0);
        const result = validateImageFile(testFile);
        assert.strictEqual(result.valid, false, 'Should reject empty file');
        assert(result.error.includes('empty'), 'Should have empty file error');
        console.log('✓ Test 12: validateImageFile - empty file');
        passed++;
    } catch (err) {
        console.error('✗ Test 12 failed:', err.message);
        failed++;
    }

    // Test 13: validateImageFile - file too large (warning)
    try {
        const testFile = createTestFile('huge.jpg', 60 * 1024 * 1024); // 60 MB
        const result = validateImageFile(testFile, { maxSizeMB: 50 });
        assert.strictEqual(result.valid, true, 'Should still be valid');
        assert(result.warnings.length > 0, 'Should have warnings');
        assert(result.warnings[0].includes('Large file size'), 'Should have size warning');
        console.log('✓ Test 13: validateImageFile - large file warning');
        passed++;
    } catch (err) {
        console.error('✗ Test 13 failed:', err.message);
        failed++;
    }

    // Test 14: validateImageFile - non-existent file
    try {
        const result = validateImageFile('/nonexistent/image.jpg');
        assert.strictEqual(result.valid, false, 'Should reject non-existent file');
        assert(result.error.includes('not found'), 'Should have not found error');
        console.log('✓ Test 14: validateImageFile - non-existent file');
        passed++;
    } catch (err) {
        console.error('✗ Test 14 failed:', err.message);
        failed++;
    }

    // Test 15: validateVideoFile - valid MP4
    try {
        const testFile = createTestFile('video.mp4', 1024);
        const result = validateVideoFile(testFile);
        assert.strictEqual(result.valid, true, 'Should validate MP4 file');
        console.log('✓ Test 15: validateVideoFile - valid MP4');
        passed++;
    } catch (err) {
        console.error('✗ Test 15 failed:', err.message);
        failed++;
    }

    // Test 16: validateVideoFile - valid WebM
    try {
        const testFile = createTestFile('video.webm', 1024);
        const result = validateVideoFile(testFile);
        assert.strictEqual(result.valid, true, 'Should validate WebM file');
        console.log('✓ Test 16: validateVideoFile - valid WebM');
        passed++;
    } catch (err) {
        console.error('✗ Test 16 failed:', err.message);
        failed++;
    }

    // Test 17: validateVideoFile - invalid extension
    try {
        const testFile = createTestFile('video.avi', 1024);
        const result = validateVideoFile(testFile);
        assert.strictEqual(result.valid, false, 'Should reject invalid extension');
        console.log('✓ Test 17: validateVideoFile - invalid extension');
        passed++;
    } catch (err) {
        console.error('✗ Test 17 failed:', err.message);
        failed++;
    }

    // Test 18: findAllImages - finds images in directory
    try {
        // Clean up previous test files first
        testFiles.forEach(file => {
            try {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            } catch (err) {}
        });
        testFiles = [];

        // Now create test files
        createTestFile('image1.jpg');
        createTestFile('image2.png');
        createTestFile('document.txt'); // Should be ignored
        const images = findAllImages(testDir);
        assert.strictEqual(images.length, 2, `Should find 2 images (found ${images.length})`);
        assert(images.some(img => img.endsWith('image1.jpg')), 'Should find image1.jpg');
        assert(images.some(img => img.endsWith('image2.png')), 'Should find image2.png');
        console.log('✓ Test 18: findAllImages - finds images');
        passed++;
    } catch (err) {
        console.error('✗ Test 18 failed:', err.message);
        failed++;
    }

    // Test 19: findAllImages - nested directories
    try {
        const subDir = path.join(testDir, 'subdir');
        fs.mkdirSync(subDir);
        const nestedImage = path.join(subDir, 'nested.jpg');
        fs.writeFileSync(nestedImage, Buffer.alloc(100));
        testFiles.push(nestedImage);

        const images = findAllImages(testDir);
        assert(images.some(img => img.endsWith('nested.jpg')), 'Should find nested image');
        console.log('✓ Test 19: findAllImages - nested directories');
        passed++;
    } catch (err) {
        console.error('✗ Test 19 failed:', err.message);
        failed++;
    }

    // Test 20: findAllVideos - finds videos in directory
    try {
        // Clean up previous test files
        testFiles.forEach(file => {
            try {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            } catch (err) {}
        });
        testFiles = [];

        createTestFile('video1.mp4');
        createTestFile('video2.webm');
        createTestFile('image.jpg'); // Should be ignored
        const videos = findAllVideos(testDir);
        assert.strictEqual(videos.length, 2, 'Should find 2 videos');
        assert(videos.some(vid => vid.endsWith('video1.mp4')), 'Should find video1.mp4');
        assert(videos.some(vid => vid.endsWith('video2.webm')), 'Should find video2.webm');
        console.log('✓ Test 20: findAllVideos - finds videos');
        passed++;
    } catch (err) {
        console.error('✗ Test 20 failed:', err.message);
        failed++;
    }

    // Summary
    console.log('='.repeat(60));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('✅ All tests passed!\n');
        return true;
    } else {
        console.log(`❌ ${failed} test(s) failed\n`);
        return false;
    }
}

// Run tests
setup();
try {
    const success = runTests();
    cleanup();
    process.exit(success ? 0 : 1);
} catch (err) {
    console.error('Fatal error running tests:', err);
    cleanup();
    process.exit(1);
}
