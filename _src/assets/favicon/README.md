# Favicon Assets

This folder contains all favicon and app icon assets for travismillerdesign.com.

## What's Here

### Browser Favicons
- `favicon.ico` - Classic favicon for legacy browser support (ICO format, multi-resolution, 15KB)
- `favicon.svg` - Modern SVG favicon for vector display (21KB)
- `favicon-96x96.png` - Standard PNG favicon for browser tabs (96×96px, 2.6KB)

### Mobile & App Icons
- `apple-touch-icon.png` - iOS home screen icon (180×180px, 5KB)
- `web-app-manifest-192x192.png` - Android home screen icon (192×192px, 5.5KB)
- `web-app-manifest-512x512.png` - Android home screen icon, high-res (512×512px, 21KB)

### Configuration Files
- `site.webmanifest` - PWA manifest for Android "Add to Home Screen" functionality

## Brand Colors

The favicon design follows the site's minimal aesthetic:
- **Background**: White (#ffffff)
- **Foreground**: Black (#000000)
- **Theme color**: White (#ffffff)

## Where They're Used

All favicon files are copied to the site root (`/`) during build:

```
_src/assets/favicon/favicon.ico → _site/favicon.ico
_src/assets/favicon/favicon.svg → _site/favicon.svg
_src/assets/favicon/favicon-96x96.png → _site/favicon-96x96.png
... and so on
```

This is configured in `.eleventy.js` using passthrough copy.

## HTML Implementation

Favicon meta tags are in `_src/_includes/base.html`:

```html
<!-- Favicons -->
<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

## How to Update Favicons

**Important**: Favicon generation is NOT automated. All updates must be done manually.

### To update favicons:

1. **Create new favicon assets** using your preferred tool:
   - [RealFaviconGenerator](https://realfavicongenerator.net/) - Generates complete set from one image
   - [Favicon.io](https://favicon.io/) - Simple generator with text/emoji/image options
   - Manual creation in design tool (Figma, Sketch, etc.)

2. **Replace files** in `_src/assets/favicon/` with new versions
   - Keep the same filenames
   - Maintain the same dimensions for each file
   - Ensure color theme consistency

3. **Update configuration files** if needed:
   - `site.webmanifest` - PWA name, description, colors

4. **Test** after building:
   ```bash
   npm run build
   ```
   - Check `_site/` root for all favicon files
   - Test in multiple browsers (Chrome, Firefox, Safari, Edge)
   - Test "Add to Home Screen" on iOS and Android

## Browser Compatibility

| File | Used By |
|------|---------|
| `favicon.ico` | Legacy browsers (IE11), fallback |
| `favicon.svg` | Modern browsers with SVG support (Chrome, Firefox, Safari, Edge) |
| `favicon-96x96.png` | Modern browsers, standard resolution |
| `apple-touch-icon.png` | iOS Safari, "Add to Home Screen" |
| `web-app-manifest-192x192.png` | Android Chrome, "Add to Home Screen" |
| `web-app-manifest-512x512.png` | Android Chrome, high-res "Add to Home Screen" |
| `site.webmanifest` | PWA support (Android, desktop) |

## Notes

- **No build automation**: Favicons are not generated or optimized by the build process
- **Manual updates only**: All favicon changes must be done by hand
- **Root-level serving**: Favicons must be served from `/` (not `/assets/`) for browser compatibility
- **Size requirements**: Changing file dimensions may break browser compatibility
