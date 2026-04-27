// ── Device Detection (must be first) ─────────────────────────────────────
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isLowEnd = isMobileDevice && (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 2);

// AIMA Background Videos
function initBackgroundVideos() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.location.protocol === 'file:') return;
  if (!window.fetch) return;

  const currentPageName = window.location.pathname.split('/').pop() || 'index.html';
  const pageVideoMap = {
    'index.html': {
      selector: '.hero',
      src: 'assets/videos/index-illustration-motion.webm',
      poster: 'assets/videos/index-illustration-motion-poster.png'
    },
    'about.html': {
      selector: '.page-hero',
      src: 'assets/videos/about-illustration-motion.webm',
      poster: 'assets/videos/about-illustration-motion-poster.png'
    },
    'assessment.html': {
      selector: '.assess-hero',
      src: 'assets/videos/assessment-illustration-motion.webm',
      poster: 'assets/videos/assessment-illustration-motion-poster.png'
    },
    'conference.html': {
      selector: '.conf-hero',
      src: 'assets/videos/conference-illustration-motion.webm',
      poster: 'assets/videos/conference-illustration-motion-poster.png'
    }
  };

  const fallbackTargets = [
    {
      selector: '.hero',
      src: 'assets/videos/maine-ai-hero.webm',
      poster: 'assets/videos/maine-ai-hero-poster.png'
    },
    {
      selector: '.page-hero, .assess-hero',
      src: 'assets/videos/maine-ai-pages.webm',
      poster: 'assets/videos/maine-ai-pages-poster.png'
    },
    {
      selector: '.conf-hero',
      src: 'assets/videos/maine-ai-conference.webm',
      poster: 'assets/videos/maine-ai-conference-poster.png'
    }
  ];

  const videoTargets = pageVideoMap[currentPageName]
    ? [pageVideoMap[currentPageName]]
    : fallbackTargets;

  function assetExists(src) {
    return fetch(src, { method: 'HEAD', cache: 'force-cache' })
      .then(function(res) { return res.ok; })
      .catch(function() { return false; });
  }

  videoTargets.forEach(function(config) {
    document.querySelectorAll(config.selector).forEach(function(target) {
      if (target.querySelector('.aima-bg-video')) return;

      assetExists(config.src).then(function(exists) {
        if (!exists || target.querySelector('.aima-bg-video')) return;

        const video = document.createElement('video');
        video.className = 'aima-bg-video';
        video.poster = config.poster;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('aria-hidden', 'true');
        video.setAttribute('tabindex', '-1');

        const source = document.createElement('source');
        source.src = config.src;
        source.type = 'video/webm';
        video.appendChild(source);

        const overlay = document.createElement('div');
        overlay.className = 'aima-bg-video-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        video.addEventListener('error', function() {
          video.remove();
          if (!target.querySelector('.aima-bg-video')) overlay.remove();
        }, { once: true });

        target.insertBefore(overlay, target.firstChild);
        target.insertBefore(video, overlay);

        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === 'function') {
          playAttempt.catch(function() {});
        }
      });
    });
  });
}
initBackgroundVideos();




// ── Scroll Progress Bar (desktop only) ────────────────────────────────────
if (!isMobileDevice) {
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  document.body.prepend(progressBar);
  let rafPending = false;
  window.addEventListener('scroll', () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
      progressBar.style.width = Math.min(pct, 100) + '%';
      rafPending = false;
    });
  }, { passive: true });
}

// ── Page Transition (desktop only) ────────────────────────────────────────
if (!isMobileDevice) {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') ||
        href.startsWith('tel') || href.startsWith('http') || a.target === '_blank') return;
    a.addEventListener('click', e => {
      e.preventDefault();
      overlay.classList.add('active');
      setTimeout(() => { window.location.href = href; }, 250);
    });
  });
  window.addEventListener('pageshow', () => { overlay.classList.remove('active'); });
}

// ── Nav Scroll + Active State ─────────────────────────────────────────────
const nav = document.getElementById('navbar');
let navRaf = false;
window.addEventListener('scroll', () => {
  if (navRaf) return; navRaf = true;
  requestAnimationFrame(() => {
    nav && nav.classList.toggle('scrolled', window.scrollY > 40);
    navRaf = false;
  });
}, { passive: true });

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-drop a').forEach(a => {
  if (a.getAttribute('href') === currentPage) a.classList.add('nav-active');
});

// ── Dark Mode Toggle ──────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('aimaine-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
function createThemeToggle() {
  const btn = document.createElement('button');
  btn.className = 'nav-theme-toggle';
  btn.setAttribute('aria-label', 'Toggle dark mode');
  btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('aimaine-theme', next);
    btn.innerHTML = next === 'dark' ? '☀️' : '🌙';
  });
  const navInner = document.querySelector('.nav-inner');
  if (navInner) navInner.appendChild(btn);
}
createThemeToggle();

// ── Hamburger / Mobile Menu ───────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.setAttribute('type', 'button');
  hamburger.setAttribute('aria-label', hamburger.getAttribute('aria-label') || 'Toggle menu');
  hamburger.setAttribute('aria-controls', mobileMenu.id || 'mobileMenu');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');

  function closeMobileMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  function setMobileMenu(open) {
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
  }

  hamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    const isOpen = mobileMenu.classList.toggle('open');
    setMobileMenu(isOpen);
  });
  mobileMenu.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      closeMobileMenu();
    });
  });
  document.addEventListener('click', function(e) {
    if (mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)) {
      closeMobileMenu();
    }
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
      hamburger.focus();
    }
  });
  window.addEventListener('resize', function() {
    if (window.innerWidth > 1100 && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
    }
  });
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────
(function buildBottomNav() {
  const bnav = document.createElement('nav');
  bnav.className = 'mobile-bottom-nav';
  bnav.innerHTML = `<ul>
    <li><a href="index.html" data-page="index.html">
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Home
    </a></li>
    <li><a href="services.html" data-page="services.html">
      <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Services
    </a></li>
    <li><a href="assessment.html" data-page="assessment.html">
      <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>Assess
    </a></li>
    <li><a href="blog.html" data-page="blog.html">
      <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>Resources
    </a></li>
    <li><a href="contact.html" data-page="contact.html">
      <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.61-.61a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>Contact
    </a></li>
  </ul>`;
  document.body.appendChild(bnav);
  bnav.querySelectorAll('a').forEach(function(a) {
    const page = a.dataset.page;
    const isActive = page === currentPage ||
      (page === 'blog.html' && currentPage.indexOf('blog-post') === 0) ||
      (page === 'services.html' && ['training.html', 'audit.html', 'support.html', 'services-payment-portal.html'].indexOf(currentPage) !== -1);
    if (isActive) a.classList.add('active');
  });
})();

// ── Scroll Animations ─────────────────────────────────────────────────────
const observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.05 });

function initAnimations() {
  document.querySelectorAll('.animate, .animate-left, .animate-right').forEach(function(el) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    } else {
      observer.observe(el);
    }
  });
}
initAnimations();
setTimeout(initAnimations, 500);

// ── FAQ Accordion ─────────────────────────────────────────────────────────
document.addEventListener('click', function(e) {
  const question = e.target.closest('.faq-question');
  if (!question) return;
  const item = question.closest('.faq-item');
  if (!item) return;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(i) {
    i.classList.remove('open');
    const openQuestion = i.querySelector('.faq-question');
    if (openQuestion) openQuestion.setAttribute('aria-expanded', 'false');
  });
  if (!wasOpen) item.classList.add('open');
  question.setAttribute('aria-expanded', String(!wasOpen));
});

document.querySelectorAll('.faq-question').forEach(function(question, index) {
  const item = question.closest('.faq-item');
  const answer = item && item.querySelector('.faq-answer');
  const answerId = answer && (answer.id || 'faq-answer-' + index);
  question.setAttribute('role', 'button');
  question.setAttribute('tabindex', '0');
  question.setAttribute('aria-expanded', item && item.classList.contains('open') ? 'true' : 'false');
  if (answer && answerId) {
    answer.id = answerId;
    question.setAttribute('aria-controls', answerId);
  }
  question.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      question.click();
    }
  });
});

// ── Typewriter Effect ─────────────────────────────────────────────────────
function typewriter(el, phrases, opts) {
  opts = opts || {};
  const speed = opts.speed || 80;
  const pause = opts.pause || 2000;
  const deleteSpeed = opts.deleteSpeed || 45;
  let phraseIdx = 0, charIdx = 0, deleting = false;
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  el.parentNode.insertBefore(cursor, el.nextSibling);
  function tick() {
    const phrase = phrases[phraseIdx];
    if (deleting) {
      el.textContent = phrase.slice(0, --charIdx);
      if (charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; setTimeout(tick, 400); return; }
      setTimeout(tick, deleteSpeed);
    } else {
      el.textContent = phrase.slice(0, ++charIdx);
      if (charIdx === phrase.length) { deleting = true; setTimeout(tick, pause); return; }
      setTimeout(tick, speed);
    }
  }
  tick();
}
const twEl = document.querySelector('[data-typewriter]');
if (twEl) {
  const phrases = twEl.dataset.typewriter.split('|');
  if (!isMobileDevice) {
    typewriter(twEl, phrases);
  } else {
    twEl.textContent = phrases[0];
  }
}

// ── Scroll Indicator Click ────────────────────────────────────────────────
document.querySelectorAll('.scroll-indicator').forEach(function(el) {
  el.addEventListener('click', function() {
    const target = el.closest('section, .page-hero') && el.closest('section, .page-hero').nextElementSibling;
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ── Animated Counters ─────────────────────────────────────────────────────
function animateCounter(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
  const duration = 1800;
  const start = performance.now();
  el.style.opacity = '1';
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = eased * target;
    el.textContent = (decimals ? value.toFixed(decimals) : Math.round(value)) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function initCounters() {
  const els = document.querySelectorAll('.counter-number[data-target]');
  if (!els.length) return;
  const counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(function(el) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setTimeout(function() { animateCounter(el); }, 200); }
    else { counterObserver.observe(el); }
  });
}
initCounters();
window.addEventListener('load', function() { setTimeout(initCounters, 300); });

// ── Form Submit ───────────────────────────────────────────────────────────
document.querySelectorAll('.form-submit').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    if (btn.closest('form')) return;
    e.preventDefault();
    const form = btn.closest('.contact-form');
    if (!form) return;
    let success = form.querySelector('.form-success');
    if (!success) {
      success = document.createElement('div');
      success.className = 'form-success';
      success.innerHTML = '<div class="form-success-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><h3 style="font-size:1.2rem;margin-bottom:0.5rem;">Message Sent!</h3><p style="color:var(--text-light);font-size:0.9rem;">We\'ll be in touch within one business day.</p>';
      form.appendChild(success);
    }
    btn.textContent = '✓ Sent!';
    btn.style.background = 'var(--teal)';
    success.classList.add('show');
    setTimeout(function() {
      btn.textContent = 'Send Message →';
      btn.style.background = '';
      success.classList.remove('show');
    }, 4000);
  });
});

// ── Cookie Banner ─────────────────────────────────────────────────────────
(function initCookieBanner() {
  if (localStorage.getItem('aimaine-cookies')) return;
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML = '<div class="cookie-banner-text"><p>We use cookies for essential site functions and Google Fonts. No advertising trackers. <a href="privacy.html">Privacy Policy →</a></p></div><div class="cookie-banner-actions"><button class="cookie-accept">Accept</button><button class="cookie-decline">Decline</button></div>';
  document.body.appendChild(banner);
  setTimeout(function() { banner.classList.add('show'); }, 1500);
  banner.querySelector('.cookie-accept').addEventListener('click', function() {
    localStorage.setItem('aimaine-cookies', 'accepted');
    banner.classList.remove('show');
    setTimeout(function() { banner.remove(); }, 500);
  });
  banner.querySelector('.cookie-decline').addEventListener('click', function() {
    localStorage.setItem('aimaine-cookies', 'declined');
    banner.classList.remove('show');
    setTimeout(function() { banner.remove(); }, 500);
  });
})();

// ── Exit Intent Popup (desktop only) ─────────────────────────────────────
if (!isMobileDevice) {
  (function initPopup() {
    if (document.querySelector('.contact-form') || localStorage.getItem('aimaine-popup')) return;
    let shown = false;
    function showPopup() {
      if (shown) return;
      shown = true;
      localStorage.setItem('aimaine-popup', '1');
      const popup = document.createElement('div');
      popup.id = 'exit-popup';
      popup.style.cssText = 'position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;background:rgba(10,16,30,0.7);opacity:0;transition:opacity 0.3s;padding:1.5rem;';
      popup.innerHTML = '<div style="background:white;border-radius:14px;max-width:480px;width:100%;padding:2.5rem;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);"><button id="popup-close" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.4rem;cursor:pointer;">×</button><h3 style="font-family:\'Cormorant Garamond\',serif;font-size:1.5rem;color:var(--navy);margin-bottom:0.6rem;">Take the free AI Readiness Assessment</h3><p style="color:var(--text-light);font-size:0.92rem;line-height:1.75;margin-bottom:1.5rem;">Find out where your organization stands with AI in under 3 minutes.</p><a href="assessment.html" style="background:var(--teal);color:white;padding:0.75rem 1.5rem;border-radius:4px;text-decoration:none;font-weight:600;display:block;text-align:center;">Start the Assessment →</a></div>';
      document.body.appendChild(popup);
      requestAnimationFrame(function() { popup.style.opacity = '1'; });
      function closePopup() { popup.style.opacity = '0'; setTimeout(function() { popup.remove(); }, 300); }
      popup.querySelector('#popup-close').addEventListener('click', closePopup);
      popup.addEventListener('click', function(e) { if (e.target === popup) closePopup(); });
    }
    let popRaf = false;
    window.addEventListener('scroll', function() {
      if (popRaf || shown) return; popRaf = true;
      requestAnimationFrame(function() {
        const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (pct > 0.70) showPopup();
        popRaf = false;
      });
    }, { passive: true });
    document.addEventListener('mouseleave', function(e) { if (e.clientY < 0) showPopup(); });
  })();
}
