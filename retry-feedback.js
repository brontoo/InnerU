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
})();
