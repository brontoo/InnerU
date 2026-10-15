"""Exercise the respiratory card gallery and its existing learning routes."""
import functools, http.server, threading
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0;errors=[]
def check(value,message):
    global checks
    assert value,message
    checks+=1;print('PASS',message,flush=True)
def stored(page):return page.evaluate("localStorage.getItem('bodyquest-v1')")
def gallery(page):
    page.wait_for_selector('.resp-map .resp-study-open')
    for picture in page.locator('.resp-anatomy-picture img').all():picture.scroll_into_view_if_needed()
    page.wait_for_function("[...document.querySelectorAll('.resp-anatomy-picture img')].every(i=>i.complete&&i.naturalWidth===1536)")
def route(page,path):page.evaluate('path=>location.hash=path',path)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
        context=browser.new_context(viewport={'width':1510,'height':1050});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(BASE+'#respiratory');gallery(page);baseline=stored(page)
        titles=['Why we breathe','Follow the air','At the alveolus','The breathing engine','Oxygen on the move','Protect the exchange','Keep oxygen moving']
        check(page.locator('.resp-card-art').count()==7,'all six missions and the final challenge receive anatomical illustrations')
        check(len(set(page.locator('.resp-anatomy-picture img').evaluate_all('(images)=>images.map(i=>i.src)')))==7,'every card uses its own lesson-specific study')
        check(page.locator('.resp-anatomy-picture img').evaluate_all('(images)=>images.every(i=>i.alt.length>60&&getComputedStyle(i).objectFit==="contain")'),'complete anatomical images have descriptive alternative text')
        check(page.locator('.resp-card.resp-locked').count()==5 and page.locator('.resp-finale>.btn').is_disabled(),'fresh learning progression keeps five mission gates and the final gate')
        check(page.locator('.resp-locked .resp-card-art').evaluate_all('(figures)=>figures.every(e=>getComputedStyle(e).filter==="none"&&getComputedStyle(e).opacity==="1")'),'locked artwork remains fully colored and legible')
        check(page.locator('.resp-anatomy-art').evaluate_all('(figures)=>figures.every(f=>f.querySelector("button").getBoundingClientRect().top>=f.querySelector(".resp-anatomy-picture").getBoundingClientRect().bottom)'),'study controls remain below anatomy instead of covering structures')
        check(page.locator('.body-atlas.respiratory').count()==1,'respiratory 3D studio remains in its existing place')
        check(len(page.locator('.resp-grid').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ")'))==3,'desktop mission board keeps a three-column layout')
        for n,title in enumerate(titles,1):
            page.locator(f'[data-resp-study="{n}"]').click();dialog=page.locator('.resp-study-dialog')
            page.wait_for_function("document.querySelector('.resp-study-dialog img').complete&&document.querySelector('.resp-study-dialog img').naturalWidth===1536")
            check(dialog.locator('h2').inner_text()==title,f'study {n} opens its matching anatomical guide regardless of mission locks')
            check(dialog.locator('.resp-study-key li').count()==4,f'study {n} has four clear anatomy keys')
            for region in range(3):
                choice=dialog.locator(f'[data-resp-inspect="{region}"]');choice.click()
                check(choice.get_attribute('aria-pressed')=='true' and dialog.locator('.resp-study-marker').inner_text()==str(region+1),f'study {n} region {region+1} links its marker and explanation')
            page.keyboard.press('Escape')
            check(page.locator('.resp-study-dialog[open]').count()==0,f'study {n} closes with Escape')
        check(stored(page)==baseline and page.evaluate('state.xp')==0,'all seven guides and 21 structure inspections leave progress and XP unchanged')
        page.locator('[data-resp-study="1"]').focus();page.keyboard.press('Enter')
        check(page.locator('.resp-study-dialog[open]').count()==1,'anatomy studies open with the keyboard')
        for n in range(2,8):page.locator('[data-resp-study-next]').click()
        check(page.locator('#resp-study-title').inner_text()==titles[-1] and page.locator('[data-resp-study-next]').is_disabled(),'gallery next controls browse every study and stop at the final one')
        for n in range(6,0,-1):page.locator('[data-resp-study-prev]').click()
        check(page.locator('#resp-study-title').inner_text()==titles[0] and page.locator('[data-resp-study-prev]').is_disabled(),'previous controls stop at the first study')
        page.locator('.resp-study-close').click()
        check(page.evaluate('document.activeElement.dataset.respStudy')=='1','closing a guide restores focus to its card control')
        page.locator('.resp-card').first.scroll_into_view_if_needed();page.wait_for_function('document.querySelector(".resp-anatomy-art").classList.contains("is-in-view")')
        cue=page.locator('.resp-anatomy-cues i').first
        check(cue.evaluate('e=>getComputedStyle(e,"::after").animationName')=='resp-anatomy-focus','visible card retains a gentle anatomical discovery animation')
        page.locator('[data-resp-motion-toggle]').click()
        check(page.locator('.resp-map').get_attribute('data-resp-art-motion')=='off' and cue.evaluate('e=>getComputedStyle(e,"::after").animationName')=='none','pause control stops card animation')
        page.locator('[data-resp-motion-toggle]').click();page.emulate_media(reduced_motion='reduce')
        page.wait_for_function('document.querySelector("[data-resp-motion-toggle]").disabled')
        check(cue.evaluate('e=>getComputedStyle(e,"::after").animationName')=='none','operating-system reduced motion is respected immediately')
        page.emulate_media(reduced_motion='no-preference');page.evaluate('document.body.classList.add("motionoff")')
        page.wait_for_function('document.querySelector("[data-resp-motion-toggle]").disabled')
        check(page.locator('.resp-map').get_attribute('data-resp-art-motion')=='off','saved-profile motion preference also stops gallery animation')
        page.evaluate('document.body.classList.remove("motionoff")')
        for width,columns in [(768,2),(390,1),(320,1)]:
            page.set_viewport_size({'width':width,'height':844})
            check(len(page.locator('.resp-grid').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ")'))==columns,f'{width}px board uses {columns} readable column(s)')
            check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width}px respiratory page has no horizontal overflow')
            page.locator('[data-resp-study="6"]').click()
            check(page.locator('.resp-study-dialog').evaluate('e=>e.scrollWidth<=e.clientWidth&&e.getBoundingClientRect().right<=innerWidth'),f'{width}px anatomy guide fits the viewport')
            page.locator('[data-resp-inspect="2"]').click();page.keyboard.press('Escape')
        check(stored(page)==baseline,'keyboard, animation and responsive gallery controls never write learner progress')
        page.set_viewport_size({'width':1510,'height':1050})
        # Leave while a modal is open; old observers and dialogs must be removed.
        page.locator('[data-resp-study="2"]').click();route(page,'respiratory/mission/1');page.wait_for_selector('.resp-lab')
        check(page.locator('.resp-study-dialog,.resp-art-tools').count()==0,'gallery and modal are disposed when entering a lesson')
        check(page.locator('.resp-question').count()==3 and page.locator('[data-lab]').count()==3,'first mission retains its interactive lab and three checks')
        for index,button in enumerate(page.locator('[data-lab]').all()):
            button.click();page.locator(f'[data-ra-predict="{index}"]').click()
        for question in page.locator('.resp-question').all():
            for button in question.locator('[data-choice]').all():
                button.click()
                if question.locator('.resp-correct').count():break
        check(page.evaluate('state.respiratory.done.includes(1)') and page.evaluate('state.xp')==66,'existing investigation, quiz rewards and mission completion still work')
        route(page,'respiratory');gallery(page)
        check(page.locator('.resp-art-tools').count()==1 and page.locator('.resp-card-art').count()==7,'returning to the board never duplicates gallery controls or artwork')
        check(page.locator('.resp-card').nth(1).locator(':scope > a.btn').get_attribute('href')=='#respiratory/mission/2','completion unlocks the next mission through its original link')
        snapshot=stored(page);page.locator('[data-resp-study="5"]').click();page.keyboard.press('Escape')
        check(stored(page)==snapshot,'studying anatomy also preserves existing earned progress')
        # Verify the final challenge gate/link with fully earned prerequisite flags.
        page.evaluate('state.respiratory.done=[1,2,3,4,5,6];save()');route(page,'respiratory/mission/6');page.wait_for_selector('.resp-lab');route(page,'respiratory');gallery(page)
        check(page.locator('.resp-finale>a').get_attribute('href')=='#respiratory/mastery','earned mission fragments still unlock the original final challenge')
        route(page,'respiratory/mastery');page.wait_for_selector('[data-final]')
        check(page.locator('[data-final]').count()==8 and page.locator('.resp-card-art').count()==0,'final activity keeps all eight stages without inserting card artwork into lessons')
        # A neighboring world shares respiratory card classes; it must stay unchanged.
        route(page,'integumentary');page.wait_for_selector('.integ-world')
        check(page.locator('.resp-art-tools,.resp-anatomy-art,.resp-map').count()==0,'gallery styles and injection stay out of the integumentary system')
        for i in range(3):route(page,'respiratory');gallery(page);route(page,'home');page.wait_for_selector('.explore-screen')
        check(page.locator('.resp-study-dialog[open]').count()==0,'repeated route changes leave no stale modal')
        assets=sorted((ROOT/'assets/respiratory-missions').glob('*.webp'))
        check(len(assets)==7 and all(Image.open(f).size==(1536,1024) for f in assets),'all seven deployed illustrations retain full 1536 × 1024 resolution')
        check(sum(f.stat().st_size for f in assets)<2_000_000,'seven optimized illustrations total less than 2 MB')
        shell=page.evaluate(r"async()=>{const t=await(await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
        for path in shell:
            assert page.request.get(BASE.split('?')[0]+path.removeprefix('./')).status==200,path
        check(True,f'all {len(shell)} offline shell URLs resolve after the cache update')
        check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'main and fallback entry points contain identical versioned references')
        check(not errors,'all tested routes render without JavaScript exceptions')
        browser.close()
    print(f'{checks} checks passed',flush=True)
finally:server.shutdown();server.server_close()
