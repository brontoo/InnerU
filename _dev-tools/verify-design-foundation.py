"""Shared-shell visual/keyboard checks; isolated fixtures, never production.

--capture-baseline records the pre-change shell without requiring new conventions.
Screenshots are review artifacts, not pixel-golden tests.
"""
import json
import sys
from pathlib import Path
from test_support import DatabaseFixture, playwright_session, launch, new_context, artifact

baseline = '--capture-baseline' in sys.argv
f = DatabaseFixture('inneru_design_foundation_check')
report, errors = [], []
checks = 0


def check(value, message):
    global checks
    assert value, message
    checks += 1
    print('PASS ' + message, flush=True)


def open_route(page, route, selector):
    page.goto(f.origin + '/index.html?nosw=1#' + route)
    page.wait_for_selector(selector)
    page.wait_for_function('!document.body.classList.contains("iu-access-pending")')
    if route == 'dashboard':
        page.wait_for_function('InneruCloud.status()==="Saved to your account"||InneruCloud.status()==="Choose a saved version"')
        if page.locator('[data-cloud-use=remote]').count():
            page.locator('[data-cloud-use=remote]').click()
        page.wait_for_function('InneruCloud.status()==="Saved to your account"')
    page.wait_for_timeout(180)


def capture(page, role, language, width):
    page.set_viewport_size({'width': width, 'height': 1000})
    page.wait_for_timeout(100)
    label = f'{role}-{language}-{width}'
    geometry = page.evaluate('''() => {
      const nav=document.querySelector('.sidebar>nav');
      return {width:innerWidth, scroll:document.documentElement.scrollWidth,
        nav:nav ? {width:nav.clientWidth,scroll:nav.scrollWidth,
          current:nav.querySelectorAll('[aria-current=page]').length} : null};
    }''')
    check(geometry['scroll'] <= width, label + ' has no page overflow')
    if not baseline and geometry['nav']:
        check(geometry['nav']['scroll'] <= geometry['nav']['width'] + 1,
              label + ' shows navigation without horizontal scrolling')
        check(geometry['nav']['current'] == 1, label + ' identifies one current destination')
        nav = page.locator('.sidebar>nav')
        check(bool(nav.get_attribute('aria-label')), label + ' names its primary navigation')
        targets = nav.locator('a').evaluate_all('es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))')
        check(all(t['w'] >= 44 and t['h'] >= 44 for t in targets), label + ' has 44px navigation targets')
        active = nav.locator('[aria-current=page]')
        active.focus()
        check(active.evaluate('e=>e===document.activeElement && getComputedStyle(e).outlineStyle!=="none"'),
              label + ' exposes visible keyboard focus')
    image = label + '.png'
    page.screenshot(path=artifact(image), full_page=False, animations='disabled')
    report.append({'state': label, 'geometry': geometry, 'screenshot': image})
    Path(artifact('design-foundation.json')).write_text(json.dumps(report, indent=2))


try:
    f.sql('delete from auth.users;')
    with playwright_session() as pw:
        browser = launch(pw)
        teacher, _ = f.account(browser, 'riham.hassan@moe.sch.ae', 'Riham local')
        student, _ = f.account(browser, 'design-learner@example.com', 'أحمد Explorer', '10G5')
        owner, uid = f.account(browser, 'design-owner@example.com', 'Owner local')
        f.sql("update public.profiles set role='admin' where id='" + uid['id'] + "'")
        anon = new_context(browser, service_workers='block').new_page()
        for page in [anon, student, teacher, owner]:
            page.on('pageerror', lambda error: errors.append(str(error)))
        for language in ['en', 'ar']:
            for page, role, route, selector in [
                (student, 'student', 'dashboard', '.sd-page'),
                (teacher, 'teacher', 'teacher', '.td-page'),
                (owner, 'owner', 'owner', '.owner-class'),
            ]:
                open_route(page, route, selector)
                page.evaluate('(language)=>InneruPreferences.set({language})', language)
                page.wait_for_function('(l)=>document.documentElement.lang===l', arg=language)
                page.wait_for_timeout(300)
                # Freeze only after normal account/cloud initialization has settled.
                before = page.evaluate('JSON.stringify(state)')
                for width in [1440, 768, 390, 320]:
                    capture(page, role, language, width)
                check(page.evaluate('JSON.stringify(state)') == before,
                      role + ' ' + language + ' layout/focus checks preserve learning state')
            anon.goto(f.origin + '/login.html?role=student')
            anon.wait_for_selector('.gate-welcome')
            anon.evaluate('(language)=>InneruPreferences.set({language})', language)
            anon.wait_for_function('(l)=>document.documentElement.lang===l', arg=language)
            anon.wait_for_timeout(300)
            for width in [1440, 768, 390, 320]:
                capture(anon, 'login', language, width)
        # Secondary student destinations must not leave Home/Dashboard highlighted.
        if not baseline:
            for route in ['home', 'detective', 'connect', 'badges', 'review', 'sources']:
                open_route(student, route, '#main')
                student.wait_for_function('!document.querySelector("[data-route-loading]")')
                check(student.locator('.sidebar a.navlink[aria-current=page]').count() == 1,
                      route + ' has exactly one current student navigation link')
                check(student.locator('.sidebar a.navlink[aria-current=page]').get_attribute('href') == '#' + route,
                      route + ' highlights its actual destination')
            for page, role in [(teacher, 'teacher'), (owner, 'owner')]:
                open_route(page, 'sources', '.sourcelist')
                check(page.locator('.sidebar>nav [aria-current=page]').count() == 0,
                      role + ' references do not falsely select Dashboard')
        check(not errors, 'no browser exceptions: ' + str(errors))
        browser.close()
    print(str(checks) + ' design foundation checks passed.', flush=True)
finally:
    f.close()
