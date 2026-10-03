"""
Verification harness for stage 2.

Serves C:\\InnerU read-only on 127.0.0.1:8807 and adds /_verify.html covering:

  A  capstone locked state, and unlocked state with six keys
  B  a station can be completed, awards XP, and persists
  C  the finish button is gated by decisions + written answer + rubric
  D  finishing produces the certificate and sets state.capstone.done
  E  the home card becomes a real destination when all six keys are earned
  F  the dashboard shows a capstone section; the badges page shows one collection total
  G  accessibility: progress-bar roles, per-route title, focus target, aria-pressed
  H  labs: the respiratory diagram reacts to a stage; the ADH simulator works
  I  the six portal cards use one label format
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8807

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>verify</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:1px solid #999;position:absolute;left:-9999px}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const results = [];
const ok = (n, c, d) => results.push((c ? 'PASS  ' : 'FAIL  ') + n + (d !== undefined ? '  [' + d + ']' : ''));
const fresh = () => ({ name: 'Ahmed', xp: 0, done: [], rewards: [], weak: [], level: 'Explorer', motion: false });

function progressed() {
  const s = fresh();
  s.done = [1,2,3,4,5,6,7];
  s.integumentary = { done: [1,2,3,4,5], steps: {} };
  s.respiratory = { done: [1,2,3,4,5], steps: {} };
  s.excretory = { done: [1,2,3,4,5], steps: {} };
  s.circ = { done: [1,2,3,4,5,6], steps: [], mastery: false, boss: false, heartExplored: [] };
  s.muscle = { done: [1,2,3,4,5,6], tasks: {}, weak: [], xp: 0 };
  return s;
}
function allKeys() {
  const s = fresh();
  s.xp = 1000;
  s.done = [1,2,3,4,5,6,7,8];
  s.integumentary = { done: [1,2,3,4,5,6], steps: {}, mastery: true, weak: [] };
  s.respiratory = { done: [1,2,3,4,5,6], steps: {}, mastery: true, weak: [] };
  s.excretory = { done: [1,2,3,4,5,6], steps: {}, mastery: true, weak: [] };
  s.circ = { done: [1,2,3,4,5,6,7], steps: [], mastery: true, boss: true, heartExplored: [] };
  s.muscle = { done: [1,2,3,4,5,6,7,8], tasks: {}, weak: [], xp: 0 };
  return s;
}
function load(route, state) {
  return new Promise(resolve => {
    localStorage.setItem(KEY, JSON.stringify(state === undefined ? fresh() : state));
    const f = document.createElement('iframe');
    const errors = [];
    f.onload = () => {
      const w = f.contentWindow;
      w.onerror = m => errors.push(String(m));
      setTimeout(() => resolve({ frame: f, win: w, doc: w.document, errors }), 800);
    };
    f.src = '/' + route;
    document.body.appendChild(f);
  });
}
const txt = (w, sel) => { const el = w.doc ? el0(w, sel) : null; };
function el0(w, sel) { const e = w.document.querySelector(sel); return e; }
const text = (w, sel) => { const e = w.document.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
const saved = () => JSON.parse(localStorage.getItem(KEY) || '{}');
const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

(async () => {
  // ---------- A ----------
  let t = await load('#final', fresh());
  ok('capstone is locked without the six keys', /six System Keys/i.test(t.doc.getElementById('app').textContent), text(t.win, '.cap-locked .note'));
  t.frame.remove();

  t = await load('#final', allKeys());
  ok('capstone opens with six keys', t.doc.querySelectorAll('[data-cap-station]').length === 6, 'stations=' + t.doc.querySelectorAll('[data-cap-station]').length);
  ok('capstone shows the certificate only after finishing', !t.doc.getElementById('cap-certificate'), '');

  // ---------- B ----------
  const cards = [...t.doc.querySelectorAll('[data-cap-station]')];
  let solved = 0;
  for (const card of cards) {
    for (const btn of [...card.querySelectorAll('[data-cap-choice]')]) {
      btn.click();
      const fb = card.querySelector('.cap-feedback').textContent.trim();
      if (fb.startsWith('\u2713')) { solved++; break; }
    }
  }
  ok('all six stations can be answered correctly', solved === 6, 'solved=' + solved);
  let st = saved();
  ok('a station writes state.capstone.stations', st.capstone && Object.keys(st.capstone.stations).length === 6, JSON.stringify(Object.keys(st.capstone.stations || {})));
  ok('stations award XP', st.xp >= 6 * 15, 'xp=' + st.xp);
  t.frame.remove();

  // ---------- C + D ----------
  t = await load('#final', st);
  const fin = t.doc.getElementById('cap-finish');
  ok('finish is gated before the written synthesis', fin && fin.disabled, 'disabled=' + (fin && fin.disabled));
  const ta = t.doc.getElementById('cap-response');
  ta.value = 'The muscular system needed more ATP, so the respiratory system increased ventilation and brought oxygen into the blood while removing carbon dioxide. The circulatory system raised the heart rate and sent that blood to the working muscles, and the skin lost heat as sweat evaporated, so the kidneys conserved water with ADH. The skeletal system supplied the levers and the ligaments stabilised the ankle.';
  fire(ta, 'input');
  t.doc.getElementById('cap-review').click();
  const boxes = [...t.doc.querySelectorAll('[data-cap-rubric]')];
  ok('the rubric renders for self-assessment', boxes.length === 5, 'boxes=' + boxes.length);
  boxes.slice(0, 3).forEach(b => { b.checked = true; fire(b, 'change'); });
  const fin2 = t.doc.getElementById('cap-finish');
  ok('finish unlocks after the synthesis and rubric', fin2 && !fin2.disabled, 'disabled=' + (fin2 && fin2.disabled));
  const xpBefore = saved().xp;
  fin2.click();
  st = saved();
  ok('finishing sets state.capstone.done', st.capstone && st.capstone.done === true, JSON.stringify(st.capstone && st.capstone.done));
  ok('finishing awards the synthesis XP', st.xp > xpBefore, xpBefore + ' -> ' + st.xp);
  ok('the certificate appears', !!t.doc.getElementById('cap-certificate'), '');
  ok('the certificate carries the student name', /Ahmed/.test(text(t.win, '.cap-cert-name') || ''), text(t.win, '.cap-cert-name'));
  t.frame.remove();

  // ---------- E ----------
  t = await load('#home', allKeys());
  ok('home final-mission card unlocks at 6/6', /Unlocked \u00b7 6\/6 keys/.test(text(t.win, '.final-destination .chip') || ''), text(t.win, '.final-destination .chip'));
  ok('home final-mission card links to the challenge', !!t.doc.querySelector('.final-destination a[href="#final"]'), '');
  t.frame.remove();

  // ---------- F ----------
  t = await load('#dashboard', allKeys());
  ok('dashboard has a capstone section', !!t.doc.querySelector('.cap-dashboard'), '');
  t.frame.remove();
  t = await load('#badges', allKeys());
  ok('badges page shows one collection total', /of \d+ discoveries unlocked/.test(text(t.win, '.cap-total') || ''), text(t.win, '.cap-total'));
  t.frame.remove();

  // ---------- G ----------
  t = await load('#dashboard', allKeys());
  const bars = [...t.doc.querySelectorAll('.bar')];
  const labelled = bars.filter(b => b.getAttribute('role') === 'progressbar' && b.hasAttribute('aria-valuenow'));
  ok('every progress bar exposes a progressbar role', bars.length > 0 && labelled.length === bars.length, labelled.length + '/' + bars.length);
  ok('the document title reflects the route', /My Dashboard/.test(t.win.document.title), t.win.document.title);
  t.frame.remove();

  t = await load('#mission/1', progressed());
  const main = t.doc.getElementById('main');
  ok('focus moves to #main on the first paint', t.doc.activeElement === main, 'active=' + (t.doc.activeElement && t.doc.activeElement.id));
  const toggles = [...t.doc.querySelectorAll('.controls button')];
  ok('skeletal toggles expose aria-pressed', toggles.length === 0 || toggles.every(b => b.hasAttribute('aria-pressed')), 'toggles=' + toggles.length);
  t.frame.remove();

  // ---------- H ----------
  t = await load('#respiratory/mission/1', progressed());
  const stageBtns = [...t.doc.querySelectorAll('[data-lab]')];
  ok('the respiratory lab has stages', stageBtns.length > 1, 'stages=' + stageBtns.length);
  stageBtns[stageBtns.length - 1].click();
  const active = t.doc.querySelectorAll('#resp-visual .is-active').length;
  ok('the respiratory diagram reacts to a stage', active === 1, 'active=' + active);
  t.frame.remove();

  t = await load('#excretory/mission/4', progressed());
  const slider = t.doc.getElementById('adh-level');
  ok('the ADH simulator is present on mission 4', !!slider, '');
  if (slider) {
    slider.value = '85';
    fire(slider, 'input');
    const vol = text(t.win, '#adh-volume');
    ok('the simulator shows a live urine volume', /L \/ day/.test(vol || ''), vol);
    const conc = text(t.win, '#adh-conc');
    ok('the simulator shows a live concentration', /mOsm/.test(conc || ''), conc);
    ok('hitting the target saves the discovery', !!(saved().excretory.steps || {})['4-adh'] || /Discovery saved/.test(text(t.win, '#adh-result') || ''), text(t.win, '#adh-result'));
  }
  t.frame.remove();

  // ---------- I ----------
  t = await load('#home', allKeys());
  const metas = [...t.doc.querySelectorAll('.portal .progress-meta')].map(m => m.textContent.replace(/\s+/g, ' ').trim());
  ok('all six portal cards share one label format', metas.length === 6 && metas.every(m => /% complete/.test(m) && /\d+\/\d+ missions/.test(m)), metas.join(' | ').slice(0, 150));
  t.frame.remove();

  // ---------- errors ----------
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily', '#integumentary', '#respiratory', '#excretory', '#muscle', '#circulatory', '#final', '#sources']) {
    const r = await load(route, allKeys());
    const app = r.doc.getElementById('app');
    ok('route ' + route + ' renders with no error', r.errors.length === 0 && app && app.innerHTML.length > 400, 'errors=' + r.errors.length + ' bytes=' + (app ? app.innerHTML.length : 0));
    r.frame.remove();
  }

  document.getElementById('out').textContent = 'VERIFY-START\n' + results.join('\n') + '\nVERIFY-END';
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
    print("stage-2 verify server on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
