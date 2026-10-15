/* Illustrated, anatomy-informed games for the six Living Shield missions. */
(() => {
  'use strict';
  const esc = text => String(text).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const artFiles = ['01-barrier','02-renewal','03-appendages','04-temperature','05-sensation','06-repair','07-living-shield'];
  const art = n => `assets/integ-missions/${artFiles[n-1]}.webp`;
  const studyRatios = ['1 / 2','1 / 1','2 / 3','1 / 2','2 / 3','2 / 3'];
  const studies = [
    ['Several tissues form one skin organ.','Lamellated pressure receptor and its sensory nerve.','Longitudinal fingernail anatomy.'],
    ['Epidermis over dermis and subcutaneous tissue.','Follicle and glands embedded in the dermis.','Basal melanocyte and surrounding keratinocytes.'],
    ['Sebaceous lobules empty into a hair follicle.','Hair bulb, matrix and dermal papilla.','Keratin-rich hair and fingernail structures.'],
    ['Sweat travels from a coiled gland to the surface.','Arrector pili muscle attached to a hair follicle.','An intestinal villus illustrates absorption of calcium markers.'],
    ['The keratinized epidermal surface forms a barrier.','Sensory nerves and receptors in skin.','Melanin gives partial protection against ultraviolet radiation.'],
    ['A fibrin and platelet clot protects a cut.','Three skin sections illustrate increasing burn depth.','Ultraviolet exposure can damage cellular DNA.']
  ];
  const data = [
    {name:'Tissue architects',tag:'MAP & MATCH',intro:'Choose a tissue tile, then place it on the matching numbered structure. Build all four tissue partnerships.',type:'map',total:4,
     pieces:['Epithelial tissue','Connective tissue','Smooth muscle','Nerve tissue'],order:[2,0,3,1],
     targets:[['Outer covering',50,18],['Flexible support',82,51],['Hair-raising fibers',47,41],['Sensory branches',18,55]],
     why:['Epithelial tissue makes the protective outer covering.','Collagen-rich connective tissue supports the skin and gives it strength.','Arrector pili is a small smooth muscle attached to a hair follicle.','Sensory nerves carry information about touch, temperature and pain.']},
    {name:'Layer builders',tag:'ASSEMBLE & RENEW',intro:'Build from the outside inward. Then locate the starting point of epidermal renewal.',type:'layers',total:4,
     pieces:['Epidermis','Dermis','Subcutaneous tissue'],order:[1,2,0],
     why:['The thin, avascular epidermis faces the outside world.','The dermis supports the epidermis and contains vessels, nerves, glands and follicles.','Subcutaneous tissue lies beneath skin proper. Its fat cushions and insulates.']},
    {name:'The route lab',tag:'CONNECT & TRACE',intro:'Give each growing structure or secretion its correct destination. A flowing route will reveal the connection.',type:'rounds',total:4,
     rounds:[
      {title:'Deliver the oil',prompt:'Sebaceous lobules release sebum. Where should it go?',options:['Into the hair follicle','Into a blood capillary','Through the eccrine sweat duct'],answer:0,effect:'sebum',path:'M34 24 C30 25 27 23 27 18',why:'A short sebaceous duct empties into the follicular canal. Sebum lubricates hair and skin.'},
      {title:'Grow the hair',prompt:'New cells form in the hair matrix around the dermal papilla. What do they produce?',options:['The sweat pore','The hair shaft','A nail plate'],answer:1,effect:'hair',path:'M27 44 C24 31 27 17 31 3',why:'Matrix cells divide and differentiate into the keratinized hair and its inner root sheath.'},
      {title:'Send sweat to the surface',prompt:'An eccrine coil secretes sweat. Choose its exit route.',options:['A sebaceous duct into the hair','A nerve to the spinal cord','Its own duct to a surface pore'],answer:2,effect:'sweat',path:'M55 44 C60 38 53 32 55 26 C58 22 54 17 55 11',why:'Eccrine sweat reaches a surface pore through a duct separate from the hair follicle.'},
      {title:'Extend the nail',prompt:'Cells in the nail matrix divide. Which structure grows forward?',options:['The nail plate','The dermal papilla','The sweat coil'],answer:0,effect:'nail',path:'M95 25 C87 23 80 24 74 28',why:'The nail matrix produces the hard keratinized nail plate, which moves over the nail bed.'}
     ]},
    {name:'Climate keeper',tag:'PREDICT & ACTIVATE',intro:'Read the environment, then activate the response that helps the body maintain its internal balance.',type:'rounds',total:3,
     rounds:[
      {title:'A warm afternoon',prompt:'Skin is warm and the air allows sweat to evaporate. Activate the cooling response.',options:['Release oil to cool the surface','Evaporate sweat and widen dermal vessels','Raise the hairs to release heat'],answer:1,effect:'warm',why:'Evaporation removes heat. Vasodilation increases blood flow near the skin surface, helping heat transfer.'},
      {title:'A cold breeze',prompt:'Heat is being lost to cold surroundings. Which response helps conserve it?',options:['Increase sweat secretion','Widen the surface vessels','Narrow dermal vessels; retain insulation'],answer:2,effect:'cold',path:'M7 53 C32 48 56 50 89 49',why:'Vasoconstriction reduces heat loss, and subcutaneous fat insulates. Goose bumps add very little warmth in humans.'},
      {title:'Sunlight reaches the skin',prompt:'Choose the statement that connects a benefit of sunlight with sensible protection.',options:['Skin can begin vitamin D production; excess UV still needs protection','Melanin makes all UV harmless','Sunlight directly turns skin cells into calcium'],answer:0,effect:'sun',why:'Vitamin D supports calcium absorption. Skin tone does not remove the risk of damage from excess UV.'}
     ]},
    {name:'Shield response team',tag:'DETECT & DEFEND',intro:'Match each incoming challenge to the skin structure best suited to respond. Watch the selected system at work.',type:'response',total:4,
     tools:['Keratinized epidermal barrier','Melanin in the epidermis','Sensory receptors and nerves','Dermal blood vessels'],
     rounds:[
      {title:'Keep water in; help keep germs out',prompt:'Which structure forms the main protective surface?',answer:0,effect:'barrier',image:1,why:'The keratinized epidermis limits water loss and helps resist entry by many microbes. It is not an absolute seal.'},
      {title:'Ultraviolet exposure',prompt:'Which pigment absorbs some UV without giving complete immunity?',answer:1,effect:'uv',image:2,why:'Melanin offers partial UV protection. Excess UV can still damage cells in every skin tone.'},
      {title:'Something presses against the skin',prompt:'Which system detects the stimulus and carries sensory information?',answer:2,effect:'nerve',image:5,path:'M37 28 C34 32 31 39 25 45',why:'Sensory receptors and nerve endings detect stimuli. Pacinian corpuscles respond especially to vibration and changes in pressure.'},
      {title:'Adjust heat transfer',prompt:'Which dermal structures can change blood flow near the surface?',answer:3,effect:'blood',image:4,path:'M10 53 C33 48 59 49 89 50',why:'Dermal blood vessels widen or narrow to help adjust heat transfer. The epidermis itself has no blood vessels.'}
     ]},
    {name:'Repair & rescue',tag:'RESTORE & DIAGNOSE',intro:'Follow four repair checkpoints, then use the depth scanner to classify three burn patterns. Healing processes overlap.',type:'repair',total:7,
     pieces:['Clot forms','Defense & cover','Surface closes','Collagen remodels'],order:[2,0,3,1],
     why:['Hemostasis begins: platelets and fibrin help seal the break.','Inflammation helps defend and clear the wound while a clot/scab covers it. These processes overlap.','Epidermal cells migrate and divide to restore the surface while repair tissue develops beneath.','Collagen reorganizes over time. Deeper wounds may leave a scar; repaired tissue is not always identical to the original.'],
     burns:[
      {title:'Redness confined to the epidermis',prompt:'The injury does not extend into the dermis. Choose the usual depth category.',answer:0,why:'A superficial, first-degree burn affects the epidermis.'},
      {title:'Blistering; part of the dermis involved',prompt:'The epidermis and some dermis are injured. Choose the usual depth category.',answer:1,why:'A partial-thickness, second-degree burn extends into part of the dermis and often blisters.'},
      {title:'The full thickness of skin is damaged',prompt:'Both the epidermis and the entire dermis are destroyed. Choose the usual depth category.',answer:2,why:'A full-thickness, third-degree burn needs urgent medical care. Its center can have reduced sensation because nerves are damaged.'}
     ]}
  ];
  function shieldIcon(){return '<svg viewBox="0 0 48 54" aria-hidden="true"><path d="M24 3C16 9 9 11 4 11c0 21 8 32 20 40 12-8 20-19 20-40-5 0-12-2-20-8Z" fill="currentColor"/><path d="m14 26 7 7 14-16" fill="none" stroke="#fff6df" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
  function scene(n,mode){return `<div class="quest-scene" data-quest-scene data-effect="idle"><img class="quest-scene-image" src="${art(n)}" alt="${esc(['','Complete skin cutaway with its tissue partners.','Skin layers and an enlarged epidermal cell-renewal view.','Hair, gland and fingernail anatomy.','Sweat gland, surface pore and dermal blood vessels.','Skin sensory nerves with an enlarged pressure receptor.','Three stages of wound repair.'][n])}" width="1536" height="1024" decoding="async"><div class="quest-scene-kicker">${esc(mode)}</div><div class="quest-targets"></div><svg class="quest-route" viewBox="0 0 100 66.667" aria-hidden="true"><path class="quest-route-base" d="M55 48 C56 35 53 25 55 12"/><path class="quest-flow" d="M55 48 C56 35 53 25 55 12"/></svg><div class="quest-effects" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>${n===6?`<div class="quest-burn-study">${studyMarkup(6,1)}<b>Epidermis only</b><b>Partial dermis</b><b>Full skin thickness</b></div>`:''}<div class="quest-scene-note" data-scene-note>Illustrative anatomy · not to scale</div></div>`}
  function labMarkup(n,{saved=false,preview=false}={}){
    const d=data[n-1];return `<section class="integ-quest integ-lab" id="integ-lab" data-quest="${n}" data-motion="paused"><div class="quest-heading"><div><span class="eyebrow">${d.tag} · MISSION ${String(n).padStart(2,'0')}</span><h2>${d.name}</h2></div><span class="quest-xp">${preview?'FREE PRACTICE':saved?'20 XP SAVED':'+20 XP'}</span></div><p class="quest-intro">${d.intro}</p><div class="quest-scoreboard"><span><strong data-quest-count>0</strong> / ${d.total} objectives</span><div class="quest-meter" role="progressbar" aria-label="Challenge objectives completed" aria-valuemin="0" aria-valuemax="${d.total}" aria-valuenow="0"><i></i></div><button type="button" class="quest-motion" data-quest-motion aria-pressed="false">Play animation</button></div><div class="quest-play-area">${scene(n,d.tag)}<div class="quest-workbench"><div class="quest-task" data-quest-task></div><div class="quest-workspace" data-quest-workspace></div><div class="quest-feedback" role="status" aria-live="polite" data-quest-feedback>Make a connection to begin your challenge.</div><button type="button" class="quest-next" data-quest-next hidden>Next objective →</button><div class="quest-complete" data-quest-complete hidden>${shieldIcon()}<div><strong>Challenge secured.</strong><p>${preview?'Practice complete. Your saved progress is unchanged.':saved?'Discovery already saved. This replay keeps your earned progress.':'Your discovery is saved. Complete the three science checks to earn this mission’s fragment.'}</p></div><button type="button" data-quest-checks>Science checks ↓</button><button type="button" data-quest-replay>Play again</button></div></div></div></section>`;
  }
  function studyMarkup(n,index){return `<figure class="quest-check-art" style="--study-ratio:${studyRatios[n-1]}" role="img" aria-label="${esc(studies[n-1][index])}"><img src="assets/integ-activities/mission-${String(n).padStart(2,'0')}.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" style="left:-${index*100}%"><span aria-hidden="true">ANATOMY STUDY ${String(index+1).padStart(2,'0')}</span></figure>`}
  function questionMarkup(n,index,q,saved,{preview=false}={}){return `<article class="resp-question quest-check ${saved?'is-secured':''}" data-question="${index}" id="integ-check-${index}">${studyMarkup(n,index)}<div class="quest-check-content"><div class="quest-check-top"><span class="eyebrow">CHECKPOINT ${index+1} / 3</span><span class="quest-check-reward">${preview?'PRACTICE':saved?'7 XP SAVED':'+7 XP'}</span></div><h3>${esc(q[0])}</h3><div class="resp-choices">${q[1].map((answer,j)=>`<button type="button" data-choice="${j}" ${saved?'disabled':''} class="${saved&&j===q[2]?'resp-correct':''}"><span class="quest-answer-letter" aria-hidden="true">${String.fromCharCode(65+j)}</span>${esc(answer)}</button>`).join('')}</div><div class="resp-feedback" role="status">${saved?'✓ '+esc(q[3]):'Choose the answer that matches the science.'}</div></div></article>`}
  function mountLab(root,{onComplete=()=>{},saved=false}={}){
    const n=Number(root.dataset.quest),d=data[n-1];let found=new Set(),selection=null,round=0,awaitingNext=false,reported=false;
    const motionLocked=document.body.classList.contains('motionoff');
    const reduced=motionLocked||matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.dataset.motion=reduced?'paused':'running';
    const $=selector=>root.querySelector(selector),sceneEl=$('[data-quest-scene]'),workspace=$('[data-quest-workspace]'),task=$('[data-quest-task]'),feedback=$('[data-quest-feedback]'),next=$('[data-quest-next]');
    const signal=new AbortController();
    function motion(){const running=root.dataset.motion==='running',button=$('[data-quest-motion]');button.textContent=motionLocked?'Motion reduced in settings':running?'Pause animation':'Play animation';button.disabled=motionLocked;button.setAttribute('aria-pressed',String(running));if(motionLocked)button.title='Your app accessibility setting has disabled animation.';}
    motion();
    function say(text,good=false){feedback.textContent=text;feedback.classList.toggle('is-good',good);feedback.classList.toggle('is-retry',!good);}
    function effect(name,path){sceneEl.dataset.effect=name;if(path)root.querySelectorAll('.quest-route path').forEach(p=>p.setAttribute('d',path));}
    function score(key){if(found.has(key))return;found.add(key);root.dataset.completed=String(found.size);$('[data-quest-count]').textContent=String(found.size);const meter=$('.quest-meter');meter.setAttribute('aria-valuenow',found.size);meter.querySelector('i').style.width=`${found.size/d.total*100}%`;if(found.size===d.total){root.classList.add('is-complete');$('[data-quest-complete]').hidden=false;next.hidden=true;if(!reported){reported=true;onComplete();}}}
    function targetMarkup(){return d.targets.map(([label,x,y],i)=>`<button type="button" data-quest-target="${i}" style="left:${x}%;top:${y}%" aria-label="Target ${i+1}: ${label}" ${found.has(i)?'disabled':''} class="${found.has(i)?'is-mapped':''}">${found.has(i)?'✓':i+1}</button>`).join('')}
    function render(){
      next.hidden=true;awaitingNext=false;selection=null;
      root.dataset.round=String(round);root.dataset.phase=d.type==='repair'&&round>=4?'burns':d.type;
      if(d.type==='map'){
        task.innerHTML='<h3>Build the tissue team</h3><p>Select a tissue, then its numbered location on the anatomy.</p>';
        $('.quest-targets').innerHTML=targetMarkup();
        workspace.innerHTML=`<div class="quest-tile-bank">${d.order.map(i=>`<button type="button" data-quest-piece="${i}" aria-pressed="false" ${found.has(i)?'disabled':''}>${found.has(i)?'✓ ':''}${d.pieces[i]}</button>`).join('')}</div><ol class="quest-target-key">${d.targets.map(([label])=>`<li>${label}</li>`).join('')}</ol>`;
      }else if(d.type==='layers'||d.type==='repair'&&round<4){
        const layer=d.type==='layers',length=layer?3:4;
        if(layer&&round===3){
          task.innerHTML='<span class="quest-objective-label">RENEWAL BONUS</span><h3>Where does surface renewal begin?</h3><p>Choose the region where new epidermal cells are produced.</p>';
          workspace.innerHTML=`<div class="quest-action-options">${['At the outer dead-cell surface','In the basal epidermis','In the subcutaneous fat'].map((text,i)=>`<button type="button" data-renewal="${i}">${text}</button>`).join('')}</div>`;
        }else{
          task.innerHTML=`<span class="quest-objective-label">${layer?'OUTSIDE → INSIDE':'REPAIR CHECKPOINT'} ${round+1} / ${length}</span><h3>${layer?['Start with the outer covering','Add the supporting tissue','Place the cushion underneath'][round]:['Seal the break','Defend and protect the wound','Close the surface','Strengthen the repair'][round]}</h3><p>${layer?'Tap a tissue tile or drag it to the next open slot.':'Select the matching repair checkpoint. This is a simplified story; biological phases overlap.'}</p>`;
          workspace.innerHTML=`<div class="quest-assembly ${layer?'':'quest-repair-track'}">${d.pieces.map((piece,i)=>`<div class="quest-slot ${i<round?'is-filled':''} ${i===round?'is-current':''}" data-quest-slot="${i}" role="group" aria-label="${layer?'Layer':'Repair checkpoint'} ${i+1}${i<round?': '+piece:''}"><b>${i<round?'✓':i+1}</b><span>${i<round?piece:i===round?(layer?'Place the next layer here':'Choose the next checkpoint'):'Waiting for the earlier step'}</span></div>`).join('')}</div><div class="quest-tile-bank">${d.order.map(i=>`<button type="button" draggable="true" data-quest-order="${i}" ${i<round?'disabled':''}>${i<round?'✓ ':''}${d.pieces[i]}</button>`).join('')}</div>`;
        }
      }else{
        const repair=d.type==='repair',response=d.type==='response',r=repair?d.burns[round-4]:d.rounds[round];
        if(response){sceneEl.querySelector('img').src=art(r.image);sceneEl.querySelector('img').alt='Skin anatomy for '+r.title.toLowerCase()+'.';}
        if(repair){sceneEl.classList.add('is-burn-scanner');sceneEl.querySelector('.quest-scene-image').src='assets/integ-activities/mission-06.webp';}
        task.innerHTML=`<span class="quest-objective-label">${repair?'DEPTH SCANNER':response?'INCOMING CHALLENGE':'OBJECTIVE'} ${repair?round-3:round+1} / ${repair?3:d.rounds.length}</span><h3>${r.title}</h3><p>${r.prompt}</p>`;
        const options=repair?['First degree · epidermis','Second degree · partial dermis','Third degree · full skin thickness']:response?d.tools:r.options;
        workspace.innerHTML=`<div class="quest-action-options">${options.map((text,i)=>`<button type="button" data-quest-action="${i}"><span aria-hidden="true">${String.fromCharCode(65+i)}</span>${text}</button>`).join('')}</div>`;
        if(repair){effect('burn-'+(round-4));$('[data-scene-note]').textContent='Depth increases from top to bottom · not a diagnosis tool';}
        else {effect('idle');$('[data-scene-note]').textContent=response?'Choose the responding structure below':'Choose a response to activate the anatomy';}
      }
    }
    function nextRound(){round++;render();workspace.querySelector('button:not([disabled])')?.focus({preventScroll:true});feedback.textContent='New objective ready. Use the anatomy and the science brief.';feedback.className='quest-feedback';}
    function chooseOrdered(i){
      if(awaitingNext||round>=(d.type==='layers'?3:4))return;
      if(i!==round){say(d.type==='layers'?'Try again. Work from the exposed surface toward the deeper supporting tissue.':'Try again. Read the repair checkpoint before choosing a tile.');return;}
      score(i);say(d.why[i],true);effect(d.type==='layers'?'layer-'+i:'repair-'+i);const slot=workspace.querySelector(`[data-quest-slot="${i}"]`);if(slot){slot.classList.add('is-filled');slot.classList.remove('is-current');slot.querySelector('b').textContent='✓';slot.querySelector('span').textContent=d.pieces[i];}
      if(d.type==='layers'&&i===2){round++;render();say(d.why[i]+' Now investigate renewal.',true);workspace.querySelector('button')?.focus({preventScroll:true});}
      else if(found.size<d.total){awaitingNext=true;workspace.querySelectorAll('button').forEach(b=>b.disabled=true);next.hidden=false;next.textContent=d.type==='repair'&&i===3?'Open the burn depth scanner →':'Next checkpoint →';next.focus({preventScroll:true});}
    }
    root.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button||!root.contains(button)||button.disabled)return;
      if(button.hasAttribute('data-quest-checks')){document.getElementById('integ-checks-title')?.scrollIntoView({behavior:root.dataset.motion==='running'?'smooth':'instant',block:'start'});return;}
      if(button.hasAttribute('data-quest-motion')){root.dataset.motion=root.dataset.motion==='running'?'paused':'running';motion();return;}
      if(button.hasAttribute('data-quest-next')){nextRound();return;}
      if(button.hasAttribute('data-quest-replay')){found=new Set();round=0;selection=null;reported=false;root.classList.remove('is-complete');$('[data-quest-complete]').hidden=true;$('[data-quest-count]').textContent='0';root.dataset.completed='0';$('.quest-meter').setAttribute('aria-valuenow','0');$('.quest-meter i').style.width='0%';sceneEl.classList.remove('is-burn-scanner');sceneEl.querySelector('.quest-scene-image').src=art(n);effect('idle');render();say(saved?'Replay ready. Your saved discovery stays earned.':'New practice run ready. Previously earned XP cannot be earned twice.');return;}
      if(button.hasAttribute('data-quest-piece')){selection=Number(button.dataset.questPiece);workspace.querySelectorAll('[data-quest-piece]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));say(`${d.pieces[selection]} selected. Choose its numbered structure on the anatomy.`);return;}
      if(button.hasAttribute('data-quest-target')){const i=Number(button.dataset.questTarget);if(selection===null){say('Choose a tissue tile first, then place it on the anatomy.');return;}if(selection!==i){say('That tissue belongs elsewhere. Use the numbered structure key and try again.');return;}score(i);say(d.why[i],true);effect('tissue');render();(workspace.querySelector('[data-quest-piece]:not([disabled])')||$('[data-quest-checks]'))?.focus({preventScroll:true});return;}
      if(button.hasAttribute('data-quest-order')){chooseOrdered(Number(button.dataset.questOrder));return;}
      if(button.hasAttribute('data-renewal')){if(Number(button.dataset.renewal)!==1){say('Look deeper in the epidermis: the surface cells are already flattened and cornified.');return;}score('renewal');effect('renewal');say('Basal cells divide. Their descendants differentiate, move outward and eventually shed. This animation compresses a process that takes weeks.',true);workspace.querySelectorAll('button').forEach(b=>b.disabled=true);$('[data-scene-note]').textContent='Basal division → differentiation → surface shedding';return;}
      if(button.hasAttribute('data-quest-action')&&!awaitingNext){const repair=d.type==='repair',r=repair?d.burns[round-4]:d.rounds[round],i=Number(button.dataset.questAction);if(i!==r.answer){say('Try another response. '+(repair?'Compare how far the damage extends.':'Use the structure’s job to decide.'));button.classList.add('is-tried');return;}score(round);say(r.why,true);button.classList.add('is-correct');workspace.querySelectorAll('button').forEach(b=>b.disabled=true);effect(repair?'burn-'+(round-4):r.effect,r.path);if(!repair)$('[data-scene-note]').textContent=r.title+' · illustrative process';if(found.size<d.total){awaitingNext=true;next.hidden=false;next.textContent='Next objective →';}return;}
    },{signal:signal.signal});
    root.addEventListener('dragstart',event=>{const tile=event.target.closest('[data-quest-order]');if(tile&&!tile.disabled)event.dataTransfer.setData('text/plain',tile.dataset.questOrder);},{signal:signal.signal});
    root.addEventListener('dragover',event=>{if(event.target.closest('.quest-slot.is-current'))event.preventDefault();},{signal:signal.signal});
    root.addEventListener('drop',event=>{if(!event.target.closest('.quest-slot.is-current'))return;event.preventDefault();const value=event.dataTransfer.getData('text/plain');if(/^\d$/.test(value))chooseOrdered(Number(value));},{signal:signal.signal});
    const observer=new IntersectionObserver(([entry])=>root.classList.toggle('is-offscreen',!entry.isIntersecting),{rootMargin:'100px'});observer.observe(root);
    const inspect=()=>({mission:n,completed:found.size,total:d.total,round,motion:root.dataset.motion,selection,phase:root.dataset.phase});window.inneruSkinQuestState=inspect;
    let disposed=false;const removal=new MutationObserver(()=>{if(!root.isConnected)dispose();});
    function dispose(){if(disposed)return;disposed=true;signal.abort();observer.disconnect();removal.disconnect();if(window.inneruSkinQuestState===inspect)delete window.inneruSkinQuestState;}
    removal.observe(document.getElementById('app')||document.body,{childList:true});
    render();return dispose;
  }
  const finalStudies=[[2,0],[2,1],[2,0],[3,2],[3,0],[4,0],[6,0],[5,2]];
  function finalQuestionMarkup(q,index,saved,{preview=false}={}){const [n,part]=finalStudies[index];return `<article class="resp-question quest-check ${saved?'is-secured':''}" data-final="${index}">${studyMarkup(n,part)}<div class="quest-check-content"><div class="quest-check-top"><span class="eyebrow">SHIELD STAGE ${index+1} / 8</span><span class="quest-check-reward">${preview?'PRACTICE':saved?'8 XP SAVED':'+8 XP'}</span></div><h3>${esc(q[0])}</h3><div class="resp-choices">${(index%2?[q[2],q[1]]:[q[1],q[2]]).map((answer,j)=>`<button type="button" data-choice="${j}" ${saved?'disabled':''} class="${saved&&j===index%2?'resp-correct':''}">${esc(answer)}</button>`).join('')}</div><div class="resp-feedback" role="status">${saved?'✓ '+esc(q[3]):'Restore another part of the living shield.'}</div></div></article>`}
  window.InneruSkinActivities={labMarkup,mountLab,questionMarkup,finalQuestionMarkup,shieldIcon,art};
})();
