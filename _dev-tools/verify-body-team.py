"""Exercise the six-system running lab, role board, reflection and original reward."""
import functools, http.server, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
checks=0;errors=[]
names=['Respiratory','Circulatory','Muscular','Skeletal','Integumentary','Excretory']
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
def place(p,role,dock):
    p.locator(f'[data-bt-role="{role}"]').click()
    p.locator(f'[data-bt-assign="{dock}"]').click()
def values(p):return p.locator('#systems select').evaluate_all('els=>els.map(e=>e.value)')
story='The lungs exchange oxygen with blood. The heart delivers it to muscles, which use ATP to pull on bones. Sweat evaporation cools the skin while the kidneys help conserve water as sweat loss builds.'
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
        p=browser.new_page(viewport=dict(width=1680,height=1100));p.on('pageerror',lambda e:errors.append(str(e)))
        p.goto(BASE+'#connect',wait_until='domcontentloaded');p.wait_for_selector('.bt-mission');baseline=stored(p)
        check(p.locator('.bt-lab').count()==1 and p.locator('.workgrid').count()==0,'one integrated lab replaces the old cards and narrow writing sidebar')
        check(p.locator('[data-bt-system]').count()==6 and p.locator('#systems select').count()==6,'all six body systems are represented in exploration and matching')
        check(p.locator('.cx-card').count()==6 and p.locator('.running-hero').count()==1,'the illustrated everyday scenes and run hero remain available')
        for i,name in enumerate(names):
            p.locator(f'[data-bt-system="{i}"]').click()
            check(name.upper() in p.locator('[data-bt-team-label]').inner_text() and p.locator('.bt-coach').get_attribute('aria-labelledby')==f'bt-system-tab-{i}',name+' selection updates the accessible anatomical coach')
            check(p.locator('.bt-specimen img').evaluate('img=>img.decode().then(()=>img.naturalWidth>300&&img.alt.length>45)'),name+' loads a detailed scientific anatomy study')
            responses=[]
            for pace in range(3):
                p.locator(f'[data-bt-set-pace="{pace}"]').click();responses.append(p.locator('[data-bt-response]').inner_text())
                assert p.locator('.bt-mission').get_attribute('data-bt-pace')==str(pace)
            check(len(set(responses))==3,name+' explains distinct resting, jogging and faster-running responses')
            p.locator('[data-bt-weather-toggle]').click()
            check(p.locator('.bt-mission').get_attribute('data-bt-weather')=='mild' and 'Mild weather' in p.locator('[data-bt-heat]').inner_text(),name+' can compare mild conditions')
            p.locator('[data-bt-weather-toggle]').click()
            check(p.locator('.bt-mission').get_attribute('data-bt-weather')=='hot' and p.locator('[data-bt-heat]').inner_text()!='',name+' explains its contribution during hot conditions')
            correct=1 if i==2 else 0
            p.locator(f'[data-bt-predict="{1-correct}"]').click()
            check(p.locator('[data-bt-prediction-feedback]').inner_text().startswith('Look again.'),name+' gives a science explanation for a mistaken prediction')
            p.locator(f'[data-bt-predict="{correct}"]').click()
            check(p.locator('[data-bt-prediction-feedback]').inner_text().startswith('✓ Science spotted.'),name+' recognizes a scientifically supported prediction')
        check('6 / 6' in p.locator('[data-bt-seen]').inner_text() and stored(p)==baseline,'exploring all six systems and predictions changes no saved learning progress')
        p.locator('[data-bt-system="5"]').focus();p.keyboard.press('ArrowRight')
        check(p.locator('.bt-mission').get_attribute('data-bt-active')=='0' and p.locator('[data-bt-system="0"]').evaluate('e=>e===document.activeElement'),'arrow navigation wraps through the anatomical system tabs')
        p.keyboard.press('End');check(p.locator('.bt-mission').get_attribute('data-bt-active')=='5','End selects the final system')
        p.keyboard.press('Home');check(p.locator('.bt-mission').get_attribute('data-bt-active')=='0','Home selects the first system')
        p.locator('[data-bt-scroll="bt-match"]').click()
        check(p.evaluate('location.hash')=='#connect' and p.evaluate('document.activeElement.id')=='bt-match','step navigation moves focus without leaving the connection route')
        p.locator('[data-bt-role="0"]').focus();p.keyboard.press('Enter')
        p.locator('[data-bt-assign="0"]').focus();p.keyboard.press('Enter')
        check(values(p)[0]=='0','keyboard activation assigns a chosen role to a team slot')
        place(p,0,1)
        check(values(p)[:2]==['','0'],'moving a role frees its previous team slot rather than duplicating it')
        p.locator('[data-bt-reset-matches]').click()
        drag=p.locator('[data-bt-role="0"]');target=p.locator('[data-bt-dock="0"]')
        drag.drag_to(target)
        check(values(p)[0]=='0','native drag and drop assigns a contribution to its chosen system')
        p.locator('[data-bt-reset-matches]').click()
        for i in range(6):place(p,(i+1)%6,i)
        check(p.locator('[data-bt-result]').count()==0,'placed roles are not marked correct before the student checks them')
        p.locator('#check-match').click()
        check(p.locator('[data-bt-result="retry"]').count()==6 and 'Check the pathway' in p.locator('#connect-feedback').inner_text(),'checking a mistaken team gives specific retry states and the original learning feedback')
        p.locator('#connection-reason').fill(story);p.locator('#compare').click();p.locator('#connect-reflect').click()
        check(p.evaluate('state.xp')==0 and not p.locator('#connect-reflect').is_checked(),'reflection cannot earn XP while the current team is incorrect')
        p.locator('[data-bt-reset-matches]').click()
        for i in range(6):place(p,i,i)
        check(values(p)==list(map(str,range(6))) and p.locator('[data-bt-match-count]').inner_text()=='6 / 6 placed','tap-to-assign builds the complete six-role team')
        check(stored(p)==baseline,'role placement and retry feedback do not write XP or completion')
        p.locator('#check-match').click()
        check(p.locator('[data-bt-result="correct"]').count()==6 and p.locator('.bt-mission').get_attribute('data-bt-matched')=='true','checking all six correct roles validates the whole team')
        check(p.evaluate('state.xp')==0,'correct matching alone does not award the writing-and-reflection reward')
        p.locator('#systems-0').select_option('1')
        p.locator('#connect-reflect').click()
        check(not p.locator('#connect-reflect').is_checked() and p.evaluate('state.xp')==0,'changing a checked team invalidates its previous reflection gate')
        for i in range(6):p.locator(f'#systems-{i}').select_option(str(i))
        p.locator('#check-match').click()
        for prompt in range(3):
            p.locator(f'[data-bt-prompt="{prompt}"]').click()
            assert p.locator('#connection-reason').input_value()==story
        check('kidney' in p.locator('[data-bt-story-tip]').inner_text(),'story prompts guide reasoning without inserting a model answer')
        check(p.locator('[data-bt-word-count]').inner_text()==str(len(story.split()))+' words','the writing workspace reports word count without grading the explanation')
        p.locator('#compare').click();p.locator('#connect-reflect').check()
        check(p.evaluate('state.xp===35&&state.rewards.includes("connection")'),'the checked team and compared reflection retain exactly the original 35 XP reward')
        check('SYSTEM THINKER' in p.locator('[data-bt-reward]').inner_text(),'the workspace celebrates the earned System Thinker mission')
        p.locator('#connect-reflect').uncheck();p.locator('#connect-reflect').check()
        check(p.evaluate('state.xp')==35,'repeated reflection never duplicates XP')
        baseline=stored(p)
        p.locator('.bt-lab').scroll_into_view_if_needed();p.wait_for_function('document.querySelector(".bt-lab").classList.contains("bt-in-view")')
        signal=p.locator('.bt-response-signal i').first
        check(signal.evaluate('e=>getComputedStyle(e).animationName')=='bt-signal','the visible lab has an animated qualitative response cue')
        p.locator('[data-bt-motion-toggle]').click()
        check(signal.evaluate('e=>getComputedStyle(e).animationName')=='none','local pause stops lab animation')
        p.locator('[data-bt-motion-toggle]').click();p.emulate_media(reduced_motion='reduce')
        p.wait_for_function('document.querySelector("[data-bt-motion-toggle]").disabled')
        check(signal.evaluate('e=>getComputedStyle(e).animationName')=='none','system reduced motion disables animation while retaining exploration')
        p.emulate_media(reduced_motion='no-preference');p.wait_for_function('!document.querySelector("[data-bt-motion-toggle]").disabled')
        p.evaluate('document.body.classList.add("motionoff")');p.wait_for_function('document.querySelector("[data-bt-motion-toggle]").disabled')
        check(p.locator('.bt-mission').get_attribute('data-bt-motion')=='off','the existing app-wide motion setting is respected')
        p.evaluate('document.body.classList.remove("motionoff")');p.wait_for_function('!document.querySelector("[data-bt-motion-toggle]").disabled')
        for width in [1680,1024,768,390,320]:
            p.set_viewport_size(dict(width=width,height=900))
            check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'the complete connection challenge fits {width}px')
            for i in range(6):
                p.locator(f'[data-bt-system="{i}"]').click();assert p.locator('.bt-mission').get_attribute('data-bt-active')==str(i)
            p.locator('[data-bt-role="5"]').click();p.locator('[data-bt-assign="5"]').click()
            check(values(p)[5]=='5',f'all six anatomical tabs and tap assignment remain usable at {width}px')
        check(stored(p)==baseline,'responsive exploration and preference changes preserve all saved rewards')
        p.locator('[data-cx-card="0"] summary').click();p.locator('[data-cx-open="0"]').click()
        check(p.locator('.cx-dialog[open]').count()==1,'the previously illustrated anatomy lenses still open alongside the redesigned mission')
        p.keyboard.press('Escape');p.evaluate('location.hash="home"');p.wait_for_selector('.iu-expedition')
        check(p.locator('.bt-mission').count()==0,'leaving the challenge removes its interface and listeners')
        p.evaluate('location.hash="connect"');p.wait_for_selector('.bt-mission')
        check(p.locator('.bt-mission').count()==1 and p.evaluate('state.xp')==35,'returning mounts one clean challenge and preserves the earned reward')
        p.reload(wait_until='domcontentloaded');p.wait_for_selector('.bt-mission')
        check(p.evaluate('state.xp===35&&state.rewards.includes("connection")'),'reload preserves the once-only mission reward')
        shell=p.evaluate(r"async()=>{const t=await(await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
        for path in shell:assert p.request.get(BASE.split('?')[0]+path.removeprefix('./')).status==200,path
        check(True,f'all {len(shell)} offline shell URLs resolve')
        check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'both entry points load identical versioned mission modules')
        check(not errors,'all scenario, prediction, matching, writing and navigation interactions run without JavaScript errors: '+str(errors))
        browser.close()
finally:server.shutdown();server.server_close()
print(f'{checks} body team checks passed.',flush=True)
