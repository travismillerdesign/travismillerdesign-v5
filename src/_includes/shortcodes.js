// shortcodes.js
const path = require('path');

module.exports = function (eleventyConfig) {
    // Responsive image shortcode
    eleventyConfig.addShortcode('responsiveImage', function (src, alt, className = '') {
        // Remove leading slash if present for path manipulation
        const cleanSrc = src.startsWith('/') ? src.substring(1) : src;

        // Get file path components
        const ext = path.extname(cleanSrc);
        const nameWithoutExt = cleanSrc.substring(0, cleanSrc.length - ext.length);

        // Check if this is a GIF (don't make responsive, just return regular img tag)
        if (ext.toLowerCase() === '.gif') {
            return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" />`;
        }

        // Build paths for different sizes and formats
        const mobile1080wWebp = `/${nameWithoutExt}-1080w.webp`;
        const mobile1080wJpg = `/${nameWithoutExt}-1080w.jpg`;
        const desktopWebp = `/${nameWithoutExt}.webp`;
        const desktopJpg = `/${nameWithoutExt}.jpg`;

        // Generate picture element with sources for different breakpoints
        return `<picture>
            <source media="(max-width: 1079px)" srcset="${mobile1080wWebp}" type="image/webp">
            <source media="(max-width: 1079px)" srcset="${mobile1080wJpg}" type="image/jpeg">
            <source media="(min-width: 1080px)" srcset="${desktopWebp}" type="image/webp">
            <source media="(min-width: 1080px)" srcset="${desktopJpg}" type="image/jpeg">
            <img class="${className}" src="${desktopJpg}" alt="${alt}" loading="lazy" />
        </picture>`;
    });
};
