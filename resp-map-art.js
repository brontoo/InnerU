/* ============================================================================
   Respiratory mission-map illustrations — v2
   ----------------------------------------------------------------------------
   Quality pass after reviewing the first render:
     * 01 larger, lobed lungs with a proper trachea, bronchi and an internal tree
     * 03 a heavier capillary net that visibly wraps the alveoli
     * 04 deeper rib shading so the cage does not wash out
     * 05 brighter biconcave red cells with O2 / CO2 glyphs and clear arrows
     * 06 fine cilia along the inner wall instead of a sawtooth fringe
   Same register as the Integumentary set: cream panel, volumetric pastel forms,
   contact shadows, no labels. Scoped to #respiratory only.
   ========================================================================== */
(() => {
  'use strict';
  if (window.__respMapArt) return;
  window.__respMapArt = 1;

  const C = {
    lungHi: '#F9B7C1', lungMid: '#E88693', lungLo: '#C25F6C', lungEdge: '#A94E5B',
    lobe: '#CF6C79',
    airwayHi: '#F2E6EE', airwayLo: '#C0A9C6', ring: '#9E86A6',
    treeHi: '#C4DAF0', treeLo: '#6E9CC9', treeDeep: '#4A76A3',
    sacHi: '#FDD6DA', sacMid: '#F0A3AC', sacLo: '#D47882',
    capHi: '#E07077', capMid: '#C24B55', capLo: '#952B36',
    ribHi: '#FAEBD6', ribMid: '#E4CBA6', ribLo: '#C4A87C', ribEdge: '#A98D63',
    cellHi: '#EE6A72', cellMid: '#C93F49', cellLo: '#93242D', cellShine: '#FBB6B8',
    o2: '#3F86C9', co2: '#B9636D',
    mucus: '#EFE2D6', particle: '#8A8078', cilia: '#F7E4E7',
    line: '#8A5B46'
  };

  const uid = (() => { let n = 0; return p => `${p}${++n}`; })();

  function kit() {
    const g = uid('r');
    const defs = `<defs>
      <radialGradient id="${g}lung" cx="30%" cy="26%" r="82%">
        <stop offset="0" stop-color="${C.lungHi}"/><stop offset=".55" stop-color="${C.lungMid}"/>
        <stop offset="1" stop-color="${C.lungLo}"/></radialGradient>
      <linearGradient id="${g}airway" x1="0" y1="0" x2="1" y2=".15">
        <stop offset="0" stop-color="${C.airwayLo}"/><stop offset=".45" stop-color="${C.airwayHi}"/>
        <stop offset="1" stop-color="${C.airwayLo}"/></linearGradient>
      <linearGradient id="${g}tree" x1="0" y1="0" x2=".6" y2="1">
        <stop offset="0" stop-color="${C.treeHi}"/><stop offset="1" stop-color="${C.treeLo}"/></linearGradient>
      <radialGradient id="${g}sac" cx="32%" cy="26%" r="74%">
        <stop offset="0" stop-color="${C.sacHi}"/><stop offset=".62" stop-color="${C.sacMid}"/>
        <stop offset="1" stop-color="${C.sacLo}"/></radialGradient>
      <linearGradient id="${g}cap" x1="0" y1="0" x2=".3" y2="1">
        <stop offset="0" stop-color="${C.capHi}"/><stop offset=".5" stop-color="${C.capMid}"/>
        <stop offset="1" stop-color="${C.capLo}"/></linearGradient>
      <linearGradient id="${g}rib" x1=".15" y1="0" x2=".6" y2="1">
        <stop offset="0" stop-color="${C.ribHi}"/><stop offset=".6" stop-color="${C.ribMid}"/>
        <stop offset="1" stop-color="${C.ribLo}"/></linearGradient>
      <radialGradient id="${g}cell" cx="34%" cy="28%" r="76%">
        <stop offset="0" stop-color="${C.cellHi}"/><stop offset=".55" stop-color="${C.cellMid}"/>
        <stop offset="1" stop-color="${C.cellLo}"/></radialGradient>
      <linearGradient id="${g}tube" x1="0" y1="0" x2=".3" y2="1">
        <stop offset="0" stop-color="#F7BEC6"/><stop offset=".55" stop-color="#E08C93"/>
        <stop offset="1" stop-color="#CB6E77"/></linearGradient>
      <filter id="${g}blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4.5"/></filter>
    </defs>`;
    return { g, defs };
  }

  const svg = (label, inner) =>
    `<svg viewBox="0 0 360 168" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

  const shadow = (g, cx, cy, rx, ry) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry || 7}" fill="#8A5B46" opacity=".24" filter="url(#${g}blur)"/>`;

  /* a lobed lung: an apex, a lateral bulge, a tapering base and a concave medial
     border with the cardiac notch */
  function lung(g, x, y, w, h, flip) {
    const s = flip ? -1 : 1, cx = x + w / 2, hy = y + h / 2;
    let p = `<path d="M${cx} ${y}
        C${cx + s * w * .30} ${y + h * .02} ${cx + s * w * .62} ${y + h * .22} ${cx + s * w * .60} ${y + h * .46}
        C${cx + s * w * .58} ${y + h * .72} ${cx + s * w * .40} ${y + h * .94} ${cx + s * w * .10} ${y + h * .98}
        C${cx - s * w * .06} ${y + h * .99} ${cx - s * w * .16} ${y + h * .80} ${cx - s * w * .14} ${y + h * .60}
        C${cx - s * w * .13} ${y + h * .44} ${cx - s * w * .06} ${y + h * .34} ${cx - s * w * .04} ${y + h * .16}
        C${cx - s * w * .02} ${y + h * .06} ${cx} ${y + h * .01} ${cx} ${y} Z"
        fill="url(#${g}lung)"/>`;
    /* the oblique fissure and a second lobe division */
    p += `<path d="M${cx + s * w * .04} ${y + h * .3} C${cx + s * w * .38} ${y + h * .42} ${cx + s * w * .44} ${y + h * .62}
        ${cx + s * w * .26} ${y + h * .84}" stroke="${C.lobe}" stroke-width="1.6" fill="none" opacity=".6"/>`;
    p += `<path d="M${cx + s * w * .06} ${y + h * .58} C${cx + s * w * .3} ${y + h * .63} ${cx + s * w * .36} ${y + h * .74}
        ${cx + s * w * .26} ${y + h * .88}" stroke="${C.lobe}" stroke-width="1.3" fill="none" opacity=".45"/>`;
    /* a soft rim so the lobe separates from the cream panel, following the same contour */
    p += `<path d="M${cx} ${y + 2}
        C${cx + s * w * .28} ${y + h * .04} ${cx + s * w * .58} ${y + h * .23} ${cx + s * w * .56} ${y + h * .46}
        C${cx + s * w * .54} ${y + h * .70} ${cx + s * w * .38} ${y + h * .90} ${cx + s * w * .10} ${y + h * .94}"
        stroke="${C.lungEdge}" stroke-width="1.4" fill="none" opacity=".4"/>`;
    /* highlight */
    p += `<ellipse cx="${cx + s * w * .16}" cy="${y + h * .26}" rx="${w * .13}" ry="${h * .12}"
        fill="#FFFFFF" opacity=".3" transform="rotate(${-18 * s} ${cx + s * w * .16} ${y + h * .26})"/>`;
    /* a hint of the bronchial tree inside */
    p += `<path d="M${cx - s * w * .02} ${hy - h * .3} q${s * w * .14} ${h * .12} ${s * w * .2} ${h * .24}
        M${cx - s * w * .02} ${hy - h * .3} q${s * w * .22} ${h * .04} ${s * w * .3} ${h * .18}"
        stroke="${C.treeDeep}" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/>`;
    return p;
  }

  function sacs(g, x, y, r, n) {
    let p = '';
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .6]);
    }
    pts.forEach(([px, py]) => {
      p += `<circle cx="${px}" cy="${py}" r="${r * .46}" fill="url(#${g}sac)"/>`;
      p += `<circle cx="${px - r * .14}" cy="${py - r * .17}" r="${r * .15}" fill="#FFFFFF" opacity=".5"/>`;
    });
    p += `<circle cx="${x}" cy="${y}" r="${r * .5}" fill="url(#${g}sac)"/>`;
    p += `<circle cx="${x - r * .15}" cy="${y - r * .19}" r="${r * .17}" fill="#FFFFFF" opacity=".55"/>`;
    return p;
  }

  /* a biconcave red cell seen at an angle */
  const redCell = (g, cx, cy, r, rot) =>
    `<g transform="rotate(${rot} ${cx} ${cy})">
       <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * .68}" fill="url(#${g}cell)"/>
       <ellipse cx="${cx}" cy="${cy}" rx="${r * .52}" ry="${r * .3}" fill="#8E222B" opacity=".4"/>
       <ellipse cx="${cx - r * .3}" cy="${cy - r * .34}" rx="${r * .32}" ry="${r * .15}" fill="${C.cellShine}" opacity=".55"/>
       <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * .68}" fill="none" stroke="#7E1F27" stroke-width="1" opacity=".3"/>
     </g>`;

  /* small O2 / CO2 molecule glyphs */
  const o2glyph = (x, y, s) =>
    `<g><circle cx="${x - 5 * s}" cy="${y}" r="${4.6 * s}" fill="${C.o2}"/>
        <circle cx="${x + 4 * s}" cy="${y}" r="${4.6 * s}" fill="#6FA9DF"/>
        <circle cx="${x - 6 * s}" cy="${y - 1.6 * s}" r="${1.6 * s}" fill="#FFFFFF" opacity=".6"/></g>`;
  const co2glyph = (x, y, s) =>
    `<g><circle cx="${x - 5 * s}" cy="${y}" r="${4.2 * s}" fill="${C.co2}"/>
        <circle cx="${x + 4.6 * s}" cy="${y}" r="${4.2 * s}" fill="#D08A92"/>
        <circle cx="${x + 14 * s}" cy="${y}" r="${4.2 * s}" fill="${C.co2}"/></g>`;

  /* ---------------------------------------------------------------- the seven */
  const ART = {
    /* 01 — the lungs with a clear airway */
    1: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 152, 96, 8);
      s += lung(k.g, 52, 34, 104, 118, true);
      s += lung(k.g, 204, 34, 104, 118, false);
      /* trachea: thicker, with rings and a highlight */
      s += `<path d="M180 12 V62" stroke="url(#${k.g}airway)" stroke-width="19" stroke-linecap="round"/>`;
      [0, 1, 2, 3].forEach(i => {
        s += `<path d="M170 ${22 + i * 12} q10 -4 20 0" stroke="${C.ring}" stroke-width="2" fill="none" opacity=".6"/>`;
      });
      s += `<path d="M173 18 V58" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="3.4" stroke-linecap="round"/>`;
      /* the two main bronchi, entering each lung */
      s += `<path d="M180 62 C168 74 154 80 142 86" stroke="url(#${k.g}airway)" stroke-width="11" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M180 62 C192 74 206 80 218 86" stroke="url(#${k.g}airway)" stroke-width="11" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M146 88 C138 96 134 104 132 112 M214 88 C222 96 226 104 228 112"
              stroke="${C.treeDeep}" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>`;
      return svg('Two large lobed lungs with the trachea dividing into a bronchus for each lung', s);
    },

    /* 02 — the branching airway with its sacs */
    2: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 150, 96, 7);
      s += `<path d="M46 84 H102" stroke="url(#${k.g}airway)" stroke-width="16" stroke-linecap="round"/>`;
      [0, 1, 2].forEach(i => {
        s += `<path d="M58 ${72 + i * 12} q12 -4 24 0" stroke="${C.ring}" stroke-width="1.8" fill="none" opacity=".55"/>`;
      });
      const branch = (x, y, dx, dy, w, op) =>
        `<path d="M${x} ${y} Q${x + dx * .5} ${y + dy * .6} ${x + dx} ${y + dy}"
           stroke="url(#${k.g}tree)" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op || 1}"/>`;
      s += branch(102, 84, 40, -24, 11) + branch(102, 84, 40, 24, 11);
      s += branch(142, 60, 36, -16, 8) + branch(142, 60, 34, 14, 8);
      s += branch(142, 108, 36, -14, 8) + branch(142, 108, 34, 16, 8);
      s += branch(178, 44, 30, -10, 5.5, .95) + branch(178, 44, 28, 12, 5.5, .95);
      s += branch(178, 74, 30, -8, 5.5, .95) + branch(178, 74, 28, 10, 5.5, .95);
      s += branch(178, 94, 30, -8, 5.5, .95) + branch(178, 94, 28, 10, 5.5, .95);
      s += branch(178, 124, 30, -10, 5.5, .95) + branch(178, 124, 28, 10, 5.5, .95);
      s += sacs(k.g, 248, 30, 31, 5) + sacs(k.g, 252, 80, 33, 6) + sacs(k.g, 248, 124, 30, 5);
      s += `<path d="M50 78 H98" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="3.2" stroke-linecap="round"/>`;
      return svg('The airway branching from the trachea through bronchi and bronchioles into clusters of alveoli', s);
    },

    /* 03 — alveoli wrapped in capillaries */
    3: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 152, 96, 7);
      /* capillaries behind the sacs */
      s += `<path d="M40 104 C74 58 116 44 158 60 C196 74 214 50 246 44 C280 38 306 58 312 84"
              stroke="url(#${k.g}cap)" stroke-width="10" fill="none" stroke-linecap="round" opacity=".9"/>`;
      s += `<path d="M36 128 C74 112 102 126 138 112 C176 96 206 122 242 112 C278 102 300 122 316 132"
              stroke="url(#${k.g}cap)" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>`;
      s += sacs(k.g, 112, 88, 44, 6);
      s += sacs(k.g, 214, 92, 40, 6);
      s += sacs(k.g, 280, 78, 30, 5);
      /* capillaries crossing in front, so the net visibly wraps them */
      s += `<path d="M64 74 C104 96 132 62 172 84 C206 102 234 68 274 78"
              stroke="url(#${k.g}cap)" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/>`;
      s += `<path d="M84 118 C120 138 152 108 190 126 C222 140 252 116 288 122"
              stroke="url(#${k.g}cap)" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>`;
      s += `<circle cx="150" cy="52" r="5" fill="${C.cellHi}" opacity=".85"/>`;
      s += `<circle cx="252" cy="140" r="4.6" fill="${C.cellHi}" opacity=".8"/>`;
      return svg('Clusters of alveoli wrapped in a red capillary network, where gas exchange takes place', s);
    },

    /* 04 — the rib cage and the diaphragm */
    4: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 152, 86, 7);
      /* sternum */
      s += `<rect x="174" y="22" width="14" height="82" rx="6" fill="url(#${k.g}rib)"/>`;
      s += `<path d="M178 26 v74" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="2.6"/>`;
      s += `<rect x="174" y="22" width="14" height="82" rx="6" fill="none" stroke="${C.ribEdge}" stroke-width="1" opacity=".35"/>`;
      /* ribs, with a shadow under each so the cage reads in three dimensions */
      const rib = (y, spread, w) =>
        `<path d="M174 ${y} C${174 - spread} ${y + 9} ${174 - spread - 18} ${y + 28} ${174 - spread - 12} ${y + 48}"
           stroke="url(#${k.g}rib)" stroke-width="${w}" fill="none" stroke-linecap="round"/>
         <path d="M186 ${y} C${186 + spread} ${y + 9} ${186 + spread + 18} ${y + 28} ${186 + spread + 12} ${y + 48}"
           stroke="url(#${k.g}rib)" stroke-width="${w}" fill="none" stroke-linecap="round"/>
         <path d="M174 ${y + w * .5} C${174 - spread} ${y + 9 + w * .5} ${174 - spread - 18} ${y + 30} ${174 - spread - 12} ${y + 50}"
           stroke="${C.ribEdge}" stroke-width="1.1" fill="none" opacity=".3"/>
         <path d="M186 ${y + w * .5} C${186 + spread} ${y + 9 + w * .5} ${186 + spread + 18} ${y + 30} ${186 + spread + 12} ${y + 50}"
           stroke="${C.ribEdge}" stroke-width="1.1" fill="none" opacity=".3"/>`;
      [24, 42, 60, 78].forEach((y, i) => { s += rib(y, 32 + i * 9, 12 - i * 1.4); });
      /* clavicles */
      s += `<path d="M142 20 C160 10 176 10 186 13 M218 20 C200 10 184 10 174 13"
              stroke="url(#${k.g}rib)" stroke-width="10" fill="none" stroke-linecap="round"/>`;
      /* the diaphragm */
      s += `<path d="M92 128 C128 94 232 94 268 128 C240 150 120 150 92 128 Z" fill="url(#${k.g}rib)"/>`;
      s += `<path d="M96 128 C132 98 228 98 264 128" stroke="${C.ribEdge}" stroke-width="1.6" fill="none" opacity=".55"/>`;
      s += `<path d="M108 132 C142 112 218 112 252 132" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="3.4" fill="none"/>`;
      s += `<path d="M92 128 C128 94 232 94 268 128" stroke="#FFFFFF" stroke-opacity=".28" stroke-width="2.4" fill="none"/>`;
      return svg('The rib cage with the diaphragm beneath it, the structures that change the volume of the chest', s);
    },

    /* 05 — oxygen in, carbon dioxide out, carried by red cells */
    5: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 150, 98, 7);
      s += redCell(k.g, 66, 58, 32, -14);
      s += redCell(k.g, 118, 116, 28, 12);
      s += redCell(k.g, 188, 48, 26, 8);
      s += redCell(k.g, 296, 104, 30, -10);
      s += redCell(k.g, 246, 138, 24, 16);
      /* direction arrows, thicker and clearly coloured */
      s += `<path d="M126 34 C154 22 184 26 208 38" stroke="${C.o2}" stroke-width="7" fill="none" stroke-linecap="round"/>
            <path d="M208 38 l-13 -7 M208 38 l-13 8" stroke="${C.o2}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M232 130 C258 140 286 136 306 122" stroke="${C.co2}" stroke-width="7" fill="none" stroke-linecap="round"/>
            <path d="M306 122 l-13 -6 M306 122 l-13 8" stroke="${C.co2}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M164 88 C180 80 200 84 214 92" stroke="${C.o2}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`;
      s += `<path d="M238 70 C254 64 272 68 284 76" stroke="${C.co2}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`;
      /* molecule glyphs */
      s += o2glyph(150, 22, 1) + o2glyph(214, 100, .9);
      s += co2glyph(258, 152, .9) + co2glyph(300, 130, .8);
      return svg('Red blood cells carrying oxygen in and carbon dioxide out, with arrows and molecule symbols', s);
    },

    /* 06 — the airway wall, its cilia, mucus and trapped particles */
    6: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 152, 92, 7);
      /* the wall, in cross-section */
      s += `<circle cx="180" cy="84" r="64" fill="url(#${k.g}tube)"/>`;
      s += `<circle cx="180" cy="84" r="64" fill="none" stroke="#B85A64" stroke-width="1.4" opacity=".4"/>`;
      s += `<circle cx="180" cy="84" r="44" fill="#FDF3F4"/>`;
      s += `<circle cx="180" cy="84" r="44" fill="none" stroke="#D98A92" stroke-width="1.2" opacity=".55"/>`;
      /* mucus layer along the inner wall */
      s += `<path d="M180 40 a44 44 0 0 1 0 88" stroke="${C.mucus}" stroke-width="8" fill="none" opacity=".95"/>`;
      s += `<path d="M180 40 a44 44 0 0 0 0 88" stroke="${C.mucus}" stroke-width="8" fill="none" opacity=".8"/>`;
      /* particles caught in the mucus and in the lumen */
      s += `<circle cx="163" cy="66" r="7.5" fill="${C.particle}" opacity=".9"/>`;
      s += `<circle cx="200" cy="62" r="6" fill="${C.particle}" opacity=".8"/>`;
      s += `<circle cx="196" cy="108" r="6.5" fill="${C.particle}" opacity=".85"/>`;
      s += `<circle cx="160" cy="104" r="5" fill="${C.particle}" opacity=".7"/>`;
      s += `<circle cx="182" cy="84" r="4.4" fill="${C.particle}" opacity=".6"/>`;
      /* cilia: fine, dense and pointing into the lumen */
      for (let i = 0; i < 22; i++) {
        const a = Math.PI * (0.06 + (i / 21) * 0.88);
        const px = 180 + Math.cos(a) * 44, py = 84 + Math.sin(a) * 44;
        const nx = -Math.cos(a), ny = -Math.sin(a);
        s += `<path d="M${px} ${py} q${nx * 5 - ny * 2} ${ny * 5 + nx * 2} ${nx * 9 - ny * 3.4} ${ny * 9 + nx * 3.4}"
                stroke="${C.cilia}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".95"/>`;
      }
      for (let i = 0; i < 20; i++) {
        const a = Math.PI * (1.06 + (i / 19) * 0.88);
        const px = 180 + Math.cos(a) * 44, py = 84 + Math.sin(a) * 44;
        const nx = -Math.cos(a), ny = -Math.sin(a);
        s += `<path d="M${px} ${py} q${nx * 5 + ny * 2} ${ny * 5 - nx * 2} ${nx * 9 + ny * 3.4} ${ny * 9 - nx * 3.4}"
                stroke="${C.cilia}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".95"/>`;
      }
      s += `<path d="M142 56 C154 42 176 36 196 40" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="4" fill="none"/>`;
      return svg('A bronchiole in cross-section: the wall with its cilia and mucus layer, with particles trapped inside', s);
    },

    /* 07 — the restored route */
    7: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 154, 88, 7);
      s += `<ellipse cx="180" cy="86" rx="132" ry="68" fill="${C.o2}" opacity=".07"/>`;
      s += lung(k.g, 88, 40, 88, 100, true);
      s += lung(k.g, 184, 40, 88, 100, false);
      s += `<path d="M180 18 V64" stroke="url(#${k.g}airway)" stroke-width="17" stroke-linecap="round"/>`;
      [0, 1, 2].forEach(i => {
        s += `<path d="M171 ${28 + i * 12} q9 -4 18 0" stroke="${C.ring}" stroke-width="1.8" fill="none" opacity=".55"/>`;
      });
      s += `<path d="M180 64 C170 74 158 80 148 86" stroke="url(#${k.g}airway)" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M180 64 C190 74 202 80 212 86" stroke="url(#${k.g}airway)" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M174 24 V60" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="3.2" stroke-linecap="round"/>`;
      /* fresh air in, used air out */
      s += `<path d="M74 34 C96 20 124 16 148 20" stroke="${C.o2}" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M148 20 l-12 -5 M148 20 l-12 7" stroke="${C.o2}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M286 150 C264 160 236 160 214 154" stroke="${C.co2}" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M214 154 l12 5 M214 154 l12 -7" stroke="${C.co2}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
      s += o2glyph(96, 22, .9) + co2glyph(268, 154, .85);
      return svg('The lungs breathing freely, with the airway open and oxygen moving in as carbon dioxide moves out', s);
    }
  };

  window.inneruRespMapArt = function (n) {
    const fn = ART[n];
    try { return fn ? fn() : ''; } catch (e) { return ''; }
  };

  function inject() {
    if (location.hash.split('?')[0] !== '#respiratory') return;
    const grid = document.querySelector('.resp-grid');
    if (!grid) return;
    const world = document.querySelector('.resp-world') || grid;
    world.classList.add('resp-map');
    if (grid.querySelector('.resp-card-art')) return;

    const cards = [...grid.querySelectorAll('.resp-card')];
    cards.forEach((card, i) => {
      const art = window.inneruRespMapArt(i + 1);
      if (!art) return;
      const wrap = document.createElement('div');
      wrap.className = 'resp-card-art';
      wrap.innerHTML = art;
      card.insertBefore(wrap, card.firstChild);
    });

    const finale = document.querySelector('.resp-finale');
    if (finale && !finale.querySelector('.resp-card-art')) {
      const art = window.inneruRespMapArt(7);
      if (art) {
        const wrap = document.createElement('div');
        wrap.className = 'resp-card-art';
        wrap.innerHTML = art;
        finale.classList.add('has-art');
        finale.insertBefore(wrap, finale.firstChild);
      }
    }
  }

  const run = () => setTimeout(inject, 90);
  window.addEventListener('hashchange', run);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
