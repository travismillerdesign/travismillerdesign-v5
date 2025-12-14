// optimize-videos.js
//
// Video Optimization Build Script
//
// This script is part of the production build process (npm run build).
// It optimizes videos for web delivery with better compression and faster loading.
//
// What It Does:
// 1. Scans src/assets/ recursively for .mp4 video files
// 2. Extracts first frame as poster image (for <video poster> attribute)
// 3. Generates optimized poster images (WebP + JPEG)
// 4. Converts MP4 to WebM format (VP9 codec, ~30-50% smaller file size)
// 5. Outputs to dist/assets/ maintaining folder structure
//
// Video Format Strategy:
// - WebM (VP9): Modern format, superior compression, supported by 95% of browsers
// - MP4 (H.264): Fallback for older browsers/Safari
// - Both formats included in <video> tag via lazyVideo shortcode
//
// Poster Image Strategy:
// - Extracted from video at 0.5 seconds (avoids black first frames)
// - Generated in WebP + JPEG formats
// - 1080px max height (matches mobile image optimization)
// - Used as video placeholder before playback (saves bandwidth)
//
// Performance Impact:
// - WebM saves 30-50% file size vs MP4
// - Poster images provide instant visual feedback
// - VP9 codec uses row-based multithreading (faster encoding)
//
// Used With:
// - src/_includes/shortcodes.js lazyVideo() generates <video> elements
// - src/scripts/video-lazy-loading.js handles lazy loading

const ffmpeg = require('fluent-ffmpeg');
const Image = require('@11ty/eleventy-img');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { validateDirectory, validateVideoFile, findAllVideos, getFileSize, checkFFmpegAvailable } = require('./lib/asset-validator');

async function optimizeVideos() {
    const sourceDir = './src/assets';
    const outputDir = './dist/assets';

    console.log('🎬 Starting video optimization...\n');

    // Check if FFmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
        console.error('❌ Error: FFmpeg is required for video optimization.');
        console.error('   Install FFmpeg from: https://ffmpeg.org/download.html');
        process.exit(1);
    }

    // Validate source directory exists
    if (!validateDirectory(sourceDir)) {
        console.error(`❌ Error: Source directory not found: ${sourceDir}`);
        console.error('   Please create the directory or check the path.');
        process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        console.log(`📁 Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Find all videos using the validator utility
    const videos = findAllVideos(sourceDir).filter(v => /\.mp4$/i.test(v));

    if (videos.length === 0) {
        console.warn('⚠️  Warning: No MP4 videos found to process.');
        console.log('   Video optimization complete (nothing to do).\n');
        return;
    }

    console.log(`Found ${videos.length} MP4 videos to process...\n`);

    let successCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    // Process each video file
    for (const videoPath of videos) {
        const relativePath = path.relative(sourceDir, videoPath);
        const outputPath = path.join(outputDir, path.dirname(relativePath));
        const ext = path.extname(videoPath);
        const baseName = path.basename(videoPath, ext);

        try {
            // Validate video file before processing
            const validation = validateVideoFile(videoPath, { maxSizeMB: 100 });

            if (!validation.valid) {
                console.error(`❌ Error: ${relativePath}`);
                console.error(`   ${validation.error}`);
                errorCount++;
                continue;
            }

            // Log warnings (e.g., large file sizes)
            if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    console.warn(`⚠️  Warning: ${relativePath}`);
                    console.warn(`   ${warning}`);
                    warningCount++;
                });
            }

            console.log(`\n🔧 Processing: ${relativePath} (${getFileSize(videoPath)})`);

            // Ensure output directory exists
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }

            // STEP 1: Extract poster frame from video
            // Takes a snapshot at 0.5 seconds (avoids potential black frames at 0.0s)
            console.log(`  - Extracting poster frame...`);
            let tempPosterPath;
            try {
                tempPosterPath = await extractPosterFrame(videoPath, baseName);
                console.log(`    ✓ Poster frame extracted`);
            } catch (err) {
                console.warn(`    ⚠️  Failed to extract poster frame: ${err.message}`);
                console.warn(`    Continuing without poster image...`);
                warningCount++;
            }

            // STEP 2: Optimize poster image
            // Generates WebP + JPEG versions (same as image optimization)
            if (tempPosterPath) {
                console.log(`  - Generating optimized poster images...`);
                try {
                    await generateOptimizedPosters(tempPosterPath, outputPath, baseName);
                    console.log(`    ✓ Poster images generated`);
                } catch (err) {
                    console.warn(`    ⚠️  Failed to optimize poster: ${err.message}`);
                    warningCount++;
                }

                // Clean up temporary poster file (work done in OS temp directory)
                try {
                    if (fs.existsSync(tempPosterPath)) {
                        fs.unlinkSync(tempPosterPath);
                    }
                } catch (err) {
                    console.warn(`    ⚠️  Failed to clean up temp file: ${err.message}`);
                }
            }

            // STEP 3: Convert MP4 to WebM format
            // Only convert if WebM doesn't already exist in source directory
            // (allows manual WebM files to skip conversion)
            const sourceWebm = videoPath.replace(/\.mp4$/i, '.webm');
            if (!fs.existsSync(sourceWebm)) {
                console.log(`  - Converting to WebM format...`);
                const webmOutputPath = path.join(outputPath, `${baseName}.webm`);
                try {
                    await convertToWebM(videoPath, webmOutputPath);
                } catch (err) {
                    console.warn(`    ⚠️  WebM conversion failed: ${err.message}`);
                    console.warn(`    Continuing with MP4 only...`);
                    warningCount++;
                }
            } else {
                console.log(`  - WebM already exists in source, skipping conversion`);
            }

            successCount++;
        } catch (err) {
            console.error(`❌ Error processing ${relativePath}:`);
            console.error(`   ${err.message}`);
            if (err.stack && process.env.VERBOSE) {
                console.error(`   Stack trace: ${err.stack}`);
            }
            errorCount++;
        }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Video Optimization Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${successCount} videos`);
    if (warningCount > 0) {
        console.log(`⚠️  Warnings: ${warningCount}`);
    }
    if (errorCount > 0) {
        console.log(`❌ Errors: ${errorCount} videos failed`);
    }
    console.log('='.repeat(60) + '\n');

    // Exit with error code if any videos completely failed
    if (errorCount > 0) {
        console.error('⚠️  Some videos failed to process. See errors above.');
        process.exit(1);
    }

    console.log('✨ Video optimization complete!\n');
}

/**
 * Extract Poster Frame from Video
 *
 * Takes a snapshot from the video to use as the poster image.
 * The poster shows while the video loads, improving perceived performance.
 *
 * @param {string} videoPath - Path to source MP4 file
 * @param {string} baseName - Base filename (without extension)
 * @returns {Promise<string>} - Path to extracted poster JPEG in temp directory
 */
function extractPosterFrame(videoPath, baseName) {
    return new Promise((resolve, reject) => {
        const tempDir = os.tmpdir();
        // Add timestamp to temp file to avoid conflicts with concurrent builds
        const timestamp = Date.now();
        const tempPosterPath = path.join(tempDir, `${baseName}-poster-${timestamp}.jpg`);

        // Add timeout to prevent hanging on corrupted videos
        const timeout = setTimeout(() => {
            reject(new Error('Poster extraction timed out after 30 seconds'));
        }, 30000);

        ffmpeg(videoPath)
            .screenshots({
                timestamps: ['0.5'], // Extract at 0.5s (avoids black/loading frames at 0.0s)
                filename: `${baseName}-poster-${timestamp}.jpg`,
                folder: tempDir,
                size: '?x1080' // Maintain aspect ratio, max height 1080px (matches image optimization)
            })
            .on('end', () => {
                clearTimeout(timeout);
                // Verify the file was actually created
                if (fs.existsSync(tempPosterPath)) {
                    resolve(tempPosterPath);
                } else {
                    reject(new Error('Poster frame file was not created'));
                }
            })
            .on('error', (err) => {
                clearTimeout(timeout);
                reject(new Error(`Failed to extract poster frame: ${err.message}`));
            });
    });
}

/**
 * Generate Optimized Poster Images
 *
 * Converts extracted poster frame to web-optimized formats.
 * Uses same optimization pipeline as images (eleventy-img).
 *
 * @param {string} sourcePath - Path to extracted poster JPEG
 * @param {string} outputDir - Output directory for optimized posters
 * @param {string} baseName - Base filename (without extension)
 *
 * Output Files:
 * - baseName.jpg (JPEG fallback, 85% quality, progressive)
 * - baseName.webp (WebP format, ~30% smaller than JPEG)
 *
 * Note: No width suffix added to poster filenames (unlike regular images)
 */
async function generateOptimizedPosters(sourcePath, outputDir, baseName) {
    try {
        await Image(sourcePath, {
            widths: [1080, null], // 1080w and original size
            formats: ['jpeg', 'webp'],
            outputDir: outputDir,
            useCache: false, // Always regenerate
            filenameFormat: function (id, src, width, format, options) {
                // Poster images don't get width suffix
                // Examples: video-name.jpg, video-name.webp
                return `${baseName}.${format === 'jpeg' ? 'jpg' : format}`;
            },
            jpegOptions: {
                quality: 85,        // Match image optimization quality
                progressive: true,  // Load progressively (better UX)
            },
            webpOptions: {
                quality: 85,        // Match JPEG quality
            },
        });
    } catch (err) {
        console.error(`    Warning: Failed to generate poster images: ${err.message}`);
    }
}

/**
 * Convert MP4 to WebM Format
 *
 * WebM with VP9 codec provides superior compression compared to H.264 MP4.
 * Typically achieves 30-50% file size reduction with same visual quality.
 *
 * @param {string} inputPath - Path to source MP4 file
 * @param {string} outputPath - Path for output WebM file
 *
 * Encoding Settings:
 * - Video Codec: VP9 (libvpx-vp9) - modern, efficient compression
 * - CRF: 32 (Constant Rate Factor - quality level, 0-63 scale)
 *   * Lower CRF = better quality, larger file
 *   * 32 is good balance for web video
 * - Bitrate: Variable (0 = let encoder decide based on CRF)
 * - Row Multithreading: Enabled (faster encoding on multi-core CPUs)
 * - Audio Codec: Opus (libopus) - modern audio codec, better than MP3/AAC
 * - Audio Bitrate: 128k (sufficient for background video audio)
 *
 * Browser Support:
 * - Chrome, Firefox, Edge: Native VP9 support
 * - Safari: VP9 support added in macOS Big Sur / iOS 14
 * - Fallback: MP4 served to older browsers via <source> tags
 */
function convertToWebM(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        // Skip if WebM already exists (avoid re-encoding)
        if (fs.existsSync(outputPath)) {
            console.log(`    ✓ WebM already exists: ${path.basename(outputPath)}`);
            resolve();
            return;
        }

        // Add timeout to prevent hanging on corrupted videos (10 minutes max)
        const timeout = setTimeout(() => {
            reject(new Error('WebM conversion timed out after 10 minutes'));
        }, 600000);

        ffmpeg(inputPath)
            .videoCodec('libvpx-vp9')       // VP9 video codec
            .addOption('-crf', '32')         // Quality: 32 (good for web, range: 0-63)
            .addOption('-b:v', '0')          // Variable bitrate (encoder decides)
            .addOption('-row-mt', '1')       // Row-based multithreading (faster)
            .audioCodec('libopus')          // Opus audio codec
            .audioBitrate('128k')           // 128kbps audio (sufficient quality)
            .format('webm')                 // WebM container format
            .output(outputPath)
            .on('start', (commandLine) => {
                if (process.env.VERBOSE) {
                    console.log(`    FFmpeg command: ${commandLine}`);
                }
            })
            .on('progress', (progress) => {
                // Show encoding progress percentage
                if (progress.percent) {
                    process.stdout.write(`\r    Progress: ${Math.round(progress.percent)}%`);
                }
            })
            .on('end', () => {
                clearTimeout(timeout);
                process.stdout.write('\r');

                try {
                    // Calculate file size savings
                    const inputSize = fs.statSync(inputPath).size;
                    const outputSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;

                    if (outputSize === 0) {
                        reject(new Error('WebM file was created but has 0 bytes'));
                        return;
                    }

                    const savings = Math.round((1 - outputSize / inputSize) * 100);
                    console.log(`    ✓ WebM created: ${getFileSize(outputPath)} (${savings}% smaller than MP4)`);
                    resolve();
                } catch (err) {
                    reject(new Error(`Failed to verify WebM output: ${err.message}`));
                }
            })
            .on('error', (err) => {
                clearTimeout(timeout);
                // Reject instead of resolve, so caller can handle the error
                reject(new Error(`FFmpeg error: ${err.message}`));
            })
            .run();
    });
}

optimizeVideos().catch((err) => {
    console.error('Error optimizing videos:', err);
    process.exit(1);
});
