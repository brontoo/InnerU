"""Check the illustrated adventure entry against the real browser and app routes."""
import copy
import functools
import http.server
import json
import re
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
ORIGIN = f'http://127.0.0.1:{server.server_port}'
ENTRY = ORIGIN + '/login.html?nosw=1'
checks = 0
errors = []

def check(value, message):
    global checks
    assert value, message
    checks += 1
    print('PASS', message, flush=True)

def stored(page): return page.evaluate('localStorage.getItem("bodyquest-v1")')
def visit(page, profile=None):
    page.goto(ENTRY)
    page.evaluate('localStorage.clear()')
    if profile is not None:
        page.evaluate('(v)=>localStorage.setItem("bodyquest-v1",v)', json.dumps(profile))
    page.reload()
    page.wait_for_selector('[data-select-role="student"]')

def select(page, role):
    page.locator(f'[data-select-role="{role}"]').click()
    page.wait_for_selector('#gate-entry-panel:not([hidden])')

def sentinel(route):
    route.fulfill(status=200, content_type='text/html', body='<title>Existing workspace destination</title><h1>Workspace</h1>')

SEED = dict(name='Amina', xp=730, done=[1,2,8], rewards=['activity1','q1-0'], weak=['2-0'], level='Challenger', motion=False,
    learning={'version':1,'entries':[{'id':'activity1','xp':20,'at':'2026-10-01T00:00:00Z'}], 'completed':{'badge:skeletal-mission-1':'2026-10-01'}},
    muscle={'done':[1,8],'tasks':{'one':True},'xp':100}, integumentary={'done':[1],'mastery':True},
    respiratory={'done':[1,2],'mastery':False}, circ={'done':[1],'steps':['circ-one'],'mastery':True},
    excretory={'done':[1],'mastery':False}, review={'cards':{'one':{'due':12345}}}, custom={'keep':'future fields'})

try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox','--enable-unsafe-swiftshader'])
        context = browser.new_context(viewport={'width':1680,'height':1000})
        page = context.new_page()
        def browser_error(error):
            errors.append(str(error))
            print('BROWSER ERROR', error, flush=True)
        page.on('pageerror', browser_error)
        page.goto(ORIGIN + '/?nosw=1')
        page.wait_for_url('**/login.html?nosw=1')
        check(page.locator('[data-select-role="student"]').is_visible(), 'opening the portal root immediately enters the Discovery Centre')
        page.goto(ORIGIN + '/index.html?nosw=1')
        page.wait_for_url('**/login.html?nosw=1')
        check(page.locator('[data-select-role="teacher"]').is_visible(), 'opening index.html without a hash enters the Discovery Centre')
        page.goto(ORIGIN + '/?nosw=1#dashboard')
        page.wait_for_selector('.sd-page')
        check(page.url.endswith('#dashboard'), 'existing root-hash student dashboard bookmarks remain usable')
        page.goto(ORIGIN + '/index.html?nosw=1#teacher')
        page.wait_for_selector('#t-import')
        check(page.url.endswith('#teacher'), 'existing teacher workspaces remain directly accessible')
        visit(page, SEED)
        original = stored(page)
        check(page.title().startswith('InnerU · Body Quest'), 'entry uses InnerU branding and an independent document')
        check(page.locator('[data-select-role]').count() == 2 and page.locator('.gate-role-visual img').count() == 2, 'both roles use separate high-quality character illustrations')
        check(not re.search(r'Integumentary|Skeletal|Muscular|Respiratory|Circulatory|Excretory|Urinary|six systems|/ 6|System Keys',page.locator('body').inner_text(),re.I), 'entry names no systems and promises no fixed curriculum size')
        check(page.locator('input[type=password],input[type=email]').count() == 0, 'browser entry adds no pretend account credentials')
        check(page.locator('[data-select-role="teacher"]').is_enabled(), 'entrance animation never blocks early interaction')
        page.locator('[data-select-role="student"]').focus()
        page.keyboard.press('Enter')
        page.wait_for_selector('#entry-nickname')
        check(page.locator('#gate-panel-title').evaluate('(el)=>el===document.activeElement'), 'keyboard selection focuses the entry heading')
        check('730 XP' in page.locator('[data-profile-summary]').inner_text() and '/ 6' not in page.locator('[data-profile-summary]').inner_text(), 'saved summary reads actual XP without a fixed system count')
        check(page.locator('#entry-nickname').input_value() == 'Amina', 'student entry restores the current nickname')
        page.locator('#entry-nickname').fill('Draft explorer')
        page.keyboard.press('Escape')
        check(page.locator('[data-select-role="student"]').evaluate('(el)=>el===document.activeElement'), 'Escape returns to the original role control')
        select(page,'teacher')
        check(page.locator('#entry-nickname').count() == 0 and 'STUDENT RECORDS' in page.locator('.gate-entry-facts').inner_text(), 'Teacher entry describes the existing browser classroom tools')
        page.locator('[data-back-roles]').click()
        select(page,'student')
        check(page.locator('#entry-nickname').input_value() == 'Draft explorer' and stored(page) == original, 'switching roles keeps the unsaved draft and leaves all learning data unchanged')
        page.locator('[data-back-roles]').click()

        # Flexible discovery tips replace the previous fixed system exhibits.
        for width, height in [(1920,1080),(1680,1000),(1440,900),(1280,720),(1152,800)]:
            page.set_viewport_size({'width':width,'height':height})
            page.wait_for_timeout(400)
            for name in ['explore','learn','grow','help']:
                opener = page.locator(f'[data-discovery="{name}"]')
                opener.click(timeout=3000)
                page.wait_for_selector('dialog[open]')
                assert page.locator('dialog h2').inner_text() and page.locator('dialog p').count() == 2
                page.keyboard.press('Escape')
                assert opener.evaluate('(el)=>el===document.activeElement'), 'dialog focus return'
            check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'{width}px illustration and all discovery tips remain accessible without overflow')
        check(stored(page) == original, 'exploring discovery tips awards no points and changes no progress')
        page.set_viewport_size({'width':1680,'height':1000})
        before_greeting = page.locator('[data-companion-message]').inner_text()
        page.locator('[data-companion]').click()
        check(page.locator('[data-companion-message]').inner_text() != before_greeting and stored(page) == original, 'the companion reacts with an accessible greeting without modifying progress')
        art = page.locator('[data-card="student"] .gate-role-visual img').bounding_box()
        page.mouse.click(art['x'] + art['width']/2,art['y'] + art['height']/2)
        page.wait_for_selector('#entry-nickname')
        check(page.locator('#entry-nickname').is_visible(), 'the illustrated area of a role card also opens the correct workspace entry')
        page.locator('[data-back-roles]').click()

        page.set_viewport_size({'width':1680,'height':1000})
        page.mouse.move(100,100)
        page.wait_for_timeout(60)
        page.mouse.move(1300,200)
        page.wait_for_timeout(80)
        check(page.locator('.iu-gate').evaluate('(el)=>el.style.getPropertyValue("--scene-x")') not in ['', '0px','0.00px'], 'desktop pointer movement creates restrained scene parallax')
        page.locator('[data-action-motion]').click()
        check(page.locator('.iu-gate').get_attribute('data-visual-motion') == 'off' and page.locator('[data-action-motion]').get_attribute('aria-pressed') == 'true', 'Pause motion stops ambient animation and resets parallax')
        check(page.locator('.gate-sunlight').evaluate('(el)=>getComputedStyle(el).animationName') == 'none', 'paused sunlight is static in the rendered page')
        page.locator('[data-companion]').click()
        check(page.evaluate('document.getAnimations().every(a=>a.playState!=="running")'), 'reduced motion also stops the companion reaction, switch and button sheen')
        page.locator('[data-action-motion]').click()
        page.emulate_media(reduced_motion='reduce')
        page.wait_for_function('document.querySelector("[data-action-motion]").disabled')
        check(page.locator('[data-action-motion]').is_disabled() and page.locator('.iu-gate').get_attribute('data-visual-motion') == 'off', 'operating-system reduced motion is respected')
        page.emulate_media(reduced_motion='no-preference')
        page.wait_for_function('!document.querySelector("[data-action-motion]").disabled')
        page.evaluate('localStorage.setItem("bodyquest-v1",JSON.stringify({...JSON.parse(localStorage.getItem("bodyquest-v1")),motion:true}));dispatchEvent(new StorageEvent("storage",{key:"bodyquest-v1"}))')
        check(page.locator('[data-action-motion]').is_disabled(), 'existing portal reduced-motion preference is respected')
        page.evaluate('(s)=>localStorage.setItem("bodyquest-v1",s)', original)
        page.reload()

        # Intercept only the final destination to inspect entry writes before app initialization.
        page.route('**/index.html', sentinel)
        select(page,'student')
        page.locator('#entry-nickname').fill('Noor')
        page.locator('button[type=submit]').click()
        page.wait_for_url('**/index.html#dashboard')
        expected = copy.deepcopy(SEED); expected['name'] = 'Noor'
        check(json.loads(stored(page)) == expected, 'student entry changes only the nickname and preserves XP, badges, reviews and every system flag')
        check(page.url.endswith('#dashboard'), 'Student enters the existing dashboard route')
        visit(page, SEED)
        select(page,'student')
        latest = copy.deepcopy(SEED); latest['xp'] = 790; latest['custom']['otherTab'] = True
        page.evaluate('(s)=>localStorage.setItem("bodyquest-v1",s)', json.dumps(latest))
        page.locator('#entry-nickname').fill('Maha')
        page.locator('button[type=submit]').click()
        page.wait_for_url('**/index.html#dashboard')
        latest['name'] = 'Maha'
        check(json.loads(stored(page)) == latest, 'a nickname update re-reads and preserves newer progress from another tab')
        visit(page, SEED)
        before = stored(page)
        select(page,'teacher')
        page.locator('button[type=submit]').click()
        page.wait_for_url('**/index.html#teacher')
        check(stored(page) == before and page.evaluate('Object.keys(localStorage)') == ['bodyquest-v1'], 'Teacher navigation creates no role grants and leaves the student record byte-for-byte unchanged')
        visit(page, SEED)
        before = stored(page)
        select(page,'student')
        page.locator('#entry-nickname').fill('')
        page.locator('button[type=submit]').click()
        page.wait_for_url('**/index.html#dashboard')
        check(stored(page) == before, 'an empty optional name continues without overwriting the saved name')
        visit(page)
        select(page,'student')
        page.locator('#entry-nickname').fill('New explorer')
        page.locator('button[type=submit]').click()
        page.wait_for_url('**/index.html#dashboard')
        fresh = json.loads(stored(page))
        check(fresh['name'] == 'New explorer' and fresh['xp'] == 0 and fresh['done'] == fresh['rewards'] == [], 'a new nickname starts with zero XP and no invented completed work')

        visit(page, SEED)
        select(page,'student')
        page.locator('#entry-nickname').evaluate('(el)=>el.value="x".repeat(25)')
        page.locator('button[type=submit]').click()
        check(page.locator('#entry-nickname').get_attribute('aria-invalid') == 'true' and page.url == ENTRY and json.loads(stored(page)) == SEED, 'invalid names expose a focused accessible error without navigation or data changes')
        page.locator('#entry-nickname').fill('<Explorer & friends>')
        check(page.locator('#entry-error').inner_text() == '' and page.locator('#entry-nickname').get_attribute('aria-invalid') is None, 'editing clears validation and names stay text values')

        visit(page)
        page.evaluate('localStorage.setItem("bodyquest-v1","{broken-json")')
        page.reload(); select(page,'student')
        page.locator('#entry-nickname').fill('Keep my data')
        page.locator('button[type=submit]').click()
        check(page.locator('[data-continue-unchanged]').is_visible() and stored(page) == '{broken-json', 'unreadable progress is preserved with a continue-without-saving option')
        page.locator('[data-continue-unchanged]').click()
        page.wait_for_url('**/index.html#dashboard')
        check(stored(page) == '{broken-json', 'storage recovery navigation never replaces unreadable learner data')

        visit(page, SEED)
        page.evaluate('(()=>{Storage.prototype.setItem=function(){throw new DOMException("Quota exceeded","QuotaExceededError")};})()')
        select(page,'student')
        page.locator('#entry-nickname').fill('Changed name')
        page.locator('button[type=submit]').click()
        check('could not be saved' in page.locator('#entry-error').inner_text() and json.loads(stored(page)) == SEED, 'a full browser store leaves progress intact and explains the failed nickname save')
        page.locator('[data-continue-unchanged]').click()
        page.wait_for_url('**/index.html#dashboard')
        check(json.loads(stored(page)) == SEED, 'storage-full fallback still opens the dashboard without a write')

        # The real app, not a replacement or fake teacher workspace.
        page.unroute('**/index.html', sentinel)
        visit(page, SEED)
        select(page,'student'); page.locator('button[type=submit]').click()
        page.wait_for_selector('.sd-page')
        check('730' in page.locator('[data-sd-xp]').inner_text() and page.evaluate('state.name') == 'Amina', 'actual existing dashboard displays the preserved student and XP')
        page.goto(ENTRY); select(page,'teacher'); page.locator('button[type=submit]').click()
        page.wait_for_selector('#t-import')
        check(page.locator('#t-code').is_visible() and 'Every explorer.' in page.locator('h1').inner_text(), 'actual Teacher tools retain progress-code and classroom functionality')
        page.goto(ENTRY); page.locator('.gate-home').click(); page.wait_for_selector('.iu-expedition')
        check(page.url.endswith('#home'), 'Home returns to the approved existing homepage')

        for width in [1024,768,640,390,320]:
            page.set_viewport_size({'width':width,'height':844}); page.goto(ENTRY)
            check(page.locator('[data-discovery]').count() == 4, f'{width}px layout keeps generic discovery and help controls available')
            if width <= 640:
                student = page.locator('[data-card="student"]').bounding_box()
                teacher = page.locator('[data-card="teacher"]').bounding_box()
                check(teacher['y'] >= student['y'] + student['height'] and student['width'] > min(width * .8,400), f'{width}px role cards stack at a readable full width')
            for name in ['explore','learn','grow','help']:
                page.locator(f'[data-discovery="{name}"]').click(); page.wait_for_selector('dialog[open]')
                assert page.locator('dialog').evaluate('(el)=>el.scrollWidth<=el.clientWidth'), 'dialog horizontal overflow'
                page.keyboard.press('Escape')
            check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'{width}px cards and tip dialogs fit without horizontal scrolling')
            select(page,'student')
            check(page.locator('#entry-nickname').is_visible() and page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'{width}px student entry remains readable and usable')

        page.set_viewport_size({'width':1680,'height':1000}); page.goto(ENTRY)
        page.locator('[data-select-role="student"]').click()
        page.evaluate('dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}));dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))')
        check(page.locator('.iu-gate').get_attribute('data-view') == 'roles' and page.locator('[data-select-role="teacher"]').is_enabled(), 'history restoration during a role transition restores usable controls')

        fallback_context = browser.new_context(service_workers='block')
        fallback = fallback_context.new_page()
        fallback.route('**/assets/login/adventure-landscape.webp', lambda r:r.abort())
        fallback.goto(ENTRY); fallback.wait_for_selector('.gate-art-fallback')
        check(fallback.locator('.gate-sunlight').is_visible() and fallback.locator('[data-select-role="student"]').is_enabled(), 'a missing background leaves a styled accessible entry with light scenic fallback')
        nojs = browser.new_context(java_script_enabled=False)
        nojs_page = nojs.new_page(); nojs_page.goto(ENTRY)
        check(nojs_page.locator('.gate-noscript a').count() == 2 and nojs_page.locator('.gate-noscript').is_visible(), 'without JavaScript both real workspace links remain accessible')
        nojs.close(); fallback_context.close()

        # Check the actual worker, then load the entry with the network disabled.
        offline = browser.new_context(viewport={'width':1280,'height':900})
        offline_page = offline.new_page(); offline_page.goto(ORIGIN + '/login.html')
        offline_page.evaluate('navigator.serviceWorker.ready')
        offline_page.wait_for_function('navigator.serviceWorker.controller!==null')
        cached = offline_page.evaluate('(async()=>{const c=await caches.open("inneru-v39");return (await c.keys()).map(r=>new URL(r.url).pathname)})()')
        check('/login.html' in cached and '/assets/login/adventure-landscape.webp' in cached and len(cached) >= 100, 'the new worker actually precaches the entry and existing app shell')
        offline.set_offline(True); offline_page.reload(wait_until='domcontentloaded')
        check(offline_page.locator('[data-select-role="student"]').is_visible() and offline_page.locator('.gate-scene').evaluate('(el)=>el.complete&&el.naturalWidth>0'), 'offline entry loads its controls and optimized landscape artwork')
        check(offline_page.locator('.gate-role-visual img').evaluate_all('(els)=>els.every(el=>el.complete&&el.naturalWidth>0)'), 'both character illustrations remain available offline')
        offline_page.locator('[data-discovery="learn"]').click()
        offline_page.wait_for_function('document.querySelector("dialog img")?.complete')
        check(offline_page.locator('dialog img').evaluate('(el)=>el.complete&&el.naturalWidth>0'), 'the illustrated companion and discovery tips remain available offline')
        offline.close()

        source = (ROOT/'sw.js').read_text()
        shell = re.search(r'const SHELL = \[([\s\S]*?)\];',source).group(1)
        paths = re.findall(r"'([^']+)'",shell)
        check(all((ROOT / p.split('?')[0].removeprefix('./')).exists() for p in paths), 'every precached shell path resolves to a real file')
        check(len(paths) == len(set(paths)), 'the precache batch contains no duplicate requests that would abort offline installation')
        config = json.loads((ROOT/'vercel.json').read_text())
        check({'source':'/login','destination':'/login.html'} in config['rewrites'], 'Vercel exposes the entry at /login while preserving the homepage route')
        check(not errors, 'no browser JavaScript errors in entry, role changes or existing workspaces: ' + str(errors))
        browser.close()
    print(f'PASS: {checks} adventure entry checks')
finally:
    server.shutdown()
