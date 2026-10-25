/* Account UI helpers. Public profile choices only; no passwords or tokens persist here. */
(() => {
 'use strict';
 const avatars=[
  {id:'nova',name:'Nova',tag:'Big ideas. Bright sparks.'},
  {id:'atlas',name:'Atlas',tag:'Always ready to explore.'},
  {id:'luna',name:'Luna',tag:'Curiosity looks good on you.'},
  {id:'neo',name:'Neo',tag:'A little courage. A big grin.'},
  {id:'pip',name:'Pip',tag:'Tiny robot. Giant questions.'},
  {id:'ember',name:'Ember',tag:'Clever paws. Curious mind.'},
  {id:'amira',name:'Amira',tag:'Guiding curious minds.',col:0,row:0,sheet:2},
  {id:'sami',name:'Sami',tag:'Every question matters.',col:1,row:0,sheet:2},
  {id:'noor',name:'Noor',tag:'A bright new discovery.',col:2,row:0,sheet:2},
  {id:'finn',name:'Finn',tag:'Ready, set, explore!',col:0,row:1,sheet:2},
  {id:'pebble',name:'Pebble',tag:'Small wings. Big ideas.',col:1,row:1,sheet:2},
  {id:'sage',name:'Sage',tag:'Wonder is your superpower.',col:2,row:1,sheet:2}
 ];
 const avatar=id=>avatars.find(a=>a.id===id);
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const PROFILE='bodyquest-v1',ARCHIVE='inneru-account-progress-v1:',UNDO='inneru-undo-v1';
 async function api(action,values){
  let response;try{response=await fetch('/api/auth?action='+encodeURIComponent(action),{method:values===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:values===undefined?{}:{'Content-Type':'application/json'},...(values===undefined?{}:{body:JSON.stringify(values)})});}catch{throw new Error('The account service could not be reached. Check your connection and try again.');}
  let data;try{data=await response.json();}catch{if(action==='session')return {configured:false,authenticated:false};throw new Error('Account sign-in is not connected yet. Please try again after the service is connected.');}
  if(!response.ok){const error=new Error(data.error||'This account action could not be completed.');error.status=response.status;error.code=typeof data.code==='string'?data.code:'';error.action=action;error.retryAfter=Math.max(1,Math.min(86400,Number(data.retryAfter)||Number(response.headers.get('Retry-After'))||60));throw error;}return data;
 }
 function readProfile(key=PROFILE){const raw=localStorage.getItem(key);if(!raw)return null;const value=JSON.parse(raw);if(!value||!Array.isArray(value.done)||!Array.isArray(value.rewards))throw new Error('Saved learning could not be read. Your record has not been replaced.');return value;}
 function archive(profile){
  if(!profile)return;
  if(profile.authUserId){localStorage.setItem(ARCHIVE+profile.authUserId,JSON.stringify(profile));const undo=localStorage.getItem(UNDO);if(undo)localStorage.setItem('inneru-account-undo-v1:'+profile.authUserId,undo);}
  else if((profile.xp||profile.rewards.length||profile.done.length)&&!localStorage.getItem('inneru-unclaimed-progress-v1'))localStorage.setItem('inneru-unclaimed-progress-v1',JSON.stringify(profile));
 }
 function bindUser(user,{keepLocal=false}={}){
  if(!user||typeof user.id!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(user.id))throw new Error('The account could not be verified. Please sign in again.');
  const current=readProfile(),same=current?.authUserId===user.id;
  const saved=same?current:readProfile(ARCHIVE+user.id);
  archive(current);
  const next={...(saved||(keepLocal&&current&&!current.authUserId?current:null)||{name:'Explorer',xp:0,done:[],rewards:[],weak:[],level:'Explorer',motion:false}),authUserId:user.id};
  if(saved?.name)next.name=saved.name;else if(user.name)next.name=String(user.name).slice(0,24);
  if(avatar(user.avatarId))next.avatarId=user.avatarId;
  if(!same){const undo=localStorage.getItem('inneru-account-undo-v1:'+user.id);if(undo)localStorage.setItem(UNDO,undo);else localStorage.removeItem(UNDO);}
  localStorage.setItem(PROFILE,JSON.stringify(next));return next;
 }
 function clearActive(userId){const current=readProfile();if(current?.authUserId&&current.authUserId!==userId)throw new Error('The active account changed in another tab. Please refresh.');archive(current);localStorage.setItem(PROFILE,JSON.stringify({name:'Explorer',xp:0,done:[],rewards:[],weak:[],level:current?.level||'Explorer',motion:!!current?.motion}));localStorage.removeItem(UNDO);}
 function portrait(id,extra=''){const a=avatar(id);return a?`<span class="iu-avatar-art ${a.sheet===2?'iu-avatar-sheet-2 ':''}${extra}" style="${a.sheet===2?'--avatar-col:'+a.col+';--avatar-row:'+a.row:'--avatar-image:url(assets/avatars/'+a.id+'.webp)'}" aria-hidden="true"></span>`:'';}
 function markup(id,name='Explorer'){const a=avatar(id);return a?`<span class="avatar iu-profile-avatar" role="img" aria-label="${e(a.name)} avatar">${portrait(id)}</span>`:`<span class="avatar">${e(String(name).slice(0,1).toUpperCase())}</span>`;}
 function identityFields(profile){return {...(profile?.authUserId?{authUserId:profile.authUserId}:{}),...(avatar(profile?.avatarId)?{avatarId:profile.avatarId}:{})};}
 const destination=user=>['teacher','admin'].includes(user?.role)?'teacher':'dashboard';
 const studentClasses=Object.freeze(['10G1','10G2','10G3','10G4','10G5','10G6']);
 window.InneruAccount={avatars,avatar,portrait,markup,identityFields,api,readProfile,bindUser,clearActive,destination,studentClasses};
})();
