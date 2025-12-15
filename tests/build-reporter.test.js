// tests/build-reporter.test.js
//
// Test Suite for Build Reporter Utility
//
// Tests all reporting functions in lib/build-reporter.js
// Run with: node tests/build-reporter.test.js

const assert = require('assert');

// Import the module to test
const {
    createProgressTracker,
    printSummary,
    printSeparator,
    printSectionHeader
} = require('../lib/build-reporter');

// Test counter
let testsRun = 0;
let testsPassed = 0;

// Test helper to run assertions
function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✓ ${name}`);
    } catch (err) {
        console.error(`✗ ${name}`);
        console.error(`  ${err.message}`);
        if (err.stack) {
            console.error(`  ${err.stack}`);
        }
    }
}

// Capture console output for testing
let consoleOutput = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function startCapture() {
    consoleOutput = [];
    console.log = (...args) => consoleOutput.push({ type: 'log', args });
    console.error = (...args) => consoleOutput.push({ type: 'error', args });
    console.warn = (...args) => consoleOutput.push({ type: 'warn', args });
}

function stopCapture() {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    return consoleOutput;
}

function getOutputText() {
    return consoleOutput.map(o => o.args.join(' ')).join('\n');
}

// ============================================================
// Test Suite: createProgressTracker
// ============================================================

test('createProgressTracker: returns object with correct methods', () => {
    const tracker = createProgressTracker();
    assert(typeof tracker.success === 'function', 'Should have success method');
    assert(typeof tracker.error === 'function', 'Should have error method');
    assert(typeof tracker.warning === 'function', 'Should have warning method');
    assert(typeof tracker.getCounts === 'function', 'Should have getCounts method');
});

test('createProgressTracker: initializes counts to zero', () => {
    const tracker = createProgressTracker();
    const counts = tracker.getCounts();
    assert.strictEqual(counts.success, 0, 'Initial success count should be 0');
    assert.strictEqual(counts.error, 0, 'Initial error count should be 0');
    assert.strictEqual(counts.warning, 0, 'Initial warning count should be 0');
});

test('createProgressTracker: increments success count', () => {
    const tracker = createProgressTracker();
    tracker.success();
    tracker.success();
    tracker.success();
    const counts = tracker.getCounts();
    assert.strictEqual(counts.success, 3, 'Success count should be 3');
    assert.strictEqual(counts.error, 0, 'Error count should remain 0');
    assert.strictEqual(counts.warning, 0, 'Warning count should remain 0');
});

test('createProgressTracker: increments error count', () => {
    const tracker = createProgressTracker();
    tracker.error();
    tracker.error();
    const counts = tracker.getCounts();
    assert.strictEqual(counts.error, 2, 'Error count should be 2');
    assert.strictEqual(counts.success, 0, 'Success count should remain 0');
    assert.strictEqual(counts.warning, 0, 'Warning count should remain 0');
});

test('createProgressTracker: increments warning count', () => {
    const tracker = createProgressTracker();
    tracker.warning();
    tracker.warning();
    tracker.warning();
    tracker.warning();
    const counts = tracker.getCounts();
    assert.strictEqual(counts.warning, 4, 'Warning count should be 4');
    assert.strictEqual(counts.success, 0, 'Success count should remain 0');
    assert.strictEqual(counts.error, 0, 'Error count should remain 0');
});

test('createProgressTracker: handles mixed increments', () => {
    const tracker = createProgressTracker();
    tracker.success();
    tracker.error();
    tracker.warning();
    tracker.success();
    tracker.warning();
    const counts = tracker.getCounts();
    assert.strictEqual(counts.success, 2, 'Success count should be 2');
    assert.strictEqual(counts.error, 1, 'Error count should be 1');
    assert.strictEqual(counts.warning, 2, 'Warning count should be 2');
});

test('createProgressTracker: maintains independent state', () => {
    const tracker1 = createProgressTracker();
    const tracker2 = createProgressTracker();

    tracker1.success();
    tracker1.success();
    tracker2.error();

    const counts1 = tracker1.getCounts();
    const counts2 = tracker2.getCounts();

    assert.strictEqual(counts1.success, 2, 'Tracker1 should have 2 successes');
    assert.strictEqual(counts1.error, 0, 'Tracker1 should have 0 errors');
    assert.strictEqual(counts2.success, 0, 'Tracker2 should have 0 successes');
    assert.strictEqual(counts2.error, 1, 'Tracker2 should have 1 error');
});

// ============================================================
// Test Suite: printSeparator
// ============================================================

test('printSeparator: prints 60 equals signs', () => {
    startCapture();
    printSeparator();
    const output = stopCapture();

    assert.strictEqual(output.length, 1, 'Should print one line');
    assert.strictEqual(output[0].args[0], '='.repeat(60), 'Should print 60 equals signs');
});

// ============================================================
// Test Suite: printSectionHeader
// ============================================================

test('printSectionHeader: prints title with separators', () => {
    startCapture();
    printSectionHeader('Test Header');
    const output = stopCapture();

    const text = getOutputText();
    assert(text.includes('Test Header'), 'Should include header title');
    assert(text.includes('='.repeat(60)), 'Should include separator line');
});

// ============================================================
// Test Suite: printSummary (Note: We can't test process.exit behavior)
// ============================================================

test('printSummary: prints success message', () => {
    startCapture();
    const counts = { success: 10, error: 0, warning: 0 };

    // Override process.exit to prevent test termination
    const originalExit = process.exit;
    process.exit = () => {};

    try {
        printSummary('Test Summary', 'items', counts);
        const text = getOutputText();

        assert(text.includes('Test Summary'), 'Should include title');
        assert(text.includes('10'), 'Should include count');
        assert(text.includes('items'), 'Should include item type');
    } finally {
        process.exit = originalExit;
        stopCapture();
    }
});

test('printSummary: includes warning message when warnings exist', () => {
    startCapture();
    const counts = { success: 10, error: 0, warning: 3 };

    const originalExit = process.exit;
    process.exit = () => {};

    try {
        printSummary('Test Summary', 'items', counts);
        const text = getOutputText();

        assert(text.includes('Warnings: 3'), 'Should include warning count');
    } finally {
        process.exit = originalExit;
        stopCapture();
    }
});

test('printSummary: includes error message when errors exist', () => {
    startCapture();
    const counts = { success: 8, error: 2, warning: 0 };

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };

    try {
        printSummary('Test Summary', 'items', counts);
        const text = getOutputText();

        assert(text.includes('Errors: 2'), 'Should include error count');
        assert.strictEqual(exitCode, 1, 'Should exit with code 1 when errors exist');
    } finally {
        process.exit = originalExit;
        stopCapture();
    }
});

test('printSummary: exits with code 2 when exitOnWarnings is true', () => {
    startCapture();
    const counts = { success: 10, error: 0, warning: 2 };

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };

    try {
        printSummary('Test Summary', 'items', counts, { exitOnWarnings: true });
        assert.strictEqual(exitCode, 2, 'Should exit with code 2 when warnings exist and exitOnWarnings is true');
    } finally {
        process.exit = originalExit;
        stopCapture();
    }
});

test('printSummary: does not exit when exitOnWarnings is false', () => {
    startCapture();
    const counts = { success: 10, error: 0, warning: 2 };

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };

    try {
        printSummary('Test Summary', 'items', counts, { exitOnWarnings: false });
        assert.strictEqual(exitCode, null, 'Should not exit when warnings exist and exitOnWarnings is false');
    } finally {
        process.exit = originalExit;
        stopCapture();
    }
});

// ============================================================
// Test Results
// ============================================================

console.log('\n' + '='.repeat(60));
console.log('Test Results');
console.log('='.repeat(60));
console.log(`Tests run: ${testsRun}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsRun - testsPassed}`);
console.log('='.repeat(60) + '\n');

if (testsPassed === testsRun) {
    console.log('✅ All tests passed!');
    process.exit(0);
} else {
    console.error('❌ Some tests failed');
    process.exit(1);
}
