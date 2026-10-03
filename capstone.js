/* ============================================================================
   WORLD 07 · Capstone — "Keep the body alive"
   ----------------------------------------------------------------------------
   The final challenge that the home screen has always advertised but never had.
   It is unlocked only when all six System Keys are earned, and it asks the
   student to APPLY all six worlds to one scenario instead of recalling facts:

       A Grade 10 student runs 5 km on a hot day. Six decisions follow, one per
       body system, and then one written synthesis.

   Like every other world this file is an outer wrapper: it never edits the core,
   it wraps route/home/dashboard/badges after them and re-decorates what they
   rendered. It is loaded last, so its decorations run last.
   ========================================================================== */
(() => {
  'use strict';

  const XP_STATION = 15;
  const XP_SYNTHESIS = 30;
  const REQUIRED_KEYS = 6;

  /* ---------------------------------------------------------------- the scenario */
  const stations = [
    {
      world: 'WORLD 04 · OXYGEN', system: 'Respiratory System', link: '#respiratory', linkLabel: 'the Oxygen Mission',
      situation: 'Two minutes into the run her breathing is faster and deeper.',
      prompt: 'What does breathing more deeply actually change?',
      options: [
        'More air moves in and out, so more oxygen can diffuse into the blood and more carbon dioxide leaves it.',
        'The air she breathes in contains a higher percentage of oxygen than air at rest.',
        'Her alveoli grow larger and hold extra air permanently.',
        'Cellular respiration slows down, so the muscles need less oxygen.'
      ],
      answer: 0,
      why: 'Ventilation moves air, it does not change the air\u2019s composition. Faster, deeper breathing raises the volume exchanged each minute, which steepens the diffusion gradient at the alveoli. Alveoli do not grow during a run, and cellular respiration speeds up rather than slowing down.'
    },
    {
      world: 'WORLD 05 · TRANSPORT', system: 'Circulatory System', link: '#circulatory', linkLabel: 'the Transport Network',
      situation: 'Her heart rate rises, and blood is redirected away from the digestive system.',
      prompt: 'Which change best explains more blood reaching the working leg muscles?',
      options: [
        'Arterioles in the muscles widen while those supplying the digestive organs narrow.',
        'Veins squeeze blood forward on their own, like a second heart.',
        'The heart manufactures extra blood for the muscles.',
        'Capillaries contract to push blood along faster.'
      ],
      answer: 0,
      why: 'Blood is redirected, not created. The heart\u2019s output rises and the arterioles that supply working muscle dilate while others constrict. Veins return blood with help from skeletal muscle and valves \u2014 they are not a pump \u2014 and capillaries are exchange vessels, not pumps.'
    },
    {
      world: 'WORLD 03 · POWER', system: 'Muscular System', link: '#muscle', linkLabel: 'the Power pathway',
      situation: 'Near the end of the run her legs feel heavy and she has to slow down.',
      prompt: 'Which explanation fits best?',
      options: [
        'Anaerobic respiration supplies extra ATP, but lactate builds up, so that rate cannot continue.',
        'Her muscles have permanently run out of oxygen.',
        'Her muscles can no longer use ATP at all.',
        'Her bones have stopped acting as levers.'
      ],
      answer: 0,
      why: 'When oxygen supply cannot keep up, muscle also respires anaerobically: it still produces ATP, but lactate accumulates and fatigue follows. Oxygen supply recovers after the run, and muscle keeps using ATP throughout \u2014 that is exactly why the effort can continue at a lower intensity.'
    },
    {
      world: 'WORLD 01 · BODY SHIELD', system: 'Integumentary System', link: '#integumentary', linkLabel: 'the Living Shield',
      situation: 'She is sweating heavily in the heat.',
      prompt: 'How does sweating help, and what does it cost the body?',
      options: [
        'Evaporating sweat removes heat from the skin, and water and salts are lost with it.',
        'Sweat forms a layer that blocks heat from reaching the body.',
        'Sweat cools the blood directly inside the blood vessels.',
        'Sweating means the kidneys no longer have to work.'
      ],
      answer: 0,
      why: 'Cooling comes from evaporation, which takes heat from the skin surface. Sweat is mainly water with dissolved salts, so heavy sweating costs both water and salt. The kidneys still regulate water and salts \u2014 sweating changes their workload, it does not remove it.'
    },
    {
      world: 'WORLD 02 · FRAMEWORK', system: 'Skeletal System', link: '#world', linkLabel: 'the Framework',
      situation: 'She lands badly and turns her ankle.',
      prompt: 'Which structure is most likely to be overstretched?',
      options: [
        'A ligament, which connects bone to bone at the joint.',
        'A tendon, which connects muscle to bone.',
        'The periosteum that covers the bone.',
        'The marrow inside the bone.'
      ],
      answer: 0,
      why: 'A sprain is an overstretched or torn ligament \u2014 the tissue that holds bone to bone. Tendons attach muscle to bone, and the periosteum and marrow sit within the bone itself.'
    },
    {
      world: 'WORLD 06 · FILTER', system: 'Excretory System', link: '#excretory', linkLabel: 'the Balance Mission',
      situation: 'After the run she passes a small amount of concentrated urine.',
      prompt: 'What is her body doing?',
      options: [
        'Releasing ADH so more water is reabsorbed from the collecting duct.',
        'Filtering less blood so that no waste is removed.',
        'Producing extra water inside the bladder.',
        'Shutting the glomerulus down completely.'
      ],
      answer: 0,
      why: 'Water was lost as sweat, so the body conserves water: ADH increases water reabsorption, so the urine becomes smaller in volume and more concentrated. Filtration continues \u2014 what changes is how much water is returned to the blood.'
    }
  ];

  /* The correct option is not always first: reuse the site-wide mixer. */
  if (typeof mixQ === 'function') {
    stations.forEach((s, i) => {
      const mixed = mixQ(['stem', s.options, s.answer, 'why']);
      stations[i].options = mixed[1];
      stations[i].answer = mixed[2];
    });
  }

  const RUBRIC = [
    'I linked muscle contraction to a higher demand for energy (ATP).',
    'I explained how breathing brings oxygen in and removes carbon dioxide.',
    'I explained how blood transports oxygen and is redirected to the muscles.',
    'I included heat loss through sweat, or water conservation through ADH.',
    'I connected at least one support system (bones, joints or ligaments).'
  ];

  const MODEL_ANSWER =
    'During the run the leg muscles contract more often, so they need more ATP and cellular respiration increases. ' +
    'That raises oxygen demand and carbon dioxide production, so the respiratory system increases ventilation while the circulatory system raises heart rate, ' +
    'redirects blood to the working muscles and exchanges gases in the capillaries. Heat released by the muscles is lost when sweat evaporates from the skin, ' +
    'and because water is lost that way the kidneys release ADH and reabsorb more water, producing concentrated urine. ' +
    'The skeletal system supplies the levers, joints and ligaments that make the movement possible and stabilise the ankle.';

  /* ---------------------------------------------------------------- state */
  function data() {
    if (!state.capstone || typeof state.capstone !== 'object') state.capstone = {};
    const c = state.capstone;
    c.stations = c.stations && typeof c.stations === 'object' ? c.stations : {};
    c.response = typeof c.response === 'string' ? c.response : '';
    c.rubric = Array.isArray(c.rubric) ? c.rubric : [];
    c.tries = c.tries && typeof c.tries === 'object' ? c.tries : {};
    c.done = !!c.done;
    c.date = typeof c.date === 'string' ? c.date : '';
    return c;
  }
  const stationsDone = () => { const c = data(); return stations.filter((_, i) => c.stations['s' + i]).length; };
  const keys = () => (typeof keysEarned === 'function' ? keysEarned() : 0);

  /* ---------------------------------------------------------------- the page */
  function locked() {
    const missing = REQUIRED_KEYS - keys();
    const worlds = [
      ['Integumentary System', '#integumentary'], ['Skeletal System', '#world'], ['Muscular System', '#muscle'],
      ['Respiratory System', '#respiratory'], ['Circulatory System', '#circulatory'], ['Excretory System', '#excretory']
    ];
    const earned = {
      '#integumentary': !!(state.integumentary && state.integumentary.mastery),
      '#world': state.done.includes(8),
      '#muscle': !!(state.muscle && (state.muscle.done || []).includes(8)),
      '#respiratory': !!(state.respiratory && state.respiratory.mastery),
      '#circulatory': !!(state.circ && state.circ.mastery),
      '#excretory': !!(state.excretory && state.excretory.mastery)
    };
    layout(`<div class="cap-world"><a class="textlink" href="#home">\u2190 Body map</a>
    <div class="cap-locked panel"><div class="eyebrow">FINAL MISSION</div><h1>Keep the body alive</h1>
    <p>One student. One hot day. Six systems that must work together.</p>
    <p class="note">You need all <b>six System Keys</b> before this challenge opens. You have <b>${keys()}/6</b> \u2014 ${missing} to go.</p>
    <div class="grid three cap-keygrid">${worlds.map(([name, href]) => `<a class="cap-key ${earned[href] ? 'is-earned' : ''}" href="${href}"><span>${earned[href] ? '\u2713' : '\u25cb'}</span><b>${name}</b><small>${earned[href] ? 'Key earned' : 'Key still locked'}</small></a>`).join('')}</div>
    <a class="btn" href="#home">Back to the worlds \u2192</a></div></div>`, 'dashboard');
  }

  function stationCard(s, i) {
    const c = data(), done = !!c.stations['s' + i];
    return `<section class="panel cap-station ${done ? 'is-done' : ''}" data-cap-station="${i}">
      <div class="cap-station-head"><span class="eyebrow">${s.world}</span><span class="cap-chip">${done ? '\u2713 COMPLETE' : s.system}</span></div>
      <p class="cap-situation">${esc(s.situation)}</p>
      <h3>${esc(s.prompt)}</h3>
      <div class="cap-options">${s.options.map((o, j) => `<button type="button" class="choice" data-cap-choice="${j}" ${done ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      <div class="cap-feedback" role="status">${done ? '\u2713 ' + esc(s.why) : ''}</div>
      <a class="textlink cap-link" href="${s.link}">Revise this system in ${s.linkLabel} \u2192</a>
    </section>`;
  }

  function synthesisCard() {
    const c = data();
    const ready = stationsDone() === stations.length && c.response.trim().length >= 80 && c.rubric.length >= 3;
    return `<section class="panel cap-synthesis">
      <div class="eyebrow">SYNTHESIS</div>
      <h2>Now tell the whole story.</h2>
      <p>In three to five sentences, explain how at least <b>three</b> of these systems worked together during the run. Write it in your own words \u2014 this part is for you and your teacher, it is not scored automatically.</p>
      <label for="cap-response">Your explanation</label>
      <textarea class="input" id="cap-response" rows="6" ${c.done ? 'disabled' : ''} placeholder="The Muscular System\u2026 the Respiratory System\u2026 the Circulatory System\u2026">${esc(c.response)}</textarea>
      <p class="note" id="cap-count">${c.response.trim().length} characters</p>
      <button class="btn secondary" id="cap-review">Compare with a model answer</button>
      <div id="cap-model"></div>
      <div id="cap-rubric"></div>
      <div class="cap-actions"><button class="btn" id="cap-finish" ${ready ? '' : 'disabled'}>${c.done ? 'Open my certificate' : 'Finish the challenge'}</button></div>
    </section>`;
  }

  function certificate() {
    const c = data();
    const date = c.date || new Date().toISOString().slice(0, 10);
    return `<section class="panel cap-certificate" id="cap-certificate">
      <div class="cap-cert-frame">
        <span class="eyebrow">INNERU \u00b7 UM AL-EMARAT SCHOOL</span>
        <h1>Keep the body alive</h1>
        <p class="cap-cert-lead">This certifies that</p>
        <p class="cap-cert-name">${esc(state.name)}</p>
        <p class="cap-cert-lead">completed the final challenge on ${esc(date)}, connecting all six body systems in one scenario.</p>
        <div class="cap-cert-stats">
          <span><b>6/6</b> System Keys</span><span><b>${stations.length}/6</b> decisions</span><span><b>${state.xp}</b> XP</span>
        </div>
        <p class="note">Grade 10 Science \u00b7 InnerU \u2014 Explore What\u2019s Inside</p>
      </div>
      <div class="cap-actions"><button class="btn secondary" id="cap-print">Print or save as PDF</button><a class="btn line" href="#home">Back to the body map</a></div>
    </section>`;
  }

  function landing() {
    const c = data();
    if (keys() < REQUIRED_KEYS) return locked();
    const done = stationsDone();
    layout(`<div class="cap-world"><a class="textlink" href="#home">\u2190 Body map</a>
      <div class="cap-hero"><div><div class="eyebrow">FINAL MISSION \u00b7 SIX SYSTEMS</div><h1>Keep the body alive</h1>
      <p>A Grade 10 student starts a 5 km run on a hot day. Every system in InnerU is about to be tested at once \u2014 make six decisions, then explain the whole story in your own words.</p>
      <div class="cap-meter"><span>${done}/6 decisions</span><span class="bar"><i style="width:${Math.round(done / stations.length * 100)}%"></i></span></div></div>
      <div class="cap-hero-art" aria-hidden="true"><span>\u2764</span><span>\u25c8</span><span>\u25c7</span></div></div>
      ${done === stations.length ? '' : '<p class="note">Every decision can be retried. A first wrong answer gives you a nudge, not the solution.</p>'}
      ${stations.map(stationCard).join('')}
      ${synthesisCard()}
      ${c.done ? certificate() : ''}</div>`, 'dashboard');
    wire();
  }

  /* ---------------------------------------------------------------- behaviour */
  function wire() {
    document.querySelectorAll('[data-cap-station]').forEach(card => {
      const i = +card.dataset.capStation, c = data();
      card.querySelectorAll('[data-cap-choice]').forEach(btn => {
        btn.onclick = () => {
          const good = +btn.dataset.capChoice === stations[i].answer;
          const box = card.querySelector('.cap-feedback');
          if (good) {
            c.stations['s' + i] = true;
            if (!state.rewards.includes('cap-station-' + i)) { state.rewards.push('cap-station-' + i); state.xp += XP_STATION; }
            save();
            box.innerHTML = '\u2713 ' + esc(stations[i].why);
            card.classList.add('is-done');
            card.querySelectorAll('[data-cap-choice]').forEach(b => { b.disabled = true; if (+b.dataset.capChoice === stations[i].answer) b.classList.add('resp-correct'); });
            toast('+' + XP_STATION + ' XP \u00b7 ' + stations[i].system + ' secured');
            if (stationsDone() === stations.length) toast('All six decisions complete \u2014 now explain the story');
            landing();
          } else {
            c.tries['s' + i] = (c.tries['s' + i] || 0) + 1;
            save();
            box.innerHTML = c.tries['s' + i] < 2
              ? 'Not yet. Look again at the situation, then choose.'
              : 'Look again. ' + esc(stations[i].why);
            btn.classList.add('resp-wrong');
          }
        };
      });
    });

    const response = document.getElementById('cap-response');
    if (response) {
      response.oninput = () => {
        const c = data();
        c.response = response.value;
        const counter = document.getElementById('cap-count');
        if (counter) counter.textContent = c.response.trim().length + ' characters';
        save();
        updateFinishState();
      };
    }

    const review = document.getElementById('cap-review');
    if (review) review.onclick = () => {
      const c = data();
      document.getElementById('cap-model').innerHTML = `<div class="feedback info"><b>A model answer</b><p>${MODEL_ANSWER}</p></div>`;
      document.getElementById('cap-rubric').innerHTML = `<fieldset class="cap-rubric"><legend>Check your own explanation against the model</legend>
        ${RUBRIC.map((r, i) => `<label><input type="checkbox" data-cap-rubric="${i}" ${c.rubric.includes(i) ? 'checked' : ''}> ${esc(r)}</label>`).join('')}</fieldset>`;
      document.querySelectorAll('[data-cap-rubric]').forEach(box => {
        box.onchange = () => {
          const c2 = data();
          const i = +box.dataset.capRubric;
          c2.rubric = box.checked ? [...new Set([...c2.rubric, i])] : c2.rubric.filter(x => x !== i);
          save();
          updateFinishState();
        };
      });
      updateFinishState();
    };

    const finish = document.getElementById('cap-finish');
    if (finish) finish.onclick = () => {
      const c = data();
      if (!c.done) {
        c.done = true;
        c.date = new Date().toISOString().slice(0, 10);
        if (!state.rewards.includes('capstone')) { state.rewards.push('capstone'); state.xp += XP_SYNTHESIS; }
        save();
        toast('+' + XP_SYNTHESIS + ' XP \u00b7 Final challenge complete');
      }
      landing();
      document.getElementById('cap-certificate')?.scrollIntoView({ behavior: motionReduced() ? 'instant' : 'smooth', block: 'start' });
    };

    const print = document.getElementById('cap-print');
    if (print) print.onclick = () => window.print();
  }

  function updateFinishState() {
    const btn = document.getElementById('cap-finish');
    if (!btn || data().done) return;
    const c = data();
    const ready = stationsDone() === stations.length && c.response.trim().length >= 80 && c.rubric.length >= 3;
    btn.disabled = !ready;
    btn.title = ready ? '' : (stationsDone() < stations.length
      ? (stations.length - stationsDone()) + ' decision(s) still open.'
      : (c.response.trim().length < 80 ? 'Write at least 80 characters.' : 'Tick at least three rubric statements.'));
  }

  /* ---------------------------------------------------------------- wrapping */
  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () {
    const hash = location.hash.slice(1);
    if (hash === 'final' || hash === 'capstone') {
      landing();
      window.scrollTo(0, 0);
      document.title = 'InnerU \u00b7 Final mission';
      return;
    }
    previousRoute();
  };
  window.addEventListener('hashchange', route);

  /* Home: turn the advertised final-mission card into a real destination. */
  const previousHome = home;
  home = function () {
    previousHome();
    const card = document.querySelector('.final-destination');
    if (!card) return;
    const n = keys(), chip = card.querySelector('.chip'), body = card.querySelector('p');
    if (n >= REQUIRED_KEYS) {
      if (chip) chip.textContent = 'Unlocked \u00b7 6/6 keys';
      card.classList.add('is-unlocked');
      if (body) body.textContent = 'All six keys earned. Six decisions, one story.';
      if (!card.querySelector('.cap-enter')) card.insertAdjacentHTML('beforeend', '<a class="btn cap-enter" href="#final">Start the final challenge \u2192</a>');
    } else if (chip) {
      chip.textContent = 'Locked \u00b7 ' + n + '/6 keys';
    }
  };

  const previousDashboard = dashboard;
  dashboard = function () {
    previousDashboard();
    const c = data(), done = stationsDone();
    const section = document.createElement('section');
    section.className = 'panel spacer cap-dashboard';
    section.innerHTML = `<div class="eyebrow">FINAL MISSION \u00b7 SIX SYSTEMS</div><h2>Keep the body alive</h2>
      <p>${c.done ? 'Completed on ' + esc(c.date) + ' \u00b7 your certificate is ready.'
        : keys() < REQUIRED_KEYS ? keys() + '/6 System Keys. Earn the remaining ' + (REQUIRED_KEYS - keys()) + ' to open the final challenge.'
        : done + '/6 decisions made. The run is waiting.'}</p>
      <div class="bar"><i style="width:${Math.round((keys() / REQUIRED_KEYS * 0.5 + done / stations.length * 0.5) * 100)}%"></i></div>
      <a class="btn ${keys() < REQUIRED_KEYS ? 'line' : ''}" href="#final">${c.done ? 'Open my certificate \u2192' : keys() < REQUIRED_KEYS ? 'See what is still missing \u2192' : 'Continue the final challenge \u2192'}</a>`;
    const main = document.getElementById('main');
    if (main) { const foot = main.querySelector('footer'); if (foot) main.insertBefore(section, foot); else main.append(section); }
  };

  /* Badges: one honest collection total across all six worlds (this wrapper runs last). */
  const previousBadges = badges;
  badges = function () {
    previousBadges();
    const main = document.getElementById('main');
    if (!main || main.querySelector('.cap-total')) return;
    const tiles = [...main.querySelectorAll('.badge')];
    if (!tiles.length) return;
    const earned = tiles.filter(b => !b.classList.contains('locked')).length;
    const line = document.createElement('p');
    line.className = 'cap-total';
    line.innerHTML = `<b>${earned}</b> of <b>${tiles.length}</b> discoveries unlocked across the six worlds.`;
    const anchor = main.querySelector('.headrow') || main.firstElementChild;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(line, anchor.nextSibling);
    else main.insertBefore(line, main.firstChild);
  };

  route();
})();
