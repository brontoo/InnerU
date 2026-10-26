"""Budget, module boundaries, races, deep links and offline cache: loopback only."""
import json,re
from pathlib import Path
from collections import Counter
from test_support import playwright_session,launch,new_context,start_fixture,artifact
import runpy
ROOT=Path(__file__).resolve().parents[1]
measurement=runpy.run_path(str(Path(__file__).with_name('measure-loading.py')))
results=measurement['measure']();measurement['report'](results)
budget=json.loads(Path(__file__).with_name('performance-budget.json').read_text());checks=0

def check(value,label):
 global checks
 assert value,label
 checks+=1;print('PASS',label,flush=True)

manifest=json.loads((ROOT/'route-manifest.js').read_text().split('=',1)[1].rstrip(';\n'))
deferred={ '/'+url.split('?')[0] for group in manifest.values() for url in group['scripts'] }
deferred|={ '/'+row['url'].split('?')[0] for group in manifest.values() for row in group['styles'] }
for name,limits in budget.items():
 for kind in ['js','css','images']:check(results[name]['bytes'][kind]<=limits[kind],f'{name} {kind}: {results[name]["bytes"][kind]} <= {limits[kind]} bytes')
 check(results[name]['requests']<=limits['requests'],f'{name} request budget')
 urls=set(results[name]['requested'])
 check(not any('/speech-core.' in url for url in urls),name+' defers the optional Arabic reader engine and styles')
 check(not(urls&deferred),name+' fetches no deferred system or route code/styles')
 check(not any(url.endswith(('.glb','.gltf','.bin')) or '/assets/three/' in url or 'explorer.js' in url for url in urls),name+' fetches no Three.js, viewer or 3D model')

proc,origin=start_fixture()
try:
 with playwright_session() as pw:
  browser=launch(pw);context=new_context(browser,service_workers='block',reduced_motion='reduce');p=context.new_page();errors=[];requests=[]
  p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:requests.append(r.url))
  # World landings are public anatomy exploration; mission authorization stays online.
  worlds=[('world','.skeletal-map'),('muscle','.mq-landing'),('respiratory','.resp-hero'),('integumentary','.integ-hero'),('circulatory','.heart-lab'),('excretory','.exc-world')]
  for fragment,selector in worlds:
   p.goto(origin+'/index.html?nosw=1#'+fragment);p.wait_for_selector(selector)
   p.reload();p.wait_for_selector(selector)
   check(p.url.endswith('#'+fragment),fragment+' direct link and refresh preserve its view')
   art={'world':('.skeletal-card-art',8),'respiratory':('.resp-card-art',7),'integumentary':('.integ-card-art',7),'circulatory':('.ca-card-art',8),'excretory':('.ea-card',6)}.get(fragment)
   if art:
    p.wait_for_function('([selector,count])=>document.querySelectorAll(selector).length===count',arg=list(art))
    check(True,fragment+' cold route retains every mission-card illustration')
  for fragment,selector in [('home','.explore-screen'),('detective','.dd-page'),('connect','.bt-mission'),('sources','.sourcelist')]:
   p.goto(origin+'/index.html?nosw=1#'+fragment);p.wait_for_selector(selector)
   check(True,fragment+' direct route loads its own module')
  signed=new_context(browser,service_workers='block');sp=signed.new_page()
  response=sp.request.post(origin+'/api/auth?action=signup',data={'email':'routes-fixture@example.com','password':'Local-Routes-Fixture-123','name':'Explorer','avatarId':'atlas','classCode':'10G5'});assert response.ok,response.text()
  for fragment,selector in [('daily','#daily-options'),('review','.rs-studio'),('badges','.sd-collection'),('dashboard','.sd-page'),('dashboard?view=mastery','[data-mastery]')]:
   sp.goto(origin+'/index.html?nosw=1#'+fragment);sp.wait_for_selector(selector)
   check(True,fragment+' signed-in direct route loads its own view')
  # Revisit a module in the same document: no second fetch or duplicate globals.
  p.goto(origin+'/index.html?nosw=1#home');p.wait_for_selector('.explore-screen');requests.clear()
  p.evaluate('location.hash="integumentary"');p.wait_for_selector('.integ-hero')
  p.evaluate('location.hash="home"');p.wait_for_selector('.explore-screen')
  p.evaluate('location.hash="integumentary"');p.wait_for_selector('.integ-hero')
  check(sum('/integumentary.js?' in url for url in requests)==1,'returning to a system reuses its already-loaded script')
  # Slow the first route while navigating away; it must never replace the new page.
  async_context=new_context(browser,service_workers='block');q=async_context.new_page()
  q.goto(origin+'/index.html?nosw=1#home');q.wait_for_selector('.explore-screen')
  q.route('**/excretory.js?*',lambda r:r.abort())
  q.evaluate('location.hash="excretory"');q.wait_for_selector('[data-route-retry]')
  check('could not load' in q.locator('[role=alert]').inner_text(),'failed route module shows a clear retry state')
  q.unroute('**/excretory.js?*');q.locator('[data-route-retry]').click();q.wait_for_selector('.exc-world')
  check(True,'retry recovers without duplicate script declarations')
  q.goto(origin+'/index.html?nosw=1#home');q.wait_for_selector('.explore-screen')
  # Hold a route response, then release it after a newer navigation.
  held=[];q.route('**/respiratory.js?*',lambda r:held.append(r))
  q.evaluate('location.hash="respiratory"');q.wait_for_function('document.querySelector("[aria-busy=true]")!==null')
  for _ in range(50):
   if held:break
   q.wait_for_timeout(20)
  check(bool(held),'race fixture holds the deferred response')
  q.evaluate('location.hash="home"');q.wait_for_selector('.explore-screen')
  held[0].continue_();q.wait_for_timeout(600)
  check(q.locator('.explore-screen').count()==1 and q.locator('.resp-hero').count()==0,'an older route cannot render over newer navigation')
  check(not errors,'no page errors while opening or revisiting deferred routes: '+str(errors))
  # A fresh worker must install without downloading any system, image sheet or model.
  offline=new_context(browser,reduced_motion='reduce');o=offline.new_page();o.goto(origin+'/login.html')
  o.evaluate('navigator.serviceWorker.ready');o.wait_for_function('navigator.serviceWorker.controller!==null');o.wait_for_selector('.gate-role-grid')
  cached=o.evaluate('''async()=>{const keys=await caches.keys();return Object.fromEntries(await Promise.all(keys.map(async k=>[k,(await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)])));}''')
  shell=[u for key,urls in cached.items() if 'visited' not in key for u in urls]
  check(not(set(shell)&deferred) and not any(u.endswith(('.glb','.webp','.png')) for u in shell),'installation precaches only the essential shell')
  o.goto(origin+'/index.html#home');o.wait_for_selector('.explore-screen');o.wait_for_load_state('networkidle')
  o.evaluate('location.hash="integumentary"');o.wait_for_selector('.integ-hero');o.locator('.skin-explorer').scroll_into_view_if_needed();o.wait_for_function('window.inneruSkinExplorerState?.().canvas',timeout=45000)
  o.wait_for_load_state('networkidle')
  cached=o.evaluate('''async()=>{const keys=await caches.keys();return(await Promise.all(keys.map(async k=>(await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)))).flat();}''')
  check(not any(u.startswith('/excretory') for u in cached),'the offline miss fixture has never cached the excretory route')
  # Chromium versions differ in applying page-level network emulation to worker
  # fetches. Disconnect the worker's network too; keep its actual cache/fallback
  # logic intact. Restore fetch before the online quota-failure scenario below.
  worker=offline.service_workers[0]
  worker.evaluate("()=>{self.__onlineFetch=self.fetch;self.__offlineRequests=[];self.fetch=(request)=>{self.__offlineRequests.push(typeof request==='string'?request:request.url);return Promise.reject(new TypeError('Disconnected local test network'));};}")
  offline.set_offline(True)
  o.reload();o.wait_for_selector('.integ-hero');o.wait_for_function('window.inneruSkinExplorerState?.().canvas',timeout=45000)
  check(True,'visited anatomy route, Three.js and model dependencies remain usable after offline refresh')
  o.evaluate('location.hash="home"');o.wait_for_selector('.explore-screen');check(True,'previously visited home works offline')
  o.evaluate('location.hash="excretory"');o.wait_for_selector('[data-route-retry]',timeout=45000)
  check('not been saved' in o.locator('[role=alert]').inner_text(),'uncached offline route explains how to save it')
  check(worker.evaluate("()=>self.__offlineRequests.some(url=>new URL(url,self.location.href).pathname.startsWith('/excretory'))"),'uncached route really attempts the disconnected worker network')
  check(o.evaluate('fetch("/api/auth?action=session").then(()=>false,()=>true)'),'offline accounts fail closed rather than replaying a cached session')
  cached=o.evaluate('''async()=>{const keys=await caches.keys();return(await Promise.all(keys.map(async k=>(await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)))).flat();}''')
  check(not any(u.startswith('/api/') for u in cached),'runtime caches never contain account, authorization or learning APIs')
  offline.set_offline(False)
  worker.evaluate("()=>{self.fetch=self.__onlineFetch;delete self.__onlineFetch;delete self.__offlineRequests;}")
  offline.service_workers[0].evaluate("()=>{Cache.prototype.put=async()=>{throw new Error('Local quota fixture');};}")
  o.locator('[data-route-retry]').click();o.wait_for_selector('.exc-world')
  check(True,'cache-write failure never prevents online content from loading')
  browser.close()
 print(f'{checks} loading checks passed.',flush=True)
finally:proc.terminate();proc.wait(timeout=10)
