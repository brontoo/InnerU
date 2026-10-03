/* ============================================================================
   Accessibility layer — loaded last, decorates whatever the worlds rendered.
   ----------------------------------------------------------------------------
   Three gaps this closes, without touching the core or any world module:
     1. every progress bar was a plain <div class="bar"><i style="width:x%">,
        invisible to assistive technology -> role="progressbar" + aria-valuenow
     2. after a hash change the focus stayed on <body> and the document title
        never changed -> focus #main and set a per-route title
     3. the skeletal-world toggles only used the .selected class -> aria-pressed
   ========================================================================== */
(() => {
  'use strict';

  const TITLES = {
    home: 'Explore Worlds', world: 'The Framework \u00b7 Skeletal System', mission: 'Mission',
    dashboard: 'My Dashboard', detective: 'Body Detective', connect: 'System Connections',
    badges: 'My Achievements', daily: 'Daily Discovery', sources: 'Science references',
    about: 'About', privacy: 'Privacy', attribution: 'Attribution',
    integumentary: 'The Living Shield', respiratory: 'The Oxygen Mission',
    excretory: 'The Balance Mission', muscle: 'The Power System',
    circulatory: 'The Transport Network', final: 'Final mission', capstone: 'Final mission'
  };

  function decorate(scope) {
    const root = scope || document;
    root.querySelectorAll('.bar').forEach(bar => {
      const fill = bar.querySelector('i');
      const value = fill ? Math.max(0, Math.min(100, Math.round(parseFloat(fill.style.width) || 0))) : 0;
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(value));
      if (!bar.getAttribute('aria-label')) {
        const label = (bar.closest('section,article') || {}).querySelector
          ? ((bar.closest('section,article').querySelector('h2,h3,h1') || {}).textContent || '')
          : '';
        bar.setAttribute('aria-label', (label.trim() ? label.trim().slice(0, 60) + ' progress' : 'Progress'));
      }
    });
    /* toggle groups built with .selected only */
    root.querySelectorAll('.controls').forEach(group => {
      const buttons = group.querySelectorAll('button');
      if (buttons.length < 2) return;
      buttons.forEach(b => {
        if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(b.classList.contains('selected')));
      });
    });
  }

  /* 1 + 3: decorate after every render */
  const previousLayout = layout;
  layout = function (...args) {
    previousLayout(...args);
    decorate(document.getElementById('app') || document);
  };

  /* keep aria-pressed in sync when a world toggles its own .selected class */
  document.addEventListener('click', event => {
    const button = event.target.closest && event.target.closest('.controls button, .choice[data-model], .choice[data-cast], .choice[data-daily]');
    if (!button || !button.parentElement) return;
    const group = button.parentElement;
    [...group.querySelectorAll('button')].forEach(b => b.setAttribute('aria-pressed', String(b.classList.contains('selected'))));
  }, true);

  /* 2: a title and a focus target for every route */
  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () {
    previousRoute();
    const hash = location.hash.slice(1) || 'home';
    const key = hash.split('/')[0];
    if (TITLES[key]) document.title = 'InnerU \u00b7 ' + TITLES[key];
    const main = document.getElementById('main');
    if (main) {
      main.setAttribute('aria-label', TITLES[key] || 'Page content');
      try { main.focus({ preventScroll: true }); } catch (e) { main.focus(); }
    }
  };
  window.addEventListener('hashchange', route);

  /* First paint happened before this file was parsed: decorate it too. */
  decorate(document.getElementById('app') || document);
  try {
    const key0 = (location.hash.slice(1) || 'home').split('/')[0];
    document.title = 'InnerU \u00b7 ' + (TITLES[key0] || 'Explore the Human Body');
    const main0 = document.getElementById('main');
    if (main0) {
      main0.setAttribute('aria-label', TITLES[key0] || 'Page content');
      try { main0.focus({ preventScroll: true }); } catch (e) { main0.focus(); }
    }
  } catch (e) { /* decoration only */ }
})();
