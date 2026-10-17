/* Isolated test fixture only. Never deployed; production uses the real Auth API. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const handler=require('../api/auth.js'),root=path.resolve(__dirname,'..');
const users=new Map(),access=new Map(),refresh=new Map();let configured=true;
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function input(req){let s='';for await(const c of req)s+=c;return JSON.parse(s||'{}');}
function publicUser(u){return {id:u.id,email:u.email,user_metadata:u.data};}
function grant(u){const a='access-'+crypto.randomUUID(),r='refresh-'+crypto.randomUUID();access.set(a,u);refresh.set(r,u);return {access_token:a,refresh_token:r,expires_in:3600,user:publicUser(u)};}
const provider=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://local'),data=req.method==='GET'?{}:await input(req),u=access.get((req.headers.authorization||'').replace('Bearer ',''));
 if(url.pathname==='/auth/v1/signup'){
  if(data.email==='limited@example.com')return send(res,429,{code:'over_request_rate_limit'});
  if(users.has(data.email))return send(res,400,{code:'user_already_exists'});
  const next={id:crypto.randomUUID(),email:data.email,password:data.password,data:data.data,confirmed:data.email!=='confirm@example.com'};users.set(next.email,next);
  return send(res,200,next.confirmed?grant(next):{user:publicUser(next)});
 }
 if(url.pathname==='/auth/v1/token'){
  if(url.searchParams.get('grant_type')==='refresh_token'){const next=refresh.get(data.refresh_token);return next?send(res,200,grant(next)):send(res,401,{code:'refresh_token_not_found'});}
  const next=users.get(data.email);if(!next||next.password!==data.password)return send(res,400,{code:'invalid_credentials'});
  if(!next.confirmed)return send(res,400,{code:'email_not_confirmed'});return send(res,200,grant(next));
 }
 if(url.pathname==='/auth/v1/user'){
  if(!u)return send(res,401,{code:'bad_jwt'});
  if(req.method==='PUT'){if(data.data)u.data={...u.data,...data.data};if(data.password)u.password=data.password;}
  return send(res,200,publicUser(u));
 }
 if(url.pathname==='/auth/v1/verify'){
  const next=users.get(data.token_hash==='confirm-test'?'confirm@example.com':'amina@example.com');if(!next||!['confirm-test','recovery-test'].includes(data.token_hash))return send(res,400,{code:'otp_expired'});
  next.confirmed=true;return send(res,200,grant(next));
 }
 if(url.pathname==='/auth/v1/recover')return send(res,200,{});
 if(url.pathname==='/auth/v1/logout'){access.delete((req.headers.authorization||'').replace('Bearer ',''));return send(res,200,{});}
 send(res,404,{});
 }catch(e){send(res,500,{error:'Fixture request failed.'});}});
const site=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://local');
 if(url.pathname==='/api/auth'){const previous=process.env.SUPABASE_URL;if(!configured)delete process.env.SUPABASE_URL;await handler(req,res);if(previous)process.env.SUPABASE_URL=previous;return;}
 if(url.pathname==='/__test/status')return send(res,200,{users:[...users.values()].map(u=>({id:u.id,email:u.email,data:u.data})),configured});
 if(url.pathname==='/__test/config'){configured=(await input(req)).enabled;return send(res,200,{configured});}
 if(url.pathname==='/__test/expire'){access.clear();return send(res,200,{expired:true});}
 if(url.pathname==='/__test/clear-avatar'){const data=await input(req),u=users.get(data.email);if(u)delete u.data.avatar_id;return send(res,200,{cleared:!!u});}
 const relative=url.pathname==='/'?'/index.html':url.pathname==='/login'?'/login.html':url.pathname;const file=path.resolve(root,'.'+relative);
 if(!file.startsWith(root+path.sep))return send(res,403,{});
 try{const content=await fs.promises.readFile(file),type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.glb':'model/gltf-binary'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(content);}catch{send(res,404,{error:'File not found'});}
});
provider.listen(0,'127.0.0.1',()=>{process.env.SUPABASE_URL='http://127.0.0.1:'+provider.address().port;process.env.SUPABASE_PUBLISHABLE_KEY='test-publishable-key';site.listen(0,'127.0.0.1',()=>{process.env.APP_ORIGIN='http://127.0.0.1:'+site.address().port;console.log(JSON.stringify({origin:process.env.APP_ORIGIN}));});});
process.on('SIGTERM',()=>{site.close();provider.close();process.exit(0);});
