/* Isolated test fixture only. Never deployed; production uses the real Auth API. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const handler=require('../api/auth.js'),root=path.resolve(__dirname,'..');
const learningHandler=require('../api/learning.js'),{execFileSync}=require('node:child_process');
const dbContainer=process.env.INNERU_DB_TEST_CONTAINER;
const dbName=process.env.INNERU_DB_TEST_DATABASE||'postgres';
function sql(query){return execFileSync('docker',['exec','-i',dbContainer,'psql','-U','postgres','-d',dbName,'-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-qAt'],{input:query,encoding:'utf8'}).trim();}
const quote=value=>"'"+String(value).replace(/'/g,"''")+"'";
// This process can only call the local provider, even with production variables inherited.
const originalFetch=global.fetch;
global.fetch=(input,options)=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname!=='127.0.0.1'||url.origin!==process.env.SUPABASE_URL)throw Error('Test fixture blocked a non-local provider request.');
 return originalFetch(input,options);
};
const users=new Map(),access=new Map(),refresh=new Map();let configured=true,legacySchema=false;
const limits=new Map(),authCounts={};
function profileRows(rows){return legacySchema?rows.map(p=>Object.fromEntries(Object.entries(p).filter(([k])=>!['class_code','assigned_teacher_email','assigned_teacher_id'].includes(k)))):rows;}
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function input(req){let s='';for await(const c of req)s+=c;return JSON.parse(s||'{}');}
function publicUser(u){return {id:u.id,email:u.email,user_metadata:u.data};}
function grant(u){const a='access-'+crypto.randomUUID(),r='refresh-'+crypto.randomUUID();access.set(a,u);refresh.set(r,u);return {access_token:a,refresh_token:r,expires_in:3600,user:publicUser(u)};}
const provider=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://local'),data=req.method==='GET'?{}:await input(req),u=access.get((req.headers.authorization||'').replace('Bearer ',''));
 const authAction=url.pathname==='/auth/v1/token'?(url.searchParams.get('grant_type')==='refresh_token'?'refresh':'login'):url.pathname==='/auth/v1/user'?(req.method==='PUT'?'avatar':'session'):url.pathname.startsWith('/auth/v1/')?url.pathname.slice(9):null;
 if(authAction){authCounts[authAction]=(authCounts[authAction]||0)+1;const limit=limits.get(authAction);if(limit?.remaining>0){limit.remaining--;if(limit.retryAfter!==undefined)res.setHeader('Retry-After',String(limit.retryAfter));return send(res,limit.status||429,{code:limit.code||'over_request_rate_limit',message:limit.message||'Fixture limit'});}}
 if(url.pathname==='/auth/v1/settings')return send(res,200,{external:{email:true}});
 if(url.pathname==='/auth/v1/signup'){
  if(data.email==='limited@example.com')return send(res,429,{code:'over_request_rate_limit'});
  if(users.has(data.email))return send(res,400,{code:'user_already_exists'});
  const next={id:crypto.randomUUID(),email:data.email,password:data.password,data:data.data,confirmed:data.email!=='confirm@example.com'};users.set(next.email,next);
  if(dbContainer)sql('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values('+quote(next.id)+','+quote(next.email)+','+quote(JSON.stringify(next.data))+'::jsonb,'+(next.confirmed?'now()':'null')+');');
  return send(res,200,next.confirmed?grant(next):publicUser(next));
 }
 if(url.pathname==='/auth/v1/token'){
  if(url.searchParams.get('grant_type')==='refresh_token'){const next=refresh.get(data.refresh_token);return next?send(res,200,grant(next)):send(res,401,{code:'refresh_token_not_found'});}
  const next=users.get(data.email);if(!next||next.password!==data.password)return send(res,400,{code:'invalid_credentials'});
  if(!next.confirmed)return send(res,400,{code:'email_not_confirmed'});return send(res,200,grant(next));
 }
 if(url.pathname==='/auth/v1/user'){
  if(!u)return send(res,401,{code:'bad_jwt'});
  if(req.method==='PUT'){if(data.data)u.data={...u.data,...data.data};if(data.password)u.password=data.password;if(dbContainer&&data.data)sql('update auth.users set raw_user_meta_data='+quote(JSON.stringify(u.data))+'::jsonb where id='+quote(u.id));}
  return send(res,200,publicUser(u));
 }
 if(url.pathname==='/rest/v1/profiles'){
  if(!u)return send(res,401,{code:'bad_jwt'});
  if(url.searchParams.get('id')!=='eq.'+u.id)return send(res,200,[]);
  if(dbContainer)return send(res,200,profileRows(JSON.parse(sql('select coalesce(jsonb_agg(to_jsonb(p)),\'[]\') from (select * from public.profiles where id='+quote(u.id)+') p;'))));
  return send(res,200,profileRows([{id:u.id,display_name:u.data.display_name,avatar_id:u.data.avatar_id,role:u.role||'student',class_code:u.role==='teacher'?null:u.data.class_code||null,assigned_teacher_email:u.data.class_code?(Number(u.data.class_code.slice(-1))<5?'sf.alhammadi@moe.sch.ae':'riham.hassan@moe.sch.ae'):null,assigned_teacher_id:null}]));
 }
 if(url.pathname==='/auth/v1/verify'){
  const next=users.get(data.token_hash==='confirm-test'?'confirm@example.com':'amina@example.com');if(!next||!['confirm-test','recovery-test'].includes(data.token_hash))return send(res,400,{code:'otp_expired'});
  next.confirmed=true;if(dbContainer)sql('update auth.users set email_confirmed_at=now() where id='+quote(next.id));return send(res,200,grant(next));
 }
 if(url.pathname==='/auth/v1/recover')return send(res,200,{});
 if(url.pathname==='/auth/v1/resend')return send(res,200,{});
 if(url.pathname==='/auth/v1/logout'){access.delete((req.headers.authorization||'').replace('Bearer ',''));return send(res,200,{});}
 if(url.pathname.startsWith('/rest/v1/rpc/')){
  if(!u)return send(res,401,{code:'bad_jwt'});
  if(!dbContainer)return send(res,404,{code:'PGRST202'});
  const name=url.pathname.split('/').pop();if(!['inneru_state','inneru_save','inneru_classroom','inneru_create_class','inneru_join_class','inneru_feedback','inneru_request_teacher_access','inneru_select_student_class','inneru_mission_catalog','inneru_mission_controls','inneru_set_mission_control','inneru_authorize_mission'].includes(name))return send(res,404,{});
  const params=Object.entries(data).map(([k,v])=>{if(!/^p_[a-z_]+$/.test(k))throw Error('Bad fixture parameter');return k+'=>'+(v===null?'null':typeof v==='object'?quote(JSON.stringify(v))+'::jsonb':typeof v==='number'||typeof v==='boolean'?String(v):quote(v));});
  try{const result=sql('set role authenticated;set request.jwt.claim.sub='+quote(u.id)+';select public.'+name+'('+params.join(',')+');');const value=JSON.parse(result);if(legacySchema){if(name==='inneru_state')delete value.profile.classCode;if(name==='inneru_classroom')delete value.assignmentVersion;}return send(res,200,value);}catch(e){const details=String(e.stderr||'');return send(res,400,{code:(details.includes('42501')||details.includes('permission denied')||details.includes('insufficient_privilege'))?'42501':details.includes('22023')||details.includes('invalid_parameter_value')||details.includes('invalid parameter value')?'22023':'P0001',message:['revision_conflict','teacher_locked','previous_required','class_required','teacher_preview_only'].find(code=>details.includes(code))||'fixture_database_error'});}
 }
 send(res,404,{});
 }catch(e){send(res,500,{error:'Fixture request failed.'});}});
const site=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://local');
 if(url.pathname==='/api/auth'){const previous=process.env.SUPABASE_URL;if(!configured)delete process.env.SUPABASE_URL;await handler(req,res);if(previous)process.env.SUPABASE_URL=previous;return;}
 if(url.pathname==='/api/learning'){await learningHandler(req,res);return;}
 if(url.pathname==='/__test/approve-teacher'){const data=await input(req);if(dbContainer)sql("update public.profiles set role='teacher' where id="+quote(data.id));else for(const u of users.values())if(u.id===data.id)u.role='teacher';return send(res,200,{approved:true});}
 if(url.pathname==='/__test/status')return send(res,200,{users:[...users.values()].map(u=>({id:u.id,email:u.email,data:u.data})),configured});
 if(url.pathname==='/__test/config'){configured=(await input(req)).enabled;return send(res,200,{configured});}
 if(url.pathname==='/__test/legacy-schema'){legacySchema=(await input(req)).enabled;return send(res,200,{legacySchema});}
 if(url.pathname==='/__test/auth-limit'){const data=await input(req);if(!['signup','login','session','refresh','resend','recover'].includes(data.action))return send(res,400,{});limits.set(data.action,{...data,remaining:data.remaining??1});return send(res,200,{configured:true});}
 if(url.pathname==='/__test/auth-counts')return send(res,200,authCounts);
 if(url.pathname==='/__test/expire'){access.clear();return send(res,200,{expired:true});}
 if(url.pathname==='/__test/clear-avatar'){const data=await input(req),u=users.get(data.email);if(u)delete u.data.avatar_id;return send(res,200,{cleared:!!u});}
 const relative=url.pathname==='/'?'/index.html':url.pathname==='/login'?'/login.html':url.pathname;const file=path.resolve(root,'.'+relative);
 if(!file.startsWith(root+path.sep))return send(res,403,{});
 try{const content=await fs.promises.readFile(file),type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.glb':'model/gltf-binary'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(content);}catch{send(res,404,{error:'File not found'});}
});
provider.listen(0,'127.0.0.1',()=>{process.env.SUPABASE_URL='http://127.0.0.1:'+provider.address().port;process.env.SUPABASE_PUBLISHABLE_KEY='test-publishable-key';site.listen(0,'127.0.0.1',()=>{process.env.APP_ORIGIN='http://127.0.0.1:'+site.address().port;console.log(JSON.stringify({origin:process.env.APP_ORIGIN}));});});
process.on('SIGTERM',()=>{site.close();provider.close();process.exit(0);});
