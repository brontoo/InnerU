/* ============================================================================
   Circulatory mission-map illustrations
   ----------------------------------------------------------------------------
   Seven soft-shaded vignettes for the Circulatory world's own .circ-card markup,
   in the same register as the Integumentary, Respiratory and Excretory sets.

   Scoped to #circulatory only.
   ========================================================================== */
(() => {
  'use strict';
  if (window.__circMapArt) return;
  window.__circMapArt = 1;

  const C = {
    wallHi: '#EC7E88', wallMid: '#D14A5C', wallLo: '#A52738', lumen: '#FBE9EA',
    veinHi: '#8FB4DC', veinMid: '#4A7FB5', veinLo: '#2F5E8C', veinLumen: '#EAF2FA',
    muscleHi: '#E8737F', muscleMid: '#C4475A', muscleLo: '#96293A', septum: '#B03A4B',
    cellHi: '#E0616B', cellMid: '#C93F49', cellLo: '#8E222B', shine: '#FBB6B8',
    wbc: '#F0E4EE', wbcNuc: '#9B7BB0', platelet: '#EFC6B4', plateletLo: '#D79C86',
    antibody: '#E0B45C', antibodyLo: '#B98C33',
    ecg: '#0E8B84', figure: '#12354F',
    capHi: '#E07077', capLo: '#A3343F', line: '#8A5B46'
  };

  const uid = (() => { let n = 0; return p => `${p}${++n}`; })();

  function kit() {
    const g = uid('c');
    const defs = `<defs>
      <linearGradient id="${g}wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.wallHi}"/><stop offset=".55" stop-color="${C.wallMid}"/>
        <stop offset="1" stop-color="${C.wallLo}"/></linearGradient>
      <linearGradient id="${g}vein" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.veinHi}"/><stop offset=".55" stop-color="${C.veinMid}"/>
        <stop offset="1" stop-color="${C.veinLo}"/></linearGradient>
      <radialGradient id="${g}heart" cx="32%" cy="26%" r="80%">
        <stop offset="0" stop-color="${C.muscleHi}"/><stop offset=".58" stop-color="${C.muscleMid}"/>
        <stop offset="1" stop-color="${C.muscleLo}"/></radialGradient>
      <radialGradient id="${g}cell" cx="34%" cy="28%" r="76%">
        <stop offset="0" stop-color="${C.cellHi}"/><stop offset=".55" stop-color="${C.cellMid}"/>
        <stop offset="1" stop-color="${C.cellLo}"/></radialGradient>
      <radialGradient id="${g}wbc" cx="34%" cy="30%" r="74%">
        <stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="${C.wbc}"/>
        <stop offset="1" stop-color="#D9C6DE"/></radialGradient>
      <linearGradient id="${g}cap" x1="0" y1="0" x2=".4" y2="1">
        <stop offset="0" stop-color="${C.capHi}"/><stop offset="1" stop-color="${C.capLo}"/></linearGradient>
      <linearGradient id="${g}platelet" x1="0" y1="0" x2=".4" y2="1">
        <stop offset="0" stop-color="${C.platelet}"/><stop offset="1" stop-color="${C.plateletLo}"/></linearGradient>
      <filter id="${g}blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4.5"/></filter>
    </defs>`;
    return { g, defs };
  }

  const svg = (label, inner) =>
    `<svg viewBox="0 0 360 168" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

  const shadow = (g, cx, cy, rx, ry) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry || 7}" fill="#8A5B46" opacity=".24" filter="url(#${g}blur)"/>`;

  /* a length of vessel: outer wall, lumen and a cut mouth at the left */
  function vessel(g, x0, x1, cy, wall, lumen, kind) {
    const fill = kind === 'vein' ? `url(#${g}vein)` : `url(#${g}wall)`;
    const lum = kind === 'vein' ? C.veinLumen : C.lumen;
    return `<rect x="${x0}" y="${cy - wall / 2}" width="${x1 - x0}" height="${wall}" rx="${wall / 2}" fill="${fill}"/>
            <rect x="${x0 + wall * .55}" y="${cy - lumen / 2}" width="${x1 - x0 - wall * 1.1}" height="${lumen}" rx="${lumen / 2}" fill="${lum}"/>
            <ellipse cx="${x0}" cy="${cy}" rx="${wall * .16}" ry="${wall / 2}" fill="${fill}"/>
            <ellipse cx="${x0}" cy="${cy}" rx="${wall * .1}" ry="${lumen / 2}" fill="${lum}"/>
            <rect x="${x0 + wall * .3}" y="${cy - wall * .34}" width="${x1 - x0 - wall * .7}" height="${wall * .12}" rx="${wall * .06}" fill="#FFFFFF" opacity=".3"/>`;
  }

  /* a biconcave red cell */
  const redCell = (g, cx, cy, r, rot) =>
    `<g transform="rotate(${rot} ${cx} ${cy})">
       <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * .68}" fill="url(#${g}cell)"/>
       <ellipse cx="${cx}" cy="${cy}" rx="${r * .52}" ry="${r * .3}" fill="#7E1F27" opacity=".38"/>
       <ellipse cx="${cx - r * .3}" cy="${cy - r * .34}" rx="${r * .32}" ry="${r * .15}" fill="${C.shine}" opacity=".55"/>
       <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * .68}" fill="none" stroke="#7E1F27" stroke-width="1" opacity=".28"/>
     </g>`;

  /* a Y-shaped antibody */
  const antibody = (x, y, s, rot) =>
    `<g transform="rotate(${rot} ${x} ${y})">
       <path d="M${x} ${y + 12 * s} V${y} M${x} ${y} L${x - 7 * s} ${y - 9 * s} M${x} ${y} L${x + 7 * s} ${y - 9 * s}"
         stroke="${C.antibody}" stroke-width="${4.4 * s}" stroke-linecap="round" fill="none"/>
       <path d="M${x} ${y + 12 * s} V${y}" stroke="${C.antibodyLo}" stroke-width="${1.4 * s}" stroke-linecap="round" fill="none"/>
     </g>`;

  /* ---------------------------------------------------------------- the seven */
  const ART = {
    /* 01 — an artery and a vein, cut open */
    1: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 152, 96, 7);
      s += vessel(k.g, 26, 232, 54, 54, 18, 'artery');
      s += vessel(k.g, 128, 336, 112, 38, 24, 'vein');
      /* a valve inside the vein */
      s += `<path d="M232 112 C240 100 252 100 258 110 C252 118 240 118 232 112 Z" fill="${C.veinMid}" opacity=".9"/>`;
      s += `<path d="M300 112 C292 100 280 100 274 110 C280 118 292 118 300 112 Z" fill="${C.veinMid}" opacity=".9"/>`;
      /* blood travelling through */
      s += redCell(k.g, 150, 54, 13, 0) + redCell(k.g, 186, 54, 11, 8);
      s += redCell(k.g, 196, 112, 12, 0);
      return svg('A cut length of artery with its thick wall and narrow lumen, and below it a vein with a thinner wall, a wider lumen and a valve', s);
    },

    /* 02 — the capillary exchange network */
    2: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 152, 98, 7);
      const cap = (d, w, kind) =>
        `<path d="${d}" stroke="${kind === 'vein' ? `url(#${k.g}vein)` : `url(#${k.g}cap)`}" stroke-width="${w}"
           fill="none" stroke-linecap="round" opacity="${kind === 'vein' ? '.9' : '.95'}"/>`;
      s += cap('M28 62 C74 34 112 78 156 52 C198 28 236 70 274 48 C300 34 320 44 332 60', 8, 'artery');
      s += cap('M28 82 C70 58 110 100 152 76 C196 50 234 92 272 70 C298 56 320 66 332 80', 6, 'vein');
      s += cap('M28 104 C72 84 108 122 150 100 C194 76 232 116 270 94 C296 80 320 88 332 100', 7, 'artery');
      s += cap('M32 124 C74 108 106 140 148 122 C192 102 230 138 268 118 C294 106 320 112 332 122', 5, 'vein');
      s += cap('M120 30 C130 56 128 86 140 110 C150 130 146 142 140 150', 4, 'vein');
      s += cap('M220 26 C228 54 224 88 236 112 C244 128 240 142 234 150', 4, 'artery');
      s += redCell(k.g, 92, 70, 11, -10) + redCell(k.g, 206, 106, 10, 12) + redCell(k.g, 268, 60, 9, -6);
      return svg('A network of capillaries exchanging oxygen and nutrients with the tissues around them', s);
    },

    /* 03 — the heart with its great vessels */
    3: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 154, 76, 7);
      /* the great vessels first, so the heart sits in front of them */
      s += `<path d="M180 24 C170 40 168 56 174 70" stroke="url(#${k.g}vein)" stroke-width="19" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M186 22 C198 38 200 54 194 68" stroke="url(#${k.g}wall)" stroke-width="21" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M136 62 C126 78 126 96 134 110" stroke="url(#${k.g}vein)" stroke-width="15" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M226 60 C238 78 238 96 228 110" stroke="url(#${k.g}wall)" stroke-width="15" fill="none" stroke-linecap="round"/>`;
      /* the heart: left side (viewer's right) muscular, right side thinner */
      s += `<path d="M180 48 C204 30 246 34 258 66 C270 98 246 132 208 142 C190 146 176 140 170 128
              C160 108 158 74 166 58 C170 50 175 47 180 48 Z" fill="url(#${k.g}heart)"/>`;
      s += `<path d="M180 48 C160 30 118 34 106 66 C94 98 118 132 156 142 C174 146 188 140 194 128
              C204 108 206 74 198 58 C194 50 186 47 180 48 Z" fill="${C.muscleLo}" opacity=".92"/>`;
      s += `<path d="M180 52 C186 74 186 104 176 134" stroke="${C.septum}" stroke-width="3.4" fill="none" opacity=".7"/>`;
      /* highlights and the surface vessels */
      s += `<path d="M206 56 C222 48 242 56 250 72" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M132 62 C120 78 120 96 128 110" stroke="url(#${k.g}vein)" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
      s += `<path d="M232 62 C244 80 244 96 236 110" stroke="url(#${k.g}wall)" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
      s += `<path d="M172 30 C182 22 196 22 202 28" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="3.4" fill="none"/>`;
      return svg('The heart with its great vessels: the blue vessels carrying oxygen-poor blood and the red vessels carrying oxygen-rich blood', s);
    },

    /* 04 — the two circuits */
    4: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 150, 94, 7);
      /* pulmonary loop */
      s += `<path d="M126 84 a44 44 0 1 1 -0.1 0" fill="none" stroke="url(#${k.g}vein)" stroke-width="11" stroke-linecap="round"/>`;
      s += `<path d="M126 40 l14 8 l-16 8 z" fill="${C.veinMid}"/>`;
      s += `<path d="M126 60 a24 24 0 1 1 -0.1 0" fill="none" stroke="${C.veinLumen}" stroke-width="3" opacity=".5"/>`;
      /* a small lung on that loop */
      s += `<path d="M96 74 C86 70 80 78 82 90 C84 100 92 104 98 100 Z" fill="#F3B9C1"/>`;
      s += `<path d="M156 74 C166 70 172 78 170 90 C168 100 160 104 154 100 Z" fill="#F3B9C1"/>`;
      /* systemic loop */
      s += `<path d="M234 84 a44 44 0 1 1 -0.1 0" fill="none" stroke="url(#${k.g}wall)" stroke-width="11" stroke-linecap="round"/>`;
      s += `<path d="M234 40 l14 8 l-16 8 z" fill="${C.wallMid}"/>`;
      s += `<path d="M234 60 a24 24 0 1 1 -0.1 0" fill="none" stroke="${C.lumen}" stroke-width="3" opacity=".5"/>`;
      /* a small body block on that loop */
      s += `<rect x="212" y="96" width="44" height="26" rx="9" fill="${C.figure}" opacity=".8"/>`;
      /* the heart between the loops */
      s += `<path d="M180 62 C190 52 208 54 212 70 C216 86 202 102 184 106 C176 108 170 104 168 98
              C162 86 164 68 172 62 C175 59 178 60 180 62 Z" fill="url(#${k.g}heart)"/>`;
      s += `<path d="M180 66 C176 78 176 92 182 102" stroke="${C.septum}" stroke-width="2" fill="none" opacity=".6"/>`;
      return svg('The double circuit: one loop carrying blood through the lungs to pick up oxygen, and one carrying it around the body to deliver it', s);
    },

    /* 05 — what the blood carries */
    5: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 150, 96, 7);
      s += redCell(k.g, 70, 58, 30, -14);
      s += redCell(k.g, 116, 118, 26, 12);
      s += redCell(k.g, 178, 46, 24, 8);
      s += redCell(k.g, 296, 118, 27, -10);
      /* a white cell with its lobed nucleus */
      s += `<circle cx="250" cy="70" r="30" fill="url(#${k.g}wbc)"/>`;
      s += `<circle cx="250" cy="70" r="30" fill="none" stroke="#C9B4CE" stroke-width="1.2" opacity=".6"/>`;
      s += `<path d="M240 60 C250 54 258 60 254 68 C262 66 266 76 258 80 C264 88 252 94 246 86
              C238 90 230 80 236 72 C230 64 234 58 240 60 Z" fill="${C.wbcNuc}" opacity=".85"/>`;
      s += `<circle cx="240" cy="60" r="7" fill="#FFFFFF" opacity=".4"/>`;
      /* platelets */
      s += `<path d="M186 122 C194 114 206 116 208 126 C210 136 198 142 190 138 C182 134 180 128 186 122 Z" fill="url(#${k.g}platelet)"/>`;
      s += `<path d="M214 142 C220 136 230 138 231 146 C232 154 222 158 216 155 C210 152 209 147 214 142 Z" fill="url(#${k.g}platelet)"/>`;
      return svg('The blood components: red cells carrying gases, a white cell defending the body, and platelets that help seal leaks', s);
    },

    /* 06 — blood groups and matching */
    6: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 150, 92, 7);
      /* the red cell, large, with surface markers */
      s += `<ellipse cx="180" cy="86" rx="72" ry="50" fill="url(#${k.g}cell)"/>`;
      s += `<ellipse cx="180" cy="86" rx="38" ry="24" fill="#7E1F27" opacity=".32"/>`;
      s += `<ellipse cx="146" cy="62" rx="24" ry="11" fill="${C.shine}" opacity=".45" transform="rotate(-16 146 62)"/>`;
      s += `<ellipse cx="180" cy="86" rx="72" ry="50" fill="none" stroke="#7E1F27" stroke-width="1.2" opacity=".28"/>`;
      /* antigens on the surface */
      s += `<circle cx="120" cy="60" r="7" fill="${C.antibody}"/>`;
      s += `<circle cx="180" cy="34" r="7" fill="${C.antibody}"/>`;
      s += `<circle cx="242" cy="62" r="7" fill="${C.antibody}"/>`;
      /* antibodies around it */
      s += antibody(72, 52, 1.1, -20) + antibody(96, 126, 1, 30) + antibody(292, 52, 1.1, 20) + antibody(268, 128, 1, -28);
      return svg('A red blood cell showing its surface markers, with antibodies around it illustrating why blood groups must be matched', s);
    },

    /* 07 — circulatory emergency */
    7: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 154, 94, 6);
      /* the running figure */
      s += `<g opacity=".95">
        <circle cx="120" cy="36" r="14" fill="${C.figure}"/>
        <path d="M114 52 C124 50 134 54 138 64 C142 74 140 84 134 92 L128 120 L146 140"
          stroke="${C.figure}" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M132 66 C150 60 166 62 178 72 M120 92 C104 100 92 114 88 130"
          stroke="${C.figure}" stroke-width="11" fill="none" stroke-linecap="round"/>
        <path d="M128 120 L112 142 M146 140 L166 138"
          stroke="${C.figure}" stroke-width="12" fill="none" stroke-linecap="round"/>
      </g>`;
      /* the trace */
      s += `<path d="M40 116 H96 l10 -22 l12 44 l12 -30 l10 18 h34 l10 -26 l12 40 l12 -28 h34 l10 16 h56"
              stroke="${C.ecg}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<circle cx="332" cy="116" r="6" fill="${C.ecg}" opacity=".9"/>`;
      /* a small red cell travelling with it */
      s += redCell(k.g, 264, 62, 15, -12);
      s += `<path d="M226 74 C240 62 254 58 268 58" stroke="url(#${k.g}cap)" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
      return svg('A running figure with a heartbeat trace beside it, standing for circulation under the demands of exercise and emergencies', s);
    },

    /* 08 — the mastery panel: circulation reaching every cell */
    8: () => {
      const k = kit();
      let s = k.defs;
      s += `<ellipse cx="180" cy="86" rx="132" ry="68" fill="${C.wallMid}" opacity=".07"/>`;
      s += shadow(k.g, 180, 156, 84, 7);
      /* a body silhouette with the network inside it */
      s += `<path d="M180 14 C168 14 162 22 163 34 C164 44 168 50 172 54
             C158 58 148 68 144 84 C140 102 144 126 150 144 C154 154 208 154 212 144
             C218 126 222 102 218 84 C214 68 204 58 190 54 C194 50 198 44 199 34 C200 22 192 14 180 14 Z"
             fill="${C.figure}" opacity=".14"/>`;
      /* vessels branching through the body, red on one side, blue on the other */
      s += `<path d="M180 52 C176 74 176 96 180 120 M180 120 C182 134 180 144 176 150"
              stroke="url(#${k.g}wall)" stroke-width="8" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M180 60 C166 66 156 76 152 90 M152 90 C150 102 152 114 156 124"
              stroke="url(#${k.g}cap)" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M180 60 C194 66 204 76 208 90 M208 90 C210 102 208 114 204 124"
              stroke="url(#${k.g}vein)" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M180 78 C172 88 170 98 172 108 M180 78 C188 88 190 98 188 108"
              stroke="url(#${k.g}cap)" stroke-width="4.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
      s += `<path d="M176 150 C160 152 146 146 138 136 M176 150 C192 152 206 146 214 136"
              stroke="url(#${k.g}vein)" stroke-width="4.4" fill="none" stroke-linecap="round" opacity=".85"/>`;
      /* the heart, at the centre of it all */
      s += `<path d="M180 62 C190 52 208 54 212 70 C216 86 202 102 184 106 C176 108 170 104 168 98
              C162 86 164 68 172 62 C175 59 178 60 180 62 Z" fill="url(#${k.g}heart)"/>`;
      s += `<path d="M180 66 C176 78 176 92 182 102" stroke="${C.septum}" stroke-width="2" fill="none" opacity=".55"/>`;
      s += `<path d="M196 58 C204 52 214 56 218 64" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      /* cells being supplied at the edges */
      s += redCell(k.g, 116, 60, 15, -14) + redCell(k.g, 250, 132, 14, 12) + redCell(k.g, 268, 56, 12, 6);
      return svg('A body-wide network: the heart at the centre and vessels carrying blood out to every cell, red on one side and blue on the other', s);
    }
  };

  window.inneruCircMapArt = function (n) {
    const fn = ART[n];
    try { return fn ? fn() : ''; } catch (e) { return ''; }
  };

  function inject() {
    if (location.hash.split('?')[0] !== '#circulatory') return;
    const grid = document.querySelector('.circ-path');
    if (!grid) return;
    /* the mastery panel is a sibling of the grid, so the scope class has to sit on
       their common parent for the card and panel rules to both apply */
    const world = document.querySelector('.circ-world') || grid.parentElement || grid;
    world.classList.add('circ-map');
    if (grid.querySelector('.circ-card-art')) return;

    const cards = [...grid.querySelectorAll('.circ-card')];
    cards.forEach((card, i) => {
      const art = window.inneruCircMapArt(i + 1);
      if (!art) return;
      const wrap = document.createElement('div');
      wrap.className = 'circ-card-art';
      wrap.innerHTML = art;
      card.insertBefore(wrap, card.firstChild);
    });

    /* the mastery panel is this world's final challenge, with its own illustration */
    const finale = world.querySelector('.finalmission') || document.querySelector('.finalmission');
    if (finale && !finale.querySelector('.circ-card-art')) {
      const art = window.inneruCircMapArt(8);
      if (art) {
        const wrap = document.createElement('div');
        wrap.className = 'circ-card-art';
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
