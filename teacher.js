/* Browser classroom records, progress-code compatibility and learner restore.
   The dashboard reads imported profiles without loading them into the learner.
   Full answers and teacher annotations are kept in IndexedDB. */
(() => {
  'use strict';

  const CLASS_KEY = 'inneru-class-v1';
  const UNDO_KEY = 'inneru-undo-v1';

  /* ---------------------------------------------------------------- codec */
  function checksum(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1296;
    return h.toString(36).padStart(2, '0');
  }
  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    return decodeURIComponent(escape(atob(padded)));
  }

  function summary(s) {
    const sc = k => (s[k] && typeof s[k] === 'object' ? s[k] : {});
    const count = a => (Array.isArray(a) ? a.length : 0);
    const keys = [
      (s.done || []).includes(8) ? 1 : 0,
      sc('integumentary').mastery ? 1 : 0,
      sc('respiratory').mastery ? 1 : 0,
      sc('excretory').mastery ? 1 : 0,
      sc('circ').mastery ? 1 : 0,
      (sc('muscle').done || []).includes(8) ? 1 : 0
    ];
    const worlds = [
      count(sc('integumentary').done),
      count((s.done || []).filter(n => n < 8)),
      count((sc('muscle').done || []).filter(n => n < 8)),
      count(sc('respiratory').done),
      count(sc('circ').done),
      count(sc('excretory').done)
    ];
    return {
      v: 1,
      id: typeof s.learnerId==='string' ? s.learnerId : undefined,
      at: new Date().toISOString(),
      a: window.InneruEvidence?.normalise(s.assessment) || undefined,
      u: {skeletal:s.weak,...Object.fromEntries(['integumentary','muscle','respiratory','circ','excretory'].map(id=>[id,sc(id).weak]))},
      n: String(s.name || 'Explorer').slice(0, 24),
      x: Math.max(0, Math.round(Number(s.xp) || 0)),
      k: keys.join(''),
      w: worlds.join(''),
      c: s.capstone && s.capstone.done ? 1 : 0,
      d: ['touch','spine','wave','air','signal','sample'].map(id => Array.isArray(s.rewards) && s.rewards.includes('detective2-' + id) ? '1' : '0').join(''),
      r: Array.isArray(s.rewards) ? [...new Set(s.rewards.filter(id => typeof id === 'string' && id.length <= 100))] : [],
      l: s.learning?.version === 1 ? s.learning : undefined,
      t: {
        skeletal: { done: s.done },
        ...Object.fromEntries(['integumentary','muscle','respiratory','circ','excretory'].map(id => {
          const p = sc(id);
          return [id, { done: p.done, steps: p.steps, tasks: p.tasks, xp: p.xp, boss: p.boss }];
        })),
        capstone: s.capstone ? { stations: s.capstone.stations, response: s.capstone.response, rubric: s.capstone.rubric, date: s.capstone.date } : undefined
      }
    };
  }

  function encode(s) {
    if(s===state&&!s.learnerId){window.InneruEvidence?.identity(s);save();}
    const json = JSON.stringify(summary(s));
    return 'INNERU1-' + b64encode(json) + '-' + checksum(json);
  }

  function decode(code) {
    const raw = String(code || '').trim().replace(/\s+/g, '');
    if(raw.length>2500000)return {error:'This progress code is too large to import safely.'};
    if (!/^INNERU1-/.test(raw)) return { error: 'This does not look like an InnerU progress code (it should start with INNERU1-).' };
    const parts = raw.split('-');
    if (parts.length < 3) return { error: 'The code is incomplete.' };
    const sum = parts.pop();
    const body = parts.slice(1).join('-');
    let json;
    try { json = b64decode(body); } catch (e) { return { error: 'The code is damaged and could not be read.' }; }
    if (checksum(json) !== sum) return { error: 'The code failed its checksum — one character is probably wrong.' };
    let payload;
    try { payload = JSON.parse(json); } catch (e) { return { error: 'The code content is unreadable.' }; }
    if (!payload || payload.v !== 1 || typeof payload.k !== 'string' || !/^[01]{6}$/.test(payload.k) || !Number.isFinite(Number(payload.x)) || Number(payload.x)<0) return { error: 'This code version is not supported.' };
    payload.w = String(payload.w || '000000');
    if(!/^[0-9]{6}$/.test(payload.w))return {error:'This code has an invalid mission summary.'};
    if(payload.id!==undefined&&!/^[a-zA-Z0-9_-]{8,80}$/.test(payload.id))return {error:'This code has an invalid learner ID.'};
    if(payload.a && !window.InneruEvidence?.normalise(payload.a))return {error:'The answer record is not supported.'};
    payload.n=String(payload.n||'Explorer').slice(0,24);
    return { payload };
  }

  function profile(p,preferences={}) {
    const keys = p.k.split('');
    const w = p.w.split('').map((n,i) => Math.min([6,7,7,6,7,6][i], Math.max(0, Number(n) || 0)));
    const range = n => Array.from({ length: n }, (_, i) => i + 1);
    const rewards = [];
    const next = {
      name: p.n || 'Explorer',
      xp: Number.isFinite(Number(p.x)) ? Math.max(0, Math.round(Number(p.x))) : 0,
      done: range(w[1]),
      rewards,
      weak: [],
      level: preferences.level || 'Explorer',
      motion: !!preferences.motion
    };
    if (keys[0] === '1') next.done.push(8);
    next.integumentary = { done: range(w[0]), steps: {}, mastery: keys[1] === '1', weak: [] };
    next.respiratory = { done: range(w[3]), steps: {}, mastery: keys[2] === '1', weak: [] };
    next.excretory = { done: range(w[5]), steps: {}, mastery: keys[3] === '1', weak: [] };
    next.circ = { done: range(w[4]), steps: [], mastery: keys[4] === '1', boss: false, heartExplored: [] };
    next.muscle = { done: range(w[2]), tasks: {}, weak: [], xp: 0 };
    if (keys[5] === '1') next.muscle.done.push(8);
    next.capstone = p.c ? { done: true, date: new Date().toISOString().slice(0, 10), stations: {}, response: '', rubric: [], tries: {} } : { done: false, date: '', stations: {}, response: '', rubric: [], tries: {} };
    /* keep the XP ledger honest so completed work is not paid for twice */
    for (let i = 1; i <= w[1]; i++) rewards.push('activity' + i);
    for (let i = 1; i <= w[0]; i++) rewards.push('integ-mission-' + i);
    for (let i = 1; i <= w[3]; i++) rewards.push('resp-mission-' + i);
    for (let i = 1; i <= w[5]; i++) rewards.push('exc-mission-' + i);
    for (let i = 1; i <= w[4]; i++) rewards.push('circ-mission-' + i);
    for (let i = 1; i <= w[2]; i++) rewards.push('muscle:complete-' + i);
    if (keys[0] === '1') rewards.push('boss');
    if (keys[1] === '1') rewards.push('integ-key');
    if (keys[2] === '1') rewards.push('resp-key');
    if (keys[3] === '1') rewards.push('exc-key');
    if (keys[4] === '1') rewards.push('circ-mastery');
    if (keys[5] === '1') rewards.push('muscle:complete-8');
    if (p.c) rewards.push('capstone');
    if (typeof p.d === 'string' && /^[01]{6}$/.test(p.d)) {
      ['touch','spine','wave','air','signal','sample'].forEach((id, i) => {
        if (p.d[i] === '1') rewards.push('detective2-' + id);
      });
    }
    if (Array.isArray(p.r) && p.r.length <= 10000 && p.r.every(id => typeof id === 'string' && id.length <= 100)) {
      rewards.splice(0, rewards.length, ...new Set(p.r));
    } else {
      /* Older codes only described mission counts. Prevent those completed
         missions from paying out again when their missing steps are replayed. */
      next.learning = { version: 1, entries: [], completed: {}, legacyCompleted: {
        skeletal: [...next.done], integumentary: [...next.integumentary.done],
        muscle: [...next.muscle.done], respiratory: [...next.respiratory.done],
        circ: [...next.circ.done], excretory: [...next.excretory.done]
      }, legacyFinals: { skeletal: keys[0] === '1', integumentary: keys[1] === '1', respiratory: keys[2] === '1', excretory: keys[3] === '1', circ: keys[4] === '1', muscle: keys[5] === '1', extra: !!p.c } };
    }
    if (p.l?.version === 1 && Array.isArray(p.l.entries) && p.l.entries.length <= 10000) {
      const entries = p.l.entries.filter(row => row && rewards.includes(row.id) && Number.isFinite(row.xp) && row.xp >= 0 && typeof row.at === 'string' && Number.isFinite(Date.parse(row.at)));
      const unique = entries.filter((row, i) => entries.findIndex(r => r.id === row.id) === i).map(({id, xp, at}) => ({id, xp, at}));
      if (unique.reduce((sum, row) => sum + row.xp, 0) <= next.xp) {
        const completed = Object.fromEntries(Object.entries(p.l.completed || {}).filter(([id, at]) => id.length <= 100 && typeof at === 'string' && Number.isFinite(Date.parse(at))));
        next.learning = { ...(next.learning || {}), version: 1, entries: unique, completed };
        if (p.l.legacyCompleted && typeof p.l.legacyCompleted === 'object') next.learning.legacyCompleted = Object.fromEntries(['skeletal','integumentary','muscle','respiratory','circ','excretory'].map(id => [id, Array.isArray(p.l.legacyCompleted[id]) ? p.l.legacyCompleted[id].filter(n => Number.isInteger(n) && n >= 1 && n <= 8) : []]));
        if (p.l.legacyFinals && typeof p.l.legacyFinals === 'object') next.learning.legacyFinals = Object.fromEntries(['skeletal','integumentary','muscle','respiratory','circ','excretory','extra'].map(id => [id, p.l.legacyFinals[id] === true]));
      }
    }
    if (p.t && typeof p.t === 'object') {
      const numbers = (values, max) => Array.isArray(values) ? [...new Set(values.filter(n => Number.isInteger(n) && n >= 1 && n <= max))] : null;
      const bits = value => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([id, flag]) => id.length <= 100 && flag === true)) : {};
      const skeletal = numbers(p.t.skeletal?.done, 8);
      if (skeletal) next.done = skeletal;
      for (const [id, max] of [['integumentary',6],['muscle',8],['respiratory',6],['circ',7],['excretory',6]]) {
        const saved = p.t[id];
        if (!saved || typeof saved !== 'object') continue;
        const done = numbers(saved.done, max);
        if (done) next[id].done = done;
        if (id === 'muscle') {
          next.muscle.tasks = bits(saved.tasks);
          next.muscle.xp = Number.isFinite(saved.xp) ? Math.max(0, Math.min(next.xp, saved.xp)) : 0;
        } else if (id === 'circ') {
          next.circ.steps = Array.isArray(saved.steps) ? [...new Set(saved.steps.filter(id => typeof id === 'string' && id.length <= 100))] : [];
          next.circ.boss = !!saved.boss;
        } else next[id].steps = bits(saved.steps);
      }
      if (p.t.capstone && typeof p.t.capstone === 'object') {
        next.capstone.stations = Object.fromEntries(Object.entries(bits(p.t.capstone.stations)).filter(([id]) => /^s[0-5]$/.test(id)));
        next.capstone.response = typeof p.t.capstone.response === 'string' ? p.t.capstone.response.slice(0, 20000) : '';
        next.capstone.rubric = Array.isArray(p.t.capstone.rubric) ? [...new Set(p.t.capstone.rubric.filter(n => Number.isInteger(n) && n >= 0 && n < 5))] : [];
        if (/^\d{4}-\d{2}-\d{2}$/.test(p.t.capstone.date || '')) next.capstone.date = p.t.capstone.date;
      }
    }
    if(p.id)next.learnerId=p.id;
    const assessment=window.InneruEvidence?.normalise(p.a);
    if(assessment)next.assessment=assessment;
    if(p.u&&typeof p.u==='object'){
      const weak=id=>Array.isArray(p.u[id])?p.u[id].filter(v=>typeof v==='string'&&v.length<=100&&(id!=='skeletal'||/^[1-8]-[0-2]$/.test(v))).slice(0,300):[];
      next.weak=weak('skeletal');
      for(const id of ['integumentary','muscle','respiratory','circ','excretory'])next[id].weak=weak(id);
    }
    return next;
  }
  function applyPayload(p){state=profile(p,state);save();}


  /* The class register uses IndexedDB: full answer records should not compete
     with the learner's small localStorage profile for the same quota. */
  const DB_NAME='inneru-classroom-v2';
  let classroomChannel=null;
  try{classroomChannel=new BroadcastChannel('inneru-classroom-updates');classroomChannel.onmessage=()=>document.dispatchEvent(new CustomEvent('inneru-classroom',{detail:{remote:true}}));}catch{}
  function changed(id){document.dispatchEvent(new CustomEvent('inneru-classroom',{detail:{id}}));classroomChannel?.postMessage({changed:true});}

  let connection=null,migration=null,connectionOwner=null;
  function database(){
    if(window.InneruAccess&&!InneruAccess.teacher(InneruAccess.user))return Promise.reject(new Error('Teacher account required to open classroom records.'));
    const owner=window.InneruAccess?.user?.id||'legacy';
    if(connectionOwner!==owner){connection=null;migration=null;connectionOwner=owner;}
    if(connection)return connection;
    connection=new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error('Classroom storage is unavailable in this browser.'));return;}
      const r=indexedDB.open(owner==='legacy'?DB_NAME:DB_NAME+':'+owner,1);
      r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore('students',{keyPath:'id'});db.createObjectStore('settings',{keyPath:'id'});};
      r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();connection=null;};resolve(r.result);};
      r.onerror=()=>{connection=null;reject(new Error('Classroom storage could not open. Existing learner progress is unchanged.'));};
      r.onblocked=()=>{connection=null;reject(new Error('Close older InnerU classroom tabs and try again.'));};
    });
    return connection;
  }
  async function request(store,mode,operation){
    const db=await database();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,mode);let value;
      const req=operation(tx.objectStore(store));
      req.onsuccess=()=>{value=req.result;};
      tx.oncomplete=()=>resolve(value);
      tx.onerror=tx.onabort=()=>reject(new Error('The classroom record could not be saved. Check available browser storage and try again.'));
    });
  }
  const uid=()=>crypto.randomUUID?crypto.randomUUID():'record-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  const date=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?value:null;
  async function migrate(){
    if(migration)return migration;
    migration=(async()=>{
      if(await request('settings','readonly',s=>s.get('legacy-v1')))return;
      let old=[];try{const raw=JSON.parse(localStorage.getItem(window.InneruAccess?.user?CLASS_KEY+':'+InneruAccess.user.id:CLASS_KEY)||'[]');if(Array.isArray(raw))old=raw;}catch{}
      for(const [i,row] of old.entries()){
        if(!row||typeof row.name!=='string'||!/^[01]{6}$/.test(row.k||'')||!/^\d{6}$/.test(row.w||''))continue;
        const id='legacy-'+checksum(JSON.stringify(row))+'-'+i;
        if(await request('students','readonly',s=>s.get(id)))continue;
        const payload={v:1,n:row.name.slice(0,24),x:Math.max(0,Number(row.xp)||0),k:row.k,w:row.w,c:row.c?1:0};
        await request('students','readwrite',s=>s.put({id,name:payload.n,group:'',payload,importedAt:date(row.savedAt)||new Date().toISOString(),notes:'',feedback:{},legacy:true}));
      }
      await request('settings','readwrite',s=>s.put({id:'legacy-v1',done:true}));
    })().catch(error=>{migration=null;throw error;});
    return migration;
  }
  async function list(){await migrate();return request('students','readonly',s=>s.getAll());}
  async function get(id){await migrate();return request('students','readonly',s=>s.get(id));}
  function validatePayload(payload){
    try{const json=JSON.stringify(payload);return decode('INNERU1-'+b64encode(json)+'-'+checksum(json));}catch{return {error:'This student record is unreadable.'};}
  }
  async function upsert(payload,options={}){
    const valid=validatePayload(payload);if(valid.error)throw new Error(valid.error);
    payload=valid.payload;
    const rows=await list();
    let existing=payload.id?rows.find(r=>r.id===payload.id):options.targetId?rows.find(r=>r.id===options.targetId):rows.find(r=>JSON.stringify(r.payload)===JSON.stringify(payload));
    if(!payload.id&&!existing&&!options.separate){const candidates=rows.filter(r=>r.name===payload.n);if(candidates.length)return {conflict:candidates};}
    let id=existing?.id||payload.id;
    if(!id){
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
      id=options.separate?uid():'import-'+[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
    }
    const db=await database();
    const result=await new Promise((resolve,reject)=>{
      const tx=db.transaction('students','readwrite'),store=tx.objectStore('students'),req=store.get(id);let result;
      req.onsuccess=()=>{
        const latest=req.result;
        if(latest&&date(payload.at)&&date(latest.payload.at)&&Date.parse(payload.at)<Date.parse(latest.payload.at)){result={stale:true,record:latest};return;}
        const row={id,name:payload.n,group:latest?.group||String(options.group||'').slice(0,60),payload,importedAt:new Date().toISOString(),notes:latest?.notes||'',feedback:latest?.feedback||{},legacy:!payload.t};
        store.put(row);result={record:row,updated:!!latest};
      };
      tx.oncomplete=()=>resolve(result);
      tx.onerror=tx.onabort=()=>reject(new Error('The student snapshot could not be saved. Please try again.'));
    });
    changed(id);
    return result;
  }

  async function edit(id,changes){
    const db=await database();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('students','readwrite'),store=tx.objectStore('students'),r=store.get(id);let row;
      r.onsuccess=()=>{row=r.result;if(!row){tx.abort();return;}if(typeof changes.group==='string')row.group=changes.group.slice(0,60);if(typeof changes.notes==='string')row.notes=changes.notes.slice(0,20000);if(changes.response){const {responseId,note,reviewed,at}=changes.response;row.feedback||={};if(['__proto__','constructor','prototype'].includes(responseId)){tx.abort();return;}row.feedback[responseId]={note:String(note||'').slice(0,6000),reviewedAt:reviewed?new Date().toISOString():null,submissionAt:at};}store.put(row);};
      tx.oncomplete=()=>{changed(id);resolve(row);};
      tx.onerror=tx.onabort=()=>reject(new Error('The teacher note could not be saved. Please try again.'));
    });
  }
  async function remove(id){await request('students','readwrite',s=>s.delete(id));changed(id);}
  async function clear(){await request('students','readwrite',s=>s.clear());changed();}
  function model(record){
    const payload=record.payload,p=profile(payload),legacy=!payload.t;
    if(legacy){
      p.done=payload.k[0]==='1'?[8]:[];p.muscle.done=payload.k[5]==='1'?[8]:[];
      for(const id of ['integumentary','respiratory','circ','excretory'])p[id].done=[];
    }
    const result=window.InneruLearning.snapshot(p);
    if(legacy){
      const counts=payload.w.split('').map(Number),map={integumentary:0,skeletal:1,muscle:2,respiratory:3,circ:4,excretory:5};
      result.worlds=result.worlds.map(w=>{const count=Math.min(w.titles.length,counts[map[w.id]]||0);return {...w,reportedCount:count,percent:Math.round((count+Number(w.key))/w.total*100),details:false};});
      result.missions=result.worlds.reduce((n,w)=>n+w.reportedCount,0);result.completed=result.missions+result.keys;result.percent=Math.round(result.completed/result.total*100);
    }
    result.summaryOnly=legacy;
    result.responses=window.InneruEvidence.normalise(payload.a)?.responses||[];
    result.needsReview=result.responses.filter(r=>r.correct!==true&&!(record.feedback?.[r.id]?.reviewedAt&&Date.parse(record.feedback[r.id].submissionAt)===Date.parse(r.at))).length;
    result.graded=result.responses.filter(r=>typeof r.correct==='boolean');
    result.accuracy=result.graded.length?Math.round(result.graded.filter(r=>r.correct).length/result.graded.length*100):null;
    result.lastActivity=[...result.responses.map(r=>r.at),...result.entries.map(r=>r.at)].filter(date).sort().at(-1)||null;
    return result;
  }
  function current(){return decode(encode(state)).payload;}
  function backup(){
    const raw=localStorage.getItem('bodyquest-v1')||JSON.stringify(state);
    localStorage.setItem(UNDO_KEY,JSON.stringify({at:Date.now(),data:raw}));
  }
  function resetCurrent(){backup();state={name:'Explorer',xp:0,done:[],rewards:[],weak:[],level:state.level||'Explorer',motion:!!state.motion};save();}
  function undoAvailable(){try{const s=JSON.parse(localStorage.getItem(UNDO_KEY)||'null');return !!s?.data&&Date.now()-s.at<600000;}catch{return false;}}
  function undo(){
    const snap=JSON.parse(localStorage.getItem(UNDO_KEY)||'null');if(!snap?.data||Date.now()-snap.at>=600000)throw new Error('The 10-minute restore window has ended.');
    const next=JSON.parse(snap.data);if(state.authUserId&&next.authUserId!==state.authUserId)throw new Error('That saved learner belongs to a different account.');if(!Array.isArray(next.done)||!Array.isArray(next.rewards))throw new Error('The saved learner record is unreadable.');
    localStorage.setItem('bodyquest-v1',snap.data);state=next;save();localStorage.removeItem(UNDO_KEY);
  }
  function restore(payload){backup();applyPayload(payload);}
  async function exportBackup(){return {format:'InnerU classroom',version:2,exportedAt:new Date().toISOString(),students:await list()};}
  async function importBackup(data){
    if(data?.format!=='InnerU classroom'||data.version!==2||!Array.isArray(data.students)||data.students.length>1000)throw new Error('Choose an InnerU classroom backup file.');
    const clean=[];
    for(const row of data.students){
      if(!row||!/^[-_a-zA-Z0-9]{4,100}$/.test(row.id||''))throw new Error('A classroom record has an invalid ID.');
      const valid=validatePayload(row.payload);if(valid.error)throw new Error(valid.error);
      const feedback=Object.create(null);
      for(const response of window.InneruEvidence.normalise(valid.payload.a)?.responses||[]){const f=row.feedback?.[response.id];if(f&&typeof f==='object')feedback[response.id]={note:String(f.note||'').slice(0,6000),reviewedAt:date(f.reviewedAt),submissionAt:date(f.submissionAt)};}
      clean.push({id:row.id,name:valid.payload.n,group:String(row.group||'').slice(0,60),payload:valid.payload,importedAt:date(row.importedAt)||new Date().toISOString(),notes:String(row.notes||'').slice(0,20000),feedback,legacy:!valid.payload.t});
    }
    await migrate();
    const existing=await list(),fresh=clean.filter(r=>{const old=existing.find(s=>s.id===r.id);return !old||!date(old.payload.at)||!date(r.payload.at)||Date.parse(r.payload.at)>=Date.parse(old.payload.at);});
    const db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction('students','readwrite'),store=tx.objectStore('students');fresh.forEach(r=>store.put(r));tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(new Error('The backup could not be imported. Existing class records are unchanged.'));});
    changed();return {saved:fresh.length,older:clean.length-fresh.length};
  }
  window.InneruTeacher={encode,decode,summary,profile,model,current,list,get,upsert,edit,remove,clear,restore,resetCurrent,undo,undoAvailable,exportBackup,importBackup};
  const priorRoute=route;window.removeEventListener('hashchange',priorRoute);
  route=function(){if(location.hash.slice(1).split(/[/?]/)[0]==='teacher'){document.title='InnerU · Teacher Dashboard';if(window.InneruTeacherDashboard)window.InneruTeacherDashboard.render();else layout('<div class="td-loading" role="status">Opening your classroom dashboard…</div>','teacher');return;}priorRoute();};
  window.addEventListener('hashchange',route);route();
})();
