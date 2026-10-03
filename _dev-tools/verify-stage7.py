"""
Verification harness for stage 7: tap-to-define glossary and read-aloud.

Serves C:\\InnerU read-only on 127.0.0.1:8819 and adds /_verify.html.

Note: this server is THREADED, and frames are given a generous settle time. The
earlier single-threaded version serialised 25+ script requests per frame, so under
Chrome's virtual-time budget a frame could be asserted before its scripts had run
(that is what produced the occasional empty-page result in earlier stages too).
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8819
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
    integumentary:{done:[1,2],steps:{}}, respiratory:{done:[1,2,3],steps:{}}, excretory:{done:[1,2],steps:{}},
    circ:{done:[],steps:[],mastery:false,boss:false,heartExplored:[]}, muscle:{done:[1],tasks:{},weak:[],xp:0} };
}
const saved = () => JSON.parse(localStorage.getItem(KEY) || '{}');
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
const mainText = w => { const m = w.document.getElementById('main'); return m ? m.textContent.replace(/\s+/g, ' ') : ''; };
const marked = doc => [...doc.querySelectorAll('#main .term')];

(async () => {
 try {
  // ================= glossary: marking =================
  {
    const t = await load('#respiratory/mission/4', base());
    const terms = marked(t.doc);
    ok('lesson text marks key terms', terms.length >= 2, 'terms=' + terms.length);
    ok('the diaphragm is marked', terms.some(s => s.dataset.termId === 'diaphragm'), terms.map(s => s.textContent).join(' | '));
    ok('each term is announced as a button', terms.every(s => s.getAttribute('role') === 'button' && s.tabIndex === 0), 'terms=' + terms.length);
    const ids = terms.map(s => s.dataset.termId);
    ok('no term is marked twice on a page', new Set(ids).size === ids.length, 'marked=' + ids.length + ' unique=' + new Set(ids).size);
    ok('nothing inside a button or link is marked', t.doc.querySelectorAll('button .term, a .term').length === 0, '');
    ok('the lesson text itself is unchanged', /diaphragm contracts and moves down/i.test(mainText(t.win)), (mainText(t.win).match(/[^.]*diaphragm[^.]*/) || [''])[0]);
    ok('mission 4 renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }
  {
    // a text-rich lesson marks many terms, and a lab chip stays plain text
    const t = await load('#excretory/mission/1', base());
    const terms = marked(t.doc);
    ok('a text-rich lesson marks many terms', terms.length >= 5, 'terms=' + terms.length + ' :: ' + terms.map(s => s.textContent).slice(0, 8).join(', '));
    const chip = [...t.doc.querySelectorAll('button')].find(b => /^urea$/i.test(b.textContent.trim()));
    ok('a lab answer chip keeps its plain text', !!chip && !chip.querySelector('.term'), chip ? chip.textContent.trim() : 'chip not found');
    ok('a lesson paragraph still marks urea', marked(t.doc).some(s => s.dataset.termId === 'urea'), '');
    ok('the paragraph text is not altered by marking', /waste/i.test(mainText(t.win)), '');
    t.frame.remove();
  }

  // ================= glossary: the definition card =================
  {
    const t = await load('#respiratory/mission/4', base());
    const span = marked(t.doc).find(s => s.dataset.termId === 'diaphragm');
    span.click();
    const pop = t.doc.getElementById('term-pop');
    ok('tapping a term opens a definition', !!pop && !pop.hidden, pop ? pop.className : 'missing');
    ok('the card names the term', text(t.win, '.term-pop-word') === 'diaphragm', text(t.win, '.term-pop-word'));
    ok('the card shows the Arabic term', /[\u0600-\u06FF]/.test(text(t.win, '.term-pop-ar') || ''), text(t.win, '.term-pop-ar'));
    ok('the card explains it in one sentence', (text(t.win, '.term-pop-def') || '').length > 40, (text(t.win, '.term-pop-def') || '').slice(0, 60));
    ok('the term reports itself as expanded', span.getAttribute('aria-expanded') === 'true', span.getAttribute('aria-expanded'));
    ok('the card links to the full glossary', !!pop.querySelector('a[href="#glossary"]'), '');
    t.doc.dispatchEvent(new t.win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    ok('escape closes the card', pop.hidden && span.getAttribute('aria-expanded') === 'false', '');
    t.frame.remove();
  }
  {
    const t = await load('#respiratory/mission/4', base());
    const span = marked(t.doc).find(s => s.dataset.termId === 'diaphragm');
    span.dispatchEvent(new t.win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    ok('keyboard users can open a definition', !t.doc.getElementById('term-pop').hidden, text(t.win, '.term-pop-word'));
    t.frame.remove();
  }
  {
    const t = await load('#respiratory/mission/4', base());
    const toggle = t.doc.getElementById('glossary-toggle');
    ok('the reader controls appear in the top bar', !!toggle, toggle ? toggle.textContent.trim() : 'missing');
    toggle.click();
    ok('turning terms off removes every highlight', marked(t.doc).length === 0, 'left=' + marked(t.doc).length);
    t.frame.remove();
    ok('the preference is remembered', (saved().glossary || {}).on === false, JSON.stringify(saved().glossary || {}));
    const t2 = await load('#respiratory/mission/4', saved());
    ok('the next page keeps terms hidden', marked(t2.doc).length === 0, '');
    t2.frame.remove();
  }

  // ================= glossary page =================
  {
    const t = await load('#glossary', base());
    ok('the glossary page lists every term', t.doc.querySelectorAll('.glossary-list dt').length === 71, 'entries=' + t.doc.querySelectorAll('.glossary-list dt').length);
    ok('entries carry the Arabic term', /[\u0600-\u06FF]/.test(text(t.win, '.glossary-list dt span') || ''), text(t.win, '.glossary-list dt span'));
    ok('the glossary page does not re-mark its own list', t.doc.querySelectorAll('.glossary-list .term').length === 0, '');
    ok('the footer links to the glossary', !!t.doc.querySelector('footer a[href="#glossary"]'), '');
    ok('the glossary page renders without error', t.errors.length === 0, t.errors.join(' | '));
    t.frame.remove();
  }

  // ================= read aloud =================
  {
    const t = await load('#respiratory/mission/4', base());
    const toggle = t.doc.getElementById('tts-toggle');
    ok('the read-aloud control appears', !!toggle, toggle ? toggle.textContent.trim() : 'missing');
    ok('it offers a reading speed', !!t.doc.getElementById('tts-rate'), text(t.win, '#tts-rate'));
    const queue = t.win.inneruSpeech ? t.win.inneruSpeech.blocks().length : -1;
    ok('it finds the page paragraphs', queue >= 3, 'blocks=' + queue);
    if (toggle) {
      toggle.click();
      const started = toggle.getAttribute('aria-pressed') === 'true' && /Stop/.test(toggle.textContent);
      const refused = !!t.doc.querySelector('.reader-note.is-visible');
      ok('pressing it starts reading, or says why it cannot', started || refused, started ? 'reading' : 'device note: ' + text(t.win, '#tts-note'));
      const mark = t.win.inneruSpeech._highlight(6);
      ok('words are highlighted while reading', !!mark && !!t.doc.querySelector('#main mark.tts-word'), mark ? mark.textContent : 'none');
      t.win.inneruSpeech._highlight(30);
      ok('only one word stays highlighted', t.doc.querySelectorAll('#main mark.tts-word').length === 1, 'marks=' + t.doc.querySelectorAll('#main mark.tts-word').length);
      t.doc.getElementById('tts-rate').click();
      ok('the speed control cycles', t.win.inneruSpeech.rate() !== 1, 'rate=' + t.win.inneruSpeech.rate());
      t.doc.getElementById('tts-toggle').click();
      ok('pressing stop stops reading', toggle.getAttribute('aria-pressed') === 'false' && t.doc.querySelectorAll('#main mark.tts-word').length === 0, toggle.textContent.trim());
    }
    t.frame.remove();
  }
  {
    const t = await load('#respiratory/mission/4', base());
    t.doc.getElementById('tts-toggle').click();
    const was = t.win.inneruSpeech.isSpeaking();
    t.win.location.hash = '#home';
    await new Promise(r => setTimeout(r, 900));
    ok('navigating away stops the reading', !t.win.inneruSpeech.isSpeaking() && t.doc.querySelectorAll('#main mark.tts-word').length === 0, 'was=' + was + ' now=' + t.win.inneruSpeech.isSpeaking());
    t.frame.remove();
  }
  {
    const t = await load('#review', base());
    t.doc.getElementById('review-start').click();
    ok('review questions are readable too', t.win.inneruSpeech.blocks().length >= 1, 'blocks=' + t.win.inneruSpeech.blocks().length);
    t.frame.remove();
  }

  // ================= regression sweep =================
  for (const route of ['#home', '#world', '#mission/1', '#dashboard', '#badges', '#detective', '#connect', '#daily',
                       '#integumentary', '#respiratory', '#respiratory/mission/4', '#excretory', '#excretory/mission/1',
                       '#muscle', '#muscle/mission/2', '#circulatory', '#final', '#teacher', '#review', '#sources', '#glossary']) {
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
    print("stage-7 verify server (threaded) on http://127.0.0.1:%d/_verify.html" % PORT)
    httpd.serve_forever()
