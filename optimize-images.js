// optimize-images.js
//
// Image Optimization Build Script
//
// This script is part of the production build process (npm run build).
// It converts source images to optimized formats for web delivery.
//
// What It Does:
// 1. Scans _src/assets/ recursively for JPG, PNG, WebP, AVIF images
// 2. Generates two versions: 1080w (mobile) + original size (desktop/retina)
// 3. Converts to WebP format (better compression, ~30% smaller than JPEG)
// 4. Preserves PNG transparency when needed
// 5. Outputs to _site/assets/ maintaining folder structure
//
// Format Strategy:
// - PNG sources → PNG + WebP (preserves transparency)
// - JPG sources → JPG + WebP (better compression)
// - Quality: 85% for all formats (balance of quality vs file size)
//
// File Naming:
// - Original size: image.jpg, image.webp
// - Mobile size: image-1080w.jpg, image-1080w.webp
//
// Used With:
// - _src/_includes/shortcodes.js responsiveImage() generates <picture> elements
// - <picture> uses WebP with JPG fallback for browser compatibility
//
// Performance Impact:
// - 1080w versions load ~50% faster on mobile
// - WebP saves ~30% file size vs JPEG
// - Progressive JPEGs load incrementally (better perceived performance)

const Image = require('@11ty/eleventy-img');
const path = require('path');
const fs = require('fs');
const { validateDirectory, validateImageFile, findAllImages, getFileSize } = require('./lib/asset-validator');
const { createProgressTracker, printSummary } = require('./lib/build-reporter');

async function optimizeImages() {
    const sourceDir = './_src/assets';
    const outputDir = './_site/assets';

    console.log('🖼️  Starting image optimization...\n');

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

    // Find all images using the validator utility
    const images = findAllImages(sourceDir);

    if (images.length === 0) {
        console.warn('⚠️  Warning: No images found to optimize.');
        console.log('   Image optimization complete (nothing to do).\n');
        return;
    }

    console.log(`Found ${images.length} images to optimize...\n`);

    const tracker = createProgressTracker();

    for (const imagePath of images) {
        const relativePath = path.relative(sourceDir, imagePath);
        const outputPath = path.join(outputDir, path.dirname(relativePath));

        try {
            // Validate image file before processing
            const validation = validateImageFile(imagePath, { maxSizeMB: 50 });

            if (!validation.valid) {
                console.error(`❌ Error: ${relativePath}`);
                console.error(`   ${validation.error}`);
                tracker.error();
                continue;
            }

            // Log warnings (e.g., large file sizes)
            if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    console.warn(`⚠️  Warning: ${relativePath}`);
                    console.warn(`   ${warning}`);
                    tracker.warning();
                });
            }

            console.log(`🔧 Optimizing: ${relativePath} (${getFileSize(imagePath)})`);

            // PNG files need special handling to preserve transparency (alpha channel)
            // PNGs get: PNG + WebP formats
            // JPGs get: JPEG + WebP formats
            const isPng = /\.png$/i.test(imagePath);
            const formats = isPng ? ['png', 'webp'] : ['jpeg', 'webp'];

            // Ensure output directory exists
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }

            // Generate optimized image versions using @11ty/eleventy-img
            const metadata = await Image(imagePath, {
                // Widths to generate:
                // - 1080: Mobile/small screens (1080px wide)
                // - null: Original size for desktop/retina displays
                widths: [1080, null],

                formats: formats, // Output formats (WebP + fallback)
                outputDir: outputPath, // Preserve folder structure in _site/assets
                useCache: false, // Always regenerate (ensures consistency)

                // Custom filename generator
                // Examples:
                //   image.jpg → image.jpg, image.webp (original)
                //   image.jpg → image-1080w.jpg, image-1080w.webp (mobile)
                filenameFormat: function (id, src, width, format, options) {
                    const extension = path.extname(src);
                    const name = path.basename(src, extension);

                    if (width === 1080) {
                        // Mobile version: add -1080w suffix
                        return `${name}-1080w.${format === 'jpeg' ? 'jpg' : format}`;
                    } else {
                        // Original size: no suffix
                        return `${name}.${format === 'jpeg' ? 'jpg' : format}`;
                    }
                },

                // Compression settings (quality vs file size tradeoff)
                jpegOptions: {
                    quality: 85,        // 85% quality (good balance)
                    progressive: true,  // Progressive JPEGs load top-to-bottom (better UX)
                },
                webpOptions: {
                    quality: 85,        // Matches JPEG quality
                },
                pngOptions: {
                    quality: 85,        // For PNGs with transparency
                },
            });

            // Edge case: If source image is exactly 1080px wide, eleventy-img only generates
            // the -1080w version. We need to create the base version (without suffix) as well
            // for the responsive image shortcode to work correctly.

            // Check if base version exists for each format
            for (const format of formats) {
                const formatExtension = format === 'jpeg' ? 'jpg' : format;
                const baseName = path.basename(imagePath, path.extname(imagePath));
                const baseFile = path.join(outputPath, `${baseName}.${formatExtension}`);
                const widthFile = path.join(outputPath, `${baseName}-1080w.${formatExtension}`);

                // If base file doesn't exist but width file does, copy it
                if (!fs.existsSync(baseFile) && fs.existsSync(widthFile)) {
                    fs.copyFileSync(widthFile, baseFile);
                }
            }

            // Calculate and log file size savings
            const originalSize = fs.statSync(imagePath).size;
            let totalOutputSize = 0;

            // Sum up all generated files
            Object.values(metadata).forEach(formatArray => {
                formatArray.forEach(file => {
                    if (fs.existsSync(file.outputPath)) {
                        totalOutputSize += fs.statSync(file.outputPath).size;
                    }
                });
            });

            const savings = totalOutputSize > 0 ? Math.round((1 - totalOutputSize / (originalSize * 2)) * 100) : 0;
            console.log(`   ✓ Generated ${formats.join(' + ')} formats (${savings}% total size reduction)`);

            tracker.success();

            // Note: eleventy-img automatically handles image resizing
            // Images larger than specified widths are scaled down
            // Images smaller than specified widths keep original size
        } catch (err) {
            console.error(`❌ Error processing ${relativePath}:`);
            console.error(`   ${err.message}`);
            if (err.stack && process.env.VERBOSE) {
                console.error(`   Stack trace: ${err.stack}`);
            }
            tracker.error();
        }
    }

    // Final summary
    printSummary('Image Optimization Summary', 'images', tracker.getCounts());

    console.log('✨ Image optimization complete!\n');
}

optimizeImages().catch((err) => {
    console.error('Error optimizing images:', err);
    process.exit(1);
});
