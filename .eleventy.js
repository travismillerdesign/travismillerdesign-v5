// .eleventy.js

module.exports = function(eleventyConfig) {
    // Tells Eleventy to use Nunjucks for files ending in .html
    eleventyConfig.setLiquidOptions({
        dynamicPartials: false,
        strictFilters: false, // will prevent crashing on undefined filters
    });

    eleventyConfig.addPassthroughCopy("src/styles/project.css");

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