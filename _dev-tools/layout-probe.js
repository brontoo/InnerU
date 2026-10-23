/* Rendered text geometry, not translation coverage or a screenshot similarity score.
   SVG/model coordinates, intentional scrolling regions and closed details are
   separate from HTML captions. Do not hide overflow to make this check pass. */
() => {
  const visible = element => {
    if (!element.checkVisibility({checkVisibilityCSS:true})) return false;
    for (let parent=element; parent; parent=parent.parentElement) {
      if (parent.matches('details:not([open])') && !parent.querySelector('summary')?.contains(element)) return false;
      if (parent.matches('[hidden],.skip,.sr-only,.visually-hidden')) return false;
    }
    const r=element.getBoundingClientRect();return r.width>1 && r.height>1;
  };
  const name=element => element.tagName.toLowerCase()+'.'+String(element.className?.baseVal||element.className||'').trim().split(/\s+/).slice(0,3).join('.');
  const rects=element => {
    const walk=document.createTreeWalker(element,NodeFilter.SHOW_TEXT), result=[];
    while (walk.nextNode()) {
      const node=walk.currentNode;
      if (!node.textContent.trim() || !visible(node.parentElement) || node.parentElement.closest('svg,script,style')) continue;
      const range=document.createRange();range.selectNodeContents(node);
      for (const r of range.getClientRects()) if (r.width>1 && r.height>1) result.push({r,node});
    }
    return result;
  };
  const issues=[];
  if (document.documentElement.scrollWidth>innerWidth+1) issues.push({kind:'page-overflow',pixels:document.documentElement.scrollWidth-innerWidth});
  for (const {r,node} of rects(document.body)) {
    const element=node.parentElement;
    for (let parent=element; parent && parent!==document.body; parent=parent.parentElement) {
      const s=getComputedStyle(parent),b=parent.getBoundingClientRect();
      // Screen-reader-only table headings and intentionally scrollable tables/tabs
      // are not clipped content; their native scroll/keyboard behavior remains.
      if (b.width<=2 || b.height<=2) continue;
      // A descendant outside a native scroll viewport can be scrolled into view;
      // don't report its later intersection with an outer clipping container.
      if ((/auto|scroll/.test(s.overflowY) && (r.top<b.top-3 || r.bottom>b.bottom+3) && r.left>=b.left-2 && r.right<=b.right+2) ||
          (/auto|scroll/.test(s.overflowX) && (r.left<b.left-2 || r.right>b.right+2) && r.top>=b.top-3 && r.bottom<=b.bottom+3)) break;
      if ((/hidden|clip/.test(s.overflowX) && (r.left<b.left-2 || r.right>b.right+2)) ||
          (/hidden|clip/.test(s.overflowY) && (r.top<b.top-3 || r.bottom>b.bottom+3))) {
        issues.push({kind:'clipped-text',element:name(element),container:name(parent),text:node.textContent.trim().slice(0,120),y:Math.round(r.y+scrollY)});break;
      }
    }
    if (element.matches('.iu-localized') && getComputedStyle(element.parentElement).display.includes('flex')) {
      const b=element.getBoundingClientRect();
      if (r.width>b.width+3 || r.height>b.height+3) issues.push({kind:'constrained-translation',element:name(element.parentElement),text:node.textContent.trim().slice(0,120),y:Math.round(r.y+scrollY)});
    }
  }
  const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
  const separate=(root,copy,art)=>{
    for (const section of document.querySelectorAll(root)) {
      const image=section.querySelector(art);if (!image || !visible(image)) continue;
      for (const text of section.querySelectorAll(copy)) for (const {r,node} of rects(text)) {
        if (intersects(r,image.getBoundingClientRect())) issues.push({kind:'art-overlap',element:name(section),text:node.textContent.trim().slice(0,120),y:Math.round(r.y+scrollY)});
      }
    }
  };
  separate('.inneru-welcome','.welcome-copy','.welcome-art img');
  separate('.system-select','.world-card-name,.scientific-name','.portal-preview svg');
  separate('.exhibit-world-banner','h1,p','.world-banner-art svg');
  separate('.gate-companion','p','button');
  separate('.td-league-stage','h2,.td-kicker','.td-league-mascot>.avatar');
  for(const body of document.querySelectorAll('.explorer-body')) {
    for(const control of body.querySelectorAll('.support-read-controls button'))
      for(const caption of body.querySelectorAll('.anatomy-label')) {
        if(visible(control)&&visible(caption)&&intersects(control.getBoundingClientRect(),caption.getBoundingClientRect()))
          issues.push({kind:'reader-control-over-callout',text:caption.textContent});
      }
  }
  const captions=[...document.querySelectorAll('.skin-hotspot:not([hidden])')].filter(visible);
  for(let i=0;i<captions.length;i++) for(let j=i+1;j<captions.length;j++) {
    if(intersects(captions[i].getBoundingClientRect(),captions[j].getBoundingClientRect()))
      issues.push({kind:'anatomy-caption-overlap',text:captions[i].textContent+' / '+captions[j].textContent});
  }
  for (const menu of document.querySelectorAll('.iu-account-menu[open]>div,dialog[open],#term-pop:not([hidden])')) {
    if (!visible(menu)) continue;const r=menu.getBoundingClientRect();
    if (r.left< -1 || r.right>innerWidth+1 || r.width>innerWidth+1 || r.top< -1 || r.bottom>innerHeight+1) issues.push({kind:'overlay-outside-viewport',element:name(menu)});
  }
  return {width:innerWidth,height:innerHeight,lang:document.documentElement.lang,dir:document.documentElement.dir,
          issues:[...new Map(issues.map(issue=>[JSON.stringify(issue),issue])).values()]};
}
