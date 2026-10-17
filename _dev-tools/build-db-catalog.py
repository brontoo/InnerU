"""Compile the reviewed curriculum snapshot and task-credit rules into SQL seeds."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
c=json.loads((root/'supabase/catalog.json').read_text())
def q(v):return "'"+str(v).replace("'","''")+"'"
rows=['begin;']
for i,w in enumerate(c['worlds']):
 rows.append(f"insert into public.systems values({q(w['id'])},{q(w['name'])},{len(w['titles'])},{i}) on conflict(id) do update set name=excluded.name,mission_count=excluded.mission_count,sort_order=excluded.sort_order;")
 for n,title in enumerate(w['titles']+[w['final']],1):
  rows.append(f"insert into public.missions(id,system_id,number,title,is_final) values({q(w['id']+'-'+str(n))},{q(w['id'])},{n},{q(title)},{str(n>len(w['titles'])).lower()}) on conflict(id) do update set title=excluded.title;")
for b in c['badges']:
 rows.append(f"insert into public.badges values({q(b['id'])},{'null' if b['system']=='extra' else q(b['system'])},{q(b['name'])},{q(b['kind'])},{q(b['requirement'])}) on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;")
gates={}
r={}
def add(id,xp,system=None):r[id]=(xp,system)
for n in range(1,9):
 gates['skeletal-'+str(n)]=[f'activity{n}']+[f'q{n}-{i}' for i in range(3)]
 add(f'activity{n}',20 if n<8 else 0,'skeletal')
 for i in range(3):add(f'q{n}-{i}',10,'skeletal')
for i in range(4):add(f'case{i}',30,'skeletal')
add('boss',50,'skeletal')
for prefix,system in [('integ','integumentary'),('resp','respiratory'),('exc','excretory')]:
 for n in range(1,7):
  gates[system+'-'+str(n)]=[f'{prefix}-{n}-lab']+[f'{prefix}-{n}-q{i}' for i in range(3)]
  add(f'{prefix}-{n}-lab',20,system);add(f'{prefix}-mission-{n}',25,system)
  for i in range(3):add(f'{prefix}-{n}-q{i}',7,system)
 for i in range(8):add(f'{prefix}-final-{i}',8,system)
 add(f'{prefix}-key',50,system)
for id in ['1-route','4-audit','5-ph','5-weekly','6-treatment']:add('exc-'+id,10,'excretory')
for id in ['4-breath-in','4-breath-rate']:add('resp-'+id,10,'respiratory')
for n in range(1,8):
 gates['circ-'+str(n)]=[f'circ-m{n}-lab']+[f'circ-m{n}-a{i}' for i in range(2)]+[f'circ-m{n}-c{i}' for i in range(3)]
 add(f'circ-mission-{n}',25,'circ');add(f'circ-m{n}-lab',20,'circ')
 for i in range(2):add(f'circ-m{n}-a{i}',20,'circ')
 for i in range(3):add(f'circ-m{n}-c{i}',5,'circ')
for i in range(15):add(f'circ-master-{i}',5,'circ')
for i in range(8):add(f'circ-boss-{i}',5,'circ')
add('circ-mastery',50,'circ');add('circ-boss',40,'circ')
muscles={1:{'scanner':10,'location':10,'control':10,'conscious':10},2:{'arm':5,'pull':10,'force':10,'bag':10},3:{'zoom':5,'build':10,'hierarchy':10,'locate':10},4:{'slide':5,'bridge':10,'mistake':10},5:{'energy':10,'oxygen':10,'recovery':10,'rigor-check':10},6:{'athletes':10,'profiles':10,'sample':10,'bird':15},7:{'scanner':10,'stimulate':5,'target':5,'source':10,'report':30},8:{'tissue':10,'order':10,'contract':5,'fibers':10,'cooperate':15}}
for n,tasks in muscles.items():
 add(f'muscle:complete-{n}',50 if n==8 else 25,'muscle')
 if n<8:tasks.update({'check-1':10,'check-2':10,'check-3':15})
 gates['muscle-'+str(n)]=[f'muscle:m{n}-{id}' for id in tasks]
 for id,xp in tasks.items():add(f'muscle:m{n}-{id}',xp,'muscle')
for i in range(4):add(f'muscle:muscle-case-{i}',20,'muscle')
for id in ['force-lift','force-hold']:add(id,10,'muscle')
for id in ['touch','spine','wave','air','signal','sample']:add('detective2-'+id,30)
add('connection',35);add('capstone',30)
for i in range(6):add('cap-station-'+str(i),15)
for id,(xp,system) in r.items():rows.append(f"insert into public.reward_definitions(id,system_id,xp) values({q(id)},{q(system) if system else 'null'},{xp}) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;")
for w in c['worlds']:
 final_id=w['id']+'-'+str(len(w['titles'])+1)
 if w['id'] in ['integumentary','respiratory','excretory']:
  prefix={'integumentary':'integ','respiratory':'resp','excretory':'exc'}[w['id']];gates[final_id]=[f'{prefix}-final-{i}' for i in range(8)]
 if w['id']=='circ':gates[final_id]=[f'circ-master-{i}' for i in range(15)]
for id,required in gates.items():rows.append('update public.missions set required_rewards='+q(json.dumps(required))+'::jsonb where id='+q(id)+';')
rows.append('commit;\n')
(root/'supabase/migrations/002_catalog.sql').write_text('\n'.join(rows))
print(len(r),'reviewed task-credit definitions compiled')
