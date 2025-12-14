#!/usr/bin/env node

/**
 * Case Study Template Generator
 * Creates a new case study page with proper structure and asset folder
 *
 * Usage: node new-case-study.js <project-name> "<Project Title>" "<Short description>"
 * Example: node new-case-study.js meta "Meta Design" "Design system work at Meta"
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
    console.error('❌ Error: Missing required arguments');
    console.log('\nUsage: node new-case-study.js <slug> "<Title>" "<Description>"\n');
    console.log('Example:');
    console.log('  node new-case-study.js meta "Meta Design" "Design system work at Meta"\n');
    process.exit(1);
}

const [slug, title, description] = args;

// Validate slug (no spaces, lowercase)
if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error('❌ Error: Slug must be lowercase letters, numbers, and hyphens only');
    console.log('  Example: "meta", "nike-brand", "shopify-2024"');
    process.exit(1);
}

// Define file paths
const htmlPath = path.join(__dirname, 'src', 'work', `${slug}.html`);
const assetsPath = path.join(__dirname, 'src', 'assets', slug);

// Check if files already exist
if (fs.existsSync(htmlPath)) {
    console.error(`❌ Error: File already exists: ${htmlPath}`);
    process.exit(1);
}

if (fs.existsSync(assetsPath)) {
    console.error(`❌ Error: Directory already exists: ${assetsPath}`);
    process.exit(1);
}

// Create the HTML template
const htmlTemplate = `---
layout: base.html
title: Travis Miller – ${title}
description: ${description}
---

<!-- Hero Section -->
<header id="hero" class="hero-compact theme-light">

    {% include 'nav.html' %}

    <div class="flex-container">

        <div class="flexItem">
            <h1>${title}</h1>
            <p class="large">${description}</p>

        </div>

    </div>
</header>

<!-- Overview Section -->
<section class="worklist theme-dark">
    <div class="sectionLabel">
        <p class="sectionEyebrow">Overview</p>
    </div>

    <div class="flex-container">
        <div class="featured-image column-2">
            {% responsiveImage "/assets/${slug}/hero-image.jpg", "Project hero image", "fillImage" %}
        </div>
        <div class="featured-card bottomText theme-default">
            <h4 class="uppercase" style="margin-top: 2rem;">My Role</h4>

            <p>TODO: Describe your role and responsibilities on this project.</p>
            <ul class="chipList">
                <li>TODO: Add skills</li>
                <li>TODO: Add skills</li>
                <li>TODO: Add skills</li>
            </ul>

        </div>
    </div>
</section>

<!-- Content Section -->
<section class="theme-light">

    <div class="contentBlock">
        <div class="textBlock">
            <h5 class="uppercase">Section Title</h5>
            <p>TODO: Add your content here.</p>
        </div>
        <div class="flex-container">
            <div class="roundedCorners">
                {% responsiveImage "/assets/${slug}/image-1.jpg", "Image description", "fillImage" %}
            </div>
        </div>
    </div>

</section>

<!-- Footer -->
{% include 'footer.html' %}
`;

// Create assets directory
fs.mkdirSync(assetsPath, { recursive: true });

// Write HTML file
fs.writeFileSync(htmlPath, htmlTemplate, 'utf8');

// Create a README in the assets folder
const assetsReadme = `# ${title} Assets

Add images and videos for this case study here.

Referenced images:
- hero-image.jpg (featured image in overview)
- image-1.jpg (example content image)

Run optimization after adding assets:
\`\`\`bash
npm run optimize:images
npm run optimize:videos
\`\`\`
`;

fs.writeFileSync(path.join(assetsPath, 'README.md'), assetsReadme, 'utf8');

// Success message
console.log('✅ Case study created successfully!\n');
console.log('Files created:');
console.log(`  📄 ${htmlPath}`);
console.log(`  📁 ${assetsPath}/\n`);
console.log('Next steps:');
console.log('  1. Add images to', assetsPath);
console.log('  2. Edit', htmlPath);
console.log('  3. Run "npm run serve" to preview');
console.log('  4. Run "npm run optimize:images" before committing\n');
