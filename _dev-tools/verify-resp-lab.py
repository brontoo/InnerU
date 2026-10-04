"""
Interaction check for the respiratory lab figure:

  * the three event panels exist with data-event attributes
  * clicking Ventilation / External exchange / Cellular respiration highlights the
    matching panel and the matching chip
  * the stage counter still advances (the lab's own progress)
"""

import http.server
import socketserver

ROOT = r"C:\InnerU"
PORT = 8835

STATE = r"""{
  name:'Layla', xp:1420, done:[1,2,3,4,5,6,7,8], rewards:['boss'], weak:[], level:'Explorer', motion:false,
  integumentary:{done:[1,2,3],steps:{},mastery:false,weak:[]},
  respiratory:{done:[1],steps:{},mastery:false,weak:[]},
  excretory:{done:[1,2,3],steps:{},mastery:false,weak:[]},
  circ:{done:[1,2,3],steps:[],mastery:false,boss:false,heartExplored:[]},
  muscle:{done:[1,2,3,4,5,6,7,8],tasks:{},weak:[],xp:0}
}"""

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><title>lab checks</title>
<style>body{font:12px monospace}iframe{width:1200px;height:900px;border:0;position:fixed;top:0;left:0;opacity:.01;pointer-events:none;z-index:-1}</style>
</head><body><pre id="out">running…</pre>
<script>
const KEY='bodyquest-v1', STATE=__STATE__, results=[];
const ok=(n,c,d)=>results.push((c?'PASS  ':'FAIL  ')+n+(d!==undefined?'  ['+d+']':''));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function load(route){
  return new Promise(res=>{
    localStorage.setItem(KEY, JSON.stringify(STATE));
    const f=document.createElement('iframe');
    f.onload=()=>setTimeout(()=>res({frame:f,win:f.contentWindow,doc:f.contentWindow.document}),1500);
    f.src='/?nosw'+route; document.body.appendChild(f);
  });
}
(async()=>{
 try{
  const t=await load('#respiratory/mission/1');
  const d=t.doc;
  const panels=[...d.querySelectorAll('.ra-events [data-event]')];
  ok('lab figure has three event panels', panels.length===3, panels.map(p=>p.dataset.event).join(','));
  ok('each panel is a real svg group', panels.every(p=>p.tagName.toLowerCase()==='g'), panels.map(p=>p.tagName).join(','));
  ok('lab figure is inside an svg', !!d.querySelector('.ra-events svg'), '');
  ok('airway route chips are still present', d.querySelectorAll('.resp-route span').length>=7, d.querySelectorAll('.resp-route span').length+' chips');
  ok('no stray markup text in the lab panel', !/data-event=/.test(d.querySelector('.resp-lab-visual').textContent||''), '');

  const buttons=[...d.querySelectorAll('.resp-lab-controls button')];
  ok('lab has three stage buttons', buttons.length===3, buttons.map(b=>b.textContent.trim()).join(' | '));

  const expect=['ventilation','exchange','cellular'];
  for(let i=0;i<Math.min(buttons.length,3);i++){
    buttons[i].click();
    await sleep(350);
    const active=[...d.querySelectorAll('.ra-events [data-event].is-active')].map(p=>p.dataset.event);
    ok('button "'+buttons[i].textContent.trim()+'" highlights its panel',
       active.length===1 && active[0]===expect[i], 'active='+active.join(','));
    const chip=d.querySelector('.resp-route span.is-active');
    ok('button "'+buttons[i].textContent.trim()+'" also highlights a route chip', !!chip, chip?chip.textContent.trim():'none');
  }
  const counter=d.querySelector('.resp-lab-count');
  ok('the lab counter advanced', !!counter && /[1-3]\s*\/\s*3/.test(counter.textContent), counter?counter.textContent.trim():'missing');
  t.frame.remove();
  document.getElementById('out').textContent='VERIFY-START\n'+results.join('\n')+'\nVERIFY-END';
 }catch(e){
  document.getElementById('out').textContent='VERIFY-START\n'+results.join('\n')+'\nHARNESS-ERROR: '+(e&&e.stack?e.stack.split('\n')[0]:String(e))+'\nVERIFY-END';
 }
})();
</script></body></html>"""

SEED = """<!doctype html><meta charset="utf-8"><body>…</body><script>
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
        if self.path.split("?")[0] in ("/_lab.html", "/_lab"):
            self._send(PAGE.replace("__STATE__", STATE))
            return
        super().do_GET()

    def log_message(self, *a):
        pass


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("lab checks on http://127.0.0.1:%d/_lab.html" % PORT)
    httpd.serve_forever()
