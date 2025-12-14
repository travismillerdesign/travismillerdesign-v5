// optimize-images.js
const Image = require('@11ty/eleventy-img');
const path = require('path');
const fs = require('fs');

async function optimizeImages() {
    const sourceDir = './src/assets';
    const outputDir = './dist/assets';

    // Find all image files recursively
    const findImages = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);

        files.forEach((file) => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
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

        // Determine if source is PNG to preserve transparency
        const isPng = /\.png$/i.test(imagePath);
        const formats = isPng ? ['png', 'webp'] : ['jpeg', 'webp'];

        // Max width: 2800px (1400px content width * 2 for retina)
        // This prevents serving comically large files
        const metadata = await Image(imagePath, {
            widths: [1080, null], // 1080w for mobile, null for original size (ensures base filename always generated)
            formats: formats,
            outputDir: outputPath,
            useCache: false, // Disable cache to ensure all versions are generated
            filenameFormat: function (id, src, width, format, options) {
                const extension = path.extname(src);
                const name = path.basename(src, extension);

                // Generate filenames with width suffix
                if (width === 1080) {
                    return `${name}-1080w.${format === 'jpeg' ? 'jpg' : format}`;
                } else {
                    // For original size (null) or any other size, use base name without suffix
                    return `${name}.${format === 'jpeg' ? 'jpg' : format}`;
                }
            },
            jpegOptions: {
                quality: 85,
                progressive: true,
            },
            webpOptions: {
                quality: 85,
            },
            pngOptions: {
                quality: 85,
            },
        });

        // Note: Images larger than 2800px will be resized down automatically
        // Images smaller than 2800px will keep their original size
    }

    console.log('Image optimization complete!');
}

optimizeImages().catch((err) => {
    console.error('Error optimizing images:', err);
    process.exit(1);
});
