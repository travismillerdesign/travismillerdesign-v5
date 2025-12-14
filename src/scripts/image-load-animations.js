/**
 * Image Load Animations
 *
 * Handles smooth fade-in and scale animations when images finish loading
 * Also smoothly animates content shifts caused by images loading
 * Uses IntersectionObserver and load events for optimal performance
 */

class ImageLoadAnimations {
    constructor() {
        this.images = [];

        // Detect mobile/tablet for more aggressive image loading
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

        // More aggressive loading on mobile to prevent blank screens
        // Mobile: start loading 400px before image enters viewport
        // Tablet: start loading 300px before
        // Desktop: start loading 200px before
        const margin = isMobile ? '400px' : isTablet ? '300px' : '200px';

        this.observerOptions = {
            root: null, // viewport
            rootMargin: margin, // Start loading before image enters viewport
            threshold: 0.01
        };

        this.init();
    }

    init() {
        // Find all images in the document
        this.findImages();

        // Set up the Intersection Observer
        this.setupObserver();

        // Observe all images
        this.observeImages();

        // Enable smooth content shift animations
        this.enableContentShiftAnimations();
    }

    findImages() {
        // Find all img elements and picture elements
        const imgElements = document.querySelectorAll('img');
        const pictureElements = document.querySelectorAll('picture');

        // Process img elements
        imgElements.forEach(img => {
            // Skip if already loaded (cached images)
            if (img.complete && img.naturalHeight !== 0) {
                img.classList.add('image-loaded');
            } else {
                img.classList.add('image-loading');
                this.images.push(img);
            }
        });

        // Process picture elements
        pictureElements.forEach(picture => {
            const img = picture.querySelector('img');
            if (img) {
                // Skip if already loaded (cached images)
                if (img.complete && img.naturalHeight !== 0) {
                    picture.classList.add('image-loaded');
                } else {
                    picture.classList.add('image-loading');
                    this.images.push(picture);
                }
            }
        });
    }

    setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);
    }

    observeImages() {
        this.images.forEach(element => {
            this.observer.observe(element);
        });
    }

    loadImage(element) {
        // Determine if this is a picture element or img element
        const img = element.tagName === 'PICTURE'
            ? element.querySelector('img')
            : element;

        if (!img) return;

        // If image is already loaded successfully (race condition)
        if (img.complete && img.naturalHeight !== 0) {
            this.onImageLoaded(element);
            return;
        }

        // If image already failed to load (race condition)
        if (img.complete && img.naturalHeight === 0) {
            element.classList.remove('image-loading');
            element.classList.add('image-failed');
            return;
        }

        // Set up load event listener
        const loadHandler = () => {
            this.onImageLoaded(element);
            img.removeEventListener('load', loadHandler);
            img.removeEventListener('error', errorHandler);
        };

        const errorHandler = () => {
            // On error, show grey placeholder instead of broken image icon
            element.classList.remove('image-loading');
            element.classList.add('image-failed');
            img.removeEventListener('load', loadHandler);
            img.removeEventListener('error', errorHandler);
        };

        img.addEventListener('load', loadHandler);
        img.addEventListener('error', errorHandler);
    }

    onImageLoaded(element) {
        // Small delay to ensure the layout has settled
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.classList.remove('image-loading');
                element.classList.add('image-loaded');
            });
        });
    }

    enableContentShiftAnimations() {
        // Add content-shift-animate class to elements that might shift
        // when images load (their siblings and parents)
        const containers = document.querySelectorAll('.flex-container, .contentBlock, section, article, main');

        containers.forEach(container => {
            // Only animate if container has images
            const hasImages = container.querySelector('img, picture');
            if (hasImages) {
                // Add animation class to direct children that might shift
                const children = container.children;
                Array.from(children).forEach(child => {
                    // Don't animate the images themselves, just surrounding content
                    if (!child.matches('img, picture') && !child.querySelector('img, picture')) {
                        child.classList.add('content-shift-animate');
                    }
                });
            }
        });
    }

    // Public method to refresh animations (useful after page transitions)
    refresh() {
        // Disconnect existing observer
        if (this.observer) {
            this.observer.disconnect();
        }

        // Clear images array
        this.images = [];

        // Re-initialize
        this.init();
    }

    // Public method to immediately show all images (useful for accessibility)
    showAll() {
        document.querySelectorAll('.image-loading').forEach(element => {
            element.classList.remove('image-loading');
            element.classList.add('image-loaded');
        });
    }
}

// Initialize image load animations
let imageLoadAnimations;

function initializeImageLoadAnimations() {
    imageLoadAnimations = new ImageLoadAnimations();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeImageLoadAnimations);
} else {
    initializeImageLoadAnimations();
}

// Re-initialize on page transitions
document.addEventListener('page:loaded', () => {
    if (imageLoadAnimations) {
        imageLoadAnimations.refresh();
    }
});

// Respect user's motion preferences
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // If user prefers reduced motion, show all images immediately
    document.addEventListener('DOMContentLoaded', () => {
        if (imageLoadAnimations) {
            imageLoadAnimations.showAll();
        }
    });
}
