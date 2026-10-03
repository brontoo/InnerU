/* ============================================================================
   Review — retrieval practice with spacing (a Leitner box system)
   ----------------------------------------------------------------------------
   Why this page exists: re-reading feels productive but remembering improves most
   when you *retrieve* an answer after a delay. Every item lives in a box; a right
   answer moves it to the next box (1, 3, 7 then 16 days), a wrong answer sends it
   back to box 0, so weak material returns sooner.
   Everything is stored in the same browser-only state as the rest of the site.
   ========================================================================== */
(() => {
  'use strict';

  const DAY = 86400000;
  const INTERVALS = [0, 1, 3, 7, 16];
  const SESSION_SIZE = 10;

  const POOL = [ ['integ','Which layer of the skin faces the outside world?',['Epidermis','Dermis','Subcutaneous layer'],0,'The epidermis is the outer covering; the dermis underneath holds follicles, glands and nerves.'],
 ['integ','Where are hair follicles and sweat glands found?',['Dermis','Epidermis','Subcutaneous layer'],0,'The dermis houses the follicles, glands, nerves and blood vessels.'],
 ['integ','Which protein strengthens hair, nails and the skin surface?',['Keratin','Melanin','Collagen'],0,'Keratin is the tough structural protein; melanin is the pigment.'],
 ['integ','How does sweating cool the body?',['Evaporation removes heat from the skin','Sweat blocks heat from reaching the body','Sweat cools blood inside the vessels'],0,'Cooling comes from evaporation, which takes heat from the skin surface.'],
 ['integ','What is the main job of melanin?',['It reduces UV damage to skin cells','It waterproofs the skin','It stores energy as fat'],0,'Melanin absorbs UV radiation, so it protects DNA in skin cells.'],
 ['integ','Which structures detect touch and pressure?',['Nerve endings in the dermis','Sebaceous glands','Arrector pili muscles'],0,'Sensory receptors in the dermis send information to the nervous system.'],
 ['integ','What do sebaceous glands secrete?',['Oil that lubricates skin and hair','Sweat that cools the body','Melanin that colours the skin'],0,'Sebaceous glands release sebum, an oil that keeps skin and hair supple.'],
 ['integ','Which layer insulates the body and cushions it?',['Subcutaneous fat','Epidermis','The keratin layer'],0,'Fat and connective tissue under the dermis insulate and cushion.'],
 ['integ','What happens first when the skin is cut?',['A clot and scab form','New hair follicles grow','Melanin production increases'],0,'Blood clots seal the wound before new tissue is built.'],
 ['world','How many bones are in a typical adult skeleton?',['206','106','306'],0,'The adult skeleton normally has 206 bones; babies have more, and some fuse.'],
 ['world','Which division of the skeleton includes the limbs?',['Appendicular','Axial','Both equally'],0,'The appendicular skeleton is the limbs with their girdles; the axial skeleton is the skull, spine, ribs and sternum.'],
 ['world','Which tissue connects bone to bone at a joint?',['Ligament','Tendon','Marrow'],0,'Ligaments hold bone to bone; tendons attach muscle to bone.'],
 ['world','Which tissue connects muscle to bone?',['Tendon','Ligament','Cartilage'],0,'A tendon transmits the muscle\'s pull to the bone.'],
 ['world','What is the main function of red marrow?',['Producing blood cells','Storing fat','Reducing friction in joints'],0,'Red marrow makes blood cells; yellow marrow stores fat.'],
 ['world','How does spongy bone keep a bone light but strong?',['It forms a lattice with spaces between struts','It is solid and dense','It contains no minerals'],0,'The trabecular lattice supports loads with far less material.'],
 ['world','Which cells break bone down during remodelling?',['Osteoclasts','Osteoblasts','Osteocytes'],0,'Osteoclasts remove bone; osteoblasts build new bone.'],
 ['world','What is the first stage of bone repair?',['A blood clot forms (hematoma)','A soft callus bridges the break','The bone is remodelled'],0,'Damaged vessels form a clot first; only then does a callus form.'],
 ['world','Why can a shoulder move in more directions than an elbow?',['Its shallow socket allows several axes of movement','Its bones are fused together','It has no ligaments at all'],0,'A ball-and-socket joint trades stability for a wide range of movement.'],
 ['muscle','How do muscles produce movement?',['They contract and pull on bones','They push bones away','They lengthen actively'],0,'Muscles can only pull; movement is produced when they contract.'],
 ['muscle','Which muscle type is under voluntary control?',['Skeletal muscle','Smooth muscle','Cardiac muscle'],0,'Skeletal muscle is usually voluntary; smooth and cardiac muscle are involuntary.'],
 ['muscle','Where is smooth muscle found?',['In the walls of internal organs and blood vessels','Only in the heart','Attached to the skeleton'],0,'Smooth muscle lines hollow organs and vessels; cardiac muscle is only in the heart.'],
 ['muscle','What happens inside a sarcomere during contraction?',['Actin and myosin filaments slide past each other','The filaments themselves shorten','The bone shortens'],0,'The sliding filament model: filaments slide, the bands change, the sarcomere shortens.'],
 ['muscle','Why does a muscle fatigue during intense exercise?',['Anaerobic respiration builds up lactate','ATP becomes unlimited','Oxygen supply increases'],0,'When oxygen supply cannot keep up, anaerobic respiration contributes ATP and lactate accumulates.'],
 ['muscle','Which muscle fibre type resists fatigue best?',['Slow-twitch','Fast-twitch','Both resist equally'],0,'Slow-twitch fibres have more mitochondria and myoglobin, so they resist fatigue.'],
 ['muscle','What is ATP used for in a muscle cell?',['It powers the contraction','It carries oxygen in the blood','It stores calcium in the bone'],0,'ATP supplies the energy for the cross-bridge cycle.'],
 ['muscle','What does a tendon do?',['It transmits the muscle\'s pull to the bone','It reduces friction inside the joint','It connects bone to bone'],0,'Tendons attach muscle to bone; ligaments attach bone to bone.'],
 ['muscle','What does the heart\'s cardiac muscle do?',['Contracts rhythmically throughout life','Moves the skeleton','Lines the airways'],0,'Cardiac muscle is involuntary and contracts rhythmically to pump blood.'],
 ['respiratory','What is ventilation?',['The movement of air into and out of the lungs','Gas exchange inside body cells','The production of ATP'],0,'Ventilation is the mechanical movement of air; gas exchange is a separate step.'],
 ['respiratory','Where does gas exchange take place?',['In the alveoli','In the bronchi','In the trachea'],0,'Alveoli provide the thin, moist surface where gases diffuse.'],
 ['respiratory','Why are alveolar walls only one cell thick?',['It shortens the diffusion distance','It stores extra air','It produces mucus'],0,'A short diffusion path makes exchange faster.'],
 ['respiratory','What does the diaphragm do when you breathe in?',['It contracts and moves down','It relaxes and moves up','It stays completely still'],0,'Contraction flattens the diaphragm, enlarging the chest.'],
 ['respiratory','What happens to the pressure inside the chest during inhalation?',['It falls below atmospheric pressure','It rises above atmospheric pressure','It does not change'],0,'Air flows from higher to lower pressure, so a fall in pressure draws air in.'],
 ['respiratory','Which condition damages the alveolar walls?',['Emphysema','Bronchitis','Asthma'],0,'Emphysema destroys alveolar walls, reducing the exchange surface.'],
 ['respiratory','What is the main preventable cause of lung cancer?',['Smoking and vaping','Cold weather','Regular exercise'],0,'Most lung cancers are linked to inhaled smoke, including vaping aerosols.'],
 ['respiratory','Why does breathing rate rise during exercise?',['Energy demand and carbon dioxide production increase','The alveoli disappear','The heart stops working'],0,'More respiration means more oxygen needed and more carbon dioxide to remove.'],
 ['respiratory','What carries most of the oxygen in blood?',['Haemoglobin in red blood cells','Plasma on its own','Platelets'],0,'Haemoglobin binds oxygen; only a small amount dissolves in plasma.'],
 ['circ','Which vessel carries blood away from the heart?',['An artery','A vein','A capillary'],0,'Arteries carry blood away from the heart, whatever its oxygen content.'],
 ['circ','Where does exchange with body tissues happen?',['In the capillaries','In the arteries','In the veins'],0,'Capillary walls are one cell thick, so substances can diffuse.'],
 ['circ','Which chamber pumps blood to the lungs?',['The right ventricle','The left atrium','The left ventricle'],0,'The right ventricle pumps to the lungs; the left ventricle pumps to the body.'],
 ['circ','Why do veins have valves?',['To keep blood flowing toward the heart','To raise blood pressure','To exchange gases'],0,'Valves prevent backflow in the low-pressure venous system.'],
 ['circ','Which blood cells defend the body against pathogens?',['White blood cells','Red blood cells','Platelets'],0,'White blood cells form part of the immune defence.'],
 ['circ','What forms the mesh of a blood clot?',['Fibrin','Haemoglobin','Plasma'],0,'Fibrin threads form a mesh after platelets start the clotting process.'],
 ['circ','In the ABO system, which blood type carries both A and B markers?',['AB','O','A'],0,'AB red cells carry both markers and the plasma has neither antibody.'],
 ['circ','What happens to arterioles in working muscles during exercise?',['They widen to allow more blood through','They close completely','They carry no blood at all'],0,'Blood is redirected: vessels in working muscle dilate while others constrict.'],
 ['circ','What is the job of the pulmonary artery?',['To carry oxygen-poor blood to the lungs','To carry oxygen-rich blood to the body','To return blood from the body to the heart'],0,'It is named by direction, not by oxygen content: away from the heart, to the lungs.'],
 ['excretory','Which organs remove carbon dioxide?',['The lungs','The kidneys','The skin'],0,'Carbon dioxide leaves in the air you breathe out.'],
 ['excretory','Which organ makes urea from excess amino acids?',['The liver','The kidney','The bladder'],0,'The liver breaks down excess amino acids and produces urea; the kidneys remove it.'],
 ['excretory','Where does filtration begin in the kidney?',['In the glomerulus in the cortex','In the renal pelvis','In the ureter'],0,'Blood is filtered at the glomerulus, in the outer cortex.'],
 ['excretory','What returns useful substances to the blood?',['Reabsorption in the tubule','Filtration at the glomerulus','Excretion in urine'],0,'Reabsorption returns glucose, amino acids and most water to the blood.'],
 ['excretory','Which hormone increases water reabsorption?',['ADH','Insulin','Adrenaline'],0,'ADH acts on the collecting duct, so less water is lost in urine.'],
 ['excretory','What carries urine from a kidney to the bladder?',['The ureter','The urethra','The renal vein'],0,'Ureters connect the kidneys to the bladder; the urethra leads out of the body.'],
 ['excretory','Which substances should normally stay in the blood?',['Proteins and blood cells','Water and salts','Urea'],0,'They are too large to cross the filtration barrier.'],
 ['excretory','What does small, concentrated urine suggest?',['The body is conserving water','The kidneys have stopped working','Too much water is being removed'],0,'More ADH means more water is reabsorbed, so less dilute urine is produced.'],
 ['excretory','What is dialysis used for?',['To filter blood when the kidneys cannot','To increase urine production','To store urine'],0,'Dialysis performs the filtering job of the kidneys artificially.']];

  const WORLDS = {
    integ: ['Body Shield', '#integumentary'],
    world: ['Framework', '#world'],
    muscle: ['Power', '#muscle'],
    respiratory: ['Oxygen', '#respiratory'],
    circ: ['Transport', '#circulatory'],
    excretory: ['Filter', '#excretory']
  };

  const ITEMS = POOL.map((row, i) => ({ id: 'r' + i, world: row[0], q: row[1], options: row[2], answer: row[3], why: row[4] }));
  const byId = id => ITEMS.find(i => i.id === id);

  function data() {
    if (!state.review || typeof state.review !== 'object') state.review = {};
    const r = state.review;
    r.items = r.items && typeof r.items === 'object' ? r.items : {};
    r.answers = Number(r.answers) || 0;
    r.correct = Number(r.correct) || 0;
    r.sessions = Number(r.sessions) || 0;
    return r;
  }
  const entry = id => { const r = data(); const e = r.items[id]; return e && typeof e === 'object' ? e : null; };
  const boxOf = id => (entry(id) ? Math.min(4, Math.max(0, Number(entry(id).b) || 0)) : 0);
  const dueAt = id => { const e = entry(id); if (!e) return 0; return (Number(e.t) || 0) + INTERVALS[boxOf(id)] * DAY; };
  const isNew = id => !entry(id);
  const isDue = (id, now) => !isNew(id) && dueAt(id) <= now;

  function dueCount() { const now = Date.now(); return ITEMS.filter(i => isDue(i.id, now)).length; }

  /* weak material first, then overdue items, then new ones */
  function sessionItems(size) {
    const now = Date.now();
    const weak = weakIds();
    const score = id => (weak.includes(id) ? 0 : isDue(id, now) ? 1 : isNew(id) ? 2 : 3);
    return ITEMS.slice()
      .sort((a, b) => score(a.id) - score(b.id) || dueAt(a.id) - dueAt(b.id))
      .slice(0, size);
  }

  function weakIds() {
    const out = [];
    (state.weak || []).forEach(w => { const [n, i] = String(w).split('-').map(Number); if (n === 1) out.push('r0'); });
    const slices = ['integumentary', 'respiratory', 'excretory'];
    return out;
  }

  function weakLinks() {
    const chips = [];
    (state.weak || []).forEach(w => {
      const [n, i] = String(w).split('-').map(Number);
      if (!n || Number.isNaN(i)) return;
      chips.push(`<a class="review-weak" href="#mission/${n}">Skeletal \u00b7 mission ${n} \u00b7 question ${i + 1}</a>`);
    });
    [['integumentary', '#integumentary/mission/', 'Body Shield'], ['respiratory', '#respiratory/mission/', 'Oxygen'], ['excretory', '#excretory/mission/', 'Filter']].forEach(([key, route, label]) => {
      const slice = state[key];
      (slice && Array.isArray(slice.weak) ? slice.weak : []).forEach(id => {
        const [n, i] = String(id).split('-q').map(Number);
        if (!n) return;
        chips.push(`<a class="review-weak" href="${route}${n}">${label} \u00b7 mission ${n} \u00b7 question ${(i || 0) + 1}</a>`);
      });
    });
    return chips;
  }

  function record(id, right) {
    const r = data(), now = Date.now();
    const box = right ? Math.min(4, boxOf(id) + 1) : 0;
    r.items[id] = { b: box, t: now, d: now + INTERVALS[box] * DAY };
    r.answers += 1;
    if (right) r.correct += 1;
    save();
  }

  function nextDueLabel() {
    const next = ITEMS.map(i => dueAt(i.id)).filter(t => t > Date.now()).sort((a, b) => a - b)[0];
    if (!next) return 'nothing scheduled yet';
    const days = Math.max(1, Math.round((next - Date.now()) / DAY));
    return days === 1 ? 'tomorrow' : 'in ' + days + ' days';
  }

  /* ---------------------------------------------------------------- pages */
  function homePage() {
    const r = data(), due = dueCount(), fresh = ITEMS.filter(i => isNew(i.id)).length;
    const weak = weakLinks();
    const accuracy = r.answers ? Math.round(r.correct / r.answers * 100) : 0;
    layout(`<div class="review-world">
      <div class="review-hero"><div class="eyebrow">RETRIEVAL PRACTICE</div><h1>Review</h1>
      <p>Ten questions, drawn from all six systems. Right answers come back later, wrong ones come back sooner \u2014 that is how remembering is built.</p></div>
      <div class="grid three review-stats">
        <section class="panel"><div class="eyebrow">DUE NOW</div><h2>${due}</h2><p class="note">${fresh} item(s) never seen yet</p></section>
        <section class="panel"><div class="eyebrow">YOUR ACCURACY</div><h2>${accuracy}%</h2><p class="note">${r.correct}/${r.answers} answers across ${r.sessions} session(s)</p></section>
        <section class="panel"><div class="eyebrow">NEXT DUE</div><h2>${due ? 'now' : '\u2014'}</h2><p class="note">${due ? 'start a session below' : 'come back ' + nextDueLabel()}</p></section>
      </div>
      <section class="panel review-start">
        <h2>Start reviewing</h2>
        <p class="note">${ITEMS.length} items in the pool. A session takes about three minutes.</p>
        <div class="teacher-actions">
          <button class="btn" id="review-start">Start a 10-question session</button>
          <button class="btn secondary" id="review-quick">Quick 5</button>
          <button class="btn line" id="review-reset">Reset my review history</button>
        </div>
      </section>
      ${weak.length ? `<section class="panel"><div class="eyebrow">FROM YOUR MISTAKES</div><h2>Concepts you flagged</h2><p class="note">These came from wrong answers in the worlds. Open one to revise it, then come back.</p><div class="review-weaklist">${weak.join('')}</div></section>` : ''}
    </div>`, 'dashboard');
  }

  function questionPage(items, index, score, queue) {
    const item = items[index];
    const mixed = typeof mixQ === 'function' ? mixQ(['x', item.options, item.answer, 'y']) : [null, item.options, item.answer, null];
    const options = mixed[1], answer = mixed[2];
    const [name] = WORLDS[item.world] || ['InnerU'];
    layout(`<div class="review-world">
      <div class="review-bar"><a class="textlink" href="#review">\u2190 Review</a><span class="review-progress">Question ${index + 1} of ${items.length} \u00b7 ${score} correct</span></div>
      <section class="panel review-card" data-review-card>
        <div class="eyebrow">${name} \u00b7 BOX ${boxOf(item.id)}</div>
        <h2>${esc(item.q)}</h2>
        <div class="review-options">${options.map((o, j) => `<button type="button" class="choice" data-review-choice="${j}">${esc(o)}</button>`).join('')}</div>
        <div class="review-feedback" role="status" aria-live="polite"></div>
      </section>
    </div>`, 'dashboard');
    let done = false;
    document.querySelectorAll('[data-review-choice]').forEach(btn => {
      btn.onclick = () => {
        if (done) return;
        done = true;
        const right = +btn.dataset.reviewChoice === answer;
        record(item.id, right);
        const card = document.querySelector('[data-review-card]');
        card.querySelector('.review-feedback').innerHTML = `<div class="feedback ${right ? '' : 'wrong'}"><b>${right ? 'Correct.' : 'Not quite.'}</b> ${esc(item.why)}</div>`;
        document.querySelectorAll('[data-review-choice]').forEach((b, j) => {
          b.disabled = true;
          if (j === answer) b.classList.add('resp-correct');
          else if (b === btn) b.classList.add('resp-wrong');
        });
        const next = [...queue];
        if (!right) next.push(item);
        const btnRow = document.createElement('div');
        btnRow.className = 'teacher-actions';
        btnRow.innerHTML = `<button class="btn" id="review-next">${index + 1 < items.length ? 'Next question \u2192' : 'Finish session'}</button>`;
        card.append(btnRow);
        document.getElementById('review-next').onclick = () => {
          if (index + 1 < items.length) questionPage(items, index + 1, score + (right ? 1 : 0), next);
          else summaryPage(score + (right ? 1 : 0), items.length, next);
        };
      };
    });
  }

  function summaryPage(score, total, leftovers) {
    const r = data();
    r.sessions += 1;
    save();
    const redo = leftovers.filter(i => i);
    layout(`<div class="review-world">
      <div class="review-hero"><div class="eyebrow">SESSION COMPLETE</div><h1>${score} / ${total}</h1>
      <p>${score >= total * 0.8 ? 'Strong recall. These items move further apart.' : score >= total * 0.5 ? 'Good start \u2014 the ones you missed will come back sooner.' : 'That was hard. The missed items are scheduled to return first.'}</p></div>
      ${redo.length ? `<section class="panel"><h2>Worth another look now</h2><div class="review-redo">${redo.map(i => `<div class="review-redo-item"><b>${esc(i.q)}</b><p class="note">${esc(i.why)}</p></div>`).join('')}</div></section>` : ''}
      <section class="panel"><h2>What happens next</h2>
        <p class="note">Items you answered correctly move to longer intervals (1, 3, 7 then 16 days). Items you missed return to the front of the queue. Next session is due <b>${nextDueLabel()}</b>.</p>
        <div class="teacher-actions"><a class="btn" href="#review">Back to review</a><a class="btn secondary" href="#dashboard">My dashboard</a></div>
      </section>
    </div>`, 'dashboard');
  }

  function start(size) {
    const items = sessionItems(size);
    questionPage(items, 0, 0, []);
  }

  function wire() {
    const s = document.getElementById('review-start');
    if (s) s.onclick = () => start(SESSION_SIZE);
    const q = document.getElementById('review-quick');
    if (q) q.onclick = () => start(5);
    const reset = document.getElementById('review-reset');
    if (reset) reset.onclick = () => { const r = data(); r.items = {}; r.answers = 0; r.correct = 0; r.sessions = 0; save(); homePage(); };
  }

  /* ---------------------------------------------------------------- wrapping */
  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () {
    if (location.hash.slice(1) === 'review') { homePage(); wire(); window.scrollTo(0, 0); document.title = 'InnerU \u00b7 Review'; return; }
    previousRoute();
  };
  window.addEventListener('hashchange', route);

  const previousDashboard = dashboard;
  dashboard = function () {
    previousDashboard();
    const due = dueCount(), r = data();
    const section = document.createElement('section');
    section.className = 'panel spacer review-dashboard';
    section.innerHTML = `<div class="eyebrow">RETRIEVAL PRACTICE</div><h2>Review</h2>
      <p>${due ? due + ' item(s) are due now.' : r.answers ? 'Nothing due right now \u2014 next up ' + nextDueLabel() + '.' : ITEMS.length + ' questions across the six systems are waiting.'}</p>
      <a class="btn ${due ? '' : 'line'}" href="#review">${due ? 'Start reviewing \u2192' : 'Open review \u2192'}</a>`;
    const main = document.getElementById('main');
    if (main) { const foot = main.querySelector('footer'); if (foot) main.insertBefore(section, foot); else main.append(section); }
  };

  /* "Reset progress" must clear the review history as well, like every world slice. */
  const resetButton = document.getElementById('reset');
  if (resetButton) {
    const priorReset = resetButton.onclick;
    resetButton.onclick = () => {
      priorReset();
      const yes = document.getElementById('confirm-reset');
      if (yes) {
        const confirmed = yes.onclick;
        yes.onclick = () => {
          const r = data();
          r.items = {}; r.answers = 0; r.correct = 0; r.sessions = 0;
          save();
          confirmed();
        };
      }
    };
  }

  route();
})();
