/* Original anatomy-informed hairy-skin cutaway; local geometry and textures. */
import * as THREE from "./assets/three/three.module.js";

export const SKIN_STRUCTURES = [
  { name: "Epidermis", location: "Outer skin", color: "#edb19b", job: "A thin, renewing epithelial barrier. Keratin helps limit water loss and protect the surface. The epidermis contains no blood vessels.", find: "Look for the thin surface layer above the wavy junction.", lesson: 2 },
  { name: "Dermis", location: "Under the epidermis", color: "#c87d73", job: "A thicker connective-tissue layer. Collagen and elastin support the skin; vessels, nerves, hair follicles and glands run through it.", find: "Follow the dermal papillae up toward the epidermis.", lesson: 2 },
  { name: "Subcutaneous layer", location: "Beneath the skin proper", color: "#dcb46e", job: "Fat and connective tissue cushion the body, store energy and reduce heat loss. This layer lies beneath the epidermis and dermis.", find: "Examine the lobules of fat beneath the dermis.", lesson: 2 },
  { name: "Hair follicle", location: "Dermis into upper subcutis", color: "#9b614c", job: "A follicle surrounds the hair root. Dividing cells near the bulb form the hair; a vascular dermal papilla supports growth at its base.", find: "Follow the shaft down to the bulb and its small dermal papilla.", lesson: 3 },
  { name: "Sweat gland", location: "Deep dermis", color: "#e6c1a7", job: "This eccrine gland has a coiled secretory tube and a duct opening directly onto the skin surface. Evaporation of sweat removes heat.", find: "Trace the coil into its continuous duct and the surface pore.", lesson: 4 },
  { name: "Sebaceous gland", location: "Beside the upper follicle", color: "#d5b98c", job: "Lobules release sebum into the hair follicle through a short duct. Sebum helps lubricate skin and hair.", find: "Find the grape-like lobules connected to the follicle.", lesson: 3 },
  { name: "Arrector pili", location: "Follicle to superficial dermis", color: "#b66561", job: "This small smooth muscle pulls the hair upright when it contracts, producing goose bumps. It is not the main mechanism of heat production in humans.", find: "Find the oblique muscle joining the follicle to the upper dermis.", lesson: 3 },
  { name: "Blood vessels", location: "Dermis and subcutaneous tissue", color: "#b95860", job: "Vessels supply the dermis and support the avascular epidermis by diffusion. Capillary loops reach the dermal papillae. Widening skin vessels helps transfer heat toward the surface.", find: "Trace the red arterial and blue venous routes into the fine loops. Both routes carry red blood; these colors distinguish vessel types.", lesson: 4 },
  { name: "Nerves", location: "Branching through the dermis", color: "#d7bc65", job: "Sensory fibers carry information about touch, pressure, temperature and pain toward the nervous system. Fine free nerve endings extend toward the surface.", find: "Follow the golden branches from the receptors into the deeper nerve.", lesson: 5 },
  { name: "Touch receptors", location: "Around the hair follicle", color: "#dfc89c", job: "A hair-root nerve plexus detects movement of the hair. Its sensory endings lie around the follicle in the dermis. This is a touch-receptor example appropriate to hairy skin.", find: "Look for the fine golden sensory endings around the upper hair root.", lesson: 5 },
  { name: "Pressure receptor", location: "Deep dermis / subcutis", color: "#d6bc87", job: "A lamellated (Pacinian) corpuscle responds especially to vibration and changes in pressure. Its concentric layers surround a sensory nerve ending.", find: "Examine the onion-like layers around its central nerve fiber.", lesson: 5 },
];

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = { epidermis: 0xe3a48c, dermis: 0xc78677, fat: 0xe0ba77, hair: 0x493128, sheath: 0xb16d60, gland: 0xdcb895, sweat: 0xe6c3ad, muscle: 0xb9605c, artery: 0xb84955, vein: 0x50778b, nerve: 0xd8b86b, receptor: 0xdcc299 };

function tissueTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = kind === "epidermis" ? "#e4aa94" : kind === "dermis" ? "#ce8f80" : "#dfba79";
  ctx.fillRect(0, 0, 512, 512);
  let seed = kind === "epidermis" ? 83 : 147;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 1700; i++) {
    const x = rnd() * 512, y = rnd() * 512;
    ctx.strokeStyle = i % 3 === 0 ? "rgba(255,240,223,.19)" : "rgba(128,74,63,.09)";
    ctx.lineWidth = .5 + rnd();
    ctx.beginPath();
    if (kind === "epidermis") ctx.ellipse(x, y, 1 + rnd() * 4, 1 + rnd() * 2, rnd() * 3, 0, Math.PI * 2);
    else { ctx.moveTo(x, y); ctx.bezierCurveTo(x + 9, y - 8, x + 18, y + 7, x + 28 + rnd() * 22, y - 3); }
    ctx.stroke();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}

// Closed tissue slabs have a common undulating epidermal–dermal junction.
function slab(top, bottom, front = .46, back = -.64) {
  const positions = [], uv = [], indices = [], nx = 72, nz = 24;
  const surface = (fn, reverse) => {
    const base = positions.length / 3;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = -1.5 + 3 * i / nx, z = back + (front - back) * j / nz;
      positions.push(x, fn(x, z), z); uv.push(i / nx, j / nz);
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = base + j * (nx + 1) + i, b = a + 1, d = a + nx + 1, c = d + 1;
      indices.push(...(reverse ? [a,b,d,b,c,d] : [a,d,b,b,d,c]));
    }
  };
  surface(top, false); surface(bottom, true);
  const wall = (count, point, reverse) => {
    const base = positions.length / 3;
    for (let i = 0; i <= count; i++) {
      const [x,z] = point(i / count);
      positions.push(x, bottom(x,z), z, x, top(x,z), z);
      uv.push(i / count, 0, i / count, 1);
    }
    for (let i = 0; i < count; i++) {
      const a = base + 2 * i;
      indices.push(...(reverse ? [a,a+1,a+2,a+1,a+3,a+2] : [a,a+2,a+1,a+1,a+2,a+3]));
    }
  };
  wall(nx,t=>[-1.5+3*t,front],false);
  wall(nx,t=>[-1.5+3*t,back],true);
  wall(nz,t=>[-1.5,back+(front-back)*t],false);
  wall(nz,t=>[1.5,back+(front-back)*t],true);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

// An open follicular sheath exposes the root instead of hiding it in a cylinder.
function follicleSheath(curve) {
  const pos=[], uv=[], idx=[], rings=70, sides=28;
  for(let i=0;i<=rings;i++) {
    const t=i/rings, point=curve.getPointAt(t);
    const tangent=curve.getTangentAt(t), lateral=V(tangent.y,-tangent.x,0).normalize();
    const radius=.105 + .115*Math.exp(-Math.pow((t-.08)/.15,2));
    for(let j=0;j<=sides;j++) {
      const a=Math.PI/2+1.10+(Math.PI*2-2.20)*j/sides;
      const v=point.clone().addScaledVector(lateral,Math.cos(a)*radius).addScaledVector(V(0,0,1),Math.sin(a)*radius);
      pos.push(v.x,v.y,v.z); uv.push(j/sides,t);
      if(i<rings&&j<sides){const k=i*(sides+1)+j;idx.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}

export function createSkinModel() {
  const group = new THREE.Group(), meshes = [], textures = [];
  const layers = { epidermis:new THREE.Group(), dermis:new THREE.Group(), fat:new THREE.Group() };
  Object.values(layers).forEach(layer=>group.add(layer));
  const materials = new Map();
  function material(color, kind="organic") {
    const key=`${color instanceof THREE.Color ? color.getHex() : color}:${kind}`;
    if(!materials.has(key)) {
      const m=new THREE.MeshPhysicalMaterial({color,roughness:kind==="hair"?.34:kind==="tissue"?.69:.48,metalness:0,clearcoat:kind==="tissue"?.08:.22,clearcoatRoughness:.6,side:THREE.DoubleSide});
      if(["epidermis","dermis"].includes(kind)) {const map=tissueTexture(kind);textures.push(map);m.map=map;m.bumpMap=map;m.bumpScale=.018;m.color.setHex(0xffffff);m.roughness=.72;}
      materials.set(key,m);
    }
    return materials.get(key).clone();
  }
  function mesh(geometry, color, part, parent=layers.dermis, kind="organic") {
    const m=new THREE.Mesh(geometry,material(color,kind));
    m.name=part;m.userData.structure=part;m.userData.baseColor=m.material.color.clone();
    m.userData.baseClearcoat=m.material.clearcoat;
    parent.add(m);meshes.push(m);return m;
  }
  function ball(p,scale,color,part,parent=layers.dermis) {
    const m=mesh(new THREE.SphereGeometry(1,24,16),color,part,parent);m.position.copy(p);m.scale.set(...scale);return m;
  }
  function tube(points,radius,color,part,parent=layers.dermis,segments=70) {
    const curve=points instanceof THREE.Curve?points:new THREE.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p));
    const m=mesh(new THREE.TubeGeometry(curve,segments,radius,10,false),color,part,parent);
    return {mesh:m,curve};
  }
  const junction=(x,z)=>1.08+.035*Math.sin(x*16)+.014*Math.cos(z*14+x*3);
  const surface=(x,z)=>1.27+.023*Math.sin(x*2.7)*Math.cos(z*4);
  mesh(slab(surface,junction,.65),C.epidermis,"Epidermis",layers.epidermis,"epidermis");
  mesh(slab((x,z)=>surface(x,z)+.002,(x,z)=>surface(x,z)-.022,.651),0xc89078,"Epidermis",layers.epidermis,"tissue");
  mesh(slab(junction,()=>-.59),C.dermis,"Dermis",layers.dermis,"dermis");
  mesh(slab(()=>-.59,()=>-1.24,.4),C.fat,"Subcutaneous layer",layers.fat,"tissue");

  // Fat lobules are rounded but vary in size and are held in a connective matrix.
  for(let row=0;row<3;row++)for(let col=0;col<12;col++) {
    const phase=col*1.713+row*2.4;
    const x=-1.37+col*.25+(row%2)*.045,y=-.73-row*.20+.024*Math.sin(phase),z=.45+.024*Math.cos(phase);
    const r=.115+.012*Math.sin(phase);
    const m=ball(V(x,y,z),[r,r*.87,r*.87],new THREE.Color(C.fat).offsetHSL(0,0,[-.035,-.01,.012,.034][(col+row)%4]),"Subcutaneous layer",layers.fat);
    m.rotation.z=.2*Math.sin(phase);
  }
  for(let i=0;i<13;i++) tube([[-1.45+i*.24,-1.19,.49],[-1.44+i*.24,-.97,.52],[-1.43+i*.24,-.7,.50]],.007,0xe8d8b0,"Subcutaneous layer",layers.fat,12);

  const follicleCurve=new THREE.CatmullRomCurve3([V(-.55,-.69,.63),V(-.67,-.38,.62),V(-.72,.22,.59),V(-.81,.78,.56),V(-.86,1.32,.54)]);
  mesh(follicleSheath(follicleCurve),C.sheath,"Hair follicle");
  tube([[-.57,-.57,.69],[-.65,-.22,.68],[-.74,.38,.66],[-.85,1.24,.65],[-.9,1.61,.62],[-1.04,1.99,.61]],.052,C.hair,"Hair follicle",layers.dermis,95);
  const bulb=ball(V(-.56,-.57,.66),[.14,.21,.105],0x5b3d30,"Hair follicle");bulb.rotation.z=-.25;
  ball(V(-.55,-.70,.75),[.044,.093,.04],0xd59583,"Hair follicle");
  tube([[-.73,-.9,.64],[-.62,-.78,.66],[-.55,-.68,.75]],.011,C.artery,"Blood vessels",layers.dermis,18);
  // Small rear hairs provide surface context without crowding the cut plane.
  for(const [x,z] of [[.63,-.2],[1.12,-.38],[-.25,-.39]]) tube([[x,1.23,z],[x+.03,1.53,z],[x+.09,1.75,z-.02]],.013,C.hair,"Hair follicle",layers.dermis,24);

  const sebaceousCenter=V(-.43,.64,.65);
  for(let i=0;i<11;i++) {
    const a=i*2.399;
    ball(sebaceousCenter.clone().add(V(.12*Math.cos(a),.12*Math.sin(a),.038*Math.sin(i*1.4))),[.071,.075,.062],new THREE.Color(C.gland).offsetHSL(0,0,[-.02,0,.02][i%3]),"Sebaceous gland");
  }
  tube([[-.4,.59,.67],[-.55,.58,.65],[-.73,.56,.65]],.032,C.gland,"Sebaceous gland",layers.dermis,24);
  const muscle=tube([[-.68,.32,.64],[-.29,.63,.66],[.12,1.02,.62]],.048,C.muscle,"Arrector pili",layers.dermis,45);
  for(let i=0;i<8;i++) {
    const d=(i-3.5)*.011;
    tube([[-.67+d,.32,.686],[-.28+d,.63,.706],[.11+d,1.00,.665]],.0025,0xe5a49b,"Arrector pili",layers.dermis,26);
  }

  const coilPoints=[];
  for(let i=0;i<=220;i++) {
    const a=i/220*Math.PI*2;
    coilPoints.push(V(.46+.16*Math.cos(a*7)+.028*Math.sin(a*15),-.30+.12*Math.sin(a*5),.67+.095*Math.sin(a*7)));
  }
  const coil=tube(coilPoints,.035,C.sweat,"Sweat gland",layers.dermis,250);
  const coilEnd=coilPoints.at(-1);
  const duct=tube([coilEnd,V(.60,-.08,.67),V(.54,.28,.68),V(.62,.67,.68),V(.56,.99,.65),V(.55,1.29,.60)],.029,C.sweat,"Sweat gland",layers.dermis,90);
  const pore=mesh(new THREE.TorusGeometry(.033,.009,8,24),0xd1987a,"Sweat gland",layers.epidermis);pore.rotation.x=Math.PI/2;pore.position.set(.55,surface(.55,.60)+.008,.60);
  const sweatPath=new THREE.CurvePath();sweatPath.add(coil.curve);sweatPath.add(duct.curve);

  const artery=tube([[-1.43,-.80,.71],[-.72,-.77,.71],[0,-.81,.71],[.75,-.79,.71],[1.43,-.75,.71]],.044,C.artery,"Blood vessels",layers.dermis,90);
  const vein=tube([[1.43,-.99,.70],[.75,-.97,.70],[0,-.97,.70],[-.72,-.95,.70],[-1.43,-.98,.70]],.051,C.vein,"Blood vessels",layers.dermis,90);
  for(const x of [-1.28,-.98,-.12,.23,.92,1.27]) {
    const y=junction(x,.48)-.026;
    tube([[x-.10,-.79,.64],[x-.14,-.32,.63],[x-.11,.28,.57],[x-.06,.72,.54],[x-.041,y-.04,.51],[x,y,.51]],.013,C.artery,"Blood vessels",layers.dermis,70);
    tube([[x,y,.51],[x+.045,y-.035,.51],[x+.065,.70,.54],[x+.10,.25,.57],[x+.12,-.40,.63],[x+.12,-.97,.65]],.014,C.vein,"Blood vessels",layers.dermis,70);
  }

  const nerveTrunk=tube([[-1.42,-1.09,.72],[-.8,-1.02,.72],[0,-1.04,.72],[.8,-1.04,.72],[1.42,-1.07,.72]],.023,C.nerve,"Nerves",layers.dermis,75);
  for(const [x,tip] of [[-1.13,.98],[-.24,1.01],[.16,.84],[.93,.94],[1.27,.88]]) {
    tube([[x,-1.04,.69],[x+.07,-.6,.69],[x-.07,-.1,.66],[x+.06,.45,.59],[x,tip,.53]],.012,C.nerve,"Nerves",layers.dermis,65);
    for(const side of [-1,1])tube([[x+.02,.5,.59],[x+side*.14,.72,.57],[x+side*.21,.95,.54]],.006,C.nerve,"Nerves",layers.dermis,28);
  }
  const plexus=[];
  for(let i=0;i<=70;i++){const a=i/70*Math.PI*4;plexus.push(V(-.74+.13*Math.cos(a),.32+i/70*.25,.62+.13*Math.sin(a)));}
  tube(plexus,.007,C.nerve,"Touch receptors",layers.dermis,90);
  for(let i=0;i<7;i++) {
    const a=.2+Math.PI*.85*i/6;
    ball(V(-.74+.135*Math.cos(a),.43,.62+.135*Math.sin(a)),[.009,.067,.009],C.receptor,"Touch receptors");
  }
  const touchPath=tube([[-.72,.43,.77],[-.55,.26,.75],[-.36,-.05,.73],[-.23,-.45,.73],[-.21,-1.04,.73],[.65,-1.04,.73],[1.4,-1.07,.73]],.011,C.nerve,"Nerves",layers.dermis,80).curve;
  const pressureCenter=V(1.05,-.57,.71);
  const capsule=ball(pressureCenter,[.22,.32,.045],C.receptor,"Pressure receptor");capsule.material.roughness=.56;
  for(let i=0;i<9;i++) {
    const a=(i+1)/10;
    const ring=mesh(new THREE.TorusGeometry(1,.025,6,64),i%2?0xe9d2ac:0xb59667,"Pressure receptor");
    ring.position.copy(pressureCenter).add(V(0,0,.057));ring.scale.set(.21*a,.305*a,.12);
  }
  tube([[1.05,-.86,.75],[1.05,-.68,.77],[1.05,-.53,.77]],.012,C.nerve,"Pressure receptor",layers.dermis,25);
  tube([[1.05,-1.04,.72],[1.05,-.95,.74],[1.05,-.86,.75]],.012,C.nerve,"Nerves",layers.dermis,18);

  // Fine fibers on the cut face give the dermis a connective, non-plastic surface.
  for(let i=0;i<65;i++) {
    const x=-1.40+((i*1.618)%2.45),y=-.48+((i*.217)%1.39),tilt=.075*Math.sin(i*2.4);
    tube([[x,y,.474],[x+.14,y+tilt,.478],[x+.31,y+.035,.476],[x+.44,y+tilt*.8,.474]],.0021,0xe3b1a0,"Dermis",layers.dermis,15);
  }
  // Batch equal tissue materials while retaining one identifiable structure per mesh.
  // This reduces draw calls on mobile without replacing anatomical geometry.
  const batches=new Map();
  meshes.forEach(m=>{m.updateMatrix();const key=[m.parent.uuid,m.userData.structure,m.material.color.getHex(),m.material.roughness,m.material.clearcoat,m.material.map?.uuid||""].join(":");if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m);});
  const batched=[];
  batches.forEach(batch=>{
    if(batch.length===1){batched.push(batch[0]);return;}
    const geometries=batch.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);return g;});
    const geometry=new THREE.BufferGeometry();
    for(const [name,size] of [["position",3],["normal",3],["uv",2]]){
      const count=geometries.reduce((n,g)=>n+g.getAttribute(name).array.length,0),data=new Float32Array(count);let offset=0;
      geometries.forEach(g=>{const a=g.getAttribute(name).array;data.set(a,offset);offset+=a.length;});geometry.setAttribute(name,new THREE.BufferAttribute(data,size));
    }
    const first=batch[0],merged=new THREE.Mesh(geometry,first.material.clone());merged.name=first.name;merged.userData={...first.userData};first.parent.add(merged);batched.push(merged);
    batch.forEach(m=>{m.removeFromParent();m.geometry.dispose();m.material.dispose();});geometries.forEach(g=>g.dispose());
  });
  meshes.splice(0,meshes.length,...batched);
  group.updateMatrixWorld(true);
  return {
    group,meshes,layers,textures,
    paths:{sweat:sweatPath,touch:touchPath,blood:artery.curve,returnBlood:vein.curve},
    anatomy:{epidermisAvascular:true,junctionRange:[1.031,1.129],capillaryTips:1.102,follicleBulb:[-.55,-.69,.63],sebaceousDuctToFollicle:true,eccrineDuctToSurface:true,sweatPore:[.55,1.29,.60],fatBelowDermis:true,pressureReceptor:[1.05,-.57,.71]},
    setSeparation(value){layers.epidermis.position.y=value*.62;layers.fat.position.y=-value*.44;group.updateMatrixWorld(true);},
    dispose(){meshes.forEach(m=>{m.geometry.dispose();m.material.dispose();});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());}
  };
}
