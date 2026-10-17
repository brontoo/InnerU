/* Offline-first account sync. Revision conflicts always require a learner choice. */
(() => {
 'use strict';
 const A=window.InneruAccount,E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let user=null,info=null,ready=false,busy=false,applying=false,timer=0,problem='',conflict=null,promise=null,generation=0;
 const key=()=> 'inneru-cloud-meta-v1:'+user.id;
 let meta={revision:0,dirty:false};
 function persist(){localStorage.setItem(key(),JSON.stringify(meta));}
 const meaningful=p=>!!(p?.rewards?.length||p?.done?.length||p?.assessment?.responses?.length||p?.xp);
 function payload(){const out={...state};delete out.authUserId;delete out.avatarId;return out;}
 const signature=()=>JSON.stringify(payload());
 async function api(action,values){
  let response;try{response=await fetch('/api/learning?action='+encodeURIComponent(action),{method:values===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:values===undefined?{}:{'Content-Type':'application/json'},...(values===undefined?{}:{body:JSON.stringify(values)})});}catch{throw new Error('Cloud sync is offline. Your work is saved on this device.');}
  let data;try{data=await response.json();}catch{throw new Error('Cloud learning is not available on this deployment. Your work is saved on this device.');}
  if(!response.ok){const error=new Error(data.error||'Cloud learning is unavailable. Your local work is safe.');error.status=response.status;throw error;}return data;
 }
 function status(){if(ready&&user?.role!=='student')return 'Teacher classroom connected';return conflict?'Choose a saved version':busy?'Saving to your account…':problem?'Saved on this device · cloud needs attention':ready?(meta.dirty?'Saved on this device · waiting to sync':'Saved to your account'):'Connecting cloud learning…';}
 function paint(){
  document.querySelectorAll('[data-cloud-status]').forEach(n=>{n.textContent=status();});
  document.querySelectorAll('.iu-account-menu [data-account-status]').forEach(n=>{n.textContent=status();});
 }
 function replace(snapshot){
  if(!snapshot||!Array.isArray(snapshot.rewards)||!Array.isArray(snapshot.done))throw new Error('The cloud learning record could not be read.');
  applying=true;try{localStorage.setItem('inneru-cloud-recovery-v1:'+user.id,JSON.stringify(state));state={...snapshot,...A.identityFields({authUserId:user.id,avatarId:state.avatarId||user.avatarId})};save();}finally{applying=false;}
  route();
 }
 async function start(next){
  if(user?.id===next.id&&ready)return;const ticket=++generation;user=next;ready=false;problem='';
  try{
   meta=JSON.parse(localStorage.getItem(key())||'null')||{revision:0,dirty:meaningful(state)};
   const before=signature(),result=await api('state');if(ticket!==generation)return;info=result;
   if(user.role!=='student'){ready=true;meta.dirty=false;persist();paint();renderPanel();return;}
   const remote=result.progress;
   if(remote.snapshot&&((meta.dirty||signature()!==before)&&remote.revision!==meta.revision)){conflict=remote;ready=true;problem='';}
   else if(remote.snapshot&&!meta.dirty&&signature()===before){replace(remote.snapshot);meta.revision=remote.revision;meta.dirty=false;ready=true;}
   else{meta.revision=remote.revision;ready=true;meta.dirty=true;}
   persist();paint();renderPanel();if(meta.dirty&&!conflict)schedule();
  }catch(error){problem=error.message;paint();renderPanel();}
 }
 function schedule(){clearTimeout(timer);if(ready&&!conflict&&meta.dirty)timer=setTimeout(()=>flush().catch(()=>{}),900);}
 async function flush(){
  clearTimeout(timer);if(promise)return promise;if(!user||user.role!=='student'||!ready||!meta.dirty||conflict)return;
  const saved=signature(),value=payload(),revision=meta.revision,requestId=meta.requestId||crypto.randomUUID();meta.requestId=requestId;persist();busy=true;problem='';paint();
  promise=(async()=>{try{
   const result=await api('save',{snapshot:value,revision,requestId});meta.revision=result.revision;delete meta.requestId;
   if(value.xp!==result.snapshot.xp)toast('Cloud points reconciled with completed task credits. A device recovery copy is kept.');
   if(signature()===saved){
    applying=true;try{if(state.xp!==result.snapshot.xp)localStorage.setItem('inneru-cloud-recovery-v1:'+user.id,JSON.stringify(state));state.xp=result.snapshot.xp;state.rewards=result.snapshot.rewards;if(result.snapshot.learning)state.learning=result.snapshot.learning;state.done=result.snapshot.done;for(const world of InneruLearning.worlds){if(world.id==='skeletal'||!result.snapshot[world.id])continue;state[world.id]||={};state[world.id].done=result.snapshot[world.id].done;if(world.id!=='muscle')state[world.id].mastery=result.snapshot[world.id].mastery;}save();}finally{applying=false;}
    meta.dirty=false;document.dispatchEvent(new CustomEvent('inneru-progress',{detail:{cloud:true}}));
   }else meta.dirty=true;
   persist();
  }catch(error){problem=error.message;
   if(error.status===409){delete meta.requestId;const result=await api('state');conflict=result.progress;persist();}
   throw error;
  }finally{busy=false;promise=null;paint();renderPanel();if(meta.dirty&&!problem&&!conflict)schedule();}})();return promise;
 }
 function renderPanel(force=false){
  const host=document.querySelector('.td-page,.sd-page');if(!host||!user)return;
  let panel=host.querySelector('[data-cloud-panel]');if(!force&&panel&&(panel.contains(document.activeElement)||panel.querySelector('[data-cloud-student-detail]'))){paint();return;}if(!panel){panel=document.createElement('section');panel.className='iu-cloud-panel';panel.dataset.cloudPanel='';host.prepend(panel);}
  panel.innerHTML=`<div class="iu-cloud-heading"><div><span class="iu-cloud-kicker">YOUR INNERU ACCOUNT</span><h2>Learning, kept together.</h2><p data-cloud-status role="status">${E(status())}</p></div><button type="button" data-cloud-retry>Sync now ↻</button></div>${problem?`<p class="iu-cloud-notice" role="status">${E(problem)}</p>`:''}${conflict?'<div class="iu-cloud-notice"><b>There is another saved version.</b><p>Choose the record to continue with. A recovery copy of this device’s record is kept before replacement.</p><button type="button" data-cloud-use="remote">Use cloud record</button><button type="button" data-cloud-use="local">Use this device’s record</button></div>':''}${ready?`<p class="iu-cloud-small">${E(info.profile.role==='student'?'Student account':'Approved '+info.profile.role+' account')} · ${E(info.profile.role==='student'?((info.classes||[]).map(c=>c.name).join(', ')||'No class joined yet'):'Manage your classes and enrolled students')}</p>${info.profile.role==='student'?'<form data-cloud-join><label>Class code from your teacher<input name="code" required maxlength="32" autocomplete="off" placeholder="Paste your class code"></label><button type="submit">Join class</button></form>':'<div data-cloud-classroom><button type="button" data-cloud-open-classroom>Open cloud classroom</button></div>'}`:''}<p class="iu-cloud-small">${user.role==='student'?'Offline work stays on this device until it syncs. Account data is shared only with teachers of classes you join.':'Your classroom shows only students enrolled in your classes. Teacher feedback is saved with your account.'}</p>`;
  panel.querySelector('[data-cloud-retry]').onclick=async()=>{try{if(!ready){user=null;await start(A.currentUser);}else await flush();}catch{}paint();};
  panel.querySelectorAll('[data-cloud-use]').forEach(b=>b.onclick=async()=>{if(b.dataset.cloudUse==='remote'){replace(conflict.snapshot);meta.dirty=false;}else meta.dirty=true;meta.revision=conflict.revision;delete meta.requestId;conflict=null;problem='';persist();renderPanel(true);if(meta.dirty)await flush().catch(()=>{});});
  panel.querySelector('[data-cloud-join]')?.addEventListener('submit',async event=>{event.preventDefault();const form=event.target;form.querySelector('button').disabled=true;try{await api('join-class',{code:new FormData(form).get('code')});const result=await api('state');info.classes=result.classes;problem='';}catch(error){problem=error.message;}renderPanel(true);});
  panel.querySelector('[data-cloud-open-classroom]')?.addEventListener('click',()=>classroom(panel.querySelector('[data-cloud-classroom]')));
  const recovery=localStorage.getItem('inneru-cloud-recovery-v1:'+user.id);if(recovery){const button=document.createElement('button');button.type='button';button.textContent='Download device recovery copy';button.onclick=()=>{const url=URL.createObjectURL(new Blob([recovery],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='inneru-learning-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};panel.append(button);}
 }
 async function classroom(host){
  host.textContent='Opening assigned students…';
  try{const data=await api('classroom');host.innerHTML=`<form data-cloud-create><label>New class name<input name="name" maxlength="80" required placeholder="Grade 10 · Group A"></label><button>Create class</button></form><div class="iu-cloud-classes">${data.classes.map(c=>`<article><b>${E(c.name)}</b><label>Share this class code<input readonly value="${E(c.join_code)}" aria-label="Class code for ${E(c.name)}"></label></article>`).join('')}</div><p class="iu-cloud-small">${data.students.length} assigned student accounts · Select a student to inspect their saved work.</p><div class="iu-cloud-roster">${data.students.map(s=>`<button type="button" data-cloud-student="${E(s.id)}"><b>${E(s.name)}</b><span>${E(s.group)} · ${Number(s.snapshot?.xp)||0} XP</span></button>`).join('')}</div><div data-cloud-student-detail></div>`;
   host.querySelector('[data-cloud-create]').onsubmit=async e=>{e.preventDefault();try{await api('create-class',{name:new FormData(e.target).get('name')});await classroom(host);}catch(error){alert(error.message);}};
   host.querySelectorAll('[data-cloud-student]').forEach(button=>button.onclick=()=>studentDetail(data.students.find(s=>s.id===button.dataset.cloudStudent),host.querySelector('[data-cloud-student-detail]')));
  }catch(error){host.textContent=error.message;}
 }
 function studentDetail(s,host){
  if(!s.snapshot){host.textContent=s.name+' has not synced learning yet.';return;}
  const p=InneruLearning.snapshot(s.snapshot),responses=s.snapshot.assessment?.responses||[];
  host.innerHTML=`<h3>${E(s.name)} · ${p.percent}% explored</h3><p>${p.xp} XP · ${p.missions} missions · ${p.keys} keys · ${p.earned.length} achievements</p><div class="iu-cloud-system-grid">${p.worlds.map(w=>`<div><b>${E(w.name)}</b><span>${w.percent}% · ${w.done.length}/${w.titles.length} missions</span></div>`).join('')}</div><details><summary>Earned achievements (${p.earned.length})</summary>${p.earned.map(b=>`<p>✧ ${E(b.name)}</p>`).join('')||'<p>No earned achievements yet.</p>'}</details><h4>Submitted answers · ${responses.length}</h4>${responses.map(r=>{const f=s.feedback?.[r.id];return `<article class="iu-cloud-answer"><b>${E(r.title||r.prompt)}</b><p>${E(r.prompt)}</p><pre>${E(r.answer)}</pre><small>${r.correct===true?'Activity reported correct':r.correct===false?'Activity reported incorrect':'Teacher review needed'} · ${E(r.at)}</small><form data-cloud-feedback="${E(r.id)}"><label>Teacher feedback<textarea maxlength="6000">${E(f?.note||'')}</textarea></label><label><input type="checkbox" ${f?.reviewedAt&&f?.submissionAt===r.at?'checked':''}> Reviewed this submission</label><button>Save feedback</button><span role="status"></span></form></article>`;}).join('')||'<p>No submitted answers saved yet.</p>'}`;
  host.querySelectorAll('[data-cloud-feedback]').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const r=responses.find(r=>r.id===form.dataset.cloudFeedback),button=form.querySelector('button');button.disabled=true;try{await api('feedback',{studentId:s.id,responseId:r.id,note:form.querySelector('textarea').value,reviewed:form.querySelector('input').checked,submissionAt:r.at});form.querySelector('[role=status]').textContent='Feedback saved to the class.';}catch(error){form.querySelector('[role=status]').textContent=error.message;}finally{button.disabled=false;}});
 }
 const oldSave=save;save=function(){const result=oldSave.apply(this,arguments);if(user?.role==='student'&&!applying&&state.authUserId===user.id&&!InneruLearning.preview()){meta.dirty=true;delete meta.requestId;try{persist();}catch{}schedule();paint();}return result;};
 const oldLayout=layout;layout=function(){const result=oldLayout.apply(this,arguments);queueMicrotask(()=>{renderPanel();paint();});return result;};
 document.addEventListener('inneru-account',event=>start(event.detail.user));
 window.addEventListener('online',()=>{if(ready)schedule();else if(A.currentUser){user=null;start(A.currentUser);}});
 window.addEventListener('storage',event=>{if(event.key==='bodyquest-v1'&&user&&state.authUserId===user.id){meta.dirty=true;try{persist();}catch{}schedule();}});
 window.InneruCloud={api,start,flush,status,beforeLogout:async()=>{try{await flush();}catch{}if(ready&&(meta.dirty||conflict)&&!confirm('Some work has not reached the cloud yet. Sign out and keep it in this device’s account archive?'))throw new Error('Sign out cancelled. Your local work is still open.');}};
 if(A.currentUser)start(A.currentUser);
})();
