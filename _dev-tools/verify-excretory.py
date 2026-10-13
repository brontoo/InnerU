"""Browser verification for the lesson-aligned excretory expedition.

Run with Python Playwright and Chromium installed:
  python3 _dev-tools/verify-excretory.py
The test serves the repository read-only, uses isolated browser storage, and stops
its own server. No application or user progress files are changed.
"""
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks = 0
errors = []

def check(condition, message):
    global checks
    assert condition, message
    checks += 1
    print('PASS', message, flush=True)

def seed(page):
    page.goto(BASE + '#home')
    value = dict(name='Explorer', xp=0, done=[], rewards=[], weak=[], level='Explorer', motion=True,
                 excretory=dict(done=[], steps={}, mastery=False, weak=[]))
    page.evaluate("s => localStorage.setItem('bodyquest-v1', JSON.stringify(s))", value)
    return page.evaluate("localStorage.getItem('bodyquest-v1')")

def state(page):
    return page.evaluate("JSON.parse(localStorage.getItem('bodyquest-v1'))")

def go(page, path):
    page.goto(BASE + '#excretory' + path)
    page.wait_for_selector('.exc-world')

def answer_checks(page, final=False):
    attr = 'data-exc-final' if final else 'data-exc-question'
    for item in page.locator(f'[{attr}]').all():
        for button in item.locator('[data-choice]').all():
            if item.locator('.resp-correct').count():
                break
            button.click()
        check(item.locator('.resp-correct').count() == 1, 'knowledge check responds to a correct answer')

def solve_lab(page, n):
    if n in (1, 3, 4):
        for chip in page.locator('[data-exc-item]').all():
            if chip.is_disabled(): continue
            chip.click()
            for bin in page.locator('[data-exc-bin]').all():
                if chip.is_disabled():
                    break
                bin.click()
        check(page.locator('[data-exc-item]:disabled').count() == 6, f'mission {n}: six cargo items sorted')
    elif n == 2:
        for i in range(6):
            page.locator(f'[data-kidney-label="{i}"]').click()
        check(page.locator('[data-kidney-label]:disabled').count() == 6, 'all kidney structure clues solved')
    elif n == 5:
        for i, value in enumerate([90, 10, 50]):
            page.locator(f'[data-balance-case="{i}"]').click()
            page.locator('#adh-level').fill(str(value))
            page.locator('#exc-test-balance').click()
        check(page.locator('[data-balance-case].is-solved').count() == 3, 'all three ADH situations solved')
    else:
        answers = ['Infection','Nephritis','Kidney stone','Urinary tract blockage','Polycystic kidney disease','Kidney cancer']
        for i, answer in enumerate(answers):
            page.locator(f'[data-case-tab="{i}"]').click()
            page.locator(f'[data-case-answer="{answer}"]').click()
        check(page.locator('[data-case-tab].is-solved').count() == 6, 'all six disorder mechanisms solved')
    check('✓' in page.locator('#exc-lab-step').inner_text(), f'mission {n}: challenge completion announced')

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                    args=['--no-sandbox','--enable-unsafe-swiftshader'])
        context = browser.new_context(viewport={'width':1360,'height':1000})
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        original = seed(page)
        # Preview every lesson and the final, including actual completion and side quests.
        for n in range(1, 7):
            go(page, f'/mission/{n}?preview=1')
            check(page.locator('.is-preview').count() == 1, f'mission {n}: preview opens with no prerequisite')
            check(page.locator('.exc-preview-answer').count() == 3, 'all answer explanations available in preview')
            if n == 1:
                page.locator('[data-exc-item="0"]').drag_to(page.locator('[data-exc-bin="0"]'))
                check(page.locator('[data-exc-item="0"]').is_disabled(), 'drag-and-drop sorting places the cargo')
            solve_lab(page, n)
            answer_checks(page)
            check('Preview challenge complete' in page.locator('#exc-finish').inner_text(), 'preview completion uses transient progress')
            if n == 1:
                for i in range(5): page.locator(f'[data-exc-step="{i}"]').click()
                check(page.locator('#exc-seq li').count() == 5, 'complete urinary exit route includes the urethra')
            if n == 4:
                page.locator('#exc-audit-answer').fill('1.5')
                page.locator('#exc-audit button').click()
                check('✓' in page.locator('#exc-audit-feedback').inner_text(), 'water audit uses 180 L filtrate and 1.5 L urine')
            if n == 5:
                page.locator('#exc-weekly-answer').fill('10.5')
                page.locator('#exc-weekly button').click()
                page.locator('[data-ph="correct"]').click()
                check('✓' in page.locator('#exc-weekly-feedback').inner_text(), 'weekly urine calculation gives 10.5 L')
                check('✓' in page.locator('#exc-ph-feedback').inner_text(), 'acid–base activity handles bicarbonate correctly')
                page.get_by_text('Plan an exercise investigation', exact=True).click()
                page.locator('#exc-investigation').fill('Collect consistent breathing-rate measurements.')
                page.locator('#exc-journal-save').click()
            if n == 6:
                page.locator('[data-treatment="dialysis"]').click()
                check('✓' in page.locator('#exc-treatment-feedback').inner_text(), 'dialysis and transplantation compared')
            check(page.evaluate("localStorage.getItem('bodyquest-v1')") == original, 'preview does not change persisted XP, progress, keys, notes or streak')
        go(page, '/mastery?preview=1')
        answer_checks(page, final=True)
        check('Final challenge previewed' in page.locator('#exc-mastered').inner_text(), 'preview final completes without awarding the Key')
        check(page.evaluate("localStorage.getItem('bodyquest-v1')") == original, 'final preview preserves saved student state')
        # Normal expedition: wrong choices must not earn a fragment; later missions stay previewable.
        seed(page)
        go(page, '/mission/6')
        check(page.get_by_text('Explore it now, or earn your way here.').count() == 1, 'expedition respects prerequisites and offers preview')
        go(page, '/mission/1')
        page.locator('[data-exc-item="0"]').click()
        page.locator('[data-exc-bin="2"]').click()
        check(state(page)['xp'] == 0, 'an incorrect classification earns no XP')
        for n in range(1, 7):
            go(page, f'/mission/{n}')
            solve_lab(page, n)
            check(n not in state(page)['excretory']['done'], 'lab alone does not earn the mission fragment')
            answer_checks(page)
            check(n in state(page)['excretory']['done'], f'mission {n}: lab plus checks persist a fragment')
        before = state(page)['xp']
        go(page, '/mission/1')
        solve_lab(page, 1)
        check(state(page)['xp'] == before, 'replaying a completed lab does not duplicate XP')
        go(page, '/mastery')
        answer_checks(page, final=True)
        check(state(page)['excretory']['mastery'], 'real expedition awards the Excretory System Key')
        before = state(page)['xp']
        page.reload()
        check(state(page)['xp'] == before and state(page)['excretory']['mastery'], 'earned Key persists with no repeated XP on reload')
        # Model views: each structure is selectable, modes restore, rotation changes camera.
        go(page, '')
        page.wait_for_function('window.inneruExcretoryExplorerState && window.inneruExcretoryExplorerState().canvas')
        for view, expected in [('organs',7),('kidney',7),('nephron',9),('flow',7)]:
            page.locator(f'[data-explorer-tab="{view}"]').click()
            live = page.evaluate('window.inneruExcretoryExplorerState()')
            check(live['view'] == view and live['rotatable'], f'{view}: 3D view is rendered and rotatable')
            check(page.locator('[data-structure]').count() == expected, f'{view}: all {expected} structures listed')
            for button in page.locator('[data-structure]').all():
                name = button.get_attribute('data-structure')
                button.click()
                live = page.evaluate('window.inneruExcretoryExplorerState()')
                check(name in live['structures'] and live['selection'] == name, f'{view}: {name} has an actual selectable mesh')
        check(page.evaluate('window.inneruExcretoryExplorerState().particleCount') > 0, 'urine-flow view has moving markers on the ureters and urethra')
        page.locator('[data-explorer-tab="organs"]').click()
        initial = page.evaluate('window.inneruExcretoryExplorerState().camera')
        page.locator('.exc-explorer-stage').focus()
        page.keyboard.press('ArrowLeft')
        check(page.evaluate('window.inneruExcretoryExplorerState().camera') != initial, 'keyboard rotates the anatomy model')
        page.locator('[data-explorer-tab="organs"]').focus()
        page.keyboard.press('ArrowRight')
        check(page.locator('[data-explorer-tab="kidney"]').get_attribute('aria-selected') == 'true', 'arrow keys navigate the anatomy tabs')
        page.set_viewport_size({'width':390,'height':844})
        for path in ['', '/mission/2?preview=1','/mission/5?preview=1','/mission/6?preview=1','/mastery?preview=1']:
            go(page, path)
            page.wait_for_function('document.documentElement.scrollWidth <= innerWidth', timeout=10000)
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'mobile layout fits the viewport: {path or "mission board"}')
        go(page, '?preview=1')
        check('/mission/1?preview=1' in page.locator('.exc-hero-actions a.btn').get_attribute('href'), 'preview entry always opens mission 01 despite earned progress')
        page.locator('#exc-browse-missions').click()
        check(page.evaluate('location.hash') == '#excretory?preview=1', 'browse-missions button scrolls without changing the application route')
        # The same structure explanations remain accessible without WebGL.
        fallback = browser.new_context()
        fallback.add_init_script("HTMLCanvasElement.prototype.getContext = function(){ return null; }")
        no_gl = fallback.new_page()
        go(no_gl, '')
        no_gl.wait_for_selector('.exc-model-fallback', state='visible')
        check(no_gl.locator('[data-structure]').count() == 7, 'non-WebGL fallback keeps the structure controls')
        no_gl.locator('[data-explorer-tab="nephron"]').click()
        no_gl.locator('[data-structure="Glomerulus"]').click()
        check('Blood pressure' in no_gl.locator('.exc-structure-info').inner_text(), 'non-WebGL fallback explains nephron structures')
        check(not errors, f'no uncaught browser errors: {errors}')
        browser.close()
    print(f'{checks} checks passed.', flush=True)
finally:
    server.shutdown()
    server.server_close()
