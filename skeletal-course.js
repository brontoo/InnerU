/* Skeletal expedition: stable mission/reward IDs, an explicit learning sequence,
   and an isolated practice mode. Shared anatomy models and other worlds stay in
   their existing modules. */
(() => {
  'use strict';
  const A=window.InneruSkeletalActivities;
  const titles=[...missions.map(m=>m[0]),'The athlete case'];
  const chapters=[
    {title:'Map the framework',label:'IDENTIFY → CLASSIFY → LOOK INSIDE',text:'Start with the whole skeleton, compare bone shapes, then investigate the tissues inside a bone.',ids:[1,2,3]},
    {title:'Discover how living bones work',label:'MOVE → ADAPT',text:'Connect joint anatomy to movement, then explore how living bone responds to loading.',ids:[4,5]},
    {title:'Repair, investigate and apply',label:'REPAIR → REASON → SOLVE',text:'Follow fracture repair, distinguish four joint conditions, then apply your evidence to the athlete case.',ids:[6,7,8]}
  ];
  const lessons=[
    {goal:'Distinguish the axial and appendicular skeleton and connect each division to its job.',tasks:['Explore the two divisions','Sort seven skeletal regions','Explain protection and support'],terms:'Axial · appendicular · girdle',badge:'Framework explorer'},
    {goal:'Use anatomical shape to explain why different bones do different jobs.',tasks:['Inspect four bone specimens','Match shape to function','Reflect on different jobs'],terms:'Long · short · flat · irregular',badge:'Shape investigator'},
    {goal:'Connect the structures in a long bone to strength, low mass, storage and blood-cell production.',tasks:['Collect seven structure discoveries','Compare solid and lattice models','Connect tissue to function'],terms:'Cortex · trabeculae · marrow · periosteum',badge:'Bone architect'},
    {goal:'Compare five articulations and use their anatomy to predict movement.',tasks:['Inspect five joint types','Match each movement pattern','Compare mobility and stability'],terms:'Hinge · pivot · ball-and-socket · plane · suture',badge:'Movement scientist'},
    {goal:'Explain how resorption and formation change bone mass in a simplified remodeling model.',tasks:['Meet the remodeling cells','Predict three balance scenarios','Connect loading to bone health'],terms:'Osteoclast · osteoblast · osteocyte · osteoid',badge:'Remodeling strategist'},
    {goal:'Sequence fracture repair and explain why stability helps developing repair tissue.',tasks:['Study four repair phases','Arrange the illustrated timeline','Choose the stable repair setting'],terms:'Hematoma · soft callus · hard callus · remodeling',badge:'Repair specialist'},
    {goal:'Use the affected anatomical structure and the supplied evidence to distinguish four joint conditions.',tasks:['Inspect four anatomical case files','Build a four-part evidence chain','Compare different causes of pain'],terms:'Cartilage · synovium · bursa · ligament',badge:'Evidence detective'},
    {goal:'Apply the whole pathway to explain a fictional athlete’s ankle injury.',tasks:['Examine the ankle and five clues','Explain stability and tissue repair','Confirm structure, injury and function'],terms:'Tibia · fibula · talus · ligament · tendon',badge:'Skeletal Master'}
  ];
  const preview=()=>new URLSearchParams(location.hash.split('?')[1]||'').get('preview')==='1';
  const url=(n,practice=preview())=>`#${n?'mission/'+n:'world'}${practice?'?preview=1':''}`;
  const open=n=>n===1||state.done.includes(n-1);
  const chapterOf=n=>chapters.findIndex(c=>c.ids.includes(n));
  const number=n=>String(n).padStart(2,'0');
  const reduced=()=>state.motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  function modeBar(n=0){return `<section class="skel-mode-bar ${preview()?'is-preview':''}"><div><b>${preview()?'Preview studio · every mission is open':'Framework expedition · build your science skills'}</b><p>${preview()?'Try all activities and questions. Your saved XP, missions and achievements stay unchanged.':'Complete each investigation and three science checks to unlock the next mission.'}</p></div><a class="btn line" href="${url(n,!preview())}">${preview()?'Return to expedition':'Preview all activities'}</a></section>`}

  const previousWorld=world;
  world=function(){
    previousWorld();
    const main=document.getElementById('main'),practice=preview();
    main.classList.add('skeletal-course');
    // The studio stays exactly where it was; the complete pathway begins after it.
    const heading=main.querySelector('.headrow'),grid=main.querySelector('.missiongrid');
    const cards=[...grid.querySelectorAll('.missioncard')],finale=main.querySelector('.skeletal-finale');
    heading.classList.add('skel-path-heading');
    heading.querySelector('h2').textContent='Your route through the living framework';
    heading.querySelector('p').textContent='Whole skeleton → bone structure → movement → remodeling → repair → evidence.';
    if(practice){const level=heading.querySelector('select');level.disabled=true;}
    heading.insertAdjacentHTML('beforebegin',modeBar());
    heading.insertAdjacentHTML('afterend',`<nav class="skel-chapter-nav" aria-label="Skeletal learning stages">${chapters.map((c,i)=>`<button type="button" data-chapter-jump="${i}"><b>${number(i+1)}</b><span>${c.title}<small>${c.ids.length} ${i===2?'missions including the final case':'missions'}</small></span><span aria-hidden="true">↓</span></button>`).join('')}</nav>`);
    const chaptersRoot=document.createElement('div');chaptersRoot.className='skel-chapters';
    grid.before(chaptersRoot);
    chapters.forEach((chapter,i)=>{
      const section=document.createElement('section');section.className='skel-chapter';section.id='skeletal-stage-'+i;
      section.setAttribute('aria-labelledby','skeletal-stage-title-'+i);
      section.innerHTML=`<header class="skel-chapter-heading"><span class="skel-stage-number">${number(i+1)}</span><div><span class="eyebrow">${chapter.label}</span><h2 id="skeletal-stage-title-${i}">${chapter.title}</h2><p>${chapter.text}</p></div><span class="skel-chapter-count">${practice?'OPEN EXPLORATION':chapter.ids.filter(n=>state.done.includes(n)).length+' / '+chapter.ids.length+' COMPLETE'}</span></header><div class="grid missiongrid skel-chapter-grid"></div>`;
      chapter.ids.filter(n=>n<8).forEach(n=>{
        const card=cards[n-1];
        card.querySelector('p').textContent=lessons[n-1].goal;
        const entry=card.querySelector(':scope > .btn');
        entry.insertAdjacentHTML('beforebegin',`<ol class="skel-card-tasks">${lessons[n-1].tasks.slice(0,2).map(t=>`<li>${t}</li>`).join('')}<li>Pass three science checks</li></ol><div class="skel-card-reward"><span>✧ ${lessons[n-1].badge}</span><span>${n===7?'170 XP incl. cases':'50 XP'}</span></div>`);
        if(practice){entry.outerHTML=`<a class="btn" href="${url(n,true)}">Preview mission →</a>`;card.classList.remove('locked');}
        else card.insertAdjacentHTML('beforeend',`<a class="skel-preview-link" href="${url(n,true)}">Preview this activity set ↗</a>`);
        section.querySelector('.missiongrid').append(card);
      });
      if(i===2){
        const copy=finale.querySelector(':scope > div');
        copy.querySelector('p').textContent='Bring structure, movement and injury evidence together. Complete the final case and its three checks to earn the Framework Key.';
        copy.insertAdjacentHTML('beforeend','<p class="skel-finale-reward">✧ Skeletal Master · Framework Key · 80 XP</p>');
        const entry=finale.querySelector(':scope > .btn');
        entry.outerHTML=practice?`<a class="btn" href="${url(8,true)}">Preview the final case →</a>`:`<div class="skel-finale-actions">${entry.outerHTML}<a class="skel-preview-link" href="${url(8,true)}">Preview the final case ↗</a></div>`;
        section.append(finale);
      }
      chaptersRoot.append(section);
    });
    grid.remove();
    const gallery=main.querySelector('.skeletal-gallery-tools');
    main.querySelector('.skel-chapter-nav').after(gallery);
    main.querySelectorAll('[data-chapter-jump]').forEach(b=>b.onclick=()=>document.getElementById('skeletal-stage-'+b.dataset.chapterJump).scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'}));
  };

  function missionNavigation(n){return `<nav class="skel-mission-nav" aria-label="Skeletal mission sequence">${titles.map((title,i)=>preview()||open(i+1)?`<a href="${url(i+1)}" ${n===i+1?'aria-current="page"':''}><b>${number(i+1)}</b><span>${esc(title)}</span></a>`:`<span aria-disabled="true"><b>${number(i+1)}</b><span>${esc(title)}<small>Complete mission ${i} to unlock</small></span></span>`).join('')}</nav>`}

  mission=function(n){
    if(!Number.isInteger(n)||n<1||n>8){location.hash='world';return;}
    const practice=preview(),lesson=lessons[n-1];
    if(!practice&&!open(n)){
      layout(`<div class="skeletal-course">${modeBar(n)}<section class="panel skel-locked"><span class="eyebrow">MISSION ${number(n)}</span><h1>${esc(titles[n-1])}</h1><p>Complete mission ${n-1} to enter this investigation, or preview every activity now.</p><a class="btn" href="${url(n,true)}">Preview this mission →</a><a class="skel-preview-link" href="#world">Return to the mission map</a></section></div>`);return;
    }
    // Practice state belongs to this render only; no cloned/global learner state.
    let investigation=practice?false:state.rewards.includes('activity'+n),picks={},tries={};
    const labId='skeletal-investigation',checksId='skeletal-checks';
    layout(`<div class="skeletal-course skel-mission" data-skeletal-mission="${n}" data-preview="${practice}">${modeBar(n)}<a class="textlink" href="${url()}">← Skeletal mission map</a><header class="skel-mission-heading"><div><span class="eyebrow">STAGE ${number(chapterOf(n)+1)} · ${n===8?'FINAL CASE':'MISSION '+number(n)}</span><h1>${esc(titles[n-1])}</h1><p>${lesson.goal}</p></div><span class="skel-mission-emblem" aria-hidden="true">${number(n)}</span></header>${missionNavigation(n)}<nav class="skel-discovery-rail" aria-label="Mission activity order"><button type="button" data-skel-scroll="skeletal-study"><b>01</b><span>Observe the anatomy</span></button><button type="button" data-skel-scroll="${labId}"><b>02</b><span>Investigate & play</span></button><button type="button" data-skel-scroll="${checksId}"><b>03</b><span>Three science checks</span></button><button type="button" data-skel-scroll="skeletal-finish"><b>04</b><span>Secure your discovery</span></button></nav><div class="skel-lesson-layout"><div class="skel-lesson-main"><section class="skel-study-section" id="skeletal-study" aria-labelledby="skeletal-study-title"><div class="skel-section-label">01 · OBSERVE</div><h2 id="skeletal-study-title">Anatomy field study</h2><p>Choose a structure to see where it is and why it matters.</p><button type="button" class="skel-animation-toggle" aria-pressed="false">Pause activity animation</button><div id="skeletal-study-body"></div></section><section class="skel-lab-section" id="${labId}" aria-labelledby="skeletal-lab-title"><div class="skel-section-label">02 · INVESTIGATE</div><div class="skel-lab-heading"><h2 id="skeletal-lab-title">${A.names[n-1]}</h2><span data-lab-stamp>${investigation?'✓ INVESTIGATION SAVED':practice?'PRACTICE CHALLENGE':n===8?'FINAL INVESTIGATION':'+20 XP'}</span></div><div id="skeletal-lab-body"></div><div id="activity-feedback" role="status" aria-live="polite"></div></section><section class="skel-checks-section" id="${checksId}" aria-labelledby="skeletal-checks-title"><div class="skel-section-label">03 · CONNECT THE SCIENCE</div><h2 id="skeletal-checks-title">Three science checkpoints</h2><p>Use your observations to recall, apply and explain.</p><div id="quiz"></div></section><section class="skel-finish" id="skeletal-finish" aria-live="polite"></section></div><aside class="skel-field-guide"><div class="skel-guide-badge" aria-hidden="true">✧</div><span class="eyebrow">YOUR DISCOVERY</span><h2>${lesson.badge}</h2><p>${practice?'Practice freely. No progress is saved.':'Complete the investigation and all three checks.'}</p><div class="skel-discovery-count" role="status"></div><ol class="skel-guide-checklist"></ol><h3>Words to connect</h3><p>${lesson.terms}</p><details class="skel-science-note"><summary>Mission field notes</summary><ul>${lesson.tasks.map(t=>`<li>${t}</li>`).join('')}</ul><p>Follow the anatomical evidence, then explain the structure’s job in your own words.</p></details><a class="textlink" href="#sources">Read the science references ↗</a></aside></div></div>`);
    const root=document.querySelector('.skel-mission');
    const motion=root.querySelector('.skel-animation-toggle');
    motion.disabled=reduced();if(motion.disabled)motion.textContent='Reduced motion · manual exploration';
    motion.onclick=()=>{const paused=root.classList.toggle('skel-motion-paused');motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Play activity animation':'Pause activity animation';root.dispatchEvent(new CustomEvent('skeletal-motion-change',{detail:{paused}}));};
    const message=(text,correct=false)=>{
      const box=document.getElementById('activity-feedback');
      box.innerHTML=`<div class="skel-feedback ${correct?'is-correct':''}">${esc(text)}</div>`;
    };
    function complete(text){
      if(!investigation){
        investigation=true;
        if(!practice){if(n!==8)reward('activity'+n,20);else if(!state.rewards.includes('activity8')){state.rewards.push('activity8');save();}}
      }
      root.querySelector('[data-lab-stamp]').textContent=practice?'✓ PRACTICE EXPLORED':'✓ INVESTIGATION SAVED';
      message(text,true);finish();
    }
    function finish(){
      const correct=checks[n].filter((q,i)=>picks[i]===q.answer).length,total=correct+Number(investigation),ready=total===4;
      root.querySelector('.skel-discovery-count').textContent=`${total} / 4 discoveries ${practice?'explored':'secured'}`;
      root.querySelector('.skel-guide-checklist').innerHTML=['Investigation','Recall check','Apply check','Reason check'].map((title,i)=>`<li class="${(i===0?investigation:picks[i-1]===checks[n][i-1].answer)?'is-done':''}"><span aria-hidden="true">${(i===0?investigation:picks[i-1]===checks[n][i-1].answer)?'✓':'○'}</span>${title}</li>`).join('');
      const target=document.getElementById('skeletal-finish');
      target.innerHTML=`<span class="skel-section-label">04 · ${practice?'PRACTICE DISCOVERY':'SECURE YOUR DISCOVERY'}</span><h2>${ready?lesson.badge+' · ready!':'Bring your discoveries together'}</h2><p>${investigation?'✓ Investigation completed':'Complete the investigation'} · ${correct}/3 science checks passed</p>${practice?`<a class="btn" href="${url(n===8?0:n+1,true)}">${n===8?'Back to all missions':'Preview the next mission'} →</a><p class="note">You can browse the next activity at any time. Expedition progress stays unchanged.</p>`:`<button type="button" class="btn" id="complete" ${ready?'':'disabled'}>${state.done.includes(n)?'Completed · return to map':n===8?'Earn the Framework Key →':'Complete mission & unlock the next →'}</button>`}`;
      if(!practice)document.getElementById('complete').onclick=()=>{
        if(!ready)return;
        if(!state.done.includes(n)){state.done.push(n);if(n===8)reward('boss',50);save();}
        toast(n===8?'Framework Key earned · Skeletal Master!':'Discovery secured · next mission unlocked');location.hash='world';
      };
    }
    function drawQuiz(){
      document.getElementById('quiz').innerHTML=checks[n].map((q,i)=>{
        const correct=picks[i]===q.answer,answered=picks[i]!==undefined;
        return `<article class="skel-check ${correct?'is-secured':''}" id="skeletal-check-${i}"><header><span>${['RECALL','APPLY','REASON'][i]} · ${i+1} / 3</span><span>${correct?'✓ '+(practice?'PRACTICED':'DISCOVERY SAVED'):practice?'PRACTICE':'+10 XP'}</span></header><h3>${esc(q.text)}</h3><div class="skel-answer-options">${q.options.map((option,j)=>`<button type="button" class="skel-answer ${picks[i]===j?'is-picked':''}" data-skel-question="${i}" data-skel-answer="${j}" aria-pressed="${picks[i]===j}" ${correct?'disabled':''}><b aria-hidden="true">${'ABC'[j]}</b><span>${esc(option)}</span></button>`).join('')}</div>${answered?`<div class="skel-answer-feedback ${correct?'is-correct':''}" role="status">${correct?'Correct. ':tries[i]>1?'Science clue: ':'Look again. '}${esc(q.why)}</div>`:''}</article>`;
      }).join('');
      root.querySelectorAll('[data-skel-question]').forEach(b=>b.onclick=()=>{
        const i=Number(b.dataset.skelQuestion),j=Number(b.dataset.skelAnswer),q=checks[n][i];
        if(picks[i]===q.answer)return;
        picks[i]=j;tries[i]=(tries[i]||0)+1;
        window.InneruEvidence?.record({id:'skeletal:'+n+':q'+i,system:'skeletal',mission:n,kind:'check',title:'Science check '+(i+1),prompt:q.text,answer:q.options[j],expected:q.options[q.answer],correct:j===q.answer,feedback:q.why});
        if(!practice){
          if(j===q.answer){reward('q'+n+'-'+i,10);state.weak=state.weak.filter(w=>w!==n+'-'+i);}
          else if(!state.weak.includes(n+'-'+i))state.weak.push(n+'-'+i);
          save();
        }
        drawQuiz();finish();
        // Keep keyboard focus in the question after replacing its choices.
        const answer=root.querySelector(`[data-skel-question="${i}"][data-skel-answer="${j}"]`);
        if(answer&&!answer.disabled)answer.focus({preventScroll:true});
        else{const question=document.getElementById('skeletal-check-'+i);question.tabIndex=-1;question.focus({preventScroll:true});}
      });
    }
    A.mount({n,root:document.getElementById('skeletal-lab-body'),study:document.getElementById('skeletal-study-body'),preview:practice,complete,message,award:(id,xp)=>{if(!practice)reward(id,xp);}});
    drawQuiz();finish();
    root.querySelectorAll('[data-skel-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.skelScroll).scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'}));
  };
  // Subsequent decorators call the same public route; refresh this initial view.
  route();
})();
