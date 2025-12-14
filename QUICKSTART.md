# Quick Start Guide - Making Updates

**Welcome back!** This guide will get you up and running quickly to make updates to your portfolio.

---

## 🚀 First Time Setup (After Years Away)

```bash
# 1. Navigate to project
cd travismillerdesign-v5

# 2. Install dependencies (in case versions changed)
npm install

# 3. Start development server
npm run serve

# 4. Open in browser
# → http://localhost:8080
```

**That's it!** The site should now be running locally with live reload.

---

## 🛠️ Development Tools & Commands

**Quick reference for all available npm scripts:**

### Core Commands
```bash
npm run serve          # Start dev server (fast, no optimization)
npm run build          # Production build (with optimization)
npm test               # Run all tests
```

### Development Tools
```bash
npm run new:case-study # Generate new project template
                       # Usage: npm run new:case-study <slug> "<Title>" "<Description>"
                       # Example: npm run new:case-study meta "Meta Design" "Work at Meta"

npm run todos          # Scan codebase for TODO comments
                       # Lists all TODOs by file and line number

npm run lint           # Check JavaScript code quality
npm run lint:fix       # Auto-fix linting issues
```

### Asset Optimization
```bash
npm run optimize:images  # Convert images to WebP + responsive sizes
npm run optimize:videos  # Convert videos to WebM + generate posters
npm run validate:assets  # Check assets for errors before build
```

### Advanced Development
```bash
npm run serve:full      # Dev server with full optimization (slower start)
npm run serve:verbose   # Dev server with detailed logging
```

**First time setup:** Run `bash setup-hooks.sh` to enable pre-commit testing.

**Note:** See DECISIONS.md for explanations of architectural choices.

---

## 📝 Common Update Tasks

### ✅ Adding a New Project/Case Study

**Quick Method (Recommended):**

```bash
# Generate template with one command
npm run new:case-study my-project "My Project Name" "Short description of the project"
```

This automatically creates:
- `src/work/my-project.html` with proper structure
- `src/assets/my-project/` folder for images/videos
- README with next steps

**Manual Method (Alternative):**

1. **Copy an existing case study as a template:**
   ```bash
   cp src/work/leia.html src/work/my-new-project.html
   ```

2. **Edit the front matter (top of file):**
   ```yaml
   ---
   layout: base.html
   title: "My New Project - Travis Miller"
   description: "Brief description of the project for SEO"
   ---
   ```

3. **Create assets folder:**
   ```bash
   mkdir -p src/assets/my-new-project
   ```

**Next Steps (Both Methods):**

1. Add images to `src/assets/my-new-project/`
2. Edit the HTML file to customize content
3. Add the project to homepage (`src/index.html`) and work page (`src/work.html`)
4. Run `npm run serve` to preview

### ✅ Adding Images to a Project

**Steps:**

1. **Add source images:**
   ```bash
   # Create project folder in assets
   mkdir -p src/assets/my-project

   # Copy your JPG/PNG images
   cp ~/Desktop/my-image.jpg src/assets/my-project/
   ```

2. **Use in your HTML:**
   ```html
   {% responsiveImage "/assets/my-project/my-image.jpg", "Description of image", "optional-css-class" %}
   ```

3. **Build will auto-optimize:**
   - Converts to WebP (30% smaller)
   - Creates mobile size (1080w)
   - Generates `<picture>` element with fallbacks

**Supported formats:** `.jpg`, `.png`, `.webp`, `.avif`, `.gif`

### ✅ Adding Videos to a Project

**Steps:**

1. **Add source video (MP4):**
   ```bash
   # Copy your MP4 video
   cp ~/Desktop/my-video.mp4 src/assets/my-project/
   ```

2. **Use in your HTML:**
   ```html
   {% lazyVideo "/assets/my-project/my-video.mp4", "Description of video", "optional-css-class" %}
   ```

3. **Build will auto-optimize:**
   - Converts to WebM (30-50% smaller)
   - Extracts poster image (first frame)
   - Lazy loads (only plays when visible)

**Important:** Only add `.mp4` files. WebM is generated automatically.

### ✅ Updating Existing Project Content

**Steps:**

1. **Find the file:**
   ```bash
   # All case studies are in src/work/
   ls src/work/
   ```

2. **Edit the HTML:**
   ```bash
   # Open in your editor
   code src/work/apple.html
   ```

3. **Save and check:**
   - Changes auto-reload in browser (if `npm run serve` is running)
   - No need to restart the server

### ✅ Updating Homepage or Work Page

**Files:**
- Homepage: `src/index.html`
- Work collection: `src/work.html`

**Edit and save** - changes will auto-reload.

---

## 🎨 Styling Updates

### CSS Changes

1. **Find the right Sass file:**
   ```
   src/styles/
   ├── settings/        # Colors, fonts, spacing, breakpoints
   ├── core/            # Base HTML elements (h1, p, a, etc.)
   └── components/      # UI components (cards, headers, etc.)
   ```

2. **Common files to edit:**
   - Colors: `src/styles/settings/color.scss`
   - Typography: `src/styles/settings/fonts.scss`
   - Spacing: `src/styles/settings/layout.scss`
   - Components: `src/styles/components/[component-name].scss`

3. **Changes auto-compile:**
   - Sass watcher compiles automatically
   - Browser auto-reloads with new styles

### Custom CSS for a Project

Add directly in the HTML file:
```html
<style>
  .my-custom-class {
    /* Your custom styles */
  }
</style>
```

---

## 🚢 Deploying Changes

### To Production (Vercel)

**Method 1: Via Git (Automatic)**
```bash
# 1. Stage your changes
git add .

# 2. Commit with a message
git commit -m "Add new project: My Project Name"

# 3. Push to main branch
git push origin main

# Vercel auto-deploys from main branch
# ✅ Live in ~2 minutes
```

**Method 2: Via Vercel Dashboard**
- Go to https://vercel.com/dashboard
- Click your project
- Click "Deployments" tab
- Latest push will be deploying automatically

### Testing Before Deploy

```bash
# Build production version locally
npm run build

# Check dist/ folder output
ls dist/
```

---

## 🗂️ File Organization Checklist

When adding a new project, create this structure:

```
src/
├── work/
│   └── my-project.html          ← Case study page
├── assets/
│   └── my-project/              ← Project assets folder
│       ├── hero.jpg             ← Hero image
│       ├── screenshot-1.jpg     ← Screenshots
│       ├── screenshot-2.jpg
│       └── demo-video.mp4       ← Demo video (optional)
```

---

## 💡 Tips & Shortcuts

### 1. **Reuse Existing Patterns**
   - Copy structure from `src/work/leia.html` for new case studies
   - Copy card structure from `src/index.html` for new work items
   - Keep consistent section types (hero, overview, content blocks)

### 2. **Image Guidelines**
   - Use JPG for photos
   - Use PNG for graphics with transparency
   - Recommended size: 2400px width max
   - Let the build optimize - don't pre-optimize

### 3. **Video Guidelines**
   - Use MP4 (H.264)
   - Recommended: 1920x1080 or 1280x720
   - Keep under 50MB if possible
   - Let the build convert to WebM

### 4. **Keyboard Shortcuts (While Editing)**
   - `Ctrl+C` in terminal to stop dev server
   - `npm run serve` to restart
   - Browser refresh if hot reload breaks

### 5. **Quick Checks**
   - Check responsive: Resize browser window
   - Check mobile: Use browser DevTools (F12 → Mobile view)
   - Check performance: Open DevTools Network tab

---

## 🐛 Common Issues & Fixes

### Issue: "Port 8080 already in use"
```bash
# Kill the process using port 8080
pkill -f "eleventy"

# Or use a different port (edit .eleventy.js, line 85)
# Then restart: npm run serve
```

### Issue: "Images not showing"
- Check path starts with `/assets/` not `assets/`
- Check file exists in `src/assets/`
- Check file extension is correct (case-sensitive on some systems)

### Issue: "Sass not compiling"
```bash
# Restart the Sass compiler
# Stop server (Ctrl+C)
npm run serve
```

### Issue: "Changes not showing in browser"
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Check console for errors (F12)

### Issue: "Build fails with image optimization error"
```bash
# Check image files aren't corrupted
# Try optimizing manually first
npm run optimize:images

# Check error message
# Common: unsupported image format
```

---

## 📋 Pre-Deploy Checklist

Before pushing to production:

- [ ] Test locally (`npm run serve`)
- [ ] Check all new images load
- [ ] Check all new videos play
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Check for console errors (F12 in browser)
- [ ] Review text for typos
- [ ] Test keyboard navigation (arrow keys)
- [ ] Run production build (`npm run build`)
- [ ] Check `dist/` folder has all assets

---

## 🔗 Quick Reference

### Essential Commands
```bash
npm run serve          # Development mode (fast)
npm run build          # Production build
npm run serve:verbose  # Debug mode (shows details)
```

### Key Files
```
src/index.html                   # Homepage
src/work.html                    # Work collection page
src/work/[project].html          # Individual case studies
src/_includes/base.html          # Site-wide template
src/styles/project.scss          # Main CSS entry point
```

### Asset Paths (in HTML)
```html
{% responsiveImage "/assets/folder/image.jpg", "Alt text" %}
{% lazyVideo "/assets/folder/video.mp4", "Video description" %}
```

### Front Matter Template
```yaml
---
layout: base.html
title: "Project Name - Travis Miller"
description: "SEO description of the project"
---
```

---

## 🎯 Your Most Common Workflow

**Adding a new project:**

1. `cd travismillerdesign-v5`
2. `npm run serve`
3. Copy `src/work/leia.html` → `src/work/new-project.html`
4. Create `src/assets/new-project/` folder
5. Add images/videos to assets folder
6. Edit `new-project.html` with your content
7. Add project card to `src/index.html` and `src/work.html`
8. Check in browser (auto-reloads)
9. `git add .`
10. `git commit -m "Add new project"`
11. `git push origin main`
12. ✅ Live on Vercel in 2 minutes

---

**Need more details?** Check `README.md` for full documentation.

**Questions?** Check the inline comments in the code files - they explain how everything works.
