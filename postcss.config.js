module.exports = {
  plugins: [
    require('autoprefixer'),
    // Minify CSS for production builds
    // Removes comments, whitespace, and optimizes output
    // Only runs when NODE_ENV=production
    ...(process.env.NODE_ENV === 'production' ? [require('cssnano')({
      preset: ['default', {
        discardComments: {
          removeAll: true  // Remove all comments including special comments
        }
      }]
    })] : [])
  ]
}
