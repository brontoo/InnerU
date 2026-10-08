/* ============================================================================
   Activity illustrations
   ----------------------------------------------------------------------------
   A diagram for each interactive activity in the portal. They reuse the element
   classes defined for the mission figures, so an activity drawing and a mission
   drawing are visibly the same family: tinted panel, thin outlines, soft fills,
   label + leader line + dot, and restrained motion.

   Each interactive structure is wrapped in a group carrying data-i="<index>",
   matching the activity's own control order. The activity markup already records
   the current selection on its visual container as data-stage, so a small CSS rule
   highlights the matching structure while the learner works — no extra wiring.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- kit */
  const TEAL = 'var(--ma-teal,#0d7d78)';
  const L = (x, y, t, anchor, size) =>
    `<text class="ma-l" x="${x}" y="${y}" text-anchor="${anchor || 'start'}"${size ? ` font-size="${size}"` : ''}>${t}</text>`;
  const lead = (x1, y1, x2, y2) => `<path class="ma-lead" d="M${x1} ${y1} L${x2} ${y2}"/>`;
  const dot = (x, y, r) => `<circle class="ma-dot" cx="${x}" cy="${y}" r="${r || 3.4}"/>`;
  const circ = (x, y, r, cls) => `<circle class="${cls || 'ma-s'}" cx="${x}" cy="${y}" r="${r}"/>`;
  const ell = (x, y, rx, ry, cls) => `<ellipse class="${cls || 'ma-s'}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`;
  const rr = (x, y, w, h, r, cls, extra) =>
    `<rect class="${cls || 'ma-s'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r || 8}"${extra || ''}/>`;
  const path = (d, cls) => `<path class="${cls || 'ma-s'}" d="${d}"/>`;
  const flow = (d, dur) => `<path class="ma-flow" d="${d}" style="animation-duration:${dur || 3.4}s"/>`;
  const arrow = (x1, y1, x2, y2) => `<path class="ma-arrow" d="M${x1} ${y1} L${x2} ${y2}" marker-end="url(#aaHead)"/>`;
  const part = (i, inner) => `<g class="aa-part" data-i="${i}">${inner}</g>`;
  const breathe = (x, y, r, cls) => `<circle class="${cls || 'ma-a'} ma-breathe" cx="${x}" cy="${y}" r="${r}"/>`;
  const ellAt = (x, y, rx, ry, cls) => ell(x, y, rx, ry, cls || 'ma-s');

  const defs = `<defs>
    <marker id="aaHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="${TEAL}"/>
    </marker>
    <linearGradient id="aaPanel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--ma-tint-a)"/><stop offset="1" stop-color="var(--ma-tint-b)"/>
    </linearGradient>
    <radialGradient id="aaGlow" cx="50%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".7"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

  function figure(system, label, inner, height) {
    const h = height || 240;
    return `<figure class="activity-art ma-${system}" role="group" aria-label="${label}">
      <svg class="ma" viewBox="0 0 720 ${h}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">
        ${defs}
        <rect class="aa-panel" x="0" y="0" width="720" height="${h}" rx="16" fill="url(#aaPanel)"/>
        <rect class="aa-panel-sheen" x="0" y="0" width="720" height="${h}" rx="16" fill="url(#aaGlow)"/>
        ${inner}
      </svg>
    </figure>`;
  }

  /* ---------------------------------------------------------------- integumentary */
  const integ = {
    /* 1 · the skin's four tissue partners */
    1: () => figure('integumentary', 'The four tissue partners of skin: epithelium on the surface, connective tissue beneath, muscle and nerve running through the dermis', `
      ${rr(90, 40, 480, 168, 14, 'ma-skin')}
      ${path('M90 82 H570', 'ma-ink-line')}${path('M90 150 H570', 'ma-ink-line')}
      ${part(0, [...Array(9)].map((_, i) => circ(120 + i * 50, 61, 11, 'ma-basal-cell')).join('') +
        L(100, 30, 'Epithelial tissue lines the surface'))}
      ${part(1, [...Array(5)].map((_, i) => path(`M104 ${100 + i * 10} q120 ${i % 2 ? 10 : -10} 240 0 q100 -6 216 4`, 'ma-collagen')).join('') +
        L(100, 176, 'Connective tissue supports and binds'))}
      ${part(2, path('M300 116 H560', 'aa-muscle') + [...Array(7)].map((_, i) => path(`M${312 + i * 36} 110 v14`, 'aa-striation')).join('') +
        L(300, 104, 'Muscle'))}
      ${part(3, path('M110 136 q80 -14 140 4 q60 18 130 -4 q80 -24 150 4', 'ma-nerve-fibre') + ell(180, 136, 15, 10, 'ma-nerve-end') +
        L(96, 222, 'Nerve endings report touch and temperature'))}`),

    /* 2 · build the layers in order */
    2: () => figure('integumentary', 'The three layers of skin to place in order: epidermis, dermis and subcutaneous layer', `
      ${path('M170 62 H560 L596 40 H206 Z', 'ma-surface')}
      ${path('M560 62 L596 40 V186 L560 208 Z', 'ma-side')}
      ${part(0, path('M170 62 H560 V100 H170 Z', 'ma-stratum-corneum') +
        [...Array(6)].map((_, i) => path(`M${196 + i * 58} 74 q18 -10 36 0`, 'ma-flake')).join('') +
        '')}
      ${part(1, path('M170 100 H560 V164 H170 Z', 'ma-dermis') +
        path('M200 128 q90 -12 170 0 q90 12 170 -2', 'ma-collagen') + circ(300, 132, 6, 'ma-a') +
        '')}
      ${part(2, path('M170 164 H560 V208 H170 Z', 'ma-hypodermis') +
        [...Array(5)].map((_, i) => circ(206 + i * 74, 186, 13, 'ma-fat-cell')).join('') +
        '')}
      ${[...Array(3)].map((_, i) => `<g>${circ(120, 84 + i * 52, 15, 'ma-marker')}${L(120, 89 + i * 52, String(i + 1), 'middle', 13).replace('class="ma-l"', 'class="ma-marker-num"')}${lead(136, 84 + i * 52, 166, 84 + i * 52)}</g>`).join('')}
      ${L(24, 90, 'Epidermis', 'start', 13)}${L(24, 142, 'Dermis', 'start', 13)}${L(24, 194, 'Subcutaneous', 'start', 13)}
      ${L(470, 232, 'Order: outside in', 'start', 12.5)}`),

    /* 3 · hair, nails and glands */
    3: () => figure('integumentary', 'A hair follicle with its sebaceous gland, a sweat gland and the nail plate', `
      ${rr(80, 44, 470, 168, 14, 'ma-skin')}
      ${path('M80 92 H550', 'ma-ink-line')}${path('M80 150 H550', 'ma-ink-line')}
      ${part(0, path('M250 48 Q258 110 262 174', 'ma-follicle-tube') +
        path('M248 46 L214 12', 'ma-hair') + path('M250 56 Q256 110 258 166', 'ma-hair') + circ(264, 180, 12, 'ma-bulb') +
        L(150, 30, 'Hair follicle'))}
      ${part(1, path('M300 116 q26 -20 48 -6 q10 -22 30 -12 q14 8 6 30 q-8 24 -34 22 q-30 -2 -50 -34 z', 'ma-sebaceous') +
        L(386, 104, 'Sebaceous gland') + lead(384, 108, 348, 120))}
      ${part(2, path('M430 150 q14 -18 28 0 q14 18 28 0 q-2 22 -14 26 q-16 6 -30 -6 q-10 -8 -12 -20 z', 'ma-sweat-coil') +
        path('M462 144 q-6 -60 4 -100', 'ma-duct') + flow('M464 130 q-6 -50 2 -90', 4) +
        L(420, 200, 'Sweat gland'))}
      ${part(3, rr(500, 96, 46, 74, 8, 'ma-nail') + L(500, 88, 'Nail plate'))}`),

    /* 4 · hot, cold, sunlight */
    4: () => figure('integumentary', 'Three conditions and the skin response: heat with sweating and wider vessels, cold with narrowed vessels, and sunlight with melanin', `
      ${part(0, rr(34, 40, 208, 160, 14, 'aa-cond') + L(54, 68, 'HOT', 'start', 14) +
        path('M150 78 q-26 62 -14 96 q10 26 38 26 q28 0 38 -26 q12 -34 -14 -96 z', 'ma-body') +
        circ(150, 118, 7, 'ma-sweat') + circ(196, 138, 6, 'ma-sweat') + circ(112, 146, 5, 'ma-sweat') +
        L(54, 178, 'Sweat + wider vessels', 'start', 12.5))}
      ${part(1, rr(256, 40, 208, 160, 14, 'aa-cond') + L(276, 68, 'COLD', 'start', 14) +
        path('M372 78 q-26 62 -14 96 q10 26 38 26 q28 0 38 -26 q12 -34 -14 -96 z', 'ma-body') +
        path('M356 120 q16 10 32 0', 'ma-vessel-blue') + L(276, 178, 'Narrow vessels, shiver', 'start', 12.5))}
      ${part(2, rr(478, 40, 208, 160, 14, 'aa-cond') + L(498, 68, 'SUNLIGHT', 'start', 14) +
        path('M582 78 q-26 62 -14 96 q10 26 38 26 q28 0 38 -26 q12 -34 -14 -96 z', 'ma-body') +
        [...Array(3)].map((_, i) => arrow(536 + i * 44, 90, 552 + i * 40, 122)).join('') +
        circ(582, 132, 5, 'ma-melanin') + L(498, 178, 'Melanin absorbs UV', 'start', 12.5))}`),

    /* 5 · protect and sense */
    5: () => figure('integumentary', 'Skin at work: blocking water loss and germs, absorbing ultraviolet light, sensing pressure and temperature, and carrying heat away', `
      ${rr(150, 92, 420, 116, 14, 'ma-skin')}
      ${path('M150 132 H570', 'ma-ink-line')}
      ${part(0, arrow(230, 30, 230, 88) + circ(250, 44, 9, 'aa-germ') + circ(272, 52, 6, 'aa-germ') +
        L(150, 30, 'Water stays in, germs stay out', 'start', 12.5))}
      ${part(1, arrow(370, 22, 370, 88) + [...Array(4)].map((_, i) => circ(340 + i * 22, 146, 5, 'ma-melanin')).join('') +
        L(400, 34, 'UV absorbed by melanin', 'start', 12.5))}
      ${part(2, arrow(500, 34, 500, 120) + ell(500, 150, 18, 11, 'ma-nerve-end') +
        path('M500 140 q-6 -40 -18 -54', 'ma-nerve-fibre') + L(452, 200, 'Pressure and temperature', 'start', 12.5))}
      ${part(3, path('M180 208 q60 -30 130 -6 q70 24 140 -4', 'ma-vessel-red') + flow('M180 208 q60 -30 130 -6', 3.6) +
        L(150, 226, 'Heat carried away by blood', 'start', 12.5))}`),

    /* 6 · repair the shield, in order */
    6: () => figure('integumentary', 'Wound repair in four stages: the clot forms, the scab protects, defence cells respond and the surface renews', `
      ${part(0, rr(30, 60, 150, 130, 12, 'aa-stage') + L(48, 88, '1 · Clot', 'start', 13) +
        path('M70 100 q30 30 72 0 q-30 26 -72 0 z', 'ma-wound') +
        [...Array(5)].map((_, i) => circ(84 + i * 14, 96, 5, 'ma-clot')).join('') +
        L(46, 168, 'Platelets plug the gap', 'start', 12))}
      ${part(1, rr(196, 60, 150, 130, 12, 'aa-stage') + L(214, 88, '2 · Scab', 'start', 13) +
        path('M214 104 q40 -16 96 0 q6 12 -48 12 q-54 0 -48 -12 z', 'ma-clot') +
        path('M224 132 q36 16 76 0', 'ma-newtissue') +
        L(212, 168, 'A dry scab seals it', 'start', 12))}
      ${part(2, rr(362, 60, 150, 130, 12, 'aa-stage') + L(380, 88, '3 · Defence', 'start', 13) +
        circ(420, 120, 16, 'ma-wbc') + circ(452, 146, 12, 'ma-wbc') + circ(444, 106, 9, 'aa-germ') +
        L(378, 168, 'White cells fight germs', 'start', 12))}
      ${part(3, rr(528, 60, 150, 130, 12, 'aa-stage') + L(546, 88, '4 · Renew', 'start', 13) +
        path('M548 120 h110', 'ma-stratum-corneum') + circ(600, 120, 10, 'ma-basal-cell') +
        arrow(600, 152, 600, 132) + L(544, 168, 'New skin closes over', 'start', 12))}
      ${[...Array(3)].map((_, i) => arrow(182 + i * 166, 126, 194 + i * 166, 126)).join('')}`),
  };


  /* ---------------------------------------------------------------- circulatory */
  const circul = {
    /* 1 · three vessel types */
    1: () => figure('circulatory', 'Three vessel types in cross-section: an artery with a thick muscular wall and narrow lumen, a one-cell-thick capillary, and a vein with a thin wall, wide lumen and a valve', `
      ${part(0, circ(200, 116, 74, 'aa-artery-outer') + circ(200, 116, 54, 'aa-artery-mid') + circ(200, 116, 36, 'aa-lumen') +
        L(200, 222, 'Artery · thick wall, narrow lumen', 'middle', 12.5))}
      ${part(1, circ(370, 116, 34, 'aa-cap-outer') + circ(370, 116, 24, 'aa-lumen') +
        circ(414, 116, 6, 'ma-rbc') + L(370, 222, 'Capillary · one cell thick', 'middle', 12.5))}
      ${part(2, circ(540, 116, 62, 'aa-vein-outer') + circ(540, 116, 52, 'aa-lumen') +
        path('M540 54 q22 18 0 36 q-22 -18 0 -36', 'aa-valve') + path('M540 142 q22 18 0 36 q-22 -18 0 -36', 'aa-valve') +
        L(540, 222, 'Vein · thin wall, valve', 'middle', 12.5))}
      ${L(60, 40, 'Compare the wall and the lumen', 'start', 13)}`),

    /* 2 · the oxygen gradient decides the direction */
    2: () => figure('circulatory', 'Oxygen diffusion across a capillary wall: into the cell when blood is richer in oxygen, into the blood when the cell is richer', `
      ${rr(60, 70, 300, 60, 12, 'aa-blood')}${L(74, 62, 'Capillary blood', 'start', 12.5)}
      ${part(0, arrow(330, 100, 412, 100) + L(340, 88, 'O₂ into the cell', 'start', 12.5))}
      ${part(1, arrow(412, 140, 330, 140) + L(340, 160, 'CO₂ into the blood', 'start', 12.5))}
      ${part(2, arrow(330, 190, 412, 190) + arrow(412, 206, 330, 206) + L(448, 200, 'no net movement', 'start', 12.5))}
      ${rr(420, 60, 240, 110, 14, 'ma-cell')}${circ(500, 116, 20, 'ma-nucleus')}${L(548, 100, 'Body cell', 'start', 13)}
      ${path('M360 60 V210', 'aa-wall')}${L(360, 232, 'capillary wall', 'middle', 12)}
      ${flow('M70 100 H320', 3.6)}`),

    /* 3 · the four chambers, in the order blood meets them */
    3: () => figure('circulatory', 'The four heart chambers in the order blood meets them after returning from the body: right atrium, right ventricle, left atrium, left ventricle', `
      ${path('M300 46 q72 0 72 64 q0 66 -72 66 q-72 0 -72 -66 q0 -64 72 -64 z', 'ma-heart')}
      ${path('M300 46 v130', 'ma-septum')}${path('M228 114 h144', 'ma-septum')}
      ${part(0, rr(236, 58, 56, 44, 10, 'ma-chamber') + circ(264, 80, 13, 'ma-marker') +
        L(264, 85, '1', 'middle', 12).replace('class="ma-l"', 'class="ma-marker-num"'))}
      ${part(1, rr(236, 126, 56, 44, 10, 'ma-chamber-strong') + circ(264, 148, 13, 'ma-marker') +
        L(264, 153, '2', 'middle', 12).replace('class="ma-l"', 'class="ma-marker-num"'))}
      ${part(2, rr(308, 58, 56, 44, 10, 'ma-chamber') + circ(336, 80, 13, 'ma-marker') +
        L(336, 85, '3', 'middle', 12).replace('class="ma-l"', 'class="ma-marker-num"'))}
      ${part(3, rr(308, 126, 56, 44, 10, 'ma-chamber-strong') + circ(336, 148, 13, 'ma-marker') +
        L(336, 153, '4', 'middle', 12).replace('class="ma-l"', 'class="ma-marker-num"'))}
      ${L(96, 80, 'Right atrium', 'start', 12.5)}${lead(150, 80, 232, 80)}
      ${L(96, 150, 'Right ventricle', 'start', 12.5)}${lead(150, 146, 232, 146)}
      ${L(452, 80, 'Left atrium', 'start', 12.5)}${lead(448, 80, 368, 80)}
      ${L(452, 150, 'Left ventricle', 'start', 12.5)}${lead(448, 146, 368, 146)}
      ${L(300, 216, 'Blood returns from the body, then goes to the lungs', 'middle', 12)}`),

    /* 4 · the whole double circuit */
    4: () => figure('circulatory', 'The complete double circuit: body tissues, venae cavae, right atrium, right ventricle, pulmonary artery, lung capillaries, pulmonary veins, left atrium, left ventricle and aorta', `
      ${rr(60, 50, 600, 140, 60, 'aa-loop')}
      ${flow('M120 70 H600 q40 0 40 50 t-40 50 H120 q-40 0 -40 -50 t40 -50', 4.4)}
      ${[[120, 60, 'Body tissues'], [232, 60, 'Venae cavae'], [344, 60, 'Right atrium'], [456, 60, 'Right ventricle'],
         [568, 60, 'Pulmonary artery'], [600, 190, 'Lung capillaries'], [488, 190, 'Pulmonary veins'],
         [376, 190, 'Left atrium'], [264, 190, 'Left ventricle'], [152, 190, 'Aorta']]
        .map(([x, y, name], i) => part(i, circ(x, y, 9, 'ma-dot') + L(x, y - 20, name, 'middle', 11.5))).join('')}
      ${L(360, 126, 'Lungs sit here', 'middle', 12.5)}${lead(360, 132, 360, 150)}
      ${rr(300, 152, 120, 34, 10, 'ma-tag')}${L(360, 174, 'gas exchange', 'middle', 11.5)}`),

    /* 5 · what each blood component carries */
    5: () => figure('circulatory', 'The four blood components and their jobs: plasma carries dissolved materials, red cells carry gases, white cells defend, platelets seal leaks', `
      ${part(0, rr(40, 50, 150, 150, 14, 'aa-card') + path('M70 116 q14 -18 28 0 q14 18 28 0 q14 -18 28 0', 'aa-plasma') +
        L(66, 168, 'Plasma', 'start', 13) + L(66, 186, 'glucose, hormones', 'start', 11.5))}
      ${part(1, rr(200, 50, 150, 150, 14, 'aa-card') + circ(275, 116, 34, 'ma-rbc') + circ(275, 116, 18, 'ma-rbc-in') +
        L(226, 168, 'Red blood cell', 'start', 13) + L(226, 186, 'oxygen and CO₂', 'start', 11.5))}
      ${part(2, rr(360, 50, 150, 150, 14, 'aa-card') + circ(420, 112, 26, 'ma-wbc') + circ(452, 140, 12, 'aa-germ') +
        L(386, 168, 'White blood cell', 'start', 13) + L(386, 186, 'defence', 'start', 11.5))}
      ${part(3, rr(520, 50, 150, 150, 14, 'aa-card') + ell(595, 112, 26, 16, 'ma-platelet') +
        [...Array(5)].map((_, i) => path(`M${566 + i * 16} 142 l10 18`, 'aa-mesh')).join('') +
        L(546, 168, 'Platelet', 'start', 13) + L(546, 186, 'clotting', 'start', 11.5))}`),

    /* 6 · ABO compatibility grid */
    6: () => figure('circulatory', 'A simplified ABO red-cell compatibility grid: which donor red cells each recipient can safely receive', `
      ${['O', 'A', 'B', 'AB'].map((d, j) => L(300 + j * 88, 46, d, 'middle', 13)).join('')}
      ${L(268, 46, 'Donor', 'end', 12.5)}
      ${['O', 'A', 'B', 'AB'].map((rname, i) => {
        const allowed = { O: ['O'], A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B', 'AB', 'O'] }[rname];
        return part(i,
          rr(60, 58 + i * 42, 96, 34, 9, 'aa-card') + L(76, 80 + i * 42, 'Recipient ' + rname, 'start', 12) +
          ['O', 'A', 'B', 'AB'].map((d, j) =>
            `<g>${rr(252 + j * 88, 58 + i * 42, 72, 34, 9, allowed.includes(d) ? 'aa-ok' : 'aa-no')}` +
            L(288 + j * 88, 80 + i * 42, allowed.includes(d) ? '✓' : '✕', 'middle', 14).replace('class="ma-l"', 'class="aa-mark"') +
            `</g>`).join(''));
      }).join('')}
      ${L(268, 236, 'Recipient', 'end', 12.5)}`),

    /* 7 · pulse and plaque */
    7: () => figure('circulatory', 'An artery in section with plaque narrowing the lumen, and the pulse waveform it produces', `
      ${part(0, path('M60 78 h60 l14 -34 l16 68 l14 -34 h96 l14 -30 l16 60 l14 -30 h100 l14 -28 l16 56 l14 -28 h120', 'aa-pulse') +
        L(60, 46, 'Pulse wave', 'start', 12.5))}
      ${part(1, rr(60, 140, 600, 62, 30, 'aa-artery')) +
        path('M60 171 H660', 'aa-lumen') +
        `<ellipse class="aa-plaque" cx="300" cy="171" rx="16" ry="30"/>` +
        `<ellipse class="aa-plaque" cx="470" cy="171" rx="14" ry="30"/>` +
        L(60, 228, 'Plaque narrows the open lumen and raises resistance', 'start', 12.5) +
        arrow(600, 200, 660, 200) + arrow(120, 200, 60, 200)}
      ${part(2, L(690, 176, '', 'middle', 12))}`),
  };


  /* ---------------------------------------------------------------- excretory */
  const exc = {
    /* 1 · which organ removes what (bins: Lungs, Skin, Kidneys) */
    1: () => figure('excretory', 'Three exit routes for waste: the lungs release carbon dioxide and water vapour, the skin loses water and salts in sweat, and the kidneys remove urea and excess salts and water', `
      ${path('M300 40 q-46 44 -34 106 q9 48 54 48 q45 0 54 -48 q12 -62 -34 -106 z', 'ma-body')}
      ${part(0, circ(360, 96, 20, 'ma-lung') + path('M360 76 q-8 -22 4 -34', 'ma-airway') +
        arrow(392, 92, 446, 78) + L(452, 74, 'CO₂ and water vapour', 'start', 12.5))}
      ${part(1, path('M266 158 q-20 28 4 48', 'ma-skin') + circ(250, 176, 6, 'ma-sweat') + circ(238, 194, 5, 'ma-sweat') +
        arrow(216, 176, 162, 162) + L(156, 158, 'Water and salts in sweat', 'end', 12.5))}
      ${part(2, ell(322, 200, 22, 28, 'ma-kidney') + path('M322 228 q6 26 -4 40', 'ma-ureter') +
        arrow(356, 210, 420, 226) + L(426, 230, 'Urea, excess salts and water', 'start', 12.5))}
      ${flow('M300 88 q28 40 6 92', 4)}${L(196, 34, 'One body, three exit routes', 'start', 13)}`),

    /* 2 · the kidney route in order */
    2: () => figure('excretory', 'The route through a kidney in order: renal cortex, renal medulla, renal pelvis, ureter and urinary bladder', `
      ${part(0, path('M240 44 q78 -12 108 34 q34 52 -14 96 q-52 48 -108 8 q-46 -34 -26 -84 q14 -40 40 -54 z', 'ma-kidney') +
        circ(120, 88, 15, 'ma-marker') + L(120, 93, '1', 'middle', 13).replace('class="ma-l"', 'class="ma-marker-num"') +
        L(94, 66, 'Renal cortex', 'start', 12.5))}
      ${part(1, path('M268 74 q50 -6 68 28 q20 38 -12 68 q-34 32 -70 4 q-30 -22 -16 -60 q10 -30 30 -40 z', 'ma-medulla') +
        circ(330, 74, 15, 'ma-marker') + L(330, 79, '2', 'middle', 13).replace('class="ma-l"', 'class="ma-marker-num"') +
        L(360, 66, 'Renal medulla', 'start', 12.5))}
      ${part(2, ell(300, 150, 20, 17, 'ma-pelvis') +
        circ(300, 116, 15, 'ma-marker') + L(300, 121, '3', 'middle', 13).replace('class="ma-l"', 'class="ma-marker-num"') +
        L(392, 128, '4 · Ureter', 'start', 12.5))}
      ${path('M300 168 q8 40 -6 62', 'ma-ureter')}${flow('M300 168 q8 40 -6 62', 3.6)}
      ${part(3, path('M262 210 q40 -14 76 0 q10 30 -38 30 q-48 0 -38 -30 z', 'ma-urine') +
        circ(300, 196, 15, 'ma-marker') + L(300, 201, '5', 'middle', 13).replace('class="ma-l"', 'class="ma-marker-num"') +
        L(360, 232, 'Urinary bladder', 'start', 12.5))}
      ${L(150, 128, '3 · Renal pelvis', 'end', 12.5)}${lead(156, 124, 278, 146)}`),

    /* 3 · what passes the filter (bins: filtered / stays in blood) */
    3: () => figure('excretory', 'The filtration gate: water, glucose, urea and salts pass into the tubule while proteins and blood cells stay in the blood', `
      ${circ(250, 120, 56, 'ma-glomerulus')}
      ${[...Array(4)].map((_, i) => path(`M${206 + i * 12} ${100 + i * 12} q22 -14 44 0`, 'ma-cap')).join('')}
      ${path('M306 120 h84', 'aa-filter')}${L(312, 96, 'filter', 'start', 12)}
      ${part(0, arrow(322, 150, 420, 176) + circ(440, 184, 8, 'ma-small') + circ(470, 176, 7, 'ma-small') + circ(500, 188, 6, 'ma-small') +
        L(404, 214, 'Water, glucose, urea and salts pass into the tubule', 'start', 12.5))}
      ${part(1, circ(372, 74, 12, 'aa-protein') + circ(404, 62, 9, 'ma-rbc') +
        arrow(420, 74, 500, 74) + L(430, 100, 'Proteins and blood cells stay in the blood', 'start', 12.5))}
      ${flow('M206 120 h100', 3.6)}`),

    /* 4 · what the tubule takes back (bins: returned / leaves in urine) */
    4: () => figure('excretory', 'The tubule returns glucose, most of the water and amino acids to the blood, while urea, excess salts and creatinine leave in the urine', `
      ${path('M90 110 h180 q34 0 34 34 v20 q0 34 -34 34 h-180', 'ma-tubule')}
      ${part(0, arrow(200, 100, 200, 54) + L(120, 44, 'Glucose, amino acids', 'start', 12.5) +
        arrow(280, 100, 280, 54) + L(300, 44, 'most of the water', 'start', 12.5))}
      ${flow('M110 152 h150', 3.2)}
      ${part(1, arrow(310, 164, 400, 164) + L(322, 190, 'Urea, excess salts, creatinine leave as urine', 'start', 12.5) +
        rr(410, 140, 120, 46, 12, 'ma-urine') + L(420, 168, 'Urine', 'start', 12.5))}
      ${circ(150, 140, 6, 'ma-small')}${circ(240, 140, 6, 'ma-small')}${breathe(300, 164, 7, 'ma-a')}`),

    /* 5 · ADH and water balance (slider bands) */
    5: () => figure('excretory', 'ADH and water balance: as ADH rises, the collecting duct returns more water to the blood and the urine becomes more concentrated', `
      ${part(0, ell(200, 96, 34, 44, 'ma-kidney') + path('M200 138 q6 26 -4 40', 'ma-ureter') +
        path('M200 66 q-30 30 -18 74', 'aa-duct-low') + L(120, 60, 'Little water reabsorbed', 'start', 12.5) +
        circ(214, 176, 7, 'ma-sweat'))}
      ${part(1, ell(330, 96, 34, 44, 'ma-kidney') + path('M330 138 q6 26 -4 40', 'ma-ureter') +
        path('M330 66 q-30 30 -18 74', 'aa-duct-mid') + L(376, 60, 'More water reabsorbed', 'start', 12.5) +
        circ(344, 176, 6, 'ma-sweat'))}
      ${part(2, ell(460, 96, 34, 44, 'ma-kidney') + path('M460 138 q6 26 -4 40', 'ma-ureter') +
        path('M460 66 q-30 30 -18 74', 'aa-duct-high') + L(506, 60, 'Most water reabsorbed', 'start', 12.5) +
        circ(474, 176, 4, 'ma-sweat'))}
      ${flow('M200 96 q130 -26 260 0', 4)}
      ${L(120, 226, 'Low ADH · dilute urine', 'start', 12)}
      ${L(404, 226, 'High ADH · concentrated urine', 'start', 12)}`),

    /* 6 · healthy function versus something needing attention */
    6: () => figure('excretory', 'Healthy kidney function compared with findings that need medical attention such as blood in the urine or a stone blocking a ureter', `
      ${part(0, rr(40, 40, 300, 170, 14, 'aa-cond') + L(60, 68, 'HEALTHY FUNCTION', 'start', 13) +
        ell(150, 130, 34, 44, 'ma-kidney') + path('M150 172 q6 22 -4 34', 'ma-ureter') +
        flow('M150 96 q-20 34 -8 76', 3.6) +
        L(60, 192, 'Filters about 180 litres a day', 'start', 12) + L(60, 208, 'adjusts water and salt balance', 'start', 12))}
      ${part(1, rr(380, 40, 300, 170, 14, 'aa-alert') + L(400, 68, 'NEEDS ATTENTION', 'start', 13) +
        ell(490, 130, 34, 44, 'ma-kidney') + circ(478, 118, 8, 'ma-stone') + path('M490 172 q6 22 -4 34', 'ma-ureter') +
        circ(560, 116, 8, 'ma-clot') + L(548, 140, 'blood in urine', 'start', 12) +
        L(400, 192, 'A stone blocks the ureter', 'start', 12) + L(400, 208, 'dialysis replaces filtration', 'start', 12))}`),
  };


  /* ---------------------------------------------------------------- respiratory */
  const respSet = {
    /* 2 · the airway route, one part per stage */
    2: () => figure('respiratory', 'The airway route from the nose or mouth through the pharynx, larynx, trachea, bronchi and bronchioles to the alveoli', `
      ${part(0, path('M60 96 q-22 22 -6 44 q14 20 40 16 q-10 -30 -34 -60 z', 'ra-head') +
        path('M78 108 q14 6 14 16 q0 10 -14 12', 'ra-nasal') + L(46, 74, 'Nose or mouth', 'start', 12.5))}
      ${part(1, path('M110 120 h46', 'ra-trachea') + L(96, 200, 'Pharynx', 'start', 12.5) + lead(130, 194, 130, 134))}
      ${part(2, rr(168, 106, 40, 30, 9, 'ra-larynx') + L(150, 74, 'Larynx', 'start', 12.5) + lead(168, 80, 186, 104))}
      ${part(3, path('M228 120 h60', 'ra-trachea') + [...Array(4)].map((_, i) => path(`M${236 + i * 14} 112 v16`, 'ra-ring')).join('') +
        L(226, 200, 'Trachea', 'start', 12.5) + lead(256, 194, 256, 134))}
      ${part(4, path('M300 120 q24 0 32 22', 'ra-bronchus') + path('M300 120 q-24 0 -32 22', 'ra-bronchus') +
        L(276, 168, 'Bronchi', 'start', 12.5))}
      ${part(5, path('M324 168 q12 22 26 30', 'ra-bronchiole') + path('M292 168 q-12 22 -26 30', 'ra-bronchiole') +
        path('M350 198 q10 16 -6 24', 'ra-bronchiole') + path('M266 198 q-10 16 6 24', 'ra-bronchiole') +
        L(320, 232, 'Bronchioles', 'start', 12.5))}
      ${part(6, [...Array(6)].map((_, i) => circ(400 + (i % 3) * 30, 140 + Math.floor(i / 3) * 32, 11, 'ra-alveoli')).join('') +
        path('M360 176 q26 -18 40 -6', 'ra-bronchiole') + L(386, 226, 'Alveoli', 'start', 12.5))}
      ${flow('M122 120 h96 q20 0 30 20 q12 22 34 30', 4.2)}
      ${circ(448, 118, 14, 'ma-rbc')}${L(452, 90, 'to the blood', 'start', 12)}`),

    /* 3 · which way each gas moves */
    3: () => figure('respiratory', 'Gas exchange at one alveolus: oxygen moves from alveolar air into the capillary blood, and carbon dioxide moves the other way into the alveolar air', `
      ${circ(240, 120, 80, 'ra-alveolus')}${L(240, 214, 'Alveolus · air', 'middle', 12.5)}
      ${path('M320 120 q60 -34 120 0 q-60 34 -120 0 z', 'ra-cap')}${L(420, 214, 'Capillary · blood', 'middle', 12.5)}
      ${part(0, arrow(206, 88, 336, 88) + L(200, 80, 'Oxygen: air → blood', 'end', 12.5) + circ(268, 88, 9, 'ma-rbc'))}
      ${part(1, arrow(336, 154, 206, 154) + L(200, 162, 'Carbon dioxide: blood → air', 'end', 12.5) + dot(300, 154))}
      ${path('M316 84 V158', 'aa-wall')}${L(356, 62, 'one cell thick', 'start', 11.5)}
      ${breathe(240, 120, 16, 'ma-a')}`),

    /* 4 · the breathing engine */
    4: () => figure('respiratory', 'How breathing works: when the diaphragm contracts and moves down the chest volume rises and pressure falls so air enters; when it relaxes and moves up, volume falls and pressure rises so air leaves', `
      ${part(0, rr(36, 30, 316, 180, 16, 'aa-cond') + L(58, 58, 'CONTRACT · DOWN', 'start', 13) +
        path('M76 120 q118 -46 236 0', 'ra-dome') + path('M76 150 q118 -46 236 0', 'ra-dome-line') +
        arrow(120, 96, 120, 60) + L(132, 66, 'air in', 'start', 12.5) +
        L(58, 190, 'Volume up · pressure down', 'start', 12))}
      ${part(1, rr(372, 30, 316, 180, 16, 'aa-cond') + L(394, 58, 'RELAX · UP', 'start', 13) +
        path('M412 92 q118 -46 236 0', 'ra-dome') + path('M412 122 q118 -46 236 0', 'ra-dome-line') +
        arrow(456, 66, 456, 102) + L(468, 90, 'air out', 'start', 12.5) +
        L(394, 190, 'Volume down · pressure up', 'start', 12))}`),

    /* 5 · the two exchange sites, in one chain */
    5: () => figure('respiratory', 'Two exchange sites: at the lung capillary oxygen enters the blood and carbon dioxide enters the alveolus; at the tissue capillary oxygen enters the cell and carbon dioxide enters the blood', `
      ${part(0, rr(24, 60, 250, 130, 14, 'aa-cond') + L(42, 86, 'LUNG CAPILLARY', 'start', 12.5) +
        circ(90, 132, 34, 'ra-alveolus') + path('M148 132 q40 -22 80 0 q-40 22 -80 0 z', 'ra-cap') +
        arrow(112, 168, 168, 168) + L(96, 190, 'O₂ into blood', 'start', 12) + dot(196, 132))}
      ${part(1, rr(300, 60, 250, 130, 14, 'aa-cond') + L(318, 86, 'TISSUE CAPILLARY', 'start', 12.5) +
        path('M318 132 q40 -22 80 0 q-40 22 -80 0 z', 'ra-cap') + rr(420, 104, 96, 58, 12, 'ra-cell') + circ(452, 132, 14, 'ra-nucleus') +
        arrow(392, 168, 440, 168) + L(378, 190, 'O₂ into cell', 'start', 12))}
      ${arrow(276, 124, 300, 124)}${circ(286, 104, 10, 'ma-rbc')}
      ${flow('M60 214 q300 -20 500 0', 4.4)}
      ${L(296, 232, 'blood carries the gases between the two sites', 'middle', 12)}`),

    /* 6 · which structure each condition affects */
    6: () => figure('respiratory', 'Four respiratory conditions and the structure each one affects: narrowed airways in asthma, extra mucus in the bronchi in bronchitis, damaged air sacs in emphysema, and fluid in the air sacs in pneumonia', `
      ${part(0, rr(24, 34, 158, 172, 14, 'aa-cond') + L(40, 190, 'Asthma', 'start', 12.5) +
        circ(103, 108, 42, 'ra-alveolus') + circ(103, 108, 16, 'aa-narrow') + L(40, 66, 'Narrowed airways', 'start', 12))}
      ${part(1, rr(192, 34, 158, 172, 14, 'aa-cond') + L(208, 190, 'Bronchitis', 'start', 12.5) +
        path('M226 108 h92', 'ra-trachea') + [...Array(5)].map((_, i) => circ(238 + i * 18, 108, 7, 'aa-mucus')).join('') +
        L(208, 66, 'Mucus in bronchi', 'start', 12))}
      ${part(2, rr(360, 34, 158, 172, 14, 'aa-cond') + L(376, 190, 'Emphysema', 'start', 12.5) +
        [...Array(4)].map((_, i) => circ(392 + (i % 2) * 46, 92 + Math.floor(i / 2) * 40, 20, 'ra-alveoli')).join('') +
        path('M414 92 h46', 'aa-broken') + L(376, 66, 'Damaged air sacs', 'start', 12))}
      ${part(3, rr(528, 34, 158, 172, 14, 'aa-cond') + L(544, 190, 'Pneumonia', 'start', 12.5) +
        circ(600, 104, 30, 'ra-alveolus') + circ(600, 104, 22, 'aa-fluid') +
        L(544, 66, 'Fluid in air sacs', 'start', 12))}`),
  };


  /* ---------------------------------------------------------------- cross-cutting screens */
  const portal = {
    /* system connections: one activity, six systems */
    1: () => figure('portal', 'Six systems working together on a hot day: the circulatory system carries oxygen from the respiratory system to the working muscles, while the skin and kidneys manage heat and water and the skeleton acts as levers', `
      ${circ(360, 124, 46, 'pp-hub')}${path('M360 100 q18 12 0 24 q-18 -12 0 -24', 'ma-heart-simple')}
      ${L(360, 190, 'Circulatory', 'middle', 12.5)}${L(360, 206, 'carries it all', 'middle', 11.5)}
      ${[[120, 52, 'Respiratory', 'O₂ in · CO₂ out', 0], [600, 52, 'Muscular', 'demands oxygen', 1],
         [640, 168, 'Integumentary', 'sweat cools', 2], [560, 226, 'Excretory', 'water and salts', 3],
         [120, 190, 'Skeletal', 'levers and calcium', 4]]
        .map(([x, y, name, note]) => part(0,
          rr(x - 84, y - 26, 168, 52, 12, 'pp-node') + L(x, y - 4, name, 'middle', 12.5) + L(x, y + 14, note, 'middle', 11.5) +
          lead(x + (x < 360 ? 84 : -84), y, 360 + (x < 360 ? -52 : 52), 124))).join('').replace(/data-i="0"/g, (m, off, s) => m)}
      ${arrow(204, 68, 318, 106)}${arrow(516, 68, 402, 106)}
      ${arrow(556, 152, 406, 130)}${arrow(476, 208, 392, 152)}
      ${arrow(204, 176, 316, 142)}
      ${flow('M300 124 a60 60 0 0 1 120 0', 4.2)}
      ${L(360, 32, 'One body, six systems, one task', 'middle', 13.5)}`),

    /* review: how the spacing works */
    2: () => figure('portal', 'How review spacing works: a question answered correctly moves to a later box, while a wrong answer returns to the first box and comes back sooner', `
      ${[['Due now', 40, 0], ['A few days', 268, 1], ['A week and beyond', 496, 2]]
        .map(([name, x, i]) => part(i,
          rr(x, 60, 184, 108, 14, 'pp-box') + L(x + 92, 88, name, 'middle', 13) +
          rr(x + 30, 104, 56, 40, 8, 'pp-card') + rr(x + 98, 104, 56, 40, 8, 'pp-card') +
          L(x + 92, 196, ['comes back soonest', 'comes back later', 'stays longest'][i], 'middle', 11.5))).join('')}
      ${arrow(228, 112, 264, 112)}${arrow(456, 112, 492, 112)}
      ${path('M540 152 q-120 74 -420 40', 'pp-return')}
      ${L(300, 226, 'a wrong answer goes back to the first box', 'middle', 11.5)}
      ${path('M500 74 q-160 -46 -420 -6', 'pp-up')}
      ${L(300, 46, 'each correct answer moves it on', 'middle', 11.5)}
      ${breathe(300, 112, 7, 'ma-a')}`),

    /* capstone: the six stations of the final mission */
    3: () => figure('portal', 'The final mission asks for six decisions, one per body system, about a student running five kilometres on a hot day', `
      ${path('M360 26 q-52 50 -38 118 q10 54 60 54 q50 0 60 -54 q14 -68 -38 -118 z', 'ma-body')}
      ${circ(360, 96, 22, 'ma-heart-simple')}
      ${[[130, 52, 'Respiratory', 'How does breathing change?', 0], [560, 52, 'Circulatory', 'How is blood redirected?', 1],
         [92, 132, 'Muscular', 'Where does the energy come from?', 2], [598, 132, 'Integumentary', 'How is heat lost?', 3],
         [130, 212, 'Excretory', 'What happens to water and salts?', 4], [560, 212, 'Skeletal', 'How do bones help movement?', 5]]
        .map(([x, y, name, note, i]) => part(i,
          rr(x - 92, y - 24, 184, 48, 12, 'pp-node') + L(x, y - 3, name, 'middle', 12.5) + L(x, y + 14, note, 'middle', 11) +
          dot(x + (x < 360 ? 78 : -78), y))).join('')}
      ${[0, 1, 2, 3, 4, 5].map(i => {
        const from = [[222, 52], [468, 52], [184, 132], [506, 132], [222, 212], [468, 212]][i];
        return lead(from[0], from[1], 360 + (from[0] < 360 ? -26 : 26), 96);
      }).join('')}
      ${L(360, 244, 'Six systems · one decision each · then a written synthesis', 'middle', 12)}`),
  };

  const SYSTEMS = { integumentary: integ, circulatory: circul, excretory: exc, respiratory: respSet, portal: portal };

  window.inneruActivityArt = function (system, n) {
    const set = SYSTEMS[system];
    if (!set) return '';
    const fn = set[n];
    return typeof fn === 'function' ? fn() : '';
  };
  window.inneruActivitySystems = Object.keys(SYSTEMS);
})();
