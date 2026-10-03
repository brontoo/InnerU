"""
Verification harness v2 for the InnerU stage-1 work.

Serves C:\\InnerU unchanged (read-only) on 127.0.0.1:8805 and adds a virtual page
/_verify.html that seeds localStorage, loads the real site in a same-origin
iframe, drives the DOM, and asserts:

  A  mixQ() exists and spreads the correct answer across all positions
  B  the shuffle is really applied when a mission renders
  C  the explanation is withheld on the first wrong attempt, shown on the second
  D  a wrong answer is recorded in the world's weak list
  E  the dashboard shows that revisit list
  F  the six System Keys are counted centrally (home chip + dashboard stat)
  G  the science corrections are present in the lesson text
  H  every route renders without a script error

Nothing is written to the project.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8805

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>verify</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:1px solid #999;position:absolute;left:-9999px}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const results = [];
const ok = (name, cond, detail) => results.push((cond ? 'PASS  ' : 'FAIL  ') + name + (detail !== undefined ? '  [' + detail + ']' : ''));

const fresh = () => ({ name: 'Explorer', xp: 0, done: [], rewards: [], weak: [], level: 'Explorer', motion: false });

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
const txt = (w, sel) => { const el = w.document.querySelector(sel); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; };
const saved = () => JSON.parse(localStorage.getItem(KEY) || '{}');

(async () => {
  // ---------- A: the mixer spreads the correct answer ----------
  let t = await load('#home', fresh());
  const w = t.win;
  ok('mixQ() is exposed globally', typeof w.eval('typeof mixQ') === 'string' && w.eval('typeof mixQ') === 'function', w.eval('typeof mixQ'));
  const dist = { 0: 0, 1: 0, 2: 0 };
  for (let i = 0; i < 90; i++) { const r = w.eval("mixQ(['stem',['a','b','c'],0,'why'])[2]"); dist[r] = (dist[r] || 0) + 1; }
  ok('mixQ() moves the correct answer to every position', dist[0] > 10 && dist[1] > 10 && dist[2] > 10, JSON.stringify(dist));
  const perm = w.eval("(function(){const o=mixQ(['s',['a','b','c'],2,'w']);return o[1].slice().sort().join('')+':'+o[1][o[2]]})()");
  ok('mixQ() keeps the options intact and points at the same correct text', perm === 'abc:c', perm);
  t.frame.remove();

  // ---------- B: the shuffle reaches the rendered mission ----------
  const orders = [];
  for (let i = 0; i < 4; i++) {
    const r = await load('#respiratory/mission/1', progressed());
    const opts = [...r.doc.querySelectorAll('.resp-question')].map(q => [...q.querySelectorAll('[data-choice]')].map(b => b.textContent.trim()).join('|')).join('#');
    orders.push(opts);
    r.frame.remove();
  }
  ok('rendered question order varies between loads', new Set(orders).size > 1, 'distinct=' + new Set(orders).size + '/4');

  // ---------- B2: the shuffle reaches the other four worlds too ----------
  const worldSig = [
    ['#mission/1', '#quiz [data-q]'],
    ['#integumentary/mission/1', '.resp-question [data-choice]'],
    ['#excretory/mission/1', '.resp-question [data-choice]'],
    ['#circulatory/1', '.circ-question [data-answer]'],
  ];
  for (const [route, sel] of worldSig) {
    const seen = new Set();
    for (let i = 0; i < 3; i++) {
      const r = await load(route, progressed());
      const sig = [...r.doc.querySelectorAll(sel)].map(b => b.textContent.trim()).join('|');
      seen.add(sig);
      r.frame.remove();
    }
    ok('shuffle reaches ' + route, seen.size > 1, 'distinct=' + seen.size + '/3, buttons=' + (seen.size ? [...seen][0].split('|').length : 0));
  }

  // ---------- C/D/E: withheld feedback, weak tracking, dashboard list ----------
  const r1 = await load('#respiratory/mission/1', progressed());
  const q1 = r1.doc.querySelector('.resp-question');
  const buttons = [...q1.querySelectorAll('[data-choice]')];
  let wrongIndex = -1, firstMsg = '', secondMsg = '';
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].click();
    const msg = q1.querySelector('.resp-feedback').textContent.trim();
    if (!msg.startsWith('Correct')) { wrongIndex = i; firstMsg = msg; break; }
  }
  ok('a wrong answer is reachable for the test', wrongIndex >= 0, 'index=' + wrongIndex);
  ok('first wrong attempt withholds the explanation', /^Not yet\./.test(firstMsg) && !/Look again/.test(firstMsg), firstMsg.slice(0, 60));
  if (wrongIndex >= 0) {
    const again = [...q1.querySelectorAll('[data-choice]')][wrongIndex];
    again.click();
    secondMsg = q1.querySelector('.resp-feedback').textContent.trim();
    ok('second wrong attempt shows the explanation', /^Look again\./.test(secondMsg) && secondMsg.length > 40, secondMsg.slice(0, 70));
    const st = saved();
    ok('the wrong answer is stored in the world weak list', Array.isArray(st.respiratory && st.respiratory.weak) && st.respiratory.weak.length > 0, JSON.stringify(st.respiratory && st.respiratory.weak));
    const r2 = await load('#dashboard', st);
    const body = (r2.doc.getElementById('app') || r2.doc.body).textContent;
    ok('the dashboard shows the revisit list', /Revisit:/.test(body), (body.match(/Revisit:[^\n]{0,60}/) || [''])[0]);
    r2.frame.remove();
  }
  r1.frame.remove();

  // ---------- F: the six System Keys ----------
  t = await load('#home', allKeys());
  ok('home chip counts all six keys', /Locked · 6\/6 keys/.test(txt(t.win, '.final-destination .chip') || ''), txt(t.win, '.final-destination .chip'));
  t.frame.remove();
  t = await load('#dashboard', allKeys());
  ok('dashboard key stat counts all six keys', /^6\s*\/\s*6$/.test(txt(t.win, '.command-stats .stat-exhibit:last-child strong') || ''), txt(t.win, '.command-stats .stat-exhibit:last-child strong'));
  t.frame.remove();
  t = await load('#home', fresh());
  ok('fresh student still reads 0/6', /Locked · 0\/6 keys/.test(txt(t.win, '.final-destination .chip') || ''), txt(t.win, '.final-destination .chip'));
  t.frame.remove();

  // ---------- G: science corrections in the rendered lesson text ----------
  const science = [
    ['#excretory/mission/1', 'the liver breaks down excess amino acids', 'liver/bile in excretion'],
    ['#excretory/mission/4', 'the hormone ADH', 'ADH in water reabsorption'],
    ['#respiratory/mission/6', 'smoking and vaping', 'lung-cancer cause'],
    ['#integumentary/mission/4', 'leftover response', 'arrector pili wording'],
  ];
  for (const [route, needle, label] of science) {
    const r = await load(route, progressed());
    const html = (r.doc.getElementById('app') || r.doc.body).textContent.replace(/\s+/g, ' ');
    ok('science: ' + label, html.includes(needle), html.includes(needle) ? '' : 'missing: ' + needle);
    r.frame.remove();
  }
  const rc = await load('#circulatory/6', progressed());
  ok('science: Rh factor is taught', /Rh factor \(positive or negative\)/.test(rc.doc.getElementById('app').textContent), '');
  rc.frame.remove();

  // ---------- H: every route renders cleanly ----------
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily', '#integumentary', '#respiratory', '#excretory', '#muscle', '#circulatory', '#sources']) {
    const r = await load(route, progressed());
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
    print("verify server v2 on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
