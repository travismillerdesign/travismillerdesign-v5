// tests/postcss-dvh.test.js
//
// Test Suite for PostCSS dvh Fallback Plugin
//
// Tests that the PostCSS build process correctly adds vh/vw fallbacks for dvh/svh/lvh units
// Run with: node tests/postcss-dvh.test.js

const assert = require('assert');
const postcss = require('postcss');
const config = require('../postcss.config.js');

console.log('🧪 Running PostCSS dvh Fallback Tests\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

// Helper function to run PostCSS processing
async function processCSS(input) {
    const result = await postcss(config.plugins).process(input, { from: undefined });
    return result.css;
}

// Test 1: dvh should get vh fallback
(async () => {
    try {
        const input = 'header { min-height: 100dvh; }';
        const output = await processCSS(input);

        assert(output.includes('min-height: 100vh;'), 'Should include vh fallback');
        assert(output.includes('min-height: 100dvh;'), 'Should preserve dvh value');
        // Verify vh comes before dvh (fallback first)
        const vhIndex = output.indexOf('100vh');
        const dvhIndex = output.indexOf('100dvh');
        assert(vhIndex < dvhIndex, 'vh fallback should come before dvh');

        console.log('✓ Test 1: dvh gets vh fallback');
        passed++;
    } catch (err) {
        console.error('✗ Test 1 failed:', err.message);
        failed++;
    }

    // Test 2: svh should get vh fallback
    try {
        const input = 'section { height: 50svh; }';
        const output = await processCSS(input);

        assert(output.includes('height: 50vh;'), 'Should include vh fallback for svh');
        assert(output.includes('height: 50svh;'), 'Should preserve svh value');

        console.log('✓ Test 2: svh gets vh fallback');
        passed++;
    } catch (err) {
        console.error('✗ Test 2 failed:', err.message);
        failed++;
    }

    // Test 3: lvh should get vh fallback
    try {
        const input = 'div { max-height: 80lvh; }';
        const output = await processCSS(input);

        assert(output.includes('max-height: 80vh;'), 'Should include vh fallback for lvh');
        assert(output.includes('max-height: 80lvh;'), 'Should preserve lvh value');

        console.log('✓ Test 3: lvh gets vh fallback');
        passed++;
    } catch (err) {
        console.error('✗ Test 3 failed:', err.message);
        failed++;
    }

    // Test 4: dvw should get vw fallback
    try {
        const input = 'aside { width: 25dvw; }';
        const output = await processCSS(input);

        assert(output.includes('width: 25vw;'), 'Should include vw fallback for dvw');
        assert(output.includes('width: 25dvw;'), 'Should preserve dvw value');

        console.log('✓ Test 4: dvw gets vw fallback');
        passed++;
    } catch (err) {
        console.error('✗ Test 4 failed:', err.message);
        failed++;
    }

    // Test 5: Multiple viewport units in one declaration
    try {
        const input = 'main { padding: 10dvh 5dvw; }';
        const output = await processCSS(input);

        assert(output.includes('padding: 10vh 5vw;'), 'Should include fallback with both vh and vw');
        assert(output.includes('padding: 10dvh 5dvw;'), 'Should preserve original values');

        console.log('✓ Test 5: Multiple viewport units handled correctly');
        passed++;
    } catch (err) {
        console.error('✗ Test 5 failed:', err.message);
        failed++;
    }

    // Test 6: Regular vh should not be duplicated
    try {
        const input = 'footer { padding-bottom: 25vh; }';
        const output = await processCSS(input);

        // Count occurrences of "25vh" - should only appear once
        const matches = output.match(/25vh/g);
        assert(matches && matches.length === 1, 'Regular vh should not be duplicated');
        assert(!output.includes('25dvh'), 'Should not add dvh if not present');

        console.log('✓ Test 6: Regular vh not duplicated');
        passed++;
    } catch (err) {
        console.error('✗ Test 6 failed:', err.message);
        failed++;
    }

    // Test 7: Decimal values should work
    try {
        const input = 'article { min-height: 88.5dvh; }';
        const output = await processCSS(input);

        assert(output.includes('min-height: 88.5vh;'), 'Should handle decimal values in fallback');
        assert(output.includes('min-height: 88.5dvh;'), 'Should preserve decimal dvh value');

        console.log('✓ Test 7: Decimal viewport values handled correctly');
        passed++;
    } catch (err) {
        console.error('✗ Test 7 failed:', err.message);
        failed++;
    }

    // Test 8: dvmin and dvmax units
    try {
        const input = 'nav { width: 20dvmin; height: 30dvmax; }';
        const output = await processCSS(input);

        assert(output.includes('width: 20vmin;'), 'Should include vmin fallback for dvmin');
        assert(output.includes('height: 30vmax;'), 'Should include vmax fallback for dvmax');

        console.log('✓ Test 8: dvmin and dvmax get correct fallbacks');
        passed++;
    } catch (err) {
        console.error('✗ Test 8 failed:', err.message);
        failed++;
    }

    // Print results
    console.log('='.repeat(60));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

    if (failed === 0) {
        console.log('✅ All tests passed!\n');
        process.exit(0);
    } else {
        console.log(`❌ ${failed} test(s) failed\n`);
        process.exit(1);
    }
})();
