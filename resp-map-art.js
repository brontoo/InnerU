/* Original anatomical studies for the respiratory mission cards.
   Presentation only: lesson content, mission gates and reward IDs stay intact. */
(() => {
  'use strict';
  if(window.__respMapArt)return;
  window.__respMapArt=2;
  const studies=[
    {file:'01-lungs',title:'Why we breathe',tag:'LUNGS · AIRWAYS · DIAPHRAGM',
      alt:'Anterior lung anatomy with trachea, main bronchi, lobar fissures, a bronchial-tree cutaway and the diaphragm below.',
      text:'Ventilation moves air through the trachea and branching airways. Gas exchange occurs between alveoli and lung capillaries. Cellular respiration uses oxygen and nutrients within body cells to support ATP production. These are linked processes with different locations.',
      key:['Trachea & main bronchi','Right lung · three lobes','Left lung · two lobes & cardiac notch','Diaphragm below the lungs'],
      inspect:[['Airway tree','Follow the trachea to its bifurcation, then into progressively smaller airway branches.',[42,42]],['Lung lobes','The patient’s right is on your left in this anterior view. The right lung has three lobes; the left has two.',[68,46]],['Diaphragm','The diaphragm separates the thoracic and abdominal cavities. Its movement changes thoracic volume.',[48,82]]]},
    {file:'02-airway-route',title:'Follow the air',tag:'UPPER AIRWAY → BRONCHIAL TREE',
      alt:'A sagittal head-and-neck airway section beside a separately enlarged bronchial tree and distal airway branches.',
      text:'Air passes through the nose or mouth, pharynx, larynx and trachea, then through bronchi and bronchioles toward alveoli. Nasal passages warm and moisten air. Mucus traps particles; cilia in conducting airways help move trapped material toward the throat.',
      key:['Nasal cavity & oral cavity','Pharynx & larynx','Trachea & main bronchi','Bronchioles & distal air sacs'],
      inspect:[['Upper airway','Find the nasal cavity above the palate and the pharynx behind the nasal and oral cavities.',[24,29]],['Conducting airways','The larynx leads into the trachea. The trachea divides into the main bronchi; smaller branches are bronchioles.',[70,35]],['Bronchioles & air sacs','Bronchioles are small conducting branches. Their distal respiratory regions lead into alveolar air spaces. Ciliary clearance in conducting airways helps protect these exchange surfaces.',[80,64]]]},
    {file:'03-alveolar-barrier',title:'At the alveolus',tag:'AIR SPACE · CAPILLARY · THIN BARRIER',
      alt:'Hollow alveolar air sacs surrounded by capillaries, with a separate enlarged study of the thin air–blood barrier and adjacent red blood cells.',
      text:'Alveolar air and capillary blood are separated by a very thin respiratory membrane. Oxygen diffuses from alveolar air into blood; carbon dioxide diffuses in the opposite direction. Each gas follows its own partial-pressure gradient. Thin walls and a large surface area support exchange.',
      key:['Alveolar air space','Capillary network & red cells','Type I alveolar epithelium','Thin basement membrane & endothelium'],
      inspect:[['Alveolar air space','Alveoli are air-filled spaces separated by delicate septa, rather than solid clusters of cells.',[33,65]],['Capillary blood','The capillary network lies next to the alveolar surface. Oxygen enters this blood while carbon dioxide enters alveolar air.',[49,78]],['Respiratory membrane','The enlarged study separates air, thin alveolar epithelium, basement membrane and capillary endothelium. The short diffusion path matters.',[78,48]]]},
    {file:'04-breathing-mechanics',title:'The breathing engine',tag:'INHALE ↓ · EXHALE ↑ · DIAPHRAGM',
      alt:'Paired thoracic anatomical studies comparing the lower, flatter diaphragm during inhalation with the higher dome during quiet exhalation.',
      text:'During inhalation the diaphragm contracts and descends, thoracic volume increases, and alveolar pressure briefly falls below atmospheric pressure so air enters. During quiet exhalation it relaxes and rises; elastic recoil reduces volume and air flows out. The diaphragm does not push air directly into the lungs.',
      key:['Left study · inhalation','Right study · quiet exhalation','Rib cage & sternum','Diaphragm muscle & central tendon'],
      inspect:[['Inhalation','Compare the lower, flatter contracted diaphragm and expanded thoracic space in the left study.',[25,72]],['Quiet exhalation','The right study shows a relaxed, higher diaphragm dome and reduced thoracic volume. Quiet expiration is mainly passive.',[75,65]],['Volume & pressure','Rib movement and diaphragm position change thoracic volume; air flows because of the resulting pressure difference.',[37,40]]]},
    {file:'05-oxygen-transport',title:'Oxygen on the move',tag:'LUNG EXCHANGE → BLOOD → WORKING TISSUE',
      alt:'Pulmonary exchange, red blood cells within a vessel, and a tissue capillary beside skeletal muscle and a magnified mitochondrion.',
      text:'Most oxygen in blood is carried bound to hemoglobin inside red blood cells. At tissues, oxygen leaves blood for cells. Working muscle uses oxygen in aerobic metabolism, supporting ATP production. Carbon dioxide moves back into blood and is transported to the lungs, mostly as bicarbonate.',
      key:['Pulmonary gas exchange','Biconcave red blood cells','Tissue capillary & muscle fibers','Mitochondrion with cristae'],
      inspect:[['Load in the lungs','Oxygen crosses from alveolar air to lung blood; carbon dioxide crosses toward alveolar air.',[18,41]],['Carry in blood','Red cells are biconcave and have no nucleus when mature. Hemoglobin carries most blood oxygen; the cells do not make oxygen.',[49,51]],['Deliver to tissue','Tissue capillaries supply working muscle. Oxygen supports aerobic energy metabolism; cells return carbon dioxide to blood.',[81,50]]]},
    {file:'06-affected-structures',title:'Protect the exchange',tag:'AIRWAY NARROWING · DAMAGED EXCHANGE SURFACES',
      alt:'Four tissue comparisons: narrowed airway in asthma, mucus-rich bronchial inflammation, loss of alveolar septa in emphysema, and fluid-filled alveoli in pneumonia.',
      text:'Different respiratory conditions affect different structures. Asthma can narrow small airways. Bronchitis involves inflamed bronchi and increased mucus. Emphysema destroys alveolar walls and reduces exchange surface. Pneumonia can fill alveoli with inflammatory fluid. These tissue studies illustrate mechanisms; they are not diagnostic images.',
      key:['Top left · airway narrowing','Top right · mucus & bronchial inflammation','Bottom left · lost alveolar septa','Bottom right · fluid in alveoli'],
      inspect:[['Airway conditions','Compare the upper studies: narrowing limits airflow, while bronchial inflammation can increase mucus. These mechanisms can overlap.',[28,27]],['Emphysema','The lower-left study shows enlarged air spaces with loss of intervening alveolar walls and effective exchange surface.',[26,74]],['Pneumonia','The lower-right study shows fluid and inflammatory material within alveolar spaces, which impairs gas exchange.',[75,74]]]},
    {file:'07-breath-to-cell',title:'Keep oxygen moving',tag:'FINAL CHALLENGE · THE BREATH-TO-CELL ROUTE',
      alt:'An integrated anatomical study of lungs, a separately enlarged alveolar–capillary unit, and blood delivery to striated muscle with a mitochondrion inset.',
      text:'Bring the route together: ventilation delivers air to alveoli, pulmonary exchange loads oxygen into blood, circulation delivers it to tissues, and cells use it in aerobic metabolism. Carbon dioxide returns through blood to the lungs for exhalation. Ventilation, exchange, transport and cellular respiration each make a different contribution.',
      key:['Ventilation through the airways','Alveolar–capillary exchange','Blood delivery to muscle','Cellular energy metabolism'],
      inspect:[['Ventilate','Trace the trachea and main bronchi into the lung specimen.',[18,42]],['Exchange & transport','Connect the alveolar air space to the adjacent blood capillary. Blood then carries oxygen toward tissues.',[50,51]],['Use & return','Muscle cells use oxygen in aerobic metabolism and produce carbon dioxide that returns to the lungs in blood.',[82,50]]]}
  ];
  const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const source=study=>`assets/respiratory-missions/${study.file}.webp`;
  let disposeCurrent=()=>{},paused=false,timer=null;
  function markup(n){
    const study=studies[n-1];if(!study)return '';
    return `<figure class="resp-card-art resp-anatomy-art" data-resp-art="${n}"><div class="resp-anatomy-picture"><img src="${source(study)}" alt="${escape(study.alt)}" width="1536" height="1024" loading="lazy" decoding="async"><div class="resp-anatomy-cues" aria-hidden="true">${study.inspect.map(([, ,point],i)=>`<i style="left:${point[0]}%;top:${point[1]}%;--resp-delay:${i*1.4}s"></i>`).join('')}</div></div><figcaption>${study.tag}</figcaption><button type="button" class="resp-study-open" data-resp-study="${n}" aria-label="Enlarge anatomy study: ${escape(study.title)}"><span aria-hidden="true">⤢</span> Study anatomy</button></figure>`;
  }
  window.inneruRespMapArt=markup;
  function mount(world,grid){
    disposeCurrent();
    const controller=new AbortController(),media=matchMedia('(prefers-reduced-motion: reduce)');
    const tools=document.createElement('div');tools.className='resp-art-tools';
    tools.innerHTML='<div><b>ANATOMY FIELD STUDIES</b><span>Seven original illustrations · enlarge any card to explore its structures</span></div><button type="button" data-resp-motion-toggle></button>';
    grid.before(tools);
    const motion=tools.querySelector('button');
    function updateMotion(){
      const reduced=media.matches||document.body.classList.contains('motionoff'),running=!reduced&&!paused;
      world.dataset.respArtMotion=running?'on':'off';motion.disabled=reduced;
      motion.setAttribute('aria-pressed',String(running));motion.textContent=reduced?'Reduced motion':running?'Pause card animation':'Play card animation';
    }
    updateMotion();media.addEventListener('change',updateMotion,{signal:controller.signal});
    motion.addEventListener('click',()=>{paused=!paused;updateMotion();},{signal:controller.signal});
    const preferences=new MutationObserver(updateMotion);preferences.observe(document.body,{attributes:true,attributeFilter:['class']});
    const dialog=document.createElement('dialog');dialog.className='resp-study-dialog';dialog.setAttribute('aria-labelledby','resp-study-title');
    dialog.innerHTML='<header class="resp-study-toolbar"><span>ANATOMY FIELD GUIDE</span><button type="button" class="resp-study-close" autofocus>Close study <span aria-hidden="true">×</span></button></header><div class="resp-study-illustration"><img width="1536" height="1024" alt=""><span class="resp-study-marker" aria-hidden="true"></span></div><section class="resp-study-content"><span class="eyebrow" data-resp-study-tag></span><h2 id="resp-study-title" tabindex="-1"></h2><p data-resp-study-text></p><ul class="resp-study-key" aria-label="Anatomy in this study"></ul><div class="resp-inspect-buttons" role="group" aria-label="Inspect the anatomy"></div><div class="resp-inspect-note" role="status"></div><p class="resp-study-scale">Anatomical teaching reconstruction · microscopic details and specimens enlarged independently; not to scale</p><nav class="resp-study-nav" aria-label="Browse respiratory anatomy studies"><button type="button" data-resp-study-prev>← Previous study</button><span data-resp-study-count></span><button type="button" data-resp-study-next>Next study →</button></nav></section>';
    world.append(dialog);
    let selected=1;
    function inspect(index){
      const entry=studies[selected-1].inspect[index];if(!entry)return;
      const marker=dialog.querySelector('.resp-study-marker');marker.style.left=entry[2][0]+'%';marker.style.top=entry[2][1]+'%';marker.textContent=index+1;
      dialog.querySelectorAll('[data-resp-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.respInspect)===index)));
      dialog.querySelector('.resp-inspect-note').innerHTML=`<b>${escape(entry[0])}</b><p>${escape(entry[1])}</p>`;
    }
    function show(n){
      const study=studies[n-1];if(!study)return;selected=n;
      const picture=dialog.querySelector('img');picture.src=source(study);picture.alt=study.alt;
      dialog.querySelector('[data-resp-study-tag]').textContent=study.tag;
      dialog.querySelector('h2').textContent=study.title;dialog.querySelector('[data-resp-study-text]').textContent=study.text;
      dialog.querySelector('.resp-study-key').innerHTML=study.key.map(key=>`<li>${escape(key)}</li>`).join('');
      dialog.querySelector('.resp-inspect-buttons').innerHTML=study.inspect.map(([title],i)=>`<button type="button" data-resp-inspect="${i}" aria-pressed="false"><b>${i+1}</b>${escape(title)}</button>`).join('');
      dialog.querySelector('[data-resp-study-count]').textContent=`${n} / ${studies.length}`;
      dialog.querySelector('[data-resp-study-prev]').disabled=n===1;dialog.querySelector('[data-resp-study-next]').disabled=n===studies.length;
      inspect(0);
    }
    world.addEventListener('click',event=>{
      const opener=event.target.closest('[data-resp-study]');
      if(opener){show(Number(opener.dataset.respStudy));dialog.showModal();world.classList.add('resp-study-is-open');return;}
      const region=event.target.closest('[data-resp-inspect]');if(region)inspect(Number(region.dataset.respInspect));
    },{signal:controller.signal});
    dialog.querySelector('.resp-study-close').addEventListener('click',()=>dialog.close(),{signal:controller.signal});
    dialog.addEventListener('close',()=>world.classList.remove('resp-study-is-open'),{signal:controller.signal});
    dialog.querySelectorAll('[data-resp-study-prev],[data-resp-study-next]').forEach(b=>b.addEventListener('click',()=>{
      show(selected+(b.hasAttribute('data-resp-study-prev')?-1:1));dialog.querySelector('h2').focus({preventScroll:true});dialog.scrollTop=0;
    },{signal:controller.signal}));
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
    },{signal:controller.signal});
    const visible=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-in-view',entry.isIntersecting)),{rootMargin:'70px'});
    world.querySelectorAll('.resp-anatomy-art').forEach(figure=>visible.observe(figure));
    document.addEventListener('visibilitychange',()=>world.classList.toggle('resp-art-hidden',document.hidden),{signal:controller.signal});
    const removal=new MutationObserver(()=>{if(!world.isConnected)dispose();});removal.observe(document.getElementById('app'),{childList:true});
    let disposed=false;
    function dispose(){if(disposed)return;disposed=true;controller.abort();visible.disconnect();preferences.disconnect();removal.disconnect();if(dialog.open)dialog.close();}
    disposeCurrent=dispose;
  }
  function inject(){
    if(location.hash.split('?')[0]!=='#respiratory')return;
    const grid=document.querySelector('.resp-grid');if(!grid||grid.querySelector('.resp-card-art'))return;
    const world=grid.closest('.resp-world');if(!world)return;world.classList.add('resp-map');
    grid.querySelectorAll('.resp-card').forEach((card,i)=>{card.dataset.respMission=String(i+1);card.insertAdjacentHTML('afterbegin',markup(i+1));});
    const finale=world.querySelector('.resp-finale');if(finale){finale.classList.add('has-art');finale.insertAdjacentHTML('afterbegin',markup(7));}
    mount(world,grid);
  }
  const run=()=>{clearTimeout(timer);timer=setTimeout(inject,0);};
  window.addEventListener('hashchange',run);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
