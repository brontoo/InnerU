/* Owner-only staffing gateway. Uses the caller's JWT, never a privileged key. */
const {config,origin,session,body,answer,AuthError,publicUser}=require('../lib/auth.js').shared;
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store, private');res.setHeader('Vary','Cookie, Origin');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const action=new URL(req.url,'http://local').searchParams.get('action')||'staffing';
  if(!['staffing','assign','approve'].includes(action))throw new AuthError('Owner action not found.',404);
  if(req.method!==(action==='staffing'?'GET':'POST'))throw new AuthError('Method not allowed.',405);
  if(req.method==='POST'&&((req.headers.origin&&req.headers.origin!==origin(req))||req.headers['sec-fetch-site']==='cross-site'))throw new AuthError('Open this action from InnerU.',403);
  const cfg=config();if(!cfg)throw new AuthError('The account service is not connected.',503);
  const active=await session(req,res,cfg);if(!active)throw new AuthError('Sign in to manage school assignments.',401);
  const user=await publicUser(active.user,cfg,active.token);
  if(user.role!=='admin')throw new AuthError('Only the school owner can manage teacher assignments.',403);
  const data=req.method==='POST'?await body(req):{};
  let name='inneru_owner_staffing',args={};
  if(action==='assign'){
   if(!Array.isArray(data.changes)||data.changes.length<1||data.changes.length>6)throw new AuthError('Choose between one and six class changes.');
   name='inneru_owner_assign';args={p_changes:data.changes};
  }else if(action==='approve'){
   if(typeof data.teacherId!=='string'||!/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(data.teacherId))throw new AuthError('Choose a registered teacher account.');
   name='inneru_owner_approve';args={p_teacher:data.teacherId};
  }
  let response;
  try{response=await fetch(cfg.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:cfg.key,Authorization:'Bearer '+active.token,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});}
  catch{throw new AuthError('School assignments could not be reached. Reconnect and try again.',503);}
  let result;try{result=await response.json();}catch{throw new AuthError('School assignments could not be read. Try again.',503);}
  if(!response.ok){
   if(result?.code==='42501')throw new AuthError('Only a verified school owner can change these settings.',403);
   if(result?.code==='40001')throw new AuthError('An assignment changed since you opened this screen. Refresh assignments and review your changes again.',409);
   if(['PGRST202','42P01','42883'].includes(result?.code))throw new AuthError('Owner management needs database migration 008_owner_assignments.sql.',503);
   if(result?.code==='22023')throw new AuthError('Choose an existing class and a verified teacher account that requested teacher access.',400);
   throw new AuthError('School assignments could not be saved. Refresh assignments and try again.',response.status>=500?503:400);
  }
  answer(res,200,result);
 }catch(error){answer(res,error.status||500,{error:error instanceof AuthError?error.message:'Owner management is unavailable. Please try again.'});}
};
