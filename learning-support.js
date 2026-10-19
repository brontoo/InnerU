/* Optional presentation aids. Never call route(), save(), reward(), or a lab's
   renderer when changing preferences; live answers and task gates stay in place. */
(() => {
 'use strict';
 const roots=new Map();let queued=false;
 const plain={
  'Sort each region into its skeletal division. Use the anatomy study to separate the central axis from the limbs and their attachment girdles.':['Choose one region in the diagram.','Decide whether it is axial or appendicular.','Compare the central axis with the limbs and their attachment girdles.','Choose its division. Then check your map.'],
  'Choose a tissue tile, then place it on the matching numbered structure. Build all four tissue partnerships.':['Choose one tissue tile.','Find its numbered structure in the diagram.','Select that structure. Repeat for all four tissues.'],
  'Select a cargo tile, then its destination. Match all six to activate the waste relay.':['Choose one waste cargo tile.','Select the organ that removes this waste.','Match all six cargo tiles.'],
  'Choose an event to see what moves and where.':['Choose one event.','Use the picture and controls to see what moves.','Watch where it moves.','Explore all three events.']
 };
 const tr=s=>window.InneruLocale?.t(s)||s,source=el=>window.InneruLocale?.source(el)||el?.textContent||'';
 const selector='#skeletal-lab-body,.resp-activity-game,.integ-quest,#circ-lab,.exc-lab,.mq-panel,.bt-lab,.dd-bench,.cap-station,.cap-synthesis';
 function announce(text){const el=document.querySelector('[data-support-status]');if(el)el.textContent=tr(text);}
 function controls(){
  let box=document.querySelector('.learning-support');
  const host=document.querySelector('.topbar')||document.querySelector('.gate-motion-tools')||document.querySelector('.gate-header')||document.querySelector('.gate-welcome');
  if(!host)return;
  if(!box){box=document.createElement('div');box.className='learning-support';box.dataset.noTerms='';box.innerHTML='<label>Language / اللغة <select data-interface-language aria-label="Interface language"><option value="en" lang="en">English</option><option value="ar" lang="ar">العربية</option></select></label><button type="button" data-guided-toggle aria-pressed="false">Guided mode</button><span class="support-status" data-support-status role="status"></span>';host.append(box);
   box.querySelector('select').onchange=event=>InneruPreferences.set({language:event.target.value});
   box.querySelector('button').onclick=()=>InneruPreferences.set({guided:!InneruPreferences.get().guided});
  }
  const pref=InneruPreferences.get();box.querySelector('select').value=pref.language;const toggle=box.querySelector('button'),label=tr(pref.guided?'Guided mode: on':'Guided mode: off');if(toggle.textContent!==label)toggle.textContent=label;toggle.setAttribute('aria-pressed',String(pref.guided));
 }
 function instructions(root){return [...root.querySelectorAll(':scope > p,:scope > .note,:scope > header p,.quest-intro,.ra-stage > p,.ra-stage .ra-task-instruction')].filter(el=>!el.closest('.iu-guidance,[role=status],[role=alert]')&&!el.querySelector('a,button,input,select,textarea,img,svg,canvas')&&source(el).trim());}
 function stepsFor(root,paragraphs){
  const visual=root.querySelector('img,svg,canvas')||root.closest('main')?.querySelector('.skel-study-section figure,.resp-lesson figure');
  const steps=[visual?'Look at the diagram. You can use the existing controls to explore it.':'Read the instruction below. Take one step at a time.'];
  for(const p of paragraphs){const text=source(p).trim();if(plain[text]){steps.push(...plain[text]);continue;}for(const sentence of tr(text).split(/(?<=[.!?])\s+(?=[A-Z\u0600-\u06ff])/u)){const item=sentence.trim();if(item&&!steps.includes(item))steps.push(item);}}
  steps.push('Try the activity. Keep the scientific terms. Open the glossary if a word is new.','Check your response. Read the feedback. You can try again when the activity allows it.');return steps;
 }
 function draw(entry,focus=false){
  const {box,steps}=entry,pref=InneruPreferences.get();entry.index=Math.min(entry.index,steps.length-1);
  box.hidden=!pref.guided;entry.paragraphs.forEach(p=>p.classList.toggle('iu-guided-instruction-hidden',pref.guided));
  const count=box.querySelector('[data-iu-guide-count]'),countText=tr('Instruction')+' '+(entry.index+1)+' / '+steps.length;if(count.textContent!==countText)count.textContent=countText;
  const text=box.querySelector('[data-iu-guide-text]');const words=tr(steps[entry.index]);text.lang=/[\u0600-\u06ff]/.test(words)?'ar':'en';if(text.textContent!==words)text.textContent=words;if(pref.guided)window.inneruGlossary?.markInstruction(text);
  const previous=box.querySelector('[data-iu-guide-back]'),next=box.querySelector('[data-iu-guide-next]'),previousText=InneruPreferences.get().language==='ar'?tr('Previous instruction'):'Back',nextText=InneruPreferences.get().language==='ar'?tr('Next instruction'):'Next';if(previous.textContent!==previousText)previous.textContent=previousText;if(next.textContent!==nextText)next.textContent=nextText;
  box.querySelector('[data-iu-guide-back]').setAttribute('aria-label',tr('Previous instruction'));box.querySelector('[data-iu-guide-next]').setAttribute('aria-label',tr('Next instruction'));
  box.querySelector('[data-iu-guide-back]').disabled=entry.index===0;box.querySelector('[data-iu-guide-next]').disabled=entry.index===steps.length-1;
  if(focus)text.focus({preventScroll:true});
 }
 function mount(root){
  if(roots.has(root))return;
  if(root.parentElement.closest(selector))return;
  const paragraphs=instructions(root),box=document.createElement('section');box.className='iu-guidance';box.dataset.noTerms='';box.setAttribute('aria-label','Guided instructions');
  box.innerHTML='<div class="guide-heading"><b data-iu-guide-count></b><a href="#glossary">Glossary</a></div><p data-iu-guide-text tabindex="-1" aria-live="polite"></p><div class="guide-actions"><button type="button" data-iu-guide-back>Back</button><button type="button" data-iu-guide-next>Next</button><button type="button" data-iu-guide-listen aria-pressed="false">Listen / Stop</button></div><p class="support-status" data-iu-guide-speech-status role="status"></p>';
  root.prepend(box);paragraphs.forEach(p=>p.dataset.supportInstruction='');const entry={root,box,paragraphs,steps:stepsFor(root,paragraphs),index:0,content:paragraphs.map(source).join('\n')};roots.set(root,entry);
  for(const [attr,delta] of [['data-iu-guide-back',-1],['data-iu-guide-next',1]])box.querySelector('['+attr+']').onclick=()=>{document.dispatchEvent(new Event('inneru-instruction-change'));entry.index=Math.max(0,Math.min(entry.steps.length-1,entry.index+delta));draw(entry,true);};
  box.querySelector('[data-iu-guide-listen]').onclick=event=>InneruSpeech.read(box.querySelector('[data-iu-guide-text]'),event.currentTarget,box.querySelector('[data-iu-guide-speech-status]'));draw(entry);
 }
 function readers(){
  document.querySelectorAll('[data-support-reader]').forEach(el=>{if(el.nextElementSibling?.classList.contains('support-read-controls'))el.nextElementSibling.hidden=el.classList.contains('iu-guided-instruction-hidden');});
  document.querySelectorAll('#main .feedback,#main [role=status],#main [role=alert],#entry-error,[data-support-instruction],.gate-panel-intro,.resp-mission-header > p,.skel-mission-intro,.exc-mission-header > p').forEach(el=>{
   if(el.closest('.learning-support,.iu-guidance,.structure-audio,.support-read-controls')||el.dataset.supportReader||!source(el).trim()||!el.parentElement)return;
   el.dataset.supportReader='1';const box=document.createElement('div');box.className='support-read-controls';box.dataset.noTerms='';const b=document.createElement('button');b.type='button';b.textContent='Listen / Stop';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Listen to this instruction or feedback / Stop');const status=document.createElement('span');status.className='support-status';status.setAttribute('role','status');box.append(b,status);el.after(box);b.onclick=()=>InneruSpeech.read(el,b,status);
  });
 }
 function refresh(){controls();for(const [root]of roots)if(!root.isConnected)roots.delete(root);document.querySelectorAll(selector).forEach(mount);for(const entry of roots.values()){const paragraphs=instructions(entry.root),steps=stepsFor(entry.root,paragraphs);if(JSON.stringify(steps)!==JSON.stringify(entry.steps)){entry.paragraphs.forEach(p=>p.classList.remove('iu-guided-instruction-hidden'));const content=paragraphs.map(source).join('\n');entry.paragraphs=paragraphs;entry.steps=steps;if(content!==entry.content)entry.index=0;entry.content=content;document.dispatchEvent(new Event('inneru-instruction-change'));}draw(entry);}readers();}
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh();});}
 document.addEventListener('inneru-preferences-change',()=>{refresh();announce(InneruPreferences.get().guided?'Guided mode is on. Your activity and answers are unchanged.':'Guided mode is off. Your activity and answers are unchanged.');});
 document.addEventListener('inneru-language-ready',()=>{const status=document.querySelector('[data-support-status][data-language-error]');if(status){const focus=status.contains(document.activeElement);status.replaceChildren();delete status.dataset.languageError;if(focus)document.querySelector('[data-interface-language]')?.focus({preventScroll:true});}schedule();});
 document.addEventListener('inneru-language-load-error',()=>{announce('Arabic text could not load. Check your connection and try selecting Arabic again.');const status=document.querySelector('[data-support-status]');if(status){status.dataset.languageError='';const retry=document.createElement('button');retry.type='button';retry.dataset.localeRetry='';retry.textContent=tr('Retry Arabic');retry.onclick=()=>InneruLocale.refresh();status.append(retry);}});
 document.addEventListener('inneru-preference-storage-unavailable',()=>announce('This browser cannot save preferences. Your selection works until you close this page.'));
 new MutationObserver(changes=>{for(const change of changes)window.InneruSpeech?.changed(change.target);if(changes.some(c=>![...roots.values()].some(e=>e.box.contains(c.target))&&!c.target.closest?.('.learning-support,.support-read-controls')))schedule();}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',event=>{const button=event.target.closest('button,a,[role=tab],.term');if(button?.closest(selector)&&!button.closest('[data-iu-guide-listen],.structure-audio,.support-read-controls'))InneruSpeech.stop();},true);
 document.addEventListener('change',event=>{if(event.target.closest(selector))InneruSpeech.stop();},true);
 window.addEventListener('hashchange',()=>{InneruSpeech.stop();schedule();});refresh();
})();
