/* Stable dispatch point: deferred renderers sit inside the permanent access,
   preview, account and accessibility wrappers installed during shell startup. */
(() => {
 'use strict';
 let renderer=route,started=false;
 window.removeEventListener('hashchange',route);
 route=function(){if(started)return renderer.apply(this,arguments);};
 window.addEventListener('hashchange',route);
 window.InneruRouteModules={
  get renderer(){return renderer;},
  start(){started=true;},
  registerRenderer(next){renderer=next;}
 };
})();
