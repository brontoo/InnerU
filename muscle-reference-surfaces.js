/* Original superficial teaching reconstructions, fitted to the existing atlas.
   +z is anterior. Facial context is illustrative, not an additional assessment
   or a claim to show every constituent muscle in the selected group. */
export function addSurfaceAnatomy({THREE:T,group,add,depth,decorations,neutralMaterial,fiberMaterial,materials,surface,muscleMeshes}){
 const tissue=new T.MeshStandardMaterial({color:0xe5dbc4,roughness:.75,side:T.DoubleSide});materials.set(tissue.uuid,tissue);
 const face=fiberMaterial('face',new T.Box3(new T.Vector3(-.15,1.21,0),new T.Vector3(.15,1.63,.23)));materials.set(face.uuid,face);
 const eye=new T.MeshStandardMaterial({color:0xeee9d9,roughness:.45});
 const iris=new T.MeshStandardMaterial({color:0x647e77,roughness:.45});
 const pupil=new T.MeshStandardMaterial({color:0x25312e,roughness:.5});
 const lip=new T.MeshStandardMaterial({color:0x8d493b,roughness:.75});
 for(const m of [eye,iris,pupil,lip])materials.set(m.uuid,m);
 function context(name,geometry,material=tissue,hideForSelection=false){
  geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,material);mesh.name=name;
  mesh.userData.surfaceContext=hideForSelection;group.add(mesh);decorations.push(mesh);return mesh;
 }
 function ellipsoid(center,radii,rotation=0){const g=new T.SphereGeometry(1,32,24);g.scale(...radii);g.rotateZ(rotation);g.translate(...center);return g;}
 function cord(name,points,radius=.003,material=tissue,hide=true){
  return context(name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,radius,6,false),material,hide);
 }
 function spindle(id,from,to,width,thickness){
  const a=new T.Vector3(...from),b=new T.Vector3(...to),axis=b.clone().sub(a).normalize();
  const u=new T.Vector3(0,0,1).cross(axis).normalize(),v=new T.Vector3().crossVectors(axis,u).normalize(),p=[],index=[],rows=36,n=18;
  for(let j=0;j<=rows;j++){
   const t=j/rows,c=a.clone().lerp(b,t),belly=.10+.90*Math.pow(Math.sin(Math.PI*t),.65);
   for(let k=0;k<=n;k++){
    const angle=k/n*Math.PI*2,q=c.clone().addScaledVector(u,Math.cos(angle)*width*belly).addScaledVector(v,Math.sin(angle)*thickness*belly);p.push(q.x,q.y,q.z);
   }
  }
  for(let j=0;j<rows;j++)for(let k=0;k<n;k++){const a=j*(n+1)+k,b=a+n+1;index.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);g.computeVertexNormals();return add(id,g,'Superficial '+id+' belly');
 }
 // Rounded shoulder caps and superficial bellies close the atlas's deep-layer
 // gaps. All retain their existing structure ID, picking and attachment notes.
 for(const s of [-1,1]){
  add('deltoid',ellipsoid([s*.365,.905,-.008],[.098,.145,.115],s*.16),'Deltoid superficial cap');
  spindle('biceps',[s*.423,.38,.037],[s*.332,.875,.034],.055,.070);
  spindle('triceps',[s*.418,.38,-.073],[s*.341,.86,-.075],.053,.068);
  for(const shift of [-.022,.014]){
   spindle('flexors',[s*(.571+shift),-.16,.034],[s*(.448+shift),.37,.075],.022,.039);
   spindle('extensors',[s*(.571+shift),-.16,-.031],[s*(.45+shift),.37,-.068],.022,.038);
  }
  spindle('neck',[s*.035,1.045,.128],[s*.106,1.278,.067],.021,.010);
  cord('Sternohyoid surface context',[[s*.014,1.06,.132],[s*.016,1.17,.138],[s*.018,1.285,.124]],.010,face);
  // Patella and patellar ligament are connective/bony context, never muscle.
  context('Patella surface context',ellipsoid([s*.17,-1.035,.116],[.041,.054,.025]),tissue,true);
  cord('Patellar ligament',[[s*.17,-1.075,.13],[s*.175,-1.12,.115],[s*.18,-1.16,.096]],.009);
  cord('Quadriceps tendon',[[s*.17,-.94,.14],[s*.17,-.983,.143],[s*.17,-1.01,.139]],.013);
  // Broad pale midline/aponeurotic attachments, not exposed vertebrae or ribs.
  const clavicle=[];
  for(let i=0;i<=16;i++){const t=i/16,x=s*(.018+.28*t),y=.997-.045*Math.sin(t*Math.PI);clavicle.push([x,y,(depth(x,y,1)??.09)+.007]);}
  cord('Clavicular attachment fascia',clavicle,.008);
 }
 // Thoracolumbar fascia fans out over the lumbar attachment of latissimus.
 group.updateMatrixWorld(true);
 const fasciaRay=new T.Raycaster(),backSurfaces=muscleMeshes.filter(m=>['latissimus','erectors','trapezius'].includes(m.userData.structure));
 function sheet(name,side,y0,y1,width){
  const p=[],index=[],rows=32,cols=12;
  for(let j=0;j<=rows;j++){const t=j/rows,y=y0+(y1-y0)*t,w=width(t);for(let k=0;k<=cols;k++){
   const x=w*(k/cols*2-1);
   fasciaRay.set(new T.Vector3(x,y,-1),new T.Vector3(0,0,1));
   const z=fasciaRay.intersectObjects(backSurfaces,false)[0]?.point.z??depth(x,y,side);
   p.push(x,y,(z??side*.21)+side*.003);
  }}
  for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+cols+1;index.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);context(name,g,tissue,true);
 }
 sheet('Thoracolumbar aponeurosis',-1,.23,.64,t=>.014+.12*Math.pow(1-t,1.2));
 sheet('Trapezius midline attachment',-1,.57,1.29,t=>.006+.012*Math.sin(t*Math.PI));
 // Facial layers follow the same closed, adult-proportioned head surface.
 const profile=[
  [1.205,.030,.088,.065],[1.235,.072,.107,.085],[1.275,.108,.115,.112],
  [1.335,.131,.132,.134],[1.41,.14,.132,.146],[1.48,.137,.138,.143],
  [1.55,.119,.124,.127],[1.60,.071,.080,.083],[1.623,.004,.014,.014]
 ];
 function headProfile(y){
  const found=profile.findIndex((r,i)=>i<profile.length-1&&y<=profile[i+1][0]),j=found<0?profile.length-2:found;
  const a=profile[j],b=profile[j+1],before=profile[Math.max(0,j-1)],after=profile[Math.min(profile.length-1,j+2)],h=b[0]-a[0],t=T.MathUtils.clamp((y-a[0])/h,0,1);
  return [1,2,3].map(k=>{
   const m0=(b[k]-before[k])/(b[0]-before[0]),m1=(after[k]-a[k])/(after[0]-a[0]);
   return Math.max(.003,(2*t**3-3*t*t+1)*a[k]+(t**3-2*t*t+t)*h*m0+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*h*m1);
  });
 }
 const gauss=(x,y,cx,cy,wx,wy)=>Math.exp(-(((x-cx)/wx)**2+((y-cy)/wy)**2));
 function facialRelief(x,y){
  let z=.031*gauss(x,y,0,1.421,.014,.040)+.030*gauss(x,y,0,1.383,.019,.013);
  z+=.012*gauss(x,y,0,1.333,.045,.022)+.014*gauss(x,y,0,1.243,.035,.018);
  for(const s of [-1,1]){
   z-=.010*gauss(x,y,s*.054,1.432,.031,.022);
   z+=.009*gauss(x,y,s*.053,1.459,.041,.013)+.017*gauss(x,y,s*.087,1.377,.032,.030);
   z+=.010*gauss(x,y,s*.018,1.378,.010,.008);
  }
  return z;
 }
 const headZ=(x,y)=>{const [rx,front]=headProfile(y),f=Math.max(.005,1-(x/rx)**2);return .045+front*Math.sqrt(f)+facialRelief(x,y)*f;};
 const headPosition=[],headIndex=[],maskPosition=[],maskIndex=[],rows=96,cols=80;
 for(let j=0;j<=rows;j++){
  const y=1.205+j/rows*.418,[rx,front,back]=headProfile(y);
  for(let k=0;k<=cols;k++){
   const a=k/cols*Math.PI*2,x=rx*Math.cos(a),s=Math.sin(a),z=.045+s*(s>=0?front:back)+facialRelief(x,y)*Math.max(0,s)**2;
   headPosition.push(x,y,z);
   maskPosition.push(x,y,z+(s>0?.002:0));
  }
 }
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){
  const a=j*(cols+1)+k,b=a+cols+1;headIndex.push(a,b,a+1,b,b+1,a+1);
  if(k<cols/2&&j>5&&j<rows-2)maskIndex.push(a,b,a+1,b,b+1,a+1);
 }
 for(const end of [0,rows]){const center=headPosition.length/3;headPosition.push(0,1.205+end/rows*.418,.045);for(let k=0;k<cols;k++)headIndex.push(center,end*(cols+1)+k,end*(cols+1)+k+1);}
 const headGeometry=new T.BufferGeometry();headGeometry.setAttribute('position',new T.Float32BufferAttribute(headPosition,3));headGeometry.setIndex(headIndex);context('Anatomical head · cranial and facial support',headGeometry,neutralMaterial);
 const maskGeometry=new T.BufferGeometry();maskGeometry.setAttribute('position',new T.Float32BufferAttribute(maskPosition,3));maskGeometry.setIndex(maskIndex);context('Superficial facial muscle envelope',maskGeometry,face);
 for(const s of [-1,1])context('Ear',ellipsoid([s*.139,1.411,.027],[.017,.036,.025]),neutralMaterial);
 function facePatch(name,cx,cy,rx,ry,inner=0){
  const p=[],index=[],rows=10,cols=40;
  for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){
   const r=inner+(1-inner)*j/rows,a=k/cols*Math.PI*2,x=cx+rx*r*Math.cos(a),y=cy+ry*r*Math.sin(a);
   p.push(x,y,headZ(x,y)+.0025+.0015*Math.sin(r*Math.PI));
  }
  for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+cols+1;index.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);context(name,g,face);
 }
 for(const s of [-1,1]){
  facePatch('Frontalis surface context',s*.047,1.524,.048,.076);
  facePatch('Orbicularis oculi surface context',s*.057,1.434,.041,.030,.61);
  facePatch('Masseter surface context',s*.094,1.354,.022,.043);
  const eyeZ=headZ(s*.057,1.434);
  context('Eye surface context',ellipsoid([s*.057,1.434,eyeZ+.002],[.026,.011,.008]),eye);
  context('Iris',ellipsoid([s*.057,1.434,eyeZ+.010],[.008,.008,.0015]),iris);
  context('Pupil',ellipsoid([s*.057,1.434,eyeZ+.012],[.0035,.0045,.001]),pupil);
  const cheek=[];
  for(let i=0;i<=10;i++){const t=i/10,x=s*(.094-.054*t),y=1.407-.065*t;cheek.push([x,y,headZ(x,y)+.007]);}
  cord('Zygomaticus surface context',cheek,.0025,face,false);
 }
 facePatch('Orbicularis oris surface context',0,1.331,.045,.023,.38);
 cord('Closed mouth',[[ -.031,1.331,headZ(-.031,1.331)+.007],[0,1.329,headZ(0,1.329)+.009],[.031,1.331,headZ(.031,1.331)+.007]],.0017,lip,false);
 // Cartilage follows the sculpted nasal ridge, rather than a separate nose ball.
 const nasalPosition=[],nasalIndex=[];
 for(let j=0;j<=24;j++)for(let k=0;k<=16;k++){
  const y=1.367+j/24*.081,x=(k/16*2-1)*(.010+.012*Math.exp(-(((y-1.38)/.015)**2)));
  nasalPosition.push(x,y,headZ(x,y)+.004);
 }
 for(let j=0;j<24;j++)for(let k=0;k<16;k++){const a=j*17+k,b=a+17;nasalIndex.push(a,a+1,b,b,a+1,b+1);}
 const nasal=new T.BufferGeometry();nasal.setAttribute('position',new T.Float32BufferAttribute(nasalPosition,3));nasal.setIndex(nasalIndex);context('Nasal cartilage context',nasal,neutralMaterial);
 for(const s of [-1,1])context('Nostril',ellipsoid([s*.012,1.376,headZ(s*.012,1.376)+.006],[.004,.0022,.0013]),lip);

 // Interosseous/tendon context follows existing hand/foot surfaces; it never
 // bridges gaps between fingers or invents new selectable structures.
 for(const side of [-1,1])for(const s of [-1,1]){
  for(let digit=0;digit<4;digit++){
   const points=[];
   for(let j=0;j<=14;j++){
    const t=j/14,x=s*(.564+digit*.021+.026*t),y=-.18-.20*t,z=depth(x,y,side);
    if(z!==null)points.push([x,y,z+side*.003]);
   }
   if(points.length>=12)cord('Hand extensor/flexor tendon context',points,.002,tissue);
  }
 }

 // Dorsal interosseous/extensor context is projected onto the actual foot mesh.
 // No tendon is drawn across a gap or extended beyond its supporting surface.
 const footMaterial=fiberMaterial('foot',new T.Box3(new T.Vector3(-.4,-1.9,0),new T.Vector3(.4,-1.65,.4)));materials.set(footMaterial.uuid,footMaterial);
 surface.updateMatrixWorld(true);const ray=new T.Raycaster();
 for(const s of [-1,1])for(let digit=0;digit<4;digit++){
  const points=[],belly=[];
  for(let j=0;j<=24;j++){
   const t=j/24,z=.035+.20*t,x=s*(.125+digit*.030+.014*t);
   ray.set(new T.Vector3(x,-1.63,z),new T.Vector3(0,-1,0));
   const hit=ray.intersectObject(surface,false).find(h=>h.point.y< -1.68);
   if(hit){const p=[x,hit.point.y+.003,z];points.push(p);if(t>.35&&t<.85)belly.push([x+.003*s,hit.point.y+.004,z]);}
  }
  if(points.length>18)cord('Foot extensor tendon context',points,.0018,tissue);
  if(belly.length>7)cord('Dorsal interosseous surface context',belly,.003,footMaterial);
 }
}

// Retain left/right labels but batch adjacent pieces of each structure. This
// offsets the cost of surface detail without a larger model download.
export function mergeMuscleSurfaces(T,group,meshes,materials,fiberMaterial){
 const buckets=new Map();
 for(const mesh of meshes){mesh.geometry.computeBoundingBox();const x=mesh.geometry.boundingBox.getCenter(new T.Vector3()).x,key=mesh.userData.structure+':'+Math.sign(x);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(mesh);}
 const result=[];
 for(const batch of buckets.values()){
  const position=[],normal=[],index=[];let offset=0;
  for(const mesh of batch){
   const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal;
   for(let i=0;i<p.count;i++){position.push(p.getX(i),p.getY(i),p.getZ(i));normal.push(n.getX(i),n.getY(i),n.getZ(i));}
   for(let i=0;i<(g.index?.count??p.count);i++)index.push(offset+(g.index?g.index.getX(i):i));
   offset+=p.count;group.remove(mesh);g.dispose();mesh.material.dispose();materials.delete(mesh.material.uuid);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(position,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setIndex(index);g.computeBoundingBox();
  const id=batch[0].userData.structure,m=fiberMaterial(id,g.boundingBox),mesh=new T.Mesh(g,m);materials.set(m.uuid,m);
  mesh.name=id+' · '+(g.boundingBox.getCenter(new T.Vector3()).x<0?'right':'left');mesh.userData.structure=id;mesh.userData.originalMaterial=m;mesh.userData.sourceNames=batch.map(m=>m.name);group.add(mesh);result.push(mesh);
 }
 meshes.splice(0,meshes.length,...result);
}

export function shapeReferencePose(T,group,smoothNormals){
 for(const mesh of group.children){
  if(!mesh.isMesh)continue;
  mesh.updateMatrix();mesh.geometry.applyMatrix4(mesh.matrix);mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);mesh.updateMatrix();
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   let x=p.getX(i);const y=p.getY(i),s=Math.sign(x);
   if(y<-.55&&Math.abs(x)<.38){const bulk=.12*Math.exp(-(((y+.86)/.18)**2))+.16*Math.exp(-(((y+1.32)/.23)**2));x=s*.18+(x-s*.18)*(1+bulk);p.setZ(i,.005+(p.getZ(i)-.005)*(1+bulk));}
   const boundary=.28+.10*T.MathUtils.clamp((.9-y)/.7,0,1);
   const arm=T.MathUtils.smoothstep(Math.abs(x),boundary,boundary+.06)*(1-T.MathUtils.smoothstep(y,1.05,1.22))*T.MathUtils.smoothstep(y,-.55,-.44);
   const spread=arm*(.055+.10*T.MathUtils.clamp((.85-y),0,1));
   const stance=(1-T.MathUtils.smoothstep(y,-.65,-.3))*.025;
   p.setX(i,x*1.055+s*(spread+stance));
  }
  smoothNormals(mesh.geometry);mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
 }
 group.updateMatrixWorld(true);
}

// The support is an underlay, not an extra selectable muscle or exposed bone.
// No pelvic support is constructed: the existing opaque garment closes that area.
export function createSupportGeometries(T){
 const geometries=[];
 function loft(rows){
  const p=[],index=[],n=48;
  for(const [y,x,rx,front,back] of rows)for(let k=0;k<=n;k++){
   const a=k/n*Math.PI*2,z=Math.sin(a);p.push(x+rx*Math.cos(a),y,z*(z>=0?front:back));
  }
  for(let j=0;j<rows.length-1;j++)for(let k=0;k<n;k++){const a=j*(n+1)+k,b=a+n+1;index.push(a,b,a+1,b,b+1,a+1);}
  for(const end of [0,rows.length-1]){
   const row=rows[end],center=p.length/3;p.push(row[1],row[0],0);
   for(let k=0;k<n;k++)index.push(center,end*(n+1)+k,end*(n+1)+k+1);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);g.computeVertexNormals();geometries.push(g);
 }
 loft([[.17,0,.225,.213,.177],[.30,0,.23,.23,.185],[.47,0,.25,.24,.19],[.64,0,.29,.238,.19],[.79,0,.32,.19,.17],[.94,0,.30,.11,.13],[1.015,0,.235,.097,.095],[1.08,0,.13,.105,.065],[1.17,0,.08,.115,.045],[1.29,0,.075,.115,.045]]);
 for(const s of [-1,1]){
  loft([[.95,s*.35,.045,.05,.06],[.78,s*.374,.049,.058,.073],[.58,s*.404,.048,.05,.06],[.36,s*.445,.033,.047,.048],[.20,s*.48,.035,.055,.055],[.04,s*.52,.033,.045,.044],[-.12,s*.557,.023,.032,.032],[-.205,s*.575,.019,.024,.024]]);
  // The covered proximal thigh is deliberately omitted from this underlay.
  loft([[-.68,s*.205,.066,.078,.064],[-.83,s*.188,.058,.071,.06],[-1.03,s*.17,.042,.07,.046],[-1.16,s*.165,.042,.066,.08],[-1.35,s*.165,.040,.054,.074],[-1.55,s*.165,.029,.043,.05],[-1.72,s*.165,.023,.027,.03]]);
 }
 return geometries;
}
