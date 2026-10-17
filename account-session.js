/* Decorate the portal with the signed-in avatar without changing learning rewards. */
(() => {
 'use strict';
 const A=window.InneruAccount;let user=null,loading=false;
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function decorate(){
  const profile=document.querySelector('.topbar .profile');if(!profile)return;
  profile.querySelector('.iu-account-menu,.iu-account-signin')?.remove();
  if(!user)return;
  const existing=profile.querySelector('.avatar');
  const details=document.createElement('details');details.className='iu-account-menu';
  details.innerHTML=`<summary aria-label="Open account menu">${A.markup(state.avatarId,state.name)}</summary><div><b>${e(state.name)}</b><small class="iu-account-role">${e(user.role==='student'?'Student account':'Teacher account')}</small><a href="#${A.destination(user)}">My dashboard</a><a href="login.html?avatar=1">Change avatar</a><button type="button" data-account-logout>Sign out</button><small data-account-status role="status"></small></div>`;
  if(existing)existing.replaceWith(details);else profile.append(details);
  if(!profile.querySelector('.name')){const name=document.createElement('span');name.className='name micro iu-account-name';name.textContent=user.name;profile.append(name);}
  details.querySelector('[data-account-logout]').onclick=async event=>{event.target.disabled=true;try{if(window.InneruCloud)await InneruCloud.beforeLogout();await A.api('logout',{});A.clearActive(user.id);location.assign('login.html');}catch(error){details.querySelector('[data-account-status]').textContent=error.message;event.target.disabled=false;}};
 }
 const oldLayout=layout;layout=function(...args){oldLayout(...args);queueMicrotask(decorate);};
 const oldSave=save;save=function(...args){if(user){Object.assign(state,A.identityFields({authUserId:user.id,avatarId:state.avatarId||user.avatarId}));}return oldSave.apply(this,args);};
 function navigation(){
  if(!user)return;
  const teacher=InneruAccess.teacher(user);
  document.querySelectorAll('.sidebar .navlink,main>footer nav a').forEach(a=>{const target=a.getAttribute('href')?.replace(/^#/,'').split(/[/?]/)[0];if(teacher?!['teacher','sources','privacy','about','attribution'].includes(target):target==='teacher')a.remove();});
  if(!teacher)document.querySelectorAll('a[href="#teacher"]').forEach(a=>a.remove());
  const label=document.querySelector('.sidebar .navlabel');if(label&&teacher)label.textContent='Your classroom';
  if(teacher){document.querySelectorAll('a.brand').forEach(a=>a.href='#teacher');document.querySelector('.topbar .xp')?.remove();document.querySelector('.habit-chip')?.remove();}
 }
 const oldRoute=route;window.removeEventListener('hashchange',oldRoute);route=function(){if(InneruAccess.check())return oldRoute.apply(this,arguments);};window.addEventListener('hashchange',route);
 async function start(){if(loading)return;loading=true;let session;try{session=await InneruAccess.ready;if(!session.authenticated){if(state.authUserId){A.clearActive(state.authUserId);state=A.readProfile();}return;}user=session.user;
   if(state.authUserId!==user.id){state=A.bindUser(user,{keepLocal:!state.authUserId});save();route();}
   else if(A.avatar(user.avatarId)&&state.avatarId!==user.avatarId){state.avatarId=user.avatarId;save();}
   if(InneruAccess.teacher(user)&&state.name!==user.name){state.name=user.name;save();}
   A.currentUser=user;decorate();navigation();document.dispatchEvent(new CustomEvent('inneru-account',{detail:{user}}));
  }catch(error){session={authenticated:false,error:error.message};}finally{loading=false;InneruAccess.complete(session||{authenticated:false});route();}}
 const decorateAccount=decorate;decorate=function(){decorateAccount();navigation();};
 document.addEventListener('click',event=>{document.querySelectorAll('.iu-account-menu[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.iu-account-menu[open]').forEach(menu=>menu.open=false);});
 window.addEventListener('storage',event=>{if(event.key==='bodyquest-v1'&&user){try{if(JSON.parse(event.newValue||'null')?.authUserId!==user.id)location.replace('login.html');}catch{}}});
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
 start();
})();
