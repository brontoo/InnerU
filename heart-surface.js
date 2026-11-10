import * as THREE from './assets/three/three.module.js';

// Source IDs come from the embedded English names in the licensed BodyParts3D OBJ
// exports. Region splits reuse the original atrial wall vertices, never a fake pouch.
const sourceParts={FJ3413:'aorta',FJ3411:'aorta',FJ3417:'aorta',FJ3479:'aorta',FJ3645:'superior',FJ3441:'inferior',FJ2966:'arteries',FJ2924:'arteries',FJ3019:'arteries',FJ2925:'veins',FJ2933:'veins',FJ2944:'veins',FJ2950:'veins',FJ3020:'veins',FJ3040:'veins',FJ2631:'lad',FJ2723:'rca',FJ2737:'lca',FJ2655:'sinus',FJ2657:'greatvein'};
const coronary=new Set(['lca','rca','lad','lcx','greatvein','sinus']);
// The original export has inward winding. Cull the opposite face for its
// outline so the highlight cannot paint over the natural tissue colour.
function setPart(mesh,id,sourceId){mesh.userData={...mesh.userData,heartId:id,ids:id?[id,...(coronary.has(id)?['coronary']:[])]:[],surfaceSource:sourceId,inwardWinding:/^FJ/.test(sourceId)};}
function cutInferiorCava(mesh,limit=-.58){
 const original=mesh.geometry;if(!original.attributes.normal)original.computeVertexNormals();const p=original.attributes.position,n=original.attributes.normal,indices=original.index?.array||Array.from({length:p.count},(_,i)=>i),positions=[],normals=[];
 const point=i=>{const position=new THREE.Vector3().fromBufferAttribute(p,i),normal=new THREE.Vector3().fromBufferAttribute(n,i);return{position,normal,y:position.clone().applyMatrix4(mesh.matrixWorld).y};};
 for(let i=0;i<indices.length;i+=3){
  const tri=[point(indices[i]),point(indices[i+1]),point(indices[i+2])],polygon=[];
  for(let j=0;j<3;j++){
   const a=tri[j],b=tri[(j+1)%3],inside=a.y>=limit,next=b.y>=limit;
   if(inside)polygon.push(a);
   if(inside!==next){const t=(limit-a.y)/(b.y-a.y);polygon.push({position:a.position.clone().lerp(b.position,t),normal:a.normal.clone().lerp(b.normal,t).normalize(),y:limit});}
  }
  for(let j=1;j<polygon.length-1;j++)for(const v of [polygon[0],polygon[j],polygon[j+1]]){positions.push(...v.position.toArray());normals.push(...v.normal.toArray());}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));mesh.geometry=geometry;original.dispose();mesh.userData.shortCavalStub=true;
}
function auricleRegion(mesh,id,predicate){
 const geometry=mesh.geometry,positions=geometry.attributes.position,index=geometry.index.array,region=[],remaining=[],point=new THREE.Vector3();
 for(let i=0;i<index.length;i+=3){point.set(0,0,0);for(let j=0;j<3;j++)point.add(new THREE.Vector3().fromBufferAttribute(positions,index[i+j]).applyMatrix4(mesh.matrixWorld));point.multiplyScalar(1/3);(predicate(point)?region:remaining).push(index[i],index[i+1],index[i+2]);}
 if(!region.length||!remaining.length)throw new Error('Atrial appendage region is unavailable in this surface export.');
 const part=mesh.clone();const subset=geometry.clone();subset.setIndex(region);part.geometry=subset.toNonIndexed();subset.dispose();part.name=id;setPart(part,id,mesh.userData.surfaceSource);part.userData.atrialAppendageRegion=true;
 geometry.setIndex(remaining);mesh.parent.add(part);return part;
}
export function prepareHeartSurface(surface,details){
 surface.updateMatrixWorld(true);const base=[];surface.traverse(m=>{if(m.isMesh)base.push(m);});
 for(const mesh of base){
  if(!mesh.geometry.attributes.normal)mesh.geometry.computeVertexNormals();
  const fid=mesh.name.match(/FJ\d+/)?.[0];setPart(mesh,sourceParts[fid]||null,fid);
  // FJ6164 is a second export of the same LAD trunk (same source BP20058).
  // Removing its duplicate faces prevents z-fighting and double highlighting.
  if(fid==='FJ6164'){mesh.visible=false;mesh.userData.duplicateSurface=true;mesh.raycast=()=>{};continue;}
  if(fid==='FJ3441')cutInferiorCava(mesh);
  if(fid==='FJ2439')auricleRegion(mesh,'rauricle',p=>p.z>.12&&p.y>.08);
  if(fid==='FJ2438')auricleRegion(mesh,'lauricle',p=>p.z>.08&&p.x>.30&&p.y>.13);
 }
 surface.add(details);
 const branch=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[.065,.84,-.18],[.075,1.03,-.15],[.08,1.20,-.145]].map(p=>new THREE.Vector3(...p))),30,.037,18,false),new THREE.MeshBasicMaterial());
 branch.name='Left common carotid proximal branch — teaching reconstruction';setPart(branch,'aorta','original-carotid-branch');branch.userData.reconstructedCarotid=true;surface.add(branch);
 const oldMaterials=new Set();surface.traverse(mesh=>{
  if(!mesh.isMesh)return;if(!mesh.geometry.attributes.normal)mesh.geometry.computeVertexNormals();const id=mesh.userData.heartId;oldMaterials.add(mesh.material);
  const venous=['superior','inferior','arteries','greatvein','sinus'].includes(id),oxygenated=['aorta','veins','lca','rca','lad','lcx'].includes(id);
  mesh.material=new THREE.MeshPhysicalMaterial({color:venous?0x477f99:oxygenated?0xb74751:0xb76659,roughness:.46,metalness:0,clearcoat:.16,clearcoatRoughness:.6,side:THREE.DoubleSide});
 });oldMaterials.forEach(m=>m.dispose());
 surface.updateMatrixWorld(true);const anchors={};
 for(const id of [...new Set([...Object.values(sourceParts),'coronary','lcx','greatvein','rauricle','lauricle'])]){
  if(!id)continue;const bounds=new THREE.Box3();surface.traverse(m=>{if(m.isMesh&&m.visible&&m.userData.ids?.includes(id))bounds.expandByObject(m);});
  if(!bounds.isEmpty())anchors[id]=bounds.getCenter(new THREE.Vector3()).toArray();
 }
 surface.userData.heartAnchors=anchors;
 return surface;
}
