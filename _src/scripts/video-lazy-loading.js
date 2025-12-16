/**
 * Video Lazy Loading
 *
 * Defers video loading until videos approach the viewport
 * Manages video playback based on visibility to save resources
 * Uses IntersectionObserver for performance
 */

class VideoLazyLoader {
    constructor() {
        this.lazyVideos = [];
        // Only enable debug logging on localhost
        this.debugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.loadObserverOptions = {
            root: null, // viewport
            rootMargin: '200px', // Start loading 200px before entering viewport
            threshold: 0
        };
        this.playbackObserverOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5 // Video must be 50% visible to play
        };

        this.loadObserver = null;
        this.playbackObserver = null;

        this.init();
    }

    init() {
        // Find all lazy-loading videos
        this.findLazyVideos();

        if (this.lazyVideos.length === 0) {
            return; // No videos to lazy load
        }

        // Set up observers
        this.setupLoadObserver();
        this.setupPlaybackObserver();

        // Observe all videos
        this.observeVideos();
    }

    findLazyVideos() {
        const videos = document.querySelectorAll('video[data-video-lazy]');
        this.lazyVideos = Array.from(videos);
    }

    setupLoadObserver() {
        this.loadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    this.loadVideo(video);
                    this.loadObserver.unobserve(video); // Stop observing after load
                }
            });
        }, this.loadObserverOptions);
    }

    setupPlaybackObserver() {
        this.playbackObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;

                if (entry.isIntersecting) {
                    // Video is visible - play if it has autoplay attribute
                    if (video.hasAttribute('autoplay')) {
                        this.playVideo(video);
                    }
                } else {
                    // Video left viewport - pause to save resources
                    this.pauseVideo(video);
                }
            });
        }, this.playbackObserverOptions);
    }

    observeVideos() {
        this.lazyVideos.forEach(video => {
            this.loadObserver.observe(video);
        });
    }

    loadVideo(video) {
        // Promote data-src to src for all source elements
        const sources = video.querySelectorAll('source[data-src]');
        sources.forEach(source => {
            source.src = source.dataset.src;
            source.removeAttribute('data-src');
        });

        // Load the video
        video.load();

        // Mark as loaded
        video.classList.add('loaded');
        video.removeAttribute('data-video-lazy');

        // Start observing for playback management
        this.playbackObserver.observe(video);
    }

    playVideo(video) {
        // Only play if video is loaded and not already playing
        if (video.readyState >= 2 && video.paused) {
            const playPromise = video.play();

            // Handle play promise for Safari compatibility
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Autoplay was prevented (can happen on mobile)
                    if (this.debugMode) {
                        console.log('Video autoplay prevented:', error);
                    }
                });
            }
        }
    }

    pauseVideo(video) {
        if (!video.paused) {
            video.pause();
        }
    }

    // Public method to refresh lazy loading (useful after page transitions)
    refresh() {
        // Disconnect existing observers
        if (this.loadObserver) {
            this.loadObserver.disconnect();
        }
        if (this.playbackObserver) {
            this.playbackObserver.disconnect();
        }

        // Re-initialize
        this.init();
    }

    // Public method to load all videos immediately (useful for accessibility)
    loadAll() {
        this.lazyVideos.forEach(video => {
            this.loadVideo(video);
        });
    }
}

// Initialize video lazy loading
let videoLazyLoader;

function initializeVideoLazyLoading() {
    videoLazyLoader = new VideoLazyLoader();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVideoLazyLoading);
} else {
    initializeVideoLazyLoading();
}

// Re-initialize on page transitions
document.addEventListener('page:loaded', () => {
    if (videoLazyLoader) {
        videoLazyLoader.refresh();
    }
});

// Respect user's motion preferences - load all videos immediately if reduced motion is preferred
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('DOMContentLoaded', () => {
        if (videoLazyLoader) {
            videoLazyLoader.loadAll();
        }
    });
}
