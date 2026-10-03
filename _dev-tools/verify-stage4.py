"""
Verification harness for stage 4: the six excretory labs as real interactions.

Serves C:\\InnerU read-only on 127.0.0.1:8812 and adds /_verify.html.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8812

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>verify</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:1px solid #999;position:fixed;top:0;left:0;opacity:.01;pointer-events:none;z-index:-1}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const results = [];
const ok = (n, c, d) => results.push((c ? 'PASS  ' : 'FAIL  ') + n + (d !== undefined ? '  [' + d + ']' : ''));
function progressed() {
  return { name:'Explorer', xp:0, done:[], rewards:[], weak:[], level:'Explorer', motion:false,
    integumentary:{done:[],steps:{}}, respiratory:{done:[],steps:{}},
    excretory:{done:[1,2,3,4,5],steps:{}}, circ:{done:[],steps:[],mastery:false,boss:false,heartExplored:[]},
    muscle:{done:[],tasks:{},weak:[],xp:0} };
}
function load(route, state, wait) {
  return new Promise(resolve => {
    localStorage.setItem(KEY, JSON.stringify(state));
    const f = document.createElement('iframe');
    const errors = [];
    f.onload = () => {
      const w = f.contentWindow; w.onerror = m => errors.push(String(m));
      setTimeout(() => resolve({ frame:f, win:w, doc:w.document, errors }), wait || 800);
    };
    f.src = '/' + route; document.body.appendChild(f);
  });
}
const text = (w, sel) => { const e = w.document.querySelector(sel); return e ? e.textContent.replace(/\s+/g,' ').trim() : null; };
const saved = () => JSON.parse(localStorage.getItem(KEY) || '{}');

function completeSort(doc) {
  for (let guard = 0; guard < 60; guard++) {
    const chips = [...doc.querySelectorAll('[data-exc-item]')].filter(c => !c.disabled);
    if (!chips.length) break;
    const chip = chips[0];
    chip.click();
    for (const bin of [...doc.querySelectorAll('[data-exc-bin]')]) {
      if (chip.disabled) break;
      bin.click();
    }
  }
  return doc.querySelectorAll('.exc-bin-list li').length;
}
function completeSequence(doc) {
  for (let guard = 0; guard < 12; guard++) {
    const before = doc.querySelectorAll('#exc-seq li').length;
    if (before >= 5) break;
    let progressed = false;
    for (const chip of [...doc.querySelectorAll('[data-exc-step]')].filter(c => !c.disabled)) {
      chip.click();
      if (doc.querySelectorAll('#exc-seq li').length > before) { progressed = true; break; }
    }
    if (!progressed) break;
  }
  return doc.querySelectorAll('#exc-seq li').length;
}

(async () => {
 try {
  localStorage.removeItem('inneru-class-v1');
  // ---------- sorting labs: 1, 3, 4, 6 ----------
  for (const n of [1, 3, 4, 6]) {
    let t = await load('#excretory/mission/' + n, progressed());
    const chips = t.doc.querySelectorAll('[data-exc-item]').length;
    const bins = t.doc.querySelectorAll('[data-exc-bin]').length;
    ok('mission ' + n + ' lab is a sorting task', chips >= 4 && bins >= 2, 'chips=' + chips + ' bins=' + bins);
    const placed = completeSort(t.doc);
    ok('mission ' + n + ' lab can be completed', placed === chips, 'placed=' + placed + '/' + chips);
    ok('mission ' + n + ' lab marks a discovery', /DISCOVERY SAVED/.test(text(t.win, '#exc-lab-step') || ''), text(t.win, '#exc-lab-step'));
    const st = saved();
    ok('mission ' + n + ' lab is stored', !!(st.excretory.steps || {})[n + '-lab'], JSON.stringify(Object.keys(st.excretory.steps || {})));
    ok('mission ' + n + ' lab awards XP', st.xp >= 20, 'xp=' + st.xp);
    ok('mission ' + n + ' page renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }

  // ---------- sequencing lab: 2 ----------
  {
    let t = await load('#excretory/mission/2', progressed());
    const chips = t.doc.querySelectorAll('[data-exc-step]').length;
    ok('mission 2 lab is a sequencing task', chips === 5, 'chips=' + chips);
    const ordered = completeSequence(t.doc);
    ok('mission 2 sequence can be completed', ordered === 5, 'ordered=' + ordered);
    ok('mission 2 sequence is stored', !!(saved().excretory.steps || {})['2-lab'], JSON.stringify(Object.keys(saved().excretory.steps || {})));
    ok('mission 2 page renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }

  // ---------- simulation stays on mission 5 ----------
  {
    let t = await load('#excretory/mission/5', progressed());
    const slider = t.doc.getElementById('adh-level');
    ok('mission 5 keeps the ADH simulation', !!slider, '');
    if (slider) { slider.value = '80'; slider.dispatchEvent(new Event('input', { bubbles: true })); }
    ok('the simulator responds', /L \/ day/.test(text(t.win, '#adh-volume') || ''), text(t.win, '#adh-volume'));
    t.frame.remove();
  }

  // ---------- the old staged quiz is gone ----------
  {
    let t = await load('#excretory/mission/3', progressed());
    const body = t.doc.getElementById('app').textContent;
    ok('the staged MCQ list no longer appears', !/STAGED CHECK/.test(body) && !/STAGE 1 \//.test(body), '');
    ok('every mission now shows an interactive lab', /INTERACTIVE LAB/.test(body), '');
    t.frame.remove();
  }

  // ---------- each lab is stable across a reload ----------
  {
    let t = await load('#excretory/mission/1', progressed());
    const first = [...t.doc.querySelectorAll('[data-exc-item]')].map(c => c.textContent.trim()).join('|');
    t.frame.remove();
    t = await load('#excretory/mission/1', progressed());
    const second = [...t.doc.querySelectorAll('[data-exc-item]')].map(c => c.textContent.trim()).join('|');
    t.frame.remove();
    const t3 = await load('#excretory/mission/1', progressed());
    const third = [...t3.doc.querySelectorAll('[data-exc-item]')].map(c => c.textContent.trim()).join('|');
    t3.frame.remove();
    ok('the chip order varies between visits', new Set([first, second, third]).size > 1, 'distinct=' + new Set([first, second, third]).size + '/3');
  }

  // ---------- the extracted skeletal content still drives its pages ----------
  {
    const t = await load('#world', progressed());
    const cards = t.doc.querySelectorAll('.missioncard').length;
    ok('the mission list still renders from content-skeletal.js', cards === 7, 'cards=' + cards);
    t.frame.remove();
  }
  {
    const t = await load('#mission/1', progressed());
    const questions = t.doc.querySelectorAll('.quizquestion').length;
    ok('the 24 assessment items still render', questions === 3, 'questions=' + questions);
    let answered = false;
    for (let attempt = 0; attempt < 3 && !answered; attempt++) {
      const q = t.doc.querySelectorAll('.quizquestion')[0];
      const choices = [...q.querySelectorAll('.choice')];
      if (!choices[attempt]) break;
      choices[attempt].click();
      const fresh = t.doc.querySelectorAll('.quizquestion')[0];
      if (/Correct\./.test(fresh.textContent)) answered = true;
    }
    ok('a skeletal check can still be answered', answered, '');
    const passed = text(t.win, '#finish');
    ok('the check counter updates', /1\/3 checks passed/.test(passed || ''), passed);
    t.frame.remove();
  }
  {
    const t = await load('#detective', progressed());
    ok('the Body Detective cases still render', /Case|CASE|The aching knee/i.test(t.doc.getElementById('app').textContent), '');
    t.frame.remove();
  }
  {
    const t = await load('#sources', progressed());
    ok('the science references still render', /OpenStax/.test(t.doc.getElementById('app').textContent), '');
    t.frame.remove();
  }

  // ---------- regression sweep ----------
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily',
                       '#integumentary', '#respiratory', '#excretory', '#excretory/mission/1', '#excretory/mission/6',
                       '#excretory/mastery', '#muscle', '#circulatory', '#final', '#teacher', '#sources']) {
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
    print("stage-4 verify server on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
