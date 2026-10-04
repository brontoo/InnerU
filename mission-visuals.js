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

  function figure(system, label, caption, inner) {
    return `<figure class="mission-art ma-${system}" role="group" aria-label="${label}">
      <svg class="ma" viewBox="0 0 720 240" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">
        ${defs}
        <rect class="ma-panel" x="0" y="0" width="720" height="240" rx="16" fill="url(#maPanel)"/>
        <rect class="ma-panel-sheen" x="0" y="0" width="720" height="240" rx="16" fill="url(#maGlow)"/>
        ${inner}
      </svg>
      <figcaption>${caption}</figcaption>
    </figure>`;
  }

  /* ---------------------------------------------------------------- integumentary */
  const integ = [
    () => `${rr(60, 70, 470, 130, 14, 'ma-skin')}
      ${path('M60 110 H530', 'ma-ink-line')}${path('M60 160 H530', 'ma-ink-line')}
      ${L(72, 96, 'Epidermis')}${L(72, 142, 'Dermis')}${L(72, 192, 'Subcutaneous')}
      ${dot(420, 92)}${lead(420, 92, 470, 78)}${L(474, 82, 'Dead cells, shed')}
      ${dot(300, 140)}${lead(300, 140, 360, 158)}${L(364, 162, 'Collagen fibres')}
      ${path('M120 58 q40 -34 96 -6', 'ma-barrier')}
      ${arrow(250, 40, 250, 76)}${L(262, 46, 'Water loss blocked')}
      ${breathe(150, 140, 7, 'ma-a')}${L(166, 144, 'Nerve')}`,
      'Skin is the barrier: three layers, with the outer sheet stopping water loss.',
    () => `${rr(60, 60, 470, 140, 14, 'ma-skin')}
      ${path('M60 104 H530', 'ma-ink-line')}${path('M60 154 H530', 'ma-ink-line')}
      ${L(72, 90, 'Epidermis')}${L(72, 136, 'Dermis')}${L(72, 186, 'Fat layer')}
      ${[0, 1, 2].map(i => path(`M${300} ${190 - i * 26} q10 -12 20 0`, 'ma-cell')).join('')}
      ${arrow(310, 176, 310, 74)}${L(322, 120, 'New cells push up')}
      ${arrow(360, 74, 400, 60)}${L(404, 64, 'Old cells shed')}
      ${circ(430, 150, 5, 'ma-a')}${L(442, 154, 'Capillary loop')}`,
      'New cells are made in the base layer and are pushed up as older cells are shed.',
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

  /* ---------------------------------------------------------------- respiratory */
  const resp = [
    () => `${path('M300 54 q-72 10 -86 76 q-10 52 46 52 q52 0 44 -52 q-8 -66 -4 -76 z', 'ma-lung')}
      ${path('M330 54 q72 10 86 76 q10 52 -46 52 q-52 0 -44 -52 q8 -66 4 -76 z', 'ma-lung')}
      ${path('M300 54 q15 -26 30 0', 'ma-airway')}${L(292, 40, 'Air in')}
      ${arrow(120, 96, 200, 96)}${L(120, 86, 'O₂')}
      ${arrow(200, 130, 120, 130)}${L(120, 148, 'CO₂')}
      ${rr(452, 88, 92, 74, 12, 'ma-cell')}${circ(498, 118, 12, 'ma-nucleus')}${L(462, 78, 'Body cell')}
      ${arrow(392, 108, 452, 108)}${L(400, 98, 'O₂ for respiration')}
      ${arrow(452, 140, 392, 140)}${L(400, 158, 'CO₂ made here')}
      ${breathe(500, 176, 6, 'ma-a')}${L(512, 180, 'ATP')}`,
      'Breathing supplies the oxygen a cell needs and removes the carbon dioxide it makes.',
    () => `${path('M120 60 q30 0 44 28 q10 22 34 30', 'ma-airway')}
      ${path('M208 118 q26 8 40 34', 'ma-airway')}${path('M248 152 q10 30 -6 54', 'ma-airway')}
      ${[0, 1, 2].map(i => path(`M${262 + i * 18} ${196 - i * 8} q14 6 18 -6 q-12 -8 -18 6`, 'ma-alveoli')).join('')}
      ${[0, 1, 2, 3].map(i => circ(96 + i * 34, 54, 8, 'ma-stop')).join('')}
      ${L(78, 34, 'Nose and mouth')}${L(206, 96, 'Trachea')}${lead(206, 100, 214, 116)}
      ${L(276, 130, 'Bronchi')}${lead(276, 134, 250, 140)}
      ${L(300, 168, 'Bronchioles')}${L(330, 214, 'Alveoli')}${lead(328, 210, 292, 200)}
      ${flow('M120 70 q40 40 96 62 q34 16 44 42', 3.6)}`,
      'The air route: nose and mouth, trachea, bronchi, bronchioles, then the alveoli.',
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
    return figure(system, set.name + ' diagram: ' + caption, caption, draw());
  };

  window.missionArtSystems = Object.keys(ART);
})();
