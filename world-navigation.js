const refs=[['OpenStax · Divisions of the Skeletal System','https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system','Adult bone count, axial and appendicular skeleton.'],['OpenStax · Bone classification','https://openstax.org/books/anatomy-and-physiology-2e/pages/6-2-bone-classification','Long, short, flat and irregular bones.'],['OpenStax · Bone structure','https://openstax.org/books/anatomy-and-physiology-2e/pages/6-3-bone-structure','Compact and spongy bone, marrow, periosteum and bone cells.'],['OpenStax · Fractures and bone repair','https://openstax.org/books/anatomy-and-physiology-2e/pages/6-5-fractures-bone-repair','Hematoma, callus formation and remodeling.'],['OpenStax · Synovial joints','https://openstax.org/books/anatomy-and-physiology-2e/pages/9-4-synovial-joints','Movement and classification of synovial joints.'],['MedlinePlus · Joint disorders','https://medlineplus.gov/jointdisorders.html','Arthritis and bursitis overview.'],['MedlinePlus · Sprains and strains','https://medlineplus.gov/sprainsandstrains.html','Ligament and tendon injury distinctions.']];
/* Lightweight home/reference extensions, in the original wrapper order. No activities. */
/* muscle.js navigation only. */
(()=>{function data(){if(!state.muscle||typeof state.muscle!=='object')state.muscle={};const m=state.muscle;m.done||=[];m.tasks||={};m.weak||=[];m.xp||=0;return m}
const pctM=()=>Math.round(data().done.length/8*100),next=()=>Array.from({length:8},(_,i)=>i+1).find(i=>!data().done.includes(i))||8;
const oldPortal=portal;
portal=function(i){if(i!==2)return oldPortal(i);const p=pctM();return `<article class="portal world-portal playable" data-card="2" style="--system-color:${systems[2][3]}"><button class="system-select" data-system="2" aria-pressed="false" aria-label="Select Muscular System"><span class="world-card-top"><span class="system-icon">${systemIcon(2)}</span><span class="world-index">WORLD 03</span></span><span class="world-card-name">POWER</span><span class="scientific-name">Muscular System</span><span class="ready-label">${p===100?'100% Mastered':p===0?'Ready to explore':status(p)}</span><span class="progress-meta"><span>${p}% complete</span><span>${data().done.filter(n=>n<8).length}/7 missions</span></span><span class="bar"><i style="width:${p}%"></i></span></button><a class="btn mq-enter" href="#muscle">Enter World →</a></article>`};
const oldHighlight=highlightSystem;
highlightSystem=function(i){oldHighlight(i);if(i===2){const panel=$('#selected-system-panel');panel.innerHTML=`<div class="eyebrow">WORLD 03 — POWER</div><h2>Muscular System</h2><p>MOVE. CONTRACT. POWER THE BODY.</p><p>${pctM()}% explored · ${data().done.filter(n=>n<8).length}/7 missions</p><a class="btn" href="#muscle">Enter Power →</a>${selectedSystem!==null?'<button class="clear-selection">Show all systems</button>':''}`;panel.querySelector('.clear-selection')?.addEventListener('click',resetSystem);if(selectedSystem===2)$('#anatomy-tooltip').textContent='Enter Power · Muscular System'}};
const oldSelect=selectSystem;
selectSystem=function(i){oldSelect(i);if(i===2)$('#anatomy-tooltip').textContent='Enter Power · Muscular System'};
const oldHome=home;
home=function(){oldHome();$('[data-card="2"] .portal-discover')?.remove();const journey=$('[data-journey="2"]');if(journey&&!journey.querySelector('.journey-playable'))journey.insertAdjacentHTML('beforeend','<b class="journey-playable">PLAYABLE</b>');};
const oldInfo=info;
info=function(r){oldInfo(r);if(r==='sources')$('#main .sourcelist').insertAdjacentHTML('beforeend',`<li><b>UAE Inspire Science Biology · Grade 10 General · Lesson 3, pages 15–19.</b><br>Muscular System curriculum supplied for this world. Original diagrams; textbook figures are not reproduced.</li><li><a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/10-3-muscle-fiber-contraction-and-relaxation" target="_blank" rel="noopener">OpenStax · Muscle contraction and relaxation ↗</a><br>Sliding filaments, ATP, calcium and the A band.</li><li><a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/10-5-types-of-muscle-fibers" target="_blank" rel="noopener">OpenStax · Types of muscle fibers ↗</a><br>Support for the simplified slow-/fast-twitch comparison.</li>`);if(r==='about'){const p=[...$('#main').querySelectorAll('p')].find(x=>(window.InneruLocale?InneruLocale.source(x):x.textContent).includes('other five'));if(p)p.textContent='Explore the Skeletal System and Muscular System: investigations, evidence checks, learning cases and final challenges. The other four worlds are coming next.'}if(r==='privacy'){const p=[...$('#main').querySelectorAll('p')].find(x=>(window.InneruLocale?InneruLocale.source(x):x.textContent).includes('Written explanations'));if(p)p.textContent='This site stores your optional nickname, preferences, XP, weak spots, completed discoveries and mission progress in this browser. Written explanations and case selections are not saved.'}};})();
(()=>{const circPreviousHome=home;
home=function(){circPreviousHome();const card=$('[data-card="4"]');card?.querySelector('.portal-discover')?.remove();const journey=$('[data-journey="4"]');if(journey&&!journey.querySelector('.journey-playable'))journey.insertAdjacentHTML('beforeend','<b class="journey-playable">PLAYABLE</b>');};
const circPreviousInfo=info;
info=function(r){circPreviousInfo(r);if(r==='sources')$('#main .sourcelist')?.insertAdjacentHTML('beforeend','<li><a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/20-introduction" target="_blank" rel="noopener">OpenStax · The cardiovascular system ↗</a><br>Heart, vessels, circulation and blood.</li><li><a href="https://medlineplus.gov/bloodtransfusionanddonation.html" target="_blank" rel="noopener">MedlinePlus · Blood transfusion ↗</a><br>Real transfusions need clinical compatibility testing.</li>');if(r==='sources')$('#main .sourcelist')?.insertAdjacentHTML('beforeend','<li><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noopener">DBCLS BodyParts3D · 3D heart anatomy ↗</a><br>Version 4.3 aligned anatomical meshes, CC BY-SA 2.1 Japan; colours adapted for classroom learning.</li>');if(r==='about'){const p=[...$('#main').querySelectorAll('p')].find(x=>(window.InneruLocale?InneruLocale.source(x):x.textContent).includes('other four worlds'));if(p)p.textContent='Explore all six body systems through investigations, science checks and final challenges: skin, skeleton, muscles, breathing, circulation and excretion.'}};})();
/* respiratory.js navigation only. */
(()=>{let preview=false;
const previewProgress={done:[],steps:{},weak:[],mastery:false};
function progress(){if(preview)return previewProgress;if(!state.respiratory||typeof state.respiratory!=='object')state.respiratory={};const p=state.respiratory;p.done=Array.isArray(p.done)?p.done:[];p.steps=p.steps&&typeof p.steps==='object'?p.steps:{};p.weak=Array.isArray(p.weak)?p.weak:[];return p}
const percent=()=>Math.round((progress().done.length+Number(!!progress().mastery))/7*100);
const previousPortal=portal;
portal=function(i){if(i!==3)return previousPortal(i);const s=systems[i],p=percent();return `<article class="portal world-portal playable" data-card="3" style="--system-color:${s[3]}"><button class="system-select" data-system="3" aria-pressed="false" aria-label="Select Respiratory System"><span class="world-card-top"><span class="system-icon">${systemIcon(3)}</span><span class="world-index">WORLD 04</span></span><span class="world-card-name">OXYGEN</span><span class="scientific-name">Respiratory System</span><span class="ready-label">${p?'Exploration in progress':'Ready to explore'}</span><span class="progress-meta"><span>${p}% complete</span><span>${progress().done.length}/6 missions</span></span><span class="bar"><i style="width:${p}%"></i></span></button><a class="btn enter-world" href="#respiratory">Enter World <span aria-hidden="true">→</span></a></article>`};
const priorHighlight=highlightSystem;
highlightSystem=function(i){priorHighlight(i);if(i!==3)return;const panel=document.getElementById('selected-system-panel');panel.innerHTML=`<div class="eyebrow">THE OXYGEN MISSION</div><h2>Respiratory System</h2><p>Trace air, exchange gases, investigate breathing and keep cells supplied.</p><a class="btn selected-enter" href="#respiratory">Enter the Oxygen Mission →</a><button class="clear-selection" aria-label="Show all body systems">Show all systems</button>`;panel.querySelector('.clear-selection').onclick=resetSystem;const tip=document.getElementById('anatomy-tooltip');if(tip)tip.textContent='Enter the Oxygen Mission'};
const priorSelectSystem=selectSystem;
selectSystem=function(i){priorSelectSystem(i);if(i===3)document.getElementById('anatomy-tooltip').textContent='Enter the Oxygen Mission'};
const previousHome=home;
home=function(){previousHome();const j=document.querySelector('[data-journey="3"]');if(j&&!j.querySelector('.journey-playable'))j.insertAdjacentHTML('beforeend','<b class="journey-playable">PLAYABLE</b>');};
const previousInfo=info;
info=function(r){previousInfo(r);if(r==='sources')document.querySelector('#main .sourcelist')?.insertAdjacentHTML('beforeend','<li><b>UAE Inspire Science Biology · Grade 10 General · Respiratory System, supplied lesson pages 35–39.</b><br>Airway, breathing mechanics, gas exchange and respiratory health. Original diagrams; textbook figures are not reproduced.</li><li><b>Original 3D teaching model.</b><br>Sculpted lung surfaces, trachea, branching airways and diaphragm; a magnified alveolar cluster is shown in the 3D explorer.</li>')};})();
/* integumentary.js navigation only. */
(()=>{let preview=false;
const previewProgress={done:[],steps:{},weak:[],mastery:false};
function progress(){if(preview)return previewProgress;if(!state.integumentary||typeof state.integumentary!=='object')state.integumentary={};const p=state.integumentary;p.done=Array.isArray(p.done)?p.done:[];p.steps=p.steps&&typeof p.steps==='object'?p.steps:{};p.weak=Array.isArray(p.weak)?p.weak:[];return p}
const percent=()=>Math.round((progress().done.length+Number(!!progress().mastery))/7*100);
const oldPortal=portal;
portal=function(i){if(i!==0)return oldPortal(i);const s=systems[i],p=percent();return `<article class="portal world-portal playable" data-card="0" style="--system-color:${s[3]}"><button class="system-select" data-system="0" aria-pressed="false" aria-label="Select Integumentary System"><span class="world-card-top"><span class="system-icon">${systemIcon(0)}</span><span class="world-index">WORLD 01</span></span><span class="world-card-name">BODY SHIELD</span><span class="scientific-name">Integumentary System</span><span class="ready-label">${p?'Exploration in progress':'Ready to explore'}</span><span class="progress-meta"><span>${p}% complete</span><span>${progress().done.length}/6 missions</span></span><span class="bar"><i style="width:${p}%"></i></span></button><a class="btn enter-world" href="#integumentary">Enter World <span aria-hidden="true">→</span></a></article>`};
const oldHighlight=highlightSystem;
highlightSystem=function(i){oldHighlight(i);if(i!==0)return;const panel=document.getElementById('selected-system-panel');panel.innerHTML='<div class="eyebrow">THE LIVING SHIELD</div><h2>Integumentary System</h2><p>Explore the skin, hair, nails and glands through six interactive missions.</p><a class="btn selected-enter" href="#integumentary">Enter the Living Shield →</a><button class="clear-selection" aria-label="Show all body systems">Show all systems</button>';panel.querySelector('.clear-selection').onclick=resetSystem;const tip=document.getElementById('anatomy-tooltip');if(tip)tip.textContent='Enter the Living Shield'};
const oldHome=home;
home=function(){oldHome();const j=document.querySelector('[data-journey="0"]');if(j&&!j.querySelector('.journey-playable'))j.insertAdjacentHTML('beforeend','<b class="journey-playable">PLAYABLE</b>');};
const oldInfo=info;
info=function(r){oldInfo(r);if(r==='sources')document.querySelector('#main .sourcelist')?.insertAdjacentHTML('beforeend','<li><b>UAE Inspire Science Biology · Grade 10 General · Integumentary System, supplied lesson pp. 4–8.</b><br>Skin structure, tissues, thermoregulation, repair and UV effects. Activities and model are original; textbook figures are not reproduced.</li>')};})();
/* excretory.js navigation only. */
(()=>{let preview = false,
    sessionSteps = new Set();
function progress() {
    if (!state.excretory || typeof state.excretory !== "object")
      state.excretory = {};
    const p = state.excretory;
    p.done = Array.isArray(p.done) ? p.done : [];
    p.steps = p.steps && typeof p.steps === "object" ? p.steps : {};
    p.weak = Array.isArray(p.weak) ? p.weak : [];
    return p;
  }
const percent = () =>
    Math.round(
      ((progress().done.filter((n) => n >= 1 && n <= 6).length +
        Number(!!progress().mastery)) /
        7) *
        100,
    );
const priorPortal = portal;
portal = function (i) {
    if (i !== 5) return priorPortal(i);
    const p = percent(),
      s = systems[5];
    return `<article class="portal world-portal playable" data-card="5" style="--system-color:${s[3]}"><button class="system-select" data-system="5" aria-pressed="false" aria-label="Select Excretory System"><span class="world-card-top"><span class="system-icon">${systemIcon(5)}</span><span class="world-index">WORLD 06</span></span><span class="world-card-name">FILTER</span><span class="scientific-name">Excretory System</span><span class="ready-label">${p ? "Exploration in progress" : "Ready to explore"}</span><span class="progress-meta"><span>${p}% complete</span><span>${progress().done.length}/6 missions</span></span><span class="bar"><i style="width:${p}%"></i></span></button><a class="btn enter-world" href="#excretory">Enter World →</a></article>`;
  };
const priorHighlight = highlightSystem;
highlightSystem = function (i) {
    priorHighlight(i);
    if (i !== 5) return;
    const panel = document.getElementById("selected-system-panel");
    panel.innerHTML =
      '<div class="eyebrow">THE BALANCE MISSION</div><h2>Excretory System</h2><p>Trace wastes, inspect kidneys and nephrons, and restore fluid balance.</p><a class="btn selected-enter" href="#excretory">Enter the Balance Mission →</a><button class="clear-selection" aria-label="Show all body systems">Show all systems</button>';
    panel.querySelector(".clear-selection").onclick = resetSystem;
  };
const priorSelectSystem = selectSystem;
selectSystem = function (i) {
    priorSelectSystem(i);
    if (i === 5) {
      const tip = document.getElementById("anatomy-tooltip");
      if (tip) tip.textContent = "Enter the Balance Mission";
    }
  };
const priorHome = home;
home = function () {
    priorHome();
    const j = document.querySelector('[data-journey="5"]');
    if (j && !j.querySelector(".journey-playable"))
      j.insertAdjacentHTML(
        "beforeend",
        '<b class="journey-playable">PLAYABLE</b>',
      );
  };
const priorInfo = info;
info = function (r) {
    priorInfo(r);
    if (r === "sources")
      document
        .querySelector("#main .sourcelist")
        ?.insertAdjacentHTML(
          "beforeend",
          "<li><b>UAE Inspire Science Biology · Grade 10 General · Excretory System, supplied lesson pp. 40–44.</b><br>Organs of excretion, renal structure, nephron filtration and reabsorption, kidney disorders and treatments. Original 3D teaching model is simplified; textbook figures are not reproduced.</li>",
        );
  };})();
/* capstone.js navigation only. */
(()=>{const REQUIRED_KEYS = 6;
const keys = () => (typeof keysEarned === 'function' ? keysEarned() : 0);
const previousHome = home;
home = function () {
    previousHome();
    const card = document.querySelector('.final-destination');
    if (!card) return;
    const n = keys(), chip = card.querySelector('.chip'), body = card.querySelector('p');
    if (n >= REQUIRED_KEYS) {
      if (chip) chip.textContent = 'Unlocked \u00b7 6/6 keys';
      card.classList.add('is-unlocked');
      if (body) body.textContent = 'All six keys earned. Six decisions, one story.';
      if (!card.querySelector('.cap-enter')) card.insertAdjacentHTML('beforeend', '<a class="btn cap-enter" href="#final">Start the final challenge \u2192</a>');
    } else if (chip) {
      chip.textContent = 'Locked \u00b7 ' + n + '/6 keys';
    }
  };})();
