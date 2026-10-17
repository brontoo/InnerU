"""Start an isolated PostgreSQL test database; no production credentials used."""
import subprocess,time,os,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];NAME='inneru-db-check'
DB=os.environ.get('INNERU_DB_TEST_DATABASE','postgres')
if not re.fullmatch('[a-z_][a-z0-9_]{0,50}',DB):raise RuntimeError('Use a simple local test database name.')
def run(args,**kwargs):return subprocess.run(args,check=True,text=True,**kwargs)
probe=subprocess.run(['docker','inspect',NAME],capture_output=True,text=True)
if probe.returncode:
 run(['docker','run','--name',NAME,'--label','inneru.database-test=true','-e','POSTGRES_HOST_AUTH_METHOD=trust','-d','postgres:17-alpine'])
else:
 import json
 info=json.loads(probe.stdout)[0]
 if info['Config']['Image']!='postgres:17-alpine':raise RuntimeError('The test-container name belongs to a different image; leave it untouched.')
 run(['docker','start',NAME],stdout=subprocess.DEVNULL)
for _ in range(60):
 p=subprocess.run(['docker','exec',NAME,'pg_isready','-U','postgres'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 if p.returncode==0:break
 time.sleep(.25)
else:raise RuntimeError('PostgreSQL did not become ready.')
if DB!='postgres':
 found=subprocess.check_output(['docker','exec',NAME,'psql','-U','postgres','-qAt','-c',"select 1 from pg_database where datname='"+DB+"'"],text=True).strip()
 if not found:run(['docker','exec',NAME,'createdb','-U','postgres',DB])
bootstrap="""
do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists(select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$;
create schema if not exists auth;
create table if not exists auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
alter table auth.users add column if not exists email_confirmed_at timestamptz default now();
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
"""
run(['docker','exec','-i',NAME,'psql','-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-q'],input=bootstrap+(ROOT/'supabase/setup.sql').read_text(),stdout=subprocess.DEVNULL)
print('Isolated PostgreSQL database ready. No production database was contacted.')
