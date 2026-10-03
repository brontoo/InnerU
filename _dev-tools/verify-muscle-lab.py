"""
Verification harness for the muscular lab, matching the other systems.

One frame carries every muscular check (the route fetches three.js plus 4.7 MB of
meshes, so loading it repeatedly made the checks time out), and the assertions read
the animation targets rather than a half-finished transition.

Serves C:\\InnerU read-only (threaded) on 127.0.0.1:8826 and adds /_verify.html.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8826

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>verify</title>
<style>body{font:12px monospace}iframe{width:1300px;height:940px;border:1px solid #999;position:fixed;top:0;left:0;opacity:.01;pointer-events:none;z-index:-1}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const results = [];
const ok = (n, c, d) => results.push((c ? 'PASS  ' : 'FAIL  ') + n + (d !== undefined ? '  [' + d + ']' : ''));
const sleep = ms => new Promise(r => setTimeout(r, ms));
function base() {
  return { name:'Explorer', xp:0, done:[], rewards:[], weak:[], level:'Explorer', motion:false,
    integumentary:{done:[]}, respiratory:{done:[]}, excretory:{done:[]},
    circ:{done:[],steps:[],mastery:false,boss:false,heartExplored:[]}, muscle:{done:[1,2],tasks:{},weak:[],xp:0} };
}
function load(route, state) {
  return new Promise(resolve => {
    localStorage.setItem(KEY, JSON.stringify(state || base()));
    const f = document.createElement('iframe');
    const errors = [];
    f.onload = () => {
      const w = f.contentWindow;
      w.onerror = m => errors.push(String(m));
      const bring = () => { try { const el = w.document.querySelector('.body-atlas-stage, .body-atlas, .anatomy-lab'); if (el) w.scrollTo(0, el.getBoundingClientRect().top + w.scrollY - 30); } catch (e) {} };
      setTimeout(() => { bring(); setTimeout(bring, 600); resolve({ frame:f, win:w, doc:w.document, errors }); }, 500);
    };
    f.src = '/?nosw' + route;
    document.body.appendChild(f);
  });
}
const text = (w, sel) => { const e = w.document.querySelector(sel); return e ? e.textContent.replace(/\s+/g,' ').trim() : null; };
const stats = t => (t.win.inneruAtlasState ? t.win.inneruAtlasState() : null);
async function settle(t, iters) {
  for (let i = 0; i < (iters || 900); i++) {
    const s = stats(t);
    if (s && s.meshes > 0) { await sleep(300); return stats(t); }
    await sleep(60);
  }
  return stats(t);
}
async function until(fn, iters) {
  for (let i = 0; i < (iters || 500); i++) { if (fn()) return true; await sleep(60); }
  return fn();
}
const part = (t, name) => [...t.doc.querySelectorAll('[data-part]')].find(b => b.dataset.part === name);

(async () => {
 try {
  // ================================================== the muscular lab
  {
    const t = await load('#muscle');
    const st = await settle(t);
    ok('the muscular lab is a 3D atlas like the others', !!t.doc.querySelector('.body-atlas[data-atlas="muscular"]'), '');
    ok('it mounts a 3D canvas', !!t.doc.querySelector('.body-atlas-stage canvas'), 'canvas=' + !!t.doc.querySelector('.body-atlas-stage canvas'));
    ok('the model is in the scene', !!st && st.meshes >= 40, 'meshes=' + (st || {}).meshes);
    ok('no dot or figure overlay is left', t.doc.querySelectorAll('.mf-dot, .muscle-figure, .mf-hotspots').length === 0, 'leftovers=' + t.doc.querySelectorAll('.mf-dot, .muscle-figure, .mf-hotspots').length);
    ok('the standard model controls are present and enabled', ['front','back','reset','in','out'].every(v => { const b = t.doc.querySelector('[data-view="' + v + '"]'); return b && !b.disabled; }), '');
    ok('the badge says 3D', /3D · ROTATABLE/.test(text(t.win, '.body-atlas-indicator') || ''), text(t.win, '.body-atlas-indicator'));
    ok('drag rotation is enabled on the controls', !!st && st.rotatable === true, 'rotatable=' + (st || {}).rotatable);

    // ---- rotation
    const before = (stats(t) || {}).camera;
    const stage = t.doc.querySelector('.body-atlas-stage');
    stage.focus();
    stage.dispatchEvent(new t.win.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    stage.dispatchEvent(new t.win.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    const turned = await until(() => { const c = (stats(t) || {}).camera; return c && before && (Math.abs(c[0] - before[0]) + Math.abs(c[2] - before[2]) > 0.05); });
    ok('the model turns', turned, JSON.stringify(before) + ' -> ' + JSON.stringify((stats(t) || {}).camera));
    t.doc.querySelector('[data-view="back"]').click();
    const toBack = await until(() => { const s = stats(t); return s && ((s.camera && s.camera[2] < -2) || (s.goal && s.goal[2] < -2)); });
    ok('the Back control turns it around', toBack, 'camera=' + JSON.stringify((stats(t) || {}).camera) + ' goal=' + JSON.stringify((stats(t) || {}).goal));
    t.doc.querySelector('[data-view="front"]').click();
    const toFront = await until(() => { const s = stats(t); return s && ((s.camera && s.camera[2] > 2) || (s.goal && s.goal[2] > 2)); });
    ok('the Front control brings it back', toFront, 'camera=' + JSON.stringify((stats(t) || {}).camera));

    // ---- translucency
    const rest = (stats(t) || {});
    ok('the body is translucent at rest', rest.shellOpacity > 0.5 && rest.shellOpacity < 0.7, 'shell=' + rest.shellOpacity);

    // ---- selection from the muscle list
    part(t, 'Biceps').click();
    await sleep(400);
    const sel = (stats(t) || {});
    ok('choosing a muscle spotlights exactly that muscle', sel.selection === 'Biceps' && sel.focusedTarget >= 2 && sel.focusedTarget <= 8, 'selection=' + sel.selection + ' lit=' + sel.focusedTarget);
    ok('every other muscle fades', sel.fadedTarget >= 20, 'faded=' + sel.fadedTarget);
    ok('the body shell becomes see-through', sel.shellOpacity <= 0.06, 'shell=' + sel.shellOpacity);
    ok('the camera frames the selected muscle', !!(sel.camera && sel.camera[2] > 2.5) || !!(sel.goal && sel.goal[2] > 2.5), 'camera=' + JSON.stringify(sel.camera) + ' goal=' + JSON.stringify(sel.goal));
    ok('the panel describes the muscle', /Biceps brachii/.test(text(t.win, '.body-atlas-info') || ''), (text(t.win, '.body-atlas-info') || '').slice(0, 56));

    // ---- selection on the model itself (hotspot buttons over the mesh)
    const hot = t.doc.querySelector('.body-atlas-hotspots .body-atlas-hotspot');
    ok('the model carries its own hotspots', !!hot, hot ? (hot.getAttribute('aria-label') || 'hotspot') : 'none');
    if (hot) {
      const before2 = (stats(t) || {}).selection;
      hot.click();
      await sleep(500);
      const s2 = stats(t);
      ok('tapping a hotspot on the model selects a muscle', !!s2 && !!s2.selection && s2.selection !== before2, 'selection=' + (s2 || {}).selection);
      const pressed = [...t.doc.querySelectorAll('.body-atlas-side [data-part][aria-pressed="true"]')].map(b => b.dataset.part);
      ok('the list follows the model', pressed.length === 1 && pressed[0] === (s2 || {}).selection, 'pressed=' + JSON.stringify(pressed));
    }

    // ---- a muscle on the back turns the model around
    part(t, 'Latissimus dorsi').click();
    const flipped = await until(() => { const s = stats(t); return s && ((s.goal && s.goal[2] < -2) || (s.camera && s.camera[2] < -2)); });
    const s3 = stats(t);
    ok('a back muscle turns the model to the back', flipped, 'goal=' + JSON.stringify((s3 || {}).goal) + ' camera=' + JSON.stringify((s3 || {}).camera));
    ok('it spotlights that muscle', !!s3 && s3.focusedTarget >= 1, 'lit=' + (s3 || {}).focusedTarget);

    // ---- reset
    t.doc.querySelector('[data-view="reset"]').click();
    await sleep(400);
    const r = stats(t);
    ok('reset clears the selection', !!r && !r.selection && r.shellOpacity > 0.5, 'selection=' + (r || {}).selection + ' shell=' + (r || {}).shellOpacity);
    ok('the muscular page renders without error', t.errors.length === 0, t.errors.join(' | '));

    // ---- every listed muscle is wired to geometry
    const names = [...t.doc.querySelectorAll('.body-atlas-side [data-part]')].map(b => b.dataset.part);
    let wired = 0;
    for (const n of names) {
      part(t, n).click();
      await sleep(60);
      const s = stats(t);
      if (s && s.selection === n && s.focusedTarget > 0) wired++;
    }
    ok('every muscle in the list lights up its geometry', wired === names.length, wired + '/' + names.length);
    t.frame.remove();
  }

  // ================================================== other labs and routes
  for (const [route, kind] of [['#world','skeletal'], ['#excretory','excretory']]) {
    const t = await load(route);
    const st = await settle(t, 3000);
    ok('the ' + kind + ' lab still mounts its model', !!st && st.kind === kind && st.meshes > 0, 'meshes=' + (st || {}).meshes);
    t.frame.remove();
  }
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily',
                       '#integumentary', '#respiratory', '#respiratory/mission/4', '#excretory', '#excretory/mission/1',
                       '#muscle', '#muscle/mission/2', '#circulatory', '#final', '#teacher', '#review', '#glossary', '#sources']) {
    const r = await load(route);
    await sleep(700);
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


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("muscle lab harness on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
