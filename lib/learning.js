/* Validate learning snapshots; passwords, auth metadata and roles are never imported. */
const ALLOWED=new Set(['name','level','motion','done','rewards','weak','integumentary','muscle','respiratory','circ','excretory','capstone','learning','assessment','review','habit','glossary','learnerId']);
function clean(value,depth=0){
 if(depth>24)throw new Error('The learning record is too deeply nested.');
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='number'){if(!Number.isFinite(value))throw new Error('Invalid learning number.');return value;}
 if(typeof value==='string'){if(value.length>20000)throw new Error('A learning response is too long.');return value;}
 if(Array.isArray(value)){if(value.length>10000)throw new Error('Too many learning items.');return value.map(v=>clean(v,depth+1));}
 if(typeof value==='object'){const out=Object.create(null);for(const [k,v] of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(k))throw new Error('Invalid learning field.');out[k]=clean(v,depth+1);}return out;}
 throw new Error('Invalid learning value.');
}
function snapshot(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||!Array.isArray(input.done)||!Array.isArray(input.rewards))throw new Error('The learning record is incomplete.');
 const out={};for(const [k,v] of Object.entries(input))if(ALLOWED.has(k))out[k]=clean(v);
 if(out.rewards.some(id=>typeof id!=='string'||id.length>100)||out.done.some(n=>!Number.isInteger(n)||n<1||n>8))throw new Error('Invalid task completion.');
 out.rewards=[...new Set(out.rewards)];out.name=String(out.name||'Explorer').trim().slice(0,24);out.motion=!!out.motion;
 if(!['Explorer','Challenger','Master'].includes(out.level))out.level='Explorer';
 if(out.assessment&&(!Array.isArray(out.assessment.responses)||out.assessment.responses.length>600))throw new Error('Invalid submitted responses.');
 return out;
}
module.exports={snapshot};
