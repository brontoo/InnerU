/* Deferred presentation over the current learner or the server-authorized teacher roster. */
(() => {
 'use strict';
 const M=InneruMasteryModel,L=InneruLearning,E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let currentStudent=null;
 const labels={insufficient:'Not enough evidence',developing:'Developing',secure:'Secure'};
 const world=id=>L.worlds.find(w=>w.id===id),context=id=>id==='circ'?'circulatory':id;
 const missionTitle=entry=>entry.final?world(entry.system).final:world(entry.system).titles[entry.number-1];
 const route=entry=>entry.final?L.finalRoute(world(entry.system)):L.missionRoute(world(entry.system),entry.number);
 function times(root=document){for(const el of root.querySelectorAll('[data-ms-time]'))el.textContent=new Intl.DateTimeFormat(InneruPreferences.get().language==='ar'?'ar-AE':'en-AE',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dubai'}).format(new Date(el.dateTime));}
 const option=(value,label,personal=false)=>`<option value="${E(value)}" ${personal?'data-iu-private dir="auto"':''}>${E(label)}</option>`;
 function shell(teacher=false){return `<section class="ms-page" data-mastery data-iu-locale="mastery" aria-label="Mastery evidence"><div class="ms-guidance"><h2>Learning evidence</h2><p data-support-instruction>Choose a body system. Open an objective to see recorded checks and feedback.</p><p>These statuses describe recorded checks, not lasting mastery. Points, badges and mission completion do not determine them.</p></div><details class="ms-criteria" data-ms-detail="criteria"><summary>How statuses are calculated</summary><dl><dt>Not enough evidence</dt><dd>No matched, automatically checked response is available. Written work and teacher comments remain visible but are not a grade.</dd><dt>Developing</dt><dd>There are missing checks, an incorrect latest response, or too little independent evidence.</dd><dt>Secure</dt><dd>Every check in a complete set is currently correct. At least two different checks were correct on their first recorded response. No matched check has an unresolved incorrect response.</dd></dl><p>Repeating one question does not create independent evidence. Only the latest response and up to four earlier attempts are retained. Missing history is not assumed correct.</p><p>One objective groups the existing checks for each mission or final challenge. This is evidence for that group, not a separate grade for every scientific concept.</p></details><div class="ms-filters">${teacher?'<label>Class<select data-ms-filter="class"></select></label><label>Student<select data-ms-filter="student"></select></label>':''}<label>Body system<select data-ms-filter="system">${option('','All systems')+L.worlds.map(w=>option(w.id,w.name)).join('')}</select></label><label>Mission<select data-ms-filter="mission"></select></label><label>Objective<select data-ms-filter="objective"></select></label><label>Evidence status<select data-ms-filter="status">${option('','All statuses')+Object.entries(labels).map(([v,l])=>option(v,l)).join('')}</select></label></div><p class="ms-count" role="status" aria-live="polite" data-ms-count></p>${!teacher?'<p data-ms-feedback-status role="status">Loading teacher comments…</p>':''}<div data-ms-results tabindex="-1"></div><nav class="ms-pagination" aria-label="Mastery pages" hidden><button type="button" data-ms-page="back">Previous page</button><span data-ms-page-label aria-live="polite"></span><button type="button" data-ms-page="next">Next page</button></nav></section>`;}
 function feedbackMarkup(row,feedback){
  const f=feedback?.[row.id];if(!f)return '';
  const current=Date.parse(f.submissionAt)===Date.parse(row.at);
  return `<aside class="ms-comment"><h4>Teacher feedback</h4><p>${current?'Feedback on this submission':'Feedback on an earlier submission'}</p>${f.note?`<p data-iu-private dir="auto">${E(f.note)}</p>`:''}<p>${f.reviewedAt?'Reviewed by a teacher; no mastery grade assigned.':'Teacher comment; no mastery grade assigned.'}</p></aside>`;
 }
 function reference(value){return String(value||'').split('\n').map(line=>{const parts=line.split(' → ');return '<p'+(parts.length>1?' class="ms-reference-flow" dir="ltr"':'')+'>'+parts.map(part=>'<bdi dir="auto">'+E(part)+'</bdi>').join(' → ')+'</p>';}).join('');}
 function explanation(value){const prefix='Review the lesson: ';return value?.startsWith(prefix)?'<p>Review the lesson</p><p>'+E(value.slice(prefix.length))+'</p>':'<p>'+E(value)+'</p>';}
 function responseMarkup(row,feedback,teacher){
  const reveal=teacher||row.correct===true||row.attempts>=2;
  const result=row.correct===null?'Not automatically graded':row.correct?'Correct':'Needs another look';
  return `<li class="ms-response" data-ms-response="${E(row.id)}"><h4 data-iu-locale="${context(row.system)}">${E(row.prompt||row.title)}</h4><p><strong>${result}</strong> · <span>Recorded attempts</span>: <bdi>${row.attempts}</bdi></p><p><span>Recorded on</span>: <time data-ms-time data-iu-private dir="auto" datetime="${E(row.at)}"></time> · <span>UAE time</span></p><p><strong>Submitted response</strong></p><p data-iu-private dir="auto">${E(row.answer)}</p><details data-ms-detail="history"><summary>Recent attempts</summary><p>Up to four earlier attempts are shown. These are attempts at the same check, not additional independent checks.</p><ol>${(row.history||[]).map(h=>`<li><span>${h.correct===null?'Not automatically graded':h.correct?'Correct':'Needs another look'}</span><p data-iu-private dir="auto">${E(h.answer)}</p></li>`).join('')}</ol>${!row.history?.length?'<p>No earlier attempt is available.</p>':''}</details>${reveal&&(row.expected||row.feedback)?`<details data-ms-detail="explanation"><summary>Check explanation</summary><div data-iu-locale="${context(row.system)}">${['sort','sequence'].includes(row.kind)?reference(row.expected):explanation(row.expected)}${explanation(row.feedback)}</div></details>`:row.correct===false?'<p>The explanation is hidden for now. Review the lesson and retry the check first.</p>':''}<div data-ms-feedback="${E(row.id)}">${feedbackMarkup(row,feedback)}</div></li>`;
 }
 function card(result,record,teacher){
  const {entry,status,evidence}=result;
  return `<article class="ms-objective" data-ms-objective="${entry.id}" data-ms-status="${status}">${teacher?`<p class="ms-person" data-iu-private dir="auto">${E(record.name)} · ${E(record.group)}</p>`:''}<p class="ms-system" data-iu-locale="mastery">${E(world(entry.system).name)}</p><h3 data-iu-locale="${context(entry.system)}">${E(missionTitle(entry))}</h3><div class="ms-feedback" data-support-instruction><p class="ms-goal"><strong>Objective</strong>: <span>${E(entry.objective)}</span></p><p class="ms-status ms-${status}"><span aria-hidden="true">${{secure:'✓',developing:'↗',insufficient:'○'}[status]}</span> ${labels[status]}</p><p>${result.reason}</p><p><span>Correct checks</span>: <bdi>${result.correct} / ${result.total}</bdi> · <span>Correct first recorded responses</span>: <bdi>${result.first}</bdi></p><p><strong>Next step</strong>: <span>${status==='secure'?'Explain your reasoning to your teacher and revisit it later.':status==='insufficient'?'Try the available lesson checks. If older work has no saved answers, ask your teacher how to show your understanding.':status==='developing'&&result.correct===result.total?'Discuss your reasoning with your teacher. Repeating a check does not add independent evidence.':'Review the mission diagram, then try the remaining checks.'}</span></p></div><a href="${route(entry)+(teacher?'?preview=1':'')}">${teacher?'Preview related lesson':'Open related lesson'}</a><details class="ms-evidence" data-ms-detail="evidence"><summary>Open evidence</summary>${evidence.length?`<ol>${evidence.map(r=>responseMarkup(r,record.feedback,teacher)).join('')}</ol>`:'<p>No matching responses are recorded for this objective. Older completed missions may not contain saved answers.</p>'}</details></article>`;
 }
 function mount(records,teacher=false,classes=[],preserved=null){
  const root=document.querySelector('[data-mastery]');if(!root)return;
  let page=preserved?.page||0,restoring=!!preserved;const pageSize=45;
  let prepared=records.map(r=>({...r,results:M.evaluate(r.responses)}));
  const controls=Object.fromEntries([...root.querySelectorAll('[data-ms-filter]')].map(el=>[el.dataset.msFilter,el]));
  const set=(key,values,all)=>{const el=controls[key],value=restoring?(preserved.filters[key]??el.value):el.value;el.innerHTML=option('',all)+values.map(([v,l])=>option(v,l,key==='student')).join('');if([...el.options].some(o=>o.value===value))el.value=value;};
  for(const [key,el] of Object.entries(controls))if(preserved?.filters[key]&&el.options.length)el.value=preserved.filters[key];
  if(teacher)set('class',[...new Set([...classes,...records.map(r=>r.group)])].sort().map(c=>[c,c]),'All assigned classes');
  function update(changed){
   if(!['page','refresh','restore'].includes(changed))page=0;
   window.InneruSpeech?.stop();
   const selected=prepared.filter(r=>(!controls.class?.value||r.group===controls.class.value));
   if(teacher&&(!changed||['class','restore'].includes(changed)))set('student',selected.map(r=>[r.id,r.name]),'All assigned students');
   const entries=InneruMasteryCatalog.filter(e=>!controls.system.value||e.system===controls.system.value);
   if(!changed||['system','restore'].includes(changed))set('mission',entries.map(e=>[e.id,missionTitle(e)]),'All missions');
   const objectives=entries.filter(e=>!controls.mission.value||e.id===controls.mission.value);
   if(!changed||['system','mission','restore'].includes(changed))set('objective',objectives.map(e=>[e.id,e.objective]),'All objectives');
   const shown=selected.filter(r=>!controls.student?.value||r.id===controls.student.value).flatMap(r=>r.results.filter(s=>(!controls.system.value||s.entry.system===controls.system.value)&&(!controls.mission.value||s.entry.id===controls.mission.value)&&(!controls.objective.value||s.entry.id===controls.objective.value)&&(!controls.status.value||s.status===controls.status.value)).map(result=>({r,result})));
   root.querySelector('[data-ms-count]').textContent=(['refresh','restore'].includes(changed)?'Evidence updated. ':'')+`${shown.length} objectives shown`;
   const pages=Math.ceil(shown.length/pageSize);page=Math.max(0,Math.min(page,Math.max(0,pages-1)));
   root.querySelector('.ms-pagination').hidden=pages<=1;
   root.querySelector('[data-ms-page-label]').textContent=`Page ${page+1} / ${Math.max(1,pages)}`;
   root.querySelector('[data-ms-page=back]').disabled=page===0;root.querySelector('[data-ms-page=next]').disabled=page>=pages-1;
   root.querySelector('[data-ms-results]').innerHTML=shown.length?shown.slice(page*pageSize,(page+1)*pageSize).map(({r,result})=>card(result,r,teacher)).join(''):'<p>No objectives match these filters.</p>';
   times(root);InneruLocale.refresh();
  }
  for(const [key,el] of Object.entries(controls))el.onchange=()=>update(key);
  for(const button of root.querySelectorAll('[data-ms-page]'))button.onclick=()=>{page+=button.dataset.msPage==='next'?1:-1;update('page');root.querySelector('[data-ms-results]').focus();};
  const key=el=>[el.closest('[data-ms-objective]')?.dataset.msObjective,el.closest('[data-ms-response]')?.dataset.msResponse||'',el.dataset.msDetail].join('|');
  function snapshot(){const active=document.activeElement;return {page,filters:Object.fromEntries(Object.entries(controls).map(([k,el])=>[k,el.value])),opened:[...root.querySelectorAll('[data-ms-detail][open]')].map(key),focused:active?.matches('summary')&&active.parentElement.matches('[data-ms-detail]')?key(active.parentElement):null,field:active?.dataset.msFilter,card:active?.closest('[data-ms-objective]')?.dataset.msObjective};}
  function restore(saved,focus=true){
   if(!saved||!root.isConnected)return;const opened=new Set(saved.opened);let restored=false;
   for(const detail of root.querySelectorAll('[data-ms-detail]')){if(opened.has(key(detail)))detail.open=true;if(focus&&saved.focused===key(detail)){detail.querySelector(':scope>summary').focus({preventScroll:true});restored=true;}}
   if(!focus)return;
   if(saved.field&&controls[saved.field]){controls[saved.field].focus({preventScroll:true});restored=true;}
   if(!restored&&saved.card){const heading=[...root.querySelectorAll('[data-ms-objective]')].find(el=>el.dataset.msObjective===saved.card)?.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
  }
  update(preserved?'restore':undefined);restoring=false;restore(preserved,false);
  return {snapshot,restore,refresh(){const saved=snapshot();prepared=records.map(r=>({...r,results:M.evaluate(r.responses)}));update('refresh');restore(saved);}};
 }
 async function student(){
  if(!InneruAccess.check('dashboard'))return;
  const user=InneruAccess.user;if(user?.role!=='student')return;
  const preserved=currentStudent?.root.isConnected&&currentStudent.id===user.id&&currentStudent.hash===location.hash?currentStudent.controller.snapshot():null;
  const snapshot=state,hash=location.hash;document.title='InnerU · Mastery';
  layout('<section class="sd-page"><header class="sd-topline"><h1>Mastery</h1><a href="#dashboard">Student Dashboard</a></header>'+shell()+'</section>','dashboard');
  const responses=InneruEvidence.normalise(snapshot.assessment)?.responses||[];
  const record={id:user.id,name:snapshot.name,group:user.classCode||'',responses,feedback:{}};
  const controller=mount([record],false,[],preserved);
  const root=document.querySelector('[data-mastery]');
  currentStudent={root,record,controller,id:user.id,hash,signature:JSON.stringify(responses)};
  // The existing route accessibility wrapper focuses main after rendering. On a
  // same-route cloud restore, return focus to the learner's retained disclosure.
  if(preserved)requestAnimationFrame(()=>requestAnimationFrame(()=>{if(root.isConnected&&location.hash===hash&&InneruAccess.user?.id===user.id)controller.restore(preserved);}));
  try{
   const feedback=await InneruCloud.api('my-feedback');
   if(state.authUserId!==user.id||location.hash!==hash||InneruAccess.user?.id!==user.id||!root.isConnected)return;
   // Patch only comments: a late response must not close evidence or steal focus.
   Object.assign(record.feedback,feedback);
   for(const slot of root.querySelectorAll('[data-ms-feedback]')){const row=record.responses.find(r=>r.id===slot.dataset.msFeedback);if(row)slot.innerHTML=feedbackMarkup(row,feedback);}
   root.querySelector('[data-ms-feedback-status]').textContent='Teacher comments are up to date.';InneruLocale.refresh();
  }catch{
   if(root.isConnected)root.querySelector('[data-ms-feedback-status]').textContent='Teacher comments are unavailable. Your recorded checks remain visible. Reopen this view when connected.';
  }
 }
 const previous=InneruRouteModules.renderer;
 InneruRouteModules.registerRenderer(function(){if(location.hash.split('?')[0]==='#dashboard'&&new URLSearchParams(location.hash.split('?')[1]).get('view')==='mastery')return student();return previous.apply(this,arguments);});
 function refreshStudent(){
  const current=currentStudent;if(!current?.root.isConnected||InneruAccess.user?.role!=='student'||InneruAccess.user?.id!==current.id||state.authUserId!==current.id)return;
  const responses=InneruEvidence.normalise(state.assessment)?.responses||[],signature=JSON.stringify(responses);
  if(signature===current.signature)return;
  current.signature=signature;current.record.responses=responses;current.controller.refresh();
 }
 document.addEventListener('inneru-progress',refreshStudent);
 window.addEventListener('hashchange',()=>{if(location.hash.split('?')[0]!=='#dashboard'||new URLSearchParams(location.hash.split('?')[1]).get('view')!=='mastery')currentStudent=null;});
 document.addEventListener('inneru-preferences-change',()=>times());
 window.InneruMastery={shell,mount,guideSteps:['Choose a body system.','Choose a mission or an evidence status to focus your view.','Open an objective to see recorded checks and feedback.','These statuses describe recorded checks, not lasting mastery.','Points, badges and mission completion do not determine them.','Open the related lesson when you are ready to review.','Your points and progress do not change when you read evidence.']};
})();
