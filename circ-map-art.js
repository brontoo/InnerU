/* Premium circulatory mission cards. Anatomy discovery never bypasses mission gates. */
(() => {
  'use strict';
  let timer;
  window.inneruCircMapArt=n=>window.InneruCircStudies.card(n===8?4:n,n===8);
  function inject(){
    if(location.hash.split('?')[0]!=='#circulatory')return;
    const grid=document.querySelector('.circ-path');if(!grid||grid.querySelector('.ca-card-art'))return;
    const root=grid.closest('#main');root.classList.add('circ-premium-map');
    grid.querySelectorAll('.circ-card').forEach((card,i)=>{card.dataset.caMission=i+1;card.insertAdjacentHTML('afterbegin',window.inneruCircMapArt(i+1));});
    const final=root.querySelector('.finalmission');if(final){final.classList.add('has-art');final.insertAdjacentHTML('afterbegin',window.inneruCircMapArt(8));}
    window.InneruCircStudies.mount(root);
  }
  const run=()=>{clearTimeout(timer);timer=setTimeout(inject,0);};
  window.addEventListener('hashchange',run);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
