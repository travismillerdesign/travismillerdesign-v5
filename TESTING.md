# Testing & Validation Guide

This document describes the testing infrastructure and validation tools added to ensure code quality and catch bugs early.

## Overview

Comprehensive testing and validation has been added to:
- ✅ Validate assets before building
- ✅ Test asset optimization scripts
- ✅ Test shortcode HTML generation
- ✅ Catch bugs and edge cases early
- ✅ Provide clear error messages and warnings

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites
```bash
# Asset validator tests (20 tests)
npm run test:validator

# Shortcode tests (20 tests)
npm run test:shortcodes
```

### Validate Assets
```bash
# Validate all assets before building
npm run validate:assets
```

This runs automatically as part of `npm run build` via the `prebuild` script.

## Test Coverage

### Asset Validator Tests (`tests/asset-validator.test.js`)

Tests the `lib/asset-validator.js` utility:

**File Validation:**
- ✅ File existence checking
- ✅ Directory validation
- ✅ File vs directory detection
- ✅ Non-existent file handling

**File Size Utilities:**
- ✅ Byte size formatting (B, KB, MB, GB)
- ✅ File size calculations
- ✅ Non-accessible file handling

**Image Validation:**
- ✅ Valid JPG/PNG/WebP/AVIF/GIF files
- ✅ Invalid file extensions
- ✅ Empty file detection
- ✅ Large file warnings (>50MB)
- ✅ Non-existent file errors

**Video Validation:**
- ✅ Valid MP4/WebM/MOV files
- ✅ Invalid file extensions
- ✅ Empty file detection
- ✅ Large file warnings (>100MB)
- ✅ Non-existent file errors

**File Discovery:**
- ✅ Recursive image scanning
- ✅ Recursive video scanning
- ✅ Nested directory traversal
- ✅ File type filtering

### Shortcode Tests (`tests/shortcodes.test.js`)

Tests the Eleventy shortcodes in `_src/_includes/shortcodes.js`:

**responsiveImage Shortcode:**
- ✅ Basic JPG generation
- ✅ PNG format preservation
- ✅ GIF format (no optimization)
- ✅ WebP + fallback sources
- ✅ Path normalization (with/without leading slash)
- ✅ Empty src error handling
- ✅ Missing alt text warnings
- ✅ Optional className parameter
- ✅ JPEG to JPG extension conversion
- ✅ Multiple source formats in `<picture>` element
- ✅ Correct MIME types

**lazyVideo Shortcode:**
- ✅ Basic MP4 generation
- ✅ WebM + MP4 sources
- ✅ Poster image generation
- ✅ Default attributes (autoplay, loop, muted, playsinline)
- ✅ Custom attribute overrides
- ✅ Controls enable/disable
- ✅ Lazy loading via `data-src`
- ✅ Path normalization
- ✅ Empty src error handling
- ✅ Missing aria-label warnings
- ✅ Optional className parameter
- ✅ Multiple video sources

## Asset Validation

The `validate-assets.js` script runs before every build to catch issues early:

### What It Checks

1. **Directory Structure**
   - Source directory exists (`_src/assets/`)
   - Directory is readable

2. **FFmpeg Availability**
   - FFmpeg is installed
   - FFmpeg is in system PATH
   - Required for video optimization

3. **Image Files**
   - File exists and is readable
   - Valid image extension (.jpg, .jpeg, .png, .webp, .avif, .gif)
   - File is not empty (0 bytes)
   - File size warnings for files >50MB

4. **Video Files**
   - File exists and is readable
   - Valid video extension (.mp4, .webm, .mov)
   - File is not empty (0 bytes)
   - File size warnings for files >100MB

5. **Total Size**
   - Calculates total asset size
   - Warns if total exceeds 500MB

### Exit Codes

- `0` - All validations passed
- `1` - Validation errors (build should not proceed)
- `2` - Warnings only (build can proceed)

### Example Output

```
🔍 Starting Asset Validation

============================================================

📁 Checking source directory...
✓ Source directory exists: ./_src/assets

🎬 Checking FFmpeg availability...
✓ FFmpeg is available

🔎 Scanning for assets...
Found 141 images and 25 videos

🖼️  Validating images...
------------------------------------------------------------
✓ All 141 images are valid

🎬 Validating videos...
------------------------------------------------------------
✓ All 25 videos are valid

📊 Asset Statistics
------------------------------------------------------------
Total assets: 141 images + 25 videos
Total size: 436.5 MB

============================================================
📋 Validation Summary
============================================================
✅ All validations passed! Assets are ready for optimization.
```

## Error Handling Improvements

### optimize-images.js

**Before:**
- No validation of source directory
- No error handling for individual images
- Silent failures
- No progress indicators

**After:**
- ✅ Source directory validation
- ✅ Per-image validation and error handling
- ✅ Clear error messages with file paths
- ✅ Progress indicators with emoji
- ✅ Final summary with success/error counts
- ✅ File size reporting
- ✅ Graceful handling of invalid files
- ✅ Verbose mode with stack traces

### optimize-videos.js

**Before:**
- No FFmpeg availability check
- Basic error handling
- Could hang on corrupted videos
- Race conditions with temp files

**After:**
- ✅ FFmpeg availability check at startup
- ✅ Timeout protection (30s poster, 10min WebM)
- ✅ Unique temp file names (timestamp-based)
- ✅ Per-video validation
- ✅ Graceful degradation (continues on partial failure)
- ✅ Clear error messages
- ✅ Progress indicators
- ✅ File size reporting with savings calculation
- ✅ Verification of output files

### shortcodes.js

**Before:**
- No input validation
- No file existence checking
- No warnings for missing alt text/aria-labels
- Silent failures

**After:**
- ✅ Input parameter validation
- ✅ Empty src error handling
- ✅ File existence warnings (build-time)
- ✅ Missing alt text warnings
- ✅ Missing aria-label warnings
- ✅ Invalid extension warnings
- ✅ Duplicate warning prevention
- ✅ Helpful error messages with expected paths

## Console Output

All scripts now provide clear, color-coded console output:

- 🖼️ / 🎬 - Process indicators
- ✅ / ✓ - Success messages
- ⚠️ - Warnings (non-fatal issues)
- ❌ - Errors (fatal issues)
- 📊 - Statistics and summaries
- 🔧 - Processing indicators

Example:
```
🔧 Optimizing: apple/hero-image.jpg (2.3 MB)
   ✓ Generated jpeg + webp formats (34% total size reduction)
```

## Edge Cases Handled

### Image Optimization
- Empty files (0 bytes)
- Corrupted images
- Very large files (>50MB warning)
- Missing source directory
- Permission errors
- Invalid file extensions
- Directory structure creation

### Video Optimization
- FFmpeg not installed
- Corrupted video files
- Timeout on long videos
- Empty output files
- Temp file cleanup failures
- Concurrent build conflicts
- Missing poster frames
- WebM conversion failures

### Shortcodes
- Empty src attributes
- Missing alt text (accessibility)
- Missing aria-labels (accessibility)
- File paths with/without leading slash
- Non-existent files
- Invalid file extensions
- GIF special handling (no optimization)

## Adding New Tests

### Asset Validator Tests

Add tests to `tests/asset-validator.test.js`:

```javascript
// Test N: Description
try {
    // Test setup
    const result = someFunction();

    // Assertions
    assert.strictEqual(result, expected, 'Error message');

    console.log('✓ Test N: Description');
    passed++;
} catch (err) {
    console.error('✗ Test N failed:', err.message);
    failed++;
}
```

### Shortcode Tests

Add tests to `tests/shortcodes.test.js`:

```javascript
// Test N: Description
try {
    const result = shortcodeName('arg1', 'arg2');
    assert(result.includes('expected'), 'Error message');
    console.log('✓ Test N: Description');
    passed++;
} catch (err) {
    console.error('✗ Test N failed:', err.message);
    failed++;
}
```

## Continuous Integration

The tests and validation are designed to work in CI/CD environments:

1. **Pre-build Validation** (`npm run validate:assets`)
   - Runs automatically via `prebuild` script
   - Fails build if assets are invalid
   - Warns but continues if FFmpeg missing (can be installed separately)

2. **Tests** (`npm test`)
   - All tests are self-contained
   - No external dependencies beyond Node.js built-ins
   - Clean up temporary files
   - Exit with proper status codes

3. **Build Process**
   ```bash
   npm run build
   # 1. Compiles SCSS
   # 2. Validates assets (validate:assets)
   # 3. Generates HTML (eleventy)
   # 4. Optimizes images (optimize:images)
   # 5. Optimizes videos (optimize:videos)
   ```

## Troubleshooting

### "FFmpeg not found"

**Problem:** Asset validation fails with FFmpeg error.

**Solution:** Install FFmpeg:
- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt-get install ffmpeg`
- Windows: Download from https://ffmpeg.org/download.html

### Tests Failing

**Problem:** Tests fail unexpectedly.

**Solution:**
1. Check Node.js version (requires Node 14+)
2. Run tests in verbose mode: `VERBOSE=1 npm test`
3. Check for permission issues
4. Ensure no other process is using test directories

### Asset Validation Warnings

**Problem:** Build shows warnings about large files.

**Solution:**
- Warnings don't stop the build
- Consider compressing large images/videos before adding to _src/
- Review file sizes: `npm run validate:assets`

### Build Fails on Asset Validation

**Problem:** Build stops with asset validation errors.

**Solution:**
1. Check error messages for specific files
2. Validate assets manually: `npm run validate:assets`
3. Fix reported issues (missing files, empty files, etc.)
4. Re-run build

## Best Practices

1. **Run Tests Before Committing**
   ```bash
   npm test
   ```

2. **Validate Assets Before Building**
   ```bash
   npm run validate:assets
   ```

3. **Check Build Output**
   - Review warnings for potential issues
   - Check file size savings
   - Verify all assets processed

4. **Use Verbose Mode for Debugging**
   ```bash
   VERBOSE=1 npm run build
   ```

5. **Add Tests for New Features**
   - Add test cases when adding new shortcodes
   - Test edge cases and error conditions
   - Ensure proper error messages

## Files Added/Modified

### New Files
- `lib/asset-validator.js` - Asset validation utilities
- `tests/asset-validator.test.js` - Asset validator test suite (20 tests)
- `tests/shortcodes.test.js` - Shortcode test suite (20 tests)
- `tests/run-all-tests.js` - Test runner
- `validate-assets.js` - Pre-build asset validation script
- `TESTING.md` - This file

### Modified Files
- `optimize-images.js` - Added error handling, validation, logging
- `optimize-videos.js` - Added error handling, validation, timeouts, logging
- `_src/_includes/shortcodes.js` - Added input validation, warnings, error handling
- `package.json` - Added test scripts, updated prebuild script

## Summary

This testing infrastructure provides:
- **40 automated tests** covering critical functionality
- **Pre-build validation** to catch errors early
- **Comprehensive error handling** with clear messages
- **Edge case protection** for robust builds
- **Developer-friendly output** with progress indicators
- **CI/CD ready** with proper exit codes

All tests pass successfully, and the codebase is now more maintainable and reliable.
