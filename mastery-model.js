/* Pure, conservative read model. Never reads completion, rewards, XP or time-on-task. */
(() => {
 'use strict';
 const catalog=window.InneruMasteryCatalog;
 function firstCorrect(row){
  if(row.attempts===1)return row.correct===true&&row.history?.length===0;
  // History is capped at four: never guess an earlier outcome when it was discarded.
  return row.attempts>1&&row.attempts<=5&&row.history?.length===row.attempts-1&&row.history[0].correct===true;
 }
 function objective(entry,responses){
  const sets=[entry.checks,...entry.alternatives||[]],ids=new Set([...sets.flat(),...entry.written,...entry.additional]);
  const mapped=new Map();
  for(const row of responses){
   const submission=typeof row.id==='string'&&entry.submissions?.some(prefix=>row.id.startsWith(prefix))&&row.kind==='submission'&&row.correct===null;
   if((!ids.has(row.id)&&!submission)||row.system!==entry.system)continue;
   if(!entry.final&&row.mission!==entry.number&&!(submission&&row.mission===0))continue;
   if(entry.final&&![0,entry.number].includes(row.mission))continue;
   // A duplicated ID cannot become a second independent check.
   const previous=mapped.get(row.id);if(!previous||Date.parse(row.at)>Date.parse(previous.at))mapped.set(row.id,row);
  }
  const evidence=[...mapped.values()],graded=evidence.filter(r=>(sets.some(s=>s.includes(r.id))||entry.additional.includes(r.id))&&typeof r.correct==='boolean');
  const candidates=sets.map(ids=>({total:ids.length,answered:graded.filter(r=>ids.includes(r.id)).length,correct:graded.filter(r=>ids.includes(r.id)&&r.correct).length,first:graded.filter(r=>ids.includes(r.id)&&firstCorrect(r)).length}));
  const first=graded.filter(firstCorrect).length;
  const best=candidates.sort((a,b)=>Number(b.correct===b.total)-Number(a.correct===a.total)||b.correct/b.total-a.correct/a.total||b.answered/b.total-a.answered/a.total)[0];
  const wrong=graded.some(r=>r.correct===false);
  const status=!graded.length?'insufficient':!wrong&&best.correct===best.total&&first>=2?'secure':'developing';
  const reason=status==='insufficient'?'No matched, automatically checked responses are recorded yet.':status==='secure'?'All checks in one complete set are correct, with at least two correct first recorded responses.':wrong?'A recorded check needs another look.':best.correct<best.total?'Some required checks are missing or not yet correct.':'Corrected answers show progress. More independent evidence is needed.';
  const nextStep=status==='secure'?'Explain your reasoning to your teacher and revisit it later.':status==='insufficient'?'Try the available lesson checks. If older work has no saved answers, ask your teacher how to show your understanding.':!wrong&&best.correct===best.total?'Your corrections are recorded. A later, different assessment is needed for independent evidence. Ask your teacher about a follow-up; repeating these checks cannot meet this requirement.':'Review the mission diagram, then try the remaining checks.';
  return {entry,status,reason,...best,first,evidence,nextStep,unresolved:wrong};
 }
 function evaluate(responses=[]){return catalog.map(entry=>objective(entry,Array.isArray(responses)?responses:[]));}
 window.InneruMasteryModel={evaluate,objective,firstCorrect};
})();
