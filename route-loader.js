/* Classic globals must execute serially. Each URL/group has one in-flight promise;
   the navigation ticket prevents a slower route from rendering after a newer one. */
(() => {
 'use strict';
 const files=new Map(),groups=new Map(),loaded=new Set(),manifest=window.InneruRouteManifest;
 let ticket=0;
 function file(url,style){
  if(files.has(url))return files.get(url);
  const pending=new Promise((resolve,reject)=>{
   const node=document.createElement(style?'link':'script');
   if(style){node.rel='stylesheet';node.href=url;node.dataset.styleOrder=style.order;}
   else{node.src=url;node.async=false;}
   node.onload=()=>resolve();
   node.onerror=()=>{node.remove();files.delete(url);reject(new Error('This content could not be downloaded.'));};
   if(style){const later=[...document.querySelectorAll('link[data-style-order]')].find(n=>Number(n.dataset.styleOrder)>style.order);document.head.insertBefore(node,later||null);}
   else document.body.append(node);
  });
  files.set(url,pending);return pending;
 }
 async function group(name){
  if(groups.has(name))return groups.get(name);
  const pending=(async()=>{const m=manifest[name];await Promise.all(m.styles.map(s=>file(s.url,s)));for(const url of m.scripts)await file(url);})();
  groups.set(name,pending);
  try{await pending;loaded.add(name);}catch(error){groups.delete(name);throw error;}
 }
 function required(hash){
  const path=hash.replace(/^#/,'').split('?')[0],root=path.split('/')[0];
  if(['dashboard','badges','glossary'].includes(root))return [];
  if(root==='owner')return ['owner'];
  if(root==='teacher')return ['teacher'];
  if(root==='review')return ['review'];
  if(root==='world'||root==='mission')return ['art','atlas','skeletal'];
  if(root==='muscle')return ['art','atlas','muscle'];
  if(root==='circulatory')return ['art','circulatory',...(path.includes('/')?['circ-missions']:[])];
  if(root==='respiratory')return ['art','atlas','respiratory',...(path.includes('/')?['resp-missions']:[])];
  if(root==='integumentary')return ['art','atlas','integumentary',...(path.includes('/')?['integ-missions']:[])];
  if(root==='excretory')return ['art','atlas','excretory'];
  if(root==='capstone'||root==='final')return ['final'];
  if(['detective','connect','daily'].includes(root))return ['art',root];
  return ['art','home'];
 }
 const secureRoute=route;window.removeEventListener('hashchange',secureRoute);
 route=async function(){
  const request=++ticket,hash=location.hash,names=required(hash);
  await InneruAccess.ready;
  if(request!==ticket||hash!==location.hash)return;
  // Role and mission authorization remains in secureRoute, outside every renderer.
  // In particular, teacher previews must be established before the role guard runs.
  if(names.some(n=>!loaded.has(n))){layout('<section class="panel" data-route-loading role="status" aria-live="polite" aria-busy="true"><h1>Opening your discovery…</h1><p>Preparing this part of InnerU.</p></section>');}
  try{
   let deadline;
   try{await Promise.race([(async()=>{for(const name of names)await group(name);})(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('Route download timed out.')),30000);})]);}finally{clearTimeout(deadline);}
   if(request!==ticket||hash!==location.hash)return;
   InneruRouteModules.start();
   const result=await secureRoute.apply(this,arguments);
   if(request===ticket)document.dispatchEvent(new Event('inneru-route-ready'));
   return result;
  }catch(error){
   if(request!==ticket||hash!==location.hash)return;
   console.warn('InnerU route loading:',error);
   layout('<section class="panel" role="alert"><h1>This discovery is unavailable.</h1><p>'+(!navigator.onLine?'You are offline. This content has not been saved on this device yet. Open it once while connected, then try again.':'Some content could not load. Check your connection and try again.')+'</p><div class="controls"><button type="button" class="btn" data-route-retry>Try again</button><a class="btn secondary" href="#home">Explore Worlds</a></div></section>');
   document.querySelector('[data-route-retry]').onclick=()=>route();
  }
 };
 window.addEventListener('hashchange',route);
 route();
})();
