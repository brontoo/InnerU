"""
Verification harness for the muscular figure replacement.

Serves C:\\InnerU read-only (threaded) on 127.0.0.1:8823 and adds /_verify.html.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8823
WAIT = 1300

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>verify</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:1px solid #999;position:fixed;top:0;left:0;opacity:.01;pointer-events:none;z-index:-1}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const results = [];
const ok = (n, c, d) => results.push((c ? 'PASS  ' : 'FAIL  ') + n + (d !== undefined ? '  [' + d + ']' : ''));
function base() {
  return { name:'Explorer', xp:0, done:[], rewards:[], weak:[], level:'Explorer', motion:false,
    integumentary:{done:[]}, respiratory:{done:[]}, excretory:{done:[]},
    circ:{done:[],steps:[],mastery:false,boss:false,heartExplored:[]}, muscle:{done:[1,2],tasks:{},weak:[],xp:0} };
}
function load(route, state, wait) {
  return new Promise(resolve => {
    localStorage.setItem(KEY, JSON.stringify(state));
    const f = document.createElement('iframe');
    const errors = [];
    f.onload = () => { const w = f.contentWindow; w.onerror = m => errors.push(String(m));
      setTimeout(() => resolve({ frame:f, win:w, doc:w.document, errors }), wait || __WAIT__); };
    f.src = '/?nosw' + route; document.body.appendChild(f);
  });
}
const text = (w, sel) => { const e = w.document.querySelector(sel); return e ? e.textContent.replace(/\s+/g,' ').trim() : null; };
const resources = w => w.performance.getEntriesByType('resource').map(r => r.name);
const parts = doc => [...doc.querySelectorAll('[data-part]')];

(async () => {
 try {
  // ================= the figure replaces the model =================
  {
    const t = await load('#muscle', base());
    const figure = t.doc.querySelector('.muscle-figure img');
    ok('the muscle figure is rendered', !!figure, figure ? figure.getAttribute('src') : 'missing');
    ok('it uses the supplied image', !!figure && /muscular-figure\.webp/.test(figure.getAttribute('src')), '');
    ok('it declares its size for layout', !!figure && figure.getAttribute('width') === '900' && figure.getAttribute('height') === '1200', '');
    ok('it carries a written description', !!figure && (figure.getAttribute('alt') || '').length > 40, '');
    ok('there is no 3D mount for this lab', !t.doc.querySelector('.body-atlas[data-atlas="muscular"]'), '');
    ok('the loading placeholder is gone', !t.doc.querySelector('.body-atlas-loading'), '');
    const res = resources(t.win);
    ok('three.js is not downloaded for this lab', !res.some(n => /three\.(module|core)\.js/.test(n)), 'resources=' + res.length);
    ok('the muscular model file is not downloaded', !res.some(n => /muscular-atlas\.glb/.test(n)), '');
    ok('the indicator says front view', /FRONT VIEW/.test(text(t.win, '.body-atlas-indicator') || ''), text(t.win, '.body-atlas-indicator'));
    ok('the model controls are replaced', !t.doc.querySelector('[data-view="back"]') && !!t.doc.querySelector('[data-muscle-clear]'), '');
    ok('the attribution describes the figure', /supplied for this project/i.test(t.doc.querySelector('.body-atlas').textContent), '');
    ok('the muscle list is intact', parts(t.doc).length === 17, 'parts=' + parts(t.doc).length);
    ok('the page renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }

  // ================= selecting a muscle =================
  {
    const t = await load('#muscle', base());
    const biceps = parts(t.doc).find(b => b.dataset.part === 'Biceps');
    biceps.click();
    const glows = t.doc.querySelectorAll('.muscle-glow');
    ok('selecting a muscle marks it on the figure', glows.length === 2, 'glows=' + glows.length);
    ok('the mark is a soft highlight, not a hard shape', /radial-gradient/.test(t.win.getComputedStyle(glows[0]).backgroundImage || ''), '');
    ok('the button reports itself as pressed', biceps.getAttribute('aria-pressed') === 'true', '');
    ok('the panel names the muscle', /Biceps brachii/.test(text(t.win, '.body-atlas-info') || ''), text(t.win, '.body-atlas-info').slice(0, 70));
    ok('the panel explains what it does', /bends the elbow/i.test(text(t.win, '.body-atlas-info') || ''), '');
    const pectorals = parts(t.doc).find(b => b.dataset.part === 'Pectorals');
    pectorals.click();
    ok('only one muscle is highlighted at a time', t.doc.querySelectorAll('.muscle-glow').length === 1, 'glows=' + t.doc.querySelectorAll('.muscle-glow').length);
    ok('the previous button is released', biceps.getAttribute('aria-pressed') === 'false', '');
    pectorals.click();
    ok('clicking the same muscle again clears it', t.doc.querySelectorAll('.muscle-glow').length === 0, '');
    ok('the panel returns to its prompt', /Choose a muscle/.test(text(t.win, '.body-atlas-info') || ''), '');
    t.frame.remove();
  }
  {
    // back-of-the-body muscles must not be marked in the wrong place
    const t = await load('#muscle', base());
    const triceps = parts(t.doc).find(b => b.dataset.part === 'Triceps');
    triceps.click();
    ok('a back-view muscle shows no highlight', t.doc.querySelectorAll('.muscle-glow').length === 0, 'glows=' + t.doc.querySelectorAll('.muscle-glow').length);
    ok('it explains why it is not marked', /back of the body/i.test(text(t.win, '.body-atlas-info') || ''), text(t.win, '.body-atlas-info').slice(0, 80));
    ok('it still describes the muscle', /straightens the elbow/i.test(text(t.win, '.body-atlas-info') || ''), '');
    const clear = t.doc.querySelector('[data-muscle-clear]');
    clear.click();
    ok('clear selection resets the panel', /Choose a muscle/.test(text(t.win, '.body-atlas-info') || '') && triceps.getAttribute('aria-pressed') === 'false', '');
    t.frame.remove();
  }
  {
    // the label toggle and every listed muscle
    const t = await load('#muscle', base());
    const labels = t.doc.querySelector('[data-muscle-labels]');
    labels.click();
    ok('the label toggle flips state', labels.getAttribute('aria-pressed') === 'false' && /Hide|Show/.test(labels.textContent), labels.textContent.trim());
    let withFacts = 0, marked = 0;
    for (const b of parts(t.doc)) {
      b.click();
      const info = text(t.win, '.body-atlas-info') || '';
      if (info.length > 80) withFacts++;
      if (t.doc.querySelectorAll('.muscle-glow').length) marked++;
    }
    ok('every listed muscle has an explanation', withFacts === 17, 'withFacts=' + withFacts);
    ok('the front-view muscles are marked, the back-view ones are not', marked === 13, 'marked=' + marked);
    t.frame.remove();
  }

  // ================= other 3D labs are untouched =================
  {
    const t = await load('#world', base());
    const res = resources(t.win);
    ok('the skeletal lab still loads its 3D module', res.some(n => /body-atlas\.js/.test(n)) && res.some(n => /three\.(module|core)\.js/.test(n)), 'resources=' + res.length);
    ok('the skeletal lab still has its model controls', !!t.doc.querySelector('.body-atlas[data-atlas="skeletal"] [data-view="front"]'), '');
    t.frame.remove();
  }

  // ================= regression sweep =================
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily',
                       '#integumentary', '#respiratory', '#respiratory/mission/4', '#excretory', '#excretory/mission/1',
                       '#muscle', '#muscle/mission/2', '#circulatory', '#final', '#teacher', '#review', '#glossary', '#sources']) {
    const r = await load(route, base(), 1200);
    const app = r.doc.getElementById('app');
    const body = app ? app.innerHTML : '';
    ok('route ' + route + ' renders with no error', r.errors.length === 0 && body.length > 300 && !/muscular-figure\.webp" alt=""\s*>?\s*<\/div>\s*<\/div>\s*$/i.test(body.slice(0, 40)), 'errors=' + r.errors.length + ' bytes=' + body.length);
    r.frame.remove();
  }

  document.getElementById('out').textContent = 'VERIFY-START\n' + results.join('\n') + '\nVERIFY-END';
 } catch (err) {
  document.getElementById('out').textContent = 'VERIFY-START\n' + results.join('\n')
    + '\nHARNESS-ERROR: ' + (err && err.stack ? err.stack.split('\n')[0] : String(err)) + '\nVERIFY-END';
 }
})();
</script></body></html>""".replace("__WAIT__", str(WAIT))


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


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("figure verify server on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
