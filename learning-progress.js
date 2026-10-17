/* One read model for the six worlds, task credits and achievements. */
(() => {
  'use strict';
  const worlds=[
    {id:'integumentary',name:'Integumentary',tag:'BODY SHIELD',key:'Shield',route:'#integumentary',image:'01-shield',prefix:'integ-',titles:['Build the barrier','Layers and renewal','Hair, nails and glands','Balance the temperature','Protect and sense','Repair the shield'],final:'Restore the Living Shield'},
    {id:'skeletal',name:'Skeletal',tag:'FRAMEWORK',key:'Framework',route:'#world',image:'02-framework',titles:[...missions.map(m=>m[0])],final:'The athlete case'},
    {id:'muscle',name:'Muscular',tag:'POWER',key:'Power',route:'#muscle',image:'03-power',prefix:'muscle:',titles:['Meet the three muscles','Muscle to movement','Zoom inside a muscle','Slide to contract','Fuel the movement','Endurance or power?','Muscle Lab'],final:'Power the finish'},
    {id:'respiratory',name:'Respiratory',tag:'OXYGEN',key:'Oxygen',route:'#respiratory',image:'04-oxygen',prefix:'resp-',titles:['Why we breathe','Follow the air','At the alveolus','The breathing engine','Oxygen on the move','Protect the exchange'],final:'Keep oxygen moving'},
    {id:'circ',name:'Circulatory',tag:'TRANSPORT',key:'Transport',route:'#circulatory',image:'05-transport',prefix:'circ-',titles:[...circNames],final:'Keep Every Cell Alive'},
    {id:'excretory',name:'Excretory',tag:'BALANCE',key:'Balance',route:'#excretory',image:'06-balance',prefix:'exc-',titles:['Waste relay','Kidney cartographer','The filtration gate','Reabsorption rescue','Balance lab','Kidney care detective'],final:'Restore the balance'}
  ];
  const array=v=>Array.isArray(v)?v:[],has=id=>array(state.rewards).includes(id),money=n=>Number.isFinite(+n)?Math.max(0,+n):0;
  const preview=()=>new URLSearchParams(location.hash.split('?')[1]||'').get('preview')==='1';
  const missionRoute=(w,n)=>w.id==='skeletal'?'#mission/'+n:w.id==='muscle'?'#muscle/mission/'+n:w.route+'/'+(w.id==='circ'?'':'mission/')+n;
  const finalRoute=w=>w.id==='skeletal'?'#mission/8':w.id==='muscle'?'#muscle/mission/8':w.route+'/mastery';
  function describe(id) {
    let system='extra',kind='activity',mission=0,label='Completed discovery',href='#home',m;
    const detective=window.InneruDetectiveCases?.find(c=>'detective2-'+c.id===id);
    if(detective)return {id,system:worlds[['Integumentary','Skeletal','Muscular','Respiratory','Circulatory','Excretory'].indexOf(detective.system)].id,kind:'investigation',mission:0,label:detective.title,href:'#detective'};
    if((m=id.match(/^q([1-8])-([0-2])$/))){system='skeletal';mission=+m[1];kind='check';label='Science check '+(+m[2]+1);}
    else if((m=id.match(/^activity([1-8])$/))){system='skeletal';mission=+m[1];label='Investigation completed';}
    else if((m=id.match(/^case([0-3])$/))){system='skeletal';mission=7;kind='case';label='Joint evidence file '+String.fromCharCode(65+ +m[1]);}
    else if(id==='boss'){system='skeletal';kind='final';label='Framework Key earned';}
    else if(id.startsWith('muscle:')){system='muscle';const t=id.slice(7);mission=+(t.match(/^(?:m|complete-)(\d)/)?.[1]||0);kind=t.startsWith('complete-')?(mission===8?'final':'mission'):t.includes('-check-')?'check':t.includes('-reflect')?'reflection':'activity';label=kind==='mission'?'Mission completed':kind==='final'?'Power Key earned':kind==='check'?'Science checkpoint':t.includes('force')?'Force investigation':'Muscle investigation';}
    else {
      const w=worlds.find(w=>w.prefix&&id.startsWith(w.prefix));
      if(w){system=w.id;const t=id.slice(w.prefix.length);mission=+(t.match(/^(?:mission-|m)?(\d)/)?.[1]||0);kind=t.startsWith('mission-')?'mission':/^(?:key|mastery)$/.test(t)?'final':/(?:-q|-c)\d/.test(t)?'check':t.includes('final-')||t.startsWith('master-')||t.startsWith('boss-')?'decision':'activity';label=kind==='mission'?'Mission completed':kind==='final'?w.key+' Key earned':kind==='check'?'Science checkpoint':kind==='decision'?'Final challenge decision':'Interactive lab';}
      else if(id==='connection'){kind='connection';label='Six-system connection challenge';href='#connect';}
      else if(id==='capstone'){kind='final';label='Keep the body alive · final synthesis';href='#final';}
      else if(id.startsWith('cap-station-')){kind='decision';label='Final mission · system decision';href='#final';}
      else if(id.startsWith('daily-')){kind='daily';label='Daily discovery';href='#daily';}
      else if(id.startsWith('force-')){system='muscle';label=id==='force-lift'?'Force versus load · lift':'Force versus load · hold';href='#muscle/mission/7';}
    }
    const w=worlds.find(w=>w.id===system);
    if(w){if(kind==='final')href=finalRoute(w);else if(mission){href=mission===8?finalRoute(w):missionRoute(w,mission);label+=' · '+(mission===8?w.final:w.titles[mission-1]||'Mission '+mission);}else if(href==='#home')href=w.route;}
    return {id,system,kind,mission,label,href};
  }
  function readWorld(w,profile=state){
    const s=w.id==='skeletal'?profile:(profile[w.id]||{}),raw=array(s.done),done=[...new Set(raw.filter(n=>Number.isInteger(n)&&n>=1&&n<=w.titles.length))];
    const key=w.id==='skeletal'||w.id==='muscle'?raw.includes(8):!!s.mastery;
    const steps=w.id==='skeletal'?array(profile.rewards).filter(id=>/^(activity[1-8]|q[1-8]-[0-2]|case[0-3])$/.test(id)):w.id==='muscle'?Object.keys(s.tasks||{}).filter(k=>s.tasks[k]):Array.isArray(s.steps)?s.steps:Object.keys(s.steps||{}).filter(k=>s.steps[k]);
    const next=Array.from({length:w.titles.length},(_,i)=>i+1).find(n=>!done.includes(n));
    return {...w,keyName:w.key,done,key,steps:[...new Set(steps)],completed:done.length+Number(key),total:w.titles.length+1,percent:Math.round((done.length+Number(key))/(w.titles.length+1)*100),next,resume:key?w.route:next?missionRoute(w,next):finalRoute(w)};
  }
  function achievements(ws,profile=state){
    const has=id=>array(profile.rewards).includes(id);
    const rows=[];
    for(const w of ws){
      w.titles.forEach((title,i)=>{const n=i+1,earned=w.done.includes(n);rows.push({id:w.id+'-mission-'+n,system:w.id,kind:'mission',name:w.id==='skeletal'&&n===1?'ANATOMY EXPLORER':w.id==='skeletal'&&n===3?'FUNCTION DETECTIVE':title,requirement:'Complete mission '+n+': '+title+'.',earned,current:earned?1:0,total:1,href:earned||n===1||w.done.includes(n-1)?missionRoute(w,n):w.route});});
      rows.push({id:w.id+'-key',system:w.id,kind:'mastery',name:w.id==='skeletal'?'SKELETAL MASTER · Skeletal System':w.keyName+' Master',requirement:'Complete all '+w.titles.length+' missions and the final challenge to earn the '+w.keyName+' Key.',earned:w.key,current:w.done.length+Number(w.key),total:w.total,href:w.done.length===w.titles.length?finalRoute(w):w.route});
    }
    const casesDone=[0,1,2,3].filter(n=>has('case'+n)).length,dd=(window.InneruDetectiveCases||[]).filter(c=>has('detective2-'+c.id)).length;
    rows.push({id:'medical',system:'skeletal',kind:'investigation',name:'MEDICAL INVESTIGATOR',requirement:'Solve all four joint evidence files in skeletal mission 7.',earned:casesDone===4,current:casesDone,total:4,href:'#mission/7'},
      {id:'detective',system:'extra',kind:'investigation',name:'ALL-SYSTEMS INVESTIGATOR',requirement:'File six supported Body Detective investigations.',earned:dd===6,current:dd,total:6,href:'#detective'},
      {id:'connection',system:'extra',kind:'connection',name:'SYSTEM THINKER',requirement:'Complete the six matches, predictions and reviewed reflection in System Connections.',earned:has('connection'),current:has('connection')?1:0,total:1,href:'#connect'},
      {id:'capstone',system:'extra',kind:'final',name:'WHOLE-BODY EXPLORER',requirement:'Earn six System Keys, complete six final decisions and review your final explanation.',earned:!!profile.capstone?.done,current:profile.capstone?.done?7:Object.values(profile.capstone?.stations||{}).filter(Boolean).length,total:7,href:'#final'});
    return rows;
  }
  function snapshot(profile=state){
    const ws=worlds.map(w=>readWorld(w,profile)),badges=achievements(ws,profile),book=profile.learning?.version===1?profile.learning:null;
    const entries=array(book?.entries).filter(r=>typeof r.id==='string'&&Number.isFinite(r.xp)&&r.xp>=0).map(r=>({...describe(r.id),...r}));
    const tracked=entries.reduce((sum,r)=>sum+r.xp,0),xp=money(profile.xp),earlier=Math.max(0,xp-tracked);
    const historical=array(profile.rewards).filter(id=>!entries.some(r=>r.id===id)).map(id=>({...describe(id),xp:null,at:null}));
    const milestones=ws.flatMap(w=>w.done.filter(n=>![...entries,...historical].some(r=>r.system===w.id&&r.kind==='mission'&&r.mission===n)).map(n=>({id:'completed-'+w.id+'-'+n,system:w.id,kind:'mission',mission:n,label:'Mission completed · '+w.titles[n-1],href:missionRoute(w,n),xp:0,at:book?.completed?.[w.id+'-mission-'+n]||null})));
    const earned=badges.filter(b=>b.earned).sort((a,b)=>(book?.completed?.['badge:'+b.id]||'').localeCompare(book?.completed?.['badge:'+a.id]||''));
    const recommended=ws.filter(w=>!w.key&&(w.percent>0||w.steps.length>0)).sort((a,b)=>b.percent-a.percent)[0]||ws.find(w=>w.id==='skeletal'&&!w.key)||ws.find(w=>!w.key)||ws[1];
    return {worlds:ws,badges,earned,xp,entries,historical,milestones,earlier,tracked,missions:ws.reduce((s,w)=>s+w.done.length,0),missionTotal:ws.reduce((s,w)=>s+w.titles.length,0),keys:ws.filter(w=>w.key).length,completed:ws.reduce((s,w)=>s+w.completed,0),total:ws.reduce((s,w)=>s+w.total,0),tasks:new Set(array(profile.rewards)).size,percent:Math.round(ws.reduce((s,w)=>s+w.completed,0)/ws.reduce((s,w)=>s+w.total,0)*100),recommended,book};
  }
  const completedIDs=()=>{const p=snapshot();return p.worlds.flatMap(w=>[...w.done.map(n=>w.id+'-mission-'+n),...(w.key?[w.id+'-key']:[])]).concat(p.earned.map(b=>'badge:'+b.id));};
  let seen={ref:state,xp:money(state.xp),rewards:new Set(array(state.rewards)),completed:new Set(completedIDs())},pending=new Map(),queued=false,unlock=[];
  const ensureBook=()=>{if(state.learning?.version!==1)state.learning={version:1,entries:[],completed:{}};state.learning.entries=array(state.learning.entries);state.learning.completed||={};return state.learning;};
  const oldSave=save,oldReward=reward;
  function observe(){
    if(seen.ref!==state){seen={ref:state,xp:money(state.xp),rewards:new Set(array(state.rewards)),completed:new Set(completedIDs())};pending.clear();return;}
    const added=array(state.rewards).filter(id=>!seen.rewards.has(id)),newCompleted=completedIDs().filter(id=>!seen.completed.has(id));
    if(added.length||newCompleted.length){const book=ensureBook(),at=new Date().toISOString();let delta=Math.max(0,money(state.xp)-seen.xp);
      added.forEach((id,i)=>{const amount=Math.min(delta,pending.get(id)??(added.length===1?delta:0));if(!book.entries.some(r=>r.id===id))book.entries.push({id,xp:amount,at});delta-=amount;});
      newCompleted.forEach(id=>{book.completed[id]??=at;if(id.startsWith('badge:'))unlock.push(id.slice(6));});
    }
    seen={ref:state,xp:money(state.xp),rewards:new Set(array(state.rewards)),completed:new Set(completedIDs())};pending.clear();
  }
  save=function(){if(preview())return;observe();const result=oldSave.apply(this,arguments);if(!queued){queued=true;queueMicrotask(()=>{queued=false;document.dispatchEvent(new CustomEvent('inneru-progress',{detail:{unlocked:[...new Set(unlock)]}}));if(unlock.length){const p=snapshot(),names=p.badges.filter(b=>unlock.includes(b.id)).map(b=>b.name);if(names.length)toast('Achievement earned · '+names.slice(0,2).join(' + '));unlock=[];}});}return result;};
  reward=function(id,xp){
    if(preview()||typeof id!=='string'||!Number.isFinite(xp)||xp<0||has(id))return;
    const info=describe(id),legacy=state.learning?.legacyCompleted;
    if(legacy?.[info.system]?.includes(info.mission)&&info.mission>0)return;
    if(state.learning?.legacyFinals?.[info.system]&&info.mission===0&&['final','decision'].includes(info.kind))return;
    pending.set(id,xp);return oldReward(id,xp);
  };
  window.InneruLearning={worlds,snapshot,describe,missionRoute,finalRoute,preview};
  // Preserve live lesson references while synchronising another tab's save.
  function mergeSaved(target,source){
    for(const key of Object.keys(target)){if(key in source)continue;const value=target[key];if(Array.isArray(value))value.splice(0);else if(value&&typeof value==='object')mergeSaved(value,{});else delete target[key];}
    for(const [key,value] of Object.entries(source)){if(['__proto__','constructor','prototype'].includes(key))continue;if(Array.isArray(value)){if(Array.isArray(target[key]))target[key].splice(0,target[key].length,...value);else target[key]=[...value];}else if(value&&typeof value==='object'){if(!target[key]||typeof target[key]!=='object'||Array.isArray(target[key]))target[key]={};mergeSaved(target[key],value);}else target[key]=value;}
  }
  window.addEventListener('storage',event=>{if(event.key!=='bodyquest-v1')return;try{const next=event.newValue?JSON.parse(event.newValue):{name:'Explorer',xp:0,done:[],rewards:[],weak:[],level:'Explorer',motion:false};if(!Array.isArray(next.done)||!Array.isArray(next.rewards))return;mergeSaved(state,{name:'Explorer',xp:0,weak:[],level:'Explorer',motion:false,...next});seen={ref:state,xp:money(state.xp),rewards:new Set(array(state.rewards)),completed:new Set(completedIDs())};pending.clear();document.dispatchEvent(new CustomEvent('inneru-progress',{detail:{external:true}}));}catch{ /* Ignore malformed external updates. */ }});
})();
