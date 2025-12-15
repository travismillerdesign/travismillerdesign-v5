// build-reporter.js
//
// Build Reporting Utilities
//
// Provides shared utilities for tracking progress and reporting results
// across build scripts (optimize-images.js, optimize-videos.js, validate-assets.js).
//
// Functions:
// - createProgressTracker(): Track success/error/warning counts
// - printSummary(): Print standardized summary reports
// - printSeparator(): Print section separator line
// - printSectionHeader(): Print formatted section header
//
// Usage:
//   const { createProgressTracker, printSummary } = require('./lib/build-reporter');
//
//   const tracker = createProgressTracker();
//
//   // During processing
//   tracker.success();  // increment success count
//   tracker.error();    // increment error count
//   tracker.warning();  // increment warning count
//
//   // At the end
//   printSummary('Image Optimization Summary', 'images', tracker.getCounts());

/**
 * Create a progress tracker for counting successes, errors, and warnings
 * Uses closure pattern to encapsulate state
 *
 * @returns {object} Tracker object with success(), error(), warning(), and getCounts() methods
 */
function createProgressTracker() {
    let successCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    return {
        /**
         * Increment success count
         */
        success() {
            successCount++;
        },

        /**
         * Increment error count
         */
        error() {
            errorCount++;
        },

        /**
         * Increment warning count
         */
        warning() {
            warningCount++;
        },

        /**
         * Get current counts
         * @returns {object} Object with success, error, and warning counts
         */
        getCounts() {
            return {
                success: successCount,
                error: errorCount,
                warning: warningCount
            };
        }
    };
}

/**
 * Print a separator line (60 equals signs)
 */
function printSeparator() {
    console.log('='.repeat(60));
}

/**
 * Print a formatted section header with separators
 *
 * @param {string} title - Section title to display
 */
function printSectionHeader(title) {
    console.log('\n' + '='.repeat(60));
    console.log(title);
    printSeparator();
}

/**
 * Print a standardized summary report
 * Displays success/error/warning counts and exits with appropriate code if errors exist
 *
 * @param {string} title - Summary title (e.g., "Image Optimization Summary")
 * @param {string} itemType - Type of items processed (e.g., "images", "videos", "assets")
 * @param {object} counts - Object with success, error, and warning counts
 * @param {object} options - Optional configuration
 * @param {boolean} options.exitOnWarnings - If true, exit with code 2 when warnings exist (default: false)
 */
function printSummary(title, itemType, counts, options = {}) {
    const { exitOnWarnings = false } = options;

    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${title}`);
    printSeparator();

    // Print success count
    if (counts.success > 0) {
        // Vary the message based on item type and title
        if (title.includes('Validation')) {
            console.log(`✅ All validations passed! Assets are ready for optimization.`);
        } else if (title.includes('Image')) {
            console.log(`✅ Successfully optimized: ${counts.success} ${itemType}`);
        } else if (title.includes('Video')) {
            console.log(`✅ Successfully processed: ${counts.success} ${itemType}`);
        } else {
            console.log(`✅ Successfully completed: ${counts.success} ${itemType}`);
        }
    }

    // Print warnings if any
    if (counts.warning > 0) {
        console.log(`⚠️  Warnings: ${counts.warning}`);
    }

    // Print errors if any
    if (counts.error > 0) {
        console.log(`❌ Errors: ${counts.error} ${itemType} failed`);
    }

    printSeparator();
    console.log(''); // Empty line after summary

    // Handle exit codes
    if (counts.error > 0) {
        if (title.includes('Validation')) {
            console.error(`❌ Validation failed with ${counts.error} error(s) and ${counts.warning} warning(s)`);
            console.error('   Please fix errors before building.');
        } else {
            console.error(`⚠️  Some ${itemType} failed to ${title.includes('Image') ? 'optimize' : 'process'}. See errors above.`);
        }
        printSeparator();
        console.log(''); // Empty line before exit
        process.exit(1);
    } else if (counts.warning > 0 && exitOnWarnings) {
        console.log(`⚠️  ${title} complete with ${counts.warning} warning(s)`);
        console.log('   Build can proceed, but review warnings above.');
        printSeparator();
        console.log(''); // Empty line before exit
        process.exit(2);
    }
}

module.exports = {
    createProgressTracker,
    printSummary,
    printSeparator,
    printSectionHeader
};
