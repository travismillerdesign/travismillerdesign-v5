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
// 2. APPROACH SKETCH - Modular Grid Rotation
// ============================================
// Theme: Rotating geometric grid with wave animation
// Template: Matches hero sketch structure with linear gradient

const approachSketch = (p) => {
  let animationTime = 0;
  let gradientBuffer;
  let gradientShader;

  // Animation configuration
  const GRID_COLS = 8;
  const GRID_ROWS = 6;
  const ROTATION_SPEED = 0.02; // Speed of rotation animation
  const WAVE_SPEED = 0.05; // Speed of wave propagation
  const WAVE_AMPLITUDE = 0.3; // Amplitude of rotation wave

  // Linear Gradient configuration (RGB values 0-255)
  const GRADIENT_START_COLOR = { r: 107, g: 70, b: 193 }; // Deep Purple
  const GRADIENT_END_COLOR = { r: 6, g: 182, b: 212 }; // Bright Cyan
  const GRADIENT_ANGLE = 45; // Gradient angle in degrees (0 = left to right, 90 = top to bottom)
  const GRADIENT_POWER = 1.2; // Controls falloff curve
  const GRADIENT_EDGE_EASE = 0.2; // Edge easing
  const GRADIENT_SCATTER_INTENSITY = 0.03; // Scattering effect intensity

  // Stroke style configuration
  const STROKE_COLOR = { r: 20, g: 20, b: 40 }; // Dark stroke color
  const STROKE_WEIGHT = 2;
  const STROKE_ALPHA = 180;

  const { observer } = createVisibilityObserver(p);

  // Vertex shader
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

  // Fragment shader (linear gradient with scattering)
  const fragShader = `
    precision highp float;
    varying vec2 vTexCoord;

    uniform vec2 uResolution;
    uniform vec3 uStartColor;
    uniform vec3 uEndColor;
    uniform float uAngle;
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
      float angleRad = radians(uAngle);
      vec2 direction = vec2(cos(angleRad), sin(angleRad));
      float gradientPos = dot(pos, direction) * 0.5 + 0.5;

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        gradientPos += (noiseValue - 0.5) * uScatterIntensity;
      }

      gradientPos = pow(clamp(gradientPos, 0.0, 1.0), uPower);

      if (uEdgeEase > 0.0 && gradientPos > (1.0 - uEdgeEase)) {
        float edgeRegion = (gradientPos - (1.0 - uEdgeEase)) / uEdgeEase;
        gradientPos = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      vec3 color = mix(uStartColor, uEndColor, gradientPos);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Create gradient buffer and render gradient
  const createGradient = () => {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientShader = gradientBuffer.createShader(vertShader, fragShader);
    gradientBuffer.shader(gradientShader);

    gradientShader.setUniform('uResolution', [p.width, p.height]);
    gradientShader.setUniform('uStartColor', [
      GRADIENT_START_COLOR.r / 255.0,
      GRADIENT_START_COLOR.g / 255.0,
      GRADIENT_START_COLOR.b / 255.0
    ]);
    gradientShader.setUniform('uEndColor', [
      GRADIENT_END_COLOR.r / 255.0,
      GRADIENT_END_COLOR.g / 255.0,
      GRADIENT_END_COLOR.b / 255.0
    ]);
    gradientShader.setUniform('uAngle', GRADIENT_ANGLE);
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

  p.setup = () => {
    const container = document.getElementById('approach-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('approach-canvas');

    createGradient();
    observer.observe(container);
  };

  p.draw = () => {
    drawGradient();

    animationTime += ROTATION_SPEED;

    let cellWidth = p.width / GRID_COLS;
    let cellHeight = p.height / GRID_ROWS;

    p.push();
    p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, STROKE_ALPHA);
    p.strokeWeight(STROKE_WEIGHT);
    p.noFill();

    // Draw rotating grid of squares
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        let x = col * cellWidth + cellWidth / 2;
        let y = row * cellHeight + cellHeight / 2;

        // Wave-based rotation
        let wave = p.sin(animationTime + (col + row) * WAVE_SPEED) * WAVE_AMPLITUDE;
        let rotation = animationTime * (1 + wave);

        p.push();
        p.translate(x, y);
        p.rotate(rotation);

        let size = Math.min(cellWidth, cellHeight) * 0.6;
        p.rect(-size / 2, -size / 2, size, size);

        p.pop();
      }
    }

    p.pop();
  };

  p.windowResized = () => {
    const container = document.getElementById('approach-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient();
  };
};

// ============================================
// 3. FOUNDATION SKETCH - Breathing Network
// ============================================
// Theme: Interconnected node network with breathing animation
// Template: Matches hero sketch structure with dual-radial gradient

const foundationPrinciplesSketch = (p) => {
  let animationTime = 0;
  let gradientBuffer;
  let gradientShader;
  let nodes = [];

  // Animation configuration
  const NODE_COUNT = 25;
  const BREATHING_SPEED = 0.01; // Speed of breathing animation
  const BREATHING_AMPLITUDE = 15; // Amplitude of breathing motion
  const CONNECTION_DISTANCE = 150; // Max distance for connections

  // Dual-Radial Gradient configuration (RGB values 0-255)
  const GRADIENT_CENTER1_COLOR = { r: 16, g: 185, b: 129 }; // Forest Green
  const GRADIENT_CENTER2_COLOR = { r: 245, g: 158, b: 11 }; // Golden Yellow
  const GRADIENT_EDGE_COLOR = { r: 240, g: 240, b: 235 }; // Light background
  const GRADIENT_CENTER1_X = 0.3; // First focal point X
  const GRADIENT_CENTER1_Y = 0.3; // First focal point Y
  const GRADIENT_CENTER2_X = 0.7; // Second focal point X
  const GRADIENT_CENTER2_Y = 0.7; // Second focal point Y
  const GRADIENT_RADIUS_SCALE = 0.5;
  const GRADIENT_POWER = 1.5;
  const GRADIENT_EDGE_EASE = 0.3;
  const GRADIENT_SCATTER_INTENSITY = 0.04;

  // Stroke style configuration
  const STROKE_COLOR = { r: 40, g: 60, b: 50 };
  const STROKE_WEIGHT = 1.5;
  const STROKE_ALPHA = 150;
  const NODE_SIZE = 6;

  const { observer} = createVisibilityObserver(p);

  // Dual-radial gradient shader (simplified - combines two radial gradients)
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
    uniform vec3 uCenter1Color;
    uniform vec3 uCenter2Color;
    uniform vec3 uEdgeColor;
    uniform vec2 uCenter1;
    uniform vec2 uCenter2;
    uniform float uRadiusScale;
    uniform float uPower;
    uniform float uEdgeEase;
    uniform float uScatterIntensity;
    uniform vec2 uResolution;

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fractalNoise(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 pos = vTexCoord;
      float dist1 = length((pos - uCenter1) / uRadiusScale);
      float dist2 = length((pos - uCenter2) / uRadiusScale);

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(pos * uResolution);
        dist1 += (noiseValue - 0.5) * uScatterIntensity;
        dist2 += (noiseValue - 0.5) * uScatterIntensity;
      }

      dist1 = pow(clamp(dist1, 0.0, 1.0), uPower);
      dist2 = pow(clamp(dist2, 0.0, 1.0), uPower);

      vec3 color1 = mix(uCenter1Color, uEdgeColor, dist1);
      vec3 color2 = mix(uCenter2Color, uEdgeColor, dist2);
      vec3 color = mix(color1, color2, 0.5);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const createGradient = () => {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientShader = gradientBuffer.createShader(vertShader, fragShader);
    gradientBuffer.shader(gradientShader);

    gradientShader.setUniform('uResolution', [p.width, p.height]);
    gradientShader.setUniform('uCenter1', [GRADIENT_CENTER1_X, GRADIENT_CENTER1_Y]);
    gradientShader.setUniform('uCenter2', [GRADIENT_CENTER2_X, GRADIENT_CENTER2_Y]);
    gradientShader.setUniform('uCenter1Color', [GRADIENT_CENTER1_COLOR.r / 255, GRADIENT_CENTER1_COLOR.g / 255, GRADIENT_CENTER1_COLOR.b / 255]);
    gradientShader.setUniform('uCenter2Color', [GRADIENT_CENTER2_COLOR.r / 255, GRADIENT_CENTER2_COLOR.g / 255, GRADIENT_CENTER2_COLOR.b / 255]);
    gradientShader.setUniform('uEdgeColor', [GRADIENT_EDGE_COLOR.r / 255, GRADIENT_EDGE_COLOR.g / 255, GRADIENT_EDGE_COLOR.b / 255]);
    gradientShader.setUniform('uRadiusScale', GRADIENT_RADIUS_SCALE);
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

  p.setup = () => {
    const container = document.getElementById('foundation-principles-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('foundation-principles-canvas');

    createGradient();

    // Create random nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        baseX: p.random(p.width),
        baseY: p.random(p.height),
        x: 0,
        y: 0,
        offset: p.random(p.TWO_PI)
      });
    }

    observer.observe(container);
  };

  p.draw = () => {
    drawGradient();

    animationTime += BREATHING_SPEED;

    // Update node positions with breathing
    nodes.forEach(node => {
      let breathe = p.sin(animationTime + node.offset) * BREATHING_AMPLITUDE;
      node.x = node.baseX + breathe;
      node.y = node.baseY + breathe;
    });

    p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, STROKE_ALPHA * 0.5);
    p.strokeWeight(STROKE_WEIGHT);

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let d = p.dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        if (d < CONNECTION_DISTANCE) {
          let alpha = p.map(d, 0, CONNECTION_DISTANCE, STROKE_ALPHA, 0);
          p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, alpha * 0.5);
          p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        }
      }
    }

    // Draw nodes
    p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, STROKE_ALPHA);
    p.strokeWeight(STROKE_WEIGHT);
    p.noFill();
    nodes.forEach(node => {
      p.circle(node.x, node.y, NODE_SIZE);
    });
  };

  p.windowResized = () => {
    const container = document.getElementById('foundation-principles-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient();
  };
};

// ============================================
// 4. IMPLEMENTATION SKETCH - Geometric Assembly
// ============================================
// Theme: Geometric shapes assembling/disassembling in sequence
// Template: Matches hero sketch structure with conic/angular gradient

const implementationSketch = (p) => {
  let animationTime = 0;
  let gradientBuffer;
  let gradientShader;
  let shapes = [];

  // Animation configuration
  const SHAPE_COUNT = 12;
  const ASSEMBLY_SPEED = 0.015; // Speed of assembly animation
  const ROTATION_SPEED = 0.01; // Shape rotation speed
  const RADIUS = 180; // Distance from center

  // Conic/Angular Gradient configuration (RGB values 0-255)
  const GRADIENT_START_COLOR = { r: 236, g: 72, b: 153 }; // Magenta
  const GRADIENT_END_COLOR = { r: 20, g: 184, b: 166 }; // Teal
  const GRADIENT_CENTER_X = 0.5;
  const GRADIENT_CENTER_Y = 0.5;
  const GRADIENT_ROTATION = 0; // Rotation offset in degrees
  const GRADIENT_POWER = 1.0;
  const GRADIENT_EDGE_EASE = 0.25;
  const GRADIENT_SCATTER_INTENSITY = 0.035;

  // Stroke style configuration
  const STROKE_COLOR = { r: 30, g: 20, b: 40 };
  const STROKE_WEIGHT = 2;
  const STROKE_ALPHA = 160;
  const SHAPE_SIZE = 35;

  const { observer } = createVisibilityObserver(p);

  // Conic/Angular gradient shader
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
    uniform vec3 uStartColor;
    uniform vec3 uEndColor;
    uniform vec2 uCenter;
    uniform float uRotation;
    uniform float uPower;
    uniform float uEdgeEase;
    uniform float uScatterIntensity;
    uniform vec2 uResolution;

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fractalNoise(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 pos = vTexCoord - uCenter;
      float angle = atan(pos.y, pos.x) + radians(uRotation);
      float normalizedAngle = (angle + 3.14159265) / (2.0 * 3.14159265);

      if (uScatterIntensity > 0.0) {
        float noiseValue = fractalNoise(vTexCoord * uResolution);
        normalizedAngle += (noiseValue - 0.5) * uScatterIntensity;
      }

      normalizedAngle = fract(normalizedAngle);
      normalizedAngle = pow(normalizedAngle, uPower);

      if (uEdgeEase > 0.0 && normalizedAngle > (1.0 - uEdgeEase)) {
        float edgeRegion = (normalizedAngle - (1.0 - uEdgeEase)) / uEdgeEase;
        normalizedAngle = 1.0 - uEdgeEase + uEdgeEase * smoothstep(0.0, 1.0, edgeRegion);
      }

      vec3 color = mix(uStartColor, uEndColor, normalizedAngle);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const createGradient = () => {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientShader = gradientBuffer.createShader(vertShader, fragShader);
    gradientBuffer.shader(gradientShader);

    gradientShader.setUniform('uResolution', [p.width, p.height]);
    gradientShader.setUniform('uCenter', [GRADIENT_CENTER_X, GRADIENT_CENTER_Y]);
    gradientShader.setUniform('uStartColor', [GRADIENT_START_COLOR.r / 255, GRADIENT_START_COLOR.g / 255, GRADIENT_START_COLOR.b / 255]);
    gradientShader.setUniform('uEndColor', [GRADIENT_END_COLOR.r / 255, GRADIENT_END_COLOR.g / 255, GRADIENT_END_COLOR.b / 255]);
    gradientShader.setUniform('uRotation', GRADIENT_ROTATION);
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

  p.setup = () => {
    const container = document.getElementById('implementation-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('implementation-canvas');

    createGradient();

    // Create shapes in circular arrangement
    for (let i = 0; i < SHAPE_COUNT; i++) {
      shapes.push({
        angle: (i / SHAPE_COUNT) * p.TWO_PI,
        index: i,
        offset: i * 0.1
      });
    }

    observer.observe(container);
  };

  p.draw = () => {
    drawGradient();

    animationTime += ASSEMBLY_SPEED;

    p.push();
    p.translate(p.width / 2, p.height / 2);
    p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, STROKE_ALPHA);
    p.strokeWeight(STROKE_WEIGHT);
    p.noFill();

    // Draw assembling/disassembling shapes
    shapes.forEach(shape => {
      let assemblyProgress = (p.sin(animationTime + shape.offset) + 1) / 2;
      let currentRadius = RADIUS * assemblyProgress;
      let rotation = animationTime * ROTATION_SPEED + shape.angle;

      let x = p.cos(shape.angle) * currentRadius;
      let y = p.sin(shape.angle) * currentRadius;

      p.push();
      p.translate(x, y);
      p.rotate(rotation);

      // Alternate between different shapes
      if (shape.index % 3 === 0) {
        p.rect(-SHAPE_SIZE / 2, -SHAPE_SIZE / 2, SHAPE_SIZE, SHAPE_SIZE);
      } else if (shape.index % 3 === 1) {
        p.circle(0, 0, SHAPE_SIZE);
      } else {
        p.triangle(-SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE / 2, 0, -SHAPE_SIZE / 2);
      }

      p.pop();
    });

    p.pop();
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
  const GRADIENT_SCATTER_INTENSITY = 0.04;                      // Scatter effect intensity

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

    uniform vec3 uCenterColor;
    uniform vec3 uEdgeColor;
    uniform vec2 uCenter;
    uniform vec2 uRadiusScale;
    uniform vec2 uResolution;
    uniform float uPower;
    uniform float uEdgeEase;
    uniform float uScatterIntensity;

    // Hash function for noise
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    // Quintic interpolation
    float quintic(float t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    // 2D noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = vec2(quintic(f.x), quintic(f.y));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // Fractal noise (multi-octave)
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

      // Add scatter effect
      if (uScatterIntensity > 0.0) {
        vec2 scatter = vec2(
          fractalNoise(pos * uResolution),
          fractalNoise(pos * uResolution + vec2(100.0, 100.0))
        );
        pos += (scatter - 0.5) * uScatterIntensity;
      }

      // Calculate distance from center (elliptical)
      float dist = length((pos - uCenter) / uRadiusScale);

      // Apply power curve
      dist = pow(dist, uPower);

      // Apply edge easing
      if (dist > 1.0 - uEdgeEase) {
        float edgeT = (dist - (1.0 - uEdgeEase)) / uEdgeEase;
        edgeT = smoothstep(0.0, 1.0, edgeT);
        dist = mix(dist, 1.0, edgeT);
      }

      // Mix colors
      vec3 color = mix(uCenterColor, uEdgeColor, dist);

      gl_FragColor = vec4(color / 255.0, 1.0);
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

    shader.setUniform('uCenterColor', [GRADIENT_CENTER_COLOR.r, GRADIENT_CENTER_COLOR.g, GRADIENT_CENTER_COLOR.b]);
    shader.setUniform('uEdgeColor', [GRADIENT_EDGE_COLOR.r, GRADIENT_EDGE_COLOR.g, GRADIENT_EDGE_COLOR.b]);
    shader.setUniform('uCenter', [GRADIENT_CENTER_X, GRADIENT_CENTER_Y]);
    shader.setUniform('uRadiusScale', [GRADIENT_RADIUS_SCALE_X, GRADIENT_RADIUS_SCALE_Y]);
    shader.setUniform('uResolution', [p.width, p.height]);
    shader.setUniform('uPower', GRADIENT_POWER);
    shader.setUniform('uEdgeEase', GRADIENT_EDGE_EASE);
    shader.setUniform('uScatterIntensity', GRADIENT_SCATTER_INTENSITY);

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
// 6. EVOLUTION SKETCH - Morphing Complexity
// ============================================
// Theme: Geometric shapes transitioning between simple and complex forms
// Colors: Ruby Red (#DC2626) + Sky Blue (#0EA5E9)

const evolutionSketch = (p) => {
  // ============================================
  // CUSTOMIZATION VARIABLES
  // ============================================

  // Morphing Gradient Configuration
  const GRADIENT_START_COLOR = { r: 220, g: 38, b: 38 };      // Ruby Red
  const GRADIENT_END_COLOR = { r: 14, g: 165, b: 233 };       // Sky Blue
  const GRADIENT_ANGLE_START = 135;                            // Starting angle (degrees)
  const GRADIENT_ANGLE_END = 45;                               // Ending angle (degrees)
  const GRADIENT_MORPH_SPEED = 0.003;                          // How fast gradient rotates
  const GRADIENT_SCATTER_INTENSITY = 0.03;                     // Scatter effect intensity

  // Shape Morphing Configuration
  const SIMPLE_SIDES = 3;                                      // Triangle (simple state)
  const COMPLEX_SIDES = 12;                                    // Dodecagon (complex state)
  const SHAPE_COUNT = 6;                                       // Number of shapes
  const SHAPE_SIZE = 80;                                       // Base shape size
  const MORPH_CYCLE_DURATION = 300;                            // Frames for full morph cycle
  const SHAPE_ROTATION_SPEED = 0.01;                           // Shape rotation speed
  const ORBIT_RADIUS = 140;                                    // Distance from center

  // Stroke Configuration
  const STROKE_WEIGHT = 2;                                     // Shape stroke thickness
  const STROKE_COLOR = { r: 200, g: 200, b: 200 };            // Base stroke color (grey)
  const STROKE_ALPHA = 160;                                    // Stroke opacity
  const FADE_BACKGROUND_ALPHA = 80;                            // Background fade effect opacity

  // Animation
  let animationTime = 0;
  let gradientBuffer;

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

    uniform vec3 uStartColor;
    uniform vec3 uEndColor;
    uniform float uAngle;
    uniform vec2 uResolution;
    uniform float uScatterIntensity;

    // Hash function for noise
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    // Quintic interpolation
    float quintic(float t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    // 2D noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = vec2(quintic(f.x), quintic(f.y));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // Fractal noise (multi-octave)
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

      // Add scatter effect
      if (uScatterIntensity > 0.0) {
        vec2 scatter = vec2(
          fractalNoise(pos * uResolution),
          fractalNoise(pos * uResolution + vec2(100.0, 100.0))
        );
        pos += (scatter - 0.5) * uScatterIntensity;
      }

      // Calculate linear gradient based on angle
      vec2 center = vec2(0.5, 0.5);
      vec2 fromCenter = pos - center;

      float angleRad = radians(uAngle);
      vec2 gradientDir = vec2(cos(angleRad), sin(angleRad));

      float gradientPos = dot(fromCenter, gradientDir) + 0.5;
      gradientPos = clamp(gradientPos, 0.0, 1.0);

      // Mix colors
      vec3 color = mix(uStartColor, uEndColor, gradientPos);

      gl_FragColor = vec4(color / 255.0, 1.0);
    }
  `;

  // ============================================
  // SHAPE CLASS
  // ============================================

  class MorphingShape {
    constructor(index) {
      this.index = index;
      this.angleOffset = (index / SHAPE_COUNT) * p.TWO_PI;
      this.rotation = 0;
      this.phaseOffset = index * 0.5;
    }

    update() {
      this.rotation += SHAPE_ROTATION_SPEED;
    }

    display(centerX, centerY, morphProgress) {
      // Position on orbit
      let orbitAngle = this.angleOffset + animationTime * 0.005;
      let x = centerX + p.cos(orbitAngle) * ORBIT_RADIUS;
      let y = centerY + p.sin(orbitAngle) * ORBIT_RADIUS;

      // Calculate number of sides based on morph progress
      let sides = Math.round(p.lerp(SIMPLE_SIDES, COMPLEX_SIDES, morphProgress));
      sides = Math.max(SIMPLE_SIDES, sides);

      // Draw polygon
      p.push();
      p.translate(x, y);
      p.rotate(this.rotation);

      p.stroke(STROKE_COLOR.r, STROKE_COLOR.g, STROKE_COLOR.b, STROKE_ALPHA);
      p.strokeWeight(STROKE_WEIGHT);
      p.noFill();

      p.beginShape();
      for (let i = 0; i <= sides; i++) {
        let angle = p.map(i, 0, sides, 0, p.TWO_PI);
        let vx = p.cos(angle) * SHAPE_SIZE;
        let vy = p.sin(angle) * SHAPE_SIZE;
        p.vertex(vx, vy);
      }
      p.endShape();

      p.pop();
    }
  }

  // ============================================
  // GRADIENT FUNCTIONS
  // ============================================

  function createGradient(angle) {
    gradientBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    gradientBuffer.pixelDensity(1);

    const shader = gradientBuffer.createShader(vertShader, fragShader);
    gradientBuffer.shader(shader);

    shader.setUniform('uStartColor', [GRADIENT_START_COLOR.r, GRADIENT_START_COLOR.g, GRADIENT_START_COLOR.b]);
    shader.setUniform('uEndColor', [GRADIENT_END_COLOR.r, GRADIENT_END_COLOR.g, GRADIENT_END_COLOR.b]);
    shader.setUniform('uAngle', angle);
    shader.setUniform('uResolution', [p.width, p.height]);
    shader.setUniform('uScatterIntensity', GRADIENT_SCATTER_INTENSITY);

    gradientBuffer.rect(0, 0, p.width, p.height);
  }

  function drawGradient() {
    p.image(gradientBuffer, 0, 0);
  }

  // ============================================
  // P5.JS LIFECYCLE
  // ============================================

  const { observer } = createVisibilityObserver(p);

  let shapes = [];

  p.setup = () => {
    const container = document.getElementById('evolution-canvas');
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('evolution-canvas');

    createGradient(GRADIENT_ANGLE_START);

    // Initialize shapes
    for (let i = 0; i < SHAPE_COUNT; i++) {
      shapes.push(new MorphingShape(i));
    }

    observer.observe(container);
  };

  p.draw = () => {
    // Calculate morph progress (oscillates between 0 and 1)
    let morphProgress = (p.sin(animationTime / MORPH_CYCLE_DURATION * p.TWO_PI) + 1) / 2;

    // Calculate gradient angle based on morph
    let currentAngle = p.lerp(GRADIENT_ANGLE_START, GRADIENT_ANGLE_END, morphProgress);
    createGradient(currentAngle);

    // Draw gradient background
    drawGradient();

    // Apply fade effect
    let fadeR = p.lerp(GRADIENT_START_COLOR.r, GRADIENT_END_COLOR.r, morphProgress);
    let fadeG = p.lerp(GRADIENT_START_COLOR.g, GRADIENT_END_COLOR.g, morphProgress);
    let fadeB = p.lerp(GRADIENT_START_COLOR.b, GRADIENT_END_COLOR.b, morphProgress);
    p.fill(fadeR, fadeG, fadeB, FADE_BACKGROUND_ALPHA);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);

    animationTime += 1;

    // Calculate center point
    let centerX = p.width / 2;
    let centerY = p.height / 2;

    // Update and draw shapes
    shapes.forEach(shape => {
      shape.update();
      shape.display(centerX, centerY, morphProgress);
    });
  };

  p.windowResized = () => {
    const container = document.getElementById('evolution-canvas');
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    createGradient(GRADIENT_ANGLE_START);
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
  const GRADIENT_SCATTER_INTENSITY = 0.035;                    // Scatter effect intensity

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

    uniform vec3 uCenterColor;
    uniform vec3 uEdgeColor;
    uniform vec2 uCenter;
    uniform vec2 uRadiusScale;
    uniform vec2 uResolution;
    uniform float uPower;
    uniform float uEdgeEase;
    uniform float uScatterIntensity;

    // Hash function for noise
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    // Quintic interpolation
    float quintic(float t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    // 2D noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = vec2(quintic(f.x), quintic(f.y));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // Fractal noise (multi-octave)
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

      // Add scatter effect
      if (uScatterIntensity > 0.0) {
        vec2 scatter = vec2(
          fractalNoise(pos * uResolution),
          fractalNoise(pos * uResolution + vec2(100.0, 100.0))
        );
        pos += (scatter - 0.5) * uScatterIntensity;
      }

      // Calculate distance from center (elliptical)
      float dist = length((pos - uCenter) / uRadiusScale);

      // Apply power curve
      dist = pow(dist, uPower);

      // Apply edge easing
      if (dist > 1.0 - uEdgeEase) {
        float edgeT = (dist - (1.0 - uEdgeEase)) / uEdgeEase;
        edgeT = smoothstep(0.0, 1.0, edgeT);
        dist = mix(dist, 1.0, edgeT);
      }

      // Mix colors
      vec3 color = mix(uCenterColor, uEdgeColor, dist);

      gl_FragColor = vec4(color / 255.0, 1.0);
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

    shader.setUniform('uCenterColor', [GRADIENT_CENTER_COLOR.r, GRADIENT_CENTER_COLOR.g, GRADIENT_CENTER_COLOR.b]);
    shader.setUniform('uEdgeColor', [GRADIENT_EDGE_COLOR.r, GRADIENT_EDGE_COLOR.g, GRADIENT_EDGE_COLOR.b]);
    shader.setUniform('uCenter', [GRADIENT_CENTER_X, GRADIENT_CENTER_Y]);
    shader.setUniform('uRadiusScale', [GRADIENT_RADIUS_SCALE_X, GRADIENT_RADIUS_SCALE_Y]);
    shader.setUniform('uResolution', [p.width, p.height]);
    shader.setUniform('uPower', GRADIENT_POWER);
    shader.setUniform('uEdgeEase', GRADIENT_EDGE_EASE);
    shader.setUniform('uScatterIntensity', GRADIENT_SCATTER_INTENSITY);

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
