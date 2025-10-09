// .eleventy.js

module.exports = function(eleventyConfig) {
    // Set the input (source) directory to 'src'
    // and the output (compiled) directory to 'dist'
    return {
      dir: {
        input: "src",
        output: "dist",
        // The default layout folder is '_includes' inside the input folder
        // so Eleventy will automatically look in 'src/_includes'
      },
    };
  };