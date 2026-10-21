/* Account roles come only from the server-verified database profile. */
(() => {
 'use strict';
 const A=window.InneruAccount;let result=null,failed=false;
 const teacher=u=>['teacher','admin'].includes(u?.role);
 const path=()=>location.hash.slice(1).split(/[/?]/)[0]||'home';
 const privatePath=p=>['owner','teacher','dashboard','badges','daily','review'].includes(p);
 const infoPath=p=>['sources','about','privacy','attribution','glossary'].includes(p);
 document.body.classList.add('iu-access-pending');
 const waiting=document.createElement('div');waiting.id='iu-access-waiting';waiting.setAttribute('role','status');waiting.textContent='Verifying your InnerU account…';document.body.prepend(waiting);
 const ready=A.api('session').then(s=>{if(s.authenticated&&(!s.user?.id||!['student','teacher','admin'].includes(s.user.role)))throw new Error('Your account role could not be verified. Please sign in again after the current deployment finishes.');result=s;return s;}).catch(error=>{failed=true;result={authenticated:false,error:error.message};return result;});
 function check(target=path()){
  if(!result)return false;
  const user=result.authenticated?result.user:null;
  if(!user){if(!privatePath(target))return true;const root=document.getElementById('app');if(root)root.innerHTML='<main class="iu-access-notice"><h1>'+ (failed?'Account verification unavailable.':'Sign in to your dashboard.')+'</h1><p>'+ (failed?'Your dashboard stays closed until your account can be verified. Please check your connection and try again.':'Dashboard access belongs to your signed-in account.')+'</p><a href="login.html?role='+ (target==='teacher'?'teacher':'student')+'">Sign in</a> · <a href="connection.html">Check connection</a></main>';return false;}
  const destination=A.destination(user);
  if(target==='owner'&&user.role!=='admin'){history.replaceState(null,'',location.pathname+location.search+'#'+destination);queueMicrotask(()=>window.route?.());return false;}
  if(user.role==='student'&&user.classSelectionRequired){location.replace('login.html?class=1');return false;}
  if((teacher(user)&&!['teacher','home',...(user.role==='admin'?['owner']:[])].includes(target)&&!infoPath(target)&&!window.InneruMissionAccess?.teacherPreviewActive)||(!teacher(user)&&target==='teacher')){
   history.replaceState(null,'',location.pathname+location.search+'#'+destination);queueMicrotask(()=>window.route?.());return false;
  }
  return true;
 }
 function complete(session){result=session;failed=!!session.error;document.body.classList.remove('iu-access-pending');waiting.remove();}
 window.InneruAccess={ready,check,complete,get user(){return result?.authenticated?result.user:null;},teacher};
})();
