/* One presentation-only opening. Existing lessons own every task, answer and save. */
(() => {
  'use strict';
  const source = node => window.InneruLocale?.source(node) || node?.textContent || '';
  const normal = text => text.replace(/\s+/g, ' ').trim();
  const headings = '.skel-mission-heading,.mq-mission-heading,.resp-mission-header,.circ-mission-head,.exc-mission-header,.quest-finale-hero';
  const actions = {
    skeletal: ['Match each region to its skeletal division','Match each bone shape to its example','Find seven structures, then choose the spongy-bone model','Match each joint to its movement','Predict how remodeling changes bone mass','Order the stages of fracture repair','Match each case to its anatomical evidence','Use the ankle evidence to explain the injury'],
    integumentary: ['Match each skin tissue to its structure','Build the skin layers from outside inward','Choose the route for each skin structure','Predict the skin response to each environment','Select the structure that responds to each challenge','Order wound repair, then classify burn depth'],
    respiratory: ['Identify what moves in each breathing process','Order the air pathway, then choose its defense','Choose the direction of each gas at the alveolus','Predict how diaphragm movement changes airflow','Choose both gas routes at each exchange site','Match each condition to its affected structure'],
    circ: ['Inspect and compare the three vessel types','Predict oxygen movement between blood and tissue','Select the chambers in blood-flow order','Choose the next stop in the blood pathway','Match each blood component to its job','Choose a compatible donor for each recipient','Measure a pulse and examine arterial narrowing'],
    excretory: ['Sort each waste into its exit organ','Select the kidney structure that matches the clue','Sort substances by whether they enter the capsule','Sort substances by return to blood or removal in urine','Predict the water response, then test the ADH setting','Use each case’s evidence to identify the mechanism']
  };
  const muscleActions = {scanner:'Identify the muscle tissue from its features',zoom:'Explore each level of muscle organization',build:'Label the sarcomere structures',energy:'Compare contraction without and with ATP',stimulate:'Change the nerve signal and observe contraction',arm:'Move the arm and compare the opposing muscles',slide:'Move the slider and compare filament overlap',target:'Move the arm to full extension',contract:'Move the sarcomere to full contraction'};
  let taskObserver;

  function task(root, action, check=false) {
    if (!root || root.querySelector(':scope > .iu-task-action,:scope > .quest-check-content > .iu-task-action')) return false;
    const box = document.createElement('div');
    box.className = 'iu-task-action' + (check === true ? ' is-check' : '');
    const kind = document.createElement('span');
    kind.className = 'iu-task-kind';
    kind.textContent = check === 'optional' ? 'Optional challenge' : check ? 'Required check' : 'Required activity';
    const title = document.createElement('div');
    title.setAttribute('role', 'heading');
    title.setAttribute('aria-level', '3');
    title.dataset.missionTask = '';
    if (check !== true) title.dataset.supportInstruction = '';
    else {
      const prompt = root.querySelector('h3,h4,:scope > p');
      if (prompt) prompt.dataset.supportInstruction = '';
    }
    title.textContent = action;
    box.append(kind, title);
    // Original h2/h3 prompts stay intact, including the headings used to bind
    // older activity submissions to their evidence records.
    const context = root.querySelector(':scope > .mq-panel-head,:scope > .quest-heading,:scope > .ra-lab-header,:scope > .exc-challenge-heading,:scope > .skel-lab-heading');
    const cargo = root.id === 'exc-main-lab' && root.querySelector('.exc-chips');
    const questionColumn = root.querySelector(':scope > .quest-check-content');
    if (questionColumn) questionColumn.prepend(box); else if (cargo) cargo.before(box); else if (context) context.after(box); else root.prepend(box);
    root.classList.add(check === 'optional' ? 'iu-optional-task' : 'iu-required-task');
    return true;
  }

  function optional(node, label, after) {
    if (!node || node.parentElement.matches('.iu-optional')) return;
    const details = disclosure(label, 'iu-optional');
    node.before(details);
    details.append(node);
    if (after) after.after(details);
  }

  function clarify(main, mission) {
    let changed = false;
    const action = actions[mission.world.id]?.[mission.number-1];
    const lab = main.querySelector('.skel-lab-section,.integ-quest,.resp-activity-game,#circ-lab,#exc-main-lab');
    if (action) changed = task(lab, action) || changed;
    main.querySelectorAll('.mq-panel').forEach(panel => {
      if (!panel.querySelector('.mq-status')) return; // Reference anatomy is not an assessed task.
      const suffix = panel.id.replace(/^m\d+-/, '');
      const action = muscleActions[suffix] || (panel.querySelector('[data-sort-check]') ? 'Match each card to its correct group' : panel.querySelector('[data-sequence-check]') ? 'Order the stages using the arrow controls' : panel.querySelector('[data-compare]') ? 'Explain your answer using the evidence' : panel.querySelector('[data-option]') ? 'Select one answer to the question below' : null);
      if (action) changed = task(panel, action, suffix.startsWith('check-')) || changed;
    });
    main.querySelectorAll('.skel-check,.resp-question,.circ-question,.ra-prediction').forEach(question => {
      changed = task(question, question.querySelector('textarea') ? 'Explain your answer using the evidence' : 'Select one answer to the question below', true) || changed;
    });
    for (const [selector, action] of [['.exc-ph-task','Select the response that helps regulate blood pH'],['#exc-weekly','Calculate the urine volume for seven days'],['#exc-audit','Calculate the water remaining in urine'],['.exc-treatment-question','Select the treatment that uses an external filter']]) changed = task(main.querySelector(selector), action, 'optional') || changed;
    main.querySelectorAll('.ra-breath-goals').forEach(bonus => optional(bonus, 'Optional challenge · explore further'));
    if (changed) window.InneruLocale?.refresh();
  }

  function activityHierarchy(main, mission) {
    main.classList.add('iu-mission-canvas');
    main.querySelectorAll('.exc-bonus').forEach(bonus => optional(bonus, 'Optional challenge · explore further', main.querySelector('.exc-checks')));
    main.querySelectorAll('.circ-route-quest').forEach(map => optional(map, 'Learn more · follow the complete circulation route'));
    main.querySelectorAll('.exc-lab .ea-study').forEach(study => {
      if ([1,3,4,5].includes(Number(study.dataset.eaStudy))) optional(study, 'Learn more · inspect the anatomy');
    });
    clarify(main, mission);
    taskObserver?.disconnect();
    let queued = false;
    taskObserver = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; if (main.isConnected) clarify(main, mission); });
    });
    taskObserver.observe(main, {childList:true,subtree:true});
  }

  function move(node, destination) {
    // Read-aloud controls may already have been attached to an original paragraph.
    const reader = node.nextElementSibling?.matches('.support-read-controls') ? node.nextElementSibling : null;
    destination.append(node);
    if (reader) destination.append(reader);
  }

  function disclosure(label, className) {
    const details = document.createElement('details');
    details.className = className;
    const summary = document.createElement('summary');
    summary.textContent = label;
    details.append(summary);
    return details;
  }

  function focusTarget(target) {
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        if (parent.tagName === 'DETAILS') parent.open = true;
      }
      if (!target.hasAttribute('tabindex') && target.tabIndex < 0) target.tabIndex = -1;
      target.focus({preventScroll: true});
      target.scrollIntoView({block: 'start', behavior: motionReduced() ? 'instant' : 'smooth'});
  }

  function jump(label, target) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = () => focusTarget(target);
    return button;
  }

  function mount() {
    taskObserver?.disconnect();
    const main = document.querySelector('main.main');
    if (!main || main.querySelector('.iu-mission-access-notice,[data-route-loading],[data-route-retry],[data-mission-objective]')) return;
    const mission = window.InneruMissionAccess?.parse();
    const capstone = /^(final|capstone)$/.test(location.hash.slice(1).split('?')[0]);
    if (!mission && !capstone) return;
    const intro = main.querySelector(mission ? headings : '.cap-hero');
    const title = intro?.querySelector('h1');
    if (!title) return; // Locked routes and certificates keep their own presentation.
    const entry = mission && InneruMasteryCatalog.find(e => e.system === mission.world.id && e.number === mission.number);
    if (mission && !entry) return;
    const preview = main.querySelector('.iu-teacher-preview-bar');
    const teacher = window.InneruAccess?.teacher(InneruAccess.user);
    const originalParagraphs = [...intro.querySelectorAll('p')].filter(p => !p.matches('[role=status],[aria-live]'));
    const objectiveText = entry?.objective || source(originalParagraphs[0]);
    if (!objectiveText) return;

    const opening = document.createElement('section');
    opening.className = 'iu-mission-opening iu-mission-navigation';
    opening.dataset.missionObjective = entry?.id || 'capstone';
    title.id ||= 'iu-mission-title';
    opening.setAttribute('aria-labelledby', title.id);
    intro.before(opening);

    const trail = document.createElement('nav');
    trail.className = 'iu-mission-trail';
    trail.setAttribute('aria-label', 'Current lesson');
    const dashboard = document.createElement('a');
    dashboard.href = teacher ? '#teacher' : '#dashboard';
    dashboard.textContent = teacher ? 'Teacher Dashboard' : 'Student Dashboard';
    const back = intro.querySelector('a.textlink') || (opening.previousElementSibling?.matches('a.textlink') ? opening.previousElementSibling : null);
    trail.append(dashboard);
    if (back) trail.append(back);
    else if (mission) {
      const system = document.createElement('a');
      system.href = mission.world.route + (teacher ? '?preview=1' : '');
      system.textContent = mission.world.name + ' System';
      trail.append(system);
    }
    if (mission) {
      const position = document.createElement('bdi');
      position.dir = 'ltr';
      position.textContent = mission.number + ' / ' + (mission.world.titles.length + 1);
      trail.append(position);
    }
    opening.append(trail);

    const briefing = disclosure('Mission briefing', 'iu-mission-briefing');
    const objective = document.createElement('div');
    objective.className = 'iu-opening-objective';
    objective.dataset.iuLocale = 'mastery';
    objective.dataset.supportInstruction = '';
    const label = document.createElement('strong');
    label.textContent = 'Objective';
    let paragraph = originalParagraphs.find(p => normal(source(p)) === normal(objectiveText));
    if (!paragraph) { paragraph = document.createElement('p'); paragraph.textContent = objectiveText; }
    paragraph.removeAttribute('data-support-instruction');
    paragraph.dataset.supportReader = '1';
    if (paragraph.nextElementSibling?.matches('.support-read-controls')) paragraph.nextElementSibling.remove();
    objective.append(label);
    move(paragraph, objective);
    for (const p of originalParagraphs) if (p !== paragraph) move(p, briefing);
    intro.classList.add('iu-opening-heading');
    opening.append(intro, objective);

    let status;
    if (preview) {
      preview.classList.add('iu-opening-preview');
      status = preview.querySelector('p');
      status.dataset.missionPosition = '';
      move(preview, opening);
    } else {
      status = document.createElement('p');
      status.className = 'iu-mission-position';
      status.dataset.missionPosition = '';
      status.dataset.supportReader = '1';
      status.setAttribute('role', 'status');
      objective.append(status);
    }
    const update = () => {
      if (!opening.isConnected || preview) return;
      const world = mission && InneruLearning.snapshot().worlds.find(w => w.id === mission.world.id);
      const complete = mission ? entry.final ? world.key : world.done.includes(mission.number) : state.capstone?.done;
      const text = complete ? 'Completed in your saved record' : 'Not completed yet · finish the required lesson tasks.';
      if (source(status) !== text) status.textContent = text;
    };
    opening.updateMissionNavigation = update;
    update();

    // Reuse native activity rails (including their original handlers and task order).
    const rail = main.querySelector('.skel-discovery-rail,.quest-stage-rail,.exc-phase-nav');
    const actions = rail || document.createElement('nav');
    actions.classList.add('iu-mission-jumps');
    if (rail) actions.addEventListener('click', event => {
      const button = event.target.closest('button');
      const id = button?.dataset.skelScroll || button?.dataset.scrollTarget || button?.dataset.jump;
      const target = id && document.getElementById(id);
      if (target) focusTarget(target);
    });
    if (!rail) {
      actions.setAttribute('aria-label', 'Mission sections');
      const targets = [
        ['Explore the activity', '#skeletal-lab-body,.resp-activity-game,.integ-quest,#circ-lab,.exc-lab,.mq-panel,.cap-station'],
        ['Check your understanding', '.quizquestion,[data-skel-question],.resp-question,[data-question],.circ-question,[data-exc-question],[data-tissue-answer]'],
        ['Open the written response', 'textarea']
      ];
      const used = new Set();
      for (const [label, selector] of targets) {
        const target = main.querySelector(selector);
        if (target && !used.has(target)) { used.add(target); actions.append(jump(label, target)); }
      }
    }
    if (actions.childElementCount) opening.append(actions);

    const evidence = document.createElement('p');
    evidence.dataset.iuLocale = 'mastery';
    evidence.textContent = 'Your lesson checks and submitted explanations provide evidence. Completion and mastery are shown separately.';
    briefing.append(evidence);
    opening.append(briefing);

    const pathway = disclosure('Mission map and access', 'iu-mission-pathway');
    main.querySelectorAll('.skel-mode-bar,.resp-preview-bar,.integ-preview-bar,.exc-mode-banner,.skel-mission-nav,.quest-mission-nav,.resp-gallery-nav').forEach(node => move(node, pathway));
    if (pathway.childElementCount > 1) opening.append(pathway);
    if (mission) activityHierarchy(main, mission);
    window.InneruLocale?.refresh();
  }

  document.addEventListener('inneru-route-ready', mount);
  document.addEventListener('inneru-progress', () => document.querySelector('[data-mission-objective]')?.updateMissionNavigation?.());
})();
