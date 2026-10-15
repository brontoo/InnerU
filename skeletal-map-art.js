/* Original scientific artwork for the skeletal mission map.
   Presentation only: lesson diagrams, progression and reward IDs stay intact. */
(() => {
  'use strict';
  const studies = [
    {
      file:'01-skeleton', title:'Meet your skeleton', tag:'AXIAL & APPENDICULAR',
      alt:'An adult skeleton in anterior view beside a larger study of the rib cage, spine and shoulder girdles.',
      text:'The axial skeleton includes the skull, vertebral column, ribs and sternum. The appendicular skeleton includes the limbs and the girdles that attach them. A typical adult has 206 bones, with individual variation.',
      key:['Skull & vertebral column','Ribs & sternum','Pectoral & pelvic girdles','Limbs'], points:[[18,25],[91,30]]
    },
    {
      file:'02-bone-shapes', title:'Bone detective', tag:'SHAPE → FUNCTION',
      alt:'Four bone-shape specimens: a long femur, flat sternum, short carpal bones and an irregular lumbar vertebra.',
      text:'A femur is a long bone that supports weight and acts as a lever. The sternum provides broad protection. Short carpal bones support small gliding movements; the complex shape of a vertebra supports and protects the spine.',
      key:['Long · femur','Flat · sternum','Short · carpals','Irregular · vertebra'], points:[[25,26],[76,70]]
    },
    {
      file:'03-bone-interior', title:'Inside a bone', tag:'CORTEX · TRABECULAE · MARROW',
      alt:'Longitudinal long-bone cutaway with compact cortex, trabeculae, red and yellow marrow, periosteum and an enlarged osteon.',
      text:'Dense compact bone forms the cortex; trabecular bone forms a supporting lattice. Red marrow produces blood cells, while yellow marrow is fat-rich. The periosteum covers the outer bone except at articular surfaces. The enlarged osteon shows lamellae surrounding a central canal.',
      key:['Compact cortex','Trabecular lattice','Red & yellow marrow','Periosteum','Osteon'], points:[[36,45],[82,26]]
    },
    {
      file:'04-joints', title:'Joint lab', tag:'MOVEMENT & STABILITY',
      alt:'Anatomical shoulder ball-and-socket and elbow hinge joints showing bones, cartilage, capsules and stabilizing ligaments.',
      text:'The shoulder’s ball-and-socket arrangement permits movement around several axes. The elbow mainly bends and straightens as a hinge. Articular cartilage, capsules and ligaments help joints move smoothly while maintaining stability. The mission also explores pivot, gliding and fibrous joints.',
      key:['Humeral head & glenoid','Elbow articulation','Articular cartilage','Capsule & ligaments'], points:[[27,35],[82,46]]
    },
    {
      file:'05-remodeling', title:'Bone remodeling', tag:'RESORPTION → FORMATION',
      alt:'A multinucleated osteoclast in a resorption lacuna and a row of osteoblasts forming osteoid, with osteocytes in the bone matrix.',
      text:'Osteoclasts resorb bone at the surface. Osteoblasts produce osteoid, which later mineralizes. Some osteoblasts become embedded osteocytes. The balance between resorption and formation helps bone adapt to loading and maintain its structure.',
      key:['Osteoclast · resorption','Osteoblasts · formation','Osteoid seam','Osteocytes & canaliculi'], points:[[25,40],[74,44]]
    },
    {
      file:'06-fracture-repair', title:'Repair the fracture', tag:'FOUR REPAIR CHECKPOINTS',
      alt:'Four stages of bone repair: fracture hematoma, soft fibrocartilaginous callus, hard bony callus and remodeled bone.',
      text:'A fracture hematoma forms after vessels are damaged. An early soft callus bridges the break, followed by a hard bony callus. Remodeling gradually reshapes the repair. The illustrations simplify overlapping biological processes; stability helps the repair tissues develop.',
      key:['1 · Hematoma','2 · Soft callus','3 · Hard callus','4 · Remodeling'], points:[[25,27],[75,27],[25,73],[75,73]]
    },
    {
      file:'07-body-detective', title:'Body Detective', tag:'FOUR ANATOMICAL CLUES',
      alt:'Four joint studies showing knee cartilage wear, inflamed synovial joint tissue, a shoulder bursa and a strained ankle ligament.',
      text:'The fictional cases distinguish four structures: articular cartilage in osteoarthritis, synovial joint tissue in rheumatoid arthritis, a cushioning bursa in bursitis, and a ligament in a sprain. Similar pain can have different anatomical causes; each case supplies its own evidence.',
      key:['Knee · articular cartilage','Joint lining · synovium','Shoulder · bursa','Ankle · ligament'], points:[[26,24],[76,19],[24,59],[73,66]]
    },
    {
      file:'08-athlete-case', title:'The athlete case', tag:'FINAL CASE · ANKLE STABILITY',
      alt:'Lateral ankle and hindfoot anatomy showing tibia, fibula, talus, calcaneus and the lateral ankle ligaments.',
      text:'The athlete’s twisting mechanism points toward a ligament injury in this learning case. The anterior talofibular and calcaneofibular ligaments help stabilize the lateral ankle. Ligaments connect bone to bone; tendons attach muscle to bone.',
      key:['Distal tibia & fibula','Talus & calcaneus','Anterior talofibular ligament','Calcaneofibular ligament'], points:[[36,39],[29,55]]
    }
  ];
  const esc = text => String(text).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const source = study => `assets/skeletal-missions/${study.file}.webp`;
  let disposeCurrent=()=>{}, paused=false;

  function markup(number) {
    const study=studies[number-1];
    if(!study)return '';
    return `<figure class="mission-card-art skeletal-card-art" data-skeletal-art="${number}"><div class="skeletal-card-picture"><img src="${source(study)}" alt="${esc(study.alt)}" width="1536" height="1024" loading="lazy" decoding="async"><div class="skeletal-card-cues" aria-hidden="true">${study.points.map(([x,y],i)=>`<i style="left:${x}%;top:${y}%;--cue-delay:${i*(study.points.length===4?1.5:1.6)}s"></i>`).join('')}</div></div><button type="button" class="skeletal-study-open" data-skeletal-study="${number}" aria-label="Enlarge anatomy study: ${esc(study.title)}"><span aria-hidden="true">⤢</span> Study anatomy</button><figcaption>${study.tag}</figcaption></figure>`;
  }

  function mount(root) {
    disposeCurrent();
    const controller=new AbortController();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motionoff');
    const grid=root.querySelector('.missiongrid');
    const tools=document.createElement('div');tools.className='skeletal-gallery-tools';
    tools.innerHTML='<span>Scientific anatomy · original illustrations</span><button type="button" data-skeletal-motion aria-pressed="false"></button>';
    grid.before(tools);
    const motion=tools.querySelector('button');
    function setMotion(){
      const running=!reduced&&!paused;
      root.dataset.cardMotion=running?'on':'off';
      motion.textContent=reduced?'Reduced motion':running?'Pause card animation':'Play card animation';
      motion.setAttribute('aria-pressed',String(running));motion.disabled=reduced;
      if(reduced)motion.title='Card animation follows your reduced motion setting.';
    }
    setMotion();
    const dialog=document.createElement('dialog');dialog.className='skeletal-study-dialog';
    dialog.setAttribute('aria-labelledby','skeletal-study-title');
    dialog.innerHTML='<button type="button" class="skeletal-study-close" autofocus>Close study <span aria-hidden="true">×</span></button><figure><img width="1536" height="1024" alt=""><figcaption><span class="eyebrow" data-study-tag></span><h2 id="skeletal-study-title"></h2><p></p><ul class="skeletal-study-key" aria-label="Anatomy in this study"></ul><small>Original anatomical teaching illustration · specimens and microscopic details enlarged independently; not to scale</small></figcaption></figure>';
    root.append(dialog);
    root.addEventListener('click',event=>{
      const opener=event.target.closest('[data-skeletal-study]');
      if(opener){
        const study=studies[Number(opener.dataset.skeletalStudy)-1];if(!study)return;
        const image=dialog.querySelector('img');image.src=source(study);image.alt=study.alt;
        dialog.querySelector('[data-study-tag]').textContent=study.tag;
        dialog.querySelector('h2').textContent=study.title;
        dialog.querySelector('figcaption p').textContent=study.text;
        dialog.querySelector('ul').innerHTML=study.key.map(key=>`<li>${esc(key)}</li>`).join('');
        dialog.showModal();return;
      }
      if(event.target.closest('[data-skeletal-motion]')){paused=!paused;setMotion();}
    },{signal:controller.signal});
    dialog.querySelector('.skeletal-study-close').addEventListener('click',()=>dialog.close(),{signal:controller.signal});
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const box=dialog.getBoundingClientRect();
      if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
    },{signal:controller.signal});
    const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-in-view',entry.isIntersecting)),{rootMargin:'80px'});
    root.querySelectorAll('.skeletal-card-art').forEach(figure=>visibility.observe(figure));
    document.addEventListener('visibilitychange',()=>root.classList.toggle('skeletal-page-hidden',document.hidden),{signal:controller.signal});
    const removal=new MutationObserver(()=>{if(!root.isConnected)dispose();});
    removal.observe(document.getElementById('app'),{childList:true});
    let disposed=false;
    function dispose(){if(disposed)return;disposed=true;controller.abort();visibility.disconnect();removal.disconnect();if(dialog.open)dialog.close();}
    disposeCurrent=dispose;
    return dispose;
  }
  window.InneruSkeletalCards={markup,mount};
})();
