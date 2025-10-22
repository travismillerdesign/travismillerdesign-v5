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
// HERO CANVAS - Iridescent Tile Assembly (converted from Processing)
// ============================================================================

const heroSketch = (p) => {
  let container;
  let visibilityHelper;

  let particles = [];
  let cols, rows;
  let cellSize = 10;
  let gap = 1;
  let totalTiles;

  let spawnTimer = 0;
  let spawnInterval = 0.01;
  let tilesSpawned = 4;

  let mouseRadius = 400;
  let mouseForce = 50;
  let lastMousePos;
  let mouseMoveDist = 0;

  // Spatial grid for efficient neighbor lookups
  let gridCols, gridRows;
  let gridCellSize = 120;
  let spatialGrid = [];

  // Track which tiles have been spawned
  let spawned = [];

  // Spawn weighting
  let spawnBias = 0;
  let fallbackFrequency = 8;
  let spawnAttemptCounter = 0;

  class Particle {
    constructor(tx, ty, r, c) {
      this.target = p.createVector(tx, ty);
      this.row = r;
      this.col = c;
      this.offset = p.createVector(0, 0);
      this.locked = false;

      this.age = 0;
      this.scale = 0;
      this.lifespan = p.random(3.5, 5.0);

      let verticalRange = p.height;
      let verticalCenter = p.height * 0.5;
      this.startPos = p.createVector(
        (1 - (spawned.length / totalTiles)) * window.innerWidth * 0.8,
        verticalCenter + p.random(-verticalRange/2, verticalRange/2)
      );
      this.pos = this.startPos.copy();

      this.noiseOffsetX = p.random(1000);
      this.noiseOffsetY = p.random(1000);
      this.scaleDelay = 0.3;
    }

    update() {
      this.age += 1.0 / (this.lifespan * 60);
      this.age = p.constrain(this.age, 0, 1);

      this.offset.mult(0.85);

      if (this.age < 1.0) {
        let noiseScale = 0.008;
        let noiseMag = 80 * (1 - this.age);

        let noiseX = (p.noise(this.noiseOffsetX + p.frameCount * noiseScale) - 0.5) * noiseMag;
        let noiseY = (p.noise(this.noiseOffsetY + p.frameCount * noiseScale) - 0.5) * noiseMag;

        let eased = this.easeInOutCubic(this.age);
        this.pos.x = p.lerp(this.startPos.x, this.target.x, eased) + noiseX;
        this.pos.y = p.lerp(this.startPos.y, this.target.y, eased) + noiseY;

        let scaleAge = p.constrain((this.age - this.scaleDelay) / (1 - this.scaleDelay), 0, 1);
        this.scale = this.easeOutCubic(scaleAge);

        this.locked = false;
      } else {
        if (!this.locked) {
          this.locked = true;
          this.pos.x = this.target.x;
          this.pos.y = this.target.y;
          this.scale = 1.0;
        }

        this.pos.x = this.target.x + this.offset.x;
        this.pos.y = this.target.y + this.offset.y;

        if (p.frameCount % 3 === 0) {
          this.scale = 1.0 + p.sin(p.frameCount * 0.02 + this.row * 0.3 + this.col * 0.2) * 0.015;
        }
      }
    }

    display() {
      if (this.scale < 0.01) return;

      // Iridescent gradient - pale shifting colors
      let gradientT = this.col / p.max(1, cols - 1);

      // HSB to RGB for smooth color transitions
      p.colorMode(p.HSB, 360, 100, 100);

      let hue = p.lerp(340, 60, gradientT);
      let saturation = p.lerp(25, 35, gradientT);
      let brightness = p.lerp(92, 96, gradientT);

      let baseColor = p.color(hue, saturation, brightness);

      // Convert back to RGB mode
      p.colorMode(p.RGB, 255);
      let baseR = p.red(baseColor);
      let baseG = p.green(baseColor);
      let baseB = p.blue(baseColor);

      // Start color (chaos) - light grey
      let startR = 220;
      let startG = 220;
      let startB = 225;

      // Blend from start grey to iridescent color
      let r = p.lerp(startR, baseR, this.age);
      let g = p.lerp(startG, baseG, this.age);
      let b = p.lerp(startB, baseB, this.age);

      let size = cellSize * this.scale;

      // Draw square
      p.noStroke();
      p.fill(r, g, b, 250);
      p.rectMode(p.CENTER);
      p.rect(this.pos.x + cellSize/2, this.pos.y + cellSize/2, size, size);

      // Subtle shimmer for locked tiles
      if (this.age >= 0.95) {
        let shimmer = p.sin(p.frameCount * 0.05 + this.row * 0.5 + this.col * 0.3) * 0.5 + 0.5;
        let shimmerAlpha = shimmer * 15;
        p.fill(r + 10, g + 10, b + 10, shimmerAlpha);
        p.rect(this.pos.x + cellSize/2, this.pos.y + cellSize/2, size + 2, size + 2);
      }
    }

    easeInOutCubic(t) {
      return (t < 0.5) ? 4 * t * t * t : 0.5 * p.pow(2 * t - 2, 3) + 1;
    }

    easeOutCubic(t) {
      return p.pow(t - 1, 3) + 1;
    }
  }

  function spawnNextTile() {
    let gridWidth = cols * (cellSize + gap) - gap;
    let gridHeight = rows * (cellSize + gap) - gap;
    let gridStartX = (p.width - gridWidth) / 2;
    let gridStartY = (p.height - gridHeight) / 2;

    spawnAttemptCounter++;

    let useSequential = (spawnAttemptCounter % fallbackFrequency === 0);

    if (useSequential) {
      // Sequential fallback - find first unspawned tile (right to left)
      for (let col = cols - 1; col >= 0; col--) {
        for (let row = 0; row < rows; row++) {
          if (!spawned[col][row]) {
            let targetX = gridStartX + col * (cellSize + gap);
            let targetY = gridStartY + row * (cellSize + gap);

            particles.push(new Particle(targetX, targetY, row, col));
            spawned[col][row] = true;
            tilesSpawned++;
            return;
          }
        }
      }
    } else {
      // Weighted random spawn
      let attempts = 0;
      let maxAttempts = 30;

      while (attempts < maxAttempts) {
        let colWeight = p.randomGaussian() * 3 + (cols - 1 - spawnBias);
        let col = p.constrain(p.floor(colWeight), 0, cols - 1);
        let row = p.floor(p.random(rows));

        if (!spawned[col][row]) {
          let targetX = gridStartX + col * (cellSize + gap);
          let targetY = gridStartY + row * (cellSize + gap);

          particles.push(new Particle(targetX, targetY, row, col));
          spawned[col][row] = true;
          tilesSpawned++;
          return;
        }

        attempts++;
      }
    }
  }

  function applyMouseInteraction() {
    let mouseCellX = p.floor(p.mouseX / gridCellSize);
    let mouseCellY = p.floor(p.mouseY / gridCellSize);
    let mousePos = p.createVector(p.mouseX, p.mouseY);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        let gx = mouseCellX + dx;
        let gy = mouseCellY + dy;

        if (gx >= 0 && gx < gridCols && gy >= 0 && gy < gridRows) {
          for (let particle of spatialGrid[gx][gy]) {
            let toMouse = p5.Vector.sub(particle.pos, mousePos);
            let distance = toMouse.mag();

            if (distance < mouseRadius && distance > 0) {
              toMouse.normalize();
              let strength = p.map(distance, 0, mouseRadius, mouseForce, 0);
              particle.offset.x += toMouse.x * strength * 0.1;
              particle.offset.y += toMouse.y * strength * 0.1;
            }
          }
        }
      }
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

    // Calculate responsive grid
    cols = p.floor(p.width / (cellSize + gap));
    rows = p.floor(p.height / (cellSize + gap));
    totalTiles = cols * rows;

    particles = [];
    lastMousePos = p.createVector(p.mouseX, p.mouseY);

    // Initialize spawn tracking
    spawned = [];
    for (let i = 0; i < cols; i++) {
      spawned[i] = [];
      for (let j = 0; j < rows; j++) {
        spawned[i][j] = false;
      }
    }

    // Initialize spatial grid
    gridCols = p.ceil(p.width / gridCellSize) + 1;
    gridRows = p.ceil(p.height / gridCellSize) + 1;
    spatialGrid = [];
    for (let i = 0; i < gridCols; i++) {
      spatialGrid[i] = [];
      for (let j = 0; j < gridRows; j++) {
        spatialGrid[i][j] = [];
      }
    }

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(245, 245, 248);

    // Calculate mouse movement
    let currentMouse = p.createVector(p.mouseX, p.mouseY);
    mouseMoveDist = p5.Vector.dist(lastMousePos, currentMouse);
    lastMousePos = currentMouse;

    // Gradually shift spawn bias from right to left
    spawnBias = p.map(tilesSpawned, 0, totalTiles, 0, cols);

    // Spawn tiles
    spawnTimer++;
    if (spawnTimer >= spawnInterval && tilesSpawned < totalTiles) {
      let spawnsThisFrame = 3;
      for (let i = 0; i < spawnsThisFrame && tilesSpawned < totalTiles; i++) {
        spawnNextTile();
      }
      spawnTimer = 0;
    }

    // Clear spatial grid
    for (let i = 0; i < gridCols; i++) {
      for (let j = 0; j < gridRows; j++) {
        spatialGrid[i][j] = [];
      }
    }

    // Update particles and populate spatial grid
    for (let particle of particles) {
      particle.update();

      // Add to spatial grid if locked
      if (particle.age >= 1.0) {
        let gx = p.floor(particle.pos.x / gridCellSize);
        let gy = p.floor(particle.pos.y / gridCellSize);
        gx = p.constrain(gx, 0, gridCols - 1);
        gy = p.constrain(gy, 0, gridRows - 1);
        spatialGrid[gx][gy].push(particle);
      }
    }

    // Apply mouse interaction if mouse has moved
    if (mouseMoveDist > 0.5) {
      applyMouseInteraction();
    }

    // Draw particles
    for (let particle of particles) {
      particle.display();
    }
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);

      // Recalculate grid for new size
      cols = p.floor(p.width / (cellSize + gap));
      rows = p.floor(p.height / (cellSize + gap));
      totalTiles = cols * rows;

      // Reset spatial grid
      gridCols = p.ceil(p.width / gridCellSize) + 1;
      gridRows = p.ceil(p.height / gridCellSize) + 1;
      spatialGrid = [];
      for (let i = 0; i < gridCols; i++) {
        spatialGrid[i] = [];
        for (let j = 0; j < gridRows; j++) {
          spatialGrid[i][j] = [];
        }
      }

      // Reset animation
      particles = [];
      tilesSpawned = 0;
      spawnTimer = 0;
      spawned = [];
      for (let i = 0; i < cols; i++) {
        spawned[i] = [];
        for (let j = 0; j < rows; j++) {
          spawned[i][j] = false;
        }
      }
    }
  };
};

// ============================================================================
// APPROACH CANVAS - Scroll-responsive particle animation
// ============================================================================

const approachSketch = (p) => {
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
    container = document.getElementById('approach-canvas');

    if (!container) {
      console.warn('Approach canvas container not found');
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

// DISCOVERY CANVAS - Scattered dots coalescing into patterns
// ============================================================================

const discoverySketch = (p) => {
  let container;
  let visibilityHelper;
  let particles = [];
  const PARTICLE_COUNT = 80;
  let time = 0;

  class DiscoveryParticle {
    constructor() {
      this.x = p.random(p.width);
      this.y = p.random(p.height);
      this.targetX = this.x;
      this.targetY = this.y;
      this.size = p.random(3, 10);
      this.hue = p.random(280, 320);
      this.opacity = p.random(150, 255);
      this.speed = p.random(0.02, 0.05);
    }

    update() {
      // Move toward target with easing
      this.x += (this.targetX - this.x) * this.speed;
      this.y += (this.targetY - this.y) * this.speed;

      // Occasionally set new target
      if (p.frameCount % 180 === 0 && p.random() < 0.3) {
        this.targetX = p.random(p.width);
        this.targetY = p.random(p.height);
      }

      // Add subtle drift
      this.x += p.sin(time + this.y * 0.01) * 0.5;
      this.y += p.cos(time + this.x * 0.01) * 0.5;

      // Wrap around edges
      if (this.x < 0) this.x = p.width;
      if (this.x > p.width) this.x = 0;
      if (this.y < 0) this.y = p.height;
      if (this.y > p.height) this.y = 0;
    }

    display() {
      p.noStroke();
      p.fill(this.hue, 70, 80, this.opacity);
      p.circle(this.x, this.y, this.size);

      // Draw connections to nearby particles
      for (let other of particles) {
        if (other !== this) {
          let d = p.dist(this.x, this.y, other.x, other.y);
          if (d < 100) {
            let alpha = p.map(d, 0, 100, 100, 0);
            p.stroke(this.hue, 50, 70, alpha);
            p.strokeWeight(1);
            p.line(this.x, this.y, other.x, other.y);
          }
        }
      }
    }
  }

  p.setup = () => {
    container = document.getElementById('discovery-canvas');

    if (!container) {
      console.warn('Discovery canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);
    p.colorMode(p.HSB, 360, 100, 100, 255);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new DiscoveryParticle());
    }

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(15, 20, 10, 30);
    time += 0.01;

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
// FOUNDATION CANVAS - Grid structure building from ground up
// ============================================================================

const foundationSketch = (p) => {
  let container;
  let visibilityHelper;
  let gridSize = 40;
  let cells = [];
  let time = 0;

  p.setup = () => {
    container = document.getElementById('foundation-canvas');

    if (!container) {
      console.warn('Foundation canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);
    p.colorMode(p.HSB, 360, 100, 100, 255);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    // Initialize grid cells
    for (let x = 0; x < p.width; x += gridSize) {
      for (let y = 0; y < p.height; y += gridSize) {
        cells.push({
          x: x,
          y: y,
          active: p.random() > 0.5,
          activationTime: p.random(1000)
        });
      }
    }

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(220, 15, 12);
    time += 0.02;

    cells.forEach((cell) => {
      // Gradually activate cells from bottom to top
      let activationWave = p.sin(time - cell.y * 0.005 + cell.activationTime * 0.001);
      let isActive = activationWave > 0;

      if (isActive) {
        let alpha = p.map(activationWave, 0, 1, 100, 255);
        let size = p.map(activationWave, 0, 1, 5, gridSize * 0.8);

        p.noStroke();
        p.fill(200, 40, 85, alpha);
        p.rectMode(p.CENTER);
        p.rect(cell.x + gridSize / 2, cell.y + gridSize / 2, size, size, 4);
      }
    });
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      cells = [];
      for (let x = 0; x < p.width; x += gridSize) {
        for (let y = 0; y < p.height; y += gridSize) {
          cells.push({
            x: x,
            y: y,
            active: p.random() > 0.5,
            activationTime: p.random(1000)
          });
        }
      }
    }
  };
};

// ============================================================================
// COMPONENTS CANVAS - Modular blocks assembling and rearranging
// ============================================================================

const componentsSketch = (p) => {
  let container;
  let visibilityHelper;
  let blocks = [];
  let time = 0;

  class Block {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = p.random(30, 80);
      this.h = p.random(30, 80);
      this.rotation = 0;
      this.targetRotation = 0;
      this.hue = p.random(160, 200);
    }

    update() {
      // Slowly rotate
      this.rotation += (this.targetRotation - this.rotation) * 0.05;

      // Change target rotation occasionally
      if (p.frameCount % 120 === 0 && p.random() < 0.1) {
        this.targetRotation += p.HALF_PI;
      }
    }

    display() {
      p.push();
      p.translate(this.x, this.y);
      p.rotate(this.rotation);

      // Draw block with subtle pulsing
      let pulse = p.sin(time + this.x * 0.01) * 5;
      p.noStroke();
      p.fill(this.hue, 60, 75, 200);
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.w + pulse, this.h + pulse, 8);

      // Inner highlight
      p.fill(this.hue, 40, 90, 100);
      p.rect(0, 0, (this.w + pulse) * 0.7, (this.h + pulse) * 0.7, 4);

      p.pop();
    }
  }

  p.setup = () => {
    container = document.getElementById('components-canvas');

    if (!container) {
      console.warn('Components canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);
    p.colorMode(p.HSB, 360, 100, 100, 255);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    // Create blocks in grid pattern
    for (let x = 60; x < p.width; x += 120) {
      for (let y = 60; y < p.height; y += 120) {
        blocks.push(new Block(x, y));
      }
    }

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(180, 10, 15);
    time += 0.02;

    blocks.forEach(block => {
      block.update();
      block.display();
    });
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      blocks = [];
      for (let x = 60; x < p.width; x += 120) {
        for (let y = 60; y < p.height; y += 120) {
          blocks.push(new Block(x, y));
        }
      }
    }
  };
};

// ============================================================================
// ADOPTION CANVAS - Network connections spreading organically
// ============================================================================

const adoptionSketch = (p) => {
  let container;
  let visibilityHelper;
  let nodes = [];
  const NODE_COUNT = 30;
  let time = 0;

  class Node {
    constructor() {
      this.x = p.random(p.width);
      this.y = p.random(p.height);
      this.size = p.random(5, 15);
      this.vx = p.random(-0.5, 0.5);
      this.vy = p.random(-0.5, 0.5);
      this.hue = 140;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > p.width) this.vx *= -1;
      if (this.y < 0 || this.y > p.height) this.vy *= -1;

      // Keep in bounds
      this.x = p.constrain(this.x, 0, p.width);
      this.y = p.constrain(this.y, 0, p.height);
    }

    display() {
      p.noStroke();
      p.fill(this.hue, 70, 85, 220);
      p.circle(this.x, this.y, this.size);

      // Glow effect
      p.fill(this.hue, 50, 95, 80);
      p.circle(this.x, this.y, this.size * 1.5);
    }
  }

  p.setup = () => {
    container = document.getElementById('adoption-canvas');

    if (!container) {
      console.warn('Adoption canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);
    p.colorMode(p.HSB, 360, 100, 100, 255);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push(new Node());
    }

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(140, 20, 8, 50);
    time += 0.01;

    // Update nodes
    nodes.forEach(node => node.update());

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let d = p.dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        if (d < 150) {
          let alpha = p.map(d, 0, 150, 150, 0);
          p.stroke(140, 60, 70, alpha);
          p.strokeWeight(2);
          p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        }
      }
    }

    // Draw nodes
    nodes.forEach(node => node.display());
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    }
  };
};

// ============================================================================
// SCALING CANVAS - Expanding concentric circles from center
// ============================================================================

const scalingSketch = (p) => {
  let container;
  let visibilityHelper;
  let ripples = [];
  let time = 0;
  let spawnTimer = 0;

  class Ripple {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 0;
      this.maxRadius = p.random(200, 400);
      this.speed = p.random(2, 4);
      this.hue = p.random(30, 60);
      this.alpha = 255;
    }

    update() {
      this.radius += this.speed;
      this.alpha = p.map(this.radius, 0, this.maxRadius, 255, 0);
    }

    display() {
      if (this.radius < this.maxRadius) {
        p.noFill();
        p.stroke(this.hue, 80, 85, this.alpha);
        p.strokeWeight(3);
        p.circle(this.x, this.y, this.radius * 2);
      }
    }

    isDead() {
      return this.radius >= this.maxRadius;
    }
  }

  p.setup = () => {
    container = document.getElementById('scaling-canvas');

    if (!container) {
      console.warn('Scaling canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);
    p.colorMode(p.HSB, 360, 100, 100, 255);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(40, 15, 12, 50);
    time += 0.01;

    // Spawn new ripples
    spawnTimer++;
    if (spawnTimer > 30) {
      ripples.push(new Ripple(p.width / 2, p.height / 2));
      spawnTimer = 0;
    }

    // Update and display ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].update();
      ripples[i].display();

      if (ripples[i].isDead()) {
        ripples.splice(i, 1);
      }
    }
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    }
  };
};

// ============================================================================
// ITERATION CANVAS - Cycling shapes transforming continuously
// ============================================================================

const iterationSketch = (p) => {
  let container;
  let visibilityHelper;
  let shapes = [];
  let time = 0;

  class IterativeShape {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = p.random(20, 60);
      this.rotation = p.random(p.TWO_PI);
      this.rotationSpeed = p.random(0.01, 0.03);
      this.hue = p.random(260, 320);
      this.shapeType = p.floor(p.random(3)); // 0: circle, 1: square, 2: triangle
      this.morphProgress = 0;
    }

    update() {
      this.rotation += this.rotationSpeed;
      this.morphProgress = (p.sin(time + this.x * 0.01) + 1) * 0.5;

      // Cycle through shapes
      if (p.frameCount % 180 === 0 && p.random() < 0.1) {
        this.shapeType = (this.shapeType + 1) % 3;
      }
    }

    display() {
      p.push();
      p.translate(this.x, this.y);
      p.rotate(this.rotation);

      let dynamicSize = this.size + p.sin(time * 2 + this.x) * 5;

      p.noStroke();
      p.fill(this.hue, 65, 80, 200);

      if (this.shapeType === 0) {
        // Circle
        p.circle(0, 0, dynamicSize);
      } else if (this.shapeType === 1) {
        // Square
        p.rectMode(p.CENTER);
        p.rect(0, 0, dynamicSize, dynamicSize, 5);
      } else {
        // Triangle
        p.triangle(
          0, -dynamicSize / 2,
          -dynamicSize / 2, dynamicSize / 2,
          dynamicSize / 2, dynamicSize / 2
        );
      }

      p.pop();
    }
  }

  p.setup = () => {
    container = document.getElementById('iteration-canvas');

    if (!container) {
      console.warn('Iteration canvas container not found');
      return;
    }

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);
    p.colorMode(p.HSB, 360, 100, 100, 255);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);

    // Create shapes in grid
    for (let x = 80; x < p.width; x += 120) {
      for (let y = 80; y < p.height; y += 120) {
        shapes.push(new IterativeShape(x, y));
      }
    }

    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) {
      return;
    }

    p.background(280, 20, 10, 40);
    time += 0.02;

    shapes.forEach(shape => {
      shape.update();
      shape.display();
    });
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      shapes = [];
      for (let x = 80; x < p.width; x += 120) {
        for (let y = 80; y < p.height; y += 120) {
          shapes.push(new IterativeShape(x, y));
        }
      }
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

  if (document.getElementById('approach-canvas')) {
    new p5(approachSketch);
  }

  if (document.getElementById('discovery-canvas')) {
    new p5(discoverySketch);
  }

  if (document.getElementById('foundation-canvas')) {
    new p5(foundationSketch);
  }

  if (document.getElementById('components-canvas')) {
    new p5(componentsSketch);
  }

  if (document.getElementById('adoption-canvas')) {
    new p5(adoptionSketch);
  }

  if (document.getElementById('scaling-canvas')) {
    new p5(scalingSketch);
  }

  if (document.getElementById('iteration-canvas')) {
    new p5(iterationSketch);
  }
}
