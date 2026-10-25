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
  section.append(heading,objective,evidence);const preview=main.querySelector('.iu-teacher-preview-bar');if(preview)preview.after(section);else main.prepend(section);
 });
})();
