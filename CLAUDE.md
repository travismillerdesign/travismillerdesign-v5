# CLAUDE.md — travismillerdesign-v5

AI assistant context for the Travis Miller Design portfolio website. This document provides codebase conventions, development workflows, and key architectural patterns.

---

## Project Overview

Static portfolio website for Travis Miller, a Design Systems Designer. Built with Eleventy (11ty) and deployed to Vercel. The site showcases case studies for work at Apple, Google (Beam), Leia, plus branding, motion, and design-code explorations.

**Live site:** https://travismillerdesign.com  
**Stack:** Eleventy v3 · Sass/SCSS (ITCSS) · Vanilla JS · No frontend framework

---

## Directory Structure

```
travismillerdesign-v5/
├── _src/                          # All source files (Eleventy input)
│   ├── _includes/                # Templates and custom shortcodes
│   │   ├── base.html            # Root layout (wraps all pages)
│   │   ├── nav.html             # Site navigation component
│   │   ├── footer.html          # Site footer component
│   │   └── shortcodes.js        # Custom Eleventy shortcode functions
│   ├── work/                     # Case study pages (HTML with Nunjucks)
│   │   ├── leia.html
│   │   ├── apple.html
│   │   ├── google-beam.html
│   │   ├── branding.html
│   │   ├── motion.html
│   │   └── design-code.html
│   ├── assets/                   # Media organized by project slug
│   │   └── favicon/             # Favicons (copied to site root by 11ty)
│   ├── fonts/                    # PP Mori web fonts (WOFF/WOFF2)
│   ├── scripts/                  # Vanilla JS modules (no bundler)
│   │   ├── page-transitions.js
│   │   ├── scroll-animations.js
│   │   ├── video-lazy-loading.js
│   │   ├── case-study-animations.js
│   │   ├── case-study-navigation.js
│   │   ├── image-load-animations.js
│   │   └── p5-mobile-optimizer.js
│   ├── styles/                   # Sass/SCSS (ITCSS architecture)
│   │   ├── project.scss         # Entry point — imports all partials
│   │   ├── settings/            # Variables: colors, fonts, layout, motion, z-index
│   │   ├── utilities/           # Mixins, helpers
│   │   ├── core/                # Base element styles (h1, p, a, etc.)
│   │   └── components/          # UI blocks (header, footer, nav, case-study, etc.)
│   ├── index.html               # Home page
│   └── robots.txt               # SEO robots file
├── _site/                        # Build output — GITIGNORED, never edit directly
├── tests/                        # Test suites (no framework, plain Node.js)
│   ├── run-all-tests.js
│   ├── asset-validator.test.js
│   ├── shortcodes.test.js
│   ├── postcss-dvh.test.js
│   └── build-reporter.test.js
├── hooks/                        # Git hooks (pre-commit runs npm test)
├── lib/                          # Utility libraries
├── .eleventy.js                 # Eleventy configuration
├── postcss.config.js            # PostCSS (autoprefixer, cssnano, dvh fallbacks)
├── eslint.config.js             # ESLint flat config (ES2025+)
├── .prettierrc                  # Prettier formatting rules
├── .editorconfig                # Editor formatting rules
├── vercel.json                  # Vercel deployment config
├── validate-assets.js           # Asset validation script
├── optimize-images.js           # Image → WebP conversion
├── optimize-videos.js           # Video → WebM conversion
├── preprocess-videos.js         # In-place video optimization (run manually)
├── minify-js.js                 # JS minification for production
├── new-case-study.js            # Scaffold new case study
└── list-todos.js                # List all TODO comments in codebase
```

---

## Development Commands

### Start Development Server
```bash
npm run serve          # Compile CSS once, then watch everything (recommended)
npm run serve:full     # Same as serve (alias)
npm run serve:verbose  # Verbose logging for debugging Sass/Eleventy
```
Dev server runs at `http://localhost:8080`. Also accessible from local network for mobile testing (BrowserSync binds to `0.0.0.0`).

### Build for Production
```bash
npm run build
```
Full pipeline: compile + minify CSS → validate assets → generate HTML → minify HTML → minify JS → optimize images → optimize videos.

### CSS Compilation
```bash
npm run compile:scss            # Dev (no minification)
npm run compile:scss:production # Production (minified via cssnano)
npm run watch:scss              # Watch mode
```

### Testing & Linting
```bash
npm test                # Run all test suites
npm run test:validator  # Asset validation tests only
npm run test:shortcodes # Shortcode generation tests only
npm run test:postcss    # PostCSS dvh fallback tests only
npm run lint            # ESLint check
npm run lint:fix        # ESLint auto-fix
```

### Content Authoring
```bash
npm run new:case-study <slug> "<Title>" "<Description>"
# Creates: _src/work/<slug>.html + _src/assets/<slug>/ folder

npm run todos           # List all TODO comments in the codebase
```

### Asset Optimization (run manually when assets change)
```bash
npm run preprocess:videos   # Converts MP4 → WebM + poster WebP in _src/assets/ IN PLACE
                            # Run this when adding/updating videos, then commit the result
npm run optimize:images     # Converts JPG/PNG → WebP (runs automatically in build)
npm run optimize:videos     # Converts MP4 → WebM (runs automatically in build)
npm run validate:assets     # Check assets before build
```

---

## Code Conventions

### Formatting
- **Indentation:** 4 spaces (not tabs)
- **Line endings:** LF
- **Trailing commas:** ES5 style
- **Quotes:** Single quotes in JS
- **Print width:** 100 characters
- **Semicolons:** Required

Enforced by `.prettierrc` and `.editorconfig`.

### JavaScript
- **Vanilla JS only** — no framework, no bundler
- **ES Modules** pattern but loaded as global scripts (no `import/export` in browser files)
- **Classes** for stateful UI components (`PageTransitions`, `P5MobileOptimizer`)
- **DOM APIs:** `querySelector`, `addEventListener`, `classList`, `dataset`
- **IntersectionObserver** for scroll-based interactions (not scroll events)
- **Data attributes** for lazy loading: `data-src`, `data-video-lazy`
- **ESLint target:** ES2025+ with browser globals + Node.js globals for build scripts
- Key rules: no-undef (error), no-unused-vars (warn), prefer-const (warn), no-var (warn)

### CSS / Sass
- **Architecture:** ITCSS (Inverted Triangle CSS)
  1. `settings/` — variables (colors, fonts, layout, motion, z-index, path)
  2. `utilities/` — mixins and helpers
  3. `core/` — base element styles
  4. `components/` — UI component blocks
- **Module system:** `@use` (not `@import`)
- **Breakpoints:** Use mixins `@include breakpoint-up($bp-lg)` / `@include breakpoint-down($bp-sm)`
- **Spacing variables:** `$unit-sm`, `$unit-md`, `$unit-lg`
- **Entry point:** `_src/styles/project.scss` (imports everything)
- **Output:** `_site/styles/project.css` (compiled by Sass, post-processed by PostCSS)

### HTML / Templates
- **Engine:** Nunjucks (`.njk` syntax inside `.html` files)
- **Front matter:** YAML (`layout`, `title`, `description`)
- **Base layout:** All pages extend `_src/_includes/base.html`
- **Shortcodes** (Nunjucks syntax):
  ```html
  {% responsiveImage "path/to/image.jpg", "Alt text", "optional-class" %}
  {% lazyVideo "path/to/video.mp4", "Aria label", "optional-class", "autoplay muted loop" %}
  ```
- Favicons must live in `_src/assets/favicon/` — they are mapped to site root by Eleventy passthrough copy config

---

## Key Architectural Decisions

### No Frontend Framework
Intentional choice to keep the site fast and dependency-free. Vanilla JS is sufficient for the animation and lazy-loading needs. See `DECISIONS.md` for the full rationale.

### No JS Bundler
Scripts are included directly in HTML. No webpack/vite/rollup. Terser is used only for production minification of the final files.

### Sass ITCSS
`@use` module system ensures proper cascade ordering. Adding a new style layer means creating a partial in the appropriate directory and importing it in `project.scss`.

### Pre-processed Videos
Videos are optimized **in-place in `_src/assets/`** using `npm run preprocess:videos`, then committed to Git. Vercel does not run FFmpeg, so the WebM files must be pre-generated. Do NOT rely on the build pipeline to convert videos from scratch on Vercel.

### Custom PostCSS Plugin
`postcss.config.js` includes a custom plugin that adds `vh`/`vw` fallbacks for modern viewport units (`dvh`, `svh`, `lvh`, etc.). The fallback is injected **before** the modern unit declaration.

### Image Optimization
`{% responsiveImage %}` shortcode generates `<picture>` elements with WebP source + original fallback. Images are converted to WebP at build time by `optimize-images.js`. Responsive sizes: 1080w (mobile) and full-size (desktop).

---

## Build Pipeline Details

```
npm run build
  └── prebuild (automatic)
        ├── compile:scss:production   → _site/styles/project.css (minified)
        └── validate:assets           → validates all source assets
  └── NODE_ENV=production eleventy   → _site/ (HTML minified via transform)
  └── minify:js                      → minifies _site/scripts/**/*.js
  └── optimize:images                → converts JPG/PNG → WebP in _site/
  └── optimize:videos                → converts MP4 → WebM in _site/
```

`NODE_ENV=production` triggers:
- HTML minification transform in `.eleventy.js`
- CSS minification via `cssnano` in PostCSS

---

## Testing

Tests use plain Node.js with no external test framework. Run sequentially via `tests/run-all-tests.js`.

| Suite | File | What it tests |
|-------|------|---------------|
| Asset Validator | `tests/asset-validator.test.js` | File validation, size limits, image/video checks (20 tests) |
| Shortcodes | `tests/shortcodes.test.js` | `responsiveImage` and `lazyVideo` HTML output (20 tests) |
| PostCSS DVH | `tests/postcss-dvh.test.js` | dvh/svh/lvh unit fallback injection |
| Build Reporter | `tests/build-reporter.test.js` | Build output reporting |

**Pre-commit hook** (`hooks/pre-commit`) runs `npm test` before every commit. Skip only in emergencies: `git commit --no-verify`.

---

## Deployment

- **Platform:** Vercel (auto-deploy from `main` branch)
- **Build command:** `npm run build`
- **Output directory:** `_site/`
- **Deploy time:** ~2 minutes after push to `main`
- **Redirects:** Configured in `vercel.json` (e.g., `/latest` → `/`)
- FFmpeg is **not available** on Vercel — all video preprocessing must be committed to Git

---

## Adding a New Case Study

1. Run the scaffold command:
   ```bash
   npm run new:case-study my-project "Project Title" "Short description"
   ```
2. This creates `_src/work/my-project.html` and `_src/assets/my-project/`
3. Add images to `_src/assets/my-project/` (JPG/PNG — they'll be converted to WebP at build)
4. Add videos to `_src/assets/my-project/` (MP4), then run:
   ```bash
   npm run preprocess:videos
   ```
   Commit the resulting `.webm` and poster `.webp` files
5. Use shortcodes in the template:
   ```html
   {% responsiveImage "assets/my-project/hero.jpg", "Hero image description" %}
   {% lazyVideo "assets/my-project/demo.mp4", "Demo video description", "", "autoplay muted loop playsinline" %}
   ```
6. Add the project to the homepage worklist in `_src/index.html`

---

## Performance Conventions

- Always use `{% responsiveImage %}` for images — never raw `<img>` tags for project assets
- Always use `{% lazyVideo %}` for videos — never raw `<video>` tags
- Page transitions are disabled on mobile (handled in `page-transitions.js`)
- Animate with `transform` and `opacity` only (GPU-accelerated, no layout thrash)
- Use `IntersectionObserver` for scroll effects — never `scroll` event listeners
- Respect `prefers-reduced-motion` for all animations
- Videos pause automatically when scrolled off-screen (`video-lazy-loading.js`)
- P5.js sketches run at 30fps on mobile, 60fps on desktop (`p5-mobile-optimizer.js`)

---

## Claude Code Permissions

Defined in `.claude/settings.local.json`. Pre-authorized commands:
- `npm run build:*`, `npm run compile:scss:*`, `npm run:*`
- `npm install:*`
- `node:*`, `python3:*`
- `npx @11ty/eleventy:*`
- `ffmpeg:*`
- `git fetch:*`
- `ls:*`, `cat:*`, `test:*`, `pkill:*`
- `timeout 180 npm run optimize:videos:*`

---

## Existing Documentation

| File | Contents |
|------|----------|
| `README.md` | Full project overview, architecture, getting started (~528 lines) |
| `QUICKSTART.md` | Quick-reference commands and common tasks (~425 lines) |
| `DECISIONS.md` | Architectural decision log — why each tool was chosen (~155 lines) |
| `TESTING.md` | Testing guide, how to run/add tests |

Read these files for deeper context before making architectural changes.

---

## Git Workflow

- **Production branch:** `main` (auto-deploys to Vercel)
- **Feature branches:** Create from `main`, merge via PR
- **Pre-commit:** `npm test` runs automatically (enforced by `hooks/pre-commit`)
- **Commit style:** Concise, present tense (e.g., "Add motion case study assets")
- Never commit generated files from `_site/` (gitignored)
- Commit pre-processed video files (`.webm`, poster `.webp`) from `_src/assets/`
