/* Display-only help. Recording, correctness and rewards remain in existing activities. */
(() => {
 'use strict';
 function hint(id){
  const entry=InneruMasteryCatalog.find(e=>e.checks.includes(id)||e.additional.includes(id)||e.alternatives?.some(s=>s.includes(id))||(e.system==='muscle'&&id.startsWith('muscle:m'+e.number+'-'))||(e.system==='circ'&&id.startsWith('circ:m'+e.number+'-')));
  return entry?.hint||'Review the mission diagram, then try the remaining checks.';
 }
 function text(id,correct,explanation,element,attempts){
  if(element)element.setAttribute('data-iu-locale','mastery');
  if(correct)return 'Correct. '+explanation;
  const count=attempts||Number(element?.dataset.iuRetry||0)+1;
  if(element)element.dataset.iuRetry=count;
  return count<2?'Not yet. '+hint(id):'Review the explanation, then try again. '+explanation;
 }
 window.InneruRetry={hint,text};
 document.addEventListener('inneru-route-ready',()=>{
  const mission=window.InneruMissionAccess?.parse(),main=document.querySelector('main.main');
  if(!mission||!main||main.querySelector('.iu-mission-access-notice,[data-route-loading],[data-route-retry],[data-mission-objective]'))return;
  const entry=InneruMasteryCatalog.find(e=>e.system===mission.world.id&&e.number===mission.number);if(!entry)return;
  const section=document.createElement('section');section.className='iu-mission-goal';section.dataset.missionObjective=entry.id;section.dataset.iuLocale='mastery';
  const heading=document.createElement('strong');heading.textContent='Objective';const objective=document.createElement('p');objective.textContent=entry.objective;objective.dataset.supportInstruction='';
  const evidence=document.createElement('p');evidence.textContent='Your lesson checks and submitted explanations provide evidence. Completion and mastery are shown separately.';
  section.append(heading,objective,evidence);
  if(window.InneruAccess?.user?.role==='student'){
   section.classList.add('iu-mission-navigation');section.setAttribute('aria-label','Mission navigation and objective');
   const trail=document.createElement('nav');trail.className='iu-mission-trail';trail.setAttribute('aria-label','Current lesson');
   trail.innerHTML='<a href="#dashboard">Student Dashboard</a><span aria-hidden="true">/</span><span>'+esc(mission.world.name+' System')+'</span><bdi dir="ltr">'+mission.number+' / '+(mission.world.titles.length+1)+'</bdi>';
   section.prepend(trail);
   const stateText=document.createElement('p');stateText.className='iu-mission-position';stateText.dataset.missionPosition='';
   const update=()=>{if(!section.isConnected)return;const w=InneruLearning.snapshot().worlds.find(w=>w.id===mission.world.id),complete=entry.final?w.key:w.done.includes(mission.number);stateText.textContent=complete?'Completed in your saved record':'Complete the required lesson tasks to finish this mission.';};
   section.append(stateText);
   const jumps=document.createElement('div');jumps.className='iu-mission-jumps';
   const targets=[['Explore the activity','#skeletal-lab-body,.resp-activity-game,.integ-quest,#circ-lab,.exc-lab,.mq-panel'],['Check your understanding','.quizquestion,[data-skel-question],.resp-question,[data-question],.circ-question,[data-exc-question],[data-tissue-answer]'],['Open the written response','textarea']];
   const seen=new Set();for(const [label,selector] of targets){const target=main.querySelector(selector);if(!target||seen.has(target))continue;seen.add(target);const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{for(let parent=target.parentElement;parent&&parent!==main;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;target.tabIndex=target.tabIndex<0?-1:target.tabIndex;target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:motionReduced()?'instant':'smooth'});};jumps.append(button);}
   if(jumps.childElementCount)section.append(jumps);
   const help=document.createElement('details'),summary=document.createElement('summary');help.className='iu-mission-evidence';summary.textContent='About learning evidence';help.append(summary,evidence);section.append(help);
   const crumb=document.querySelector('.topbar .crumb');if(crumb)crumb.innerHTML='<span>Grade 10 Science</span><span aria-hidden="true"> / </span><span>'+esc(mission.world.name+' System')+'</span>';
   section.updateMissionNavigation=update;
  }
  const preview=main.querySelector('.iu-teacher-preview-bar'),intro=InneruAccess.user?.role==='student'&&main.querySelector('.skel-mission-heading,.mq-mission-heading,.resp-mission-header,.circ-mission-head,.exc-mission-header,.quest-finale-hero');if(preview)preview.after(section);else if(intro)intro.after(section);else main.prepend(section);section.updateMissionNavigation?.();
 });
 document.addEventListener('inneru-progress',()=>document.querySelector('[data-mission-objective]')?.updateMissionNavigation?.());
})();
