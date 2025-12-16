// .eleventy.js
//
// Eleventy (11ty) Configuration File
//
// This is a static site generator config that transforms _src/ files into a _site/ website.
// Eleventy processes HTML templates, handles asset copying, and manages the dev server.
//
// Build Process Flow:
// 1. Reads all .html files from _src/ with YAML front matter
// 2. Processes templates using Nunjucks engine (supports layouts, includes, shortcodes)
// 3. Copies static assets (CSS, JS, fonts, images, videos) to _site/
// 4. Generates final static HTML files in _site/
//
// Development Mode (npm run serve):
// - Watches for file changes and rebuilds automatically
// - Runs local server at http://0.0.0.0:8080
// - Live-reloads browser on CSS/HTML changes
// - Accessible from other devices on network (for mobile testing)
//
// Production Build (npm run build):
// - Generates optimized static site in _site/
// - Image/video optimization happens after Eleventy build completes

const rssPlugin = require('@11ty/eleventy-plugin-rss');
const htmlMinifier = require('html-minifier-terser');

module.exports = function (eleventyConfig) {
    // ========================================
    // PLUGINS
    // ========================================
    // RSS plugin provides date formatting filters for sitemap generation
    eleventyConfig.addPlugin(rssPlugin);

    // ========================================
    // CUSTOM SHORTCODES
    // ========================================
    // Register custom template functions (responsiveImage, lazyVideo)
    // These shortcodes are used in .html files like: {% responsiveImage "path", "alt" %}
    // Defined in: _src/_includes/shortcodes.js
    require('./_src/_includes/shortcodes')(eleventyConfig);

    // ========================================
    // TEMPLATE ENGINE SETTINGS
    // ========================================
    // Configure Liquid template engine options (Eleventy default)
    // Note: We actually use Nunjucks (see htmlTemplateEngine below)
    eleventyConfig.setLiquidOptions({
        dynamicPartials: false,
        strictFilters: false, // Prevents build errors from undefined filters
    });

    // ========================================
    // ASSET PASSTHROUGH COPY
    // ========================================
    // Files to copy directly to _site/ without processing
    // These bypass Eleventy's template engine and are copied as-is

    // CSS is compiled directly to _site/styles/ by Sass (no passthrough needed)

    // Copy all JavaScript files (vanilla JS, no bundler)
    eleventyConfig.addPassthroughCopy('_src/scripts');

    // Copy web fonts (PP Mori in WOFF/WOFF2 formats)
    eleventyConfig.addPassthroughCopy('_src/fonts');

    // Copy specific asset types (GIFs, videos, and pre-optimized video files)
    // Note: JPG/PNG/WebP images are optimized separately by optimize-images.js
    // Note: Videos are pre-optimized using 'npm run preprocess:videos' and committed to Git
    eleventyConfig.addPassthroughCopy('_src/assets/**/*.gif');
    eleventyConfig.addPassthroughCopy('_src/assets/**/*.mp4');   // Original MP4 videos
    eleventyConfig.addPassthroughCopy('_src/assets/**/*.webm');  // Pre-optimized WebM videos
    eleventyConfig.addPassthroughCopy('_src/assets/**/*.webp');  // Pre-generated video posters

    // Copy SEO robots.txt to site root
    eleventyConfig.addPassthroughCopy('_src/robots.txt');

    // Copy favicon files to root of _site/
    // Favicons must be at site root (not /assets/) for browser compatibility
    eleventyConfig.addPassthroughCopy({ "_src/assets/favicon/favicon.ico": "favicon.ico" });
    eleventyConfig.addPassthroughCopy({ "_src/assets/favicon/favicon.svg": "favicon.svg" });
    eleventyConfig.addPassthroughCopy({ "_src/assets/favicon/favicon-96x96.png": "favicon-96x96.png" });
    eleventyConfig.addPassthroughCopy({ "_src/assets/favicon/apple-touch-icon.png": "apple-touch-icon.png" });
    eleventyConfig.addPassthroughCopy({ "_src/assets/favicon/site.webmanifest": "site.webmanifest" });
    eleventyConfig.addPassthroughCopy({ "_src/assets/favicon/web-app-manifest-192x192.png": "web-app-manifest-192x192.png" });
    eleventyConfig.addPassthroughCopy({ "_src/assets/favicon/web-app-manifest-512x512.png": "web-app-manifest-512x512.png" });

    // ========================================
    // FILE WATCHING (DEV MODE)
    // ========================================
    // Watch SCSS source files and trigger browser reload when changes are detected
    // The Sass compiler (watch:scss) will automatically compile to _site/styles/project.css
    eleventyConfig.addWatchTarget('_src/styles/**/*.scss');

    // Enable immediate passthrough copying during serve mode (faster dev experience)
    // Without this, copied files would only update on rebuild
    eleventyConfig.setServerPassthroughCopyBehavior('passthrough');

    // ========================================
    // HTML MINIFICATION (PRODUCTION ONLY)
    // ========================================
    // Minify HTML output for production builds
    // Only runs when NODE_ENV=production to keep dev builds fast
    if (process.env.NODE_ENV === 'production') {
        eleventyConfig.addTransform('htmlmin', function (content, outputPath) {
            if (outputPath && outputPath.endsWith('.html')) {
                return htmlMinifier.minify(content, {
                    useShortDoctype: true,
                    removeComments: true,              // Remove all HTML comments
                    collapseWhitespace: true,         // Remove whitespace
                    minifyCSS: true,                  // Minify inline CSS
                    minifyJS: true,                   // Minify inline JavaScript
                    removeAttributeQuotes: true,      // Remove quotes where safe
                    removeEmptyAttributes: true,      // Remove empty attributes
                    removeRedundantAttributes: true,  // Remove redundant attributes
                    removeScriptTypeAttributes: true, // Remove type="text/javascript"
                    removeStyleLinkTypeAttributes: true, // Remove type="text/css"
                    sortAttributes: true,             // Sort attributes for better gzip
                    sortClassName: true,              // Sort class names for better gzip
                });
            }
            return content;
        });
    }

    // ========================================
    // DEV SERVER CONFIGURATION
    // ========================================
    // BrowserSync settings for local development server
    eleventyConfig.setServerOptions({
        watch: ['_site/styles/project.css'], // Reload browser when CSS changes
        host: '0.0.0.0',  // Listen on all network interfaces (allows phone/tablet testing)
        port: 8080,       // Dev server runs at http://localhost:8080
        showAllHosts: true, // Display all network URLs in console (e.g., http://192.168.1.x:8080)
    });

    // ========================================
    // DIRECTORY & ENGINE SETTINGS
    // ========================================
    return {
        dir: {
            input: '_src',    // Source files directory
            output: '_site',  // Generated site output directory
        },
        // Use Nunjucks template engine for .html and .md files
        // This enables template features: layouts, includes, filters, shortcodes
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk',
    };
};
