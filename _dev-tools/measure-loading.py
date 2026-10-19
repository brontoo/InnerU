"""Repeatable cold loopback measurements: gzip bodies, no production services.

1440x1000 desktop, cold browser contexts, worker disabled, no scrolling. Counts
all completed same-origin responses through network-idle plus a one-second settle.
The dashboard has a real fake-Auth session; cloud state is intentionally unconfigured.
"""
import json,os,sys
from pathlib import Path
from urllib.parse import urlsplit
from test_support import playwright_session,launch,new_context,start_fixture,artifact


def measure():
 os.environ['INNERU_TEST_COMPRESSION']='1'
 proc,origin=start_fixture();results={}
 try:
  with playwright_session() as pw:
   browser=launch(pw)
   for name,path in [('login','/login.html?nosw=1'),('dashboard','/index.html?nosw=1#dashboard')]:
    context=new_context(browser,service_workers='block',viewport={'width':1440,'height':1000});page=context.new_page();responses=[];requested=[];errors=[]
    if name=='dashboard':
     response=page.request.post(origin+'/api/auth?action=signup',data={'email':'loading-fixture@example.com','password':'Local-Loading-Fixture-123','name':'Explorer','avatarId':'atlas','classCode':'10G5'});assert response.ok,response.text()
    page.on('request',lambda r:requested.append(urlsplit(r.url).path) if r.url.startswith(origin) else None)
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('response',lambda r:responses.append(r) if r.url.startswith(origin) else None)
    page.goto(origin+path);page.wait_for_selector('.gate-role-grid' if name=='login' else '.sd-page');page.wait_for_load_state('networkidle');page.wait_for_timeout(1000)
    assert not errors,errors
    entries=[]
    for r in responses:
     pathname=urlsplit(r.url).path;size=int(r.headers.get('content-length','0'))
     kind='js' if pathname.endswith('.js') else 'css' if pathname.endswith('.css') else 'images' if pathname.endswith(('.webp','.png','.jpg','.svg','.jpeg')) else 'models' if pathname.endswith(('.glb','.gltf','.bin')) else 'other'
     entries.append({'url':pathname,'type':kind,'bytes':size,'status':r.status})
    results[name]={'requests':len(entries),'bytes':{key:sum(r['bytes'] for r in entries if r['type']==key) for key in ['js','css','images','models']},'resources':entries,'requested':requested}
    page.screenshot(path=artifact('loading-'+name+'.png'));context.close()
   browser.close()
  return results
 finally:proc.terminate();proc.wait(timeout=10)


def report(results,output=None):
 output=Path(output or artifact('loading-measurements.json'));output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(results,indent=2)+'\n')
 for name,result in results.items():print(name,json.dumps({k:v for k,v in result.items() if k not in ('resources','requested')}),flush=True)
 print('Measurements:',output,flush=True)

if __name__=='__main__':report(measure(),sys.argv[1] if len(sys.argv)>1 else None)
