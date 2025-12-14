// tests/shortcodes.test.js
//
// Test Suite for Eleventy Shortcodes
//
// Tests responsiveImage and lazyVideo shortcodes
// Run with: node tests/shortcodes.test.js

const assert = require('assert');

console.log('🧪 Running Shortcode Tests\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

// Mock eleventyConfig to capture shortcode registrations
const mockConfig = {
    shortcodes: {},
    addShortcode(name, fn) {
        this.shortcodes[name] = fn;
    }
};

// Load shortcodes module
require('../src/_includes/shortcodes')(mockConfig);

const { responsiveImage, lazyVideo } = mockConfig.shortcodes;

// Test 1: responsiveImage - basic JPG
try {
    const result = responsiveImage('/assets/test.jpg', 'Test image', 'my-class');
    assert(result.includes('<picture>'), 'Should contain picture element');
    assert(result.includes('srcset="/assets/test.webp"'), 'Should include WebP source');
    assert(result.includes('srcset="/assets/test.jpg"'), 'Should include JPG source');
    assert(result.includes('alt="Test image"'), 'Should include alt text');
    assert(result.includes('class="my-class"'), 'Should include class');
    assert(result.includes('loading="lazy"'), 'Should include lazy loading');
    console.log('✓ Test 1: responsiveImage - basic JPG');
    passed++;
} catch (err) {
    console.error('✗ Test 1 failed:', err.message);
    failed++;
}

// Test 2: responsiveImage - PNG format
try {
    const result = responsiveImage('/assets/test.png', 'PNG image');
    assert(result.includes('srcset="/assets/test.webp"'), 'Should include WebP source');
    assert(result.includes('srcset="/assets/test.png"'), 'Should include PNG source (not JPG)');
    assert(result.includes('type="image/png"'), 'Should specify PNG type');
    console.log('✓ Test 2: responsiveImage - PNG format');
    passed++;
} catch (err) {
    console.error('✗ Test 2 failed:', err.message);
    failed++;
}

// Test 3: responsiveImage - GIF format (no optimization)
try {
    const result = responsiveImage('/assets/animated.gif', 'Animated GIF');
    assert(!result.includes('<picture>'), 'Should NOT contain picture element for GIF');
    assert(result.includes('<img'), 'Should contain img element');
    assert(result.includes('src="/assets/animated.gif"'), 'Should use original GIF');
    assert(result.includes('loading="lazy"'), 'Should include lazy loading');
    console.log('✓ Test 3: responsiveImage - GIF format (no optimization)');
    passed++;
} catch (err) {
    console.error('✗ Test 3 failed:', err.message);
    failed++;
}

// Test 4: responsiveImage - path without leading slash
try {
    const result = responsiveImage('assets/test.jpg', 'Test image');
    assert(result.includes('srcset="/assets/test.webp"'), 'Should handle path without leading slash');
    console.log('✓ Test 4: responsiveImage - path without leading slash');
    passed++;
} catch (err) {
    console.error('✗ Test 4 failed:', err.message);
    failed++;
}

// Test 5: responsiveImage - empty src (error handling)
try {
    const result = responsiveImage('', 'Test image');
    assert(result.includes('ERROR'), 'Should return error comment for empty src');
    console.log('✓ Test 5: responsiveImage - empty src error handling');
    passed++;
} catch (err) {
    console.error('✗ Test 5 failed:', err.message);
    failed++;
}

// Test 6: responsiveImage - no alt text (should warn but still work)
try {
    const result = responsiveImage('/assets/test.jpg', '');
    assert(result.includes('<picture>'), 'Should still generate picture element');
    assert(result.includes('alt=""'), 'Should include empty alt attribute');
    console.log('✓ Test 6: responsiveImage - missing alt text');
    passed++;
} catch (err) {
    console.error('✗ Test 6 failed:', err.message);
    failed++;
}

// Test 7: responsiveImage - no className (optional parameter)
try {
    const result = responsiveImage('/assets/test.jpg', 'Test image');
    assert(result.includes('class=""'), 'Should include empty class attribute');
    console.log('✓ Test 7: responsiveImage - no className');
    passed++;
} catch (err) {
    console.error('✗ Test 7 failed:', err.message);
    failed++;
}

// Test 8: lazyVideo - basic MP4
try {
    const result = lazyVideo('/assets/test.mp4', 'Test video', 'video-class');
    assert(result.includes('<video'), 'Should contain video element');
    assert(result.includes('data-src="/assets/test.webm"'), 'Should include WebM source with data-src');
    assert(result.includes('data-src="/assets/test.mp4"'), 'Should include MP4 source with data-src');
    assert(result.includes('poster="/assets/test.webp"'), 'Should include WebP poster');
    assert(result.includes('class="video-class"'), 'Should include class');
    assert(result.includes('aria-label="Test video"'), 'Should include aria-label');
    assert(result.includes('data-video-lazy'), 'Should include lazy loading marker');
    console.log('✓ Test 8: lazyVideo - basic MP4');
    passed++;
} catch (err) {
    console.error('✗ Test 8 failed:', err.message);
    failed++;
}

// Test 9: lazyVideo - default attributes
try {
    const result = lazyVideo('/assets/test.mp4', 'Test video');
    assert(result.includes('autoplay'), 'Should include autoplay by default');
    assert(result.includes('loop'), 'Should include loop by default');
    assert(result.includes('muted'), 'Should include muted by default');
    assert(result.includes('playsinline'), 'Should include playsinline by default');
    assert(!result.includes('controls'), 'Should NOT include controls by default');
    console.log('✓ Test 9: lazyVideo - default attributes');
    passed++;
} catch (err) {
    console.error('✗ Test 9 failed:', err.message);
    failed++;
}

// Test 10: lazyVideo - custom attributes (disable autoplay)
try {
    const result = lazyVideo('/assets/test.mp4', 'Test video', '', { autoplay: false });
    assert(!result.includes('autoplay'), 'Should NOT include autoplay when disabled');
    assert(result.includes('loop'), 'Should still include loop');
    console.log('✓ Test 10: lazyVideo - custom attributes (autoplay: false)');
    passed++;
} catch (err) {
    console.error('✗ Test 10 failed:', err.message);
    failed++;
}

// Test 11: lazyVideo - enable controls
try {
    const result = lazyVideo('/assets/test.mp4', 'Test video', '', { controls: true });
    assert(result.includes('controls'), 'Should include controls when enabled');
    console.log('✓ Test 11: lazyVideo - enable controls');
    passed++;
} catch (err) {
    console.error('✗ Test 11 failed:', err.message);
    failed++;
}

// Test 12: lazyVideo - path without leading slash
try {
    const result = lazyVideo('assets/test.mp4', 'Test video');
    assert(result.includes('data-src="/assets/test.webm"'), 'Should handle path without leading slash');
    console.log('✓ Test 12: lazyVideo - path without leading slash');
    passed++;
} catch (err) {
    console.error('✗ Test 12 failed:', err.message);
    failed++;
}

// Test 13: lazyVideo - empty src (error handling)
try {
    const result = lazyVideo('', 'Test video');
    assert(result.includes('ERROR'), 'Should return error comment for empty src');
    console.log('✓ Test 13: lazyVideo - empty src error handling');
    passed++;
} catch (err) {
    console.error('✗ Test 13 failed:', err.message);
    failed++;
}

// Test 14: lazyVideo - no aria-label (should warn but still work)
try {
    const result = lazyVideo('/assets/test.mp4', '');
    assert(result.includes('<video'), 'Should still generate video element');
    console.log('✓ Test 14: lazyVideo - missing aria-label');
    passed++;
} catch (err) {
    console.error('✗ Test 14 failed:', err.message);
    failed++;
}

// Test 15: lazyVideo - no className (optional parameter)
try {
    const result = lazyVideo('/assets/test.mp4', 'Test video', '');
    assert(!result.includes('class=""'), 'Should not include empty class attribute');
    console.log('✓ Test 15: lazyVideo - no className');
    passed++;
} catch (err) {
    console.error('✗ Test 15 failed:', err.message);
    failed++;
}

// Test 16: responsiveImage - JPEG extension
try {
    const result = responsiveImage('/assets/test.jpeg', 'JPEG image');
    assert(result.includes('srcset="/assets/test.webp"'), 'Should include WebP source');
    assert(result.includes('srcset="/assets/test.jpg"'), 'Should convert .jpeg to .jpg');
    console.log('✓ Test 16: responsiveImage - JPEG extension');
    passed++;
} catch (err) {
    console.error('✗ Test 16 failed:', err.message);
    failed++;
}

// Test 17: lazyVideo - data-src for lazy loading
try {
    const result = lazyVideo('/assets/test.mp4', 'Test video');
    assert(result.includes('data-src='), 'Should use data-src attribute');
    // Check that video sources use data-src, not src (but poster uses src)
    const videoSourceRegex = /<source[^>]+type="video/g;
    const sources = result.match(videoSourceRegex) || [];
    sources.forEach(source => {
        assert(!source.includes(' src="'), 'Video sources should NOT use src attribute');
        // Note: They should use data-src, which is checked above
    });
    console.log('✓ Test 17: lazyVideo - data-src for lazy loading');
    passed++;
} catch (err) {
    console.error('✗ Test 17 failed:', err.message);
    failed++;
}

// Test 18: responsiveImage - multiple formats in picture element
try {
    const result = responsiveImage('/assets/test.jpg', 'Test');
    const sourceCount = (result.match(/<source/g) || []).length;
    assert.strictEqual(sourceCount, 2, 'Should have exactly 2 source elements');
    console.log('✓ Test 18: responsiveImage - multiple source formats');
    passed++;
} catch (err) {
    console.error('✗ Test 18 failed:', err.message);
    failed++;
}

// Test 19: lazyVideo - multiple video sources
try {
    const result = lazyVideo('/assets/test.mp4', 'Test');
    const sourceCount = (result.match(/<source/g) || []).length;
    assert.strictEqual(sourceCount, 2, 'Should have exactly 2 source elements (WebM + MP4)');
    console.log('✓ Test 19: lazyVideo - multiple source formats');
    passed++;
} catch (err) {
    console.error('✗ Test 19 failed:', err.message);
    failed++;
}

// Test 20: responsiveImage - WebP type specification
try {
    const result = responsiveImage('/assets/test.jpg', 'Test');
    assert(result.includes('type="image/webp"'), 'Should specify WebP type');
    assert(result.includes('type="image/jpg"'), 'Should specify JPG type');
    console.log('✓ Test 20: responsiveImage - type specifications');
    passed++;
} catch (err) {
    console.error('✗ Test 20 failed:', err.message);
    failed++;
}

// Summary
console.log('='.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('✅ All tests passed!\n');
    process.exit(0);
} else {
    console.log(`❌ ${failed} test(s) failed\n`);
    process.exit(1);
}
