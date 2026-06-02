/* ════════════════════════════════════════
   PRINCE ❤️ SHAGUN — script.js
   ════════════════════════════════════════ */

'use strict';

/* ── viewport height fix (mobile address bar) ── */
function setVH() {
  document.documentElement.style.setProperty('--vh', window.innerHeight * .01 + 'px');
}
setVH();
window.addEventListener('resize', setVH);

/* ── REFS ── */
const container  = document.getElementById('reel-container');
const slides     = Array.from(document.querySelectorAll('.slide'));
const barFill    = document.getElementById('story-bar-fill');
const curSlideEl = document.getElementById('cur-slide');
const totSlideEl = document.getElementById('tot-slides');
const heartLayer = document.getElementById('heart-layer');
const swipeHint  = document.getElementById('swipe-hint');
const musicBtn   = document.getElementById('music-btn');
const musicLabel = document.getElementById('music-label');
const canvas     = document.getElementById('particles');
const ctx        = canvas.getContext('2d');

const TOTAL = slides.length;
totSlideEl.textContent = TOTAL;
let currentIndex = 0;

/* ════════════════════════════════════════
   IMAGE INJECTION (base64)
   ════════════════════════════════════════ */
document.querySelectorAll('.slide-img').forEach(img => {
  const idx = parseInt(img.dataset.photo);
  if (typeof PHOTOS !== 'undefined' && PHOTOS[idx]) {
    img.src = PHOTOS[idx];
    // also set blurred BG on parent slide
    const slide = img.closest('.slide-photo');
    if (slide) {
      slide.style.setProperty('--thumb', `url("${PHOTOS[idx]}")`);
      img.onload = () => slide.classList.add('img-loaded');
      if (img.complete) slide.classList.add('img-loaded');
    }
  }
});

/* ════════════════════════════════════════
   SCROLL HANDLER — snap tracking
   ════════════════════════════════════════ */
let ticking = false;

container.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateSlide);
    ticking = true;
  }
}, { passive: true });

function updateSlide() {
  ticking = false;
  const idx = Math.round(container.scrollTop / window.innerHeight);
  if (idx !== currentIndex) {
    setActive(idx);
  }
  // continuous progress (smooth)
  const progress = container.scrollTop / (window.innerHeight * (TOTAL - 1));
  barFill.style.width = Math.min(100, progress * 100) + '%';
}

function setActive(idx) {
  slides[currentIndex]?.classList.remove('active');
  currentIndex = Math.max(0, Math.min(TOTAL - 1, idx));
  slides[currentIndex]?.classList.add('active');
  curSlideEl.textContent = currentIndex + 1;

  // hide swipe hint after first scroll
  if (currentIndex > 0) swipeHint.classList.add('hidden');
}

/* init first slide */
slides[0].classList.add('active');

/* ════════════════════════════════════════
   DOUBLE-TAP / HEART EXPLOSION
   ════════════════════════════════════════ */
const HEARTS = ['❤️','💕','💗','💖','💓','🌹','✨','💝'];
let lastTap = 0;
let tapCount = 0;
let tapTimer = null;

document.addEventListener('touchend', handleTap, { passive: true });
document.addEventListener('click',    handleTap);

function handleTap(e) {
  const now = Date.now();
  const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

  if (now - lastTap < 350) {
    // double tap!
    tapCount++;
    clearTimeout(tapTimer);
    burstHearts(x, y, 7);
    tapCount = 0;
  }
  lastTap = now;
}

function burstHearts(x, y, count) {
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart-burst';
    heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    const angle  = (Math.random() * 130 - 65) + 270; // fan upward
    const dist   = 60 + Math.random() * 70;
    const rad    = angle * Math.PI / 180;
    const tx     = Math.cos(rad) * dist;
    const ty     = Math.sin(rad) * dist;
    const scale  = .7 + Math.random() * .8;
    const delay  = i * 60;

    heart.style.cssText = `
      left: ${x - 14}px;
      top:  ${y - 14}px;
      font-size: ${20 + Math.random() * 18}px;
      animation-delay: ${delay}ms;
      animation-duration: ${700 + Math.random() * 400}ms;
      --tx: ${tx}px; --ty: ${ty}px;
    `;
    // override keyframe with JS inline
    heart.style.animation = 'none';
    heartLayer.appendChild(heart);

    // manual animation via requestAnimationFrame
    const start = performance.now() + delay;
    const dur   = 700 + Math.random() * 400;
    function animHeart(now) {
      const elapsed = now - start;
      if (elapsed < 0) { requestAnimationFrame(animHeart); return; }
      const t = Math.min(1, elapsed / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      const sx = t < .4 ? t / .4 * scale : scale * (1 - (t - .4) / .6 * .4);
      const opacity = t < .1 ? t / .1 : (1 - t);
      heart.style.transform = `translate(${tx * ease}px, ${ty * ease}px) scale(${sx})`;
      heart.style.opacity   = opacity;
      if (t < 1) requestAnimationFrame(animHeart);
      else heart.remove();
    }
    requestAnimationFrame(animHeart);
  }
}

/* ════════════════════════════════════════
   AMBIENT PARTICLE CANVAS
   ════════════════════════════════════════ */
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

const NUM_PARTICLES = 40;
const particles = [];

class Particle {
  constructor() { this.reset(true); }
  reset(init) {
    this.x  = Math.random() * canvas.width;
    this.y  = init ? Math.random() * canvas.height : canvas.height + 10;
    this.vy = -(0.3 + Math.random() * 0.7);
    this.vx = (Math.random() - .5) * 0.4;
    this.r  = 1 + Math.random() * 2;
    this.alpha = 0;
    this.maxAlpha = 0.2 + Math.random() * 0.4;
    this.life   = 0;
    this.maxLife = 180 + Math.random() * 200;
    this.color  = Math.random() > .5 ? '#ff2d6b' : '#f4c87a';
  }
  update() {
    this.life++;
    this.x += this.vx;
    this.y += this.vy;
    const t = this.life / this.maxLife;
    this.alpha = t < .15 ? (t / .15) * this.maxAlpha
               : t > .8  ? ((1 - t) / .2) * this.maxAlpha
               : this.maxAlpha;
    if (this.life >= this.maxLife) this.reset(false);
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

for (let i = 0; i < NUM_PARTICLES; i++) particles.push(new Particle());

function animParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animParticles);
}
animParticles();

/* ════════════════════════════════════════
   WEB AUDIO — AMBIENT MUSIC
   Generates a soft, warm romantic drone
   No external file required
   ════════════════════════════════════════ */
let audioCtx  = null;
let musicOn   = false;
let masterGain, reverbNode;

function buildAudio() {
  if (audioCtx) return;
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  // Simple convolver reverb via noise IR
  reverbNode = audioCtx.createConvolver();
  const irLen = audioCtx.sampleRate * 3;
  const irBuf = audioCtx.createBuffer(2, irLen, audioCtx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = irBuf.getChannelData(c);
    for (let i = 0; i < irLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
    }
  }
  reverbNode.buffer = irBuf;
  const reverbGain  = audioCtx.createGain();
  reverbGain.gain.value = .45;
  reverbNode.connect(reverbGain);
  reverbGain.connect(masterGain);

  // romantic chord: A minor feel — A3, E4, A4, C5
  const freqs = [220, 329.63, 440, 523.25, 659.25];
  freqs.forEach((freq, i) => {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const lfo  = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();

    osc.type      = i < 2 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = [.18, .12, .10, .07, .05][i];

    lfo.frequency.value = .12 + i * .05;
    lfo.type = 'sine';
    lfoG.gain.value = freq * .003;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);

    osc.connect(gain);
    gain.connect(masterGain);
    gain.connect(reverbNode);
    lfo.start();
    osc.start();
  });
}

musicBtn.addEventListener('click', () => {
  buildAudio();
  musicOn = !musicOn;
  const now = audioCtx.currentTime;
  if (musicOn) {
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(.6, now + 2);
    musicBtn.classList.add('playing');
    musicLabel.textContent = 'On';
  } else {
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 1.5);
    musicBtn.classList.remove('playing');
    musicLabel.textContent = 'Music';
  }
});

/* ════════════════════════════════════════
   KEYBOARD NAVIGATION (desktop)
   ════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    scrollTo(currentIndex + 1);
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    scrollTo(currentIndex - 1);
  }
});

function scrollTo(idx) {
  idx = Math.max(0, Math.min(TOTAL - 1, idx));
  container.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' });
}

/* ════════════════════════════════════════
   FLOATING COVER PETALS
   ════════════════════════════════════════ */
const petalWrap = document.querySelector('.cover-petals');
const PETAL_CHARS = ['❤', '✿', '✦', '·', '❋'];
for (let i = 0; i < 18; i++) {
  const p = document.createElement('span');
  p.className = 'petal';
  p.textContent = PETAL_CHARS[Math.floor(Math.random() * PETAL_CHARS.length)];
  p.style.cssText = `
    left: ${Math.random() * 100}%;
    font-size: ${8 + Math.random() * 10}px;
    animation-duration: ${5 + Math.random() * 7}s;
    animation-delay: ${-Math.random() * 8}s;
    color: ${Math.random() > .5 ? 'rgba(255,45,107,.4)' : 'rgba(244,200,122,.3)'};
  `;
  petalWrap.appendChild(p);
}
