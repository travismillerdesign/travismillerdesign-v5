/**
 * Smooth Page Transitions
 *
 * Intercepts navigation clicks and adds fade transitions between pages
 * Works with static sites by loading content via fetch and updating the DOM
 * Only nav remains persistent - main content and footer transition together
 */

class PageTransitions {
    constructor() {
        this.transitionDuration = 500; // milliseconds
        this.isTransitioning = false;

        this.init();
    }

    init() {
        // Mark content that should transition (main and footer)
        this.prepareTransitionContent();

        // Intercept all internal navigation clicks
        this.interceptNavigationClicks();

        // Handle browser back/forward buttons
        this.handleBrowserNavigation();

        // Fade in on initial page load
        this.fadeIn();
    }

    prepareTransitionContent() {
        const main = document.querySelector('main');
        const footer = document.querySelector('footer');

        if (main) {
            main.classList.add('page-transition-content');
        }
        if (footer) {
            footer.classList.add('page-transition-content');
        }
    }

    interceptNavigationClicks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');

            // Check if it's an internal link
            if (link && this.isInternalLink(link)) {
                e.preventDefault();

                const url = link.getAttribute('href');
                this.navigateToPage(url);
            }
        });
    }

    isInternalLink(link) {
        // Don't intercept if:
        // - Link has target="_blank"
        // - Link is to external domain
        // - Link has download attribute
        // - Link is a hash link
        if (link.getAttribute('target') === '_blank') return false;
        if (link.hasAttribute('download')) return false;
        if (link.getAttribute('href')?.startsWith('#')) return false;
        if (link.getAttribute('href')?.startsWith('mailto:')) return false;
        if (link.getAttribute('href')?.startsWith('tel:')) return false;

        const href = link.getAttribute('href');
        if (!href) return false;

        // Check if external domain
        if (href.startsWith('http://') || href.startsWith('https://')) {
            return link.hostname === window.location.hostname;
        }

        return true;
    }

    async navigateToPage(url) {
        if (this.isTransitioning) return;

        // Don't transition if we're already on this page
        if (url === window.location.pathname) return;

        this.isTransitioning = true;

        try {
            // Fade out
            await this.fadeOut();

            // Fetch new page content
            const html = await this.fetchPage(url);

            // Update the page
            this.updatePage(html, url);

            // Scroll to top
            window.scrollTo(0, 0);

            // Fade in
            await this.fadeIn();

        } catch (error) {
            console.error('Page transition failed:', error);
            // Fallback to regular navigation
            window.location.href = url;
        } finally {
            this.isTransitioning = false;
        }
    }

    async fetchPage(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.status}`);
        }

        return await response.text();
    }

    updatePage(html, url) {
        // Parse the new HTML
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        // Update the title
        document.title = newDoc.title;

        // Update the main content
        const newMain = newDoc.querySelector('main');
        const currentMain = document.querySelector('main');

        if (newMain && currentMain) {
            currentMain.innerHTML = newMain.innerHTML;
        }

        // Update the footer
        const newFooter = newDoc.querySelector('footer');
        const currentFooter = document.querySelector('footer');

        if (newFooter && currentFooter) {
            currentFooter.innerHTML = newFooter.innerHTML;
        }

        // Update navigation active states
        this.updateNavigationState(url);

        // Update browser history
        window.history.pushState({ path: url }, '', url);

        // Re-initialize any scripts that need to run on the new content
        this.reinitializeScripts();
    }

    updateNavigationState(currentPath) {
        // Remove active states from all nav links
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');

            // Add active class if this link matches current path
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }

    reinitializeScripts() {
        // Trigger a custom event that other scripts can listen to
        const event = new CustomEvent('page:loaded');
        document.dispatchEvent(event);

        // Re-run any case study animations if they exist
        if (window.initializeCaseStudyAnimations) {
            window.initializeCaseStudyAnimations();
        }

        // Re-run case study navigation if it exists
        if (window.initializeCaseStudyNavigation) {
            window.initializeCaseStudyNavigation();
        }
    }

    handleBrowserNavigation() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.path) {
                this.navigateToPage(e.state.path);
            }
        });
    }

    fadeOut() {
        return new Promise((resolve) => {
            const main = document.querySelector('main');
            const footer = document.querySelector('footer');

            if (main) {
                main.classList.add('page-transitioning-out');
            }
            if (footer) {
                footer.classList.add('page-transitioning-out');
            }

            setTimeout(resolve, this.transitionDuration);
        });
    }

    fadeIn() {
        return new Promise((resolve) => {
            const main = document.querySelector('main');
            const footer = document.querySelector('footer');

            // Small delay to ensure content is rendered
            setTimeout(() => {
                if (main) {
                    main.classList.remove('page-transitioning-out');
                    main.classList.add('page-transitioning-in');

                    // Remove the transitioning-in class after animation completes
                    setTimeout(() => {
                        main.classList.remove('page-transitioning-in');
                    }, this.transitionDuration);
                }

                if (footer) {
                    footer.classList.remove('page-transitioning-out');
                    footer.classList.add('page-transitioning-in');

                    // Remove the transitioning-in class after animation completes
                    setTimeout(() => {
                        footer.classList.remove('page-transitioning-in');
                    }, this.transitionDuration);
                }

                setTimeout(resolve, this.transitionDuration);
            }, 50);
        });
    }
}

// Initialize page transitions when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PageTransitions();
    });
} else {
    new PageTransitions();
}
