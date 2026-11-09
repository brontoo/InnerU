/* One presentation-only opening. Existing lessons own every task, answer and save. */
(() => {
  'use strict';
  const source = node => window.InneruLocale?.source(node) || node?.textContent || '';
  const normal = text => text.replace(/\s+/g, ' ').trim();
  const headings = '.skel-mission-heading,.mq-mission-heading,.resp-mission-header,.circ-mission-head,.exc-mission-header,.quest-finale-hero';

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
    window.InneruLocale?.refresh();
  }

  document.addEventListener('inneru-route-ready', mount);
  document.addEventListener('inneru-progress', () => document.querySelector('[data-mission-objective]')?.updateMissionNavigation?.());
})();
