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

  const CHANGE_INTERVAL = 3000; // Change frequency every x seconds when idle
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
  const GRADIENT_SCATTER_INTENSITY = 0.1; // Scattering effect intensity (0 = no scatter, higher = more scatter)

  // Grey color palette for strokes
  const GREYS = [
    { r: 0, g: 0, b: 0, alpha: 100 }
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
      // Keep selecting until we get different frequencies (avoid straight lines)
      let newFreqX, newFreqY;
      do {
        newFreqX = getRandomFrequency();
        newFreqY = getRandomFrequency();
      } while (newFreqX === newFreqY);

      currentFreqX = newFreqX;
      currentFreqY = newFreqY;
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
      p.strokeWeight(1.5 - layerIndex * 0.3);

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
// 2. APPROACH SKETCH - Fractal Tree Growth
// ============================================
// Theme: Fractal tree structure growing from single point
// Colors: Green gradient on white background

const approachSketch = (p) => {
  // ============================================
  // CUSTOMIZATION VARIABLES
  // ============================================

  // Radial Gradient Configuration (Standardized - matches hero sketch)
  const GRADIENT_CENTER_COLOR = { r: 70, g: 210, b: 100 };     // Green (center)
  const GRADIENT_EDGE_COLOR = { r: 255, g: 255, b: 255 };     // White (edge)
  const GRADIENT_CENTER_X = 0.5;                               // X position (0-1)
  const GRADIENT_CENTER_Y = 0;                               // Y position (0-1)
  const GRADIENT_RADIUS_SCALE_X = 0.5;                         // X radius scale
  const GRADIENT_RADIUS_SCALE_Y = 1;                         // Y radius scale
  const GRADIENT_POWER = 1.5;                                    // Falloff power
  const GRADIENT_EDGE_EASE = 1;                                // Edge ease amount
  const GRADIENT_SCATTER_INTENSITY = 0.1;                     // Scatter intensity

  // Fractal Tree Configuration
  const TREE_MAX_DEPTH = 10;                                   // Maximum recursion depth

  // Mouse-Controlled Tree Angle Configuration
  const TREE_ANGLE_MIN = 10;                                    // Minimum angle (top of canvas)
  const TREE_ANGLE_MAX = 60;                                   // Maximum angle (bottom of canvas)
  const TREE_ANGLE_DEFAULT = 30;                               // Default angle (no mouse interaction)
  const TREE_ANGLE_MOMENTUM = 0.02;                            // How quickly angle approaches target (0-1, lower = more momentum)
  const TREE_ANGLE_REDUCTION_ENABLED = true;                   // Enable/disable angle reduction by depth
  const TREE_ANGLE_REDUCTION_MULTIPLIER = 0.8;                 // Multiplier per depth level (e.g., 0.5 = half angle each level)
  let currentTreeAngle = TREE_ANGLE_DEFAULT;                   // Current tree angle (changes with mouse)
  let targetTreeAngle = TREE_ANGLE_DEFAULT;                    // Target angle based on mouse position

  // Growth Animation Configuration
  const GROWTH_DURATION = 80;                                  // Frames for each segment to grow
  const GROWTH_DELAY_PER_LEVEL = 80;                           // Delay .between depth levels (frames)
  let growthProgress = 0;                                      // Current growth progress (0-1)
  let isGrowing = true;                                        // Whether tree is still growing

  // Margins (match hero sketch)
  const MARGIN_PERCENTAGE = -0.2;                               // 10% margin on all sides

  // Dynamic sizing (calculated in setup)
  let segmentLength = 20;                                      // Will be calculated based on canvas height

  // Stroke Configuration
  const STROKE_COLOR = { r: 0, g: 0, b: 0 };                  // Black
  const STROKE_WEIGHT = 1.75;                                   // Consistent stroke weight
  const STROKE_ALPHA_BASE = 200;                               // Base opacity for initial stem (0-255)
  const STROKE_ALPHA_FADE_ENABLED = true;                      // Enable/disable opacity fade with depth
  const STROKE_ALPHA_FADE_RATE = 0.75;                         // Multiplier per depth level (0-1, lower = faster fade)
  const STROKE_ALPHA_MIN = 1;                                 // Minimum opacity (prevents fully transparent branches)
  const FADE_BACKGROUND_ALPHA = 40;                            // Background fade effect

  // Animation
  let animationTime = 0;
  let gradientBuffer;

  // Line tracking for collision detection
  let allLines = []; // Store all completed line segments {x1, y1, x2, y2}

  // ============================================
  // COLLISION DETECTION
  // ============================================

  function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Check if line segment (x1,y1)-(x2,y2) intersects with (x3,y3)-(x4,y4)
    // Using parametric line equation
    let denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (denom === 0) {
      return false; // Lines are parallel
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    // Check if intersection point is within both line segments
    return (ua > 0.01 && ua < 0.99 && ub > 0.01 && ub < 0.99); // Small buffer to avoid endpoint touches
  }

  function findIntersectionPoint(x1, y1, x2, y2) {
    // Find the closest intersection point along the line from (x1,y1) to (x2,y2)
    let closestDist = Infinity;
    let closestT = null;

    for (let line of allLines) {
      // Calculate intersection point
      let denom = (line.y2 - line.y1) * (x2 - x1) - (line.x2 - line.x1) * (y2 - y1);
      if (denom === 0) continue; // Parallel lines

      let ua = ((line.x2 - line.x1) * (y1 - line.y1) - (line.y2 - line.y1) * (x1 - line.x1)) / denom;
      let ub = ((x2 - x1) * (y1 - line.y1) - (y2 - y1) * (x1 - line.x1)) / denom;

      if (ua > 0.01 && ua < 0.99 && ub > 0.01 && ub < 0.99) {
        // Intersection found
        let ix = x1 + ua * (x2 - x1);
        let iy = y1 + ua * (y2 - y1);
        let dist = p.dist(x1, y1, ix, iy);

        if (dist < closestDist && ua > 0.01) { // Only consider forward intersections
          closestDist = dist;
          closestT = ua;
        }
      }
    }

    return closestT;
  }

  // ============================================
  // SHADER CODE (Standardized - matches hero sketch)
  // ============================================

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

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

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
      vec2 pos = vTexCoord;
      vec2 center = uCenter;
      vec2 delta = pos - center;
      delta.x /= uRadiusScale.x;
      delta.y /= uRadiusScale.y;
      float dist = length(delta);

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        dist += (noiseValue - 0.5) * uScatterIntensity;
      }

      float normalizedDist = pow(clamp(dist, 0.0, 1.0), uPower);

      if (uEdgeEase > 0.0 && normalizedDist > (1.0 - uEdgeEase)) {
        float edgeRegion = (normalizedDist - (1.0 - uEdgeEase)) / uEdgeEase;
        normalizedDist = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      vec3 color = mix(uCenterColor, uEdgeColor, normalizedDist);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ============================================
  // FRACTAL TREE FUNCTIONS
  // ============================================

  function drawBranch(x, y, angle, depth, segmentLength) {
    // Check if this depth level should be visible based on growth progress
    let depthStartTime = depth * GROWTH_DELAY_PER_LEVEL;

    if (animationTime < depthStartTime || depth > TREE_MAX_DEPTH) {
      return;
    }

    // Calculate growth progress for this depth level (0 to 1)
    let depthProgress = p.constrain((animationTime - depthStartTime) / GROWTH_DURATION, 0, 1);

    // Use easing for smoother growth
    depthProgress = p.pow(depthProgress, 0.8); // Gentle easing

    // Calculate the FULL end point (where this segment will end when complete)
    let fullX2 = x + p.cos(angle) * segmentLength;
    let fullY2 = y + p.sin(angle) * segmentLength;

    // Calculate CURRENT end point based on growth progress
    // The line grows FROM the origin (x, y) TO the final position
    let currentX2 = x + p.cos(angle) * segmentLength * depthProgress;
    let currentY2 = y + p.sin(angle) * segmentLength * depthProgress;

    // Draw the growing line from origin to current position
    if (depthProgress > 0) {
      // Calculate opacity based on depth
      let alpha;
      if (STROKE_ALPHA_FADE_ENABLED) {
        // Apply exponential fade: each level multiplies by STROKE_ALPHA_FADE_RATE
        alpha = STROKE_ALPHA_BASE * Math.pow(STROKE_ALPHA_FADE_RATE, depth);
        // Clamp to minimum to prevent fully transparent branches
        alpha = Math.max(alpha, STROKE_ALPHA_MIN);
      } else {
        // No fade, use base alpha for all branches
        alpha = STROKE_ALPHA_BASE;
      }

      p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, alpha);
      p.strokeWeight(STROKE_WEIGHT);
      p.line(x, y, currentX2, currentY2);
      // p.fill(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, alpha * 0.5)
      // p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, alpha * 0.5);
      // p.ellipse(x,y,1,1);
    }

    // Only recurse if this branch is fully grown
    // Use the FULL end point as the origin for child branches
    if (depthProgress >= 1.0) {
      // Calculate angle for this depth level
      let branchAngle;
      if (TREE_ANGLE_REDUCTION_ENABLED) {
        // Apply reduction multiplier based on depth
        branchAngle = currentTreeAngle * Math.pow(TREE_ANGLE_REDUCTION_MULTIPLIER, depth + 1);
      } else {
        // Use constant angle for all levels
        branchAngle = currentTreeAngle;
      }

      // Draw right branch
      let rightAngle = angle + p.radians(branchAngle);
      drawBranch(fullX2, fullY2, rightAngle, depth + 1, segmentLength);

      // Draw left branch
      let leftAngle = angle - p.radians(branchAngle);
      drawBranch(fullX2, fullY2, leftAngle, depth + 1, segmentLength);
    }
  }

  // ============================================
  // GRADIENT FUNCTIONS
  // ============================================

  function createGradient() {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientBuffer.pixelDensity(1);

    const shader = gradientBuffer.createShader(vertShader, fragShader);
    gradientBuffer.shader(shader);

    shader.setUniform('uResolution', [p.width, p.height]);
    shader.setUniform('uCenter', [GRADIENT_CENTER_X, GRADIENT_CENTER_Y]);
    shader.setUniform('uCenterColor', [
      GRADIENT_CENTER_COLOR.r / 255.0,
      GRADIENT_CENTER_COLOR.g / 255.0,
      GRADIENT_CENTER_COLOR.b / 255.0
    ]);
    shader.setUniform('uEdgeColor', [
      GRADIENT_EDGE_COLOR.r / 255.0,
      GRADIENT_EDGE_COLOR.g / 255.0,
      GRADIENT_EDGE_COLOR.b / 255.0
    ]);
    shader.setUniform('uRadiusScale', [GRADIENT_RADIUS_SCALE_X, GRADIENT_RADIUS_SCALE_Y]);
    shader.setUniform('uPower', GRADIENT_POWER);
    shader.setUniform('uEdgeEase', GRADIENT_EDGE_EASE);
    shader.setUniform('uScatterIntensity', GRADIENT_SCATTER_INTENSITY);

    gradientBuffer.rectMode(p.CENTER);
    gradientBuffer.noStroke();
    gradientBuffer.rect(0, 0, p.width, p.height);
  }

  function drawGradient() {
    p.image(gradientBuffer, 0, 0);
  }

  // ============================================
  // P5.JS LIFECYCLE
  // ============================================

  const { observer } = createVisibilityObserver(p);

  function calculateSegmentLength() {
    // Calculate margins
    let minDimension = Math.min(p.width, p.height);
    let margin = minDimension * MARGIN_PERCENTAGE;
    let drawableHeight = p.height - (margin * 2);

    // Calculate segment length to fill the canvas height
    // The tree grows upward through TREE_MAX_DEPTH levels
    // With angle branching, the effective vertical distance per segment is cos(0) = 1 for the trunk
    // We want the total height to fill the drawable area
    segmentLength = drawableHeight / (TREE_MAX_DEPTH * 0.95); // 0.95 to leave small buffer
  }

  p.setup = () => {
    const container = document.getElementById('approach-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('approach-canvas');

    createGradient();
    calculateSegmentLength();

    observer.observe(container);
  };

  p.draw = () => {
    // Draw gradient background
    drawGradient();

    // Apply subtle fade effect (only if needed)
    if (FADE_BACKGROUND_ALPHA > 0) {
      p.fill(GRADIENT_CENTER_COLOR.r, GRADIENT_CENTER_COLOR.g, GRADIENT_CENTER_COLOR.b, FADE_BACKGROUND_ALPHA);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
    }

    // Update target tree angle based on mouse position within canvas
    if (p.mouseY >= 0 && p.mouseY <= p.height && p.mouseX >= 0 && p.mouseX <= p.width) {
      // Map mouseY from 0 (top) to canvas height (bottom) to TREE_ANGLE_MIN to TREE_ANGLE_MAX
      targetTreeAngle = p.map(p.mouseY, 0, p.height, TREE_ANGLE_MIN, TREE_ANGLE_MAX);
    } else {
      // Mouse is outside canvas, return to default
      targetTreeAngle = TREE_ANGLE_DEFAULT;
    }

    // Apply momentum - gradually approach target angle
    currentTreeAngle += (targetTreeAngle - currentTreeAngle) * TREE_ANGLE_MOMENTUM;

    // Increment animation time (grows the tree)
    if (isGrowing) {
      animationTime += 1;

      // Check if tree is fully grown
      let maxGrowthTime = (TREE_MAX_DEPTH + 1) * GROWTH_DELAY_PER_LEVEL + GROWTH_DURATION;
      if (animationTime >= maxGrowthTime) {
        isGrowing = false;
        growthProgress = 1;
      } else {
        growthProgress = animationTime / maxGrowthTime;
      }
    }

    // Calculate margins (matching hero sketch)
    let minDimension = Math.min(p.width, p.height);
    let margin = minDimension * MARGIN_PERCENTAGE;

    // Calculate tree starting position (bottom center of drawable area)
    let startX = p.width / 2;
    let startY = p.height - margin;

    // Draw fractal tree with dynamically calculated segment length
    p.noFill();
    drawBranch(startX, startY, -p.HALF_PI, 0, segmentLength);
  };

  p.windowResized = () => {
    const container = document.getElementById('approach-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient();
    calculateSegmentLength();
  };
};

// ============================================
// 3. FOUNDATION SKETCH - Rounded Truchet Tiles
// ============================================
// Theme: Modular truchet tile pattern with random rotations
// Gradient: Radial gradient (green center to light edge)

const foundationPrinciplesSketch = (p) => {
  let gradientBuffer;
  let gradientShader;
  let tiles = [];
  let cols, rows;

  // Radial Gradient Configuration (Standardized - matches hero sketch)
  const GRADIENT_CENTER_COLOR = { r: 16, g: 185, b: 129 }; // Forest Green (center)
  const GRADIENT_EDGE_COLOR = { r: 240, g: 240, b: 235 }; // Light background (edge)
  const GRADIENT_CENTER_X = 0.5;                           // X position (0-1)
  const GRADIENT_CENTER_Y = 0.5;                           // Y position (0-1)
  const GRADIENT_RADIUS_SCALE_X = 0.4;                     // X radius scale
  const GRADIENT_RADIUS_SCALE_Y = 0.3;                     // Y radius scale
  const GRADIENT_POWER = 0.5;                              // Falloff power
  const GRADIENT_EDGE_EASE = 0.5;                          // Edge ease amount
  const GRADIENT_SCATTER_INTENSITY = 0.1;                 // Scatter intensity

  // Tile Grid Configuration
  const TILE_SIZE = 100;                                    // Size of each tile in pixels
  const TILE_MARGIN = 0.2;                                // Margin around grid (percentage of canvas)

  // Line Style Configuration (matching hero sketch)
  const STROKE_COLOR = { r: 0, g: 0, b: 0 };              // Black
  const STROKE_WEIGHT = 1.5;                               // Line thickness
  const STROKE_ALPHA = 80;                                // Line opacity

  // Tile Corner Radius
  const TILE_CORNER_RADIUS = 0.5;                          // Radius for rounded arcs (fraction of tile size)

  // Animation Timing Configuration
  const ROTATION_INTERVAL_MIN = 3000;                      // Min time between rotations (ms)
  const ROTATION_INTERVAL_MAX = 3000;                      // Max time between rotations (ms)
  const ROTATION_DURATION = 1500;                           // Duration of rotation animation (ms)
  const SIMULTANEOUS_ROTATIONS = 100;                        // Max tiles rotating at once

  const { observer } = createVisibilityObserver(p);

  // Shader Code (Standardized - matches hero sketch)
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

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

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
      vec2 pos = vTexCoord;
      vec2 center = uCenter;
      vec2 delta = pos - center;
      delta.x /= uRadiusScale.x;
      delta.y /= uRadiusScale.y;
      float dist = length(delta);

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        dist += (noiseValue - 0.5) * uScatterIntensity;
      }

      float normalizedDist = pow(clamp(dist, 0.0, 1.0), uPower);

      if (uEdgeEase > 0.0 && normalizedDist > (1.0 - uEdgeEase)) {
        float edgeRegion = (normalizedDist - (1.0 - uEdgeEase)) / uEdgeEase;
        normalizedDist = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      vec3 color = mix(uCenterColor, uEdgeColor, normalizedDist);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const createGradient = () => {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientShader = gradientBuffer.createShader(vertShader, fragShader);
    gradientBuffer.shader(gradientShader);

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

    gradientBuffer.rectMode(p.CENTER);
    gradientBuffer.noStroke();
    gradientBuffer.rect(0, 0, p.width, p.height);
  };

  const drawGradient = () => {
    p.image(gradientBuffer, 0, 0);
  };

  // ============================================
  // TILE CLASS
  // ============================================

  class Tile {
    constructor(row, col) {
      this.row = row;
      this.col = col;
      // Random initial rotation (0, 90, 180, or 270 degrees)
      this.currentRotation = p.floor(p.random(4)) * 90;
      this.targetRotation = this.currentRotation;
      this.animationProgress = 1; // 0 to 1 (1 = not animating)
      this.nextRotationTime = p.millis() + p.random(ROTATION_INTERVAL_MIN, ROTATION_INTERVAL_MAX);
      this.isAnimating = false;
    }

    update(currentTime) {
      // Check if it's time to start a new rotation
      if (!this.isAnimating && currentTime >= this.nextRotationTime) {
        // Check if we've hit the simultaneous rotation limit
        let animatingCount = getAnimatingTilesCount();
        if (animatingCount >= SIMULTANEOUS_ROTATIONS) {
          // Defer this rotation
          this.nextRotationTime = currentTime + 100; // Try again in 100ms
          return;
        }

        // Randomly rotate 90 degrees clockwise or counterclockwise
        let direction = p.random() < 0.5 ? 90 : -90;
        this.targetRotation = this.currentRotation + direction;
        this.animationProgress = 0;
        this.isAnimating = true;
      }

      // Update animation
      if (this.isAnimating) {
        this.animationProgress += p.deltaTime / ROTATION_DURATION;

        if (this.animationProgress >= 1) {
          // Animation complete
          this.animationProgress = 1;
          this.currentRotation = this.targetRotation;
          this.isAnimating = false;
          // Schedule next rotation
          this.nextRotationTime = currentTime + p.random(ROTATION_INTERVAL_MIN, ROTATION_INTERVAL_MAX);
        }
      }
    }

    getCurrentRotation() {
      if (!this.isAnimating) {
        return this.currentRotation;
      }
      // Apply easing to animation progress (ease-in-out cubic)
      let t = this.animationProgress;
      let eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      return p.lerp(this.currentRotation, this.targetRotation, eased);
    }

    draw(startX, startY) {
      let x = startX + this.col * TILE_SIZE;
      let y = startY + this.row * TILE_SIZE;

      p.push();
      p.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
      p.rotate(p.radians(this.getCurrentRotation()));

      // Draw truchet tile (two quarter-circle arcs)
      p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, STROKE_ALPHA);
      p.strokeWeight(STROKE_WEIGHT);
      p.strokeCap(p.ROUND);
      p.noFill();

      let radius = TILE_SIZE * TILE_CORNER_RADIUS;
      let offset = TILE_SIZE / 2;

      // Arc from top-left corner
      p.arc(-offset, -offset, radius * 2, radius * 2, 0, p.HALF_PI);

      // Arc from bottom-right corner
      p.arc(offset, offset, radius * 2, radius * 2, p.PI, p.PI + p.HALF_PI);

      p.pop();
    }
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  function initializeTiles() {
    tiles = [];

    // Calculate grid dimensions with margins
    let minDimension = Math.min(p.width, p.height);
    let margin = minDimension * TILE_MARGIN;

    let gridWidth = p.width - (margin * 2);
    let gridHeight = p.height - (margin * 2);

    cols = Math.floor(gridWidth / TILE_SIZE);
    rows = Math.floor(gridHeight / TILE_SIZE);

    // Calculate centered starting position
    let startX = (p.width - cols * TILE_SIZE) / 2;
    let startY = (p.height - rows * TILE_SIZE) / 2;

    // Create tiles
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        tiles.push(new Tile(row, col));
      }
    }

    return { startX, startY };
  }

  function getAnimatingTilesCount() {
    return tiles.filter(tile => tile.isAnimating).length;
  }

  // Store grid offset for centered positioning
  let gridOffset = { startX: 0, startY: 0 };

  // ============================================
  // P5.JS LIFECYCLE
  // ============================================

  p.setup = () => {
    const container = document.getElementById('foundation-principles-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('foundation-principles-canvas');

    createGradient();
    gridOffset = initializeTiles();

    observer.observe(container);
  };

  p.draw = () => {
    let currentTime = p.millis();

    // Draw gradient background
    drawGradient();

    // Update and draw tiles
    tiles.forEach(tile => {
      tile.update(currentTime);
      tile.draw(gridOffset.startX, gridOffset.startY);
    });
  };

  p.windowResized = () => {
    const container = document.getElementById('foundation-principles-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient();
    gridOffset = initializeTiles();
  };
};

// ============================================
// 4. IMPLEMENTATION SKETCH - Interpolated Ellipses
// ============================================
// Theme: Ellipses morphing between two control points with wave animation
// Gradient: Rotated radial gradient (magenta center to white edge)

const implementationSketch = (p) => {
  let gradientBuffer;
  let gradientShader;
  let wavePhase = 0;

  // Dynamic arc control
  let currentArcAmount = 0;
  let currentArcDirection = 1;
  let targetArcAmount = 0;
  let targetArcDirection = 1;

  // ============================================
  // CUSTOMIZATION VARIABLES
  // ============================================

  // Control Ellipse 1 Configuration (Bottom-Left)
  const ELLIPSE_1_X = .5;                              // X position (0-1)
  const ELLIPSE_1_Y = 1;                                // Y position (0-1)
  const ELLIPSE_1_WIDTH = 500;                           // Width in pixels
  const ELLIPSE_1_HEIGHT = 0;                           // Height in pixels

  // Control Ellipse 2 Configuration (Top-Right)
  const ELLIPSE_2_X = 0.5;                              // X position (0-1)
  const ELLIPSE_2_Y = 0;                              // Y position (0-1)
  const ELLIPSE_2_WIDTH = 500;                            // Width in pixels
  const ELLIPSE_2_HEIGHT = 0;                          // Height in pixels

  // Intermediate Ellipses Configuration
  const INTERMEDIATE_STEPS = 60;                          // Number of ellipses between control ellipses
  const INTERMEDIATE_SCALE_MULTIPLIER = 1.0;             // Scale at center (1.0 = no scaling, 0.5 = half size)
  const INTERMEDIATE_SCALE_CURVE = "parabolic";          // "linear", "parabolic", "sine"
  const INTERMEDIATE_MAX_SIZE = 400;                     // Max size at center when edge ellipses are flat (width/height = 0)

  // Path Configuration
  const PATH_ARC_MAX_AMOUNT = 0.15;                      // Maximum arc curvature when mouse at edge
  const PATH_ARC_MOUSE_CONTROL = true;                   // Enable/disable mouse control for arc
  const PATH_ARC_MOUSE_INTENSITY = 0.3;                  // How much mouse affects arc (0 = no effect, 1 = full effect)
  const PATH_ARC_MOUSE_MOMENTUM = 0.05;                  // Arc change smoothness (0.01 = very smooth, 1 = instant)
  const PATH_ARC_STRENGTH_MULTIPLIER = 1.0;              // Global multiplier for arc strength (0 = no arc, 2 = double arc)
  const PATH_ARC_DEFAULT_AMOUNT = 0.03;                  // Default arc when mouse not in canvas
  const PATH_ARC_DEFAULT_DIRECTION = -1;                 // Default direction when mouse not in canvas (1 = up/right, -1 = down/left)
  const PATH_SPACING_TAPER_INTENSITY = 1;                // Spacing variation (0 = even spacing, 1 = max variation)
  const PATH_SPACING_TAPER_CURVE = "parabolic";          // "linear", "parabolic", "sine", "exponential"

  // Wave Animation Configuration
  const WAVE_FREQUENCY = 1.5;                              // Number of complete waves
  const WAVE_AMPLITUDE = 0.9;                            // Size variation (0.3 = ±30%)
  const WAVE_SPEED = 0.005;                               // Speed of wave movement
  const WAVE_CIRCULARITY_INTENSITY = 0.8;                // How circular ellipses become when scaled (0 = no change, 1 = perfect circle when smallest)

  // Stroke Style (matching hero sketch)
  const STROKE_COLOR = { r: 0, g: 0, b: 0 };            // Black
  const STROKE_WEIGHT = 1.5;                             // Line thickness
  const STROKE_ALPHA = 100;                              // Base opacity (used when taper disabled)

  // Stroke Opacity Taper Configuration
  const STROKE_ALPHA_TAPER_ENABLED = true;               // Enable/disable opacity taper
  const STROKE_ALPHA_TAPER_CURVE = "sine";               // "linear", "parabolic", "sine", "exponential"
  const STROKE_ALPHA_MIN = 20;                           // Minimum opacity at edges (0-255)
  const STROKE_ALPHA_MAX = 100;                          // Maximum opacity at center (0-255)

  // Radial Gradient Configuration
  const GRADIENT_CENTER_COLOR = { r: 255, g: 120, b: 200 }; // Magenta (center)
  const GRADIENT_EDGE_COLOR = { r: 255, g: 255, b: 255 }; // White (edge)
  const GRADIENT_CENTER_X = 0.5;                         // X position (0-1)
  const GRADIENT_CENTER_Y = 0.5;                         // Y position (0-1)
  const GRADIENT_RADIUS_SCALE_X = 0.3;                   // X radius scale
  const GRADIENT_RADIUS_SCALE_Y = 10;                   // Y radius scale
  const GRADIENT_ROTATION_ANGLE = 0;                   // Rotation angle in degrees (0 = no rotation)
  const GRADIENT_POWER = 0.75;                            // Falloff power
  const GRADIENT_EDGE_EASE = 1;                       // Edge ease amount
  const GRADIENT_SCATTER_INTENSITY = 0.1;              // Scatter intensity

  const { observer } = createVisibilityObserver(p);

  // Shader Code (Standardized with rotation support)
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

  const fragShader = `
    precision highp float;
    varying vec2 vTexCoord;

    uniform vec2 uResolution;
    uniform vec2 uCenter;
    uniform vec3 uCenterColor;
    uniform vec3 uEdgeColor;
    uniform vec2 uRadiusScale;
    uniform float uRotation;
    uniform float uPower;
    uniform float uEdgeEase;
    uniform float uScatterIntensity;

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

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
      vec2 pos = vTexCoord;
      vec2 center = uCenter;
      vec2 delta = pos - center;

      // Apply rotation to delta vector
      if (uRotation != 0.0) {
        float cosR = cos(uRotation);
        float sinR = sin(uRotation);
        float rotatedX = delta.x * cosR - delta.y * sinR;
        float rotatedY = delta.x * sinR + delta.y * cosR;
        delta = vec2(rotatedX, rotatedY);
      }

      // Apply scale
      delta.x /= uRadiusScale.x;
      delta.y /= uRadiusScale.y;
      float dist = length(delta);

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        dist += (noiseValue - 0.5) * uScatterIntensity;
      }

      float normalizedDist = pow(clamp(dist, 0.0, 1.0), uPower);

      if (uEdgeEase > 0.0 && normalizedDist > (1.0 - uEdgeEase)) {
        float edgeRegion = (normalizedDist - (1.0 - uEdgeEase)) / uEdgeEase;
        normalizedDist = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      vec3 color = mix(uCenterColor, uEdgeColor, normalizedDist);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ============================================
  // CALCULATION FUNCTIONS
  // ============================================

  // Calculate redistributed position along path for spacing taper
  function calculatePathPosition(index, totalEllipses) {
    // Edge ellipses must remain at exact positions
    if (index === 0) return 0;
    if (index === totalEllipses - 1) return 1;

    // Linear progress (0 to 1)
    let tLinear = index / (totalEllipses - 1);

    // If no spacing taper, return linear
    if (PATH_SPACING_TAPER_INTENSITY === 0) {
      return tLinear;
    }

    // Calculate eased position based on curve type
    let tEased = tLinear;

    if (PATH_SPACING_TAPER_CURVE === "sine") {
      // Smooth S-curve: compresses edges, expands center
      tEased = (1.0 - p.cos(tLinear * p.PI)) / 2.0;
    } else if (PATH_SPACING_TAPER_CURVE === "parabolic") {
      // Cubic ease in-out: stronger compression at edges, more expansion at center
      tEased = tLinear < 0.5
        ? 4.0 * tLinear * tLinear * tLinear
        : 1.0 - 4.0 * (1.0 - tLinear) * (1.0 - tLinear) * (1.0 - tLinear);
    } else if (PATH_SPACING_TAPER_CURVE === "exponential") {
      // Symmetric exponential: compress both edges, expand center
      let distance = Math.abs(tLinear - 0.5) * 2.0; // 0 at center, 1 at edges
      let compressionFactor = Math.exp(3.0 * distance) / Math.exp(3.0);
      tEased = tLinear < 0.5
        ? 0.5 - (0.5 - tLinear) * compressionFactor
        : 0.5 + (tLinear - 0.5) * compressionFactor;
    }
    // "linear" or unknown: use tLinear

    // Blend between linear and eased based on intensity
    return p.lerp(tLinear, tEased, PATH_SPACING_TAPER_INTENSITY);
  }

  // Calculate position along path with arc
  function calculatePosition(t, arcAmount, arcDirection) {
    // Linear interpolation for base position
    let x = p.lerp(ELLIPSE_1_X, ELLIPSE_2_X, t);
    let y = p.lerp(ELLIPSE_1_Y, ELLIPSE_2_Y, t);

    // Apply arc offset perpendicular to line
    if (arcAmount > 0) {
      // Calculate perpendicular offset using sine curve
      let arcOffset = arcAmount * p.sin(t * p.PI) * arcDirection;

      // Calculate perpendicular direction to line
      let dx = ELLIPSE_2_X - ELLIPSE_1_X;
      let dy = ELLIPSE_2_Y - ELLIPSE_1_Y;
      let length = p.sqrt(dx * dx + dy * dy);

      // Perpendicular vector (rotated 90 degrees)
      let perpX = -dy / length;
      let perpY = dx / length;

      // Apply arc offset
      x += perpX * arcOffset;
      y += perpY * arcOffset;
    }

    return { x, y };
  }

  // Calculate scale modifier based on position curve
  function calculateScaleModifier(t) {
    // Edge ellipses always remain at full size (no scaling)
    if (t === 0 || t === 1) {
      return 1.0;
    }

    if (INTERMEDIATE_SCALE_MULTIPLIER >= 1.0) {
      return 1.0; // No scaling
    }

    let modifier = 1.0;

    if (INTERMEDIATE_SCALE_CURVE === "parabolic") {
      // Parabolic curve - smallest at center, 1.0 at edges
      modifier = 1.0 - (1.0 - INTERMEDIATE_SCALE_MULTIPLIER) * 4 * (t - 0.5) * (t - 0.5);
    } else if (INTERMEDIATE_SCALE_CURVE === "sine") {
      // Sine curve - smallest at center, 1.0 at edges
      modifier = 1.0 - (1.0 - INTERMEDIATE_SCALE_MULTIPLIER) * p.sin(t * p.PI);
    } else {
      // Linear - no curve
      modifier = 1.0;
    }

    return modifier;
  }

  // Calculate wave taper (0 at edges, 1 at center)
  function calculateWaveTaper(t) {
    // Use sine curve: 0 at t=0, 1 at t=0.5, 0 at t=1
    return p.sin(t * p.PI);
  }

  // Calculate wave scale multiplier for animation
  function calculateWaveScale(index, totalEllipses, taper) {
    let waveValue = p.sin(wavePhase + index * WAVE_FREQUENCY * p.TWO_PI / totalEllipses);
    // Map waveValue from [-1, 1] to [1-AMPLITUDE, 1] so it can only reduce size, never increase
    let scale = 1.0 - ((1.0 - waveValue) / 2.0) * WAVE_AMPLITUDE * taper;
    return scale;
  }

  // Calculate dimension with support for flat ellipses (0 width/height)
  function calculateDimension(dimension1, dimension2, t) {
    // If both edges are flat (0), create lens shape using INTERMEDIATE_MAX_SIZE
    if (dimension1 === 0 && dimension2 === 0) {
      return INTERMEDIATE_MAX_SIZE * p.sin(t * p.PI);
    }
    // Otherwise, linear interpolation between the two values
    return p.lerp(dimension1, dimension2, t);
  }

  // Calculate opacity based on position (fade at edges, opaque at center)
  function calculateOpacity(t) {
    // If opacity taper is disabled, use base alpha
    if (!STROKE_ALPHA_TAPER_ENABLED) {
      return STROKE_ALPHA;
    }

    // Calculate fade value (1.0 at center, 0.0 at edges)
    let fade;

    if (STROKE_ALPHA_TAPER_CURVE === "sine") {
      // Smooth sine curve
      fade = p.sin(t * p.PI);
    } else if (STROKE_ALPHA_TAPER_CURVE === "parabolic") {
      // Parabolic curve
      fade = 1.0 - 4.0 * (t - 0.5) * (t - 0.5);
    } else if (STROKE_ALPHA_TAPER_CURVE === "exponential") {
      // Exponential (Gaussian-like) curve
      fade = Math.exp(-8.0 * (t - 0.5) * (t - 0.5));
    } else {
      // Linear fallback
      fade = 1.0 - 2.0 * Math.abs(t - 0.5);
    }

    // Interpolate between min and max alpha based on fade
    return p.lerp(STROKE_ALPHA_MIN, STROKE_ALPHA_MAX, fade);
  }

  // Apply circularity adjustment - makes scaled ellipses more circular
  function applyCircularity(width, height, waveScale) {
    // If no circularity intensity, return unchanged
    if (WAVE_CIRCULARITY_INTENSITY === 0) {
      return { width, height };
    }

    // Calculate how much the ellipse is scaled down from full size (1.0)
    // waveScale ranges from (1 - WAVE_AMPLITUDE) to 1.0
    // scaleFactor: 0 = full size, 1 = most scaled down
    let scaleFactor = (1.0 - waveScale) / WAVE_AMPLITUDE;

    // Calculate the circularity amount based on scale and intensity
    let circularityAmount = scaleFactor * WAVE_CIRCULARITY_INTENSITY;

    // Calculate the average dimension (what a perfect circle would be)
    let avgDimension = (width + height) / 2.0;

    // Lerp width and height toward avgDimension based on circularity amount
    let adjustedWidth = p.lerp(width, avgDimension, circularityAmount);
    let adjustedHeight = p.lerp(height, avgDimension, circularityAmount);

    return { width: adjustedWidth, height: adjustedHeight };
  }

  // ============================================
  // GRADIENT FUNCTIONS
  // ============================================

  function createGradient() {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientBuffer.pixelDensity(1);
    gradientShader = gradientBuffer.createShader(vertShader, fragShader);
  }

  function drawGradient() {
    gradientBuffer.shader(gradientShader);
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
    gradientShader.setUniform('uRotation', p.radians(GRADIENT_ROTATION_ANGLE));
    gradientShader.setUniform('uPower', GRADIENT_POWER);
    gradientShader.setUniform('uEdgeEase', GRADIENT_EDGE_EASE);
    gradientShader.setUniform('uScatterIntensity', GRADIENT_SCATTER_INTENSITY);

    gradientBuffer.rectMode(p.CENTER);
    gradientBuffer.noStroke();
    gradientBuffer.rect(0, 0, p.width, p.height);

    p.image(gradientBuffer, 0, 0);
  }

  // ============================================
  // P5.JS LIFECYCLE
  // ============================================

  p.setup = () => {
    const container = document.getElementById('implementation-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('implementation-canvas');

    createGradient();
    observer.observe(container);
  };

  p.draw = () => {
    // Draw rotated gradient background
    drawGradient();

    // Update wave animation
    wavePhase += WAVE_SPEED;

    // Update arc based on mouse position with momentum and intensity
    if (PATH_ARC_MOUSE_CONTROL && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      // Map mouseX from [0, width] to [-1, 1]
      let mouseNormalized = (p.mouseX / p.width) * 2.0 - 1.0;

      // Apply intensity to mouse influence
      let mouseInfluence = mouseNormalized * PATH_ARC_MOUSE_INTENSITY;

      // Calculate target arc amount (0 at center, max at edges) with strength multiplier
      targetArcAmount = Math.abs(mouseInfluence) * PATH_ARC_MAX_AMOUNT * PATH_ARC_STRENGTH_MULTIPLIER;

      // Calculate target direction based on which side of center
      targetArcDirection = mouseInfluence >= 0 ? 1 : -1;
    } else {
      // Mouse outside canvas, use defaults with strength multiplier
      targetArcAmount = PATH_ARC_DEFAULT_AMOUNT * PATH_ARC_STRENGTH_MULTIPLIER;
      targetArcDirection = PATH_ARC_DEFAULT_DIRECTION;
    }

    // Smoothly interpolate current arc amount toward target using momentum
    currentArcAmount += (targetArcAmount - currentArcAmount) * PATH_ARC_MOUSE_MOMENTUM;

    // Update direction when arc is very small to avoid abrupt flips
    if (Math.abs(currentArcAmount) < 0.01) {
      currentArcDirection = targetArcDirection;
    }

    // Calculate total number of ellipses
    let totalEllipses = INTERMEDIATE_STEPS + 2;

    // Draw all ellipses
    p.strokeWeight(STROKE_WEIGHT);
    p.strokeCap(p.ROUND);
    p.noFill();

    for (let i = 0; i < totalEllipses; i++) {
      // Calculate redistributed position along path with spacing taper
      let t = calculatePathPosition(i, totalEllipses);

      // Get position with dynamic arc
      let pos = calculatePosition(t, currentArcAmount, currentArcDirection);
      let x = pos.x * p.width;
      let y = pos.y * p.height;

      // Calculate dimensions with support for flat ellipses
      let baseWidth = calculateDimension(ELLIPSE_1_WIDTH, ELLIPSE_2_WIDTH, t);
      let baseHeight = calculateDimension(ELLIPSE_1_HEIGHT, ELLIPSE_2_HEIGHT, t);

      // Apply scale modifier based on position curve (edges remain 1.0)
      let scaleModifier = calculateScaleModifier(t);

      // Calculate wave taper (0 at edges, 1 at center)
      let taper = calculateWaveTaper(t);

      // Apply wave animation with taper
      let waveScale = calculateWaveScale(i, totalEllipses, taper);

      // Calculate final dimensions
      let width = baseWidth * scaleModifier * waveScale;
      let height = baseHeight * scaleModifier * waveScale;

      // Apply circularity adjustment - smaller ellipses become more circular
      let adjusted = applyCircularity(width, height, waveScale);
      width = adjusted.width;
      height = adjusted.height;

      // Calculate opacity based on position (fade at edges)
      let opacity = calculateOpacity(t);

      // Draw ellipse with tapered opacity
      p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, opacity);
      p.ellipse(x, y, width, height);
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('implementation-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient();
  };
};

// ============================================
// 5. ENABLEMENT SKETCH - Expanding Waves
// ============================================
// Theme: Concentric rings expanding from center (ripple effect)
// Colors: Orange (#F97316) + Indigo (#6366F1)

const enablementSketch = (p) => {
  // ============================================
  // CUSTOMIZATION VARIABLES
  // ============================================

  // Radial Gradient Configuration (Offset Center)
  const GRADIENT_CENTER_COLOR = { r: 249, g: 115, b: 22 };     // Orange
  const GRADIENT_EDGE_COLOR = { r: 99, g: 102, b: 241 };       // Indigo
  const GRADIENT_CENTER_X = 0.35;                               // X position (0-1)
  const GRADIENT_CENTER_Y = 0.4;                                // Y position (0-1)
  const GRADIENT_RADIUS_SCALE_X = 0.5;                          // X radius scale
  const GRADIENT_RADIUS_SCALE_Y = 0.5;                          // Y radius scale
  const GRADIENT_POWER = 2.5;                                   // Falloff power
  const GRADIENT_EDGE_EASE = 0.35;                              // Edge ease amount (0-1)
  const GRADIENT_SCATTER_INTENSITY = 0.1;                      // Scatter effect intensity

  // Wave Animation Configuration
  const WAVE_COUNT = 8;                                         // Number of concentric waves
  const WAVE_SPACING = 60;                                      // Spacing between waves
  const WAVE_EXPANSION_SPEED = 0.8;                             // How fast waves expand
  const WAVE_MAX_RADIUS = 600;                                  // Maximum wave radius before reset
  const WAVE_SEGMENTS = 120;                                    // Number of segments per wave
  const WAVE_WOBBLE_AMPLITUDE = 8;                              // Wave distortion amplitude
  const WAVE_WOBBLE_FREQUENCY = 6;                              // Wave distortion frequency
  const WAVE_WOBBLE_SPEED = 0.02;                               // Wave distortion animation speed

  // Stroke Configuration
  const STROKE_WEIGHT = 2;                                      // Wave stroke thickness
  const STROKE_COLOR = { r: 200, g: 200, b: 200 };             // Base stroke color (grey)
  const STROKE_ALPHA_MIN = 40;                                  // Minimum stroke opacity
  const STROKE_ALPHA_MAX = 180;                                 // Maximum stroke opacity
  const FADE_BACKGROUND_ALPHA = 100;                            // Background fade effect opacity

  // Animation
  let animationTime = 0;
  let gradientBuffer;
  let waves = [];

  // ============================================
  // SHADER CODE (Standardized - matches hero sketch)
  // ============================================

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

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

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
      vec2 pos = vTexCoord;
      vec2 center = uCenter;
      vec2 delta = pos - center;
      delta.x /= uRadiusScale.x;
      delta.y /= uRadiusScale.y;
      float dist = length(delta);

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        dist += (noiseValue - 0.5) * uScatterIntensity;
      }

      float normalizedDist = pow(clamp(dist, 0.0, 1.0), uPower);

      if (uEdgeEase > 0.0 && normalizedDist > (1.0 - uEdgeEase)) {
        float edgeRegion = (normalizedDist - (1.0 - uEdgeEase)) / uEdgeEase;
        normalizedDist = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      vec3 color = mix(uCenterColor, uEdgeColor, normalizedDist);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ============================================
  // WAVE CLASS
  // ============================================

  class Wave {
    constructor(startRadius) {
      this.radius = startRadius;
      this.wobbleOffset = p.random(1000);
    }

    update() {
      this.radius += WAVE_EXPANSION_SPEED;
    }

    display(centerX, centerY) {
      // Calculate alpha based on radius (fade as it expands)
      let alpha = p.map(this.radius, 0, WAVE_MAX_RADIUS, STROKE_ALPHA_MAX, STROKE_ALPHA_MIN);
      alpha = p.constrain(alpha, STROKE_ALPHA_MIN, STROKE_ALPHA_MAX);

      p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, alpha);
      p.strokeWeight(STROKE_WEIGHT);
      p.noFill();

      p.beginShape();
      for (let i = 0; i <= WAVE_SEGMENTS; i++) {
        let angle = p.map(i, 0, WAVE_SEGMENTS, 0, p.TWO_PI);

        // Add wobble distortion
        let wobble = p.sin(angle * WAVE_WOBBLE_FREQUENCY + animationTime * WAVE_WOBBLE_SPEED + this.wobbleOffset) * WAVE_WOBBLE_AMPLITUDE;
        let currentRadius = this.radius + wobble;

        let x = centerX + p.cos(angle) * currentRadius;
        let y = centerY + p.sin(angle) * currentRadius;

        p.vertex(x, y);
      }
      p.endShape();
    }

    isDead() {
      return this.radius > WAVE_MAX_RADIUS;
    }
  }

  // ============================================
  // GRADIENT FUNCTIONS
  // ============================================

  function createGradient() {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientBuffer.pixelDensity(1);

    const shader = gradientBuffer.createShader(vertShader, fragShader);
    gradientBuffer.shader(shader);

    shader.setUniform('uResolution', [p.width, p.height]);
    shader.setUniform('uCenter', [GRADIENT_CENTER_X, GRADIENT_CENTER_Y]);
    shader.setUniform('uCenterColor', [
      GRADIENT_CENTER_COLOR.r / 255.0,
      GRADIENT_CENTER_COLOR.g / 255.0,
      GRADIENT_CENTER_COLOR.b / 255.0
    ]);
    shader.setUniform('uEdgeColor', [
      GRADIENT_EDGE_COLOR.r / 255.0,
      GRADIENT_EDGE_COLOR.g / 255.0,
      GRADIENT_EDGE_COLOR.b / 255.0
    ]);
    shader.setUniform('uRadiusScale', [GRADIENT_RADIUS_SCALE_X, GRADIENT_RADIUS_SCALE_Y]);
    shader.setUniform('uPower', GRADIENT_POWER);
    shader.setUniform('uEdgeEase', GRADIENT_EDGE_EASE);
    shader.setUniform('uScatterIntensity', GRADIENT_SCATTER_INTENSITY);

    gradientBuffer.rectMode(p.CENTER);
    gradientBuffer.noStroke();
    gradientBuffer.rect(0, 0, p.width, p.height);
  }

  function drawGradient() {
    p.image(gradientBuffer, 0, 0);
  }

  // ============================================
  // P5.JS LIFECYCLE
  // ============================================

  const { observer } = createVisibilityObserver(p);

  p.setup = () => {
    const container = document.getElementById('enablement-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('enablement-canvas');

    createGradient();

    // Initialize waves with staggered starting positions
    for (let i = 0; i < WAVE_COUNT; i++) {
      waves.push(new Wave(i * WAVE_SPACING));
    }

    observer.observe(container);
  };

  p.draw = () => {
    // Draw gradient background
    drawGradient();

    // Apply fade effect
    p.fill(GRADIENT_CENTER_COLOR.r, GRADIENT_CENTER_COLOR.g, GRADIENT_CENTER_COLOR.b, FADE_BACKGROUND_ALPHA);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);

    animationTime += 1;

    // Calculate center point
    let centerX = p.width * GRADIENT_CENTER_X;
    let centerY = p.height * GRADIENT_CENTER_Y;

    // Update and draw waves
    for (let i = waves.length - 1; i >= 0; i--) {
      waves[i].update();
      waves[i].display(centerX, centerY);

      // Remove dead waves and spawn new ones
      if (waves[i].isDead()) {
        waves.splice(i, 1);
        waves.push(new Wave(0));
      }
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('enablement-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient();
  };
};

// ============================================
// 6. EVOLUTION SKETCH - Dual Lissajous Infinity Loops
// ============================================
// Theme: Two groups of rotating infinity-shaped Lissajous curves
// Colors: Amber (#F59E0B) + Violet (#8B5CF6)

const evolutionSketch = (p) => {
  // ============================================
  // CUSTOMIZATION VARIABLES
  // ============================================

  // Left Group Configuration
  const LEFT_INSTANCE_COUNT = 5;                    // Number of overlayed infinities
  const LEFT_BASE_SIZE = 300;                        // Base size of infinity shape
  const LEFT_SCALE_Y_MIN = -1;                    // Minimum vertical scale (negative for bottom half)
  const LEFT_SCALE_Y_MAX = 1;                     // Maximum vertical scale (positive for top half)
  const LEFT_ANIMATION_SPEED = -0.005;               // Rotation speed
  const LEFT_CENTER_X = 0.25;                       // X position (0-1)
  const LEFT_CENTER_Y = 0.5;                        // Y position (0-1)

  // Right Group Configuration
  const RIGHT_INSTANCE_COUNT = 20;                  // Number of overlayed infinities (more than left)
  const RIGHT_BASE_SIZE = 300;                      // Base size of infinity shape
  const RIGHT_SCALE_Y_MIN = -1.0;                   // Minimum vertical scale (negative for bottom half)
  const RIGHT_SCALE_Y_MAX = 1.0;                    // Maximum vertical scale (positive for top half)
  const RIGHT_ANIMATION_SPEED = -0.001;              // Rotation speed (independent from left)
  const RIGHT_CENTER_X = 0.75;                      // X position (0-1)
  const RIGHT_CENTER_Y = 0.5;                       // Y position (0-1)

  // Lissajous Parameters
  const LISSAJOUS_FREQ_RATIO = 2.0;                 // Frequency ratio for infinity (2:1)
  const LISSAJOUS_PHASE_OFFSET = Math.PI;           // Phase for infinity shape
  const LISSAJOUS_RESOLUTION = 200;                 // Points in curve
  const LISSAJOUS_SCALE_X = 1;                    // Horizontal scale multiplier

  // Stroke Style (matching hero sketch)
  const STROKE_COLOR = { r: 0, g: 0, b: 0 };       // Black
  const STROKE_WEIGHT = 1.5;                        // Line thickness
  const STROKE_ALPHA_MIN = 100;                      // Minimum opacity (far instances)
  const STROKE_ALPHA_MAX = 100;                     // Maximum opacity (close instances)

  // Rolling Wheel Effect Configuration
  const SHOW_STATIC_OUTER_CURVE = true;             // Show static outer "8" at max scale (background)
  const VISIBILITY_THRESHOLD = 0;                 // Only show instances with scaleY > this (0-1, creates rolling effect)

  // Gradient Configuration (Amber + Violet)
  const GRADIENT_CENTER_COLOR = { r: 245, g: 158, b: 11 };  // Amber
  const GRADIENT_EDGE_COLOR = { r: 255, g: 255, b: 255 };
  const GRADIENT_CENTER_X = 0.5;                    // Center X position (0-1)
  const GRADIENT_CENTER_Y = 0.5;                    // Center Y position (0-1)
  const GRADIENT_RADIUS_SCALE_X = 0.5;              // X radius scale
  const GRADIENT_RADIUS_SCALE_Y = 0.5;              // Y radius scale
  const GRADIENT_POWER = 1.0;                       // Gradient power curve
  const GRADIENT_EDGE_EASE = 0.25;                  // Edge easing
  const GRADIENT_SCATTER_INTENSITY = 0.1;         // Scatter effect intensity

  // Animation
  let animationTime = 0;
  let gradientBuffer;
  let gradientShader;

  const { observer } = createVisibilityObserver(p);

  // ============================================
  // SHADER CODE
  // ============================================

  const vertShader = `
    precision highp float;
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

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

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
      vec2 pos = vTexCoord;
      vec2 center = uCenter;
      vec2 delta = pos - center;
      delta.x /= uRadiusScale.x;
      delta.y /= uRadiusScale.y;
      float dist = length(delta);

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        dist += (noiseValue - 0.5) * uScatterIntensity;
      }

      float normalizedDist = pow(clamp(dist, 0.0, 1.0), uPower);

      if (uEdgeEase > 0.0 && normalizedDist > (1.0 - uEdgeEase)) {
        float edgeRegion = (normalizedDist - (1.0 - uEdgeEase)) / uEdgeEase;
        normalizedDist = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      vec3 color = mix(uCenterColor, uEdgeColor, normalizedDist);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ============================================
  // LISSAJOUS FUNCTIONS
  // ============================================

  // Calculate a single point on the Lissajous curve
  function calculateLissajousPoint(t, scaleX, scaleY) {
    // Swap x and y to rotate 90 degrees - creates vertical "8" instead of horizontal "∞"
    let x = Math.sin(LISSAJOUS_FREQ_RATIO * t + LISSAJOUS_PHASE_OFFSET) * scaleX;
    let y = Math.sin(t) * scaleY;
    return { x, y };
  }

  // Draw a single Lissajous infinity curve
  function drawLissajousInfinity(centerX, centerY, baseSize, scaleY, alpha, drawFullCurve = false) {
    p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, alpha);
    p.strokeWeight(STROKE_WEIGHT);
    p.noFill();

    // Determine which half of the curve to draw based on scale sign
    let tStart, tEnd;
    let absScaleY = Math.abs(scaleY);

    if (drawFullCurve) {
      // Draw complete "8" shape (for static outer curve)
      tStart = 0;
      tEnd = p.TWO_PI;
    } else if (scaleY >= 0) {
      // Positive scale: draw top half (teardrop shape)
      tStart = 0;
      tEnd = p.PI;
    } else {
      // Negative scale: draw bottom half (upside-down teardrop)
      tStart = p.PI;
      tEnd = p.TWO_PI;
    }

    p.beginShape();
    for (let i = 0; i <= LISSAJOUS_RESOLUTION; i++) {
      let t = p.map(i, 0, LISSAJOUS_RESOLUTION, tStart, tEnd);
      let point = calculateLissajousPoint(t, baseSize * LISSAJOUS_SCALE_X, baseSize * absScaleY);
      p.vertex(centerX + point.x, centerY + point.y);
    }
    p.endShape();
  }

  // Draw static outer curve (background element for rolling wheel effect)
  function drawStaticOuterCurve(centerX, centerY, baseSize) {
    // Draw static "8" at maximum scale with very low opacity (background anchor)
    let alpha = STROKE_ALPHA_MIN * 0.5;  // Even more subtle than minimum
    drawLissajousInfinity(centerX * p.width, centerY * p.height, baseSize, 1.0, alpha, true);
  }

  // Draw a group of rotating Lissajous infinities
  function drawLissajousGroup(centerX, centerY, instanceCount, baseSize, scaleMin, scaleMax, animSpeed) {
    for (let i = 0; i < instanceCount; i++) {
      // Evenly distribute instances across the scale range (0 to 1)
      let scalePosition = i / (instanceCount - 1);

      // Add animation rotation offset (all instances rotate together)
      let animationOffset = (animationTime * animSpeed) % 1.0;
      scalePosition = (scalePosition + animationOffset) % 1.0;

      // Map to scale range (creates even spacing for 3D illusion)
      let scaleY = p.lerp(scaleMin, scaleMax, scalePosition);

      // ONLY DRAW INSTANCES IN THE FRONT (above visibility threshold)
      // This creates the rolling wheel effect - back half is hidden
      let normalizedScale = (scaleY - scaleMin) / (scaleMax - scaleMin);  // 0 to 1
      if (normalizedScale < VISIBILITY_THRESHOLD) {
        continue;  // Skip this instance - it's in the "back"
      }

      // Calculate opacity based on scale (larger = closer = more opaque)
      let alpha = p.map(scaleY, scaleMin, scaleMax, STROKE_ALPHA_MIN, STROKE_ALPHA_MAX);

      // Draw this instance
      drawLissajousInfinity(centerX * p.width, centerY * p.height, baseSize, scaleY, alpha);
    }
  }

  // ============================================
  // GRADIENT FUNCTIONS
  // ============================================

  function createGradient() {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientBuffer.pixelDensity(1);
    gradientShader = gradientBuffer.createShader(vertShader, fragShader);
  }

  function drawGradient() {
    gradientBuffer.shader(gradientShader);
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

    gradientBuffer.rectMode(p.CENTER);
    gradientBuffer.noStroke();
    gradientBuffer.rect(0, 0, p.width, p.height);

    p.image(gradientBuffer, 0, 0);
  }

  // ============================================
  // P5.JS LIFECYCLE
  // ============================================

  p.setup = () => {
    const container = document.getElementById('evolution-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('evolution-canvas');

    createGradient();
    observer.observe(container);
  };

  p.draw = () => {
    // Draw gradient background
    drawGradient();

    // Increment animation time
    animationTime += 1;

    // Draw static outer curves FIRST (background)
    if (SHOW_STATIC_OUTER_CURVE) {
      drawStaticOuterCurve(LEFT_CENTER_X, LEFT_CENTER_Y, LEFT_BASE_SIZE);
      drawStaticOuterCurve(RIGHT_CENTER_X, RIGHT_CENTER_Y, RIGHT_BASE_SIZE);
    }

    // Draw animated left group (foreground)
    drawLissajousGroup(
      LEFT_CENTER_X,
      LEFT_CENTER_Y,
      LEFT_INSTANCE_COUNT,
      LEFT_BASE_SIZE,
      LEFT_SCALE_Y_MIN,
      LEFT_SCALE_Y_MAX,
      LEFT_ANIMATION_SPEED
    );

    // Draw animated right group (foreground)
    drawLissajousGroup(
      RIGHT_CENTER_X,
      RIGHT_CENTER_Y,
      RIGHT_INSTANCE_COUNT,
      RIGHT_BASE_SIZE,
      RIGHT_SCALE_Y_MIN,
      RIGHT_SCALE_Y_MAX,
      RIGHT_ANIMATION_SPEED
    );
  };

  p.windowResized = () => {
    const container = document.getElementById('evolution-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient();
  };
};

// ============================================
// 7. IMPACT SKETCH - Radiating Rays
// ============================================
// Theme: Geometric rays radiating from offset center (burst effect)
// Colors: Amber (#D97706) + Violet (#8B5CF6)

const impactSketch = (p) => {
  // ============================================
  // CUSTOMIZATION VARIABLES
  // ============================================

  // Radial Gradient Configuration (Offset Center)
  const GRADIENT_CENTER_COLOR = { r: 217, g: 119, b: 6 };     // Amber
  const GRADIENT_EDGE_COLOR = { r: 139, g: 92, b: 246 };      // Violet
  const GRADIENT_CENTER_X = 0.65;                              // X position (0-1)
  const GRADIENT_CENTER_Y = 0.6;                               // Y position (0-1)
  const GRADIENT_RADIUS_SCALE_X = 0.55;                        // X radius scale
  const GRADIENT_RADIUS_SCALE_Y = 0.55;                        // Y radius scale
  const GRADIENT_POWER = 2.2;                                  // Falloff power
  const GRADIENT_EDGE_EASE = 0.3;                              // Edge ease amount (0-1)
  const GRADIENT_SCATTER_INTENSITY = 0.1;                    // Scatter effect intensity

  // Ray Configuration
  const RAY_COUNT = 16;                                        // Number of radiating rays
  const RAY_MIN_LENGTH = 80;                                   // Minimum ray length
  const RAY_MAX_LENGTH = 280;                                  // Maximum ray length
  const RAY_PULSE_SPEED = 0.015;                               // Ray pulse animation speed
  const RAY_WIDTH_BASE = 3;                                    // Base width of rays
  const RAY_WIDTH_VARIATION = 2;                               // Ray width variation
  const RAY_SEGMENT_COUNT = 8;                                 // Segments per ray for tapering

  // Stroke Configuration
  const STROKE_WEIGHT = 2;                                     // Ray stroke thickness
  const STROKE_COLOR = { r: 200, g: 200, b: 200 };            // Base stroke color (grey)
  const STROKE_ALPHA_MIN = 60;                                 // Minimum stroke opacity
  const STROKE_ALPHA_MAX = 200;                                // Maximum stroke opacity
  const FADE_BACKGROUND_ALPHA = 90;                            // Background fade effect opacity

  // Animation
  let animationTime = 0;
  let gradientBuffer;
  let rays = [];

  // ============================================
  // SHADER CODE
  // ============================================

  const vertShader = `
    precision highp float;
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

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

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
      vec2 pos = vTexCoord;
      vec2 center = uCenter;
      vec2 delta = pos - center;
      delta.x /= uRadiusScale.x;
      delta.y /= uRadiusScale.y;
      float dist = length(delta);

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        dist += (noiseValue - 0.5) * uScatterIntensity;
      }

      float normalizedDist = pow(clamp(dist, 0.0, 1.0), uPower);

      if (uEdgeEase > 0.0 && normalizedDist > (1.0 - uEdgeEase)) {
        float edgeRegion = (normalizedDist - (1.0 - uEdgeEase)) / uEdgeEase;
        normalizedDist = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      vec3 color = mix(uCenterColor, uEdgeColor, normalizedDist);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ============================================
  // RAY CLASS
  // ============================================

  class Ray {
    constructor(index) {
      this.index = index;
      this.angle = (index / RAY_COUNT) * p.TWO_PI;
      this.baseLength = p.random(RAY_MIN_LENGTH, RAY_MAX_LENGTH);
      this.width = RAY_WIDTH_BASE + p.random(-RAY_WIDTH_VARIATION, RAY_WIDTH_VARIATION);
      this.phaseOffset = p.random(p.TWO_PI);
    }

    display(centerX, centerY) {
      // Pulse effect - ray length varies with sine wave
      let pulse = p.sin(animationTime * RAY_PULSE_SPEED + this.phaseOffset);
      let currentLength = this.baseLength * (0.7 + pulse * 0.3);

      // Calculate alpha based on pulse (brighter when extended)
      let alpha = p.map(pulse, -1, 1, STROKE_ALPHA_MIN, STROKE_ALPHA_MAX);

      // Calculate end point
      let endX = centerX + p.cos(this.angle) * currentLength;
      let endY = centerY + p.sin(this.angle) * currentLength;

      // Draw ray as tapered line (thicker at center, thinner at edges)
      p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, alpha);
      p.noFill();

      for (let i = 0; i < RAY_SEGMENT_COUNT; i++) {
        let t1 = i / RAY_SEGMENT_COUNT;
        let t2 = (i + 1) / RAY_SEGMENT_COUNT;

        let x1 = p.lerp(centerX, endX, t1);
        let y1 = p.lerp(centerY, endY, t1);
        let x2 = p.lerp(centerX, endX, t2);
        let y2 = p.lerp(centerY, endY, t2);

        // Taper width (wider at center, thinner at edges)
        let width = this.width * (1 - t1 * 0.7);
        p.strokeWeight(width);

        p.line(x1, y1, x2, y2);
      }
    }
  }

  // ============================================
  // GRADIENT FUNCTIONS
  // ============================================

  function createGradient() {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientBuffer.pixelDensity(1);

    const shader = gradientBuffer.createShader(vertShader, fragShader);
    gradientBuffer.shader(shader);

    shader.setUniform('uResolution', [p.width, p.height]);
    shader.setUniform('uCenter', [GRADIENT_CENTER_X, GRADIENT_CENTER_Y]);
    shader.setUniform('uCenterColor', [
      GRADIENT_CENTER_COLOR.r / 255.0,
      GRADIENT_CENTER_COLOR.g / 255.0,
      GRADIENT_CENTER_COLOR.b / 255.0
    ]);
    shader.setUniform('uEdgeColor', [
      GRADIENT_EDGE_COLOR.r / 255.0,
      GRADIENT_EDGE_COLOR.g / 255.0,
      GRADIENT_EDGE_COLOR.b / 255.0
    ]);
    shader.setUniform('uRadiusScale', [GRADIENT_RADIUS_SCALE_X, GRADIENT_RADIUS_SCALE_Y]);
    shader.setUniform('uPower', GRADIENT_POWER);
    shader.setUniform('uEdgeEase', GRADIENT_EDGE_EASE);
    shader.setUniform('uScatterIntensity', GRADIENT_SCATTER_INTENSITY);

    gradientBuffer.rectMode(p.CENTER);
    gradientBuffer.noStroke();
    gradientBuffer.rect(0, 0, p.width, p.height);
  }

  function drawGradient() {
    p.image(gradientBuffer, 0, 0);
  }

  // ============================================
  // P5.JS LIFECYCLE
  // ============================================

  const { observer } = createVisibilityObserver(p);

  p.setup = () => {
    const container = document.getElementById('impact-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('impact-canvas');

    createGradient();

    // Initialize rays
    for (let i = 0; i < RAY_COUNT; i++) {
      rays.push(new Ray(i));
    }

    observer.observe(container);
  };

  p.draw = () => {
    // Draw gradient background
    drawGradient();

    // Apply fade effect
    p.fill(GRADIENT_CENTER_COLOR.r, GRADIENT_CENTER_COLOR.g, GRADIENT_CENTER_COLOR.b, FADE_BACKGROUND_ALPHA);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);

    animationTime += 1;

    // Calculate center point (from gradient center position)
    let centerX = p.width * GRADIENT_CENTER_X;
    let centerY = p.height * GRADIENT_CENTER_Y;

    // Draw rays
    rays.forEach(ray => {
      ray.display(centerX, centerY);
    });
  };

  p.windowResized = () => {
    const container = document.getElementById('impact-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient();
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
