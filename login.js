/* InnerU adventure entry: real account sign-in and an animated avatar welcome. */
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
    explore:{title:'Follow your curiosity.',text:'Choose Student to sign in or create your explorer account. Explore at your own pace and return to the discoveries you want to understand more deeply.',tip:'A good adventure starts with a question. What will you discover today?'},
    learn:{title:'Look closer. Make connections.',text:'Investigate, experiment and use the evidence. Your next discovery can begin with a new question or a familiar idea seen in a different way.',tip:'Take your time. Explaining why something happens is part of the discovery.'},
    grow:{title:'Every discovery is a step forward.',text:'Completed tasks earn the points and achievements shown in your dashboard. Exploring this welcome page does not change your learning record.',tip:'Your progress belongs to you. Continue on this browser whenever you are ready.'},
    help:{title:'Your adventure starts here.',text:'Sign in with your email and password, or create an account and choose an explorer avatar. Teachers can use the classroom dashboard after opening the portal.',tip:'Saved progress stays in this browser. Your teacher can help you use a progress code on another device.'}
  };
  const greetings = ['Your next discovery starts with a question!','Big discoveries begin with little steps.','Stay curious. You’ve got this!','Ready when you are, explorer!'];
  let greetingIndex = 0;
  let companionAnimation = null;
  let role = null;
  let draftName = null;
  let draftClass = '';
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
  const A=window.InneruAccount;
  let authMode='login',credentials=null,selectedAvatar=null,authUser=null,carryLocal=true,continueAsStudent=false;
  let accountConfigured=null;
  const service=A.api('session').then(result=>{accountConfigured=result.configured!==false;return result;}).catch(()=>{accountConfigured=false;return {configured:false,authenticated:false};});
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hasLearning=p=>!!(p&&(p.xp||p.done?.length||p.rewards?.length));
  function rememberDraft(){const input=panel.querySelector('#entry-nickname');if(input)draftName=input.value;const choice=panel.querySelector('#entry-class');if(choice)draftClass=choice.value;}
  function clearPassword(){if(credentials)credentials.password='';credentials=null;panel.querySelectorAll('input[type=password],input[data-password]').forEach(el=>el.value='');}
  function roles(){
    if(opening)return;clearTimeout(timer);switching=false;rememberDraft();clearPassword();
    const previous=role;role=null;root.dataset.view='roles';delete root.dataset.role;panel.hidden=true;grid.hidden=false;
    grid.querySelectorAll('[data-card]').forEach(card=>card.classList.remove('is-selected','is-unselected'));
    support.textContent='Choose your mission role and let’s explore!';if(previous)grid.querySelector('[data-select-role="'+previous+'"]').focus({preventScroll:true});resetPointer();
  }
  function shell(title,intro,html){
    grid.hidden=true;panel.hidden=false;root.dataset.view='entry';root.dataset.role=role||'student';
    panel.innerHTML=`<button type="button" class="gate-back" data-back-roles>← Choose another role</button><span class="gate-panel-label">${role==='teacher'?'MISSION GUIDE':'BODY EXPLORER'} / YOUR INNERU ACCOUNT</span><h2 id="gate-panel-title" tabindex="-1">${title}</h2><p class="gate-panel-intro">${intro}</p><div data-account-availability role="status"></div>${html}<p id="entry-error" class="gate-entry-error" role="alert"></p><p class="gate-panel-local">Your chosen avatar follows you into InnerU. Learning progress is saved on this device.</p>`;
    support.textContent='Your next adventure begins with you.';
    panel.querySelector('#gate-panel-title').focus({preventScroll:true});
    service.then(()=>{const status=panel.querySelector('[data-account-availability]');if(status&&accountConfigured===false)status.innerHTML='<p class="gate-account-unavailable">Account sign-in is not available yet. You can still explore the portal from Home.</p>';});
  }
  function localChoice(){const p=readProfile().value;return p&&!p.authUserId&&hasLearning(p)?`<label class="gate-keep-progress"><input type="checkbox" id="entry-keep-progress" ${carryLocal?'checked':''}> Keep my saved learning on this device <small>${new Intl.NumberFormat('en').format(Number(p.xp)||0)} XP · mission progress and badges</small></label>`:'';}
  function passwordField(id,label,kind='current-password'){
    return `<div class="gate-field"><label for="${id}">${label}</label><div class="gate-password-field"><input id="${id}" name="${id}" data-password type="password" autocomplete="${kind}" required minlength="8" maxlength="128" aria-describedby="${kind==='new-password'?'entry-password-help ':''}entry-error"><button type="button" data-password-toggle="${id}" aria-label="Show ${label.toLowerCase()}" aria-pressed="false">Show</button></div></div>`;
  }
  function classField(){
    return `<div class="gate-field"><label for="entry-class">Your class <small>required</small></label><select id="entry-class" name="classCode" required autocomplete="off" aria-describedby="entry-class-help entry-error"><option value="" disabled ${!A.studentClasses.includes(draftClass)?'selected':''}>Select your class</option>${A.studentClasses.map(code=>`<option value="${code}" ${code===draftClass?'selected':''}>${code}</option>`).join('')}</select><small id="entry-class-help" class="gate-class-help">Choose the class you attend. Your teacher will be assigned automatically.</small></div>`;
  }
  function validateClass(){
    const input=panel.querySelector('#entry-class');if(!A.studentClasses.includes(input?.value)){input?.setAttribute('aria-invalid','true');input?.focus();throw new Error('Select your school class to continue.');}draftClass=input.value;return input.value;
  }
  function accountForm(mode='login',email=''){
    authMode=mode;rememberDraft();clearPassword();
    const signup=mode==='signup';
    shell(signup?'Your adventure. Your account.':'Welcome back, explorer.',signup?'Create your account, choose your explorer and make yourself at home.':'Sign in with your email and password. Your next discovery is waiting.',`
      <nav class="gate-auth-tabs" aria-label="Account entry"><button type="button" data-auth-mode="login" aria-current="${signup?'false':'page'}">Sign in</button><button type="button" data-auth-mode="signup" aria-current="${signup?'page':'false'}">Create account</button></nav>
      <form id="gate-entry-form" novalidate><div class="gate-field"><label for="entry-email">Email address</label><input id="entry-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="${safe(email)}" placeholder="you@example.com" aria-describedby="entry-error"></div>
      ${signup?`<div class="gate-field"><label for="entry-nickname">First name or nickname <small>optional</small></label><input id="entry-nickname" name="nickname" type="text" maxlength="24" autocomplete="nickname" value="${safe(draftName??(readProfile().value?.name!=='Explorer'?readProfile().value?.name||'':''))}" placeholder="What should we call you?"></div>`:''}
      ${signup&&role==='student'?classField():''}
      ${passwordField('entry-password','Password',signup?'new-password':'current-password')}${signup?'<p id="entry-password-help" class="gate-password-help">Use at least 8 characters. A longer, unique password is a great start.</p>':''}
      ${signup?passwordField('entry-confirm','Confirm password','new-password'):'<button type="button" class="gate-auth-link" data-auth-mode="recover">Forgot password?</button>'}${localChoice()}
      <button type="submit" class="gate-enter gate-submit"><span data-submit-label>${signup?'CHOOSE MY AVATAR':'SIGN IN & EXPLORE'}</span><span class="gate-opening-spinner" aria-hidden="true"></span>${arrows}</button></form>
      <p class="gate-auth-switch">${signup?'Already have an account?':'New to InnerU?'} <button type="button" class="gate-auth-link" data-auth-mode="${signup?'login':'signup'}">${signup?'Sign in':'Create your account'}</button></p>`);
  }
  function entry(selected){
    if(switching||opening||!['student','teacher'].includes(selected))return;
    switching=true;role=selected;root.dataset.role=selected;root.dataset.view='selecting';
    grid.querySelectorAll('[data-card]').forEach(card=>{card.classList.toggle('is-selected',card.dataset.card===selected);card.classList.toggle('is-unselected',card.dataset.card!==selected);});resetPointer();
    timer=setTimeout(()=>{switching=false;accountForm('login');},canMove()?260:0);
  }
  function setBusy(busy){opening=busy;root.classList.toggle('is-opening',busy);const form=panel.querySelector('form');form?.setAttribute('aria-busy',String(busy));panel.querySelectorAll('button,input,select').forEach(el=>el.disabled=busy);const label=panel.querySelector('[data-submit-label]');if(label)label.textContent=busy?'ONE MOMENT…':authMode==='class'?'SAVE CLASS & EXPLORE':authMode==='avatar'?(credentials?'CREATE ACCOUNT & EXPLORE':'SAVE AVATAR & EXPLORE'):authMode==='signup'?'CHOOSE MY AVATAR':authMode==='recover'?'SEND RESET LINK':authMode==='reset'?'SAVE PASSWORD & EXPLORE':'SIGN IN & EXPLORE';}
  function showError(error){setBusy(false);const node=panel.querySelector('#entry-error');node.textContent=error.message||String(error);node.scrollIntoView({block:'nearest'});}
  function validateEmail(){const input=panel.querySelector('#entry-email');if(!input.value.trim()||!input.checkValidity()){input.setAttribute('aria-invalid','true');input.focus();throw new Error('Enter a valid email address.');}return input.value.trim();}
  function validatePassword(confirm=false){const input=panel.querySelector('#entry-password'),value=input.value;if(value.length<(authMode==='login'?1:8)||value.length>128){input.focus();throw new Error(authMode==='login'?'Enter your password.':'Use a password between 8 and 128 characters.');}if(confirm&&value!==panel.querySelector('#entry-confirm').value){panel.querySelector('#entry-confirm').focus();throw new Error('The passwords do not match yet. Please try again.');}return value;}
  function avatarPicker(){
    authMode='avatar';selectedAvatar=authUser?.avatarId||selectedAvatar||null;
    shell(role==='teacher'?'Choose your mission guide.':'Meet your explorer.','Choose the character that feels like you. A little personality makes every discovery more fun.',`
      <div class="gate-signup-steps" aria-label="Signup progress"><span>✓ Your account details</span><b>02 / Choose your avatar</b></div><form id="gate-avatar-form"><fieldset class="gate-avatar-fieldset"><legend>Choose one avatar</legend><div class="gate-avatar-grid">${A.avatars.map((a,i)=>`<label class="gate-avatar-card" style="--avatar-delay:${i*45}ms"><input type="radio" name="avatar" value="${a.id}" ${selectedAvatar===a.id?'checked':''} required><span class="gate-avatar-portrait">${A.portrait(a.id)}<span class="gate-avatar-tick" aria-hidden="true">✓</span></span><b>${a.name}</b><small>${a.tag}</small></label>`).join('')}</div></fieldset><p class="gate-avatar-cheer" data-avatar-cheer role="status">Your explorer is waiting to meet you.</p><button type="submit" class="gate-enter gate-submit"><span data-submit-label>${credentials?'CREATE ACCOUNT & EXPLORE':'SAVE AVATAR & EXPLORE'}</span><span class="gate-opening-spinner" aria-hidden="true"></span>${arrows}</button>${credentials?'<button type="button" class="gate-auth-link gate-avatar-back" data-avatar-back>← Back to account details</button>':''}</form>`);
    if(selectedAvatar)cheer(selectedAvatar);
  }
  function cheer(id){selectedAvatar=id;const a=A.avatar(id);const note=panel.querySelector('[data-avatar-cheer]');note.textContent=a.name+' is ready. Let’s make a discovery!';panel.querySelectorAll('.gate-avatar-card').forEach(card=>card.classList.toggle('is-picked',card.querySelector('input').value===id));}
  async function finish(user){
    authUser=user;
    if(!['student','teacher','admin'].includes(user?.role))throw new Error('Your account role could not be verified. Please try signing in again.');
    if(!A.avatar(user?.avatarId)){clearPassword();setBusy(false);avatarPicker();return;}
    if(user.role==='student'&&(role==='teacher'||(user.requestedRole==='teacher'&&!continueAsStudent))){clearPassword();setBusy(false);teacherPending();return;}
    if(user.role==='student'&&user.classSelectionRequired){clearPassword();setBusy(false);classSelection();return;}
    A.bindUser(user,{keepLocal:carryLocal});clearPassword();setBusy(true);const label=panel.querySelector('[data-submit-label]');if(label)label.textContent='LET’S EXPLORE…';
    await new Promise(resolve=>setTimeout(resolve,canMove()?220:0));location.assign('index.html#'+A.destination(user));
  }
  function classSelection(){
    authMode='class';role='student';draftClass='';
    shell('One class. Your next discovery.','Choose your class to connect your learning with the right teacher. You only need to do this once.',`<form id="gate-class-form" novalidate>${classField()}<button type="submit" class="gate-enter gate-submit"><span data-submit-label>SAVE CLASS & EXPLORE</span><span class="gate-opening-spinner" aria-hidden="true"></span>${arrows}</button></form><button type="button" class="gate-auth-link" data-entry-logout>Sign out</button>`);
  }
  function teacherPending(){
    authMode='teacher-pending';shell('Your teacher workspace. Your verified account.','This account is currently saved as a student in the database. Teacher access needs the school owner’s approval.',`<div class="gate-role-status"><p>Your teacher selection is a request, not a change to your account permissions. Once your teacher role is approved, return here and check again.</p><button type="button" class="gate-enter" data-teacher-request>REQUEST TEACHER ACCESS ${arrows}</button><button type="button" class="gate-auth-link" data-role-refresh>Check my approved role</button><button type="button" class="gate-auth-link" data-student-continue>Continue as a student</button><button type="button" class="gate-auth-link" data-entry-logout>Sign out</button><p role="status" data-role-request-status></p></div>`);
  }
  function confirmation(){clearPassword();authMode='confirm';shell('A little check. A big adventure.','Check your email to confirm your account. Your avatar is saved with your signup.',`<div class="gate-confirm-art">${A.portrait(selectedAvatar)}</div><p class="gate-confirm-copy">Open the confirmation link in your inbox. Once confirmed, you’ll go straight to your account’s dashboard.</p><button type="button" class="gate-enter" data-auth-mode="login">BACK TO SIGN IN ${arrows}</button>`);}
  function recovery(reset=false){clearPassword();authMode=reset?'reset':'recover';shell(reset?'A fresh password. A fresh start.':'Let’s get you exploring again.',reset?'Choose a new password for your account.':'Enter your email. If an account exists, you’ll receive a password reset link.',`<form id="gate-recovery-form" novalidate>${reset?passwordField('entry-password','New password','new-password')+passwordField('entry-confirm','Confirm password','new-password')+'<p id="entry-password-help" class="gate-password-help">Use at least 8 characters.</p>':'<div class="gate-field"><label for="entry-email">Email address</label><input id="entry-email" type="email" autocomplete="email" required maxlength="254"></div>'}<button class="gate-enter gate-submit" type="submit"><span data-submit-label>${reset?'SAVE PASSWORD & EXPLORE':'SEND RESET LINK'}</span><span class="gate-opening-spinner" aria-hidden="true"></span>${arrows}</button><button type="button" class="gate-auth-link" data-auth-mode="login">Back to sign in</button></form>`);}
  async function openWorkspace(){
    if(opening||!role)return;
    panel.querySelector('#entry-error').textContent='';
    try{
      if(authMode==='class'){
        const classCode=validateClass();setBusy(true);
        const response=await fetch('/api/learning?action=select-class',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({classCode})});
        const data=await response.json();if(!response.ok)throw new Error(data.error||'Your class could not be saved. Please try again.');
        const result=await A.api('session');if(!result.authenticated)throw new Error('Please sign in again to finish selecting your class.');await finish(result.user);return;
      }
      if(authMode==='avatar'){
        const id=panel.querySelector('input[name=avatar]:checked')?.value;if(!A.avatar(id))throw new Error('Choose an avatar to continue.');selectedAvatar=id;setBusy(true);
        if(credentials){const result=await A.api('signup',{...credentials,avatarId:id,requestedRole:role});if(result.authenticated)await finish(result.user);else{setBusy(false);confirmation();}}
        else{const local=A.readProfile();const result=await A.api('avatar',{avatarId:id,name:local?.authUserId===authUser?.id?local.name:authUser?.name||'Explorer'});await finish(result.user);}return;
      }
      if(authMode==='reset'){const pass=validatePassword(true);setBusy(true);const result=await A.api('password',{password:pass});await finish(result.user);return;}
      const email=validateEmail();
      if(authMode==='recover'){setBusy(true);await A.api('recover',{email});setBusy(false);const message=panel.querySelector('#entry-error');message.textContent='If this email has an account, a reset link is on its way. Check your inbox.';message.classList.add('is-success');return;}
      const pass=validatePassword(authMode==='signup');carryLocal=panel.querySelector('#entry-keep-progress')?.checked??false;
      if(authMode==='signup'){const name=panel.querySelector('#entry-nickname').value.trim();if(name.length>24||/[\u0000-\u001f\u007f]/.test(name))throw new Error('Use up to 24 characters for your nickname.');const classCode=role==='student'?validateClass():undefined;draftName=name;credentials={email,password:pass,name:name||'Explorer',...(classCode?{classCode}:{})};avatarPicker();return;}
      setBusy(true);const result=await A.api('login',{email,password:pass});if(!result.authenticated)throw new Error('Please confirm your email before signing in.');await finish(result.user);
    }catch(error){showError(error);}
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||opening)return;
    if(button.dataset.authMode){const email=panel.querySelector('#entry-email')?.value||'';if(button.dataset.authMode==='recover')recovery();else accountForm(button.dataset.authMode,email);}
    if(button.hasAttribute('data-avatar-back')){const email=credentials?.email||'';accountForm('signup',email);}
    if(button.dataset.passwordToggle){const input=panel.querySelector('#'+button.dataset.passwordToggle),visible=input.type==='password';input.type=visible?'text':'password';button.textContent=visible?'Hide':'Show';button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',(visible?'Hide':'Show')+' password');}
    if(button.hasAttribute('data-teacher-request')){button.disabled=true;fetch('/api/learning?action=request-teacher',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);panel.querySelector('[data-role-request-status]').textContent='Teacher access requested. Your school owner can now approve this account.';}).catch(error=>{panel.querySelector('[data-role-request-status]').textContent=error.message||'The request could not be saved.';button.disabled=false;});}
    if(button.hasAttribute('data-role-refresh'))A.api('session').then(s=>finish(s.user)).catch(showError);
    if(button.hasAttribute('data-student-continue')){role='student';continueAsStudent=true;finish({...authUser,requestedRole:'student'}).catch(showError);}
    if(button.hasAttribute('data-entry-logout'))A.api('logout',{}).then(()=>location.assign('login.html')).catch(showError);
  });
  panel.addEventListener('change',event=>{if(event.target.name==='avatar')cheer(event.target.value);if(event.target.id==='entry-keep-progress')carryLocal=event.target.checked;if(event.target.id==='entry-class'){draftClass=event.target.value;event.target.removeAttribute('aria-invalid');panel.querySelector('#entry-error').textContent='';}});
  panel.addEventListener('keydown',event=>{
    if(event.target.name!=='avatar'||!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();const inputs=[...panel.querySelectorAll('input[name=avatar]')],i=inputs.indexOf(event.target),delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:event.key==='ArrowDown'?3:-3;
    const columns=getComputedStyle(panel.querySelector('.gate-avatar-grid')).gridTemplateColumns.split(' ').length;
    const step=event.key==='ArrowDown'?columns:event.key==='ArrowUp'?-columns:delta;
    const n=event.key==='Home'?0:event.key==='End'?inputs.length-1:(i+step+inputs.length)%inputs.length;inputs[n].checked=true;inputs[n].focus();inputs[n].scrollIntoView({block:'nearest'});cheer(inputs[n].value);
  });
  window.addEventListener('pagehide',clearPassword);
  async function callback(){
    const url=new URL(location.href),hash=new URLSearchParams(url.hash.slice(1));
    const accessToken=hash.get('access_token'),refreshToken=hash.get('refresh_token'),tokenHash=url.searchParams.get('token_hash'),type=url.searchParams.get('type')||hash.get('type');
    if(accessToken||tokenHash||hash.get('error')){
      role='student';for(const key of ['token_hash','type','code'])url.searchParams.delete(key);url.hash='';history.replaceState(null,'',url.pathname+url.search);
      shell('Getting your adventure ready.','Confirming your account…','<p class="gate-auth-pending" role="status">One moment, explorer.</p>');
      try{if(hash.get('error'))throw new Error('This account link has expired. Request a new link and try again.');const result=await A.api('verify',tokenHash?{tokenHash,type:type||'email'}:{accessToken,refreshToken});authUser=result.user;carryLocal=!!(readProfile().value&&!readProfile().value.authUserId);if(type==='recovery')recovery(true);else await finish(result.user);}catch(error){accountForm('login');showError(error);}return;
    }
    const session=await service;
    if(!session.authenticated&&['student','teacher'].includes(url.searchParams.get('role')))entry(url.searchParams.get('role'));
    if(session.authenticated){authUser=session.user;role='student';carryLocal=!!(readProfile().value&&!readProfile().value.authUserId);if(url.searchParams.get('avatar')==='1')avatarPicker();else try{await finish(session.user);}catch(error){accountForm('login');showError(error);}}
  }
  callback();
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
