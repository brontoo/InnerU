import * as THREE from './assets/three/three.module.js';
import {GLTFLoader} from './assets/three/GLTFLoader.js';

// Atlas surface vertices: medial proximal radius and the olecranon of the ulna.
export const ARM_INSERTIONS={radius:[-.01345637,-.07737353,.00493],ulna:[-.02206633,.03037177,-.04186]};
const origins={biceps:new THREE.Vector3(-.025,.575,.035),triceps:new THREE.Vector3(-.04,.50,-.075)};
const V=a=>new THREE.Vector3(...a);
function tissueMaterial(part){
  const m=new THREE.MeshPhysicalMaterial({color:part==='biceps'?0xd98f78:0xc48179,roughness:.56,metalness:0,clearcoat:.12,clearcoatRoughness:.65,side:THREE.DoubleSide});
  m.onBeforeCompile=s=>{
    s.vertexShader='attribute float armRestY; varying float restY; varying vec3 tissueP;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrestY=armRestY;tissueP=position;');
    s.fragmentShader='varying float restY; varying vec3 tissueP;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float phase=tissueP.x*1100.0+tissueP.z*820.0+sin(tissueP.y*35.0)*1.8;
      float fade=1.0-smoothstep(.5,3.0,fwidth(phase));
      diffuseColor.rgb*=1.0-.10*fade*pow(.5+.5*sin(phase),9.0);
      float tendon=max(smoothstep(.46,.565,restY),1.0-smoothstep(.055,.115,restY));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.91,.84,.68),tendon*.91);
    `);
  };m.customProgramCacheKey=()=>part;return m;
}
export async function createArmModel(){
  const {scene}=await new GLTFLoader().loadAsync(new URL('./assets/muscular/movement-arm.glb',import.meta.url).href);
  const group=new THREE.Group(),forearm=new THREE.Group();group.add(forearm);
  const bones=[],muscles=[],tendons=[],meshes=[],rest=new Map();
  const boneMaterial=new THREE.MeshStandardMaterial({color:0xeadfc4,roughness:.66,metalness:0,side:THREE.DoubleSide});
  scene.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const part=mesh.userData.part||(/biceps/i.test(mesh.name)?'biceps':/triceps/i.test(mesh.name)?'triceps':'bones');
    const material=part==='bones'?boneMaterial.clone():tissueMaterial(part);
    mesh.material.dispose();mesh.material=material;mesh.userData.part=part;mesh.userData.baseColor=material.color.clone();
    if(part==='bones')bones.push(mesh);else{
      const p=mesh.geometry.attributes.position,positions=new Float32Array(p.array);rest.set(mesh,{positions});
      mesh.geometry.setAttribute('armRestY',new THREE.Float32BufferAttribute(Array.from({length:p.count},(_,i)=>p.getY(i)),1));
      muscles.push(mesh);
    }
    meshes.push(mesh);
  });
  for(const mesh of meshes){if(mesh.userData.forearm||/radius|ulna/i.test(mesh.name))forearm.add(mesh);else group.add(mesh);}
  boneMaterial.dispose();scene.clear();
  function tendon(name,part){const mesh=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshPhysicalMaterial({color:0xeee1bc,roughness:.64,side:THREE.DoubleSide}));mesh.name=name;mesh.userData.part='tendons';mesh.userData.muscle=part;group.add(mesh);tendons.push(mesh);meshes.push(mesh);return mesh;}
  const biTendon=tendon('Biceps tendon → radial tuberosity','biceps'),triTendon=tendon('Triceps tendon → olecranon of ulna','triceps');
  const markers={};
  for(const [id,p] of Object.entries(ARM_INSERTIONS)){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.008,18,14),new THREE.MeshStandardMaterial({color:0xcfaa4d,roughness:.55}));mesh.position.copy(V(p));mesh.userData.part='tendons';mesh.name=id+' insertion marker';forearm.add(mesh);markers[id]=mesh;meshes.push(mesh);
  }
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),.09,0xe1b553,.023,.012);group.add(arrow);
  const arc=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x589d98,transparent:true,opacity:.65}));group.add(arc);
  const beaconArc=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x4b9982,transparent:true,opacity:.85}));beaconArc.name='Target angle arc';group.add(beaconArc);
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.011,20,14),new THREE.MeshStandardMaterial({color:0x6fa68b,emissive:0x345f47,emissiveIntensity:.25,roughness:.45}));beacon.name='Target angle beacon';group.add(beacon);
  function tendonPaths(ends){
    const biStart=ends.biceps.clone().add(origins.biceps.clone().sub(ends.biceps).normalize().multiplyScalar(.18));
    const biMid=biStart.clone().lerp(ends.biceps,.5).add(new THREE.Vector3(0,0,.003));
    const biCurve=new THREE.QuadraticBezierCurve3(biStart,biMid,ends.biceps);
    const posterior=new THREE.Vector3(-.017,-.022,-.082),toward=origins.triceps.clone().sub(posterior).normalize();
    let low=0,high=.30,triStart,triCurve;
    // Keep a constant tendon length while routing it behind the elbow.
    for(let i=0;i<11;i++){const d=(low+high)/2;triStart=posterior.clone().addScaledVector(toward,d);triCurve=new THREE.QuadraticBezierCurve3(triStart,posterior,ends.triceps);if(triCurve.getLength()>.16)high=d;else low=d;}
    return{starts:{biceps:biStart,triceps:triStart},curves:{biceps:biCurve,triceps:triCurve}};
  }
  const resting=tendonPaths({biceps:V(ARM_INSERTIONS.radius),triceps:V(ARM_INSERTIONS.ulna)});
  let angle=35,phase='idle',part='all',bicepsLength=0,tricepsLength=0,tendonLengths={};
  const rotation=new THREE.Quaternion(),axis=new THREE.Vector3(1,0,0),point=new THREE.Vector3(),radial=new THREE.Vector3();
  function update(pose){
    angle=THREE.MathUtils.clamp(pose.angle,0,130);phase=pose.phase||'idle';part=pose.part||'all';rotation.setFromAxisAngle(axis,-THREE.MathUtils.degToRad(angle));forearm.quaternion.copy(rotation);
    const endpoints={biceps:V(ARM_INSERTIONS.radius).applyQuaternion(rotation),triceps:V(ARM_INSERTIONS.ulna).applyQuaternion(rotation)};
    const paths=tendonPaths(endpoints);
    for(const mesh of muscles){
      const id=mesh.userData.part,O=origins[id],I=resting.starts[id],end=paths.starts[id],restAxis=I.clone().sub(O),newAxis=end.clone().sub(O),l0=restAxis.length(),length=newAxis.length();
      if(id==='biceps')bicepsLength=length;else tricepsLength=length;
      const q=new THREE.Quaternion().setFromUnitVectors(restAxis.clone().normalize(),newAxis.clone().normalize()),radiusScale=Math.sqrt(l0/length),a=mesh.geometry.attributes.position,source=rest.get(mesh).positions;
      for(let i=0;i<a.count;i++){
        point.fromArray(source,i*3);const t=THREE.MathUtils.clamp(point.clone().sub(O).dot(restAxis)/(l0*l0),0,1);
        radial.copy(point).sub(O).addScaledVector(restAxis,-t).applyQuaternion(q).multiplyScalar(1+(radiusScale-1)*Math.sin(Math.PI*t));
        const moved=O.clone().addScaledVector(newAxis,t).add(radial),w=THREE.MathUtils.smoothstep(t,.03,.18);point.lerp(moved,w);a.setXYZ(i,point.x,point.y,point.z);
      }
      a.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
      const active=phase==='flex'?id==='biceps':phase==='extend'?id==='triceps':false;
      mesh.material.color.copy(mesh.userData.baseColor);mesh.material.emissive.setHex(active?0x59351d:0);mesh.material.emissiveIntensity=active?.18:0;
    }
    const {biceps:biStart,triceps:triStart}=paths.starts,{biceps:biCurve,triceps:triCurve}=paths.curves;
    tendonLengths={biceps:biCurve.getLength(),triceps:triCurve.getLength()};
    for(const [mesh,curve,radius] of [[biTendon,biCurve,.0065],[triTendon,triCurve,.008]]){mesh.geometry.dispose();mesh.geometry=new THREE.TubeGeometry(curve,24,radius,8,false);}
    for(const mesh of meshes){
      const id=mesh.userData.part,active=part==='all'||id===part;
      mesh.material.opacity=active?1:id==='bones'?.40:id==='tendons'?.32:.10;mesh.material.transparent=mesh.material.opacity<1;mesh.material.depthWrite=mesh.material.opacity>=1;mesh.renderOrder=active?3:0;
      if(id==='tendons')mesh.material.color.setHex(part==='tendons'?0xe7bb4e:0xeee1bc);
      if(id==='bones')mesh.material.color.copy(mesh.userData.baseColor);
    }
    const moving=phase!=='idle';arrow.visible=moving;
    if(moving){const id=phase==='flex'?'biceps':'triceps',start=endpoints[id],toward=id==='biceps'?biStart:triStart;arrow.position.copy(start);arrow.setDirection(toward.clone().sub(start).normalize());arrow.setLength(.085,.022,.012);}
    const points=[];for(let i=0;i<=40;i++){const t=THREE.MathUtils.degToRad(angle)*i/40;points.push(new THREE.Vector3(-.085,-.13*Math.cos(t),.13*Math.sin(t)));}
    arc.geometry.dispose();arc.geometry=new THREE.BufferGeometry().setFromPoints(points);
    const target=pose.target;beacon.visible=beaconArc.visible=!!target;
    if(target){const pts=[];for(let i=0;i<=24;i++){const a=THREE.MathUtils.degToRad(THREE.MathUtils.lerp(target[0],target[1],i/24));pts.push(new THREE.Vector3(-.09,-.17*Math.cos(a),.17*Math.sin(a)));}beaconArc.geometry.dispose();beaconArc.geometry=new THREE.BufferGeometry().setFromPoints(pts);const a=THREE.MathUtils.degToRad((target[0]+target[1])/2);beacon.position.set(-.09,-.17*Math.cos(a),.17*Math.sin(a));beacon.material.color.setHex(angle>=target[0]&&angle<=target[1]?0xe0ba58:0x6fa68b);}
    group.updateMatrixWorld(true);
  }
  update({angle,phase,part});
  return{group,forearm,bones,muscles,tendons,meshes,markers,update,
    state(){return{angle,phase,part,bicepsLength,tricepsLength,tendonLengths,forearmRotation:forearm.rotation.x,insertions:{radius:V(ARM_INSERTIONS.radius).applyQuaternion(rotation).toArray(),ulna:V(ARM_INSERTIONS.ulna).applyQuaternion(rotation).toArray()}};},
    dispose(){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();},
  };
}
