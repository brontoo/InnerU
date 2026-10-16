"""Run six new investigations, reward isolation, practice and teacher-code transfer."""
import base64,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
checks=0;errors=[]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
def check(ok,message):
 global checks
 assert ok,message
 checks+=1;print('PASS',message,flush=True)
def stored(p):return p.evaluate('localStorage.getItem("bodyquest-v1")')
def select(p,i):p.locator(f'[data-dd-act-case="{i}"]').click()
def click(p,key,value=None):p.locator(f'[data-dd-act-{key}]' if value is None else f'[data-dd-act-{key}="{value}"]').click()
def slider(p,id,value):p.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',value)
def bench(p,i):
 if i==0:
  for site in [0,1]:
   click(p,'site',site)
   for spacing in [3,12]:click(p,'spacing',spacing);click(p,'touch-run')
 elif i==1:
  click(p,'time',0);click(p,'time',1);click(p,'pair');click(p,'time',2);click(p,'pair');click(p,'method')
 elif i==2:
  slider(p,'dd-wave-frame',3);click(p,'wave',1);slider(p,'dd-wave-frame',3)
 elif i==3:
  click(p,'air-run');click(p,'protocol',1);click(p,'air-run')
 elif i==4:
  click(p,'capture');assert 'Turn on the reference overlay' in p.locator('[data-dd-capture-feedback]').inner_text()
  p.locator('[data-dd-act-overlay]').check()
  for condition in range(3):click(p,'signal',condition);click(p,'capture')
 else:
  click(p,'ledger',1);p.locator('#dd-total-a').fill('20');p.locator('#dd-total-b').fill('20');p.locator('#dd-total-unit').select_option('amount');click(p,'ledger-check')
def answer(p,i,wrong=False):
 data=p.evaluate('(i)=>{const c=InneruDetectiveCases[i];return {pins:c.pins,claim:c.answer,limit:c.limit}}',i)
 pins=[n for n in range(4) if n not in data['pins']] if wrong else data['pins']
 for n in pins:click(p,'pin',n)
 click(p,'claim',(data['claim']+1)%3 if wrong else data['claim']);click(p,'limit',(data['limit']+1)%3 if wrong else data['limit'])
def legacy_code():
 payload=dict(v=1,n='Legacy learner',x=12,k='000000',w='000000',c=0)
 raw=json.dumps(payload,separators=(',',':'));checksum=0
 for char in raw:checksum=(checksum*31+ord(char))%1296
 chars='0123456789abcdefghijklmnopqrstuvwxyz';suffix=chars[checksum//36]+chars[checksum%36]
 return 'INNERU1-'+base64.urlsafe_b64encode(raw.encode()).decode().rstrip('=')+'-'+suffix
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  p=browser.new_page(viewport=dict(width=1680,height=1100));p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'#detective',wait_until='domcontentloaded');p.wait_for_selector('.dd-page');baseline=stored(p)
  check(p.locator('[data-dd-act-case]').count()==6 and p.locator('.mq-case-section,.case-file-tabs,#clinical').count()==0,'the detective page replaces both repeated case collections with six new system files')
  data=p.evaluate('InneruDetectiveCases.map(c=>({id:c.id,system:c.system,title:c.title}))')
  check(len(set(c['system'] for c in data))==6 and len(set(c['id'] for c in data))==6,'each system receives its own distinct investigation identity')
  p.locator('.dd-page img').evaluate_all('imgs=>Promise.all(imgs.map(i=>{i.loading="eager";return i.decode()}))')
  check(p.locator('.dd-page img').evaluate_all('imgs=>imgs.every(i=>i.naturalWidth>300)'),'all six anatomy contexts and the new all-system hero load')
  for i,c in enumerate(data):
   select(p,i);check(p.locator('.dd-page').get_attribute('data-dd-case')==c['id'] and p.locator('.dd-case-heading h2').inner_text()==c['title'],c['system']+' file is immediately accessible without other completions')
   click(p,'file');check('observation goal' in p.locator('[data-dd-verdict]').inner_text(),c['system']+' requires actual bench observations before a conclusion can earn credit')
  check(stored(p)==baseline and p.evaluate('state.xp')==0,'opening files and submitting incomplete investigations never writes XP or progress')
  select(p,0);bench(p,0)
  check('8' in p.locator('.dd-data-table').inner_text() and '1' in p.locator('.dd-data-table').inner_text(),'the touch table records the specified controlled ten-trial results')
  p.locator('#dd-notebook').fill('<img src=x onerror=alert(1)> My observation.');select(p,1);select(p,0)
  check(p.locator('#dd-notebook').input_value().startswith('<img') and p.locator('#dd-notebook img').count()==0,'local notes survive file switching as plain text')
  check('Observations collected' in p.locator('[data-dd-bench-status]').inner_text(),'completed touch observations survive file switching without being saved')
  for i,c in enumerate(data):
   select(p,i)
   if i!=0:bench(p,i)
   check('Observations collected' in p.locator('[data-dd-bench-status]').inner_text(),c['system']+' bench recognizes its distinct required comparisons')
   if i in [1,3,4]:check(p.locator('.dd-data-table').count()==1,c['system']+' provides readable data outside the scalable diagram')
   if i==1:check('+0.9 cm' in p.locator('[data-dd-pair-result]').inner_text(),'spinal paired comparison reports the reversible 0.9 cm recovery')
   if i==3:
    click(p,'protocol',0);check('Collect observations' in p.locator('[data-dd-bench-status]').inner_text(),'returning to the confounded air protocol invalidates current bench readiness');click(p,'protocol',1)
   if i==5:
    p.locator('#dd-total-unit').select_option('concentration');click(p,'ledger-check')
    check('Collect observations' in p.locator('[data-dd-bench-status]').inner_text(),'per-litre units cannot pass the whole-collection amount audit')
    p.locator('#dd-total-unit').select_option('amount');click(p,'ledger-check')
   answer(p,i,wrong=True);click(p,'file')
   check('Revisit' in p.locator('[data-dd-verdict]').inner_text() and p.evaluate('state.xp')==i*30,c['system']+' rejects assertions and unsupported conclusions without awarding XP')
   for n in range(4):
    b=p.locator(f'[data-dd-act-pin="{n}"]')
    if b.get_attribute('aria-pressed')=='true':b.click()
   answer(p,i);click(p,'file')
   check('Evidence over assumption.' in p.locator('[data-dd-verdict]').inner_text() and p.evaluate('state.xp')==(i+1)*30,c['system']+' files a supported conclusion for exactly 30 XP')
   click(p,'file');check(p.evaluate('state.xp')==(i+1)*30,c['system']+' replay cannot duplicate its reward')
  check('6 / 6' in p.locator('[data-dd-total]').inner_text() and p.locator('.dd-journal-stamps .dd-is-filed').count()==6,'the journal records full coverage of all six systems')
  check(p.evaluate('state.done.length===0&&!state.rewards.some(r=>/^case[0-3]$/.test(r))&&keysEarned()===0'),'new investigations never grant old skeletal cases, world missions or System Keys')
  p.reload(wait_until='domcontentloaded');p.wait_for_selector('.dd-page')
  check('6 / 6' in p.locator('[data-dd-total]').inner_text() and p.evaluate('state.xp')==180,'reload preserves all six once-only investigation credits')
  click(p,'restart');check(p.evaluate('state.xp')==180 and '6 / 6' in p.locator('[data-dd-total]').inner_text(),'restarting transient observations keeps the earned case credits')
  p.evaluate('location.hash="badges"');p.wait_for_selector('.dd-collection-badge')
  check('EARNED' in p.locator('.dd-collection-badge').inner_text() and 'locked' not in p.locator('.dd-collection-badge').get_attribute('class'),'all six investigations earn the separate all-systems achievement')
  legacy=p.locator('.badge').filter(has=p.locator('h3',has_text='MEDICAL INVESTIGATOR'))
  check(legacy.locator('a[href="#mission/7"]').count()==1,'the legacy medical-case achievement points back to its skeletal mission')
  check(p.locator('.cap-total').inner_text().split(' of ')[1].split(' ')[0]==str(p.locator('.badge').count()),'the achievement collection total includes the new investigation badge')
  p.evaluate('location.hash="teacher"');p.wait_for_selector('#t-code');p.locator('#t-code').click();code=p.locator('#t-code-text').input_value()
  payload=json.loads(base64.urlsafe_b64decode(code.rsplit('-',1)[0].removeprefix('INNERU1-')+'==='))
  check(payload['d']=='111111','teacher progress codes include all six detective completion bits')
  p.evaluate('state.rewards=[];state.xp=0;save()');p.locator('#t-import').fill(code);p.locator('#t-load').click()
  check(p.evaluate('state.xp===180&&state.rewards.filter(r=>r.startsWith("detective2-")).length===6'),'teacher-code restore preserves the six credits and XP ledger')
  p.locator('#t-import').fill(legacy_code());p.locator('#t-load').click()
  check(p.evaluate('state.name==="Legacy learner"&&state.xp===12&&!state.rewards.some(r=>r.startsWith("detective2-"))'),'older teacher codes still load without inventing new investigation credit')
  # Entire practice pathway is isolated, including local case completions.
  p.evaluate('location.hash="detective?preview=1"');p.wait_for_selector('.dd-practice');baseline=stored(p)
  for i in range(6):select(p,i);bench(p,i);answer(p,i);click(p,'file');assert 'PRACTICE CONCLUSION CHECKED' in p.locator('[data-dd-verdict]').inner_text()
  check(stored(p)==baseline and p.evaluate('state.xp')==12 and '6 / 6' in p.locator('[data-dd-total]').inner_text(),'all six fully solved practice investigations leave storage and XP unchanged')
  select(p,5);select(p,0);select(p,5)
  check(p.locator('#dd-total-a').input_value()=='20' and p.locator('#dd-total-unit').input_value()=='amount','collection ledger inputs and validated observations survive local file switching')
  p.locator('[data-dd-act-case="5"]').focus();p.keyboard.press('ArrowRight');check(p.locator('.dd-page').get_attribute('data-dd-case')=='touch','keyboard navigation wraps through all system files')
  p.keyboard.press('End');check(p.locator('.dd-page').get_attribute('data-dd-case')=='sample','End selects the final investigation')
  p.keyboard.press('Home');check(p.locator('.dd-page').get_attribute('data-dd-case')=='touch','Home selects the first investigation')
  select(p,2);click(p,'motion');check(p.locator('[data-dd-act-play]').is_disabled(),'local pause disables automated time-lapse playback')
  slider(p,'dd-wave-frame',2);check('3 / 4' in p.locator('[data-dd-frame-label]').inner_text(),'manual time-lapse remains available while paused')
  click(p,'motion');p.emulate_media(reduced_motion='reduce');p.wait_for_function('document.querySelector("[data-dd-act-motion]").disabled')
  check(p.locator('[data-dd-act-play]').is_disabled(),'system reduced motion disables automatic model playback')
  p.emulate_media(reduced_motion='no-preference');p.wait_for_function('!document.querySelector("[data-dd-act-motion]").disabled')
  p.evaluate('document.body.classList.add("motionoff")');p.wait_for_function('document.querySelector("[data-dd-act-play]").disabled')
  check(p.locator('.dd-page').get_attribute('data-dd-motion')=='off','the existing app-wide reduced-motion preference applies to the investigation bench')
  p.evaluate('document.body.classList.remove("motionoff")');p.wait_for_function('!document.querySelector("[data-dd-act-play]").disabled')
  click(p,'play');p.wait_for_timeout(950);check('2 / 4' in p.locator('[data-dd-frame-label]').inner_text(),'manual playback advances the travelling-wave time-lapse')
  select(p,1);p.wait_for_timeout(900);check(p.locator('[data-dd-act-play]').count()==0,'changing files stops and removes the active time-lapse')
  for width in [1680,1024,768,390,320]:
   p.set_viewport_size(dict(width=width,height=900))
   for i in range(6):
    select(p,i)
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,i)
   check(True,f'all six different benches fit the full {width}px page without horizontal overflow')
  check(stored(p)==baseline,'keyboard, animation and responsive practice never write learner state')
  p.evaluate('location.hash="home"');p.wait_for_selector('.iu-expedition');check(p.locator('.dd-page').count()==0,'leaving the detective page disposes the workbench')
  p.evaluate('location.hash="detective"');p.wait_for_selector('.dd-page');check(p.locator('.dd-page').count()==1 and p.locator('[data-dd-act-case]').count()==6,'returning mounts one clean, independently browsable case collection')
  shell=p.evaluate(r"async()=>{const t=await(await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
  for path in shell:assert p.request.get(BASE.split('?')[0]+path.removeprefix('./')).status==200,path
  check(True,f'all {len(shell)} offline shell URLs resolve')
  check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'both HTML entry points load identical investigation modules')
  check(not errors,'no JavaScript errors during evidence collection, scoring, practice, teacher transfer, motion or navigation: '+str(errors))
  browser.close()
finally:server.shutdown();server.server_close()
print(f'{checks} detective investigation checks passed.',flush=True)
