/* ============================================================================
   Mission maps
   ----------------------------------------------------------------------------
   Every system gets the same mission map the Skeletal world has: a grid of cards,
   each carrying that mission's illustration, its number, title and goal, and a
   Start / Explore again / Locked control that follows the real unlock rule.

   Titles and goals come from each module's own lesson data, and the illustrations
   are the same figures the missions use, so the map cannot drift from the content.
   ========================================================================== */
(() => {
  'use strict';
  if (window.__missionMapWire) return;
  window.__missionMapWire = 1;

  /* one entry per world that needs a map */
  const SYSTEMS = {
    '#integumentary': { key: 'integumentary', base: '#integumentary/mission/', art: n => art('integumentary', n) },
    '#respiratory':   { key: 'respiratory',   base: '#respiratory/mission/',   art: n => art('respiratory', n) },
    '#excretory':     { key: 'excretory',     base: '#excretory/mission/',     art: n => art('excretory', n) },
    '#circulatory':   { key: 'circ',          base: '#circulatory/',           art: n => art('circulatory', n) },
    '#muscle': {
      key: 'muscle', base: '#muscle/mission/',
      art: n => {
        const order = ['tissue', 'arm', 'sarcomere', 'zoom', 'bridge', 'fiber', 'body'];
        try {
          if (typeof MuscleVisuals !== 'undefined' && MuscleVisuals[order[n - 1]]) return MuscleVisuals[order[n - 1]]();
        } catch (e) { /* fall through to no art */ }
        return '';
      }
    }
  };

  function art(system, n) {
    try {
      return (typeof window.inneruMissionArt === 'function') ? window.inneruMissionArt(system, n) : '';
    } catch (e) { return ''; }
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem('bodyquest-v1') || '{}') || {}; } catch (e) { return {}; }
  }

  function inject() {
    const sys = SYSTEMS[location.hash.split('?')[0]];
    if (!sys) return;
    if (document.getElementById('system-mission-map')) return;

    const host = document.querySelector('#main') || document.querySelector('.main');
    if (!host) return;

    const raw = window.inneruMissions && window.inneruMissions[sys.key];
    const missions = typeof raw === 'function' ? raw() : raw;
    if (!missions || !missions.length) return;

    const st = readState();
    const bucket = sys.key === 'circ' ? (st.circ || {}) : (st[sys.key] || {});
    const done = Array.isArray(bucket.done) ? bucket.done : [];

    const cards = missions.map((m, i) => {
      const locked = i > 0 && !done.includes(i);
      const finished = done.includes(m.n);
      const picture = sys.art(m.n);
      return '<article class="panel missioncard ' + (locked ? 'locked' : '') + '">'
        + (picture ? '<div class="mission-card-art">' + picture + '</div>' : '')
        + '<div class="missionnum">MISSION 0' + m.n + (finished ? ' · \u2713 COMPLETED' : '') + '</div>'
        + '<h3>' + m.title + '</h3>'
        + '<p>' + m.goal + '</p>'
        + (locked
            ? '<button class="btn line" disabled>Locked \u00b7 Finish previous mission</button>'
            : '<a class="btn ' + (finished ? 'secondary' : '') + '" href="' + sys.base + m.n + '">'
              + (finished ? 'Explore again' : 'Start mission') + ' \u2192</a>')
        + '</article>';
    }).join('');

    const section = document.createElement('section');
    section.id = 'system-mission-map';
    section.className = 'missionmap';
    section.setAttribute('data-system', sys.key);
    section.innerHTML =
      '<div class="headrow"><div><h2>Your mission map</h2>'
      + '<p>Complete each investigation and its checks to unlock the next.</p></div>'
      + '<span class="chip">' + missions.length + ' missions</span></div>'
      + '<div class="grid missiongrid">' + cards + '</div>';

    const hero = host.querySelector('.integ-hero, .resp-hero, .exc-hero, .circ-hero, .mq-hero, .worldbanner');
    if (hero && hero.parentNode) hero.parentNode.insertBefore(section, hero.nextSibling);
    else host.insertBefore(section, host.firstChild);
  }

  const run = () => setTimeout(inject, 90);
  window.addEventListener('hashchange', run);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
