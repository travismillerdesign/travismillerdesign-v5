/**
 * Scroll-Triggered Animations
 *
 * Animates elements into view as they become visible in the viewport
 * Uses IntersectionObserver for performance
 */

class ScrollAnimations {
    constructor() {
        this.animatedElements = [];

        // Detect mobile/tablet for more aggressive animation triggering
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

        // Trigger animations before content enters viewport, but not too aggressively
        // Desktop: start 100px before element enters viewport
        // Tablet: start 150px before element enters viewport
        // Mobile: start 200px before element enters viewport
        const margin = isMobile ? '200px' : isTablet ? '150px' : '100px';

        this.observerOptions = {
            root: null, // viewport
            rootMargin: `0px 0px ${margin} 0px`, // Start animation before element fully enters viewport
            threshold: 0.01 // Trigger when just 1% of element is visible
        };

        this.init();
    }

    init() {
        // Find all elements that should animate on scroll
        this.findAnimatableElements();

        // Set up the Intersection Observer
        this.setupObserver();

        // Observe all elements
        this.observeElements();
    }

    findAnimatableElements() {
        // Target content inside sections/headers, not the backgrounds themselves
        // This keeps section/header backgrounds static while content fades in
        const selector = [
            '.workitem',                    // Work items
            '.featured-card',               // Featured cards
            '.textBlock',                   // Text blocks
            '.sectionLabel',                // Section labels
            '.heroLeft',                    // Hero left section
            '.heroRight',                   // Hero right section
            '.worklist-small',              // Small worklist container
            '.contentBlock',                // Content blocks on project pages
            '.flex-container > div > video', // Videos in flex containers
            '.flex-container > div > .vimeo-container', // Vimeo containers
            '.flex-container > div:has(> img)', // Flex items containing images
            '.flex-container > div:has(> picture)' // Flex items containing responsive images
        ].join(', ');

        // Query all at once and filter, preserving DOM order
        const allElements = document.querySelectorAll(selector);
        this.animatedElements = [];

        allElements.forEach(el => {
            // Skip footer elements and avoid duplicates
            if (!el.closest('footer') && !this.animatedElements.includes(el)) {
                this.animatedElements.push(el);
                el.classList.add('scroll-animate');
            }
        });
    }

    setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.handleVisibleElement(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);
    }

    handleVisibleElement(element) {
        // Check if element contains media that needs to load first
        const containsImage = element.querySelector('img, picture');
        const containsVideo = element.querySelector('video');

        if (containsImage) {
            // Wait for image to be loaded before animating
            this.waitForImageLoad(element, containsImage);
        } else if (containsVideo) {
            // Wait for video to be ready before animating
            this.waitForVideoLoad(element, containsVideo);
        } else {
            // No media, animate immediately
            element.classList.add('scroll-animate-visible');
        }
    }

    waitForImageLoad(element, mediaElement) {
        // Check if image/picture already has image-loaded class
        const img = mediaElement.tagName === 'PICTURE'
            ? mediaElement.querySelector('img')
            : mediaElement;

        const checkLoaded = () => {
            if (mediaElement.classList.contains('image-loaded') ||
                (img && img.complete && img.naturalHeight !== 0)) {
                element.classList.add('scroll-animate-visible');
                return true;
            }
            return false;
        };

        // Check immediately first
        if (checkLoaded()) return;

        // If not loaded, watch for the image-loaded class or img load event
        const observer = new MutationObserver(() => {
            if (checkLoaded()) {
                observer.disconnect();
            }
        });

        observer.observe(mediaElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Also listen for load event as fallback
        if (img) {
            img.addEventListener('load', () => {
                element.classList.add('scroll-animate-visible');
                observer.disconnect();
            }, { once: true });
        }

        // Timeout fallback - show after 2 seconds even if image hasn't loaded
        setTimeout(() => {
            element.classList.add('scroll-animate-visible');
            observer.disconnect();
        }, 2000);
    }

    waitForVideoLoad(element, video) {
        // Check if video is ready
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
            element.classList.add('scroll-animate-visible');
            return;
        }

        // Wait for video to be ready
        video.addEventListener('loadeddata', () => {
            element.classList.add('scroll-animate-visible');
        }, { once: true });

        // Timeout fallback - show after 2 seconds even if video hasn't loaded
        setTimeout(() => {
            element.classList.add('scroll-animate-visible');
        }, 2000);
    }

    observeElements() {
        this.animatedElements.forEach(element => {
            this.observer.observe(element);
        });
    }

    // Public method to refresh animations (useful after page transitions)
    refresh() {
        // Disconnect existing observer
        if (this.observer) {
            this.observer.disconnect();
        }

        // Re-initialize
        this.init();
    }

    // Public method to immediately show all elements (useful for accessibility)
    showAll() {
        this.animatedElements.forEach(element => {
            element.classList.add('scroll-animate-visible');
        });
    }
}

// Initialize scroll animations
let scrollAnimations;

function initializeScrollAnimations() {
    scrollAnimations = new ScrollAnimations();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScrollAnimations);
} else {
    initializeScrollAnimations();
}

// Re-initialize on page transitions
document.addEventListener('page:loaded', () => {
    if (scrollAnimations) {
        scrollAnimations.refresh();
    }
});

// Respect user's motion preferences
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // If user prefers reduced motion, show all elements immediately
    if (scrollAnimations) {
        scrollAnimations.showAll();
    }
}
