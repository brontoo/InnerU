"""Exercise the Living Shield games, rewards and preview isolation in Chromium.

Uses isolated browser storage and a read-only local server. No user progress is
changed. Requires Python Playwright and /usr/bin/chromium.
"""
import functools
import http.server
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0
errors=[]
def check(value,message):
    global checks
    assert value,message
    checks+=1
    print('PASS',message,flush=True)
def qs(page):return page.evaluate('window.inneruSkinQuestState()')
def open_mission(page,n,preview=True):
    page.goto(BASE+f'#integumentary/mission/{n}'+('?preview=1' if preview else ''))
    page.wait_for_selector('[data-quest]')
def advance(page):
    button=page.locator('[data-quest-next]')
    if button.is_visible():button.click()
def solve_lab(page,n,wrong=False,drag=False):
    before=qs(page)['completed']
    if n==1:
        if wrong:
            page.locator('[data-quest-piece="3"]').click();page.locator('[data-quest-target="0"]').click()
            check(qs(page)['completed']==before,'wrong tissue placement earns no objective')
        for i in [3,1,0,2]:
            page.locator(f'[data-quest-piece="{i}"]').click();page.locator(f'[data-quest-target="{i}"]').click()
    elif n==2:
        if wrong:
            page.locator('[data-quest-order="1"]').click()
            check(qs(page)['completed']==before,'incorrect layer order does not advance')
        for i in range(3):
            if drag and i==0:page.locator('[data-quest-order="0"]').drag_to(page.locator('.quest-slot.is-current'))
            else:page.locator(f'[data-quest-order="{i}"]').click()
            advance(page)
        page.locator('[data-renewal="1"]').click()
        check(page.locator('[data-quest-scene]').get_attribute('data-effect')=='renewal','cell-renewal discovery activates its anatomical animation')
    elif n in (3,4,5):
        correct={3:[0,1,2,0],4:[1,2,0],5:[0,1,2,3]}[n]
        if wrong:
            page.locator(f'[data-quest-action="{(correct[0]+1)%3}"]').click()
            check(qs(page)['completed']==before,f'mission {n}: incorrect response earns no objective')
        for i,answer in enumerate(correct):
            page.locator(f'[data-quest-action="{answer}"]').click()
            if n==3 and i==0:
                path=page.locator('.quest-flow');offset=path.evaluate('el=>getComputedStyle(el).strokeDashoffset');page.wait_for_timeout(180)
                check(path.evaluate('el=>getComputedStyle(el).strokeDashoffset')!=offset,'successful gland route has a running flow animation')
                page.locator('[data-quest-motion]').click();offset=path.evaluate('el=>getComputedStyle(el).strokeDashoffset');page.wait_for_timeout(180)
                check(path.evaluate('el=>getComputedStyle(el).strokeDashoffset')==offset and qs(page)['motion']=='paused','pause control stops the route animation')
                page.locator('[data-quest-motion]').click()
                page.locator('[data-quest]').screenshot(path='/tmp/inneru-activity-route.png')
            advance(page)
    else:
        if wrong:
            page.locator('[data-quest-order="2"]').click()
            check(qs(page)['completed']==before,'repair checkpoint cannot be skipped')
        for i in range(4):
            page.locator(f'[data-quest-order="{i}"]').click();advance(page)
        check(qs(page)['phase']=='burns','repair story opens the burn-depth scanner')
        page.locator('[data-quest]').screenshot(path='/tmp/inneru-activity-burns.png')
        if wrong:
            page.locator('[data-quest-action="2"]').click()
            check(qs(page)['completed']==4,'wrong burn classification earns no objective')
        for i in range(3):
            page.locator(f'[data-quest-action="{i}"]').click();advance(page)
    check(qs(page)['completed']==qs(page)['total'] and page.locator('[data-quest-complete]').is_visible(),f'mission {n}: every challenge objective can be completed')
    check(page.locator('.quest-meter').get_attribute('aria-valuenow')==str(qs(page)['total']),f'mission {n}: accessible objective count reaches completion')

answers=[['Several tissue types work together','Nerve tissue','A nail'],['Epidermis','Dermis','Melanocytes'],['Sebaceous gland','In a follicle','Keratin'],['Sweat evaporating','Arrector pili muscle contraction','Calcium'],['Epidermis','Sensory receptors and nerves','No, excess UV can still harm skin'],['A clot forms','Second degree','Excess ultraviolet radiation']]
def solve_checks(page,n,wrong=False):
    for i,answer in enumerate(answers[n-1]):
        card=page.locator(f'[data-question="{i}"]')
        if wrong and i==0:
            incorrect=next(j for j,text in enumerate(card.locator('[data-choice]').all_text_contents()) if not text.endswith(answer))
            card.locator('[data-choice]').nth(incorrect).click()
            check(not card.locator('.resp-correct').count(),'incorrect science answer does not secure a checkpoint')
        card.get_by_role('button',name=answer,exact=False).click()
    check(page.locator('[data-question].is-secured').count()==3,f'mission {n}: all three illustrated science checks can be secured')
    check(page.locator('[data-question] button:enabled').count()==0,f'mission {n}: answered checks cannot award XP twice')

def solve_final(page):
    page.goto(BASE+'#integumentary/mastery'+('?preview=1' if 'preview=1' in page.url else ''))
    page.wait_for_selector('[data-final]')
    for i,answer in enumerate(['Epidermis','Dermis','Subcutaneous fat','Keratin','Sebaceous gland','Evaporation','Clot and scab','Excess UV can damage cells']):
        card=page.locator(f'[data-final="{i}"]');card.get_by_role('button',name=answer,exact=True).click()
    check(page.locator('.quest-final-meter .is-done').count()==8,'all eight illustrated final stages restore the shield')
    check(page.locator('#integ-mastered').inner_text().startswith('Living Shield restored!'),'final challenge displays the restored shield')
try:
 with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':1536,'height':1100})
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'#integumentary/mission/2');page.wait_for_selector('.integ-hero')
    check(page.url.endswith('#integumentary'),'expedition keeps later missions gated until the earlier fragment is earned')
    baseline=page.evaluate("localStorage.getItem('bodyquest-v1')");base_xp=page.evaluate('state.xp')
    page.goto(BASE+'#integumentary?preview=1');page.wait_for_selector('.integ-preview-bar.is-preview')
    check(page.locator('.resp-card.resp-locked').count()==0,'preview opens all six mission cards')
    for n in range(1,7):
        open_mission(page,n)
        check(page.locator('[data-question] .quest-check-art').count()==3,f'mission {n}: every science check has a lesson-specific illustration')
        page.locator('.quest-check-art img').evaluate_all("imgs=>imgs.forEach(img=>img.loading='eager')")
        page.evaluate("Promise.all([...document.querySelectorAll('.quest-check-art img')].map(img=>img.decode()))")
        check(page.locator('[data-question] .quest-check-art').evaluate_all("els=>els.every(el=>{const i=el.querySelector('img'),r=el.getBoundingClientRect();return i.naturalWidth>1000&&Math.abs(r.width/r.height-i.naturalWidth/(3*i.naturalHeight))<.02})"),f'mission {n}: illustrations preserve their scientific proportions')
        solve_lab(page,n,wrong=True,drag=n==2);solve_checks(page,n)
        check('Mission explored.' in page.locator('#integ-finish').inner_text(),f'mission {n}: preview completion is clearly identified')
    solve_final(page)
    check(page.evaluate("localStorage.getItem('bodyquest-v1')")==baseline and page.evaluate('state.xp')==base_xp,'all preview games, checks and final stages leave saved progress and XP unchanged')
    page.goto(BASE+'#integumentary');page.wait_for_selector('.integ-hero')
    check(page.locator('.resp-card.resp-locked').count()==5,'exiting preview restores the real expedition locks')
    page.locator('.skin-explorer').scroll_into_view_if_needed();page.wait_for_function('window.inneruSkinExplorerState && window.inneruSkinExplorerState().frames>0')
    page.locator('[data-part="Dermis"]').click()
    check(page.locator('[data-dermis-part]:visible').count()==12,'detailed dermis inspection remains available beside the new activities')
    open_mission(page,1,preview=False);page.wait_for_function('!window.inneruSkinExplorerState')
    check(True,'opening a game disposes the 3D studio renderer')
    solve_checks(page,1,wrong=True)
    check(not page.evaluate('state.integumentary.done.includes(1)'),'three science checks alone do not unlock the next mission')
    solve_lab(page,1)
    check(page.evaluate('state.integumentary.done.includes(1)') and page.evaluate('state.xp')==base_xp+66,'challenge plus checks earns one fragment and the correct XP')
    for n in range(2,7):
        open_mission(page,n,preview=False);solve_lab(page,n);solve_checks(page,n)
    check(page.evaluate('state.integumentary.done.length')==6 and page.evaluate('state.xp')==base_xp+396,'six expedition missions award each lab, check and fragment exactly once')
    solve_final(page)
    check(page.evaluate('state.integumentary.mastery') and page.evaluate('state.xp')==base_xp+510,'final challenge awards the system key once')
    saved=page.evaluate("localStorage.getItem('bodyquest-v1')")
    page.reload();page.wait_for_selector('[data-final]')
    check(page.locator('[data-final].is-secured').count()==8 and page.locator('[data-final] button:enabled').count()==0,'saved final answers restore correctly after reload')
    open_mission(page,1,preview=False);solve_lab(page,1)
    check(page.evaluate("localStorage.getItem('bodyquest-v1')")==saved,'replaying a saved game cannot farm rewards or change saved answers')
    page.locator('[data-quest-replay]').click()
    check(qs(page)['completed']==0 and page.locator('[data-progress-step].is-done').count()==4,'play again resets the game while retaining the earned mission discoveries')
    page.goto(BASE+'#dashboard');page.wait_for_function('!window.inneruSkinQuestState')
    check(True,'route changes clean up game observers and event handlers')
    open_mission(page,4,preview=False);crossworld_saved=page.evaluate("localStorage.getItem('bodyquest-v1')")
    page.goto(BASE+'#excretory/mission/1?preview=1');page.wait_for_selector('.exc-world');page.wait_for_function('!window.inneruSkinQuestState')
    check(True,'opening a different body system also disposes the previous skin game')
    check(page.evaluate("localStorage.getItem('bodyquest-v1')")==crossworld_saved,'shared streak integration also preserves existing excretory preview isolation')

    mobile_context=browser.new_context(viewport={'width':390,'height':844})
    mobile=mobile_context.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)))
    for n in range(1,7):
        open_mission(mobile,n)
        check(mobile.locator('.integ-mission').evaluate('el=>el.scrollWidth<=el.clientWidth'),f'mobile mission {n}: activity layout has no horizontal overflow')
        check(mobile.locator('[data-quest] button:visible').evaluate_all('els=>els.every(el=>el.getBoundingClientRect().height>=43.5)'),f'mobile mission {n}: game controls have usable touch targets')
        if n==1:
            mobile.locator('[data-quest-piece="0"]').focus();mobile.keyboard.press('Enter');mobile.locator('[data-quest-target="0"]').focus();mobile.keyboard.press('Enter')
            check(qs(mobile)['completed']==1,'tissue mapping is fully operable by keyboard')
            mobile.locator('[data-quest]').screenshot(path='/tmp/inneru-activity-mobile.png')
            mobile.locator('[data-question="0"]').screenshot(path='/tmp/inneru-check-mobile.png')
    mobile.set_viewport_size({'width':820,'height':1100});open_mission(mobile,4)
    check(mobile.locator('.integ-mission').evaluate('el=>el.scrollWidth<=el.clientWidth'),'tablet mission layout remains within its container')
    reduced=browser.new_context(viewport={'width':1280,'height':1000},reduced_motion='reduce').new_page()
    open_mission(reduced,3);reduced.locator('[data-quest-action="0"]').click()
    check(qs(reduced)['motion']=='paused' and reduced.locator('.quest-flow').evaluate('el=>getComputedStyle(el).animationName')=='none','reduced motion starts with still anatomical routes')
    reduced.locator('[data-quest-motion]').click()
    check(qs(reduced)['motion']=='running','reduced-motion users can explicitly start an animation')
    app_motion=browser.new_context(viewport={'width':1280,'height':1000})
    app_motion.add_init_script("localStorage.setItem('bodyquest-v1',JSON.stringify({done:[],rewards:[],motion:true,xp:0,name:'Explorer'}))")
    still=app_motion.new_page();open_mission(still,3)
    check(qs(still)['motion']=='paused' and still.locator('[data-quest-motion]').is_disabled(),'app-level reduced motion remains authoritative')
    check(not errors,f'no JavaScript errors: {errors}')
    browser.close()
 print(f'{checks} illustrated activity checks passed.',flush=True)
finally:server.shutdown()
