"""Check the six action/anatomy scenes and preserve the real connection challenge."""
import functools
import http.server
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
checks = 0
errors = []
titles = ['Climbing stairs', 'Holding a school bag', 'A twisted ankle', 'Lifting a school bag', 'Running', 'Moving in hot weather']
terms = [['Quadriceps', 'Patella', 'Patellar ligament'], ['Biceps brachii', 'Distal biceps tendon', 'Radius & ulna'], ['Ankle bones', 'Anterior talofibular ligament', 'Calcaneofibular ligament'], ['Biceps brachii', 'Tendon attachment', 'Triceps brachii'], ['Lungs', 'Heart', 'Skeletal muscle'], ['Eccrine sweat gland', 'Dermal blood vessels', 'Surface evaporation']]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_port}/?nosw=1'


def check(condition, message):
    global checks
    assert condition, message
    checks += 1
    print('PASS', message, flush=True)


def stored(page):
    return page.evaluate('localStorage.getItem("bodyquest-v1")')


def connect(page):
    page.evaluate('location.hash="connect"')
    page.wait_for_selector('.cx-card')


try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--enable-unsafe-swiftshader'])
        page = browser.new_page(viewport=dict(width=1680, height=1100))
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '#connect', wait_until='domcontentloaded')
        page.wait_for_selector('.cx-card')
        baseline = stored(page)
        page.locator('.cx-art img').evaluate_all('imgs => Promise.all(imgs.map(img => {img.loading="eager"; return img.decode()}))')
        check(page.locator('.cx-card').count() == 6 and page.locator('.scenario-card').count() == 3 and page.locator('.mq-connection').count() == 3, 'both connection sections receive their three matching anatomical scenes')
        check(len(set(page.locator('.cx-art img').evaluate_all('imgs => imgs.map(img => img.src)'))) == 6, 'every activity has its own original action-and-anatomy illustration')
        check(page.locator('.cx-art img').evaluate_all('imgs => imgs.every(img => img.naturalWidth===1536 && img.naturalHeight===1024 && img.alt.length>80 && getComputedStyle(img).objectFit==="contain")'), 'all six complete images load at high resolution with descriptive alternative text')
        check(page.locator('#systems [data-match]').count() == 6 and page.locator('#connection-reason').count() == 1, 'the existing system-matching and writing activity remains available')
        for i, title in enumerate(titles):
            card = page.locator(f'[data-cx-card="{i}"]')
            card.locator('summary').click()
            check(card.evaluate('(el) => el.open') and card.locator('.cx-system-chips span').count() >= 3, f'{title} reveals the connected system team')
            card.locator('[data-cx-open]').click()
            check(page.locator('.cx-dialog').evaluate('(el) => el.open') and page.locator('#cx-dialog-title').inner_text() == title, f'{title} opens its own anatomical lens without completion gates')
            for part, term in enumerate(terms[i]):
                page.locator(f'[data-cx-inspect="{part}"]').click()
                check(page.locator('.cx-part-info h3').inner_text() == term and page.locator('.cx-parts [aria-pressed="true"]').count() == 1 and page.locator('.cx-focus-ring b').inner_text() == str(part+1), f'{title}: {term} selection updates explanation and anatomical marker')
            page.locator('[data-cx-zoom]').click()
            check(page.locator('.cx-dialog').get_attribute('class').endswith('cx-is-zoomed') and page.locator('[data-cx-zoom]').get_attribute('aria-pressed') == 'true', f'{title} can magnify its selected anatomical area')
            page.locator('[data-cx-zoom]').click()
            page.keyboard.press('Escape')
            check(not page.locator('.cx-dialog').evaluate('(el) => el.open') and card.locator('[data-cx-open]').evaluate('(el) => el === document.activeElement'), f'{title} closes with Escape and returns keyboard focus')
        check(stored(page) == baseline and page.evaluate('state.xp') == 0, 'all scenes, 18 anatomical selections and magnification controls preserve saved progress and XP')

        page.locator('[data-cx-open="0"]').focus()
        page.keyboard.press('Enter')
        page.locator('[data-cx-inspect="0"]').focus()
        page.keyboard.press('ArrowRight')
        check(page.locator('.cx-part-info h3').inner_text() == 'Patella', 'keyboard arrow navigation selects the next anatomical structure')
        page.keyboard.press('End')
        check(page.locator('.cx-part-info h3').inner_text() == 'Patellar ligament', 'End selects the final structure')
        page.keyboard.press('Home')
        check(page.locator('.cx-part-info h3').inner_text() == 'Quadriceps', 'Home selects the first structure')
        page.locator('[data-cx-next]').focus()
        page.keyboard.press('Tab')
        check(page.locator('[data-cx-close]').evaluate('(el) => el === document.activeElement'), 'Tab cycles from the last modal control to Close')
        page.keyboard.press('Shift+Tab')
        check(page.locator('[data-cx-next]').evaluate('(el) => el === document.activeElement'), 'Shift+Tab cycles backwards within the modal')
        check(page.locator('[data-cx-prev]').is_disabled(), 'the scene gallery has a clear first boundary')
        for i in range(1, 6):
            page.locator('[data-cx-next]').click()
            assert page.locator('#cx-dialog-title').inner_text() == titles[i]
        check(page.locator('[data-cx-next]').is_disabled() and page.locator('[data-cx-count]').inner_text() == '06 / 06', 'next scene browses every illustration freely and stops at the last')
        for i in range(4, -1, -1):
            page.locator('[data-cx-prev]').click()
            assert page.locator('#cx-dialog-title').inner_text() == titles[i]
        check(page.locator('[data-cx-prev]').is_disabled(), 'previous scene returns through the complete anatomy collection')
        page.keyboard.press('Escape')

        page.locator('.cx-card').first.scroll_into_view_if_needed()
        page.wait_for_function('document.querySelector(".cx-card").classList.contains("cx-in-view")')
        spark = page.locator('.cx-discovery-spark').first
        check(spark.evaluate('(el) => getComputedStyle(el).animationName') == 'cx-spark', 'a visible card has a restrained animated discovery cue')
        page.locator('[data-cx-motion-toggle]').click()
        check(spark.evaluate('(el) => getComputedStyle(el).animationName') == 'none', 'pause stops decorative card motion')
        page.locator('[data-cx-motion-toggle]').click()
        page.emulate_media(reduced_motion='reduce')
        page.wait_for_function('document.querySelector("[data-cx-motion-toggle]").disabled')
        check(spark.evaluate('(el) => getComputedStyle(el).animationName') == 'none', 'system reduced motion stops card animation')
        page.emulate_media(reduced_motion='no-preference')
        page.wait_for_function('!document.querySelector("[data-cx-motion-toggle]").disabled')
        page.evaluate('document.body.classList.add("motionoff")')
        page.wait_for_function('document.querySelector("[data-cx-motion-toggle]").disabled')
        check(page.locator('main').get_attribute('data-cx-motion') == 'off', 'the existing app-wide motion preference controls the scenes')
        page.evaluate('document.body.classList.remove("motionoff")')
        page.wait_for_function('!document.querySelector("[data-cx-motion-toggle]").disabled')
        check(stored(page) == baseline, 'keyboard browsing and visual preferences leave learning progress unchanged')

        for width, columns in [(1680, 3), (1024, 3), (768, 2), (390, 1), (320, 1)]:
            page.set_viewport_size(dict(width=width, height=900))
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'the complete connections page fits {width}px without horizontal overflow')
            check(page.locator('.cx-section .grid.three').evaluate('el => getComputedStyle(el).gridTemplateColumns.split(" ").length') == columns, f'{width}px cards use {columns} readable column(s)')
            for i in range(6):
                page.locator(f'[data-cx-open="{i}"]').click()
                assert page.locator('.cx-dialog').evaluate('el => el.scrollWidth <= el.clientWidth + 1')
                for part in range(3):
                    page.locator(f'[data-cx-inspect="{part}"]').click()
                    assert page.locator('.cx-dialog').get_attribute('data-cx-part') == str(part)
                page.locator('[data-cx-close]').click()
            check(True, f'all six lenses and all 18 structure controls remain usable at {width}px')

        check(stored(page) == baseline, 'responsive exploration never writes XP, keys or mission completion')
        page.set_viewport_size(dict(width=1680, height=1100))
        page.locator('[data-cx-open="2"]').click()
        page.evaluate('location.hash="home"')
        page.wait_for_selector('.iu-expedition')
        check(page.locator('.cx-dialog,.cx-card,.cx-gallery-tools').count() == 0, 'leaving during inspection disposes the dialog and connections-only UI')
        connect(page)
        check(page.locator('.cx-dialog').count() == 1 and page.locator('.cx-card').count() == 6, 'returning creates exactly one gallery and dialog')
        # Original challenge prerequisites and the once-only 35 XP reward.
        page.locator('#check-match').click()
        check('Check the pathway' in page.locator('#connect-feedback').inner_text() and page.evaluate('state.xp') == 0, 'opening anatomy does not bypass the original matching challenge')
        for i in range(6):
            page.locator(f'#systems-{i}').select_option(str(i))
        page.locator('#check-match').click()
        check('All six systems matched' in page.locator('#connect-feedback').inner_text(), 'all six original system matches still validate correctly')
        page.locator('#connection-reason').fill('The lungs exchange oxygen with blood. The heart circulates that blood to muscles, which use ATP to pull on bones. Skin helps lose heat and kidneys help regulate water balance.')
        page.locator('#compare').click()
        page.locator('#connect-reflect').check()
        check(page.evaluate('state.xp === 35 && state.rewards.includes("connection")'), 'matching and comparing the written explanation retain the exact 35 XP reward')
        page.locator('#connect-reflect').uncheck()
        page.locator('#connect-reflect').check()
        check(page.evaluate('state.xp') == 35, 'repeating the reflection never duplicates the connection reward')
        page.reload(wait_until='domcontentloaded')
        page.wait_for_selector('.cx-card')
        check(page.evaluate('state.xp === 35 && state.rewards.includes("connection")'), 'reload preserves the original learning reward')
        shell = page.evaluate(r"async () => {const t=await (await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
        for path in shell:
            assert page.request.get(BASE.split('?')[0] + path.removeprefix('./')).status == 200, path
        check(True, f'all {len(shell)} offline shell URLs resolve')
        check((ROOT/'index.html').read_bytes() == (ROOT/'404.html').read_bytes(), 'both entry points load identical versioned scene modules')
        check(sum(p.stat().st_size for p in (ROOT/'assets/connection-scenes').glob('*.webp')) < 1200000, 'the six full-resolution scene images total less than 1.2 MB')
        check(not errors, 'no JavaScript errors during discovery, magnification, preferences, navigation or challenge completion: ' + str(errors))
        browser.close()
finally:
    server.shutdown()
    server.server_close()
print(f'{checks} connection scene checks passed.', flush=True)
