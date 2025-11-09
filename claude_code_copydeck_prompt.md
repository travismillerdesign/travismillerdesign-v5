# Claude Code Implementation Prompt

## Context
I have an Eleventy-based portfolio website (travismillerdesign-v5) with established page structures and components. I need to integrate a copy deck into the existing pages and link up relevant images from my assets folder. This copy was generated with ai, so some reasonable contextual changes are expected when putting it in code.

## Current Project Structure
```
travismillerdesign-v5/
├── src/
│   ├── index.html (homepage)
│   ├── work.html (work/projects page)
│   ├── experiments.html (experiments gallery)
│   ├── about.html (about page)
│   ├── _includes/ (partials, layouts)
│   └── assets/
├── .eleventy.js
└── package.json
```

## What I Need

### Primary Goal
Integrate the complete copy deck content into my existing page templates WITHOUT changing the overall structure or component architecture. The HTML/CSS structure is already solid - I just need the content populated.

### Specific Tasks

1. **Homepage (`src/index.html`)**
   - Edit the featured work cards linking to appropriate sections
   - Upudate experiments preview section
   - Link to appropriate images

2. **Work Page (`src/work.html`)**
   - Update Leia Inc case study with ID anchor `leia-design-system`
   - Update Design Systems at Scale case study with ID anchor `design-systems-scale`
   - Update Motion Design section with ID anchor `motion-design` (include Starline and Scotiabank projects)
   - Update Brand Identity Systems section with ID anchor `brand-systems` (include Orosa and grid of additional work)
   - Link all images from respective asset folders

3. **Experiments Page (`src/experiments.html`)**
   - Update page header with finalized copy
   - Maintain gallery/grid structure for experiment cards - use the flexbox classes that exist
   - Link to images in `assets/experiments/`
   - Keep it as single-page scrolling experience

### Image Linking Requirements

All images should be linked using this pattern:
```html
<img src="/assets/[folder]/[filename].jpg" alt="[descriptive alt text]">
```

Images are already organized in the assets folder with descriptive filenames. Please:
- Match content sections to the appropriate asset folder
- Use descriptive alt text for accessibility
- Maintain existing image component structure if present
- For the brand grid section, create a responsive grid of project thumbnails

### Copy Deck Reference

The complete copy deck is provided separately and includes:
- Headlines, subheads, and body copy
- Descriptions for each project/case study
- Alt text guidance

### What NOT to Change

- Overall page structure and layout architecture
- CSS styling and component classes
- Navigation structure
- Build configuration (.eleventy.js)
- Any existing components or partials in `_includes/`

### What TO Focus On

- Content population with provided copy
- Image linking to existing assets
- Maintaining semantic HTML structure
- Ensuring internal anchor links work correctly (for Work page sections)
- Making sure CTAs link to the right places
- Consistent formatting and typography

### Testing Checklist

After implementation, I should be able to:
1. Navigate between all pages seamlessly
2. Click featured work cards on homepage and jump to correct Work page sections
3. See all images loaded correctly from assets folder
4. View experiments in a clean gallery format
5. Contact information is accurate and links work
6. Internal anchor links on Work page function properly

### Additional Notes

- The copy avoids em dashes and AI clichés
- Tone is professional but conversational
- Focus is on impact and outcomes, not just features
- Technical depth is important but balanced with accessibility
- The site is targeting senior-level design systems roles at top tech companies

## Implementation Approach

Please work incrementally:
1. Start with homepage (it's the most important)
2. Then work on the Work page (most complex with multiple sections)
3. Followed by Experiments page
4. Finally About page

For each page, confirm the content is properly integrated before moving to the next.

## Success Criteria

The website should be ready to ship with:
- All copy integrated and polished
- All images properly linked and loading
- Navigation working smoothly
- Internal links functioning
- Clean, scannable content hierarchy
- Professional presentation suitable for senior-level job applications

Please confirm you understand the scope and let me know if you need any clarification before beginning implementation.