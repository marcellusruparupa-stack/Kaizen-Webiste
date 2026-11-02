(function () {
  var WA = 'https://wa.me/6289526944318';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each product button opens WhatsApp with its own prefilled message
  document.querySelectorAll('.js-order').forEach(function (a) {
    var msg = 'Halo Markisa Centil, saya mau pesan ' + a.dataset.product + '. Apakah tersedia?';
    a.href = WA + '?text=' + encodeURIComponent(msg);
  });

  document.getElementById('yr').textContent = new Date().getFullYear();

  // Mobile menu
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Scroll reveals, fire once per element
  var pour = document.getElementById('pour');
  var targets = document.querySelectorAll('.reveal, .step, .reveal-pop');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        if (el.classList.contains('card')) setTimeout(function () { el.classList.add('done'); }, 1200);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
    // The pour plays once, only when most of the stage is on screen, so nobody misses it
    var pourIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      entries[0].target.classList.add('in');
      pourIO.disconnect();
    }, { threshold: 0.55 });
    pourIO.observe(pour);
  } else {
    targets.forEach(function (el) { el.classList.add('in', 'done'); });
    pour.classList.add('in');
  }

  // Nav background + parallax share one rAF-throttled scroll handler
  var nav = document.getElementById('nav');
  var layers = [];
  function collectLayers() {
    layers = [];
    // No parallax on phones or for reduced motion
    if (reduced || innerWidth < 761) {
      document.querySelectorAll('[data-speed]').forEach(function (el) { el.style.transform = ''; });
      return;
    }
    document.querySelectorAll('[data-speed]').forEach(function (el) {
      el.style.transform = '';
      var r = el.getBoundingClientRect();
      layers.push({ el: el, speed: +el.dataset.speed, mid: r.top + scrollY + r.height / 2, flip: el.classList.contains('hero__fruit--r') });
    });
  }
  var ticking = false;
  function frame() {
    ticking = false;
    var y = scrollY, vh = innerHeight;
    nav.classList.toggle('is-stuck', y > 40);
    layers.forEach(function (l) {
      var dist = y + vh / 2 - l.mid;
      if (Math.abs(dist) > vh * 1.3) return;
      l.el.style.transform = 'translate3d(0,' + (dist * l.speed).toFixed(1) + 'px,0)' + (l.flip ? ' scaleX(-1)' : '');
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, { passive: true });
  var rt;
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { collectLayers(); frame(); }, 150); });
  addEventListener('load', function () { collectLayers(); frame(); });
  collectLayers();
  frame();
})();
