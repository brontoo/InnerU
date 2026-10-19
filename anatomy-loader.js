/* Retain on-demand Three.js, and only import the viewer actually present.
   Each viewer still delays its model request until its own viewport observer. */
(() => {
 'use strict';
 const imports=new Map();
 function ensure(selector,url){
  if(!document.querySelector(selector)||imports.has(url))return;
  const pending=import(url).catch(error=>{
   console.warn('Anatomy viewer unavailable:',error);
   document.querySelectorAll(selector).forEach(host=>{
    const root=host.closest('.body-atlas,.heart-lab')||host;
    root.querySelectorAll('.body-atlas-loading,#heart-loading').forEach(node=>node.remove());
    root.querySelectorAll('.body-atlas-error,#heart-error,#heart-fallback').forEach(node=>node.hidden=false);
    const message=root.querySelector('.body-atlas-error,#heart-error');
    if(message)message.textContent='The 3D viewer could not load. Reconnect and reload this page to investigate the model.';
   });
  });
  imports.set(url,pending);
 }
 function start(){ensure('[data-atlas]','./body-atlas.js');ensure('#heart-canvas','./heart-explorer.js?v=guided-ar-1');}
 new MutationObserver(start).observe(document.getElementById('app'),{childList:true,subtree:true});
 start();
})();
