/* ============================================================================
   Mission illustrations
   ----------------------------------------------------------------------------
   One inline SVG diagram per mission for the Integumentary, Respiratory,
   Circulatory and Excretory systems. The Skeletal and Muscular missions have
   their own artwork and are deliberately not touched here.

   House style, taken from those two systems:
     * a single tinted rounded panel behind the drawing
     * thin dark outlines, soft fills, a gentle drop shadow
     * small annotation labels with leader lines to dots on the drawing
     * restrained animation: slow opacity breathing, a drifting dashed flow along a
       pathway, and a quiet fade-in. Nothing flashes.
   Each system keeps its own tint so the diagrams are recognisably part of their
   world while sharing the same construction.
   ========================================================================== */
(function () {
  'use strict';

  const TEAL = 'var(--ma-teal,#0d7d78)';

  /* ---------------------------------------------------------------- helpers */
  const L = (x, y, t, anchor, size) =>
    `<text class="ma-l" x="${x}" y="${y}" text-anchor="${anchor || 'start'}"${size ? ` font-size="${size}"` : ''}>${t}</text>`;
  const lead = (x1, y1, x2, y2) => `<path class="ma-lead" d="M${x1} ${y1} L${x2} ${y2}"/>`;
  const dot = (x, y, r) => `<circle class="ma-dot" cx="${x}" cy="${y}" r="${r || 3.4}"/>`;
  const circ = (x, y, r, cls) => `<circle class="${cls || 'ma-s'}" cx="${x}" cy="${y}" r="${r}"/>`;
  const ell = (x, y, rx, ry, cls, extra) => `<ellipse class="${cls || 'ma-s'}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${extra || ''}/>`;
  const rr = (x, y, w, h, r, cls, extra) => `<rect class="${cls || 'ma-s'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r || 8}"${extra || ''}/>`;
  const path = (d, cls, extra) => `<path class="${cls || 'ma-s'}" d="${d}"${extra || ''}/>`;
  const flow = (d, dur) => `<path class="ma-flow" d="${d}" style="animation-duration:${dur || 3.2}s"/>`;
  const arrow = (x1, y1, x2, y2, cls) =>
    `<path class="${cls || 'ma-arrow'}" d="M${x1} ${y1} L${x2} ${y2}" marker-end="url(#maHead)"/>`;
  const tag = (x, y, text) => rr(x, y, Math.max(46, text.length * 7.1 + 16), 22, 11, 'ma-tag') + L(x + 9, y + 15, text);
  const breathe = (x, y, r, cls) => `<circle class="${cls || 'ma-a'} ma-breathe" cx="${x}" cy="${y}" r="${r}"/>`;

  const defs = `<defs>
    <marker id="maHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="${TEAL}"/>
    </marker>
    <linearGradient id="maPanel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--ma-tint-a)"/><stop offset="1" stop-color="var(--ma-tint-b)"/>
    </linearGradient>
    <radialGradient id="maGlow" cx="50%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

  function figure(system, label, caption, inner, height) {
    const h = height || 240;
    const tall = h > 240 ? ' is-tall' : '';
    return `<figure class="mission-art ma-${system}${tall}" role="group" aria-label="${label}">
      <svg class="ma" viewBox="0 0 720 ${h}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">
        ${defs}
        <rect class="ma-panel" x="0" y="0" width="720" height="${h}" rx="16" fill="url(#maPanel)"/>
        <rect class="ma-panel-sheen" x="0" y="0" width="720" height="${h}" rx="16" fill="url(#maGlow)"/>
        ${inner}
      </svg>
      <figcaption>${caption}</figcaption>
    </figure>`;
  }

  /* diagrams taller than the standard panel */
  const TALL = { integumentary: { 1: 400, 2: 400 }, respiratory: { 1: 400, 2: 400 } };


  /* --------------------------------------------------------------------------
     A detailed skin cross-section, shared by this system's first two missions.
     Blocks: a top skin surface with depth, then the cut face carrying the strata,
     the dermis contents and the fat lobules.
     ------------------------------------------------------------------------ */
  const SKIN = {
    left: 196, right: 556, top: 100, depth: 30, bottom: 356,
    bands: [['corneum', 100, 132], ['lucidum', 132, 143], ['granulosum', 143, 167],
            ['spinosum', 167, 206], ['basale', 206, 224], ['dermis', 224, 302], ['fat', 302, 356]]
  };
  const SKIN_FILL = { corneum: 'ma-stratum-corneum', lucidum: 'ma-stratum-lucidum',
    granulosum: 'ma-stratum-granulosum', spinosum: 'ma-stratum-spinosum',
    basale: 'ma-stratum-basale', dermis: 'ma-dermis', fat: 'ma-hypodermis' };

  function skinCross(overlay) {
    const S = SKIN, X = S.left, R = S.right, D = S.depth;
    const band = n => S.bands.find(b => b[0] === n);
    const ya = n => band(n)[1], yb = n => band(n)[2], ym = n => (ya(n) + yb(n)) / 2;
    let o = '';

    /* the block: skin surface plus the cut side */
    o += path(`M${X} ${S.top} H${R} L${R + D} ${S.top - D} H${X + D} Z`, 'ma-surface');
    o += path(`M${R} ${S.top} L${R + D} ${S.top - D} V${S.bottom - D} L${R} ${S.bottom} Z`, 'ma-side');

    /* strata */
    S.bands.forEach(([n, a, b]) => { o += path(`M${X} ${a} H${R} V${b} H${X} Z`, SKIN_FILL[n]); });

    /* corneum flakes, granular cells, prickle cells, basal cells */
    o += [...Array(6)].map((_, i) => path(`M${X + 22 + i * 58} ${ya('corneum') + 8} q20 -12 40 0`, 'ma-flake')).join('');
    o += [...Array(10)].map((_, i) => circ(X + 30 + i * 38, ya('granulosum') + 12, 5, 'ma-granule')).join('');
    o += [...Array(8)].map((_, i) => {
      const cx = X + 40 + i * 46, cy = ya('spinosum') + 19;
      return circ(cx, cy, 10, 'ma-prickle') +
        path(`M${cx - 17} ${cy} h6 M${cx + 11} ${cy} h6 M${cx} ${cy - 17} v6 M${cx} ${cy + 11} v6`, 'ma-spine');
    }).join('');
    o += [...Array(12)].map((_, i) => rr(X + 20 + i * 29, ya('basale') + 5, 20, 12, 5, 'ma-basal-cell')).join('');
    o += [0, 1, 2].map(i => {
      const cx = X + 96 + i * 130;
      return circ(cx, ya('basale') + 9, 8, 'ma-melanocyte') +
        [...Array(4)].map((_, k) => circ(cx + 8 + k * 6, ya('basale') - 7 - k * 7, 2.4, 'ma-melanin-grain')).join('');
    }).join('');

    /* dermis: collagen, vessels, glands, nerve, hairs */
    o += [...Array(5)].map((_, i) => path(`M${X + 8} ${ya('dermis') + 20 + i * 15} q130 ${i % 2 ? 12 : -12} 260 0 q70 -4 92 4`, 'ma-collagen')).join('');
    o += path('M206 254 q50 -22 96 4 q40 18 74 -4 q66 -40 120 4 q40 24 54 -8', 'ma-vessel-red');
    o += path('M206 284 q56 -18 100 4 q44 16 78 -8 q62 -34 118 2', 'ma-vessel-blue');
    o += [...Array(4)].map((_, i) => path(`M${250 + i * 78} ${250 + (i % 2) * 22} q10 -16 20 0`, 'ma-vessel-branch')).join('');
    o += flow('M216 258 q44 -20 92 4 q42 18 76 -4', 3.6);
    o += path('M300 216 q26 -20 48 -6 q10 -22 30 -12 q14 8 6 30 q-8 24 -34 22 q-30 -2 -50 -34 z', 'ma-sebaceous');
    o += path('M420 274 q14 -18 28 0 q14 18 28 0 q-2 22 -14 26 q-16 6 -30 -6 q-10 -8 -12 -20 z', 'ma-sweat-coil');
    o += path('M452 268 q-6 -86 4 -168', 'ma-duct');
    o += flow('M456 254 q-6 -74 2 -154', 4.2);
    o += ell(268, 284, 19, 11, 'ma-nerve-end') + path('M268 272 q-4 -42 -18 -60', 'ma-nerve-fibre');
    o += [[236, 292], [352, 258], [468, 226]].map(([hx, fy]) => {
      const midY = (S.top + fy) / 2;
      return path(`M${hx} ${S.top + 4} Q${hx + 7} ${midY} ${hx + 9} ${fy - 14}`, 'ma-follicle-tube') +
        path(`M${hx - 2} ${S.top + 2} L${hx - 34} 44`, 'ma-hair') +
        path(`M${hx} ${S.top + 10} Q${hx + 5} ${midY} ${hx + 7} ${fy - 18}`, 'ma-hair') +
        circ(hx + 9, fy - 6, 11, 'ma-bulb');
    }).join('');

    /* fat lobules */
    o += [...Array(16)].map((_, i) => circ(X + 28 + (i % 8) * 46, ya('fat') + 18 + Math.floor(i / 8) * 24, 14, 'ma-fat-cell')).join('');
    o += L(X + 20, yb('fat') - 12, 'Fat cells', 'start', 12.5);

    /* --- left column: strata labels with leader lines into the block */
    const leftLabel = (name, y, size) => {
      const t = L(12, y + 5, name, 'start', size);
      return t + lead(150, y, X - 4, y) + dot(X - 2, y);
    };
    o += leftLabel('Stratum corneum', ym('corneum'));
    o += leftLabel('Stratum lucidum', ym('lucidum'), 11.5);
    o += leftLabel('Stratum granulosum', ym('granulosum'), 11.5);
    o += leftLabel('Stratum spinosum', ym('spinosum'));
    o += leftLabel('Basal layer', ym('basale'), 11.5);
    o += L(12, ya('basale') + 34, 'Melanocyte', 'start', 11.5) + lead(150, ya('basale') + 30, 284, ya('basale') + 12) + dot(288, ya('basale') + 9);
    o += L(58, 40, 'Hair shaft') + lead(150, 44, 196, 58) + dot(200, 60);

    /* dermis contents: numbered markers, named in the legend under the block */
    const marker = (n, x, y) => circ(x, y, 9.5, 'ma-marker') + L(x, y + 4.5, String(n), 'middle', 11.5).replace('class="ma-l"', 'class="ma-marker-num"');
    o += marker(1, 352, ya('dermis') + 4);
    o += marker(2, 452, ya('dermis') + 58);
    o += marker(3, 300, ya('dermis') + 30);
    o += marker(4, 268, ya('dermis') + 62);

    /* brackets */
    const bracket = (a, b, label) => {
      const bx = R + D + 12;
      return path(`M${bx} ${a} h10 V${b} h-10`, 'ma-bracket') + L(bx + 18, (a + b) / 2 + 5, label);
    };
    o += bracket(ya('corneum'), yb('basale'), 'Epidermis');
    o += bracket(yb('basale'), yb('dermis'), 'Dermis');
    o += bracket(yb('dermis'), S.bottom, 'Hypodermis');

    /* legend, so the crowded dermis needs no overlapping labels */
    const legend = ['Sebaceous gland', 'Sweat gland', 'Blood vessels', 'Nerve ending'];
    let lx = 30;
    legend.forEach((name, i) => {
      o += circ(lx + 8, S.bottom + 26, 9.5, 'ma-marker') +
           L(lx + 8, S.bottom + 30.5, String(i + 1), 'middle', 11.5).replace('class="ma-l"', 'class="ma-marker-num"') +
           L(lx + 24, S.bottom + 31, name, 'start', 12).replace('class="ma-l"', 'class="ma-l ma-legend"');
      lx += 34 + name.length * 7.4;
    });
    return o + (overlay || '');
  }

  const skinRenewal = () => skinCross(
    arrow(470, 214, 470, 126) + L(484, 172, 'New cells push') + L(484, 188, 'upward') +
    path('M300 100 q30 -28 68 -16', 'ma-shed') + L(376, 78, 'Old cells shed'));

  /* ---------------------------------------------------------------- integumentary */
  const integ = [
    () => skinCross(),
      'Skin in section: the five epidermal strata, the dermis with its hairs, glands and vessels, and the fat layer beneath. Numbered markers are named in the legend.',
    () => skinRenewal(),
      'New cells are made in the basal layer and are pushed up through the strata as older cells are shed from the surface.',
    () => `${rr(60, 60, 470, 140, 14, 'ma-skin')}
      ${path('M60 112 H530', 'ma-ink-line')}
      ${path('M200 190 q-16 -60 6 -96 q22 -34 0 -34', 'ma-ink-line')}
      ${path('M212 190 q22 -70 30 -96', 'ma-shaft')}
      ${ell(214, 92, 13, 20, 'ma-follicle')}${L(238, 74, 'Hair follicle')}${lead(238, 78, 220, 88)}
      ${path('M262 150 q26 -13 44 4 q-16 18 -44 4 z', 'ma-gland')}${L(310, 146, 'Sebaceous gland')}${lead(308, 150, 292, 156)}
      ${path('M150 150 q-14 24 4 40 q18 -12 6 -40 z', 'ma-gland')}${L(96, 206, 'Sweat gland')}${lead(130, 202, 152, 186)}
      ${rr(470, 96, 46, 62, 8, 'ma-nail')}${L(470, 88, 'Nail plate')}`,
      'A follicle with its oil gland, a sweat gland, and the nail plate.',
    () => `${path('M180 60 q-26 60 -12 120 q14 40 42 40 q28 0 42 -40 q14 -60 -12 -120 z', 'ma-body')}
      ${L(150, 48, 'Core')}${L(240, 60, 'Skin surface')}
      ${flow('M168 96 q-22 30 0 60', 3.4)}${L(96, 112, 'Vasodilation')}${lead(120, 108, 164, 104)}
      ${path('M212 92 q18 6 0 22', 'ma-a')}${breathe(218, 138, 8, 'ma-a')}${L(238, 150, 'Sweat droplet')}
      ${arrow(268, 120, 268, 84)}${L(280, 96, 'Heat leaves')}
      ${rr(430, 84, 12, 92, 6, 'ma-thermo')}${rr(430, 132, 12, 44, 6, 'ma-thermo-fill')}${L(452, 100, '37 °C')}`,
      'Sweat and wider skin vessels release heat so the core temperature stays near 37 °C.',
    () => `${rr(60, 74, 400, 126, 14, 'ma-skin')}
      ${path('M60 118 H460', 'ma-ink-line')}
      ${arrow(150, 40, 150, 74)}${arrow(190, 40, 190, 74)}${L(206, 48, 'UV rays')}
      ${[...Array(4)].map((_, i) => circ(110 + i * 34, 96, 4, 'ma-melanin')).join('')}${L(96, 76, 'Melanin absorbs UV')}
      ${ell(300, 156, 22, 15, 'ma-a')}${L(330, 160, 'Touch receptor')}${lead(328, 156, 314, 154)}
      ${path('M300 156 q70 10 128 -22', 'ma-nerve')}${dot(432, 132)}${L(438, 128, 'To the brain')}`,
      'Melanin absorbs ultraviolet light, and receptors in the dermis report touch.',
    () => `${rr(60, 60, 470, 140, 14, 'ma-skin')}
      ${path('M60 112 H530', 'ma-ink-line')}
      ${path('M250 108 q30 34 62 0 q-30 26 -62 0 z', 'ma-wound')}
      ${[...Array(5)].map((_, i) => circ(262 + i * 11, 104, 4, 'ma-clot')).join('')}${L(250, 84, 'Clot and scab')}
      ${arrow(300, 70, 300, 96)}${L(312, 74, 'Cells divide')}
      ${path('M180 150 q60 26 150 0', 'ma-newtissue')}${L(180, 186, 'New tissue closes the gap')}
      ${breathe(420, 132, 7, 'ma-a')}${L(434, 136, 'Blood supply')}`,
      'A clot seals the wound, then dividing cells rebuild the skin beneath the scab.',
  ];


  /* --------------------------------------------------------------------------
     A full respiratory figure: head in profile, airway, lobed lungs with the
     bronchial tree, and the diaphragm. Modelled on the supplied reference.
     opts: { numbered, flow, arrows }
     ------------------------------------------------------------------------ */
  function bronchialTree() {
    let o = '';
    // two main bronchi splitting from the trachea base
    o += path('M258 186 q-24 10 -40 24', 'ra-bronchus') + path('M258 186 q26 10 44 24', 'ra-bronchus');
    // second and third generation branches, then alveolar clusters
    const branches = [
      [218, 210, -26, 34], [218, 210, -6, 46], [302, 210, 28, 34], [302, 210, 8, 46],
      [212, 236, -22, 30], [206, 254, -16, 34], [308, 236, 24, 30], [314, 254, 18, 34]
    ];
    branches.forEach(([x, y, dx, dy], i) => {
      o += path(`M${x} ${y} q${dx * .5} ${dy * .4} ${dx} ${dy}`, 'ra-bronchiole');
      const ex = x + dx, ey = y + dy;
      o += [...Array(4)].map((_, k) => {
        const a = (k / 4) * Math.PI * 2 + i;
        return circ(ex + Math.cos(a) * 9, ey + Math.sin(a) * 8, 4.6, 'ra-alveoli');
      }).join('');
    });
    return o;
  }

  function lungAnatomy(opts) {
    const o0 = opts || {};
    let o = '';
    /* head and neck */
    o += path('M232 40 q46 -8 60 26 q10 24 -4 40 l14 6 q-6 12 -22 12 q-4 14 -22 16 q-30 3 -38 -22 q-8 -28 12 -78 z', 'ra-head');
    o += path('M286 70 q10 4 8 14 q-2 8 -10 6', 'ra-nose');
    o += path('M240 84 q10 6 6 16', 'ra-ear');
    o += path('M252 128 q10 6 10 22 v10', 'ra-neck');
    /* torso */
    o += path('M232 158 q-74 6 -92 46 q-12 28 -10 72 q2 26 10 30 q96 12 200 2 q22 -4 24 -30 q4 -48 -12 -74 q-18 -44 -96 -46 z', 'ra-torso');
    /* nasal cavity, pharynx, larynx */
    o += path('M264 62 q22 2 22 14 q0 10 -16 12 q-14 1 -18 -10 q-3 -14 12 -16 z', 'ra-nasal');
    o += path('M262 92 q14 2 14 16 q0 12 -10 18 q-12 4 -16 -10 q-4 -16 12 -24 z', 'ra-pharynx');
    o += path('M256 128 q14 0 14 12 q0 10 -10 12 q-12 0 -12 -12 q0 -10 8 -12 z', 'ra-larynx');
    o += path('M250 124 q10 -10 20 -2 l-4 6 q-8 -5 -14 2 z', 'ra-epiglottis');
    /* trachea with cartilage rings */
    o += path('M258 140 V190', 'ra-trachea');
    o += [...Array(6)].map((_, i) => path(`M250 ${146 + i * 8} q8 -3 16 0`, 'ra-ring')).join('');
    /* lungs: lobed, with a notch on the left */
    o += path('M244 196 q-46 -16 -72 10 q-22 22 -18 62 q4 34 30 36 q30 2 46 -22 q14 -22 14 -50 z', 'ra-lung');
    o += path('M272 196 q46 -16 72 10 q22 22 18 62 q-4 34 -30 36 q-30 2 -46 -22 q-14 -22 -14 -50 z', 'ra-lung');
    o += path('M244 214 q-30 -6 -44 16 q-12 20 -10 44 q12 -34 42 -40 z', 'ra-lobe-line');
    o += path('M272 214 q30 -6 44 16 q12 20 10 44 q-12 -34 -42 -40 z', 'ra-lobe-line');
    o += path('M262 236 q-16 22 -34 34', 'ra-fissure') + path('M278 236 q16 22 34 34', 'ra-fissure');
    /* bronchial tree inside the lungs */
    o += `<g class="ra-tree">${bronchialTree()}</g>`;
    /* diaphragm */
    o += path('M154 300 q46 -30 98 -22 q54 8 100 22 l8 14 q-108 12 -214 0 z', 'ra-diaphragm');
    o += [...Array(7)].map((_, i) => path(`M${168 + i * 32} 300 q10 -10 20 0`, 'ra-diaphragm-fibre')).join('');

    if (o0.flow) o += flow('M258 148 V186 q-24 12 -40 26', 3.4) + flow('M258 148 V186 q26 12 44 26', 3.4);

    if (o0.arrows) {
      o += arrow(120, 70, 236, 62) + L(38, 62, 'O₂ in', 'start', 14);
      o += arrow(232, 96, 118, 104) + L(30, 118, 'CO₂ out', 'start', 14);
      o += rr(430, 210, 210, 130, 14, 'ra-cell') + L(452, 200, 'Body cell', 'start', 13.5);
      o += circ(500, 262, 20, 'ra-nucleus') + L(452, 300, 'Oxygen used,', 'start', 12.5) + L(452, 316, 'ATP released', 'start', 12.5);
      o += arrow(400, 232, 428, 244) + arrow(428, 300, 400, 288);
      o += `<circle class="ra-atp ma-breathe" cx="600" cy="288" r="13"/>` + L(586, 320, 'ATP', 'middle', 12.5);
    }

    if (o0.numbered) {
      const tag = (n, x, y, name, lx, ly) => circ(x, y, 11, 'ra-num') +
        L(x, y + 4.5, String(n), 'middle', 12).replace('class="ma-l"', 'class="ra-num-l"') +
        lead(x, y, lx, ly) + L(lx + (lx > x ? 8 : -8), ly + 5, name, lx > x ? 'start' : 'end', 13);
      o += tag(1, 300, 74, 'Nose', 352, 52);
      o += tag(2, 268, 74, 'Nasal cavity', 432, 74);
      o += tag(3, 268, 108, 'Pharynx', 432, 104);
      o += tag(4, 262, 136, 'Larynx', 432, 134);
      o += tag(5, 258, 168, 'Trachea', 432, 166);
      o += tag(6, 276, 200, 'Bronchi', 432, 196);
      o += tag(7, 214, 250, 'Lungs', 92, 232);
      o += tag(8, 190, 268, 'Alveoli', 92, 288);
      o += tag(9, 258, 306, 'Diaphragm', 432, 314);
    }
    return o;
  }

  /* three panels for the respiratory lab: the three linked events */
  function respEvents() {
    let panelIndex = 0;
    const panel = (py, title, event, body) =>
      `<g class="ra-event" data-event="${event}" data-i="${panelIndex++}">` +
        rr(10, py, 440, 122, 14, 'ra-panel') +
        L(28, py + 26, title, 'start', 13.5) +
        body +
      '</g>';
    let inner = '';
    /* ventilation: the chest and diaphragm move air in and out */
    inner += panel(10, 'VENTILATION', 'ventilation',
      arrow(150, 112, 150, 52) + L(118, 62, 'air in', 'middle', 13) +
      arrow(240, 52, 240, 112) + L(272, 62, 'air out', 'middle', 13) +
      path('M108 118 q62 -16 124 0', 'ra-dome') + path('M108 112 q62 -16 124 0', 'ra-dome-line') +
      L(356, 62, 'Pressure', 'start', 12.5) + L(356, 80, 'drives the', 'start', 12.5) + L(356, 98, 'air flow', 'start', 12.5));
    /* external exchange: at the alveolus, across a one-cell wall */
    inner += panel(140, 'EXTERNAL EXCHANGE', 'exchange',
      circ(150, 202, 34, 'ra-alveolus') + path('M116 202 q34 -22 68 0 q-34 22 -68 0 z', 'ra-cap') +
      arrow(224, 174, 186, 188) + L(230, 172, 'O₂ in', 'start', 13) +
      arrow(186, 222, 224, 236) + L(230, 242, 'CO₂ out', 'start', 13) +
      L(290, 194, 'Alveolus meets', 'start', 12.5) + L(290, 212, 'a lung capillary', 'start', 12.5));
    /* cellular respiration: the cell releases ATP */
    inner += panel(270, 'CELLULAR RESPIRATION', 'cellular',
      rr(120, 300, 150, 74, 12, 'ra-cell') + circ(166, 337, 17, 'ra-nucleus') +
      arrow(78, 318, 114, 330) + L(74, 312, 'O₂', 'end', 13) +
      arrow(114, 360, 78, 348) + L(74, 372, 'CO₂', 'end', 13) +
      '<circle class="ra-atp ma-breathe" cx="330" cy="336" r="12"/>' +
      L(330, 366, 'ATP', 'middle', 12.5) + L(352, 330, 'Energy released', 'start', 12.5) + L(352, 348, 'for the cell', 'start', 12.5));
    return `<svg viewBox="0 0 460 402" role="img" aria-label="The three linked events: ventilation moves air, external exchange swaps gases at the alveoli, and cellular respiration releases ATP in body cells" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  }

  /* ---------------------------------------------------------------- respiratory */
  const resp = [
    () => lungAnatomy({ arrows: true }),
      'Air is drawn into the lungs, oxygen crosses into the blood at the alveoli, and body cells use it to release energy while giving off carbon dioxide.',
    () => lungAnatomy({ numbered: true, flow: true }),
      'The numbered route through the respiratory system: nose, nasal cavity, pharynx, larynx, trachea, bronchi, lungs, alveoli, with the diaphragm beneath.',
    () => `${circ(300, 120, 68, 'ma-alveolus')}
      ${path('M232 120 q68 -30 136 0 q-68 30 -136 0 z', 'ma-cap')}
      ${path('M300 52 q30 40 0 68 q-30 -28 0 -68 z', 'ma-alveolus-in')}
      ${arrow(150, 84, 258, 108)}${L(146, 74, 'O₂ in')}
      ${arrow(258, 146, 150, 122)}${L(146, 164, 'CO₂ out')}
      ${L(232, 40, 'Alveolus (one cell thick)')}${lead(300, 46, 300, 60)}
      ${L(360, 190, 'Capillary wrapping it')}${lead(358, 186, 350, 150)}
      ${flow('M228 120 q72 -22 144 0', 3.0)}
      ${breathe(300, 120, 10, 'ma-a')}`,
      'Oxygen diffuses into the blood and carbon dioxide out, across a one-cell-thick wall.',
    () => `${path('M120 120 q110 -54 220 0', 'ma-diaphragm')}
      ${path('M120 120 q110 -54 220 0', 'ma-diaphragm-move')}
      ${L(120, 96, 'Diaphragm')}
      ${arrow(380, 88, 380, 132)}${L(392, 96, 'Contracts, moves down')}
      ${arrow(470, 132, 470, 88)}${L(482, 96, 'Volume up')}
      ${arrow(560, 132, 560, 88)}${L(572, 96, 'Pressure down')}
      ${flow('M110 44 q110 20 220 0', 3.4)}${L(110, 34, 'Air flows in')}
      ${rr(120, 168, 300, 44, 12, 'ma-gauge')}${rr(120, 168, 196, 44, 12, 'ma-gauge-fill')}
      ${L(126, 196, 'Tidal volume — about half a litre at rest')}`,
      'Contracting the diaphragm enlarges the chest, so pressure falls and air flows in.',
    () => `${circ(160, 120, 44, 'ma-rbc')}${circ(160, 120, 26, 'ma-rbc-in')}
      ${L(112, 60, 'Red blood cell')}${lead(160, 74, 160, 92)}
      ${[...Array(6)].map((_, i) => circ(122 + (i % 3) * 38, 106 + Math.floor(i / 3) * 28, 6, 'ma-hb')).join('')}
      ${arrow(214, 108, 292, 108)}${L(220, 98, 'O₂ onto haemoglobin')}
      ${rr(300, 78, 108, 84, 12, 'ma-cell')}${L(310, 68, 'Working muscle')}
      ${arrow(292, 140, 214, 140)}${L(220, 158, 'CO₂ carried back')}
      ${flow('M56 120 q60 -34 104 0', 3.6)}
      ${breathe(160, 120, 8, 'ma-a')}`,
      'Haemoglobin loads oxygen in the lungs and releases it where a muscle is working.',
    () => `${circ(240, 116, 56, 'ma-alveolus')}${circ(240, 116, 38, 'ma-alveolus-in')}
      ${[...Array(9)].map((_, i) => path(`M${192 + i * 12} ${74 + (i % 2) * 4} q4 14 -2 22`, 'ma-cilia')).join('')}
      ${[...Array(7)].map((_, i) => circ(160 + i * 26, 62, 4.2, 'ma-dust')).join('')}
      ${L(150, 44, 'Dust and germs trapped in mucus')}
      ${flow('M150 66 q90 16 180 -2', 2.8)}
      ${rr(360, 96, 130, 26, 10, 'ma-cig')}${rr(486, 96, 18, 26, 6, 'ma-cig-tip')}
      ${circ(430, 140, 30, 'ma-block')}${path('M410 120 L450 160', 'ma-block-line')}
      ${L(360, 186, 'Smoke damages cilia and alveoli')}
      ${breathe(240, 116, 9, 'ma-a')}`,
      'Cilia and mucus sweep particles out; smoke damages both and destroys alveoli.',
  ];

  /* ---------------------------------------------------------------- circulatory */
  const circArt = [
    () => `${path('M90 120 h180 q20 0 20 -20 v-30', 'ma-vessel-out')}
      ${path('M270 70 v-30 q0 -20 -20 -20 h-160', 'ma-vessel-mid')}
      ${rr(64, 96, 26, 48, 12, 'ma-wall')}${L(56, 88, 'Thick wall')}
      ${rr(272, 130, 24, 44, 12, 'ma-valve')}${L(304, 152, 'Valve')}${lead(302, 148, 296, 146)}
      ${flow('M92 120 h176 q20 0 20 -20 v-30', 3.2)}
      ${arrow(430, 96, 430, 140)}${L(442, 104, 'One-way flow')}
      ${rr(360, 60, 120, 40, 10, 'ma-tag')}${L(370, 86, 'Artery → capillary')}`,
      'Arteries carry blood away with a thick wall; valves keep venous flow one way.',
    () => `${circ(300, 120, 64, 'ma-bed')}
      ${[...Array(5)].map((_, i) => path(`M248 ${92 + i * 14} q52 ${i % 2 ? 12 : -12} 104 0`, 'ma-cap')).join('')}
      ${arrow(180, 100, 258, 108)}${L(176, 90, 'O₂ and glucose in')}
      ${arrow(258, 148, 180, 156)}${L(176, 176, 'CO₂ and wastes out')}
      ${L(232, 40, 'Capillary bed — walls one cell thick')}${lead(300, 46, 300, 62)}
      ${breathe(300, 120, 9, 'ma-a')}
      ${rr(430, 70, 118, 44, 10, 'ma-tag')}${L(440, 90, 'Exchange happens')}${L(440, 106, 'only here')}`,
      'Exchange with the tissues happens only in capillaries, where the wall is one cell thick.',
    () => `${path('M300 60 q66 0 66 60 q0 60 -66 60 q-66 0 -66 -60 q0 -60 66 -60 z', 'ma-heart')}
      ${path('M300 60 v120', 'ma-septum')}${path('M234 120 h132', 'ma-septum')}
      ${rr(240, 74, 52, 40, 10, 'ma-chamber')}${rr(308, 74, 52, 40, 10, 'ma-chamber')}
      ${rr(240, 128, 52, 40, 10, 'ma-chamber-strong')}${rr(308, 128, 52, 40, 10, 'ma-chamber')}
      ${L(96, 84, 'Right atrium')}${lead(200, 80, 252, 92)}${dot(252, 92)}
      ${L(516, 84, 'Left atrium')}${lead(510, 80, 350, 92)}${dot(350, 92)}
      ${L(74, 178, 'Right ventricle → lungs')}${lead(216, 174, 254, 150)}${dot(254, 150)}
      ${L(506, 178, 'Left ventricle → body')}${lead(500, 174, 348, 150)}${dot(348, 150)}
      ${L(74, 214, 'The left ventricle has the thickest wall')}
      ${breathe(266, 148, 10, 'ma-a')}`,
      'The right ventricle pumps to the lungs; the left pumps to the whole body.',
    () => `${rr(56, 96, 96, 62, 12, 'ma-tissue')}${L(64, 88, 'Body tissues')}
      ${rr(200, 96, 96, 62, 12, 'ma-lung')}${L(214, 88, 'Lung capillaries')}
      ${rr(344, 96, 96, 62, 12, 'ma-heart')}${L(352, 88, 'Heart')}
      ${rr(488, 96, 96, 62, 12, 'ma-tissue')}${L(496, 88, 'Back to body')}
      ${arrow(152, 112, 200, 112)}${arrow(296, 112, 344, 112)}${arrow(440, 112, 488, 112)}
      ${flow('M152 140 q60 26 120 0 q60 -26 120 0 q60 26 96 0', 4.0)}
      ${L(64, 182, 'Oxygen-poor blood')}${L(352, 182, 'Oxygen-rich blood returns')}
      ${dot(390, 112)}${lead(390, 112, 390, 140)}${L(396, 154, 'Never crosses back')}`,
      'Blood makes one loop through the lungs and one through the body — the double circuit.',
    () => `${circ(180, 110, 42, 'ma-rbc')}${circ(180, 110, 24, 'ma-rbc-in')}
      ${L(140, 52, 'Red cell')}${L(140, 172, 'Carries oxygen')}
      ${ell(320, 110, 34, 24, 'ma-platelet')}${L(286, 76, 'Platelets')}${L(286, 158, 'Clot the blood')}
      ${circ(450, 96, 26, 'ma-wbc')}${L(492, 92, 'White cell')}${L(492, 110, 'Fights pathogens')}
      ${rr(392, 148, 150, 40, 10, 'ma-plasma')}${L(402, 174, 'Plasma carries glucose')}
      ${flow('M240 110 q60 -30 120 0', 3.4)}
      ${breathe(180, 110, 8, 'ma-a')}`,
      'Plasma carries dissolved cargo; cells, platelets and white cells each do a different job.',
    () => `${rr(80, 76, 120, 88, 14, 'ma-blood-a')}${L(96, 68, 'Type A')}${dot(140, 120, 9)}
      ${rr(240, 76, 120, 88, 14, 'ma-blood-b')}${L(256, 68, 'Type B')}${dot(300, 120, 9)}
      ${rr(400, 76, 120, 88, 14, 'ma-blood-ab')}${L(416, 68, 'Type AB')}${dot(440, 120, 9)}${dot(480, 120, 9)}
      ${rr(560, 76, 100, 88, 14, 'ma-blood-o')}${L(576, 68, 'Type O')}
      ${arrow(200, 120, 240, 120)}${arrow(360, 120, 400, 120)}
      ${L(80, 196, 'Markers on the red cell decide which donated blood can be given safely.')}
      ${breathe(460, 120, 7, 'ma-a')}`,
      'Blood groups are decided by markers on the red cell, which is why a match matters.',
    () => `${path('M150 60 q60 60 0 120', 'ma-vessel')}
      ${circ(150, 88, 9, 'ma-clot-in')}${L(96, 76, 'Blockage')}${lead(120, 80, 144, 86)}
      ${rr(240, 88, 120, 64, 14, 'ma-brain')}${L(252, 80, 'Brain')}
      ${arrow(176, 96, 236, 108)}${L(180, 74, 'No blood')}
      ${rr(420, 88, 130, 64, 14, 'ma-heart')}${L(432, 80, 'Heart muscle')}
      ${arrow(176, 140, 416, 140)}${L(240, 162, 'A blocked vessel starves the tissue it supplies')}
      ${rr(420, 172, 230, 34, 10, 'ma-tag')}${L(430, 194, 'Act fast: stroke or heart attack')}`,
      'A blocked vessel starves the tissue beyond it — a stroke in the brain, a heart attack in the heart.',
  ];

  /* ---------------------------------------------------------------- excretory */
  const exc = [
    () => `${path('M240 50 q-40 40 -30 96 q8 44 48 44 q40 0 48 -44 q10 -56 -30 -96 z', 'ma-body')}
      ${L(206, 40, 'Body')}
      ${circ(300, 96, 16, 'ma-lung')}${L(322, 92, 'Lungs → CO₂')}${lead(320, 94, 312, 96)}
      ${path('M180 150 q-18 26 4 44', 'ma-skin')}${L(120, 168, 'Skin → sweat')}${lead(150, 166, 176, 164)}
      ${ell(268, 168, 20, 26, 'ma-kidney')}${L(226, 206, 'Kidneys → urea')}${lead(256, 200, 268, 186)}
      ${flow('M336 108 q40 40 6 82', 3.6)}${L(352, 130, 'Wastes leave')}
      ${breathe(300, 96, 8, 'ma-a')}`,
      'Three exits for waste: the lungs release carbon dioxide, the skin loses salts, the kidneys remove urea.',
    () => `${path('M250 62 q64 -12 92 30 q30 46 -10 84 q-44 42 -92 8 q-40 -30 -22 -74 q12 -34 32 -48 z', 'ma-kidney')}
      ${path('M262 84 q40 -6 56 22 q16 30 -8 54 q-26 24 -56 4 q-24 -20 -12 -48 q10 -24 20 -32 z', 'ma-cortex')}
      ${path('M276 104 q22 -4 32 14 q8 18 -6 32 q-16 14 -32 2 q-14 -12 -6 -28 q6 -14 12 -20 z', 'ma-medulla')}
      ${ell(300, 150, 16, 14, 'ma-pelvis')}
      ${L(360, 74, 'Renal cortex')}${lead(358, 78, 320, 92)}
      ${L(364, 110, 'Renal medulla')}${lead(362, 114, 314, 120)}
      ${L(364, 154, 'Renal pelvis')}${lead(362, 154, 318, 152)}
      ${path('M300 164 q6 30 -6 46', 'ma-ureter')}${L(302, 214, 'Ureter')}
      ${flow('M300 164 q6 30 -6 46', 3.2)}`,
      'A kidney in section: cortex outside, medulla within, pelvis collecting urine into the ureter.',
    () => `${circ(190, 116, 46, 'ma-glomerulus')}
      ${[...Array(4)].map((_, i) => path(`M${152 + i * 8} ${96 + i * 12} q20 -14 40 0`, 'ma-cap')).join('')}
      ${L(120, 54, 'Glomerulus filters')}${lead(160, 60, 178, 92)}
      ${path('M236 116 h150 q22 0 22 20 v10', 'ma-tubule')}
      ${[...Array(4)].map((_, i) => circ(268 + i * 32, 116, 5.4, i < 3 ? 'ma-small' : 'ma-large')).join('')}
      ${L(250, 96, 'Water, glucose, salts pass')}
      ${circ(410, 132, 11, 'ma-large')}${L(428, 136, 'Proteins and cells stay')}
      ${arrow(190, 74, 190, 44)}${L(150, 36, 'Blood in')}${arrow(360, 74, 360, 44)}${L(320, 36, 'Blood out')}
      ${flow('M236 116 h150 q22 0 22 20 v10', 3.4)}`,
      'At the glomerulus small molecules are filtered out; proteins and blood cells stay behind.',
    () => `${path('M110 90 h180 q24 0 24 24 v40 q0 24 -24 24 h-180', 'ma-tubule')}
      ${circ(180, 112, 6, 'ma-small')}${circ(240, 112, 6, 'ma-small')}
      ${arrow(180, 100, 180, 62)}${L(140, 52, 'Most water back')}${lead(178, 58, 180, 104)}
      ${arrow(240, 100, 240, 62)}${L(252, 52, 'Glucose and amino acids back')}${lead(248, 58, 242, 104)}
      ${flow('M110 150 h204', 3.0)}
      ${arrow(330, 150, 400, 150)}${L(336, 140, 'Urea, excess salts, creatinine')}
      ${rr(410, 128, 120, 44, 10, 'ma-urine')}${L(420, 154, 'Leaves as urine')}
      ${breathe(214, 150, 7, 'ma-a')}`,
      'The tubule reabsorbs useful substances back into the blood and leaves waste to leave as urine.',
    () => `${path('M200 56 q-34 34 -26 82 q7 38 41 38 q34 0 41 -38 q8 -48 -26 -82 z', 'ma-body')}
      ${[...Array(3)].map((_, i) => circ(228 + i * 12, 92 + i * 16, 5.4, 'ma-sweat')).join('')}
      ${L(252, 96, 'Sweat loses water')}
      ${ell(232, 178, 18, 24, 'ma-kidney')}${L(186, 214, 'Kidneys conserve water')}${lead(216, 208, 230, 196)}
      ${flow('M150 120 q-24 40 0 78', 3.4)}
      ${rr(340, 88, 190, 40, 10, 'ma-tag')}${L(350, 106, 'ADH rises → less urine,')}${L(350, 122, 'more concentrated')}
      ${arrow(360, 150, 470, 150)}${L(360, 172, 'Water reabsorbed')}
      ${breathe(390, 150, 7, 'ma-a')}`,
      'Exercise loses water as sweat, so ADH rises, more water is reabsorbed and urine is more concentrated.',
    () => `${ell(180, 116, 40, 52, 'ma-kidney')}${circ(170, 104, 8, 'ma-stone')}${L(120, 60, 'Stone blocks the ureter')}${lead(160, 66, 168, 96)}
      ${rr(290, 76, 150, 96, 14, 'ma-dialysis')}${[...Array(3)].map((_, i) => path(`M305 ${96 + i * 26} h120`, 'ma-tube')).join('')}
      ${L(300, 66, 'Dialysis filters the blood')}
      ${path('M446 110 h70', 'ma-tube')}${arrow(446, 124, 516, 124)}
      ${rr(530, 88, 130, 60, 12, 'ma-check')}${path('M552 118 l14 14 l26 -30', 'ma-check-mark')}${L(600, 122, 'Care')}
      ${flow('M290 124 h150', 3.6)}
      ${breathe(180, 116, 9, 'ma-a')}`,
      'A stone causes pain and needs treatment; dialysis takes over filtration when kidneys fail.',
  ];

  const ART = {
    integumentary: { list: integ, count: 6, name: 'Integumentary' },
    respiratory: { list: resp, count: 6, name: 'Respiratory' },
    circulatory: { list: circArt, count: 7, name: 'Circulatory' },
    excretory: { list: exc, count: 6, name: 'Excretory' },
  };

  /* Public: markup for one mission, or '' when that system has no artwork here.
     Each system array alternates a drawing function with its caption. */
  window.inneruMissionArt = function (system, n) {
    const set = ART[system];
    if (!set) return '';
    const i = (Math.min(Math.max(1, n), set.count) - 1) * 2;
    const draw = set.list[i], caption = set.list[i + 1];
    if (typeof draw !== 'function') return '';
    const h = (TALL[system] && TALL[system][n]) || 240;
    return figure(system, set.name + ' diagram: ' + caption, caption, draw(), h);
  };

  window.inneruRespEvents = respEvents;
  window.missionArtSystems = Object.keys(ART);
})();
