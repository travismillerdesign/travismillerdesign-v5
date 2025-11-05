// .eleventy.js

module.exports = function(eleventyConfig) {
    // Tells Eleventy to use Nunjucks for files ending in .html
    eleventyConfig.setLiquidOptions({
        dynamicPartials: false,
        strictFilters: false, // will prevent crashing on undefined filters
    });

    // Copy CSS and scripts to output during watch mode (passthrough during serve)
    eleventyConfig.addPassthroughCopy("src/styles/project.css");
    eleventyConfig.addPassthroughCopy("src/scripts");

    // Copy and optimize assets folder
    eleventyConfig.addPassthroughCopy("src/assets");

    // Watch the compiled CSS file and trigger browser reload when it changes
    eleventyConfig.addWatchTarget("src/styles/project.css");

    // Enable passthrough copy behavior to work during --serve
    eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

    // Set browser sync to reload on CSS changes
    eleventyConfig.setServerOptions({
        watch: ["dist/styles/project.css"]
    });

    return {
      dir: {
        input: "src",
        output: "dist",
      },
      // THIS IS THE KEY CHANGE
      htmlTemplateEngine: "njk",
      markdownTemplateEngine: "njk"
    };
  };