/* ============================================================================
   Integumentary mission-map illustrations — v2
   ----------------------------------------------------------------------------
   Rebuilt to the supplied reference: warm cream panel, large soft-rendered forms,
   volume from layered gradients, contact shadows, no labels, no flat diagrams.

   Attaches only to the Integumentary world page's own cards (.resp-card /
   .resp-finale). No text, lock, link, handler or other system is touched.
   ========================================================================== */
(() => {
  'use strict';
  if (window.__integMapArt) return;
  window.__integMapArt = 1;

  /* warm reference palette */
  const C = {
    skinHi: '#FBD3AE', skinLo: '#E7A176',
    epiHi: '#F9DCBE', epiLo: '#EDC098',
    dermHi: '#E9A093', dermLo: '#D2766E',
    fatHi: '#FAE3B0', fatLo: '#E4B968', lobeHi: '#FEF3CF',
    hairHi: '#7A5238', hairLo: '#38210F',
    sebum: '#F7DCA8', sebumLo: '#DCAF63',
    eccrine: '#D8B4DE', eccrineLo: '#A87FBE',
    arteryHi: '#DA6A70', arteryLo: '#A93640',
    veinHi: '#7BA5D6', veinLo: '#3F6C9F',
    nerveHi: '#F2D97E', nerveLo: '#C9A23C',
    woundHi: '#D06A70', woundLo: '#8E2F38', woundEdge: '#E8B0A8',
    nailHi: '#FFFBF5', nailLo: '#E9D3BE',
    shieldHi: '#2AA79B', shieldLo: '#0A5F5A', gold: '#E9B944',
    line: '#8A5B46'
  };

  const uid = (() => { let n = 0; return p => `${p}${++n}`; })();

  /* ---------------------------------------------------------------- vignette kit */
  function kit() {
    const g = uid('k');
    const defs = `<defs>
      <linearGradient id="${g}skin" x1=".1" y1="0" x2=".2" y2="1">
        <stop offset="0" stop-color="${C.skinHi}"/><stop offset="1" stop-color="${C.skinLo}"/></linearGradient>
      <linearGradient id="${g}epi" x1="0" y1="0" x2=".15" y2="1">
        <stop offset="0" stop-color="${C.epiHi}"/><stop offset="1" stop-color="${C.epiLo}"/></linearGradient>
      <linearGradient id="${g}derm" x1="0" y1="0" x2=".1" y2="1">
        <stop offset="0" stop-color="${C.dermHi}"/><stop offset="1" stop-color="${C.dermLo}"/></linearGradient>
      <linearGradient id="${g}fat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.fatHi}"/><stop offset="1" stop-color="${C.fatLo}"/></linearGradient>
      <radialGradient id="${g}lobe" cx="35%" cy="28%" r="72%">
        <stop offset="0" stop-color="${C.lobeHi}"/><stop offset=".65" stop-color="${C.fatHi}"/>
        <stop offset="1" stop-color="${C.fatLo}"/></radialGradient>
      <linearGradient id="${g}hair" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${C.hairHi}"/><stop offset="1" stop-color="${C.hairLo}"/></linearGradient>
      <linearGradient id="${g}tube" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#E0A88C"/><stop offset=".45" stop-color="#F6D8BE"/>
        <stop offset="1" stop-color="#D79C7E"/></linearGradient>
      <linearGradient id="${g}sebum" x1="0" y1="0" x2=".3" y2="1">
        <stop offset="0" stop-color="#FCEBC6"/><stop offset="1" stop-color="${C.sebumLo}"/></linearGradient>
      <linearGradient id="${g}ecr" x1="0" y1="0" x2=".3" y2="1">
        <stop offset="0" stop-color="#EBD3F2"/><stop offset="1" stop-color="${C.eccrineLo}"/></linearGradient>
      <linearGradient id="${g}art" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.arteryHi}"/><stop offset="1" stop-color="${C.arteryLo}"/></linearGradient>
      <linearGradient id="${g}vein" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.veinHi}"/><stop offset="1" stop-color="${C.veinLo}"/></linearGradient>
      <linearGradient id="${g}nerve" x1="0" y1="0" x2=".3" y2="1">
        <stop offset="0" stop-color="${C.nerveHi}"/><stop offset="1" stop-color="${C.nerveLo}"/></linearGradient>
      <linearGradient id="${g}nail" x1=".2" y1="0" x2=".3" y2="1">
        <stop offset="0" stop-color="${C.nailHi}"/><stop offset="1" stop-color="${C.nailLo}"/></linearGradient>
      <linearGradient id="${g}wound" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.woundHi}"/><stop offset="1" stop-color="${C.woundLo}"/></linearGradient>
      <linearGradient id="${g}shield" x1=".2" y1="0" x2=".4" y2="1">
        <stop offset="0" stop-color="${C.shieldHi}"/><stop offset="1" stop-color="${C.shieldLo}"/></linearGradient>
      <radialGradient id="${g}droplet" cx="34%" cy="28%" r="70%">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/>
        <stop offset=".5" stop-color="#BFE4EA"/><stop offset="1" stop-color="#79B9C6"/></radialGradient>
      <radialGradient id="${g}glow" cx="50%" cy="45%" r="55%">
        <stop offset="0" stop-color="${C.gold}" stop-opacity=".34"/>
        <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${g}soft" cx="50%" cy="45%" r="55%">
        <stop offset="0" stop-color="#B98A63" stop-opacity=".22"/>
        <stop offset="1" stop-color="#B98A63" stop-opacity="0"/></radialGradient>
      <filter id="${g}blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4.5"/></filter>
      <filter id="${g}blur2" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.2"/></filter>
    </defs>`;
    return { g, defs };
  }

  const svg = (label, inner) =>
    `<svg viewBox="0 0 360 168" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

  /* a soft contact shadow under an object */
  const shadow = (g, cx, cy, rx, ry) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry || 7}" fill="#8A5B46" opacity=".26" filter="url(#${g}blur)"/>`;

  /* a hair follicle: tapered tube with a bulb, a hair inside and a sebaceous gland */
  function follicle(g, x, top, bottom, o) {
    const opt = o || {}, w = opt.w || 9;
    let s = '';
    s += `<path d="M${x - w} ${top} C${x - w - 2} ${top + 46} ${x - w + 1} ${bottom - 30} ${x} ${bottom - 14}
            C${x + w - 1} ${bottom - 30} ${x + w + 2} ${top + 46} ${x + w} ${top} Z"
            fill="url(#${g}tube)" opacity=".95"/>`;
    s += `<path d="M${x - w - 1} ${top} C${x - w - 3} ${top + 46} ${x - w} ${bottom - 30} ${x - 2} ${bottom - 16}"
            stroke="#C98F73" stroke-width="1.1" fill="none" opacity=".5"/>`;
    s += `<circle cx="${x}" cy="${bottom - 10}" r="12.5" fill="url(#${g}tube)"/>`;
    s += `<circle cx="${x}" cy="${bottom - 10}" r="7" fill="#E8B79A" opacity=".75"/>`;
    s += `<circle cx="${x - 2}" cy="${bottom - 12}" r="3" fill="#C98F73" opacity=".6"/>`;
    s += `<path d="M${x - 2} ${top - 30} C${x} ${top + 24} ${x + 1} ${bottom - 40} ${x - 1} ${bottom - 18}"
            stroke="url(#${g}hair)" stroke-width="5.4" stroke-linecap="round" fill="none"/>`;
    s += `<path d="M${x - 3.2} ${top - 28} C${x - 1.6} ${top + 24} ${x - .6} ${bottom - 42} ${x - 2.4} ${bottom - 22}"
            stroke="#9A6B4C" stroke-width="1.3" fill="none" opacity=".65"/>`;
    if (opt.gland) {
      s += `<path d="M${x + w - 2} ${top + 34} C${x + 20} ${top + 22} ${x + 36} ${top + 26} ${x + 36} ${top + 40}
              C${x + 36} ${top + 54} ${x + 20} ${top + 58} ${x + w + 1} ${top + 48} Z"
              fill="url(#${g}sebum)"/>`;
      s += `<path d="M${x + w + 2} ${top + 38} C${x + 18} ${top + 30} ${x + 28} ${top + 32} ${x + 29} ${top + 41}"
              stroke="#FFFFFF" stroke-opacity=".55" stroke-width="2" fill="none"/>`;
      s += `<path d="M${x + w - 3} ${top + 40} q8 -3 14 1" stroke="#C79A5C" stroke-width="1.1" fill="none" opacity=".5"/>`;
    }
    if (opt.muscle) {
      s += `<path d="M${x + w + 3} ${top + 26} C${x + 28} ${top + 44} ${x + 30} ${top + 62} ${x + 22} ${top + 76}"
              stroke="url(#${g}art)" stroke-width="7" stroke-linecap="round" fill="none" opacity=".95"/>`;
      s += `<path d="M${x + w + 4} ${top + 27} C${x + 26} ${top + 44} ${x + 28} ${top + 58} ${x + 22} ${top + 70}"
              stroke="#F0A9A2" stroke-width="2" fill="none" opacity=".5"/>`;
    }
    return s;
  }

  /* a coiled eccrine sweat gland with its duct */
  function sweat(g, x, y, surface) {
    let s = `<path d="M${x - 18} ${y} c-1 -11 11 -18 21 -14 c11 4 14 17 5 24 c-9 7 -22 3 -24 -8"
              fill="none" stroke="url(#${g}ecr)" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M${x - 14} ${y - 4} c-1 -8 8 -13 15 -10" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="2" fill="none"/>`;
    s += `<path d="M${x + 6} ${y - 4} C${x + 9} ${y - 34} ${x + 9} ${surface + 18} ${x + 10} ${surface}"
            stroke="url(#${g}ecr)" stroke-width="3.6" stroke-linecap="round" fill="none"/>`;
    return s;
  }

  /* a soft block of skin with surface, three layers and a rounded silhouette */
  function block(g, o) {
    const x0 = o.x, x1 = o.x1, top = o.top, eBot = top + (o.epi || 17), dBot = eBot + (o.derm || 46), bot = dBot + (o.fat || 22);
    const d = o.d || 13, r = 7;
    let s = '';
    s += `<path d="M${x1} ${top} L${x1 + d} ${top - d} L${x1 + d} ${bot - d} L${x1} ${bot} Z" fill="${C.dermLo}" opacity=".85"/>`;
    s += `<path d="M${x0} ${top} L${x1} ${top} L${x1 + d} ${top - d} L${x0 + d} ${top - d} Z" fill="url(#${g}skin)"/>`;
    s += `<path d="M${x0 + 6} ${top} H${x1 - 6} L${x1 + d - 6} ${top - d} H${x0 + d + 6} Z" fill="#FFFFFF" opacity=".34"/>`;
    s += `<path d="M${x0} ${eBot} H${x1} V${dBot} H${x0} Z" fill="url(#${g}derm)"/>`;
    s += `<path d="M${x0} ${top} H${x1} V${eBot} H${x0} Z" fill="url(#${g}epi)"/>`;
    s += `<path d="M${x0} ${dBot} H${x1} V${bot} H${x0} Z" fill="url(#${g}fat)"/>`;
    s += `<path d="M${x0} ${eBot} H${x1}" stroke="#C9977C" stroke-width="1.1" opacity=".45"/>`;
    s += `<path d="M${x0} ${dBot} H${x1}" stroke="#C08A6F" stroke-width="1.1" opacity=".35"/>`;
    s += `<path d="M${x0} ${top} V${bot}" stroke="#C9977C" stroke-width="1" opacity=".3"/>`;
    s += `<path d="M${x1} ${top} V${bot}" stroke="#B77F66" stroke-width="1" opacity=".25"/>`;
    const lobeN = o.lobes === undefined ? 5 : o.lobes;
    for (let i = 0; i < lobeN; i++) {
      const cx = x0 + 20 + i * ((x1 - x0 - 40) / Math.max(1, lobeN - 1));
      s += `<circle cx="${cx}" cy="${bot - 11}" r="11.5" fill="url(#${g}lobe)"/>`;
      s += `<circle cx="${cx - 3}" cy="${bot - 15}" r="3.4" fill="#FFFFFF" opacity=".34"/>`;
    }
    return { markup: s, x0, x1, top, eBot, dBot, bot, d, clip: `url(#${g}clip)`,
             clipDef: '' };
  }

  /* ---------------------------------------------------------------- the seven */
  const ART = {
    /* 01 — a skin block with hairs, glands, vessels and fat */
    1: () => {
      const k = kit(), b = block(k.g, { x: 96, x1: 268, top: 38, epi: 16, derm: 50, fat: 22 });
      let s = k.defs;
      s += shadow(k.g, 182, 140, 104, 9);
      s += b.markup;
      s += `<clipPath id="${k.g}clip"><rect x="${b.x0}" y="${b.top}" width="${b.x1 - b.x0}" height="${b.bot - b.top}" rx="4"/></clipPath>`;
      s += `<g clip-path="${b.clip}">
        <path d="M104 ${b.dBot - 6} C138 ${b.dBot - 26} 176 ${b.dBot - 22} 210 ${b.dBot - 4} C238 ${b.dBot + 10} 256 ${b.dBot + 4} 266 ${b.dBot - 6}"
          stroke="url(#${k.g}art)" stroke-width="6.5" fill="none" stroke-linecap="round"/>
        <path d="M104 ${b.dBot + 14} C142 ${b.dBot - 2} 182 ${b.dBot} 214 ${b.dBot + 12} C240 ${b.dBot + 20} 256 ${b.dBot + 16} 266 ${b.dBot + 8}"
          stroke="url(#${k.g}vein)" stroke-width="5" fill="none" stroke-linecap="round"/>
        ${sweat(k.g, 236, b.dBot - 20, b.top)}
        ${follicle(k.g, 132, b.top, b.dBot + 6, { gland: true })}
        ${follicle(k.g, 186, b.top, b.dBot + 10, { muscle: true })}
      </g>`;
      s += `<path d="M${b.x0} ${b.top + 2.5} H${b.x1}" stroke="#FFF4E4" stroke-width="2.4" opacity=".5"/>`;
      return svg('A block of skin in three-quarter view: epidermis, dermis and fat layer, with two hair follicles, a sebaceous gland, a coiled sweat gland and blood vessels', s);
    },

    /* 02 — layers peeling apart, with renewal at the surface */
    2: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 180, 142, 104, 8);
      const sheet = (y, h, fill, rot, hi) =>
        `<g transform="rotate(${rot} 180 ${y + h / 2})">
           <rect x="86" y="${y}" width="188" height="${h}" rx="${h / 2}" fill="url(#${k.g}${fill})"/>
           <rect x="94" y="${y + h * .18}" width="172" height="${h * .22}" rx="${h * .3}" fill="#FFFFFF" opacity="${hi}"/>
           <rect x="86" y="${y}" width="188" height="${h}" rx="${h / 2}" fill="none" stroke="#C9977C" stroke-width="1" opacity=".35"/>
         </g>`;
      /* renewal: cells rising through the top sheet and one shedding */
      s += `<circle cx="150" cy="34" r="5" fill="#FBDFC2" stroke="#D9A983" stroke-width="1"/>`;
      s += `<circle cx="184" cy="28" r="5" fill="#FBDFC2" stroke="#D9A983" stroke-width="1"/>`;
      s += `<circle cx="216" cy="24" r="4.6" fill="#F7D6B6" stroke="#D9A983" stroke-width="1" opacity=".9"/>`;
      s += `<ellipse cx="246" cy="20" rx="7" ry="4" fill="#F3CDAA" opacity=".8" transform="rotate(-18 246 20)"/>`;
      s += sheet(44, 26, 'epi', -3, '.55');
      s += sheet(78, 26, 'derm', 2, '.35');
      s += sheet(112, 24, 'fat', -1.5, '.45');
      return svg('The three skin layers shown as separate sheets peeling apart, with new cells rising through the top sheet and one shedding from the surface', s);
    },

    /* 03 — a hair follicle, and a fingertip with its nail */
    3: () => {
      const k = kit();
      let s = k.defs;
      s += shadow(k.g, 120, 148, 66, 8);
      s += `<path d="M56 138 V104 C56 86 68 76 84 76 C100 76 112 86 112 104 V138 Z" fill="url(#${k.g}derm)"/>`;
      s += `<path d="M56 138 V104 C56 86 68 76 84 76 C100 76 112 86 112 104 V138 Z" fill="url(#${k.g}epi)" opacity=".45"/>`;
      s += `<path d="M52 138 V104 C52 84 66 72 84 72 C102 72 116 84 116 104 V138" fill="none" stroke="#C9977C" stroke-width="1.2" opacity=".4"/>`;
      s += follicle(k.g, 84, 82, 132, { gland: true, w: 10 });
      s += shadow(k.g, 254, 148, 62, 8);
      s += `<g>
        <path d="M214 142 C214 106 224 88 246 84 C272 79 292 92 294 114 L294 142 Z" fill="url(#${k.g}skin)"/>
        <path d="M214 142 C214 106 224 88 246 84 C272 79 292 92 294 114 L294 142 Z" fill="none" stroke="#C9977C" stroke-width="1.2" opacity=".35"/>
        <path d="M226 120 C229 100 238 92 252 91 C272 90 283 101 285 118 L285 126 C264 134 240 134 226 126 Z"
          fill="url(#${k.g}nail)"/>
        <path d="M226 126 C240 134 264 134 285 126" stroke="#E7B4A6" stroke-width="3.4" fill="none" opacity=".85"/>
        <path d="M232 118 C235 102 242 97 252 96 C264 95 274 102 277 114"
          stroke="#FFFFFF" stroke-opacity=".75" stroke-width="2.6" fill="none"/>
        <path d="M240 92 C250 87 266 88 276 95" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="2" fill="none"/>
      </g>`;
      return svg('A hair follicle with its sebaceous gland emerging from a piece of skin, and beside it a fingertip showing the curved nail plate over the nail bed', s);
    },

    /* 04 — sweating and vessel response */
    4: () => {
      const k = kit(), b = block(k.g, { x: 104, x1: 256, top: 58, epi: 15, derm: 44, fat: 20 });
      let s = k.defs;
      s += shadow(k.g, 180, 142, 96, 8);
      s += b.markup;
      s += `<clipPath id="${k.g}clip"><rect x="${b.x0}" y="${b.top}" width="${b.x1 - b.x0}" height="${b.bot - b.top}" rx="4"/></clipPath>`;
      s += `<g clip-path="${b.clip}">
        <path d="M112 ${b.dBot - 4} C140 ${b.dBot - 22} 172 ${b.dBot - 20} 200 ${b.dBot - 4} C224 ${b.dBot + 8} 240 ${b.dBot + 2} 250 ${b.dBot - 6}"
          stroke="url(#${k.g}art)" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M112 ${b.dBot - 6} C140 ${b.dBot - 23} 172 ${b.dBot - 21} 200 ${b.dBot - 5}"
          stroke="#F09A9E" stroke-width="2" fill="none" opacity=".55"/>
        <path d="M112 ${b.dBot + 14} C146 ${b.dBot} 180 ${b.dBot + 2} 208 ${b.dBot + 12} C228 ${b.dBot + 18} 240 ${b.dBot + 14} 250 ${b.dBot + 6}"
          stroke="url(#${k.g}vein)" stroke-width="5.5" fill="none" stroke-linecap="round"/>
        ${sweat(k.g, 214, b.dBot - 16, b.top)}
      </g>`;
      /* sweat reaching the surface and heat leaving */
      s += `<path d="M226 ${b.top - 12} c4 6 7 9 7 13 a7 7 0 0 1 -14 0 c0 -4 3 -7 7 -13 z" fill="url(#${k.g}droplet)"/>`;
      s += `<path d="M252 ${b.top - 24} c3 4 5 7 5 10 a5 5 0 0 1 -10 0 c0 -3 2 -6 5 -10 z" fill="url(#${k.g}droplet)" opacity=".9"/>`;
      s += `<path d="M64 108 C74 74 106 56 140 52" stroke="url(#${k.g}art)" stroke-width="6" stroke-linecap="round" fill="none"/>
            <path d="M140 52 l-13 -3 M140 52 l-3 12" stroke="${C.arteryHi}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M296 96 C288 122 262 136 232 140" stroke="url(#${k.g}vein)" stroke-width="5" stroke-linecap="round" fill="none"/>
            <path d="M232 140 l12 2 M232 140 l2 -12" stroke="${C.veinHi}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
      return svg('A skin block with sweat forming at the surface and evaporating, a widened dermal artery releasing heat away from the body, and a vein carrying blood back', s);
    },

    /* 05 — three receptor forms, large and clear */
    5: () => {
      const k = kit();
      let s = k.defs;
      /* free nerve endings — a branching yellow tree */
      s += shadow(k.g, 78, 148, 40, 6);
      s += `<path d="M78 56 C74 78 70 92 62 108 M78 56 C78 84 74 104 70 126 M78 56 C84 82 92 100 100 118
                 M78 56 C82 78 96 88 112 96 M78 56 C72 76 56 86 46 96"
              stroke="url(#${k.g}nerve)" stroke-width="6.5" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M78 60 C75 80 71 94 64 108 M78 60 C78 86 75 104 71 122"
              stroke="#FFF0B8" stroke-width="2" fill="none" opacity=".6"/>`;
      /* Pacinian corpuscle — concentric lamellae */
      s += shadow(k.g, 180, 148, 44, 6);
      s += `<g>
        <ellipse cx="180" cy="100" rx="40" ry="34" fill="url(#${k.g}ecr)"/>
        <ellipse cx="180" cy="100" rx="31" ry="26" fill="none" stroke="#F4E2F8" stroke-width="3" opacity=".85"/>
        <ellipse cx="180" cy="100" rx="22" ry="18" fill="none" stroke="#F4E2F8" stroke-width="2.6" opacity=".8"/>
        <ellipse cx="180" cy="100" rx="13" ry="10.5" fill="#EFD9F2" opacity=".95"/>
        <ellipse cx="170" cy="88" rx="10" ry="7" fill="#FFFFFF" opacity=".4" transform="rotate(-16 170 88)"/>
        <path d="M180 134 C182 142 186 148 192 152" stroke="url(#${k.g}nerve)" stroke-width="5" stroke-linecap="round" fill="none"/>
      </g>`;
      /* Meissner corpuscle — a blue-teal capsule */
      s += shadow(k.g, 286, 148, 38, 6);
      s += `<g>
        <rect x="256" y="72" width="60" height="60" rx="26" fill="url(#${k.g}vein)"/>
        <rect x="262" y="78" width="48" height="46" rx="21" fill="none" stroke="#BBD4EE" stroke-width="2.4" opacity=".8"/>
        <rect x="268" y="86" width="30" height="16" rx="8" fill="#FFFFFF" opacity=".33"/>
        <path d="M286 132 C288 140 292 146 298 150" stroke="url(#${k.g}nerve)" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      </g>`;
      return svg('Three sensory endings shown large: branching free nerve endings in yellow, a layered Pacinian corpuscle, and a capsule-shaped Meissner corpuscle with its nerve fibre', s);
    },

    /* 06 — an intact block and an injured block */
    6: () => {
      const k = kit();
      let s = k.defs;
      const draw = (x0, x1, hurt) => {
        const b = block(k.g, { x: x0, x1, top: 46, epi: 15, derm: 42, fat: 20, d: 11, lobes: 4 });
        let out = shadow(k.g, (x0 + x1) / 2 + 4, 142, (x1 - x0) / 2 + 16, 7);
        out += b.markup;
        if (hurt) {
          out += `<path d="M${x0 + 26} ${b.top} C${x0 + 40} ${b.top - 15} ${x1 - 40} ${b.top - 15} ${x1 - 26} ${b.top}
                    C${x1 - 34} ${b.top + 12} ${x0 + 34} ${b.top + 12} ${x0 + 26} ${b.top} Z"
                    fill="url(#${k.g}wound)"/>`;
          out += `<path d="M${x0 + 26} ${b.top} C${x0 + 40} ${b.top - 15} ${x1 - 40} ${b.top - 15} ${x1 - 26} ${b.top}"
                    fill="none" stroke="${C.woundEdge}" stroke-width="2.4" opacity=".8"/>`;
          out += `<path d="M${x0 + 40} ${b.top - 6} C${x0 + 56} ${b.top - 11} ${x1 - 56} ${b.top - 11} ${x1 - 40} ${b.top - 6}"
                    stroke="#7C2530" stroke-width="1.6" fill="none" opacity=".45"/>`;
        } else {
          out += `<path d="M${x0 + 26} ${b.top + 1} H${x1 - 26}" stroke="#FFF4E4" stroke-width="2.4" opacity=".55"/>`;
        }
        out += `<path d="M${x0} ${b.top + 2} H${x1}" stroke="#FFF4E4" stroke-width="1.6" opacity=".3"/>`;
        return out;
      };
      s += draw(28, 168, false);
      s += draw(196, 336, true);
      /* a depth guide between them */
      s += `<path d="M182 46 V123" stroke="#C9977C" stroke-width="1.6" stroke-dasharray="4 4" opacity=".7"/>`;
      s += `<path d="M178 62 h9 M178 109 h9" stroke="${C.woundHi}" stroke-width="2.6" stroke-linecap="round"/>`;
      return svg('Two skin blocks side by side: an intact one, and one with a surface injury, with a dashed depth guide between them', s);
    },

    /* 07 — the restored shield */
    7: () => {
      const k = kit();
      let s = k.defs;
      s += `<ellipse cx="180" cy="84" rx="118" ry="80" fill="url(#${k.g}glow)"/>`;
      /* a faint skin block behind the emblem, tying the challenge to the anatomy */
      const b = block(k.g, { x: 118, x1: 242, top: 96, epi: 13, derm: 32, fat: 16, d: 10, lobes: 4 });
      s += shadow(k.g, 184, 156, 82, 6);
      s += b.markup;
      s += `<clipPath id="${k.g}clip"><rect x="${b.x0}" y="${b.top}" width="${b.x1 - b.x0}" height="${b.bot - b.top}" rx="4"/></clipPath>`;
      s += `<g clip-path="${b.clip}">
        <path d="M126 ${b.dBot - 2} C146 ${b.dBot - 14} 166 ${b.dBot - 12} 186 ${b.dBot}"
          stroke="url(#${k.g}art)" stroke-width="4.6" fill="none" stroke-linecap="round"/>
        ${follicle(k.g, 158, b.top, b.dBot + 4, { gland: true, w: 7 })}
      </g>`;
      /* the shield itself */
      s += `<g>
        <path d="M180 16 C202 32 222 38 244 36 C244 74 222 104 180 122 C138 104 116 74 116 36 C138 38 158 32 180 16 Z"
          fill="url(#${k.g}shield)"/>
        <path d="M180 24 C198 37 214 42 232 41 C231 72 213 97 180 112 C147 97 129 72 128 41 C146 42 162 37 180 24 Z"
          fill="none" stroke="${C.gold}" stroke-width="3" opacity=".9"/>
        <path d="M180 30 C195 41 208 45 223 44" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="3" fill="none"/>
        <path d="M150 52 C160 44 178 42 194 47" stroke="#FFFFFF" stroke-opacity=".28" stroke-width="6" fill="none" stroke-linecap="round"/>
        <ellipse cx="160" cy="60" rx="9" ry="18" fill="#FFFFFF" opacity=".16" transform="rotate(-22 160 60)"/>
      </g>`;
      return svg('A teal shield outlined in gold, glowing softly above a small healthy skin block', s);
    }
  };

  window.inneruIntegMapArt = function (n) {
    const fn = ART[n];
    try { return fn ? fn() : ''; } catch (e) { return ''; }
  };

  /* ------------------------------------------------------------------ attach
     The world page renders its own cards; this only adds the illustration band to
     each one, and to the final-challenge panel. No text, lock, link or handler is
     touched, and nothing happens on any route other than the Integumentary world. */
  function inject() {
    if (location.hash.split('?')[0] !== '#integumentary') return;
    const grid = document.querySelector('.resp-grid');
    if (!grid) return;
    /* scope every card rule to this world only */
    const world = document.querySelector('.integ-world') || grid;
    world.classList.add('integ-map');
    const cards = [...grid.querySelectorAll('.resp-card')];
    if (!cards.length || cards[0].querySelector('.integ-card-art')) return;

    cards.forEach((card, i) => {
      const art = window.inneruIntegMapArt(i + 1);
      if (!art) return;
      const wrap = document.createElement('div');
      wrap.className = 'integ-card-art';
      wrap.innerHTML = art;
      card.insertBefore(wrap, card.firstChild);
    });

    const finale = document.querySelector('.resp-finale');
    if (finale && !finale.querySelector('.integ-card-art')) {
      const art = window.inneruIntegMapArt(7);
      if (art) {
        const wrap = document.createElement('div');
        wrap.className = 'integ-card-art';
        wrap.innerHTML = art;
        finale.classList.add('has-art');
        finale.insertBefore(wrap, finale.firstChild);
      }
    }
  }

  const run = () => setTimeout(inject, 80);
  window.addEventListener('hashchange', run);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
