/* A standalone six-system field lab. Skeletal-world clinical cases stay separate. */
(() => {
  'use strict';
  const cases=window.InneruDetectiveCases,tools=window.InneruDetectiveTools;
  const rewardId=c=>'detective2-'+c.id;
  const earned=c=>state.rewards.includes(rewardId(c));
  const e=esc;
  let disposeCurrent=()=>{};
  function caseMarkup(c,i,m,practice) {
    return `<header class="dd-case-heading"><div><span class="dd-kicker">FILE 0${i+1} / ${c.system.toUpperCase()} SYSTEM</span><h2>${c.title}</h2><p>${c.method}</p></div><button type="button" class="dd-text-button" data-dd-act-restart>Restart this investigation</button></header><nav class="dd-case-steps" aria-label="Investigation steps"><button type="button" data-dd-act-scroll="dd-observe">01 · Observe the evidence</button><button type="button" data-dd-act-scroll="dd-pin-board">02 · Pin your strongest clues</button><button type="button" data-dd-act-scroll="dd-conclude">03 · File a supported conclusion</button></nav><div class="dd-case-grid" id="dd-observe"><aside class="dd-brief"><figure><img src="${c.image}" alt="${c.alt}" width="880" height="587" decoding="async"><figcaption>ANATOMY CONTEXT / ENLARGED TEACHING STUDY</figcaption></figure><h3>The mystery</h3><p>${c.story}</p><details class="dd-anatomy-note"><summary>Anatomy field note</summary><p>${c.anatomy}</p></details><div class="dd-objective"><span class="dd-kicker">YOUR INVESTIGATION</span><p>${c.mission}</p></div></aside><section class="dd-bench" aria-labelledby="dd-bench-title"><header><div><span class="dd-kicker">INTERACTIVE EVIDENCE BENCH</span><h3 id="dd-bench-title">${c.method}</h3></div><span class="dd-bench-status" data-dd-bench-status>Collect observations</span></header><div class="dd-tool" data-dd-tool="${c.id}">${tools.markup(c.id)}</div></section></div><div class="dd-reasoning"><section class="dd-pin-board" id="dd-pin-board" aria-labelledby="dd-evidence-title"><header><span class="dd-kicker">SEPARATE OBSERVATION FROM ASSUMPTION</span><h3 id="dd-evidence-title">Pin two strong pieces of evidence.</h3><p>Use results and controls. An assertion is not an observation.</p></header><div class="dd-evidence-grid" role="group" aria-label="Evidence cards">${c.evidence.map(([text,source],n)=>`<button type="button" data-dd-act-pin="${n}" aria-pressed="${m.pins.has(n)}"><span>${source}</span><strong>${text}</strong><b aria-hidden="true">${m.pins.has(n)?'✓':'+'}</b></button>`).join('')}</div><p class="dd-pin-count" data-dd-pin-count role="status">${m.pins.size} / 2 evidence cards pinned</p><label class="dd-label" for="dd-notebook">Your field note <small>optional · included when you file and share this investigation</small></label><textarea id="dd-notebook" rows="3" placeholder="I observed… This supports… It does not prove…">${e(m.note||'')}</textarea></section><section class="dd-conclusion" id="dd-conclude" aria-labelledby="dd-conclusion-title"><span class="dd-kicker">MAKE THE SCIENCE CASE</span><h3 id="dd-conclusion-title">Which conclusion survives the evidence?</h3><div class="dd-claim-choices" role="group" aria-label="Supported conclusion">${c.claims.map((text,n)=>`<button type="button" data-dd-act-claim="${n}" aria-pressed="${m.claim===n}"><b>${'ABC'[n]}</b><span>${text}</span></button>`).join('')}</div><h4>Where does the evidence stop?</h4><div class="dd-limit-choices" role="group" aria-label="Limits of the conclusion">${c.limits.map((text,n)=>`<button type="button" data-dd-act-limit="${n}" aria-pressed="${m.limit===n}">${text}</button>`).join('')}</div><button type="button" class="dd-button dd-file" data-dd-act-file>${practice?'Check practice conclusion':'File investigation · +30 XP'}</button><div class="dd-verdict" data-dd-verdict role="status"></div></section></div>`;
  }
  detective=function() {
    disposeCurrent();
    const practice=new URLSearchParams(location.hash.split('?')[1]||'').get('preview')==='1';
    const localSolved=new Set(),memory=cases.map(()=>({pins:new Set(),claim:null,limit:null,note:'',tool:{}}));
    layout(`<section class="dd-page" aria-label="Body Detective six-system investigations"><section class="dd-hero"><div class="dd-hero-copy"><span class="dd-kicker">BODY DETECTIVE / SIX-SYSTEM FIELD LAB</span><h1>Every clue.<br><em>A new discovery.</em></h1><p>Run experiments. Audit the records. Build a conclusion that the evidence can support.</p><div class="dd-hero-actions"><button type="button" class="dd-button" data-dd-act-open-board>Open the investigations ↓</button><a href="${practice?'#detective':'#detective?preview=1'}">${practice?'Return to expedition →':'Free practice →'}</a></div><div class="dd-hero-stats"><span><b>06</b>BODY SYSTEMS</span><span><b>06</b>DISTINCT INVESTIGATIONS</span><span><b>${practice?'PRACTICE':'180 XP'}</b>${practice?'NO SAVED CHANGES':'AVAILABLE ONCE'}</span></div></div><figure><img src="assets/detective/hero.webp" width="1536" height="1024" alt="Student investigator examining evidence beside separate models of skin, spine, smooth muscle, lungs, heart and kidney."></figure></section>${practice?'<div class="dd-practice">FREE PRACTICE · All six investigations are open. Findings, XP and saved progress stay unchanged.</div>':''}<header class="dd-gallery-heading" id="dd-investigations"><div><span class="dd-kicker">CHOOSE ANY OPEN FILE</span><h2>Six systems. Six different mysteries.</h2><p>Fictional teaching datasets. Gather observations, assess the evidence and test a claim.</p></div><div class="dd-gallery-actions"><span data-dd-total></span><button type="button" class="dd-text-button" data-dd-act-motion aria-pressed="false">Pause visual motion</button></div></header><div class="dd-case-tabs" role="tablist" aria-label="Choose a system investigation">${cases.map((c,i)=>`<button type="button" role="tab" id="dd-file-tab-${i}" data-dd-act-case="${i}" aria-controls="dd-case-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><span class="dd-card-art"><img src="${c.image}" width="440" height="294" alt="" loading="lazy"><b>0${i+1}</b></span><span class="dd-kicker">${c.system.toUpperCase()}</span><strong>${c.title}</strong><small>${c.method}</small><span class="dd-card-state" data-dd-card-state="${i}">Open investigation</span></button>`).join('')}</div><section id="dd-case-panel" role="tabpanel" aria-labelledby="dd-file-tab-0"></section><section class="dd-journal" aria-labelledby="dd-journal-title"><div><span class="dd-kicker">YOUR INVESTIGATOR’S JOURNAL</span><h2 id="dd-journal-title">Follow evidence across the whole body.</h2><p data-dd-journal-text></p></div><div class="dd-journal-stamps" aria-label="Investigation record">${cases.map((c,i)=>`<span data-dd-stamp="${i}"><b>0${i+1}</b>${c.system}</span>`).join('')}</div></section></section>`,'detective');
    document.title='InnerU · Body Detective'+(practice?' · Free practice':'');
    const root=document.querySelector('.dd-page'),panel=root.querySelector('#dd-case-panel');
    const controller=new AbortController(),events={signal:controller.signal},media=matchMedia('(prefers-reduced-motion: reduce)');
    let active=0,cleanupBench=()=>{},paused=false,dead=false;
    const isSolved=c=>practice?localSolved.has(c.id):earned(c);
    function progress() {
      const count=cases.filter(isSolved).length;
      root.querySelector('[data-dd-total]').textContent=count+' / 6 '+(practice?'practice files checked':'investigations filed');
      cases.forEach((c,i)=>{root.querySelector('[data-dd-card-state="'+i+'"]').textContent=isSolved(c)?'✓ '+(practice?'Practice checked':'Investigation filed'):'Open investigation';root.querySelector('[data-dd-stamp="'+i+'"]').classList.toggle('dd-is-filed',isSolved(c));root.querySelector('[data-dd-act-case="'+i+'"]').classList.toggle('dd-is-filed',isSolved(c));});
      root.querySelector('[data-dd-journal-text]').textContent=count===6?(practice?'You have explored the full practice collection. Your saved learning record is unchanged.':'All six investigations filed. All-Systems Investigator earned. Revisit any file to test your reasoning again.'):count+' of 6 systems investigated. Each case adds a different kind of scientific evidence to your journal.';
    }
    function motion() {
      const reduced=media.matches||document.body.classList.contains('motionoff');
      root.dataset.ddMotion=paused||reduced?'off':'on';
      const b=root.querySelector('[data-dd-act-motion]');b.disabled=reduced;b.textContent=reduced?'Reduced motion':paused?'Play visual motion':'Pause visual motion';b.setAttribute('aria-pressed',String(paused||reduced));
    }
    const canAnimate=()=>!dead&&!paused&&!media.matches&&!document.body.classList.contains('motionoff')&&!document.hidden;
    function show(i) {
      cleanupBench();active=i;
      root.dataset.ddCase=cases[i].id;
      panel.innerHTML=caseMarkup(cases[i],i,memory[i],practice);
      panel.setAttribute('aria-labelledby','dd-file-tab-'+i);
      root.querySelectorAll('[data-dd-act-case]').forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;});
      cleanupBench=tools.mount(panel.querySelector('.dd-tool'),cases[i].id,memory[i].tool,ready=>{const label=panel.querySelector('[data-dd-bench-status]');label.textContent=ready?'✓ Observations collected':'Collect observations';label.classList.toggle('dd-ready',ready);},canAnimate);
      if(isSolved(cases[i]))panel.querySelector('[data-dd-verdict]').innerHTML='<div class="dd-success">✓ This '+(practice?'practice file was checked':'investigation is already filed')+'. Review the bench and try a fresh explanation without earning duplicate XP.</div>';
    }
    function verdict() {
      const c=cases[active],m=memory[active],area=panel.querySelector('[data-dd-verdict]');
      if(!m.tool.ready){area.innerHTML='<div class="dd-retry">Complete the observation goal on the evidence bench first. You can browse every file freely.</div>';return;}
      if(m.pins.size!==2||m.claim===null||m.limit===null){area.innerHTML='<div class="dd-retry">Pin two evidence cards, choose your conclusion and identify its limit before filing.</div>';return;}
      const pins=c.pins.every(n=>m.pins.has(n));
      window.InneruEvidence?.record({id:'detective:'+c.id,system:({Integumentary:'integumentary',Skeletal:'skeletal',Muscular:'muscle',Respiratory:'respiratory',Circulatory:'circ',Excretory:'excretory'})[c.system]||'extra',kind:'investigation',title:c.title,prompt:c.mission,answer:'Evidence: '+[...m.pins].map(n=>c.evidence[n][0]).join(' · ')+'\nConclusion: '+c.claims[m.claim]+'\nLimit: '+c.limits[m.limit]+(m.note?'\nField note: '+m.note:''),expected:c.solution,correct:pins&&m.claim===c.answer&&m.limit===c.limit,feedback:'Evidence, supported conclusion and its limit are checked together.'});
      if(!pins||m.claim!==c.answer||m.limit!==c.limit){area.innerHTML='<div class="dd-retry">Revisit '+[!pins?'the distinction between observations, controls and assertions':'',m.claim!==c.answer?'the claim supported by the actual comparison':'',m.limit!==c.limit?'what the evidence cannot establish':''].filter(Boolean).join('; ')+'. Your case stays open for another attempt.</div>';return;}
      const already=isSolved(c);
      if(practice)localSolved.add(c.id);else if(!already)reward(rewardId(c),30);
      progress();
      area.innerHTML=`<div class="dd-success"><span class="dd-kicker">${practice?'PRACTICE CONCLUSION CHECKED':already?'INVESTIGATION REVIEWED':'INVESTIGATION FILED / +30 XP'}</span><h4>Evidence over assumption.</h4><p>${c.solution}</p>${active<5?'<button type="button" class="dd-button dd-line" data-dd-act-next>Explore the next open file →</button>':'<p>Revisit any open file from the board above.</p>'}</div>`;
    }
    root.addEventListener('click',event=>{
      const b=event.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-dd-act-case')){show(+b.dataset.ddActCase);return;}
      if(b.hasAttribute('data-dd-act-open-board')){const target=root.querySelector('#dd-investigations');target.tabIndex=-1;target.scrollIntoView({behavior:canAnimate()?'smooth':'instant',block:'start'});target.focus({preventScroll:true});return;}
      if(b.hasAttribute('data-dd-act-scroll')){const target=panel.querySelector('#'+b.dataset.ddActScroll);target.tabIndex=-1;target.scrollIntoView({behavior:canAnimate()?'smooth':'instant',block:'start'});target.focus({preventScroll:true});return;}
      if(b.hasAttribute('data-dd-act-motion')){paused=!paused;motion();return;}
      if(b.hasAttribute('data-dd-act-restart')){memory[active]={pins:new Set(),claim:null,limit:null,note:'',tool:{}};show(active);return;}
      if(b.hasAttribute('data-dd-act-next')){show(Math.min(5,active+1));root.querySelector('[data-dd-act-case="'+active+'"]').focus({preventScroll:true});panel.scrollIntoView({behavior:canAnimate()?'smooth':'instant',block:'start'});return;}
      const m=memory[active];
      if(['data-dd-act-pin','data-dd-act-claim','data-dd-act-limit'].some(a=>b.hasAttribute(a)))panel.querySelector('[data-dd-verdict]').textContent='';
      if(b.hasAttribute('data-dd-act-pin')){const n=+b.dataset.ddActPin;if(m.pins.has(n))m.pins.delete(n);else if(m.pins.size<2)m.pins.add(n);else{panel.querySelector('[data-dd-pin-count]').textContent='Two cards are already pinned. Unpin one before choosing another.';return;}panel.querySelectorAll('[data-dd-act-pin]').forEach(x=>{const yes=m.pins.has(+x.dataset.ddActPin);x.setAttribute('aria-pressed',String(yes));x.querySelector('b').textContent=yes?'✓':'+';});panel.querySelector('[data-dd-pin-count]').textContent=m.pins.size+' / 2 evidence cards pinned';}
      else if(b.hasAttribute('data-dd-act-claim')){m.claim=+b.dataset.ddActClaim;panel.querySelectorAll('[data-dd-act-claim]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}
      else if(b.hasAttribute('data-dd-act-limit')){m.limit=+b.dataset.ddActLimit;panel.querySelectorAll('[data-dd-act-limit]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}
      else if(b.hasAttribute('data-dd-act-file'))verdict();
    },events);
    panel.addEventListener('input',event=>{if(event.target.id==='dd-notebook')memory[active].note=event.target.value;},events);
    root.querySelector('.dd-case-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?5:(active+(event.key==='ArrowRight'?1:5))%6;show(next);root.querySelector('[data-dd-act-case="'+next+'"]').focus();},events);
    media.addEventListener('change',motion,events);
    const prefs=new MutationObserver(motion);prefs.observe(document.body,{attributes:true,attributeFilter:['class']});
    const removal=new MutationObserver(()=>{if(!root.isConnected)dispose();});removal.observe(document.getElementById('app'),{childList:true});
    function dispose(){if(dead)return;dead=true;cleanupBench();controller.abort();prefs.disconnect();removal.disconnect();}
    disposeCurrent=dispose;motion();show(0);progress();
  };
  const previousBadges=badges;
  badges=function(){
    previousBadges();const main=document.getElementById('main');if(!main||main.querySelector('.dd-collection-badge'))return;
    const legacy=[...main.querySelectorAll('.badge')].find(b=>b.querySelector('h3')?.textContent==='MEDICAL INVESTIGATOR');
    legacy?.querySelectorAll('a[href="#detective"]').forEach(a=>a.href='#mission/7');
    const count=cases.filter(earned).length,done=count===6,card=document.createElement('article');
    card.className='badge dd-collection-badge '+(done?'':'locked');
    card.innerHTML=`${medal(2,done)}<h3>ALL-SYSTEMS INVESTIGATOR</h3><p>File six distinct evidence investigations across the six body systems.</p><b class="micro">${done?'EARNED':count+' / 6 FILED'}</b><a class="textlink" href="#detective">Open the field lab →</a>`;
    main.querySelector('footer').before(card);
    const tiles=[...main.querySelectorAll('.badge')],total=main.querySelector('.cap-total');if(total)total.innerHTML=`<b>${tiles.filter(b=>!b.classList.contains('locked')).length}</b> of <b>${tiles.length}</b> discoveries unlocked across the six worlds.`;
  };
})();
