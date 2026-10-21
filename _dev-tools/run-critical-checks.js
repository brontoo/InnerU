/* One sequential release gate for npm test and CI. Local fixtures only. */
'use strict';
const {spawn,spawnSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const artifacts=process.env.INNERU_TEST_ARTIFACT_DIR?path.resolve(process.env.INNERU_TEST_ARTIFACT_DIR):fs.mkdtempSync(path.join(os.tmpdir(),'inneru-release-'));
fs.mkdirSync(artifacts,{recursive:true});
const env={...process.env,PYTHONUNBUFFERED:'1',PYTHONUTF8:'1',INNERU_DB_TEST_CONTAINER:'inneru-release-'+crypto.randomBytes(6).toString('hex')};
// Never hand production configuration to a test process.
for(const key of Object.keys(env))if(key.startsWith('SUPABASE_')||['APP_ORIGIN','VERCEL_URL','VERCEL_PROJECT_PRODUCTION_URL','INNERU_DB_TEST_DATABASE'].includes(key))delete env[key];
const available=[['accounts','Sign-in and signup'],['student-classes','Student classes and teacher assignment'],['dashboard','Student progress and dashboard'],['mission-access','Mission locks, progression, previews and controls'],['teacher-dashboard','Teacher roster, student work and feedback'],['teacher-workspace','Teacher workspace, isolation and navigation'],['owner','Owner access, teacher approval and class assignments'],['learning-support','Guided mode, Arabic presentation and controlled read-aloud'],['arabic-coverage','Strict Arabic coverage audit']];
const selected=process.argv.slice(2);if(selected.some(name=>!available.some(row=>row[0]===name)))throw new Error('Unknown local verification suite.');
const checks=selected.length?available.filter(row=>selected.includes(row[0])):available;
const results=[];let active;
function annotateFailure(label,file){
 if(process.env.GITHUB_ACTIONS!=='true')return;
 const escape=value=>String(value).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
 const message=fs.readFileSync(file,'utf8').split(/\r?\n/).slice(-30).join('\n').slice(-12000);
 console.error('::error title='+escape(label).replace(/:/g,'%3A').replace(/,/g,'%2C')+'::'+escape(message||'Check failed; inspect its artifact log.'));
}
function stopActive(){
 if(!active?.pid)return;
 if(process.platform==='win32')spawnSync('taskkill',['/pid',String(active.pid),'/t','/f'],{stdio:'ignore'});
 else try{process.kill(-active.pid,'SIGTERM');}catch{}
}
async function run(name,label){
 const directory=path.join(artifacts,name);fs.mkdirSync(directory,{recursive:true});
 const log=fs.createWriteStream(path.join(directory,'check.log'));
 console.log('\n=== '+label+' (verify-'+name+'.py) ===');const start=Date.now();
 const code=await new Promise(resolve=>{
  active=spawn(python,[path.join(__dirname,'verify-'+name+'.py')],{cwd:root,env:{...env,INNERU_TEST_ARTIFACT_DIR:directory},stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});
  const timeout=setTimeout(()=>{console.error('Check exceeded the 6-minute limit.');log.write('Check exceeded the 6-minute limit.\n');stopActive();},6*60*1000);
  active.stdout.on('data',data=>{process.stdout.write(data);log.write(data);});active.stderr.on('data',data=>{process.stderr.write(data);log.write(data);});
  active.on('error',error=>{clearTimeout(timeout);log.write(error.message+'\n');console.error(error.message);resolve(1);});
  active.on('close',code=>{clearTimeout(timeout);resolve(code===0?0:1);});
 });
 await new Promise(resolve=>log.end(resolve));active=null;
 if(code)annotateFailure(label,path.join(directory,'check.log'));
 const result={name,label,status:code?'FAIL':'PASS',seconds:Math.round((Date.now()-start)/1000)};results.push(result);console.log(result.status+': '+label+' ('+result.seconds+'s)');
}
function cleanup(){
 // Only this run's randomly named, labelled container is removed; no exposed port/volume.
 const probe=spawnSync('docker',['inspect','--format','{{ index .Config.Labels "inneru.database-test" }}',env.INNERU_DB_TEST_CONTAINER],{encoding:'utf8'});
 if(probe.stdout?.trim()==='true')spawnSync('docker',['rm','-f',env.INNERU_DB_TEST_CONTAINER],{stdio:'ignore'});
}
process.on('SIGINT',()=>{stopActive();cleanup();process.exit(130);});process.on('SIGTERM',()=>{stopActive();cleanup();process.exit(143);});
(async()=>{
 console.log('InnerU critical checks — sequential, local fixtures only.\nArtifacts: '+artifacts);
 try{
  for(const [name,label] of checks)await run(name,label);
 }finally{cleanup();}
 const summary='| Check | Result | Seconds |\n|---|---|---|\n'+results.map(r=>'| '+r.label+' | '+r.status+' | '+r.seconds+' |').join('\n')+'\n';
 console.log('\n'+summary);fs.writeFileSync(path.join(artifacts,'summary.json'),JSON.stringify(results,null,2));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## InnerU critical checks\n\n'+summary);
 process.exitCode=results.length===checks.length&&results.every(r=>r.status==='PASS')?0:1;
})().catch(error=>{console.error(error.message);process.exitCode=1;});
