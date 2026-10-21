/* Small administrative view. All reads/writes are checked again by API and SQL. */
(() => {
 'use strict';
 const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tr=s=>window.InneruLocale?InneruLocale.t(s):s;
 let ticket=0,records=null;
 const here=()=>location.hash.slice(1).split(/[/?]/)[0]==='owner';
 async function api(action='staffing',values){
  let response;try{response=await fetch('/api/owner?action='+action,{method:values?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:values?{'Content-Type':'application/json'}:{},...(values?{body:JSON.stringify(values)}:{})});}
  catch{throw new Error('School assignments could not be reached. Reconnect and try again.');}
  let data;try{data=await response.json();}catch{throw new Error('School assignments could not be read. Try again.');}
  if(!response.ok)throw new Error(data.error||'Owner management is unavailable. Please try again.');return data;
 }
 const status=c=>!c.teacherEmail?'No teacher assigned':!c.teacherId?'Registration pending':c.approved?'Approved teacher':'Approval pending';
 const identity=c=>`<span data-iu-private>${E(c.teacherName||'')}${c.teacherEmail?` <bdi dir="ltr">${E(c.teacherEmail)}</bdi>`:''}</span>`;
 function notice(text,error=false){const node=document.querySelector('[data-owner-status]');if(node){node.classList.toggle('owner-error',error);node.textContent=tr(text);}}
 function draw(data,message=''){
  records=data;
  layout(`<section class="owner-page" aria-label="School assignments"><header class="owner-heading"><div><p class="eyebrow">OWNER WORKSPACE</p><h1 tabindex="-1">Teachers & class assignments</h1><p>Review teacher access and manage the six school classes.</p></div><button class="btn secondary" type="button" data-owner-refresh>Refresh assignments</button></header><p data-owner-status role="status" aria-live="polite"></p>
   <section class="panel"><h2>Current class assignments</h2><p>Assignment does not approve a teacher. Students stay in their selected class, and their work is kept.</p><form data-owner-form><div class="owner-classes">${data.classes.map(c=>`<article class="owner-class"><h3><bdi>${E(c.code)}</bdi></h3><p>Current teacher: ${identity(c)}</p><p>${E(status(c))}</p><label for="owner-${E(c.code)}">Assign teacher for <bdi>${E(c.code)}</bdi></label><select id="owner-${E(c.code)}" data-owner-class="${E(c.code)}"><option value=""${!c.teacherEmail?' selected':''}>No teacher assigned</option>${c.teacherEmail&&!data.teachers.some(t=>t.id===c.teacherId)?`<option value="${E(c.teacherId||'pending')}" selected disabled>${E(c.teacherName||c.teacherEmail)} · ${tr(status(c))}</option>`:''}${data.teachers.map(t=>`<option value="${E(t.id)}" ${t.id===c.teacherId?'selected':''} ${!t.verified?'disabled':''}>${E(t.name)} — ${E(t.email)} · ${tr(t.approved?'Approved teacher':t.verified?'Approval pending':'Email confirmation required')}</option>`).join('')}</select></article>`).join('')}</div><button class="btn" type="submit">Review assignment changes</button></form></section>
   <section class="panel"><h2>Teacher approval</h2><p>Only verified accounts that requested teacher access can be approved. Approval and class assignment are separate.</p>${data.teachers.length?`<ul class="owner-list">${data.teachers.map(t=>`<li><div><b data-iu-private>${E(t.name)}</b><br><span data-iu-private>${E(t.email)}</span><p>${E(t.approved?'Approved teacher':t.verified?'Approval pending':'Email confirmation required')}</p></div>${t.approved?'':`<button class="btn secondary" type="button" data-owner-approve="${E(t.id)}" ${!t.verified?'disabled':''}>Review approval</button>`}</li>`).join('')}</ul>`:'<p>No teacher requests yet.</p>'}</section>
   <section class="panel"><h2>Recent staffing changes</h2><p>Latest 50 changes, recorded with the acting owner.</p>${data.audit.length?`<ol class="owner-list">${data.audit.map(a=>`<li><div><b>${E(a.action==='approval'?'Teacher approved':'Assignment changed')}</b>${a.action==='assignment'?` · <bdi>${E(a.after_value.classCode)}</bdi><p><span data-iu-private>${E(a.before_value.teacherEmail||'—')}</span> → <span data-iu-private>${E(a.after_value.teacherEmail||'—')}</span></p>`:`<p data-iu-private>${E(data.teachers.find(t=>t.id===a.target_id)?.email||a.target_id)}</p>`}<small><time datetime="${E(a.created_at)}">${E(new Intl.DateTimeFormat(InneruPreferences.get().language==='ar'?'ar-AE':'en-AE',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dubai'}).format(new Date(a.created_at)))}</time> · <span data-iu-private>${E(a.actor_email)}</span></small></div></li>`).join('')}</ol>`:'<p>No staffing changes recorded yet.</p>'}</section>
   <dialog data-owner-dialog aria-labelledby="owner-dialog-title"><h2 id="owner-dialog-title">Confirm changes</h2><div data-owner-review></div><p data-owner-dialog-status role="alert"></p><div class="controls"><button class="btn secondary" type="button" data-owner-cancel>Cancel</button><button class="btn" type="button" data-owner-confirm>Confirm changes</button></div></dialog></section>`,'teacher');
  document.title='InnerU · School assignments';const crumb=document.querySelector('.topbar .crumb');if(crumb)crumb.textContent='Grade 10 Science / School assignments';
  document.querySelector('[data-owner-refresh]').onclick=()=>render();
  document.querySelector('[data-owner-form]').onsubmit=event=>{
   event.preventDefault();const changes=[];
   document.querySelectorAll('[data-owner-class]').forEach(select=>{const c=records.classes.find(c=>c.code===select.dataset.ownerClass),before=c.teacherId||(c.teacherEmail?'pending':'');if(select.value!==before)changes.push({classCode:c.code,teacherId:select.value||null,expectedTeacherEmail:c.teacherEmail});});
   if(!changes.length){notice('No assignment changes selected.');return;}
   confirm(`<p>Review these assignments before saving:</p><ul>${changes.map(c=>{const current=records.classes.find(x=>x.code===c.classCode),next=records.teachers.find(t=>t.id===c.teacherId);return `<li><bdi>${E(c.classCode)}</bdi>: ${identity(current)} → ${next?`<span data-iu-private>${E(next.name)} — ${E(next.email)}</span>`:tr('No teacher assigned')}${!c.teacherId?`<p>${tr('Remove this teacher from the class? They will lose access to its students.')}</p>`:''}</li>`;}).join('')}</ul><p>Student class membership, progress and mission settings stay unchanged.</p>`,()=>api('assign',{changes}),event.submitter,'Assignments saved.');
  };
  document.querySelectorAll('[data-owner-approve]').forEach(button=>button.onclick=()=>{const t=records.teachers.find(t=>t.id===button.dataset.ownerApprove);confirm(`<p>Approve teacher access for this verified account?</p><p data-iu-private>${E(t.name)} — ${E(t.email)}</p><p>Only its assigned classes will be available. Owner access will not be granted.</p>`,()=>api('approve',{teacherId:t.id}),button,'Teacher approved.');});
  document.querySelector('h1').focus();if(message)notice(message);
 }
 function confirm(review,save,opener,success){
  const dialog=document.querySelector('[data-owner-dialog]'),confirmButton=dialog.querySelector('[data-owner-confirm]'),cancel=dialog.querySelector('[data-owner-cancel]');
  dialog.querySelector('[data-owner-review]').innerHTML=review;dialog.querySelector('[data-owner-dialog-status]').textContent='';
  confirmButton.disabled=false;cancel.disabled=false;
  cancel.onclick=()=>dialog.close();dialog.onclose=()=>opener?.isConnected&&opener.focus();
  dialog.oncancel=event=>{if(confirmButton.disabled)event.preventDefault();};
  dialog.showModal();cancel.focus();window.InneruLocale?.translate(dialog);
  confirmButton.onclick=async()=>{const request=ticket;confirmButton.disabled=true;cancel.disabled=true;try{const result=await save();if(request!==ticket||!here())return;dialog.close();draw(result,success);}catch(error){if(request!==ticket||!here())return;dialog.querySelector('[data-owner-dialog-status]').textContent=tr(error.message);confirmButton.disabled=false;cancel.disabled=false;}};
 }
 async function render(){
  const request=++ticket;
  if(InneruAccess.user?.role!=='admin')return;
  layout('<section class="owner-page"><h1>School assignments</h1><p role="status">Loading school assignments…</p></section>','teacher');
  try{const data=await api();if(request===ticket&&here())draw(data);}
  catch(error){if(request!==ticket||!here())return;layout(`<section class="owner-page panel"><h1>School assignments</h1><p role="alert">${E(error.message)}</p><button class="btn secondary" data-owner-refresh>Refresh assignments</button></section>`,'teacher');document.querySelector('[data-owner-refresh]').onclick=()=>render();}
 }
 const previous=InneruRouteModules.renderer;
 InneruRouteModules.registerRenderer(function(){if(here())return render();ticket++;return previous.apply(this,arguments);});
})();
