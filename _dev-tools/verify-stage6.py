"""
Verification harness for stage 6: the habit layer and the force simulator.

Serves C:\\InnerU read-only on 127.0.0.1:8817 and adds /_verify.html.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8817

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>verify</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:1px solid #999;position:fixed;top:0;left:0;opacity:.01;pointer-events:none;z-index:-1}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const results = [];
const ok = (n, c, d) => results.push((c ? 'PASS  ' : 'FAIL  ') + n + (d !== undefined ? '  [' + d + ']' : ''));
const DAY = 86400000;
const iso = t => new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
function base() {
  return { name:'Explorer', xp:0, done:[], rewards:[], weak:[], level:'Explorer', motion:false,
    integumentary:{done:[],steps:{}}, respiratory:{done:[],steps:{}}, excretory:{done:[1,2,3],steps:{}},
    circ:{done:[],steps:[],mastery:false,boss:false,heartExplored:[]}, muscle:{done:[1],tasks:{},weak:[],xp:0} };
}
function withDue() {
  const s = base();
  s.review = { items: { r0:{b:3,t:Date.now()-2*DAY,d:Date.now()-DAY}, r1:{b:0,t:Date.now()-3*DAY,d:Date.now()-DAY} }, answers:8, correct:6, sessions:1 };
  return s;
}
function load(route, state, wait) {
  return new Promise(resolve => {
    localStorage.setItem(KEY, JSON.stringify(state));
    const f = document.createElement('iframe');
    const errors = [];
    f.onload = () => { const w = f.contentWindow; w.onerror = m => errors.push(String(m));
      setTimeout(() => resolve({ frame:f, win:w, doc:w.document, errors }), wait || 800); };
    f.src = '/?nosw' + route; document.body.appendChild(f);
  });
}
const text = (w, sel) => { const e = w.document.querySelector(sel); return e ? e.textContent.replace(/\s+/g,' ').trim() : null; };
const saved = () => JSON.parse(localStorage.getItem(KEY) || '{}');
const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

(async () => {
 try {
  // ================= habit layer =================
  {
    const t = await load('#dashboard', base());
    ok('the dashboard shows the habit card', !!t.doc.querySelector('.habit-card'), text(t.win, '.habit-card h2'));
    ok('it shows a fourteen day strip', t.doc.querySelectorAll('.habit-dot').length === 14, 'dots=' + t.doc.querySelectorAll('.habit-dot').length);
    ok("today's plan lists three items", t.doc.querySelectorAll('.habit-plan li').length === 3, 'items=' + t.doc.querySelectorAll('.habit-plan li').length);
    ok('the topbar shows a streak chip', !!t.doc.querySelector('.habit-chip'), text(t.win, '.habit-chip'));
    t.frame.remove();
  }
  {
    // activity on a fresh state starts a streak of 1
    const t = await load('#mission/1', base());
    const h = saved().habit || {};
    ok('visiting a mission records the day', h.last === iso(Date.now()) && h.streak === 1, JSON.stringify({ last: h.last, streak: h.streak }));
    t.frame.remove();
  }
  {
    // a streak continues if the last day was yesterday
    const y = iso(Date.now() - DAY);
    const state = Object.assign(base(), { habit: { last: y, streak: 4, best: 6, days: { [y]: 1 }, dismissed: '' } });
    const t = await load('#mission/1', state);
    const h = saved().habit || {};
    ok('yesterday\u2019s streak continues to 5', h.streak === 5 && h.best === 6, JSON.stringify({ streak: h.streak, best: h.best }));
    t.frame.remove();
  }
  {
    // a broken streak restarts at 1 and best is kept
    const old = iso(Date.now() - 5 * DAY);
    const state = Object.assign(base(), { habit: { last: old, streak: 9, best: 12, days: {}, dismissed: '' } });
    const t = await load('#mission/1', state);
    const h = saved().habit || {};
    ok('a broken streak restarts at 1 while best is kept', h.streak === 1 && h.best === 12, JSON.stringify({ streak: h.streak, best: h.best }));
    t.frame.remove();
  }
  {
    // the due banner appears, can be dismissed for the day, and never shows on review
    const t = await load('#home', withDue());
    ok('a due banner appears on the home page', !!t.doc.getElementById('habit-banner'), text(t.win, '.habit-banner b'));
    t.doc.getElementById('habit-later').click();
    ok('dismissing it stores today', (saved().habit || {}).dismissed === iso(Date.now()), (saved().habit || {}).dismissed);
    const after = saved();
    t.frame.remove();
    const t2 = await load('#home', after);
    ok('the banner stays hidden after dismissal', !t2.doc.getElementById('habit-banner'), '');
    t2.frame.remove();
    const t3 = await load('#review', withDue());
    ok('the banner is not shown on the review page', !t3.doc.getElementById('habit-banner'), '');
    t3.frame.remove();
  }
  {
    const t = await load('#dashboard', withDue());
    ok('the plan quotes the real due count', /2 review item\(s\) due/.test(text(t.win, '.habit-plan') || ''), text(t.win, '.habit-plan'));
    t.frame.remove();
  }

  // ================= force simulator =================
  {
    const t = await load('#muscle/mission/2', base());
    const stim = t.doc.getElementById('mf-stim'), loadSlider = t.doc.getElementById('mf-load');
    ok('the force simulator appears on muscle mission 2', !!stim && !!loadSlider, '');
    ok('it reports motor units and force', /N/.test(text(t.win, '#mf-force') || ''), text(t.win, '#mf-force') + ' / units ' + text(t.win, '#mf-units'));
    const heavy = text(t.win, '#mf-state');
    stim.value = '100'; fire(stim, 'input');
    const lifted = text(t.win, '#mf-state');
    ok('enough stimulation lifts the load', heavy !== lifted && /LIFTS/.test(lifted), heavy + ' -> ' + lifted);
    stim.value = '20'; fire(stim, 'input');
    ok('too little stimulation cannot lift it', /TOO HEAVY/.test(text(t.win, '#mf-state') || ''), text(t.win, '#mf-state'));
    ok('the lift challenge awards XP', (saved().rewards || []).includes('force-lift'), JSON.stringify((saved().rewards || []).slice(-3)));
    t.frame.remove();
  }
  {
    const t = await load('#muscle/mission/2', base());
    const stim = t.doc.getElementById('mf-stim');
    stim.value = '70'; fire(stim, 'input');
    t.doc.getElementById('mf-hold').click();
    const startForce = text(t.win, '#mf-force');
    await new Promise(r => setTimeout(r, 2200));
    const fatigueText = text(t.win, '#mf-fatigue');
    ok('holding the load builds fatigue', /[1-9]\d*%/.test(fatigueText || ''), 'fatigue=' + fatigueText + ' force=' + startForce);
    t.doc.getElementById('mf-reset').click();
    ok('fatigue can be reset', /^0%$/.test(text(t.win, '#mf-fatigue') || ''), text(t.win, '#mf-fatigue'));
    ok('mission 2 renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }
  {
    const t = await load('#muscle/mission/3', base());
    ok('the simulator is not shown on other muscle missions', !t.doc.getElementById('mf-stim'), '');
    t.frame.remove();
  }

  // ================= regression sweep =================
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily',
                       '#integumentary', '#respiratory', '#excretory', '#excretory/mission/1', '#muscle',
                       '#muscle/mission/2', '#circulatory', '#final', '#teacher', '#review', '#sources']) {
    const r = await load(route, withDue(), 900);
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
    print("stage-6 verify server on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
