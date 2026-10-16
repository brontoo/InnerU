"""Exercise the home gallery against real routes, stored progress and browser controls."""
import copy
import functools
import http.server
import re
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
KEY = 'bodyquest-v1'
FRESH = dict(name='Explorer', xp=0, done=[], rewards=[], weak=[], level='Explorer', motion=False)
ROUTES = ['#integumentary', '#world', '#muscle', '#respiratory', '#circulatory', '#excretory']
SLICES = ['integumentary', None, 'muscle', 'respiratory', 'circ', 'excretory']
MISSIONS = [6, 7, 7, 6, 7, 6]
checks = 0
errors = []


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
    return page.evaluate(f'localStorage.getItem("{KEY}")')


def load(page, seed):
    page.evaluate('(s) => {localStorage.setItem("bodyquest-v1", JSON.stringify(s)); location.hash="home";}', seed)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_selector('.iu-expedition')


def go_home(page):
    page.evaluate('location.hash="home"')
    page.wait_for_selector('.iu-expedition')


def world_state(index, final=False, all_missions=False):
    seed = copy.deepcopy(FRESH)
    ids = list(range(1, MISSIONS[index] + 1)) if all_missions or final else [1, 2]
    if index == 1:
        seed['done'] = ids + ([8] if final else [])
    else:
        seed[SLICES[index]] = dict(done=ids + ([8] if final and index == 2 else []), steps=[], tasks={}, weak=[], xp=0, mastery=final and index != 2)
    return seed


try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--enable-unsafe-swiftshader'])
        page = browser.new_page(viewport=dict(width=1680, height=1100))
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '#home', wait_until='domcontentloaded')
        page.wait_for_selector('.iu-expedition')
        load(page, FRESH)
        baseline = stored(page)
        check(page.locator('.inneru-welcome').count() == 1 and page.locator('.anatomy-lab [data-system]').count() == 6, 'the welcome and all six body-map portals remain available')
        check(page.locator('.iu-world-tabs [role=tab]').count() == 6 and page.locator('.world-journey,.expedition-summary').count() == 0, 'one expedition gallery replaces the old timeline and summary')
        check(page.locator('.iu-overall').get_attribute('aria-valuenow') == '0' and page.locator('[data-iu-resume]').get_attribute('href') == '#world', 'a new learner sees zero progress and a skeletal starting point')

        for i, route in enumerate(ROUTES):
            page.locator(f'[data-iu-world="{i}"]').click()
            check(page.locator('.iu-world-panel a.iu-btn').get_attribute('href') == route, f'world {i+1} offers its actual landing route')
            check(page.locator(f'[data-iu-world="{i}"]').get_attribute('aria-selected') == 'true' and page.locator('.iu-world-panel').get_attribute('aria-labelledby') == f'iu-world-tab-{i}', f'world {i+1} updates the accessible tab selection')
            check(page.locator('#human-map').get_attribute('data-selected') == str(i), f'world {i+1} synchronizes with the anatomical body map')
            check(page.locator('.iu-specimen-image img').evaluate('(img) => img.decode().then(() => img.naturalWidth > 300)'), f'world {i+1} loads its anatomical illustration')
        check(stored(page) == baseline and page.evaluate('location.hash') == '#home', 'browsing all six worlds leaves saved learning progress and route unchanged')

        page.locator('[data-iu-world="5"]').focus()
        page.keyboard.press('ArrowRight')
        check(page.locator('[data-iu-world="0"]').evaluate('(el) => el === document.activeElement') and page.locator('.iu-expedition').get_attribute('data-world') == '0', 'keyboard navigation wraps to the first world')
        page.keyboard.press('End')
        check(page.locator('.iu-expedition').get_attribute('data-world') == '5', 'End selects the last world')
        page.keyboard.press('Home')
        check(page.locator('.iu-expedition').get_attribute('data-world') == '0' and page.locator('.iu-world-tabs [tabindex="0"]').count() == 1, 'Home selects the first world with one tab stop')
        page.locator('.anatomy-lab .system-select[data-system="3"]').click()
        check(page.locator('.iu-expedition').get_attribute('data-world') == '3', 'selection from the original body map updates the new gallery')
        page.locator('[data-iu-map]').click()
        check(page.evaluate('document.activeElement.dataset.system') == '3', 'the body-map shortcut returns focus to the matching source portal')
        check(stored(page) == baseline, 'body-map synchronization does not award XP or alter progress')

        opener = page.locator('.iu-final-action [data-iu-keys]')
        opener.click()
        check(page.locator('dialog[open] .iu-key-item').count() == 6 and page.locator('dialog .is-earned').count() == 0, 'the key cabinet opens with six unearned keys for a new learner')
        check(page.locator('dialog a[href="#final"]').count() == 0 and page.locator('.final-destination .cap-enter').count() == 0, 'the locked home view never links directly into the final challenge')
        page.locator('dialog a').last.focus()
        page.keyboard.press('Tab')
        check(page.locator('[data-iu-close]').evaluate('(el) => el === document.activeElement'), 'the native modal keeps keyboard focus inside the collection')
        page.keyboard.press('Escape')
        check(not page.locator('dialog').evaluate('(el) => el.open') and opener.evaluate('(el) => el === document.activeElement'), 'Escape closes the collection and returns focus to its opener')
        page.locator('.iu-key-art').click()
        page.locator('[data-iu-close]').click()
        check(stored(page) == baseline, 'both key-collection controls are read-only')
        page.evaluate('location.hash="final"')
        page.wait_for_selector('.cap-locked')
        check(page.locator('[data-cap-station]').count() == 0, 'direct final-challenge navigation still enforces the six-key prerequisite')
        go_home(page)

        for i, route in enumerate(ROUTES):
            page.locator(f'[data-iu-world="{i}"]').click()
            page.locator('.iu-world-actions a').click()
            page.wait_for_function('!document.querySelector(".iu-expedition")')
            check(page.evaluate('location.hash') == route and page.locator('main h1').count() > 0, f'entering world {i+1} renders its learning page')
            go_home(page)
        for i, route in enumerate(['#world', '#detective', '#connect']):
            page.locator(f'.iu-curiosity-{i}').click()
            page.wait_for_function('!document.querySelector(".iu-expedition")')
            check(page.evaluate('location.hash') == route and page.locator('main h1').count() > 0, f'illustrated discovery card {i+1} opens its real destination')
            go_home(page)

        for i in range(6):
            load(page, world_state(i))
            page.locator(f'[data-iu-world="{i}"]').click()
            expected = '#mission/3' if i == 1 else '#muscle/mission/3' if i == 2 else ROUTES[i] + ('/3' if i == 4 else '/mission/3')
            check(page.locator('[data-iu-resume]').get_attribute('href') == expected and page.locator('.iu-world-actions a').get_attribute('href') == expected, f'partial world {i+1} resumes at its next incomplete mission')
            check(page.locator('.iu-overall').get_attribute('aria-valuenow') == '4', f'world {i+1} contributes its two milestones to the combined 45-step expedition')
            page.locator('[data-iu-resume]').click()
            page.wait_for_function('!document.querySelector(".iu-expedition")')
            check(page.evaluate('location.hash') == expected and page.locator('main h1').count() > 0, f'world {i+1} resume link is accepted by its route and prerequisite checks')
            load(page, world_state(i, all_missions=True))
            expected_final = '#mission/8' if i == 1 else '#muscle/mission/8' if i == 2 else ROUTES[i] + '/mastery'
            check(page.locator('[data-iu-resume]').get_attribute('href') == expected_final and '0/6' in page.locator('.iu-final-status').inner_text(), f'world {i+1} directs completed missions to the world final without prematurely granting a key')
            load(page, world_state(i, final=True))
            page.locator(f'[data-iu-world="{i}"]').click()
            page.locator('.iu-key-art').click()
            check(page.locator('.iu-key-item.is-earned').count() == 1 and page.locator('.iu-key-item').nth(i).get_attribute('class').endswith('is-earned'), f'world {i+1} recognizes only its existing earned System Key')
            page.keyboard.press('Escape')
            check(page.locator('.iu-world-progress [role=progressbar]').get_attribute('aria-valuenow') == '100', f'world {i+1} shows full completion after its final challenge')

        seed = copy.deepcopy(FRESH)
        seed.update(xp=1234, done=[1, 1, 2, 0, 99, '1'])
        load(page, seed)
        check(page.locator('.iu-world-progress [role=progressbar]').get_attribute('aria-valuenow') == '25' and page.locator('.iu-overall').get_attribute('aria-valuenow') == '4', 'duplicate and unrelated IDs do not inflate home progress')
        check('1,234' in page.locator('.iu-progress-numbers').inner_text(), 'the expedition displays saved XP with readable formatting')
        seed['name'] = '<img src=x onerror=alert(1)>'
        load(page, seed)
        check(page.locator('.iu-explorer-initial img').count() == 0 and page.locator('.iu-explorer-initial').inner_text() == '<', 'learner initials remain plain text')

        complete = copy.deepcopy(FRESH)
        for i in range(6):
            part = world_state(i, final=True)
            if i == 1:
                complete['done'] = part['done']
            else:
                complete[SLICES[i]] = part[SLICES[i]]
        complete['xp'] = 2700
        load(page, complete)
        check(page.locator('.iu-overall').get_attribute('aria-valuenow') == '100' and 'Unlocked · 6/6 keys' in page.locator('.iu-final-status').inner_text(), 'all six earned keys complete the expedition and unlock its final card')
        page.locator('.iu-key-art').click()
        check(page.locator('.iu-key-item.is-earned').count() == 6 and page.locator('dialog a[href="#final"]').count() == 1, 'the completed cabinet exposes all six earned keys and the final destination')
        page.keyboard.press('Escape')
        page.locator('.cap-enter').click()
        page.wait_for_selector('[data-cap-station]')
        check(page.locator('[data-cap-station]').count() == 6, 'the unlocked final link opens all six capstone stations')
        go_home(page)

        baseline = stored(page)
        page.locator('.iu-specimen-image').click()
        check(page.locator('.iu-expedition').get_attribute('data-iu-motion') == 'on', 'clicking ordinary gallery content does not toggle its motion preference')
        page.locator('[data-iu-toggle-motion]').click()
        check(page.locator('.iu-expedition').get_attribute('data-iu-motion') == 'off', 'the gallery has a local motion pause control')
        page.locator('[data-iu-toggle-motion]').click()
        page.emulate_media(reduced_motion='reduce')
        page.wait_for_function('document.querySelector("[data-iu-toggle-motion]").disabled')
        check(page.locator('.iu-expedition').get_attribute('data-iu-motion') == 'off' and page.locator('.iu-key-ring').evaluate('(el) => getComputedStyle(el).animationName') == 'none', 'system reduced-motion preference disables ambient animation')
        page.emulate_media(reduced_motion='no-preference')
        page.wait_for_function('!document.querySelector("[data-iu-toggle-motion]").disabled')
        page.evaluate('document.body.classList.add("motionoff")')
        page.wait_for_function('document.querySelector("[data-iu-toggle-motion]").disabled')
        check(page.locator('.iu-expedition').get_attribute('data-iu-motion') == 'off', 'the existing app-wide motion preference also disables gallery animation')
        page.evaluate('document.body.classList.remove("motionoff")')
        page.wait_for_function('!document.querySelector("[data-iu-toggle-motion]").disabled')
        check(stored(page) == baseline, 'visual preferences leave the saved learning record unchanged')

        for width in [1680, 1024, 768, 390, 320]:
            page.set_viewport_size(dict(width=width, height=1000))
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'the full home page fits {width}px without horizontal overflow')
            for i in range(6):
                page.locator(f'[data-iu-world="{i}"]').click()
                assert page.locator('.iu-expedition').get_attribute('data-world') == str(i)
            check(True, f'all six world selectors remain directly usable at {width}px')
            page.locator('.iu-key-art').click()
            check(page.locator('dialog').evaluate('(el) => el.scrollWidth <= el.clientWidth+1') and page.locator('[data-iu-close]').is_visible(), f'the key collection fits and can be closed at {width}px')
            page.keyboard.press('Escape')

        page.set_viewport_size(dict(width=1680, height=1100))
        page.locator('.iu-key-art').click()
        page.evaluate('location.hash="dashboard"')
        page.wait_for_function('!document.querySelector(".iu-expedition")')
        check(page.locator('dialog[open]').count() == 0, 'navigating away with an open collection removes its modal and listeners')
        go_home(page)
        page.locator('.iu-key-art').click()
        page.keyboard.press('Escape')
        check(page.locator('.iu-expedition').count() == 1 and page.locator('dialog').count() == 1, 'returning home creates one working gallery without duplicate dialogs')
        shell = page.evaluate(r"async () => {const t=await (await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
        for path in shell:
            assert page.request.get(BASE.split('?')[0] + path.removeprefix('./')).status == 200, path
        check(True, f'all {len(shell)} offline shell URLs resolve')
        check((ROOT/'index.html').read_bytes() == (ROOT/'404.html').read_bytes(), 'both HTML entry points load the same gallery assets')
        check(sum(p.stat().st_size for p in (ROOT/'assets/home-expedition').glob('*.webp')) < 550000, 'six optimized anatomical gallery images total less than 550 KB')
        check(not errors, 'gallery, navigation, preferences and saved-state scenarios produce no JavaScript errors: '+str(errors))
        browser.close()
finally:
    server.shutdown()
    server.server_close()

print(f'{checks} home expedition checks passed.', flush=True)
