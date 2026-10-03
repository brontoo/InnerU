/* ============================================================================
   Habit layer — streak, today's plan and a due-review nudge
   ----------------------------------------------------------------------------
   Motivation for a tool students use at home: a visible streak, three concrete
   things to do today, and one banner when retrieval practice is actually due.
   Nothing here forces anything; every prompt can be dismissed for the day.
   ========================================================================== */
(() => {
  'use strict';

  const DAY = 86400000;
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const yesterday = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000 - DAY).toISOString().slice(0, 10);

  function data() {
    if (!state.habit || typeof state.habit !== 'object') state.habit = {};
    const h = state.habit;
    h.last = typeof h.last === 'string' ? h.last : '';
    h.streak = Number(h.streak) || 0;
    h.best = Number(h.best) || 0;
    h.days = h.days && typeof h.days === 'object' ? h.days : {};
    h.dismissed = typeof h.dismissed === 'string' ? h.dismissed : '';
    return h;
  }

  function touch() {
    const h = data(), t = today();
    if (h.last === t) return false;
    h.streak = h.last === yesterday() ? h.streak + 1 : 1;
    h.last = t;
    h.best = Math.max(h.best, h.streak);
    h.days[t] = (h.days[t] || 0) + 1;
    const keep = Object.keys(h.days).sort().slice(-30), trimmed = {};
    keep.forEach(k => { trimmed[k] = h.days[k]; });
    h.days = trimmed;
    return true;
  }

  /* any saved progress counts as a day of work */
  const originalSave = save;
  save = function () {
    const changed = touch();
    const result = originalSave.apply(this, arguments);
    if (changed) renderChip();
    return result;
  };

  const stats = () => (typeof window.inneruReviewStats === 'function' ? window.inneruReviewStats() : { pool: 0, due: 0, next: 'later' });

  function plan() {
    const s = stats(), h = data();
    const daily = (state.rewards || []).includes('daily-' + today());
    const keys = typeof keysEarned === 'function' ? keysEarned() : 0;
    return [
      { done: s.due === 0, label: s.due ? s.due + ' review item(s) due' : 'Review is up to date', href: '#review', action: s.due ? 'Review now' : 'Open review' },
      { done: keys >= 6, label: keys + '/6 System Keys earned', href: keys >= 6 ? '#final' : '#home', action: keys >= 6 ? 'Final challenge' : 'Continue an expedition' },
      { done: daily, label: daily ? 'Daily discovery done today' : 'Daily discovery waiting', href: '#daily', action: daily ? 'See it again' : 'Open today\u2019s question' }
    ];
  }

  function dots() {
    const h = data(), out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      const key = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const active = !!h.days[key];
      out.push(`<span class="habit-dot ${active ? 'is-on' : ''}" title="${key}${active ? ' \u00b7 worked' : ''}"></span>`);
    }
    return out.join('');
  }

  function banner() {
    const s = stats(), h = data();
    if (!s.due || h.dismissed === today()) return '';
    return `<div class="habit-banner" id="habit-banner">
      <div><b>${s.due} review item(s) are due.</b> Retrieval practice takes about three minutes and moves each item further apart.</div>
      <div class="habit-banner-actions"><a class="btn" href="#review">Review now</a><button class="btn line" type="button" id="habit-later">Not today</button></div>
    </div>`;
  }

  function wireBanner() {
    const later = document.getElementById('habit-later');
    if (later) later.onclick = () => { data().dismissed = today(); save(); document.getElementById('habit-banner')?.remove(); };
  }

  function renderChip() {
    const profile = document.querySelector('.topbar .profile');
    const h = data();
    if (!profile) return;
    let chip = profile.querySelector('.habit-chip');
    if (!chip) {
      chip = document.createElement('span');
      chip.className = 'habit-chip';
      profile.insertBefore(chip, profile.querySelector('.avatar') || null);
    }
    chip.textContent = '\u25cf ' + h.streak;
    chip.title = 'Days in a row: ' + h.streak + ' (best ' + h.best + ')';
  }

  function dashboardCard() {
    const h = data(), items = plan(), s = stats();
    const section = document.createElement('section');
    section.className = 'panel spacer habit-card';
    section.innerHTML = `<div class="eyebrow">TODAY</div><h2>${h.streak} day${h.streak === 1 ? '' : 's'} in a row</h2>
      <div class="habit-dots" aria-label="Your last fourteen days">${dots()}</div>
      <ul class="habit-plan">${items.map(i => `<li class="${i.done ? 'is-done' : ''}"><span>${i.done ? '\u2713' : '\u25cb'}</span><div><b>${esc(i.label)}</b><a class="textlink" href="${i.href}">${i.action} \u2192</a></div></li>`).join('')}</ul>
      <p class="note">Best streak: ${h.best} day(s) \u00b7 next review due ${s.next}</p>`;
    const main = document.getElementById('main');
    if (main) { const foot = main.querySelector('footer'); if (foot) main.insertBefore(section, foot); else main.append(section); }
  }

  /* banner on every student page except review and the teacher tools */
  const previousLayout = layout;
  layout = function (...args) {
    previousLayout(...args);
    renderChip();
    const hash = (location.hash.slice(1) || 'home').split('/')[0];
    if (hash === 'review' || hash === 'teacher') return;
    const main = document.getElementById('main');
    if (!main) return;
    const html = banner();
    if (!html) return;
    main.insertAdjacentHTML('afterbegin', html);
    wireBanner();
  };

  const previousDashboard = dashboard;
  dashboard = function () {
    previousDashboard();
    dashboardCard();
  };

  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () {
    const hash = location.hash.slice(1);
    /* opening a learning page counts as a day of work, and must be persisted */
    if (hash.startsWith('mission/') || hash.includes('mission/') || hash === 'review' || hash === 'daily') save();
    previousRoute();
  };
  window.addEventListener('hashchange', route);

  route();
})();
