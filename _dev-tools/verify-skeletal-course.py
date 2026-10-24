"""Drive the complete skeletal learning pathway in an isolated Chromium profile."""
import functools, http.server, threading, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0; errors=[]
def check(value,message):
    global checks
    assert value,message
    checks+=1; print('PASS',message,flush=True)
def stored(page): return page.evaluate("localStorage.getItem('bodyquest-v1')")
def go(page,path):
    page.evaluate('(path)=>location.hash=path',path)
    if path.startswith('mission/'):
        n=path.split('/')[1].split('?')[0]
        page.wait_for_selector(f'[data-skeletal-mission="{n}"]')
    else: page.wait_for_selector('.skel-chapters')
def answer_checks(page,n):
    for i,j in enumerate(page.evaluate(f'checks[{n}].map(q=>q.answer)')):
        page.locator(f'[data-skel-question="{i}"][data-skel-answer="{j}"]').click()
def solve(page,n):
    if n==1:
        for i,v in enumerate([0,0,0,1,1,1,1]):page.locator(f'#division-{i}').select_option(str(v))
        page.locator('#division-check').click()
    elif n==2:
        for i in range(4): page.locator(f'#bone-shape-{i}').select_option(str(i))
        page.locator('#bone-shape-reason').fill('A broad sternum protects the chest; a femur acts as a long lever.')
        page.locator('#shape-check').click()
    elif n==3:
        for i in range(7):page.locator(f'[data-study-structure="{i}"]').click()
        page.locator('[data-bone-model="lattice"]').click()
    elif n==4:
        for i,v in enumerate([3,1,2,1,0]):
            page.locator(f'[data-joint-station="{i}"]').click()
            page.locator('#skeletal-joint-movement').select_option(str(v))
            page.locator('#skeletal-joint-check').click()
    elif n==5:
        # The loading subactivity is usable before the three scenarios.
        for i,v in enumerate([0,1,1]): page.locator(f'#remodel-life-{i}').select_option(str(v))
        page.locator('#skeletal-life-check').click()
        for i in range(3):
            page.locator(f'[data-remodel-round="{i}"]').click()
            page.locator('#skeletal-remodel-prediction').select_option(str(i))
            page.locator('#skeletal-remodel-run').click()
            check(page.locator('#skeletal-mass').inner_text().split()[0]==str([10,7,13][i]),f'remodeling scenario {i+1} calculates the correct mass')
    elif n==6:
        page.locator('[data-repair-up="1"]').click()
        page.locator('[data-repair-up="3"]').click()
        page.locator('[data-repair-up="2"]').click()
        page.locator('#skeletal-repair-check').click()
        page.locator('[data-repair-stability="stable"]').click()
    elif n==7:
        for i in range(4):
            page.locator(f'[data-skeletal-case="{i}"]').click()
            answers=page.evaluate(f"['Skeletal System',cases[{i}].structure,cases[{i}].condition,cases[{i}].evidence]")
            for j,answer in enumerate(answers): page.locator(f'#case-evidence-{j}').select_option(label=answer)
            page.locator('#skeletal-case-submit').click()
            check('Evidence confirmed' in page.locator('#skeletal-case-feedback').inner_text(),f'case {i+1} accepts its anatomical evidence chain')
    elif n==8:
        page.locator('#skeletal-athlete-reason').fill('Limiting disruptive movement protects the injured ligament while tissue repairs and supports ankle stability.')
        page.locator('#skeletal-athlete-compare').click()
        page.locator('#skeletal-athlete-reflect').check()

try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
        context=browser.new_context(viewport={'width':1510,'height':1050});page=context.new_page()
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(BASE+'#world');page.wait_for_selector('.skel-chapters')
        check(page.locator('.body-atlas').count()==1,'the skeletal 3D studio remains present once above the pathway')
        check(page.evaluate("document.querySelector('.body-atlas').compareDocumentPosition(document.querySelector('.skel-mode-bar')) & Node.DOCUMENT_POSITION_FOLLOWING"),'all learning activities follow the 3D model')
        check(page.locator('.skel-chapter').count()==3,'missions are grouped into three learning stages')
        check(page.locator('.missioncard').evaluate_all('(cards)=>cards.map(c=>Number(c.dataset.missionNumber))')==list(range(1,8)),'all seven mission IDs remain in their original scientific order')
        check(page.locator('.skel-chapter').nth(2).locator('.skeletal-finale').count()==1,'the final athlete case follows repair and evidence investigations')
        check(page.locator('.skel-preview-link').count()==8,'every mission has an independent preview entry')
        check(page.locator('.missioncard.locked').count()==6,'fresh expedition keeps sequential progression gates')
        page.locator('[data-skeletal-study="3"]').click();check(page.locator('.skeletal-study-dialog[open]').count()==1,'existing full-size card anatomy studies still open');page.keyboard.press('Escape')
        page.evaluate("location.hash='mission/4'");page.wait_for_selector('.skel-locked')
        check(page.locator('.skel-locked a[href="#mission/4?preview=1"]').count()==1,'locked investigations offer preview without bypassing expedition prerequisites')
        go(page,'mission/1')
        page.locator('#division-check').click()
        check(page.locator('#complete').is_disabled() and 'You mapped 0' in page.locator('#activity-feedback').inner_text(),'incorrect investigation does not unlock completion')
        page.locator('[data-study-structure="0"]').click()
        check(page.locator('.skel-study-target rect').count()==3,'axial study locates skull, thorax and vertebral-column example regions separately')
        page.locator('.skel-enlarge-study').click()
        check(page.locator('.skeletal-study-dialog[open] .skel-study-target rect').count()==3,'enlarged anatomical study preserves the selected region markers')
        page.keyboard.press('Escape')
        for n in range(1,9):
            if n!=1:go(page,f'mission/{n}')
            check(page.locator('.skel-check').count()==3,f'mission {n} retains all three science checks')
            check(page.locator('#complete').is_disabled(),f'mission {n} cannot finish before the checks')
            if n==3:
                page.locator('[data-bone-model="lattice"]').click()
                check('remaining structure' in page.locator('#activity-feedback').inner_text(),'bone cutaway requires all seven structure discoveries')
            if n==4:
                page.locator('[data-joint-station="2"]').click()
                check(page.locator('.skel-small-joint rect').count()==8,'carpal movement study represents all eight carpal bones')
                page.locator('[data-joint-station="4"]').click()
                check(page.locator('.skel-joint-motion-cue,.skel-motion-glide,.skel-motion-pivot').count()==0,'fibrous sutures do not display a movement animation')
                page.locator('summary').filter(has_text='optional rotatable shoulder').click()
                page.locator('#skeletal-shoulder-open').click()
                page.wait_for_selector('#skeletal-shoulder-panel canvas',state='attached')
                check(page.locator('#skeletal-shoulder-panel input[type=range]').count()==2,'optional rotatable shoulder schematic retains rotation and elevation controls')
            if n==5:check(page.locator('#skeletal-life-check').is_visible(),'loading challenge is accessible before remodeling scenarios are completed')
            if n==6:
                check(page.locator('[data-repair-phase]').count()==4,'all four repair phases are inspectable before sorting')
                page.locator('#skeletal-repair-play').click();page.wait_for_timeout(1900)
                check(page.locator('[data-repair-phase="1"]').get_attribute('aria-pressed')=='true','repair timeline animates through the correct biological phase sequence')
                page.locator('.skel-animation-toggle').click()
                check(page.locator('#skeletal-repair-play').is_disabled(),'pause activity animation also stops and disables the repair timeline')
            if n==8:
                page.locator('#skeletal-athlete-reflect').click()
                check(not page.locator('#skeletal-athlete-reflect').is_checked(),'athlete reflection requires a written explanation and comparison')
            solve(page,n)
            check('INVESTIGATION SAVED' in page.locator('[data-lab-stamp]').inner_text(),f'mission {n} investigation can be completed')
            check(page.locator('#complete').is_disabled(),f'mission {n} still requires its three science checks after the investigation')
            if n==1:
                before=page.evaluate('state.xp');wrong=page.evaluate('(checks[1][0].answer+1)%3')
                page.locator(f'[data-skel-question="0"][data-skel-answer="{wrong}"]').click()
                check(page.evaluate("state.weak.includes('1-0')") and page.evaluate('state.xp')==before,'incorrect science answer records a review concept without awarding XP')
            answer_checks(page,n)
            check(page.locator('#complete').is_enabled(),f'mission {n} unlocks completion after investigation and three correct checks')
            if n==1:
                check(not page.evaluate("state.weak.includes('1-0')"),'corrected concept is removed from the review list')
                check(page.evaluate("document.activeElement.id")=='skeletal-check-2','correct science answers keep keyboard focus at the completed checkpoint')
            if n==7:
                before=page.evaluate('state.xp');page.locator('#skeletal-case-submit').click()
                check(page.evaluate('state.xp')==before,'rechecking a solved patient case never duplicates its XP')
            page.locator('#complete').click();page.wait_for_selector('.skel-chapters')
            check(page.evaluate(f'state.done.includes({n})'),f'mission {n} completion persists to the map')
        check(page.evaluate('state.xp')==550,'complete pathway awards exactly 550 XP including four case rewards and the final key')
        check(page.evaluate('state.done')==list(range(1,9)) and page.evaluate('keysEarned()')==1,'all mission completions and the Framework Key use the existing saved state')
        before=page.evaluate('state.xp');page.reload();go(page,'mission/1');solve(page,1);answer_checks(page,1);page.locator('#complete').click();page.wait_for_selector('.skel-chapters')
        check(page.evaluate('state.xp')==before,'replaying and reloading a completed mission never duplicates rewards')
        check(page.locator('.skel-chapter-count').all_text_contents()==['3 / 3 COMPLETE','2 / 2 COMPLETE','3 / 3 COMPLETE'],'chapter progress reflects all completed investigations and the final case')

        # Independent profile: test every interactive activity and every science
        # check in preview, starting with partial real progress and nonzero XP.
        practice=browser.new_context(viewport={'width':1510,'height':1050});pp=practice.new_page();pp.on('pageerror',lambda error:errors.append(str(error)))
        pp.goto(BASE+'#home');seed={'name':'Test','xp':137,'done':[1],'rewards':['activity1','q1-0'],'weak':['3-0'],'level':'Explorer','motion':False}
        pp.evaluate('(seed)=>localStorage.setItem("bodyquest-v1",JSON.stringify(seed))',seed);pp.goto(BASE+'#world?preview=1');pp.wait_for_selector('.skel-chapters');baseline=stored(pp)
        check(pp.locator('.missioncard.locked').count()==0 and pp.locator('#level').is_disabled(),'preview map opens all missions and prevents preference writes')
        for n in range(1,9):
            go(pp,f'mission/{n}?preview=1')
            check(pp.locator('.skel-mission-nav a').count()==8,f'preview mission {n} can navigate directly to every other activity set')
            solve(pp,n);answer_checks(pp,n)
            check(pp.locator('.skel-discovery-count').inner_text()=='4 / 4 discoveries explored',f'preview mission {n} supports the complete investigation and checks')
            check(stored(pp)==baseline,f'preview mission {n} leaves saved XP, missions, review and habit data unchanged')
        # Keyboard access, pause, dialog behavior, and narrow-screen layout.
        go(pp,'mission/3?preview=1');pp.locator('[data-study-structure="0"]').focus();pp.keyboard.press('Enter')
        check(pp.locator('[data-study-structure="0"]').get_attribute('aria-pressed')=='true','structure discovery is operable from the keyboard')
        pp.locator('.skel-enlarge-study').click();pp.keyboard.press('Escape')
        check(pp.locator('.skeletal-study-dialog[open]').count()==0,'enlarged activity study supports native Escape dismissal')
        for width in [390,320]:
            pp.set_viewport_size({'width':width,'height':844})
            for n in range(1,9):
                go(pp,f'mission/{n}?preview=1')
                check(pp.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'mission {n} fits a {width}px screen without horizontal overflow')
            go(pp,'world?preview=1')
            check(pp.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'grouped pathway fits a {width}px screen')
        pp.set_viewport_size({'width':1510,'height':1050});pp.emulate_media(reduced_motion='reduce');go(pp,'mission/6?preview=1')
        check(pp.locator('#skeletal-repair-play').is_disabled() and pp.locator('.skel-animation-toggle').is_disabled(),'reduced motion disables automatic timeline and decorative movement')
        pp.locator('[data-repair-phase="3"]').click();check(pp.locator('#skeletal-repair-phase figcaption b').inner_text()=='4. Remodeling','reduced motion retains manual access to every repair phase')
        check(stored(pp)==baseline,'keyboard, mobile, reduced-motion and navigation tests also preserve preview storage')

        # Shared router regression: other system preview routes still work.
        for path,selector in [('excretory/mission/3?preview=1','.exc-world'),('integumentary/mission/2?preview=1','.integ-mission'),('muscle','.mq-landing')]:
            pp.evaluate('(path)=>location.hash=path',path);pp.wait_for_selector(selector)
            check(pp.locator(selector).count()==1,f'shared routing still opens {path}')
        check(stored(pp)==baseline,'other system previews and anatomy browsing preserve existing learner progress')
        # Verify every offline shell URL exists, not merely its file extension.
        shell=pp.evaluate("async()=>{const t=await(await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
        for path in shell:
            response=pp.request.get(BASE.split('?')[0]+path.removeprefix('./'))
            assert response.status==200,(path,response.status)
        check(True,f'all {len(shell)} offline shell URLs return HTTP 200')
        check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'primary and fallback entry points remain identical')
        check(not errors,'no browser JavaScript exceptions across all tested routes')
        browser.close()
    print(f'{checks} checks passed',flush=True)
finally:
    server.shutdown();server.server_close()
