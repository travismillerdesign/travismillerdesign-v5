// optimize-videos.js
const ffmpeg = require('fluent-ffmpeg');
const Image = require('@11ty/eleventy-img');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function optimizeVideos() {
    const sourceDir = './src/assets';
    const outputDir = './dist/assets';

    // Find all MP4 files recursively
    const findVideos = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);

        files.forEach((file) => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                findVideos(filePath, fileList);
            } else if (/\.mp4$/i.test(file)) {
                fileList.push(filePath);
            }
        });

        return fileList;
    };

    const videos = findVideos(sourceDir);
    console.log(`Found ${videos.length} MP4 videos to process...`);

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

        // 1. Extract poster frame
        console.log(`  - Extracting poster frame...`);
        const tempPosterPath = await extractPosterFrame(videoPath, baseName);

        // 2. Generate optimized poster images (WebP + JPEG)
        console.log(`  - Generating optimized poster images...`);
        await generateOptimizedPosters(tempPosterPath, outputPath, baseName);

        // Clean up temp poster file
        if (fs.existsSync(tempPosterPath)) {
            fs.unlinkSync(tempPosterPath);
        }

        // 3. Convert to WebM if it doesn't already exist in source
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
 * Extract first frame from video as poster image
 */
function extractPosterFrame(videoPath, baseName) {
    return new Promise((resolve, reject) => {
        const tempDir = os.tmpdir();
        const tempPosterPath = path.join(tempDir, `${baseName}-poster.jpg`);

        ffmpeg(videoPath)
            .screenshots({
                timestamps: ['0.5'], // Extract frame at 0.5 seconds to avoid black frames
                filename: `${baseName}-poster.jpg`,
                folder: tempDir,
                size: '?x1080' // Maintain aspect ratio, max height 1080px
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
 * Generate optimized poster images using eleventy-img
 */
async function generateOptimizedPosters(sourcePath, outputDir, baseName) {
    try {
        await Image(sourcePath, {
            widths: [1080, null], // 1080w and original size
            formats: ['jpeg', 'webp'],
            outputDir: outputDir,
            useCache: false,
            filenameFormat: function (id, src, width, format, options) {
                // Generate filenames: baseName.jpg and baseName.webp (no width suffix for posters)
                return `${baseName}.${format === 'jpeg' ? 'jpg' : format}`;
            },
            jpegOptions: {
                quality: 85,
                progressive: true,
            },
            webpOptions: {
                quality: 85,
            },
        });
    } catch (err) {
        console.error(`    Warning: Failed to generate poster images: ${err.message}`);
    }
}

/**
 * Convert MP4 to WebM using VP9 codec
 */
function convertToWebM(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        // Check if output already exists
        if (fs.existsSync(outputPath)) {
            console.log(`    WebM already exists: ${path.basename(outputPath)}`);
            resolve();
            return;
        }

        ffmpeg(inputPath)
            .videoCodec('libvpx-vp9')
            .addOption('-crf', '32') // Quality level (lower = better quality, higher = smaller file)
            .addOption('-b:v', '0') // Variable bitrate
            .addOption('-row-mt', '1') // Enable row-based multithreading
            .audioCodec('libopus')
            .audioBitrate('128k')
            .format('webm')
            .output(outputPath)
            .on('start', (commandLine) => {
                console.log(`    FFmpeg command: ${commandLine}`);
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    process.stdout.write(`\r    Progress: ${Math.round(progress.percent)}%`);
                }
            })
            .on('end', () => {
                process.stdout.write('\r');
                const inputSize = fs.statSync(inputPath).size;
                const outputSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
                const savings = outputSize > 0 ? Math.round((1 - outputSize / inputSize) * 100) : 0;
                console.log(`    ✓ WebM created (${savings}% smaller than MP4)`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`\n    Warning: Failed to convert to WebM: ${err.message}`);
                console.log(`    Continuing with MP4 only...`);
                resolve(); // Don't fail the whole process, just skip WebM
            })
            .run();
    });
}

optimizeVideos().catch((err) => {
    console.error('Error optimizing videos:', err);
    process.exit(1);
});
