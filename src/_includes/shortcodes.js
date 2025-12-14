// shortcodes.js
//
// Eleventy Template Shortcodes
//
// Custom functions that can be used in Nunjucks templates to generate HTML.
// These shortcodes simplify complex HTML generation and ensure consistency.
//
// Usage in templates:
//   {% responsiveImage "/assets/image.jpg", "Alt text", "className" %}
//   {% lazyVideo "/assets/video.mp4", "Video description", "className" %}
//
// These work with the build optimization scripts:
//   - optimize-images.js generates WebP + fallback images
//   - optimize-videos.js generates WebM + poster images

const path = require('path');

module.exports = function (eleventyConfig) {
    // ========================================
    // RESPONSIVE IMAGE SHORTCODE
    // ========================================
    // Generates <picture> elements with WebP + fallback format
    //
    // Parameters:
    //   src: Path to source image (e.g., "/assets/apple/image.jpg")
    //   alt: Alt text for accessibility
    //   className: Optional CSS class name
    //
    // Output:
    //   <picture>
    //     <source srcset="/assets/image.webp" type="image/webp">
    //     <source srcset="/assets/image.jpg" type="image/jpeg">
    //     <img src="/assets/image.jpg" alt="..." loading="lazy" />
    //   </picture>
    //
    // Browser Behavior:
    //   - Modern browsers use WebP (30% smaller)
    //   - Older browsers fall back to JPG/PNG
    //   - loading="lazy" defers loading until image approaches viewport
    //
    // Special Cases:
    //   - GIFs: Return plain <img> tag (GIFs don't optimize well)
    //   - PNGs: Preserve PNG format for transparency
    eleventyConfig.addShortcode('responsiveImage', function (src, alt, className = '') {
        // Remove leading slash for path manipulation
        // Example: "/assets/image.jpg" → "assets/image.jpg"
        const cleanSrc = src.startsWith('/') ? src.substring(1) : src;

        // Extract file extension and base name
        // Example: "assets/image.jpg" → ext: ".jpg", name: "assets/image"
        const ext = path.extname(cleanSrc);
        const nameWithoutExt = cleanSrc.substring(0, cleanSrc.length - ext.length);

        // GIFs: Don't optimize (animated GIFs don't compress well to WebP)
        // Return plain <img> tag with lazy loading
        if (ext.toLowerCase() === '.gif') {
            return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" />`;
        }

        // Determine output format based on source type
        // PNG → PNG (preserves transparency)
        // JPG → JPG (standard photo format)
        const outputExt = ext.toLowerCase() === '.png' ? '.png' : '.jpg';

        // Build paths to optimized images
        // optimize-images.js generates these during build
        const desktopWebp = `/${nameWithoutExt}.webp`;     // WebP version (modern browsers)
        const desktopImg = `/${nameWithoutExt}${outputExt}`; // Fallback (older browsers)

        // Generate <picture> element with format fallbacks
        // Browser selects first supported format (top to bottom)
        return `<picture>
            <source srcset="${desktopWebp}" type="image/webp">
            <source srcset="${desktopImg}" type="image/${outputExt.substring(1)}">
            <img class="${className}" src="${desktopImg}" alt="${alt}" loading="lazy" />
        </picture>`;
    });

    // ========================================
    // LAZY VIDEO SHORTCODE
    // ========================================
    // Generates <video> elements with lazy loading and format fallbacks
    //
    // Parameters:
    //   src: Path to source MP4 video (e.g., "/assets/video.mp4")
    //   ariaLabel: Accessibility label describing the video
    //   className: Optional CSS class name
    //   attributes: Object with video attributes (autoplay, loop, muted, etc.)
    //
    // Output:
    //   <video poster="image.webp" data-video-lazy autoplay loop muted playsinline>
    //     <source data-src="video.webm" type="video/webm">
    //     <source data-src="video.mp4" type="video/mp4">
    //   </video>
    //
    // Lazy Loading Behavior (via video-lazy-loading.js):
    //   1. Initial load: Shows poster image, video sources not loaded
    //   2. Approaching viewport: data-src promoted to src, video loads
    //   3. In viewport: Plays if autoplay enabled
    //   4. Out of viewport: Pauses to save resources
    //
    // Format Strategy:
    //   - WebM: Modern format, 30-50% smaller than MP4
    //   - MP4: Fallback for older browsers
    //   - Poster: WebP image from first frame (shows during load)
    //
    // Default Attributes:
    //   - autoplay: true (plays when visible)
    //   - loop: true (restarts when finished)
    //   - muted: true (required for autoplay in most browsers)
    //   - playsinline: true (plays inline on iOS, not fullscreen)
    //   - controls: false (no playback controls, background video)
    eleventyConfig.addShortcode('lazyVideo', function (src, ariaLabel = '', className = '', attributes = {}) {
        // Remove leading slash for path manipulation
        // Example: "/assets/video.mp4" → "assets/video.mp4"
        const cleanSrc = src.startsWith('/') ? src.substring(1) : src;

        // Extract file extension and base name
        // Example: "assets/video.mp4" → ext: ".mp4", name: "assets/video"
        const ext = path.extname(cleanSrc);
        const nameWithoutExt = cleanSrc.substring(0, cleanSrc.length - ext.length);

        // Build paths to optimized video assets
        // optimize-videos.js generates these during build
        const videoWebm = `/${nameWithoutExt}.webm`;  // WebM version (better compression)
        const videoMp4 = src;                          // Original MP4 (fallback)
        const posterWebp = `/${nameWithoutExt}.webp`; // Poster image (first frame)

        // Process video attributes with defaults
        // All attributes default to true except controls (defaults false)
        // Can be overridden: {% lazyVideo "path", "", "", {autoplay: false} %}
        const autoplay = attributes.autoplay !== false;        // Auto-play when visible
        const loop = attributes.loop !== false;                // Loop continuously
        const muted = attributes.muted !== false;              // Muted (required for autoplay)
        const playsinline = attributes.playsinline !== false;  // Inline on iOS
        const controls = attributes.controls === true;         // Playback controls

        // Generate <video> element with lazy loading markup
        // data-src (instead of src) prevents immediate loading
        // video-lazy-loading.js promotes data-src → src when needed
        return `<video ${className ? `class="${className}"` : ''} ${autoplay ? 'autoplay' : ''} ${loop ? 'loop' : ''} ${muted ? 'muted' : ''} ${playsinline ? 'playsinline' : ''} ${controls ? 'controls' : ''} ${ariaLabel ? `aria-label="${ariaLabel}"` : ''} poster="${posterWebp}" data-video-lazy><source data-src="${videoWebm}" type="video/webm"><source data-src="${videoMp4}" type="video/mp4"></video>`;
    });
};
