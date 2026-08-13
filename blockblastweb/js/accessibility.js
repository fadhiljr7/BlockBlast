/* ============================================================
   Accessibility & chrome behaviour.
   Everything here works without GSAP or Three.js — this file is
   what guarantees the page stays usable if either CDN fails.
   ============================================================ */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.BBMotion = {
    get reduced() { return motionQuery.matches; },
    onChange: function (fn) {
      motionQuery.addEventListener('change', function (e) { fn(e.matches); });
    }
  };

  /* ---------- Loader: never allowed to trap the page ---------- */
  var loader = document.getElementById('loader');
  if (loader) {
    var dismiss = function () { loader.setAttribute('data-done', ''); };
    document.addEventListener('bb:scene-ready', dismiss, { once: true });
    window.addEventListener('load', function () { setTimeout(dismiss, 250); });
    setTimeout(dismiss, 2500);          // hard ceiling, whatever else happens
  }

  /* ---------- Sticky nav material ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        nav.toggleAttribute('data-scrolled', window.scrollY > 24);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile drawer ---------- */
  var toggle = document.getElementById('navtoggle');
  var drawer = document.getElementById('drawer');
  if (toggle && drawer) {
    var scrim = document.createElement('div');
    scrim.className = 'drawer__scrim';
    scrim.hidden = true;
    document.body.appendChild(scrim);

    var lastFocus = null;

    var openDrawer = function () {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      scrim.hidden = false;
      requestAnimationFrame(function () {
        drawer.setAttribute('data-open', '');
        scrim.setAttribute('data-open', '');
      });
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', window.BBi18n ? window.BBi18n.t('nav.close', 'Close menu') : 'Close menu');
      document.body.style.overflow = 'hidden';
      var first = drawer.querySelector('a');
      if (first) first.focus();
    };

    var closeDrawer = function () {
      drawer.removeAttribute('data-open');
      scrim.removeAttribute('data-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', window.BBi18n ? window.BBi18n.t('nav.open', 'Open menu') : 'Open menu');
      document.body.style.overflow = '';
      var delay = window.BBMotion.reduced ? 0 : 380;
      setTimeout(function () {
        if (!drawer.hasAttribute('data-open')) { drawer.hidden = true; scrim.hidden = true; }
      }, delay);
      if (lastFocus) lastFocus.focus();
    };

    toggle.addEventListener('click', function () {
      drawer.hasAttribute('data-open') ? closeDrawer() : openDrawer();
    });
    scrim.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) closeDrawer(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.hasAttribute('data-open')) closeDrawer();
      if (e.key !== 'Tab' || !drawer.hasAttribute('data-open')) return;
      // Keep focus inside the drawer while it owns the screen.
      var items = drawer.querySelectorAll('a[href], button:not([disabled])');
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Colour-vision simulation ----------
     The same Brettel/Viénot matrices the iOS app uses, as SVG filters. */
  var SIM = {
    deuter: [0.625, 0.375, 0, 0.700, 0.300, 0, 0, 0.300, 0.700],
    protan: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
    tritan: [0.950, 0.050, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
    achroma: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114]
  };

  var chips = document.querySelectorAll('[data-sim]');
  if (chips.length) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'visually-hidden');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var defs = document.createElementNS(NS, 'defs');

    Object.keys(SIM).forEach(function (name) {
      var m = SIM[name];
      var filter = document.createElementNS(NS, 'filter');
      filter.setAttribute('id', 'sim-' + name);
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      var matrix = document.createElementNS(NS, 'feColorMatrix');
      matrix.setAttribute('type', 'matrix');
      matrix.setAttribute('values', [
        m[0], m[1], m[2], 0, 0,
        m[3], m[4], m[5], 0, 0,
        m[6], m[7], m[8], 0, 0,
        0, 0, 0, 1, 0
      ].join(' '));
      filter.appendChild(matrix);
      defs.appendChild(filter);
    });

    svg.appendChild(defs);
    document.body.appendChild(svg);

    var grid = document.querySelector('.patterndemo__grid');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var mode = chip.getAttribute('data-sim');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        if (grid) grid.style.filter = mode === 'none' ? '' : 'url(#sim-' + mode + ')';
      });
    });
  }

  /* ---------- Notify form (no backend, and it says so) ---------- */
  var form = document.getElementById('notify');
  if (form) {
    var input = form.querySelector('input[type="email"]');
    var status = form.querySelector('.notify__status');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = input.value.trim() !== '' && input.checkValidity();
      input.setAttribute('aria-invalid', String(!valid));
      if (!valid) {
        status.setAttribute('data-error', '');
        status.textContent = window.BBi18n
          ? window.BBi18n.t('form.invalid', 'Enter a valid email address.')
          : 'Enter a valid email address.';
        input.focus();
        return;
      }
      status.removeAttribute('data-error');
      status.textContent = window.BBi18n
        ? window.BBi18n.t('form.success', 'Thank you. This is a demo — nothing was sent or stored.')
        : 'Thank you. This is a demo — nothing was sent or stored.';
      form.reset();
    });

    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      status.textContent = '';
      status.removeAttribute('data-error');
    });
  }

  /* ---------- Disabled links should not navigate ---------- */
  document.querySelectorAll('a[aria-disabled="true"]').forEach(function (link) {
    link.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- Table-of-contents highlighting on doc pages ---------- */
  var tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (link) {
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) map[target.id] = link;
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
        var link = map[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { observer.observe(document.getElementById(id)); });
  }
})();
