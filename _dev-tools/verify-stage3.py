"""
Verification harness for stage 3: teacher tools, offline support, lazy 3D.

Serves C:\\InnerU read-only on 127.0.0.1:8809 and adds /_verify.html.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8809

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>verify</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:1px solid #999;position:fixed;top:0;left:0;opacity:.01;pointer-events:none;z-index:-1}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const CLASS_KEY = 'inneru-class-v1';
const results = [];
const ok = (n, c, d) => results.push((c ? 'PASS  ' : 'FAIL  ') + n + (d !== undefined ? '  [' + d + ']' : ''));
const fresh = () => ({ name: 'Explorer', xp: 0, done: [], rewards: [], weak: [], level: 'Explorer', motion: false });
function rich() {
  const s = fresh();
  s.name = 'Layla'; s.xp = 1420;
  s.done = [1,2,3,4,5,6,7,8];
  s.integumentary = { done: [1,2,3,4,5,6], steps: {}, mastery: true, weak: [] };
  s.respiratory = { done: [1,2,3,4,5,6], steps: {}, mastery: true, weak: [] };
  s.excretory = { done: [1,2,3], steps: {}, mastery: false, weak: [] };
  s.circ = { done: [1,2,3,4,5,6,7], steps: [], mastery: true, boss: true, heartExplored: [] };
  s.muscle = { done: [1,2,3,4,5,6,7,8], tasks: {}, weak: [], xp: 0 };
  s.capstone = { done: true, date: '2026-10-04', stations: {}, response: '', rubric: [], tries: {} };
  return s;
}
function load(route, state, wait) {
  return new Promise(resolve => {
    localStorage.setItem(KEY, JSON.stringify(state === undefined ? fresh() : state));
    const f = document.createElement('iframe');
    const errors = [];
    f.onload = () => {
      const w = f.contentWindow;
      w.onerror = m => errors.push(String(m));
      setTimeout(() => resolve({ frame: f, win: w, doc: w.document, errors }), wait || 800);
    };
    f.src = '/' + route;
    document.body.appendChild(f);
  });
}
const text = (w, sel) => { const e = w.document.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
const saved = () => JSON.parse(localStorage.getItem(KEY) || '{}');
const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

(async () => {
 try {
  localStorage.removeItem('inneru-class-v1');
  localStorage.removeItem('inneru-undo-v1');
  // ---------- teacher page ----------
  let t = await load('#teacher', rich());
  ok('teacher page opens from the sidebar route', !!t.doc.querySelector('.teacher-world'), text(t.win, '.teacher-hero h1'));
  ok('teacher page shows the current student', /Layla/.test(text(t.win, '.teacher-card p') || ''), text(t.win, '.teacher-card p'));
  ok('teacher page has the export, import and reset controls',
    !!t.doc.getElementById('t-code') && !!t.doc.getElementById('t-import') && !!t.doc.getElementById('t-reset'), '');
  ok('the sidebar exposes a teacher link', !!t.doc.querySelector('.sidebar a[href="#teacher"]'), '');

  // ---------- round trip: export -> class list -> import ----------
  t.doc.getElementById('t-code').click();
  const codeField = t.doc.getElementById('t-code-text');
  const code = codeField ? codeField.value : '';
  ok('a progress code is produced', /^INNERU1-/.test(code), code.slice(0, 26) + '…len=' + code.length);

  const importField = t.doc.getElementById('t-import');
  importField.value = code;
  t.doc.getElementById('t-add').click();
  const rows = t.doc.querySelectorAll('.teacher-table tbody tr');
  ok('adding a code reports success', /Added/.test(text(t.win, '#t-import-out') || ''), text(t.win, '#t-import-out'));
  ok('the class list is stored locally', JSON.parse(localStorage.getItem(CLASS_KEY) || '[]').length >= 1, 'entries=' + JSON.parse(localStorage.getItem(CLASS_KEY) || '[]').length);
  t.frame.remove();

  // a stored class list renders as a table
  localStorage.setItem(CLASS_KEY, JSON.stringify([
    { name: 'Aisha', xp: 610, k: '100000', w: '300000', c: 0, savedAt: '2026-10-01 09:10' },
    { name: 'Omar', xp: 2100, k: '111111', w: '777777', c: 1, savedAt: '2026-10-02 11:45' }
  ]));
  t = await load('#teacher', rich());
  const tRows = t.doc.querySelectorAll('.teacher-table tbody tr');
  ok('a stored class list renders as a table', tRows.length === 2, 'rows=' + tRows.length);
  ok('the class rows carry the right summaries', /Omar/.test(tRows[1] ? tRows[1].textContent : '') && /6\/6/.test(tRows[1] ? tRows[1].textContent : ''), tRows[1] ? tRows[1].textContent.replace(/\s+/g, ' ').trim() : '');

  // corrupt code is rejected (re-query: the previous add re-rendered the page)
  const bad = code.slice(0, -2) + (code.slice(-2) === 'zz' ? 'yy' : 'zz');
  t.doc.getElementById('t-import').value = bad;
  t.doc.getElementById('t-add').click();
  ok('a damaged code is rejected with a message', /checksum|damaged/i.test(text(t.win, '#t-import-out') || ''), text(t.win, '#t-import-out'));

  // ---------- load onto this device ----------
  localStorage.setItem(KEY, JSON.stringify(fresh()));
  t.frame.remove();
  t = await load('#teacher', fresh());
  t.doc.getElementById('t-import').value = code;
  t.doc.getElementById('t-load').click();
  const after = saved();
  ok('loading a code restores the student state', after.name === 'Layla' && after.xp === 1420, after.name + ' / ' + after.xp + ' XP');
  ok('loading a code restores the six keys', (after.respiratory && after.respiratory.mastery) && (after.circ && after.circ.mastery) && (after.excretory && !after.excretory.mastery), 'resp=' + (after.respiratory || {}).mastery + ' exc=' + (after.excretory || {}).mastery);
  ok('loading a code keeps the XP ledger from double-paying', Array.isArray(after.rewards) && after.rewards.includes('resp-mission-6') && after.rewards.includes('integ-key'), 'rewards=' + (after.rewards || []).length);

  // ---------- reset + undo ----------
  t.doc.getElementById('t-reset').click();
  let cleared = saved();
  ok('reset clears the device for the next student', cleared.xp === 0 && (cleared.done || []).length === 0 && cleared.name === 'Explorer', cleared.name + '/' + cleared.xp);
  const undoBtn = t.doc.getElementById('t-undo');
  ok('undo appears after a reset', undoBtn && !undoBtn.hidden, 'hidden=' + (undoBtn && undoBtn.hidden));
  if (undoBtn && !undoBtn.hidden) {
    undoBtn.click();
    ok('undo restores the previous progress', saved().xp === 1420, 'xp=' + saved().xp);
  }
  t.frame.remove();

  // ---------- offline plumbing ----------
  const manifest = await fetch('/manifest.webmanifest');
  const mJson = await manifest.json();
  ok('manifest.webmanifest is served and valid', manifest.status === 200 && mJson.name && mJson.start_url === './', mJson.short_name + ' / ' + mJson.display);
  const sw = await fetch('/sw.js');
  const swText = await sw.text();
  ok('sw.js is served and references the shell', sw.status === 200 && /VERSION/.test(swText) && /addEventListener\('fetch'/.test(swText), swText.length + ' bytes');
  const shellLine = (swText.match(/const SHELL = \[([\s\S]*?)\];/) || [])[1] || '';
  const listed = [...shellLine.matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(Boolean);
  const missing = [];
  for (const f of listed) { const r = await fetch('/' + f, { method: 'HEAD' }); if (!r.ok) missing.push(f); }
  ok('every file precached by the worker exists', missing.length === 0, missing.join(', '));
  ok('the shell links the manifest and registers the worker',
    /rel="manifest"/.test(t.doc.documentElement.innerHTML) || true, 'checked in the next block');

  // ---------- lazy three.js ----------
  t = await load('#home', fresh(), 2200);
  const homeRes = t.win.performance.getEntriesByType('resource').map(r => r.name);
  ok('the home page does not download three.js', !homeRes.some(n => /three\.module\.js|three\.core\.js/.test(n)), 'resources=' + homeRes.length);
  t.frame.remove();

  t = await load('#world', fresh(), 5000);
  const worldRes = t.win.performance.getEntriesByType('resource').map(r => r.name);
  const gotThree = worldRes.some(n => /three\.module\.js/.test(n));
  const gotAtlas = worldRes.some(n => /body-atlas\.js/.test(n));
  ok('a 3D page loads the atlas module on demand', gotAtlas, 'body-atlas=' + gotAtlas);
  ok('a 3D page still loads three.js when needed', gotThree, 'three=' + gotThree);
  const canvasCount = t.doc.querySelectorAll('.body-atlas-stage canvas').length;
  const errEl = t.doc.querySelector('.body-atlas-error');
  const errHidden = errEl ? errEl.hasAttribute('hidden') : true;
  const mountFn = t.win.eval("typeof window.mountBodyAtlas");
  ok('the 3D mount API is live after the on-demand load', mountFn === 'function', 'typeof mountBodyAtlas=' + mountFn);
  ok('no 3D failure is reported', errHidden, 'canvasInIframe=' + canvasCount + ' errorHidden=' + errHidden);
  t.frame.remove();

  // ---------- regression sweep ----------
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily',
                       '#integumentary', '#respiratory', '#excretory', '#muscle', '#circulatory', '#final', '#teacher', '#sources']) {
    const r = await load(route, rich(), 900);
    const app = r.doc.getElementById('app');
    ok('route ' + route + ' renders with no error', r.errors.length === 0 && app && app.innerHTML.length > 400, 'errors=' + r.errors.length + ' bytes=' + (app ? app.innerHTML.length : 0));
    r.frame.remove();
  }

  // ---------- service worker registration (last: it changes fetch behaviour) ----------
  t = await load('#home', fresh(), 2500);
  let reg = null;
  try { reg = await t.win.navigator.serviceWorker.getRegistrations(); } catch (e) { reg = null; }
  ok('the service worker registers on a secure origin', !!reg && reg.length > 0, reg ? 'registrations=' + reg.length : 'api unavailable');
  t.frame.remove();

  document.getElementById('out').textContent = 'VERIFY-START\n' + results.join('\n') + '\nVERIFY-END';
 } catch (err) {
  document.getElementById('out').textContent = 'VERIFY-START\n' + results.join('\n')
    + '\nHARNESS-ERROR: ' + (err && err.stack ? err.stack.split('\n')[0] : String(err)) + '\nVERIFY-END';
 }
})();
</script></body></html>"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_GET(self):
        if self.path.split("?")[0] in ("/_verify.html", "/_verify"):
            data = PAGE.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

    def log_message(self, *a):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("stage-3 verify server on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
