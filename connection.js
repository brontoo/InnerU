/* Embedded in connection.html as well: diagnostics must survive a missing script asset. */
(() => {
 'use strict';
 if(window.InneruConnection?.started)return;
 const list=document.querySelector('#connection-results'),button=document.querySelector('#connection-retry');
 if(!list||!button)return;
 window.InneruConnection={started:true};
 const TIMEOUT=20000;let running=false;
 function line(text,state=''){const li=document.createElement('li');li.textContent=text;if(state)li.dataset.state=state;list.append(li);return li;}
 async function read(url){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),TIMEOUT);
  try{
   const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
   if(!(response.headers.get('content-type')||'').includes('application/json'))throw new Error('The API returned a web page instead of JSON (HTTP '+response.status+'). Check that Vercel deployed the latest main branch with its api and lib folders.');
   let data;try{data=await response.json();}catch(error){if(controller.signal.aborted)throw error;throw new Error('The API response could not be read. Check the Vercel function logs.');}
   if(!response.ok)throw new Error(data.error||'The API returned HTTP '+response.status+'. Check the Vercel function logs.');
   return data;
  }catch(error){
   if(controller.signal.aborted)throw new Error('This check timed out after 20 seconds. The deployed API did not finish responding. Check Vercel function logs, then try again.');
   if(error instanceof TypeError)throw new Error('The browser could not reach the API. Check your connection or browser blocking settings, then use the direct links below.');
   throw error;
  }finally{clearTimeout(timer);}
 }
 async function stage(message,url){
  const pending=line(message+' (up to 20 seconds)…','checking');
  try{const value=await read(url);pending.remove();return value;}catch(error){pending.textContent=error.message;pending.dataset.state='error';throw error;}
 }
 async function check(){
  if(running)return;running=true;button.disabled=true;button.textContent='Checking…';list.replaceChildren();
  try{
   const s=await stage('Checking the deployed account API','/api/auth?action=session');
   if(typeof s.configured!=='boolean')throw new Error('This API response is not the current InnerU account endpoint. Redeploy the latest main branch.');
   if(!s.configured){line('Account service is not configured in this Vercel deployment. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to Production, then redeploy.','error');return;}
   if(!s.projectHost)throw new Error('The account endpoint is from an older deployment. Redeploy the current main branch.');
   line('Configured Supabase project: '+s.projectHost,'success');
   const c=await stage('Checking Supabase Auth connectivity','/api/auth?action=connection');
   if(c.authReachable!==true)throw new Error('Supabase Auth did not confirm connectivity. Verify the project URL and publishable key in Vercel.');
   line('Supabase Auth is reachable and accepts the configured project key.','success');
   if(!s.authenticated){line('No signed-in account in this browser. Sign in on this same website, then return here to check the learning database.');return;}
   line('Account session verified.','success');
   const d=await stage('Checking the learning database','/api/learning?action=state');
   if(d.schemaVersion!==1||!d.profile||!d.progress)throw new Error('The learning API returned an unexpected result. Check that the complete current SQL installer was run.');
   line('InnerU learning database installed · schema '+d.schemaVersion+' · '+d.profile.role+' profile · saved revision '+d.progress.revision+'.','success');
  }catch(error){if(!list.querySelector('[data-state="error"]'))line(error.message||'The connection check failed. Use the direct links below.','error');}
  finally{running=false;button.disabled=false;button.textContent='Check again';}
 }
 button.onclick=check;check();
})();
