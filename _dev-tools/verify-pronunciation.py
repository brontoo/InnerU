"""Arabic audio coverage and voice policy, using only isolated local accounts.
Native synthesis is intercepted: text/voice/cancellation are verifiable; acoustic
quality and installed device voices require the listening checklist in ARABIC-AUDIO.md.
"""
import json,re,struct
from pathlib import Path
from test_support import DatabaseFixture,playwright_session,launch,new_context,artifact
f=DatabaseFixture('inneru_arabic_audio_check');checks=0;errors=[];report=[]
STUB="""(()=>{const events=new EventTarget();window.audio={calls:[],cancels:0,voices:[{name:'English',lang:'en-GB',localService:true},{name:'Arabic Egypt',lang:'ar-EG',localService:true},{name:'Arabic UAE',lang:'ar-AE',localService:true}]};window.SpeechSynthesisUtterance=function(text){this.text=text;};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>audio.voices,addEventListener:(...a)=>events.addEventListener(...a),removeEventListener:(...a)=>events.removeEventListener(...a),cancel:()=>audio.cancels++,speak:u=>{window.lastAudio=u;audio.calls.push({text:u.text,lang:u.lang,voice:u.voice?.name,rate:u.rate});}}});window.voicesChanged=()=>events.dispatchEvent(new Event('voiceschanged'));})();"""
PREF="localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'ar',guided:false}));"
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS '+message,flush=True)
def calls(p):return p.evaluate('audio.calls')
def saved(p):return p.evaluate('JSON.stringify({xp:state.xp,done:state.done,rewards:state.rewards,assessment:state.assessment,learning:state.learning,muscle:state.muscle,circ:state.circ,respiratory:state.respiratory,integumentary:state.integumentary,excretory:state.excretory,review:state.review})')
def go(p,route,selector='#main'):
 n=len(calls(p));p.evaluate('(r)=>location.hash=r',route);p.wait_for_selector(selector);p.wait_for_selector('.speech-parts select');p.wait_for_timeout(120)
 if p.evaluate('window.InneruAccess?.user?.role')=='student':p.evaluate('InneruCloud.flush()');p.wait_for_function('InneruCloud.status()==="Saved to your account"')
 check(len(calls(p))==n,route+' never autoplays')
 check(p.locator('.speech-parts select').evaluate('(s)=>s.options.length===0||s.selectedIndex>=0'),route+' displays a selected reading part instead of an empty dropdown')
def listen(p,button,key):
 n=len(calls(p));before=saved(p) if p.locator('#main').count() else None
 button.click();p.wait_for_function('(n)=>audio.calls.length>n',arg=n);row=calls(p)[-1]
 check(row['lang']=='ar-AE' and row['voice']=='Arabic UAE' and bool(re.search('[\u0600-\u06ff]',row['text'])),key+' requests Arabic with the preferred local UAE voice')
 check(not any(x in row['text'] for x in ['Listen / Stop','Preparing read-aloud','كلمة-مرور-خاصة']),key+' excludes audio controls and private form values')
 if before is not None:
  after=saved(p)
  if after!=before:Path(artifact('changed-learning.json')).write_text(json.dumps({'part':key,'before':json.loads(before),'after':json.loads(after)},ensure_ascii=False,indent=2))
  check(after==before,key+' leaves learning, answers and rewards unchanged')
 p.evaluate('InneruSpeech.stop()');report.append({'part':key,**row});return row
try:
 with playwright_session() as pw:
  b=launch(pw);teacher,t=f.account(b,'riham.hassan@moe.sch.ae','Local teacher');student,u=f.account(b,'audio-local@example.com','Local learner','10G5');owner,o=f.account(b,'audio-owner@example.com','Local owner');f.sql("update public.profiles set role='admin' where id='"+o['id']+"'");f.unlock(teacher)
  for p in [teacher,student,owner]:p.context.add_init_script(STUB+'\n'+PREF);p.on('pageerror',lambda e:errors.append(str(e)))
  c=new_context(b,service_workers='block',reduced_motion='reduce');c.add_init_script(STUB+'\n'+PREF);login=c.new_page();login.on('pageerror',lambda e:errors.append(str(e)))
  for role in ['student','teacher']:
   login.goto(f.origin+'/login.html?role='+role);login.wait_for_selector('.speech-parts');login.wait_for_selector('#entry-email');login.locator('#entry-password').fill('كلمة-مرور-خاصة');login.wait_for_timeout(150)
   check(not calls(login),role+' sign-in loads Arabic audio without autoplay')
   check(login.locator('.speech-parts select').input_value()=='0',role+' Arabic sign-in displays its initial reading-part label')
   listen(login,login.locator('.speech-parts button'),role+' sign-in')
   login.locator('[data-auth-mode=signup]').first.click();login.wait_for_timeout(150);listen(login,login.locator('.speech-parts button'),role+' signup')
   login.locator('[data-auth-mode=login]').first.click();login.locator('[data-auth-mode=recover]').first.click();login.wait_for_timeout(150);listen(login,login.locator('.speech-parts button'),role+' recovery')
   login.locator('[data-auth-mode=login]').first.click();login.locator('[data-auth-mode=signup]').first.click();login.locator('#entry-email').fill('audio-avatar-'+role+'@example.com');login.locator('#entry-nickname').fill('Local explorer');login.locator('#entry-password').fill('Local-Audio-Fixture-123');login.locator('#entry-confirm').fill('Local-Audio-Fixture-123')
   if role=='student':login.locator('#entry-class').select_option('10G5')
   login.locator('#gate-entry-form [type=submit]').click();login.wait_for_selector('.gate-avatar-grid');login.wait_for_timeout(150);listen(login,login.locator('.speech-parts button'),role+' avatar chooser without account creation')
  student.goto(f.origin+'/index.html?nosw=1#dashboard');student.wait_for_selector('.sd-page');student.wait_for_selector('.speech-parts')
  for route,selector in [('home','.explore-screen'),('dashboard','.sd-page'),('dashboard?view=mastery','[data-mastery]'),('badges','.sd-collection'),('glossary','.glossary-page'),('review','.rs-studio'),('daily','#daily-options'),('detective','.dd-page'),('connect','.bt-mission'),('capstone','#main'),('about','#main'),('privacy','#main'),('sources','.sourcelist'),('attribution','#main')]:
   go(student,route,selector);check(student.locator('.speech-parts option').count()>0,route+' has selectable visible reading parts');listen(student,student.locator('.speech-parts button'),route)
  go(student,'badges','.sd-collection');student.locator('[data-sd-badge="skeletal-mission-1"]').click();student.wait_for_selector('dialog[open] .speech-local button');listen(student,student.locator('dialog[open] .speech-local button'),'achievement details dialog');student.keyboard.press('Escape')
  go(student,'glossary','.glossary-page');options=student.locator('.speech-parts option').all_text_contents();check(len(options)>=72,'all 71 glossary terms have individual Arabic reading destinations')
  count=0
  for i in range(len(options)):
   student.locator('.speech-parts select').select_option(str(i));row=listen(student,student.locator('.speech-parts button'),'glossary '+str(i));count+=1
  student.screenshot(path=artifact('arabic-glossary-audio.png'),full_page=True)
  go(student,'mission/1','[data-skel-question]');student.locator('.term').first.click();student.wait_for_selector('#term-pop:not([hidden]) .speech-local button');listen(student,student.locator('#term-pop .speech-local button'),'inline glossary');student.screenshot(path=artifact('arabic-glossary-popover-audio.png'));student.keyboard.press('Escape')
  # Every existing authorized teacher lesson/final, with no assessment interaction.
  teacher.goto(f.origin+'/index.html?nosw=1#teacher');teacher.wait_for_selector('.speech-parts');baseline=f.sql('select jsonb_agg(to_jsonb(p) order by user_id) from public.student_progress p;')
  worlds=teacher.evaluate('InneruLearning.worlds.map(w=>({id:w.id,route:w.route,titles:w.titles,final:w.final}))')
  for w in worlds:
   for n in range(1,len(w['titles'])+2):
    route=('mission/'+str(n) if w['id']=='skeletal' else 'muscle/mission/'+str(n) if w['id']=='muscle' else w['route'][1:]+'/'+('mastery' if n>len(w['titles']) else ('' if w['id']=='circ' else 'mission/')+str(n)))+'?preview=1'
    go(teacher,route,'[data-mission-objective]');listen(teacher,teacher.locator('.speech-parts button'),route)
    guide=teacher.locator('[data-guided-toggle]');guide.click();teacher.wait_for_timeout(80);read=teacher.locator('[data-iu-guide-listen]:visible').first
    if read.count():listen(teacher,read,route+' Guided')
    guide.click()
  check(f.sql('select jsonb_agg(to_jsonb(p) order by user_id) from public.student_progress p;')==baseline,'all spoken teacher previews leave every student database record unchanged')
  for route in ['teacher','teacher?view=students','teacher?view=answers','teacher?view=controls','teacher?view=analytics','teacher?view=mastery','teacher?view=preview','teacher?view=board']:
   go(teacher,route,'.td-page');listen(teacher,teacher.locator('.speech-parts button'),route)
  owner.goto(f.origin+'/index.html?nosw=1#owner');owner.wait_for_selector('.speech-parts');listen(owner,owner.locator('.speech-parts button'),'owner assignments')
  owner.locator('#owner-10G5').select_option('');owner.locator('[data-owner-form] [type=submit]').click();owner.wait_for_selector('dialog[open] .speech-local button');listen(owner,owner.locator('dialog[open] .speech-local button'),'owner removal confirmation without saving');owner.keyboard.press('Escape')
  # Every named structure in the five retained anatomical studios plus the elbow.
  for route,root_selector,button_selector in [('world','[data-atlas=skeletal]','.body-atlas-parts [data-part]'),('respiratory','[data-atlas=respiratory]','.body-atlas-parts [data-part]'),('integumentary','[data-skin-explorer]','.body-atlas-parts [data-part]'),('muscle','.arm-lab','[data-arm-part]'),('excretory','.exc-explorer','[data-structure]'),('circulatory','.heart-lab','[data-heart-structure]')]:
   go(teacher,route,root_selector+' .structure-audio-button');root=teacher.locator(root_selector)
   modes=['organs','kidney','nephron','flow'] if route=='excretory' else ['chambers','valves','support','vessels','conduction'] if route=='circulatory' else [None]
   for mode in modes:
    if mode:root.locator(('[data-explorer-tab="'+mode+'"]') if route=='excretory' else '[data-heart-group="'+mode+'"]').click();teacher.wait_for_timeout(100)
    parts=root.locator(button_selector);check(parts.count()>0,route+' '+str(mode)+' exposes actual anatomy selections')
    for i in range(parts.count()):
     part=parts.nth(i);part.dispatch_event('click')
     if route=='muscle' and part.get_attribute('data-arm-part') not in ['biceps','triceps','tendons','bones']:
      check(root.locator('.structure-audio-button').is_disabled(),'whole-arm overview remains a reading part rather than an invented anatomy name');continue
     teacher.wait_for_function('(s)=>!document.querySelector(s+" .structure-audio-button").disabled',arg=root_selector);teacher.wait_for_timeout(50)
     row=listen(teacher,root.locator('.structure-audio-button'),route+' structure '+str(mode)+'/'+str(i));label=root.locator('.structure-audio-name').inner_text();plain=lambda s:re.sub('[\u064b-\u065f\u0670\u2066-\u2069]','',s)
     check(plain(label).replace('،',',') in plain(row['text']).replace('،',','),route+' pronounces the selected visible Arabic anatomical name')
   if route=='integumentary':
    root.locator('[data-part="Dermis"]').dispatch_event('click')
    for i in range(root.locator('[data-dermis-part]').count()):
     root.locator('[data-dermis-part]').nth(i).dispatch_event('click');teacher.wait_for_timeout(80);listen(teacher,root.locator('.structure-audio-button'),'skin dermal detail '+str(i))
  teacher.locator('.structure-audio-button').click();teacher.wait_for_timeout(100);teacher.evaluate('lastAudio.onend()');teacher.locator('[data-interface-language]').select_option('en');teacher.wait_for_timeout(150)
  check(teacher.locator('.structure-audio-button span').inner_text()=='Pronounce structure' and teacher.locator('.structure-audio-status').inner_text()=='','switching back to English restores the anatomy audio label and clears old Arabic status')
  teacher.locator('[data-interface-language]').select_option('ar');teacher.wait_for_timeout(150)
  # Every embedded bone/airway name has an authored Arabic pronunciation source.
  for route,model in [('world','skeletal'),('respiratory','respiratory')]:
   go(teacher,route,'[data-atlas]')
   raw=(Path(__file__).resolve().parents[1]/('assets/'+model+'-atlas.glb')).read_bytes();length,kind=struct.unpack('<II',raw[12:20]);data=json.loads(raw[20:20+length]);names=list({n['name'].replace('_',' ') for n in data['nodes'] if n.get('name')})
   missing=teacher.evaluate('(names)=>names.filter(n=>!/[\u0600-\u06ff]/.test(InneruLocale.t(n)))',names)
   check(not missing,model+' individual mesh names have Arabic speech text: '+str(missing))
  # Authorized historical fixture opens the capstone without altering real learners.
  cap,cu=f.account(b,'audio-capstone@example.com','Historical local fixture','10G5');cap.context.add_init_script(STUB+'\n'+PREF);cap.goto(f.origin+'/index.html?nosw=1#dashboard');cap.wait_for_function('window.InneruCloud?.status()==="Saved to your account"')
  snap=json.loads(cap.evaluate('JSON.stringify(state)'));snap['done']=list(range(1,9));snap['muscle']={**snap.get('muscle',{}),'done':list(range(1,9))}
  for key in ['integumentary','respiratory','circ','excretory']:snap[key]={**snap.get(key,{}),'mastery':True}
  encoded=json.dumps(snap).replace("'","''");f.sql("update public.student_progress set snapshot='"+encoded+"'::jsonb,revision=revision+1 where user_id='"+cu['id']+"'")
  cap.reload();cap.wait_for_function('keysEarned()===6||document.querySelector("[data-cloud-use=remote]")')
  if cap.locator('[data-cloud-use=remote]').count():cap.locator('[data-cloud-use=remote]').click()
  go(cap,'capstone','[data-cap-station]');listen(cap,cap.locator('.speech-parts button'),'unlocked capstone')
  # Voice policy, lazy voices, generic Arabic tags, fallback and stale callbacks.
  go(student,'mission/1','[data-skel-question]');wrong=student.evaluate('(checks[1][0].answer+1)%3');student.locator('[data-skel-question="0"][data-skel-answer="'+str(wrong)+'"]').click();student.wait_for_selector('#skeletal-check-0 .skel-answer-feedback + .support-read-controls button');listen(student,student.locator('#skeletal-check-0 .skel-answer-feedback + .support-read-controls button'),'actual incorrect-answer feedback');student.evaluate("document.querySelector('#skeletal-lab-body').insertAdjacentHTML('afterbegin','<p id=audio-probe data-support-instruction>يتطلّب الانقباض ATP، وينتقل CO₂.</p>')");student.wait_for_selector('#audio-probe + .support-read-controls button')
  row=listen(student,student.locator('#audio-probe + .support-read-controls button'),'scientific abbreviations');check('إيه تي بي' in row['text'] and 'سي أو اثنان' in row['text'] and 'أدينوسين' not in row['text'] and 'ثاني أكسيد الكربون' not in row['text'],'spoken abbreviations preserve written letters/digits without supplying definitions or changing visible ATP/CO₂')
  student.evaluate("audio.voices=[{name:'English',lang:'en-GB',localService:true},{name:'Arabic Egypt',lang:'ar-EG',localService:true},{name:'Arabic UAE',lang:'ar-AE',localService:false}]");listen(student,student.locator('#audio-probe + .support-read-controls button'),'preferred Arabic locale before other dialects')
  student.evaluate("audio.voices=[];setTimeout(()=>{audio.voices=[{name:'Arabic UAE',lang:'ar-AE',localService:true}];voicesChanged();},250)");listen(student,student.locator('#audio-probe + .support-read-controls button'),'late voices')
  student.evaluate("audio.voices=[{name:'English',lang:'en-GB',localService:true}];setTimeout(()=>{audio.voices.push({name:'Arabic UAE',lang:'ar-AE',localService:true});voicesChanged();},250)");listen(student,student.locator('#audio-probe + .support-read-controls button'),'Arabic voices arriving after English')
  student.evaluate("audio.voices=[{name:'Generic Arabic',lang:'ar',localService:true}]");n=len(calls(student));student.locator('#audio-probe + .support-read-controls button').click();student.wait_for_function('(n)=>audio.calls.length>n',arg=n);check(calls(student)[-1]['lang']=='ar','generic ar voices are accepted instead of falsely reported missing');student.evaluate('InneruSpeech.stop()')
  student.evaluate("audio.voices=[{name:'English',lang:'en-GB',localService:true}]");n=len(calls(student));student.locator('#audio-probe + .support-read-controls button').click();student.wait_for_function('document.querySelector("#audio-probe + .support-read-controls [role=status]").textContent.includes("صوت")');check(len(calls(student))==n,'missing Arabic voice reports a visible fallback and never reads Arabic using English')
  student.evaluate("audio.voices=[]");student.locator('#audio-probe + .support-read-controls button').click();student.keyboard.press('Escape');student.evaluate("audio.voices=[{name:'Arabic UAE',lang:'ar-AE',localService:true}];voicesChanged()");student.wait_for_timeout(1800);check(len(calls(student))==n,'cancelling while voices load prevents a delayed utterance')
  # A visible synthetic privacy fixture, not stored user work or assessment data.
  student.evaluate("document.querySelector('#audio-probe').innerHTML='نص عربي مسموح. <span hidden>إجابة مخفية</span><span data-iu-private>اسم خاص</span><input value=كلمة-مرور-خاصة><span class=support-read-controls>زر الصوت</span>'")
  row=listen(student,student.locator('#audio-probe + .support-read-controls button'),'visible-only reading');check(all(s not in row['text'] for s in ['إجابة مخفية','اسم خاص','كلمة-مرور-خاصة','زر الصوت']),'read-aloud excludes hidden answers, private text, field values and nested audio controls')
  student.evaluate("document.querySelector('#audio-probe').textContent=('نتعلّم العلوم خطوة واحدة في كل مرة. ').repeat(70)")
  n=len(calls(student));student.locator('#audio-probe + .support-read-controls button').click();student.wait_for_function('(n)=>audio.calls.length>n',arg=n)
  student.evaluate("(()=>{for(let i=0;i<100&&document.querySelector('#audio-probe + .support-read-controls button').getAttribute('aria-pressed')==='true';i++)lastAudio.onend();})()")
  spoken=calls(student)[n:];check(len(spoken)>1 and all(len(x['text'])<=350 for x in spoken) and sum(x['text'].count('نتعلّم') for x in spoken)==70,'long Arabic passages finish all bounded chunks without dropping text')
  student.locator('#audio-probe + .support-read-controls button').click();student.wait_for_function('(n)=>audio.calls.length>n',arg=len(calls(student))-1);cancelled=student.evaluate('audio.cancels');student.locator('[data-interface-language]').select_option('en');check(student.evaluate('audio.cancels')>cancelled,'switching languages cancels active Arabic speech');student.locator('[data-interface-language]').select_option('ar');student.wait_for_timeout(150)
  for width in [320,390,768,1440]:
   student.set_viewport_size({'width':width,'height':950});student.wait_for_timeout(100);check(student.evaluate('document.documentElement.scrollWidth<=innerWidth'),str(width)+'px Arabic audio toolbar fits without overflow');student.screenshot(path=artifact('arabic-audio-'+str(width)+'.png'))
  no=new_context(b,service_workers='block');no.add_init_script(PREF+"Object.defineProperty(window,'speechSynthesis',{value:undefined});");np=no.new_page();np.goto(f.origin+'/login.html?role=student');np.wait_for_selector('.speech-parts button');np.locator('.speech-parts button').click();check('متاحة' in np.locator('.speech-parts [role=status]').inner_text(),'Arabic controls explain missing native speech without hiding the text')
  empty=new_context(b,service_workers='block');empty.add_init_script(STUB+'\n'+PREF+"audio.voices=[];");ep=empty.new_page();ep.goto(f.origin+'/login.html?role=student');ep.wait_for_selector('.speech-parts button');ep.wait_for_timeout(350)
  ep.locator('.speech-parts button').focus();ep.keyboard.press('Enter');ep.evaluate("document.querySelector('#entry-main h1').insertAdjacentHTML('beforeend','<span class=support-read-controls>زر الصوت</span>')");ep.wait_for_timeout(150)
  check(ep.locator('.speech-parts button').get_attribute('aria-pressed')=='true','mounting an audio control does not cancel pending voice discovery')
  ep.wait_for_function('document.querySelector(".speech-parts [role=status]").textContent.includes("صوت") && document.querySelector(".speech-parts button").getAttribute("aria-pressed")==="false"')
  check(not calls(ep),'empty native voice lists finish with a visible Arabic explanation and no English fallback')
  ep.evaluate("audio.voices=[{name:'Arabic UAE',lang:'ar-AE',localService:true}]");ep.locator('.speech-parts button').click();ep.wait_for_function('audio.calls.length===1');ep.evaluate("document.querySelector('#entry-main h1 .support-read-controls').remove()");ep.wait_for_timeout(100)
  check(ep.locator('.speech-parts button').get_attribute('aria-pressed')=='true','removing audio UI leaves the selected spoken text active')
  ep.evaluate("document.querySelector('#entry-main h1').append(' تعليمات جديدة')");ep.wait_for_function('document.querySelector(".speech-parts button").getAttribute("aria-pressed")==="false"')
  check(ep.evaluate('audio.cancels')>0,'changing actual instruction text cancels stale reading')
  ep.evaluate("const heading=document.querySelector('#entry-main h1');heading.replaceWith(heading.cloneNode(true))");ep.wait_for_timeout(150);ep.locator('.speech-parts button').click();ep.wait_for_function('audio.calls.length===2')
  check(ep.locator('.speech-parts button').get_attribute('aria-pressed')=='true','replacing a heading with the same label refreshes its reading target')
  ep.evaluate("document.querySelector('#entry-main h1').remove()");ep.wait_for_function('document.querySelector(".speech-parts button").getAttribute("aria-pressed")==="false"')
  check(True,'removing a spoken heading cancels safely without a detached-range error')
  failed=new_context(b,service_workers='block');failed.add_init_script(STUB+'\n'+PREF);fp=failed.new_page();fp.route('**/speech-core.js*',lambda route:route.abort());fp.goto(f.origin+'/login.html?role=student');fp.wait_for_selector('.speech-load-notice button');check(not calls(fp),'failed audio downloads never start speech');fp.unroute('**/speech-core.js*');fp.locator('.speech-load-notice button').click();fp.wait_for_selector('.speech-parts button');check(fp.locator('.speech-load-notice').count()==0 and not calls(fp),'audio retry restores controls without autoplay or duplicate readers')
  offline=new_context(b);offline.add_init_script(STUB+'\n'+PREF);op=offline.new_page();op.goto(f.origin+'/login.html?role=student');op.wait_for_selector('.speech-parts');op.evaluate('navigator.serviceWorker.ready');op.wait_for_function('navigator.serviceWorker.controller!==null');op.reload();op.wait_for_selector('.speech-parts');op.wait_for_load_state('networkidle')
  cached=op.evaluate("async()=>{const names=await caches.keys();return(await Promise.all(names.map(async n=>(await(await caches.open(n)).keys()).map(r=>new URL(r.url).pathname)))).flat();}")
  check(all(url in cached for url in ['/speech-core.js','/speech-core.css','/locales/ar/speech.js']),'Arabic audio engine, styles and pronunciation catalogue are cached only after visiting')
  worker=offline.service_workers[0];worker.evaluate("()=>{self.fetch=()=>Promise.reject(new TypeError('Local offline fixture'));}");offline.set_offline(True);op.reload();op.wait_for_selector('.speech-parts button');op.wait_for_timeout(200)
  check(not calls(op),'offline Arabic restore never starts speech automatically');listen(op,op.locator('.speech-parts button'),'offline Arabic sign-in with installed local voice')
  check(not errors,'no uncaught browser errors across Arabic sound coverage: '+str(errors));b.close()
 print(str(checks)+' Arabic audio checks passed; '+str(len(report))+' spoken parts captured.',flush=True)
finally:
 Path(artifact('arabic-audio-requests.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));f.close()
