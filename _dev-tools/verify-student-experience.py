"""Student progress home: real local evidence, safe record choices and responsive browsing."""
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit
from test_support import DatabaseFixture, playwright_session, launch, artifact

baseline = '--capture-baseline' in sys.argv
f = DatabaseFixture('inneru_student_experience_check')
checks = 0
errors, captures = [], []


def check(value, label):
    global checks
    assert value, label
    checks += 1
    print('PASS ' + label, flush=True)


def go(page, route, selector):
    page.goto(f.origin + '/index.html?nosw=1#' + route)
    page.wait_for_selector(selector)
    if route == 'dashboard':
        page.wait_for_function('InneruCloud.status()==="Saved to your account"||InneruCloud.status()==="Choose a saved version"')
        if page.locator('[data-cloud-use=remote]').count():
            page.locator('[data-cloud-use=remote]').click()
        page.wait_for_function('InneruCloud.status()==="Saved to your account"')
    page.wait_for_timeout(250)


def capture(page, name, selector=None):
    filename = name + '.png'
    # Capture the rendered scrolling experience, including below-fold lazy artwork.
    page.evaluate('''async selector=>{const root=selector?document.querySelector(selector):document;const images=[...root.querySelectorAll('img')].filter(img=>img.getBoundingClientRect().width>0);images.forEach(img=>img.loading='eager');await Promise.all(images.map(img=>img.decode().catch(()=>{})));}''',selector)
    if selector:
        page.locator(selector).screenshot(path=artifact(filename), animations='disabled')
    else:
        page.screenshot(path=artifact(filename), animations='disabled', full_page=True)
    captures.append(filename)
    Path(artifact('captures.json')).write_text(json.dumps(captures, indent=2))


try:
    f.sql('delete from auth.users;')
    with playwright_session() as pw:
        browser = launch(pw)
        teacher, _ = f.account(browser, 'riham.hassan@moe.sch.ae', 'Local teacher')
        student, _ = f.account(browser, 'phase2-student@example.com', 'أحمد Explorer', '10G5')
        requested = []
        student.on('request', lambda request: requested.append(urlsplit(request.url).path))
        student.on('pageerror', lambda error: errors.append(str(error)))
        f.unlock(teacher)
        go(student, 'dashboard', '.sd-page')
        before = student.evaluate('JSON.stringify(state)')
        for language in ['en', 'ar']:
            student.evaluate('(language)=>InneruPreferences.set({language})', language)
            student.wait_for_function('(language)=>document.documentElement.lang===language', arg=language)
            student.wait_for_timeout(400)
            for width in [320, 390, 768, 1024, 1440, 1680]:
                student.set_viewport_size({'width': width, 'height': 1000})
                student.evaluate('scrollTo(0,0)')
                student.wait_for_timeout(100)
                check(student.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'{language} dashboard fits {width}px')
                if not baseline:
                    columns = student.locator('.sd-world-tabs').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ").length')
                    check(columns == (1 if width < 541 else 2 if width <= 1150 else 3), f'{language} system grid uses the expected columns at {width}px')
                    check(student.locator('[data-guided-toggle]').is_visible() and student.locator('[data-interface-language]').is_visible(), f'{language} support settings remain visible at {width}px')
                    check(student.locator('.sd-world-card h3,.sd-world-card p,.sd-card-actions .iu-localized').evaluate_all('es=>es.every(e=>parseFloat(getComputedStyle(e).fontSize)>=12)'), f'{language} card text stays readable at {width}px')
                capture(student, f'dashboard-{language}-{width}')
            student.set_viewport_size({'width': 1440, 'height': 1000})
            capture(student, 'six-system-grid-' + language, '.sd-world-tabs')
            capture(student, 'continue-learning-' + language, '.sd-hero' if baseline else '[data-dashboard-next]')
        check(student.evaluate('JSON.stringify(state)') == before, 'dashboard inspection and language changes preserve learning')
        initial_requests = list(requested)
        if not baseline:
            check(student.locator('.sd-hero .sd-button').count()==1, 'welcome and next lesson share exactly one primary action')
            check(student.locator('.sd-stats>article').count()==3 and student.locator('.sd-game-progress [data-sd-xp]').count()==1, 'missions, keys and review lead the snapshot while XP is secondary')
            check(student.locator('.sd-world-card[data-sd-system-status="Not started"]').count()==6, 'all six fresh systems have an honest Not started status')
            check(student.locator('[data-sd-evidence-status=insufficient]').count()>=1 and student.locator('[data-sd-evidence-status=secure]').count()==0, 'new learners have insufficient objective evidence rather than inferred mastery')
            check(student.locator('#sd-world-panel').inner_html()=='', 'mission details and their illustrations are not rendered before expansion')
            check(not any(path.endswith('student-achievements.js') for path in initial_requests), 'the full achievement collection is deferred until opened')
            check(len(set(path for path in initial_requests if path.startswith('/assets/home-expedition/')))==1, 'initial dashboard requests only its next-lesson illustration')
            order=student.evaluate('''()=>{const page=document.querySelector('.sd-workspace');return ['.sd-hero','.sd-overview','.sd-worlds','.sd-evidence','.sd-achievements','.sd-history'].map(s=>[...page.children].indexOf(page.querySelector(s)));}''')
            check(order==sorted(order) and min(order)>=0,'dashboard hierarchy puts learning, system progress and evidence before detailed rewards')
            check(not student.locator('.sd-history').evaluate('e=>e.open'), 'detailed XP history begins collapsed')
            check(student.locator('.sd-world-tabs button,.sd-hero .sd-button,.sd-evidence-card>a,.sd-history>summary').evaluate_all('es=>es.every(e=>e.getBoundingClientRect().height>=44)'), 'primary actions and progress disclosures keep at least 44px targets')
            contrasts=student.evaluate('''()=>{const rgb=s=>s.match(/[\\d.]+/g).map(Number),l=rgb=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);return [...document.querySelectorAll('.sd-system-status,.sd-card-next,.sd-card-meta,.sd-card-actions button,.sd-evidence-status,.sd-badge-copy small,.sd-badge-copy>span,.sd-hero .sd-button')].map(e=>{let node=e,bg;while(node){bg=rgb(getComputedStyle(node).backgroundColor);if(bg.length===3||bg[3]===1)break;node=node.parentElement;}const a=l(rgb(getComputedStyle(e).color)),b=l(bg||[255,255,255]);return {label:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});}''')
            check(all(item['ratio']>=4.5 for item in contrasts),'sampled system/status/reward labels and the primary button meet 4.5:1 text contrast: '+str([item for item in contrasts if item['ratio']<4.5]))
            student.emulate_media(reduced_motion='reduce')
            check(student.locator('.sd-hero,.sd-stats article,.sd-meter i').evaluate_all('es=>es.every(e=>getComputedStyle(e).animationName==="none"&&getComputedStyle(e).transitionDuration==="0s")'),'reduced motion removes dashboard entrances and progress transitions')
            student.emulate_media(reduced_motion='no-preference')

            for code in ['integumentary','skeletal','muscle','respiratory','circ','excretory']:
                student.locator('[data-sd-world="'+code+'"]').click()
                check(student.locator('#sd-world-panel .sd-mission-objective').count()==student.evaluate('(id)=>InneruLearning.worlds.find(w=>w.id===id).titles.length+1',code),code+' exposes the existing objective for every mission and final')
                capture(student,'system-record-'+code,'#sd-world-panel')
            outline=student.locator('#sd-world-panel .sd-button-outline')
            contrast_script='''e=>{const rgb=s=>s.match(/[\\d.]+/g).slice(0,3).map(Number),l=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),style=getComputedStyle(e),a=l(rgb(style.color)),b=l(rgb(style.backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}'''
            outline_contrasts=[outline.evaluate(contrast_script)]
            outline.hover();student.wait_for_timeout(250)
            outline_contrasts.append(outline.evaluate(contrast_script))
            check(min(outline_contrasts)>=4.5,'expanded-system continuation meets 4.5:1 text contrast normally and on hover: '+str(outline_contrasts))
            for language,expected in [('en','respiratory'),('ar','skeletal')]:
                student.evaluate('(language)=>InneruPreferences.set({language})',language);student.locator('[data-sd-world=muscle]').focus();student.keyboard.press('ArrowRight');check(student.locator('[data-sd-world="'+expected+'"]').get_attribute('aria-expanded')=='true',language+' arrow navigation follows the focused system and reading direction')
            check(student.locator('[data-sd-world]').evaluate_all('es=>new Set(es.map(e=>e.getAttribute("aria-label"))).size===6'),'system disclosure controls have unique accessible names')
            student.locator('.sd-system-record>summary').click()
            student.evaluate("InneruPreferences.set({language:'en'})")
            go(student,'home','.explore-screen')
            check(student.locator('.iu-dashboard-link a[href="#dashboard"]').count()==1,'Explore Worlds links to the personal progress home')
            check(student.locator('.iu-overall,.iu-progress-numbers,.iu-world-progress').count()==0,'student exploration does not repeat the dashboard totals or continuation card')
            for language in ['en','ar']:
                student.evaluate('(language)=>InneruPreferences.set({language})',language);student.wait_for_timeout(500)
                for width in [390,768,1440]:
                    student.set_viewport_size({'width':width,'height':1000});student.evaluate('scrollTo(0,0)');check(student.evaluate('document.documentElement.scrollWidth<=innerWidth'),language+' Explore Worlds fits '+str(width)+'px');capture(student,'explore-worlds-'+language+'-'+str(width))
                capture(student,'explore-gallery-'+language,'#inneru-expedition')
                if language=='ar':check(not student.evaluate('InneruLocale.coverage(document.querySelector(".explore-screen"))'),'the rendered exploration changes have authored Arabic coverage')
        go(student, 'mission/1', '[data-skeletal-mission="1"]')
        for language in ['en', 'ar']:
            student.evaluate('(language)=>InneruPreferences.set({language})', language)
            student.wait_for_timeout(400)
            for width in [390, 1440]:
                student.set_viewport_size({'width': width, 'height': 1000})
                student.evaluate('scrollTo(0,0)')
                if not baseline:
                    # Frame the title and shared navigation rather than the mobile site header.
                    student.evaluate('scrollTo(0,document.querySelector(".skel-mission-heading").getBoundingClientRect().top+scrollY-24)')
                capture(student, f'mission-navigation-{language}-{width}')
        if not baseline:
            check(student.locator('[data-mission-objective]').count() == 1, 'existing authored objective remains available')
            saved = student.evaluate('JSON.stringify(state)')
            for button in student.locator('.iu-mission-jumps button').all():
                button.click()
                check(student.evaluate('document.activeElement!==document.body'), 'mission jump moves keyboard focus to existing content')
            check(student.evaluate('JSON.stringify(state)') == saved, 'mission navigation never completes tasks or awards XP')
            check(student.locator('.iu-mission-trail a[href="#dashboard"]').count() == 1, 'shared mission trail has one return to the student dashboard')
            for route, selector in [('muscle/mission/1','.mq-panel'),('respiratory/mission/1','.resp-question'),('integumentary/mission/1','.integ-quest'),('circulatory/1','.circ-question'),('excretory/mission/1','.exc-lab')]:
                go(student, route, selector)
                student.wait_for_selector('.iu-mission-navigation')
                saved = student.evaluate('JSON.stringify(state)')
                for button in student.locator('.iu-mission-jumps button').all():
                    button.click()
                check(student.evaluate('JSON.stringify(state)') == saved, route + ' navigation preserves answers, completion and XP')
            go(student, 'mission/1', '[data-skeletal-mission="1"]')
            # Real incorrect work produces evidence; no fabricated response or reward.
            student.evaluate("InneruPreferences.set({language:'en'})")
            wrong = student.evaluate('(checks[1][0].answer+1)%checks[1][0].options.length')
            student.locator(f'[data-skel-question="0"][data-skel-answer="{wrong}"]').click()
            student.evaluate('InneruCloud.flush()')
            student.wait_for_function('InneruCloud.status()==="Saved to your account"')
            go(student, 'dashboard', '.sd-workspace')
            check(student.locator('.sd-hero em').inner_text() == 'أحمد Explorer', 'welcome uses the real stored nickname')
            check(student.locator('.sd-class bdi').inner_text() == '10G5', 'welcome uses the verified school class')
            check(student.locator('.sd-welcome-avatar .iu-avatar-art').evaluate('e=>getComputedStyle(e).backgroundImage') == student.locator('.profile .iu-avatar-art').evaluate('e=>getComputedStyle(e).backgroundImage'), 'welcome reuses the account avatar')
            check(student.locator('[data-sd-missions]').inner_text().replace(' ', '').replace('\n', '') == '0/45', 'overview preserves the 45-mission denominator')
            check(student.locator('[data-sd-xp]').inner_text() == '0 XP' and student.locator('[data-sd-due]').inner_text() == '0', 'wrong work earns no XP and unseen review questions are not due')
            check(student.locator('[data-sd-card=skeletal]').get_attribute('data-sd-system-status')=='In progress','a recorded incorrect attempt is started work even when it earns no XP')
            check(student.locator('.sd-world-card').count() == 6, 'exactly six scientific system cards are presented')
            check(student.locator('.sidebar>nav a[href="#review"]').count() == 1 and student.locator('.sidebar .sidebottom a[href="#review"]').count() == 0, 'Review is moved into mobile-visible navigation without duplication')
            check(not any(path.endswith(('.glb', '.gltf')) or '/assets/three/' in path for path in initial_requests), 'initial dashboard fetches no Three.js or 3D model')
            check(not any(path in ['/content-skeletal.js', '/muscle.js', '/respiratory.js', '/integumentary.js', '/circulatory.js', '/excretory.js', '/circ-activities.js'] for path in initial_requests), 'dashboard fetches no system activity engines')
            check(student.locator('[data-dashboard-next] a.sd-button').get_attribute('href') == student.evaluate('InneruMissionAccess.recommend().href'), 'Continue Learning uses the authoritative recommendation provider')
            check(student.locator('[data-sd-recommended-title]').inner_text() == 'Meet your skeleton', 'recommended mission title agrees with the authorized activity')
            check(student.locator('[data-dashboard-next] .sd-next-objective').inner_text() == student.evaluate('InneruMasteryCatalog.find(e=>e.id==="skeletal-1").objective'), 'Continue Learning reuses the authored objective')
            check(student.locator('[data-sd-priority=incorrect]').count() == 1, 'an actual wrong response creates a review priority')
            check(student.locator('[data-sd-priority=insufficient]').count() == 0, 'wrong evidence is not labelled missing evidence')
            check(student.locator('[data-sd-priority]').count() <= 3, 'learning priorities remain limited to three explainable actions')
            student.locator('[data-sd-priority=incorrect] a').click()
            student.wait_for_selector('[data-mastery]')
            check(student.locator('[data-ms-filter=mission]').input_value() == 'skeletal-1' and student.locator('[data-ms-objective]').count() == 1, 'priority deep link opens the exact existing evidence filter')
            go(student, 'dashboard', '.sd-workspace')
            baseline_progress = f.api(student, 'state').json()['progress']
            for code in ['integumentary', 'skeletal', 'muscle', 'respiratory', 'circ', 'excretory']:
                student.locator(f'[data-sd-world="{code}"]').click()
                check(student.locator('#sd-world-panel').get_attribute('aria-labelledby') == 'sd-tab-' + code, code + ' details use their own labeled mission record')
            student.locator('.sd-system-record>summary').click()
            student.wait_for_function('!document.querySelector("[data-sd-world][aria-expanded=true]")')
            check(student.locator('[data-sd-world][aria-expanded=true]').count() == 0, 'closing details clears expanded control states')
            student.locator('[data-sd-badge="skeletal-mission-1"]').click()
            student.keyboard.press('Escape')
            check(student.locator('[data-sd-badge="skeletal-mission-1"]').evaluate('e=>e===document.activeElement'), 'achievement dialog returns keyboard focus')
            student.locator('.sd-preferences>details>summary').click()
            student.locator('#nickname').fill('Unsubmitted draft')
            student.evaluate("InneruPreferences.set({language:'ar',guided:true})")
            student.wait_for_timeout(400)
            check(student.locator('#nickname').input_value() == 'Unsubmitted draft', 'language and Guided mode retain a live unsaved form')
            gaps = student.evaluate('InneruLocale.coverage(document.querySelector(".sd-workspace"))')
            Path(artifact('dashboard-arabic-coverage.json')).write_text(json.dumps(gaps, ensure_ascii=False, indent=2))
            check(not gaps, 'Arabic dashboard, objectives and priorities have authored coverage: ' + str(gaps))
            student.evaluate("InneruPreferences.set({language:'en',guided:false})")
            student.wait_for_timeout(250)
            check(f.api(student, 'state').json()['progress'] == baseline_progress, 'cards, filters, dialogs and support changes do not write learning or cloud revisions')
            # Stale metadata for exactly identical records is not a genuine conflict.
            baseline_progress=f.api(student,'state').json()['progress']
            student.evaluate('''remote=>{const identity=InneruAccount.identityFields(state),key='inneru-cloud-meta-v1:'+state.authUserId,meta=JSON.parse(localStorage.getItem(key));localStorage.setItem('bodyquest-v1',JSON.stringify({...remote,...identity}));meta.revision=Math.max(0,meta.revision-1);meta.dirty=true;localStorage.setItem(key,JSON.stringify(meta));}''',baseline_progress['snapshot'])
            student.reload();student.wait_for_selector('.sd-progress-home');student.wait_for_function('InneruCloud.status()==="Saved to your account"')
            check(student.locator('[data-cloud-use]').count()==0 and f.api(student,'state').json()['progress']==baseline_progress,'identical records with stale metadata need no choice and write no cloud revision')
            # A genuinely different device copy keeps one explicit, reviewable choice.
            student.evaluate('''()=>{const record=JSON.parse(localStorage.getItem('bodyquest-v1'));record.name='Device-only nickname';localStorage.setItem('bodyquest-v1',JSON.stringify(record));const key='inneru-cloud-meta-v1:'+state.authUserId,meta=JSON.parse(localStorage.getItem(key));meta.revision=Math.max(0,meta.revision-1);meta.dirty=true;localStorage.setItem(key,JSON.stringify(meta));}''')
            student.reload();student.wait_for_function('InneruCloud.status()==="Choose a saved version"');student.wait_for_selector('[data-sd-version-choice]')
            check(student.locator('[data-sd-version-choice]').count()==1 and student.locator('[data-cloud-use]').count()==2,'a genuine record conflict has exactly one decision and the original two options')
            check(student.locator('.sd-hero [data-sd-continue]').count()==0 and student.locator('[data-sd-cloud-attention]').count()==0,'a record conflict suppresses mission continuation without repeating choice actions')
            check(student.locator('[data-sd-sync-slot] [data-cloud-panel]').count()==1,'record choice sits once next to the welcome rather than at the page bottom')
            for language in ['en','ar']:
                student.evaluate('(language)=>InneruPreferences.set({language})',language);student.wait_for_timeout(400)
                for width in [320,1440]:
                    student.set_viewport_size({'width':width,'height':1000});check(student.evaluate('document.documentElement.scrollWidth<=innerWidth'),language+' record choice fits '+str(width)+'px');capture(student,'record-choice-'+language+'-'+str(width),'[data-cloud-panel]')
                if language=='ar':check(not student.evaluate('InneruLocale.coverage(document.querySelector(".sd-workspace"))'),'Arabic record options, comparisons and evidence have no gaps')
            student.evaluate("InneruPreferences.set({language:'en'})");student.locator('[data-cloud-use=remote]').focus();check(student.locator('[data-cloud-use=remote]').evaluate('e=>e===document.activeElement'),'the original cloud choice remains keyboard accessible')
            student.locator('[data-cloud-use=remote]').click();student.wait_for_function('InneruCloud.status()==="Saved to your account"');student.wait_for_selector('.sd-hero [data-sd-continue]')
            check(f.api(student,'state').json()['progress']==baseline_progress,'choosing cloud retains saved evidence, rewards and its cloud revision')
            check(student.evaluate("JSON.parse(localStorage.getItem('inneru-cloud-recovery-v1:'+state.authUserId)).name")== 'Device-only nickname','choosing cloud keeps the different device record in its recovery copy')
            # The other explicit choice still continues the device copy and saves it normally.
            student.evaluate('''()=>{const record=JSON.parse(localStorage.getItem('bodyquest-v1'));record.name='Chosen device nickname';localStorage.setItem('bodyquest-v1',JSON.stringify(record));const key='inneru-cloud-meta-v1:'+state.authUserId,meta=JSON.parse(localStorage.getItem(key));meta.revision=Math.max(0,meta.revision-1);meta.dirty=true;localStorage.setItem(key,JSON.stringify(meta));}''')
            student.reload();student.wait_for_selector('[data-cloud-use=local]');student.locator('[data-cloud-use=local]').click();student.wait_for_function('InneruCloud.status()==="Saved to your account"')
            chosen=f.api(student,'state').json()['progress']['snapshot'];check(chosen['name']=='Chosen device nickname' and chosen['assessment']==baseline_progress['snapshot']['assessment'] and chosen['rewards']==baseline_progress['snapshot']['rewards'],'choosing the device copy saves that choice without altering its evidence or rewards')
            # Another device saving exactly the same record need not interrupt the learner.
            f.sql("update public.student_progress set revision=revision+1 where user_id='"+student.evaluate('state.authUserId')+"'")
            unchanged=f.api(student,'state').json()['progress']
            student.evaluate('''snapshot=>{state={...snapshot,...InneruAccount.identityFields(state)};save();return InneruCloud.flush();}''',unchanged['snapshot'])
            student.wait_for_function('InneruCloud.status()==="Saved to your account"')
            check(student.locator('[data-cloud-use]').count()==0 and f.api(student,'state').json()['progress']==unchanged,'an identical remote save causing HTTP 409 updates only local revision metadata without a spurious choice or extra save')
            # Produce one genuinely due item through the existing review activity.
            go(student, 'review', '#review-start')
            student.locator('#review-start').click()
            correct = student.evaluate('''()=>{const id=document.querySelector('[data-review-id]').dataset.reviewId,q=InneruRecall.items().find(q=>q.id===id);return q.options[q.answer];}''')
            choices = student.locator('[data-review-choice]')
            for choice in choices.all():
                if choice.locator('span').inner_text() != correct:
                    choice.click()
                    break
            student.locator('[data-rs-check]').click()
            student.evaluate('InneruCloud.flush()')
            student.wait_for_function('InneruCloud.status()==="Saved to your account"')
            go(student, 'dashboard', '.sd-workspace')
            check(student.locator('[data-sd-due]').inner_text() == '1' and student.locator('[data-sd-priority=due]').count() == 1, 'a real missed review question appears as due practice')
            # Teacher locks and transport failure must change the recommendation, not progression.
            for system in ['integumentary', 'skeletal', 'muscle', 'respiratory', 'circ', 'excretory']:
                response = f.api(teacher, 'set-mission-control', {'classCode':'10G5','system':system,'number':0,'unlocked':False})
                assert response.ok
            student.evaluate('InneruMissionAccess.refresh()')
            check(student.locator('.sd-hero [data-sd-continue]').get_attribute('href') == '#home', 'all locked missions produce an exploration fallback')
            check('unlock' in student.locator('.sd-hero [data-sd-pathway-status]').inner_text(), 'locked fallback explains teacher availability')
            student.reload();student.wait_for_selector('.sd-workspace')
            student.wait_for_function('InneruMissionAccess.recommend().status==="locked"')
            check(student.locator('[data-dashboard-next] a.sd-button').get_attribute('href') == '#home', 'refresh preserves authoritative locked fallback')
            denied = f.api(student, 'set-mission-control', {'classCode':'10G5','system':'skeletal','number':0,'unlocked':True})
            check(denied.status == 403, 'dashboard changes cannot give students teacher controls')
            student.route('**/api/learning?action=mission-catalog', lambda route: route.abort())
            student.evaluate('InneruMissionAccess.refresh().catch(()=>{})')
            check('Reconnect' in student.locator('.sd-hero [data-sd-pathway-status]').inner_text(), 'failed access checks show connection guidance')
            check(student.locator('[data-dashboard-next] a.sd-button').get_attribute('href') == '#home', 'failed access check never invents an open lesson')
            student.unroute('**/api/learning?action=mission-catalog')
            f.unlock(teacher)
            student.evaluate('InneruMissionAccess.refresh()')
            student.wait_for_function('InneruMissionAccess.recommend().status==="ready"')
            check(student.locator('[data-dashboard-next] a.sd-button').get_attribute('href') == '#mission/1', 'reconnection restores the server-authorized mission')
            student.context.set_offline(True)
            student.locator('[data-sd-world="respiratory"]').click()
            check(student.locator('.sd-system-record').get_attribute('open') is not None, 'already loaded mission records remain inspectable offline')
            student.context.set_offline(False)
            check(student.evaluate('state.xp') == 0, 'offline inspection never awards points')
            check(student.locator('script[src*="student-dashboard.js"]').count() == 1, 'returning to the dashboard reuses its module')
            # Explicit historical local fixture: counts are known, assessment evidence is absent.
            legacy, legacy_user = f.account(browser, 'phase2-historical@example.com', 'Historical local', '10G5')
            go(legacy, 'dashboard', '.sd-workspace')
            raw = f.api(legacy, 'state').json()['progress']['snapshot']
            raw['done'] = [1]
            encoded = json.dumps(raw).replace("'", "''")
            f.sql("update public.student_progress set snapshot='" + encoded + "'::jsonb,revision=revision+1 where user_id='" + legacy_user['id'] + "'")
            legacy.reload()
            legacy.wait_for_function('state.done.includes(1)')
            legacy.wait_for_selector('[data-sd-priority=insufficient]')
            check(legacy.locator('[data-sd-priority=insufficient]').count() == 1 and legacy.locator('[data-sd-priority=incorrect]').count() == 0, 'historical completion without answers is missing evidence, not an incorrect result')
            # Pure model accounting excludes investigations/daily/capstone from the denominator.
            total = legacy.evaluate('''()=>{const s={done:[1,2,3,4,5,6,7,8],rewards:['detective2-touch','daily-2026-11-05'],xp:0,muscle:{done:[1,2,3,4,5,6,7,8]},capstone:{done:true}};for(const key of ['integumentary','respiratory','circ','excretory'])s[key]={done:Array.from({length:key==='circ'?7:6},(_,i)=>i+1),mastery:true};const p=InneruLearning.snapshot(s);return {completed:p.completed,total:p.total,regular:p.missions,keys:p.keys,xp:p.xp};}''')
            check(total == {'completed':45,'total':45,'regular':39,'keys':6,'xp':0}, 'existing progress model counts 39 missions plus six finals and never infers XP')
            full = json.loads(json.dumps(raw))
            full['done'] = list(range(1, 9))
            full['muscle'] = {'done': list(range(1, 9))}
            for system in ['integumentary', 'respiratory', 'circ', 'excretory']:
                full[system] = {'done': list(range(1, 8 if system == 'circ' else 7)), 'mastery': True}
            full['capstone'] = {'done': True}
            full['rewards'] = ['detective2-touch', 'daily-2026-11-05']
            full['xp'] = 0
            encoded = json.dumps(full).replace("'", "''")
            f.sql("update public.student_progress set snapshot='" + encoded + "'::jsonb,revision=revision+1 where user_id='" + legacy_user['id'] + "'")
            legacy.reload()
            legacy.wait_for_function('InneruLearning.snapshot().completed===45')
            legacy.wait_for_selector('.sd-hero a[href="#review"]')
            check(legacy.locator('[data-sd-missions]').inner_text().replace(' ', '').replace('\n', '') == '45/45', 'completed dashboard includes six finals but excludes detective, daily and capstone')
            check(legacy.locator('[data-sd-xp]').inner_text() == '0 XP', 'completed historical dashboard never fabricates earned points')
            check(legacy.locator('[data-sd-system-status="Complete"]').count()==6 and legacy.locator('[data-sd-evidence-status=secure]').count()==0,'all systems can be complete while missing assessment records still cannot claim Secure')
            capture(legacy,'completed-dashboard','.sd-workspace')
        check(not errors, 'no uncaught browser errors: ' + str(errors))
        browser.close()
    print(str(checks) + ' student experience checks passed.', flush=True)
finally:
    f.close()
