import * as THREE from './assets/three/three.module.js';

/* Patient-left +X, superior +Y, anterior +Z. Original teaching reconstruction.
   Internal geometry is intentionally independent of the credited surface scan. */
export const HEART_STRUCTURES = {
  ra:{title:'Right atrium',group:'chambers',point:[-.65,.65,-.16],text:'Receives systemic venous blood through the superior and inferior venae cavae and coronary sinus. Blood passes through the tricuspid valve into the right ventricle.',look:'Find the thin atrial wall, pectinate ridges and the fossa ovalis on the septal side.'},
  rv:{title:'Right ventricle',group:'chambers',point:[-.48,-.42,-.12],text:'Pumps blood through the pulmonary valve into the pulmonary trunk and lungs. Its wall is thinner than the left ventricular wall because pulmonary resistance is lower.',look:'Follow the trabeculae, papillary muscles and chordae toward the tricuspid valve. The outflow tract leads upward to the pulmonary valve.'},
  la:{title:'Left atrium',group:'chambers',point:[.51,.69,-.39],text:'Receives oxygen-rich blood through four pulmonary veins. Blood passes through the mitral valve into the left ventricle. The left atrium lies mainly posteriorly.',look:'The pulmonary veins enter behind the atrium; its main internal wall is relatively smooth.'},
  lv:{title:'Left ventricle',group:'chambers',point:[.52,-.58,-.21],text:'Pumps blood through the aortic valve into the systemic circulation. Its thick myocardium produces higher pressure than the right ventricle.',look:'Compare the thick wall and long cavity with the right ventricle. The left ventricle forms the apex.'},
  tricuspid:{title:'Tricuspid valve',group:'valves',point:[-.55,.21,.01],text:'The right atrioventricular valve has three main leaflets. It opens during ventricular filling and closes as ventricular pressure rises, preventing backflow into the right atrium.',look:'Chordae connect the leaflets to papillary muscles. These supports prevent prolapse; they do not pull the valve open.'},
  mitral:{title:'Mitral valve',group:'valves',point:[.48,.24,-.08],text:'The left atrioventricular valve has anterior and posterior leaflets. It allows left atrium → left ventricle flow and closes during ventricular contraction.',look:'Two main papillary-muscle groups support both leaflets through branching chordae tendineae.'},
  pulmonary:{title:'Pulmonary valve',group:'valves',point:[-.23,.47,.15],text:'Three semilunar cusps guard the right ventricular outflow into the pulmonary trunk. They open when ventricular pressure exceeds pulmonary arterial pressure and close when that gradient reverses.',look:'Semilunar cusps have no chordae tendineae or papillary-muscle attachments.'},
  aortic:{title:'Aortic valve',group:'valves',point:[.16,.48,-.24],text:'Three semilunar cusps allow left ventricle → aorta flow during ejection and prevent aortic backflow during relaxation.',look:'The aortic root lies posterior to the pulmonary outflow. Coronary arteries arise from the aortic root above the valve.'},
  septum:{title:'Interventricular septum',group:'support',point:[.04,-.52,.04],text:'A muscular partition separates right and left ventricular blood. A small membranous component lies superiorly; the normal adult septum has no open passage between ventricles.',look:'The partition is substantial muscle, not a valve. Electrical branches run along its ventricular surfaces.'},
  atrialseptum:{title:'Interatrial septum',group:'support',point:[-.08,.62,-.12],text:'Separates the two atria. The fossa ovalis on its right atrial surface marks the closed fetal foramen ovale.',look:'The adult model shows an intact septum, without a normal open shortcut between atria.'},
  myocardium:{title:'Myocardium',group:'support',point:[.91,-.60,-.02],text:'Cardiac muscle forms the pumping wall. The left ventricular myocardium is much thicker than the right ventricular wall; atrial walls are thinner.',look:'The cut edges expose wall thickness. Smooth endocardium lines the cavities; the epicardium covers the outer surface.'},
  chordae:{title:'Chordae tendineae',group:'support',point:[.47,-.17,.05],text:'Branching tendinous cords connect AV valve leaflets to papillary muscles. They limit leaflet prolapse into the atria during ventricular systole.',look:'Trace a cord from an AV leaflet to its papillary-muscle head. No cords attach to either semilunar valve.'},
  papillary:{title:'Papillary muscles',group:'support',point:[.32,-.67,-.02],text:'Ventricular muscle projections anchor chordae. They contract with the ventricular wall, tensioning the supporting cords as AV valves close.',look:'Two principal groups are illustrated in the left ventricle and three in the right. Real branching and number vary.'},
  trabeculae:{title:'Trabeculae carneae',group:'support',point:[-.61,-.76,-.14],text:'Irregular muscular ridges line ventricular interiors. They are distinct from the smooth outflow regions and the supporting valve cords.',look:'Rotate the cutaway to see the ridges rising from the endocardial surface of each ventricle.'},
  pectinate:{title:'Pectinate muscles',group:'support',point:[-.86,.63,-.12],text:'Parallel muscular ridges occur in the right atrial appendage and anterior right atrium. They differ from ventricular trabeculae.',look:'The teaching cutaway exaggerates the ridges for visibility. Most of the main left atrial wall is smooth.'},
  fossa:{title:'Fossa ovalis',group:'support',point:[-.11,.64,-.08],text:'An oval depression on the right atrial side of the interatrial septum, associated with closure of the fetal foramen ovale.',look:'An intact shallow depression is shown, not a hole through the adult atrial septum.'},
  aorta:{title:'Aorta',group:'vessels',point:[.39,1.52,-.32],names:['Aorta'],surfacePoint:[.08,.75,.12],view:'anterior',text:'Carries oxygen-rich blood from the left ventricle through the aortic valve to the body. The arch gives rise to major arteries for the head and upper limbs.',look:'Follow the ascending aorta, arch and posterior descending segment. The coronary arteries arise near the root.'},
  superior:{title:'Superior vena cava',group:'vessels',point:[-.77,1.22,-.11],names:['Superior vena cava'],surfacePoint:[-.24,.75,-.03],view:'anterior',text:'Returns oxygen-poor blood from the upper body to the right atrium.',look:'Its right atrial junction lies close to the sinoatrial node.'},
  inferior:{title:'Inferior vena cava',group:'vessels',point:[-.77,-.01,-.46],names:['Inferior vena cava'],surfacePoint:[-.23,-.39,-.03],view:'posterior',text:'Returns oxygen-poor blood from the lower body to the right atrium, entering inferiorly.',look:'The superior and inferior venae cavae both enter the right atrium; neither connects directly to the left heart.'},
  arteries:{title:'Pulmonary arteries',group:'vessels',point:[-.20,1.02,.16],names:['Pulmonary trunk','Left pulmonary artery','Right pulmonary artery'],surfacePoint:[.28,.43,.30],view:'anterior',text:'The pulmonary trunk leaves the right ventricle through the pulmonary valve, then branches toward the two lungs. It carries oxygen-poor blood.',look:'The trunk is anterior to the aortic root. The branches head toward lungs, not into the left atrium.'},
  veins:{title:'Pulmonary veins',group:'vessels',point:[.92,.78,-.44],names:['Left pulmonary veins','Right pulmonary veins'],surfacePoint:[.38,.28,-.30],view:'posterior',text:'Four pulmonary veins normally return oxygen-rich blood from the lungs to the posterior left atrium.',look:'Veins are defined by flow toward the heart. Pulmonary veins carry more oxygenated blood than pulmonary arteries.'},
  coronary:{title:'Coronary vessels',group:'vessels',point:[.58,-.05,.39],names:['Coronary arteries','Coronary veins'],surfacePoint:[.37,-.25,.40],view:'anterior',text:'Coronary arteries supply the myocardium. Cardiac veins drain it, largely through the coronary sinus into the right atrium.',look:'Heart muscle needs its own circulation; chamber blood is not its main oxygen supply.'},
  san:{title:'Sinoatrial node',group:'conduction',point:[-.74,.99,-.08],text:'The SA node near the superior vena cava–right atrial junction normally initiates the heartbeat. Excitation spreads through the atria.',look:'The gold marker is enlarged. The normal pacemaker is specialised tissue, not a visible yellow bead.'},
  avnode:{title:'Atrioventricular node',group:'conduction',point:[-.08,.33,-.11],text:'The AV node in the inferior interatrial septal region delays conduction before excitation reaches the ventricles.',look:'The schematic signal proceeds from atria to AV node to AV bundle; blood and electrical signals follow different pathways.'},
  his:{title:'AV bundle & bundle branches',group:'conduction',point:[.04,-.05,-.12],text:'The AV bundle crosses the insulating fibrous skeleton and divides into right and left bundle branches along the interventricular septum.',look:'The conduction pathway enters the ventricles through the septum, not through the valve leaflets.'},
  purkinje:{title:'Purkinje network',group:'conduction',point:[.64,-1.02,-.13],text:'Subendocardial Purkinje fibres distribute excitation through the ventricles, supporting coordinated contraction from apical regions upward.',look:'Gold branches show an enlarged simplified network on inner ventricular surfaces; they are not coronary vessels.'}
};
export const HEART_JOURNEY = [
  ['superior','Systemic return','Body → superior and inferior venae cavae → right atrium. Oxygen-poor blood returns from the tissues.'],
  ['ra','Right atrium','The right atrium receives the returning venous blood.'],
  ['tricuspid','Tricuspid valve','During filling, the open tricuspid valve permits right atrium → right ventricle flow.'],
  ['rv','Right ventricle','The right ventricle builds pressure to send blood toward the lungs.'],
  ['pulmonary','Pulmonary valve','During ejection, the pulmonary valve opens; the tricuspid valve is closed.'],
  ['arteries','Toward the lungs','Pulmonary trunk → pulmonary arteries → lung capillaries. Gas exchange occurs in the lungs, outside this heart model.'],
  ['veins','Return from the lungs','After lung gas exchange, pulmonary veins bring oxygen-rich blood to the left atrium.'],
  ['la','Left atrium','The left atrium receives blood from the pulmonary veins.'],
  ['mitral','Mitral valve','During filling, the open mitral valve permits left atrium → left ventricle flow.'],
  ['lv','Left ventricle','The thick left ventricular wall builds the pressure needed for systemic circulation.'],
  ['aortic','Aortic valve','During ejection, the aortic valve opens; the mitral valve is closed.'],
  ['aorta','Toward the body','Aorta → systemic arteries → tissue capillaries. Oxygen exchange with tissues occurs outside this heart model.']
];
const V=a=>new THREE.Vector3(...a), TAU=Math.PI*2;
const C={muscle:0xbc5860,inner:0xb85f64,cut:0xe09c88,artery:0xb53f51,vein:0x477f99,valve:0xf0ddbc,cord:0xead6b1,gold:0xe6bc63};

export function createHeartAnatomy(mode='cutaway') {
  const root=new THREE.Group(),meshes=[],textures=[],valves=[],fronts=[],cutEdges=[],electrical=[];
  root.name='Original internal heart anatomy';
  let phase=0;
  const normalData=new Uint8Array(128*128*4),colourData=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,f=Math.sin(x*.37+y*.21+Math.sin(y*.11)*1.2)*.35+Math.sin(x*13.41+y*7.93)*.3;normalData[i]=128+f*4;normalData[i+1]=128+Math.cos(y*.31+x*.23)*3;normalData[i+2]=252;normalData[i+3]=255;const shade=245+3*Math.sin(x*.24+y*.19)+2*Math.sin(x*12.31+y*45.21);colourData[i]=shade;colourData[i+1]=shade*.985;colourData[i+2]=shade*.97;colourData[i+3]=255;}
  const normal=new THREE.DataTexture(normalData,128,128,THREE.RGBAFormat);normal.wrapS=normal.wrapT=THREE.RepeatWrapping;normal.needsUpdate=true;textures.push(normal);
  const colourMap=new THREE.DataTexture(colourData,128,128,THREE.RGBAFormat);colourMap.wrapS=colourMap.wrapT=THREE.RepeatWrapping;colourMap.colorSpace=THREE.SRGBColorSpace;colourMap.needsUpdate=true;textures.push(colourMap);
  const mat=(color,detail=true)=>new THREE.MeshPhysicalMaterial({color,roughness:.55,metalness:0,clearcoat:.18,clearcoatRoughness:.58,side:THREE.DoubleSide,...(detail?{map:colourMap,normalMap:normal,normalScale:new THREE.Vector2(.12,.12)}:{})});
  const add=(geometry,id,color,extra={})=>{const mesh=new THREE.Mesh(geometry,mat(color,extra.detail!==false));mesh.name=HEART_STRUCTURES[id]?.title||id;mesh.userData={heartId:id,ids:extra.ids||[id],...extra};root.add(mesh);meshes.push(mesh);return mesh;};
  const tube=(id,points,radius,color,extra={})=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(V)),Math.max(18,points.length*9),radius,10,false),id,color,extra);
  const ellipsoid=(id,p,scale,color,extra={})=>{const m=add(new THREE.SphereGeometry(1,28,18),id,color,extra);m.position.copy(V(p));m.scale.set(...scale);return m;};
  function openTube(g,curve,fraction){
    const retained=[],removed=[],p=g.attributes.position,index=g.index.array,radial=g.parameters.radialSegments;
    for(let i=0;i<index.length;i+=3){const tri=[index[i],index[i+1],index[i+2]],t=tri.reduce((n,v)=>n+Math.floor(v/(radial+1))/g.parameters.tubularSegments,0)/3,dz=tri.reduce((n,v)=>n+p.getZ(v),0)/3-curve.getPointAt(t).z;(t<fraction&&dz>0?removed:retained).push(...tri);}
    const front=g.clone();g.setIndex(retained);front.setIndex(removed);return front;
  }
  function vessel(id,points,r,color,window=0){
    const curve=new THREE.CatmullRomCurve3(points.map(V));
    for(const inner of [false,true]){
      const g=new THREE.TubeGeometry(curve,72,r-(inner?.018:0),24,false),front=window?openTube(g,curve,window):null,m=add(g,id,inner?new THREE.Color(color).multiplyScalar(.66):color,{vesselWall:true,anteriorWindow:!!window});
      if(inner)m.material.side=THREE.BackSide;
      if(front){const cover=add(front,id,inner?new THREE.Color(color).multiplyScalar(.66):color,{front:true,vesselWall:true});if(inner)cover.material.side=THREE.BackSide;fronts.push(cover);}
    }
    for(const t of [0,1,...(window?[window]:[])]){const m=add(new THREE.TorusGeometry(r-.009,.007,8,32),id,color,{detail:false});m.position.copy(curve.getPointAt(t));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),curve.getTangentAt(t).normalize());if(window&&t===window)cutEdges.push(m);}
  }
  function outflow(id,valveId,points,startRadius,endRadius){
    const curve=new THREE.CatmullRomCurve3(points.map(V));
    for(const inner of [false,true]){
      const g=new THREE.TubeGeometry(curve,36,1,24,false),p=g.attributes.position;
      for(let i=0;i<=36;i++){const t=i/36,center=curve.getPointAt(t),radius=THREE.MathUtils.lerp(startRadius,endRadius,t)-(inner?.025:0);for(let j=0;j<=24;j++){const k=i*25+j,v=new THREE.Vector3().fromBufferAttribute(p,k).sub(center).multiplyScalar(radius).add(center);p.setXYZ(k,v.x,v.y,v.z);}}
      g.computeVertexNormals();const front=openTube(g,curve,1),extra={ids:[id,valveId],smoothOutflow:true,fromChamber:id,toValve:valveId};
      add(g,id,inner?C.inner:C.muscle,extra);fronts.push(add(front,id,inner?C.inner:C.muscle,{...extra,front:true}));
    }
  }
  function interpolate(knots,t){
    let i=0;while(i<knots.length-2&&t>knots[i+1][0])i++;
    const a=knots[i],b=knots[i+1],before=knots[Math.max(0,i-1)],after=knots[Math.min(knots.length-1,i+2)],dt=b[0]-a[0],u=THREE.MathUtils.clamp((t-a[0])/dt,0,1);
    return a.slice(1).map((v,k)=>{const m0=(b[k+1]-before[k+1])/(b[0]-before[0]),m1=(after[k+1]-v)/(after[0]-a[0]);return (2*u**3-3*u*u+1)*v+(u**3-2*u*u+u)*dt*m0+(-2*u**3+3*u*u)*b[k+1]+(u**3-u*u)*dt*m1;});
  }
  // Asymmetric longitudinal section: the RV narrows around the septal border;
  // only the thick-walled LV continues to the cardiac apex. Dimensions are
  // illustrative proportions, not measurements of an individual patient's heart.
  const chambers={
    lv:{top:.24,bottom:-1.40,wall:.15,knots:[[0,.50,.34,.44,-.07],[.23,.55,.38,.46,-.07],[.52,.49,.35,.51,-.07],[.80,.30,.25,.60,-.06],[1,.025,.025,.66,-.035]]},
    rv:{top:.20,bottom:-1.18,wall:.05,knots:[[0,.45,.30,-.49,.05],[.23,.49,.32,-.58,.10],[.55,.43,.29,-.39,.10],[.82,.23,.19,.10,.04],[1,.025,.025,.44,-.02]]},
    ra:{top:1.10,bottom:.22,wall:.034,knots:[[0,.035,.035,-.57,-.08],[.20,.36,.26,-.55,-.07],[.59,.40,.28,-.50,-.02],[1,.36,.27,-.49,.05]]},
    la:{top:1.08,bottom:.25,wall:.035,knots:[[0,.035,.035,.46,-.30],[.22,.38,.28,.47,-.28],[.60,.40,.28,.46,-.22],[1,.40,.27,.44,-.07]]}
  };
  function sectionAt(c,y){return interpolate(c.knots,THREE.MathUtils.clamp((c.top-y)/(c.top-c.bottom),0,1));}
  function chamber(id,c){
    const sections=80,around=64;
    function surface(start,end,inside){const positions=[],uv=[],indices=[];
      for(let i=0;i<=sections;i++){const t=i/sections,[rx,rz,cx,cz]=interpolate(c.knots,t),a=Math.max(.006,rx-(inside?c.wall:0)),b=Math.max(.006,rz-(inside?c.wall:0));for(let j=0;j<=around;j++){const th=start+(end-start)*j/around,grain=1+.002*Math.sin(th*7+t*31);positions.push(cx+a*Math.cos(th)*grain,c.top+(c.bottom-c.top)*t,cz+b*Math.sin(th)*grain);uv.push(j/around,t*2);}}
      for(let i=0;i<sections;i++)for(let j=0;j<around;j++){const a=i*(around+1)+j,b=a+around+1;indices.push(a,b,a+1,b,b+1,a+1);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
    for(const inside of [false,true]){add(surface(Math.PI,TAU,inside),id,inside?C.inner:C.muscle,{ids:[id,'myocardium'],chamber:id,wall:c.wall,endocardium:inside});const m=add(surface(0,Math.PI,inside),id,inside?C.inner:C.muscle,{ids:[id,'myocardium'],chamber:id,wall:c.wall,endocardium:inside,front:true});fronts.push(m);}
    for(const angle of [Math.PI,TAU]){const pos=[],uv=[],idx=[];for(let i=0;i<=sections;i++){const t=i/sections,[rx,rz,cx,cz]=interpolate(c.knots,t);for(const inner of [false,true]){pos.push(cx+Math.max(.006,rx-(inner?c.wall:0))*Math.cos(angle),c.top+(c.bottom-c.top)*t,cz);uv.push(Number(inner),t*3);}}for(let i=0;i<sections;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();cutEdges.push(add(g,id,C.cut,{ids:[id,'myocardium'],cutEdge:true,chamber:id,wall:c.wall}));}
    if(id==='lv'||id==='rv'){const [rx,rz,cx,cz]=interpolate(c.knots,1);ellipsoid(id,[cx,c.bottom,cz],[rx,.02,rz],C.muscle,{ids:[id,'myocardium'],closedApex:true});}
    // Low-relief trabeculae follow the actual endocardial surface rather than
    // spanning the cavity like a lattice. The outflow regions remain smooth.
    if(id==='lv'||id==='rv')for(let k=0;k<16;k++){
      const pts=[];
      for(let i=0;i<10;i++){const t=.22+(k%4)*.018+i*.065,[rx,rz,cx,cz]=interpolate(c.knots,t),fraction=-.87+k/15*1.74+.035*Math.sin(i*.7+k);pts.push([cx+Math.max(.006,rx-c.wall)*fraction,c.top+(c.bottom-c.top)*t,cz-Math.max(.006,rz-c.wall)*Math.sqrt(1-fraction*fraction)+.012]);}
      tube('trabeculae',pts,.011+(k%3)*.002,0xb35c65,{ids:['trabeculae',id],chamber:id,endocardialRidge:true});
    }
    if(id==='ra')for(let k=0;k<9;k++){const pts=[];for(let i=0;i<7;i++){const t=.22+i*.09,[rx,rz,cx,cz]=interpolate(c.knots,t),f=-.88+k*.085;pts.push([cx+(rx-c.wall)*f,c.top+(c.bottom-c.top)*t,cz-(rz-c.wall)*Math.sqrt(1-f*f)+.01]);}tube('pectinate',pts,.009,C.cut,{ids:['pectinate','ra']});}
  }
  function septum(id,shape,depth,z){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:3,steps:1,curveSegments:28});const m=add(g,id,C.cut);m.position.z=z;return m;}
  function strut(id,a,b,r,color){const start=V(a),end=V(b),d=end.clone().sub(start),m=add(new THREE.CylinderGeometry(r,r*1.15,1,10),id,color,{detail:false});m.position.copy(start).add(end).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
  function valve(id,position,radius,count,isAV,bench=false){
    const group=new THREE.Group();group.position.copy(V(position));if(bench)group.rotation.x=Math.PI/2;root.add(group);
    const local=(g,part,color,extra={})=>{const m=add(g,part,color,extra);group.attach(m);m.position.set(0,0,0);m.quaternion.identity();return m;};
    const annularSaddle=id==='mitral'?.024:0,ringGeometry=new THREE.TorusGeometry(radius,.012,10,64);ringGeometry.rotateX(Math.PI/2);const annularPositions=ringGeometry.attributes.position;
    if(annularSaddle)for(let i=0;i<annularPositions.count;i++)annularPositions.setY(i,annularPositions.getY(i)+annularSaddle*Math.cos(2*Math.atan2(annularPositions.getZ(i),annularPositions.getX(i))));ringGeometry.computeVertexNormals();
    local(ringGeometry,id,C.valve,{detail:false,annulus:true,saddleAnnulus:!!annularSaddle});
    const leaflets=[],chords=[],muscles=[];
    for(let i=0;i<count;i++){
      const angular=18,radial=10,pos=new Float32Array((angular+1)*(radial+1)*3),uv=[],idx=[];
      for(let a=0;a<=angular;a++)for(let v=0;v<=radial;v++)uv.push(a/angular,v/radial);
      for(let a=0;a<angular;a++)for(let v=0;v<radial;v++){const q=a*(radial+1)+v;idx.push(q,q+1,q+radial+1,q+1,q+radial+2,q+radial+1);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
      const m=local(g,id,[0xf0ddbc,0xe3cba6,0xf5e5c9][i%3],{leaflet:true,valve:id,leafletIndex:i,semilunar:!isAV,detail:false});
      let front=null;
      if(isAV&&!bench){const rear=[],near=[];for(let j=0;j<idx.length;j+=3){const angle=-Math.PI/2+TAU*(i+idx.slice(j,j+3).reduce((n,k)=>n+Math.floor(k/(radial+1))/angular,0)/3)/count;(Math.sin(angle)>0?near:rear).push(...idx.slice(j,j+3));}g.setIndex(rear);const nearGeometry=new THREE.BufferGeometry();nearGeometry.setAttribute('position',g.attributes.position);nearGeometry.setAttribute('uv',g.attributes.uv);nearGeometry.setIndex(near);front=local(nearGeometry,id,[0xf0ddbc,0xe3cba6,0xf5e5c9][i%3],{leaflet:true,valve:id,anteriorLeaflet:true,detail:false});fronts.push(front);m.userData.sectionedLeaflet=true;}
      const nodule=isAV?null:local(new THREE.SphereGeometry(.009,12,8),id,0xf7e9d0,{detail:false});leaflets.push({mesh:m,front,angular,radial,index:i,nodule});
    }
    const bundles=[],papillarySupports=[];
    if(isAV){
      const papCount=id==='mitral'?2:3,c=chambers[id==='mitral'?'lv':'rv'];
      if(!bench)group.scale.z=.82; // AV annuli are oval, not circular funnels.
      for(let i=0;i<papCount;i++){
        const fraction=id==='mitral'?(i? .56:-.56):[-.65,.05,.65][i],t=.56+i*.065,[rx,rz,cx,cz]=interpolate(c.knots,t),y=c.top+(c.bottom-c.top)*t;
        const base=bench?[fraction*radius,-.84,-.04]:[cx+(rx-c.wall)*fraction-position[0],y-position[1],(cz-(rz-c.wall)*Math.sqrt(1-fraction*fraction)+.006-position[2])/.82];
        const head=bench?[fraction*radius*.8,-.55,.06]:[base[0]*.74,base[1]+.26,base[2]+.095];
        const curve=new THREE.CatmullRomCurve3([V(base),V(base).lerp(V(head),.5).add(new THREE.Vector3(0,0,.014)),V(head)]),g=new THREE.TubeGeometry(curve,24,1,16,false),p=g.attributes.position;
        for(let j=0;j<=24;j++){const center=curve.getPointAt(j/24),r=.072*(1-j/24)+.027*(j/24)+.012*Math.sin(Math.PI*j/24);for(let k=0;k<=16;k++){const n=j*17+k,v=new THREE.Vector3().fromBufferAttribute(p,n).sub(center).multiplyScalar(r).add(center);p.setXYZ(n,v.x,v.y,v.z);}}
        g.computeVertexNormals();const muscle=local(g,'papillary',C.muscle,{ids:['papillary',id==='mitral'?'lv':'rv'],valve:id,anchoredToEndocardium:!bench,base:base.slice(),head:head.slice()});
        const tip=local(new THREE.SphereGeometry(.029,16,10),'papillary',C.muscle,{valve:id});tip.position.copy(V(head));muscles.push(head);papillarySupports.push(muscle);
      }
      // Each leaflet receives a small fan from neighbouring papillary groups.
      // A primary cord divides into three fine secondary cords near its leaflet.
      for(let i=0;i<count;i++)for(let side=0;side<2;side++){
        const head=muscles[(i+side)%muscles.length],samples=[.20,.36,.52].map(u=>side?1-u:u),primary=local(new THREE.CylinderGeometry(.0032,.0041,1,8),'chordae',C.cord,{valve:id,attachment:'papillary to branch'}),branches=samples.map(u=>({u,mesh:local(new THREE.CylinderGeometry(.0021,.0026,1,6),'chordae',C.cord,{valve:id,attachment:'AV leaflet margin'})}));
        chords.push({mesh:primary},...branches.map(b=>({mesh:b.mesh})));bundles.push({head,index:i,primary,branches});
      }
    }
    const assembly={id,group,radius,count,isAV,leaflets,chords,muscles,bundles,papillarySupports,annularSaddle,open:0};valves.push(assembly);return assembly;
  }
  function leafletPoint(v,index,u,t,open){
    const theta=-Math.PI/2+TAU*(index+u)/v.count,r=v.radius,hinge=new THREE.Vector3(Math.cos(theta)*r,v.annularSaddle*Math.cos(2*theta),Math.sin(theta)*r);
    if(v.isAV){
      const commissure=Math.pow(Math.abs(2*u-1),3),radial=r*(.80+.20*commissure),closed=v.count===2?new THREE.Vector3(0,0,Math.sin(theta)*r):new THREE.Vector3(Math.cos(theta)*r*.012,0,Math.sin(theta)*r*.012);
      const free=closed.lerp(new THREE.Vector3(Math.cos(theta)*radial,-.20*Math.pow(Math.sin(Math.PI*u),.65),Math.sin(theta)*(v.count===2?r:radial)),open),p=hinge.lerp(free,t);p.y+=.025*(1-open)*Math.sin(Math.PI*t)*Math.sin(Math.PI*u);return p;
    }
    const radial=r*(1-(.988*(1-open)+.12*open)*t),y=.12*open*t*Math.sin(Math.PI*u)+.085*(1-open)*Math.sin(Math.PI*t)*Math.sin(Math.PI*u);
    return new THREE.Vector3(Math.cos(theta)*radial,y,Math.sin(theta)*radial);
  }
  function alignCord(mesh,start,end){const d=end.clone().sub(start);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.scale.y=d.length();mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());}
  const valvePoints={tricuspid:[-.55,.21,.01],mitral:[.48,.24,-.08],pulmonary:[-.23,.47,.15],aortic:[.16,.48,-.24]};
  if(mode==='valves'){
    valve('mitral',[-.65,.65,0],.37,2,true,true);valve('tricuspid',[.65,.65,0],.37,3,true,true);valve('aortic',[-.65,-.67,0],.32,3,false,true);valve('pulmonary',[.65,-.67,0],.32,3,false,true);
  }else{
    Object.entries(chambers).forEach(([id,c])=>chamber(id,c));
    for(const [atrium,ventricle] of [['ra','rv'],['la','lv']]){
      const a=chambers[atrium],v=chambers[ventricle];
      for(const inside of [false,true])for(const front of [false,true]){
        const positions=[],uv=[],index=[];
        for(let i=0;i<=8;i++)for(let j=0;j<=48;j++){const u=i/8,theta=(front?0:Math.PI)+Math.PI*j/48,ap=interpolate(a.knots,1),vp=interpolate(v.knots,0),wall=inside?THREE.MathUtils.lerp(v.wall,a.wall,u):0,rx=THREE.MathUtils.lerp(vp[0],ap[0],u)-wall,rz=THREE.MathUtils.lerp(vp[1],ap[1],u)-wall;positions.push(THREE.MathUtils.lerp(vp[2],ap[2],u)+rx*Math.cos(theta),THREE.MathUtils.lerp(v.top,a.bottom,u),THREE.MathUtils.lerp(vp[3],ap[3],u)+rz*Math.sin(theta));uv.push(j/48,u);}
        for(let i=0;i<8;i++)for(let j=0;j<48;j++){const k=i*49+j;index.push(k,k+49,k+1,k+1,k+49,k+50);}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();const m=add(g,ventricle,inside?C.inner:C.muscle,{ids:[atrium,ventricle,'myocardium'],atrioventricularJunction:true,front});if(front)fronts.push(m);
      }
    }

    const septalPositions=[],septalUV=[],septalIndices=[],septalSections=80;
    for(let i=0;i<=septalSections;i++){
      const y=.20-1.38*i/septalSections,[rrx,rrz,rcx,rcz]=sectionAt(chambers.rv,y),[lrx,lrz,lcx,lcz]=sectionAt(chambers.lv,y);
      const left=rcx+Math.max(.006,rrx-chambers.rv.wall),right=Math.max(left+.025,lcx-Math.max(.006,lrx-chambers.lv.wall));
      for(const [x,z] of [[left,rcz],[right,lcz],[left,rcz-Math.max(.08,rrz-chambers.rv.wall)],[right,lcz-Math.max(.08,lrz-chambers.lv.wall)]]){septalPositions.push(x,y,z);septalUV.push((x-left)/Math.max(.025,right-left),i/septalSections);}
    }
    for(let i=0;i<septalSections;i++){const a=i*4,b=a+4;for(const [j,k] of [[0,1],[2,0],[1,3],[3,2]])septalIndices.push(a+j,b+j,a+k,a+k,b+j,b+k);}
    septalIndices.push(0,2,1,1,2,3);const last=septalSections*4;septalIndices.push(last,last+1,last+2,last+1,last+3,last+2);
    const septalGeometry=new THREE.BufferGeometry();septalGeometry.setAttribute('position',new THREE.Float32BufferAttribute(septalPositions,3));septalGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(septalUV,2));septalGeometry.setIndex(septalIndices);septalGeometry.computeVertexNormals();
    add(septalGeometry,'septum',C.cut,{ids:['septum','myocardium'],sharedSeptalWall:true,continuousChamberMargins:true});
    const ia=new THREE.Shape();ia.moveTo(-.14,.25);ia.lineTo(-.14,.96);ia.quadraticCurveTo(-.06,1.05,.03,.93);ia.lineTo(.03,.26);ia.closePath();septum('atrialseptum',ia,.21,-.26);
    const fossa=ellipsoid('fossa',[-.155,.65,-.125],[.009,.12,.081],0xdca48b);fossa.userData.closedDepression=true;
    const limbus=add(new THREE.TorusGeometry(.098,.011,8,36),'fossa',C.cut,{detail:false});limbus.position.set(-.158,.65,-.125);limbus.rotation.y=Math.PI/2;limbus.scale.set(1,1.3,1);
    const rightValve=valve('tricuspid',valvePoints.tricuspid,.255,3,true);valve('mitral',valvePoints.mitral,.245,2,true);valve('pulmonary',valvePoints.pulmonary,.143,3,false);valve('aortic',valvePoints.aortic,.132,3,false);
    const papillaryBase=V(rightValve.papillarySupports[0].userData.base).multiply(rightValve.group.scale).add(rightValve.group.position),bandY=papillaryBase.y+.06,[brx,brz,bcx,bcz]=sectionAt(chambers.rv,bandY);
    tube('trabeculae',[[bcx+brx-chambers.rv.wall,bandY,bcz-.025],[papillaryBase.x*.48,bandY-.035,bcz+.035],papillaryBase.toArray()],.021,C.muscle,{ids:['trabeculae','rv'],moderatorBand:true});
    outflow('rv','pulmonary',[[-.30,-.05,.06],[-.29,.20,.11],valvePoints.pulmonary],.19,.143);
    outflow('lv','aortic',[[.24,-.07,-.13],[.18,.20,-.21],valvePoints.aortic],.18,.132);
    vessel('superior',[[-.78,1.60,-.12],[-.77,1.30,-.13],[-.70,1.01,-.14]],.115,C.vein);
    vessel('inferior',[[-.78,-.35,-.46],[-.78,.05,-.46],[-.71,.42,-.26]],.125,C.vein);
    vessel('aorta',[[.16,.48,-.24],[.16,1.07,-.22],[.25,1.48,-.24],[.51,1.62,-.43],[.70,1.35,-.65],[.70,.87,-.73]],.135,C.artery,.20);
    [[[.12,1.35,-.23],[-.08,1.77,-.22],[-.25,1.98,-.20]],[[.31,1.56,-.30],[.29,1.98,-.28]],[[.54,1.55,-.46],[.70,1.86,-.49],[.88,1.94,-.54]]].forEach(p=>vessel('aorta',p,.048,C.artery));
    vessel('arteries',[[-.23,.47,.15],[-.22,.85,.24],[-.08,1.15,.17],[.16,1.21,-.05]],.145,C.vein,.27);
    vessel('arteries',[[.02,1.18,.10],[.53,1.17,-.19],[1.16,1.14,-.32]],.10,C.vein);
    vessel('arteries',[[-.02,1.18,.10],[-.56,1.19,-.19],[-1.12,1.12,-.31]],.10,C.vein);
    for(const side of [-1,1])for(const level of [.54,.87])vessel('veins',[[side*1.16,level,-.42],[side*.78,level,-.43],[.48,level*.8+.16,-.40]],.062,C.artery);
    // Coronary vessels occupy the external surface and are hidden with the removed wall.
    for(const [pts,col] of [[[[.17,.55,-.19],[.41,.34,.25],[.73,.12,.34],[.89,-.35,.24]],C.artery],[[[.40,.31,.25],[.13,-.10,.36],[.19,-.60,.31],[.57,-1.23,.06]],C.artery],[[[.58,-1.12,.08],[.27,-.56,.36],[.19,-.09,.39],[.57,.21,.30],[.72,.29,-.10],[.49,.32,-.52],[-.10,.31,-.47],[-.59,.34,-.20]],C.vein]])tube('coronary',pts,.016,col,{externalDetail:true});
    electrical.push(ellipsoid('san',[-.74,.99,-.08],[.035,.07,.028],C.gold,{detail:false}),ellipsoid('avnode',[-.08,.33,-.11],[.034,.04,.025],C.gold,{detail:false}));
    electrical.push(tube('his',[[-.08,.33,-.11],[.02,.17,-.13],[.05,-.08,-.13],[.16,-.40,-.19]],.014,C.gold,{detail:false}));
    for(const side of [-1,1]){
      electrical.push(tube('his',[[.05,-.04,-.13],[side*.15,-.35,-.15],[side*.30,-.72,-.14],[side<0?-.09:.58,-1.05,-.10]],.011,C.gold,{detail:false}));
      for(let j=0;j<7;j++){const id=side<0?'rv':'lv',c=chambers[id],points=[];for(let k=0;k<6;k++){const t=.83-k*.095,[rx,rz,cx,cz]=interpolate(c.knots,t),f=(j-3)/4;points.push([cx+(rx-c.wall)*f,c.top+(c.bottom-c.top)*t,cz-(rz-c.wall)*Math.sqrt(1-f*f)+.02]);}electrical.push(tube('purkinje',points,.0065,C.gold,{detail:false}));}
    }
  }
  function setPhase(value){
    phase=value;
    // Filling -> isovolumetric contraction -> ejection -> isovolumetric relaxation.
    const av=value<.30?1:value<.38?1-THREE.MathUtils.smoothstep(value,.30,.38):value>.88?THREE.MathUtils.smoothstep(value,.88,1):0;
    const semi=value<.46?0:value<.54?THREE.MathUtils.smoothstep(value,.46,.54):value<.76?1:value<.84?1-THREE.MathUtils.smoothstep(value,.76,.84):0;
    for(const v of valves){const open=v.isAV?av:semi;v.open=open;
      for(const l of v.leaflets){const p=l.mesh.geometry.attributes.position;let q=0;for(let a=0;a<=l.angular;a++)for(let r=0;r<=l.radial;r++){const point=leafletPoint(v,l.index,a/l.angular,r/l.radial,open);p.setXYZ(q++,point.x,point.y,point.z);}p.needsUpdate=true;l.mesh.geometry.computeVertexNormals();l.mesh.geometry.computeBoundingSphere();if(l.front){l.front.geometry.computeVertexNormals();l.front.geometry.computeBoundingSphere();}if(l.nodule)l.nodule.position.copy(leafletPoint(v,l.index,.5,1,open));}
      for(const bundle of v.bundles){const head=V(bundle.head),tips=bundle.branches.map(b=>leafletPoint(v,bundle.index,b.u,1,open)),middle=tips.reduce((p,t)=>p.add(t),new THREE.Vector3()).multiplyScalar(1/tips.length),fork=head.clone().lerp(middle,.70);alignCord(bundle.primary,head,fork);bundle.branches.forEach((b,i)=>alignCord(b.mesh,fork,tips[i]));}

    }
  }
  setPhase(0);
  function setOpened(open){fronts.forEach(m=>m.visible=!open);cutEdges.forEach(m=>m.visible=open);meshes.filter(m=>m.userData.externalDetail).forEach(m=>m.visible=!open);}
  function setElectrical(on){electrical.forEach(m=>m.visible=on);}
  setOpened(true);setElectrical(false);
  const anchors=Object.fromEntries(Object.entries(HEART_STRUCTURES).map(([id,s])=>[id,V(s.point)]));
  if(mode==='valves')valves.forEach(v=>anchors[v.id]=v.group.position.clone());
  const routes={
    poor:new THREE.CatmullRomCurve3([[-.78,1.55,-.12],[-.71,.71,-.10],[-.55,.21,.01],[-.52,-.44,-.10],[-.29,-.73,-.10],[-.20,-.23,.09],[-.23,.47,.15],[-.17,.99,.20],[.02,1.18,.1],[-1.10,1.12,-.31]].map(V)),
    rich:new THREE.CatmullRomCurve3([[1.14,.87,-.42],[.52,.74,-.4],[.48,.24,-.08],[.51,-.50,-.21],[.61,-1.04,-.16],[.26,-.45,-.21],[.16,.48,-.24],[.16,1.12,-.22],[.50,1.61,-.43],[.7,.88,-.73]].map(V))
  };
  return {root,meshes,textures,valves,anchors,routes,chambers,setPhase,setOpened,setElectrical,get phase(){return phase;},anatomy:{patientLeftPositiveX:true,lvWall:chambers.lv.wall,rvWall:chambers.rv.wall,leafletCounts:Object.fromEntries(valves.map(v=>[v.id,v.count])),chordalValves:valves.filter(v=>v.chords.length).map(v=>v.id),septumClosed:true}};
}
