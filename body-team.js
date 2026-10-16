/* System Connections: explore a response, build a team, explain the science.
   The original six matches, written comparison and once-only 35 XP remain. */
(() => {
  'use strict';
  const team = [
    {name:'Respiratory',short:'Oxygen in',image:'04-oxygen',role:'Oxygen intake',verb:'Exchange',alt:'Anatomical lungs, branching bronchi and the diaphragm beneath them.',structure:'Alveoli + diaphragm',text:'The diaphragm and chest muscles ventilate the lungs. Across the thin alveolar barrier, oxygen enters blood and carbon dioxide leaves it.',rest:'Ventilation supports resting energy demand.',jog:'Breaths become faster and deeper to support activity.',run:'Ventilation generally increases further as exercise demand rises.',heat:'Breathing still supports gas exchange; sweating is the main adjustable cooling response here.',choices:['Oxygen crosses from alveoli to blood','Oxygen is made inside the lungs'],correct:0,why:'Oxygen diffuses from alveolar air into pulmonary capillary blood. Lungs exchange gases; they do not manufacture oxygen.'},
    {name:'Circulatory',short:'Deliver the cargo',image:'05-transport',role:'Oxygen transport',verb:'Transport',alt:'Detailed heart cutaway showing chambers, valves and major blood vessels.',structure:'Heart + blood vessels',text:'The right heart pumps toward the lungs; the left heart pumps toward the body. Blood delivers oxygen and nutrients and carries carbon dioxide away.',rest:'The heart maintains circulation at rest.',jog:'Heart rate and cardiac output generally increase.',run:'Greater cardiac output helps supply working muscles.',heat:'Skin blood flow can increase to move heat toward the surface.',choices:['Blood delivers oxygen to working muscles','Blood skips the heart during exercise'],correct:0,why:'The pulmonary and systemic circuits remain connected in series through the heart. Exercise does not create a shortcut around either pump.'},
    {name:'Muscular',short:'Make the move',image:'03-power',role:'Movement through contraction',verb:'Pull',alt:'Anatomical flexed arm showing the muscle bellies and tendons.',structure:'Muscle fibers + tendons',text:'Muscle fibers use ATP to generate force. Tendons transfer that pull to bones, while opposing muscle groups help coordinate movement.',rest:'Postural muscles remain active even when you stand still.',jog:'Repeated contractions move the limbs and use more ATP.',run:'Higher force and contraction demands increase ATP use.',heat:'Working muscles release heat as energy is transferred.',choices:['Muscles push bones directly','Muscles pull on bones through tendons'],correct:1,why:'Muscles generate tension. Tendons carry that pulling force to bones, which act as levers around joints.'},
    {name:'Skeletal',short:'Support the stride',image:'02-framework',role:'Support and leverage',verb:'Support',alt:'Human skeleton and enlarged rib cage, spine and shoulder girdles.',structure:'Bones + joints',text:'Bones provide support and levers. Joints allow movement, cartilage reduces friction and ligaments help stabilize the joints.',rest:'Bones support body weight and protect organs.',jog:'Muscles pull on bones to move the joints through each stride.',run:'The skeleton transfers forces; bones do not actively contract.',heat:'Its support and leverage role continues in warm conditions.',choices:['Bones act as levers at joints','Bones shorten like muscle fibers'],correct:0,why:'Bones are living supporting structures. Muscles provide the pull; joint geometry and bone lengths provide leverage.'},
    {name:'Integumentary',short:'Cool the surface',image:'01-shield',role:'Cooling through sweating',verb:'Cool',alt:'Skin cross-section showing epidermis, dermis, sweat glands, vessels and fat tissue.',structure:'Sweat glands + skin vessels',text:'Eccrine glands deliver sweat to skin pores. Evaporation removes heat; increased skin blood flow can help move heat outward.',rest:'Sweating depends on temperature and other conditions.',jog:'As heat builds, sweating may increase.',run:'More metabolic heat can increase the need for cooling.',heat:'Sweating and skin blood flow generally increase. High humidity can limit evaporation.',choices:['Sweat cools mainly as it evaporates','Sweat cools equally well when it only drips off'],correct:0,why:'Evaporation removes heat from the surface. Sweat that drips off provides less evaporative cooling, and humidity affects how readily sweat evaporates.'},
    {name:'Excretory',short:'Keep water in balance',image:'06-balance',role:'Water conservation and balance',verb:'Balance',alt:'Kidney cutaway showing cortex, medulla, renal pelvis, vessels and ureter.',structure:'Kidneys + nephrons',text:'Nephrons filter blood and adjust the return of useful water and solutes. Hormonal signals, including ADH, help regulate water conservation.',rest:'Kidneys regulate water and solute balance over time.',jog:'As water is lost, hormonal signals can promote conservation.',run:'Increasing water loss can increase the need for water conservation.',heat:'With accumulating sweat loss, ADH can increase water reabsorption over time.',choices:['Kidneys can conserve more water as sweat loss builds','Kidneys instantly replace every drop of sweat'],correct:0,why:'The kidneys regulate water excretion; they do not create replacement water. ADH can increase collecting-duct water permeability as the body responds to water loss.'}
  ];
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
  const image = i => 'assets/home-expedition/' + team[i].image + '.webp';
  let disposeCurrent = () => {};

  function markup() {
    return `<nav class="bt-path" aria-label="Your body-team challenge"><a href="#bt-explore" data-bt-scroll="bt-explore"><b>01</b><span>Explore the response<small data-bt-seen>Six systems to discover</small></span></a><a href="#bt-match" data-bt-scroll="bt-match"><b>02</b><span>Build the team<small data-bt-placed>Six roles to connect</small></span></a><a href="#bt-story" data-bt-scroll="bt-story"><b>03</b><span>Tell the story<small>Connect your discoveries</small></span></a></nav>
      <section class="bt-lab" id="bt-explore" aria-labelledby="bt-lab-title"><header class="bt-lab-heading"><div><span class="bt-kicker">THE BODY TEAM / INTERACTIVE LAB</span><h2 id="bt-lab-title">One run. Six teammates.</h2><p>Change the challenge. Discover the team working inside you.</p></div><button type="button" class="bt-motion" data-bt-motion-toggle aria-pressed="false">Pause visual motion</button></header>
      <div class="bt-scenario"><div><span class="bt-control-label">SET THE PACE</span><div class="bt-pace" role="group" aria-label="Activity level"><button type="button" data-bt-set-pace="0" aria-pressed="false">At rest</button><button type="button" data-bt-set-pace="1" aria-pressed="true">Easy jog</button><button type="button" data-bt-set-pace="2" aria-pressed="false">Faster run</button></div></div><button type="button" class="bt-weather" data-bt-weather-toggle aria-pressed="true"><span aria-hidden="true">☀</span><span>Hot weather<small data-bt-weather-label>Cooling demand is higher</small></span><i aria-hidden="true"></i></button></div>
      <div class="bt-lab-grid"><figure class="bt-specimen"><div class="bt-specimen-art"><img width="880" height="587" decoding="async" alt=""><span class="bt-specimen-number" aria-hidden="true">01</span><div class="bt-response-signal" aria-hidden="true"><i></i><i></i><i></i></div></div><figcaption><span data-bt-structure></span><span>ENLARGED ANATOMY STUDY</span></figcaption></figure><div class="bt-coach"><span class="bt-kicker" data-bt-team-label></span><h3 data-bt-title></h3><p data-bt-science></p><div class="bt-response-box" role="status" aria-live="polite"><span class="bt-kicker" data-bt-scenario-label></span><strong data-bt-response></strong><p data-bt-heat></p></div><div class="bt-prediction"><span class="bt-kicker">QUICK THINK / PICK THE SCIENCE</span><div class="bt-prediction-options"></div><p data-bt-prediction-feedback role="status"></p></div></div></div>
      <div class="bt-team-tabs" role="tablist" aria-label="Explore the six body systems">${team.map((s,i)=>`<button type="button" role="tab" id="bt-system-tab-${i}" data-bt-system="${i}" aria-selected="${i===0}" aria-controls="bt-team-panel" tabindex="${i===0?0:-1}"><img src="${image(i)}" width="176" height="117" alt="" loading="lazy"><span>${s.name}</span><small>${s.short}</small><b aria-hidden="true">0${i+1}</b></button>`).join('')}</div><p class="bt-model-note">Explore freely. Responses are qualitative, depend on conditions and are not personal fitness measurements.</p></section>
      <section class="bt-match" id="bt-match" aria-labelledby="bt-match-title"><header class="bt-section-heading"><div><span class="bt-kicker">02 / BUILD THE BODY TEAM</span><h2 id="bt-match-title">Every teammate has a job.</h2><p>Tap a role, then tap its system. You can also drag a role or use the menus.</p></div><span class="bt-count" data-bt-match-count>0 / 6 placed</span></header><div class="bt-role-bank" role="group" aria-label="Roles to assign">${[4,1,5,0,3,2].map(i=>`<button type="button" draggable="true" data-bt-role="${i}" aria-pressed="false"><span aria-hidden="true">⠿</span>${team[i].role}<b aria-hidden="true"></b></button>`).join('')}</div><p class="bt-match-hint" data-bt-match-hint role="status">Pick a role to start building your team.</p><div class="bt-dock-host"></div><div class="bt-match-actions"><div class="bt-check-host"></div><button type="button" class="bt-reset" data-bt-reset-matches>Reset placements</button></div><div class="bt-feedback-host"></div></section>
      <section class="bt-story" id="bt-story" aria-labelledby="bt-story-title"><div class="bt-story-intro"><span class="bt-kicker">03 / CONNECT THE DISCOVERIES</span><h2 id="bt-story-title">Tell the whole-body story.</h2><p>How do at least three systems help you run on a hot day? Explain how one response helps the next.</p><div class="bt-story-prompts" role="group" aria-label="Story planning prompts">${['Follow the oxygen','Follow the movement','Follow the cooling'].map((x,i)=>`<button type="button" data-bt-prompt="${i}" aria-pressed="${i===0}">${x} ${arrow}</button>`).join('')}</div><p class="bt-story-tip" data-bt-story-tip role="status">Start at the lungs. How does oxygen reach a working muscle, and what does the muscle use it for?</p><span class="bt-story-reward" data-bt-reward>YOUR MISSION / +35 XP</span></div><div class="bt-story-work"><label for="connection-reason">Your team explanation</label><div class="bt-writing-host"></div><div class="bt-writing-meta"><span data-bt-word-count>0 words</span><span>Use your own words</span></div><div class="bt-compare-host"></div><div class="bt-model-host"></div></div></section>`;
  }

  function mount() {
    disposeCurrent();
    const main = document.querySelector('main.connections-exhibit'), old = main?.querySelector('.workgrid');
    if (!old) return;
    const systems = old.querySelector('#systems'), check = old.querySelector('#check-match'), feedback = old.querySelector('#connect-feedback');
    const reason = old.querySelector('#connection-reason'), compare = old.querySelector('#compare'), model = old.querySelector('#connection-model');
    if (!systems || !check || !reason || !compare || !model) return;
    const root = document.createElement('section');
    root.className = 'bt-mission';
    root.setAttribute('aria-label', 'Body team connection challenge');
    root.innerHTML = markup();
    old.before(root);
    main.classList.add('bt-connections');
    root.querySelector('.bt-dock-host').append(systems);
    root.querySelector('.bt-check-host').append(check);
    root.querySelector('.bt-feedback-host').append(feedback);
    root.querySelector('.bt-writing-host').append(reason);
    root.querySelector('.bt-compare-host').append(compare);
    root.querySelector('.bt-model-host').append(model);
    old.remove();
    check.textContent = 'Check my team';
    compare.textContent = 'Compare with a model';
    reason.rows = 6;
    reason.placeholder = 'The lungs… Blood then… This helps the muscles… Meanwhile, the skin…';
    const coach = root.querySelector('.bt-coach');
    coach.id = 'bt-team-panel';
    coach.setAttribute('role', 'tabpanel');
    coach.setAttribute('aria-labelledby', 'bt-system-tab-0');

    const controller = new AbortController(), events = {signal:controller.signal};
    const media = matchMedia('(prefers-reduced-motion: reduce)'), seen = new Set();
    const selects = [...systems.querySelectorAll('select')], originalCheck = check.onclick;
    let selected = 0, pace = 1, hot = true, paused = false, armed = null, validated = false, dead = false;
    const paceNames = ['At rest','Easy jog','Faster run'];
    systems.classList.add('bt-docks');
    [...systems.children].forEach((row,i) => {
      row.classList.add('bt-dock');
      row.dataset.btDock = String(i);
      const label = row.querySelector('label');
      label.textContent = 'Choose the contribution';
      selects[i].setAttribute('aria-label', team[i].name+' System contribution');
      row.prepend(Object.assign(document.createElement('button'), {type:'button',className:'bt-dock-target',innerHTML:`<img src="${image(i)}" alt="" width="176" height="117" loading="lazy"><span><small>TEAM 0${i+1}</small><strong>${team[i].name} System</strong></span><b aria-hidden="true">+</b>`}));
      row.querySelector('button').dataset.btAssign = String(i);
      row.querySelector('button').setAttribute('aria-label', 'Assign selected role to '+team[i].name+' System');
      row.append(Object.assign(document.createElement('span'), {className:'bt-dock-status',textContent:'Waiting for a role'}));
    });

    function motion() {
      const reduced = media.matches || document.body.classList.contains('motionoff');
      root.dataset.btMotion = reduced || paused ? 'off' : 'on';
      const b = root.querySelector('[data-bt-motion-toggle]');
      b.disabled = reduced;
      b.textContent = reduced ? 'Reduced motion' : paused ? 'Play visual motion' : 'Pause visual motion';
      b.setAttribute('aria-pressed', String(reduced || paused));
    }
    function response() {
      const s = team[selected];
      root.dataset.btPace = String(pace);
      root.dataset.btWeather = hot ? 'hot' : 'mild';
      root.style.setProperty('--bt-tempo', ['3s','2s','1.2s'][pace]);
      root.querySelector('[data-bt-scenario-label]').textContent = paceNames[pace]+' / '+(hot?'HOT WEATHER':'MILD WEATHER');
      root.querySelector('[data-bt-response]').textContent = s[['rest','jog','run'][pace]];
      root.querySelector('[data-bt-heat]').textContent = hot ? s.heat : 'Mild weather reduces the environmental heat challenge; the body still produces and loses heat.';
      root.querySelectorAll('[data-bt-set-pace]').forEach(b=>b.setAttribute('aria-pressed', String(+b.dataset.btSetPace===pace)));
      root.querySelector('[data-bt-weather-toggle]').setAttribute('aria-pressed', String(hot));
      root.querySelector('[data-bt-weather-label]').textContent = hot ? 'Cooling demand is higher' : 'Mild conditions selected';
    }
    function showSystem(i, explore = true) {
      selected = i;
      if (explore) seen.add(i);
      const s = team[i], img = root.querySelector('.bt-specimen-art img');
      img.src = image(i); img.alt = s.alt;
      root.dataset.btActive = String(i);
      root.querySelector('.bt-specimen-number').textContent = '0'+(i+1);
      root.querySelector('[data-bt-structure]').textContent = s.structure;
      root.querySelector('[data-bt-team-label]').textContent = 'TEAM 0'+(i+1)+' / '+s.name.toUpperCase()+' SYSTEM';
      root.querySelector('[data-bt-title]').textContent = s.verb+'. Connect. Keep going.';
      root.querySelector('[data-bt-science]').textContent = s.text;
      root.querySelector('[data-bt-prediction-feedback]').textContent = '';
      root.querySelector('.bt-prediction-options').innerHTML = s.choices.map((choice,n)=>`<button type="button" data-bt-predict="${n}" aria-pressed="false">${choice}</button>`)[i%2?'reverse':'slice']().join('');
      coach.setAttribute('aria-labelledby','bt-system-tab-'+i);
      root.querySelectorAll('[data-bt-system]').forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;b.classList.toggle('bt-explored',seen.has(n));});
      root.querySelector('[data-bt-seen]').textContent = seen.size+' / 6 systems explored';
      response();
    }
    function refreshMatches() {
      const filled = selects.filter(s=>s.value!=='').length;
      root.querySelector('[data-bt-placed]').textContent = filled+' / 6 roles placed';
      root.querySelector('[data-bt-match-count]').textContent = validated?'6 / 6 connected':filled+' / 6 placed';
      root.querySelectorAll('[data-bt-role]').forEach(b=>{const used=selects.some(s=>s.value===b.dataset.btRole);b.classList.toggle('bt-role-used',used);b.setAttribute('aria-pressed',String(armed===+b.dataset.btRole));b.querySelector('b').textContent=used?'✓':'';});
      selects.forEach((s,i)=>{const row=s.closest('.bt-dock');row.classList.toggle('bt-has-role',s.value!=='');if(!validated&&!row.hasAttribute('data-bt-result'))row.querySelector('.bt-dock-status').textContent=s.value===''?'Waiting for a role':'Role placed · ready to check';});
    }
    function invalidate() {
      validated = false;
      root.dataset.btMatched = 'false';
      root.querySelectorAll('.bt-dock').forEach(row=>{row.removeAttribute('data-bt-result');row.querySelector('.bt-dock-status').textContent='Waiting for a role';});
      feedback.innerHTML = '';
      const reflect = model.querySelector('#connect-reflect');
      if (reflect) reflect.checked = false;
    }
    function assign(i,value) {
      invalidate();
      if(value!=='') selects.forEach((s,n)=>{if(n!==i&&s.value===value)s.value='';});
      selects[i].value=value;
      armed=null;
      root.querySelector('[data-bt-match-hint]').textContent=value===''?'Role removed. Choose another contribution.':team[+value].role+' placed with the '+team[i].name+' System. Check your team when ready.';
      refreshMatches();
    }
    check.onclick = () => {
      originalCheck();
      validated=selects.every((s,i)=>s.value===String(i));
      root.dataset.btMatched=String(validated);
      selects.forEach((s,i)=>{const row=s.closest('.bt-dock'),result=s.value===''?'empty':s.value===String(i)?'correct':'retry';row.dataset.btResult=result;row.querySelector('.bt-dock-status').textContent=result==='correct'?'✓ Connected correctly':result==='retry'?'↻ Revisit this connection':'Choose a contribution first';});
      refreshMatches();
    };
    selects.forEach((s,i)=>s.addEventListener('change',()=>assign(i,s.value),events));
    model.addEventListener('change',event=>{
      if(event.target.id==='connect-reflect'&&event.target.checked&&(!validated||!selects.every((s,i)=>s.value===String(i)))) {
        event.stopImmediatePropagation();event.target.checked=false;
        toast('Check all six team connections before confirming your reflection.');
      }
    },{capture:true,signal:controller.signal});
    model.addEventListener('change',()=>{if(state.rewards.includes('connection'))root.querySelector('[data-bt-reward]').textContent='✓ SYSTEM THINKER / MISSION EARNED';},events);
    reason.addEventListener('input',()=>{const text=reason.value.trim(),count=text?text.split(/\s+/).length:0;root.querySelector('[data-bt-word-count]').textContent=count+(count===1?' word':' words');},events);

    root.addEventListener('click',event=>{
      const scroll=event.target.closest('[data-bt-scroll]');
      if(scroll){event.preventDefault();const target=root.querySelector('#'+scroll.dataset.btScroll);target.tabIndex=-1;target.scrollIntoView({behavior:root.dataset.btMotion==='off'?'instant':'smooth',block:'start'});target.focus({preventScroll:true});return;}
      const system=event.target.closest('[data-bt-system]');if(system){showSystem(+system.dataset.btSystem);return;}
      const speed=event.target.closest('[data-bt-set-pace]');if(speed){pace=+speed.dataset.btSetPace;response();return;}
      if(event.target.closest('[data-bt-weather-toggle]')){hot=!hot;response();return;}
      if(event.target.closest('[data-bt-motion-toggle]')){paused=!paused;motion();return;}
      const prediction=event.target.closest('[data-bt-predict]');
      if(prediction){const good=+prediction.dataset.btPredict===team[selected].correct;root.querySelectorAll('[data-bt-predict]').forEach(b=>{b.classList.remove('bt-predict-right','bt-predict-retry');b.setAttribute('aria-pressed',String(b===prediction));});prediction.classList.add(good?'bt-predict-right':'bt-predict-retry');root.querySelector('[data-bt-prediction-feedback]').textContent=(good?'✓ Science spotted. ':'Look again. ')+team[selected].why;return;}
      const role=event.target.closest('[data-bt-role]');
      if(role){armed=armed===+role.dataset.btRole?null:+role.dataset.btRole;root.querySelector('[data-bt-match-hint]').textContent=armed===null?'Pick a role to start building your team.':'Now tap the system that contributes: '+team[armed].role+'.';refreshMatches();return;}
      const dock=event.target.closest('[data-bt-assign]');
      if(dock){if(armed===null){root.querySelector('[data-bt-match-hint]').textContent='Choose a role card first, or use this system’s menu.';return;}assign(+dock.dataset.btAssign,String(armed));return;}
      if(event.target.closest('[data-bt-reset-matches]')){selects.forEach(s=>s.value='');armed=null;invalidate();refreshMatches();root.querySelector('[data-bt-match-hint]').textContent='Fresh team board. Choose a role to begin again.';return;}
      const prompt=event.target.closest('[data-bt-prompt]');
      if(prompt){const i=+prompt.dataset.btPrompt;root.querySelectorAll('[data-bt-prompt]').forEach(b=>b.setAttribute('aria-pressed',String(b===prompt)));root.querySelector('[data-bt-story-tip]').textContent=['Start at the lungs. How does oxygen reach a working muscle, and what does the muscle use it for?','Start with a contraction. How do tendons, bones and joints turn a muscle’s pull into a stride?','Start with heat from working muscles. How do skin blood flow, sweat evaporation and kidney water regulation connect?'][i];}
    },events);
    root.addEventListener('dragstart',event=>{const b=event.target.closest('[data-bt-role]');if(!b)return;event.dataTransfer.setData('application/x-inneru-team-role',b.dataset.btRole);event.dataTransfer.effectAllowed='move';},events);
    systems.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('application/x-inneru-team-role')){event.preventDefault();event.dataTransfer.dropEffect='move';}},events);
    systems.addEventListener('drop',event=>{const row=event.target.closest('[data-bt-dock]'),value=event.dataTransfer.getData('application/x-inneru-team-role');if(row&&/^[0-5]$/.test(value)){event.preventDefault();assign(+row.dataset.btDock,value);}},events);
    root.querySelector('.bt-team-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const n=event.key==='Home'?0:event.key==='End'?5:(selected+(event.key==='ArrowRight'?1:5))%6;showSystem(n);root.querySelector('[data-bt-system="'+n+'"]').focus();},events);
    const hero = main.querySelector('#follow-run');
    if(hero)hero.onclick=()=>{const target=root.querySelector('#bt-explore');target.tabIndex=-1;target.scrollIntoView({behavior:root.dataset.btMotion==='off'?'instant':'smooth',block:'start'});target.focus({preventScroll:true});};
    document.addEventListener('visibilitychange',()=>root.classList.toggle('bt-page-hidden',document.hidden),events);
    media.addEventListener('change',motion,events);
    const prefs=new MutationObserver(motion);prefs.observe(document.body,{attributes:true,attributeFilter:['class']});
    const visible=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('bt-in-view',e.isIntersecting)),{rootMargin:'30px'});visible.observe(root.querySelector('.bt-lab'));
    const removal=new MutationObserver(()=>{if(!root.isConnected)dispose();});removal.observe(document.getElementById('app'),{childList:true});
    function dispose(){if(dead)return;dead=true;controller.abort();prefs.disconnect();visible.disconnect();removal.disconnect();}
    disposeCurrent=dispose;
    if(state.rewards.includes('connection'))root.querySelector('[data-bt-reward]').textContent='✓ SYSTEM THINKER / MISSION EARNED';
    showSystem(0,false);refreshMatches();motion();
  }
  const previousConnections=connections;
  connections=function(){previousConnections();mount();};
  if(document.querySelector('main.connections-exhibit .workgrid'))mount();
})();
