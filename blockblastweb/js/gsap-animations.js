/* ============================================================
   Scroll and entrance motion.
   Initial states are set here in JS, never in CSS — if the GSAP
   CDN fails, every element simply stays where it already is,
   fully visible. Motion is an enhancement, never a gate.
   ============================================================ */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var DUR = 0.8;
  var EASE = 'power3.out';

  /* Split the hero headline into words we can stagger. */
  function splitWords(el) {
    if (!el) return [];
    var text = el.textContent.trim();
    el.textContent = '';
    var frag = document.createDocumentFragment();
    var words = text.split(/\s+/);
    words.forEach(function (word, i) {
      var span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      frag.appendChild(span);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
    return Array.prototype.slice.call(el.querySelectorAll('.word'));
  }

  var mm = gsap.matchMedia();

  /* ============================================================
     Full motion — only when the visitor has not asked for less.
     ============================================================ */
  mm.add('(prefers-reduced-motion: no-preference)', function () {

    /* ---------- Hero ---------- */
    var title = document.querySelector('[data-split]');
    var words = splitWords(title);
    var hero = gsap.timeline({ delay: 0.15 });

    gsap.set(words, { autoAlpha: 0, y: 30 });
    gsap.set('.eyebrow, .hero__sub, .hero__note', { opacity: 0, y: 20 });
    gsap.set('.hero__cta .btn', { opacity: 0, scale: 0.9 });

    hero.to('.eyebrow', { opacity: 1, y: 0, duration: 0.6, ease: EASE })
        .to(words, { autoAlpha: 1, y: 0, duration: DUR, ease: EASE, stagger: 0.08 }, '-=0.35')
        .to('.hero__sub', { opacity: 1, y: 0, duration: DUR, ease: EASE }, '-=0.2')
        .to('.hero__cta .btn', {
          opacity: 1, scale: 1, duration: DUR,
          ease: 'elastic.out(1, 0.5)', stagger: 0.1
        }, '-=0.45')
        .to('.hero__note', { opacity: 1, y: 0, duration: 0.6, ease: EASE }, '-=0.55');

    /* Re-split when the language changes so the words stay animatable. */
    document.addEventListener('bb:langchange', function () {
      var next = splitWords(document.querySelector('[data-split]'));
      gsap.set(next, { autoAlpha: 1, y: 0 });
    });

    /* ---------- Section reveals ----------
       These use opacity rather than autoAlpha on purpose. autoAlpha also sets
       visibility:hidden, which pulls the element out of the accessibility tree —
       a screen-reader user browsing by headings would find sections missing
       until someone scrolled past them. Opacity keeps them announceable. */
    gsap.utils.toArray('[data-animate]').forEach(function (el) {
      gsap.set(el, { opacity: 0, y: 30 });
      gsap.to(el, {
        opacity: 1, y: 0, duration: DUR, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
      });
    });

    /* ---------- Feature cards ---------- */
    var cards = gsap.utils.toArray('[data-card]');
    if (cards.length) {
      gsap.set(cards, { opacity: 0, y: 40 });
      gsap.to(cards, {
        opacity: 1, y: 0, duration: DUR, ease: EASE, stagger: 0.15,
        scrollTrigger: { trigger: '.cards', start: 'top 80%', toggleActions: 'play none none reverse' }
      });
    }

    /* ---------- Navigation: hide going down, show coming up ---------- */
    var nav = document.getElementById('nav');
    if (nav) {
      ScrollTrigger.create({
        start: 'top -80',
        end: 99999,
        onUpdate: function (self) {
          var hiding = self.direction === 1 && window.scrollY > 200;
          gsap.to(nav, {
            y: hiding ? -100 : 0,
            autoAlpha: hiding ? 0 : 1,
            duration: 0.35, ease: EASE, overwrite: true
          });
        }
      });
    }

    /* ---------- Device mockups: gentle parallax, desktop only ---------- */
    mm.add('(min-width: 900px)', function () {
      gsap.to('.device--phone', {
        y: -40, ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.to('.device--pad', {
        y: 40, ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---------- Themes: horizontal scroll, pinned on desktop only ---------- */
    mm.add('(min-width: 900px)', function () {
      var track = document.getElementById('themes-track');
      var section = document.getElementById('themes');
      if (!track || !section) return;

      var getDistance = function () {
        return Math.max(0, track.scrollWidth - window.innerWidth + 40);
      };
      if (getDistance() <= 0) return;

      var tween = gsap.to(track, {
        x: function () { return -getDistance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + getDistance(); },
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
    });

    /* ---------- Magnetic buttons (precise pointers only) ---------- */
    mm.add('(hover: hover) and (pointer: fine)', function () {
      var cleanups = [];
      gsap.utils.toArray('[data-magnetic]').forEach(function (el) {
        var xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
        var yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });

        var move = function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
        };
        var reset = function () { xTo(0); yTo(0); };

        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', reset);
        cleanups.push(function () {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerleave', reset);
          gsap.set(el, { x: 0, y: 0 });
        });
      });
      return function () { cleanups.forEach(function (fn) { fn(); }); };
    });
  });

  /* ============================================================
     Reduced motion — content still arrives, just without travel.
     ============================================================ */
  mm.add('(prefers-reduced-motion: reduce)', function () {
    gsap.set('[data-animate], [data-card], .quote, .eyebrow, .hero__sub, .hero__note, .hero__cta .btn', {
      opacity: 1, x: 0, y: 0, scale: 1, clearProps: 'transform'
    });
  });

  /* ---------- Stats counters (both motion modes: a number that
       lands on its value is information, not decoration) ---------- */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    var counter = { value: 0 };
    el.textContent = '0';
    gsap.to(counter, {
      value: target,
      duration: window.BBMotion && window.BBMotion.reduced ? 0.01 : 1.4,
      ease: 'power2.out',
      snap: { value: 1 },
      onUpdate: function () { el.textContent = String(Math.round(counter.value)); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  /* ---------- Teardown ---------- */
  window.addEventListener('pagehide', function () {
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    mm.revert();
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
