// ============================================
// UNIVERSAL KEYBOARD NAVIGATION
// ============================================
// Enables arrow key navigation between sections on any page
// Works with page transitions and dynamic content

class PageNavigation {
    constructor() {
        // ============================================
        // CONFIGURATION
        // ============================================

        this.SCROLL_BEHAVIOR = 'smooth'; // 'smooth' or 'auto'
        this.SCROLL_OFFSET = 0; // Offset from top in pixels (adjust if you have a fixed header)

        // ============================================
        // STATE
        // ============================================

        this.sections = [];
        this.currentSectionIndex = 0;
        this.isScrolling = false;
        this.scrollTimeout = null;

        // Bind methods to maintain context
        this.handleKeydown = this.handleKeydown.bind(this);
        this.updateCurrentSection = this.updateCurrentSection.bind(this);

        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        // Clean up existing listeners if re-initializing
        this.cleanup();

        // Dynamically find all navigable sections on the page
        this.findNavigableSections();

        if (this.sections.length === 0) {
            console.log('No navigable sections found for keyboard navigation');
            return;
        }

        // Set up keyboard event listener
        document.addEventListener('keydown', this.handleKeydown);

        // Track current section on scroll
        window.addEventListener('scroll', this.updateCurrentSection);

        // Initial section detection
        this.updateCurrentSection();

        console.log(`Keyboard navigation initialized with ${this.sections.length} sections`);
    }

    // ============================================
    // SECTION DISCOVERY
    // ============================================

    findNavigableSections() {
        // Find all major page elements in DOM order
        // This works on any page, not just specific case studies
        const selector = 'header, section, footer';
        const allElements = document.querySelectorAll(selector);

        this.sections = Array.from(allElements).filter(el => {
            // Must be visible and have some height
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return style.display !== 'none' &&
                   style.visibility !== 'hidden' &&
                   rect.height > 0;
        });
    }

    // ============================================
    // CLEANUP
    // ============================================

    cleanup() {
        // Remove existing event listeners
        document.removeEventListener('keydown', this.handleKeydown);
        window.removeEventListener('scroll', this.updateCurrentSection);

        // Clear any pending timeouts
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }

        // Reset state
        this.isScrolling = false;
        this.currentSectionIndex = 0;
    }

    // ============================================
    // KEYBOARD HANDLING
    // ============================================

    handleKeydown(event) {
        // Ignore if user is typing in an input field
        const activeElement = document.activeElement;
        if (
            activeElement &&
            (activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable)
        ) {
            return;
        }

        // Ignore if currently scrolling
        if (this.isScrolling) {
            return;
        }

        let targetIndex = -1;

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                // Previous section
                targetIndex = Math.max(0, this.currentSectionIndex - 1);
                if (targetIndex !== this.currentSectionIndex) {
                    event.preventDefault();
                    this.scrollToSection(targetIndex);
                }
                break;

            case 'ArrowRight':
            case 'ArrowDown':
                // Next section
                targetIndex = Math.min(this.sections.length - 1, this.currentSectionIndex + 1);
                if (targetIndex !== this.currentSectionIndex) {
                    event.preventDefault();
                    this.scrollToSection(targetIndex);
                }
                break;
        }
    }

    // ============================================
    // SCROLLING
    // ============================================

    scrollToSection(index) {
        if (index < 0 || index >= this.sections.length) {
            return;
        }

        const targetSection = this.sections[index];
        if (!targetSection) {
            return;
        }

        // Set scrolling flag
        this.isScrolling = true;

        // Clear any existing timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        // Calculate scroll position
        const targetPosition = targetSection.offsetTop + this.SCROLL_OFFSET;

        // Scroll to section
        window.scrollTo({
            top: targetPosition,
            behavior: this.SCROLL_BEHAVIOR,
        });

        // Update current section index
        this.currentSectionIndex = index;

        // Reset scrolling flag after animation completes
        this.scrollTimeout = setTimeout(
            () => {
                this.isScrolling = false;
            },
            this.SCROLL_BEHAVIOR === 'smooth' ? 500 : 100
        );
    }

    // ============================================
    // SECTION TRACKING
    // ============================================

    updateCurrentSection() {
        // Don't update during programmatic scrolling
        if (this.isScrolling) {
            return;
        }

        const scrollPosition = window.scrollY + window.innerHeight / 3;

        // Find the section that's currently in view
        for (let i = this.sections.length - 1; i >= 0; i--) {
            const section = this.sections[i];
            if (scrollPosition >= section.offsetTop) {
                this.currentSectionIndex = i;
                break;
            }
        }
    }
}

// ============================================
// GLOBAL INSTANCE & INITIALIZATION
// ============================================

let pageNavigationInstance = null;

// Expose global initialization function for page transitions
window.initializeCaseStudyNavigation = function() {
    // Clean up existing instance if it exists
    if (pageNavigationInstance) {
        pageNavigationInstance.cleanup();
    }

    // Create new instance
    pageNavigationInstance = new PageNavigation();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeCaseStudyNavigation);
} else {
    window.initializeCaseStudyNavigation();
}

// Re-initialize on page transitions
document.addEventListener('page:loaded', () => {
    window.initializeCaseStudyNavigation();
});
