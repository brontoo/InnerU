/* ============================================================================
   Muscular figure — the labelled front view that replaced the rotatable model
   ----------------------------------------------------------------------------
   A photograph cannot be rotated, so this keeps what the 3D lab was for: choosing
   a muscle and seeing where it lies. Selecting a name lights that region on the
   figure and fills the panel. Four muscles (triceps, latissimus dorsi, gluteals
   and hamstrings) are on the back of the body and are marked as such rather than
   highlighted in the wrong place.
   ========================================================================== */
(() => {
  'use strict';

  const MUSCLES = [
    ['Sternocleidomastoid',46.6,15.2,2.4,1.9,true,'Runs from the sternum and collar bone up to the bone behind the ear. One side turns the head, both sides bend the neck forward.'],
    ['Masseter',46.2,9.2,2.2,1.8,true,'The main chewing muscle, from the cheekbone to the lower jaw. It raises the jaw with a lot of force.'],
    ['Temporalis',45.4,6.0,2.6,1.9,true,'A fan-shaped muscle over the temple. It helps raise the jaw and pull it backwards.'],
    ['Deltoids',33.5,17.3,4.2,3.2,true,'The rounded shoulder muscle. It lifts the arm forwards, sideways and backwards.'],
    ['Pectorals',50.0,20.8,12.6,3.6,false,'Pectoralis major is the large chest muscle. It pulls the arm forwards and inwards, as in a push-up or a hug.'],
    ['Biceps',33.0,24.0,3.6,4.4,true,'Biceps brachii has two heads on the front of the upper arm. It bends the elbow and turns the palm upwards.'],
    ['Forearms',31.0,34.5,3.4,5.0,true,'The forearm muscles bend and straighten the wrist and fingers and rotate the palm. They also steady the wrist during a grip.'],
    ['Trapezius',50.0,16.6,11.5,1.6,false,'A large diamond-shaped muscle of the upper back. Its upper fibres lift the shoulders; the whole muscle moves the shoulder blade.'],
    ['Rectus abdominis',50.0,30.0,6.2,6.0,false,'The paired abdominal muscle often called the six-pack. It bends the trunk forwards and supports the abdominal wall.'],
    ['External oblique',42.5,29.5,3.0,4.8,true,'The outer muscle of the abdomen. It bends the trunk sideways and twists it to the opposite side.'],
    ['Quadriceps',41.0,57.0,4.6,5.4,true,'Four muscles on the front of the thigh. Together they straighten the knee; one of them also helps lift the thigh.'],
    ['Calves',39.0,71.5,3.8,5.6,true,'Gastrocnemius forms the calf. It points the foot downwards for walking, running and jumping, working with the soleus underneath.'],
    ['Tibialis anterior',42.0,70.0,2.6,7.0,true,'The muscle on the front of the shin. It lifts the foot upwards; weakness in it makes the foot drop when walking.'],
    ['Triceps',0,0,0,0,false,'Triceps brachii has three heads on the back of the upper arm. It straightens the elbow and is the antagonist of the biceps.',true],
    ['Latissimus dorsi',0,0,0,0,false,'The broad muscle of the back. It pulls the arm downwards and backwards, as in rowing or climbing.',true],
    ['Gluteals',0,0,0,0,false,'Gluteus maximus is the large hip muscle. It extends the hip, which is what drives the body forward when you stand, climb or run.',true],
    ['Hamstrings',0,0,0,0,false,'Three muscles on the back of the thigh. They bend the knee and extend the hip.',true]
  ].map(m => ({ name: m[0], x: m[1], y: m[2], rx: m[3], ry: m[4], mirror: m[5], text: m[6], back: !!m[7] }));

  const byName = name => MUSCLES.find(m => m.name === name);
  const display = { Deltoids: 'Deltoid', Pectorals: 'Pectoralis major', Biceps: 'Biceps brachii', Triceps: 'Triceps brachii', Gluteals: 'Gluteus maximus', Calves: 'Gastrocnemius' };

  function lab() { return document.querySelector('.body-atlas[data-muscle-figure]'); }
  function layer() { const l = lab(); return l ? l.querySelector('.muscle-figure-layer') : null; }

  function glow(muscle) {
    const spans = [{ x: muscle.x }, ...(muscle.mirror ? [{ x: 100 - muscle.x }] : [])];
    return spans.map(s => `<span class="muscle-glow" style="left:${s.x}%;top:${muscle.y}%;width:${muscle.rx * 2}%;height:${muscle.ry * 2}%"></span>`).join('');
  }

  function clearSelection() {
    const l = lab();
    if (!l) return;
    const lay = layer();
    if (lay) lay.innerHTML = '';
    l.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    const info = l.querySelector('.body-atlas-info');
    if (info) info.innerHTML = '<span class="body-atlas-info-kicker">MUSCLE PROFILE</span><h3>Choose a muscle</h3><p>Pick a name from the Muscle List to see where it lies on the figure and what it does.</p>';
  }

  function show(button) {
    const l = lab();
    const name = button.dataset.part;
    const muscle = byName(name);
    if (!l || !muscle) return;
    const info = l.querySelector('.body-atlas-info');
    l.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const lay = layer();
    if (lay) lay.innerHTML = muscle.back ? '' : glow(muscle);
    if (info) {
      info.innerHTML = `<span class="body-atlas-info-kicker">MUSCLE PROFILE</span><h3>${esc(display[name] || name)}</h3>` +
        (muscle.back ? '<p class="muscle-figure-note">On the back of the body — not visible from the front, so it is described here rather than marked on the figure.</p>' : '') +
        `<p>${esc(muscle.text)}</p>`;
    }
  }

  function wire() {
    const l = lab();
    if (!l || l.dataset.figureWired) return;
    l.dataset.figureWired = '1';
    l.querySelector('.body-atlas-loading')?.remove();
    l.querySelector('.body-atlas-hotspots')?.remove();
    l.classList.add('is-figure');
    l.querySelectorAll('[data-part]').forEach(button => {
      button.onclick = () => { button.getAttribute('aria-pressed') === 'true' ? clearSelection() : show(button); };
    });
    const clear = l.querySelector('[data-muscle-clear]');
    if (clear) clear.onclick = clearSelection;
    const labels = l.querySelector('[data-muscle-labels]');
    if (labels) {
      labels.onclick = () => {
        const on = labels.getAttribute('aria-pressed') !== 'true';
        labels.setAttribute('aria-pressed', String(on));
        labels.textContent = on ? 'Show all labels' : 'Hide all labels';
        l.querySelector('.muscle-figure')?.classList.toggle('labels-hidden', !on);
      };
    }
    clearSelection();
  }

  const previousLayout = layout;
  layout = function (...args) {
    previousLayout(...args);
    if (lab()) wire();
  };

  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () { previousRoute(); if (lab()) wire(); };
  window.addEventListener('hashchange', route);

  window.inneruMuscleFigure = { muscles: MUSCLES.length, backView: MUSCLES.filter(m => m.back).map(m => m.name) };
  route();
})();
