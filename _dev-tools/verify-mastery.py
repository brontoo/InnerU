"""Evidence-only mastery, retry help and account/class isolation. Local fixtures only."""
import json
from test_support import DatabaseFixture,playwright_session,launch,artifact,new_context
f=DatabaseFixture('inneru_mastery_check');checks=0;errors=[]
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS',message,flush=True)
def go(p,route):
 p.evaluate('(h)=>location.hash=h',route);p.wait_for_selector('[data-mastery]');p.wait_for_selector('[data-ms-objective]')
def saved(p):
 p.evaluate('InneruCloud.flush()');p.wait_for_function('InneruCloud.status()==="Saved to your account"')
def local(p):return p.evaluate('JSON.stringify(state)')
try:
 with playwright_session() as pw:
  b=launch(pw);teacher,t=f.account(b,'riham.hassan@moe.sch.ae','Riham local');other,mt=f.account(b,'sf.alhammadi@moe.sch.ae','Maryam local');p,u=f.account(b,'mastery-local@example.com','Explorer local','10G5');outside,ou=f.account(b,'mastery-outside@example.com','Outside local','10G1');f.unlock(teacher)
  p.add_init_script("""(()=>{window.__speech={calls:[],cancelled:0};class U{constructor(text){this.text=text;}}window.SpeechSynthesisUtterance=U;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'en-GB',localService:true},{lang:'ar-AE',localService:true}],speak:u=>window.__speech.calls.push({text:u.text,lang:u.lang}),cancel:()=>window.__speech.cancelled++},configurable:true});})();""")
  p.on('pageerror' ,lambda e:errors.append(str(e)));teacher.on('pageerror',lambda e:errors.append(str(e)))
  f.open(p,'dashboard','.sd-page');before=local(p);p.locator('a[href="#dashboard?view=mastery"]').click();p.wait_for_selector('[data-ms-objective]')
  check('Mastery' in p.title(),'student mastery has a descriptive page title')
  check(p.locator('[data-ms-objective]').count()==45,'all 39 missions and six finals have an explicit objective')
  check(p.locator('[data-ms-status=insufficient]').count()==45,'fresh or unrecorded work has insufficient evidence, never inferred mastery')
  p.wait_for_function('document.querySelector("[data-ms-feedback-status]").textContent==="Teacher comments are up to date."')
  check(local(p)==before,'reading mastery and fetching comments never saves or changes progress')
  result=p.evaluate('''()=>{
   const e=InneruMasteryCatalog.find(e=>e.id==='skeletal-1'),at='2026-01-01T12:00:00Z';
   const r=(i,correct=true,attempts=1,history=[])=>({id:e.checks[i],system:'skeletal',mission:1,correct,attempts,history,at});
   const status=rows=>InneruMasteryModel.objective(e,rows).status;
   const a=[r(0),r(1),r(2)],copy=JSON.stringify(a);
   return {one:status([r(0)]),repeated:status([r(0),r(0),r(0)]),secure:status(a),wrong:status([r(0),r(1),r(2,false)]),corrected:status([r(0,true,2,[{correct:false}]),r(1,true,2,[{correct:false}]),r(2)]),truncated:status(a.map(x=>({...x,attempts:7,history:[{correct:true},{correct:true},{correct:true},{correct:true}]}))),ungraded:status([r(0,null)]),forged:status(a.map(x=>({...x,system:'circ'}))),unknown:status(a.map(x=>({...x,id:'unknown'}))),mission:status(a.map(x=>({...x,mission:2}))),pure:JSON.stringify(a)===copy,alternatives:InneruMasteryModel.objective(InneruMasteryCatalog.find(e=>e.id==='circ-8'),Array.from({length:8},(_,i)=>({id:'circ:boss-'+i,system:'circ',mission:0,correct:true,attempts:1,history:[],at}))).status};
  }''')
  for key in ['one','repeated','wrong','corrected','truncated']:check(result[key]=='developing',key+' evidence does not overclaim Secure')
  for key in ['ungraded','forged','unknown','mission']:check(result[key]=='insufficient',key+' cannot supply graded objective evidence')
  check(result['secure']=='secure' and result['alternatives']=='secure' and result['pure'],'complete independent check sets support scoped Secure without mutating records')
  check(p.evaluate("(()=>{const e=InneruMasteryCatalog.find(e=>e.id==='skeletal-1');const row={id:'form:mission/1:fixture',system:'skeletal',kind:'submission',mission:0,correct:null,at:'2026-01-01T00:00:00Z',attempts:1,history:[]};const result=InneruMasteryModel.objective(e,[row]);return result.status==='insufficient'&&result.evidence.length===1})()"),'existing route-bound submitted work is visible without inventing an automatic grade')
  check(p.evaluate("(()=>{const e=InneruMasteryCatalog.find(e=>e.id==='muscle-1');const row=id=>({id,system:'muscle',mission:1,kind:'check',correct:true,at:'2026-01-01T00:00:00Z',attempts:1,history:[]});return InneruMasteryModel.objective(e,[...e.checks.map(row),{...row('muscle:m1-conscious'),correct:false}]).status==='developing'})()"),'a related lab-check error prevents Secure even when the core checks are correct')
  # Rewards/completion without assessment never alter the pure evidence model.
  check(p.evaluate('InneruMasteryModel.evaluate({xp:9000,done:[1,2,3,4,5,6,7,8],rewards:["boss"]}).every(r=>r.status==="insufficient")'),'XP, keys and completed missions alone never produce mastery')
  f.open(p,'mission/1','[data-skel-question]');wrong=p.evaluate('(checks[1][0].answer+1)%3');explanation=p.evaluate('checks[1][0].why')
  p.locator(f'[data-skel-question="0"][data-skel-answer="{wrong}"]').click();out=p.locator('#skeletal-check-0 .skel-answer-feedback')
  check('Not yet.' in out.inner_text() and explanation not in out.inner_text() and p.evaluate('state.xp')==0,'first incorrect check gives a supportive relevant hint without answer or XP')
  saved(p);go(p,'dashboard?view=mastery');card=p.locator('[data-ms-objective="skeletal-1"]');card.locator('summary').first.click()
  check(card.locator('.ms-status').inner_text().strip().endswith('Developing') and card.locator('text=The explanation is hidden for now.').count()==1,'student evidence shows the attempted check but protects the explanation before retry')
  f.open(p,'mission/1','[data-skel-question]')
  # Two current-view attempts ensure the learner has had a retry; state history also persists.
  for _ in range(2):p.locator(f'[data-skel-question="0"][data-skel-answer="{wrong}"]').click()
  check(explanation in p.locator('#skeletal-check-0 .skel-answer-feedback').inner_text(),'explanation is available after a chance to retry')
  for i,j in enumerate(p.evaluate('checks[1].map(q=>q.answer)')):p.locator(f'[data-skel-question="{i}"][data-skel-answer="{j}"]').click()
  saved(p);xp=p.evaluate('state.xp');before=local(p);go(p,'dashboard?view=mastery')
  check(p.locator('[data-ms-objective="skeletal-1"]').get_attribute('data-ms-status')=='secure','three correct checks with two correct first recorded responses support scoped Secure')
  p.locator('[data-ms-filter=system]').select_option('skeletal');p.locator('[data-ms-filter=mission]').select_option('skeletal-1');p.locator('[data-ms-filter=objective]').select_option('skeletal-1')
  check(p.locator('[data-ms-objective]').count()==1 and local(p)==before and xp==30,'filters and evidence views preserve the existing once-only rewards and unfinished mission')
  p.locator('.ms-evidence summary').first.focus();p.keyboard.press('Enter');check(p.locator('.ms-evidence').get_attribute('open') is not None,'evidence disclosures work with a keyboard')
  p.keyboard.press('Enter');p.keyboard.press('Tab');check(p.evaluate('document.activeElement!==document.body'),'focus can leave the disclosure without a keyboard trap')
  f.open(p,'mission/1','#division-check')
  for i,value in enumerate([0,0,0,1,1,1,1]):p.locator('#division-'+str(i)).select_option(str(value))
  p.locator('#division-check').click();saved(p);check(p.evaluate('state.xp')==50 and p.evaluate('state.done')==[],'the real investigation retains its original 20 XP without completing the mission')
  go(p,'dashboard?view=mastery');check(p.evaluate("(()=>{const r=InneruMasteryModel.evaluate(state.assessment.responses).find(r=>r.entry.id==='skeletal-1');return r.status==='secure'&&r.first===2&&r.evidence.some(e=>e.kind==='submission'&&e.correct===null)})()"),'real submitted lab work is shown without inferring a grade or additional first-check credit')
  # Representative existing checks in every other system: no new answer/reward logic.
  examples=[('muscle/mission/1','#m1-check-1 [data-option="0"]','.mq-feedback','muscle:m1-check-1'),('respiratory/mission/1','.resp-question button:has-text("Cells releasing ATP")','.resp-feedback','respiratory:1:q0'),('integumentary/mission/1','.resp-question button:has-text("It has only dead cells")','.resp-feedback','integumentary:1:q0'),('circulatory/1','[data-q="m1-c0"] [data-answer="1"]','.circ-feedback','circ:m1-c0'),('excretory/mission/1','[data-exc-question="0"] button:has-text("Kidneys")','.resp-feedback','excretory:1-q0')]
  for route,selector,output,response_id in examples:
   f.open(p,route,selector)
   if route=='circulatory/1':selector='[data-q=\"m1-c0\"] [data-answer=\"'+str(p.evaluate('(circLessons[0].checks[0][2]+1)%circLessons[0].checks[0][1].length'))+'\"]'
   xp_before=p.evaluate('state.xp');p.locator(selector).click()
   row=p.evaluate('(id)=>state.assessment.responses.find(r=>r.id===id)',response_id)
   check(row['correct'] is False and p.evaluate('state.xp')==xp_before,route+' incorrect response retains its original result and awards no XP')
   holder=p.locator(selector).locator('xpath=..')
   # Test the real recorded explanation is absent from first-retry output anywhere in the view.
   visible=p.locator(output).all_text_contents()
   check(any('Not yet.' in x for x in visible) and not any(row.get('feedback') and row['feedback'] in x for x in visible),route+' shows safe relevant help before the answer explanation')
   if route=='muscle/mission/1':
    p.locator('#m1-check-2 [data-sort-check]').click();check(p.evaluate('state.xp')==xp_before and p.evaluate('state.assessment.responses.find(r=>r.id===\"muscle:m1-check-2\").correct') is False,'a real unplaced muscle sort records the original incorrect result without XP')
   saved(p)
  second,_=f.account(b,'mastery-class-six@example.com','Class six local','10G6')
  # Teachers receive only the same authorized classroom snapshot as existing dashboards.
  f.open(teacher,'teacher?view=mastery','[data-mastery]');check(teacher.locator('[data-ms-objective]').count()==45 and 'Outside local' not in teacher.locator('[data-mastery]').inner_text(),'teacher mastery includes assigned students only')
  check(teacher.locator('[data-ms-filter=class] option').all_text_contents()==['All assigned classes','10G5','10G6'],'class filters cannot manufacture an unassigned class')
  check(teacher.locator('.ms-pagination').is_visible() and teacher.locator('[data-ms-count]').inner_text().startswith('90 '),'large assigned rosters paginate evidence without rendering every student at once')
  teacher.locator('[data-ms-page=next]').click();check(teacher.locator('[data-ms-page-label]').inner_text()=='Page 2 / 2' and teacher.locator('[data-ms-objective]').count()==45 and 'Class six local' in teacher.locator('[data-ms-results]').inner_text() and 'Explorer local' not in teacher.locator('[data-ms-results]').inner_text(),'next evidence page shows the remaining assigned objectives')
  check(teacher.locator('[data-ms-results]').evaluate('n=>n===document.activeElement'),'evidence pagination moves keyboard focus to the results')
  teacher.locator('[data-ms-filter=class]').select_option('10G6');check(teacher.locator('[data-ms-objective]').count()==45 and 'Class six local' in teacher.locator('[data-ms-results]').inner_text() and not teacher.locator('.ms-pagination').is_visible(),'class filtering resets pagination and selects only that assigned class')

  f.open(other,'teacher?view=mastery','[data-mastery]');check(other.locator('[data-ms-objective]').count()==45 and 'Explorer local' not in other.locator('[data-mastery]').inner_text(),'the other teacher sees only their own student')
  f.open(teacher,'teacher/student/'+ou['id']+'?view=mastery','[data-mastery]');check('Outside local' not in teacher.locator('[data-mastery]').inner_text(),'forged teacher student URL cannot expose another class')
  teacher_response=f.api(teacher,'feedback',{'studentId':u['id'],'responseId':'skeletal:1:q0','note':'Explain the structure using your diagram.','reviewed':True,'submissionAt':p.evaluate('state.assessment.responses.find(r=>r.id==="skeletal:1:q0").at')});check(teacher_response.ok,'assigned teacher can review actual recorded evidence')
  check(f.api(other,'feedback',{'studentId':u['id'],'responseId':'skeletal:1:q0','note':'No access','reviewed':True,'submissionAt':'2026-01-01T00:00:00Z'}).status==403,'unassigned teacher cannot change evidence feedback')
  f.sql("insert into public.teacher_feedback(teacher_id,student_id,response_id,note,reviewed,submission_at,updated_at) values('"+mt['id']+"','"+u['id']+"','skeletal:1:q0','Earlier teacher comment',true,'2025-01-01T00:00:00Z','2025-01-01T00:00:00Z');")
  feedback=f.api(p,'my-feedback');check(feedback.ok and feedback.json()['skeletal:1:q0']['note'].startswith('Explain'),'student reads their own latest teacher comment through RLS without older staffing feedback replacing it')
  check(f.api(outside,'my-feedback').json()=={} and outside.request.get(f.origin+'/api/learning?action=my-feedback&studentId='+u['id']).json()=={},'changing a student ID cannot fetch another student feedback')
  check(f.api(teacher,'my-feedback').status==403,'teacher cannot use the student feedback endpoint')
  anonymous=new_context(b).new_page();check(f.api(anonymous,'my-feedback').status==401,'anonymous feedback reads fail closed')
  raw=f.sql("set role authenticated;set request.jwt.claim.sub='"+ou['id']+"';select count(*) from public.teacher_feedback where student_id='"+u['id']+"';")
  check(raw=='0','database RLS excludes another student even outside the UI')
  f.open(p,'dashboard','.sd-page')
  go(p,'dashboard?view=mastery');p.wait_for_function('document.querySelector("[data-ms-feedback-status]").textContent==="Teacher comments are up to date."');c=p.locator('[data-ms-objective="skeletal-1"]');c.locator('.ms-evidence>summary').click()
  check('Explain the structure' in c.inner_text(),'student evidence includes the actual teacher comment, not an inferred grade')
  f.open(p,'dashboard','.sd-page');held=[];p.route('**/api/learning?action=my-feedback',lambda route:held.append(route))
  go(p,'dashboard?view=mastery');summary=p.locator('[data-ms-objective="skeletal-1"] .ms-evidence>summary');summary.focus();p.keyboard.press('Enter');p.wait_for_timeout(50)
  check(bool(held),'late-comment fixture holds the authenticated read')
  held[0].continue_();p.unroute('**/api/learning?action=my-feedback');p.wait_for_function('document.querySelector("[data-ms-feedback-status]").textContent==="Teacher comments are up to date."')
  check(summary.evaluate('s=>s===document.activeElement&&s.parentElement.open'),'late teacher comments preserve open evidence and keyboard focus')
  before=local(p)
  p.evaluate("InneruPreferences.set({language:'ar',guided:true})")
  p.wait_for_function('document.documentElement.dir==="rtl"');p.wait_for_timeout(500)
  check(p.locator('.iu-guidance').count()>0,'Guided mode provides a short next/back instruction sequence in mastery')
  check(p.locator('.ms-guidance > .support-read-controls:visible').count()==0,'Guided mode hides duplicate readers for the hidden standard instructions')
  guide=p.locator('.ms-guidance .iu-guidance');initial=guide.locator('[data-iu-guide-text]').inner_text()
  check(p.evaluate('__speech.calls.length')==0,'mastery navigation, feedback and language changes never autoplay speech')
  guide.locator('[data-iu-guide-next]').click();check(guide.locator('[data-iu-guide-text]').inner_text()!=initial,'Guided Next advances one mastery instruction without changing evidence')
  guide.locator('[data-iu-guide-back]').click();check(guide.locator('[data-iu-guide-text]').inner_text()==initial,'Guided Back restores the preceding mastery instruction')
  reader=guide.locator('[data-iu-guide-listen]');reader.focus();p.keyboard.press('Enter');check(p.evaluate('__speech.calls.at(-1).lang')=='ar-AE','mastery read-aloud uses the displayed Arabic only after keyboard activation')
  p.locator('[data-ms-objective=\"skeletal-1\"] .ms-feedback + .support-read-controls button').click();check('\u0627\u0644\u0647\u062f\u0641' in p.evaluate('__speech.calls.at(-1).text'),'objective feedback supports explicit Arabic read-aloud without reading private responses')
  cancelled=p.evaluate('__speech.cancelled');p.locator('[data-ms-filter=status]').select_option('developing');check(p.evaluate('__speech.cancelled')>cancelled,'changing mastery filters cancels active speech')
  p.locator('[data-ms-filter=status]').select_option('')
  for width in [1440,390,320]:
   p.set_viewport_size({'width':width,'height':950});check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),str(width)+' Arabic mastery reflows without horizontal overflow')
  for key in ['system','mission','objective']:p.locator('[data-ms-filter='+key+']').select_option('')
  p.wait_for_timeout(700)
  all_gaps=p.evaluate('InneruLocale.coverage(document.querySelector("[data-mastery]"))')
  open(artifact('mastery-all-objectives-arabic-gaps.json'),'w').write(json.dumps(all_gaps,ensure_ascii=False,indent=2))
  check(not all_gaps,'all 45 mission objectives and mission titles have authored Arabic presentation')
  for entry in ['skeletal-1','muscle-1','respiratory-1','integumentary-1','circ-1','excretory-1']:
   item=p.locator('[data-ms-objective="'+entry+'"]');details=item.locator('.ms-evidence');
   if details.get_attribute('open') is None:details.locator('>summary').click()
  p.wait_for_timeout(700)
  contrast=p.evaluate(r"""()=>{const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number),lum=c=>rgb(c).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);const s=getComputedStyle(document.querySelector('[data-ms-filter=system]'));return {border:ratio(s.borderTopColor,s.backgroundColor),text:[...document.querySelectorAll('.ms-status,[data-ms-filter]')].map(el=>{const c=getComputedStyle(el);return ratio(c.color,c.backgroundColor);})};}""")
  check(contrast['border']>=3 and all(n>=4.5 for n in contrast['text']),'new filter boundaries and all three status labels meet WCAG contrast thresholds')
  # Source text is preserved by locale; check all visible/control strings and a disclosure.
  gaps=p.evaluate('InneruLocale.coverage(document.querySelector("[data-mastery]"))');open(artifact('mastery-arabic-gaps.json'),'w').write(json.dumps(gaps,ensure_ascii=False,indent=2));check(not gaps,'Arabic mastery controls, objectives, criteria and real evidence have complete authored coverage')
  check(local(p)==before,'Arabic, Guided mode and evidence inspection leave answers, XP and completion unchanged')
  p.screenshot(path=artifact('student-mastery-arabic-mobile.png'),full_page=True)
  teacher.locator('[data-ms-filter=student]').select_option(u['id'])
  teacher.evaluate("InneruPreferences.set({language:'ar',guided:true})");teacher.wait_for_timeout(500);teacher.set_viewport_size({'width':320,'height':950});check(teacher.evaluate('document.documentElement.scrollWidth<=innerWidth'),'teacher mastery and class filters reflow in mobile RTL')
  check(teacher.locator('.ms-reference-flow').count()>0 and teacher.locator('.ms-reference-flow').first.get_attribute('dir')=='ltr','Arabic sorted-work references preserve the original scientific arrow direction with isolated terms')
  teacher_gaps=teacher.evaluate('InneruLocale.coverage(document.querySelector("[data-mastery]"))');open(artifact('teacher-mastery-arabic-gaps.json'),'w').write(json.dumps(teacher_gaps,ensure_ascii=False,indent=2));check(not teacher_gaps,'Arabic teacher mastery translates controls while preserving private student names')
  for number,selector,output in [(5,'[data-ph]:not([data-ph=correct])','#exc-ph-feedback'),(6,'[data-treatment]:not([data-treatment=dialysis])','#exc-treatment-feedback')]:
   f.open(teacher,'excretory/mission/'+str(number)+'?preview=1',selector);baseline=local(teacher);teacher.locator(selector).first.click();teacher.wait_for_function('(s)=>document.querySelector(s).textContent.includes(\"لم تصل\")',arg=output);check('لم تصل' in teacher.locator(output).inner_text(),'renal lab '+str(number)+' gives the authored Arabic first-retry hint');check(local(teacher)==baseline,'renal lab '+str(number)+' preview feedback changes no progress or rewards')
  fresh_context=new_context(b,service_workers='block',storage_state={'cookies':p.context.cookies(),'origins':[]});fresh=fresh_context.new_page();cold=[]
  fresh.route('**/api/learning?action=state',lambda route:cold.append(route));fresh.goto(f.origin+'/index.html?nosw=1#dashboard?view=mastery');fresh.wait_for_selector('[data-ms-objective]');fresh.locator('[data-ms-filter=system]').select_option('skeletal');cold_summary=fresh.locator('[data-ms-objective="skeletal-1"] .ms-evidence>summary');cold_summary.focus();fresh.keyboard.press('Enter')
  check(bool(cold) and fresh.locator('[data-ms-objective="skeletal-1"]').get_attribute('data-ms-status')=='insufficient','a fresh device waits for actual cloud evidence without inventing mastery')
  for pending in list(cold):pending.continue_()
  fresh.unroute('**/api/learning?action=state')
  fresh.wait_for_function('InneruCloud.status()===\"Choose a saved version\"||document.querySelector(\"[data-ms-objective=\\\"skeletal-1\\\"]\")?.dataset.msStatus===\"secure\"')
  # Preserve the existing explicit version choice; never silently replace local work.
  if fresh.locator('[data-cloud-use=remote]').count():fresh.locator('[data-cloud-use=remote]').evaluate('(button)=>button.click()')
  try:fresh.wait_for_function('document.querySelector(\"[data-ms-objective=\\\"skeletal-1\\\"]\").dataset.msStatus===\"secure\"')
  except Exception:
   diagnostics=fresh.evaluate('({status:InneruCloud.status(),owner:state.authUserId,xp:state.xp,responses:state.assessment?.responses,view:document.querySelector(\"[data-ms-objective=\\\"skeletal-1\\\"]\")?.outerHTML,conflict:!!document.querySelector(\"[data-cloud-use]\")})');diagnostics['stateReads']=len(cold);open(artifact('cold-restore-diagnostics.json'),'w').write(json.dumps(diagnostics,ensure_ascii=False,indent=2));raise
  fresh.wait_for_function('document.activeElement?.parentElement?.classList.contains(\"ms-evidence\")')
  check(cold_summary.evaluate('s=>s===document.activeElement&&s.parentElement.open') and fresh.locator('[data-ms-filter=system]').input_value()=='skeletal','cloud evidence restores mastery while preserving filters, open evidence and keyboard focus')
  check(fresh.locator('[data-ms-count]').get_attribute('role')=='status' and fresh.locator('[data-ms-count]').get_attribute('aria-live')=='polite','restored evidence retains its accessible result announcement')
  check(fresh.evaluate('state.xp')==p.evaluate('state.xp') and fresh.evaluate('state.authUserId')==u['id'],'cold mastery restore keeps the authenticated student progress and rewards intact')
  fresh_context.close()
  check(not errors,'no uncaught JavaScript errors in mastery or retry flows: '+str(errors))
  b.close()
 print(str(checks)+' mastery checks passed.',flush=True)
finally:f.close()
