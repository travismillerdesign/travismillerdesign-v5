// Custom PostCSS plugin to add vh fallbacks for dvh/svh/lvh units
const dvhFallbackPlugin = {
  postcssPlugin: 'dvh-fallback',
  Declaration(decl) {
    // Check if the declaration value contains modern viewport units (dvh, svh, lvh, etc.)
    // Only process if it contains the 'd', 's', or 'l' prefix (not already a fallback)
    if (/[dsl]v(h|w|i|b|min|max)/.test(decl.value)) {
      // Create a fallback declaration with standard viewport units
      const fallbackValue = decl.value
        .replace(/(\d+\.?\d*)dvh/g, '$1vh')
        .replace(/(\d+\.?\d*)svh/g, '$1vh')
        .replace(/(\d+\.?\d*)lvh/g, '$1vh')
        .replace(/(\d+\.?\d*)dvw/g, '$1vw')
        .replace(/(\d+\.?\d*)svw/g, '$1vw')
        .replace(/(\d+\.?\d*)lvw/g, '$1vw')
        .replace(/(\d+\.?\d*)dvi/g, '$1vi')
        .replace(/(\d+\.?\d*)svi/g, '$1vi')
        .replace(/(\d+\.?\d*)lvi/g, '$1vi')
        .replace(/(\d+\.?\d*)dvb/g, '$1vb')
        .replace(/(\d+\.?\d*)svb/g, '$1vb')
        .replace(/(\d+\.?\d*)lvb/g, '$1vb')
        .replace(/(\d+\.?\d*)dvmin/g, '$1vmin')
        .replace(/(\d+\.?\d*)svmin/g, '$1vmin')
        .replace(/(\d+\.?\d*)lvmin/g, '$1vmin')
        .replace(/(\d+\.?\d*)dvmax/g, '$1vmax')
        .replace(/(\d+\.?\d*)svmax/g, '$1vmax')
        .replace(/(\d+\.?\d*)lvmax/g, '$1vmax');

      // Only create fallback if the value actually changed
      if (fallbackValue !== decl.value) {
        // Clone the declaration and insert the fallback before the original
        decl.cloneBefore({ value: fallbackValue });
      }
    }
  }
};

module.exports = {
  plugins: [
    // Custom plugin to add vh/vw fallbacks for dvh/svh/lvh viewport units
    // This adds the fallback BEFORE the modern unit for progressive enhancement
    dvhFallbackPlugin,
    // Add modern CSS feature support with automatic fallbacks
    require('postcss-preset-env')({
      stage: 2, // Use stage 2 features (widely supported, stable features)
      features: {
        'custom-properties': false, // Disable CSS custom properties polyfill (we want native support)
      },
      autoprefixer: {
        flexbox: 'no-2009', // Only use modern flexbox (no IE 10-11 support)
      }
    }),
    // Autoprefixer for vendor prefixes
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
