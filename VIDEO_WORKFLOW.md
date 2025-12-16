# Video Workflow

This project optimizes videos during the build process, but gracefully handles environments without FFmpeg (like Vercel).

## How It Works

1. **Source videos** (`.mp4`) live in `_src/assets/`
2. **During build**, videos are optimized to `.webm` + `.webp` posters (if FFmpeg is available)
3. If FFmpeg is **not available** (e.g., on Vercel), the build continues with warnings and copies MP4s only
4. For production deployments, **run the build locally first** to generate optimized files, then commit and deploy

## Adding or Updating Videos

When you add new videos or update existing ones:

### Step 1: Add the MP4 file
```bash
# Add your new video to the appropriate folder
cp ~/Desktop/my-video.mp4 _src/assets/myproject/
```

### Step 2: Pre-optimize videos locally
```bash
npm run preprocess:videos
```

This will:
- Convert each `.mp4` to `.webm` (VP9 codec, ~30-50% smaller)
- Generate `.webp` poster images (first frame at 0.5s)
- Place optimized files in `_src/assets/` alongside your MP4s
- Skip files that are already optimized

### Step 3: Review the output
```bash
# Check the generated files
ls _src/assets/myproject/

# You should see:
# - my-video.mp4 (source)
# - my-video.webm (optimized)
# - my-video.webp (poster)
```

### Step 4: Commit to Git
```bash
# Add all the video files
git add _src/assets/myproject/my-video.mp4
git add _src/assets/myproject/my-video.webm
git add _src/assets/myproject/my-video.webp

# Commit
git commit -m "Add video and optimized files for myproject"
```

## Build Process

The build process handles video optimization gracefully:

1. **If FFmpeg is available** (local builds):
   - Optimizes `.mp4` files to `.webm` + `.webp` and outputs to `_site/assets/`
   - Copies any pre-optimized files from `_src/assets/` via Eleventy passthrough

2. **If FFmpeg is NOT available** (Vercel, CI):
   - Shows warnings but continues build successfully (exit code 0)
   - Eleventy copies all video files (MP4, WebM, WebP) from `_src/assets/` to `_site/assets/` via passthrough copy
   - No optimization happens, but pre-committed optimized files are used

This means:
- ✅ **Best practice**: Use `npm run preprocess:videos` locally and commit optimized files to Git
- ✅ Vercel builds succeed even without FFmpeg by using committed files
- ✅ No build failures due to missing dependencies
- ✅ `npm run build` can still optimize videos if needed, but build won't fail without FFmpeg

## File Sizes

Pre-optimized videos are committed to Git. Current stats:
- 27 videos total
- WebM files save ~30-50% vs MP4

## Troubleshooting

### "FFmpeg is required" error
You need FFmpeg installed locally to run `npm run preprocess:videos`:

```bash
# macOS
brew install ffmpeg

# Check it's installed
ffmpeg -version
```

### Videos not showing on site
Make sure all three files exist for each video:
- `.mp4` (source)
- `.webm` (optimized)
- `.webp` (poster)

### Re-optimizing existing videos
Delete the `.webm` and `.webp` files, then run `npm run preprocess:videos` again.

## Commands Reference

```bash
# Build site (includes video optimization if FFmpeg available)
npm run build

# Manually pre-optimize videos in _src/assets/ (optional)
npm run preprocess:videos

# Development server (no video optimization)
npm run serve
```

## Recommended Workflow

1. **Add new videos**: Place MP4 files in `_src/assets/`
2. **Pre-optimize locally**: Run `npm run preprocess:videos` to generate `.webm` and `.webp` files
3. **Commit to Git**: Add all video files (MP4, WebM, WebP) from `_src/assets/`
4. **Deploy**: Vercel build will copy your pre-optimized files (no FFmpeg needed)

## Why This Approach?

- **Consistent builds**: Same optimized files locally and on Vercel
- **No FFmpeg on Vercel**: Build succeeds with warnings, uses committed files
- **Fast builds**: No re-optimization on every build
- **Git-tracked**: Optimized videos are versioned alongside source files
