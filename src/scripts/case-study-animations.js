// ============================================
// DESIGN SYSTEMS CASE STUDY ANIMATIONS
// ============================================
// Each sketch has a unique two-color palette and design system theme
// All sketches respond to mouse hover interactions

// Utility function to create visibility observers for performance
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
  }, { threshold, rootMargin: '50px' });

  return { observer, isVisible: () => isVisible };
};

// ============================================
// 1. HERO SKETCH - Oscilloscope Lissajous Curves
// ============================================
// Theme: Animated Lissajous curves (oscilloscope patterns) with grey strokes
// Frequency ratios auto-change at regular intervals

const heroSketch = (p) => {
  let currentFreqX = 3;  // Current X frequency ratio
  let currentFreqY = 2;  // Current Y frequency ratio
  let lastChangeTime = 0; // Track when frequency last changed
  let animationOffset = 0; // For animating the gaps
  let gradientBuffer; // Graphics buffer for shader-based gradient
  let gradientShader; // Shader for radial gradient

  const CHANGE_INTERVAL = 2000; // Change frequency every 4 seconds when idle
  const CURVE_RESOLUTION = 2000; // Number of points in the curve
  const GAP_SIZE = 0.03; // Size of gaps as fraction of curve (15%)
  const NUM_GAPS = 4; // Number of gaps in the curve
  const GAP_ANIMATION_SPEED = 0.001; // Speed at which gaps move around the curve

  // Radial Gradient configuration (RGB values 0-255)
  const GRADIENT_CENTER_COLOR = { r: 100  , g: 200, b: 255 }; // Color at center
  const GRADIENT_EDGE_COLOR = { r: 255, g: 255, b: 255 }; // Color at edges
  const GRADIENT_CENTER_X = 0.5; // X position of gradient center (0-1, where 0.5 = canvas center)
  const GRADIENT_CENTER_Y = 0.5; // Y position of gradient center (0-1, where 0.5 = canvas center)
  const GRADIENT_RADIUS_SCALE_X = 0.5; // Controls horizontal gradient spread (1.0 = edge, <1.0 = tighter, >1.0 = softer)
  const GRADIENT_RADIUS_SCALE_Y = 0.5; // Controls vertical gradient spread (1.0 = edge, <1.0 = tighter, >1.0 = softer)
  const GRADIENT_POWER = 1; // Controls falloff curve (1.0 = linear, >1.0 = concentrated center, <1.0 = softer)
  const GRADIENT_EDGE_EASE = 1; // Controls edge easing (0 = sharp edge, higher = more gradual ease-out at edges)
  const GRADIENT_SCATTER_INTENSITY = 0.05; // Scattering effect intensity (0 = no scatter, higher = more scatter)

  // Grey color palette for strokes
  const GREYS = [
    { r: 0, g: 0, b: 0, alpha: 150 }
    // { r: 120, g: 120, b: 120, alpha: 150 },
    // { r: 140, g: 140, b: 140, alpha: 120 },
  ];

  const { observer } = createVisibilityObserver(p);

  // Vertex shader (standard pass-through for p5.js)
  const vertShader = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;

    void main() {
      vTexCoord = aTexCoord;
      vec4 positionVec4 = vec4(aPosition, 1.0);
      positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
      gl_Position = positionVec4;
    }
  `;

  // Fragment shader (radial gradient with scattering)
  const fragShader = `
    precision highp float;
    varying vec2 vTexCoord;

    uniform vec2 uResolution;
    uniform vec2 uCenter;
    uniform vec3 uCenterColor;
    uniform vec3 uEdgeColor;
    uniform vec2 uRadiusScale;
    uniform float uPower;
    uniform float uEdgeEase;
    uniform float uScatterIntensity;

    // Improved noise function for scattering
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      // Quintic interpolation for smoother transitions
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // Fractal noise with multiple octaves for varied appearance
    float fractalNoise(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }

      return value;
    }

    void main() {
      // Calculate position relative to center
      vec2 pos = vTexCoord;
      vec2 center = uCenter;

      // Calculate distance from center
      vec2 delta = pos - center;

      // Scale by independent X and Y radius scales
      delta.x /= uRadiusScale.x;
      delta.y /= uRadiusScale.y;

      float dist = length(delta);

      // Add scattering effect using fractal noise at pixel level
      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        dist += (noiseValue - 0.5) * uScatterIntensity;
      }

      // Apply power function for falloff control
      float normalizedDist = pow(clamp(dist, 0.0, 1.0), uPower);

      // Apply edge easing for gradual fade at edges
      if (uEdgeEase > 0.0 && normalizedDist > (1.0 - uEdgeEase)) {
        // Apply smooth easing in the edge region
        float edgeRegion = (normalizedDist - (1.0 - uEdgeEase)) / uEdgeEase;
        // Use smoothstep for gradual ease-out
        normalizedDist = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      // Mix colors based on distance
      vec3 color = mix(uCenterColor, uEdgeColor, normalizedDist);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Get interesting frequency ratios
  const getRandomFrequency = () => {
    const ratios = [3, 4, 5, 6, 8, 16, 32];
    return ratios[Math.floor(p.random(ratios.length))];
  };

  // Create gradient buffer and render gradient
  const createGradient = () => {
    // Create WEBGL graphics buffer
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);

    // Create shader
    gradientShader = gradientBuffer.createShader(vertShader, fragShader);

    // Render gradient to buffer
    gradientBuffer.shader(gradientShader);

    // Set shader uniforms
    gradientShader.setUniform('uResolution', [p.width, p.height]);
    gradientShader.setUniform('uCenter', [GRADIENT_CENTER_X, GRADIENT_CENTER_Y]);
    gradientShader.setUniform('uCenterColor', [
      GRADIENT_CENTER_COLOR.r / 255.0,
      GRADIENT_CENTER_COLOR.g / 255.0,
      GRADIENT_CENTER_COLOR.b / 255.0
    ]);
    gradientShader.setUniform('uEdgeColor', [
      GRADIENT_EDGE_COLOR.r / 255.0,
      GRADIENT_EDGE_COLOR.g / 255.0,
      GRADIENT_EDGE_COLOR.b / 255.0
    ]);
    gradientShader.setUniform('uRadiusScale', [GRADIENT_RADIUS_SCALE_X, GRADIENT_RADIUS_SCALE_Y]);
    gradientShader.setUniform('uPower', GRADIENT_POWER);
    gradientShader.setUniform('uEdgeEase', GRADIENT_EDGE_EASE);
    gradientShader.setUniform('uScatterIntensity', GRADIENT_SCATTER_INTENSITY);

    // Draw full-screen quad
    gradientBuffer.rectMode(p.CENTER);
    gradientBuffer.noStroke();
    gradientBuffer.rect(0, 0, p.width, p.height);
  };

  // Draw gradient background from buffer
  const drawGradient = () => {
    p.image(gradientBuffer, 0, 0);
  };

  p.setup = () => {
    const container = document.getElementById('hero-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('hero-canvas');

    // Create gradient buffer with shader
    createGradient();

    lastChangeTime = p.millis();
    observer.observe(container);
  };

  p.draw = () => {
    let currentTime = p.millis();

    // Draw gradient background
    drawGradient();

    // Auto-change frequency at regular intervals
    if (currentTime - lastChangeTime > CHANGE_INTERVAL) {
      currentFreqX = getRandomFrequency();
      currentFreqY = getRandomFrequency();
      lastChangeTime = currentTime;
    }

    // Animate the gaps moving around the curve
    animationOffset += GAP_ANIMATION_SPEED;

    // Calculate uniform margins based on smallest dimension
    let minDimension = Math.min(p.width, p.height);
    let margin = minDimension * 0.15; // 15% margin

    // Calculate available space with uniform margins
    let availableWidth = p.width - (margin * 2);
    let availableHeight = p.height - (margin * 2);
    let sizeX = availableWidth / 2;
    let sizeY = availableHeight / 2;

    // Center the pattern
    p.push();
    p.translate(p.width / 2, p.height / 2);
    p.scale(-1,1);

    // Draw multiple layers of the curve with different grey shades
    GREYS.forEach((grey, layerIndex) => {
      p.noFill();
      p.stroke(grey.r, grey.g, grey.b, grey.alpha);
      p.strokeWeight(2 - layerIndex * 0.3);

      let offset = layerIndex * 0.1;

      // Draw the Lissajous curve in segments with gaps
      let isDrawing = false;

      for (let i = 0; i <= CURVE_RESOLUTION; i++) {
          let t = i / CURVE_RESOLUTION;

          // Check if this point should be drawn (not in a gap)
          let normalizedT = (t + animationOffset + offset) % 1;
          let shouldDraw = false;

          for (let s = 0; s < NUM_GAPS; s++) {
            let gapStart = s / NUM_GAPS;
            let gapEnd = (s + 1 - GAP_SIZE) / NUM_GAPS;

            if (normalizedT >= gapStart && normalizedT <= gapEnd) {
              shouldDraw = true;
              break;
            }
          }

          // Lissajous curve parametric equations
          let angle = t * p.TWO_PI;
          let x = sizeX * p.sin(currentFreqX * angle + offset);
          let y = sizeY * p.sin(currentFreqY * angle);

          if (shouldDraw) {
            if (!isDrawing) {
              // Start a new segment
              p.beginShape();
              isDrawing = true;
            }
            p.vertex(x, y);
          } else {
            if (isDrawing) {
              // End the current segment
              p.endShape();
              isDrawing = false;
            }
          }
        }

        // Close any open shape
        if (isDrawing) {
          p.endShape();
        }
    });

    p.pop();
  };

  p.windowResized = () => {
    const container = document.getElementById('hero-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);

    // Recreate gradient buffer at new size
    createGradient();
  };
};

// ============================================
// 2. APPROACH SKETCH - Modular Grid Building
// ============================================
// Theme: Building blocks stacking to form modular system
// Colors: Deep Purple (#6B46C1) + Bright Cyan (#06B6D4)

const approachSketch = (p) => {
  let blocks = [];
  let time = 0;
  const COLS = 8;
  const ROWS = 6;

  // Colors: Deep Purple + Bright Cyan
  const PURPLE = { r: 107, g: 70, b: 193 };
  const CYAN = { r: 6, g: 182, b: 212 };

  class Block {
    constructor(col, row) {
      this.col = col;
      this.row = row;
      this.targetY = 0;
      this.currentY = -100;
      this.width = 0;
      this.height = 0;
      this.delay = (col + row) * 0.05;
      this.hovered = false;
      this.colorMix = (col + row) / (COLS + ROWS);
    }

    update(blockWidth, blockHeight, mouseX, mouseY) {
      this.width = blockWidth;
      this.height = blockHeight;

      let x = this.col * blockWidth + blockWidth / 2;
      this.targetY = this.row * blockHeight + blockHeight / 2;

      // Animate in
      let progress = p.constrain((time - this.delay * 60) / 60, 0, 1);
      progress = this.easeOutBounce(progress);
      this.currentY = p.lerp(-100, this.targetY, progress);

      // Check hover
      this.hovered = false;
      if (mouseX > this.col * blockWidth && mouseX < (this.col + 1) * blockWidth &&
          mouseY > this.row * blockHeight && mouseY < (this.row + 1) * blockHeight) {
        this.hovered = true;
      }
    }

    easeOutBounce(t) {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }

    display() {
      let x = this.col * this.width;
      let y = this.currentY - this.height / 2;

      // Hover lift
      if (this.hovered) {
        y -= 10;
      }

      // Mix purple and cyan
      let r = p.lerp(PURPLE.r, CYAN.r, this.colorMix);
      let g = p.lerp(PURPLE.g, CYAN.g, this.colorMix);
      let b = p.lerp(PURPLE.b, CYAN.b, this.colorMix);

      p.noStroke();
      p.fill(r, g, b, this.hovered ? 255 : 200);
      p.rect(x + 2, y + 2, this.width - 4, this.height - 4, 4);

      // Subtle border
      p.noFill();
      p.stroke(255, 255, 255, this.hovered ? 100 : 30);
      p.strokeWeight(2);
      p.rect(x + 2, y + 2, this.width - 4, this.height - 4, 4);
    }
  }

  const { observer } = createVisibilityObserver(p);

  p.setup = () => {
    const container = document.getElementById('approach-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('approach-canvas');

    // Create blocks
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        blocks.push(new Block(col, row));
      }
    }

    observer.observe(container);
  };

  p.draw = () => {
    // Gradient background
    for (let y = 0; y < p.height; y++) {
      let inter = p.map(y, 0, p.height, 0, 1);
      let c = p.lerpColor(p.color(15, 15, 25), p.color(25, 20, 40), inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    time++;

    let blockWidth = p.width / COLS;
    let blockHeight = p.height / ROWS;

    blocks.forEach(block => {
      block.update(blockWidth, blockHeight, p.mouseX, p.mouseY);
      block.display();
    });
  };

  p.windowResized = () => {
    const container = document.getElementById('approach-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
  };
};

// ============================================
// 3. FOUNDATION SKETCH - Flexible Grid
// ============================================
// Theme: Grid that breathes and transforms while maintaining structure
// Colors: Forest Green (#10B981) + Golden Yellow (#F59E0B)

const foundationPrinciplesSketch = (p) => {
  let cells = [];
  let time = 0;
  const GRID_SIZE = 8;

  // Colors: Forest Green + Golden Yellow
  const GREEN = { r: 16, g: 185, b: 129 };
  const YELLOW = { r: 245, g: 158, b: 11 };

  class Cell {
    constructor(col, row) {
      this.col = col;
      this.row = row;
      this.offset = p.random(100);
      this.colorMix = (col + row) / (GRID_SIZE * 2);
    }

    update(cellSize, mouseX, mouseY) {
      this.cellSize = cellSize;

      // Base position
      this.baseX = this.col * cellSize + cellSize / 2;
      this.baseY = this.row * cellSize + cellSize / 2;

      // Breathing motion
      let breathe = p.sin(time * 0.02 + this.offset) * 15;
      this.x = this.baseX + breathe;
      this.y = this.baseY + breathe;

      // Mouse proximity effect
      if (mouseX > 0 && mouseY > 0) {
        let d = p.dist(this.baseX, this.baseY, mouseX, mouseY);
        if (d < 150) {
          let force = p.map(d, 0, 150, 20, 0);
          let angle = p.atan2(this.baseY - mouseY, this.baseX - mouseX);
          this.x += p.cos(angle) * force;
          this.y += p.sin(angle) * force;
        }
      }
    }

    display() {
      let size = this.cellSize * 0.7;

      // Mix green and yellow
      let r = p.lerp(GREEN.r, YELLOW.r, this.colorMix);
      let g = p.lerp(GREEN.g, YELLOW.g, this.colorMix);
      let b = p.lerp(GREEN.b, YELLOW.b, this.colorMix);

      p.noStroke();
      p.fill(r, g, b, 180);
      p.rect(this.x - size/2, this.y - size/2, size, size, 6);

      // Border
      p.noFill();
      p.stroke(255, 255, 255, 40);
      p.strokeWeight(2);
      p.rect(this.x - size/2, this.y - size/2, size, size, 6);
    }
  }

  const { observer } = createVisibilityObserver(p);

  p.setup = () => {
    const container = document.getElementById('foundation-principles-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('foundation-principles-canvas');

    // Create cells
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        cells.push(new Cell(col, row));
      }
    }

    observer.observe(container);
  };

  p.draw = () => {
    // Gradient background
    for (let y = 0; y < p.height; y++) {
      let inter = p.map(y, 0, p.height, 0, 1);
      let c = p.lerpColor(p.color(10, 20, 15), p.color(20, 30, 20), inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    time++;

    let cellSize = Math.min(p.width, p.height) / GRID_SIZE;
    let offsetX = (p.width - cellSize * GRID_SIZE) / 2;
    let offsetY = (p.height - cellSize * GRID_SIZE) / 2;

    p.push();
    p.translate(offsetX, offsetY);

    // Draw connection lines
    p.stroke(255, 255, 255, 20);
    p.strokeWeight(1);
    cells.forEach((cell, i) => {
      if (cell.col < GRID_SIZE - 1) {
        let neighbor = cells[i + 1];
        p.line(cell.x, cell.y, neighbor.x, neighbor.y);
      }
      if (cell.row < GRID_SIZE - 1) {
        let neighbor = cells[i + GRID_SIZE];
        p.line(cell.x, cell.y, neighbor.x, neighbor.y);
      }
    });

    // Update and draw cells
    cells.forEach(cell => {
      cell.update(cellSize, p.mouseX - offsetX, p.mouseY - offsetY);
      cell.display();
    });

    p.pop();
  };

  p.windowResized = () => {
    const container = document.getElementById('foundation-principles-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
  };
};

// ============================================
// 4. IMPLEMENTATION SKETCH - Token Flow
// ============================================
// Theme: Design tokens flowing from abstract to structured
// Colors: Magenta (#EC4899) + Teal (#14B8A6)

const implementationSketch = (p) => {
  let tokens = [];
  let time = 0;
  const TOKEN_COUNT = 30;

  // Colors: Magenta + Teal
  const MAGENTA = { r: 236, g: 72, b: 153 };
  const TEAL = { r: 20, g: 184, b: 166 };

  class Token {
    constructor() {
      this.reset();
      this.progress = p.random(1); // Start at random positions
    }

    reset() {
      this.startX = p.random(p.width * 0.1, p.width * 0.3);
      this.startY = p.random(p.height * 0.2, p.height * 0.8);
      this.endX = p.random(p.width * 0.7, p.width * 0.9);
      this.endY = p.random(p.height * 0.2, p.height * 0.8);
      this.progress = 0;
      this.speed = p.random(0.003, 0.008);
      this.size = p.random(8, 16);
      this.hovered = false;
    }

    update(mouseX, mouseY) {
      this.progress += this.speed;
      if (this.progress > 1) {
        this.reset();
      }

      // Ease in-out
      let t = this.progress;
      t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      this.x = p.lerp(this.startX, this.endX, t);
      this.y = p.lerp(this.startY, this.endY, t);

      // Check hover
      this.hovered = false;
      if (mouseX > 0 && mouseY > 0) {
        let d = p.dist(this.x, this.y, mouseX, mouseY);
        if (d < 30) {
          this.hovered = true;
        }
      }
    }

    display() {
      // Mix magenta and teal based on progress
      let r = p.lerp(MAGENTA.r, TEAL.r, this.progress);
      let g = p.lerp(MAGENTA.g, TEAL.g, this.progress);
      let b = p.lerp(MAGENTA.b, TEAL.b, this.progress);

      let alpha = this.hovered ? 255 : 200;
      let size = this.hovered ? this.size * 1.5 : this.size;

      p.noStroke();
      p.fill(r, g, b, alpha);

      // Shape transforms: circle -> square
      if (this.progress < 0.5) {
        p.circle(this.x, this.y, size);
      } else {
        let roundness = p.map(this.progress, 0.5, 1, size/2, 2);
        p.rect(this.x - size/2, this.y - size/2, size, size, roundness);
      }

      // Trail
      if (this.hovered) {
        p.stroke(r, g, b, 100);
        p.strokeWeight(2);
        p.line(this.startX, this.startY, this.x, this.y);
      }
    }
  }

  const { observer } = createVisibilityObserver(p);

  p.setup = () => {
    const container = document.getElementById('implementation-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('implementation-canvas');

    for (let i = 0; i < TOKEN_COUNT; i++) {
      tokens.push(new Token());
    }

    observer.observe(container);
  };

  p.draw = () => {
    // Gradient background
    for (let y = 0; y < p.height; y++) {
      let inter = p.map(y, 0, p.height, 0, 1);
      let c = p.lerpColor(p.color(20, 10, 20), p.color(15, 25, 25), inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    time++;

    tokens.forEach(token => {
      token.update(p.mouseX, p.mouseY);
      token.display();
    });
  };

  p.windowResized = () => {
    const container = document.getElementById('implementation-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    tokens = [];
    for (let i = 0; i < TOKEN_COUNT; i++) {
      tokens.push(new Token());
    }
  };
};

// ============================================
// 5. ENABLEMENT SKETCH - Component Propagation
// ============================================
// Theme: Single component replicating and spreading
// Colors: Orange (#F97316) + Indigo (#6366F1)

const enablementSketch = (p) => {
  let components = [];
  let time = 0;

  // Colors: Orange + Indigo
  const ORANGE = { r: 249, g: 115, b: 22 };
  const INDIGO = { r: 99, g: 102, b: 241 };

  class Component {
    constructor(x, y, generation) {
      this.x = x;
      this.y = y;
      this.generation = generation;
      this.size = 0;
      this.maxSize = 40 - generation * 8;
      this.age = 0;
      this.reproduced = false;
      this.alpha = 0;
    }

    update(mouseX, mouseY) {
      this.age++;

      // Grow
      if (this.size < this.maxSize) {
        this.size += 0.5;
        this.alpha = p.min(this.alpha + 10, 200);
      }

      // Reproduce
      if (this.generation < 3 && this.age > 60 && !this.reproduced) {
        this.reproduced = true;
        this.reproduce();
      }

      // Check if near mouse
      this.hovered = false;
      if (mouseX > 0 && mouseY > 0) {
        let d = p.dist(this.x, this.y, mouseX, mouseY);
        if (d < this.maxSize) {
          this.hovered = true;
          // Create component on hover
          if (this.age % 30 === 0 && components.length < 100) {
            let angle = p.random(p.TWO_PI);
            let dist = p.random(60, 100);
            components.push(new Component(
              this.x + p.cos(angle) * dist,
              this.y + p.sin(angle) * dist,
              this.generation + 1
            ));
          }
        }
      }
    }

    reproduce() {
      if (components.length > 80) return;

      let count = p.random() > 0.5 ? 3 : 4;
      for (let i = 0; i < count; i++) {
        let angle = (p.TWO_PI / count) * i + p.random(-0.3, 0.3);
        let dist = p.random(60, 100);
        components.push(new Component(
          this.x + p.cos(angle) * dist,
          this.y + p.sin(angle) * dist,
          this.generation + 1
        ));
      }
    }

    display() {
      // Mix orange and indigo based on generation
      let t = this.generation / 3;
      let r = p.lerp(ORANGE.r, INDIGO.r, t);
      let g = p.lerp(ORANGE.g, INDIGO.g, t);
      let b = p.lerp(ORANGE.b, INDIGO.b, t);

      let size = this.hovered ? this.size * 1.2 : this.size;
      let alpha = this.hovered ? 255 : this.alpha;

      p.noStroke();
      p.fill(r, g, b, alpha);
      p.rect(this.x - size/2, this.y - size/2, size, size, 4);

      // Border
      p.noFill();
      p.stroke(255, 255, 255, this.hovered ? 100 : 40);
      p.strokeWeight(2);
      p.rect(this.x - size/2, this.y - size/2, size, size, 4);
    }
  }

  const { observer } = createVisibilityObserver(p);

  p.setup = () => {
    const container = document.getElementById('enablement-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('enablement-canvas');

    // Start with one component in center
    components.push(new Component(p.width / 2, p.height / 2, 0));

    observer.observe(container);
  };

  p.draw = () => {
    // Gradient background
    for (let y = 0; y < p.height; y++) {
      let inter = p.map(y, 0, p.height, 0, 1);
      let c = p.lerpColor(p.color(25, 15, 10), p.color(15, 15, 30), inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    time++;

    // Draw connections
    p.stroke(255, 255, 255, 20);
    p.strokeWeight(1);
    components.forEach((comp, i) => {
      components.slice(i + 1).forEach(other => {
        let d = p.dist(comp.x, comp.y, other.x, other.y);
        if (d < 100 && Math.abs(comp.generation - other.generation) <= 1) {
          let alpha = p.map(d, 0, 100, 40, 0);
          p.stroke(255, 255, 255, alpha);
          p.line(comp.x, comp.y, other.x, other.y);
        }
      });
    });

    // Update and draw components
    components.forEach(comp => {
      comp.update(p.mouseX, p.mouseY);
      comp.display();
    });

    // Limit component count
    if (components.length > 100) {
      components = components.slice(-80);
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('enablement-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    components = [];
    components.push(new Component(p.width / 2, p.height / 2, 0));
  };
};

// ============================================
// 6. EVOLUTION SKETCH - System Complexity
// ============================================
// Theme: System morphing between simple and complex states
// Colors: Ruby Red (#DC2626) + Sky Blue (#0EA5E9)

const evolutionSketch = (p) => {
  let nodes = [];
  let time = 0;
  const SIMPLE_COUNT = 5;
  const COMPLEX_COUNT = 20;

  // Colors: Ruby Red + Sky Blue
  const RED = { r: 220, g: 38, b: 38 };
  const BLUE = { r: 14, g: 165, b: 233 };

  class Node {
    constructor(index, isComplex) {
      this.index = index;
      this.isComplex = isComplex;
      this.updatePosition();
      this.size = isComplex ? 15 : 25;
      this.connections = [];
    }

    updatePosition() {
      if (this.isComplex) {
        // More nodes, tighter cluster
        let angle = (this.index / COMPLEX_COUNT) * p.TWO_PI;
        let radius = 100 + (this.index % 3) * 40;
        this.x = p.width / 2 + p.cos(angle) * radius;
        this.y = p.height / 2 + p.sin(angle) * radius;
      } else {
        // Fewer nodes, spread out
        let angle = (this.index / SIMPLE_COUNT) * p.TWO_PI;
        let radius = 120;
        this.x = p.width / 2 + p.cos(angle) * radius;
        this.y = p.height / 2 + p.sin(angle) * radius;
      }
    }

    display(morphProgress, mouseInfluence) {
      // Mix red and blue based on complexity
      let t = this.isComplex ? morphProgress : 1 - morphProgress;
      let r = p.lerp(RED.r, BLUE.r, t);
      let g = p.lerp(RED.g, BLUE.g, t);
      let b = p.lerp(RED.b, BLUE.b, t);

      let size = this.size * (1 + mouseInfluence * 0.3);
      let alpha = 150 + mouseInfluence * 100;

      p.noStroke();
      p.fill(r, g, b, alpha);
      p.circle(this.x, this.y, size);

      // Border
      p.noFill();
      p.stroke(255, 255, 255, 60 + mouseInfluence * 40);
      p.strokeWeight(2);
      p.circle(this.x, this.y, size);
    }
  }

  const { observer } = createVisibilityObserver(p);

  p.setup = () => {
    const container = document.getElementById('evolution-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('evolution-canvas');

    createNodes();

    observer.observe(container);
  };

  function createNodes() {
    nodes = [];
    for (let i = 0; i < SIMPLE_COUNT; i++) {
      nodes.push(new Node(i, false));
    }
  }

  p.draw = () => {
    // Gradient background
    for (let y = 0; y < p.height; y++) {
      let inter = p.map(y, 0, p.height, 0, 1);
      let c = p.lerpColor(p.color(25, 10, 10), p.color(10, 20, 30), inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    time++;

    // Morph based on mouse X position
    let morphProgress = p.mouseX > 0 ? p.mouseX / p.width : 0.5;
    morphProgress = p.constrain(morphProgress, 0, 1);

    // Determine node count based on morph
    let targetCount = Math.floor(p.lerp(SIMPLE_COUNT, COMPLEX_COUNT, morphProgress));

    // Add or remove nodes
    if (nodes.length < targetCount) {
      let isComplex = morphProgress > 0.5;
      nodes.push(new Node(nodes.length, isComplex));
    } else if (nodes.length > targetCount) {
      nodes.pop();
    }

    // Update all nodes
    nodes.forEach(node => {
      node.isComplex = morphProgress > 0.5;
      node.updatePosition();
    });

    // Draw connections
    p.stroke(255, 255, 255, 30);
    p.strokeWeight(1);
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach(other => {
        let d = p.dist(node.x, node.y, other.x, other.y);
        let maxDist = node.isComplex ? 150 : 300;
        if (d < maxDist) {
          let alpha = p.map(d, 0, maxDist, 60, 0);
          p.stroke(255, 255, 255, alpha);
          p.line(node.x, node.y, other.x, other.y);
        }
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      let d = p.dist(node.x, node.y, p.mouseX, p.mouseY);
      let mouseInfluence = d < 80 ? p.map(d, 0, 80, 1, 0) : 0;
      node.display(morphProgress, mouseInfluence);
    });

    // Draw labels
    p.noStroke();
    p.fill(255, 255, 255, 100);
    p.textSize(12);
    p.textAlign(p.LEFT);
    p.text('SIMPLE', 20, 30);
    p.textAlign(p.RIGHT);
    p.text('COMPLEX', p.width - 20, 30);
  };

  p.windowResized = () => {
    const container = document.getElementById('evolution-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createNodes();
  };
};

// ============================================
// 7. IMPACT SKETCH - Influence Hub
// ============================================
// Theme: Central design system radiating influence to products
// Colors: Amber (#D97706) + Violet (#8B5CF6)

const impactSketch = (p) => {
  let hub = { x: 0, y: 0, size: 60 };
  let products = [];
  let pulseTime = 0;
  let time = 0;
  const PRODUCT_COUNT = 8;

  // Colors: Amber + Violet
  const AMBER = { r: 217, g: 119, b: 6 };
  const VIOLET = { r: 139, g: 92, b: 246 };

  class Product {
    constructor(index) {
      this.index = index;
      this.angle = (index / PRODUCT_COUNT) * p.TWO_PI;
      this.distance = 180;
      this.size = 30;
      this.pulse = 0;
      this.updatePosition();
    }

    updatePosition() {
      this.x = hub.x + p.cos(this.angle) * this.distance;
      this.y = hub.y + p.sin(this.angle) * this.distance;
    }

    display(mouseOnHub, mouseOnThis) {
      // Color shifts from amber (hub) to violet (products)
      let t = 0.7;
      let r = p.lerp(AMBER.r, VIOLET.r, t);
      let g = p.lerp(AMBER.g, VIOLET.g, t);
      let b = p.lerp(AMBER.b, VIOLET.b, t);

      let size = this.size;
      let alpha = 150;

      // Pulse effect
      if (this.pulse > 0) {
        size += this.pulse * 10;
        alpha += this.pulse * 50;
        this.pulse -= 0.05;
      }

      // Mouse hover
      if (mouseOnThis || mouseOnHub) {
        size *= 1.2;
        alpha = 255;
      }

      p.noStroke();
      p.fill(r, g, b, alpha);
      p.circle(this.x, this.y, size);

      // Border
      p.noFill();
      p.stroke(255, 255, 255, mouseOnThis || mouseOnHub ? 100 : 40);
      p.strokeWeight(2);
      p.circle(this.x, this.y, size);
    }

    drawConnection(mouseOnHub, mouseOnThis) {
      let alpha = 30;
      let weight = 1;

      if (this.pulse > 0) {
        alpha = 100;
        weight = 3;
      }

      if (mouseOnHub || mouseOnThis) {
        alpha = 150;
        weight = 3;
      }

      // Gradient line (amber to violet)
      for (let i = 0; i <= 20; i++) {
        let t = i / 20;
        let x = p.lerp(hub.x, this.x, t);
        let y = p.lerp(hub.y, this.y, t);

        let r = p.lerp(AMBER.r, VIOLET.r, t);
        let g = p.lerp(AMBER.g, VIOLET.g, t);
        let b = p.lerp(AMBER.b, VIOLET.b, t);

        p.stroke(r, g, b, alpha);
        p.strokeWeight(weight);
        if (i > 0) {
          let prevT = (i - 1) / 20;
          let prevX = p.lerp(hub.x, this.x, prevT);
          let prevY = p.lerp(hub.y, this.y, prevT);
          p.line(prevX, prevY, x, y);
        }
      }
    }
  }

  const { observer } = createVisibilityObserver(p);

  p.setup = () => {
    const container = document.getElementById('impact-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('impact-canvas');

    hub.x = p.width / 2;
    hub.y = p.height / 2;

    for (let i = 0; i < PRODUCT_COUNT; i++) {
      products.push(new Product(i));
    }

    observer.observe(container);
  };

  p.draw = () => {
    // Gradient background
    for (let y = 0; y < p.height; y++) {
      let inter = p.map(y, 0, p.height, 0, 1);
      let c = p.lerpColor(p.color(20, 15, 10), p.color(15, 10, 25), inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    time++;

    // Check mouse on hub
    let mouseOnHub = false;
    if (p.mouseX > 0 && p.mouseY > 0) {
      let d = p.dist(p.mouseX, p.mouseY, hub.x, hub.y);
      mouseOnHub = d < hub.size / 2;

      // Pulse on hover
      if (mouseOnHub && time % 30 === 0) {
        pulseTime = 1;
        products.forEach(product => {
          product.pulse = 1;
        });
      }
    }

    // Draw connections
    products.forEach(product => {
      let d = p.dist(p.mouseX, p.mouseY, product.x, product.y);
      let mouseOnThis = d < product.size / 2;
      product.drawConnection(mouseOnHub, mouseOnThis);
    });

    // Draw hub
    let hubSize = hub.size;
    if (mouseOnHub) {
      hubSize *= 1.3;
    }

    p.noStroke();
    p.fill(AMBER.r, AMBER.g, AMBER.b, mouseOnHub ? 255 : 200);
    p.circle(hub.x, hub.y, hubSize);

    // Hub border
    p.noFill();
    p.stroke(255, 255, 255, mouseOnHub ? 150 : 60);
    p.strokeWeight(3);
    p.circle(hub.x, hub.y, hubSize);

    // Draw products
    products.forEach(product => {
      let d = p.dist(p.mouseX, p.mouseY, product.x, product.y);
      let mouseOnThis = d < product.size / 2;
      product.display(mouseOnHub, mouseOnThis);
    });

    // Hub label
    p.noStroke();
    p.fill(255, 255, 255, mouseOnHub ? 255 : 150);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('SYSTEM', hub.x, hub.y);
  };

  p.windowResized = () => {
    const container = document.getElementById('impact-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    hub.x = p.width / 2;
    hub.y = p.height / 2;
    products.forEach(product => product.updatePosition());
  };
};

// ============================================
// Initialize all sketches
// ============================================
new p5(heroSketch);
new p5(approachSketch);
new p5(foundationPrinciplesSketch);
new p5(implementationSketch);
new p5(enablementSketch);
new p5(evolutionSketch);
new p5(impactSketch);
