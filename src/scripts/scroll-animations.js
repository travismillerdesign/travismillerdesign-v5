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
            rootMargin: '0px 0px -100px 0px', // Trigger slightly before element enters viewport
            threshold: 0.1 // Trigger when 10% of element is visible
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
        // Target specific inner content elements (not section/header backgrounds)
        const selectors = [
            '.workitem',                    // Work items
            '.featured-card',               // Featured cards
            '.case-study-section > *',      // Content inside case study sections (not section itself)
            '.section-label',               // Section labels
            '.sectionLabel',                // Section labels (alternative)
            '.content-block',               // Content blocks
            'article > *',                  // Content inside articles (not article itself)
            '.experiment-item',             // Experiment items
            '.flex-container > *',          // Children of flex containers
            'main > :not(section):not(header):not(footer)', // Direct main children, excluding containers
            'section > *:not(section)',     // Direct children of sections (not nested sections)
            'header > *:not(nav)',          // Content inside headers (not nav)
            'p',                            // Paragraphs
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', // Headings
            'img',                          // Images
            '.button',                      // Buttons
            'ul:not(footer ul)',            // Lists (not in footer)
            'ol:not(footer ol)',            // Ordered lists (not in footer)
            'li'                            // List items
        ];

        // Collect all matching elements
        this.animatedElements = [];
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Avoid duplicates and skip footer elements
                if (!this.animatedElements.includes(el) && !el.closest('footer')) {
                    this.animatedElements.push(el);
                    el.classList.add('scroll-animate');
                }
            });
        });
    }

    setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Element is in viewport, trigger animation
                    entry.target.classList.add('scroll-animate-visible');

                    // Stop observing after animation (only animate once)
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
