/* Six different evidence benches. Only local observation state is changed here. */
(() => {
  'use strict';
  const svg=(label,body)=>`<svg viewBox="0 0 800 250" role="img" aria-label="${label}">${body}</svg>`;
  const buttons=(action,items)=>`<div class="dd-tool-options" role="group">${items.map(([v,t])=>`<button type="button" data-dd-act-${action}="${v}" aria-pressed="false">${t}</button>`).join('')}</div>`;
  const table=(caption,heads,rows)=>`<table class="dd-data-table"><caption>${caption}</caption><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>i===0?`<th scope="row">${v}</th>`:`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const note=text=>`<p class="dd-tool-note">${text}</p>`;
  function markup(id) {
    if(id==='touch')return `<span class="dd-label">VIRTUAL CONTACT SITE</span>${buttons('site',[[0,'Fingertip'],[1,'Forearm']])}<span class="dd-label">POINT SEPARATION</span>${buttons('spacing',[[3,'3 mm'],[6,'6 mm'],[12,'12 mm']])}<div data-dd-tool-output></div><button type="button" class="dd-button" data-dd-act-touch-run>Run ten virtual trials</button>${note('Illustrative response counts, not personal sensory thresholds. Both sites use the same contact method and number of trials.')}`;
    if(id==='spine')return `<div data-dd-tool-output></div>${buttons('time',[[0,'Day 1 · morning'],[1,'Day 1 · evening'],[2,'Day 2 · morning']])}<div class="dd-tool-actions"><button type="button" class="dd-button" data-dd-act-pair>Compare selected pair</button><button type="button" class="dd-button dd-line" data-dd-act-method>Read method log</button></div><p data-dd-method hidden>Same adult volunteer, bare feet, same measuring device and posture, repeated readings at each time. These are fictional teaching measurements.</p><p class="dd-tool-result" data-dd-pair-result role="status">Choose two timestamps to compare.</p>`;
    if(id==='wave')return `${buttons('wave',[[0,'Forward wave'],[1,'Reverse wave']])}<div data-dd-tool-output></div><label class="dd-label" for="dd-wave-frame">Time-lapse frame <output data-dd-frame-label>1 / 4</output></label><input id="dd-wave-frame" type="range" min="0" max="3" step="1" value="0"><div class="dd-tool-actions"><button type="button" class="dd-button dd-line" data-dd-act-frame="-1">← Previous frame</button><button type="button" class="dd-button dd-line" data-dd-act-frame="1">Next frame →</button><button type="button" class="dd-button" data-dd-act-play>Play four frames</button></div>${note('Horizontal schematic tube. The wave and marker are enlarged; positions and timing are model values, not gut transit measurements.')}`;
    if(id==='air')return `<span class="dd-label">CHOOSE THE PROTOCOL</span>${buttons('protocol',[[0,'Unequal volumes'],[1,'Equal volumes + time']])}<div data-dd-tool-output></div><button type="button" class="dd-button" data-dd-act-air-run>Run paired comparison</button>${note('Virtual CO₂-responsive indicator. All runs use the same indicator and 30-second exposure. Indicator units are relative teaching responses, not gas percentages.')}`;
    if(id==='signal')return `${buttons('signal',[[0,'Steady signal'],[1,'Weak signal'],[2,'Motion affected']])}<label class="dd-check"><input type="checkbox" data-dd-act-overlay> Overlay the constant reference</label><div data-dd-tool-output></div><button type="button" class="dd-button" data-dd-act-capture>Capture this comparison</button><p class="dd-tool-result" data-dd-capture-feedback role="status"></p>${note('A virtual pulse source supplies six pulses in each identical window. The clip traces are illustrative recordings, not measurements from a person.')}`;
    return `${buttons('ledger',[[0,'Concentration / litre'],[1,'Whole 24-hour collection']])}<div data-dd-tool-output></div><div class="dd-calculations"><label for="dd-total-a">Collection A · total urea<input id="dd-total-a" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Amount in grams"></label><label for="dd-total-b">Collection B · total urea<input id="dd-total-b" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Amount in grams"></label><label for="dd-total-unit">Report the totals as<select id="dd-total-unit"><option value="">Choose the unit…</option><option value="concentration">g/L</option><option value="amount">g per complete 24-hour collection</option></select></label></div><button type="button" class="dd-button" data-dd-act-ledger-check>Audit the collection ledger</button><p class="dd-tool-result" data-dd-ledger-feedback role="status"></p>${note('Both simulated urine collections cover the same complete 24-hour period. Amount = concentration × collected volume; no urine-colour inference is used.')}`;
  }
  function mount(root,id,m,onReady,canAnimate) {
    const controller=new AbortController(),events={signal:controller.signal};
    const output=root.querySelector('[data-dd-tool-output]');let timer=0,playing=false,dead=false;
    m.seen??=new Set();m.value??=0;
    if(id==='sample') {
      m.amounts??=['',''];m.unit??='';
      root.querySelector('#dd-total-a').value=m.amounts[0];root.querySelector('#dd-total-b').value=m.amounts[1];root.querySelector('#dd-total-unit').value=m.unit;
    }
    const mark=(key,value)=>root.querySelectorAll('[data-dd-act-'+key+']').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset['ddAct'+key[0].toUpperCase()+key.slice(1)]===value)));
    const ready=value=>{m.ready=!!value;onReady(m.ready);};
    function draw() {
      if(dead)return;
      if(id==='touch') {
        m.site??=0;m.spacing??=3;m.results??={};
        const separation=m.spacing*8;
        output.innerHTML=svg('Two virtual contacts with '+m.spacing+' millimetres separation',`<rect x="140" y="55" width="520" height="135" rx="65" fill="#edc2ac" stroke="#b88e75"/><circle cx="${400-separation/2}" cy="115" r="10" fill="#278a7d"/><circle cx="${400+separation/2}" cy="115" r="10" fill="#278a7d"/><text x="400" y="220" text-anchor="middle">${m.site===0?'Fingertip':'Forearm'} · ${m.spacing} mm</text>`)+`<table class="dd-data-table"><caption>Two-point reports / ten trials</caption><thead><tr><th>Site</th><th>3 mm</th><th>6 mm</th><th>12 mm</th></tr></thead><tbody>${['Fingertip','Forearm'].map((s,i)=>`<tr><th>${s}</th>${[3,6,12].map(n=>`<td>${m.results[i+'-'+n]??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        mark('site',m.site);mark('spacing',m.spacing);
        ready(['0-3','1-3','0-12','1-12'].every(k=>k in m.results));
      } else if(id==='spine') {
        m.pair??=[];m.compared??=new Set();
        const points=[[130,70],[400,180],[670,81]],heights=['169.4','168.4','169.3'];
        output.innerHTML=svg('Repeated height measurements: 169.4, 168.4 and 169.3 centimetres',`<path d="M80 30v180h650" fill="none" stroke="#a7bda8"/><path d="M130 70L400 180L670 81" fill="none" stroke="#368779" stroke-width="4"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${m.pair.includes(i)?12:7}" fill="${m.pair.includes(i)?'#b89457':'#368779'}"/><text x="${x}" y="${y-20}" text-anchor="middle">${heights[i]} cm</text><text x="${x}" y="242" text-anchor="middle">${['Morning 1','Evening 1','Morning 2'][i]}</text>`).join('')}`)+table('Time-stamped teaching measurements',['Time','Height'],[['Day 1 · morning','169.4 cm'],['Day 1 · evening','168.4 cm'],['Day 2 · morning','169.3 cm']])+note('Vertical differences are enlarged to make the comparison visible. The labelled values are the actual teaching data; the graph is not a zero-baseline height chart.');
        root.querySelectorAll('[data-dd-act-time]').forEach(b=>b.setAttribute('aria-pressed',String(m.pair.includes(+b.dataset.ddActTime))));
        ready(m.method&&m.compared.has('0-1')&&m.compared.has('1-2'));
      } else if(id==='wave') {
        m.frame??=0;m.wave??=0;
        const x=m.wave===0?180+m.frame*160:660-m.frame*160,behind=m.wave===0?x-80:x+80;
        output.innerHTML=svg('A travelling smooth-muscle constriction and a marker in a horizontal tube',`<path d="M40 65H760V185H40Z" fill="#f6d9c3" stroke="#b28b78" stroke-width="3"/>${[100,260,420,580,740].map(c=>`<ellipse cx="${c}" cy="125" rx="16" ry="60" fill="none" stroke="#cf9688" stroke-width="5"/>`).join('')}<ellipse cx="${behind}" cy="125" rx="17" ry="34" fill="none" stroke="#a94d5a" stroke-width="13"/><ellipse cx="${x}" cy="125" rx="28" ry="37" fill="#d0b16f" stroke="#a68e55" stroke-width="2"/><text x="400" y="230" text-anchor="middle">${m.wave===0?'Forward':'Reverse'} wave · frame ${m.frame+1} · marker position ${Math.round(x)}</text>`);
        if(m.frame===3)m.seen.add(m.wave);
        root.querySelector('#dd-wave-frame').value=m.frame;
        root.querySelector('[data-dd-frame-label]').textContent=(m.frame+1)+' / 4';
        mark('wave',m.wave);ready(m.seen.size===2);
      } else if(id==='air') {
        m.protocol??=0;m.runs??=new Set();
        const ran=m.runs.has(m.protocol),values=ran?(m.protocol===0?[2,8,0]:[2,6,0]):[0,0,0];
        output.innerHTML=svg('Relative CO₂ indicator responses in ambient, exhaled and no-air blank samples',`${values.map((v,i)=>{const x=130+i*270;return `<rect x="${x-60}" y="35" width="120" height="150" rx="16" fill="#e5eeee" stroke="#94b4b0" stroke-width="3"/><rect x="${x-54}" y="65" width="108" height="114" rx="7" fill="#7cb4b0"/><rect x="${x-54}" y="65" width="108" height="114" rx="7" fill="#dfbb61" opacity="${v/8}"/><text x="${x}" y="217" text-anchor="middle">${['Ambient','Exhaled','No-air blank'][i]}</text><text x="${x}" y="244" text-anchor="middle">${ran?v+' units':'Not run'}</text>`;}).join('')}`)+table('Relative indicator responses',['Sample','Response'],['Ambient','Exhaled','No-air blank'].map((name,i)=>[name,ran?values[i]+' units':'Not run']))+`<p class="dd-protocol-note">Ambient: 20 mL · exhaled: ${m.protocol===0?40:20} mL · exposure: 30 seconds each · blank: no air added.</p>`;
        mark('protocol',m.protocol);ready(m.protocol===1&&m.runs.has(0)&&m.runs.has(1));
      } else if(id==='signal') {
        m.signal??=0;m.overlay??=false;m.captured??=new Set();
        const peaks=m.signal===0?[100,210,320,430,540,650]:m.signal===1?[100,320,650]:[80,140,210,290,360,430,500,580,680];
        const wave=(arr,y,h)=>`M50 ${y} `+arr.map(x=>`L${x-14} ${y} L${x-5} ${y-10} L${x} ${y-h} L${x+7} ${y+5} L${x+17} ${y}`).join(' ')+`L750 ${y}`;
        output.innerHTML=svg('Clip trace compared with a six-pulse constant reference',`${m.overlay?`<path d="${wave([100,210,320,430,540,650],80,45)}" fill="none" stroke="#b96c73" stroke-width="3"/><text x="60" y="25">Reference: 6 pulses</text>`:'<text x="60" y="65">Reference hidden · turn on the overlay</text>'}<path d="${wave(peaks,185,m.signal===1?17:45)}" fill="none" stroke="#2c8b7d" stroke-width="4"/><text x="60" y="235">Clip: ${peaks.length} recorded peaks · ${['steady','weak signal','motion affected'][m.signal]}</text>`)+table('Signal comparison',['Source','Count in the same window'],[['Reference',m.overlay?'6 pulses':'Hidden'],['Clip',peaks.length+' recorded peaks']])+`<p class="dd-protocol-note">Captured comparisons: ${m.captured.size} / 3. The source reference stays constant.</p>`;
        root.querySelector('[data-dd-act-overlay]').checked=m.overlay;
        mark('signal',m.signal);ready(m.captured.size===3);
      } else {
        m.view??=0;m.views??=new Set();m.views.add(m.view);
        const vals=m.view===0?[25,10]:[20,20],max=25;
        output.innerHTML=svg(m.view===0?'Concentrations: A 25 and B 10 grams per litre':'Total amounts: both collections contain 20 grams',`${vals.map((v,i)=>{const x=210+i*360,h=v/max*150;return `<rect x="${x-70}" y="${195-h}" width="140" height="${h}" rx="9" fill="${i===0?'#5e9f8a':'#be9a64'}"/><text x="${x}" y="${180-h}" text-anchor="middle">${v} ${m.view===0?'g/L':'g / 24h'}</text><text x="${x}" y="235" text-anchor="middle">Collection ${i===0?'A':'B'}</text>`;}).join('')}`)+`<div class="dd-collection-labels"><span>A · 0.8 L · 25 g/L · complete 24h</span><span>B · 2.0 L · 10 g/L · complete 24h</span></div>`;
        mark('ledger',m.view);ready(m.validated&&m.views.size===2&&root.querySelector('#dd-total-a').value!==''&&+root.querySelector('#dd-total-a').value===20&&+root.querySelector('#dd-total-b').value===20&&root.querySelector('#dd-total-unit').value==='amount');
      }
    }
    function stop(){clearTimeout(timer);playing=false;const b=root.querySelector('[data-dd-act-play]');if(b){b.textContent='Play four frames';b.setAttribute('aria-pressed','false');}}
    function step(){if(dead||!canAnimate()){stop();return;}m.frame=Math.min(3,m.frame+1);draw();if(m.frame<3)timer=setTimeout(step,800);else stop();}
    root.addEventListener('click',event=>{
      const b=event.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-dd-act-site'))m.site=+b.dataset.ddActSite;
      else if(b.hasAttribute('data-dd-act-spacing'))m.spacing=+b.dataset.ddActSpacing;
      else if(b.hasAttribute('data-dd-act-touch-run')){const counts=[[8,10,10],[1,3,7]];m.results[m.site+'-'+m.spacing]=counts[m.site][[3,6,12].indexOf(m.spacing)];}
      else if(b.hasAttribute('data-dd-act-time')){const n=+b.dataset.ddActTime;m.pair=m.pair.includes(n)?m.pair.filter(x=>x!==n):[...m.pair.slice(-1),n];}
      else if(b.hasAttribute('data-dd-act-pair')){const p=[...m.pair].sort();if(p.length!==2){root.querySelector('[data-dd-pair-result]').textContent='Choose exactly two timestamps.';return;}m.compared.add(p.join('-'));const h=[169.4,168.4,169.3],delta=h[p[1]]-h[p[0]];root.querySelector('[data-dd-pair-result]').textContent=`Later minus earlier: ${delta>0?'+':''}${delta.toFixed(1)} cm. Required paired comparisons collected: ${['0-1','1-2'].filter(k=>m.compared.has(k)).length} / 2.`;}
      else if(b.hasAttribute('data-dd-act-method')){m.method=true;root.querySelector('[data-dd-method]').hidden=false;}
      else if(b.hasAttribute('data-dd-act-wave')){stop();m.wave=+b.dataset.ddActWave;m.frame=0;}
      else if(b.hasAttribute('data-dd-act-frame')){stop();m.frame=Math.max(0,Math.min(3,m.frame+(+b.dataset.ddActFrame)));}
      else if(b.hasAttribute('data-dd-act-play')){if(playing){stop();return;}if(!canAnimate())return;playing=true;m.frame=0;b.textContent='Pause frames';b.setAttribute('aria-pressed','true');draw();timer=setTimeout(step,800);return;}
      else if(b.hasAttribute('data-dd-act-protocol'))m.protocol=+b.dataset.ddActProtocol;
      else if(b.hasAttribute('data-dd-act-air-run'))m.runs.add(m.protocol);
      else if(b.hasAttribute('data-dd-act-signal'))m.signal=+b.dataset.ddActSignal;
      else if(b.hasAttribute('data-dd-act-capture')){if(m.overlay)m.captured.add(m.signal);root.querySelector('[data-dd-capture-feedback]').textContent=m.overlay?'Comparison captured. Check the reference against the recorded peaks.':'Turn on the reference overlay before capturing this comparison.';}
      else if(b.hasAttribute('data-dd-act-ledger'))m.view=+b.dataset.ddActLedger;
      else if(b.hasAttribute('data-dd-act-ledger-check')){m.validated=root.querySelector('#dd-total-a').value!==''&&root.querySelector('#dd-total-b').value!==''&&+root.querySelector('#dd-total-a').value===20&&+root.querySelector('#dd-total-b').value===20&&root.querySelector('#dd-total-unit').value==='amount';root.querySelector('[data-dd-ledger-feedback]').textContent=m.validated?'Both complete collections contain 20 g. Compare the two graph views before filing.':'Check concentration × volume for each complete collection, and distinguish amount from concentration in your unit.';}
      else return;
      draw();
    },events);
    root.addEventListener('input',event=>{if(event.target.id==='dd-wave-frame'){stop();m.frame=+event.target.value;draw();}else if(['dd-total-a','dd-total-b'].includes(event.target.id)){m.amounts=[root.querySelector('#dd-total-a').value,root.querySelector('#dd-total-b').value];m.validated=false;draw();}},events);
    root.addEventListener('change',event=>{if(event.target.hasAttribute('data-dd-act-overlay')){m.overlay=event.target.checked;draw();}else if(event.target.id==='dd-total-unit'){m.unit=event.target.value;m.validated=false;draw();}},events);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},events);
    const page=root.closest('.dd-page'),prefs=new MutationObserver(()=>{if(!canAnimate())stop();const b=root.querySelector('[data-dd-act-play]');if(b)b.disabled=!canAnimate();});prefs.observe(page,{attributes:true,attributeFilter:['data-dd-motion']});
    const visible=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();});visible.observe(root);
    draw();const play=root.querySelector('[data-dd-act-play]');if(play)play.disabled=!canAnimate();
    return ()=>{dead=true;stop();controller.abort();prefs.disconnect();visible.disconnect();};
  }
  window.InneruDetectiveTools={markup,mount};
})();
