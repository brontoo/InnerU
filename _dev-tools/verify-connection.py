"""Connection checker regression: missing scripts, CSP, stalled APIs and real gateway errors."""
import json,subprocess,uuid
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node',str(ROOT/'_dev-tools/account-test-server.js')],stdout=subprocess.PIPE,text=True)
ORIGIN=json.loads(proc.stdout.readline())['origin'];checks=0;errors=[]
def check(v,m):
 global checks
 assert v,m
 checks+=1;print('PASS',m,flush=True)
def finish(p):p.wait_for_selector('#connection-retry:not([disabled])')
def output(p):return p.locator('#connection-results').inner_text()
def json_route(route,data,status=200):route.fulfill(status=status,content_type='application/json',body=json.dumps(data))
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=browser.new_context(service_workers='block');p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(ORIGIN+'/connection.html');finish(p)
  check('Supabase Auth is reachable' in output(p) and 'No signed-in account' in output(p),'the deployed handlers report reachable Auth and an honestly signed-out session')
  # Both copies must not issue duplicate requests or reset the results.
  requests=[];p.on('request',lambda r:requests.append(r.url) if '/api/auth?' in r.url else None)
  p.reload();finish(p);check(len(requests)==2,'inline and external fallback together run exactly one diagnostic sequence')
  p.route('**/connection.js*',lambda route:route.abort());p.reload();finish(p)
  check('Supabase Auth is reachable' in output(p),'missing or blocked external checker JavaScript does not strand the page')
  p.unroute('**/connection.js*')
  # CSP can prohibit inline JS while allowing the independent same-origin fallback.
  html=(ROOT/'connection.html').read_text()
  p.route('**/connection.html',lambda r:r.fulfill(status=200,content_type='text/html',headers={'Content-Security-Policy':"script-src 'self'"},body=html))
  p.reload();finish(p);check('Supabase Auth is reachable' in output(p),'a policy blocking inline scripts still allows the external checker fallback')
  p.unroute('**/connection.html')
  p.request.post(ORIGIN+'/__test/config',data={'enabled':False});p.reload();finish(p)
  check('not configured' in output(p) and p.locator('[data-state=error]').count()==1,'missing Vercel configuration is displayed as an error, never a success')
  p.request.post(ORIGIN+'/__test/config',data={'enabled':True})
  p.route('**/api/auth?action=session',lambda r:r.fulfill(status=200,content_type='text/html',body='<html>Vercel fallback</html>'));p.reload();finish(p)
  check('web page instead of JSON' in output(p),'an HTML fallback reveals an absent or incorrectly deployed API')
  p.unroute('**/api/auth?action=session')
  p.route('**/api/auth?action=session',lambda r:json_route(r,{'error':'Function unavailable'},503));p.reload();finish(p)
  check('Function unavailable' in output(p),'server-side API errors are visible without exposing credentials')
  p.unroute('**/api/auth?action=session')
  p.route('**/api/auth?action=session',lambda r:json_route(r,{}));p.reload();finish(p)
  check('not the current InnerU account endpoint' in output(p),'unexpected JSON is distinguished from a configured account service')
  p.unroute('**/api/auth?action=session')
  stalled=[];p.clock.install();p.route('**/api/auth?action=session',lambda r:stalled.append(r));p.reload();p.wait_for_selector('[data-state=checking]');p.clock.run_for(21000);finish(p)
  check('timed out after 20 seconds' in output(p) and p.locator('#connection-retry').is_enabled(),'an API that never responds times out and restores the retry button')
  for request in stalled:request.abort()
  p.unroute('**/api/auth?action=session');p.locator('#connection-retry').click();finish(p)
  check('Supabase Auth is reachable' in output(p),'retry succeeds after a stalled request is cleared')
  p.clock.resume()
  p.request.post(ORIGIN+'/api/auth?action=signup',data={'email':'connection-'+uuid.uuid4().hex+'@example.com','password':'Fixture-Only-Secure-123','avatarId':'pip','name':'Fixture','classCode':'10G1'})
  p.reload();finish(p)
  check('Account session verified' in output(p) and 'database is not installed yet' in output(p),'a real authenticated session reports a missing SQL migration through the production gateway')
  p.route('**/api/learning?action=state',lambda r:json_route(r,{'schemaVersion':1,'profile':{'role':'student'},'progress':{'revision':3}}));p.reload();finish(p)
  check('learning database installed · schema 1' in output(p),'valid database results complete the diagnostic sequence')
  for width in [1440,390,320]:
   p.set_viewport_size({'width':width,'height':950});check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'results and direct links fit {width}px without overflow')
  disabled=browser.new_context(java_script_enabled=False,service_workers='block');q=disabled.new_page();q.goto(ORIGIN+'/connection.html')
  check(q.locator('noscript').is_visible() and q.locator('.direct-checks a').count()==3,'JavaScript-disabled browsers retain a clear explanation and direct API links')
  check(not errors,'no uncaught JavaScript errors across connection success and failure cases: '+str(errors))
  browser.close()
 print(checks,'connection checker checks passed.')
finally:proc.terminate();proc.wait(timeout=10)
