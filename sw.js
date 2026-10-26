/* Essential shell only. Lessons, illustrations and models enter the runtime
   cache only after use; never cache account/session or learning API responses. */
const VERSION='inneru-v61-body-quest-brand';
const RUNTIME='inneru-visited-v1';
const SHELL=[
  "./preferences.js?v=guided-ar-1",
  "./locale.js?v=compact-audio-1",
  "./learning-support.js?v=compact-audio-1",
  "./learning-support.css?v=usability-1",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./login.html",
  "./login.css?v=body-quest-1",
  "./login.js?v=guided-ar-1",
  "./favicon.svg?v=3",
  "./inneru-mark.svg?v=3",
  "./inneru-logo.svg?v=body-quest-1",
  "./habit.css",
  "./glossary.css",
  "./style.css?v=body-quest-1",
  "./exhibit.css",
  "./student-dashboard.css?v=usability-1",
  "./structure-audio.css?v=names-only-1",
  "./account.css?v=usability-1",
  "./cloud-learning.css?v=account-panel-bottom-1",
  "./access.css?v=roles-avatars-2",
  "./mission-access.css?v=usability-1",
  "./learning-catalog.js?v=on-demand-1",
  "./account.js?v=usability-1",
  "./access.js?v=owner-1",
  "./app.js?v=body-quest-1",
  "./route-runtime.js?v=on-demand-1",
  "./learning-evidence.js?v=guided-ar-1",
  "./a11y.js?v=classroom-theme-2",
  "./teacher.js?v=roles-avatars-2",
  "./review-state.js?v=usability-1",
  "./habit.js?v=cloud-learning-1",
  "./glossary.js?v=guided-ar-1",
  "./speech.js?v=compact-audio-1",
  "./learning-progress.js?v=usability-1",
  "./student-dashboard.js?v=usability-1",
  "./account-session.js?v=owner-1",
  "./cloud-learning.js?v=owner-1",
  "./mission-access.js?v=usability-1",
  "./route-manifest.js?v=body-quest-1",
  "./route-loader.js?v=mastery-1",
  "./pwa.js"
];
const ASSET_RE=/\.(glb|gltf|bin|webp|png|jpe?g|svg|woff2?|ttf)$/i;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('inneru-')&&k!==VERSION&&k!==RUNTIME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==location.origin||url.pathname.startsWith('/api/'))return;
 const shell=SHELL.some(path=>new URL(path,self.location.href).href===url.href);
 const cacheName=shell?VERSION:RUNTIME;
 event.respondWith((async()=>{
  const cache=await caches.open(cacheName),hit=await cache.match(request);
  // Show visited assets immediately; retain the existing background refresh so
  // an updated illustration/model at the same URL does not remain stale forever.
  if(hit&&ASSET_RE.test(url.pathname)){
   event.waitUntil(fetch(request).then(async response=>{if(response.ok)await cache.put(request,response.clone()).catch(()=>{});}).catch(()=>{}));
   return hit;
  }
  try{
   const response=await fetch(request);
   if(response.ok){await cache.put(request,response.clone()).catch(()=>{});return response;}
   return hit||response;
  }catch(error){
   if(hit)return hit;
   // Query parameters must not prevent the essential document working offline.
   if(request.mode==='navigate'){
    const fallback=await caches.match(url.pathname.endsWith('/login.html')?'./login.html':'./index.html');
    if(fallback)return fallback;
   }
   // A missing script must fail, not execute an HTML fallback as JavaScript.
   return new Response('This content is not saved offline. Reconnect and open it once to save it on this device.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
 })());
});
