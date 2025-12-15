// validate-assets.js
//
// Pre-Build Asset Validation Script
//
// Validates all assets in src/assets/ before building.
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

async function validateAssets() {
    console.log('🔍 Starting Asset Validation\n');
    console.log('='.repeat(60));

    const sourceDir = './src/assets';
    let errorCount = 0;
    let warningCount = 0;

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
        errorCount++;
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
        warningCount++;
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
                errorCount++;
            } else if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    console.warn(`⚠️  ${relativePath}`);
                    console.warn(`   ${warning}`);
                    warningCount++;
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

        if (errorCount === 0 && warningCount === 0) {
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
                errorCount++;
            } else if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    console.warn(`⚠️  ${relativePath}`);
                    console.warn(`   ${warning}`);
                    warningCount++;
                });
            } else {
                // Only show size for valid files in verbose mode
                if (process.env.VERBOSE) {
                    console.log(`✓ ${relativePath} (${getFileSize(videoPath)})`);
                }
            }
        }

        if (errorCount === 0 && warningCount === 0) {
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
        warningCount++;
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 Validation Summary');
    console.log('='.repeat(60));

    if (errorCount === 0 && warningCount === 0) {
        console.log('✅ All validations passed! Assets are ready for optimization.');
        return { errors: 0, warnings: 0 };
    } else if (errorCount === 0) {
        console.log(`⚠️  Validation complete with ${warningCount} warning(s)`);
        console.log('   Build can proceed, but review warnings above.');
        return { errors: 0, warnings: warningCount };
    } else {
        console.log(`❌ Validation failed with ${errorCount} error(s) and ${warningCount} warning(s)`);
        console.log('   Please fix errors before building.');
        return { errors: errorCount, warnings: warningCount };
    }
}

// Run validation
validateAssets()
    .then(({ errors, warnings }) => {
        console.log('='.repeat(60) + '\n');

        if (errors > 0) {
            process.exit(1);
        } else if (warnings > 0) {
            process.exit(2);
        } else {
            process.exit(0);
        }
    })
    .catch((err) => {
        console.error('\n❌ Fatal error during validation:', err);
        console.error(err.stack);
        process.exit(1);
    });
