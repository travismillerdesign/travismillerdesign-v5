// optimize-images.js
//
// Image Optimization Build Script
//
// This script is part of the production build process (npm run build).
// It converts source images to optimized formats for web delivery.
//
// What It Does:
// 1. Scans src/assets/ recursively for JPG, PNG, WebP, AVIF images
// 2. Generates two versions: 1080w (mobile) + original size (desktop/retina)
// 3. Converts to WebP format (better compression, ~30% smaller than JPEG)
// 4. Preserves PNG transparency when needed
// 5. Outputs to dist/assets/ maintaining folder structure
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
// - src/_includes/shortcodes.js responsiveImage() generates <picture> elements
// - <picture> uses WebP with JPG fallback for browser compatibility
//
// Performance Impact:
// - 1080w versions load ~50% faster on mobile
// - WebP saves ~30% file size vs JPEG
// - Progressive JPEGs load incrementally (better perceived performance)

const Image = require('@11ty/eleventy-img');
const path = require('path');
const fs = require('fs');

async function optimizeImages() {
    const sourceDir = './src/assets';
    const outputDir = './dist/assets';

    // Recursively find all image files in directory tree
    // Searches for: .jpg, .jpeg, .png, .webp, .avif (case-insensitive)
    // Returns: Array of absolute file paths
    const findImages = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);

        files.forEach((file) => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                // Recurse into subdirectories
                findImages(filePath, fileList);
            } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(file)) {
                fileList.push(filePath);
            }
        });

        return fileList;
    };

    const images = findImages(sourceDir);
    console.log(`Found ${images.length} images to optimize...`);

    for (const imagePath of images) {
        const relativePath = path.relative(sourceDir, imagePath);
        const outputPath = path.join(outputDir, path.dirname(relativePath));

        console.log(`Optimizing: ${relativePath}`);

        // PNG files need special handling to preserve transparency (alpha channel)
        // PNGs get: PNG + WebP formats
        // JPGs get: JPEG + WebP formats
        const isPng = /\.png$/i.test(imagePath);
        const formats = isPng ? ['png', 'webp'] : ['jpeg', 'webp'];

        // Generate optimized image versions using @11ty/eleventy-img
        const metadata = await Image(imagePath, {
            // Widths to generate:
            // - 1080: Mobile/small screens (1080px wide)
            // - null: Original size for desktop/retina displays
            widths: [1080, null],

            formats: formats, // Output formats (WebP + fallback)
            outputDir: outputPath, // Preserve folder structure in dist/assets
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

        // Note: eleventy-img automatically handles image resizing
        // Images larger than specified widths are scaled down
        // Images smaller than specified widths keep original size
    }

    console.log('Image optimization complete!');
}

optimizeImages().catch((err) => {
    console.error('Error optimizing images:', err);
    process.exit(1);
});
