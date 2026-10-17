/* Submitted learning evidence. Browsing and preview never create a record. */
(() => {
  'use strict';
  const LIMIT = 600, HISTORY = 4;
  const text = (v,max=6000) => typeof v==='string' ? v.slice(0,max) : '';
  const stamp = v => typeof v==='string' && Number.isFinite(Date.parse(v)) ? v : null;
  const isPreview = () => new URLSearchParams(location.hash.split('?')[1]||'').get('preview')==='1';
  let queued = false, pendingState = null;
  function normalise(input) {
    if(!input || input.version!==1 || !Array.isArray(input.responses) || input.responses.length>LIMIT)return null;
    const seen = new Set(), responses=[];
    for(const r of input.responses){
      if(!r || typeof r.id!=='string' || !r.id || ['__proto__','constructor','prototype'].includes(r.id) || r.id.length>180 || seen.has(r.id) || !stamp(r.at))continue;
      seen.add(r.id);
      const clean={id:r.id,system:text(r.system,40)||'extra',mission:Number.isInteger(r.mission)?Math.max(0,Math.min(99,r.mission)):0,kind:text(r.kind,40)||'response',title:text(r.title,200),prompt:text(r.prompt,4000),answer:text(r.answer,20000),expected:text(r.expected,6000),feedback:text(r.feedback,4000),correct:typeof r.correct==='boolean'?r.correct:null,at:r.at,attempts:Math.max(1,Math.min(100000,Number(r.attempts)||1)),history:[]};
      if(Array.isArray(r.history))clean.history=r.history.slice(-HISTORY).filter(h=>h&&stamp(h.at)).map(h=>({answer:text(h.answer,20000),correct:typeof h.correct==='boolean'?h.correct:null,at:h.at}));
      responses.push(clean);
    }
    return {version:1,responses};
  }
  function identity(profile=state){
    if(!/^[a-zA-Z0-9_-]{8,80}$/.test(profile.learnerId||''))profile.learnerId=crypto.randomUUID?crypto.randomUUID():'learner-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
    return profile.learnerId;
  }
  function record(item){
    if(isPreview() || !item || typeof item.id!=='string' || !item.id || item.id.length>180)return;
    identity();
    if(state.assessment?.version!==1 || !Array.isArray(state.assessment.responses))state.assessment={version:1,responses:[]};
    const rows=state.assessment.responses,old=rows.find(r=>r.id===item.id),at=new Date().toISOString();
    const row=normalise({version:1,responses:[{...item,at,attempts:(old?.attempts||0)+1,history:old?[...(old.history||[]),{answer:old.answer,correct:old.correct,at:old.at}].slice(-HISTORY):[]}]}).responses[0];
    if(!row)return;
    if(old)rows.splice(rows.indexOf(old),1);
    rows.push(row);
    if(rows.length>LIMIT)rows.splice(0,rows.length-LIMIT);
    pendingState=state;
    if(!queued){queued=true;queueMicrotask(()=>{queued=false;if(state===pendingState&&!isPreview())save();pendingState=null;});}
  }
  function choiceText(element){const copy=element.cloneNode(true);copy.querySelectorAll('[aria-hidden="true"]').forEach(node=>node.remove());return copy.textContent.trim();}
  const systemForRoute=()=>({mission:'skeletal',world:'skeletal',muscle:'muscle',integumentary:'integumentary',respiratory:'respiratory',circulatory:'circ',excretory:'excretory',review:'extra',connect:'extra',final:'extra',detective:'extra',daily:'extra'})[location.hash.slice(1).split(/[/?]/)[0]];
  function submission(form){
    const system=systemForRoute();if(!system||isPreview()||!form.id)return;
    const answers=[...form.querySelectorAll('input:not([type=hidden]):not([type=button]):not([type=submit]),select,textarea')].filter(e=>!e.disabled&&!['password','email','file'].includes(e.type)).map(el=>{
      if(['checkbox','radio'].includes(el.type)&&!el.checked)return null;
      const label=el.labels?.[0]?.textContent?.trim()||el.getAttribute('aria-label')||el.name||el.id;
      const value=el.tagName==='SELECT'?el.selectedOptions[0]?.textContent:el.value;
      return value?.trim()?label+': '+value.trim():null;
    }).filter(Boolean);
    if(!answers.length)return;
    const title=form.querySelector('h2,h3,h4')?.textContent||form.closest('section')?.querySelector('h2,h3,h4')?.textContent||document.querySelector('main h1')?.textContent||'Activity submission';
    record({id:'form:'+location.hash.split('?')[0].slice(1)+':'+form.id,system,kind:'submission',title,prompt:title,answer:answers.join('\n'),correct:null,feedback:'Activity submission recorded. This response needs teacher review; no automatic grade was inferred.'});
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button'),system=systemForRoute();
    if(!button||!system||isPreview()||button.disabled||button.closest('form'))return;
    if(button.matches('[data-skel-answer],[data-choice],[data-answer],[data-option],[data-sort-check],[data-sequence-check],[data-cap-choice],[data-dd-act-file],[data-rs-check],[data-confirm],[data-quest-action],[data-bt-predict]'))return;
    if(!/^(check|test|calculate|save|submit)\b/i.test(button.textContent.trim()))return;
    const scope=button.closest('[data-quest],.mq-panel,#skeletal-lab-body,.exc-lab,.resp-lab,.resp-activity,#circ-lab,.activity');
    if(!scope)return;
    const values=[...scope.querySelectorAll('input,select,textarea')].filter(el=>!el.disabled&&!['hidden','file','password','email','button','submit'].includes(el.type)).map(el=>{
      if(['checkbox','radio'].includes(el.type)&&!el.checked)return null;
      const value=el.tagName==='SELECT'?el.selectedOptions[0]?.textContent:el.value;
      const label=el.labels?.[0]?.textContent?.trim()||el.getAttribute('aria-label')||el.name||el.id;
      return value?.trim()?label+': '+value.trim():null;
    }).filter(Boolean);
    const choices=[...scope.querySelectorAll('button[aria-pressed="true"]')].map(el=>el.textContent.trim()).filter(Boolean);
    if(choices.length)values.push('Selected: '+choices.join(' · '));
    if(!values.length)return;
    const prompt=scope.querySelector('h3,h4,h2')?.textContent||button.textContent.trim();
    let hash=2166136261;for(const c of prompt)hash=Math.imul(hash^c.charCodeAt(0),16777619);
    record({id:'activity:'+location.hash.split('?')[0].slice(1)+':'+(button.id||scope.id||'check')+':'+(hash>>>0).toString(36),system,kind:'submission',title:prompt,prompt,answer:values.join('\n'),correct:null,feedback:'Activity submission captured. A teacher can review the recorded settings or written response; no automatic grade was inferred.'});
  },true);
  document.addEventListener('submit',event=>{if(event.target instanceof HTMLFormElement)submission(event.target);},true);
  window.InneruEvidence={record,normalise,identity,isPreview,choiceText};
})();
