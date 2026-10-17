"""Student entry regressions: signup limits, missing mail, recovery and valid sessions.
Uses local Auth fixtures and PostgreSQL only. Never sends email or tests live passwords.
"""
import json,os,subprocess,uuid,datetime,email.utils
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ENV={**os.environ,'INNERU_DB_TEST_CONTAINER':'inneru-db-check','INNERU_DB_TEST_DATABASE':'inneru_auth_recovery_check'}
subprocess.run(['python3',str(ROOT/'_dev-tools/prepare-db-tests.py')],env=ENV,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
# A retained test DB may contain this suite's earlier fictional accounts.
subprocess.run(['docker','exec','-i','inneru-db-check','psql','-U','postgres','-d',ENV['INNERU_DB_TEST_DATABASE'],'-q'],input="delete from auth.users;",text=True,check=True)
proc=subprocess.Popen(['node',str(ROOT/'_dev-tools/account-test-server.js')],env=ENV,stdout=subprocess.PIPE,stderr=open('/workspace/cloud-onboarding/auth-recovery-fixture.log','w'),text=True)
ORIGIN=json.loads(proc.stdout.readline())['origin'];checks=0;errors=[];PASS='Fixture-Only-Entry-123'
def check(v,m):
 global checks
 assert v,m
 checks+=1;print('PASS',m,flush=True)
def limit(p,action,**options):p.request.post(ORIGIN+'/__test/auth-limit',data={'action':action,**options})
def counts(p,action):return p.request.get(ORIGIN+'/__test/auth-counts').json().get(action,0)
def api(p,action,data=None):return p.request.get(ORIGIN+'/api/auth?action='+action) if data is None else p.request.post(ORIGIN+'/api/auth?action='+action,data=data)
def new_signup(p,email,code='10G2'):
 return api(p,'signup',{'email':email,'password':PASS,'name':'Entry fixture','avatarId':'nova','requestedRole':'student','classCode':code})
def signup_screen(p,email,code='10G2'):
 p.goto(ORIGIN+'/login.html?nosw=1&role=student');p.wait_for_selector('#entry-email');p.locator('[data-auth-mode=signup]').first.click();p.locator('#entry-email').fill(email);p.locator('#entry-nickname').fill('Entry fixture');p.locator('#entry-class').select_option(code);p.locator('#entry-password').fill(PASS);p.locator('#entry-confirm').fill(PASS);p.locator('#gate-entry-form [type=submit]').click();p.locator('input[value=nova]').check()
def submit_avatar(p):p.locator('#gate-avatar-form [type=submit]').click()
def signin(p,email):
 p.locator('#entry-email').fill(email);p.locator('#entry-password').fill(PASS);p.locator('#gate-entry-form [type=submit]').click()
def dashboard(p):
 p.wait_for_url('**/index.html#dashboard');p.wait_for_selector('.sd-page')
 # Learning sync intentionally asks for a version choice if local state changes
 # during restore. Exercise that choice rather than confusing it with Auth failure.
 p.wait_for_function('window.InneruCloud&&["Saved to your account","Choose a saved version"].includes(InneruCloud.status())')
 if p.locator('[data-cloud-use=remote]').count():p.locator('[data-cloud-use=remote]').click()
 p.wait_for_function('window.InneruCloud.status()==="Saved to your account"')

def signout(p):api(p,'logout',{});p.goto(ORIGIN+'/login.html?nosw=1&role=student');p.wait_for_selector('#entry-email')
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  def page(width=1440):
   c=browser.new_context(service_workers='block',viewport={'width':width,'height':1000},reduced_motion='reduce');p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));return p
  p=page();p.goto(ORIGIN+'/login.html?nosw=1');existing='returning-entry@example.com';first=new_signup(p,existing).json()['user'];signout(p)
  signup_screen(p,existing);submit_avatar(p);p.wait_for_selector('#entry-error:not(:empty)')
  check('use Sign in' in p.locator('#entry-error').inner_text() and p.locator('#gate-avatar-form [data-auth-mode=login]').is_enabled(),'an existing account receives a direct route from avatar signup to sign-in')
  before=counts(p,'signup');p.locator('#gate-avatar-form [data-auth-mode=login]').click()
  check(p.locator('#entry-email').input_value()==existing and p.locator('#entry-password').input_value()=='' and not p.locator('#entry-class').count(),'switching to sign-in keeps the email, clears the password and does not request signup details')
  signin(p,existing);dashboard(p);u=api(p,'session').json()['user']
  check(u['id']==first['id'] and u['classCode']=='10G2' and u['role']=='student' and counts(p,'signup')==before,'returning students sign in to the same student account without another signup')
  # A successful signup requiring confirmation does not pretend mail was delivered.
  signout(p);signup_screen(p,'confirm@example.com','10G5');submit_avatar(p);p.wait_for_selector('[data-auth-resend]')
  check(not api(p,'session').json()['authenticated'] and 'spam folder' in p.locator('.gate-confirm-copy').inner_text(),'a student awaiting email confirmation is not granted an unverified session')
  p.locator('[data-auth-mode=login]').click();check(p.locator('#entry-email').input_value()=='confirm@example.com','confirmation help keeps the student email when returning to sign-in')
  signin(p,'confirm@example.com');p.wait_for_selector('[data-confirmation-help]');check('Confirm your email' in p.locator('#entry-error').inner_text(),'unconfirmed sign-in gives a specific explanation and recovery action')
  p.locator('[data-confirmation-help]').click();before=counts(p,'signup');resends=counts(p,'resend');p.locator('[data-auth-resend]').click();p.wait_for_function('document.querySelector("[data-confirmation-status]").textContent.includes("requested")')
  check(counts(p,'resend')==resends+1 and counts(p,'signup')==before and p.locator('[data-auth-resend]').is_disabled(),'requesting confirmation uses the resend endpoint once, without creating another account')
  check(not api(p,'session').json()['authenticated'],'requesting another email never bypasses email verification')
  p.goto(ORIGIN+'/login?nosw=1&token_hash=confirm-test&type=email');dashboard(p)
  check(api(p,'session').json()['user']['classCode']=='10G5' and p.locator('a[href="#teacher"]').count()==0,'a confirmed email enters Student Dashboard with its original class and student permissions')
  # Email sending limits must not stop a confirmed student signing in.
  q=page(390);signup_screen(q,'mail-limited-entry@example.com');q.clock.install();limit(q,'signup',code='over_email_send_rate_limit',retryAfter=120)
  before=counts(q,'signup');submit_avatar(q);q.wait_for_selector('#entry-error:not(:empty)')
  check('Account emails are temporarily limited' in q.locator('#entry-error').inner_text() and 'email delivery' in q.locator('#entry-error').inner_text(),'signup email quotas explain the missing email and school delivery action')
  check(q.locator('#gate-avatar-form [type=submit]').is_disabled() and 'PAUSED' in q.locator('[data-submit-label]').inner_text() and q.locator('[data-auth-mode=login]').is_enabled(),'a quota pauses signup while leaving existing-account sign-in available')
  q.locator('#gate-avatar-form').evaluate('f=>f.requestSubmit()');check(counts(q,'signup')==before+1,'a repeated form submit during cooldown cannot hit the provider again')
  check(q.evaluate('document.documentElement.scrollWidth<=innerWidth'),'the recovery message, countdown and sign-in link fit mobile screens')
  q.screenshot(path='/workspace/cloud-onboarding/auth-recovery-mobile.png',full_page=True)
  q.locator('[data-avatar-back]').click();q.locator('#entry-password').fill(PASS);q.locator('#entry-confirm').fill(PASS);q.locator('#gate-entry-form [type=submit]').click();q.locator('input[value=nova]').check()
  check(q.locator('#gate-avatar-form [type=submit]').is_disabled(),'going back through account details cannot bypass the local signup pause')
  q.locator('[data-auth-mode=login]').click();q.clock.resume();signin(q,existing);dashboard(q)
  check(api(q,'session').json()['user']['id']==first['id'] and counts(q,'signup')==before+1,'email quota recovery signs in the confirmed student without another signup or email')
  # Honor provider retry timing, then allow one explicit retry; never auto-submit.
  r=page();signup_screen(r,'request-limited-entry@example.com','10G3');r.clock.install();limit(r,'signup',code='over_request_rate_limit',retryAfter=2);before=counts(r,'signup');submit_avatar(r);r.wait_for_selector('#entry-error:not(:empty)');r.clock.run_for(2500)
  check(r.locator('#gate-avatar-form [type=submit]').is_enabled() and counts(r,'signup')==before+1,'the provider retry interval expires without automatically resubmitting credentials')
  r.clock.resume();submit_avatar(r);dashboard(r);check(api(r,'session').json()['user']['classCode']=='10G3','one explicit retry after the pause creates the correct student account')
  # Sign-in has a separate cooldown and also does not create a second user.
  s=page();s.goto(ORIGIN+'/login.html?nosw=1&role=student');s.wait_for_selector('#entry-email');s.clock.install();limit(s,'login',retryAfter=2);before=counts(s,'signup');signin(s,existing);s.wait_for_selector('#entry-error:not(:empty)')
  check('Sign-in attempts' in s.locator('#entry-error').inner_text() and s.locator('#gate-entry-form [type=submit]').is_disabled(),'a sign-in rate limit is distinguished from an email sending limit')
  s.clock.run_for(2500);s.clock.resume();s.locator('#gate-entry-form [type=submit]').click();dashboard(s)
  check(api(s,'session').json()['user']['id']==first['id'] and counts(s,'signup')==before,'sign-in recovers after throttling without creating another student')
  # Preserve valid access/refresh cookies if Supabase temporarily throttles them.
  cookies=lambda:sorted((c['name'],c['value']) for c in s.context.cookies() if c['name'].startswith('inneru_'))
  old=cookies();refreshes=counts(s,'refresh');limit(s,'session',retryAfter=2);response=api(s,'session')
  check(response.status==429 and 'set-cookie' not in response.headers and cookies()==old and counts(s,'refresh')==refreshes,'a throttled account check preserves cookies and does not trigger a refresh storm')
  check(api(s,'session').json()['user']['id']==first['id'],'the same signed-in identity recovers when the account check succeeds')
  s.request.post(ORIGIN+'/__test/expire');old=cookies();limit(s,'refresh',retryAfter=2);response=api(s,'session')
  check(response.status==429 and 'set-cookie' not in response.headers and cookies()==old,'a throttled token refresh does not clear a valid refresh cookie')
  check(api(s,'session').json()['user']['id']==first['id'],'token refresh can succeed on the next explicit account check')
  # Safe, distinct service errors; no upstream SMTP details or credentials leak.
  v=page();v.goto(ORIGIN+'/login.html?nosw=1');limit(v,'signup',status=403,code='email_address_not_authorized',retryAfter=None);response=new_signup(v,'recipient-entry@example.com')
  check(response.status==400 and response.json()['code']=='email_address_not_authorized' and 'email delivery settings' in response.json()['error'],'SMTP recipient restrictions identify email configuration rather than an expired session')
  limit(v,'signup',status=500,code='unexpected_failure',message='Error sending confirmation email: smtp-fixture-secret');response=new_signup(v,'delivery-entry@example.com')
  check(response.status==503 and response.json()['code']=='email_delivery_failed' and 'smtp-fixture-secret' not in response.text(),'SMTP failures give actionable guidance without exposing provider internals')
  deadline=email.utils.format_datetime(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(seconds=20),usegmt=True);limit(v,'signup',retryAfter=deadline);response=new_signup(v,'retry-date-entry@example.com')
  check(response.status==429 and 1<=response.json()['retryAfter']<=20 and response.headers['retry-after']==str(response.json()['retryAfter']),'HTTP-date Retry-After headers become a bounded retry interval')
  # A resend email quota also keeps verification intact and the sign-in escape open.
  w=page();w.goto(ORIGIN+'/login.html?nosw=1&role=student');w.wait_for_selector('#entry-email');limit(w,'login',status=400,code='email_not_confirmed');signin(w,'confirm@example.com');w.wait_for_selector('[data-confirmation-help]');w.locator('[data-confirmation-help]').click();limit(w,'resend',code='over_email_send_rate_limit',retryAfter=120);w.locator('[data-auth-resend]').click();w.wait_for_selector('#entry-error:not(:empty)')
  check(w.locator('[data-auth-resend]').is_disabled() and w.locator('[data-auth-mode=login]').is_enabled(),'a resend quota disables further email attempts while keeping sign-in usable')
  for width in [1440,768,390,320]:
   w.set_viewport_size({'width':width,'height':1000});check(w.evaluate('document.documentElement.scrollWidth<=innerWidth'),'confirmation recovery fits '+str(width)+'px')
  check(PASS not in s.evaluate('JSON.stringify(localStorage)+JSON.stringify(sessionStorage)'),'passwords remain absent from browser application storage')
  check(not errors,'no uncaught browser errors through quota, confirmation, sign-in and recovery flows: '+str(errors))
  browser.close()
 print(checks,'auth-recovery checks passed.')
finally:proc.terminate();proc.wait(timeout=10)
