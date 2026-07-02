/* ════════════════════════════════════════════════════
   Xeeeva — script.js
════════════════════════════════════════════════════ */

/* ── Custom cursor ─────────────────────────────────── */
(function initCursor() {
  const dot  = document.getElementById('cDot');
  const ring = document.getElementById('cRing');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  }, { passive: true });

  (function loop() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  })();

  const hoverTargets = 'a, button, .service-card, .why-card, .testi-card, .pain-item, .reel-item, .process-step';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });
})();

/* ── Nav scroll state ──────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
})();

/* ── Typewriter ────────────────────────────────────── */
(function initTypewriter() {
  const el = document.getElementById('typeText');
  if (!el) return;

  const phrases = [
    'Seu site no ar em dias, não meses.',
    'Design que vende antes de falar.',
    'Código que você realmente possui.',
    'Sem agência. Direto com quem faz.',
    'Performance que o Google adora.',
  ];

  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(tick, 2200);
        return;
      }
      setTimeout(tick, 52);
    } else {
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, 380);
        return;
      }
      setTimeout(tick, 30);
    }
  }

  setTimeout(tick, 1400);
})();

/* ── Scroll reveal ─────────────────────────────────── */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      const delay = entry.target.dataset.delay
        ? parseFloat(entry.target.dataset.delay)
        : i * 0.06;
      entry.target.style.transitionDelay = delay + 's';
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ── Stagger siblings ──────────────────────────────── */
(function initStagger() {
  const groups = [
    '.services-grid',
    '.why-cards',
    '.testi-grid',
    '.process-steps',
    '.pain-list',
  ];

  groups.forEach(sel => {
    const parent = document.querySelector(sel);
    if (!parent) return;

    const children = [...parent.children];
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        children.forEach((child, i) => {
          setTimeout(() => {
            child.style.opacity   = '1';
            child.style.transform = 'translateY(0)';
          }, i * 90);
        });
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    children.forEach(child => {
      child.style.opacity   = '0';
      child.style.transform = 'translateY(24px)';
      child.style.transition = 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)';
    });

    obs.observe(parent);
  });
})();

/* ── Ripple on buttons ─────────────────────────────── */
(function initRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-primary, .btn-ghost, .btn-nav');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const x    = e.clientX - rect.left - size / 2;
    const y    = e.clientY - rect.top  - size / 2;

    const r = document.createElement('span');
    r.className = 'ripple';
    r.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  }, { passive: true });
})();

/* ── Parallax hero image ───────────────────────────── */
(function initParallax() {
  const img = document.querySelector('.hero-bg-img img');
  if (!img) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    img.style.transform = `scale(1.08) translateY(${y * 0.12}px)`;
  }, { passive: true });
})();

/* ── Infinite reel duplicate ───────────────────────── */
(function initReel() {
  const track = document.querySelector('.reel-track');
  if (!track) return;
  // Duplicate items for seamless loop
  const items = [...track.children];
  items.forEach(item => track.appendChild(item.cloneNode(true)));
})();

/* ── Hero orb subtle parallax (mouse) ─────────────── */
(function initMouseParallax() {
  let tx = 0, ty = 0, cx = 0, cy = 0;

  document.addEventListener('mousemove', e => {
    tx = (e.clientX / window.innerWidth  - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  (function loop() {
    cx += (tx - cx) * 0.04;
    cy += (ty - cy) * 0.04;
    const heroBg = document.querySelector('.hero-bg-img img');
    if (heroBg) {
      heroBg.style.transform = `scale(1.08) translate(${cx * 10}px, ${cy * 10}px)`;
    }
    requestAnimationFrame(loop);
  })();
})();

/* ── Counter animation (metrics) ──────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur    = 1600;
      const start  = performance.now();

      function update(now) {
        const p    = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        const val  = ease * target;
        el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach(el => obs.observe(el));
})();

/* ── Card tilt (service cards) ─────────────────────── */
(function initTilt() {
  document.querySelectorAll('.testi-card').forEach(card => {
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const dx   = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
      const dy   = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
      card.style.transform  = `translateY(-4px) rotateX(${dy * -3}deg) rotateY(${dx * 3}deg)`;
      card.style.transition = 'transform 0.1s ease, border-color 0.25s';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = '';
    });
  });
})();