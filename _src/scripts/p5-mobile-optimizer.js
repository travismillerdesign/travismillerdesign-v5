// ============================================
// P5.JS MOBILE PERFORMANCE OPTIMIZER
// ============================================
// Reusable utility for optimizing P5.js sketches on mobile devices
// Provides device detection, adaptive settings, and performance monitoring

class P5MobileOptimizer {
    constructor() {
        this.deviceInfo = this.detectDevice();
        this.performanceSettings = this.getPerformanceSettings();
    }

    // ============================================
    // DEVICE DETECTION
    // ============================================

    detectDevice() {
        const ua = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(ua);
        const isAndroid = /android/.test(ua);
        const isMobile = isIOS || isAndroid || /mobile/.test(ua);
        const isTablet = /ipad/.test(ua) || (isAndroid && !/mobile/.test(ua));

        // Detect Chrome on iOS (uses WebKit but has different WebGL behavior)
        const isChromeIOS = isIOS && (/crios/.test(ua) || /chrome/.test(ua));

        // Detect Safari on iOS (excluding Chrome iOS)
        const isSafariIOS = isIOS && !isChromeIOS;

        // Detect GPU capability
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const hasWebGL = !!gl;

        // Get device pixel ratio
        const pixelRatio = window.devicePixelRatio || 1;

        // Detect performance tier based on available info
        const memory = navigator.deviceMemory || 4; // GB, defaults to 4 if not available
        const cores = navigator.hardwareConcurrency || 4;

        let performanceTier = 'high'; // desktop default
        if (isMobile) {
            // Low-end mobile: < 3GB RAM or < 4 cores
            if (memory < 3 || cores < 4) {
                performanceTier = 'low';
            }
            // Mid-tier mobile: 3-6GB RAM
            else if (memory < 6) {
                performanceTier = 'medium';
            }
            // High-end mobile: 6GB+ RAM
            else {
                performanceTier = 'high';
            }
        }

        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Check if battery saver might be active (low battery)
        let isLowPowerMode = false;
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                isLowPowerMode = battery.level < 0.2; // Below 20%
            });
        }

        return {
            isMobile,
            isTablet,
            isIOS,
            isAndroid,
            isChromeIOS,
            isSafariIOS,
            hasWebGL,
            pixelRatio,
            performanceTier,
            prefersReducedMotion,
            isLowPowerMode,
            memory,
            cores,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        };
    }

    // ============================================
    // PERFORMANCE SETTINGS
    // ============================================

    getPerformanceSettings() {
        const { isMobile, isChromeIOS, prefersReducedMotion, hasWebGL } = this.deviceInfo;

        // Simplified: Mobile vs Desktop settings
        let settings;

        if (isMobile) {
            // All mobile devices: reasonable performance
            settings = {
                targetFPS: 30,              // Balanced mobile FPS
                curveResolution: 800,       // Good quality curves
                enableShaders: false,       // Disable WebGL shaders on mobile (Chrome iOS compatibility)
                enableGradients: true,      // Keep gradients (essential for design)
                pixelDensity: 2,            // Better quality on Retina mobile screens
                maxParticles: 100,
                simplifyAnimations: false
            };
        } else {
            // Desktop: full quality
            settings = {
                targetFPS: 60,              // Full desktop FPS
                curveResolution: 2000,      // High quality curves
                enableShaders: hasWebGL,    // Use WebGL if available
                enableGradients: true,
                pixelDensity: undefined,    // Auto-detect (supports Retina displays)
                maxParticles: 200,
                simplifyAnimations: false
            };
        }

        // Override if user prefers reduced motion
        if (prefersReducedMotion) {
            settings.targetFPS = 0; // Static
            settings.simplifyAnimations = true;
            settings.enableShaders = false;
        }

        return settings;
    }

    // ============================================
    // P5.JS CANVAS SETUP
    // ============================================

    setupCanvas(p, containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return null;
        }

        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // Always use P2D renderer (default) for main canvas
        // WEBGL is only used for gradient buffers, not main sketches
        // This ensures correct coordinate system (origin at top-left)
        const canvas = p.createCanvas(width, height, p.P2D);
        canvas.parent(containerId);

        // Set pixel density
        // Mobile: 1 for performance
        // Desktop: undefined (auto-detect) for sharp Retina rendering
        const pixelDensity = this.performanceSettings.pixelDensity;
        if (pixelDensity !== undefined) {
            p.pixelDensity(pixelDensity);
        }
        // If undefined, P5.js auto-detects native density (1x, 2x, 3x)

        // Set target frame rate
        if (this.performanceSettings.targetFPS > 0) {
            p.frameRate(this.performanceSettings.targetFPS);
        } else {
            p.noLoop(); // Static for reduced motion
        }

        return canvas;
    }

    // ============================================
    // GRADIENT BUFFER OPTIMIZATION
    // ============================================

    createOptimizedGradientBuffer(p, options = {}) {
        const { enableShaders, enableGradients } = this.performanceSettings;

        // Skip gradient buffers on low-end devices
        if (!enableGradients) {
            return null;
        }

        // Use lower resolution buffer on mobile
        const scale = this.deviceInfo.isMobile ? 0.75 : 1.0;
        const width = Math.floor(p.width * scale);
        const height = Math.floor(p.height * scale);

        try {
            // Create WEBGL buffer if shaders are enabled (but NOT on Chrome iOS)
            if (enableShaders && this.deviceInfo.hasWebGL && !this.deviceInfo.isChromeIOS) {
                const buffer = p.createGraphics(width, height, p.WEBGL);
                buffer.pixelDensity(1); // Always 1 for buffers
                console.log('Created WEBGL gradient buffer');
                return buffer;
            }

            // Fallback to P2D buffer (works everywhere, including Chrome iOS)
            const buffer = p.createGraphics(width, height);
            buffer.pixelDensity(1);
            console.log('Created P2D gradient buffer');
            return buffer;
        } catch (error) {
            console.error('Failed to create gradient buffer:', error);
            return null;  // Will use solid background fallback
        }
    }

    // ============================================
    // TOUCH EVENT HELPERS
    // ============================================

    // Normalize touch/mouse position
    getInteractionPosition(p) {
        // P5.js automatically handles touch as mouse events
        // But we can provide normalized coordinates
        return {
            x: p.mouseX,
            y: p.mouseY,
            isTouch: p.touches && p.touches.length > 0
        };
    }

    // Check if user is interacting (touch or mouse)
    isInteracting(p) {
        return p.mouseIsPressed || (p.touches && p.touches.length > 0);
    }

    // ============================================
    // ADAPTIVE CURVE RESOLUTION
    // ============================================

    getCurveResolution(baseResolution) {
        const { curveResolution } = this.performanceSettings;

        // Use settings-based resolution, or fallback to provided base
        return curveResolution || baseResolution;
    }

    // ============================================
    // RESPONSIVE RESIZE HANDLER
    // ============================================

    createResizeHandler(p, containerId, onResize) {
        return () => {
            const container = document.getElementById(containerId);
            if (!container) return;

            const width = container.offsetWidth;
            const height = container.offsetHeight;

            p.resizeCanvas(width, height);

            // Call custom resize callback if provided
            if (onResize && typeof onResize === 'function') {
                onResize(width, height);
            }
        };
    }

    // ============================================
    // FPS MONITORING (OPTIONAL)
    // ============================================

    createFPSMonitor(p) {
        let frameCount = 0;
        let lastTime = performance.now();
        let fps = 60;

        return {
            update: () => {
                frameCount++;
                const currentTime = performance.now();
                const elapsed = currentTime - lastTime;

                if (elapsed >= 1000) {
                    fps = Math.round((frameCount * 1000) / elapsed);
                    frameCount = 0;
                    lastTime = currentTime;
                }

                return fps;
            },
            getFPS: () => fps,
            isPerformancePoor: () => fps < this.performanceSettings.targetFPS * 0.7
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    shouldUseSimplifiedAnimation() {
        return this.performanceSettings.simplifyAnimations;
    }

    shouldEnableShaders() {
        return this.performanceSettings.enableShaders;
    }

    shouldEnableGradients() {
        return this.performanceSettings.enableGradients;
    }

    getMaxParticles() {
        return this.performanceSettings.maxParticles;
    }

    // Log device info for debugging
    logDeviceInfo() {
        console.log('=== P5 Mobile Optimizer - Device Info ===');
        console.log('Device Type:', this.deviceInfo.isMobile ? 'Mobile' : 'Desktop');
        console.log('Browser:', this.deviceInfo.isSafariIOS ? 'Safari on iOS' : (this.deviceInfo.isChromeIOS ? 'Chrome on iOS' : (this.deviceInfo.isIOS ? 'iOS' : 'Other')));
        console.log('Screen:', `${this.deviceInfo.screenWidth}x${this.deviceInfo.screenHeight}`);
        console.log('Pixel Ratio:', this.deviceInfo.pixelRatio);
        console.log('WebGL Support:', this.deviceInfo.hasWebGL);
        console.log('---');
        console.log('Performance Settings:');
        console.log('  FPS:', this.performanceSettings.targetFPS);
        console.log('  Pixel Density:', this.performanceSettings.pixelDensity || 'Auto-detect');
        console.log('  Curve Resolution:', this.performanceSettings.curveResolution);
        console.log('  Gradients:', this.performanceSettings.enableGradients ? 'Enabled' : 'Disabled');
        console.log('  Shaders:', this.performanceSettings.enableShaders ? 'Enabled' : 'Disabled');
        if (this.deviceInfo.isMobile) {
            console.log('  📱 Mobile optimizations active');
        }
        console.log('========================================');
    }
}

// ============================================
// CREATE GLOBAL INSTANCE
// ============================================

// Create global instance for use across all sketches
window.p5MobileOptimizer = new P5MobileOptimizer();

// Always log device info for debugging mobile issues
window.p5MobileOptimizer.logDeviceInfo();
