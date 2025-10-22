// Case Study P5.js Animations - Clean, Focused Visual Metaphors
// Each sketch has ONE clear concept with flat design + beautiful gradients

// ============================================================================
// INTERSECTION OBSERVER SETUP
// ============================================================================

const createVisibilityObserver = (sketch, threshold = 0.1) => {
  let isVisible = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible && sketch.isLooping() === false) {
        sketch.loop();
      } else if (!isVisible && sketch.isLooping() === true) {
        sketch.noLoop();
      }
    });
  }, {
    threshold: threshold,
    rootMargin: '50px'
  });
  return { observer, isVisible: () => isVisible };
};

// ============================================================================
// HERO CANVAS - Chaos to Order
// Visual Metaphor: LEFT scattered dots → RIGHT organized grid
// ============================================================================

const heroSketch = (p) => {
  let container, visibilityHelper;
  let dots = [];
  let time = 0;
  const GRID_SIZE = 30;

  class Dot {
    constructor(index, gridX, gridY) {
      this.gridX = gridX;
      this.gridY = gridY;

      // Chaos position (left, scattered)
      this.chaosX = p.random(p.width * 0.1, p.width * 0.4);
      this.chaosY = p.random(p.height * 0.1, p.height * 0.9);

      // Order position (right, grid)
      this.orderX = p.width * 0.6 + gridX * GRID_SIZE;
      this.orderY = p.height * 0.2 + gridY * GRID_SIZE;

      this.x = this.chaosX;
      this.y = this.chaosY;
      this.phase = p.random(p.TWO_PI);
    }

    update(mouseInfluence) {
      // Oscillate between chaos and order
      let progress = (p.sin(time * 0.5 + this.phase) + 1) * 0.5;
      progress = p.constrain(progress + mouseInfluence, 0, 1);

      this.x = p.lerp(this.chaosX, this.orderX, progress);
      this.y = p.lerp(this.chaosY, this.orderY, progress);

      return progress;
    }

    display(progress) {
      // Gradient: warm gray → cyan
      let hue = p.lerp(240, 190, progress);
      let sat = p.lerp(5, 65, progress);
      let bri = p.lerp(70, 85, progress);

      p.colorMode(p.HSB, 360, 100, 100);
      p.noStroke();
      p.fill(hue, sat, bri);
      p.circle(this.x, this.y, 8);
    }
  }

  p.setup = () => {
    container = document.getElementById('hero-canvas');
    if (!container) return;

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    let cols = Math.floor(p.width * 0.3 / GRID_SIZE);
    let rows = Math.floor(p.height * 0.6 / GRID_SIZE);

    for (let i = 0; i < cols * rows; i++) {
      let gx = i % cols;
      let gy = Math.floor(i / cols);
      dots.push(new Dot(i, gx, gy));
    }

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);
    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) return;

    // Soft gradient background
    p.colorMode(p.RGB, 255);
    let ctx = p.drawingContext;
    let gradient = ctx.createLinearGradient(0, 0, p.width, 0);
    gradient.addColorStop(0, '#F5F5F8');
    gradient.addColorStop(1, '#E8F4F8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, p.width, p.height);

    time += 0.01;

    // Mouse hover speeds up transformation
    let mouseInfluence = 0;
    if (p.mouseX > 0 && p.mouseY > 0) {
      let centerX = p.width / 2;
      let centerY = p.height / 2;
      let d = p.dist(p.mouseX, p.mouseY, centerX, centerY);
      mouseInfluence = p.map(d, 0, p.width * 0.3, 0.3, 0, true);
    }

    dots.forEach(dot => {
      let progress = dot.update(mouseInfluence);
      dot.display(progress);
    });
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      dots = [];
      let cols = Math.floor(p.width * 0.3 / GRID_SIZE);
      let rows = Math.floor(p.height * 0.6 / GRID_SIZE);
      for (let i = 0; i < cols * rows; i++) {
        let gx = i % cols;
        let gy = Math.floor(i / cols);
        dots.push(new Dot(i, gx, gy));
      }
    }
  };
};

// ============================================================================
// APPROACH CANVAS - Foundation Building
// Visual Metaphor: Blocks stack from bottom, wider at base
// ============================================================================

const approachSketch = (p) => {
  let container, visibilityHelper;
  let layers = [];
  let time = 0;
  const MAX_LAYERS = 12;

  class Layer {
    constructor(index) {
      this.index = index;
      this.y = p.height - index * 40 - 50;
      this.width = 200 + index * 60;
      this.x = p.width / 2 - this.width / 2;
      this.height = 35;

      // Gradient: deep purple → light cyan
      let t = index / MAX_LAYERS;
      this.hue1 = p.lerp(260, 200, t);
      this.hue2 = p.lerp(270, 210, t);
      this.sat = p.lerp(70, 50, t);
      this.bri = p.lerp(50, 85, t);
    }

    display(mouseY) {
      // Lift on hover
      let lift = 0;
      if (mouseY > 0 && Math.abs(mouseY - this.y) < 100) {
        lift = p.map(Math.abs(mouseY - this.y), 0, 100, -20, 0);
      }

      let wave = p.sin(time * 2 + this.index * 0.5) * 2;
      let y = this.y + wave + lift;

      // Horizontal gradient
      let ctx = p.drawingContext;
      let gradient = ctx.createLinearGradient(this.x, y, this.x + this.width, y);
      p.colorMode(p.HSB, 360, 100, 100);
      gradient.addColorStop(0, p.color(this.hue1, this.sat, this.bri).toString('#rrggbb'));
      gradient.addColorStop(1, p.color(this.hue2, this.sat, this.bri + 5).toString('#rrggbb'));

      ctx.fillStyle = gradient;
      p.noStroke();
      ctx.fillRect(this.x, y, this.width, this.height);
    }
  }

  p.setup = () => {
    container = document.getElementById('approach-canvas');
    if (!container) return;

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    for (let i = 0; i < MAX_LAYERS; i++) {
      layers.push(new Layer(i));
    }

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);
    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) return;

    p.colorMode(p.HSB, 360, 100, 100);
    p.background(260, 20, 12);

    time += 0.01;

    layers.forEach(layer => layer.display(p.mouseY));
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      layers = [];
      for (let i = 0; i < MAX_LAYERS; i++) {
        layers.push(new Layer(i));
      }
    }
  };
};

// ============================================================================
// FOUNDATION-PRINCIPLES CANVAS - Flexible Grid
// Visual Metaphor: Grid morphs between two layouts
// ============================================================================

const foundationPrinciplesSketch = (p) => {
  let container, visibilityHelper;
  let cells = [];
  let time = 0;
  const COLS = 10, ROWS = 6;

  class Cell {
    constructor(i) {
      this.index = i;

      // Layout A: regular grid
      this.ax = (i % COLS) * (p.width / COLS) + p.width / COLS / 2;
      this.ay = Math.floor(i / COLS) * (p.height / ROWS) + p.height / ROWS / 2;

      // Layout B: offset pattern
      this.bx = ((i + 3) % COLS) * (p.width / COLS) + p.width / COLS / 2;
      this.by = (Math.floor((i * 1.5) % ROWS)) * (p.height / ROWS) + p.height / ROWS / 2;

      this.x = this.ax;
      this.y = this.ay;
    }

    update(mouseDist) {
      // Morph based on time + mouse proximity
      let baseProgress = (p.sin(time * 0.6) + 1) * 0.5;
      let mouseEffect = mouseDist < 200 ? p.map(mouseDist, 0, 200, 0.4, 0) : 0;
      let progress = p.constrain(baseProgress + mouseEffect, 0, 1);

      this.x = p.lerp(this.ax, this.bx, progress);
      this.y = p.lerp(this.ay, this.by, progress);

      return progress;
    }

    display(progress) {
      let hue = p.lerp(200, 180, progress);

      p.colorMode(p.HSB, 360, 100, 100);
      p.noStroke();
      p.fill(hue, 60, 75, 0.9);
      p.circle(this.x, this.y, 30);
    }
  }

  p.setup = () => {
    container = document.getElementById('foundation-principles-canvas');
    if (!container) return;

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    for (let i = 0; i < COLS * ROWS; i++) {
      cells.push(new Cell(i));
    }

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);
    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) return;

    p.colorMode(p.HSB, 360, 100, 100);
    p.background(200, 10, 15);

    time += 0.01;

    let mouseDist = p.mouseX > 0 ? p.dist(p.mouseX, p.mouseY, p.width / 2, p.height / 2) : 1000;

    // Connection lines
    p.stroke(200, 30, 50, 0.2);
    p.strokeWeight(1);
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        let d = p.dist(cells[i].x, cells[i].y, cells[j].x, cells[j].y);
        if (d < 120) {
          p.line(cells[i].x, cells[i].y, cells[j].x, cells[j].y);
        }
      }
    }

    // Cells
    cells.forEach(cell => {
      let progress = cell.update(mouseDist);
      cell.display(progress);
    });
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      cells = [];
      for (let i = 0; i < COLS * ROWS; i++) {
        cells.push(new Cell(i));
      }
    }
  };
};

// ============================================================================
// IMPLEMENTATION CANVAS - Translation Layers
// Visual Metaphor: 3 horizontal layers (Design → Specs → Code)
// ============================================================================

const implementationSketch = (p) => {
  let container, visibilityHelper;
  let layers = [];
  let time = 0;

  class TranslationLayer {
    constructor(index) {
      this.index = index;
      this.y = p.height * (index / 3);
      this.height = p.height / 3;

      // Color per layer
      if (index === 0) {
        this.hue = 20; this.label = 'DESIGN';
      } else if (index === 1) {
        this.hue = 180; this.label = 'SPECIFICATIONS';
      } else {
        this.hue = 220; this.label = 'IMPLEMENTATION';
      }

      this.particles = [];
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: p.random(p.width * 0.2, p.width * 0.8),
          offset: p.random(p.TWO_PI)
        });
      }
    }

    display(mouseY) {
      p.colorMode(p.HSB, 360, 100, 100);

      // Hover highlight
      let hover = mouseY > this.y && mouseY < this.y + this.height;
      let alpha = hover ? 0.6 : 0.4;

      p.noStroke();
      p.fill(this.hue, 40, 40, alpha);
      p.rect(0, this.y, p.width, this.height);

      // Floating particles
      this.particles.forEach(part => {
        let y = this.y + this.height / 2 + p.sin(time + part.offset) * 30;
        p.fill(this.hue, 70, 80, 0.8);
        p.circle(part.x, y, 12);
      });
    }
  }

  p.setup = () => {
    container = document.getElementById('implementation-canvas');
    if (!container) return;

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    for (let i = 0; i < 3; i++) {
      layers.push(new TranslationLayer(i));
    }

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);
    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) return;

    p.background(30);
    time += 0.02;

    layers.forEach(layer => layer.display(p.mouseY));
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      layers = [];
      for (let i = 0; i < 3; i++) {
        layers.push(new TranslationLayer(i));
      }
    }
  };
};

// ============================================================================
// ENABLEMENT CANVAS - Network Multiplication
// Visual Metaphor: Center node → team nodes → outputs
// ============================================================================

const enablementSketch = (p) => {
  let container, visibilityHelper;
  let centerNode, teamNodes = [], outputs = [];
  let time = 0;

  p.setup = () => {
    container = document.getElementById('enablement-canvas');
    if (!container) return;

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    centerNode = { x: p.width / 2, y: p.height / 2, size: 20, hue: 120 };

    // 8 team nodes in circle
    for (let i = 0; i < 8; i++) {
      let angle = (i / 8) * p.TWO_PI;
      let radius = Math.min(p.width, p.height) * 0.3;
      teamNodes.push({
        x: centerNode.x + p.cos(angle) * radius,
        y: centerNode.y + p.sin(angle) * radius,
        size: 12,
        hue: 160
      });

      // 3 output nodes per team
      for (let j = 0; j < 3; j++) {
        let outAngle = angle + (j - 1) * 0.4;
        let outRadius = radius + 100;
        outputs.push({
          x: centerNode.x + p.cos(outAngle) * outRadius,
          y: centerNode.y + p.sin(outAngle) * outRadius,
          size: 6,
          hue: 200,
          parent: i
        });
      }
    }

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);
    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) return;

    p.colorMode(p.HSB, 360, 100, 100);
    p.background(140, 15, 10);

    time += 0.02;

    // Find hovered team node
    let hoverNode = -1;
    if (p.mouseX > 0) {
      for (let i = 0; i < teamNodes.length; i++) {
        let d = p.dist(p.mouseX, p.mouseY, teamNodes[i].x, teamNodes[i].y);
        if (d < 40) hoverNode = i;
      }
    }

    // Draw connections
    p.strokeWeight(2);
    teamNodes.forEach((node, i) => {
      let highlight = hoverNode === i;
      p.stroke(140, 60, 70, highlight ? 0.8 : 0.3);
      p.line(centerNode.x, centerNode.y, node.x, node.y);

      outputs.filter(o => o.parent === i).forEach(out => {
        p.stroke(160, 50, 80, highlight ? 0.6 : 0.2);
        p.line(node.x, node.y, out.x, out.y);
      });
    });

    // Draw nodes
    p.noStroke();
    p.fill(centerNode.hue, 80, 85);
    p.circle(centerNode.x, centerNode.y, centerNode.size);

    teamNodes.forEach((node, i) => {
      let pulse = hoverNode === i ? 1.3 : 1;
      p.fill(node.hue, 70, 75);
      p.circle(node.x, node.y, node.size * pulse);
    });

    outputs.forEach(out => {
      let highlight = hoverNode === out.parent;
      p.fill(out.hue, 60, 80, highlight ? 1 : 0.6);
      p.circle(out.x, out.y, out.size);
    });
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      teamNodes = [];
      outputs = [];
      centerNode = { x: p.width / 2, y: p.height / 2, size: 20, hue: 120 };

      for (let i = 0; i < 8; i++) {
        let angle = (i / 8) * p.TWO_PI;
        let radius = Math.min(p.width, p.height) * 0.3;
        teamNodes.push({
          x: centerNode.x + p.cos(angle) * radius,
          y: centerNode.y + p.sin(angle) * radius,
          size: 12,
          hue: 160
        });

        for (let j = 0; j < 3; j++) {
          let outAngle = angle + (j - 1) * 0.4;
          let outRadius = radius + 100;
          outputs.push({
            x: centerNode.x + p.cos(outAngle) * outRadius,
            y: centerNode.y + p.sin(outAngle) * outRadius,
            size: 6,
            hue: 200,
            parent: i
          });
        }
      }
    }
  };
};

// ============================================================================
// EVOLUTION CANVAS - Sparse vs Dense Networks
// Visual Metaphor: LEFT sparse (6 nodes) vs RIGHT dense (35 nodes)
// ============================================================================

const evolutionSketch = (p) => {
  let container, visibilityHelper;
  let sparseNodes = [], denseNodes = [];
  let time = 0;

  p.setup = () => {
    container = document.getElementById('evolution-canvas');
    if (!container) return;

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    // Sparse: 6 large nodes (left)
    for (let i = 0; i < 6; i++) {
      sparseNodes.push({
        x: p.random(p.width * 0.1, p.width * 0.4),
        y: p.random(p.height * 0.2, p.height * 0.8),
        size: 20
      });
    }

    // Dense: 35 small nodes (right)
    for (let i = 0; i < 35; i++) {
      denseNodes.push({
        x: p.random(p.width * 0.6, p.width * 0.9),
        y: p.random(p.height * 0.1, p.height * 0.9),
        size: 8
      });
    }

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);
    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) return;

    p.colorMode(p.HSB, 360, 100, 100);
    p.background(200, 10, 15);

    time += 0.01;

    // Mouse hover highlights side
    let mouseZone = p.mouseX < p.width / 2 ? 'sparse' : 'dense';

    // Sparse network connections
    p.strokeWeight(2);
    for (let i = 0; i < sparseNodes.length; i++) {
      for (let j = i + 1; j < sparseNodes.length; j++) {
        let d = p.dist(sparseNodes[i].x, sparseNodes[i].y, sparseNodes[j].x, sparseNodes[j].y);
        if (d < 250) {
          let alpha = mouseZone === 'sparse' ? 0.6 : 0.3;
          p.stroke(200, 40, 60, alpha);
          p.line(sparseNodes[i].x, sparseNodes[i].y, sparseNodes[j].x, sparseNodes[j].y);
        }
      }
    }

    // Dense network connections
    p.strokeWeight(1);
    for (let i = 0; i < denseNodes.length; i++) {
      for (let j = i + 1; j < denseNodes.length; j++) {
        let d = p.dist(denseNodes[i].x, denseNodes[i].y, denseNodes[j].x, denseNodes[j].y);
        if (d < 100) {
          let alpha = mouseZone === 'dense' ? 0.5 : 0.2;
          p.stroke(200, 40, 60, alpha);
          p.line(denseNodes[i].x, denseNodes[i].y, denseNodes[j].x, denseNodes[j].y);
        }
      }
    }

    // Draw nodes
    p.noStroke();
    sparseNodes.forEach(node => {
      let pulse = mouseZone === 'sparse' ? 1.2 : 1;
      p.fill(200, 60, 70);
      p.circle(node.x, node.y, node.size * pulse);
    });

    denseNodes.forEach(node => {
      let pulse = mouseZone === 'dense' ? 1.3 : 1;
      p.fill(200, 60, 75);
      p.circle(node.x, node.y, node.size * pulse);
    });
  };

  p.windowResized = () => {
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      sparseNodes = [];
      denseNodes = [];

      for (let i = 0; i < 6; i++) {
        sparseNodes.push({
          x: p.random(p.width * 0.1, p.width * 0.4),
          y: p.random(p.height * 0.2, p.height * 0.8),
          size: 20
        });
      }

      for (let i = 0; i < 35; i++) {
        denseNodes.push({
          x: p.random(p.width * 0.6, p.width * 0.9),
          y: p.random(p.height * 0.1, p.height * 0.9),
          size: 8
        });
      }
    }
  };
};

// ============================================================================
// IMPACT CANVAS - Ripple Propagation
// Visual Metaphor: Concentric ripples expanding from center
// ============================================================================

const impactSketch = (p) => {
  let container, visibilityHelper;
  let ripples = [];
  let time = 0;

  class Ripple {
    constructor(hue) {
      this.radius = 0;
      this.maxRadius = Math.min(p.width, p.height) * 0.6;
      this.hue = hue;
      this.alpha = 1;
    }

    update() {
      this.radius += 3;
      this.alpha = p.map(this.radius, 0, this.maxRadius, 1, 0);
    }

    display() {
      if (this.radius < this.maxRadius) {
        p.colorMode(p.HSB, 360, 100, 100);
        p.noFill();
        p.stroke(this.hue, 70, 80, this.alpha * 0.8);
        p.strokeWeight(3);
        p.circle(p.width / 2, p.height / 2, this.radius * 2);
      }
    }

    isDead() {
      return this.radius >= this.maxRadius;
    }
  }

  p.setup = () => {
    container = document.getElementById('impact-canvas');
    if (!container) return;

    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent(container);

    const { observer, isVisible } = createVisibilityObserver(p);
    visibilityHelper = { observer, isVisible };
    observer.observe(container);
    p.noLoop();
  };

  p.draw = () => {
    if (!visibilityHelper || !visibilityHelper.isVisible()) return;

    p.colorMode(p.HSB, 360, 100, 100);
    p.background(200, 15, 12);

    time += 1;

    // Spawn ripples (different "dimensions")
    if (time % 40 === 0) ripples.push(new Ripple(180));  // Cyan
    if (time % 50 === 0) ripples.push(new Ripple(280));  // Purple
    if (time % 60 === 0) ripples.push(new Ripple(60));   // Yellow

    // Mouse hover creates extra ripple
    if (p.mouseIsPressed && time % 20 === 0) {
      ripples.push(new Ripple(140));
    }

    // Update and draw
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].update();
      ripples[i].display();
      if (ripples[i].isDead()) ripples.splice(i, 1);
    }

    // Center point
    p.noStroke();
    p.fill(200, 70, 90);
    p.circle(p.width / 2, p.height / 2, 20);
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSketches);
} else {
  initSketches();
}

function initSketches() {
  if (document.getElementById('hero-canvas')) new p5(heroSketch);
  if (document.getElementById('approach-canvas')) new p5(approachSketch);
  if (document.getElementById('foundation-principles-canvas')) new p5(foundationPrinciplesSketch);
  if (document.getElementById('implementation-canvas')) new p5(implementationSketch);
  if (document.getElementById('enablement-canvas')) new p5(enablementSketch);
  if (document.getElementById('evolution-canvas')) new p5(evolutionSketch);
  if (document.getElementById('impact-canvas')) new p5(impactSketch);
}
