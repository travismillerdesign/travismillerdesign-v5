// Case Study P5.js Animations
// Using instance mode for better performance and namespace isolation

// ============================================================================
// INTERSECTION OBSERVER SETUP
// Only runs animations when they're visible in viewport
// ============================================================================

const createVisibilityObserver = (sketch, threshold = 0.1) => {
  let isVisible = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;

      // Pause/resume animation loop based on visibility
      if (isVisible && sketch.isLooping() === false) {
        sketch.loop();
      } else if (!isVisible && sketch.isLooping() === true) {
        sketch.noLoop();
      }
    });
  }, {
    threshold: threshold,
    rootMargin: '50px' // Start animating slightly before visible
  });

  return { observer, isVisible: () => isVisible };
};

// ============================================================================
// SCROLL TRACKING
// Track scroll position for scroll-reactive animations
// ============================================================================

class ScrollTracker {
  constructor() {
    this.scrollY = window.scrollY;
    this.scrollProgress = 0;
    this.documentHeight = document.documentElement.scrollHeight - window.innerHeight;

    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY;
      this.scrollProgress = this.scrollY / this.documentHeight;
    }, { passive: true });

    // Update document height on resize
    window.addEventListener('resize', () => {
      this.documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    }, { passive: true });
  }

  getScrollY() {
    return this.scrollY;
  }

  getScrollProgress() {
    return this.scrollProgress;
  }
}

const scrollTracker = new ScrollTracker();

// ============================================================================
// HERO CANVAS - Scroll-responsive background animation
// ============================================================================

const heroSketch = (p) => {
  let container;
  let visibilityHelper;
  let particles = [];
  const PARTICLE_COUNT = 50;

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = p.random(p.width);
      this.y = p.random(p.height);
      this.size = p.random(2, 8);
      this.speedX = p.random(-0.5, 0.5);
      this.speedY = p.random(-0.5, 0.5);
      this.opacity = p.random(100, 255);
    }

    update() {
      // Add scroll influence to movement
      const scrollInfluence = scrollTracker.getScrollProgress() * 2;

      // Mouse interaction - particles are attracted to mouse
      if (p.mouseX > 0 && p.mouseY > 0) {
        const mouseDistance = p.dist(this.x, this.y, p.mouseX, p.mouseY);
        if (mouseDistance < 150) {
          const angle = p.atan2(p.mouseY - this.y, p.mouseX - this.x);
          const force = p.map(mouseDistance, 0, 150, 2, 0);
          this.x += p.cos(angle) * force;
          this.y += p.sin(angle) * force;
        }
      }

      this.x += this.speedX + scrollInfluence;
      this.y += this.speedY;

      // Wrap around edges
      if (this.x < 0) this.x = p.width;
      if (this.x > p.width) this.x = 0;
      if (this.y < 0) this.y = p.height;
      if (this.y > p.height) this.y = 0;
    }

    display() {
      p.noStroke();
      p.fill(100, 150, 255, this.opacity);
      p.circle(this.x, this.y, this.size);
    }
  }

  p.setup = () => {
    container = document.getElementById('hero-canvas');

    if (!container) {
      console.warn('Hero canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    // Set up visibility observer
    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    // Start with loop paused until visible
    p.noLoop();
  };

  p.draw = () => {
    // Only draw if visible
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    // Clear with semi-transparent background for trail effect
    p.background(10, 10, 20, 25);

    // Update and display particles
    particles.forEach(particle => {
      particle.update();
      particle.display();
    });
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    }
  };
};

// ============================================================================
// OVERVIEW CANVAS - Simple ambient animation
// ============================================================================

const overviewSketch = (p) => {
  let container;
  let visibilityHelper;
  let time = 0;

  p.setup = () => {
    container = document.getElementById('overview-canvas');

    if (!container) {
      console.warn('Overview canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(15, 15, 25);

    // Mouse interaction - waves respond to mouse Y position
    const mouseInfluence = p.mouseY > 0 ? p.map(p.mouseY, 0, p.height, -20, 20) : 0;

    // Simple wave pattern
    p.noFill();
    p.stroke(80, 120, 200, 150);
    p.strokeWeight(2);

    for (let i = 0; i < 5; i++) {
      p.beginShape();
      for (let x = 0; x < p.width; x += 10) {
        const y = p.height / 2 +
                  p.sin(x * 0.01 + time + i * 0.5) * 30 +
                  p.sin(x * 0.02 + time * 0.5) * 20 +
                  mouseInfluence;
        p.vertex(x, y + i * 40);
      }
      p.endShape();
    }

    // Draw a subtle circle at mouse position
    if (p.mouseX > 0 && p.mouseY > 0) {
      p.noFill();
      p.stroke(100, 150, 255, 100);
      p.strokeWeight(2);
      p.circle(p.mouseX, p.mouseY, 40);
    }

    time += 0.02;
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    }
  };
};

// ============================================================================
// CHALLENGE CANVAS - Grid-based animation
// ============================================================================

const challengeSketch = (p) => {
  let container;
  let visibilityHelper;
  let gridSize = 30;
  let time = 0;

  p.setup = () => {
    container = document.getElementById('challenge-canvas');

    if (!container) {
      console.warn('Challenge canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(20, 20, 30);

    // Animated grid - responds to mouse position
    for (let x = 0; x < p.width; x += gridSize) {
      for (let y = 0; y < p.height; y += gridSize) {
        // Distance from center for base animation
        const centerDistance = p.dist(x, y, p.width / 2, p.height / 2);

        // Distance from mouse for interaction
        let mouseDistance = p.width; // Default large distance
        if (p.mouseX > 0 && p.mouseY > 0) {
          mouseDistance = p.dist(x, y, p.mouseX, p.mouseY);
        }

        // Combine center animation with mouse interaction
        const baseSize = p.map(
          p.sin(centerDistance * 0.05 - time),
          -1, 1,
          2, gridSize * 0.8
        );

        // Make circles larger when mouse is near
        const mouseEffect = mouseDistance < 200 ?
          p.map(mouseDistance, 0, 200, gridSize * 1.5, 0) : 0;

        const size = p.constrain(baseSize + mouseEffect, 2, gridSize * 1.5);

        // Color changes based on mouse proximity
        const hue = mouseDistance < 200 ?
          p.map(mouseDistance, 0, 200, 180, 60) : 60;

        p.noStroke();
        p.fill(hue, 100, 180, 100);
        p.circle(x + gridSize / 2, y + gridSize / 2, size);
      }
    }

    time += 0.05;
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    }
  };
};

// ============================================================================
// INITIALIZE ALL SKETCHES
// ============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSketches);
} else {
  initSketches();
}

function initSketches() {
  // Only initialize sketches if their containers exist
  if (document.getElementById('hero-canvas')) {
    new p5(heroSketch);
  }

  if (document.getElementById('overview-canvas')) {
    new p5(overviewSketch);
  }

  if (document.getElementById('challenge-canvas')) {
    new p5(challengeSketch);
  }
}
