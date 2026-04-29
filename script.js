// ===== Page loader =====
(function () {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  const hide = () => loader.classList.add('is-done');
  // Fire after a short, predictable delay regardless of load event
  setTimeout(hide, 1100);
  // Safety net: also hide on full load
  window.addEventListener('load', () => setTimeout(hide, 200));
})();

// ===== Año dinámico en footer =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Custom cursor =====
(function () {
  const cursor = document.getElementById('cursor');
  if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  const animate = () => {
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    cursor.style.transform = `translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(animate);
  };
  animate();

  // Hover state on interactive elements
  document.querySelectorAll('a, button, [data-cursor="hover"]').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });
})();

// ===== Navbar: scroll progress + estilo al hacer scroll =====
const navbar = document.getElementById('navbar');
const scrollProgress = document.getElementById('scrollProgress');

const onScroll = () => {
  const y = window.scrollY;
  if (y > 24) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  if (scrollProgress) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (y / docHeight) * 100) : 0;
    scrollProgress.style.width = `${pct}%`;
  }
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Menú móvil =====
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

menuToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.classList.toggle('open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Cierra el menú al hacer click en un link
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ===== Reveal on scroll =====
const reveals = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  }
);

reveals.forEach((el) => revealObserver.observe(el));

// ===== Counter animation for hero stats =====
const counters = document.querySelectorAll('[data-count]');

const animateCount = (el) => {
  const target = parseInt(el.dataset.count, 10);
  if (Number.isNaN(target)) return;
  const duration = 1400;
  const start = performance.now();

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

counters.forEach((el) => counterObserver.observe(el));

// ===== Spotlight effect en project cards =====
document.querySelectorAll('.project-card, .service-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
  });
});

// ===== Magnetic effect en botones primarios =====
document.querySelectorAll('.btn-primary, .nav-link-cta').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.25 - 2}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// ===== Marquee draggable + auto-scroll =====
(function () {
  const marquee = document.getElementById('marquee');
  const track = document.getElementById('marqueeTrack');
  if (!marquee || !track) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Disable CSS animation; we control transform via JS for pause + drag sync
  track.style.animation = 'none';

  let trackWidth = 0;
  let offset = 0;
  let speed = reduced ? 0 : 0.4; // px per frame
  let isDragging = false;
  let startX = 0;
  let startOffset = 0;
  let lastDragX = 0;
  let dragVelocity = 0;
  let isHover = false;

  const measure = () => {
    // Track contains content duplicated; loop point = half of total width
    trackWidth = track.scrollWidth / 2;
  };

  // Wait for fonts so width measurement is accurate
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }
  measure();
  window.addEventListener('resize', measure);

  const normalize = (val) => {
    if (trackWidth <= 0) return val;
    // Keep offset within [-trackWidth, 0] for seamless loop
    while (val <= -trackWidth) val += trackWidth;
    while (val > 0) val -= trackWidth;
    return val;
  };

  const tick = () => {
    if (!isDragging) {
      if (!isHover && speed > 0) {
        offset -= speed;
      } else if (Math.abs(dragVelocity) > 0.05) {
        // Inertia after release
        offset += dragVelocity;
        dragVelocity *= 0.92;
      }
      offset = normalize(offset);
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  marquee.addEventListener('mouseenter', () => { isHover = true; });
  marquee.addEventListener('mouseleave', () => { isHover = false; });

  const getX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);

  const onDown = (e) => {
    isDragging = true;
    marquee.classList.add('is-dragging');
    startX = getX(e);
    lastDragX = startX;
    startOffset = offset;
    dragVelocity = 0;
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const x = getX(e);
    const delta = x - startX;
    offset = normalize(startOffset + delta);
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
    dragVelocity = (x - lastDragX) * 0.6;
    lastDragX = x;
    if (e.cancelable) e.preventDefault();
  };

  const onUp = () => {
    if (!isDragging) return;
    isDragging = false;
    marquee.classList.remove('is-dragging');
  };

  marquee.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  marquee.addEventListener('touchstart', onDown, { passive: true });
  marquee.addEventListener('touchmove', onMove, { passive: false });
  marquee.addEventListener('touchend', onUp);
  marquee.addEventListener('touchcancel', onUp);
})();

// ===== Smooth scroll fallback =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ===== Active nav link based on section in view =====
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach((link) => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${id}`) {
            link.style.color = 'var(--text)';
          }
        });
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach((section) => sectionObserver.observe(section));
