/* ============================================================================
   Teacher tools — a classroom layer for a site that has no server.
   ----------------------------------------------------------------------------
   Everything lives in this browser:
     * a progress code per student (copy / paste, works between devices)
     * a class list the teacher builds by pasting codes or saving this device
     * a printable one-page summary per student and for the whole class
     * one-tap "next student" reset with a 10 minute undo
   Loaded after a11y.js, so it wraps route/badges on top of everything else.
   ========================================================================== */
(() => {
  'use strict';

  const CLASS_KEY = 'inneru-class-v1';
  const UNDO_KEY = 'inneru-undo-v1';
  const WORLD_LABELS = ['Body Shield', 'Framework', 'Power', 'Oxygen', 'Transport', 'Filter'];
  const WORLD_ROUTES = ['#integumentary', '#world', '#muscle', '#respiratory', '#circulatory', '#excretory'];

  /* ---------------------------------------------------------------- codec */
  function checksum(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1296;
    return h.toString(36).padStart(2, '0');
  }
  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    return decodeURIComponent(escape(atob(padded)));
  }

  function summary(s) {
    const sc = k => (s[k] && typeof s[k] === 'object' ? s[k] : {});
    const count = a => (Array.isArray(a) ? a.length : 0);
    const keys = [
      (s.done || []).includes(8) ? 1 : 0,
      sc('integumentary').mastery ? 1 : 0,
      sc('respiratory').mastery ? 1 : 0,
      sc('excretory').mastery ? 1 : 0,
      sc('circ').mastery ? 1 : 0,
      (sc('muscle').done || []).includes(8) ? 1 : 0
    ];
    const worlds = [
      count(sc('integumentary').done),
      count((s.done || []).filter(n => n < 8)),
      count((sc('muscle').done || []).filter(n => n < 8)),
      count(sc('respiratory').done),
      count(sc('circ').done),
      count(sc('excretory').done)
    ];
    return {
      v: 1,
      n: String(s.name || 'Explorer').slice(0, 24),
      x: Math.max(0, Math.round(Number(s.xp) || 0)),
      k: keys.join(''),
      w: worlds.join(''),
      c: s.capstone && s.capstone.done ? 1 : 0
    };
  }

  function encode(s) {
    const json = JSON.stringify(summary(s));
    return 'INNERU1-' + b64encode(json) + '-' + checksum(json);
  }

  function decode(code) {
    const raw = String(code || '').trim().replace(/\s+/g, '');
    if (!/^INNERU1-/.test(raw)) return { error: 'This does not look like an InnerU progress code (it should start with INNERU1-).' };
    const parts = raw.split('-');
    if (parts.length < 3) return { error: 'The code is incomplete.' };
    const sum = parts.pop();
    const body = parts.slice(1).join('-');
    let json;
    try { json = b64decode(body); } catch (e) { return { error: 'The code is damaged and could not be read.' }; }
    if (checksum(json) !== sum) return { error: 'The code failed its checksum — one character is probably wrong.' };
    let payload;
    try { payload = JSON.parse(json); } catch (e) { return { error: 'The code content is unreadable.' }; }
    if (!payload || payload.v !== 1 || typeof payload.k !== 'string' || payload.k.length !== 6) return { error: 'This code version is not supported.' };
    payload.w = String(payload.w || '000000').padEnd(6, '0');
    return { payload };
  }

  function applyPayload(p) {
    const keys = p.k.split('');
    const w = p.w.split('').map(n => Math.min(9, Math.max(0, Number(n) || 0)));
    const range = n => Array.from({ length: n }, (_, i) => i + 1);
    const rewards = [];
    const next = {
      name: p.n || 'Explorer',
      xp: p.x,
      done: range(w[1]),
      rewards,
      weak: [],
      level: state.level || 'Explorer',
      motion: !!state.motion
    };
    if (keys[0] === '1') next.done.push(8);
    next.integumentary = { done: range(w[0]), steps: {}, mastery: keys[1] === '1', weak: [] };
    next.respiratory = { done: range(w[3]), steps: {}, mastery: keys[2] === '1', weak: [] };
    next.excretory = { done: range(w[5]), steps: {}, mastery: keys[3] === '1', weak: [] };
    next.circ = { done: range(w[4]), steps: [], mastery: keys[4] === '1', boss: false, heartExplored: [] };
    next.muscle = { done: range(w[2]), tasks: {}, weak: [], xp: 0 };
    if (keys[5] === '1') next.muscle.done.push(8);
    next.capstone = p.c ? { done: true, date: new Date().toISOString().slice(0, 10), stations: {}, response: '', rubric: [], tries: {} } : { done: false, date: '', stations: {}, response: '', rubric: [], tries: {} };
    /* keep the XP ledger honest so completed work is not paid for twice */
    for (let i = 1; i <= w[1]; i++) rewards.push('activity' + i);
    for (let i = 1; i <= w[0]; i++) rewards.push('integ-mission-' + i);
    for (let i = 1; i <= w[3]; i++) rewards.push('resp-mission-' + i);
    for (let i = 1; i <= w[5]; i++) rewards.push('exc-mission-' + i);
    for (let i = 1; i <= w[4]; i++) rewards.push('circ-mission-' + i);
    for (let i = 1; i <= w[2]; i++) rewards.push('complete-' + i);
    if (keys[0] === '1') rewards.push('boss');
    if (keys[1] === '1') rewards.push('integ-key');
    if (keys[2] === '1') rewards.push('resp-key');
    if (keys[3] === '1') rewards.push('exc-key');
    if (keys[4] === '1') rewards.push('circ-mastery');
    if (keys[5] === '1') rewards.push('muscle-complete');
    if (p.c) rewards.push('capstone');
    state = next;
    save();
  }

  /* ---------------------------------------------------------------- class list */
  function classList() {
    try {
      const raw = JSON.parse(localStorage.getItem(CLASS_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  function saveClass(list) { try { localStorage.setItem(CLASS_KEY, JSON.stringify(list.slice(-200))); } catch (e) { /* ignore */ } }
  function addToClass(payload) {
    const list = classList().filter(r => !(r.name === payload.n && r.x === payload.x && r.k === payload.k));
    list.push({ name: payload.n, xp: payload.x, k: payload.k, w: payload.w, c: payload.c, savedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    saveClass(list);
    return list.length;
  }

  const keysOf = p => p.k.split('').filter(x => x === '1').length;
  const worldsOf = p => p.w.split('').reduce((a, b) => a + (Number(b) || 0), 0);

  /* ---------------------------------------------------------------- page */
  function printStyles() {
    return '<style>@media print{.sidebar,.topbar,.cap-actions,.teacher-actions,.teacher-help,.textlink,.skip{display:none!important}'
      + 'html,body{background:#fff!important}.shell{display:block!important}.main{padding:0!important;max-width:none!important}'
      + '.teacher-card,.teacher-table{border:0!important;box-shadow:none!important}'
      + '.teacher-table th,.teacher-table td{border-bottom:1px solid #ccd9dd!important}}</style>';
  }

  function summaryTable(rows) {
    return `<table class="teacher-table"><thead><tr><th>Student</th><th>XP</th><th>Keys</th><th>Mission steps</th><th>Final mission</th><th>Saved</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td><b>${esc(r.name)}</b></td><td>${r.xp}</td><td>${keysOf(r)}/6</td><td>${worldsOf(r)}</td><td>${r.c ? '\u2713 done' : '\u2014'}</td><td>${esc(r.savedAt || '')}</td></tr>`).join('')}
    </tbody></table>`;
  }

  function page(message, tone) {
    const current = summary(state);
    const list = classList();
    layout(`<div class="teacher-world">
      <div class="teacher-hero"><div class="eyebrow">CLASSROOM TOOLS</div><h1>Teacher tools</h1>
      <p>Everything here stays in this browser: no accounts, no server, no student data leaves the device.</p></div>
      ${message ? `<div class="feedback ${tone || 'info'}">${message}</div>` : ''}

      <section class="panel teacher-card">
        <h2>This device</h2>
        <p><b>${esc(current.n)}</b> \u00b7 ${current.x} XP \u00b7 ${keysOf(current)}/6 System Keys \u00b7 ${worldsOf(current)} mission steps${current.c ? ' \u00b7 final mission complete' : ''}</p>
        <div class="teacher-actions">
          <button class="btn" id="t-code">Show this student\u2019s progress code</button>
          <button class="btn secondary" id="t-save">Add to the class list</button>
          <button class="btn line" id="t-reset">Finish for the next student</button>
          <button class="btn line" id="t-undo" hidden>Undo reset</button>
        </div>
        <div id="t-code-out"></div>
      </section>

      <section class="panel teacher-card">
        <h2>Collect a student\u2019s progress</h2>
        <p class="teacher-help">Paste a code a student copied from their own device (or from a previous lesson) and add it to the class list, or load it onto this device.</p>
        <label for="t-import">Progress code</label>
        <textarea class="input" id="t-import" rows="3" placeholder="INNERU1-..."></textarea>
        <div class="teacher-actions">
          <button class="btn" id="t-add">Add to the class list</button>
          <button class="btn secondary" id="t-load">Load onto this device</button>
        </div>
        <div id="t-import-out"></div>
      </section>

      <section class="panel teacher-card teacher-summary">
        <div class="teacher-summary-head"><h2>Class list</h2><div class="teacher-actions">
          <button class="btn secondary" id="t-print">Print / save as PDF</button>
          <button class="btn line" id="t-clear">Clear the class list</button>
        </div></div>
        ${list.length ? summaryTable(list) : '<p class="note">No students saved yet. Add this device, or paste a student\u2019s code above.</p>'}
        <p class="note">${list.length} student(s) stored in this browser. Clearing the class list never touches a student\u2019s own device.</p>
      </section>
    </div>`, 'dashboard');
    wire();
  }

  function wire() {
    const out = id => document.getElementById(id);
    const show = (box, html, ok) => { const el = out(box); if (el) el.innerHTML = `<div class="feedback ${ok ? '' : 'wrong'}">${html}</div>`; };

    const codeBtn = out('t-code');
    if (codeBtn) codeBtn.onclick = () => {
      const code = encode(state);
      const box = out('t-code-out');
      if (box) box.innerHTML = `<div class="teacher-code"><label for="t-code-text">Progress code \u2014 copy it and keep it with the student\u2019s name</label>
        <textarea class="input" id="t-code-text" rows="3" readonly>${code}</textarea>
        <div class="teacher-actions"><button class="btn secondary" id="t-copy">Copy</button></div></div>`;
      const copy = out('t-copy');
      if (copy) copy.onclick = async () => {
        const field = out('t-code-text');
        try { await navigator.clipboard.writeText(code); copy.textContent = 'Copied'; }
        catch (e) { field.select(); copy.textContent = 'Press Ctrl+C'; }
      };
    };

    const saveBtn = out('t-save');
    if (saveBtn) saveBtn.onclick = () => { const n = addToClass(summary(state)); page(`Saved. The class list now holds ${n} student(s).`, ''); };

    const reset = out('t-reset');
    if (reset) reset.onclick = () => {
      try { localStorage.setItem(UNDO_KEY, JSON.stringify({ at: Date.now(), data: localStorage.getItem('bodyquest-v1') })); } catch (e) { /* ignore */ }
      state = { name: 'Explorer', xp: 0, done: [], rewards: [], weak: [], level: state.level || 'Explorer', motion: !!state.motion };
      save();
      page('This device is ready for the next student. You can undo this for the next 10 minutes.', '');
    };

    const undo = out('t-undo');
    if (undo) {
      let snap = null;
      try { snap = JSON.parse(localStorage.getItem(UNDO_KEY) || 'null'); } catch (e) { snap = null; }
      if (snap && Date.now() - snap.at < 10 * 60 * 1000 && snap.data) {
        undo.hidden = false;
        undo.onclick = () => {
          try { localStorage.setItem('bodyquest-v1', snap.data); } catch (e) { /* ignore */ }
          localStorage.removeItem(UNDO_KEY);
          state = JSON.parse(snap.data);
          page('The previous progress was restored.', '');
        };
      }
    }

    const importField = out('t-import');
    const addBtn = out('t-add');
    if (addBtn) addBtn.onclick = () => {
      const res = decode(importField.value);
      if (res.error) return show('t-import-out', res.error, false);
      const n = addToClass(res.payload);
      show('t-import-out', `Added <b>${esc(res.payload.n)}</b> (${res.payload.x} XP, ${keysOf(res.payload)}/6 keys). The class list now holds ${n} student(s).`, true);
    };
    const loadBtn = out('t-load');
    if (loadBtn) loadBtn.onclick = () => {
      const res = decode(importField.value);
      if (res.error) return show('t-import-out', res.error, false);
      applyPayload(res.payload);
      page(`Loaded <b>${esc(res.payload.n)}</b> onto this device. Open the dashboard to see their progress.`, '');
    };

    const print = out('t-print');
    if (print) print.onclick = () => window.print();
    const clear = out('t-clear');
    if (clear) clear.onclick = () => { saveClass([]); page('The class list was cleared.', ''); };
  }

  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () {
    if (location.hash.slice(1) === 'teacher') { page(); window.scrollTo(0, 0); document.title = 'InnerU \u00b7 Teacher tools'; return; }
    previousRoute();
  };
  window.addEventListener('hashchange', route);

  /* the print stylesheet only exists while the teacher page is open */
  const previousLayout = layout;
  layout = function (...args) {
    previousLayout(...args);
    if (!document.querySelector('.teacher-world')) return;
    if (!document.getElementById('teacher-print-style')) {
      const holder = document.createElement('div');
      holder.id = 'teacher-print-style';
      holder.innerHTML = printStyles();
      document.head.append(...holder.childNodes);
    }
  };

  route();
})();
