/* Account-bound database gateway. Supabase RLS/RPCs enforce every read and write. */
const {config,origin,session,body,answer,AuthError,publicUser}=require('../lib/auth.js').shared;
const {snapshot}=require('../lib/learning.js');
async function rpc(cfg,token,name,args={}){
 let response;try{response=await fetch(cfg.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:cfg.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});}catch{throw new AuthError('Cloud learning could not be reached. Your work is still saved on this device.',503);}
 let data;try{data=await response.json();}catch{data=null;}
 if(!response.ok){
  if(data?.code==='42501'&&['teacher_locked','previous_required','class_required','teacher_preview_only'].includes(data.message))throw new AuthError({teacher_locked:'Your teacher has locked this mission.',previous_required:'Complete the previous mission first.',class_required:'Choose your school class before opening missions.',teacher_preview_only:'Only teachers can preview missions.'}[data.message],403);
  if(data?.code==='PGRST202'&&['inneru_mission_catalog','inneru_mission_controls','inneru_set_mission_control','inneru_authorize_mission'].includes(name))throw new AuthError('Mission access controls need a database update. Ask the site owner to run migration 007_mission_access.sql or the latest supabase/setup.sql.',503);
  if(['PGRST202','42P01','42883'].includes(data?.code))throw new AuthError(name==='inneru_select_student_class'?'Class assignments are not installed yet. Ask the site owner to run migration 005_student_classes.sql.':name==='inneru_request_teacher_access'?'The account-role update is not installed yet. Ask the site owner to run migration 004_roles_avatars.sql.':'The learning database is not installed yet. Ask the site owner to run the InnerU Supabase migration.',503);
  if(data?.message==='revision_conflict')throw new AuthError('This account has newer work on another device. Choose which saved version to use.',409);
  if(data?.code==='42501')throw new AuthError('This account is not authorized for that classroom action.',403);
  if(data?.code==='22023')throw new AuthError(name==='inneru_select_student_class'?'Select one of the six school classes.':'The classroom code or learning record is invalid.',400);
  throw new AuthError('Cloud learning could not be saved. Your local work has been kept. Please try again.',response.status>=500?503:400);
 }
 return data;
}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store, private');res.setHeader('Vary','Cookie, Origin');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(!['GET','POST'].includes(req.method))return answer(res,405,{error:'Method not allowed.'});
  const action=new URL(req.url,'http://local').searchParams.get('action')||'state';
  if((['state','classroom','mission-catalog','mission-controls'].includes(action))!==(req.method==='GET'))return answer(res,405,{error:'Method not allowed.'});
  if(req.method==='POST'&&((req.headers.origin&&req.headers.origin!==origin(req))||req.headers['sec-fetch-site']==='cross-site'))throw new AuthError('Open this action from InnerU.',403);
  const cfg=config();if(!cfg)throw new AuthError('The Supabase account service is not connected in Vercel.',503);
  const active=await session(req,res,cfg);if(!active)throw new AuthError('Sign in to save learning to your account.',401);
  if(['create-class','join-class'].includes(action))throw new AuthError('Classes are assigned automatically from the student’s school class selection. No class code is needed.',410);
  if(['save','select-class'].includes(action)){const user=await publicUser(active.user,cfg,active.token);if(user.role!=='student')throw new AuthError('This action belongs to a student account.',403);if(action!=='select-class'&&user.classSelectionRequired)throw new AuthError('Choose your school class at sign-in before saving learning.',403);}
  const data=req.method==='POST'?await body(req,3000000):{};
  let result;
  if(action==='state'){
   result=await rpc(cfg,active.token,'inneru_state');
   if(!Object.hasOwn(result?.profile||{},'classCode'))throw new AuthError('School class assignments need a database update. Ask the site owner to run the latest supabase/setup.sql in the Supabase SQL Editor. Your learning is safe on this device.',503);
  }
  else if(action==='save'){
   if(!Number.isSafeInteger(data.revision)||data.revision<0||!/^[-a-f0-9]{36}$/i.test(data.requestId||''))throw new AuthError('The learning save request is invalid.');
   let value;try{value=snapshot(data.snapshot);}catch(error){throw new AuthError(error.message);}
   result=await rpc(cfg,active.token,'inneru_save',{p_snapshot:value,p_revision:data.revision,p_request_id:data.requestId});
  }else if(action==='classroom'){
   result=await rpc(cfg,active.token,'inneru_classroom');
   if(result?.assignmentVersion!==6)throw new AuthError('Automatic teacher rosters need a database update. Ask the site owner to run the latest supabase/setup.sql in the Supabase SQL Editor.',503);
  }
  else if(action==='select-class'){
   if(!['10G1','10G2','10G3','10G4','10G5','10G6'].includes(data.classCode))throw new AuthError('Select one of the six school classes.');
   result=await rpc(cfg,active.token,'inneru_select_student_class',{p_code:data.classCode});
  }
  else if(action==='feedback')result=await rpc(cfg,active.token,'inneru_feedback',{p_student:data.studentId,p_response:String(data.responseId||'').slice(0,180),p_note:String(data.note||'').slice(0,6000),p_reviewed:!!data.reviewed,p_submission_at:data.submissionAt});
  else if(action==='mission-catalog')result=await rpc(cfg,active.token,'inneru_mission_catalog');
  else if(action==='mission-controls')result=await rpc(cfg,active.token,'inneru_mission_controls');
  else if(action==='set-mission-control'){
   if(typeof data.unlocked!=='boolean'||!Number.isInteger(data.number))throw new AuthError('Choose a valid mission setting.');
   result=await rpc(cfg,active.token,'inneru_set_mission_control',{p_class:data.classCode,p_system:data.system,p_number:data.number,p_unlocked:data.unlocked});
  }
  else if(action==='authorize-mission'){
   if(!Number.isInteger(data.number)||typeof data.preview!=='boolean')throw new AuthError('Choose a valid mission.');
   result=await rpc(cfg,active.token,'inneru_authorize_mission',{p_system:data.system,p_number:data.number,p_preview:data.preview});
   if(!result.allowed)return answer(res,403,{error:result.reason,code:result.code});
  }
  else if(action==='request-teacher')result=await rpc(cfg,active.token,'inneru_request_teacher_access');
  else throw new AuthError('Learning action not found.',404);
  answer(res,200,result);
 }catch(error){answer(res,error.status||500,{error:error instanceof AuthError?error.message:'Cloud learning is unavailable. Your local work has been kept.'});}
};
