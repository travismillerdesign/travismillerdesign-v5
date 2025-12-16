// preprocess-videos.js
//
// Video Preprocessing Script (Run Manually)
//
// This script optimizes videos IN PLACE within _src/assets/
// Run this when you add or update video files, then commit the optimized files to Git.
//
// What It Does:
// 1. Scans _src/assets/ for .mp4 video files
// 2. For each MP4, generates:
//    - .webm version (VP9 codec, ~30-50% smaller)
//    - .webp poster image (first frame)
// 3. Outputs optimized files NEXT TO the source MP4 in _src/assets/
//
// Usage:
//   npm run preprocess:videos
//
// After running:
//   1. Check the output in _src/assets/
//   2. Git add the new .webm and .webp files
//   3. Commit them alongside the source .mp4 files
//
// This ensures both local and Vercel builds use the same optimized files.

const ffmpeg = require('fluent-ffmpeg');
const Image = require('@11ty/eleventy-img');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { validateDirectory, validateVideoFile, findAllVideos, getFileSize, checkFFmpegAvailable } = require('./lib/asset-validator');
const { createProgressTracker, printSummary } = require('./lib/build-reporter');

async function preprocessVideos() {
    const sourceDir = './_src/assets';

    console.log('🎬 Starting video preprocessing...\n');
    console.log('   This will create .webm and .webp files in _src/assets/');
    console.log('   alongside your source .mp4 files.\n');

    // Check if FFmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
        console.error('❌ Error: FFmpeg is required for video preprocessing.');
        console.error('   Install FFmpeg from: https://ffmpeg.org/download.html');
        process.exit(1);
    }

    // Validate source directory exists
    if (!validateDirectory(sourceDir)) {
        console.error(`❌ Error: Source directory not found: ${sourceDir}`);
        console.error('   Please create the directory or check the path.');
        process.exit(1);
    }

    // Find all videos
    const videos = findAllVideos(sourceDir).filter(v => /\.mp4$/i.test(v));

    if (videos.length === 0) {
        console.warn('⚠️  Warning: No MP4 videos found to process.');
        console.log('   Video preprocessing complete (nothing to do).\n');
        return;
    }

    console.log(`Found ${videos.length} MP4 videos to process...\n`);

    const tracker = createProgressTracker();

    // Process each video file
    for (const videoPath of videos) {
        const relativePath = path.relative(sourceDir, videoPath);
        const outputDir = path.dirname(videoPath); // Same directory as source
        const ext = path.extname(videoPath);
        const baseName = path.basename(videoPath, ext);

        try {
            // Validate video file before processing
            const validation = validateVideoFile(videoPath, { maxSizeMB: 100 });

            if (!validation.valid) {
                console.error(`❌ Error: ${relativePath}`);
                console.error(`   ${validation.error}`);
                tracker.error();
                continue;
            }

            console.log(`Processing: ${relativePath}`);

            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const webmPath = path.join(outputDir, `${baseName}.webm`);
            const posterPath = path.join(outputDir, `${baseName}.webp`);

            // Check if files already exist
            const webmExists = fs.existsSync(webmPath);
            const posterExists = fs.existsSync(posterPath);

            if (webmExists && posterExists) {
                console.log(`  ⏭️  Skipping (already optimized)`);
                continue;
            }

            // Step 1: Generate WebM version
            if (!webmExists) {
                console.log(`  🎬 Converting to WebM...`);
                await new Promise((resolve, reject) => {
                    ffmpeg(videoPath)
                        .outputOptions([
                            '-c:v vp9',           // VP9 video codec
                            '-crf 30',            // Quality (lower = better, 30 is good balance)
                            '-b:v 0',             // Variable bitrate
                            '-row-mt 1',          // Row-based multithreading
                            '-an'                 // No audio
                        ])
                        .output(webmPath)
                        .on('end', () => {
                            const webmSize = getFileSize(webmPath);
                            const mp4Size = getFileSize(videoPath);
                            const savings = ((1 - webmSize / mp4Size) * 100).toFixed(1);
                            console.log(`     ✓ WebM created (${savings}% smaller)`);
                            resolve();
                        })
                        .on('error', (err) => {
                            console.error(`     ❌ WebM conversion failed: ${err.message}`);
                            reject(err);
                        })
                        .run();
                });
            } else {
                console.log(`  ✓ WebM already exists`);
            }

            // Step 2: Generate poster image
            if (!posterExists) {
                console.log(`  🖼️  Generating poster image...`);

                // Extract frame using FFmpeg to temp file
                const tempPoster = path.join(os.tmpdir(), `${baseName}-poster.jpg`);

                await new Promise((resolve, reject) => {
                    ffmpeg(videoPath)
                        .screenshots({
                            timestamps: [0.5],
                            filename: path.basename(tempPoster),
                            folder: path.dirname(tempPoster),
                            size: '?x1080'  // Max height 1080px, maintain aspect ratio
                        })
                        .on('end', () => resolve())
                        .on('error', (err) => reject(err));
                });

                // Convert JPEG to WebP using eleventy-img
                await Image(tempPoster, {
                    widths: [null],  // Original width
                    formats: ['webp'],
                    outputDir: outputDir,
                    filenameFormat: () => `${baseName}.webp`
                });

                // Clean up temp file
                if (fs.existsSync(tempPoster)) {
                    fs.unlinkSync(tempPoster);
                }

                console.log(`     ✓ Poster created`);
            } else {
                console.log(`  ✓ Poster already exists`);
            }

            tracker.success();

        } catch (error) {
            console.error(`❌ Error processing ${relativePath}:`);
            console.error(`   ${error.message}`);
            tracker.error();
        }
    }

    console.log('');
    printSummary('Video Preprocessing', 'videos', {
        success: tracker.successes,
        error: tracker.errors,
        warning: tracker.warnings
    });

    // Exit with error code if any videos failed
    if (tracker.errors > 0) {
        console.error('\n⚠️  Some videos failed to process. Please fix errors and try again.');
        process.exit(1);
    }

    console.log('\n✅ Video preprocessing complete!');
    console.log('\nNext steps:');
    console.log('  1. Review the generated .webm and .webp files in _src/assets/');
    console.log('  2. Add them to Git: git add _src/assets/**/*.webm _src/assets/**/*.webp');
    console.log('  3. Commit them: git commit -m "Add optimized video files"');
}

// Run the preprocessing
preprocessVideos().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
