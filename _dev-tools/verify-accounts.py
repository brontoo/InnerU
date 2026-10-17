"""Exercise the real account adapter and portal against an isolated Auth fixture."""
import json,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node',str(ROOT/'_dev-tools/account-test-server.js')],stdout=subprocess.PIPE,text=True)
ORIGIN=json.loads(proc.stdout.readline())['origin'];ENTRY=ORIGIN+'/login.html?nosw=1'
checks=0;errors=[]
def check(v,m):
 global checks
 assert v,m
 checks+=1;print('PASS',m,flush=True)
def api(p,action,values=None):return p.evaluate('(v)=>InneruAccount.api(v.action,v.values)',{'action':action,**({'values':values} if values is not None else {})})
def profile(p):return p.evaluate('JSON.parse(localStorage.getItem("bodyquest-v1")||"null")')
def role(p,name='student'):
 p.goto(ENTRY);p.wait_for_selector('[data-select-role="'+name+'"]');p.locator('[data-select-role="'+name+'"]').click();p.wait_for_selector('#entry-email')
def signup(p,email='amina@example.com',name='Amina',password='Correct-Horse-123'):
 p.locator('[data-auth-mode="signup"]').first.click();p.locator('#entry-email').fill(email);p.locator('#entry-nickname').fill(name);p.locator('#entry-password').fill(password);p.locator('#entry-confirm').fill(password);p.locator('#gate-entry-form [type=submit]').click();p.wait_for_selector('.gate-avatar-grid')
def choose(p,id):p.locator('input[name=avatar][value="'+id+'"]').check()
def enter(p):p.locator('#gate-avatar-form [type=submit]').click()
def home(p):p.wait_for_url('**/index.html#home');p.wait_for_selector('.iu-expedition')
def logout(p):
 p.wait_for_selector('.iu-account-menu');p.locator('.iu-account-menu summary').click();p.locator('[data-account-logout]').click();p.wait_for_url('**/login.html');p.wait_for_selector('.gate-role-grid')
def signin(p,email='amina@example.com',password='Correct-Horse-123'):
 p.locator('#entry-email').fill(email);p.locator('#entry-password').fill(password);p.locator('#gate-entry-form [type=submit]').click()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  context=browser.new_context(viewport={'width':1680,'height':1100},service_workers='block');p=context.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(ENTRY);p.wait_for_selector('.gate-role-grid')
  check(p.locator('.gate-role').count()==2 and p.locator('.gate-scene').evaluate('e=>e.complete&&e.naturalWidth>0'),'the illustrated student/teacher adventure entry is preserved')
  p.evaluate('localStorage.setItem("bodyquest-v1",JSON.stringify({name:"Amina",xp:88,done:[1],rewards:["activity1"],weak:[],level:"Explorer",motion:false}))')
  role(p);p.locator('[data-auth-mode="signup"]').first.click()
  p.locator('#entry-email').fill('not-an-email');p.locator('#entry-password').fill('Correct-Horse-123');p.locator('#entry-confirm').fill('Correct-Horse-123');p.locator('#gate-entry-form [type=submit]').click()
  check('valid email' in p.locator('#entry-error').inner_text() and p.locator('.gate-avatar-grid').count()==0,'invalid email cannot advance or create an account')
  p.locator('#entry-email').fill('amina@example.com');p.locator('#entry-confirm').fill('Different-password');p.locator('#gate-entry-form [type=submit]').click()
  check('do not match' in p.locator('#entry-error').inner_text(),'signup checks password confirmation before continuing')
  p.locator('#entry-confirm').fill('Correct-Horse-123');p.locator('#entry-nickname').fill('Amina');p.locator('#gate-entry-form [type=submit]').click();p.wait_for_selector('.gate-avatar-grid')
  check(p.locator('.gate-avatar-card').count()==6 and p.locator('input[type=password]').count()==0,'signup advances to six original premium avatar choices without retaining password fields in the page')
  check('Correct-Horse' not in p.evaluate('JSON.stringify(localStorage)') and 'amina@example.com' not in p.evaluate('JSON.stringify(localStorage)'),'credentials are absent from browser application storage')
  p.locator('input[value=nova]').focus();p.keyboard.press('ArrowRight');check(p.locator('input[value=atlas]').is_checked(),'keyboard arrows select an avatar and update its native radio state')
  choose(p,'pip');check('Pip is ready' in p.locator('[data-avatar-cheer]').inner_text(),'avatar selection produces a character-specific welcome')
  p.screenshot(path='/workspace/cloud-onboarding/account-avatars.png',full_page=True)
  enter(p);home(p)
  first=profile(p);uid=first['authUserId']
  check(first['avatarId']=='pip' and first['name']=='Amina' and first['xp']==88 and first['done']==[1],'signup binds the chosen avatar while retaining explicitly selected existing progress')
  check(p.locator('.profile .iu-profile-avatar').count()==1 and p.locator('.iu-account-menu').count()==1,'the selected avatar appears in the portal account menu')
  check(p.url.endswith('#home'),'successful signup redirects directly to Home')
  for route,selector in [('dashboard','.sd-page'),('teacher','.td-tabs'),('home','.iu-expedition')]:
   p.evaluate('(r)=>location.hash=r',route);p.wait_for_selector(selector);p.wait_for_selector('.iu-account-menu')
   for width in [768,390,320]:
    p.set_viewport_size({'width':width,'height':950});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(route,width)
    p.locator('.iu-account-menu summary').click();box=p.locator('.iu-account-menu>div').bounding_box();assert box['x']>=0 and box['x']+box['width']<=width,(route,width,box);p.keyboard.press('Escape')
  p.set_viewport_size({'width':1680,'height':1100})
  check(True,'the signed-in avatar and account menu fit student, teacher and Home layouts down to 320px')
  cookies=context.cookies();check(len([c for c in cookies if c['name'].startswith('inneru_') and c['httpOnly'] and c['sameSite']=='Lax'])==2,'account sessions use HttpOnly SameSite cookies')
  check(not p.evaluate('document.cookie.includes("inneru_access")') and 'access-' not in p.evaluate('JSON.stringify(localStorage)'),'JavaScript and localStorage do not expose account session tokens')
  result=p.request.get(ORIGIN+'/api/auth?action=session');check(result.headers['cache-control']=='no-store, private' and 'access_token' not in result.text() and result.json()['user']['id']==uid,'session responses are private, uncached and contain no tokens')
  denied=p.request.post(ORIGIN+'/api/auth?action=avatar',headers={'Origin':'https://unrelated.example'},data={'avatarId':'ember'})
  check(denied.status==403 and api(p,'session')['user']['avatarId']=='pip','a cross-origin write cannot change the selected avatar')
  denied=p.request.post(ORIGIN+'/api/auth?action=avatar',data={'avatarId':'not-in-catalog'})
  check(denied.status==400,'the server accepts only avatar IDs in the published catalog')
  logout(p);check(profile(p)['xp']==0 and 'authUserId' not in profile(p),'sign out removes the active learner from the shared device')
  check(p.evaluate('(id)=>JSON.parse(localStorage.getItem("inneru-account-progress-v1:"+id)).xp',uid)==88,'sign out preserves that account’s learning in its separate local archive')
  role(p);signin(p,password='Wrong-password-123');p.wait_for_selector('#entry-error:not(:empty)');check('incorrect' in p.locator('#entry-error').inner_text(),'an incorrect password stays on sign-in with a clear error')
  signin(p);home(p);check(profile(p)['xp']==88 and profile(p)['avatarId']=='pip','returning sign-in restores the same account’s progress and avatar')
  p.locator('.iu-account-menu summary').click();p.locator('.iu-account-menu a').click();p.wait_for_selector('.gate-avatar-grid')
  check(p.locator('input[type=password]').count()==0,'an authenticated user can change avatar without entering a password again')
  choose(p,'ember');enter(p);home(p);check(profile(p)['avatarId']=='ember' and profile(p)['xp']==88 and api(p,'session')['user']['avatarId']=='ember','avatar changes persist in the real account profile without changing XP')
  p.request.post(ORIGIN+'/__test/expire');check(api(p,'session')['authenticated'],'an expired access token is renewed using the HttpOnly refresh cookie')
  logout(p);p.request.post(ORIGIN+'/__test/clear-avatar',data={'email':'amina@example.com'});role(p);signin(p);p.wait_for_selector('.gate-avatar-grid')
  choose(p,'ember');enter(p);home(p);check(profile(p)['avatarId']=='ember' and profile(p)['xp']==88,'an existing account without an avatar can finish avatar selection and enter Home')
  logout(p);role(p);signup(p,'sara@example.com','Sara');choose(p,'luna');enter(p);home(p)
  check(profile(p)['xp']==0 and profile(p)['authUserId']!=uid and profile(p)['avatarId']=='luna','a different account receives its own progress and avatar')
  logout(p);role(p);signin(p);home(p);check(profile(p)['xp']==88 and profile(p)['authUserId']==uid,'switching back restores the original learner without mixing account progress')
  logout(p);role(p);signup(p,'confirm@example.com','New explorer');choose(p,'nova');enter(p);p.wait_for_selector('.gate-confirm-art')
  check('/login' in p.url and not any(c['name']=='inneru_access' for c in context.cookies()),'email-confirmation accounts wait for verification and never report a signed-in session')
  p.goto(ORIGIN+'/login?nosw=1&token_hash=confirm-test&type=email');home(p)
  check(profile(p)['avatarId']=='nova' and 'token_hash' not in p.url,'confirmed email completes signup with the selected avatar and a clean Home URL')
  logout(p);role(p);p.locator('[data-auth-mode=recover]').click();p.locator('#entry-email').fill('amina@example.com');p.locator('#gate-recovery-form [type=submit]').click();p.wait_for_selector('#entry-error.is-success')
  check('reset link' in p.locator('#entry-error').inner_text(),'password recovery returns an inbox instruction without revealing other accounts')
  p.goto(ORIGIN+'/login?nosw=1&token_hash=recovery-test&type=recovery');p.wait_for_selector('#gate-recovery-form #entry-confirm')
  p.locator('#entry-password').fill('New-Secure-Password-123');p.locator('#entry-confirm').fill('New-Secure-Password-123');p.locator('#gate-recovery-form [type=submit]').click();home(p)
  check(profile(p)['authUserId']==uid and profile(p)['xp']==88,'verified password recovery returns to Home with the same learner record')
  logout(p);role(p,'teacher');signin(p,password='New-Secure-Password-123');home(p)
  check(p.url.endswith('#home'),'teacher-role sign-in also follows the requested direct Home redirect')
  # Real signup/login screens remain usable at every supported width.
  logout(p)
  for width in [1680,1024,768,390,320]:
   p.set_viewport_size({'width':width,'height':950});role(p);signup(p,'layout@example.com','Layout')
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
   check(p.locator('.gate-avatar-card').count()==6,f'{width}px signup and avatar chooser fit without horizontal page overflow')
  p.emulate_media(reduced_motion='reduce');p.locator('input[value=nova]').check()
  check(p.locator('.gate-avatar-card .iu-avatar-art').first.evaluate('e=>getComputedStyle(e).animationName')=='none','reduced motion removes character wiggles and avatar entrance animation')
  p.emulate_media(reduced_motion='no-preference');p.locator('[data-action-motion]').click();check(p.locator('.iu-gate').get_attribute('data-visual-motion')=='off','the entry’s own motion control also pauses avatar animation')
  p.set_viewport_size({'width':1680,'height':1100});p.screenshot(path='/workspace/cloud-onboarding/account-entry-avatars-final.png',full_page=True)
  # Unconfigured deployments expose a real setup state instead of fake accounts.
  p.request.post(ORIGIN+'/__test/config',data={'enabled':False});role(p);p.wait_for_selector('.gate-account-unavailable')
  check('not available yet' in p.locator('.gate-account-unavailable').inner_text(),'missing account configuration is visible rather than simulated as a successful login')
  signup(p,'blocked@example.com','Blocked');choose(p,'atlas');enter(p);p.wait_for_selector('#entry-error:not(:empty)')
  check('not connected' in p.locator('#entry-error').inner_text() and '/login' in p.url,'an unconfigured signup cannot redirect as if an account had been created')
  p.request.post(ORIGIN+'/__test/config',data={'enabled':True})
  # The worker must never cache the session or return app HTML for an auth error.
  offline=browser.new_context();q=offline.new_page();q.goto(ORIGIN+'/login.html');q.evaluate('navigator.serviceWorker.ready');q.wait_for_function('navigator.serviceWorker.controller!==null')
  q.wait_for_selector('.gate-role-grid');q.evaluate('fetch("/api/auth?action=session",{cache:"no-store"}).then(r=>r.json())')
  cached=q.evaluate('(async()=>{const keys=await caches.keys();const all=(await Promise.all(keys.map(async k=>(await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)))).flat();return all})()')
  check('/assets/avatars/explorers.png' in cached and not any(x.startswith('/api/') for x in cached),'avatar artwork is cached while account API requests are excluded from the service worker')
  offline.set_offline(True)
  check(q.evaluate('fetch("/api/auth?action=session").then(()=>false,()=>true)'),'offline account requests fail clearly instead of replaying another session or cached HTML')
  offline.close()
  check(not errors,'no browser JavaScript errors across signup, login, avatars, recovery and redirects: '+str(errors))
  browser.close()
 print(str(checks)+' account-entry checks passed.')
finally:proc.terminate();proc.wait(timeout=10)
