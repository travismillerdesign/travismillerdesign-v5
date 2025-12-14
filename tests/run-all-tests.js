// tests/run-all-tests.js
//
// Test Runner - Runs all test suites
//
// Usage:
//   node tests/run-all-tests.js

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running All Test Suites\n');
console.log('='.repeat(60) + '\n');

const tests = [
    { name: 'Asset Validator Tests', file: 'asset-validator.test.js' },
    { name: 'Shortcode Tests', file: 'shortcodes.test.js' }
];

let currentTest = 0;
let failedTests = [];

function runNextTest() {
    if (currentTest >= tests.length) {
        // All tests complete
        console.log('\n' + '='.repeat(60));
        console.log('📊 All Test Suites Complete');
        console.log('='.repeat(60) + '\n');

        if (failedTests.length === 0) {
            console.log('✅ All test suites passed!\n');
            process.exit(0);
        } else {
            console.log(`❌ ${failedTests.length} test suite(s) failed:`);
            failedTests.forEach(test => console.log(`   - ${test}`));
            console.log('');
            process.exit(1);
        }
        return;
    }

    const test = tests[currentTest];
    console.log(`Running: ${test.name}`);
    console.log('-'.repeat(60) + '\n');

    const testPath = path.join(__dirname, test.file);
    const child = spawn('node', [testPath], { stdio: 'inherit' });

    child.on('close', (code) => {
        if (code !== 0) {
            failedTests.push(test.name);
        }
        console.log('');
        currentTest++;
        runNextTest();
    });

    child.on('error', (err) => {
        console.error(`Failed to run ${test.name}:`, err);
        failedTests.push(test.name);
        currentTest++;
        runNextTest();
    });
}

runNextTest();
