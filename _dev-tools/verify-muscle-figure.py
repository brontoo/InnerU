"""
Verification harness for the muscular figure: rotation, translucency and per-part
selection from the list and from the figure itself.

Serves C:\\InnerU read-only (threaded) on 127.0.0.1:8825 and adds /_verify.html.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8825
WAIT = 1400

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
const st = t => t.win.inneruMuscleFigure.state();
const rot = t => { const el = t.doc.querySelector('.mf-tilt'); return el ? (el.style.getPropertyValue('--ry') || '0deg') : null; };

const MUSCLES = ['Sternocleidomastoid','Masseter','Temporalis','Deltoids','Pectorals','Biceps','Forearms','Trapezius',
                 'Rectus abdominis','External oblique','Quadriceps','Calves','Tibialis anterior',
                 'Triceps','Latissimus dorsi','Gluteals','Hamstrings'];
const BEHIND = ['Triceps','Latissimus dorsi','Gluteals','Hamstrings'];

(async () => {
 try {
  // ================= structure =================
  {
    const t = await load('#muscle', base());
    ok('the supplied figure is still the visual', !!t.doc.querySelector('.muscle-figure img'), '');
    ok('it is layered for the spotlight', !!t.doc.querySelector('.mf-base') && t.doc.querySelectorAll('.mf-lit').length === 2, 'lit layers=' + t.doc.querySelectorAll('.mf-lit').length);
    ok('the figure has a rotation layer', !!t.doc.querySelector('.mf-tilt'), '');
    ok('the rotation controls are present', !!t.doc.querySelector('[data-muscle-spin]') && !!t.doc.querySelector('[data-muscle-reset]'), text(t.win, '[data-muscle-spin]'));
    ok('the badge says it is rotatable', /ROTATABLE/.test(text(t.win, '.body-atlas-indicator') || ''), text(t.win, '.body-atlas-indicator'));
    ok('the loading placeholder is gone', !t.doc.querySelector('.body-atlas-loading'), '');
    ok('no 3D model is mounted for this lab', !t.doc.querySelector('.body-atlas[data-atlas="muscular"]'), '');
    ok('three.js is still not downloaded here', !resources(t.win).some(n => /three\.(module|core)\.js/.test(n)), 'resources=' + resources(t.win).length);
    ok('every muscle has a dot on the figure', MUSCLES.every(m => t.doc.querySelector('.mf-dot[data-part="' + m + '"]')), 'dots=' + st(t).dots);
    const box = t.doc.querySelector('.mf-tilt').getBoundingClientRect();
    const dots = [...t.doc.querySelectorAll('.mf-dot')];
    const placed = dots.filter(d => {
      const r = d.getBoundingClientRect();
      const cx = (r.left + r.width / 2 - box.left) / box.width * 100;
      const cy = (r.top + r.height / 2 - box.top) / box.height * 100;
      return cx > 4 && cx < 96 && cy > 1 && cy < 99;
    });
    ok('every dot sits on the figure at its own position', placed.length === dots.length, placed.length + '/' + dots.length + ' placed');
    const stacked = dots.filter(d => { const r = d.getBoundingClientRect(); return Math.abs(r.left - dots[0].getBoundingClientRect().left) < 1 && Math.abs(r.top - dots[0].getBoundingClientRect().top) < 1; }).length;
    ok('no two dots are stacked on top of each other', stacked <= 2, 'at the same spot=' + stacked);
    ok('the four back muscles are dotted differently', t.doc.querySelectorAll('.mf-dot.is-behind').length === 8, 'behind dots=' + t.doc.querySelectorAll('.mf-dot.is-behind').length);
    {
      const d0 = t.doc.querySelector('.mf-dot');
      const cs = t.win.getComputedStyle(d0);
      const r = d0.getBoundingClientRect();
      const round = parseFloat(cs.borderRadius) >= r.width / 2 - 1 || cs.borderRadius.includes('%');
      ok('the dots are small round markers, not buttons', Math.round(r.width) <= 28 && Math.abs(r.width - r.height) <= 2 && round,
        'rendered=' + Math.round(r.width) + 'x' + Math.round(r.height) + ' radius=' + cs.borderRadius + ' padding=' + cs.padding);
      ok('the atlas button styling does not leak in', cs.minHeight === '0px' && cs.padding === '0px',
        'min-height=' + cs.minHeight + ' padding=' + cs.padding);
    }
    ok('the page renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }

  // ================= rotation =================
  {
    const t = await load('#muscle', base());
    const el = t.doc.querySelector('.mf-tilt');
    const before = rot(t);
    const rect = el.getBoundingClientRect();
    const ev = (type, x, y) => new t.win.PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 });
    el.dispatchEvent(ev('pointerdown', rect.left + 100, rect.top + 100));
    el.dispatchEvent(ev('pointermove', rect.left + 190, rect.top + 100));
    const dragged = rot(t);
    el.dispatchEvent(ev('pointerup', rect.left + 190, rect.top + 100));
    ok('dragging turns the figure', parseFloat(dragged) > 5, before + ' -> ' + dragged);
    const spin = t.doc.querySelector('[data-muscle-spin]');
    spin.click();
    ok('auto rotate can be switched on', spin.getAttribute('aria-pressed') === 'true', '');
    await new Promise(r => setTimeout(r, 900));
    ok('auto rotate keeps turning it', st(t).spinning === true && rot(t) !== '0deg', 'spinning=' + st(t).spinning + ' angle=' + rot(t));
    spin.click();
    ok('auto rotate can be switched off', spin.getAttribute('aria-pressed') === 'false', '');
    t.doc.querySelector('[data-muscle-reset]').click();
    ok('reset view returns it to the front', Math.abs(parseFloat(rot(t))) < 0.01, rot(t));
    const stage = t.doc.querySelector('.body-atlas-stage');
    stage.dispatchEvent(new t.win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    ok('the arrow keys turn it too', parseFloat(rot(t)) > 5, rot(t));
    t.doc.querySelector('[data-muscle-reset]').click();
    t.frame.remove();
  }

  // ================= selection from the list =================
  {
    const t = await load('#muscle', base());
    const btn = [...t.doc.querySelectorAll('.body-atlas-side [data-part]')].find(b => b.dataset.part === 'Biceps');
    btn.click();
    const s = st(t);
    ok('choosing a muscle spotlights it', s.selected === 'Biceps' && s.spotlit === 2, JSON.stringify(s));
    ok('the body turns translucent while it is selected', !!t.doc.querySelector('.muscle-figure.has-selection'), '');
    ok('the spotlight is masked to that muscle', /radial-gradient/.test(t.doc.querySelector('.mf-lit.is-on').style.maskImage || t.doc.querySelector('.mf-lit.is-on').style.webkitMaskImage || ''), '');
    ok('a ring marks the muscle', t.doc.querySelectorAll('.mf-mark').length === 2, 'marks=' + t.doc.querySelectorAll('.mf-mark').length);
    ok('the list button reports the selection', btn.getAttribute('aria-pressed') === 'true', '');
    ok('the dots report the selection too', t.doc.querySelectorAll('.mf-dot[data-part="Biceps"][aria-pressed="true"]').length === 2, '');
    ok('the panel names the muscle and explains it', /Biceps brachii/.test(text(t.win, '.body-atlas-info') || '') && /bends the elbow/.test(text(t.win, '.body-atlas-info') || ''), '');
    btn.click();
    ok('choosing it again clears the selection', st(t).selected === null && !t.doc.querySelector('.muscle-figure.has-selection'), '');
    t.frame.remove();
  }

  // ================= selection from the figure =================
  {
    const t = await load('#muscle', base());
    t.doc.querySelector('.mf-dot[data-part="Quadriceps"]').click();
    ok('tapping a dot on the figure selects that muscle', st(t).selected === 'Quadriceps', JSON.stringify(st(t)));
    ok('the panel follows the tap', /straighten the knee/.test(text(t.win, '.body-atlas-info') || ''), text(t.win, '.body-atlas-info').slice(0, 60));
    const listBtn = [...t.doc.querySelectorAll('.body-atlas-side [data-part]')].find(b => b.dataset.part === 'Quadriceps');
    ok('the list stays in sync with the figure', listBtn.getAttribute('aria-pressed') === 'true', '');
    t.frame.remove();
  }

  // ================= every part responds =================
  {
    const t = await load('#muscle', base());
    const problems = [];
    for (const name of MUSCLES) {
      t.win.inneruMuscleFigure.select(name);
      const s = st(t);
      const panel = text(t.win, '.body-atlas-info') || '';
      const pressed = t.doc.querySelectorAll('.mf-dot[data-part="' + name + '"][aria-pressed="true"]').length;
      const behind = BEHIND.includes(name);
      const problems_ = [];
      if (s.selected !== name) problems_.push('not selected');
      if (panel.length < 90) problems_.push('no explanation');
      if (!pressed) problems_.push('dot not pressed');
      if (behind) {
        if (s.spotlit !== 0) problems_.push('spotlit a back muscle');
        if (s.marks !== 2) problems_.push('no dashed ring (' + s.marks + ')');
        if (!/back of the body/i.test(panel)) problems_.push('no back note');
      } else {
        if (s.spotlit < 1) problems_.push('not spotlit');
        if (s.marks < 1) problems_.push('no ring');
      }
      if (problems_.length) problems.push(name + ': ' + problems_.join(', '));
    }
    ok('all 17 muscles respond to their own selection', problems.length === 0, problems.slice(0, 3).join(' | ') || '17/17');
    t.win.inneruMuscleFigure.select(null);
    ok('clearing removes the spotlight and the rings', st(t).spotlit === 0 && st(t).marks === 0 && !t.doc.querySelector('.muscle-figure.has-selection'), '');
    t.frame.remove();
  }

  // ================= labels toggle =================
  {
    const t = await load('#muscle', base());
    const labels = t.doc.querySelector('[data-muscle-labels]');
    ok('labels start hidden so the figure stays readable', t.doc.querySelector('.mf-hotspots').classList.contains('labels-off'), labels.textContent.trim());
    labels.click();
    ok('labels can be shown', !t.doc.querySelector('.mf-hotspots').classList.contains('labels-off'), labels.textContent.trim());
    labels.click();
    ok('labels can be hidden again', t.doc.querySelector('.mf-hotspots').classList.contains('labels-off'), labels.textContent.trim());
    t.frame.remove();
  }

  // ================= regression sweep =================
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily',
                       '#integumentary', '#respiratory', '#respiratory/mission/4', '#excretory', '#excretory/mission/1',
                       '#muscle', '#muscle/mission/2', '#circulatory', '#final', '#teacher', '#review', '#glossary', '#sources']) {
    const r = await load(route, base(), 1200);
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
    print("muscle figure harness on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
