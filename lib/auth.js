/* Supabase Auth adapter. Passwords and session tokens never enter browser storage. */
const AVATARS=new Set(['nova','atlas','luna','neo','pip','ember','amira','sami','noor','finn','pebble','sage']);
const STUDENT_CLASSES=new Set(['10G1','10G2','10G3','10G4','10G5','10G6']);
const ACCESS='inneru_access',REFRESH='inneru_refresh';
class AuthError extends Error{constructor(message,status=400){super(message);this.status=status;}}
function config(){
 const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 try{const u=new URL(url);if(u.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(u.hostname))return null;
 if(key.startsWith('sb_secret_'))return null;
 if(key.split('.').length===3&&JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='service_role')return null;
 return {url:u.origin,key};}catch{return null;}
}
function origin(req){const host=req.headers.host||'';const local=/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);return process.env.APP_ORIGIN?new URL(process.env.APP_ORIGIN).origin:`${local?'http':'https'}://${host}`;}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(s=>{const i=s.indexOf('=');if(i<0)return [];try{return [s.slice(0,i).trim(),decodeURIComponent(s.slice(i+1))];}catch{return [];}}).filter(x=>x.length===2));}
function setSession(req,res,session){
 const secure=origin(req).startsWith('https:')?'; Secure':'';
 const base=`; Path=/; HttpOnly; SameSite=Lax${secure}`;
 res.setHeader('Set-Cookie',[
 `${ACCESS}=${encodeURIComponent(session?.access_token||'')}; Max-Age=${session?Math.max(1,Math.min(86400,Number(session.expires_in)||3600)):0}${base}`,
 `${REFRESH}=${encodeURIComponent(session?.refresh_token||'')}; Max-Age=${session?2592000:0}${base}`
 ]);
}
async function publicUser(user,cfg,token){
 let response;try{response=await fetch(cfg.url+'/rest/v1/profiles?id=eq.'+encodeURIComponent(user.id)+'&select=*',{headers:{apikey:cfg.key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000)});}catch{throw new AuthError('Your account role could not be verified. Please try signing in again.',503);}
 let rows;try{rows=await response.json();}catch{rows=null;}
 const p=Array.isArray(rows)?rows[0]:null;
 if(!response.ok||p?.id!==user.id||!['student','teacher','admin'].includes(p?.role))throw new AuthError('Your database profile could not be verified. Ask the site owner to check the InnerU database setup.',503);
 const av=AVATARS.has(p.avatar_id)?p.avatar_id:user.user_metadata?.avatar_id;
 return {id:user.id,email:user.email||'',name:String(p.display_name||'Explorer').slice(0,24),avatarId:AVATARS.has(av)?av:null,role:p.role,requestedRole:user.user_metadata?.requested_role==='teacher'?'teacher':'student',classCode:STUDENT_CLASSES.has(p.class_code)?p.class_code:null,classSelectionRequired:p.role==='student'&&Object.hasOwn(p,'class_code')&&!STUDENT_CLASSES.has(p.class_code),assignedTeacher:p.assigned_teacher_email?{id:p.assigned_teacher_id||null,email:p.assigned_teacher_email,pending:!p.assigned_teacher_id}:null};
}
async function provider(cfg,path,body,token,method){
 let response;try{response=await fetch(cfg.url+'/auth/v1/'+path,{method:method||(body?'POST':'GET'),headers:{apikey:cfg.key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});}catch{throw new AuthError('The account service could not be reached. Please try again.',503);}
 let data;try{data=await response.json();}catch{data={};}
 if(!response.ok){const code=data.code||data.error_code||data.error;
 const message=code==='invalid_credentials'?'The email or password is incorrect.':code==='email_not_confirmed'?'Please confirm your email before signing in.':/password/i.test(code||'')?'Choose a stronger password with at least eight characters.':response.status===429?'Too many attempts. Please wait a moment and try again.':response.status===401||response.status===403?'Your session has ended. Please sign in again.':'This account request could not be completed. Check your details and try again.';
 throw new AuthError(message,response.status===429?429:response.status>=500?503:400);}
 return data;
}
async function session(req,res,cfg){
 const c=cookies(req);if(c[ACCESS]){try{return {user:await provider(cfg,'user',null,c[ACCESS]),token:c[ACCESS]};}catch(e){if(e.status>=500)throw e;}}
 if(!c[REFRESH])return null;
 try{const next=await provider(cfg,'token?grant_type=refresh_token',{refresh_token:c[REFRESH]});if(!next.access_token||!next.user)throw new AuthError('Please sign in again.',401);setSession(req,res,next);return {user:next.user,token:next.access_token};}catch(e){if(e.status>=500)throw e;setSession(req,res,null);return null;}
}
async function body(req,limit=16384){
 if(req.body!==undefined){try{const value=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(value))>limit)throw 0;return value||{};}catch{throw new AuthError('The request could not be read.');}}
 let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>limit)throw new AuthError('The request is too large.',413);}try{return JSON.parse(raw||'{}');}catch{throw new AuthError('The request could not be read.');}
}
function password(value,minimum=8){if(typeof value!=='string'||value.length<minimum||value.length>128)throw new AuthError('Use a password between 8 and 128 characters.');return value;}
function email(value){if(typeof value!=='string'||value.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value))throw new AuthError('Enter a valid email address.');return value.trim().toLowerCase();}
function profile(data){if(!AVATARS.has(data.avatarId))throw new AuthError('Choose an avatar to continue.');const name=String(data.name||'Explorer').trim();if(name.length>24||/[\u0000-\u001f\u007f]/.test(name))throw new AuthError('Use up to 24 characters for your nickname.');return {avatar_id:data.avatarId,display_name:name||'Explorer'};}
function answer(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store, private');res.setHeader('Vary','Cookie, Origin');res.setHeader('X-Content-Type-Options','nosniff');
 try{
 const action=new URL(req.url,'http://local').searchParams.get('action')||'session';
 if(!['GET','POST'].includes(req.method))return answer(res,405,{error:'Method not allowed.'});
 if((['session','connection'].includes(action))!==(req.method==='GET'))return answer(res,405,{error:'Method not allowed.'});
 if(req.method==='POST'&&((req.headers.origin&&req.headers.origin!==origin(req))||req.headers['sec-fetch-site']==='cross-site'))return answer(res,403,{error:'Open this action from the InnerU website.'});
 const cfg=config();if(!cfg)return answer(res,action==='session'?200:503,{configured:false,authenticated:false,error:'Account sign-in is not connected yet. The site owner needs to connect the account service.'});
 if(action==='connection'){await provider(cfg,'settings');return answer(res,200,{configured:true,authReachable:true,projectHost:new URL(cfg.url).hostname});}
 if(action==='session'){const active=await session(req,res,cfg);return answer(res,200,{configured:true,projectHost:new URL(cfg.url).hostname,authenticated:!!active,...(active?{user:await publicUser(active.user,cfg,active.token)}:{})});}
 const data=await body(req);
 if(action==='signup'){
 const details={...profile(data),requested_role:data.requestedRole==='teacher'?'teacher':'student'},mail=email(data.email),pass=password(data.password);
 if(details.requested_role==='student'){if(!STUDENT_CLASSES.has(data.classCode))throw new AuthError('Select your class: 10G1, 10G2, 10G3, 10G4, 10G5 or 10G6.');details.class_code=data.classCode;}
 const result=await provider(cfg,'signup?redirect_to='+encodeURIComponent(origin(req)+'/login'),{email:mail,password:pass,data:details});
 if(result.access_token&&result.user){setSession(req,res,result);return answer(res,200,{authenticated:true,user:await publicUser(result.user,cfg,result.access_token)});}
 const registered=result.user||(result.id?result:null);
 if(!registered?.id)throw new AuthError('The account service did not confirm account creation. Please contact your teacher.',502);
 return answer(res,200,{authenticated:false,confirmationRequired:true});
 }
 if(action==='login'){
 const result=await provider(cfg,'token?grant_type=password',{email:email(data.email),password:password(data.password,1)});
 if(!result.access_token||!result.user)throw new AuthError('Please confirm your email and try signing in again.');
 setSession(req,res,result);return answer(res,200,{authenticated:true,user:await publicUser(result.user,cfg,result.access_token)});
 }
 if(action==='verify'){
 let result;
 if(typeof data.tokenHash==='string'&&data.tokenHash.length<=512&&['email','signup','recovery'].includes(data.type))result=await provider(cfg,'verify',{token_hash:data.tokenHash,type:data.type});
 else if(typeof data.accessToken==='string'&&typeof data.refreshToken==='string'&&data.accessToken.length<=8192&&data.refreshToken.length<=8192){const user=await provider(cfg,'user',null,data.accessToken);result={access_token:data.accessToken,refresh_token:data.refreshToken,expires_in:3600,user};}
 else throw new AuthError('This confirmation link is incomplete. Please request a new one.');
 if(!result.access_token||!result.user)throw new AuthError('This confirmation link has expired. Please request a new one.');
 setSession(req,res,result);return answer(res,200,{authenticated:true,user:await publicUser(result.user,cfg,result.access_token)});
 }
 if(action==='recover'){await provider(cfg,'recover?redirect_to='+encodeURIComponent(origin(req)+'/login'),{email:email(data.email)});return answer(res,200,{sent:true});}
 if(action==='logout'){
 const c=cookies(req);if(c[ACCESS]){try{await provider(cfg,'logout',{},c[ACCESS]);}catch{}}
 setSession(req,res,null);return answer(res,200,{signedOut:true});
 }
 if(!['avatar','password'].includes(action))return answer(res,404,{error:'Account action not found.'});
 const active=await session(req,res,cfg);if(!active)throw new AuthError('Your session has ended. Please sign in again.',401);
 const user=await provider(cfg,'user',action==='avatar'?{data:profile(data)}:{password:password(data.password)},active.token,'PUT');
 return answer(res,200,{authenticated:true,user:await publicUser(user,cfg,active.token)});
 }catch(error){answer(res,error.status||500,{error:error instanceof AuthError?error.message:'The account request could not be completed. Please try again.'});}
};
module.exports.shared={config,origin,session,body,answer,AuthError,publicUser};
