/* A textured teaching animation of quiet breathing. The trachea stays anchored;
   the lung bases follow the descending, flattening diaphragm. No measured volumes. */
(() => {
  'use strict';
  const W=1536,H=1024,asset='assets/respiratory-missions/01-lungs.webp';
  const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  function point(x,y,depth){
    // A continuous tissue deformation, not a uniform scale of the whole image.
    // Carina and upper trachea remain fixed; the dome descends more centrally
    // than at its lateral attachments, reducing its curvature on inhalation.
    const lateral=smooth((Math.abs(x-768)-95)/180);
    const envelope=Math.exp(-Math.pow((x-768)/610,8));
    const below=smooth((y-350)/350),attachment=1-smooth((y-700)/324);
    const dome=.66+.34*Math.exp(-Math.pow((x-768)/330,2));
    const dy=depth*112*below*attachment*dome*envelope;
    const dx=depth*.095*(x-768)*smooth((y-120)/330)*(1-smooth((y-800)/224))*lateral*envelope;
    return [x+dx,y+dy];
  }
  function markup(picture,transport){return `<div class="ra-scene ra-event-scene ra-ventilation" data-event="0" data-vent-phase="hold" data-vent-depth="0">
    <figure><div class="ra-ventilation-art">${picture(1,undefined,'Lungs, conducting airways and diaphragm in an anterior teaching view')}<canvas width="1152" height="768" role="img" aria-label="Interactive lungs and diaphragm at the end of quiet exhalation"></canvas>
      <svg class="ra-ventilation-overlay" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><marker id="ra-vent-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#278479"/></marker></defs>
        <path class="ra-vent-rest-dome" d="M330 900Q440 770 610 716Q770 650 935 740Q1090 790 1190 910"/>
        <path class="ra-vent-dome"/><path class="ra-vent-dia-arrow" marker-end="url(#ra-vent-arrow)"/>
        <path class="ra-vent-air" d="M768 110V285" marker-end="url(#ra-vent-arrow)"/>
        <g class="ra-vent-lung-label"><path/><circle r="7"/><rect x="1135" y="405" width="234" height="63" rx="14"/><text x="1252" y="445" text-anchor="middle">Lungs</text></g>
        <g class="ra-vent-dia-label"><path/><circle r="7"/><rect x="65" y="887" width="300" height="65" rx="14"/><text x="215" y="929" text-anchor="middle">Diaphragm</text></g>
      </svg><span class="ra-vent-phase">READY TO BREATHE</span></div><figcaption>Anterior anatomical teaching view · motion enlarged for clarity</figcaption></figure>
    <div class="ra-scene-copy"><span class="eyebrow">WHOLE ORGAN · YOU CONTROL THE BREATH</span><h3>Ventilation</h3><p>Inhale to expand the lungs. Exhale to let them recoil. Watch the diaphragm change shape beneath them.</p>
      <div class="ra-vent-buttons" role="group" aria-label="Breathing controls"><button type="button" data-vent-pose="in">Inhale ↓</button><button type="button" data-vent-pose="out">Exhale ↑</button><button type="button" data-vent-play>Play one breath</button></div>
      <label class="ra-vent-slider-label" for="ra-vent-depth">Move through the breath <output id="ra-vent-depth-value">0%</output></label><input id="ra-vent-depth" type="range" min="0" max="100" value="0" step="1" aria-valuetext="End of quiet exhalation">
      <div class="ra-vent-scale"><span>Exhaled</span><span>Inhaled</span></div>
      <dl class="ra-vent-readings"><div><dt>Lungs</dt><dd data-vent-lungs>Resting lung volume</dd></div><div><dt>Diaphragm</dt><dd data-vent-muscle>Relaxed · domed upward</dd></div></dl>
      <p class="ra-vent-status" role="status">Choose Inhale, then Exhale. Quiet exhalation is mainly passive elastic recoil.</p>
    </div></div><div class="ra-ventilation-flow" data-flow="hold">${transport('Atmosphere','Lungs','NO AIRFLOW')}<p>At a held position, pressure equalizes and airflow stops.</p></div>`;}

  function renderer(canvas,image){
    // GPU texture mesh keeps the original fine anatomical detail during motion.
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
    const cols=48,rows=36,vertices=[],indices=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++)vertices.push(i/cols*W,j/rows*H);
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
    if(gl){
      const shaders=[];
      function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Breathing texture shader failed');shaders.push(s);return s;}
      const program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 pos;attribute vec2 uv;varying vec2 tex;void main(){gl_Position=vec4(pos,0.,1.);tex=uv;}'));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 tex;uniform sampler2D anatomy;void main(){gl_FragColor=texture2D(anatomy,tex);}'));
      gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Breathing texture program failed');gl.useProgram(program);
      const buffer=gl.createBuffer(),index=gl.createBuffer(),texture=gl.createTexture(),data=new Float32Array(vertices.length*2);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data.byteLength,gl.DYNAMIC_DRAW);
      for(const [name,offset] of [['pos',0],['uv',8]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);}
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.viewport(0,0,canvas.width,canvas.height);
      return {draw(depth){for(let k=0;k<vertices.length;k+=2){const [x,y]=point(vertices[k],vertices[k+1],depth),at=k*2;data[at]=x/W*2-1;data[at+1]=1-y/H*2;data[at+2]=vertices[k]/W;data[at+3]=vertices[k+1]/H;}gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);},dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteBuffer(index);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension('WEBGL_lose_context')?.loseContext();}};
    }
    // The same mesh has a Canvas 2D fallback for devices without WebGL.
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
    const c=18,d=18;
    function triangle(src,dst){
      const [a,b,e]=src,[u,v,w]=dst,den=(b[0]-a[0])*(e[1]-a[1])-(e[0]-a[0])*(b[1]-a[1]);
      const m=(v[0]-u[0])*(e[1]-a[1])-(w[0]-u[0])*(b[1]-a[1]),n=(v[1]-u[1])*(e[1]-a[1])-(w[1]-u[1])*(b[1]-a[1]);
      const p=(w[0]-u[0])*(b[0]-a[0])-(v[0]-u[0])*(e[0]-a[0]),q=(w[1]-u[1])*(b[0]-a[0])-(v[1]-u[1])*(e[0]-a[0]);
      ctx.save();ctx.beginPath();dst.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.transform(m/den,n/den,p/den,q/den,u[0]-(m*a[0]+p*a[1])/den,u[1]-(n*a[0]+q*a[1])/den);ctx.drawImage(image,0,0,W,H);ctx.restore();
    }
    return {draw(depth){ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.fillStyle='#f8efdf';ctx.fillRect(0,0,W,H);for(let j=0;j<d;j++)for(let i=0;i<c;i++){const a=[i/c*W,j/d*H],b=[(i+1)/c*W,j/d*H],e=[i/c*W,(j+1)/d*H],f=[(i+1)/c*W,(j+1)/d*H];for(const tri of [[a,e,b],[b,e,f]])triangle(tri,tri.map(p=>point(...p,depth)));}},dispose(){}};
  }
  function mount(stage,root){
    const $=s=>stage.querySelector(s),scene=$('.ra-ventilation'),canvas=$('canvas'),flow=$('.ra-ventilation-flow'),play=$('[data-vent-play]'),slider=$('#ra-vent-depth');
    const controller=new AbortController(),signal=controller.signal,image=new Image();let depth=0,phase='hold',frame=0,settle=0,dead=false,painter=null,playing=false;
    const canMove=()=>root.dataset.raMotion==='on'&&!document.hidden&&!root.classList.contains('ra-offscreen');
    const domePoints=[[330,900],[440,770],[610,716],[770,650],[935,740],[1090,790],[1190,910]];
    function update(value,nextPhase='hold'){
      depth=clamp(value);phase=nextPhase;scene.dataset.ventDepth=depth.toFixed(3);scene.dataset.ventPhase=phase;flow.dataset.flow=phase;
      painter?.draw(depth);
      const dome=domePoints.map(p=>point(...p,depth));$('.ra-vent-dome').setAttribute('d',`M${dome[0]}Q${dome[1]} ${dome[2]}Q${dome[3]} ${dome[4]}Q${dome[5]} ${dome[6]}`);
      const start=point(770,690,phase==='out'?1:0),end=point(770,690,depth);$('.ra-vent-dia-arrow').setAttribute('d',`M${start}L${end}`);
      const lung=point(1055,475,depth),dia=point(580,811,depth);
      for(const [name,p,label] of [['lung',lung,[1135,436]],['dia',dia,[365,919]]]){const g=$('.ra-vent-'+name+'-label');g.querySelector('path').setAttribute('d',`M${p}L${label}`);g.querySelector('circle').setAttribute('cx',p[0]);g.querySelector('circle').setAttribute('cy',p[1]);}
      slider.value=Math.round(depth*100);$('#ra-vent-depth-value').textContent=Math.round(depth*100)+'%';slider.setAttribute('aria-valuetext',depth<.02?'End of quiet exhalation':depth>.98?'End of inhalation':Math.round(depth*100)+'% of illustrated inspiration');
      const expanded=depth>.5;
      $('[data-vent-lungs]').textContent=phase==='in'?'Expanding · volume increases':phase==='out'?'Recoiling · volume decreases':expanded?'Expanded · held volume':'Resting / partly expanded';
      $('[data-vent-muscle]').textContent=phase==='in'?'Contracting · flattens downward':phase==='out'?'Relaxing · domes upward':depth<.02?'Relaxed · domed upward':depth>.98?'Contracted · lower and flatter':'Partly contracted · held position';
      $('.ra-vent-phase').textContent=phase==='in'?'INHALING · AIR IN':phase==='out'?'EXHALING · AIR OUT':'HOLDING · NO AIRFLOW';
      const description=phase==='in'?'The diaphragm contracts downward, increasing chest volume. Alveolar pressure falls below atmospheric pressure, so air enters.':phase==='out'?'The diaphragm relaxes upward. Elastic recoil reduces lung volume; alveolar pressure rises above atmospheric pressure, so air leaves.':'At this held position, alveolar pressure equals atmospheric pressure and airflow stops. The lungs retain air after a quiet exhalation.';
      if((window.InneruLocale?InneruLocale.source($('.ra-vent-status')):$('.ra-vent-status').textContent)!==description)$('.ra-vent-status').textContent=description;
      canvas.setAttribute('aria-label',(phase==='in'?'Inhaling: lungs expanding, diaphragm contracting downward':phase==='out'?'Exhaling: lungs recoiling, diaphragm relaxing upward':'Held breathing position with no airflow')+'. Illustrated inspiration '+Math.round(depth*100)+'%.');
      const route=$('.ra-ventilation-flow .ra-transport');route.classList.toggle('is-backward',phase==='out');route.setAttribute('aria-label',phase==='hold'?'No airflow between atmosphere and lungs':phase==='in'?'Air moves from atmosphere into lungs':'Air moves from lungs to atmosphere');route.querySelector('b').textContent=phase==='hold'?'NO AIRFLOW':phase==='in'?'AIR IN':'AIR OUT';route.querySelector('.ra-direction').textContent=phase==='hold'?'↔':phase==='in'?'→':'←';
      $('.ra-vent-air').setAttribute('d',phase==='out'?'M768 285V110':'M768 110V285');
    }
    function stop(){cancelAnimationFrame(frame);clearTimeout(settle);playing=false;play.textContent='Play one breath';play.setAttribute('aria-pressed','false');update(depth);}
    function transition(to,after){
      cancelAnimationFrame(frame);clearTimeout(settle);const from=depth;
      if(Math.abs(to-from)<.001){update(to);after?.();return;}
      if(!canMove()){update(to);return;}
      const direction=to>from?'in':'out',duration=Math.max(450,Math.abs(to-from)*(direction==='in'?2000:2600));let start;
      function tick(time){if(dead)return;if(!canMove()){stop();return;}start??=time;const t=clamp((time-start)/duration),eased=(1-Math.cos(Math.PI*t))/2;update(from+(to-from)*eased,direction);if(t<1)frame=requestAnimationFrame(tick);else{update(to);after?.();}}
      frame=requestAnimationFrame(tick);
    }
    stage.querySelectorAll('[data-vent-pose]').forEach(b=>b.addEventListener('click',()=>{stop();transition(b.dataset.ventPose==='in'?1:0);},{signal}));
    play.addEventListener('click',()=>{if(playing){stop();return;}if(!canMove())return;stop();playing=true;play.textContent='Pause breath';play.setAttribute('aria-pressed','true');const inhale=()=>transition(1,()=>{settle=setTimeout(()=>transition(0,stop),250);});if(depth>.98)transition(0,inhale);else inhale();},{signal});
    slider.addEventListener('input',()=>{const next=Number(slider.value)/100,previous=depth;stop();update(next,Math.abs(next-previous)<.001?'hold':next>previous?'in':'out');settle=setTimeout(()=>update(depth),350);},{signal});
    slider.addEventListener('change',()=>{clearTimeout(settle);update(depth);},{signal});
    function motionChanged(){if(scene.classList.contains('is-static')){play.disabled=true;return;}if(!canMove())stop();play.disabled=!canMove();}
    root.addEventListener('ra-motion-change',motionChanged,{signal});
    const visibility=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();},{threshold:0});visibility.observe(scene);
    const state=new MutationObserver(motionChanged);state.observe(root,{attributes:true,attributeFilter:['class']});
    function unavailable(){stop();scene.classList.remove('is-rendered');scene.classList.add('is-static');stage.querySelectorAll('[data-vent-pose], [data-vent-play], #ra-vent-depth').forEach(el=>el.disabled=true);$('.ra-vent-status').textContent='The animation is unavailable on this device. Compare the breathing positions in Mission 04.';}
    canvas.addEventListener('webglcontextlost',ev=>{ev.preventDefault();if(!dead)unavailable();},{signal});
    image.onload=()=>{if(dead)return;try{painter=renderer(canvas,image);update(depth,phase);scene.classList.add('is-rendered');motionChanged();}catch{unavailable();}};image.onerror=()=>{if(!dead)unavailable();};image.src=asset;
    update(0);motionChanged();
    return ()=>{dead=true;cancelAnimationFrame(frame);clearTimeout(settle);controller.abort();visibility.disconnect();state.disconnect();image.onload=image.onerror=null;painter?.dispose();};
  }
  window.InneruRespVentilation={markup,mount};
})();
