/**
 * Scroll-Triggered Animations
 *
 * Animates elements into view as they become visible in the viewport
 * Uses IntersectionObserver for performance
 */

class ScrollAnimations {
    constructor() {
        this.animatedElements = [];
        this.observerOptions = {
            root: null, // viewport
            rootMargin: '0px', // Trigger as soon as element enters viewport
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
                    entry.target.classList.add('scroll-animate-visible');
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);
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
