/* WORLD 06 · Excretory System · original activities guided by the supplied Grade 10 lesson. */
(()=>{'use strict';
const titles=['Where wastes go','Inside a kidney','The filtration gate','Keep the useful parts','Balance during exercise','Kidney care detective'];
const lessons=[
 {goal:'Identify organs that remove wastes and trace urine out of the body.',terms:'lungs · skin · kidneys · ureters · bladder · urethra',text:'Cells produce wastes during daily activity. The lungs release carbon dioxide, the skin releases some water and salts in sweat, and the liver breaks down excess amino acids and produces bile, and the kidneys remove urea and other dissolved wastes while adjusting water and salts. Urine travels from the kidneys through the ureters, collects in the urinary bladder, and leaves through the urethra.',clue:'A ureter leads from kidney to bladder; the urethra leads from bladder to outside.',checks:[['Which organ primarily releases carbon dioxide?',['Kidneys','Lungs','Bladder'],1,'The lungs exhale carbon dioxide.'],['After leaving a kidney, urine enters the…',['Ureter','Renal artery','Urethra'],0,'A ureter carries urine toward the bladder.'],['Which tube carries urine out from the bladder?',['Renal vein','Ureter','Urethra'],2,'The urethra carries urine out of the body.']]},
 {goal:'Locate the cortex, medulla and pelvis in a kidney.',terms:'renal cortex · renal medulla · renal pelvis · renal artery · renal vein',text:'The bean-shaped kidneys have an outer renal cortex and inner renal medulla. Blood arrives through a renal artery and leaves through a renal vein. Urine produced within the kidney drains toward the renal pelvis and then into a ureter. Select the Kidney cutaway in the 3D viewer to inspect these regions.',clue:'Cortex outside, medulla inside, pelvis collects urine.',checks:[['The outer kidney region is the…',['Renal pelvis','Renal cortex','Ureter'],1,'The renal cortex is the outer region.'],['Where does urine collect before the ureter?',['Renal pelvis','Renal artery','Glomerulus'],0,'The renal pelvis funnels urine toward the ureter.'],['Which vessel brings blood to the kidney?',['Renal vein','Urethra','Renal artery'],2,'The renal artery brings blood into a kidney.']]},
 {goal:'Explain what crosses the glomerular filter.',terms:'nephron · glomerulus · Bowman’s capsule · filtration · urea',text:'Each kidney contains many microscopic nephrons. In a nephron, pressure drives water and small dissolved substances, including urea, from glomerular capillaries into Bowman’s capsule. Blood cells and most large proteins normally remain in the blood. The collected fluid is called filtrate; it is not yet the final urine.',clue:'Small dissolved substances can pass into filtrate; cells and large proteins usually stay in blood.',checks:[['Which structure receives the first filtrate?',['Bladder','Bowman’s capsule','Ureter'],1,'Bowman’s capsule receives fluid filtered at the glomerulus.'],['Which normally remains in blood?',['Red blood cells','Water','Urea'],0,'Blood cells are too large to pass through the healthy filter.'],['Is filtrate already final urine?',['Yes, nothing changes afterward','It is made in the bladder','No, useful material is still reabsorbed'],2,'Tubules change filtrate before it becomes urine.']]},
 {goal:'Sort what returns to blood from what leaves in urine.',terms:'reabsorption · renal tubule · loop of Henle · collecting duct',text:'Filtrate flows through the renal tubule, including the loop of Henle, and then toward a collecting duct. Much water and useful dissolved material such as glucose return to surrounding capillaries by reabsorption. How much water is reclaimed is adjusted by the hormone ADH, which acts mainly on the collecting duct. Excess water, salts and dissolved wastes remain or are added to the tubule and leave in urine. The collecting ducts drain toward the renal pelvis.',clue:'Reabsorption returns useful substances to blood; urine carries the remaining waste away.',checks:[['Glucose in filtrate is usually…',['Returned to blood','Stored in bladder as sugar','Exhaled'],0,'Useful glucose is normally reabsorbed.'],['Where does final urine flow after collecting ducts?',['Into renal pelvis','Into glomerulus','Into renal artery'],0,'It travels toward the renal pelvis.'],['The loop of Henle helps the kidney…',['Breathe','Conserve water','Pump blood'],1,'The loop builds the concentration gradient; ADH then controls how much water the collecting duct returns.']]},
 {goal:'Connect kidney regulation with exercise and homeostasis.',terms:'homeostasis · water balance · salts · blood pH · exercise',text:'Kidneys adjust how much water and salts leave the body and help regulate blood acid-base balance. During exercise, breathing releases more carbon dioxide, sweat carries away some water and salts, and kidneys can conserve water when fluid is scarce. These systems work together to keep internal conditions suitable for cells.',clue:'Sweating and breathing change losses; kidneys adjust the composition of urine over time.',checks:[['During exercise, which organ releases more CO₂ as breathing increases?',['Skin','Lungs','Bladder'],1,'The lungs exhale carbon dioxide.'],['If the body needs to conserve water, kidneys can…',['Reabsorb more water','Stop filtering blood forever','Turn urea into oxygen'],0,'More water can return to blood, leaving less in urine.'],['Maintaining stable internal conditions is called…',['Filtration','Evaporation','Homeostasis'],2,'Water, salts and acid-base balance are part of homeostasis.']]},
 {goal:'Interpret common kidney problems and compare treatments.',terms:'kidney stone · nephritis · infection · dialysis · transplant',text:'Kidney stones are hard mineral deposits that may obstruct urine flow. Nephritis involves kidney inflammation, often affecting glomeruli. Infection can spread from the urinary tract toward the kidneys. If kidneys cannot filter sufficiently, dialysis uses a machine to remove wastes from blood; a transplant replaces kidney function with a donated kidney. These classroom cases show mechanisms, not diagnoses.',clue:'A stone is a solid deposit; dialysis filters blood outside the body.',checks:[['A kidney stone is…',['A hard mineral deposit','A normal nephron','A red blood cell'],0,'Minerals can crystallize into a solid stone.'],['Nephritis involves…',['More alveoli','Kidney inflammation','Extra ureters'],1,'Inflammation may affect glomeruli and kidney tissue.'],['Dialysis helps by…',['Replacing the lungs','Making a kidney stone','Filtering wastes from blood'],2,'Dialysis removes wastes when kidney function is insufficient.']]}
];
const finalStages=[
 ['Which three organs contribute directly to excretion?',['Lungs, skin and kidneys','Bones, biceps and cartilage'],0,'The lungs, skin and kidneys remove different wastes.'],
 ['Follow urine after it leaves a kidney.',['Ureter → bladder → urethra','Urethra → artery → bladder'],0,'Urine follows the ureter, bladder and urethra.'],
 ['Which kidney region is on the outside?',['Medulla','Cortex'],1,'The cortex is outer.'],
 ['At the glomerulus, which stays in the blood?',['Blood cells','Water and urea'],0,'Cells normally remain within the vessels.'],
 ['Where does filtrate first collect?',['Bowman’s capsule','Urinary bladder'],0,'The capsule surrounds the glomerulus.'],
 ['What does reabsorption return?',['Useful water and solutes to blood','All waste into the renal artery'],0,'Useful material returns from tubule to blood.'],
 ['Exercise leads to sweating. What can kidneys adjust?',['Water lost in urine','Number of bones'],0,'Kidneys adjust water balance.'],
 ['When kidneys filter inadequately, dialysis…',['Filters wastes from blood','Creates new nephrons immediately'],0,'Dialysis provides an artificial filtering route.']
];lessons.forEach(l=>{l.checks=l.checks.map(mixQ)});finalStages.forEach((q,i)=>finalStages[i]=mixQ(q));

function progress(){if(!state.excretory||typeof state.excretory!=='object')state.excretory={};const p=state.excretory;p.done=Array.isArray(p.done)?p.done:[];p.steps=p.steps&&typeof p.steps==='object'?p.steps:{};p.weak=Array.isArray(p.weak)?p.weak:[];return p}
const done=id=>!!progress().steps[id];
function step(id,xp){if(done(id))return;progress().steps[id]=true;save();reward('exc-'+id,xp)}
const percent=()=>Math.round((progress().done.length+Number(!!progress().mastery))/7*100);
function landing(){const p=progress();layout(`<div class="exc-world"><section class="exc-hero"><div><span class="eyebrow">SYSTEM 06 — EXCRETORY SYSTEM</span><h1>The Balance Mission</h1><p>Follow wastes out of the body, enter a kidney, pass the nephron filtration gate and rescue useful water before it becomes urine.</p><a class="btn" href="#excretory/mission/${Math.min(6,p.done.length+1)}">${p.done.length?'Continue':'Begin'} the mission →</a><p class="exc-progress">${p.done.length}/6 missions · ${percent()}% complete</p></div><div class="exc-hero-art"><img src="assets/excretory-kidney-hero.webp" alt="Kidney cutaway showing the cortex, medullary pyramids, collecting region, renal blood vessels, and ureter" width="720" height="900" loading="eager"></div></section>${bodyAtlasMarkup('excretory')}<section class="panel exc-intro"><span class="eyebrow">EXPEDITION MAP</span><h2>Six discoveries. One balanced body.</h2><p>Solve the hands-on challenge and three checks in each mission to unlock the next. Explore the 3D urinary organs, kidney cutaway and enlarged nephron as you go.</p></section><div class="resp-grid">${titles.map((title,i)=>`<article class="panel resp-card ${i>p.done.length?'resp-locked':''}"><span class="eyebrow">MISSION ${String(i+1).padStart(2,'0')} ${p.done.includes(i+1)?'· COMPLETE':''}</span><h3>${title}</h3><p>${lessons[i].goal}</p>${i<=p.done.length?`<a class="btn secondary" href="#excretory/mission/${i+1}">${p.done.includes(i+1)?'Replay':'Explore'} →</a>`:'<span class="exc-locked">Finish the previous mission to unlock</span>'}</article>`).join('')}</div><section class="panel resp-finale"><div><span class="eyebrow">FINAL CHALLENGE</span><h2>Restore the balance</h2><p>Combine your six discoveries to earn the Excretory System Key.</p></div>${p.done.length===6?'<a class="btn" href="#excretory/mastery">Enter final challenge →</a>':'<span>Complete all six missions to unlock</span>'}</section></div>`);window.mountBodyAtlas?.('excretory')}
/* One real manipulation per mission: sorting, sequencing or simulation. */
const EXC_LABS={
 1:{kind:'sort',title:'Waste relay',intro:'Send each waste or fluid to the organ that removes it from the body.',bins:['Lungs','Skin','Kidneys'],
   items:[['Carbon dioxide',0,'The lungs exhale the carbon dioxide produced by respiration.'],
          ['Water vapour',0,'Breathing out also carries water vapour away.'],
          ['Water and salts in sweat',1,'Sweat glands in the skin release water and salts, and evaporation cools the body.'],
          ['Urea',2,'The kidneys remove urea, which the liver makes from excess amino acids.'],
          ['Excess salts',2,'The kidneys adjust salt removal to keep the blood balanced.'],
          ['Excess water',2,'The kidneys remove extra water as urine.']]},
 2:{kind:'sequence',title:'Build the kidney route',intro:'Choose the structures in order: start at the outer region of the kidney and finish where urine leaves the body.',
   order:['Renal cortex','Renal medulla','Renal pelvis','Ureter','Urinary bladder'],
   why:['The cortex is the outer region, where filtration happens.',
        'The medulla holds the loops of Henle and the collecting ducts.',
        'The renal pelvis collects urine before it leaves the kidney.',
        'A ureter carries urine from the kidney to the bladder.',
        'The bladder stores urine until it is released.']},
 3:{kind:'sort',title:'The filtration gate',intro:'Decide what passes into the tubule at the glomerulus and what stays in the blood.',bins:['Filtered into the tubule','Stays in the blood'],
   items:[['Water',0,'Water is filtered, and most of it is reabsorbed later.'],
          ['Glucose',0,'Glucose is filtered and then normally reabsorbed completely.'],
          ['Urea',0,'Urea is filtered and leaves the body in urine.'],
          ['Salts',0,'Salts are filtered, then adjusted by reabsorption.'],
          ['Proteins',1,'Proteins are too large to cross the filtration barrier.'],
          ['Blood cells',1,'Blood cells stay in the blood; finding them in urine signals a problem.']]},
 4:{kind:'sort',title:'Keep the useful parts',intro:'Decide what returns to the blood and what leaves in urine.',bins:['Returned to the blood','Leaves in urine'],
   items:[['Glucose',0,'All the filtered glucose is normally reabsorbed.'],
          ['Most of the water',0,'About 99% of the filtered water is reabsorbed.'],
          ['Amino acids',0,'Amino acids are useful, so they are reabsorbed.'],
          ['Urea',1,'Urea is a waste product and leaves in urine.'],
          ['Excess salts',1,'Salts above what the body needs leave in urine.'],
          ['Creatinine',1,'Creatinine from muscle breakdown is excreted.']]},
 6:{kind:'sort',title:'Kidney care detective',intro:'Decide whether each finding describes healthy kidney function or something that needs medical attention.',bins:['Healthy kidney function','Needs medical attention'],
   items:[['Filters about 180 litres of fluid a day',0,'A healthy kidney filters a large volume and reabsorbs most of it.'],
          ['Adjusts water and salt balance',0,'That is the kidney doing its normal job.'],
          ['Produces urine continuously',0,'Filtration runs all the time and the bladder stores the urine.'],
          ['Blood in the urine',1,'Blood should not cross the filtration barrier; this needs medical assessment.'],
          ['A stone blocking a ureter with severe pain',1,'A blockage causes pain and needs medical treatment.'],
          ['Dialysis several times a week',1,'Dialysis replaces filtration when the kidneys cannot do it.']]}
};
function excShuffle(len){const a=Array.from({length:len},(_,i)=>i);for(let i=len-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
/* the activity figure, placed inside each lab section */

/* The figure follows the lab: a chosen bin lights that organ or outcome, the
   sequencing lab advances as steps are placed, and the ADH slider moves the band. */
(()=>{'use strict';
 if(window.__excArtWire)return;window.__excArtWire=1;
 const art=()=>document.getElementById('exc-lab-art');
 const set=i=>{const a=art();if(a&&i!=null&&i>-1)a.dataset.stage=String(i)};
 document.addEventListener('click',e=>{
  const bin=e.target.closest('[data-exc-bin]');
  if(bin){set(+bin.dataset.excBin);return}
  const step=e.target.closest('[data-exc-step],.exc-seq li');
  if(step){const placed=document.querySelectorAll('#exc-seq li').length;set(Math.max(0,placed-1));return}
  const chip=e.target.closest('[data-exc-item]');
  if(chip){const placed=document.querySelectorAll('#exc-seq li').length;if(placed)set(Math.max(0,placed-1))}
 },true);
 document.addEventListener('input',e=>{
  if(e.target.id==='adh-level'){const v=+e.target.value,max=+(e.target.max||10);const band=v/max<0.34?0:v/max<0.67?1:2;set(band)}
 },true);
})();
const excArt=n=>{const a=(typeof inneruActivityArt==='function')?inneruActivityArt('excretory',n):'';return a?`<div class="exc-lab-art" id="exc-lab-art">${a}</div>`:''};
function excLabMarkup(n){
 const lab=EXC_LABS[n];
 if(!lab)return adhLab(n);
 const saved=done(`${n}-lab`);
 const head=`<span class="eyebrow">INTERACTIVE LAB</span><h2>${lab.title}</h2><p class="exc-prompt">${lab.intro}</p>`;
 if(lab.kind==='sort'){
  return `<section class="panel exc-lab">${excArt(n)}${head}
   <p class="exc-lab-count" id="exc-lab-step">${saved?'\u2713 Discovery saved \u00b7 replay to practise':`0 / ${lab.items.length} placed`}</p>
   <div class="exc-chips" role="group" aria-label="Substances to sort">${excShuffle(lab.items.length).map(i=>`<button type="button" class="exc-chip" data-exc-item="${i}" aria-pressed="false">${esc(lab.items[i][0])}</button>`).join('')}</div>
   <div class="exc-bins">${lab.bins.map((b,i)=>`<section class="exc-bin" data-exc-bin="${i}" role="button" tabindex="0" aria-label="Place in ${esc(b)}"><h4>${esc(b)}</h4><ul class="exc-bin-list" id="exc-bin-${i}"></ul></section>`).join('')}</div>
   <p class="exc-hint">Pick a substance, then choose where it goes.</p>
   <div id="exc-lab-feedback" class="exc-lab-feedback" role="status" aria-live="polite"></div></section>`;
 }
 return `<section class="panel exc-lab">${excArt(n)}${head}
  <p class="exc-lab-count" id="exc-lab-step">${saved?'\u2713 Discovery saved \u00b7 replay to practise':`0 / ${lab.order.length} chosen`}</p>
  <ol class="exc-seq" id="exc-seq"></ol>
  <div class="exc-chips" role="group" aria-label="Structures to order">${excShuffle(lab.order.length).map(i=>`<button type="button" class="exc-chip" data-exc-step="${i}" aria-pressed="false">${esc(lab.order[i])}</button>`).join('')}</div>
  <button class="btn line" id="exc-reset" type="button">Start the order again</button>
  <div id="exc-lab-feedback" class="exc-lab-feedback" role="status" aria-live="polite"></div></section>`;
}
function wireExcLab(n,finish){
 const lab=EXC_LABS[n];
 if(!lab)return;
 const fb=document.getElementById('exc-lab-feedback'),count=document.getElementById('exc-lab-step');
 if(lab.kind==='sort'){
  let selected=null;const tries={};
  const chips=[...document.querySelectorAll('[data-exc-item]')];
  const chipOf={};chips.forEach(c=>{chipOf[+c.dataset.excItem]=c});
  const select=i=>{selected=i;chips.forEach(c=>c.setAttribute('aria-pressed',String(+c.dataset.excItem===i)))};
  chips.forEach(c=>{c.onclick=()=>{if(!c.disabled)select(+c.dataset.excItem)}});
  document.querySelectorAll('[data-exc-bin]').forEach(bin=>{
   const place=()=>{
    if(selected===null){fb.textContent='Choose a substance first, then its destination.';return}
    const i=selected,item=lab.items[i];
    if(item[1]===+bin.dataset.excBin){
     const li=document.createElement('li');li.textContent=item[0];
     document.getElementById('exc-bin-'+bin.dataset.excBin).append(li);
     const chip=chipOf[i];chip.disabled=true;chip.classList.add('exc-placed');chip.setAttribute('aria-pressed','false');
     fb.innerHTML='\u2713 '+esc(item[2]);selected=null;
     const placed=document.querySelectorAll('.exc-bin-list li').length;
     count.textContent=`${placed} / ${lab.items.length} placed`;
     if(placed===lab.items.length){step(`${n}-lab`,20);count.textContent='\u2713 DISCOVERY SAVED';finish()}
    }else{
     tries[i]=(tries[i]||0)+1;
     fb.textContent=tries[i]<2?'Not yet. Think about where that substance is handled.':'Look again. '+item[2];
    }
   };
   bin.onclick=place;
   bin.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();place()}};
  });
  return;
 }
 const seq=document.getElementById('exc-seq');const chosen=[];
 document.querySelectorAll('[data-exc-step]').forEach(btn=>{
  btn.onclick=()=>{
   const i=+btn.dataset.excStep;
   if(chosen.includes(i))return;
   if(i===chosen.length){
    chosen.push(i);btn.disabled=true;btn.classList.add('exc-placed');
    const li=document.createElement('li');li.textContent=lab.order[i];seq.append(li);
    fb.innerHTML='\u2713 '+esc(lab.why[i]);
    count.textContent=`${chosen.length} / ${lab.order.length} chosen`;
    if(chosen.length===lab.order.length){step(`${n}-lab`,20);count.textContent='\u2713 DISCOVERY SAVED';finish()}
   }else{
    fb.textContent='Not yet. That structure does not come next in the route.';
   }
  };
 });
 const reset=document.getElementById('exc-reset');
 if(reset)reset.onclick=()=>mission(n);
}
function lab(n){return excLabMarkup(n)}


/* A real manipulation for the homeostasis missions: change ADH, watch the kidney respond. */
function adhLab(n){return `<section class="panel exc-adh" id="exc-adh-panel">${excArt(n)}<span class="eyebrow">SIMULATION \u00b7 ADH AND WATER BALANCE</span>
<h2>Set the hormone, keep the balance</h2>
<p>ADH tells the collecting ducts how much water to return to the blood. She has just been sweating heavily, so her body needs to conserve water.</p>
<label for="adh-level">ADH level: <b id="adh-value">35%</b></label>
<input type="range" id="adh-level" min="0" max="100" value="35" step="5" class="input" aria-describedby="adh-out">
<dl class="exc-adh-out" id="adh-out" role="status" aria-live="polite">
<dt>Water reabsorbed</dt><dd id="adh-reabsorb">59%</dd>
<dt>Urine volume</dt><dd id="adh-volume">1.39 L / day</dd>
<dt>Urine concentration</dt><dd id="adh-conc">485 mOsm/kg</dd>
</dl>
<p class="exc-adh-status" id="adh-status">Adjust the slider to see the effect.</p>
<p class="hint"><b>Target:</b> keep the urine volume between <b>0.30</b> and <b>0.60 L per day</b>.</p>
<p class="note" id="adh-result"></p></section>`}
function wireAdh(n){const slider=document.getElementById('adh-level');if(!slider)return;
const out=id=>document.getElementById(id);
function update(){const adh=+slider.value,reabsorb=Math.round(40+55*adh/100),volume=(2-1.75*adh/100),conc=Math.round(100+1100*adh/100);
out('adh-value').textContent=adh+'%';out('adh-reabsorb').textContent=reabsorb+'%';out('adh-volume').textContent=volume.toFixed(2)+' L / day';out('adh-conc').textContent=conc+' mOsm/kg';
const status=out('adh-status');let msg='';
if(volume>1.5){msg='Too little ADH: the urine stays large and dilute, so water is lost.'}
else if(volume>0.6){msg='Closer. More ADH would return more water to the blood.'}
else if(volume>=0.3){msg='Good. Water is conserved and the urine is concentrated.'}
else{msg='More ADH than needed: the urine is very small and highly concentrated.'}
status.textContent=msg;
if(volume<=0.6&&volume>=0.3){if(!done(n+'-adh')){step(n+'-adh',15);out('adh-result').innerHTML='\u2713 Discovery saved: ADH controls how much water the collecting duct returns. +15 XP'}else{out('adh-result').innerHTML='\u2713 Target held.'}}
else{out('adh-result').textContent=''}}
slider.oninput=update;update()}
function mission(n){const p=progress();if(!Number.isInteger(n)||n<1||n>6||n>1&&!p.done.includes(n-1)){location.hash='excretory';return}const d=lessons[n-1];layout(`<div class="exc-world"><a class="textlink" href="#excretory">← The Balance Mission</a><div class="resp-mission-header"><span class="eyebrow">SYSTEM 06 · MISSION ${String(n).padStart(2,'0')}</span><h1>${titles[n-1]}</h1><p>${d.goal}</p></div>${typeof inneruMissionArt==='function'?inneruMissionArt('excretory',n):''}<div class="resp-columns"><div><section class="panel resp-lesson"><span class="eyebrow">LEARN THE SCIENCE</span><h2>The idea</h2><p>${d.text}</p><p class="hint"><strong>Remember:</strong> ${d.clue}</p></section>${lab(n)}<section class="panel resp-checks"><span class="eyebrow">CHECK YOUR UNDERSTANDING</span><h2>Three checks</h2>${d.checks.map((q,i)=>`<div class="resp-question" data-exc-question="${i}"><h3>${i+1}. ${q[0]}</h3><div class="resp-choices">${q[1].map((a,j)=>`<button type="button" data-choice="${j}" ${done(`${n}-q${i}`)?'disabled':''}>${a}</button>`).join('')}</div><div class="resp-feedback" role="status">${done(`${n}-q${i}`)?'✓ '+q[3]:''}</div></div>`).join('')}<div id="exc-finish"></div></section></div><aside class="panel resp-aside"><h3>Mission guide</h3><p><strong>Goal:</strong> ${d.goal}</p><p><strong>Keywords:</strong> ${d.terms}</p><p><strong>Clue:</strong> ${d.clue}</p><a class="textlink" href="#excretory">Open the 3D explorer →</a></aside></div></div>`);
const finish=()=>{if(done(`${n}-lab`)&&d.checks.every((_,i)=>done(`${n}-q${i}`))){if(!p.done.includes(n)){p.done.push(n);save();reward('exc-mission-'+n,25)}document.getElementById('exc-finish').innerHTML=`<div class="feedback">Mission complete. Balance fragment ${n}/6 secured. <a href="#excretory/${n===6?'mastery':'mission/'+(n+1)}">${n===6?'Final challenge':'Next mission'} →</a></div>`}};
wireExcLab(n,finish);
document.querySelectorAll('[data-exc-question]').forEach(el=>{const i=+el.dataset.excQuestion,q=d.checks[i],weakId=n+'-q'+i;el.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const good=+b.dataset.choice===q[2],tries=+el.dataset.tries||0;if(!good)el.dataset.tries=String(tries+1);el.querySelector('.resp-feedback').textContent=good?'Correct. '+q[3]:(tries<1?'Not yet. Re-read the mission guide, then try again.':'Look again. '+q[3]);el.classList.toggle('resp-wrong',!good);const pw=progress();if(good){pw.weak=pw.weak.filter(x=>x!==weakId)}else if(!pw.weak.includes(weakId)){pw.weak.push(weakId)}save();if(good){b.classList.add('resp-correct');el.querySelectorAll('button').forEach(x=>x.disabled=true);step(`${n}-q${i}`,7);finish()}})});wireAdh(n);finish()}
function mastery(){const p=progress();if(p.done.length<6){location.hash='excretory';return}layout(`<div class="exc-world"><a class="textlink" href="#excretory">← The Balance Mission</a><div class="resp-mission-header"><span class="eyebrow">SYSTEM 06 · FINAL CHALLENGE</span><h1>Restore the balance</h1><p>Reconnect waste removal, filtration, reabsorption and fluid balance.</p></div><section class="panel resp-checks">${finalStages.map((q,i)=>`<div class="resp-question" data-exc-final="${i}"><span class="eyebrow">STAGE ${i+1}/8</span><h3>${q[0]}</h3><div class="resp-choices">${q[1].map((a,j)=>`<button type="button" data-choice="${j}" ${done('final-'+i)?'disabled':''}>${a}</button>`).join('')}</div><div class="resp-feedback" role="status">${done('final-'+i)?'✓ '+q[3]:''}</div></div>`).join('')}<div id="exc-mastered"></div></section></div>`);const finish=()=>{if(finalStages.every((_,i)=>done('final-'+i))){if(!p.mastery){p.mastery=true;save();reward('exc-key',50)}document.getElementById('exc-mastered').innerHTML='<div class="feedback"><h2>Balance restored!</h2><p>You earned the Excretory System Key.</p><a class="btn secondary" href="#excretory">Explore the world again →</a></div>'}};document.querySelectorAll('[data-exc-final]').forEach(el=>{const i=+el.dataset.excFinal,q=finalStages[i];el.querySelectorAll('button').forEach(b=>b.onclick=()=>{const good=+b.dataset.choice===q[2];el.querySelector('.resp-feedback').textContent=(good?'Correct. ':'Try again. ')+q[3];el.classList.toggle('resp-wrong',!good);if(good){b.classList.add('resp-correct');el.querySelectorAll('button').forEach(x=>x.disabled=true);step('final-'+i,8);finish()}})});finish()}
const priorPortal=portal;portal=function(i){if(i!==5)return priorPortal(i);const p=percent(),s=systems[5];return `<article class="portal world-portal playable" data-card="5" style="--system-color:${s[3]}"><button class="system-select" data-system="5" aria-pressed="false" aria-label="Select Excretory System"><span class="world-card-top"><span class="system-icon">${systemIcon(5)}</span><span class="world-index">WORLD 06</span></span><span class="world-card-name">FILTER</span><span class="scientific-name">Excretory System</span><span class="ready-label">${p?'Exploration in progress':'Ready to explore'}</span><span class="progress-meta"><span>${p}% complete</span><span>${progress().done.length}/6 missions</span></span><span class="bar"><i style="width:${p}%"></i></span></button><a class="btn enter-world" href="#excretory">Enter World →</a></article>`};
const priorHighlight=highlightSystem;highlightSystem=function(i){priorHighlight(i);if(i!==5)return;const panel=document.getElementById('selected-system-panel');panel.innerHTML='<div class="eyebrow">THE BALANCE MISSION</div><h2>Excretory System</h2><p>Trace wastes, inspect kidneys and nephrons, and restore fluid balance.</p><a class="btn selected-enter" href="#excretory">Enter the Balance Mission →</a><button class="clear-selection" aria-label="Show all body systems">Show all systems</button>';panel.querySelector('.clear-selection').onclick=resetSystem};
const priorSelectSystem=selectSystem;selectSystem=function(i){priorSelectSystem(i);if(i===5){const tip=document.getElementById('anatomy-tooltip');if(tip)tip.textContent='Enter the Balance Mission'}};
const priorHome=home;home=function(){priorHome();const j=document.querySelector('[data-journey="5"]');if(j&&!j.querySelector('.journey-playable'))j.insertAdjacentHTML('beforeend','<b class="journey-playable">PLAYABLE</b>')};
const priorDashboard=dashboard;dashboard=function(){priorDashboard();const p=progress(),section=document.createElement('section');section.className='panel spacer';section.innerHTML=`<div class="eyebrow">SYSTEM 06 — EXCRETORY SYSTEM</div><h2>The Balance Mission</h2><p>${p.done.length}/6 missions complete · ${p.mastery?'System Key earned':'Final challenge awaits'}</p><div class="bar"><i style="width:${percent()}%"></i></div><a class="btn" href="#excretory">Continue the Balance Mission →</a>`;const weakIds=p.weak||[];if(weakIds.length){const rv=document.createElement('p');rv.className='note';rv.innerHTML='Revisit: '+weakIds.map(id=>{const a=id.split('-q').map(Number);return '<a class="textlink" href="#excretory/mission/'+a[0]+'">'+lessons[a[0]-1].checks[a[1]][0]+'</a>'}).join(' · ');section.append(rv)}
document.getElementById('main').append(section);const reset=document.getElementById('reset');if(reset){const before=reset.onclick;reset.onclick=()=>{before();const yes=document.getElementById('confirm-reset');if(yes){const confirm=yes.onclick;yes.onclick=()=>{state.excretory={done:[],steps:{},mastery:false};confirm()}}}}};
const priorBadges=badges;badges=function(){priorBadges();const p=progress();document.getElementById('main').insertAdjacentHTML('beforeend',`<section class="panel spacer"><h2>Balance Mission discoveries</h2><div class="resp-grid">${titles.map((title,i)=>`<a class="badge ${p.done.includes(i+1)?'':'locked'}" href="#excretory/mission/${i+1}"><span>◈</span><h3>${title}</h3><p>${p.done.includes(i+1)?'Earned':'Complete mission '+(i+1)}</p></a>`).join('')}</div><p>${p.mastery?'Excretory System Key earned.':'Complete all missions and the final challenge to earn the System Key.'}</p></section>`)};
const priorInfo=info;info=function(r){priorInfo(r);if(r==='sources')document.querySelector('#main .sourcelist')?.insertAdjacentHTML('beforeend','<li><b>UAE Inspire Science Biology · Grade 10 General · Excretory System, supplied lesson pp. 40–44.</b><br>Organs of excretion, renal structure, nephron filtration and reabsorption, kidney disorders and treatments. Original 3D teaching model is simplified; textbook figures are not reproduced.</li>')};
const priorRoute=route;window.removeEventListener('hashchange',priorRoute);route=function(){const h=location.hash.slice(1);if(h==='excretory')landing();else if(h.startsWith('excretory/mission/'))mission(Number(h.split('/')[2]));else if(h==='excretory/mastery')mastery();else priorRoute();window.scrollTo(0,0)};window.addEventListener('hashchange',route);route();
})();
