import * as THREE from './assets/three/three.module.js';
import {GLTFLoader} from './assets/three/GLTFLoader.js';

/* Anatomical atlas meshes plus original teaching surfaces and a closed garment.
   Coordinates are in the atlas's anatomical space: +z anterior, +y superior. */
function muscleId(name){
  const n=name.toLowerCase().replace(/_/g,' ');
  for(const [token,id] of [['gastrocnemius','gastrocnemius'],['soleus','soleus'],['gluteus','gluteal'],['rectus femoris','rectus-femoris'],['vastus lateralis','vastus-lateralis'],['vastus medialis','vastus-medialis'],['pectoralis','pectoralis'],['deltoid','deltoid'],['triceps','triceps'],['biceps','biceps'],['trapezius','trapezius']])if(n.includes(token))return id;
  return null;
}

function fiberMaterial(id,box){
  const tendon=id==='achilles',color=tendon?0xf1e2be:id==='pectoralis'?0xd18a78:id==='trapezius'||id==='latissimus'?0xc17a6e:0xce8474;
  const m=new THREE.MeshPhysicalMaterial({color,roughness:tendon?.76:.57,metalness:0,clearcoat:.10,clearcoatRoughness:.75,side:THREE.DoubleSide});
  const ymin=box?.min.y??-2,range=Math.max(.02,(box?.max.y??2)-ymin);
  m.onBeforeCompile=shader=>{
    shader.uniforms.fiberMin={value:ymin};shader.uniforms.fiberRange={value:range};
    shader.vertexShader='varying vec3 musclePosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmusclePosition=position;');
    shader.fragmentShader='varying vec3 musclePosition;\nuniform float fiberMin;\nuniform float fiberRange;\n'+shader.fragmentShader;
    let phase='musclePosition.x * 640.0 + musclePosition.z * 490.0 + sin(musclePosition.y * 19.0) * 1.6';
    if(['pectoralis','latissimus','serratus'].includes(id))phase='atan(musclePosition.y - 0.79, abs(musclePosition.x) - 0.36) * 135.0';
    if(id==='oblique')phase='abs(musclePosition.x) * 440.0 + musclePosition.y * 310.0';
    if(id==='trapezius')phase='abs(musclePosition.x) * 370.0 + musclePosition.y * 290.0';
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float phase=${phase};
      float fade=1.0-smoothstep(0.5,2.8,fwidth(phase));
      float fascicle=sin(phase)*0.5+0.5;
      diffuseColor.rgb*=1.0-0.095*fade*pow(fascicle,9.0);
      float along=clamp((musclePosition.y-fiberMin)/fiberRange,0.0,1.0);
      float attachment=pow(abs(along*2.0-1.0),16.0)*${['biceps','triceps','rectus-femoris','gastrocnemius','soleus'].includes(id)?'.55':'.12'};
      ${id==='rectus'?'attachment=max(attachment,pow(abs(cos((musclePosition.y-.18)*26.0)),36.0)*.62);':''}
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.88,0.79,0.64),attachment);
    `);
  };
  m.customProgramCacheKey=()=>id;
  return m;
}

function worldGeometry(mesh){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry.clone();
  // Quantized GLBs use normalized integer attributes. Convert before editing.
  for(const name of ['position','normal']){
    const a=g.getAttribute(name);if(!a)continue;
    const v=new Float32Array(a.count*3);
    for(let i=0;i<a.count;i++){v[i*3]=a.getX(i);v[i*3+1]=a.getY(i);v[i*3+2]=a.getZ(i);}
    g.setAttribute(name,new THREE.BufferAttribute(v,3));
  }
  g.applyMatrix4(mesh.matrixWorld);smoothNormals(g);g.computeBoundingBox();return g;
}

function smoothNormals(g){
  const p=g.attributes.position,index=g.index,accum=new Map(),keys=[];
  for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*50000)).join(',');keys.push(key);if(!accum.has(key))accum.set(key,new THREE.Vector3());}
  const A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3();
  for(let i=0;i<(index?.count??p.count);i+=3){const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;A.fromBufferAttribute(p,a);B.fromBufferAttribute(p,b);C.fromBufferAttribute(p,c);ab.subVectors(B,A);ac.subVectors(C,A);ab.cross(ac);for(const j of [a,b,c])accum.get(keys[j]).add(ab);}
  accum.forEach(n=>n.normalize());const normals=new Float32Array(p.count*3);
  keys.forEach((k,i)=>accum.get(k).toArray(normals,i*3));g.setAttribute('normal',new THREE.BufferAttribute(normals,3));
}

// Rasterize the closed body into two continuous depth fields. Supplementary
// muscles follow this surface instead of floating in front of a human outline.
function bodyDepth(geometry){
  const width=280,height=700,xmin=-.72,xspan=1.44,ymin=-1.90,yspan=3.52;
  const front=new Float32Array(width*height).fill(-Infinity),back=new Float32Array(width*height).fill(Infinity);
  const a=geometry.attributes.position,index=geometry.index;
  const point=(i)=>[(a.getX(i)-xmin)/xspan*(width-1),(a.getY(i)-ymin)/yspan*(height-1),a.getZ(i)];
  for(let i=0;i<index.count;i+=3){
    const A=point(index.getX(i)),B=point(index.getX(i+1)),C=point(index.getX(i+2));
    const den=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]);if(Math.abs(den)<.0001)continue;
    const x0=Math.max(0,Math.floor(Math.min(A[0],B[0],C[0]))),x1=Math.min(width-1,Math.ceil(Math.max(A[0],B[0],C[0])));
    const y0=Math.max(0,Math.floor(Math.min(A[1],B[1],C[1]))),y1=Math.min(height-1,Math.ceil(Math.max(A[1],B[1],C[1])));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const u=((B[1]-C[1])*(x-C[0])+(C[0]-B[0])*(y-C[1]))/den,v=((C[1]-A[1])*(x-C[0])+(A[0]-C[0])*(y-C[1]))/den,w=1-u-v;
      if(u<-.001||v<-.001||w<-.001)continue;
      const z=u*A[2]+v*B[2]+w*C[2],j=y*width+x;front[j]=Math.max(front[j],z);back[j]=Math.min(back[j],z);
    }
  }
  return(x,y,side=1)=>{
    const fx=(x-xmin)/xspan*(width-1),fy=(y-ymin)/yspan*(height-1),ix=Math.floor(fx),iy=Math.floor(fy),field=side===1?front:back;
    if(ix<0||ix>=width-1||iy<0||iy>=height-1)return null;
    const z=[field[iy*width+ix],field[iy*width+ix+1],field[(iy+1)*width+ix],field[(iy+1)*width+ix+1]];
    if(z.some(n=>!Number.isFinite(n)))return null;
    const tx=fx-ix,ty=fy-iy;return z[0]*(1-tx)*(1-ty)+z[1]*tx*(1-ty)+z[2]*(1-tx)*ty+z[3]*tx*ty;
  };
}

function selectFaces(source,predicate,transform){
  const p=source.attributes.position,n=source.attributes.normal,idx=source.index,positions=[],normals=[];
  for(let i=0;i<idx.count;i+=3){
    const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
    const vertices=ids.map(j=>new THREE.Vector3().fromBufferAttribute(p,j));
    const c=vertices[0].clone().add(vertices[1]).add(vertices[2]).multiplyScalar(1/3);
    if(!predicate(c))continue;
    vertices.forEach((v,j)=>{if(transform)transform(v);positions.push(v.x,v.y,v.z);const k=ids[j];normals.push(n.getX(k),n.getY(k),n.getZ(k));});
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return g;
}

function garment(group){
  const fabricCanvas=document.createElement('canvas');fabricCanvas.width=fabricCanvas.height=128;
  const ctx=fabricCanvas.getContext('2d');ctx.fillStyle='#8d8d8d';ctx.fillRect(0,0,128,128);
  ctx.strokeStyle='#a2a2a2';ctx.lineWidth=1;
  for(let i=0;i<128;i+=4){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,128);ctx.moveTo(0,i);ctx.lineTo(128,i);ctx.stroke();}
  const weave=new THREE.CanvasTexture(fabricCanvas);weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(4,4);
  const fabric=new THREE.MeshStandardMaterial({color:0x234b57,roughness:.96,metalness:0,bumpMap:weave,bumpScale:.0009,side:THREE.DoubleSide});
  const trim=new THREE.MeshStandardMaterial({color:0x6faaa6,roughness:.8,side:THREE.DoubleSide});
  const garments=[];
  function piece(name,rows,center=0,material=fabric,cap=false,fork=false){
    const n=80,p=[],uv=[],ix=[];
    rows.forEach(([y,rx,rz],j)=>{for(let k=0;k<=n;k++){const t=k/n*Math.PI*2,fold=0;const x=fork&&j===0?.355*(center>0?Math.max(0,Math.cos(t)):Math.min(0,Math.cos(t))):center+(rx+fold)*Math.cos(t);p.push(x,y,.025+(rz+fold)*Math.sin(t));uv.push(k/n,j/(rows.length-1));}});
    for(let j=0;j<rows.length-1;j++)for(let k=0;k<n;k++){const a=j*(n+1)+k,b=a+n+1;ix.push(a,b,a+1,b,b+1,a+1);}
    if(cap){const j=rows.length-1,offset=p.length/3;p.push(center,rows[j][0],.025);uv.push(.5,.5);for(let k=0;k<n;k++)ix.push(offset,j*(n+1)+k+1,j*(n+1)+k);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
    const m=new THREE.Mesh(g,material);m.name=name;m.userData.garment=true;m.renderOrder=30;m.castShadow=true;m.receiveShadow=true;group.add(m);garments.push(m);return m;
  }
  // Closed hip panel, a covered crotch and overlapping leg panels. The bottoms
  // are capped to prevent any inside view while orbiting below the mannequin.
  piece('Shorts · waist and hips',[[.21,.315,.285],[.14,.326,.292],[-.06,.365,.304],[-.22,.366,.299],[-.32,.355,.28]],0,fabric,false);
  for(const s of [-1,1]){
    piece('Shorts · '+(s<0?'right':'left')+' leg',[[-.32,.1775,.28],[-.40,.18,.268],[-.51,.177,.239],[-.66,.17,.218]],s*.18,fabric,true,true);
    piece('Shorts · leg hem',[[-.635,.173,.222],[-.663,.173,.222]],s*.18,trim);
  }
  piece('Shorts · waistband',[[.22,.318,.288],[.18,.323,.292]],0,trim);
  return{meshes:garments,texture:weave};
}

export async function createMuscleModel(){
  const loader=new GLTFLoader();
  const loaded=await Promise.allSettled([
    loader.loadAsync(new URL('./assets/muscular/anatomical-muscles.glb',import.meta.url).href),
    loader.loadAsync(new URL('./assets/muscular/body-template.glb',import.meta.url).href),
  ]);
  const release=scene=>scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [].concat(o.material))m.dispose();});
  if(loaded.some(r=>r.status==='rejected')){loaded.forEach(r=>{if(r.status==='fulfilled')release(r.value.scene)});throw new Error('Muscular atlas assets unavailable');}
  const [atlas,template]=loaded.map(r=>r.value),group=new THREE.Group(),meshes=[],baseMeshes=[],decorations=[],materials=new Map();
  group.name='Classroom muscular anatomy';group.updateMatrixWorld(true);
  const body=worldGeometry(template.scene.children.find(o=>o.isMesh)),depth=bodyDepth(body);
  function add(id,geometry,name){
    geometry.computeBoundingBox();const m=fiberMaterial(id,geometry.boundingBox);materials.set(m.uuid,m);
    const mesh=new THREE.Mesh(geometry,m);mesh.name=name||id;mesh.userData.structure=id;mesh.userData.originalMaterial=m;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);meshes.push(mesh);return mesh;
  }
  atlas.scene.updateMatrixWorld(true);
  atlas.scene.traverse(o=>{if(o.isMesh){const id=muscleId(o.name);if(id)add(id,worldGeometry(o),o.name);}});
  const isNeutral=v=>v.y>1.245||v.y<-1.68||(Math.abs(v.x)>.54&&v.y<.025);
  const neutralMaterial=new THREE.MeshStandardMaterial({color:0xdcc5ac,roughness:.74,metalness:0});materials.set(neutralMaterial.uuid,neutralMaterial);
  const neutral=new THREE.Mesh(selectFaces(body,v=>isNeutral(v)&&v.y<1.10),neutralMaterial);neutral.name='Smooth mannequin · hands and feet';group.add(neutral);decorations.push(neutral);
  function neutralShape(name,center,scale){const g=new THREE.SphereGeometry(1,48,40);g.scale(...scale);g.translate(...center);const m=new THREE.Mesh(g,neutralMaterial);m.name=name;group.add(m);decorations.push(m);return m;}
  const head=neutralShape('Smooth mannequin · head',[0,1.41,.05],[.145,.21,.15]);
  const hp=head.geometry.attributes.position;
  for(let i=0;i<hp.count;i++){const y=hp.getY(i),t=THREE.MathUtils.clamp((y-1.22)/.21,0,1);hp.setX(i,hp.getX(i)*(.75+.25*t));}
  head.geometry.computeVertexNormals();
  neutralShape('Smooth mannequin · nose',[0,1.392,.198],[.018,.034,.019]);
  for(const s of [-1,1])neutralShape('Smooth mannequin · ear',[s*.135,1.41,.045],[.016,.033,.025]);
  const neckSupport=new THREE.Mesh(new THREE.CylinderGeometry(.078,.10,.235,48,8),neutralMaterial);neckSupport.name='Smooth mannequin · neck';neckSupport.position.set(0,1.225,.045);group.add(neckSupport);decorations.push(neckSupport);
  const baseMaterial=fiberMaterial('body',body.boundingBox);baseMaterial.color.setHex(0xbc9280);materials.set(baseMaterial.uuid,baseMaterial);
  const baseGeometry=selectFaces(body,v=>!isNeutral(v)&&v.y<1.14&&(v.y>.18||v.y<-.68||Math.abs(v.x)>.38),v=>{
    const x=Math.abs(v.x),s=Math.sign(v.x)||1;
    if(v.y<-.2){const center=s*.19;v.x=center+(v.x-center)*.88;v.z=.02+(v.z-.02)*.76;}
    else if(x>.34&&v.y<.85){const center=s*(.39+(.75-v.y)*.20);v.x=center+(v.x-center)*.84;v.z*=.80;}
    else{v.x*=.93;v.z=.02+(v.z-.02)*.79;}
  });
  const base=new THREE.Mesh(baseGeometry,baseMaterial);base.name='Continuous anatomical support';group.add(base);baseMeshes.push(base);
  // Ribbons are curved grids sampled on the real body surface. Bundles are
  // simplified atlas regions; no interior organs or exposed bones are created.
  function ribbon(id,side,center,width,y0,y1,sign=1,offset=.008){
    const rows=44,cols=12,p=[],ix=[],valid=[];
    for(let j=0;j<=rows;j++){
      const t=j/rows,y=THREE.MathUtils.lerp(y0,y1,t),cx=typeof center==='function'?center(t):center;
      const w=(typeof width==='function'?width(t):width)*(.22+.78*Math.pow(Math.sin(Math.PI*t),.35));
      for(let k=0;k<=cols;k++){
        const u=k/cols*2-1,x=sign*(cx+w*u),z=depth(x,y,side),a=j*(cols+1)+k;valid[a]=z!==null;
        p.push(x,y,(z??0)+side*(offset+.006*(1-u*u)*Math.sin(t*Math.PI)));
      }
    }
    for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+cols+1;if([a,a+1,b,b+1].every(i=>valid[i]))ix.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return add(id,g,id+(sign<0?' right':' left'));
  }
  for(const s of [-1,1]){
    const neckCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(s*.064,1.035,.126),new THREE.Vector3(s*.086,1.13,.098),new THREE.Vector3(s*.12,1.25,.035)]);
    const neckGeometry=new THREE.TubeGeometry(neckCurve,32,.014,10,false);
    add('neck',neckGeometry,'Sternocleidomastoid '+(s<0?'right':'left'));
    ribbon('rectus',1,.073,t=>.047+.008*Math.sin(t*Math.PI),.16,.68,s,.010);
    ribbon('oblique',1,t=>.20+.055*t,t=>.065-.026*t,.14,.62,s);
    ribbon('latissimus',-1,t=>.11+.12*t,t=>.065+.045*t,.13,.84,s);
    ribbon('erectors',-1,.046,.023,.17,.95,s,.015);
    for(let j=0;j<4;j++)ribbon('serratus',1,t=>.23+.06*t,.023,.57+j*.048,.62+j*.048,s,.014);
    ribbon('flexors',1,t=>.57-.12*t,t=>.028+.023*t,-.19,.40,s,.009);
    ribbon('extensors',-1,t=>.57-.12*t,t=>.027+.026*t,-.19,.40,s,.009);
    for(const n of [-1,0,1])ribbon('hamstrings',-1,t=>.19+n*.038-.02*t,.022,-1.035,-.17,s,.010);
    ribbon('sartorius',1,t=>.135+.16*t,.013,-1.02,-.12,s,.018);
    ribbon('tibialis',1,t=>.21+.018*Math.sin(Math.PI*t),t=>.016+.019*t,-1.68,-1.01,s,.013);
    ribbon('achilles',-1,.165,t=>.016+.008*t,-1.76,-1.43,s,.008);
  }
  // A fine pale linea alba separates the paired rectus muscles.
  const linePoints=[];for(let i=0;i<32;i++){const y=.19+i/31*.48;linePoints.push(new THREE.Vector3(0,y,(depth(0,y,1)??.25)+.012));}
  const linea=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(linePoints),32,.003,5,false),new THREE.MeshStandardMaterial({color:0xead5b6,roughness:.8}));
  linea.userData.structure='rectus';linea.userData.originalMaterial=linea.material;group.add(linea);meshes.push(linea);materials.set(linea.material.uuid,linea.material);
  const shorts=garment(group);
  body.dispose();release(atlas.scene);release(template.scene);
  group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(group);
  return{group,meshes,baseMeshes,decorations,garments:shorts.meshes,bounds,
    dispose(){const geometry=new Set(),mats=new Set(materials.values());group.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)mats.add(o.material)});geometry.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());shorts.texture.dispose();group.clear();},
  };
}
