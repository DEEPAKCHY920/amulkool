// Animation settings & constants
const FRAME_COUNT = 61;
const IMAGES_DIR = 'ezgif-646744ccca38da2e-jpg';
const images = [];
let loadedCount = 0;

// Scroll state variables
let scrollProgress = 0;
let currentFrame = 1;
let targetFrame = 1;
const lerpFactor = 0.08; // Adjust for scroll smoothness (lower is smoother/laggier, higher is snappier)

// Canvas elements and setup
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');

// Preloader elements
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Overlay Copy Cards & ranges
const cards = [
  { element: document.getElementById('card-1'), start: 0.12, end: 0.35 },
  { element: document.getElementById('card-2'), start: 0.42, end: 0.65 },
  { element: document.getElementById('card-3'), start: 0.72, end: 0.95 }
];

// Helper to pad frame numbers (e.g. 1 -> '001')
function pad(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

// 1. PRELOAD IMAGES
function preloadImages() {
  for (let i = 1; i <= FRAME_COUNT; i++) {
    const img = new Image();
    const filename = `ezgif-frame-${pad(i, 3)}.jpg`;
    img.src = `${IMAGES_DIR}/${filename}`;
    
    img.onload = () => {
      loadedCount++;
      const progressPercent = Math.round((loadedCount / FRAME_COUNT) * 100);
      progressBar.style.width = `${progressPercent}%`;
      progressText.textContent = `${progressPercent}% Loaded`;
      
      if (loadedCount === FRAME_COUNT) {
        setTimeout(onAllImagesLoaded, 600); // Small extra delay for styling feel
      }
    };
    
    img.onerror = () => {
      console.error(`Failed to load image: ${img.src}`);
      // Continue preloading even if one fails so we don't block user forever
      loadedCount++;
      if (loadedCount === FRAME_COUNT) {
        onAllImagesLoaded();
      }
    };
    
    images.push(img);
  }
}

// Triggered when preloader finishes
function onAllImagesLoaded() {
  preloader.classList.add('fade-out');
  
  // Initial draw
  resizeCanvas();
  drawFrame(1);
  
  // Start the animation render loop
  requestAnimationFrame(renderLoop);
}

// 2. CANVAS DRAWING (Cover styling)
function resizeCanvas() {
  // Set internal resolution based on device pixel ratio for sharp display
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  // Re-draw current frame immediately on resize
  if (images[Math.round(currentFrame) - 1]) {
    drawFrame(Math.round(currentFrame));
  }
}

function drawFrame(frameIndex) {
  const img = images[frameIndex - 1];
  if (!img) return;
  
  const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
  const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
  
  // Maintain aspect ratio cover (like CSS object-fit: cover)
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (canvasRatio > imgRatio) {
    // Canvas is wider than image relative ratio
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    // Canvas is taller than image relative ratio
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }
  
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// 3. SCROLL PROGRESS TRACKING
const scrollSection = document.getElementById('animation-trigger');

function updateScrollProgress() {
  if (!scrollSection) return;
  
  const rect = scrollSection.getBoundingClientRect();
  const sectionHeight = rect.height;
  const sectionTop = rect.top + window.scrollY;
  const viewportHeight = window.innerHeight;
  
  // Calculate how far through the scroll trigger zone we are
  const scrollY = window.scrollY;
  const startOffset = sectionTop;
  const scrollRange = sectionHeight - viewportHeight;
  
  if (scrollRange <= 0) return;
  
  // Progress goes from 0 at the start of pinning to 1 at the end
  let progress = (scrollY - startOffset) / scrollRange;
  progress = Math.max(0, Math.min(1, progress));
  
  scrollProgress = progress;
  
  // Map progress to target frame index (1 to FRAME_COUNT)
  targetFrame = 1 + progress * (FRAME_COUNT - 1);
}

// 4. ANIMATION RENDER LOOP (with lerp interpolation)
function renderLoop() {
  // Smoothly lerp towards target frame
  const frameDiff = targetFrame - currentFrame;
  
  if (Math.abs(frameDiff) > 0.005) {
    currentFrame += frameDiff * lerpFactor;
    
    // Safety clamp
    currentFrame = Math.max(1, Math.min(FRAME_COUNT, currentFrame));
    
    // Draw current lerped frame
    drawFrame(Math.round(currentFrame));
  }
  
  // Update visibility of the overlay text cards based on current lerped progress
  // Using currentFrame percentage instead of raw scrollProgress for synchronized text entry
  const progressPercentage = (currentFrame - 1) / (FRAME_COUNT - 1);
  
  cards.forEach(card => {
    if (progressPercentage >= card.start && progressPercentage <= card.end) {
      card.element.classList.add('active');
    } else {
      card.element.classList.remove('active');
    }
  });
  
  requestAnimationFrame(renderLoop);
}

// Event Listeners
window.addEventListener('scroll', updateScrollProgress);
window.addEventListener('resize', resizeCanvas);

// Kick off preloading on start
preloadImages();
