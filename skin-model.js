/* Original anatomy-informed hairy-skin cutaway; local geometry and textures. */
import * as THREE from "./assets/three/three.module.js";

export const SKIN_STRUCTURES = [
  { name: "Epidermis", location: "Outer skin", color: "#dfcfab", job: "A thin, avascular epithelial barrier. In this hairy-skin example, cells pass through basal, spinous, granular and cornified layers. Flattened keratin-rich surface cells help limit water loss.", find: "Use the cell lens to compare the basal row at the wavy junction with flatter cells near the surface. Stratum lucidum belongs to thick glabrous skin and is not shown here.", lesson: 2 },
  { name: "Dermis", location: "Papillary & reticular connective tissue", color: "#cfb7a7", job: "The dermis contains collagen and elastic fibers, fibroblasts, resident immune cells, blood and lymphatic vessels, sensory nerves, hair follicles, sebaceous and sweat glands, and arrector pili muscles. Papillary tissue supports the epidermis; deeper reticular tissue supplies strength and elasticity.", find: "Embedded anatomy stays visible in this view. Adjust Tissue matrix to see through the connective tissue, then choose a dermal component to isolate it.", lesson: 2 },
  { name: "Subcutaneous layer", location: "Beneath the skin proper", color: "#dcb46e", job: "Fat and connective tissue cushion the body, store energy and reduce heat loss. This layer lies beneath the epidermis and dermis.", find: "Examine the lobules of fat beneath the dermis.", lesson: 2 },
  { name: "Hair follicle", location: "Dermis into upper subcutis", color: "#9b8068", job: "The hair root lies within inner and outer root sheaths, a glassy basement membrane and a connective-tissue sheath. Near the bulb, matrix cells surround the vascular dermal papilla and produce the growing hair.", find: "The follicle lens exposes nested sheath walls and their cells. Follow the darker shaft down into the bulb and its dermal papilla.", lesson: 3 },
  { name: "Sweat gland", location: "Deep dermis", color: "#e6c1a7", job: "This eccrine gland has a coiled secretory tube and a duct opening directly onto the skin surface. Evaporation of sweat removes heat.", find: "Trace the coil into its continuous duct and the surface pore.", lesson: 4 },
  { name: "Sebaceous gland", location: "Beside the upper follicle", color: "#d5b98c", job: "Lobules release sebum into the hair follicle through a short duct. Sebum helps lubricate skin and hair.", find: "Find the grape-like lobules connected to the follicle.", lesson: 3 },
  { name: "Arrector pili", location: "Follicle to superficial dermis", color: "#b66561", job: "This small smooth muscle pulls the hair upright when it contracts, producing goose bumps. It is not the main mechanism of heat production in humans.", find: "Find the oblique muscle joining the follicle to the upper dermis.", lesson: 3 },
  { name: "Blood vessels", location: "Dermis and subcutaneous tissue", color: "#b95860", job: "Vessels supply the dermis and support the avascular epidermis by diffusion. Capillary loops reach the dermal papillae. Widening skin vessels helps transfer heat toward the surface.", find: "Trace the red arterial and blue venous routes into the fine loops. Both routes carry red blood; these colors distinguish vessel types.", lesson: 4 },
  { name: "Nerves", location: "Branching through the dermis", color: "#d7bc65", job: "Sensory fibers carry information about touch, pressure, temperature and pain toward the nervous system. Fine free nerve endings extend toward the surface.", find: "Follow the golden branches from the receptors into the deeper nerve.", lesson: 5 },
  { name: "Touch receptors", location: "Around the hair follicle", color: "#dfc89c", job: "A hair-root nerve plexus detects movement of the hair. Its sensory endings lie around the follicle in the dermis. This is a touch-receptor example appropriate to hairy skin.", find: "Look for the fine golden sensory endings around the upper hair root.", lesson: 5 },
  { name: "Pressure receptor", location: "Deep dermis / subcutis", color: "#d6bc87", job: "A lamellated (Pacinian) corpuscle responds especially to vibration and changes in pressure. Its concentric layers surround a sensory nerve ending.", find: "Examine the onion-like layers around its central nerve fiber.", lesson: 5 },
];

export const DERMIS_PARTS = [
  {name:"Papillary dermis",group:"Regions",location:"Superficial dermis",job:"Loose connective tissue forms dermal papillae that interlock with the epidermis. Fine collagen, elastic fibers and capillary loops support this region.",find:"Follow a capillary loop into a papilla. The overlying epidermis has no blood vessels."},
  {name:"Reticular dermis",group:"Regions",location:"Deeper dermis",job:"Dense irregular connective tissue supplies tensile strength and elasticity. Thick collagen bundles surround follicles, glands, larger vessels and nerves.",find:"Rotate the cutaway to see bundles crossing in depth, rather than lying on a single surface."},
  {name:"Collagen bundles",group:"Matrix & cells",location:"Dermal extracellular matrix",job:"Interwoven collagen bundles resist tension in several directions. Type I collagen predominates in the reticular dermis; finer fibers support the papillary region.",find:"Inspect the broad, pale bundles and their finer parallel fibrils."},
  {name:"Elastic fibers",group:"Matrix & cells",location:"Between collagen bundles",job:"A branching elastic-fiber network helps stretched skin recoil. It is finer than the main collagen bundles.",find:"Compare the slender tan elastic branches with the broader ivory collagen bundles."},
  {name:"Fibroblasts",group:"Matrix & cells",location:"Within dermal connective tissue",job:"Spindle-shaped fibroblasts produce and maintain collagen, elastic-fiber components and ground substance. They also participate in wound repair.",find:"Find the elongated cell bodies and darker nuclei aligned with nearby fibers. Cells are enlarged for inspection."},
  {name:"Mast cells",group:"Matrix & cells",location:"Near small dermal vessels",job:"Resident mast cells contain granules with mediators such as histamine. They participate in inflammation and allergic responses.",find:"Look for the rounded, granular cells near the vascular network. Their appearance is illustrative."},
  {name:"Macrophages",group:"Matrix & cells",location:"Within the dermal matrix",job:"Resident macrophages engulf debris and microbes and help coordinate tissue defense and repair.",find:"Inspect the irregular cell outline and short processes among the connective fibers."},
  {name:"Capillary loops",group:"Vessels & sensation",location:"Within dermal papillae",job:"Fine blood-vessel loops approach the epidermis while staying inside the dermis. Nutrients diffuse from these vessels toward the avascular epidermis.",find:"Trace a red ascending limb over a papillary loop into a blue returning limb."},
  {name:"Vascular plexuses",group:"Vessels & sensation",location:"Superficial and deep dermis",job:"Connected arterial and venous networks supply the dermis and its appendages. A superficial plexus feeds papillary capillaries; deeper vessels supply the reticular dermis and connect with subcutaneous routes.",find:"Compare the network beneath the papillae with the vessels near the dermis–subcutis boundary. Red and blue distinguish vessel routes; both carry red blood."},
  {name:"Lymphatic vessels",group:"Vessels & sensation",location:"Within the dermis",job:"Blind-ended initial lymphatics take up excess tissue fluid. Larger collecting vessels carry lymph onward and contain valves that help limit backflow.",find:"Follow the pale green blind-ended branches into their collecting route. These carry lymph rather than blood."},
  {name:"Free nerve endings",group:"Vessels & sensation",location:"Superficial dermis toward the epidermis",job:"Fine unencapsulated sensory endings help detect pain, temperature and itch. Some endings extend into the epidermis; their deeper fibers travel through the dermis.",find:"Look for the fine branching gold terminals near the surface, separate from the encapsulated pressure receptor."},
];

export const DERMIS_EMBEDDED = ["Hair follicle","Sweat gland","Sebaceous gland","Arrector pili","Blood vessels","Nerves","Touch receptors","Pressure receptor"];

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = { epidermis: 0xded1ac, dermis: 0xc9c5b9, fat: 0xe9dfad, hair: 0x665d4b, sheath: 0xc5b69a, gland: 0xe0cb88, sweat: 0xa7bbc3, muscle: 0xae7066, artery: 0xb44650, vein: 0x4f7598, nerve: 0xd4ba6c, receptor: 0xdbca9c };

export const skinJunction=(x,z)=>1.075+.075*Math.cos(x*16.4)+.012*Math.cos(z*11+x*2);
const skinSurface=(x,z)=>1.285+.013*Math.sin(x*3.1)*Math.cos(z*4.2);

function tissueTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = kind === "epidermis" ? "#d7c8a8" : kind === "surface" ? "#e7d6ba" : "#c9c6bc";
  ctx.fillRect(0, 0, 1024, 1024);
  let seed = kind === "epidermis" ? 83 : 147;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  if(kind === "epidermis") {
    // Polygonal cell boundaries; cells flatten toward the keratinized surface.
    for(let row=0;row<22;row++)for(let col=0;col<31;col++){
      const x=col*35+(row%2)*17,y=row*48;
      ctx.fillStyle=["#e7dbbc","#ded0ac","#d3c19c","#ede2c7"][(row+col)%4];
      ctx.strokeStyle="#a99b79";ctx.lineWidth=1.3;
      ctx.beginPath();ctx.moveTo(x+4,y+5);ctx.lineTo(x+26,y+2);ctx.lineTo(x+37,y+23);ctx.lineTo(x+28,y+43);ctx.lineTo(x+6,y+46);ctx.lineTo(x-4,y+23);ctx.closePath();ctx.fill();ctx.stroke();
      if(row>6){ctx.fillStyle="rgba(103,100,88,.28)";ctx.beginPath();ctx.ellipse(x+16,y+24,3.5,4.5,.3,0,Math.PI*2);ctx.fill();}
    }
  } else if(kind === "surface") {
    for(let row=-1;row<15;row++)for(let col=-1;col<15;col++){
      const x=col*78+(row%2)*36,y=row*77;
      ctx.strokeStyle="rgba(140,115,82,.22)";ctx.lineWidth=1.8;
      ctx.beginPath();ctx.moveTo(x+4,y+13);ctx.lineTo(x+53,y+1);ctx.lineTo(x+82,y+33);ctx.lineTo(x+66,y+70);ctx.lineTo(x+15,y+79);ctx.lineTo(x-8,y+43);ctx.closePath();ctx.stroke();
    }
    for(let i=0;i<3500;i++){const x=rnd()*1024,y=rnd()*1024;ctx.fillStyle=i%4?"rgba(255,251,231,.27)":"rgba(115,89,60,.18)";ctx.fillRect(x,y,.5+rnd()*2,.5+rnd()*2);}
  } else {
    for(let i=0;i<2400;i++){
      const x=rnd()*1024,y=rnd()*1024,angle=rnd()*Math.PI, length=25+rnd()*120;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=i%4?"rgba(253,248,225,.24)":"rgba(118,135,131,.13)";ctx.lineWidth=.6+rnd()*2;
      ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(length*.3,-8,length*.6,9,length,0);ctx.stroke();ctx.restore();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}

// Closed tissue slabs have a common undulating epidermal–dermal junction.
function slab(top, bottom, front = .46, back = -.92) {
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
function follicleSheath(curve, scale=1) {
  const pos=[], uv=[], idx=[], rings=70, sides=28;
  for(let i=0;i<=rings;i++) {
    const t=i/rings, point=curve.getPointAt(t);
    const tangent=curve.getTangentAt(t), lateral=V(tangent.y,-tangent.x,0).normalize();
    const radius=scale*(.077 + .092*Math.exp(-Math.pow((t-.08)/.15,2)));
    for(let j=0;j<=sides;j++) {
      const a=Math.PI/2+1.10+(Math.PI*2-2.20)*j/sides;
      const v=point.clone().addScaledVector(lateral,Math.cos(a)*radius).addScaledVector(V(0,0,1),Math.sin(a)*radius);
      pos.push(v.x,v.y,v.z); uv.push(j/sides,t);
      if(i<rings&&j<sides){const k=i*(sides+1)+j;idx.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}

// Beveled polygonal cells give cut faces a packed cellular mosaic, rather than
// a row of spheres. The shallow version supplies real epidermal relief.
function cellGeometry(depth=.12, variation=0) {
  const shape=new THREE.Shape(),v=variation*.018;
  const points=[[-.96,-.34],[-.51-v,-.92],[.49,-.89+v],[.97,.02],[.53+v,.91],[-.52,.87-v]];
  shape.moveTo((points[5][0]+points[0][0])/2,(points[5][1]+points[0][1])/2);
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];shape.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);}shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelSegments:1,steps:1,curveSegments:3});
}

export function createSkinModel() {
  const group = new THREE.Group(), meshes = [], textures = [];
  const layers = { epidermis:new THREE.Group(), dermis:new THREE.Group(), fat:new THREE.Group() };
  Object.values(layers).forEach(layer=>group.add(layer));
  const materials = new Map();
  const componentFocus={};
  function material(color, kind="organic") {
    const key=`${color instanceof THREE.Color ? color.getHex() : color}:${kind}`;
    if(!materials.has(key)) {
      const m=new THREE.MeshPhysicalMaterial({color,roughness:kind==="hair"?.34:kind==="tissue"?.69:.48,metalness:0,clearcoat:kind==="tissue"?.08:.22,clearcoatRoughness:.6,side:THREE.DoubleSide});
      if(["epidermis","dermis","surface"].includes(kind)) {const map=tissueTexture(kind);textures.push(map);m.map=map;m.bumpMap=map;m.bumpScale=kind==="surface"?.018:.012;m.color.setHex(0xffffff);m.roughness=.76;}
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
  function component(m,name,region="reticular",shell=false){m.userData.dermisPart=name;m.userData.dermisRegion=region;m.userData.tissueShell=shell;if(["Fibroblasts","Mast cells","Macrophages"].includes(name)&&!componentFocus[name])componentFocus[name]=m.position.toArray();return m;}
  function ball(p,scale,color,part,parent=layers.dermis,detail=16) {
    const m=mesh(new THREE.SphereGeometry(1,detail,Math.max(4,Math.floor(detail*.65))),color,part,parent);m.position.copy(p);m.scale.set(...scale);return m;
  }
  function tube(points,radius,color,part,parent=layers.dermis,segments=70) {
    const curve=points instanceof THREE.Curve?points:new THREE.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p));
    const m=mesh(new THREE.TubeGeometry(curve,segments,radius,radius<=.009?6:10,false),color,part,parent);
    return {mesh:m,curve};
  }
  const junction=skinJunction, surface=skinSurface;
  mesh(slab((x,z)=>surface(x,z)-.025,(x,z)=>junction(x,z)+.028,.65),C.epidermis,"Epidermis",layers.epidermis,"epidermis");
  mesh(slab((x,z)=>surface(x,z)+.002,(x,z)=>surface(x,z)-.025,.653),C.epidermis,"Epidermis",layers.epidermis,"surface");
  mesh(slab((x,z)=>junction(x,z)+.028,junction,.657),0xa7997f,"Epidermis",layers.epidermis,"tissue");
  component(mesh(slab(junction,()=>.77),0xd8bdb1,"Dermis",layers.dermis,"dermis"),"Papillary dermis","papillary",true);
  component(mesh(slab(()=>.77,()=>-.59),0xd0b3a7,"Dermis",layers.dermis,"dermis"),"Reticular dermis","reticular",true);
  mesh(slab(()=>-.59,()=>-1.26,.84),C.fat,"Subcutaneous layer",layers.fat,"tissue");

  // Actual cellular relief on the front and side of the viable epidermis.
  const cellColors=[0xe0d2af,0xe8dcbd,0xd8c9a7,0xece0c2];
  for(let col=0;col<56;col++)for(let row=0;row<5;row++){
    const x=-1.47+col*.053+(row%2)*.009,bottom=junction(x,.66),height=surface(x,.66)-bottom-.035;
    const fraction=.13+row*.17,y=bottom+height*fraction;
    const cell=mesh(cellGeometry(.12,(col+row)%4),cellColors[(col+row)%4],"Epidermis",layers.epidermis,"tissue");cell.position.set(x,y,.655);cell.scale.set(.025,height*.084,.018);
    if(row<3&&(col+row)%7===0)ball(V(x+.003,y,.659),[.004,.006,.0015],0xa39b84,"Epidermis",layers.epidermis,6);
  }
  for(let col=0;col<29;col++)for(let row=0;row<5;row++){
    const z=-.89+col*.053,bottom=junction(1.5,z),height=surface(1.5,z)-bottom-.035;
    const cell=mesh(cellGeometry(.12,(col+row)%4),cellColors[(col+row)%4],"Epidermis",layers.epidermis,"tissue");cell.position.set(1.503,bottom+height*(.13+row*.17),z);cell.rotation.y=Math.PI/2;cell.scale.set(.025,height*.084,.018);
  }
  // Packed adipocytes fill a three-dimensional cushion, including the terrace
  // exposed in front of the recessed dermis and the visible side cut face.
  for(let depth=0;depth<8;depth++)for(let row=0;row<3;row++)for(let col=0;col<14;col++){
    const phase=col*1.713+row*2.4+depth*.73;
    const x=-1.43+col*.22+(row%2)*.025,y=-.706-row*.211+.006*Math.sin(phase),z=-.80+depth*.235;
    const r=.105+.004*Math.sin(phase);
    const m=mesh(cellGeometry(1.9,(col+row+depth)%4),new THREE.Color(C.fat).offsetHSL(0,0,[-.025,0,.023,.04][(col+row+depth)%4]),"Subcutaneous layer",layers.fat,"tissue");m.position.set(x,y,z-.10);m.scale.set(r*1.08,r*1.08,r*1.03);
    m.rotation.z=.18*Math.sin(phase);
    if(depth===7&&(col+row*2)%8===0)ball(V(x+.054,y+.061,z-.10+r*1.03*1.945+.001),[.010,.012,.003],0x989c99,"Subcutaneous layer",layers.fat,8);
  }
  for(let depth=0;depth<8;depth++)for(let row=0;row<3;row++){
    const cell=mesh(cellGeometry(.12,(row+depth)%4),C.fat,"Subcutaneous layer",layers.fat,"tissue");cell.position.set(1.54,-.706-row*.211,-.80+depth*.235);cell.rotation.y=Math.PI/2;cell.scale.set(.108,.101,.02);
  }
  for(let i=0;i<14;i++)tube([[-1.48+i*.22,-1.24,.91],[-1.45+i*.22,-1.02,.925],[-1.44+i*.22,-.63,.92]],.004,0xc0b58e,"Subcutaneous layer",layers.fat,14);

  const follicleCurve=new THREE.CatmullRomCurve3([V(-.55,-.69,.63),V(-.67,-.38,.62),V(-.72,.22,.59),V(-.81,.78,.56),V(-.86,1.32,.54)]);
  // Open walls expose the connective sheath, glassy basement membrane,
  // outer root sheath and inner root sheath.
  mesh(follicleSheath(follicleCurve,1.26),0xab9e85,"Hair follicle");
  mesh(follicleSheath(follicleCurve,1.12),0xe3d3ae,"Hair follicle");
  mesh(follicleSheath(follicleCurve,.94),0xb6a482,"Hair follicle");
  mesh(follicleSheath(follicleCurve,.78),0xe4d7b7,"Hair follicle");
  for(let row=0;row<39;row++)for(const side of [-1,1]){
    const t=.06+row*.022,point=follicleCurve.getPointAt(t),tangent=follicleCurve.getTangentAt(t),lateral=V(tangent.y,-tangent.x,0).normalize();
    const r=1.12*(.077+.092*Math.exp(-Math.pow((t-.08)/.15,2)));
    const cell=ball(point.clone().addScaledVector(lateral,side*r*.91).add(V(0,0,.040)),[.012,.021,.010],row%2?0xe3d3ae:0xb6a482,"Hair follicle",layers.dermis,8);cell.rotation.z=-.12;
  }
  tube([[-.57,-.57,.69],[-.65,-.22,.68],[-.74,.38,.66],[-.85,1.24,.65],[-.9,1.61,.62],[-1.04,1.99,.61]],.033,C.hair,"Hair follicle",layers.dermis,110);
  const bulb=ball(V(-.56,-.57,.66),[.105,.17,.082],0x766c53,"Hair follicle");bulb.rotation.z=-.25;
  ball(V(-.55,-.70,.75),[.044,.093,.04],0xd59583,"Hair follicle");
  for(let i=0;i<15;i++){const a=Math.PI*.05+i/14*Math.PI*.90;ball(V(-.56+.092*Math.cos(a),-.66+.12*Math.sin(a),.745),[.013,.017,.009],0xc6b898,"Hair follicle",layers.dermis,8);}
  tube([[-.73,-.79,1.01],[-.62,-.73,.88],[-.55,-.68,.75]],.011,C.artery,"Blood vessels",layers.dermis,24);
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

  const artery=tube([[-1.43,-.80,1.01],[-.72,-.77,1.01],[0,-.81,1.01],[.75,-.79,1.01],[1.43,-.75,1.01]],.033,C.artery,"Blood vessels",layers.dermis,90);
  const vein=tube([[1.43,-.99,1.01],[.75,-.97,1.01],[0,-.97,1.01],[-.72,-.95,1.01],[-1.43,-.98,1.01]],.038,C.vein,"Blood vessels",layers.dermis,90);
  component(artery.mesh,"Vascular plexuses");component(vein.mesh,"Vascular plexuses");
  const superficialY=x=>.72+.025*Math.sin(x*2.4);
  const plexusX=[-1.43,-1.05,-.65,-.2,.3,.8,1.43];
  tube(plexusX.map(x=>[x,superficialY(x),.57]),.018,C.artery,"Blood vessels",layers.dermis,100);
  tube(plexusX.map(x=>[x,superficialY(x)-.065,.56]),.019,C.vein,"Blood vessels",layers.dermis,100);
  for(const x of [-1.20,-.38,.43,1.24]){
    tube([[x-.11,-.79,1.01],[x-.16,-.40,.65],[x+.05,.02,.62],[x-.04,.43,.59],[x,superficialY(x),.57]],.017,C.artery,"Blood vessels",layers.dermis,65);
    tube([[x+.07,superficialY(x+.07)-.065,.56],[x+.16,.38,.59],[x+.12,-.12,.62],[x+.20,-.57,.73],[x+.11,-.97,1.01]],.020,C.vein,"Blood vessels",layers.dermis,65);
  }
  for(const x of [-1.149,-.766,-.383,0,.383,.766,1.149]){
    const y=junction(x,.52)-.029;
    component(tube([[x-.055,superficialY(x-.055),.57],[x-.058,.90,.54],[x-.035,y-.025,.52],[x,y,.52]],.008,C.artery,"Blood vessels",layers.dermis,42).mesh,"Capillary loops","papillary");
    component(tube([[x,y,.52],[x+.035,y-.025,.52],[x+.055,.88,.54],[x+.055,superficialY(x+.055)-.065,.56]],.009,C.vein,"Blood vessels",layers.dermis,42).mesh,"Capillary loops","papillary");
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

  const hash=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
  const dermalTube=(name,points,radius,color,segments=28,region="reticular",parent="Dermis")=>{
    const result=tube(points,radius,color,parent,layers.dermis,segments);component(result.mesh,name,region);return result;
  };
  // Dense irregular connective tissue: thick, crimped collagen bundles cross
  // in depth. Each bundle carries fine parallel fibrils, not a drawn surface line.
  for(let i=0;i<62;i++){
    const x=-1.43+hash(i+41)*1.90,y=-.42+hash(i+113)*1.03,z=i<30?.50:-.73+hash(i+331)*1.12;
    const rise=(hash(i+71)-.5)*.55,span=.55+hash(i+17)*.40;
    const points=[[x,y,z],[x+span*.32,y+rise*.55,z+.045],[x+span*.66,y-rise*.22,z-.015],[Math.min(1.47,x+span),y+rise*.7,z+.025]];
    dermalTube("Collagen bundles",points,.010,i%2?0xe6d3b8:0xd6bba3,24);
    for(const offset of [-.009,.009])dermalTube("Collagen bundles",points.map(p=>[p[0],p[1]+offset,p[2]+.009]),.0022,0xf1e2c7,22);
  }
  for(let i=0;i<54;i++){
    const z=-.88+hash(i+7)*.96,y=-.49+hash(i+83)*1.27,rise=(hash(i+219)-.5)*.42;
    dermalTube("Collagen bundles",[[1.506,y,z],[1.512,y+rise*.45,z+.12],[1.510,y+rise*.7,z+.26],[1.506,Math.max(-.55,Math.min(.94,y+rise)),Math.min(.45,z+.43)]],.004,0xe6d3b8,18);
  }
  for(let i=0;i<28;i++){
    const x=-1.42+hash(i+21)*2.2,y=.81+hash(i+45)*.10,z=.48;
    dermalTube("Collagen bundles",[[x,y,z],[x+.12,y+.035,z+.01],[x+.27,y-.018,z+.012],[Math.min(1.48,x+.42),y+.025,z]],.0035,0xf1e2c7,20,"papillary");
  }
  // A finer branching elastic network winds between the collagen bundles.
  for(let i=0;i<30;i++){
    const x=-1.33+hash(i+411)*2.05,y=-.40+hash(i+511)*1.03,z=i<18?.55:-.50+hash(i+219)*.8;
    const endY=Math.min(.93,y+.17+hash(i+331)*.19);
    dermalTube("Elastic fibers",[[x,y,z],[x+.12,y+.09,z+.015],[x+.23,y+.07,z+.025],[x+.36,endY,z]],.004,0x9e806b,27);
    dermalTube("Elastic fibers",[[x+.12,y+.09,z+.015],[x+.05,y+.19,z+.02],[x-.04,Math.min(.96,y+.29),z]],.003,0x9e806b,20);
  }
  // Fibroblasts are spindle-shaped; immune-cell examples are enlarged.
  for(let i=0;i<17;i++){
    const p=V(-1.22+hash(i+61)*2.37,-.36+hash(i+151)*1.00,i<12?.57:-.55+hash(i+103)*.75);
    const cell=component(ball(p,[.045,.013,.011],0xc29b9b,"Dermis",layers.dermis,12),"Fibroblasts");cell.rotation.z=(hash(i+3)-.5)*.9;
    component(ball(p.clone().add(V(0,0,.011)),[.014,.009,.004],0x795b73,"Dermis",layers.dermis,10),"Fibroblasts");
    for(const side of [-1,1])dermalTube("Fibroblasts",[p.clone().add(V(side*.026,0,0)),p.clone().add(V(side*.065,side*.01,0)),p.clone().add(V(side*.098,side*.025,0))],.0022,0xc29b9b,14);
  }
  for(let i=0;i<6;i++){
    const p=V(-1.08+hash(i+11)*2.1,-.22+hash(i+76)*.80,.60);
    component(ball(p,[.028,.026,.019],0xb08b9f,"Dermis",layers.dermis,12),"Mast cells");
    for(let j=0;j<8;j++){const a=j*2.4;component(ball(p.clone().add(V(.018*Math.cos(a),.018*Math.sin(a),.015)),[.004,.004,.003],0x775c79,"Dermis",layers.dermis,6),"Mast cells");}
  }
  for(let i=0;i<5;i++){
    const p=V(-1.20+hash(i+31)*2.35,-.34+hash(i+133)*.91,.61);
    component(ball(p,[.034,.025,.014],0xb2a1a0,"Dermis",layers.dermis,12),"Macrophages");
    component(ball(p.clone().add(V(-.007,0,.013)),[.012,.014,.004],0x6f6674,"Dermis",layers.dermis,8),"Macrophages");
    for(let j=0;j<4;j++){const a=j*Math.PI/2+.3;dermalTube("Macrophages",[p,p.clone().add(V(.045*Math.cos(a),.035*Math.sin(a),0)),p.clone().add(V(.063*Math.cos(a+.3),.048*Math.sin(a+.3),0))],.003,0xb2a1a0,12);}
  }
  // Blind-ended lymphatic branches converge into a collecting route.
  for(const x of [-.10,.55,1.18]){
    dermalTube("Lymphatic vessels",[[x,.91,.59],[x+.06,.64,.60],[x-.08,.27,.61],[.48,-.38,.63]],.012,0x829d79,55);
    component(ball(V(x,.91,.59),[.016,.020,.015],0x829d79,"Dermis",layers.dermis,10),"Lymphatic vessels","papillary");
  }
  dermalTube("Lymphatic vessels",[[.48,-.38,.63],[.77,-.46,.64],[1.10,-.44,.65],[1.46,-.46,.65]],.021,0x829d79,52);
  for(const x of [.88,1.17])for(const side of [-1,1]){
    dermalTube("Lymphatic vessels",[[x-.015,-.44+side*.017,.657],[x+.015,-.44,.672]],.0035,0xc0d0ad,8);
  }
  // Free sensory endings are distinct from hair-root and lamellated receptors.
  for(let i=0;i<8;i++){
    const x=-1.23+i*.32;
    for(const side of [-1,1])dermalTube("Free nerve endings",[[x,.48,.59],[x+side*.035,.72,.60],[x+side*.065,.88,.59],[x+side*.10,Math.min(.99,junction(x+side*.10,.59)+.005),.58]],.0035,C.nerve,30,"papillary","Nerves");
  }
  // Add a true deep dermal plexus and a connected network on the side cut face.
  for(const [y,color,r] of [[-.46,C.artery,.018],[-.53,C.vein,.021]]){
    dermalTube("Vascular plexuses",[[-1.44,y,.62],[-.65,y+.02,.61],[.15,y-.01,.62],[.87,y+.015,.62],[1.46,y,.62]],r,color,70,"reticular","Blood vessels");
    dermalTube("Vascular plexuses",[[1.46,y,.62],[1.52,y+.12,.30],[1.52,y+.44,-.19],[1.52,.68,-.82]],r*.7,color,58,"reticular","Blood vessels");
  }
  for(const z of [-.69,-.20,.29]){
    const y=junction(1.52,z)-.036;
    dermalTube("Capillary loops",[[1.52,.68,z-.035],[1.52,.88,z-.035],[1.52,y,z],[1.52,.87,z+.035],[1.52,.66,z+.035]],.007,C.artery,40,"papillary","Blood vessels");
  }
  for(let i=0;i<9;i++){
    const z=-.83+i*.16;
    tube([[-1.48,surface(-1.48,z)+.004,z],[-.70,surface(-.7,z+.04)+.004,z+.04],[.18,surface(.18,z-.03)+.004,z-.03],[1.48,surface(1.48,z)+.004,z]],.0018,0xc7b798,"Epidermis",layers.epidermis,42);
  }
  meshes.forEach(m=>{if(m.userData.structure==="Blood vessels"&&!m.userData.dermisPart){m.userData.dermisPart="Vascular plexuses";m.userData.dermisRegion="reticular";}});
  // Batch equal tissue materials while retaining one identifiable structure per mesh.
  // This reduces draw calls on mobile without replacing anatomical geometry.
  const batches=new Map();
  meshes.forEach(m=>{m.updateMatrix();const key=[m.parent.uuid,m.userData.structure,m.userData.dermisPart||"",m.userData.dermisRegion||"",!!m.userData.tissueShell,m.material.color.getHex(),m.material.roughness,m.material.clearcoat,m.material.map?.uuid||""].join(":");if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m);});
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
    group,meshes,layers,textures,componentFocus,
    paths:{sweat:sweatPath,touch:touchPath,blood:artery.curve,returnBlood:vein.curve},
    anatomy:{epidermisAvascular:true,junctionRange:[.988,1.162],follicleBulb:[-.55,-.69,.63],sebaceousDuctToFollicle:true,eccrineDuctToSurface:true,sweatPore:[.55,1.29,.60],fatBelowDermis:true,pressureReceptor:[1.05,-.57,.71],epidermalStrata:4,follicularWallLayers:4,cellularRelief:true,adiposeDepthRows:8},
    setSeparation(value){layers.epidermis.position.y=value*.62;layers.fat.position.y=-value*.44;group.updateMatrixWorld(true);},
    dispose(){meshes.forEach(m=>{m.geometry.dispose();m.material.dispose();});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());}
  };
}
