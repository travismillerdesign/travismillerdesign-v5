# Decision Log

This document records key architectural and technical decisions for this project. When you make a significant choice about how to build something, document it here so "future you" remembers why.

---

## Why Eleventy instead of Next.js/Gatsby?

**Decision:** Use Eleventy (11ty) as the static site generator

**Reasoning:**
- Simple portfolio site doesn't need React overhead
- Eleventy generates pure HTML with no client-side JavaScript framework
- Faster build times and simpler deployment
- Full control over HTML structure and performance
- Can still use vanilla JS for interactive features

**Date:** Initial project setup

---

## Why Sass instead of CSS-in-JS?

**Decision:** Use Sass/SCSS with ITCSS architecture

**Reasoning:**
- No JavaScript framework, so CSS-in-JS doesn't make sense
- Sass provides variables, nesting, and mixins for better organization
- ITCSS (Inverted Triangle CSS) provides clear structure for scaling
- Single compiled CSS file is faster than runtime CSS generation
- Easier to maintain for infrequent updates

**Date:** Initial project setup

---

## Why aggressive image/video optimization?

**Decision:** Convert all images to WebP and videos to WebM during build

**Reasoning:**
- Portfolio site is image/video heavy
- WebP provides ~30% smaller file sizes than JPEG
- WebM provides 30-50% smaller file sizes than MP4
- Build-time optimization is better than runtime for static sites
- Optimization scripts run once, not on every visit

**Date:** Initial project setup

---

## Why custom shortcodes instead of markdown?

**Decision:** Build custom Eleventy shortcodes for responsive images and lazy videos

**Reasoning:**
- Need precise control over picture element and source tags
- Want consistent lazy loading and responsive behavior across all images
- Shortcodes generate proper HTML structure every time
- Easier to update all images site-wide by changing one shortcode
- Better than copy-pasting complex HTML for each image

**Date:** Initial project setup

---

## Why host on 0.0.0.0 during development?

**Decision:** Dev server binds to 0.0.0.0 instead of localhost

**Reasoning:**
- Need to test on mobile devices during development
- 0.0.0.0 makes dev server accessible on local network
- Can preview on phone/tablet while developing
- Important for testing responsive design and touch interactions

**Date:** Initial project setup

---

## Why no build bundler (Webpack/Vite)?

**Decision:** Use vanilla JavaScript modules, no build bundler

**Reasoning:**
- Modern browsers support ES modules natively
- Site has minimal JavaScript (page transitions, animations)
- No dependencies to bundle - just P5.js loaded from CDN
- Simpler build pipeline with fewer tools to maintain
- Faster development iteration without bundler compilation

**Date:** Initial project setup

---

## Why pre-commit hooks?

**Decision:** Run tests automatically before each commit

**Reasoning:**
- Personal site updated infrequently (months between changes)
- Easy to forget to run tests after long breaks
- Prevents pushing broken code when coming back to the project
- Simple hook that takes 2 seconds to set up
- Can skip with --no-verify if needed for WIP commits

**Date:** 2025-12-14

---

## Why ESLint but minimal rules?

**Decision:** Add ESLint with basic recommended rules only

**Reasoning:**
- Catch obvious bugs (undefined variables, syntax errors)
- Don't need strict style enforcement - Prettier handles that
- Personal project doesn't need enterprise-level linting
- Minimal config = minimal maintenance burden
- Warns on unused vars but doesn't block development

**Date:** 2025-12-14

---

## Template for New Decisions

When adding a new decision, copy this template:

```markdown
## Decision Title

**Decision:** What did you decide?

**Reasoning:**
- Why did you make this choice?
- What alternatives did you consider?
- What problem does this solve?
- Any trade-offs to be aware of?

**Date:** YYYY-MM-DD
```

---

## How to Use This Document

1. **When making a significant decision**, add it here
2. **Keep it concise** - bullet points are fine
3. **Focus on the "why"** - the code shows the "what"
4. **Include date** - helps track when decisions were made
5. **Review before major changes** - see if old decisions still apply

This document is for you, so write it in a way that will make sense when you come back months later.
