"""Verify the detailed heart studio using real WebGL, anatomy and stored progress."""
import json,math,hashlib,struct
from pathlib import Path
from test_support import playwright_session as sync_playwright, launch, new_context, artifact, start_fixture
proc,ORIGIN=start_fixture()
BASE=ORIGIN+'/?nosw=1'
checks=0;errors=[]
def check(ok,message):
 global checks
 assert ok,message
 checks+=1;print('PASS',message,flush=True)
def live(p):return p.evaluate('window.inneruHeartExplorerState()')
def saved(p):return p.evaluate("localStorage.getItem('bodyquest-v1')")
def state(p):return json.loads(saved(p))
def mode(p,name):
 p.locator(f'[data-heart-mode="{name}"]').click();p.wait_for_function('name=>window.inneruHeartExplorerState().mode===name',arg=name)
 p.locator('#heart-canvas').scroll_into_view_if_needed();p.wait_for_function('name=>{const s=inneruHeartExplorerState();return !s.renderer||!document.querySelector("#heart-fallback").hidden||s.mode===name&&s.meshes>0&&(name!=="cutaway"||s.anatomy?.kind==="registered-atlas")}',arg=name);p.wait_for_timeout(80)
def group(p,name):p.locator(f'[data-heart-group="{name}"]').click()
def choose(p,key):p.locator(f'#heart-structure-list [data-heart-structure="{key}"]').click()
def frame(p):return p.evaluate('window.inneruHeartExplorerSnapshot()')
try:
 with sync_playwright() as pw:
  b=launch(pw)
  p=new_context(b, service_workers='block',viewport={'width':1680,'height':1100}).new_page();p.on('pageerror',lambda e:errors.append(str(e)));requests=[];p.on('request',lambda r:requests.append(r.url))
  p.goto(BASE+'#home',wait_until='domcontentloaded');p.evaluate("localStorage.setItem('bodyquest-v1',JSON.stringify({name:'Anatomist',xp:0,rewards:[],done:[],weak:[],motion:false,circ:{done:[],steps:[],mastery:false,boss:false,heartExplored:[]}}))")
  p.goto(BASE+'#circulatory',wait_until='domcontentloaded');p.wait_for_function('window.inneruHeartExplorerState?.().canvas',timeout=30000)
  root_path=Path(__file__).resolve().parents[1]
  check(hashlib.sha256((root_path/'assets/anatomical-heart.glb').read_bytes()).hexdigest()=='758f3d8b8ea0acb78887098d34757e34f2eca98296983b8a84fc8108e349e064','the credited original external heart asset is byte-for-byte unchanged')
  raw=(root_path/'assets/heart-surface-details.glb').read_bytes();length=struct.unpack('<I',raw[12:16])[0];source=json.loads(raw[20:20+length])
  check(len(source['nodes'])==14 and all(x['extras'].get('sourceName') for x in source['nodes']) and len(source['extras']['provenance'])==14,'the small added GLB retains named source segments and per-file provenance')
  check(p.locator('.heart-lab-modes [role="tab"]').count()==4,'four complete anatomy investigation views are available')
  check(live(p)['canvas'],'a real WebGL heart is rendered')
  baseline=saved(p)
  check(not any('/heart-interior.glb' in url or '/heart-atlas-cutaway.js' in url for url in requests),'surface-only viewing never fetches the internal atlas or its preparation module')
  # Invariants come from the actual geometry, not only UI descriptions.
  anatomy=p.evaluate('''async()=>{const {createHeartAnatomy,HEART_STRUCTURES}=await import('./heart-anatomy.js?v=atlas-inside-1');const m=createHeartAnatomy();const all=new Set(m.meshes.flatMap(x=>x.userData.ids));const result={all:Object.entries(HEART_STRUCTURES).filter(([,f])=>!f.surfaceOnly).every(([k])=>all.has(k)),count:m.meshes.length,finite:m.meshes.every(x=>[...x.geometry.attributes.position.array,...x.geometry.attributes.normal.array].every(Number.isFinite)),lv:m.chambers.lv.wall,rv:m.chambers.rv.wall,counts:Object.fromEntries(m.valves.map(v=>[v.id,v.leaflets.length])),chordal:m.valves.filter(v=>v.chords.length).map(v=>v.id),fossa:m.meshes.some(x=>x.userData.heartId==='fossa'&&x.userData.closedDepression),fourPV:m.meshes.filter(x=>x.userData.heartId==='veins'&&x.geometry.type==='TubeGeometry').length/2,phases:[]};for(const phase of [0,.42,.65,.86]){m.setPhase(phase);result.phases.push(m.valves.map(v=>[v.id,v.open]));}new Set(m.meshes.map(x=>x.geometry)).forEach(g=>g.dispose());new Set(m.meshes.map(x=>x.material)).forEach(g=>g.dispose());m.textures.forEach(t=>t.dispose());return result;}''')
  check(anatomy['all'],'all 26 internal anatomical structures have actual geometry')
  check(anatomy['count']>=190 and anatomy['finite'],'the detailed model has finite surfaces, cords, muscle ridges and vessel geometry')
  check(anatomy['lv']>anatomy['rv']*2.5,'the left ventricular wall is substantially thicker than the right')
  check(anatomy['counts']=={'tricuspid':3,'mitral':2,'pulmonary':3,'aortic':3},'valves have scientifically correct leaflet/cusp counts')
  check(set(anatomy['chordal'])=={'tricuspid','mitral'},'chordae attach only to AV valves, never to semilunar valves')
  check(anatomy['fourPV']==4,'four pulmonary veins return toward the posterior left atrium')
  check(anatomy['fossa'],'the adult fossa ovalis is an intact depression, not an open septal hole')
  for i,phase_name in enumerate(['filling','isovolumetric contraction','ejection','isovolumetric relaxation']):
   values=dict(anatomy['phases'][i]);av=1 if i==0 else 0;semi=1 if i==2 else 0
   check(values['mitral']==av and values['tricuspid']==av and values['aortic']==semi and values['pulmonary']==semi,phase_name+' has the correct open/closed valve relationships')
  detailed=p.evaluate("""async()=>{
   const {createHeartAnatomy}=await import('./heart-anatomy.js?v=atlas-inside-1');
   const THREE=await import('./assets/three/three.module.js'),m=createHeartAnatomy();m.root.updateMatrixWorld(true);
   const result={supports:m.valves.filter(v=>v.isAV).map(v=>[v.id,v.papillarySupports.length]),anchored:true,cordDistance:0,septalGap:0,closedApices:m.meshes.filter(x=>x.userData.closedApex).length,moderator:m.meshes.filter(x=>x.userData.moderatorBand).map(x=>x.userData.ids),outflows:[],coaptation:0};
   const nearest=(point,meshes)=>{let distance=Infinity;for(const mesh of meshes){const positions=mesh.geometry.attributes.position;for(let i=0;i<positions.count;i++)distance=Math.min(distance,point.distanceTo(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld)));}return distance;};
   for(const v of m.valves.filter(v=>v.isAV))for(const muscle of v.papillarySupports){const base=new THREE.Vector3(...muscle.userData.base);v.group.localToWorld(base);const chamber=v.id==='mitral'?'lv':'rv';result.anchored&&=nearest(base,m.meshes.filter(x=>x.userData.chamber===chamber&&x.userData.endocardium))<.035;}
   const septum=m.meshes.find(x=>x.userData.sharedSeptalWall),sp=septum.geometry.attributes.position;
   for(let i=0;i<sp.count;i+=4)for(const [offset,id] of [[0,'rv'],[1,'lv']])result.septalGap=Math.max(result.septalGap,nearest(new THREE.Vector3().fromBufferAttribute(sp,i+offset),m.meshes.filter(x=>x.userData.chamber===id&&x.userData.endocardium)));
   for(const x of m.meshes.filter(x=>x.userData.smoothOutflow&&!x.userData.front)){const valve=m.valves.find(v=>v.id===x.userData.toValve);result.outflows.push({from:x.userData.fromChamber,to:valve.id,gap:x.geometry.parameters.path.getPointAt(1).distanceTo(valve.group.position)});}
   for(const phase of [0,.42,.65,.86]){m.setPhase(phase);m.root.updateMatrixWorld(true);for(const v of m.valves)for(const bundle of v.bundles)for(const branch of bundle.branches){const tip=new THREE.Vector3(0,.5,0).applyMatrix4(branch.mesh.matrixWorld),leaf=v.leaflets[bundle.index],positions=leaf.mesh.geometry.attributes.position;let distance=Infinity;for(let k=0;k<leaf.angular;k++){const a=new THREE.Vector3().fromBufferAttribute(positions,k*(leaf.radial+1)+leaf.radial).applyMatrix4(leaf.mesh.matrixWorld),b=new THREE.Vector3().fromBufferAttribute(positions,(k+1)*(leaf.radial+1)+leaf.radial).applyMatrix4(leaf.mesh.matrixWorld);distance=Math.min(distance,tip.distanceTo(new THREE.Line3(a,b).closestPointToPoint(tip,true,new THREE.Vector3())));}result.cordDistance=Math.max(result.cordDistance,distance);}}
   m.setPhase(.42);const mitral=m.valves.find(v=>v.id==='mitral');for(let k=0;k<=18;k++)result.coaptation=Math.max(result.coaptation,new THREE.Vector3().fromBufferAttribute(mitral.leaflets[0].mesh.geometry.attributes.position,k*11+10).distanceTo(new THREE.Vector3().fromBufferAttribute(mitral.leaflets[1].mesh.geometry.attributes.position,(18-k)*11+10)));
   const ring=m.meshes.find(x=>x.userData.saddleAnnulus).geometry.attributes.position;const yy=Array.from({length:ring.count},(_,i)=>ring.getY(i));result.saddleHeight=Math.max(...yy)-Math.min(...yy);
   const front=m.meshes.filter(x=>x.userData.anteriorLeaflet);result.sectioned=front.length===5&&front.every(x=>!x.visible);m.setOpened(false);result.restored=front.every(x=>x.visible);
   new Set(m.meshes.map(x=>x.geometry)).forEach(g=>g.dispose());new Set(m.meshes.map(x=>x.material)).forEach(g=>g.dispose());m.textures.forEach(t=>t.dispose());return result;
  }""")
  check(dict(detailed['supports'])=={'mitral':2,'tricuspid':3} and detailed['anchored'],'all five papillary groups are anchored on the actual ventricular endocardium')
  check(detailed['cordDistance']<.012,'branching chordae remain attached to the actual leaflet margins through all cycle phases')
  check(detailed['septalGap']<.035,'the shared ventricular septum meets both actual chamber linings without a floating partition')
  check(detailed['closedApices']==2,'both ventricular tips are closed with myocardial tissue')
  check(detailed['moderator']==[['trabeculae','rv']],'a muscular moderator band crosses only the right ventricle')
  check({(v['from'],v['to']) for v in detailed['outflows']}=={('rv','pulmonary'),('lv','aortic')} and max(v['gap'] for v in detailed['outflows'])<1e-6,'smooth ventricular outflows connect to their correct semilunar valve roots')
  check(detailed['saddleHeight']>.05 and detailed['coaptation']<1e-6,'the mitral annulus is saddle-shaped and its two closed free edges coapt')
  check(detailed['sectioned'] and detailed['restored'],'the anatomical section removes near-side AV leaflet tissue and restores it with the front wall')
  connections=p.evaluate("""async()=>{
   const {createHeartAnatomy}=await import('./heart-anatomy.js?v=atlas-inside-1'),THREE=await import('./assets/three/three.module.js'),m=createHeartAnatomy();m.root.updateMatrixWorld(true);
   let ringGap=0;const bridges=m.meshes.filter(x=>x.userData.atrioventricularBridge);
   for(const bridge of bridges){const valve=m.valves.find(v=>v.id===bridge.userData.toValve),positions=bridge.geometry.attributes.position;for(let i=0;i<=48;i++){const point=new THREE.Vector3().fromBufferAttribute(positions,i*9),theta=(bridge.userData.front?0:Math.PI)+Math.PI*i/48,hinge=new THREE.Vector3(valve.radius*Math.cos(theta),valve.annularSaddle*Math.cos(2*theta),valve.radius*Math.sin(theta));valve.group.localToWorld(hinge);ringGap=Math.max(ringGap,point.distanceTo(hinge));}}
   const idsCorrect=m.meshes.filter(x=>x.userData.smoothOutflow).every(x=>!x.userData.ids.includes(x.userData.toValve));
   const segments=m.routes.segments.map(x=>({start:x.getPointAt(0).toArray(),end:x.getPointAt(1).toArray(),finite:Array.from({length:101},(_,i)=>x.getPointAt(i/100).toArray()).flat().every(Number.isFinite)}));
   new Set(m.meshes.map(x=>x.geometry)).forEach(g=>g.dispose());new Set(m.meshes.map(x=>x.material)).forEach(g=>g.dispose());m.textures.forEach(t=>t.dispose());return {bridges:bridges.length,ringGap,idsCorrect,segments};
  }""")
  check(connections['bridges']==4 and connections['ringGap']<1e-6,'both halves of each AV junction meet the actual oval leaflet annulus')
  check(connections['idsCorrect'],'semilunar selection does not misidentify the ventricular outflow muscle as valve tissue')
  segments=connections['segments'];check(len(segments)==12 and all(x['finite'] for x in segments),'all twelve journey stops have a finite anatomical path')
  check(all(math.dist(segments[i]['end'],segments[i+1]['start'])<1e-6 for i in range(11) if i!=5),'consecutive blood paths meet; only the off-model lung circuit is discontinuous')
  check(segments[2]['start'][1]>.21>segments[2]['end'][1] and segments[8]['start'][1]>.24>segments[8]['end'][1],'filling paths pass downward through the AV valves')
  check(segments[4]['start'][1]<.47<segments[4]['end'][1] and segments[10]['start'][1]<.48<segments[10]['end'][1],'ejection paths pass upward through the correct semilunar roots')

  mode(p,'cutaway');check(live(p)['anatomy']['kind']=='registered-atlas','Inside the heart loads the registered atlas rather than the old procedural reconstruction')
  atlas=live(p);parts=atlas['atlasParts'];check(atlas['anatomy']['geometryFinite'],'all actual atlas, section, cord and overlay vertices and normals remain finite')
  expected_cavities={'ra':'FJ2424','rv':'FJ2423','la':'FJ2425','lv':'FJ2422'}
  for chamber,source in expected_cavities.items():
   check(any(x['id']==chamber and x['source']==source and x['positions']>0 for x in parts),chamber+' uses its actual registered cavity surface')
  for valve,sources in {'mitral':{'FJ2420','FJ2432'},'tricuspid':{'FJ2421','FJ2433','FJ2436'},'aortic':{'FJ2426','FJ2431','FJ2435'},'pulmonary':{'FJ2417','FJ2427','FJ2434'}}.items():
   check({x['source'] for x in parts if x['id']==valve}==sources,valve+' retains the source leaflet/cusp geometry and correct leaflet count')
  check({x['source'] for x in parts if x['id']=='papillary'}=={'FJ2418','FJ2419','FJ2429','FJ2430','FJ2437'},'all five papillary surfaces come from the anatomical atlas')
  check(all(x['source'] in {'FJ2420','FJ2421','FJ2432','FJ2433','FJ2436'} for x in parts if x['id']=='chordae'),'chordae are the attached source tissue, without invented cords on semilunar valves')
  check(all(atlas['anatomy']['sections'][key]['triangles']>0 for key in ['wallSection','raSection','laSection']),'actual wall intersections close the cut surfaces without filling the chamber openings')
  check(min(x['bounds']['min'][1] for x in parts if x['source']=='FJ2428' and not x['front'])<-.49,'the registered ventricular apex remains in the retained cutaway')
  check(p.locator('#heart-valve-controls').is_hidden() and p.locator('#heart-valve-bench').is_visible(),'the static reference pose links clearly to the separate valve-motion investigation')
  check(sum('/heart-interior.glb' in url for url in requests)==1,'the internal atlas downloads once on first opening')
  p.locator('#heart-canvas').screenshot(path=artifact('atlas-inside-en.png'))
  normal=frame(p)
  groups={'chambers':['ra','rv','la','lv'],'valves':['tricuspid','mitral','pulmonary','aortic'],'support':['septum','atrialseptum','myocardium','chordae','papillary','trabeculae','pectinate','fossa'],'conduction':['san','avnode','his','purkinje'],'vessels':['aorta','superior','inferior','arteries','veins','coronary']}
  for category,ids in groups.items():
   group(p,category)
   for key in ids:
    choose(p,key);check(live(p)['selection']==key and live(p)['selectedMeshes']>0,key+' selects actual anatomy')
    check(p.locator('#heart-selected-label').is_visible() and 'Selected' in p.locator('#heart-selected-label').inner_text(),key+' is clearly identified on the model')
    check(p.locator('#circ-vessel-info h3').count()==1,key+' has anatomical explanation and close-observation guidance')
  check(saved(p)==baseline,'all new internal explorations leave XP and persisted progress unchanged');check(sum('/heart-interior.glb' in url for url in requests)==1,'category changes reuse the loaded internal atlas')
  group(p,'chambers');choose(p,'lv');isolated=frame(p)
  check(isolated['opaque']>100 and isolated['opaque']<normal['opaque']*.75,'only the selected structure stays opaque in the actual rendered framebuffer')
  check(isolated['faint']>200,'other anatomy is transparent on the rendered canvas')
  before=live(p)['camera'];p.locator('#heart-focus').click();check(live(p)['camera']!=before,'Focus structure magnifies and centres the selected anatomy')
  p.locator('#heart-reset').click();restored=frame(p);check(restored['opaque']>isolated['opaque']*1.4,'reset restores the complete heart to full visibility')
  check(live(p)['selection'] is None and p.locator('#heart-selected-label').is_hidden(),'reset clears the anatomical selection')
  p.locator('#heart-shell').click();check(not live(p)['opened'],'the anterior chamber wall can be restored')
  closed=frame(p);p.locator('#heart-shell').click();check(live(p)['opened'] and frame(p)!=closed,'removing the anterior wall reveals the interior again')
  check(all(x['visible'] for x in live(p)['atlasParts'] if x['front'] and x['source'] in {'FJ2418','FJ2419','FJ2429','FJ2430','FJ2437','FJ2420','FJ2421','FJ2432','FJ2433','FJ2436'})==False,'the anatomical cut also removes near-side AV support tissue')
  # Mouse ray casting and keyboard control.
  p.locator('#heart-canvas').scroll_into_view_if_needed();box=p.locator('#heart-canvas').bounding_box()
  for x,y in [(.65,.65),(.35,.60),(.65,.55)]:
   p.mouse.click(box['x']+box['width']*x,box['y']+box['height']*y)
   if live(p)['selection']:break
  check(live(p)['selection'] is not None,'tapping the actual model selects a mesh')
  p.locator('#heart-reset').click();before=live(p)['camera'];p.locator('#heart-canvas').focus();p.keyboard.press('ArrowLeft');check(live(p)['camera']!=before,'arrow keys rotate the 3D model')
  p.locator('#heart-tab-cutaway').focus();p.keyboard.press('ArrowRight');check(live(p)['mode']=='valves','arrow keys navigate the anatomy tabs')
  check(p.locator('.heart-bench-labels button').count()==4,'the enlarged valve bench labels all four valves')
  for val in ['tricuspid','mitral','pulmonary','aortic']:
   choose(p,val);check(live(p)['selectedMeshes']>0,'the enlarged '+val+' valve can be isolated')
  p.locator('#heart-reset').click()
  for value,label in [(5,'Filling'),(42,'Isovolumetric contraction'),(65,'Ejection'),(86,'Isovolumetric relaxation')]:
   p.locator('#heart-cycle').fill(str(value));check(p.locator('#heart-cycle-label').inner_text()==label,'the cycle scrubber reveals '+label)
  # Actual automatic motion, pause, and system/app motion preferences.
  p.locator('#heart-beat').click();p.locator('#heart-canvas').scroll_into_view_if_needed();before=live(p)['phase'];p.wait_for_function('v=>Math.abs(window.inneruHeartExplorerState().phase-v)>.04',arg=before,timeout=8000);check(live(p)['beating'],'cardiac-cycle playback moves the actual valve geometry')
  p.locator('#heart-beat').click();p.locator('#heart-canvas').scroll_into_view_if_needed();before=live(p)['phase'];p.wait_for_timeout(300);check(live(p)['phase']==before,'pausing the cycle freezes its anatomical phase')
  p.emulate_media(reduced_motion='reduce');p.wait_for_function('document.querySelector("#heart-beat").disabled');check(not live(p)['beating'] and p.locator('#heart-motion').is_disabled(),'system reduced motion disables automatic motion')
  p.locator('#heart-cycle').fill('65');check(live(p)['phase']==.65,'manual phase investigation remains available with reduced motion')
  p.emulate_media(reduced_motion='no-preference');mode(p,'flow')
  expected=['superior','ra','tricuspid','rv','pulmonary','arteries','veins','la','mitral','lv','aortic','aorta']
  for i,key in enumerate(expected):
   check(live(p)['selection']==key and live(p)['journeyStep']==i,'blood journey stop '+str(i+1)+' follows the physiological route')
   if i<11:p.locator('#heart-route-next').click()
  check('outside this heart model' in p.locator('#heart-route-note').inner_text(),'tissue gas exchange is correctly placed outside the heart')
  check(saved(p)==baseline,'the blood journey does not award mission XP or change stored progress')
  mode(p,'flow');p.locator('#heart-flow').click();p.locator('#heart-canvas').scroll_into_view_if_needed();before=live(p)['particlePositions'];p.wait_for_timeout(500);check(live(p)['particlePositions']!=before,'blood journey animates red cells along the active anatomical segment')
  p.evaluate('document.body.classList.add("motionoff")');p.wait_for_function('!window.inneruHeartExplorerState().journeyPlaying');check(p.locator('#heart-flow').is_disabled(),'app Reduce motion also pauses the journey');p.evaluate('document.body.classList.remove("motionoff")')
  # Original six discovery rewards remain once-only and use real surface mesh names.
  mode(p,'surface');p.wait_for_function('inneruHeartExplorerState().meshes>0 && document.querySelector("#heart-fallback").hidden')
  parts=live(p)['surfaceParts']
  check(any(x['duplicate'] and not x['visible'] and x['source']=='FJ6164' for x in parts),'the duplicate atlas LAD remains hidden rather than drawing two coincident arteries')
  group(p,'external')
  for key in ['rauricle','lauricle']:
   choose(p,key);selected=[x for x in live(p)['surfaceParts'] if x['selected'] and x['visible']]
   check(len(selected)==1 and selected[0]['appendage'],key+' highlights existing atrial tissue without inventing another heart chamber')
  check(state(p)['xp']==0,'atrial appendage selection never adds a discovery reward')
  sources={'lca':{'FJ2737'},'rca':{'FJ2723'},'lad':{'FJ2631'},'lcx':{'FJ2649','FJ2650','FJ2651','FJ2653','FJ2654'},'greatvein':{'FJ2657','FJ2656','FJ2658','FJ2659','FJ2660','FJ2661','FJ2662','FJ2663','FJ2664','FJ2665'},'sinus':{'FJ2655'}}
  for key,expected_sources in sources.items():
   choose(p,key);current=live(p);selected=[x for x in current['surfaceParts'] if x['selected'] and x['visible']]
   check({x['source'] for x in selected}==expected_sources,key+' selects only its named atlas source segments')
   check(all(x['opacity']==1 for x in selected) and all(x['opacity']<.04 for x in current['surfaceParts'] if x['visible'] and not x['selected']),key+' remains opaque while all other surface tissues fade')
   before_offset=[a-b for a,b in zip(current['camera'],current['target'])];p.locator('#heart-focus').click();focused=live(p);after_offset=[a-b for a,b in zip(focused['camera'],focused['target'])]
   check(sum(a*b for a,b in zip(before_offset,after_offset))/(math.sqrt(sum(x*x for x in before_offset))*math.sqrt(sum(x*x for x in after_offset)))>.999,key+' focus preserves the chosen anatomical viewing direction')
   p.locator('#heart-canvas').screenshot(path=artifact('surface-'+key+'.png'))
  check(state(p)['xp']==10 and state(p)['circ']['heartExplored']==['coronary'],'all named coronary selections share exactly the original once-only coronary reward')
  check('POSTERIOR' in p.locator('#heart-view-label').inner_text() and 'Posterior view' in p.locator('.heart-lab-orientation').inner_text(),'posterior coronary sinus selection updates both orientation captions correctly')
  group(p,'vessels');choose(p,'coronary');check({x['source'] for x in live(p)['surfaceParts'] if x['selected'] and x['visible']}==set.union(*sources.values()),'Coronary vessels selects all six named coronary structures together')
  for key in groups['vessels']:
   choose(p,key);check(live(p)['selectedMeshes']>0,'surface '+key+' matches the actual imported mesh name')
  check(state(p)['xp']==60 and len(state(p)['circ']['heartExplored'])==6,'the existing six surface discovery rewards total 60 XP')
  choose(p,'aorta');check(state(p)['xp']==60,'revisiting an explored vessel does not duplicate XP')
  # Small screens keep all categories, modes and phase controls available.
  for width in [320,390,768]:
   p.set_viewport_size({'width':width,'height':900})
   for name in ['surface','cutaway','valves','flow']:
    mode(p,name);check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width}px: {name} layout fits')
   mode(p,'cutaway');group(p,'support');choose(p,'chordae');check(live(p)['selectedMeshes']>0,f'{width}px: detailed support structures remain selectable')
  before_ar=saved(p);p.locator('[data-interface-language]').select_option('ar');p.wait_for_function('document.documentElement.lang==="ar"')
  for width in [320,390,768,1440]:
   p.set_viewport_size({'width':width,'height':1100});mode(p,'surface');group(p,'external')
   for key in ['rauricle','lauricle','lca','rca','lad','lcx','greatvein','sinus']:
    choose(p,key);p.wait_for_timeout(35);check(p.locator('#circ-vessel-info h3').evaluate('e=>/[\u0600-\u06ff]/.test(e.textContent)'),'Arabic '+key+' has its authored anatomical name at '+str(width)+'px')
   check(p.evaluate('document.documentElement.scrollWidth<=innerWidth') and p.locator('#heart-focus').is_enabled(),str(width)+'px Arabic external anatomy fits and retains manual focus')
   p.locator('.heart-lab').screenshot(path=artifact('heart-ar-'+str(width)+'.png'))
   mode(p,'cutaway');p.locator('#heart-canvas').screenshot(path=artifact('cutaway-ar-'+str(width)+'.png'));check(not p.evaluate('InneruLocale.coverage(document.querySelector(".heart-lab"))'),str(width)+'px atlas labels, reference-pose guidance and attribution have complete Arabic text')
  mode(p,'surface');group(p,'external');choose(p,'sinus');p.wait_for_function('document.querySelector("#heart-view-label").textContent.includes("خلفي")');check('خلفي' in p.locator('.heart-lab-orientation').inner_text(),'Arabic posterior orientation and guidance identify the actual selected view')
  check(saved(p)==before_ar,'Arabic names, camera controls and all new selections preserve the existing learning record')
  p.locator('[data-interface-language]').select_option('en')
  p.evaluate('location.hash="home"');p.wait_for_selector('.heart-lab',state='detached');check(live(p)['disposed'] and not live(p)['canvas'],'leaving the page disposes the renderer and observers')
  # The anatomy text and manual phase controls survive a missing WebGL context.
  no=new_context(b, service_workers='block',);no.add_init_script("HTMLCanvasElement.prototype.getContext=function(){return null}")
  q=no.new_page();q.goto(BASE+'#circulatory',wait_until='domcontentloaded');q.wait_for_selector('#heart-fallback',state='visible');check(q.locator('#heart-error').is_visible(),'non-WebGL devices receive an anatomical fallback illustration')
  mode(q,'cutaway');group(q,'valves');choose(q,'mitral');check('leaflets' in q.locator('#circ-vessel-info').inner_text(),'fallback still explains internal valve anatomy')
  mode(q,'valves');q.locator('#heart-cycle').fill('65');check(q.locator('#heart-cycle-label').inner_text()=='Ejection','fallback preserves manual scientific phase investigation')
  retry_context=new_context(b,service_workers='block',reduced_motion='reduce');retry=retry_context.new_page();attempts=[]
  def fail_first_internal(route):
   attempts.append(1)
   if len(attempts)==1:route.abort()
   else:route.continue_()
  retry.route('**/heart-interior.glb',fail_first_internal);retry.goto(BASE+'#circulatory');retry.locator('#heart-canvas').scroll_into_view_if_needed();retry.wait_for_function('window.inneruHeartExplorerState?.().meshes>0');retry_before=saved(retry)
  retry.locator('[data-heart-mode=cutaway]').click();retry.wait_for_selector('#heart-retry',state='visible');check(retry.locator('#heart-fallback').is_visible(),'a failed internal atlas fetch preserves the anatomical illustration and clear retry control')
  retry.locator('#heart-retry').click();retry.wait_for_function('inneruHeartExplorerState().anatomy?.kind==="registered-atlas"')
  check(len(attempts)==2 and retry.locator('#heart-canvas canvas').count()==1,'retry recovers the actual internal atlas without duplicate canvases')
  check(saved(retry)==retry_before,'atlas failure and retry preserve the learner record')
  retry.locator('[data-heart-mode=surface]').click();retry.locator('[data-heart-mode=cutaway]').click();retry.locator('[data-heart-mode=valves]').click();retry.wait_for_function('inneruHeartExplorerState().mode==="valves"&&inneruHeartExplorerState().valves.length===4');retry.wait_for_timeout(150)
  check(retry.locator('#heart-fallback').is_hidden() and live(retry)['mode']=='valves','a stale anatomical load cannot replace the latest valve investigation')
  retry_context.close()
  # Both imported GLBs and the new preparation module must survive true offline refresh.
  offline=new_context(b,reduced_motion='reduce');o=offline.new_page();o.goto(ORIGIN+'/index.html#circulatory')
  o.evaluate('navigator.serviceWorker.ready');o.wait_for_function('navigator.serviceWorker.controller!==null')
  o.locator('#heart-canvas').scroll_into_view_if_needed();o.wait_for_function('window.inneruHeartExplorerState?.().meshes>0 && document.querySelector("#heart-fallback").hidden')
  o.wait_for_function('caches.match("/assets/heart-surface-details.glb").then(Boolean)')
  mode(o,'cutaway');o.wait_for_function('caches.match("/assets/heart-interior.glb").then(Boolean)');mode(o,'surface')
  worker=offline.service_workers[0];worker.evaluate("()=>{self.fetch=()=>Promise.reject(new TypeError('Disconnected local test network'));}")
  offline.set_offline(True);o.reload();o.locator('#heart-canvas').scroll_into_view_if_needed();o.wait_for_function('window.inneruHeartExplorerState?.().meshes>0 && document.querySelector("#heart-fallback").hidden')
  group(o,'external');choose(o,'sinus');check(live(o)['selectedMeshes']>0,'previously visited heart and its new coronary segments remain selectable after offline refresh')
  mode(o,'cutaway');check(live(o)['anatomy']['kind']=='registered-atlas','the actual internal atlas and curved dissection reopen after a genuinely offline refresh')
  offline.close()
  check(not errors,'no uncaught browser errors: '+str(errors));b.close()
 print(f'{checks} checks passed.',flush=True)
finally:proc.terminate();proc.wait(timeout=10)
