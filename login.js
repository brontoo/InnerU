/* InnerU discovery entry. Roles choose existing public workspaces, not permissions. */
(() => {
  'use strict';
  const root = document.querySelector('.iu-gate');
  const grid = root.querySelector('.gate-role-grid');
  const panel = root.querySelector('#gate-entry-panel');
  const dialog = root.querySelector('dialog');
  const support = root.querySelector('.gate-welcome > p');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 1100px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const arrows = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
  const discoveries = {
    explore:{title:'Follow your curiosity.',text:'Choose Student to open your learning dashboard. Explore at your own pace and return to the discoveries you want to understand more deeply.',tip:'A good adventure starts with a question. What will you discover today?'},
    learn:{title:'Look closer. Make connections.',text:'Investigate, experiment and use the evidence. Your next discovery can begin with a new question or a familiar idea seen in a different way.',tip:'Take your time. Explaining why something happens is part of the discovery.'},
    grow:{title:'Every discovery is a step forward.',text:'Completed tasks earn the points and achievements shown in your dashboard. Exploring this welcome page does not change your learning record.',tip:'Your progress belongs to you. Continue on this browser whenever you are ready.'},
    help:{title:'Your adventure starts here.',text:'Students can continue to their learning dashboard and optionally choose a nickname. Teachers can open classroom tools and use progress codes. Everything uses the existing browser-based entry.',tip:'Saved progress stays in this browser. Your teacher can help you use a progress code on another device.'}
  };
  const greetings = ['Your next discovery starts with a question!','Big discoveries begin with little steps.','Stay curious. You’ve got this!','Ready when you are, explorer!'];
  let greetingIndex = 0;
  let companionAnimation = null;
  let role = null;
  let draftName = null;
  let paused = false;
  let switching = false;
  let opening = false;
  let timer = 0;
  let frame = 0;
  let pointer = {x:0,y:0};
  let focusedCard = null;
  let cardBounds = null;
  let discoveryOpener = null;

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
    button.querySelector('[data-motion-label]').textContent = forced ? 'Reduced motion' : paused ? 'Play animations' : 'Reduce motion';
    if (!canMove()) { resetPointer(); companionAnimation?.cancel(); }
  }
  function progressLabel(value) {
    if (!value) return 'A fresh journey is waiting for you.';
    const xp = Number.isFinite(Number(value.xp)) ? Math.max(0,Number(value.xp)) : 0;
    return new Intl.NumberFormat('en').format(xp) + ' XP saved here · Your next discovery awaits';
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
    support.textContent = 'Choose your mission role and let’s explore!';
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
      panel.innerHTML = `<button type="button" class="gate-back" data-back-roles>← Choose another role</button><span class="gate-panel-label">${student?'STUDENT / BODY EXPLORER':'TEACHER / MISSION GUIDE'}</span><h2 id="gate-panel-title" tabindex="-1">${student?'Your next discovery awaits.':'Welcome to your Teacher Area.'}</h2><p class="gate-panel-intro">${student?'Continue your InnerU adventure with the learning profile saved on this browser.':'Open your classroom dashboard to review shared learning records, submitted answers and achievements.'}</p><div class="gate-entry-facts">${student?`<span class="gate-saved-indicator" aria-hidden="true"></span><p data-profile-summary></p>`:'<span>PROGRESS CODES</span><i aria-hidden="true"></i><span>STUDENT RECORDS</span><i aria-hidden="true"></i><span>SHARED-DEVICE TOOLS</span>'}</div><form id="gate-entry-form" novalidate>${student?'<div class="gate-field"><label for="entry-nickname">Your first name or nickname <small>optional</small></label><input id="entry-nickname" name="nickname" type="text" maxlength="24" autocomplete="nickname" aria-describedby="entry-name-help entry-error" placeholder="What should we call you?"><span id="entry-name-help">Keep your existing name, or choose a nickname for this device.</span></div>':''}<p id="entry-error" class="gate-entry-error" role="alert"></p><button type="submit" class="gate-enter gate-submit"><span data-submit-label>${student?'OPEN MY DASHBOARD':'OPEN TEACHER DASHBOARD'}</span><span class="gate-opening-spinner" aria-hidden="true"></span>${arrows}</button><button type="button" class="gate-continue-unchanged" data-continue-unchanged hidden>Open the dashboard without changing my name ${arrows}</button></form><p class="gate-panel-local">${student?'Your progress, XP and achievements stay on this device.':'Teacher tools use this browser’s class list and shared-device progress.'}</p>`;
      if (student) {
        panel.querySelector('[data-profile-summary]').textContent = progressLabel(current.value);
        panel.querySelector('#entry-nickname').value = draftName ?? (typeof current.value?.name === 'string' && current.value.name !== 'Explorer' ? current.value.name.slice(0,24) : '');
        if (current.invalid) panel.querySelector('#entry-error').textContent = 'Saved progress could not be read. You can open the dashboard without changing your name.';
        if (current.unavailable) panel.querySelector('#entry-error').textContent = 'Browser saving is unavailable. You can still open your dashboard.';
        if (current.invalid || current.unavailable) panel.querySelector('[data-continue-unchanged]').hidden = false;
      }
      support.textContent = student ? 'Keep exploring the extraordinary world inside you.' : 'Inspire your explorers. Celebrate every discovery.';
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
    label.textContent = busy ? 'OPENING YOUR WORKSPACE…' : role === 'student' ? 'OPEN MY DASHBOARD' : 'OPEN TEACHER DASHBOARD';
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
  function discovery(id,opener) {
    const item = discoveries[id];
    if (!item) return;
    discoveryOpener = opener;
    dialog.querySelector('[data-discovery-detail]').innerHTML = `<img src="assets/login/quest-companion.webp" alt="" width="520" height="347"><span class="gate-panel-label">A LITTLE ADVENTURE INSPIRATION</span><h2 id="gate-help-title">${item.title}</h2><p>${item.text}</p><p class="gate-help-tip">${item.tip}</p>`;
    dialog.showModal();
  }
  function greet() {
    root.querySelector('[data-companion-message]').textContent = greetings[greetingIndex++ % greetings.length];
    companionAnimation?.cancel();
    if (canMove()) companionAnimation = root.querySelector('[data-companion] img').animate([
      {transform:'translateX(-10px) rotate(0deg)'},
      {transform:'translateX(-10px) translateY(-6px) rotate(-9deg)'},
      {transform:'translateX(-10px) rotate(7deg)'},
      {transform:'translateX(-10px) rotate(0deg)'}
    ],{duration:650,easing:'ease-in-out'});
  }
  root.addEventListener('click',event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-select-role')) entry(button.dataset.selectRole);
    else if (button.hasAttribute('data-back-roles')) roles();
    else if (button.hasAttribute('data-action-motion')) { paused = !paused; motion(); }
    else if (button.hasAttribute('data-discovery')) discovery(button.dataset.discovery,button);
    else if (button.hasAttribute('data-close-discovery')) dialog.close();
    else if (button.hasAttribute('data-companion')) greet();
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
  dialog.addEventListener('close',() => { if (discoveryOpener?.isConnected && !discoveryOpener.closest('[hidden]')) discoveryOpener.focus({preventScroll:true}); });
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
  narrow.addEventListener('change',resetPointer);
  fine.addEventListener('change',resetPointer);
  document.addEventListener('visibilitychange',motion);
  window.addEventListener('storage',event => { if (event.key === 'bodyquest-v1') { browserReduced = readProfile().value?.motion === true; motion(); } });
  const backdrop = root.querySelector('.gate-scene');
  const fallback = () => { backdrop.hidden = true; root.classList.add('gate-art-fallback'); };
  backdrop.addEventListener('error',fallback);
  if (backdrop.complete && backdrop.naturalWidth === 0) fallback();
  window.addEventListener('pagehide',() => { clearTimeout(timer); resetPointer(); companionAnimation?.cancel(); });
  window.addEventListener('pageshow',event => { if (event.persisted) { if (opening) setBusy(false); if (switching) roles(); motion(); } });
  motion();
  /* The entry page must not reload in the middle of typing when a new worker
     takes control. Existing app pages keep their original PWA behavior. */
  if ('serviceWorker' in navigator && !new URLSearchParams(location.search).has('nosw') && (location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname))) {
    window.addEventListener('load',() => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
