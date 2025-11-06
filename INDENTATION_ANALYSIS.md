# Indentation Analysis Report
**Project:** travismillerdesign-v5  
**Generated:** 2025-11-05

## Executive Summary

Your project has **INCONSISTENT indentation patterns** across different file types. The primary issue is mixing **2-space and 4-space** indentation, with some files also using **tabs**. This is a common situation in projects and can be normalized using automated tools.

**Indentation Consistency Score:** ~40% (needs improvement)  
**Files needing attention:** 21 out of 38 (55%)

---

## Indentation Pattern Breakdown

### 1. Using Tabs (1 file)
- `src/styles/utilities/centering.scss`

### 2. Using 2-Space Indentation (5 files) - RECOMMENDED STANDARD
- `src/404.html`
- `src/styles/components/footer.scss`
- `src/styles/components/media-assets.scss`
- `src/styles/components/navigation.scss`
- `src/styles/settings/motion.scss`

### 3. Using 4-Space Indentation (5 files)
- `optimize-images.js`
- `src/_includes/base.html`
- `src/_includes/nav.html`
- `src/styles/components/worklist.scss`
- `src/styles/settings/color.scss`

### 4. Mixed/Inconsistent Indentation (20 files) - NEEDS STANDARDIZATION

| File | 2-space | 4-space | Notes |
|------|---------|---------|-------|
| `.claude/settings.local.json` | 2 | 4 | - |
| `.eleventy.js` | 1 | 17 | Primarily 4-space |
| `package-lock.json` | 6 | 664 | Primarily 4-space |
| `package.json` | 18 | 15 | Nearly balanced |
| `src/_includes/footer.html` | 2 | 2 | Perfectly balanced |
| `src/_includes/section-explorations.html` | 2 | 3 | - |
| `src/about.html` | 21 | 23 | Nearly balanced |
| `src/experiments.html` | 10 | 13 | - |
| `src/index.html` | 15 | 15 | Perfectly balanced |
| `src/scripts/case-study-animations.js` | 528 | 707 | Primarily 4-space |
| `src/scripts/case-study-navigation.js` | 43 | 60 | - |
| `src/styles/components/case-study.scss` | 27 | 6 | Primarily 2-space |
| `src/styles/components/content.scss` | 6 | 5 | Nearly balanced |
| `src/styles/components/header.scss` | 9 | 10 | Nearly balanced |
| `src/styles/core/tags.scss` | - | - | Uses tabs + 4-space |
| `src/styles/project.css` | - | - | Uses tabs + 2-space |
| `src/styles/settings/fonts.scss` | - | - | Uses tabs + 4-space |
| `src/styles/settings/layout.scss` | - | - | Uses tabs + 2-space |
| `src/work.html` | 10 | 10 | Perfectly balanced |
| `src/work/design-systems.html` | 33 | 34 | Nearly balanced |

### 5. No Clear Indentation Pattern (7 files)
Mostly configuration/index files with minimal code:
- `README.md`
- `src/styles/components/_index.scss`
- `src/styles/project.scss`
- `src/styles/settings/_index.scss`
- `src/styles/settings/path.scss`
- `src/styles/settings/zindex.scss`
- `src/styles/utilities/_index.scss`

---

## Analysis by File Type

### HTML Files (.html)
| File | Pattern |
|------|---------|
| `404.html` | 2-space ✓ |
| `_includes/base.html` | 4-space |
| `_includes/footer.html` | Mixed |
| `_includes/nav.html` | 4-space |
| `_includes/section-explorations.html` | Mixed |
| `about.html` | Mixed |
| `experiments.html` | Mixed |
| `index.html` | Mixed (balanced) |
| `work.html` | Mixed (balanced) |
| `work/design-systems.html` | Mixed (nearly balanced) |

### JavaScript Files (.js)
| File | Pattern |
|------|---------|
| `.eleventy.js` | Mixed (primarily 4-space) |
| `optimize-images.js` | 4-space |
| `scripts/case-study-animations.js` | Mixed (primarily 4-space) |
| `scripts/case-study-navigation.js` | Mixed |

### SCSS Files (.scss)
| File | Pattern |
|------|---------|
| `components/case-study.scss` | Mixed (primarily 2-space) |
| `components/content.scss` | Mixed |
| `components/footer.scss` | 2-space ✓ |
| `components/header.scss` | Mixed |
| `components/media-assets.scss` | 2-space ✓ |
| `components/navigation.scss` | 2-space ✓ |
| `components/worklist.scss` | 4-space |
| `core/tags.scss` | **Tabs** + 4-space |
| `settings/color.scss` | 4-space |
| `settings/fonts.scss` | **Tabs** + 4-space |
| `settings/layout.scss` | **Tabs** + 2-space |
| `settings/motion.scss` | 2-space ✓ |
| `utilities/centering.scss` | **Tabs** (primary) |

### CSS File (.css)
| File | Pattern |
|------|---------|
| `styles/project.css` | **Tabs** + 2-space |

### JSON Files (.json)
| File | Pattern |
|------|---------|
| `.claude/settings.local.json` | Mixed |
| `package.json` | Mixed (nearly balanced) |
| `package-lock.json` | Mixed (primarily 4-space) |

---

## Indentation Samples

### Current 4-Space Example (.eleventy.js)
```javascript
····eleventyConfig.setLiquidOptions({
········dynamicPartials: false,
········strictFilters: false,
····});
```

### Current 2-Space Example (package.json)
```json
··"name": "travismillerdesign-v5",
··"version": "1.0.0",
··"description": "v5 portfolio website",
```

### Current Tab Example (src/styles/core/tags.scss)
```scss
[TAB]// Box sizing
[TAB]-moz-box-sizing: border-box;
```

---

## Recommendations

### 1. ESTABLISH A STANDARD: 2-Space Indentation
- ✓ Already used in 5 files consistently
- ✓ Most common in modern web projects
- ✓ Complements your HTML/template structure
- ✓ Better readability on smaller screens

### 2. Configure .editorconfig
Add or update `.editorconfig` in your project root to enforce consistency across all editors:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[package*.json]
indent_size = 2
```

### 3. Configure Prettier (Recommended)
Install and configure Prettier for automatic code formatting:

**Install:**
```bash
npm install -D prettier
```

**Create `.prettierrc`:**
```json
{
  "semi": true,
  "useTabs": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "singleQuote": true,
  "arrowParens": "always",
  "printWidth": 100
}
```

**Fix all files:**
```bash
npx prettier --write "src/**/*" ".eleventy.js" "optimize-images.js"
```

### 4. Fix Priority Order

#### Priority 1 (Critical - Active development files)
These have the most lines of code and are likely edited frequently:
- `src/scripts/case-study-animations.js` (707 indented lines)
- `src/scripts/case-study-navigation.js` (60 indented lines)
- `.eleventy.js` (17 indented lines)
- `src/styles/core/tags.scss` (uses tabs)
- `src/styles/project.css` (uses tabs)
- `src/styles/settings/fonts.scss` (uses tabs)

#### Priority 2 (Important - Page/component files)
These are part of your main content:
- `src/work/design-systems.html`
- `src/about.html`
- `src/index.html`
- `src/work.html`
- `src/styles/components/case-study.scss`

#### Priority 3 (Configuration files)
Lower priority, can be fixed later:
- `package.json`
- `package-lock.json`
- `.claude/settings.local.json`

### 5. Configure Version Control
Add to `.gitattributes` to ensure consistent line endings:

```
* text=auto
*.js text eol=lf
*.scss text eol=lf
*.css text eol=lf
*.html text eol=lf
*.json text eol=lf
*.md text eol=lf
```

---

## Key Findings

### 1. Tabs vs Spaces Issue
- **5 files use tabs** (mainly SCSS and CSS files)
- Should be converted to spaces for consistency
- Tab widths can be ambiguous across different editors

### 2. Primary Issue: Mixed Indentation
- **20 files have both 2-space and 4-space** indentation
- This is typically caused by different editor settings among developers
- Can be automatically fixed with Prettier

### 3. JavaScript Files Pattern
- Primarily use **4-space indentation**
- `case-study-animations.js` has 707 4-space lines
- Consider standardizing to 2-space with Prettier

### 4. SCSS/CSS Files Pattern
- **Inconsistent, with some using tabs**
- Component files tend toward 2-space
- Settings files vary considerably
- Need standardization across all style files

### 5. HTML Files Pattern
- **Highly varied**, ranging from pure 2-space to balanced mixed
- Template includes have different standards
- Large HTML files show balanced mixed patterns

---

## Quick Statistics

| Metric | Count | Percentage |
|--------|-------|-----------|
| Total files analyzed | 38 | 100% |
| Pure 2-space | 5 | 13% |
| Pure 4-space | 5 | 13% |
| Pure tabs | 1 | 3% |
| Mixed indentation | 20 | 53% |
| No clear pattern | 7 | 18% |
| **Files needing attention** | **21** | **55%** |

---

## Implementation Steps

1. **Install Prettier:**
   ```bash
   npm install -D prettier
   ```

2. **Create configuration files:**
   - `.prettierrc` (as shown above)
   - Update or create `.editorconfig`

3. **Format existing code:**
   ```bash
   npx prettier --write "src/**/*" ".eleventy.js" "optimize-images.js" "package.json"
   ```

4. **Verify changes:**
   ```bash
   git diff
   ```

5. **Commit the formatting changes:**
   ```bash
   git add .
   git commit -m "chore: standardize indentation to 2 spaces"
   ```

6. **Add pre-commit hooks (optional but recommended):**
   ```bash
   npm install -D husky lint-staged
   npx husky install
   npx husky add .husky/pre-commit "npx lint-staged"
   ```

   Add to `package.json`:
   ```json
   "lint-staged": {
     "*.{js,jsx,ts,tsx,scss,css,html,json,md}": "prettier --write"
   }
   ```

---

## Notes for Future Maintenance

- Once standardized, use Prettier's pre-commit hooks to maintain consistency
- Educate team members on the standard (include in CONTRIBUTING.md)
- Update editor settings to match the project standard
- Review indentation in code reviews before merging

---

*This analysis was generated using automated indentation detection. For implementation guidance, see the recommendations section above.*
