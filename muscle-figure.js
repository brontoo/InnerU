/* ============================================================================
   Muscular figure — a labelled, turnable, spotlit stand-in for the 3D model
   ----------------------------------------------------------------------------
   One photograph stands in for the rotatable model, so this module supplies what
   the 3D lab gave students:
     * turning the figure (drag, arrow keys, auto-rotate, reset)
     * a translucent body that recedes while one muscle is spotlit in full colour
     * selection from the Muscle List or by tapping a dot on the figure itself
   The four muscles that live on the back of the body cannot be spotlit in a front
   view, so they get a dashed ring where they pass behind the silhouette plus a note.
   ========================================================================== */
(() => {
  'use strict';

  const MUSCLES = [
    ['Sternocleidomastoid',46.6,15.2,2.4,1.9,true,'Runs from the sternum and collar bone up to the bone behind the ear. One side turns the head, both sides bend the neck forward.'],
    ['Masseter',46.2,9.2,2.2,1.8,true,'The main chewing muscle, from the cheekbone to the lower jaw. It raises the jaw with a lot of force.'],
    ['Temporalis',45.4,6.0,2.6,1.9,true,'A fan-shaped muscle over the temple. It helps raise the jaw and pull it backwards.'],
    ['Deltoids',33.0,17.8,4.2,3.2,true,'The rounded shoulder muscle. It lifts the arm forwards, sideways and backwards.'],
    ['Pectorals',50.0,20.8,12.6,3.6,false,'Pectoralis major is the large chest muscle. It pulls the arm forwards and inwards, as in a push-up or a hug.'],
    ['Biceps',32.0,24.0,3.6,4.4,true,'Biceps brachii has two heads on the front of the upper arm. It bends the elbow and turns the palm upwards.'],
    ['Forearms',31.0,34.5,3.4,5.0,true,'The forearm muscles bend and straighten the wrist and fingers and rotate the palm. They also steady the wrist during a grip.'],
    ['Trapezius',50.0,16.6,11.5,1.6,false,'A large diamond-shaped muscle of the upper back. Its upper fibres lift the shoulders; the whole muscle moves the shoulder blade.'],
    ['Rectus abdominis',50.0,30.0,6.2,6.0,false,'The paired abdominal muscle often called the six-pack. It bends the trunk forwards and supports the abdominal wall.'],
    ['External oblique',42.5,29.5,3.0,4.8,true,'The outer muscle of the abdomen. It bends the trunk sideways and twists it to the opposite side.'],
    ['Quadriceps',41.0,57.0,4.6,5.4,true,'Four muscles on the front of the thigh. Together they straighten the knee; one of them also helps lift the thigh.'],
    ['Calves',39.0,71.5,3.8,5.6,true,'Gastrocnemius forms the calf. It points the foot downwards for walking, running and jumping, working with the soleus underneath.'],
    ['Tibialis anterior',42.0,70.0,2.6,7.0,true,'The muscle on the front of the shin. It lifts the foot upwards; weakness in it makes the foot drop when walking.'],
    ['Triceps',0,0,4.0,5.0,false,'Triceps brachii has three heads on the back of the upper arm. It straightens the elbow and is the antagonist of the biceps.',true],
    ['Latissimus dorsi',0,0,5.0,4.0,false,'The broad muscle of the back. It pulls the arm downwards and backwards, as in rowing or climbing.',true],
    ['Gluteals',0,0,5.0,4.0,false,'Gluteus maximus is the large hip muscle. It extends the hip, which is what drives the body forward when you stand, climb or run.',true],
    ['Hamstrings',0,0,4.4,5.0,false,'Three muscles on the back of the thigh. They bend the knee and extend the hip.',true]
  ].map(m => ({ name: m[0], x: m[1], y: m[2], rx: m[3], ry: m[4], mirror: m[5], text: m[6], back: !!m[7] }));

  /* a dot for every muscle; back-of-the-body ones get a dashed "behind" ring */
  const GHOST = {
    'Triceps': [30.0, 25.0],
    'Latissimus dorsi': [38.6, 26.5],
    'Gluteals': [39.0, 42.0],
    'Hamstrings': [40.0, 56.0]
  };

  const display = { Deltoids: 'Deltoid', Pectorals: 'Pectoralis major', Biceps: 'Biceps brachii', Triceps: 'Triceps brachii', Gluteals: 'Gluteus maximus', Calves: 'Gastrocnemius' };
  const byName = name => MUSCLES.find(m => m.name === name);

  let tilt = { x: 0, y: 0 }, spin = false, spinFrame = 0, spinT = 0, dragging = null, selected = null;

  const lab = () => document.querySelector('.body-atlas.muscular');
  const figure = () => document.querySelector('.body-atlas.muscular .muscle-figure');
  const tiltEl = () => document.querySelector('.body-atlas.muscular .mf-tilt');

  /* ---------------------------------------------------------------- build */
  function build() {
    const img = document.querySelector('.body-atlas.muscular .muscle-figure > img');
    if (!img || document.querySelector('.body-atlas.muscular .mf-tilt')) return;
    const wrap = document.createElement('div');
    wrap.className = 'mf-tilt';
    img.replaceWith(wrap);
    img.className = 'mf-img mf-base';
    const lit1 = img.cloneNode(true), lit2 = img.cloneNode(true);
    lit1.className = lit2.className = 'mf-img mf-lit';
    lit1.setAttribute('aria-hidden', 'true');
    lit2.setAttribute('aria-hidden', 'true');
    const spots = document.createElement('div');
    spots.className = 'mf-hotspots';
    spots.setAttribute('role', 'group');
    spots.setAttribute('aria-label', 'Muscles on the figure');
    spots.innerHTML = MUSCLES.map(m => {
      /* back-of-the-body muscles are placed where they pass behind the silhouette */
      const ghost = m.back && GHOST[m.name];
      const base = ghost ? { x: ghost[0], y: ghost[1], mirror: true } : m;
      const sides = base.mirror ? [base.x, 100 - base.x] : [base.x];
      return sides.map(x => `<button type="button" class="mf-dot${m.back ? ' is-behind' : ''}" data-part="${m.name}" data-x="${x}" data-y="${base.y}" style="left:${x}%;top:${base.y}%" aria-pressed="false" aria-label="${display[m.name] || m.name}"><span class="mf-dot-label">${display[m.name] || m.name}</span></button>`).join('');
    }).join('');
    spots.classList.add('labels-off');
    wrap.append(img, lit1, lit2, spots);
  }

  /* ---------------------------------------------------------------- spotlight */
  function spotlayers(muscle) {
    const lits = [...document.querySelectorAll('.body-atlas.muscular .mf-lit')];
    const points = [];
    if (muscle && !muscle.back) {
      points.push([muscle.x, muscle.y]);
      if (muscle.mirror) points.push([100 - muscle.x, muscle.y]);
    }
    lits.forEach((el, i) => {
      const p = points[i];
      if (!p) { el.style.maskImage = el.style.webkitMaskImage = ''; el.classList.remove('is-on'); return; }
      const rx = muscle.rx * 2.6, ry = muscle.ry * 2.6;
      const grad = `radial-gradient(ellipse ${rx}% ${ry}% at ${p[0]}% ${p[1]}%, #000 0 46%, rgba(0,0,0,.6) 68%, transparent 100%)`;
      el.style.maskImage = el.style.webkitMaskImage = grad;
      el.classList.add('is-on');
    });
    const marks = document.querySelector('.body-atlas.muscular .mf-marks');
    if (marks) {
      marks.innerHTML = !muscle ? '' : (muscle.back && GHOST[muscle.name]
        ? [[GHOST[muscle.name][0], GHOST[muscle.name][1]], [100 - GHOST[muscle.name][0], GHOST[muscle.name][1]]]
            .map(([x, y]) => `<span class="mf-mark is-behind" style="left:${x}%;top:${y}%;width:${muscle.rx * 3.4}%;height:${muscle.ry * 3.4}%"></span>`).join('')
        : [[muscle.x, muscle.y], ...(muscle.mirror ? [[100 - muscle.x, muscle.y]] : [])]
            .map(([x, y]) => `<span class="mf-mark" style="left:${x}%;top:${y}%;width:${muscle.rx * 3.0}%;height:${muscle.ry * 3.0}%"></span>`).join(''));
    }
  }

  /* ---------------------------------------------------------------- selection */
  function panel(name, text, back) {
    const info = document.querySelector('.body-atlas.muscular .body-atlas-info');
    if (!info) return;
    info.innerHTML = '<span class="body-atlas-info-kicker">MUSCLE PROFILE</span><h3>' + esc(display[name] || name) + '</h3>'
      + (back ? '<p class="muscle-figure-note">This muscle lies on the <b>back of the body</b>, so a front view cannot show it. The dashed ring marks the outline it passes behind.</p>' : '')
      + '<p>' + esc(text) + '</p>';
  }

  function select(name) {
    const figureEl = figure();
    if (!figureEl) return;
    const muscle = byName(name);
    selected = name;
    figureEl.classList.toggle('has-selection', !!muscle);
    const labEl = lab();
    labEl.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.part === name)));
    if (!muscle) { spotlayers(null); panel('Choose a muscle', 'Pick a name from the Muscle List, or tap a dot on the figure.', false); return; }
    spotlayers(muscle);
    panel(name, muscle.text, muscle.back);
    /* if the muscle sits behind the "More muscles" disclosure, open it so the
       pressed button is visible */
    const more = labEl.querySelector('.body-atlas-more');
    if (more && [...more.querySelectorAll('[data-part]')].some(b => b.dataset.part === name)) more.open = true;
  }

  /* ---------------------------------------------------------------- rotation */
  function applyTilt(animate) {
    const el = tiltEl();
    if (!el) return;
    el.classList.toggle('is-dragging', !animate);
    el.style.setProperty('--ry', tilt.y.toFixed(2) + 'deg');
    el.style.setProperty('--rx', tilt.x.toFixed(2) + 'deg');
    const readout = document.querySelector('.body-atlas.muscular .mf-angle');
    if (readout) readout.textContent = (tilt.y >= 0 ? '+' : '') + Math.round(tilt.y) + '\u00b0';
  }

  function stopSpin() {
    spin = false;
    cancelAnimationFrame(spinFrame);
    const b = document.querySelector('[data-muscle-spin]');
    if (b) b.setAttribute('aria-pressed', 'false');
  }

  function startSpin() {
    const reduce = typeof motionReduced === 'function' && motionReduced();
    if (reduce) { spin = false; return; }
    spin = true;
    spinT = 0;
    const b = document.querySelector('[data-muscle-spin]');
    if (b) b.setAttribute('aria-pressed', 'true');
    const step = () => {
      if (!spin) return;
      spinT += 0.012;
      tilt.y = Math.sin(spinT) * 24;
      tilt.x = Math.sin(spinT * 0.7) * 5;
      applyTilt(false);
      spinFrame = requestAnimationFrame(step);
    };
    spinFrame = requestAnimationFrame(step);
  }

  function resetView() {
    stopSpin();
    tilt = { x: 0, y: 0 };
    applyTilt(true);
    select(null);
  }

  /* ---------------------------------------------------------------- wiring */
  function wire() {
    const labEl = lab();
    if (!labEl) return;
    build();
    const el = tiltEl();
    if (!el || labEl.dataset.figureWired) return;
    labEl.dataset.figureWired = '1';
    labEl.classList.add('is-figure');
    labEl.querySelector('.body-atlas-loading')?.remove();
    labEl.querySelector('.body-atlas-hotspots')?.remove();
    const marks = document.createElement('div');
    marks.className = 'mf-marks';
    marks.setAttribute('aria-hidden', 'true');
    el.append(marks);

    labEl.querySelectorAll('[data-part]').forEach(b => {
      b.onclick = () => { b.getAttribute('aria-pressed') === 'true' ? select(null) : select(b.dataset.part); };
    });

    const spinBtn = labEl.querySelector('[data-muscle-spin]');
    if (spinBtn) spinBtn.onclick = () => spin ? stopSpin() : startSpin();
    const resetBtn = labEl.querySelector('[data-muscle-reset]');
    if (resetBtn) resetBtn.onclick = resetView;
    const labels = labEl.querySelector('[data-muscle-labels]');
    if (labels) {
      labels.setAttribute('aria-pressed', 'false');
      labels.textContent = 'Show labels';
      labels.onclick = () => {
        const on = labels.getAttribute('aria-pressed') !== 'true';
        labels.setAttribute('aria-pressed', String(on));
        labels.textContent = on ? 'Hide labels' : 'Show labels';
        labEl.querySelector('.mf-hotspots')?.classList.toggle('labels-off', !on);
      };
    }

    /* drag to turn */
    el.addEventListener('pointerdown', e => {
      if (e.target.closest('.mf-dot')) return;
      stopSpin();
      dragging = { x: e.clientX, y: e.clientY, ry: tilt.y, rx: tilt.x };
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!dragging) return;
      tilt.y = Math.max(-32, Math.min(32, dragging.ry + (e.clientX - dragging.x) * 0.22));
      tilt.x = Math.max(-12, Math.min(12, dragging.rx - (e.clientY - dragging.y) * 0.12));
      applyTilt(false);
    });
    const end = () => { dragging = null; applyTilt(true); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('pointercancel', end);

    /* arrow keys, when the figure has focus */
    labEl.querySelector('.body-atlas-stage')?.setAttribute('tabindex', '0');
    labEl.querySelector('.body-atlas-stage')?.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        stopSpin();
        tilt.y = Math.max(-32, Math.min(32, tilt.y + (e.key === 'ArrowLeft' ? -6 : 6)));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        stopSpin();
        tilt.x = Math.max(-12, Math.min(12, tilt.x + (e.key === 'ArrowUp' ? -4 : 4)));
      } else if (e.key === '0' || e.key === 'Home') { resetView(); }
      else return;
      applyTilt(true);
      e.preventDefault();
    });

    applyTilt(true);
    select(null);
  }

  const previousLayout = layout;
  layout = function (...args) { previousLayout(...args); if (lab()) wire(); };

  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () { previousRoute(); if (lab()) wire(); };
  window.addEventListener('hashchange', route);

  window.inneruMuscleFigure = {
    muscles: MUSCLES.length,
    backView: MUSCLES.filter(m => m.back).map(m => m.name),
    state: () => ({ selected, tilt: { x: +tilt.x.toFixed(2), y: +tilt.y.toFixed(2) }, spinning: spin,
                    spotlit: [...document.querySelectorAll('.body-atlas.muscular .mf-lit.is-on')].length,
                    marks: document.querySelectorAll('.body-atlas.muscular .mf-mark').length,
                    dots: document.querySelectorAll('.body-atlas.muscular .mf-dot').length }),
    select
  };
  route();
})();
