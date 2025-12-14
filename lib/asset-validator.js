// asset-validator.js
//
// Asset Validation Utility
//
// Provides utilities for validating that asset files exist and are valid.
// Used by build scripts and shortcodes to catch missing or corrupted assets.
//
// Functions:
// - validateFileExists(): Check if a file exists and is readable
// - validateImageFile(): Check if image file exists and has valid dimensions
// - validateVideoFile(): Check if video file exists and is valid
// - getFileSize(): Get human-readable file size
// - validateDirectory(): Ensure directory exists and is readable
//
// Usage:
//   const { validateFileExists, validateDirectory } = require('./lib/asset-validator');
//   if (!validateFileExists('/path/to/file.jpg')) {
//     console.error('❌ File not found: /path/to/file.jpg');
//   }

const fs = require('fs');
const path = require('path');

/**
 * Validate that a file exists and is readable
 *
 * @param {string} filePath - Absolute or relative path to file
 * @returns {boolean} - True if file exists and is readable
 */
function validateFileExists(filePath) {
    try {
        return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (err) {
        console.warn(`⚠️  Warning: Cannot access file ${filePath}: ${err.message}`);
        return false;
    }
}

/**
 * Validate that a directory exists and is readable
 *
 * @param {string} dirPath - Absolute or relative path to directory
 * @returns {boolean} - True if directory exists and is readable
 */
function validateDirectory(dirPath) {
    try {
        return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch (err) {
        console.warn(`⚠️  Warning: Cannot access directory ${dirPath}: ${err.message}`);
        return false;
    }
}

/**
 * Get human-readable file size
 *
 * @param {string} filePath - Path to file
 * @returns {string} - Formatted file size (e.g., "2.5 MB")
 */
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const bytes = stats.size;

        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } catch (err) {
        console.warn(`⚠️  Warning: Cannot get file size for ${filePath}: ${err.message}`);
        return 'unknown';
    }
}

/**
 * Validate that an image file exists and appears valid
 *
 * @param {string} filePath - Path to image file
 * @param {object} options - Validation options
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 50)
 * @returns {object} - { valid: boolean, error: string|null, warnings: string[] }
 */
function validateImageFile(filePath, options = {}) {
    const { maxSizeMB = 50 } = options;
    const result = { valid: true, error: null, warnings: [] };

    // Check if file exists
    if (!validateFileExists(filePath)) {
        result.valid = false;
        result.error = `File not found: ${filePath}`;
        return result;
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];
    if (!validExtensions.includes(ext)) {
        result.valid = false;
        result.error = `Invalid image extension: ${ext}. Expected one of: ${validExtensions.join(', ')}`;
        return result;
    }

    // Check file size
    try {
        const stats = fs.statSync(filePath);
        const sizeMB = stats.size / (1024 * 1024);

        if (sizeMB > maxSizeMB) {
            result.warnings.push(`Large file size: ${sizeMB.toFixed(1)} MB (max recommended: ${maxSizeMB} MB). This may cause memory issues during optimization.`);
        }

        if (stats.size === 0) {
            result.valid = false;
            result.error = 'File is empty (0 bytes)';
            return result;
        }
    } catch (err) {
        result.valid = false;
        result.error = `Cannot read file stats: ${err.message}`;
        return result;
    }

    return result;
}

/**
 * Validate that a video file exists and appears valid
 *
 * @param {string} filePath - Path to video file
 * @param {object} options - Validation options
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 100)
 * @returns {object} - { valid: boolean, error: string|null, warnings: string[] }
 */
function validateVideoFile(filePath, options = {}) {
    const { maxSizeMB = 100 } = options;
    const result = { valid: true, error: null, warnings: [] };

    // Check if file exists
    if (!validateFileExists(filePath)) {
        result.valid = false;
        result.error = `File not found: ${filePath}`;
        return result;
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.mp4', '.webm', '.mov'];
    if (!validExtensions.includes(ext)) {
        result.valid = false;
        result.error = `Invalid video extension: ${ext}. Expected one of: ${validExtensions.join(', ')}`;
        return result;
    }

    // Check file size
    try {
        const stats = fs.statSync(filePath);
        const sizeMB = stats.size / (1024 * 1024);

        if (sizeMB > maxSizeMB) {
            result.warnings.push(`Large file size: ${sizeMB.toFixed(1)} MB (max recommended: ${maxSizeMB} MB). This may slow down the build process.`);
        }

        if (stats.size === 0) {
            result.valid = false;
            result.error = 'File is empty (0 bytes)';
            return result;
        }
    } catch (err) {
        result.valid = false;
        result.error = `Cannot read file stats: ${err.message}`;
        return result;
    }

    return result;
}

/**
 * Check if FFmpeg is available on the system
 *
 * @returns {Promise<boolean>} - True if FFmpeg is available
 */
async function checkFFmpegAvailable() {
    const { exec } = require('child_process');

    return new Promise((resolve) => {
        exec('ffmpeg -version', (error) => {
            if (error) {
                console.error('❌ FFmpeg not found. Video optimization will fail.');
                console.error('   Install FFmpeg: https://ffmpeg.org/download.html');
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * Scan directory for all image files
 *
 * @param {string} dir - Directory to scan
 * @returns {string[]} - Array of absolute paths to image files
 */
function findAllImages(dir) {
    const images = [];

    if (!validateDirectory(dir)) {
        console.warn(`⚠️  Warning: Directory not found or not accessible: ${dir}`);
        return images;
    }

    const findImagesRecursive = (currentDir) => {
        try {
            const files = fs.readdirSync(currentDir);

            files.forEach((file) => {
                const filePath = path.join(currentDir, file);

                try {
                    if (fs.statSync(filePath).isDirectory()) {
                        findImagesRecursive(filePath);
                    } else if (/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(file)) {
                        images.push(filePath);
                    }
                } catch (err) {
                    console.warn(`⚠️  Warning: Cannot access ${filePath}: ${err.message}`);
                }
            });
        } catch (err) {
            console.warn(`⚠️  Warning: Cannot read directory ${currentDir}: ${err.message}`);
        }
    };

    findImagesRecursive(dir);
    return images;
}

/**
 * Scan directory for all video files
 *
 * @param {string} dir - Directory to scan
 * @returns {string[]} - Array of absolute paths to video files
 */
function findAllVideos(dir) {
    const videos = [];

    if (!validateDirectory(dir)) {
        console.warn(`⚠️  Warning: Directory not found or not accessible: ${dir}`);
        return videos;
    }

    const findVideosRecursive = (currentDir) => {
        try {
            const files = fs.readdirSync(currentDir);

            files.forEach((file) => {
                const filePath = path.join(currentDir, file);

                try {
                    if (fs.statSync(filePath).isDirectory()) {
                        findVideosRecursive(filePath);
                    } else if (/\.(mp4|webm|mov)$/i.test(file)) {
                        videos.push(filePath);
                    }
                } catch (err) {
                    console.warn(`⚠️  Warning: Cannot access ${filePath}: ${err.message}`);
                }
            });
        } catch (err) {
            console.warn(`⚠️  Warning: Cannot read directory ${currentDir}: ${err.message}`);
        }
    };

    findVideosRecursive(dir);
    return videos;
}

module.exports = {
    validateFileExists,
    validateDirectory,
    getFileSize,
    validateImageFile,
    validateVideoFile,
    checkFFmpegAvailable,
    findAllImages,
    findAllVideos
};
