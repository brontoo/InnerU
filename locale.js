/* Display-only localisation. Original text is retained on translated spans, so
   activity/evidence readers can use source() without changing choices or IDs.
   No user text is sent anywhere, translated, or entered into a message catalogue. */
(() => {
 'use strict';
 const catalog=new Map(),catalogues=new Map(),patterns=[],pending=new Map(),loaded=new Set(),attributes=new WeakMap();
 const normal=value=>String(value??'').replace(/\s+/g,' ').trim();
 let translating=false,scheduled=false,version=0,titleSource=document.title,titleRendered=document.title;
 const lang=()=>InneruPreferences.get().language;
 function source(node){if(!node)return '';if(node.nodeType===3)return node.nodeValue||'';if(node.dataset?.iuSource!==undefined)return node.dataset.iuSource;return [...node.childNodes].map(source).join('');}
 function rebuild(){
  catalog.clear();patterns.length=0;
  for(const name of groups())for(const [en,ar] of Object.entries(catalogues.get(name)||{})){
   if(typeof ar!=='string'||!ar.trim())continue;
   const key=normal(en);catalog.set(key,ar);catalog.set(key.toLowerCase(),ar);
   if(/\{\w+\}/.test(key)){
    const parts=key.split(/(\{\w+\})/g),keys=parts.filter(x=>/^\{/.test(x));
    const pattern=parts.map(x=>/^\{/.test(x)?'(.+?)':x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('');
    patterns.push({rx:new RegExp('^'+pattern+'$','i'),keys,ar,specificity:key.replace(/\{\w+\}/g,'').length});
   }
  }
  patterns.sort((a,b)=>b.specificity-a.specificity);
 }
 function register(messages){const name=document.currentScript?.dataset.locale;if(!name)return;catalogues.set(name,{...catalogues.get(name),...messages});loaded.add(name);rebuild();schedule();}

 function lookup(value,depth=0){
  const key=normal(value),exact=catalog.get(key)||catalog.get(key.toLowerCase());if(exact)return exact;
  if(depth>=3)return null;
  for(const p of patterns){
   const match=p.rx.exec(key);if(!match)continue;
   let valid=true,output=p.ar;
   p.keys.forEach((slot,i)=>{
    const input=match[i+1],numeric=/^\{(?:number|total|percent|xp|level|next|stage|mission|done|found|shown|correct|year|questions|systems|due)\}$/.test(slot),opaque=/^\{(?:person|date|time|class)\}$/.test(slot);
    if(numeric&&!/^[+\-\d\s.,/%–]+$/.test(input)){valid=false;return;}
    // An unknown caption is not translated by merely wrapping it in Arabic.
    const translated=numeric||opaque?input:lookup(input,depth+1);
    if(!translated&&/[a-z]{3}/i.test(input)&&!/^(ATP|ADH|ABO|DNA|RNA|O₂|CO₂)$/.test(input)){valid=false;return;}
    const text=translated||input;output=output.replaceAll(slot,/[A-Za-z0-9]/.test(text)?'\u2068'+text+'\u2069':text);
   });
   if(valid)return output;
  }
  return null;
 }

 function t(value){return lang()==='ar'?(lookup(value)||String(value)):String(value);}
 function isPersonal(node){return !!node.closest('input,textarea,script,style,noscript,code,pre,[contenteditable],.name,.iu-account-menu > div > b,.brand,.gate-brand,.sd-hero em,.sd-profile-name,.td-student-name,.td-league-person b,.td-student-link,.td-answer-text,.td-response-text,[data-iu-private],.td-answer-columns > div:first-child > p,.td-answer header a,.td-answer-history p,.td-notes textarea,.td-hero-student h1,.td-podium strong');}
 function translate(root=document.body){
  if(!root||translating)return;translating=true;
  try{
   if(lang()==='en'){
    root.querySelectorAll('[data-iu-source]').forEach(span=>span.replaceWith(document.createTextNode(span.dataset.iuSource)));
   }else{
    const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];let n;
    while((n=walk.nextNode()))if(n.nodeValue.trim()&&!isPersonal(n.parentElement)&&!n.parentElement.closest('[data-iu-source]'))nodes.push(n);
    for(const node of nodes){const original=node.nodeValue,translated=lookup(original);
     const option=node.parentElement.closest('option');if(option)continue;if(!translated){if(lang()==='ar'&&/[a-z]{3}/i.test(original)&&node.parentElement.childNodes.length===1)node.parentElement.setAttribute('lang','en');continue;}
     const svg=node.parentElement.namespaceURI==='http://www.w3.org/2000/svg';
     const span=document.createElementNS(svg?'http://www.w3.org/2000/svg':'http://www.w3.org/1999/xhtml',svg?'tspan':'span');
     node.parentElement.removeAttribute('lang');span.dataset.iuSource=original;span.setAttribute('lang','ar');span.classList.add('iu-localized');span.textContent=original.match(/^\s*/)[0]+translated+original.match(/\s*$/)[0];node.replaceWith(span);
    }
   }
   root.querySelectorAll('[aria-label],[aria-description],[title],[placeholder],[alt],option').forEach(el=>{
    if(isPersonal(el)&&!el.matches('input,textarea'))return;
    let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}
    for(const attr of ['aria-label','aria-description','title','placeholder','alt',...(el.tagName==='OPTION'?['label']:[])]){
     const current=el.getAttribute(attr),old=saved[attr];
     if(current===null&&attr!=='label')continue;
     // An activity may replace a label after selection; remember the new source.
     if(!old||current!==old.rendered&&current!==old.source)saved[attr]={source:current??source(el),rendered:null,implicit:attr==='label'&&current===null};
     const entry=saved[attr];if(attr==='label'&&entry.implicit){entry.source=source(el);if(lang()==='en'){entry.rendered=null;if(current!==null)el.removeAttribute('label');continue;}}const next=lang()==='ar'?lookup(entry.source)||entry.source:entry.source;
     entry.rendered=next;if(current!==next)el.setAttribute(attr,next);
    }
   });
   document.querySelectorAll('[data-iu-source]').forEach(el=>{if(lang()==='ar'){const next=lookup(el.dataset.iuSource);if(next&&el.textContent.trim()!==next)el.textContent=next;}});
  }finally{translating=false;}
 }
 function groups(){const root=location.pathname.endsWith('login.html')?'login':(location.hash.slice(1).split(/[/?]/)[0]||'home'),name=root==='mission'||root==='world'?'skeletal':root==='badges'?'dashboard':root;return root==='login'?['common','login']:['common','science',...(['login','home','dashboard','skeletal','muscle','respiratory','circulatory','integumentary','excretory','teacher','review','connect'].includes(name)?[name]:[])];}
 function load(name){if(loaded.has(name))return Promise.resolve();if(pending.has(name))return pending.get(name);const task=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='locales/ar/'+name+'.js?v=guided-ar-1';script.dataset.locale=name;script.onload=()=>{loaded.add(name);resolve();};script.onerror=()=>{script.remove();pending.delete(name);reject(new Error('Arabic text could not load.'));};document.head.append(script);});pending.set(name,task);return task;}
 async function refresh(){const ticket=++version;rebuild();if(lang()==='ar'){try{await Promise.all(groups().map(load));}catch{if(ticket===version){translate();document.dispatchEvent(new Event('inneru-language-load-error'));}return;}}if(ticket===version){translate();if(document.title!==titleRendered)titleSource=document.title;const title=titleSource.split(' · ');document.title=lang()==='ar'&&title[0]==='InnerU'?'InnerU · '+t(title.slice(1).join(' · ')):titleSource;titleRendered=document.title;document.dispatchEvent(new Event('inneru-language-ready'));}}
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;translate();});}
 window.InneruLocale={source,t,register,translate,refresh,restore(root){root?.querySelectorAll('[data-iu-source]').forEach(span=>span.replaceWith(document.createTextNode(span.dataset.iuSource)));root?.normalize();},language:lang,has:value=>!!lookup(value),coverage(root=document.body){const missing=new Set();const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode()))if(!isPersonal(n.parentElement)&&!n.parentElement.closest('[data-iu-source]')&&/[a-z]{3}/i.test(n.nodeValue)&&!lookup(n.nodeValue))missing.add(normal(n.nodeValue));root.querySelectorAll('[aria-label],[aria-description],[title],[placeholder],[alt]').forEach(el=>{if(isPersonal(el))return;for(const attr of ['aria-label','aria-description','title','placeholder','alt']){const text=el.getAttribute(attr);if(text&&/[a-z]{3}/i.test(text)&&!lookup(text)&&!/^InnerU$/.test(text))missing.add(attr+': '+normal(text));}});return [...missing].filter(text=>!['Inner','InnerU'].includes(text));}};
 new MutationObserver(changes=>{if(changes.some(c=>!c.target.parentElement?.closest('[data-iu-source]')))schedule();}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt','label']});
 document.addEventListener('inneru-preferences-change',refresh);document.addEventListener('inneru-route-ready',refresh);window.addEventListener('hashchange',refresh);refresh();
})();
