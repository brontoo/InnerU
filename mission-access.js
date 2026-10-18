/* Authoritative mission access; teacher previews use a disposable in-memory record. */
(() => {
 'use strict';
 const L=window.InneruLearning,A=window.InneruAccount;
 const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let catalog=null,previewState=null,previewActive=false,browseActive=false,ticket=0,refreshing=null;
 async function api(action,values){
  const response=await fetch('/api/learning?action='+action,{method:values===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:values===undefined?{}:{'Content-Type':'application/json'},...(values===undefined?{}:{body:JSON.stringify(values)})});
  let data;try{data=await response.json();}catch{throw new Error('Mission access could not be checked. Please reconnect and try again.');}
  if(!response.ok)throw new Error(data.error||'This mission is not available for this account.');return data;
 }
 function parse(href=location.hash){
  const [path,query='']=href.replace(/^#/,'').split('?');let w,n;
  if(path.startsWith('mission/')){w=L.worlds.find(w=>w.id==='skeletal');n=Number(path.split('/')[1]);}
  else{w=L.worlds.find(w=>w.route.slice(1)===path.split('/')[0]);if(w){const parts=path.split('/');if(parts[1]==='mastery'||parts[1]==='boss'||parts[1]==='complete')n=w.titles.length+1;else if(parts[1]==='mission')n=Number(parts[2]);else if(w.id==='circ'&&parts.length===2)n=Number(parts[1]);}}
  if(!w||!Number.isInteger(n)||n<1||n>w.titles.length+1)return null;
  return {world:w,number:n,preview:new URLSearchParams(query).get('preview')==='1'};
 }
 function normalRoute(m){return m.number>m.world.titles.length?L.finalRoute(m.world):L.missionRoute(m.world,m.number);}
 function restorePreview(){if(previewState){state=previewState;previewState=null;}previewActive=false;browseActive=false;}
 function beginPreview(m){
  if(!previewState)previewState=state;
  state=structuredClone(previewState);state.rewards=[];state.done=[];
  for(const w of L.worlds){const done=Array.from({length:m.number-1},(_,i)=>i+1);if(w.id==='skeletal')state.done=w.id===m.world.id?done:[];else state[w.id]={done:w.id===m.world.id?done:[],steps:{},tasks:{},weak:[],mastery:false};}
  previewActive=true;browseActive=!!m.browse;
 }
 const priorSave=save,priorReward=reward;
 save=function(){if(previewActive)return;return priorSave.apply(this,arguments);};
 reward=function(){if(previewActive)return;return priorReward.apply(this,arguments);};
 async function refresh(){
  if(!A.currentUser&&!InneruAccess.user)return null;
  if(refreshing)return refreshing;
  refreshing=api('mission-catalog').then(data=>{catalog=data;decorate();return data;}).finally(()=>{refreshing=null;});return refreshing;
 }
 function gateFor(m){return catalog?.systems.find(w=>w.id===m.world.id)?.missions.find(row=>row.number===m.number);}
 const systemPath=href=>L.worlds.some(w=>w.route.slice(1)===href.replace(/^#/,'').split(/[/?]/)[0]);
 function decorate(){
  const user=InneruAccess.user;if(!user)return;
  const main=document.querySelector('main.main');if(!main)return;
  if(previewActive){
   if(!main.querySelector('.iu-teacher-preview-bar')){const bar=document.createElement('aside');bar.className='iu-teacher-preview-bar';bar.dataset.previewMission=browseActive?'system':parse()?.world.id+'-'+parse()?.number;bar.setAttribute('aria-label','Teacher preview');bar.innerHTML='<div><b>TEACHER MISSION PREVIEW</b><p>Try the activities freely. Student progress and class locks stay unchanged.</p></div><a href="#home">Explore Worlds</a><a href="#teacher?view=preview">All mission previews</a><a href="#teacher?view=controls">Control Panel</a>';main.prepend(bar);}
   const crumb=document.querySelector('.topbar .crumb');if(crumb)crumb.textContent='Grade 10 Science / Teacher mission preview';
   main.querySelectorAll('a[href^="#"]').forEach(link=>{const m=parse(link.getAttribute('href'));if(m)link.href=normalRoute(m)+'?preview=1';});return;
  }
  if(InneruAccess.teacher(user)&&main.querySelector('.explore-screen')){
   const screen=main.querySelector('.explore-screen');
   if(!screen.querySelector('.iu-home-teacher-note')){const note=document.createElement('aside');note.className='iu-home-teacher-note';note.innerHTML='<span><b>Teacher exploration</b> · Explore the body systems and preview lessons. Student progress stays unchanged.</span><a href="#teacher">Open your Dashboard →</a>';screen.prepend(note);}
   main.querySelectorAll('a[href="#dashboard"]').forEach(link=>{link.href='#teacher';if(link.textContent.includes('discoveries'))link.innerHTML='Your classroom ↗';});
   main.querySelectorAll('a[href="#detective"],a[href="#connect"],a[href="#final"]').forEach(link=>{link.href='#teacher?view=preview';});
  }
  if(user.role!=='student'||!catalog)return;
  main.querySelectorAll('.skel-mode-bar,.resp-preview-bar,.integ-preview-bar,.exc-mode-banner').forEach(bar=>{const title=bar.querySelector('b,strong'),description=bar.querySelector('p');if(title)title.textContent='Your class mission pathway';if(description)description.textContent='Open the missions your teacher has unlocked, and complete each discovery before the next one.';});
  main.querySelectorAll('a[href^="#"]').forEach(link=>{
   const raw=link.getAttribute('href'),m=parse(raw);
   if(!m){if(raw.includes('preview=1')&&systemPath(raw))link.remove();return;}
   if(m.preview&&/preview|browse freely/i.test(link.textContent)){link.remove();return;}
   if(m.preview)link.setAttribute('href',normalRoute(m));
   const g=gateFor(m);if(!g)return;
   link.classList.toggle('iu-mission-locked',!g.allowed);
   if(!g.allowed){link.setAttribute('aria-disabled','true');link.title=g.reason;link.dataset.missionLockReason=g.reason;}else{link.removeAttribute('aria-disabled');if(link.dataset.missionLockReason)link.removeAttribute('title');delete link.dataset.missionLockReason;}
  });
  const cards=main.querySelectorAll('.missioncard,.resp-card,.circ-card,.mq-path-card,.exc-mission-card');
  const current=L.worlds.find(w=>location.hash.split('?')[0]===w.route);
  if(current)cards.forEach((card,i)=>{
   const g=catalog.systems.find(w=>w.id===current.id)?.missions.find(m=>m.number===i+1);if(!g)return;
   let note=card.querySelector('.iu-mission-lock-note');if(g.allowed){note?.remove();return;}
   if(!note){note=document.createElement('p');note.className='iu-mission-lock-note';note.setAttribute('role','note');card.append(note);}note.textContent=g.reason;card.classList.add('iu-locked-card');
  });
 }
 function unavailable(message,m){layout(`<section class="iu-mission-access-notice" role="status"><span class="td-kicker">YOUR LEARNING PATH</span><h1>One discovery at a time.</h1><p>${E(message)}</p><div class="td-actions"><a class="td-button" href="${m?m.world.route:'#dashboard'}">${m?'Return to the system':'Student Dashboard'}</a>${m?'<a class="td-button td-button-outline" href="#dashboard">Student Dashboard</a>':''}<button type="button" class="td-button td-button-outline" data-access-retry>Check again</button></div></section>`,'dashboard');document.querySelector('[data-access-retry]').onclick=()=>route();}
 const oldLayout=layout;layout=function(){const result=oldLayout.apply(this,arguments);queueMicrotask(decorate);return result;};
 const priorRoute=route;window.removeEventListener('hashchange',priorRoute);
 route=async function(){
  const request=++ticket,hash=location.hash,user=InneruAccess.user,isTeacher=InneruAccess.teacher(user),landing=isTeacher&&L.worlds.find(w=>w.route===hash.split('?')[0]),m=parse(hash)||(landing?{world:landing,number:1,preview:true,browse:true}:null);
  if(!m){restorePreview();if(user?.role==='student'&&hash.includes('preview=1')&&systemPath(hash)){unavailable('Mission previews are available only to teachers.');return;}if(user?.role==='student'&&L.worlds.some(w=>w.route===hash.split('?')[0])){try{await refresh();}catch(error){unavailable(error.message);return;}if(request!==ticket||hash!==location.hash)return;}return priorRoute.apply(this,arguments);}
  if(!user){restorePreview();if(!InneruAccess.user&&document.body.classList.contains('iu-access-pending'))return;unavailable('Sign in to open your assigned missions.',m);return;}
  if(!isTeacher&&m.preview){restorePreview();unavailable('Only teachers can preview missions. Your class follows the normal mission sequence.',m);return;}
  restorePreview();
  layout('<section class="iu-mission-access-notice" role="status"><h1>Preparing your mission…</h1><p>Checking your class access and completed discoveries.</p></section>',isTeacher?'teacher':'dashboard');
  try{
   if(!isTeacher){await window.InneruCloud?.flush();if(window.InneruCloud?.status()==='Choose a saved version')throw new Error('Open Student Dashboard and choose which saved version to continue with before opening this mission.');}
   await api('authorize-mission',{system:m.world.id,number:m.number,preview:isTeacher});
   if(request!==ticket||hash!==location.hash)return;
   if(isTeacher){beginPreview(m);history.replaceState(null,'',location.pathname+location.search+(m.browse?m.world.route:normalRoute(m))+'?preview=1');}
   priorRoute();decorate();
   if(!isTeacher)refresh().catch(()=>{});
  }catch(error){if(request!==ticket||hash!==location.hash)return;restorePreview();unavailable(error.message,m);}
 };
 window.addEventListener('hashchange',route);
 document.addEventListener('inneru-account',()=>{catalog=null;refresh().catch(()=>{});});
 const recheck=()=>{if(document.visibilityState==='visible'&&InneruAccess.user?.role==='student')refresh().then(()=>{const m=parse();if(m&&gateFor(m)?.allowed===false)route();}).catch(()=>{});};
 document.addEventListener('inneru-progress',()=>{if(!previewActive)recheck();});
 document.addEventListener('visibilitychange',recheck);
 window.addEventListener('focus',recheck);window.addEventListener('online',recheck);
 setInterval(()=>{if(parse())recheck();},30000);
 window.InneruMissionAccess={refresh,parse,get teacherPreviewActive(){return previewActive;},get teacherBrowseActive(){return browseActive;}};
 route();
})();
