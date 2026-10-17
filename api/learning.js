/* Account-bound database gateway. Supabase RLS/RPCs enforce every read and write. */
const {config,origin,session,body,answer,AuthError}=require('../lib/auth.js').shared;
const {snapshot}=require('../lib/learning.js');
async function rpc(cfg,token,name,args={}){
 let response;try{response=await fetch(cfg.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:cfg.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});}catch{throw new AuthError('Cloud learning could not be reached. Your work is still saved on this device.',503);}
 let data;try{data=await response.json();}catch{data=null;}
 if(!response.ok){
  if(['PGRST202','42P01','42883'].includes(data?.code))throw new AuthError('The learning database is not installed yet. Ask the site owner to run the InnerU Supabase migration.',503);
  if(data?.message==='revision_conflict')throw new AuthError('This account has newer work on another device. Choose which saved version to use.',409);
  if(data?.code==='42501')throw new AuthError('This account is not authorized for that classroom action.',403);
  if(data?.code==='22023')throw new AuthError('The classroom code or learning record is invalid.',400);
  throw new AuthError('Cloud learning could not be saved. Your local work has been kept. Please try again.',response.status>=500?503:400);
 }
 return data;
}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store, private');res.setHeader('Vary','Cookie, Origin');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(!['GET','POST'].includes(req.method))return answer(res,405,{error:'Method not allowed.'});
  const action=new URL(req.url,'http://local').searchParams.get('action')||'state';
  if((['state','classroom'].includes(action))!==(req.method==='GET'))return answer(res,405,{error:'Method not allowed.'});
  if(req.method==='POST'&&((req.headers.origin&&req.headers.origin!==origin(req))||req.headers['sec-fetch-site']==='cross-site'))throw new AuthError('Open this action from InnerU.',403);
  const cfg=config();if(!cfg)throw new AuthError('The Supabase account service is not connected in Vercel.',503);
  const active=await session(req,res,cfg);if(!active)throw new AuthError('Sign in to save learning to your account.',401);
  const data=req.method==='POST'?await body(req,3000000):{};
  let result;
  if(action==='state')result=await rpc(cfg,active.token,'inneru_state');
  else if(action==='save'){
   if(!Number.isSafeInteger(data.revision)||data.revision<0||!/^[-a-f0-9]{36}$/i.test(data.requestId||''))throw new AuthError('The learning save request is invalid.');
   let value;try{value=snapshot(data.snapshot);}catch(error){throw new AuthError(error.message);}
   result=await rpc(cfg,active.token,'inneru_save',{p_snapshot:value,p_revision:data.revision,p_request_id:data.requestId});
  }else if(action==='classroom')result=await rpc(cfg,active.token,'inneru_classroom');
  else if(action==='create-class')result=await rpc(cfg,active.token,'inneru_create_class',{p_name:String(data.name||'').trim().slice(0,80)});
  else if(action==='join-class')result=await rpc(cfg,active.token,'inneru_join_class',{p_code:String(data.code||'').trim().toLowerCase()});
  else if(action==='feedback')result=await rpc(cfg,active.token,'inneru_feedback',{p_student:data.studentId,p_response:String(data.responseId||'').slice(0,180),p_note:String(data.note||'').slice(0,6000),p_reviewed:!!data.reviewed,p_submission_at:data.submissionAt});
  else throw new AuthError('Learning action not found.',404);
  answer(res,200,result);
 }catch(error){answer(res,error.status||500,{error:error instanceof AuthError?error.message:'Cloud learning is unavailable. Your local work has been kept.'});}
};
