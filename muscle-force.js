/* ============================================================================
   Force vs load simulator — muscular system, mission 2
   ----------------------------------------------------------------------------
   An integration layer: muscle.js is not touched. On #muscle/mission/2 this
   appends one panel and wires it:
     stimulation -> motor units recruited -> force produced -> does the load move?
   Holding the load adds fatigue, which is exactly why a heavy bag can be lifted
   but not carried forever.
   ========================================================================== */
(() => {
  'use strict';

  const MAX_FORCE = 420;      /* N, an illustrative maximum for one arm */
  const UNITS_MAX = 120;

  let holding = false, timer = null, fatigue = 0, heldSeconds = 0;

  const forceFor = stim => Math.round(MAX_FORCE * Math.pow(stim / 100, 1.15));
  const unitsFor = stim => Math.round(UNITS_MAX * stim / 100);
  const effective = () => Math.round(forceFor(+document.getElementById('mf-stim').value) * (1 - fatigue / 100));

  function markup() {
    return `<section class="panel mq-force" id="mq-force">
      <span class="eyebrow">SIMULATION \u00b7 FORCE AND LOAD</span>
      <h2>Recruit enough units to move the load</h2>
      <p>A muscle produces more force as more motor units are recruited. If that force is smaller than the load, nothing moves \u2014 and holding a load builds fatigue.</p>
      <div class="mq-force-grid">
        <div class="mq-force-art">
          <span class="mq-force-state" id="mf-state">TOO HEAVY</span>
          <div class="mq-force-bar" title="Force produced"><i id="mf-force-bar"></i></div>
          <small>force produced</small>
          <div class="mq-force-bar mq-force-load" title="Load"><i id="mf-load-bar"></i></div>
          <small>load</small>
        </div>
        <div>
          <label for="mf-stim">Stimulation \u00b7 <b id="mf-units">24</b> of ${UNITS_MAX} motor units</label>
          <input type="range" id="mf-stim" class="input" min="0" max="100" step="5" value="20" aria-describedby="mf-out">
          <label for="mf-load">Load on the hand: <b id="mf-load-value">120 N</b></label>
          <input type="range" id="mf-load" class="input" min="0" max="400" step="10" value="120" aria-describedby="mf-out">
          <dl class="exc-adh-out" id="mf-out" role="status" aria-live="polite">
            <dt>Force produced</dt><dd id="mf-force">88 N</dd>
            <dt>Load</dt><dd id="mf-load-out">120 N</dd>
            <dt>Fatigue</dt><dd id="mf-fatigue">0%</dd>
          </dl>
          <p class="mq-force-state" id="mf-status">Not enough force yet.</p>
          <div class="teacher-actions">
            <button class="btn secondary" id="mf-hold" type="button">Hold the load for 6 s</button>
            <button class="btn line" id="mf-reset" type="button">Reset fatigue</button>
          </div>
          <p class="hint"><b>Challenge 1:</b> lift a load of at least 100 N. <b>Challenge 2:</b> hold it for 6 seconds without the load dropping.</p>
          <p class="note" id="mf-result"></p>
        </div>
      </div></section>`;
  }

  function update() {
    const stim = +document.getElementById('mf-stim').value;
    const load = +document.getElementById('mf-load').value;
    const force = forceFor(stim), eff = effective();
    document.getElementById('mf-units').textContent = unitsFor(stim);
    document.getElementById('mf-load-value').textContent = load + ' N';
    document.getElementById('mf-force').textContent = force + ' N';
    document.getElementById('mf-load-out').textContent = load + ' N';
    document.getElementById('mf-fatigue').textContent = Math.round(fatigue) + '%';
    document.getElementById('mf-force-bar').style.width = Math.min(100, eff / MAX_FORCE * 100) + '%';
    document.getElementById('mf-load-bar').style.width = Math.min(100, load / 400 * 100) + '%';
    const state_ = document.getElementById('mf-state'), status = document.getElementById('mf-status');
    if (eff >= load && load > 0) {
      state_.textContent = 'LOAD LIFTS'; state_.className = 'mq-force-state is-lift';
      status.textContent = 'The muscle force is at least as large as the load, so the bone moves.';
    } else {
      state_.textContent = load === 0 ? 'NO LOAD' : 'TOO HEAVY';
      state_.className = 'mq-force-state is-heavy';
      status.textContent = load === 0 ? 'Add a load to test the muscle.' : (eff >= force * 0.98 ? 'Recruit more motor units to increase the force.' : 'Fatigue has reduced the force below the load.');
    }
    if (eff >= load && load >= 100 && !(state.rewards || []).includes('force-lift')) {
      reward('force-lift', 10);
      document.getElementById('mf-result').innerHTML = '\u2713 Challenge 1 saved: enough force, recruited efficiently. +10 XP';
    }
  }

  function hold() {
    const load = +document.getElementById('mf-load').value;
    if (holding || load <= 0) return;
    holding = true; heldSeconds = 0;
    document.getElementById('mf-hold').disabled = true;
    timer = setInterval(() => {
      heldSeconds += 0.25;
      fatigue = Math.min(100, fatigue + 1.8);
      update();
      const eff = effective();
      if (eff < load) {
        clearInterval(timer); timer = null; holding = false;
        document.getElementById('mf-hold').disabled = false;
        document.getElementById('mf-status').textContent = 'The load is dropping: fatigue reduced the force below the load.';
        return;
      }
      if (heldSeconds >= 6) {
        clearInterval(timer); timer = null; holding = false;
        document.getElementById('mf-hold').disabled = false;
        if (!(state.rewards || []).includes('force-hold')) {
          reward('force-hold', 10);
          document.getElementById('mf-result').innerHTML = '\u2713 Challenge 2 saved: 6 seconds held. +10 XP';
        }
      }
    }, 250);
  }

  function wire() {
    const stim = document.getElementById('mf-stim'), load = document.getElementById('mf-load');
    if (!stim) return;
    stim.oninput = update; load.oninput = update;
    document.getElementById('mf-hold').onclick = hold;
    document.getElementById('mf-reset').onclick = () => {
      fatigue = 0;
      if (timer) { clearInterval(timer); timer = null; holding = false; document.getElementById('mf-hold').disabled = false; }
      update();
    };
    update();
  }

  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () {
    previousRoute();
    if (location.hash.slice(1) !== 'muscle/mission/2' || document.getElementById('mq-force')) return;
    const anchor = document.querySelector('#mq-force-host') || document.querySelector('.mq-check-heading');
    if (anchor && anchor.parentElement) anchor.insertAdjacentHTML('beforebegin', markup());
    else {
      const main = document.getElementById('main');
      if (!main) return;
      const foot = main.querySelector('footer');
      if (foot) foot.insertAdjacentHTML('beforebegin', markup()); else main.insertAdjacentHTML('beforeend', markup());
    }
    wire();
  };
  window.addEventListener('hashchange', route);
  route();
})();
