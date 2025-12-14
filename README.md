# travismillerdesign-v5

Portfolio website (version 5) for Travis Miller, a Design Systems Designer showcasing work at Apple, Google, and Leia.

A high-performance, design-systems-focused static site built with Eleventy, featuring animated P5.js backgrounds, optimized images/videos, and smooth page transitions.

**Live Site:** https://travismillerdesign.com

---

## 🏗️ Project Architecture

### Tech Stack

- **Static Site Generator:** Eleventy (11ty) v3.1.2
- **Template Engine:** Nunjucks (`.njk`)
- **CSS:** Sass/SCSS v1.93.2
- **JavaScript:** Vanilla JS (no framework)
- **Creative Coding:** P5.js v1.7.0
- **Asset Optimization:** @11ty/eleventy-img, fluent-ffmpeg
- **Deployment:** Vercel

### Project Type

Static portfolio website with:
- Case study pages showcasing design work
- Animated procedural backgrounds using P5.js
- Aggressive performance optimizations
- SPA-like page transitions
- Responsive images and lazy-loaded videos

---

## 📁 Directory Structure

```
travismillerdesign-v5/
├── src/                          # Source files (input)
│   ├── _includes/                # Eleventy templates and partials
│   │   ├── base.html            # Root HTML layout template
│   │   ├── nav.html             # Navigation component
│   │   ├── footer.html          # Footer component
│   │   └── shortcodes.js        # Custom Nunjucks shortcodes
│   │
│   ├── work/                     # Case study pages
│   │   ├── apple.html           # Apple case study
│   │   ├── leia.html            # Leia 3D case study
│   │   ├── google-beam.html     # Google Beam case study
│   │   ├── branding.html        # Brand identity systems
│   │   ├── motion.html          # Motion design frameworks
│   │   └── design-code.html     # Design + Code explorations
│   │
│   ├── assets/                   # Images and videos (source)
│   │   ├── apple/               # Apple project assets
│   │   ├── brand/               # Branding project assets
│   │   ├── design-code/         # Creative coding explorations
│   │   ├── google/              # Google Beam assets
│   │   ├── leia/                # Leia project assets
│   │   └── motion/              # Motion design assets
│   │
│   ├── fonts/                   # Web fonts (PP Mori)
│   │
│   ├── scripts/                 # JavaScript modules
│   │   ├── page-transitions.js          # SPA-like page transitions
│   │   ├── video-lazy-loading.js        # Lazy load videos
│   │   ├── scroll-animations.js         # Scroll-triggered fade-ins
│   │   ├── case-study-animations.js     # P5.js animated backgrounds
│   │   ├── case-study-navigation.js     # Keyboard arrow navigation
│   │   └── p5-mobile-optimizer.js       # P5.js mobile performance
│   │
│   ├── styles/                  # Sass/SCSS stylesheets
│   │   ├── components/          # Component styles
│   │   ├── core/                # Base element styles
│   │   ├── settings/            # Variables and configuration
│   │   ├── utilities/           # Utility classes
│   │   └── project.scss         # Main entry point
│   │
│   ├── index.html               # Home page
│   ├── work.html                # Work collection page
│   ├── 404.html                 # 404 error page
│   └── robots.txt               # SEO robots file
│
├── dist/                        # Built output (generated, gitignored)
│
├── .eleventy.js                 # Eleventy configuration
├── optimize-images.js           # Image optimization build script
├── optimize-videos.js           # Video optimization build script
├── package.json                 # Dependencies and scripts
├── vercel.json                  # Vercel deployment config
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/travismillerdesign/travismillerdesign-v5.git
cd travismillerdesign-v5

# Install dependencies
npm install
```

### Development

```bash
# Fast development mode (no asset optimization)
npm run serve
# → Compiles Sass once
# → Runs Sass + Eleventy watchers in parallel
# → Dev server: http://localhost:8080

# Full development mode (with asset optimization)
npm run serve:full
# → Optimizes all images and videos first
# → Then runs watchers
# → Slower startup, but tests production pipeline

# Verbose mode (for debugging)
npm run serve:verbose
# → Shows detailed Sass and Eleventy output
```

### Production Build

```bash
npm run build
# Steps:
# 1. Compiles Sass (prebuild)
# 2. Generates HTML with Eleventy
# 3. Optimizes images (JPG/PNG → WebP + responsive sizes)
# 4. Optimizes videos (MP4 → WebM + poster frames)
# Output: dist/
```

---

## 📦 Build Pipeline

### Eleventy (Static Site Generation)

**Config:** `.eleventy.js`

- **Input:** `src/`
- **Output:** `dist/`
- **Template Engine:** Nunjucks (`.njk`)
- **Custom Shortcodes:**
  - `{% responsiveImage %}` - Generates `<picture>` elements with WebP + fallback
  - `{% lazyVideo %}` - Generates `<video>` elements with lazy loading

**Build Process:**
1. Reads `.html` files with YAML front matter
2. Processes through Nunjucks template engine
3. Applies layouts (base.html)
4. Copies static assets (passthrough)
5. Outputs static HTML files

### Sass Compilation

**Entry Point:** `src/styles/project.scss`
**Output:** `src/styles/project.css` (then copied to `dist/`)

**Architecture:**
- `settings/` - Variables (colors, spacing, breakpoints)
- `core/` - Base element styles
- `components/` - UI component styles
- `utilities/` - Helper classes

**Command:**
```bash
sass src/styles/project.scss src/styles/project.css --style=compressed
```

### Image Optimization

**Script:** `optimize-images.js`

**Process:**
1. Scans `src/assets/` for `.jpg`, `.png`, `.webp`, `.avif`
2. Generates two sizes:
   - **1080w** - Mobile/tablet
   - **Original** - Desktop/retina
3. Converts to formats:
   - **WebP** - Modern format (~30% smaller)
   - **JPG/PNG** - Fallback
4. Outputs to `dist/assets/` preserving folder structure

**Quality Settings:** 85% for all formats

**Example Output:**
```
src/assets/apple/hero.jpg
→ dist/assets/apple/hero.jpg (original)
→ dist/assets/apple/hero.webp (original)
→ dist/assets/apple/hero-1080w.jpg (mobile)
→ dist/assets/apple/hero-1080w.webp (mobile)
```

### Video Optimization

**Script:** `optimize-videos.js`

**Process:**
1. Scans `src/assets/` for `.mp4` files
2. Extracts poster frame at 0.5s (avoids black frames)
3. Generates optimized posters (WebP + JPEG)
4. Converts MP4 → WebM (VP9 codec, ~30-50% smaller)
5. Outputs to `dist/assets/`

**Video Encoding:**
- **Codec:** VP9 (libvpx-vp9)
- **CRF:** 32 (quality level, good for web)
- **Audio:** Opus @ 128kbps
- **Multithreading:** Enabled

**Example Output:**
```
src/assets/motion/animation.mp4
→ dist/assets/motion/animation.mp4 (original)
→ dist/assets/motion/animation.webm (VP9)
→ dist/assets/motion/animation.jpg (poster)
→ dist/assets/motion/animation.webp (poster WebP)
```

---

## 🎨 Key Features

### 1. **Responsive Images**

**Usage in templates:**
```nunjucks
{% responsiveImage "/assets/image.jpg", "Alt text", "className" %}
```

**Generated HTML:**
```html
<picture>
  <source srcset="/assets/image.webp" type="image/webp">
  <source srcset="/assets/image.jpg" type="image/jpeg">
  <img src="/assets/image.jpg" alt="Alt text" loading="lazy" />
</picture>
```

**Browser Behavior:**
- Modern browsers → WebP (smaller)
- Older browsers → JPG/PNG
- Lazy loading → Loads when approaching viewport

### 2. **Lazy Video Loading**

**Usage in templates:**
```nunjucks
{% lazyVideo "/assets/video.mp4", "Video description", "className" %}
```

**Generated HTML:**
```html
<video poster="image.webp" data-video-lazy autoplay loop muted playsinline>
  <source data-src="video.webm" type="video/webm">
  <source data-src="video.mp4" type="video/mp4">
</video>
```

**Lazy Loading Behavior:**
1. Initial: Shows poster, video not loaded
2. Near viewport: `data-src` → `src`, video loads
3. In viewport: Plays if autoplay enabled
4. Out of viewport: Pauses (saves resources)

### 3. **Page Transitions**

**Script:** `src/scripts/page-transitions.js`

- Intercepts internal navigation clicks
- Smooth 200ms fade between pages
- Updates `<main>` and `<footer>` (nav stays persistent)
- Handles browser back/forward
- **Disabled on mobile** for performance

### 4. **P5.js Animated Backgrounds**

**Script:** `src/scripts/case-study-animations.js`

- Procedural animated backgrounds for case study pages
- Multiple unique sketches (Lissajous curves, gradients, etc.)
- Mobile optimizations (lower FPS, simpler rendering)
- Respects `prefers-reduced-motion`

**Mobile Optimizer:** `src/scripts/p5-mobile-optimizer.js`
- Device detection (iOS, Android, desktop)
- Performance tier classification
- Adaptive FPS (30 mobile, 60 desktop)
- WebGL detection and fallbacks

### 5. **Keyboard Navigation**

**Script:** `src/scripts/case-study-navigation.js`

- Arrow keys (←↑↓→) navigate between sections
- Smooth scrolling
- Works on any page with `<header>`, `<section>`, `<footer>`
- Disabled while in input fields

### 6. **Scroll Animations**

**Script:** `src/scripts/scroll-animations.js`

- Fade-in effects as content enters viewport
- Uses IntersectionObserver (performance)
- Triggers at 1% visibility
- Respects `prefers-reduced-motion`

---

## 🎯 Performance Optimizations

### Image Optimization
- WebP format (~30% smaller than JPEG)
- Responsive sizes (1080w mobile, original desktop)
- Progressive JPEGs (load top-to-bottom)
- Lazy loading (`loading="lazy"`)

### Video Optimization
- WebM format (~30-50% smaller than MP4)
- Poster frames (instant visual feedback)
- Lazy loading (data-src pattern)
- Visibility-based playback (pause when off-screen)

### JavaScript Performance
- Mobile disables page transitions
- Videos pause when not visible
- P5.js sketches optimized for low-end mobile
- IntersectionObserver for scroll effects

### CSS Performance
- Single optimized stylesheet (compressed)
- GPU acceleration hints (`transform: translateZ`)
- Mobile-first responsive design

### Accessibility
- Respects `prefers-reduced-motion`
- Semantic HTML structure
- Image alt text throughout
- ARIA labels on videos
- Keyboard navigation support

---

## 🧩 Custom Shortcodes

Defined in: `src/_includes/shortcodes.js`

### `responsiveImage`

**Syntax:**
```nunjucks
{% responsiveImage src, alt, className %}
```

**Parameters:**
- `src` - Path to image (e.g., "/assets/image.jpg")
- `alt` - Alt text for accessibility
- `className` - Optional CSS class

**Output:** `<picture>` element with WebP + fallback

### `lazyVideo`

**Syntax:**
```nunjucks
{% lazyVideo src, ariaLabel, className, attributes %}
```

**Parameters:**
- `src` - Path to MP4 video
- `ariaLabel` - Accessibility label
- `className` - Optional CSS class
- `attributes` - Object with video attributes (autoplay, loop, etc.)

**Default Attributes:**
- `autoplay: true`
- `loop: true`
- `muted: true`
- `playsinline: true`
- `controls: false`

**Output:** `<video>` element with lazy loading

---

## 📜 Available Scripts

### Development
- `npm run serve` - Fast dev mode (no optimization)
- `npm run serve:full` - Full dev mode (with optimization)
- `npm run serve:verbose` - Verbose mode (debugging)

### Build
- `npm run build` - Production build (HTML + optimize assets)
- `npm run compile:scss` - Compile Sass to CSS
- `npm run optimize:images` - Optimize images only
- `npm run optimize:videos` - Optimize videos only

### Watch (Dev)
- `npm run watch:scss` - Watch Sass files
- `npm run watch:11ty` - Watch Eleventy files

---

## 🌐 Deployment

**Platform:** Vercel

**Config:** `vercel.json`

**Redirects:**
- `/latest` → `/` (non-permanent)

**Build Command:** `npm run build`
**Output Directory:** `dist/`

---

## 🗂️ Content Structure

### Pages

- `/` - Home page (`index.html`)
- `/work` - Work collection (`work.html`)
- `/work/leia` - Leia 3D case study
- `/work/apple` - Apple case study
- `/work/google-beam` - Google Beam case study
- `/work/branding` - Branding projects
- `/work/motion` - Motion design frameworks
- `/work/design-code` - Design + Code explorations

### Page Front Matter

Example:
```yaml
---
layout: base.html
title: "Apple Case Study"
description: "Design system work at Apple"
---
```

**Variables:**
- `layout` - Template to use (usually `base.html`)
- `title` - Page title
- `description` - Meta description

---

## 🛠️ Technologies Deep Dive

### Eleventy (Static Site Generator)
- Transforms templates → static HTML
- Uses Nunjucks for templating
- Supports custom shortcodes
- Fast builds, no client-side JS required

### Nunjucks (Template Engine)
- Jinja2-style syntax
- Supports layouts, includes, filters
- Variables: `{{ title }}`
- Conditionals: `{% if %}{% endif %}`
- Shortcodes: `{% responsiveImage %}`

### Sass (CSS Preprocessor)
- Variables, nesting, mixins
- Modern `@use` module system
- Compressed output for production

### P5.js (Creative Coding)
- JavaScript library for generative art
- Used for animated backgrounds
- Canvas-based rendering
- Mobile-optimized with custom wrapper

---

## 📝 Code Comments

The codebase is extensively documented with inline comments:

- **Build scripts** (.eleventy.js, optimize-images.js, optimize-videos.js) - Detailed process explanations
- **Templates** (base.html, shortcodes.js) - Usage examples and output formats
- **JavaScript modules** - Class structures, method purposes, configuration options
- **Sass entry point** (project.scss) - Architecture and import order

Look for:
- File-level header comments explaining purpose
- Section dividers (========)
- Inline comments for complex logic
- JSDoc-style function documentation

---

## 🤝 Contributing

This is a personal portfolio website. For questions or issues, please open a GitHub issue.

---

## 📄 License

ISC

---

## 👤 Author

**Travis Miller**
Design Systems Designer
https://travismillerdesign.com
https://www.linkedin.com/in/travismillerdesign/
