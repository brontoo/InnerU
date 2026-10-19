/* Test-only loopback fixture; no production credentials or browser assumptions. */
'use strict';
const {spawnSync}=require('node:child_process'),path=require('node:path');
const env={...process.env,PYTHONUNBUFFERED:'1',PYTHONUTF8:'1'};
for(const key of Object.keys(env))if(key.startsWith('SUPABASE_')||['APP_ORIGIN','VERCEL_URL','VERCEL_PROJECT_PRODUCTION_URL'].includes(key))delete env[key];
const result=spawnSync(env.PYTHON||(process.platform==='win32'?'python':'python3'),[path.join(__dirname,'check-performance.py')],{cwd:path.resolve(__dirname,'..'),env,stdio:'inherit',timeout:6*60*1000});
if(result.error)console.error(result.error.message);
process.exitCode=result.status===0?0:1;
