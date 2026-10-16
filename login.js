/* InnerU discovery entry. Roles choose existing public workspaces, not permissions. */
(() => {
  'use strict';
  const root = document.querySelector('.iu-gate');
  const grid = root.querySelector('.gate-role-grid');
  const panel = root.querySelector('#gate-entry-panel');
  const dialog = root.querySelector('dialog');
  const support = root.querySelector('.gate-welcome > p');
  const gallery = root.querySelector('#gate-exhibits');
  const galleryButton = root.querySelector('[data-action-gallery]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 1150px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const arrows = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
  const exhibits = [
    {name:'Integumentary System',tag:'01 / BODY SHIELD',image:'01-shield',href:'index.html#integumentary',text:'The epidermis forms the outer barrier. The dermis supports vessels, sensory structures, hair follicles and glands. Together, skin protects, senses and helps regulate temperature.'},
    {name:'Skeletal System',tag:'02 / FRAMEWORK',image:'02-framework',href:'index.html#world',text:'Living bone supports and protects the body. Marrow produces blood cells, joints allow movement, and bone tissue adapts through ongoing formation and resorption.'},
    {name:'Muscular System',tag:'03 / POWER',image:'03-power',href:'index.html#muscle',text:'Skeletal muscle pulls through tendons to move bones. Actin and myosin slide past one another inside muscle fibres, using ATP to produce force.'},
    {name:'Respiratory System',tag:'04 / OXYGEN',image:'04-oxygen',href:'index.html#respiratory',text:'Air travels through branching airways to the alveoli. Oxygen and carbon dioxide diffuse across thin exchange surfaces, while the diaphragm helps change chest volume during breathing.'},
    {name:'Circulatory System',tag:'05 / TRANSPORT',image:'05-transport',href:'index.html#circulatory',text:'The heart pumps blood through pulmonary and systemic circuits. Valves support one-way flow, and thin-walled capillaries allow exchange with tissues.'},
    {name:'Excretory System',tag:'06 / BALANCE',image:'06-balance',href:'index.html#excretory',text:'Kidney nephrons filter blood, reabsorb useful substances and help regulate water and salts. Urine passes through the renal pelvis and ureter to the bladder.'}
  ];
  let role = null;
  let draftName = null;
  let paused = false;
  let galleryOpen = false;
  let switching = false;
  let opening = false;
  let timer = 0;
  let frame = 0;
  let pointer = {x:0,y:0};
  let focusedCard = null;
  let cardBounds = null;
  let exhibitOpener = null;

  function readProfile() {
    try {
      const raw = localStorage.getItem('bodyquest-v1');
      if (!raw) return {value:null};
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || !Array.isArray(value.done) || !Array.isArray(value.rewards)) return {invalid:true};
      return {value};
    } catch { return {unavailable:true}; }
  }
  let browserReduced = readProfile().value?.motion === true;
  function appMotionOff() { return browserReduced; }
  function canMove() { return !paused && !reduced.matches && !appMotionOff() && !document.hidden; }
  function resetPointer() {
    cancelAnimationFrame(frame); frame = 0;
    root.style.setProperty('--scene-x','0px');
    root.style.setProperty('--scene-y','0px');
    root.style.setProperty('--pointer-x','50%');
    root.style.setProperty('--pointer-y','40%');
    grid.querySelectorAll('[data-card]').forEach(card => {
      card.style.setProperty('--tilt-x','0deg');
      card.style.setProperty('--tilt-y','0deg');
    });
  }
  function motion() {
    const forced = reduced.matches || appMotionOff();
    root.dataset.visualMotion = paused || forced ? 'off' : 'on';
    root.classList.toggle('gate-page-hidden',document.hidden);
    const button = root.querySelector('[data-action-motion]');
    button.disabled = forced;
    button.setAttribute('aria-pressed', String(paused || forced));
    button.querySelector('[data-motion-label]').textContent = forced ? 'Reduced motion' : paused ? 'Play motion' : 'Pause motion';
    button.querySelector('[aria-hidden]').innerHTML = paused || forced ? '<path d="m5 3 8 5-8 5z"/>' : '<path d="M4 3h2v10H4zm6 0h2v10h-2z"/>';
    if (!canMove()) resetPointer();
  }
  function galleryState() {
    const show = !narrow.matches || galleryOpen;
    gallery.hidden = !show;
    galleryButton.setAttribute('aria-expanded',String(show));
    galleryButton.firstChild.textContent = galleryOpen ? 'Close the exhibit gallery ' : 'Explore the six exhibits ';
    galleryButton.querySelector('span').textContent = galleryOpen ? '−' : '+';
    if (narrow.matches) resetPointer();
  }
  function progressLabel(value) {
    if (!value) return 'A fresh journey is waiting for you.';
    const slice = key => value[key] && typeof value[key] === 'object' ? value[key] : {};
    const keys = Number(value.done.includes(8)) + Number((Array.isArray(slice('muscle').done) ? slice('muscle').done : []).includes(8)) + ['integumentary','respiratory','circ','excretory'].filter(id => slice(id).mastery).length;
    const xp = Number.isFinite(Number(value.xp)) ? Math.max(0,Number(value.xp)) : 0;
    return new Intl.NumberFormat('en').format(xp) + ' XP saved here · ' + keys + ' / 6 System Keys';
  }
  function rememberDraft() {
    const input = panel.querySelector('#entry-nickname');
    if (input) draftName = input.value;
  }
  function roles() {
    if (opening) return;
    clearTimeout(timer); switching = false; rememberDraft();
    const previous = role;
    role = null;
    root.dataset.view = 'roles';
    delete root.dataset.role;
    panel.hidden = true;
    grid.hidden = false;
    grid.querySelectorAll('[data-card]').forEach(card => card.classList.remove('is-selected','is-unselected'));
    support.textContent = 'Choose your role to begin your journey.';
    if (previous) grid.querySelector('[data-select-role="'+previous+'"]').focus({preventScroll:true});
    resetPointer();
  }
  function entry(selected) {
    if (switching || opening || !['student','teacher'].includes(selected)) return;
    switching = true;
    role = selected;
    root.dataset.role = selected;
    root.dataset.view = 'selecting';
    grid.querySelectorAll('[data-card]').forEach(card => {
      card.classList.toggle('is-selected',card.dataset.card === selected);
      card.classList.toggle('is-unselected',card.dataset.card !== selected);
    });
    resetPointer();
    timer = setTimeout(() => {
      switching = false;
      const current = readProfile();
      const student = selected === 'student';
      panel.innerHTML = `<button type="button" class="gate-back" data-back-roles>← Choose another role</button><span class="gate-panel-label">${student?'STUDENT / BODY EXPLORER':'TEACHER / MISSION COMMANDER'}</span><h2 id="gate-panel-title" tabindex="-1">${student?'Your next discovery awaits.':'Welcome to your Teacher Lab.'}</h2><p class="gate-panel-intro">${student?'Continue your InnerU adventure with the learning profile saved on this browser.':'Open your classroom tools to collect progress codes, view class summaries and prepare a shared device.'}</p><div class="gate-entry-facts">${student?`<span class="gate-saved-indicator" aria-hidden="true"></span><p data-profile-summary></p>`:'<span>PROGRESS CODES</span><i aria-hidden="true"></i><span>CLASS SUMMARIES</span><i aria-hidden="true"></i><span>SHARED-DEVICE TOOLS</span>'}</div><form id="gate-entry-form" novalidate>${student?'<div class="gate-field"><label for="entry-nickname">Your first name or nickname <small>optional</small></label><input id="entry-nickname" name="nickname" type="text" maxlength="24" autocomplete="nickname" aria-describedby="entry-name-help entry-error" placeholder="What should we call you?"><span id="entry-name-help">Keep your existing name, or choose a nickname for this device.</span></div>':''}<p id="entry-error" class="gate-entry-error" role="alert"></p><button type="submit" class="gate-enter gate-submit"><span data-submit-label>${student?'OPEN MY DASHBOARD':'OPEN TEACHER TOOLS'}</span><span class="gate-opening-spinner" aria-hidden="true"></span>${arrows}</button><button type="button" class="gate-continue-unchanged" data-continue-unchanged hidden>Open the dashboard without changing my name ${arrows}</button></form><p class="gate-panel-local">${student?'Your progress, XP and achievements stay on this device.':'Teacher tools use this browser’s class list and shared-device progress.'}</p>`;
      if (student) {
        panel.querySelector('[data-profile-summary]').textContent = progressLabel(current.value);
        panel.querySelector('#entry-nickname').value = draftName ?? (typeof current.value?.name === 'string' && current.value.name !== 'Explorer' ? current.value.name.slice(0,24) : '');
        if (current.invalid) panel.querySelector('#entry-error').textContent = 'Saved progress could not be read. You can open the dashboard without changing your name.';
        if (current.unavailable) panel.querySelector('#entry-error').textContent = 'Browser saving is unavailable. You can still open your dashboard.';
        if (current.invalid || current.unavailable) panel.querySelector('[data-continue-unchanged]').hidden = false;
      }
      support.textContent = student ? 'Keep exploring the extraordinary world inside you.' : 'Inspire the next generation of body explorers.';
      grid.hidden = true;
      panel.hidden = false;
      root.dataset.view = 'entry';
      panel.querySelector('#gate-panel-title').focus({preventScroll:true});
    }, canMove() ? 260 : 0);
  }
  function setBusy(busy) {
    opening = busy;
    root.classList.toggle('is-opening',busy);
    panel.querySelector('form').setAttribute('aria-busy',String(busy));
    panel.querySelectorAll('button,input').forEach(el => { el.disabled = busy; });
    const label = panel.querySelector('[data-submit-label]');
    label.textContent = busy ? 'OPENING YOUR WORKSPACE…' : role === 'student' ? 'OPEN MY DASHBOARD' : 'OPEN TEACHER TOOLS';
  }
  async function openWorkspace(unchanged = false) {
    if (opening || !role) return;
    const student = role === 'student';
    const error = panel.querySelector('#entry-error');
    error.textContent = '';
    const input = panel.querySelector('#entry-nickname');
    const name = input?.value.trim() || '';
    if (student && !unchanged && (name.length > 24 || /[\u0000-\u001f\u007f]/.test(name))) {
      error.textContent = 'Please use up to 24 characters for your first name or nickname.';
      input.setAttribute('aria-invalid','true'); input.focus(); return;
    }
    setBusy(true);
    if (student && !unchanged && name) {
      const latest = readProfile();
      try {
        if (latest.invalid || latest.unavailable) throw new Error('Profile unavailable');
        const value = latest.value || {name:'Explorer',xp:0,done:[],rewards:[],weak:[],level:'Explorer',motion:false};
        if (value.name !== name) {
          value.name = name;
          localStorage.setItem('bodyquest-v1',JSON.stringify(value));
        }
      } catch {
        setBusy(false);
        error.textContent = 'Your name could not be saved. Your existing progress is unchanged.';
        panel.querySelector('[data-continue-unchanged]').hidden = false;
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve,canMove() ? 180 : 0));
    location.assign(student ? 'index.html#dashboard' : 'index.html#teacher');
  }
  function exhibit(index) {
    const item = exhibits[index];
    if (!item) return;
    exhibitOpener = gallery.querySelector('[data-exhibit="'+index+'"]');
    const content = dialog.querySelector('[data-exhibit-detail]');
    content.innerHTML = `<span class="gate-panel-label">${item.tag} / SCIENCE EXHIBIT</span><h2 id="gate-exhibit-title">${item.name}</h2><figure><img src="assets/home-expedition/${item.image}.webp" alt="${item.name} anatomical teaching study." width="880" height="587"><figcaption>ANATOMICAL TEACHING ILLUSTRATION · ENLARGED FOR CLARITY</figcaption></figure><p>${item.text}</p><a class="gate-exhibit-world" href="${item.href}">Explore this world ${arrows}</a>`;
    dialog.showModal();
  }
  root.addEventListener('click',event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-select-role')) entry(button.dataset.selectRole);
    else if (button.hasAttribute('data-back-roles')) roles();
    else if (button.hasAttribute('data-action-motion')) { paused = !paused; motion(); }
    else if (button.hasAttribute('data-action-gallery')) { galleryOpen = !galleryOpen; galleryState(); }
    else if (button.hasAttribute('data-exhibit')) exhibit(+button.dataset.exhibit);
    else if (button.hasAttribute('data-close-exhibit')) dialog.close();
    else if (button.hasAttribute('data-continue-unchanged')) openWorkspace(true);
  });
  panel.addEventListener('submit',event => { event.preventDefault(); openWorkspace(); });
  panel.addEventListener('input',event => {
    if (event.target.id === 'entry-nickname') {
      draftName = event.target.value;
      event.target.removeAttribute('aria-invalid');
      panel.querySelector('#entry-error').textContent = '';
    }
  });
  root.addEventListener('keydown',event => {
    if (event.key === 'Escape' && !dialog.open && role && !opening) { event.preventDefault(); roles(); }
  });
  dialog.addEventListener('close',() => { if (exhibitOpener?.isConnected && !exhibitOpener.closest('[hidden]')) exhibitOpener.focus({preventScroll:true}); });
  dialog.addEventListener('click',event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  grid.querySelectorAll('[data-card]').forEach(card => {
    const highlight = () => { if (!role) root.dataset.highlight = card.dataset.card; };
    card.addEventListener('pointerenter',() => { focusedCard = card; cardBounds = card.getBoundingClientRect(); highlight(); });
    card.addEventListener('focusin',highlight);
    card.addEventListener('pointerleave',() => { focusedCard = null; cardBounds = null; card.style.setProperty('--tilt-x','0deg'); card.style.setProperty('--tilt-y','0deg'); if (!card.contains(document.activeElement)) delete root.dataset.highlight; });
    card.addEventListener('focusout',() => { if (!role) delete root.dataset.highlight; });
  });
  root.addEventListener('pointermove',event => {
    if (!canMove() || !fine.matches || narrow.matches || dialog.open) return;
    pointer = {x:event.clientX,y:event.clientY};
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const x = (pointer.x / innerWidth - .5) * 2;
      const y = (pointer.y / innerHeight - .5) * 2;
      root.style.setProperty('--scene-x',(-x*7).toFixed(2)+'px');
      root.style.setProperty('--scene-y',(-y*4).toFixed(2)+'px');
      root.style.setProperty('--pointer-x',(pointer.x/innerWidth*100).toFixed(1)+'%');
      root.style.setProperty('--pointer-y',(pointer.y/innerHeight*100).toFixed(1)+'%');
      if (focusedCard && cardBounds) {
        focusedCard.style.setProperty('--tilt-x',(-Math.max(-1,Math.min(1,(pointer.y-cardBounds.top)/cardBounds.height*2-1))*1.5).toFixed(2)+'deg');
        focusedCard.style.setProperty('--tilt-y',(Math.max(-1,Math.min(1,(pointer.x-cardBounds.left)/cardBounds.width*2-1))*1.8).toFixed(2)+'deg');
      }
    });
  });
  root.addEventListener('pointerleave',resetPointer);
  reduced.addEventListener('change',motion);
  narrow.addEventListener('change',galleryState);
  fine.addEventListener('change',resetPointer);
  document.addEventListener('visibilitychange',motion);
  window.addEventListener('storage',event => { if (event.key === 'bodyquest-v1') { browserReduced = readProfile().value?.motion === true; motion(); } });
  const backdrop = root.querySelector('.gate-scene');
  const fallback = () => { backdrop.hidden = true; root.classList.add('gate-art-fallback'); };
  backdrop.addEventListener('error',fallback);
  if (backdrop.complete && backdrop.naturalWidth === 0) fallback();
  window.addEventListener('pagehide',() => { clearTimeout(timer); resetPointer(); });
  window.addEventListener('pageshow',event => { if (event.persisted) { if (opening) setBusy(false); if (switching) roles(); motion(); } });
  motion(); galleryState();
  /* The entry page must not reload in the middle of typing when a new worker
     takes control. Existing app pages keep their original PWA behavior. */
  if ('serviceWorker' in navigator && !new URLSearchParams(location.search).has('nosw') && (location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname))) {
    window.addEventListener('load',() => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
