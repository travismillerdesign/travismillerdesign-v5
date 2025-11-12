// .eleventy.js

module.exports = function (eleventyConfig) {
    // Register shortcodes
    require('./src/_includes/shortcodes')(eleventyConfig);

    // Tells Eleventy to use Nunjucks for files ending in .html
    eleventyConfig.setLiquidOptions({
        dynamicPartials: false,
        strictFilters: false, // will prevent crashing on undefined filters
    });

    // Copy CSS and scripts to output during watch mode (passthrough during serve)
    eleventyConfig.addPassthroughCopy('src/styles/project.css');
    eleventyConfig.addPassthroughCopy('src/scripts');

    // Copy fonts folder
    eleventyConfig.addPassthroughCopy('src/fonts');

    // Copy assets folder (GIFs and other non-optimized assets)
    // Note: Optimized images are handled by optimize-images.js
    eleventyConfig.addPassthroughCopy('src/assets/**/*.gif');

    // Watch the compiled CSS file and trigger browser reload when it changes
    eleventyConfig.addWatchTarget('src/styles/project.css');

    // Enable passthrough copy behavior to work during --serve
    eleventyConfig.setServerPassthroughCopyBehavior('passthrough');

    // Set browser sync to reload on CSS changes
    eleventyConfig.setServerOptions({
        watch: ['dist/styles/project.css'],
        // Allow access from other devices on the network (e.g., phone)
        host: '0.0.0.0',
        port: 8080,
        showAllHosts: true,
    });

    return {
        dir: {
            input: 'src',
            output: 'dist',
        },
        // THIS IS THE KEY CHANGE
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk',
    };
};
