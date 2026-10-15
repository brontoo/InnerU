/* Guided antagonistic-muscle activity. Discovery stars never change lesson XP. */
window.InnerUArmLab=(()=>{
  'use strict';
  const parts={
    all:{name:'Whole arm',title:'One joint. Two opposing pulls.',copy:'Biceps brachii bends the elbow. Triceps brachii straightens it. Follow their pale tendons to the moving forearm bones.'},
    biceps:{name:'Biceps',title:'Biceps brachii · elbow flexor',copy:'Two heads begin on the scapula. The distal tendon attaches to the radius. During active flexion, the muscle shortens and pulls the forearm upward.'},
    triceps:{name:'Triceps',title:'Triceps brachii · elbow extensor',copy:'Three heads merge into a tendon on the olecranon of the ulna. During active extension, the muscle shortens and pulls the forearm toward a straight position.'},
    tendons:{name:'Tendons',title:'The connection that carries the pull',copy:'Tendons connect muscle to bone. Biceps pulls on the radius; triceps pulls on the ulna. Tendons transmit force and do not actively contract.'},
    bones:{name:'Bones',title:'Humerus, radius & ulna',copy:'The humerus stays in the upper arm. The radius and ulna move together around the elbow in this demonstration. The forearm remains supinated: its two bones do not cross.'},
  };
  const quests=[
    {name:'Bend to the beacon',question:'Which muscle leads active elbow flexion?',answers:['Biceps','Triceps'],answer:0,target:[100,120],hint:'Bring the elbow to 100–120° of flexion. Watch the front muscle shorten.'},
    {name:'Return with control',question:'Which muscle leads active elbow extension?',answers:['Biceps','Triceps'],answer:1,target:[10,30],hint:'Straighten from a bent position to 10–30° of flexion. Watch the back muscle shorten.'},
    {name:'Trace the connection',question:'What does a tendon connect?',answers:['Muscle to bone','Bone to bone'],answer:0,hint:'Select Tendons and follow both pale attachments to their forearm bones.'},
  ];
  const clamp=v=>Math.max(0,Math.min(130,v));
  const rotate=(x,y,a)=>{const r=a*Math.PI/180;return{x:245+(x-245)*Math.cos(r)+(y-310)*Math.sin(r),y:310-(x-245)*Math.sin(r)+(y-310)*Math.cos(r)};};
  function belly(id,start,end,width){
    const dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
    const p=(t,w)=>[start.x+dx*t+nx*w,start.y+dy*t+ny*w];
    const a=p(.29,width),b=p(.75,width),c=p(.75,-width),d=p(.29,-width);
    const outline=`M${start.x} ${start.y} C${a} ${b} ${end.x} ${end.y} C${c} ${d} ${start.x} ${start.y}Z`;
    const fibers=Array.from({length:9},(_,i)=>{const w=(i/8*2-1)*width*.8,A=p(.29,w),B=p(.75,w);return`<path d="M${start.x} ${start.y}C${A} ${B} ${end.x} ${end.y}"/>`;}).join('');
    return `<g data-arm-svg-part="${id}"><path d="${outline}" fill="url(#arm-${id}-fill)" stroke="${id==='biceps'?'#a55a4f':'#885b60'}" stroke-width="1.3"/><g fill="none" stroke="#fff0d7" stroke-width=".65" opacity=".6">${fibers}</g></g>`;
  }
  function illustration(angle=35){
    const R=rotate(259,354,angle),U=rotate(231,299,angle),dist=Math.hypot(273-R.x,129-R.y),endB={x:R.x+(273-R.x)/dist*45,y:R.y+(129-R.y)/dist*45},posterior={x:224,y:310},toward={x:221-224,y:129-310};
    const tl=Math.hypot(toward.x,toward.y);toward.x/=tl;toward.y/=tl;
    let low=0,high=90,endT;
    for(let i=0;i<10;i++){const s=(low+high)/2;endT={x:posterior.x+toward.x*s,y:posterior.y+toward.y*s};let length=0,prev=endT;for(let j=1;j<=20;j++){const t=j/20,v=1-t,p={x:v*v*endT.x+2*v*t*posterior.x+t*t*U.x,y:v*v*endT.y+2*v*t*posterior.y+t*t*U.y};length+=Math.hypot(p.x-prev.x,p.y-prev.y);prev=p;}if(length>43)high=s;else low=s;}
    const bL=Math.hypot(endB.x-272,endB.y-126),tL=Math.hypot(endT.x-220,endT.y-127);
    return `<svg viewBox="0 0 560 550" role="img" aria-label="Scientific left-arm illustration at ${Math.round(angle)} degrees of elbow flexion. Biceps attaches to radius; triceps attaches to ulna." xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="arm-bone-fill"><stop stop-color="#b9aa8f"/><stop offset=".4" stop-color="#fff2cf"/><stop offset=".72" stop-color="#eddfb9"/><stop offset="1" stop-color="#c6b394"/></linearGradient><linearGradient id="arm-biceps-fill"><stop stop-color="#ad6056"/><stop offset=".43" stop-color="#edb49c"/><stop offset=".7" stop-color="#d48271"/><stop offset="1" stop-color="#aa594f"/></linearGradient><linearGradient id="arm-triceps-fill"><stop stop-color="#986467"/><stop offset=".5" stop-color="#d3998b"/><stop offset="1" stop-color="#ad7272"/></linearGradient><radialGradient id="arm-floor"><stop stop-color="#60756d" stop-opacity=".18"/><stop offset="1" stop-color="#60756d" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="280" cy="510" rx="160" ry="18" fill="url(#arm-floor)"/>
      <g data-arm-svg-part="bones" fill="url(#arm-bone-fill)" stroke="#b5a78e" stroke-width="1.2"><path d="M192 72Q225 62 261 91L239 154 173 141 171 98Z"/><path d="M165 76Q208 61 254 78L265 86Q216 71 164 86Z"/><path d="M237 96C210 97 214 135 235 141L235 275Q223 288 223 307Q233 325 245 317Q263 325 269 307Q265 289 254 276L254 139Q274 122 262 103Q253 94 237 96Z"/>
      <g transform="rotate(${-angle} 245 310)"><path d="M229 296Q212 286 215 309L227 336 231 476Q222 492 236 497Q247 493 243 479L243 335 236 312Q242 298 229 296Z"/><path d="M253 317Q266 310 273 323L264 342 263 467Q277 481 270 495L250 494Q245 485 251 474L253 341Q245 332 253 317Z"/><path d="M238 352L239 466M259 351L258 462" fill="none" stroke="#ab9a79" stroke-width="1" opacity=".55"/><path d="M225 308Q232 316 239 309M252 326Q262 332 269 326" fill="none" stroke="#fffbed" stroke-width="3"/></g></g>
      ${belly('triceps',{x:221,y:129},endT,19*Math.sqrt(170/tL))}${belly('biceps',{x:273,y:129},endB,21*Math.sqrt(174/bL))}
      <g data-arm-svg-part="tendons" fill="none" stroke="#f5e8c9" stroke-width="6" stroke-linecap="round"><path d="M273 130Q275 110 259 98M267 133Q253 110 249 98M221 129L231 112"/><path data-arm-tendon="biceps" d="M${endB.x} ${endB.y}Q${(R.x+endB.x)/2+2} ${(R.y+endB.y)/2} ${R.x} ${R.y}"/><path data-arm-tendon="triceps" d="M${endT.x} ${endT.y}Q224 310 ${U.x} ${U.y}"/></g>
      <circle cx="245" cy="310" r="6" fill="#4f8c87" opacity=".5"/>
      <g fill="#577c7b" font-family="sans-serif" font-size="10"><text x="322" y="133">BICEPS BRACHII</text><text x="74" y="180">TRICEPS BRACHII</text><path d="M321 138L292 156M175 184L207 195" stroke="#7b9890" fill="none"/></g>
    </svg>`;
  }
  function markup(){return `<section class="mq-foundation-section arm-lab" id="mq-pairs" aria-labelledby="arm-lab-title">
    <header class="arm-lab-heading"><div><span class="eyebrow">04 · MOVEMENT LAB</span><h2 id="arm-lab-title">Two muscles. One moving team.</h2><p>Explore a real anatomical arm, then guide its opposing muscles through three discoveries.</p></div><span class="arm-lab-medal"><b data-arm-stars>0 / 3</b> DISCOVERY STARS</span></header>
    <div class="arm-lab-missions" role="group" aria-label="Movement challenges"><button type="button" data-arm-quest="free" aria-pressed="true"><span>FREE EXPLORE</span>Discover the anatomy</button>${quests.map((q,i)=>`<button type="button" data-arm-quest="${i}" aria-pressed="false"><span>0${i+1} · <i data-arm-star="${i}">☆</i></span>${q.name}</button>`).join('')}</div>
    <div class="arm-lab-layout"><div class="arm-lab-visual"><div class="arm-lab-stage" tabindex="0" role="group" aria-label="Anatomical elbow activity. Use the labeled elbow-angle slider below to control movement."><div class="arm-lab-svg">${illustration(35)}</div><div class="arm-lab-stage-title">LEFT ARM · FOREARM SUPINATED</div><div class="arm-lab-phase" data-phase="idle"><i></i><span>Ready to move</span></div><span class="arm-lab-3d" hidden>3D · DRAG TO TURN</span><div class="arm-lab-angle"><b data-arm-angle>35°</b><span>ELBOW FLEXION</span></div><div class="arm-lab-cue" hidden>GOLD ARROWS · DIRECTION OF PULL</div></div><p class="arm-lab-render-note">Anatomical teaching view · shoulder held still · 0° is straight</p></div>
      <div class="arm-lab-console"><div class="arm-lab-task" aria-live="polite"><span class="arm-lab-kicker">EXPLORE FREELY</span><h3>Make the arm move.</h3><p>Bend and straighten slowly. Compare muscle shape, then follow its tendon to bone.</p></div>
      <div class="arm-lab-angle-label"><label for="mq-arm-range">Elbow flexion</label><output for="mq-arm-range" data-arm-output>35°</output></div><input id="mq-arm-range" class="arm-lab-range" type="range" min="0" max="130" value="35" step="1" aria-describedby="arm-range-hint"><div id="arm-range-hint" class="arm-lab-range-labels"><span>0° · straight</span><span>130° · bent</span></div><div class="arm-lab-target" hidden><i></i><span></span></div>
      <div class="arm-lab-actions"><button type="button" data-arm-move="flex">Bend the elbow <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13L13 3M5 3h8v8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button><button type="button" data-arm-move="extend">Straighten <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3L13 13M5 13h8V5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button><button type="button" data-arm-pause disabled aria-label="Pause arm animation"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" stroke="currentColor" stroke-width="2"/></svg></button></div>
      <div class="arm-lab-muscle-states"><div data-arm-state="biceps"><span>ANTERIOR · BICEPS</span><b>Ready</b><small>Flexes the elbow</small></div><div data-arm-state="triceps"><span>POSTERIOR · TRICEPS</span><b>Ready</b><small>Extends the elbow</small></div></div>
      <div class="arm-lab-select-heading"><span>EXAMINE THE ANATOMY</span><button type="button" data-arm-view-reset>Reset view</button></div><div class="arm-lab-parts" role="group" aria-label="Arm structures">${Object.entries(parts).map(([id,p])=>`<button type="button" data-arm-part="${id}" aria-pressed="${id==='all'}">${p.name}</button>`).join('')}</div>
      <div class="arm-lab-anatomy"><h4>${parts.all.title}</h4><p>${parts.all.copy}</p></div><p class="arm-lab-feedback" role="status" aria-live="polite">Choose any challenge, or explore all the anatomy first.</p>
    </div></div><details class="arm-lab-science"><summary>Look closer · what this movement shows</summary><p>This guided example shows active flexion and active extension without an external load. Biceps works with other elbow flexors, including brachialis and brachioradialis. During real movement, opposing muscles can be active together; when lowering a load, biceps may produce tension while lengthening.</p><p>Muscle bellies change shape as their attachments move. Bones retain their lengths and tendons transmit the pull. The movement is a teaching reconstruction, not a measured biomechanical simulation.</p><p>Arm meshes: <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noopener">DBCLS BodyParts3D</a>, CC BY-SA 2.1 Japan; adapted for InnerU. Scientific reference: <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs" target="_blank" rel="noopener">OpenStax · muscles of the upper limb</a>.</p></details>
    </section>`;}
  let cleanupCurrent=()=>{},viewModule;
  function mount(root=document.querySelector('.arm-lab')){
    cleanupCurrent();if(!root)return;
    const abort=new AbortController(),signal=abort.signal,range=root.querySelector('#mq-arm-range'),svg=root.querySelector('.arm-lab-svg');
    let angle=35,phase='idle',lastPhase='idle',part='all',quest=null,animation=null,frame=0,inputTimer=0,visible=true,disposed=false,view=null,moveStart=35;
    const achievements=quests.map(()=>({answer:false,moved:false,complete:false}));
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motionoff');
    const on=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal});
    const target=()=>quest===null?null:quests[quest].target||null;
    function send(){root.dispatchEvent(new CustomEvent('arm-lab-pose',{detail:{angle,phase,part,target:target(),playing:!!animation}}));}
    function draw(){
      if(disposed)return;
      root.dataset.armPart=part;range.value=angle;range.setAttribute('aria-valuetext',`${Math.round(angle)} degrees of elbow flexion`);root.querySelector('[data-arm-angle]').textContent=Math.round(angle)+'°';root.querySelector('[data-arm-output]').textContent=Math.round(angle)+'°';
      if(!root.dataset.arm3d)svg.innerHTML=illustration(angle);
      const badge=root.querySelector('.arm-lab-phase');badge.dataset.phase=phase;badge.querySelector('span').textContent=phase==='flex'?'Flexion · bending':phase==='extend'?'Extension · straightening':lastPhase==='idle'?'Ready to move':'Movement paused';
      root.querySelectorAll('[data-arm-state]').forEach(el=>{const active=phase==='flex'?el.dataset.armState==='biceps':phase==='extend'?el.dataset.armState==='triceps':false;el.classList.toggle('is-active',active);el.querySelector('b').textContent=phase==='idle'?'At this pose':active?'Shortening · active':'Lengthening · less active';});
      root.querySelector('[data-arm-pause]').disabled=!animation;
      root.querySelectorAll('[data-arm-move]').forEach(b=>b.setAttribute('aria-pressed',String(!!animation&&b.dataset.armMove===phase)));
      root.querySelector('.arm-lab-cue').hidden=phase==='idle'||!root.dataset.arm3d;
      const goal=target(),zone=root.querySelector('.arm-lab-target');zone.hidden=!goal;
      if(goal){const inside=angle>=goal[0]&&angle<=goal[1];zone.classList.toggle('is-in-zone',inside);zone.querySelector('span').textContent=inside?'In the target zone · '+goal[0]+'–'+goal[1]+'°':'Your beacon · '+goal[0]+'–'+goal[1]+'°';range.style.setProperty('--arm-track',`linear-gradient(to right,#d9e0d2 0%,#d9e0d2 ${goal[0]/1.3}%,#79b59a ${goal[0]/1.3}%,#79b59a ${goal[1]/1.3}%,#d9e0d2 ${goal[1]/1.3}%,#d9e0d2 100%)`);}else range.style.removeProperty('--arm-track');
      send();
    }
    function updateStars(){const n=achievements.filter(a=>a.complete).length;root.querySelector('[data-arm-stars]').textContent=n+' / 3';root.querySelectorAll('[data-arm-star]').forEach(el=>el.textContent=achievements[+el.dataset.armStar].complete?'★':'☆');root.classList.toggle('arm-lab-master',n===3);}
    function checkQuest(){if(quest===null)return;const a=achievements[quest];if(quest===2&&part==='tendons')a.moved=true;if(a.answer&&a.moved&&!a.complete){a.complete=true;updateStars();root.querySelector('.arm-lab-feedback').textContent=quest===0?'★ Flexion star earned. Biceps shortened and pulled on the radius.':quest===1?'★ Extension star earned. Triceps shortened and pulled on the ulna.':'★ Connection star earned. Tendons link muscle to bone and transmit its pull.';}}
    function trackMovement(previous){if(quest===null||quest===2)return;const q=quests[quest],a=achievements[quest],correctDirection=quest===0?angle>previous:angle<previous;
      if(correctDirection&&angle>=q.target[0]&&angle<=q.target[1]&&Math.abs(angle-moveStart)>=10){a.moved=true;checkQuest();}}
    function pose(value,moving=true){const previous=angle;angle=clamp(value);if(moving&&Math.abs(angle-previous)>.001){phase=angle>previous?'flex':'extend';lastPhase=phase;trackMovement(previous);}draw();}
    function stop(message=false){cancelAnimationFrame(frame);clearTimeout(inputTimer);frame=0;animation=null;phase='idle';draw();if(message)root.querySelector('.arm-lab-feedback').textContent='Paused at '+Math.round(angle)+'°. The pose alone does not tell you which muscle is active.';}
    function animate(target){
      stop();moveStart=angle;
      if(Math.abs(target-angle)<1){root.querySelector('.arm-lab-feedback').textContent='You are already at this end. Try the opposite movement.';return;}
      const from=angle;lastPhase=target>from?'flex':'extend';
      if(reduced()){pose(target);phase='idle';draw();return;}
      animation={from,target,elapsed:0,last:0,duration:Math.abs(target-from)/50};
      function step(now){if(disposed||!animation)return;if(!visible||document.hidden){animation.last=0;frame=requestAnimationFrame(step);return;}if(animation.last)animation.elapsed+=Math.min(.10,(now-animation.last)/1000);animation.last=now;const t=Math.min(1,animation.elapsed/animation.duration);pose(from+(target-from)*(t*t*(3-2*t)));if(t<1)frame=requestAnimationFrame(step);else{animation=null;phase='idle';draw();if(quest===null||!achievements[quest].complete)root.querySelector('.arm-lab-feedback').textContent=target>from?'Flexion complete: biceps shortened; triceps lengthened.':'Extension complete: triceps shortened; biceps lengthened.';}}
      frame=requestAnimationFrame(step);
    }
    function choosePart(id){part=id;root.querySelectorAll('[data-arm-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.armPart===id)));root.querySelector('.arm-lab-anatomy').innerHTML=`<h4>${parts[id].title}</h4><p>${parts[id].copy}</p>`;checkQuest();draw();}
    function chooseQuest(id){
      stop();quest=id==='free'?null:+id;root.querySelectorAll('[data-arm-quest]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.armQuest===id)));moveStart=angle;
      const box=root.querySelector('.arm-lab-task');
      if(quest===null){box.innerHTML='<span class="arm-lab-kicker">EXPLORE FREELY</span><h3>Make the arm move.</h3><p>Bend and straighten slowly. Compare muscle shape, then follow its tendon to bone.</p>';root.querySelector('.arm-lab-feedback').textContent='All anatomy and challenges are open. Your lesson progress is unchanged.';draw();return;}
      const q=quests[quest],a=achievements[quest];
      box.innerHTML=`<span class="arm-lab-kicker">DISCOVERY 0${quest+1} · ${a.complete?'STAR EARNED':'YOUR TARGET'}</span><h3>${q.name}</h3><p>${q.hint}</p><fieldset class="arm-lab-question"><legend>${q.question}</legend>${q.answers.map((answer,i)=>`<button type="button" data-arm-answer="${i}" aria-pressed="${a.answer&&i===q.answer}">${answer}</button>`).join('')}</fieldset>`;
      root.querySelector('.arm-lab-feedback').textContent='Answer the question, then '+(quest===2?'inspect the tendons.':'move the arm into the target zone.');
      if(quest<2){pose(quest===0?20:110,false);moveStart=angle;}else choosePart('all');
    }
    root.querySelectorAll('[data-arm-quest]').forEach(b=>on(b,'click',()=>chooseQuest(b.dataset.armQuest)));
    on(root.querySelector('.arm-lab-task'),'click',e=>{const b=e.target.closest('[data-arm-answer]');if(!b||quest===null)return;const correct=+b.dataset.armAnswer===quests[quest].answer;if(correct){achievements[quest].answer=true;root.querySelectorAll('[data-arm-answer]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));root.querySelector('.arm-lab-feedback').textContent='Correct. '+quests[quest].hint;checkQuest();}else root.querySelector('.arm-lab-feedback').textContent=quest===0?'Look at the anterior muscle: biceps pulls to bend the elbow.':quest===1?'Look at the posterior muscle: triceps pulls to straighten the elbow.':'A ligament joins bone to bone. Follow a tendon from a muscle to its bone.';});
    on(range,'pointerdown',()=>{stop();});on(range,'keydown',()=>{if(animation)stop();});
    on(range,'input',()=>{const requested=+range.value;if(animation)stop();pose(requested);clearTimeout(inputTimer);inputTimer=setTimeout(()=>{phase='idle';draw();},450);});
    root.querySelectorAll('[data-arm-move]').forEach(b=>on(b,'click',()=>animate(b.dataset.armMove==='flex'?120:10)));
    on(root.querySelector('[data-arm-pause]'),'click',()=>stop(true));root.querySelectorAll('[data-arm-part]').forEach(b=>on(b,'click',()=>choosePart(b.dataset.armPart)));
    on(root.querySelector('[data-arm-view-reset]'),'click',()=>root.dispatchEvent(new CustomEvent('arm-lab-view-reset')));
    const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'60px'});intersection.observe(root);
    const mutation=new MutationObserver(()=>{if(!root.isConnected)cleanup();});mutation.observe(document.getElementById('app'),{childList:true});
    const media=matchMedia('(prefers-reduced-motion: reduce)'),motionChanged=()=>{if(disposed)return;if(animation&&reduced())stop();else draw();};on(media,'change',motionChanged);
    const motionObserver=new MutationObserver(motionChanged);motionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    function cleanup(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);clearTimeout(inputTimer);abort.abort();intersection.disconnect();mutation.disconnect();motionObserver.disconnect();view?.dispose();if(window.__inneruArmLab?.root===root)window.__inneruArmLab=null;}
    cleanupCurrent=cleanup;
    const live={root,state:()=>({angle,phase,lastPhase,part,quest,stars:achievements.filter(a=>a.complete).length,achievements:achievements.map(a=>({...a})),playing:!!animation,visible,disposed,renderer:!!root.dataset.arm3d}),get pose(){return{angle,phase,part,target:target()}},attach(v){view=v;draw();}};
    window.__inneruArmLab=live;window.inneruArmLabState=()=>window.__inneruArmLab?.state()??null;
    draw();
    const loader=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;loader.disconnect();viewModule||=import('./muscle-pair-view.js?v=arm-team-1');viewModule.then(m=>{if(!disposed)m.mountArmView(root,live,choosePart);}).catch(e=>{viewModule=null;console.warn('Arm 3D view unavailable:',e);});},{rootMargin:'150px'});loader.observe(root.querySelector('.arm-lab-stage'));signal.addEventListener('abort',()=>loader.disconnect(),{once:true});
  }
  return{markup,mount,illustration};
})();
