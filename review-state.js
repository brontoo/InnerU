/* Existing recall data/scheduling service, shared with the learning plan. UI loads on #review. */
window.InneruReviewState=(()=>{
'use strict';

const DAY=86400000,INTERVALS=[0,1,3,7,16],e=esc;
const WORLDS=[
    {id:'integ',name:'Integumentary',specimen:'Skin',tag:'BODY SHIELD',image:'01-shield',href:'#integumentary',slice:'integumentary',note:'Protect. Sense. Repair.'},
    {id:'world',name:'Skeletal',specimen:'Bones',tag:'FRAMEWORK',image:'02-framework',href:'#world',slice:null,note:'Support. Move. Rebuild.'},
    {id:'muscle',name:'Muscular',specimen:'Muscles',tag:'POWER',image:'03-power',href:'#muscle',slice:'muscle',note:'Contract. Pull. Power.'},
    {id:'respiratory',name:'Respiratory',specimen:'Lungs',tag:'OXYGEN',image:'04-oxygen',href:'#respiratory',slice:'respiratory',note:'Ventilate. Exchange. Deliver.'},
    {id:'circ',name:'Circulatory',specimen:'Heart',tag:'TRANSPORT',image:'05-transport',href:'#circulatory',slice:'circ',note:'Pump. Carry. Connect.'},
    {id:'excretory',name:'Excretory',specimen:'Kidneys',tag:'BALANCE',image:'06-balance',href:'#excretory',slice:'excretory',note:'Filter. Recover. Balance.'}
  ];
const ITEMS=["integ","integ","integ","integ","integ","integ","integ","integ","integ","world","world","world","world","world","world","world","world","world","muscle","muscle","muscle","muscle","muscle","muscle","muscle","muscle","muscle","respiratory","respiratory","respiratory","respiratory","respiratory","respiratory","respiratory","respiratory","respiratory","circ","circ","circ","circ","circ","circ","circ","circ","circ","excretory","excretory","excretory","excretory","excretory","excretory","excretory","excretory","excretory"].map((world,i)=>({id:'r'+i,world}));
const byId=id=>ITEMS.find(i=>i.id===id),world=id=>WORLDS.find(w=>w.id===id),image=w=>'assets/home-expedition/'+w.image+'.webp';
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const localDay=(time=Date.now())=>{const d=new Date(time);return new Date(time-d.getTimezoneOffset()*60000).toISOString().slice(0,10);};
function data(){const r=state.review||{};return {items:r.items&&typeof r.items==='object'?r.items:{},answers:Math.max(0,Number(r.answers)||0),correct:Math.max(0,Number(r.correct)||0),sessions:Math.max(0,Number(r.sessions)||0),days:r.days&&typeof r.days==='object'?r.days:{}};}
const entry=id=>{const v=data().items[id];return v&&typeof v==='object'?v:null;};
const boxOf=id=>entry(id)?Math.min(4,Math.max(0,Math.floor(Number(entry(id).b)||0))):0;
const dueAt=id=>{const v=entry(id);if(!v)return 0;const t=Number(v.d)||((Number(v.t)||0)+INTERVALS[boxOf(id)]*DAY);return Number.isFinite(t)?t:0;};
const isNew=id=>!entry(id),isDue=(id,now=Date.now())=>!isNew(id)&&dueAt(id)<=now;
const dueLabel=time=>time<=Date.now()?'Ready now':new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(time));
function stats(){const r=data(),now=Date.now(),future=ITEMS.map(i=>dueAt(i.id)).filter(t=>t>now).sort((a,b)=>a-b),days=future.length?Math.max(1,Math.ceil((future[0]-now)/DAY)):0;return {pool:ITEMS.length,due:ITEMS.filter(i=>isDue(i.id,now)).length,fresh:ITEMS.filter(i=>isNew(i.id)).length,seen:ITEMS.filter(i=>!isNew(i.id)).length,accuracy:r.answers?Math.round(r.correct/r.answers*100):null,next:days===1?'tomorrow':days?'in '+days+' days':'nothing scheduled yet',nextAt:future[0]||null,...r};}
function flagged(){const rows=[];for(const w of WORLDS){const weak=w.slice?state[w.slice]?.weak:state.weak;for(const id of Array.isArray(weak)?weak:[]){const m=String(id).match(/^(?:m)?([1-8])(?:-|$)/);if(!m)continue;const n=+m[1],href=w.id==='world'?'#mission/'+n:w.id==='muscle'?'#muscle/mission/'+n:w.href+'/'+(w.id==='circ'?'':'mission/')+n;rows.push({world:w.id,label:w.name+' · mission '+n,href});}}return rows.filter((r,i)=>rows.findIndex(x=>x.href===r.href)===i);}
return {DAY,INTERVALS,e,WORLDS,ITEMS,byId,world,image,arrow,localDay,data,entry,boxOf,dueAt,isNew,isDue,dueLabel,stats,flagged};})();
window.inneruReviewStats=()=>{const s=InneruReviewState.stats();return {pool:s.pool,due:s.due,next:s.next};};
