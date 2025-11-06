// ============================================
// CASE STUDY KEYBOARD NAVIGATION
// ============================================
// Enables arrow key navigation between case study sections

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================

    const SCROLL_BEHAVIOR = 'smooth'; // 'smooth' or 'auto'
    const SCROLL_OFFSET = 0; // Offset from top in pixels (adjust if you have a fixed header)

    // Section selectors in order
    const SECTION_SELECTORS = [
        '.page-header',
        '#overview',
        '#approach',
        '#foundation-principles',
        '#implementation',
        '#enablement',
        '#evolution',
        '#impact',
        '#principles',
    ];

    // ============================================
    // STATE
    // ============================================

    let sections = [];
    let currentSectionIndex = 0;
    let isScrolling = false;
    let scrollTimeout = null;

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        // Get all sections
        sections = SECTION_SELECTORS.map((selector) => document.querySelector(selector)).filter(
            (section) => section !== null
        );

        if (sections.length === 0) {
            console.warn('No case study sections found for keyboard navigation');
            return;
        }

        // Set up keyboard event listener
        document.addEventListener('keydown', handleKeydown);

        // Track current section on scroll
        window.addEventListener('scroll', updateCurrentSection);

        // Initial section detection
        updateCurrentSection();

        console.log(`Keyboard navigation initialized with ${sections.length} sections`);
    }

    // ============================================
    // KEYBOARD HANDLING
    // ============================================

    function handleKeydown(event) {
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
        if (isScrolling) {
            return;
        }

        let targetIndex = -1;

        switch (event.key) {
            case 'ArrowLeft':
                // Previous section
                targetIndex = Math.max(0, currentSectionIndex - 1);
                if (targetIndex !== currentSectionIndex) {
                    event.preventDefault();
                    scrollToSection(targetIndex);
                }
                break;

            case 'ArrowRight':
                // Next section
                targetIndex = Math.min(sections.length - 1, currentSectionIndex + 1);
                if (targetIndex !== currentSectionIndex) {
                    event.preventDefault();
                    scrollToSection(targetIndex);
                }
                break;
        }
    }

    // ============================================
    // SCROLLING
    // ============================================

    function scrollToSection(index) {
        if (index < 0 || index >= sections.length) {
            return;
        }

        const targetSection = sections[index];
        if (!targetSection) {
            return;
        }

        // Set scrolling flag
        isScrolling = true;

        // Clear any existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Calculate scroll position
        const targetPosition = targetSection.offsetTop + SCROLL_OFFSET;

        // Scroll to section
        window.scrollTo({
            top: targetPosition,
            behavior: SCROLL_BEHAVIOR,
        });

        // Update current section index
        currentSectionIndex = index;

        // Reset scrolling flag after animation completes
        scrollTimeout = setTimeout(
            () => {
                isScrolling = false;
            },
            SCROLL_BEHAVIOR === 'smooth' ? 500 : 100
        );
    }

    // ============================================
    // SECTION TRACKING
    // ============================================

    function updateCurrentSection() {
        // Don't update during programmatic scrolling
        if (isScrolling) {
            return;
        }

        const scrollPosition = window.scrollY + window.innerHeight / 3;

        // Find the section that's currently in view
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            if (scrollPosition >= section.offsetTop) {
                currentSectionIndex = i;
                break;
            }
        }
    }

    // ============================================
    // AUTO-INITIALIZE
    // ============================================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
