"""Guard removal of the full-body muscular studio without changing its lessons.
Uses loopback fixtures only. The independent elbow activity must remain intact.
"""
import json
from pathlib import Path
from urllib.parse import urlsplit
from test_support import playwright_session,launch,new_context,artifact,start_fixture

proc,origin=start_fixture()
checks=0;errors=[]
removed={'muscle-atlas-ui.js','muscle-explorer.js','muscle-model.js','muscle-reference-surfaces.js','muscle-studio.css','assets/muscular/body-template.glb','assets/muscular/classroom-model.webp'}
sections=['mq-essentials','mq-how','mq-contraction','mq-pairs','mq-roles','mq-tendons','mq-activities','mq-terms','mq-missions','mq-final','mq-completion-state']
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS '+message,flush=True)
def saved(page):return page.evaluate('JSON.stringify(InneruLearning.snapshot())')
try:
 with playwright_session() as pw:
  b=launch(pw)
  for language in ['en','ar']:
   c=new_context(b,service_workers='block',reduced_motion='reduce',viewport={'width':1440,'height':1000})
   c.add_init_script("localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'"+language+"',guided:false}));")
   p=c.new_page();requests=[];p.on('request',lambda r:requests.append(urlsplit(r.url).path.lstrip('/')));p.on('pageerror',lambda e:errors.append(str(e)))
   for refresh in [False,True]:
    if refresh:p.reload()
    else:p.goto(origin+'/index.html?nosw=1#muscle')
    p.wait_for_selector('.mq-landing');p.wait_for_function('(lang)=>document.documentElement.lang===lang',arg=language);p.wait_for_timeout(150)
    check(p.locator('.muscle-studio,.body-atlas.muscular,[data-muscle-part],[data-muscle-region]').count()==0,language+' has no full-body model, structure details, controls or tabs'+(' after refresh' if refresh else ''))
    check(p.evaluate('typeof window.InnerUMuscleAtlas==="undefined" && typeof window.__inneruMuscleStudio==="undefined"'),language+' never loads the removed studio globals')
    check(p.locator('.mq-hero').evaluate('el=>el.nextElementSibling.classList.contains("mq-foundation")'),language+' original learning content directly follows the unchanged hero')
    check(all(p.locator('#'+id).count()==1 for id in sections),language+' keeps every existing learning section, final and completion panel')
    check(p.locator('.mq-path-card').count()==7 and p.locator('#mq-final').count()==1,language+' retains all seven investigation cards and the separate final challenge')
   p.locator('.arm-lab').scroll_into_view_if_needed();p.wait_for_function('window.__inneruArmView?.state().frames>0',timeout=60000)
   before=saved(p)
   check(p.locator('.arm-lab canvas').count()==1 and p.locator('[data-arm-quest]').count()==4,language+' retains the separate 3D elbow activity and its three challenges')
   check(p.locator('[data-muscle-type]').count()==3 and p.locator('[data-muscle-step]').count()==6,language+' retains tissue comparisons and the movement sequence')
   for angle in [30,90,120]:
    p.locator('#mq-arm-range').evaluate('(el,a)=>{el.value=a;el.dispatchEvent(new Event("input",{bubbles:true}));}',angle)
    p.wait_for_timeout(60)
    check(p.evaluate('inneruArmLabState().angle')==angle,language+' preserved elbow activity responds to '+str(angle)+' degrees')
   check(saved(p)==before,language+' free inspection preserves all saved answers, XP and completion')
   for width in [320,390,768,1440]:
    p.set_viewport_size({'width':width,'height':1000});p.wait_for_timeout(60)
    check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),language+' remaining muscular page fits '+str(width)+'px')
   check(not removed.intersection(requests),language+' requests none of the removed viewer scripts, styles, models or fallback image')
   p.set_viewport_size({'width':1440,'height':1000});p.locator('.mq-hero').scroll_into_view_if_needed();p.screenshot(path=artifact('muscular-studio-removed-'+language+'.png'),full_page=True)
   c.close()
  check(not errors,'no uncaught browser errors after the studio removal: '+str(errors));b.close()
 print(json.dumps({'checks':checks,'result':'PASS'},indent=2))
finally:proc.terminate();proc.wait(timeout=10)
