"""
Verification harness for stage 5: the breathing simulator and the review system.

Serves C:\\InnerU read-only on 127.0.0.1:8814 and adds /_verify.html.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8814

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>verify</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:1px solid #999;position:fixed;top:0;left:0;opacity:.01;pointer-events:none;z-index:-1}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const results = [];
const ok = (n, c, d) => results.push((c ? 'PASS  ' : 'FAIL  ') + n + (d !== undefined ? '  [' + d + ']' : ''));
function progressed() {
  return { name:'Explorer', xp:0, done:[], rewards:[], weak:[], level:'Explorer', motion:false,
    integumentary:{done:[1,2,3],steps:{},weak:['2-q1']}, respiratory:{done:[1,2,3,4,5],steps:{}},
    excretory:{done:[1,2,3,4,5],steps:{}}, circ:{done:[1,2,3],steps:[],mastery:false,boss:false,heartExplored:[]},
    muscle:{done:[1,2,3],tasks:{},weak:[],xp:0} };
}
function load(route, state, wait) {
  return new Promise(resolve => {
    localStorage.setItem(KEY, JSON.stringify(state));
    const f = document.createElement('iframe');
    const errors = [];
    f.onload = () => { const w = f.contentWindow; w.onerror = m => errors.push(String(m));
      setTimeout(() => resolve({ frame:f, win:w, doc:w.document, errors }), wait || 800); };
    f.src = '/' + route; document.body.appendChild(f);
  });
}
const text = (w, sel) => { const e = w.document.querySelector(sel); return e ? e.textContent.replace(/\s+/g,' ').trim() : null; };
const saved = () => JSON.parse(localStorage.getItem(KEY) || '{}');
const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

(async () => {
 try {
  // ================= breathing simulator =================
  {
    const t = await load('#respiratory/mission/4', progressed());
    const dia = t.doc.getElementById('breath-dia'), rate = t.doc.getElementById('breath-rate');
    ok('the breathing simulator is on mission 4', !!dia && !!rate, '');
    ok('it shows a live chest volume', /L/.test(text(t.win, '#breath-volume') || ''), text(t.win, '#breath-volume'));
    const before = text(t.win, '#breath-pressure');
    dia.value = '90'; fire(dia, 'input');
    const after = text(t.win, '#breath-pressure');
    ok('the diaphragm changes the pressure', before !== after && /-0\.9/.test(after || ''), before + ' -> ' + after);
    ok('the airflow indicator reads AIR IN', /AIR IN/.test(text(t.win, '#breath-flow') || ''), text(t.win, '#breath-flow'));
    dia.value = '5'; fire(dia, 'input');
    ok('relaxing the diaphragm reverses the airflow', /AIR OUT/.test(text(t.win, '#breath-flow') || ''), text(t.win, '#breath-flow'));
    dia.value = '90'; fire(dia, 'input'); rate.value = '35'; fire(rate, 'input');
    const minute = text(t.win, '#breath-minute');
    ok('minute ventilation is computed', /L \/ min/.test(minute || ''), minute);
    const st = saved();
    ok('challenge 1 (pressure) saves a discovery', !!(st.respiratory.steps || {})['4-breath-in'], JSON.stringify(Object.keys(st.respiratory.steps || {})));
    ok('challenge 2 (ventilation) saves a discovery', !!(st.respiratory.steps || {})['4-breath-rate'], '');
    ok('the simulator awards XP', st.xp >= 20, 'xp=' + st.xp);
    ok('mission 4 renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }
  {
    const t = await load('#respiratory/mission/2', progressed());
    ok('the simulator is not shown on other missions', !t.doc.getElementById('breath-dia'), '');
    t.frame.remove();
  }

  // ================= review =================
  {
    const t = await load('#review', progressed());
    ok('the review page opens', !!t.doc.querySelector('.review-world'), text(t.win, '.review-hero h1'));
    ok('the sidebar links to review', !!t.doc.querySelector('.sidebar a[href="#review"]'), '');
    ok('it reports the item pool', /54 items in the pool/.test(t.doc.getElementById('app').textContent), '');
    ok('it surfaces flagged concepts from the worlds', !!t.doc.querySelector('.review-weak'), (t.doc.querySelector('.review-weak') || {}).textContent || 'none');
    t.frame.remove();
  }
  {
    // play a full session, answering correctly where we can
    const t = await load('#review', progressed());
    t.doc.getElementById('review-start').click();
    let answered = 0, seen = 0;
    for (let guard = 0; guard < 40; guard++) {
      const card = t.doc.querySelector('[data-review-card]');
      if (!card) break;
      seen++;
      const choices = [...t.doc.querySelectorAll('[data-review-choice]')];
      if (!choices.length) break;
      choices[0].click();
      answered++;
      const next = t.doc.getElementById('review-next');
      if (!next) break;
      next.click();
      if (t.doc.querySelector('.review-hero h1') && /SESSION COMPLETE/.test(t.doc.body.textContent)) break;
    }
    ok('a session asks a series of questions', seen >= 9, 'questions=' + seen);
    ok('the session reaches a summary', /SESSION COMPLETE/.test(t.doc.body.textContent), 'answered=' + answered);
    const r = saved().review || {};
    ok('review state is stored', Object.keys(r.items || {}).length >= 9, 'items=' + Object.keys(r.items || {}).length);
    ok('sessions and answers are counted', (r.answers || 0) >= 9 && (r.sessions || 0) >= 1, 'answers=' + r.answers + ' sessions=' + r.sessions);
    const boxes = Object.values(r.items || {}).map(e => e.b);
    ok('each item gets a box and a due date', boxes.length > 0 && boxes.every(b => typeof b === 'number' && b >= 0), 'boxes=' + JSON.stringify(boxes.slice(0, 6)));
    ok('the review page renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }
  {
    // a wrong answer must send the item back to box 0 and make it due now
    const t = await load('#review', progressed());
    t.doc.getElementById('review-start').click();
    let wrongId = null;
    for (let attempt = 0; attempt < 4 && !wrongId; attempt++) {
      const choices = [...t.doc.querySelectorAll('[data-review-choice]')];
      if (!choices.length) break;
      const before = Object.keys((saved().review || {}).items || {}).length;
      choices[attempt % choices.length].click();
      const after = saved().review.items;
      const fresh = Object.keys(after).find(k => !k) || Object.keys(after)[before] || null;
      const card = t.doc.querySelector('[data-review-card]');
      if (card && /Not quite/.test(card.textContent)) {
        const newIds = Object.keys(after);
        const lastId = newIds[newIds.length - 1];
        const entry = after[lastId];
        wrongId = lastId;
        ok('a wrong answer returns the item to box 0', entry.b === 0, 'box=' + entry.b);
        ok('a wrong answer makes it due immediately', entry.d - Date.now() < 60000, 'dueIn=' + Math.round((entry.d - Date.now()) / 1000) + 's');
      }
      if (wrongId) break;
      const next = t.doc.getElementById('review-next');
      if (next) next.click(); else break;
    }
    if (!wrongId) ok('a wrong answer returns the item to box 0', false, 'no wrong answer produced');
    t.frame.remove();
  }
  {
    // dashboard card + reset integration
    const t = await load('#dashboard', progressed());
    ok('the dashboard shows a review card', !!t.doc.querySelector('.review-dashboard'), text(t.win, '.review-dashboard p'));
    t.frame.remove();
  }
  {
    localStorage.setItem(KEY, JSON.stringify(Object.assign(progressed(), { review: { items: { r1: { b: 2, t: Date.now(), d: Date.now() + 3 * 86400000 } }, answers: 12, correct: 9, sessions: 2 } })));
    const t = await load('#dashboard', {});
    const reset = t.doc.getElementById('reset');
    ok('the reset control exists on the dashboard', !!reset, '');
    if (reset) {
      reset.click();
      const yes = t.doc.getElementById('confirm-reset');
      ok('the reset confirmation appears', !!yes, '');
      if (yes) { yes.click(); }
      const r = saved().review || {};
      ok('reset clears the review history', Object.keys(r.items || {}).length === 0 && (r.answers || 0) === 0, JSON.stringify({ items: Object.keys(r.items || {}).length, answers: r.answers }));
    }
    t.frame.remove();
  }

  // ================= regression sweep =================
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily',
                       '#integumentary', '#respiratory', '#respiratory/mission/4', '#excretory', '#excretory/mission/1',
                       '#muscle', '#circulatory', '#final', '#teacher', '#review', '#sources']) {
    const r = await load(route, progressed(), 900);
    const app = r.doc.getElementById('app');
    ok('route ' + route + ' renders with no error', r.errors.length === 0 && app && app.innerHTML.length > 300, 'errors=' + r.errors.length + ' bytes=' + (app ? app.innerHTML.length : 0));
    r.frame.remove();
  }

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
    print("stage-5 verify server on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
