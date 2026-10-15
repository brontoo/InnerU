"""Complete every respiratory activity in expedition and isolated preview modes."""
import functools,http.server,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0;errors=[]
def check(value,message):
    global checks
    assert value,message
    checks+=1;print('PASS',message,flush=True)
def stored(page):return page.evaluate("localStorage.getItem('bodyquest-v1')")
def go(page,n,preview=False):
    route='respiratory/'+('mastery' if n==7 else 'mission/'+str(n))+('?preview=1' if preview else '')
    page.evaluate('(path)=>location.hash=path',route)
    page.wait_for_selector('[data-final]' if n==7 else f'[data-resp-game="{n}"]')
def solve_lab(page,n):
    if n==1:
        for i in range(3):page.locator(f'[data-lab="{i}"]').click();page.locator(f'[data-ra-predict="{i}"]').click()
    elif n==2:
        names=['Nose or mouth','Pharynx','Larynx','Trachea','Bronchi','Bronchioles','Alveoli']
        for target,name in enumerate(names):
            index=page.locator('.ra-order-token>span').all_text_contents().index(name)
            while index>target:page.locator(f'[data-route-up="{index}"]').click();index-=1
        page.locator('[data-airway-check]').click();page.locator('[data-defense="correct"]').click()
    elif n==3:
        for i,side in enumerate(['air','blood']):
            page.locator(f'[data-lab="{i}"]').click();page.locator('#ra-higher').select_option(side);page.locator('[data-release-gas]').click()
    elif n==4:
        for i in range(2):page.locator(f'[data-lab="{i}"]').click();page.locator('[data-ra-predict="0"]').click()
    elif n==5:
        for i,(o2,co2) in enumerate([('air-blood','blood-air'),('blood-cell','cell-blood')]):
            page.locator(f'[data-lab="{i}"]').click();page.locator('#ra-tissue-o2').select_option(o2);page.locator('#ra-tissue-co2').select_option(co2);page.locator('[data-tissue-check]').click()
    elif n==6:
        for i in range(4):
            page.locator(f'[data-lab="{i}"]').click();page.locator('#ra-condition-structure').select_option(str(i));page.locator('#ra-condition-effect').select_option('0' if i<2 else '1');page.locator('[data-condition-check]').click()
def solve_checks(page):
    for q in page.locator('.resp-question').all():
        if q.locator('.resp-choices button:enabled').count()==0:continue
        for b in q.locator('.resp-choices button').all():
            b.click()
            if q.locator('.resp-correct').count():break
def depth(page,value):return page.evaluate("v=>{const el=document.querySelector('#breath-dia');el.value=v;el.dispatchEvent(new Event('input'));return{pressure:document.querySelector('#breath-pressure').textContent,flow:document.querySelector('#breath-flow').textContent,path:document.querySelector('#ra-diaphragm').getAttribute('d')};}",value)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
        context=browser.new_context(viewport={'width':1510,'height':1050});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(BASE+'#respiratory');page.wait_for_selector('.resp-map')
        check(page.locator('.resp-free-preview').count()==7,'every mission and the final activity has a free preview entry')
        check(page.locator('.resp-card.resp-locked').count()==5,'expedition prerequisites remain locked for a new learner')
        go(page,1)
        for b in page.locator('[data-lab]').all():b.click()
        check(not page.evaluate("!!state.respiratory.steps['1-lab']"),'merely viewing stations no longer awards the investigation')
        page.locator('[data-lab="0"]').click();page.locator('[data-ra-predict="2"]').click()
        check(page.evaluate('state.xp')==0,'incorrect station predictions award no XP')
        pictures=[]
        for i in range(3):
            page.locator(f'[data-lab="{i}"]').click();pictures.append(page.locator('.ra-stage .ra-anatomy image').first.get_attribute('href'))
        check(len(set(pictures))==3,'ventilation, gas exchange and cellular respiration have three distinct anatomical scenes')
        for n in range(1,7):
            if n!=1:go(page,n)
            check(page.locator('.ra-question-art').count()==3,f'mission {n} illustrates every science check')
            check(page.locator('.resp-gallery-nav a[aria-current=page]').count()==1,f'mission {n} shows its location in the activity sequence')
            if n==2:
                page.locator('[data-airway-check]').click()
                check(not page.evaluate("!!state.respiratory.steps['2-lab']"),'incorrect airway route cannot secure the investigation')
                page.locator('[data-lab="6"]').click();check('Alveoli' in page.locator('.ra-airway-study figcaption').inner_text(),'distal airway anatomy can be inspected before solving the route')
            if n==3:
                page.locator('#ra-higher').select_option('blood');page.locator('[data-release-gas]').click()
                check(page.locator('.ra-diffusion-flow .ra-transport').count()==0,'oxygen does not animate along an incorrect partial-pressure gradient')
                page.locator('#ra-higher').select_option('air');page.locator('[data-release-gas]').click()
                check(page.locator('.ra-diffusion-flow .ra-transport').get_attribute('aria-label')=='O₂ moves from Alveolar air to Capillary blood','oxygen follows air-to-blood direction visually and for assistive technology')
                before=page.locator('.ra-diffusion-flow .ra-moving-packet').evaluate('e=>parseFloat(getComputedStyle(e).animationDuration)')
                page.locator('[data-barrier-choice="thick"]').click()
                after=page.locator('.ra-diffusion-flow .ra-moving-packet').evaluate('e=>parseFloat(getComputedStyle(e).animationDuration)')
                check(after>before,'a thicker barrier slows the qualitative diffusion animation')
                check(page.evaluate('document.activeElement.dataset.barrierChoice')=='thick','changing barrier thickness retains keyboard focus on its control')
                page.locator('[data-lab="1"]').click();page.locator('#ra-higher').select_option('blood');page.locator('[data-release-gas]').click()
                check(page.locator('.ra-diffusion-flow .ra-transport').get_attribute('aria-label')=='CO₂ moves from Capillary blood to Alveolar air','carbon dioxide moves in the opposite direction across the same barrier')
            if n==4:
                a=depth(page,5);b=depth(page,90)
                check('AIR IN' in b['flow'] and float(b['pressure'].split()[0])<0,'increasing breath depth lowers pressure transiently and draws air in')
                check(a['path']!=b['path'],'the diaphragm dome changes position with the controlled lung volume')
                check(page.evaluate("!!state.respiratory.steps['4-breath-in']"),'original inhalation pressure bonus still saves its own reward ID')
                page.wait_for_timeout(950)
                check(page.locator('#breath-pressure').inner_text().startswith('0.00') and 'NO AIRFLOW' in page.locator('#breath-flow').inner_text(),'held pose equalizes pressure and stops airflow')
                c=depth(page,10)
                check('AIR OUT' in c['flow'] and float(c['pressure'].split()[0])>0,'decreasing volume raises pressure transiently and sends air out')
                depth(page,90);page.locator('#breath-rate').fill('30');page.locator('#breath-rate').dispatch_event('input')
                check(page.evaluate("!!state.respiratory.steps['4-breath-rate']") and float(page.locator('#breath-minute').inner_text().split()[0])>=40,'original minute-ventilation bonus remains achievable')
                page.locator('[data-breath-play]').click();page.locator('[data-ra-motion-toggle]').click()
                check(page.locator('[data-breath-play]').is_disabled() and 'NO AIRFLOW' in page.locator('#breath-flow').inner_text(),'pause stops automatic breathing and retains a stable manual pose')
            if n==5:
                page.locator('[data-lab="1"]').click()
                check(page.locator('.ra-stage .ra-transport').get_attribute('aria-label')=='O₂ moves from Capillary blood to Body cells','tissue oxygen moves from blood to body cells')
                page.locator('[data-transport-gas="CO₂"]').click()
                check(page.locator('.ra-stage .ra-transport').get_attribute('aria-label')=='CO₂ moves from Body cells to Capillary blood','tissue carbon dioxide returns from cells to blood')
                check(page.evaluate('document.activeElement.dataset.transportGas')=='CO₂','switching gas animations retains keyboard focus on the selected gas')
            solve_lab(page,n)
            check(page.evaluate(f"!!state.respiratory.steps['{n}-lab']"),f'mission {n} investigation can be secured by solving its anatomical challenges')
            check(not page.evaluate(f'state.respiratory.done.includes({n})'),f'mission {n} still requires its three checks after the lab')
            solve_checks(page)
            check(page.evaluate(f'state.respiratory.done.includes({n})'),f'mission {n} lab and checks unlock its fragment')
        check(page.evaluate('state.xp')==416,'six mission labs, 18 checks, fragments and two bonuses award exactly 416 XP')
        go(page,7);check(page.locator('.ra-question-art').count()==8,'all eight final challenge stages have matching illustrations')
        solve_checks(page)
        check(page.evaluate('state.respiratory.mastery') and page.evaluate('state.xp')==530,'final challenge awards the original respiratory key and total XP')
        before=page.evaluate('state.xp');go(page,1);solve_lab(page,1);solve_checks(page)
        check(page.evaluate('state.xp')==before,'replaying an investigation never duplicates its rewards')
        page.reload();page.wait_for_selector('.resp-activity-game')
        check(page.evaluate('state.respiratory.mastery') and page.evaluate('state.xp')==530,'reload preserves the original completed mission and reward state')

        practice=browser.new_context(viewport={'width':1510,'height':1050});pp=practice.new_page();pp.on('pageerror',lambda e:errors.append(str(e)))
        pp.goto(BASE+'#home');pp.evaluate("localStorage.setItem('bodyquest-v1',JSON.stringify({name:'Test',xp:137,done:[1],rewards:['activity1'],weak:[],level:'Explorer',motion:false,respiratory:{done:[1],steps:{'1-q0':true},weak:['3-q1']}}))")
        pp.goto(BASE+'#respiratory?preview=1');pp.wait_for_selector('.resp-map');baseline=stored(pp)
        check(pp.locator('.resp-card.resp-locked').count()==0 and pp.locator('.resp-finale>a').count()==1,'preview opens all mission and final routes without prerequisites')
        for n in range(1,7):
            go(pp,n,True);check(pp.locator('.resp-gallery-nav a').count()==7,f'preview mission {n} links directly to every activity set')
            solve_lab(pp,n);solve_checks(pp)
            check('PRACTICE EXPLORED' in pp.locator('.ra-lab-reward').inner_text(),f'preview mission {n} supports the entire anatomical challenge')
            check(stored(pp)==baseline,f'preview mission {n} leaves XP, progress, review and habits unchanged')
            check('?preview=1' in pp.locator('#resp-finish a').get_attribute('href'),f'preview mission {n} completion keeps navigation in preview')
        go(pp,7,True);solve_checks(pp)
        check('saved XP and progress are unchanged' in pp.locator('#resp-mastered').inner_text() and stored(pp)==baseline,'the final practice challenge does not award or claim a real key')
        go(pp,1,True);pp.locator('[data-lab="0"]').focus();pp.keyboard.press('Enter');pp.locator('[data-ra-predict="0"]').focus();pp.keyboard.press('Enter')
        check(pp.locator('[data-lab="0"]').get_attribute('aria-pressed')=='true','stations and their challenges work with the keyboard')
        pp.locator('[data-ra-motion-toggle]').click();check(pp.locator('.resp-activity-game').get_attribute('data-ra-motion')=='off','manual pause stops process animation')
        pp.emulate_media(reduced_motion='reduce');go(pp,4,True)
        check(pp.locator('[data-ra-motion-toggle]').is_disabled() and pp.locator('[data-breath-play]').is_disabled(),'reduced motion disables automatic activity and breathing playback')
        depth(pp,90);check('AIR IN' in pp.locator('#breath-flow').inner_text(),'manual scientific controls remain available with reduced motion')
        for width in [768,390,320]:
            pp.set_viewport_size({'width':width,'height':844})
            for n in range(1,8):
                go(pp,n,True)
                check(pp.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'activity {n} fits a {width}px screen')
        check(stored(pp)==baseline,'keyboard, motion and responsive exploration preserve preview storage')
        pp.emulate_media(reduced_motion='no-preference');go(pp,4,True);pp.locator('[data-breath-play]').click();pp.evaluate("location.hash='home'");pp.wait_for_selector('.explore-screen');pp.wait_for_timeout(950)
        check(pp.locator('.resp-activity-game').count()==0,'leaving an active breathing animation removes the activity safely')
        for path,selector in [('integumentary/mission/2?preview=1','.integ-mission'),('excretory/mission/3?preview=1','.exc-world'),('world?preview=1','.skel-chapters')]:
            pp.evaluate('p=>location.hash=p',path);pp.wait_for_selector(selector)
            check(pp.locator('.resp-activity-game').count()==0,f'respiratory activity styles and injection do not affect {path}')
        shell=pp.evaluate(r"async()=>{const t=await(await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
        for path in shell:assert pp.request.get(BASE.split('?')[0]+path.removeprefix('./')).status==200,path
        check(True,f'all {len(shell)} offline shell files resolve')
        check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'both entry points load identical versioned activity modules')
        check(not errors,'no JavaScript exceptions across games, previews, routes or cleanup')
        browser.close()
    print(f'{checks} checks passed',flush=True)
finally:server.shutdown();server.server_close()
