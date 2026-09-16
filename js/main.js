(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------------- text scramble ---------------- */
  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$*?!';
  function scramble(el, finalText, duration = 900) {
    if (!el) return;
    if (reduceMotion) { el.textContent = finalText; return; }
    const len = finalText.length;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const revealCount = Math.floor(progress * len);
      let out = '';
      for (let i = 0; i < len; i++) {
        if (finalText[i] === ' ') { out += ' '; continue; }
        out += i < revealCount ? finalText[i] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      el.textContent = out;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = finalText;
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- confetti ---------------- */
  class Confetti {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.raf = null;
      this.colors = ['#FFA026', '#F28A12', '#4682B4', '#90BED9', '#F3F6F8'];
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width * devicePixelRatio;
      this.canvas.height = rect.height * devicePixelRatio;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      this.w = rect.width; this.h = rect.height;
    }
    burst(x, y, count = 60) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 3 + Math.random() * 4,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          life: 1,
          decay: 0.008 + Math.random() * 0.01,
          shape: Math.random() > 0.5 ? 'rect' : 'circle'
        });
      }
      if (!this.raf) this.loop();
    }
    loop() {
      const ctx = this.ctx;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      let alive = false;
      for (const p of this.particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.vy += 0.12;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      this.particles = this.particles.filter(p => p.life > 0);
      if (alive) this.raf = requestAnimationFrame(() => this.loop());
      else this.raf = null;
    }
  }

  /* ---------------- preloader ---------------- */
  const preloader = document.getElementById('preloader');
  function hidePreloader() {
    if (!preloader) return;
    if (hasGSAP && !reduceMotion) {
      gsap.to(preloader, { opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => preloader.remove() });
    } else {
      preloader.remove();
    }
    playHeroIntro();
  }
  window.addEventListener('load', () => setTimeout(hidePreloader, 900));
  setTimeout(hidePreloader, 2400); // safety fallback

  /* ---------------- hero intro ---------------- */
  let heroPlayed = false;
  function playHeroIntro() {
    if (heroPlayed) return;
    heroPlayed = true;

    const line1 = document.querySelector('.hero-line1');
    const line2 = document.getElementById('hero-line2');
    const travar = document.getElementById('hero-travar');
    const glMain = travar ? travar.querySelector('.gl-main') : null;
    const thoughts = document.querySelectorAll('#hero-thoughts .thought');
    const footerEls = document.querySelectorAll('#hero-footer .hero-brand, #hero-footer .hero-tagline');
    const cue = document.querySelector('.scrollcue');

    if (!hasGSAP || reduceMotion) {
      [line1, line2, glMain, cue, ...thoughts, ...footerEls].forEach(el => { if (el) el.style.opacity = 1; });
      return;
    }

    const thoughtRotations = [-4, 3, -2, 4];
    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo(line1, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      .fromTo(line2, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power1.out' }, '+=0.3')
      .call(() => travar && travar.classList.add('glitching'), null, '+=0.35')
      .fromTo(glMain, { opacity: 0 }, { opacity: 1, duration: 0.08 }, '<')
      .fromTo(thoughts,
        { opacity: 0, y: 8, scale: 0.9, rotation: i => thoughtRotations[i] },
        { opacity: 0.6, y: i => (i % 2 === 0 ? 2 : -3), scale: 1, rotation: i => thoughtRotations[i], duration: 0.3, stagger: 0.09, ease: 'back.out(1.8)' },
        '+=0.2')
      .fromTo(footerEls, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power2.out' }, '+=0.4')
      .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.3');
  }

  /* ---------------- generic reveal-up (scroll) ---------------- */
  function initGenericReveals() {
    const groups = {
      benefits: document.querySelectorAll('#benefits .reveal-up'),
      play: document.querySelectorAll('#play .reveal-up'),
      cta: document.querySelectorAll('#cta .reveal-up')
    };
    Object.values(groups).forEach(list => {
      if (!list.length) return;
      if (hasGSAP) {
        gsap.fromTo(list, { opacity: 0, y: 18 }, {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: list[0], start: 'top 85%' }
        });
      } else {
        list.forEach(e => e.style.opacity = 1);
      }
    });
  }

  /* ---------------- fear pinned sequence ---------------- */
  function initFear() {
    const section = document.getElementById('fear');
    const lines = section.querySelectorAll('.fear-line');
    const vignette = document.getElementById('fear-vignette');
    if (!hasGSAP) { lines.forEach(l => l.style.opacity = 1); return; }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=' + (lines.length * 900),
        scrub: 0.6,
        pin: true,
        anticipatePin: 1
      }
    });

    lines.forEach((line, i) => {
      tl.fromTo(line, { opacity: 0, y: 24, skewX: reduceMotion ? 0 : -4 },
        { opacity: 1, y: 0, skewX: 0, duration: 0.4, ease: 'power2.out' })
        .to({}, { duration: 0.35 })
        .to(line, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }, i === lines.length - 1 ? '+=0.5' : '+=0');
      tl.to(vignette, { '--fear-int': Math.min(0.15 + i * 0.18, 0.75), duration: 0.3 }, '<');
      if (!reduceMotion) {
        tl.to(section, { x: () => gsap.utils.random(-6 - i, 6 + i), duration: 0.05, repeat: 5, yoyo: true }, '<');
      }
    });
  }

  /* ---------------- burst pinned transition ---------------- */
  function initBurst() {
    const section = document.getElementById('burst');
    const bg = document.getElementById('burst-bg');
    const pre = section.querySelector('.burst-pre');
    const spans = section.querySelectorAll('.burst-title span');
    const frame = document.getElementById('camera-frame');
    const dots = frame.querySelectorAll('.cf-dot');
    const sideLeft = document.getElementById('cf-left');
    const sideRight = document.getElementById('cf-right');
    const topArc = document.getElementById('cf-top');
    const bottomArc = document.getElementById('cf-bottom');
    const rec = document.getElementById('cf-rec');
    const timer = document.getElementById('cf-timer');
    const corners = document.getElementById('cf-corners');
    const reticle = document.getElementById('cf-reticle');
    const glowRect = document.getElementById('cf-rect-glow');
    const ring = document.getElementById('cf-ring');
    const drawPaths = [sideLeft, sideRight, topArc, bottomArc];

    if (!hasGSAP) {
      bg.style.clipPath = 'circle(150% at 50% 55%)';
      spans.forEach(s => s.style.opacity = 1);
      drawPaths.forEach(p => { p.style.strokeDasharray = 'none'; });
      [rec, timer, corners, reticle, glowRect, ring].forEach(el => el.style.opacity = 1);
      dots.forEach(d => d.style.opacity = 0);
      frame.style.transform = 'rotateY(-6deg) rotateX(2deg)';
      return;
    }

    drawPaths.forEach(p => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set(frame, { rotationY: -22, rotationX: 7, rotationZ: -2, transformPerspective: 900, transformOrigin: '50% 50%' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=3200',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1
      }
    });

    tl.to(pre, { opacity: 1, y: 0, duration: 0.3 })
      .to(dots, { opacity: 1, duration: 0.25, stagger: 0.05 }, '+=0.05')
      .to([sideLeft, sideRight], { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' }, '+=0.05')
      .to([topArc, bottomArc], { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' }, '-=0.1')
      .to(dots, { opacity: 0, duration: 0.2 }, '<')
      .to([rec, timer], { opacity: 1, duration: 0.3, stagger: 0.1 }, '+=0.05')
      .to(corners, { opacity: 1, duration: 0.3 }, '-=0.15')
      .to(reticle, { opacity: 1, duration: 0.35, ease: 'back.out(2)' }, '-=0.1')
      .to(glowRect, { opacity: 0.55, duration: 0.6 }, '-=0.2')
      .to(ring, { opacity: 0.35, rotationZ: 8, duration: 0.6 }, '<')
      .to(frame, {
        rotationY: -6, rotationX: 2, rotationZ: 0, duration: 0.7, ease: 'power2.out',
        onComplete: () => frame.classList.add('cf-settled'),
        onReverseComplete: () => frame.classList.remove('cf-settled')
      }, '-=0.3')
      .to({}, { duration: 0.15 })
      .to(bg, { clipPath: 'circle(150% at 50% 55%)', duration: 1, ease: 'power2.inOut' })
      .to(spans, { opacity: 1, y: 0, duration: 0.35, stagger: 0.12, ease: 'back.out(1.7)' }, '-=0.5');
  }

  /* ---------------- play section confetti ---------------- */
  function initPlay() {
    const section = document.getElementById('play');
    const canvas = document.getElementById('confetti-play');
    const confetti = new Confetti(canvas);
    let fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      const titleSpan = section.querySelector('.play-title');
      if (titleSpan) scramble(titleSpan, 'AO PLAY', 650);
      const rect = canvas.getBoundingClientRect();
      confetti.burst(rect.width / 2, rect.height * 0.35, 70);
    }
    if (hasGSAP) {
      ScrollTrigger.create({ trigger: section, start: 'top 60%', onEnter: fire });
    } else {
      fire();
    }
  }

  /* ---------------- creator photo: falling icons ---------------- */
  function initCreator() {
    const section = document.getElementById('creator');
    if (!section) return;
    const chips = section.querySelectorAll('.rain-chip');
    const copy = section.querySelectorAll('.creator-copy .reveal-up');
    const tilts = [-7, 5, -4, 6];
    let fired = false;

    function fire() {
      if (fired) return;
      fired = true;
      if (!hasGSAP || reduceMotion) {
        chips.forEach((c, i) => { c.style.opacity = 1; c.style.setProperty('--tilt', tilts[i] + 'deg'); c.style.transform = `rotate(${tilts[i]}deg)`; });
        copy.forEach(c => c.style.opacity = 1);
        return;
      }
      chips.forEach((chip, i) => {
        chip.style.setProperty('--tilt', tilts[i] + 'deg');
        gsap.fromTo(chip,
          { y: -(220 + i * 40), x: gsap.utils.random(-20, 20), rotation: gsap.utils.random(-90, 90), opacity: 0 },
          {
            y: 0, x: 0, rotation: tilts[i], opacity: 1,
            duration: 1.1, delay: i * 0.16, ease: 'bounce.out',
            onComplete: () => chip.classList.add('landed')
          });
      });
      gsap.fromTo(copy, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, delay: 0.5, ease: 'power3.out' });
    }

    if (hasGSAP) ScrollTrigger.create({ trigger: section, start: 'top 65%', onEnter: fire });
    else fire();
  }

  /* ---------------- benefit card tilt ---------------- */
  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      function handleMove(clientX, clientY) {
        const rect = card.getBoundingClientRect();
        const px = (clientX - rect.left) / rect.width;
        const py = (clientY - rect.top) / rect.height;
        const rx = (py - 0.5) * -10;
        const ry = (px - 0.5) * 10;
        card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.classList.add('glare');
      }
      function reset() {
        card.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
        card.classList.remove('glare');
      }
      card.addEventListener('touchmove', e => {
        const t = e.touches[0];
        if (t) handleMove(t.clientX, t.clientY);
      }, { passive: true });
      card.addEventListener('touchend', reset);
      card.addEventListener('pointermove', e => handleMove(e.clientX, e.clientY));
      card.addEventListener('pointerleave', reset);
    });
  }

  /* ---------------- stats count-up ---------------- */
  function initStats() {
    const nums = document.querySelectorAll('.stat-num');
    nums.forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      let done = false;
      function run() {
        if (done) return;
        done = true;
        if (reduceMotion) { el.textContent = target.toLocaleString('pt-BR') + suffix; return; }
        const start = performance.now();
        const duration = 1400;
        function tick(now) {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * eased).toLocaleString('pt-BR') + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
      if (hasGSAP) ScrollTrigger.create({ trigger: el, start: 'top 85%', onEnter: run });
      else run();
    });
  }

  /* ---------------- final CTA button ---------------- */
  function initCTA() {
    const btn = document.getElementById('play-btn');
    const canvas = document.getElementById('confetti-cta');
    if (!btn || !canvas) return;
    const confetti = new Confetti(canvas);
    btn.addEventListener('click', () => {
      const rect = canvas.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      confetti.burst(btnRect.left - rect.left + btnRect.width / 2, btnRect.top - rect.top + btnRect.height / 2, 90);
      if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
      if (hasGSAP) gsap.fromTo(btn, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });
  }

  /* ---------------- scroll progress rail ---------------- */
  function initProgress() {
    const fill = document.getElementById('progress-fill');
    if (!fill) return;
    function update() {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop / (doc.scrollHeight - doc.clientHeight || 1);
      fill.style.transform = `scaleY(${Math.min(1, Math.max(0, scrolled))})`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initGenericReveals();
    initFear();
    initBurst();
    initPlay();
    initCreator();
    initTilt();
    initStats();
    initCTA();
    initProgress();
    if (hasGSAP) ScrollTrigger.refresh();
  });
})();
