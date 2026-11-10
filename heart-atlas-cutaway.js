import * as THREE from './assets/three/three.module.js';
const V=a=>new THREE.Vector3(...a);
const chamberIds=new Set(['ra','rv','la','lv']);
const AV=new Set(['mitral','tricuspid']);
const papillaryChamber={FJ2418:'lv',FJ2429:'lv',FJ2419:'rv',FJ2430:'rv',FJ2437:'rv'};
const colour={wall:0xb86960,lining:0xb96b60,cut:0xe3a48b,valve:0xe7d4af,cord:0xf0ddbd,muscle:0xbe7060,gold:0xe9bf66};
// A curved, anterior-oblique dissection window. It returns to the front surface
// inferiorly, preserving the atlas apex instead of amputating it with a flat plane.
const ventricularCut=p=>.52*p.x+.854*p.z-(.23+2.9*Math.max(0,-p.y-.07)**2);
const rootCut=(id,p)=>.52*p.x+.854*p.z-((id==='arteries'||id==='pulmonary'?0.24:0.075)+5*Math.max(0,p.y-.30)**2);
const cuts={rv:ventricularCut,lv:ventricularCut,wall:ventricularCut,
 ra:p=>p.z+.15*p.x-(.08+.65*Math.max(0,-p.y-.18)**2),
 la:p=>p.z+.2*p.x-(-.18+.7*Math.max(0,-p.y-.10)**2)};
function geometry(positions,normals){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));if(normals?.length)g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));else g.computeVertexNormals();return g;}
function vertices(mesh){const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);return Array.from({length:p.count},(_,i)=>({p:new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),n:n?new THREE.Vector3().fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix):new THREE.Vector3(0,0,1)}));}
function triangles(mesh){const g=mesh.geometry;return g.index?Array.from(g.index.array):Array.from({length:g.attributes.position.count},(_,i)=>i);}
function split(mesh,cut){
 const vs=vertices(mesh),ix=triangles(mesh),back=[],front=[],bn=[],fn=[],segments=[],intersection=new Map();
 const crossing=(a,b)=>{const key=a<b?a+':'+b:b+':'+a;if(intersection.has(key))return intersection.get(key);const start=vs[a],end=vs[b];let lo=0,hi=1,side=cut(start.p)>0;for(let k=0;k<20;k++){const t=(lo+hi)/2;if((cut(start.p.clone().lerp(end.p,t))>0)===side)lo=t;else hi=t;}const t=(lo+hi)/2,v={p:start.p.clone().lerp(end.p,t),n:start.n.clone().lerp(end.n,t).normalize()};intersection.set(key,v);return v;};
 const emit=(polygon,pos,norm)=>{for(let j=1;j<polygon.length-1;j++)for(const v of [polygon[0],polygon[j],polygon[j+1]]){pos.push(...v.p.toArray());norm.push(...v.n.toArray());}};
 for(let i=0;i<ix.length;i+=3){const face=ix.slice(i,i+3),rear=[],near=[],edge=[];for(let j=0;j<3;j++){const a=face[j],b=face[(j+1)%3],inside=cut(vs[a].p)<=0,next=cut(vs[b].p)<=0;(inside?rear:near).push(vs[a]);if(inside!==next){const v=crossing(a,b);rear.push(v);near.push(v);edge.push(v.p);}}emit(rear,back,bn);emit(near,front,fn);if(edge.length===2&&edge[0].distanceToSquared(edge[1])>1e-12)segments.push(edge);}
 return{back:geometry(back,bn),front:geometry(front,fn),segments};
}
function loops(segments){
 const key=p=>Math.round(p.x*1e5)+','+Math.round(p.y*1e5),points=new Map(),links=new Map(),edges=new Set();
 for(const [a,b] of segments){const ka=key(a),kb=key(b),id=[ka,kb].sort().join('|');if(ka===kb||edges.has(id))continue;edges.add(id);points.set(ka,a);points.set(kb,b);if(!links.has(ka))links.set(ka,[]);if(!links.has(kb))links.set(kb,[]);links.get(ka).push(kb);links.get(kb).push(ka);}
 const used=new Set(),result=[];
 for(const [start,neighbors] of links)for(const first of neighbors){if(used.has([start,first].sort().join('|')))continue;let previous=start,current=first;const ring=[points.get(start)],visited=new Set([start]);for(let count=0;count<links.size+2;count++){used.add([previous,current].sort().join('|'));if(current===start){if(ring.length>3)result.push(ring);break;}if(visited.has(current))break;visited.add(current);ring.push(points.get(current));const next=links.get(current)?.find(k=>k!==previous&&!used.has([current,k].sort().join('|')))||links.get(current)?.find(k=>k===start&&k!==previous);if(!next)break;previous=current;current=next;}}
 return result.filter(r=>Math.abs(THREE.ShapeUtils.area(r.map(p=>new THREE.Vector2(p.x,p.y))))>1e-7);
}
const inside=(p,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
function sectionCaps(segments){
 const rings=loops(segments).sort((a,b)=>Math.abs(THREE.ShapeUtils.area(b))-Math.abs(THREE.ShapeUtils.area(a))),parents=rings.map((r,i)=>{for(let j=i-1;j>=0;j--)if(inside(r[0],rings[j]))return j;return-1;}),depth=i=>parents[i]<0?0:1+depth(parents[i]),out=[];
 rings.forEach((ring,i)=>{if(depth(i)%2)return;const holes=rings.filter((r,j)=>parents[j]===i&&depth(j)%2),flat=[...ring,...holes.flat()],faces=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p.x,p.y)),holes.map(r=>r.map(p=>new THREE.Vector2(p.x,p.y))));for(const face of faces)for(const k of face)out.push(...flat[k].toArray());});
 return{geometry:geometry(out),loops:rings.length,triangles:out.length/9};
}
function nearest(points,p){let distance=Infinity,point;for(const q of points){const d=p.distanceToSquared(q);if(d<distance){distance=d;point=q;}}return{point,distance:Math.sqrt(distance)};}
function subset(g,indices){const positions=[],normals=[],p=g.attributes.position,n=g.attributes.normal;for(const i of indices){positions.push(p.getX(i),p.getY(i),p.getZ(i));if(n)normals.push(n.getX(i),n.getY(i),n.getZ(i));}return geometry(positions,normals);}
export function createAtlasHeartCutaway(surface,interior){
 const root=new THREE.Group(),meshes=[],fronts=[],caps=[],electrical=[],parts=[],cavityPoints={},sectionSegments={wall:[],ra:[],la:[]};
 const base=surface.clone(true);base.rotation.set(0,0,0);base.updateMatrixWorld(true);interior.updateMatrixWorld(true);
 interior.traverse(m=>{if(!m.isMesh)return;parts.push(m);if(chamberIds.has(m.userData.heartId))cavityPoints[m.userData.heartId]=vertices(m).map(v=>v.p);});
 const material=c=>new THREE.MeshPhysicalMaterial({color:c,roughness:.61,metalness:0,clearcoat:.12,side:THREE.DoubleSide});
 function add(g,id,c,extra={}){g.computeBoundingBox();const m=new THREE.Mesh(g,material(c));m.name=id;m.userData={heartId:id,ids:[id],...extra};root.add(m);meshes.push(m);return m;}
 const wallRegion=p=>{const left=nearest(cavityPoints.lv,p),right=nearest(cavityPoints.rv,p),between=p.clone().sub(left.point).dot(p.clone().sub(right.point))<0;if(between&&left.distance<.18&&right.distance<.18)return'septum';return left.distance<right.distance?'lv':'rv';};
 function ventricularWall(g,extra){const groups={lv:[],rv:[],septum:[]},p=g.attributes.position;for(let i=0;i<p.count;i+=3){const center=new THREE.Vector3();for(let j=0;j<3;j++)center.add(new THREE.Vector3().fromBufferAttribute(p,i+j));groups[wallRegion(center.multiplyScalar(1/3))].push(i,i+1,i+2);}for(const [id,ix] of Object.entries(groups))if(ix.length)add(subset(g,ix),id,extra.sectionCap?colour.cut:colour.wall,{ids:[id,'myocardium'],atlasWall:true,inwardWinding:!extra.sectionCap,...extra});g.dispose();}
 base.traverse(m=>{
  if(!m.isMesh||m.userData.duplicateSurface)return;
  const source=m.userData.surfaceSource||m.userData.sourceId,wall={FJ2428:'wall',FJ2438:'la',FJ2439:'ra'}[source];
  if(wall){const splitMesh=split(m,cuts[wall]);sectionSegments[wall].push(...splitMesh.segments);if(wall==='wall'){ventricularWall(splitMesh.back,{sourceId:source});const before=meshes.length;ventricularWall(splitMesh.front,{sourceId:source,front:true});fronts.push(...meshes.slice(before));}else{add(splitMesh.back,wall,colour.wall,{sourceId:source,ids:[wall,'myocardium'],atlasWall:true,inwardWinding:true});fronts.push(add(splitMesh.front,wall,colour.wall,{sourceId:source,ids:[wall,'myocardium'],atlasWall:true,inwardWinding:true,front:true}));}return;}
  const id=m.userData.heartId;if(!id)return;const vs=vertices(m),ix=triangles(m),g=geometry(ix.flatMap(i=>vs[i].p.toArray()),ix.flatMap(i=>vs[i].n.toArray())),isCoronary=m.userData.ids?.includes('coronary');
  if(['arteries','aorta'].includes(id)){g.dispose();const section=split(m,p=>rootCut(id,p));add(section.back,id,m.material.color,{sourceId:source,ids:m.userData.ids,atlasRootWindow:true,inwardWinding:m.userData.inwardWinding});fronts.push(add(section.front,id,m.material.color,{sourceId:source,ids:m.userData.ids,atlasRootWindow:true,front:true,inwardWinding:m.userData.inwardWinding}));}else{const out=add(g,id,m.material.color,{sourceId:source,ids:m.userData.ids,externalDetail:isCoronary,inwardWinding:m.userData.inwardWinding});if(isCoronary)out.visible=false;}
 });
 // Actual cavity boundaries define endocardium and holes in the myocardial section.
 for(const m of parts.filter(m=>chamberIds.has(m.userData.heartId))){const id=m.userData.heartId,section=split(m,cuts[id]);add(section.back,id,colour.lining,{sourceId:m.userData.sourceId,atlasCavity:true,selectionSurface:true,inwardWinding:true,endocardium:true});fronts.push(add(section.front,id,colour.lining,{sourceId:m.userData.sourceId,atlasCavity:true,selectionSurface:true,inwardWinding:true,front:true}));}
 for(const [id,segments] of Object.entries(sectionSegments)){const cap=sectionCaps(segments);if(id==='wall'){const before=meshes.length;ventricularWall(cap.geometry,{sectionCap:true});caps.push(...meshes.slice(before));}else caps.push(add(cap.geometry,id,colour.cut,{ids:[id,'myocardium'],sectionCap:true}));root.userData[id+'Section']={loops:cap.loops,triangles:cap.triangles};}
 // Keep the source leaflet-and-cord topology. The lower support region is labelled
 // as chordae; it is a teaching selection boundary, not a clinical segmentation.
 const cordLevels={FJ2420:-.055,FJ2421:-.08,FJ2432:-.09,FJ2433:-.22,FJ2436:-.025};
 for(const m of parts.filter(m=>!chamberIds.has(m.userData.heartId))){const id=m.userData.heartId,source=m.userData.sourceId;if(['aortic','pulmonary'].includes(id)){const cut=split(m,p=>rootCut(id,p));add(cut.back,id,colour.valve,{sourceId:source,sourceName:m.userData.sourceName,atlasValve:id});fronts.push(add(cut.front,id,colour.valve,{sourceId:source,sourceName:m.userData.sourceName,atlasValve:id,front:true}));continue;}const tissue=split(m,ventricularCut);
  for(const [g,front] of [[tissue.back,false],[tissue.front,true]]){
   const positions=g.attributes.position,groups={leaf:[],cord:[]};
   for(let i=0;i<positions.count;i+=3){const y=(positions.getY(i)+positions.getY(i+1)+positions.getY(i+2))/3;(AV.has(id)&&y<cordLevels[source]?groups.cord:groups.leaf).push(i,i+1,i+2);}
   for(const [kind,indices] of Object.entries(groups)){if(!indices.length)continue;const part=kind==='cord'?'chordae':id,ids=part==='papillary'?['papillary',papillaryChamber[source]]:[part],piece=add(subset(g,indices),part,part==='papillary'?colour.muscle:kind==='cord'?colour.cord:colour.valve,{ids,sourceId:source,sourceName:m.userData.sourceName,atlasValve:AV.has(id)?id:undefined,atlasPapillary:id==='papillary',atlasCord:kind==='cord',front});if(front)fronts.push(piece);}
   g.dispose();
  }
 }
 // Localised educational annotations follow the actual endocardial surfaces.
 function wallPatch(id,chamber,center,radius){const source=meshes.find(m=>m.userData.atlasCavity&&m.userData.heartId===chamber&&!m.userData.front),g=source.geometry,p=g.attributes.position,selected=[],rest=[];for(let i=0;i<p.count;i+=3){const q=new THREE.Vector3();for(let j=0;j<3;j++)q.add(new THREE.Vector3().fromBufferAttribute(p,i+j));(q.multiplyScalar(1/3).distanceTo(V(center))<radius?selected:rest).push(i,i+1,i+2);}if(selected.length){add(subset(g,selected),id,colour.lining,{ids:[id,chamber,...(id==='fossa'?['atrialseptum']:[])],teachingRegion:true,inwardWinding:true});source.geometry=subset(g,rest);g.dispose();}}
 wallPatch('fossa','ra',[-.12,.25,-.10],.095);wallPatch('atrialseptum','ra',[-.11,.16,-.05],.22);
 const marker=(id,points,r,color,extra={})=>{const unique=points.map(V).filter((p,i,a)=>!i||p.distanceToSquared(a[i-1])>1e-10);if(unique.length<2)unique.push(unique[0].clone().add(new THREE.Vector3(0,.003,0)));return add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(unique),40,r,8,false),id,color,extra);};
 for(const id of ['rv','lv'])for(let j=0;j<10;j++){const target=id==='rv'?[.08+j*.022,-.34+j*.009,.40]:[.31+j*.023,-.26+j*.008,-.20];const points=[];for(let k=0;k<6;k++){const p=V(target);p.y+=k*.022;p.x+=Math.sin(k*.9+j)*.012;points.push(nearest(cavityPoints[id],p).point.toArray());}marker('trabeculae',points,.0035,colour.wall,{ids:['trabeculae',id],teachingOverlay:true});}
 for(let j=0;j<7;j++){const points=[];for(let k=0;k<6;k++)points.push(nearest(cavityPoints.ra,V([-.34+j*.014,.05+k*.055,-.08])).point.toArray());marker('pectinate',points,.003,colour.cut,{ids:['pectinate','ra'],teachingOverlay:true});}
 const electricalPath={san:[[-.22,.43,-.02],[-.24,.40,-.03]],avnode:[[-.11,.02,-.03],[-.08,-.01,-.02]],his:[[-.09,.01,-.03],[.03,-.08,.06],[.13,-.21,.12],[.35,-.37,.18]]};
 for(const [id,points] of Object.entries(electricalPath))electrical.push(marker(id,points,.008,colour.gold,{teachingOverlay:true}));
 for(const id of ['rv','lv'])for(let j=0;j<5;j++){const points=[];for(let k=0;k<6;k++)points.push(nearest(cavityPoints[id],V([.12+j*.07,-.37+k*.055,id==='rv'?.35:-.1])).point.toArray());electrical.push(marker('purkinje',points,.003,colour.gold,{teachingOverlay:true}));}
 const anchors={};root.updateMatrixWorld(true);for(const id of new Set(meshes.flatMap(m=>m.userData.ids))){const box=new THREE.Box3();for(const m of meshes)if(m.userData.ids.includes(id)&&!m.userData.front)box.expandByObject(m);if(!box.isEmpty())anchors[id]=box.getCenter(new THREE.Vector3());}
 let opened=true;
 function setOpened(open){opened=open;fronts.forEach(m=>m.visible=!open);caps.forEach(m=>m.visible=open);meshes.filter(m=>m.userData.externalDetail).forEach(m=>m.visible=!open);}
 function setSelection(id){meshes.filter(m=>m.userData.selectionSurface).forEach(m=>{m.visible=m.userData.ids.includes(id)&&(!m.userData.front||!opened);});}
 function setElectrical(on){electrical.forEach(m=>m.visible=on);}
 const geometryFinite=meshes.every(m=>['position','normal'].every(key=>Array.from(m.geometry.attributes[key].array).every(Number.isFinite)));
 setOpened(true);setElectrical(false);meshes.filter(m=>m.userData.selectionSurface).forEach(m=>m.visible=false);
 return{root,meshes,textures:[],anchors,setOpened,setElectrical,setSelection,setPhase(){},valves:[],anatomy:{kind:'registered-atlas',revision:'atlas-interior-1',sourceParts:20,patientLeftPositiveX:true,leafletCounts:{mitral:2,tricuspid:3,aortic:3,pulmonary:3},referencePose:true,geometryFinite,sections:root.userData}};
}
