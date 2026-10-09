/* ============================================================================
   Excretory mission-map illustrations
   ----------------------------------------------------------------------------
   Seven soft-shaded vignettes for the Excretory world's cards, in the same register
   as the Integumentary and Respiratory sets: cream panel, volumetric pastel forms,
   contact shadows, no labels.

   Scoped to #excretory only.
   ========================================================================== */
(() => {
  'use strict';
  if (window.__excMapArt) return;
  window.__excMapArt = 1;

  const C = {
    bodyHi: '#F4D9C4', bodyLo: '#DDB396',
    kidHi: '#C87A6E', kidMid: '#AC5A51', kidLo: '#8B4038',
    cortex: '#D08C7E', medulla: '#B96A61', pelvis: '#F1DCAF',
    urine: '#EFC96B', urineHi: '#FBE7AE', urineLo: '#D3A33C',
    vesselHi: '#D9646C', vesselLo: '#A3343F', veinHi: '#7BA5D6', veinLo: '#3F6C9F',
    tuft: '#E39AA0', tuftDeep: '#C46A72',
    tubeHi: '#F8E6D2', tubeLo: '#DFC3A6',
    dropHi: '#BFE4EA', dropLo: '#79B9C6',
    stone: '#C9A24A', stoneLo: '#9C7A2E',
    good: '#2AA79B', line: '#8A5B46'
  };

  const uid = (() => { let n = 0; return p => `${p}${++n}`; })();

  function kit() {
    const g = uid('e');
    const defs = `<defs>
      <linearGradient id="${g}body" x1=".2" y1="0" x2=".6" y2="1">
        <stop offset="0" stop-color="${C.bodyHi}"/><stop offset="1" stop-color="${C.bodyLo}"/></linearGradient>
      <radialGradient id="${g}kid" cx="34%" cy="28%" r="78%">
        <stop offset="0" stop-color="${C.kidHi}"/><stop offset=".58" stop-color="${C.kidMid}"/>
        <stop offset="1" stop-color="${C.kidLo}"/></radialGradient>
      <linearGradient id="${g}cortex" x1="0" y1="0" x2=".4" y2="1">
        <stop offset="0" stop-color="${C.cortex}"/><stop offset="1" stop-color="${C.kidMid}"/></linearGradient>
      <radialGradient id="${g}medulla" cx="40%" cy="30%" r="70%">
        <stop offset="0" stop-color="${C.medulla}"/><stop offset="1" stop-color="${C.kidLo}"/></radialGradient>
      <linearGradient id="${g}pelvis" x1="0" y1="0" x2=".4" y2="1">
        <stop offset="0" stop-color="${C.urineHi}"/><stop offset="1" stop-color="${C.pelvis}"/></linearGradient>
      <linearGradient id="${g}urine" x1="0" y1="0" x2=".3" y2="1">
        <stop offset="0" stop-color="${C.urineHi}"/><stop offset=".6" stop-color="${C.urine}"/>
        <stop offset="1" stop-color="${C.urineLo}"/></linearGradient>
      <linearGradient id="${g}art" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.vesselHi}"/><stop offset="1" stop-color="${C.vesselLo}"/></linearGradient>
      <linearGradient id="${g}vein" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.veinHi}"/><stop offset="1" stop-color="${C.veinLo}"/></linearGradient>
      <radialGradient id="${g}tuft" cx="36%" cy="30%" r="72%">
        <stop offset="0" stop-color="${C.tuft}"/><stop offset="1" stop-color="${C.tuftDeep}"/></radialGradient>
      <linearGradient id="${g}tube" x1="0" y1="0" x2=".2" y2="1">
        <stop offset="0" stop-color="${C.tubeHi}"/><stop offset="1" stop-color="${C.tubeLo}"/></linearGradient>
      <radialGradient id="${g}drop" cx="34%" cy="28%" r="70%">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/>
        <stop offset=".5" stop-color="${C.dropHi}"/><stop offset="1" stop-color="${C.dropLo}"/></radialGradient>
      <radialGradient id="${g}stone" cx="34%" cy="30%" r="74%">
        <stop offset="0" stop-color="#E3C778"/><stop offset=".6" stop-color="${C.stone}"/>
        <stop offset="1" stop-color="${C.stoneLo}"/></radialGradient>
      <filter id="${g}blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4.5"/></filter>
    </defs>`;
    return { g, defs };
  }

  const svg = (label, inner) =>
    `<svg viewBox="0 0 360 168" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

  const shadow = (g, cx, cy, rx, ry) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry || 7}" fill="#8A5B46" opacity=".24" filter="url(#${g}blur)"/>`;

  /* a kidney bean, medial notch to the chosen side */
  function kidney(g, cx, cy, rx, ry, notch) {
    const s = notch === 'left' ? -1 : 1;
    let p = `<path d="M${cx + s * rx * .35} ${cy - ry}
        C${cx + s * rx * 1.15} ${cy - ry * .82} ${cx + s * rx * 1.25} ${cy + ry * .5} ${cx + s * rx * .55} ${cy + ry * .92}
        C${cx - s * rx * .1} ${cy + ry * 1.18} ${cx - s * rx * 1.05} ${cy + ry * .74} ${cx - s * rx * .95} ${cy}
        C${cx - s * rx * .86} ${cy - ry * .74} ${cx - s * rx * .1} ${cy - ry * 1.1} ${cx + s * rx * .35} ${cy - ry} Z"
        fill="url(#${g}kid)"/>`;
    p += `<path d="M${cx + s * rx * .55} ${cy - ry * .62}
        C${cx + s * rx * .1} ${cy - ry * .44} ${cx + s * rx * .02} ${cy + ry * .5} ${cx + s * rx * .5} ${cy + ry * .74}"
        stroke="${C.kidLo}" stroke-width="1.6" fill="none" opacity=".4"/>`;
    p += `<ellipse cx="${cx + s * rx * .3}" cy="${cy - ry * .45}" rx="${rx * .3}" ry="${ry * .22}"
        fill="#FFFFFF" opacity=".26" transform="rotate(${-20 * s} ${cx + s * rx * .3} ${cy - ry * .45})"/>`;
    return p;
  }

  /* a soft body silhouette used by the whole-body vignettes */
  const body = g =>
    `<path d="M180 16 C168 16 162 24 163 36 C164 46 168 52 172 56
       C158 60 146 70 142 86 C138 104 142 128 148 146 C152 156 208 156 212 146
       C218 128 222 104 218 86 C214 70 202 60 188 56 C192 52 196 46 197 36 C198 24 192 16 180 16 Z"
       fill="url(#${g}body)"/>`;

  const droplet = (g, x, y, s) =>
    `<path d="M${x} ${y} c${3.4 * s} ${5 * s} ${6 * s} ${8 * s} ${6 * s} ${11 * s}
       a${6 * s} ${6 * s} 0 0 1 ${-12 * s} 0 c0 ${-3 * s} ${2.6 * s} ${-6 * s} ${6 * s} ${-11 * s} z"
       fill="url(#${g}drop)"/>`;

  /* ---------------------------------------------------------------- the seven */
  const ART = {
    /* 01 — three exit routes from one body */
    1: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 156, 74, 7);
      s += body(k.g);
      /* lungs: carbon dioxide and water vapour out */
      s += `<path d="M164 62 C154 58 148 66 150 78 C152 88 160 92 166 88 Z" fill="#F3B9C1"/>`;
      s += `<path d="M196 62 C206 58 212 66 210 78 C208 88 200 92 194 88 Z" fill="#F3B9C1"/>`;
      s += `<path d="M180 58 V76" stroke="#D9B6C2" stroke-width="7" stroke-linecap="round"/>`;
      s += `<path d="M150 44 C130 34 108 34 92 42" stroke="${C.dropLo}" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M92 42 l11 -5 M92 42 l11 6" stroke="${C.dropLo}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
      /* skin: sweat */
      s += droplet(k.g, 118, 108, 1) + droplet(k.g, 108, 128, .8);
      s += `<path d="M140 116 C126 116 116 118 108 122" stroke="${C.dropLo}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".75"/>`;
      /* kidneys: urea and excess salts in urine */
      s += `<path d="M170 104 C160 100 152 106 154 116 C156 126 166 128 172 122 Z" fill="url(#${k.g}kid)"/>`;
      s += `<path d="M190 104 C200 100 208 106 206 116 C204 126 194 128 188 122 Z" fill="url(#${k.g}kid)"/>`;
      s += `<path d="M180 112 V132" stroke="${C.pelvis}" stroke-width="6" stroke-linecap="round"/>`;
      s += `<path d="M226 126 C246 130 262 138 272 148" stroke="${C.urine}" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M272 148 l-12 -3 M272 148 l-11 6" stroke="${C.urine}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
      s += `<ellipse cx="278" cy="152" rx="12" ry="8" fill="url(#${k.g}urine)"/>`;
      s += `<path d="M180 22 C186 26 192 30 196 36" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="4" fill="none"/>`;
      return svg('A body showing its three exit routes for waste: the lungs breathing out carbon dioxide and water vapour, the skin losing water and salts in sweat, and the kidneys removing urea in urine', s);
    },

    /* 02 — inside a kidney */
    2: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 176, 154, 84, 7);
      s += kidney(k.g, 172, 84, 76, 60, 'left');
      /* cortex rim, medullary pyramids, pelvis */
      s += `<path d="M172 26 C214 30 236 58 232 88 C228 116 206 138 172 142 C138 138 116 116 112 88 C108 58 130 30 172 26 Z"
              fill="none" stroke="${C.cortex}" stroke-width="13" opacity=".85"/>`;
      [0, 1, 2].forEach(i => {
        const x = 130 + i * 34;
        s += `<path d="M${x} 54 C${x + 14} 74 ${x + 14} 96 ${x} 116 C${x + 26} 108 ${x + 30} 66 ${x} 54 Z"
                fill="url(#${k.g}medulla)" opacity=".9"/>`;
      });
      s += `<ellipse cx="176" cy="86" rx="26" ry="20" fill="url(#${k.g}pelvis)"/>`;
      s += `<ellipse cx="176" cy="86" rx="16" ry="12" fill="${C.urineHi}" opacity=".8"/>`;
      /* vessels entering, then the ureter leaving */
      s += `<path d="M112 62 C128 58 146 58 160 62" stroke="url(#${k.g}art)" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M112 76 C128 76 146 78 158 82" stroke="url(#${k.g}vein)" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M176 106 C178 126 174 140 168 152" stroke="url(#${k.g}urine)" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M132 46 C158 34 196 34 214 48" stroke="#FFFFFF" stroke-opacity=".3" stroke-width="5" fill="none"/>`;
      return svg('A kidney in cutaway: the outer cortex, the medullary pyramids inside, the renal pelvis collecting urine, blood vessels entering and the ureter leaving', s);
    },

    /* 03 — the filtration gate */
    3: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 154, 84, 7);
      /* the glomerular tuft inside its capsule */
      s += `<circle cx="132" cy="84" r="56" fill="${C.tubeHi}" opacity=".55"/>`;
      s += `<circle cx="132" cy="84" r="56" fill="none" stroke="${C.tubeLo}" stroke-width="2" opacity=".6"/>`;
      s += `<path d="M92 74 C112 52 150 54 164 76 C176 96 158 118 134 118 C110 118 94 100 92 74 Z" fill="url(#${k.g}tuft)" opacity=".95"/>`;
      [0, 1, 2, 3].forEach(i => {
        s += `<path d="M${100 + i * 12} ${72 + i * 8} C${116 + i * 10} ${58 + i * 10} ${144} ${64 + i * 8} ${152} ${80 + i * 6}"
                stroke="${C.tuftDeep}" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`;
      });
      s += `<circle cx="118" cy="72" r="7" fill="#FFFFFF" opacity=".3"/>`;
      /* afferent and efferent vessels */
      s += `<path d="M78 62 C96 52 108 52 120 58" stroke="url(#${k.g}art)" stroke-width="8" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M78 104 C98 112 112 112 124 106" stroke="url(#${k.g}vein)" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      /* the filter, then what passes and what does not */
      s += `<path d="M190 46 V122" stroke="${C.tubeLo}" stroke-width="5" stroke-dasharray="7 6" stroke-linecap="round"/>`;
      s += `<circle cx="222" cy="62" r="8" fill="${C.urine}" opacity=".95"/>`;
      s += `<circle cx="248" cy="80" r="6.5" fill="${C.urine}" opacity=".85"/>`;
      s += `<circle cx="226" cy="100" r="5.5" fill="${C.urine}" opacity=".8"/>`;
      s += `<circle cx="262" cy="112" r="5" fill="${C.urine}" opacity=".7"/>`;
      s += `<path d="M282 52 C296 56 306 66 310 78" stroke="${C.vesselHi}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>`;
      s += `<circle cx="292" cy="94" r="9" fill="${C.vesselHi}" opacity=".85"/>`;
      s += `<circle cx="300" cy="122" r="7" fill="${C.veinHi}" opacity=".8"/>`;
      return svg('The filtration gate: a glomerular tuft inside its capsule filtering small molecules out while larger proteins and blood cells stay behind', s);
    },

    /* 04 — the tubule taking the useful parts back */
    4: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 154, 90, 7);
      /* the tubule, drawn as a thick cream channel */
      s += `<path d="M40 96 h96 q30 0 30 26 q0 26 -30 26 h-96" stroke="url(#${k.g}tube)" stroke-width="34" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M40 96 h96 q30 0 30 26 q0 26 -30 26 h-96" stroke="${C.tubeLo}" stroke-width="1.4" fill="none" opacity=".5"/>`;
      /* what goes back to the blood */
      s += `<circle cx="86" cy="96" r="7" fill="${C.urine}" opacity=".9"/>`;
      s += `<circle cx="130" cy="96" r="6" fill="${C.urine}" opacity=".85"/>`;
      s += `<path d="M86 84 C88 62 96 48 112 42" stroke="${C.vesselHi}" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M112 42 l-12 -3 M112 42 l-10 7" stroke="${C.vesselHi}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M136 84 C142 66 154 54 170 48" stroke="${C.vesselHi}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
            <path d="M170 48 l-12 -3 M170 48 l-10 7" stroke="${C.vesselHi}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;
      /* the capillary they return into */
      s += `<path d="M56 40 C96 26 148 26 186 34" stroke="url(#${k.g}art)" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>`;
      /* what leaves as urine */
      s += `<circle cx="120" cy="148" r="6" fill="${C.urineLo}" opacity=".8"/>`;
      s += `<circle cx="160" cy="148" r="5" fill="${C.urineLo}" opacity=".7"/>`;
      s += `<path d="M204 148 C232 148 254 140 268 126" stroke="${C.urine}" stroke-width="7" fill="none" stroke-linecap="round"/>
            <path d="M268 126 l-12 0 M268 126 l-8 8" stroke="${C.urine}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
      s += `<ellipse cx="288" cy="116" rx="18" ry="13" fill="url(#${k.g}urine)"/>`;
      s += `<ellipse cx="282" cy="111" rx="6" ry="4" fill="#FFFFFF" opacity=".35"/>`;
      return svg('A tubule returning glucose, amino acids and most of the water to the blood while urea, excess salts and creatinine continue on to leave as urine', s);
    },

    /* 05 — water balance during exercise */
    5: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 156, 80, 7);
      s += body(k.g);
      /* sweating, and the water being conserved */
      s += droplet(k.g, 146, 62, 1) + droplet(k.g, 132, 84, .85) + droplet(k.g, 152, 104, .7);
      s += `<path d="M126 92 C112 94 100 100 94 108" stroke="${C.dropLo}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
      s += `<path d="M212 62 C228 62 240 70 246 80" stroke="${C.dropLo}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
      /* the kidneys conserving water: a smaller, more concentrated output */
      s += `<path d="M166 112 C156 108 148 114 150 124 C152 134 162 136 168 130 Z" fill="url(#${k.g}kid)"/>`;
      s += `<path d="M190 112 C200 108 208 114 206 124 C204 134 194 136 188 130 Z" fill="url(#${k.g}kid)"/>`;
      s += `<path d="M178 132 V140" stroke="${C.urineLo}" stroke-width="5" stroke-linecap="round"/>`;
      /* a small concentrated drop and a big dilute one, for comparison */
      s += `<ellipse cx="256" cy="118" rx="12" ry="9" fill="url(#${k.g}urine)"/>`;
      s += `<ellipse cx="296" cy="118" rx="20" ry="15" fill="url(#${k.g}drop)" opacity=".95"/>`;
      s += `<path d="M244 148 C262 154 288 154 306 148" stroke="${C.urineLo}" stroke-width="1.4" fill="none" opacity=".35"/>`;
      s += `<path d="M182 22 C188 26 194 32 198 38" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="4" fill="none"/>`;
      return svg('A body losing water as sweat during exercise while the kidneys conserve water and produce a smaller, more concentrated volume of urine', s);
    },

    /* 06 — kidney care: a healthy kidney and one that needs attention */
    6: () => {
      const k = kit();
      let s = k.defs;
      /* healthy side */
      s += shadow(k.g, 108, 152, 60, 6);
      s += kidney(k.g, 104, 88, 52, 42, 'left');
      s += `<ellipse cx="108" cy="88" rx="16" ry="12" fill="url(#${k.g}pelvis)" opacity=".9"/>`;
      s += `<path d="M104 126 C106 138 102 146 98 152" stroke="url(#${k.g}urine)" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M74 44 C94 34 116 34 130 42" stroke="${C.good}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
      s += `<path d="M84 36 l10 10 M94 36 l-10 10" stroke="${C.good}" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".0"/>`;
      /* needs attention: a stone blocking the way out */
      s += shadow(k.g, 254, 152, 60, 6);
      s += kidney(k.g, 250, 88, 52, 42, 'left');
      s += `<ellipse cx="254" cy="88" rx="16" ry="12" fill="url(#${k.g}pelvis)" opacity=".9"/>`;
      s += `<path d="M250 126 C252 138 248 146 244 152" stroke="url(#${k.g}urine)" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      s += `<circle cx="248" cy="132" r="11" fill="url(#${k.g}stone)"/>`;
      s += `<circle cx="244" cy="128" r="3.4" fill="#FFFFFF" opacity=".4"/>`;
      s += `<circle cx="262" cy="140" r="6" fill="${C.vesselHi}" opacity=".8"/>`;
      s += `<path d="M292 44 C310 46 322 56 328 68" stroke="${C.vesselHi}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`;
      return svg('Two kidneys compared: a healthy kidney with a clear route for urine, and one with a stone blocking the ureter, which needs medical attention', s);
    },

    /* 07 — balance restored */
    7: () => {
      const k = kit();
      let s = k.defs;
      s += `<ellipse cx="180" cy="86" rx="130" ry="66" fill="${C.good}" opacity=".07"/>`;
      s += shadow(k.g, 180, 156, 82, 7);
      s += kidney(k.g, 168, 82, 66, 52, 'left');
      s += `<ellipse cx="172" cy="82" rx="22" ry="17" fill="url(#${k.g}pelvis)"/>`;
      s += `<ellipse cx="172" cy="82" rx="13" ry="10" fill="${C.urineHi}" opacity=".85"/>`;
      s += `<path d="M118 46 C144 34 186 34 208 46" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="6" fill="none"/>`;
      /* both fluids leaving in balance */
      s += `<path d="M172 132 C176 142 174 150 170 156" stroke="url(#${k.g}urine)" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      s += droplet(k.g, 96, 58, .9) + droplet(k.g, 78, 82, .75);
      s += `<path d="M248 60 C268 62 282 72 290 86" stroke="${C.good}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`;
      s += `<path d="M254 108 C272 112 286 120 294 130" stroke="url(#${k.g}art)" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
      s += `<ellipse cx="292" cy="140" rx="16" ry="12" fill="url(#${k.g}urine)" opacity=".95"/>`;
      s += `<ellipse cx="286" cy="135" rx="5" ry="3.4" fill="#FFFFFF" opacity=".4"/>`;
      return svg('A healthy kidney keeping the body in balance, with waste leaving as urine and water and salts held steady', s);
    }
  };

  window.inneruExcMapArt = function (n) {
    const fn = ART[n];
    try { return fn ? fn() : ''; } catch (e) { return ''; }
  };

  function inject() {
    if (location.hash.split('?')[0] !== '#excretory') return;
    const grid = document.querySelector('.resp-grid');
    if (!grid) return;
    const world = document.querySelector('.exc-world') || grid;
    world.classList.add('exc-map');
    if (grid.querySelector('.exc-card-art')) return;

    const cards = [...grid.querySelectorAll('.resp-card')];
    cards.forEach((card, i) => {
      const art = window.inneruExcMapArt(i + 1);
      if (!art) return;
      const wrap = document.createElement('div');
      wrap.className = 'exc-card-art';
      wrap.innerHTML = art;
      card.insertBefore(wrap, card.firstChild);
    });

    const finale = document.querySelector('.resp-finale');
    if (finale && !finale.querySelector('.exc-card-art')) {
      const art = window.inneruExcMapArt(7);
      if (art) {
        const wrap = document.createElement('div');
        wrap.className = 'exc-card-art';
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
