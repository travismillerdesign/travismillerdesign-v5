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

async function optimizeVideos() {
    const sourceDir = './src/assets';
    const outputDir = './dist/assets';

    // Recursively find all MP4 video files in directory tree
    // Returns: Array of absolute file paths
    const findVideos = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);

        files.forEach((file) => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                // Recurse into subdirectories
                findVideos(filePath, fileList);
            } else if (/\.mp4$/i.test(file)) {
                fileList.push(filePath);
            }
        });

        return fileList;
    };

    const videos = findVideos(sourceDir);
    console.log(`Found ${videos.length} MP4 videos to process...`);

    // Process each video file
    for (const videoPath of videos) {
        const relativePath = path.relative(sourceDir, videoPath);
        const outputPath = path.join(outputDir, path.dirname(relativePath));
        const ext = path.extname(videoPath);
        const baseName = path.basename(videoPath, ext);

        console.log(`\nProcessing: ${relativePath}`);

        // Ensure output directory exists
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        // STEP 1: Extract poster frame from video
        // Takes a snapshot at 0.5 seconds (avoids potential black frames at 0.0s)
        console.log(`  - Extracting poster frame...`);
        const tempPosterPath = await extractPosterFrame(videoPath, baseName);

        // STEP 2: Optimize poster image
        // Generates WebP + JPEG versions (same as image optimization)
        console.log(`  - Generating optimized poster images...`);
        await generateOptimizedPosters(tempPosterPath, outputPath, baseName);

        // Clean up temporary poster file (work done in OS temp directory)
        if (fs.existsSync(tempPosterPath)) {
            fs.unlinkSync(tempPosterPath);
        }

        // STEP 3: Convert MP4 to WebM format
        // Only convert if WebM doesn't already exist in source directory
        // (allows manual WebM files to skip conversion)
        const sourceWebm = videoPath.replace(/\.mp4$/i, '.webm');
        if (!fs.existsSync(sourceWebm)) {
            console.log(`  - Converting to WebM format...`);
            const webmOutputPath = path.join(outputPath, `${baseName}.webm`);
            await convertToWebM(videoPath, webmOutputPath);
        } else {
            console.log(`  - WebM already exists in source, skipping conversion`);
        }
    }

    console.log('\n✓ Video optimization complete!');
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
        const tempPosterPath = path.join(tempDir, `${baseName}-poster.jpg`);

        ffmpeg(videoPath)
            .screenshots({
                timestamps: ['0.5'], // Extract at 0.5s (avoids black/loading frames at 0.0s)
                filename: `${baseName}-poster.jpg`,
                folder: tempDir,
                size: '?x1080' // Maintain aspect ratio, max height 1080px (matches image optimization)
            })
            .on('end', () => {
                resolve(tempPosterPath);
            })
            .on('error', (err) => {
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
            console.log(`    WebM already exists: ${path.basename(outputPath)}`);
            resolve();
            return;
        }

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
                console.log(`    FFmpeg command: ${commandLine}`);
            })
            .on('progress', (progress) => {
                // Show encoding progress percentage
                if (progress.percent) {
                    process.stdout.write(`\r    Progress: ${Math.round(progress.percent)}%`);
                }
            })
            .on('end', () => {
                process.stdout.write('\r');
                // Calculate file size savings
                const inputSize = fs.statSync(inputPath).size;
                const outputSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
                const savings = outputSize > 0 ? Math.round((1 - outputSize / inputSize) * 100) : 0;
                console.log(`    ✓ WebM created (${savings}% smaller than MP4)`);
                resolve();
            })
            .on('error', (err) => {
                // Don't fail entire build if one video fails
                // Just skip WebM and continue with MP4 only
                console.error(`\n    Warning: Failed to convert to WebM: ${err.message}`);
                console.log(`    Continuing with MP4 only...`);
                resolve(); // Resolve (not reject) to continue build
            })
            .run();
    });
}

optimizeVideos().catch((err) => {
    console.error('Error optimizing videos:', err);
    process.exit(1);
});
