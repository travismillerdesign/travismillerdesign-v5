// validate-assets.js
//
// Pre-Build Asset Validation Script
//
// Validates all assets in _src/assets/ before building.
// Checks for:
// - File existence and readability
// - File size warnings
// - Corrupted or empty files
// - FFmpeg availability (for video processing)
//
// Usage:
//   node validate-assets.js
//
// Exit codes:
//   0 - All validations passed
//   1 - Validation errors found (build should not proceed)
//   2 - Warnings only (build can proceed but review recommended)

const path = require('path');
const {
    validateDirectory,
    validateImageFile,
    validateVideoFile,
    findAllImages,
    findAllVideos,
    checkFFmpegAvailable,
    checkImageWidth,
    getFileSize
} = require('./lib/asset-validator');
const { createProgressTracker, printSummary, printSeparator } = require('./lib/build-reporter');

async function validateAssets() {
    console.log('🔍 Starting Asset Validation\n');
    printSeparator();

    const sourceDir = './_src/assets';
    const tracker = createProgressTracker();

    // Step 1: Check source directory exists
    console.log('\n📁 Checking source directory...');
    if (!validateDirectory(sourceDir)) {
        console.error(`❌ Error: Source directory not found: ${sourceDir}`);
        console.error('   Please create the directory or check the path.');
        return { errors: 1, warnings: 0 };
    }
    console.log(`✓ Source directory exists: ${sourceDir}`);

    // Step 2: Check FFmpeg availability (for video processing)
    console.log('\n🎬 Checking FFmpeg availability...');
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
        console.error('❌ Error: FFmpeg is not installed or not in PATH');
        console.error('   Video optimization will fail without FFmpeg');
        console.error('   Install from: https://ffmpeg.org/download.html');
        tracker.error();
    } else {
        console.log('✓ FFmpeg is available');
    }

    // Step 3: Find all assets
    console.log('\n🔎 Scanning for assets...');
    const images = findAllImages(sourceDir);
    const videos = findAllVideos(sourceDir).filter(v => /\.mp4$/i.test(v));

    console.log(`Found ${images.length} images and ${videos.length} videos`);

    if (images.length === 0 && videos.length === 0) {
        console.warn('⚠️  Warning: No assets found to validate');
        tracker.warning();
    }

    // Step 4: Validate images
    if (images.length > 0) {
        console.log('\n🖼️  Validating images...');
        console.log('-'.repeat(60));

        const images1080px = [];

        for (const imagePath of images) {
            const relativePath = path.relative(sourceDir, imagePath);
            const validation = validateImageFile(imagePath, { maxSizeMB: 50 });

            if (!validation.valid) {
                console.error(`❌ ${relativePath}`);
                console.error(`   ${validation.error}`);
                tracker.error();
            } else if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    console.warn(`⚠️  ${relativePath}`);
                    console.warn(`   ${warning}`);
                    tracker.warning();
                });
            } else {
                // Check for 1080px width edge case
                const widthCheck = await checkImageWidth(imagePath);
                if (widthCheck.is1080px) {
                    images1080px.push({
                        path: relativePath,
                        width: widthCheck.width,
                        height: widthCheck.height
                    });
                }

                // Only show size for valid files in verbose mode
                if (process.env.VERBOSE) {
                    console.log(`✓ ${relativePath} (${getFileSize(imagePath)})`);
                }
            }
        }

        const counts = tracker.getCounts();
        if (counts.error === 0 && counts.warning === 0) {
            console.log(`✓ All ${images.length} images are valid`);
        }

        // Report images that are exactly 1080px wide (edge case)
        if (images1080px.length > 0) {
            console.log(`\n📏 Found ${images1080px.length} image(s) exactly 1080px wide:`);
            console.log('-'.repeat(60));
            images1080px.forEach(img => {
                console.log(`   ${img.path} (${img.width}x${img.height})`);
            });
            console.log('   ℹ️  These images will be handled by the build process to ensure');
            console.log('   both base and -1080w versions are created for responsive images.');
        }
    }

    // Step 5: Validate videos
    if (videos.length > 0) {
        console.log('\n🎬 Validating videos...');
        console.log('-'.repeat(60));

        for (const videoPath of videos) {
            const relativePath = path.relative(sourceDir, videoPath);
            const validation = validateVideoFile(videoPath, { maxSizeMB: 100 });

            if (!validation.valid) {
                console.error(`❌ ${relativePath}`);
                console.error(`   ${validation.error}`);
                tracker.error();
            } else if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    console.warn(`⚠️  ${relativePath}`);
                    console.warn(`   ${warning}`);
                    tracker.warning();
                });
            } else {
                // Only show size for valid files in verbose mode
                if (process.env.VERBOSE) {
                    console.log(`✓ ${relativePath} (${getFileSize(videoPath)})`);
                }
            }
        }

        const counts = tracker.getCounts();
        if (counts.error === 0 && counts.warning === 0) {
            console.log(`✓ All ${videos.length} videos are valid`);
        }
    }

    // Step 6: Calculate total asset size
    console.log('\n📊 Asset Statistics');
    console.log('-'.repeat(60));

    const fs = require('fs');
    let totalSize = 0;
    [...images, ...videos].forEach(file => {
        try {
            totalSize += fs.statSync(file).size;
        } catch (err) {
            // Skip if file can't be read
        }
    });

    const totalSizeMB = totalSize / (1024 * 1024);
    console.log(`Total assets: ${images.length} images + ${videos.length} videos`);
    console.log(`Total size: ${totalSizeMB.toFixed(1)} MB`);

    if (totalSizeMB > 500) {
        console.warn('⚠️  Warning: Total asset size exceeds 500 MB');
        console.warn('   This may slow down the build process');
        tracker.warning();
    }

    // Final summary
    const finalCounts = tracker.getCounts();
    printSummary('Validation Summary', 'assets', finalCounts, { exitOnWarnings: true });
    printSeparator();

    return { errors: finalCounts.error, warnings: finalCounts.warning };
}

// Run validation
// Note: printSummary handles process.exit() internally based on error/warning counts
validateAssets()
    .catch((err) => {
        console.error('\n❌ Fatal error during validation:', err);
        console.error(err.stack);
        process.exit(1);
    });
