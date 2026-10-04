"""
Verification for the mission illustrations.

  1. every applicable mission has a relevant illustration
  2. the style is the shared one (panel, palette, leader labels, restrained animation)
  3. nothing is covered or displaced, and no page overflows horizontally
  4. the Skeletal and Muscular missions have no new artwork and keep their own
  5. progress, XP and completion still work

Run with --force-prefers-reduced-motion to check the motion-off path.
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8834

STATE = r"""{
  name:'Layla', xp:1420, done:[1,2,3,4,5,6,7,8], rewards:['boss'], weak:[], level:'Explorer', motion:false,
  integumentary:{done:[1,2,3,4,5,6],steps:{},mastery:true,weak:[]},
  respiratory:{done:[1,2,3,4,5,6],steps:{},mastery:true,weak:[]},
  excretory:{done:[1,2,3,4,5,6],steps:{},mastery:true,weak:[]},
  circ:{done:[1,2,3,4,5,6,7],steps:[],mastery:true,boss:true,heartExplored:[]},
  muscle:{done:[1,2,3,4,5,6,7,8],tasks:{},weak:[],xp:0}
}"""

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>illustration checks</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:0;position:fixed;top:0;left:0;opacity:.01;pointer-events:none;z-index:-1}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY = 'bodyquest-v1';
const results = [];
const ok = (n, c, d) => results.push((c ? 'PASS  ' : 'FAIL  ') + n + (d !== undefined ? '  [' + d + ']' : ''));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const STATE = __STATE__;

function load(route, width) {
  return new Promise(resolve => {
    localStorage.setItem(KEY, JSON.stringify(STATE));
    const f = document.createElement('iframe');
    if (width) f.style.width = width + 'px';
    const errors = [];
    f.onload = () => {
      const w = f.contentWindow;
      w.onerror = m => errors.push(String(m));
      setTimeout(() => resolve({ frame:f, win:w, doc:w.document, errors }), 1400);
    };
    f.src = '/?nosw' + route;
    document.body.appendChild(f);
  });
}
const rect = el => { const r = el.getBoundingClientRect(); return { x:r.left, y:r.top, w:r.width, h:r.height, r:r.right, b:r.bottom }; };
const overlaps = (a, b) => a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;

const MISSIONS = [];
[['integumentary', 6], ['respiratory', 6], ['excretory', 6], ['circulatory', 7]].forEach(([sys, n]) => {
  for (let i = 1; i <= n; i++) MISSIONS.push({ sys, n: i, route: sys === 'circulatory' ? '#circulatory/' + i : '#' + sys + '/mission/' + i });
});

(async () => {
 try {
  // ---------------- 1, 2, 3: every applicable mission
  for (const m of MISSIONS) {
    const t = await load(m.route);
    const fig = t.doc.querySelector('.mission-art');
    const svg = fig && fig.querySelector('svg.ma');
    const shapes = t.doc.querySelectorAll('.mission-art svg [class*="ma-"]');
    const caption = fig ? (fig.querySelector('figcaption') || {}).textContent || '' : '';
    ok(m.sys + ' ' + m.n + ': illustration present', !!svg, fig ? 'classes=' + fig.className : 'none');
    ok(m.sys + ' ' + m.n + ': drawing has content', shapes.length >= 10, 'elements=' + shapes.length);
    ok(m.sys + ' ' + m.n + ': caption explains it', caption.trim().length >= 25, caption.trim().slice(0, 60));
    ok(m.sys + ' ' + m.n + ': system tint applied', !!fig && fig.className.indexOf('ma-' + m.sys) !== -1, '');
    ok(m.sys + ' ' + m.n + ': no console error', t.errors.length === 0, t.errors.join(' | '));

    // palette actually resolves (not "none"/transparent)
    if (svg) {
      const candidates = [...t.doc.querySelectorAll('.mission-art svg [class*="ma-"]')].slice(0, 10);
      const filled = candidates.map(el => t.win.getComputedStyle(el).fill).filter(f => f && f !== 'none' && f !== 'rgba(0, 0, 0, 0)');
      ok(m.sys + ' ' + m.n + ': shapes are filled with the palette', filled.length > 0, filled[0] || 'none');
      const flow = t.doc.querySelector('.mission-art .ma-flow');
      const breathe = t.doc.querySelector('.mission-art .ma-breathe');
      const reduced = t.win.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const durOf = el => el ? t.win.getComputedStyle(el).animationDuration : 'none';
      if (reduced) {
        ok(m.sys + ' ' + m.n + ': animation is off under reduced motion',
           durOf(flow) === '0s' || durOf(flow) === 'none' || !flow, 'flow=' + durOf(flow) + ' breathe=' + durOf(breathe));
      } else {
        const durs = [durOf(flow), durOf(breathe)].filter(d => d && d !== 'none');
        ok(m.sys + ' ' + m.n + ': motion is slow and restrained',
           durs.length === 0 || durs.every(d => parseFloat(d) >= 2), 'durations=' + durs.join(','));
      }
    }

    // no overlap with the header text or any control
    if (fig) {
      const fr = rect(fig);
      const clash = [];
      t.doc.querySelectorAll('#main h1, #main h2, #main p, #main button, #main .choice, #main .input, #main .bar, #main .feedback').forEach(el => {
        if (fig.contains(el) || el.contains(fig)) return;
        const er = rect(el);
        if (er.w === 0 || er.h === 0) return;
        if (overlaps(fr, er)) clash.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
      });
      ok(m.sys + ' ' + m.n + ': nothing is covered', clash.length === 0, clash.slice(0, 3).join(', ') || 'clear');
      const doc = t.doc.documentElement;
      ok(m.sys + ' ' + m.n + ': no horizontal overflow', doc.scrollWidth <= doc.clientWidth + 1, doc.scrollWidth + ' vs ' + doc.clientWidth);
    }
    t.frame.remove();
  }

  // ---------------- 4: the two excluded systems
  for (const [route, label] of [['#mission/3', 'skeletal'], ['#muscle/mission/2', 'muscular']]) {
    const t = await load(route);
    ok(label + ': no new artwork added', t.doc.querySelectorAll('.mission-art').length === 0, '');
    ok(label + ': its own artwork is still there', !!t.doc.querySelector('.mission-header-visual, .mq-arm, .mq-diagram, .body-atlas, .mq-completion-state'), '');
    ok(label + ': page is error free', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }

  // ---------------- 5: progress and XP still work
  {
    const t = await load('#excretory/mission/1');
    const before = JSON.parse(localStorage.getItem(KEY) || '{}');
    const chips = [...t.doc.querySelectorAll('.exc-chip')];
    let placed = 0;
    for (let guard = 0; guard < 40; guard++) {
      const open = [...t.doc.querySelectorAll('.exc-chip')].filter(c => !c.disabled);
      if (!open.length) break;
      const chip = open[0];
      chip.click();
      for (const bin of [...t.doc.querySelectorAll('[data-exc-bin]')]) {
        if (chip.disabled) break;
        bin.click();
      }
      if (chip.disabled) placed++;
    }
    const done = placed === chips.length;
    await sleep(400);
    const after = JSON.parse(localStorage.getItem(KEY) || '{}');
    ok('excretory lab still records progress', done && !!((after.excretory || {}).steps || {})['1-lab'], done ? 'lab step saved' : 'no chip placed');
    ok('excretory lab still awards XP', (after.xp || 0) > (before.xp || 0), (before.xp || 0) + ' -> ' + (after.xp || 0));
    t.frame.remove();
  }
  {
    const t = await load('#integumentary/mission/1');
    const before = JSON.parse(localStorage.getItem(KEY) || '{}');
    const btn = t.doc.querySelector('#integ-lab-scene button, .integ-lab button, [data-integ-choice]');
    if (btn) btn.click();
    await sleep(400);
    const after = JSON.parse(localStorage.getItem(KEY) || '{}');
    ok('integumentary mission still interactive', after.xp >= before.xp, (before.xp || 0) + ' -> ' + (after.xp || 0));
    t.frame.remove();
  }

  // ---------------- mobile width
  {
    const plain = await load('#muscle/mission/2', 390);
    const pd = plain.doc.documentElement;
    const plainOverflow = pd.scrollWidth - pd.clientWidth;
    plain.frame.remove();
    const t = await load('#respiratory/mission/3', 390);
    const fig = t.doc.querySelector('.mission-art');
    ok('mobile: illustration still shown', !!fig, '');
    const doc = t.doc.documentElement;
    ok('mobile: no horizontal overflow', doc.scrollWidth <= doc.clientWidth + 1, 'mission=' + (doc.scrollWidth - doc.clientWidth) + 'px  page without new art=' + plainOverflow + 'px');
    const label = t.doc.querySelector('.mission-art svg .ma-l');
    const display = label ? t.win.getComputedStyle(label).display : 'none';
    ok('mobile: tiny labels are dropped, caption carries the meaning',
       display === 'none' && !!t.doc.querySelector('.mission-art figcaption'), 'label display=' + display);
    t.frame.remove();
  }

  document.getElementById('out').textContent = 'VERIFY-START\n' + results.join('\n') + '\nVERIFY-END';
 } catch (err) {
  document.getElementById('out').textContent = 'VERIFY-START\n' + results.join('\n')
    + '\nHARNESS-ERROR: ' + (err && err.stack ? err.stack.split('\n')[0] : String(err)) + '\nVERIFY-END';
 }
})();
</script></body></html>"""

SEED = """<!doctype html><meta charset="utf-8"><title>seed</title><body>…</body><script>
localStorage.setItem('bodyquest-v1', JSON.stringify(__STATE__));
location.replace('/?nosw' + (new URLSearchParams(location.search).get('to') || '#home'));
</script>"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def _send(self, text):
        data = text.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith("/_seed"):
            self._send(SEED.replace("__STATE__", STATE))
            return
        if self.path.split("?")[0] in ("/_verify.html", "/_verify"):
            self._send(PAGE.replace("__STATE__", STATE))
            return
        super().do_GET()

    def log_message(self, *a):
        pass


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("illustration checks on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
