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
        // Determine the output extension based on input type
        const outputExt = ext.toLowerCase() === '.png' ? '.png' : '.jpg';

        const desktopWebp = `/${nameWithoutExt}.webp`;
        const desktopImg = `/${nameWithoutExt}${outputExt}`;

        // Simple picture element with WebP and fallback
        // Browser will handle responsive sizing via CSS
        return `<picture>
            <source srcset="${desktopWebp}" type="image/webp">
            <source srcset="${desktopImg}" type="image/${outputExt.substring(1)}">
            <img class="${className}" src="${desktopImg}" alt="${alt}" loading="lazy" />
        </picture>`;
    });

    // Lazy video shortcode
    eleventyConfig.addShortcode('lazyVideo', function (src, ariaLabel = '', className = '', attributes = {}) {
        // Remove leading slash if present for path manipulation
        const cleanSrc = src.startsWith('/') ? src.substring(1) : src;

        // Get file path components
        const ext = path.extname(cleanSrc);
        const nameWithoutExt = cleanSrc.substring(0, cleanSrc.length - ext.length);

        // Build paths for video sources and poster
        const videoWebm = `/${nameWithoutExt}.webm`;
        const videoMp4 = src; // Original MP4 source
        const posterWebp = `/${nameWithoutExt}.webp`;

        // Build attributes (defaults can be overridden)
        const autoplay = attributes.autoplay !== false;
        const loop = attributes.loop !== false;
        const muted = attributes.muted !== false;
        const playsinline = attributes.playsinline !== false;
        const controls = attributes.controls === true;

        // Build the video element with lazy loading
        return `<video ${className ? `class="${className}"` : ''} ${autoplay ? 'autoplay' : ''} ${loop ? 'loop' : ''} ${muted ? 'muted' : ''} ${playsinline ? 'playsinline' : ''} ${controls ? 'controls' : ''} ${ariaLabel ? `aria-label="${ariaLabel}"` : ''} poster="${posterWebp}" data-video-lazy><source data-src="${videoWebm}" type="video/webm"><source data-src="${videoMp4}" type="video/mp4"></video>`;
    });
};
