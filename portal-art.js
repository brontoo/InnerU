/* ============================================================================
   Cross-cutting activity illustrations
   ----------------------------------------------------------------------------
   Three screens build their own heroes and are re-decorated by later modules, so the
   figure is attached after the screen renders, using the figure library in
   activity-art.js. Same wrapper approach the world modules use.
   ========================================================================== */
(() => {
  'use strict';
  if (window.__portalArtWire) return;
  window.__portalArtWire = 1;

  /* the router dispatches this screen as #connect */
  const SCREENS = { '#connect': 1, '#review': 2, '#capstone': 3 };

  function inject() {
    const key = location.hash.split('?')[0];
    const n = SCREENS[key];
    if (!n) return;
    if (document.querySelector('.portal-art')) return;
    if (typeof window.inneruActivityArt !== 'function') return;
    const art = window.inneruActivityArt('portal', n);
    if (!art) return;

    const host = document.querySelector('#main') || document.querySelector('.main') || document.body;
    const anchor = host.querySelector('.headrow, .review-hero, .cap-hero, .cap-locked, .worldbanner');
    const wrap = document.createElement('div');
    wrap.className = 'portal-art';
    wrap.id = 'portal-art';
    wrap.innerHTML = art;

    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    else host.insertBefore(wrap, host.firstChild);
  }

  const run = () => setTimeout(inject, 80);
  window.addEventListener('hashchange', run);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
