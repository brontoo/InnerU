/* ============================================================================
   Glossary — tap a term, get a definition (English) and the Arabic term
   ----------------------------------------------------------------------------
   The science on this site is Grade 10, but for a student reading in a second
   language the English is often the harder part. Key terms are underlined in the
   lesson text; tapping one explains it without leaving the page or losing the
   place in the paragraph.

   Terms are marked in the rendered text rather than in six content files: the
   first occurrence of each term on a page is wrapped, never inside a button or a
   link, so no click behaviour anywhere else changes.
   ========================================================================== */
(() => {
  'use strict';

  const DATA = [
  ['Body Shield','epidermis','The outer layer of the skin, where new cells push older ones to the surface.','البشرة',['epidermis']],
  ['Body Shield','dermis','The layer under the epidermis that holds hair follicles, glands, nerves and blood vessels.','الأدمة',['dermis']],
  ['Body Shield','subcutaneous','The fatty layer under the dermis that insulates and cushions the body.','تحت الجلد',['subcutaneous']],
  ['Body Shield','keratin','The tough protein that strengthens hair, nails and the skin surface.','الكيراتين',['keratin']],
  ['Body Shield','melanin','The pigment that gives skin and hair their colour and reduces damage from ultraviolet light.','الميلانين',['melanin']],
  ['Body Shield','collagen','A strong protein in the dermis that keeps skin firm and flexible.','الكولاجين',['collagen']],
  ['Body Shield','sebaceous gland','A gland in the dermis that releases oil to keep skin and hair supple.','الغدة الدهنية',['sebaceous gland','sebaceous glands']],
  ['Body Shield','sweat gland','A coiled gland that releases water and salts, cooling the body as they evaporate.','الغدة العرقية',['sweat gland','sweat glands']],
  ['Body Shield','hair follicle','The pocket in the dermis where a hair grows.','بصيلة الشعر',['hair follicle','hair follicles']],
  ['Body Shield','arrector pili','The tiny muscle that raises a hair and causes goose bumps.','العضلة الناصبة للشعر',['arrector pili']],
  ['Body Shield','homeostasis','Keeping the body\'s internal conditions steady, such as temperature and water balance.','الاتزان الداخلي',['homeostasis']],
  ['Body Shield','ultraviolet','The invisible part of sunlight that can damage DNA in skin cells.','الأشعة فوق البنفسجية',['ultraviolet','UV']],
  ['Framework','axial skeleton','The skull, spine, ribs and sternum: the central axis of the body.','الهيكل المحوري',['axial skeleton']],
  ['Framework','appendicular skeleton','The limbs together with their shoulder and hip girdles.','الهيكل الطرفي',['appendicular skeleton']],
  ['Framework','ligament','Tough tissue that connects bone to bone at a joint.','الرباط',['ligament','ligaments']],
  ['Framework','tendon','Tough tissue that connects a muscle to a bone.','الوتر',['tendon','tendons']],
  ['Framework','cartilage','Smooth, flexible tissue that covers the ends of bones and reduces friction.','الغضروف',['cartilage']],
  ['Framework','marrow','The tissue inside a bone; red marrow makes blood cells.','نخاع العظم',['marrow']],
  ['Framework','osteoblast','A cell that builds new bone.','بانيات العظم',['osteoblast','osteoblasts']],
  ['Framework','osteoclast','A cell that breaks bone down so that it can be remodelled.','ناقضات العظم',['osteoclast','osteoclasts']],
  ['Framework','spongy bone','Bone with a lattice of struts that keeps it strong but light.','العظم الإسفنجي',['spongy bone']],
  ['Framework','compact bone','The dense outer bone that resists bending and twisting.','العظم الكثيف',['compact bone']],
  ['Framework','vertebra','One of the bones that make up the spine.','الفقرة',['vertebra','vertebrae']],
  ['Framework','joint','Where two or more bones meet, often allowing movement.','المفصل',['joint','joints']],
  ['Power','skeletal muscle','Muscle attached to bone that you control voluntarily.','العضلة الهيكلية',['skeletal muscle']],
  ['Power','smooth muscle','Involuntary muscle in the walls of internal organs and blood vessels.','العضلة الملساء',['smooth muscle']],
  ['Power','cardiac muscle','The involuntary muscle of the heart wall.','العضلة القلبية',['cardiac muscle']],
  ['Power','sarcomere','The repeating unit of a muscle fibre, between two Z lines.','القطعة العضلية',['sarcomere','sarcomeres']],
  ['Power','actin','The thin filament that slides during a muscle contraction.','الأكتين',['actin']],
  ['Power','myosin','The thick filament that pulls the thin filaments during contraction.','الميوسين',['myosin']],
  ['Power','motor unit','One motor neurone together with all the muscle fibres it stimulates.','الوحدة الحركية',['motor unit','motor units']],
  ['Power','aerobic','Respiration that uses oxygen and releases energy slowly but for a long time.','هوائي',['aerobic']],
  ['Power','anaerobic','Respiration without enough oxygen; it releases energy quickly and produces lactate.','لاهوائي',['anaerobic']],
  ['Power','lactate','The substance that builds up in muscle during intense exercise and contributes to fatigue.','اللاكتات',['lactate','lactic acid']],
  ['Power','antagonistic pair','Two muscles that work in opposition, such as the biceps and triceps.','زوج عضلي متضاد',['antagonistic pair','antagonistic pairs']],
  ['Oxygen','ventilation','The movement of air into and out of the lungs.','التهوية',['ventilation']],
  ['Oxygen','diaphragm','The dome-shaped muscle under the lungs; contracting it enlarges the chest.','الحجاب الحاجز',['diaphragm']],
  ['Oxygen','alveolus','A tiny air sac in the lung where gas exchange happens.','الحويصل الهوائي',['alveolus','alveoli']],
  ['Oxygen','bronchiole','A narrow airway that leads to the alveoli.','الشعيبة الهوائية',['bronchiole','bronchioles']],
  ['Oxygen','trachea','The windpipe that carries air from the larynx to the bronchi.','القصبة الهوائية',['trachea']],
  ['Oxygen','diffusion','The movement of particles from a higher to a lower concentration.','الانتشار',['diffusion']],
  ['Oxygen','tidal volume','The volume of air moved in one normal breath.','الحجم الشهيقي',['tidal volume']],
  ['Oxygen','emphysema','A disease that destroys alveolar walls and reduces the exchange surface.','النفاخ الرئوي',['emphysema']],
  ['Oxygen','asthma','A condition in which the airways narrow, making breathing difficult.','الربو',['asthma']],
  ['Oxygen','haemoglobin','The red pigment in red blood cells that carries oxygen.','الهيموغلوبين',['haemoglobin','hemoglobin']],
  ['Oxygen','gas exchange','Oxygen entering the blood and carbon dioxide leaving it.','تبادل الغازات',['gas exchange']],
  ['Oxygen','mucus','The sticky fluid that traps dust and germs in the airways.','المخاط',['mucus']],
  ['Transport','artery','A vessel that carries blood away from the heart.','الشريان',['artery','arteries']],
  ['Transport','vein','A vessel that carries blood back to the heart, with valves that stop backflow.','الوريد',['vein','veins']],
  ['Transport','capillary','A tiny vessel, one cell thick, where exchange with the tissues happens.','الشعيرة الدموية',['capillary','capillaries']],
  ['Transport','atrium','An upper chamber of the heart that receives blood.','الأذين',['atrium','atria']],
  ['Transport','ventricle','A lower chamber of the heart that pumps blood out.','البطين',['ventricle','ventricles']],
  ['Transport','platelet','A cell fragment that helps a blood clot to form.','الصفيحة الدموية',['platelet','platelets']],
  ['Transport','plasma','The liquid part of blood that carries dissolved substances.','البلازما',['plasma']],
  ['Transport','fibrin','The protein mesh that holds a blood clot together.','الفايبرين',['fibrin']],
  ['Transport','pulmonary artery','The artery that carries oxygen-poor blood from the heart to the lungs.','الشريان الرئوي',['pulmonary artery']],
  ['Transport','aorta','The main artery that carries oxygen-rich blood from the heart to the body.','الأورطي',['aorta']],
  ['Transport','ABO system','The blood groups A, B, AB and O, based on markers on the red cells.','نظام ABO',['ABO system']],
  ['Transport','stroke volume','The volume of blood pumped out by one heartbeat.','حجم النفضة',['stroke volume']],
  ['Filter','urea','The waste made in the liver from excess amino acids and removed by the kidneys.','اليوريا',['urea']],
  ['Filter','kidney','The organ that filters blood and adjusts the body\'s water and salt balance.','الكلية',['kidney','kidneys']],
  ['Filter','nephron','The filtering unit of the kidney.','النفرون',['nephron','nephrons']],
  ['Filter','glomerulus','The knot of capillaries in the kidney where filtration begins.','الكبة',['glomerulus','glomeruli']],
  ['Filter','tubule','The tube after the glomerulus where useful substances are reabsorbed.','النبيب',['tubule','tubules']],
  ['Filter','reabsorption','Returning useful substances from the tubule back into the blood.','إعادة الامتصاص',['reabsorption']],
  ['Filter','ADH','The hormone that increases water reabsorption, so urine becomes more concentrated.','الهرمون المضاد للإدرار',['ADH','antidiuretic hormone']],
  ['Filter','ureter','The tube that carries urine from a kidney to the bladder.','الحالب',['ureter','ureters']],
  ['Filter','urethra','The tube that carries urine out of the body.','الإحليل',['urethra']],
  ['Filter','urinary bladder','The organ that stores urine until it is released.','المثانة البولية',['urinary bladder','bladder']],
  ['Filter','dialysis','A machine treatment that filters the blood when the kidneys cannot.','الغسيل الكلوي',['dialysis']],
  ['Filter','creatinine','A waste from muscle breakdown that the kidneys excrete.','الكرياتينين',['creatinine']]
  ];

  const KEY = t => t[1].toLowerCase();
  const TERMS = DATA.map(t => {
    const forms = (t[4] && t[4].length ? t[4] : [t[1]]).map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const body = forms.map(f => /y$/.test(f) ? f + '(?:ies)?' : /s$/.test(f) ? f : f + '(?:s|es)?').join('|');
    return { key: KEY(t), label: t[1], definition: t[2], arabic: t[3], category: t[0], rx: new RegExp('\\b(?:' + body + ')\\b', 'i') };
  }).sort((a, b) => b.label.length - a.label.length);

  const CATEGORIES = [];
  TERMS.forEach(t => { if (!CATEGORIES.includes(t.category)) CATEGORIES.push(t.category); });

  let used = new Set();
  const data = () => {
    if (!state.glossary || typeof state.glossary !== 'object') state.glossary = {};
    if (typeof state.glossary.on !== 'boolean') state.glossary.on = true;
    return state.glossary;
  };

  /* ---------------------------------------------------------------- popover */
  let pop = null, openTerm = null, openBlock = null;

  function build() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.className = 'term-pop';
    pop.id = 'term-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Definition');
    pop.hidden = true;
    pop.innerHTML = `<b class="term-pop-word"></b><span class="term-pop-ar" lang="ar" dir="rtl"></span>
      <p class="term-pop-def"></p>
      <div class="term-pop-actions">
        <button class="btn line" type="button" id="term-pop-audio">\u25b6 Listen</button>
        <a class="textlink" href="#glossary">All terms \u2192</a>
        <button class="btn line" type="button" id="term-pop-close">Close</button>
      </div>`;
    document.body.append(pop);
    pop.querySelector('#term-pop-close').onclick = close;
    pop.querySelector('#term-pop-audio').onclick = () => {
      const word = pop.querySelector('.term-pop-word').textContent;
      const def = pop.querySelector('.term-pop-def').textContent;
      if (window.inneruSpeech) window.inneruSpeech.speakText(word + '. ' + def);
    };
    return pop;
  }

  function close() {
    if (openTerm) openTerm.setAttribute('aria-expanded', 'false');
    if (pop) pop.hidden = true;
    openTerm = null;
    openBlock = null;
  }

  function open(span) {
    const entry = TERMS.find(t => t.key === span.dataset.termId);
    if (!entry) return;
    const card = build();
    card.querySelector('.term-pop-word').textContent = entry.label;
    card.querySelector('.term-pop-ar').textContent = entry.arabic;
    card.querySelector('.term-pop-def').textContent = entry.definition;
    card.querySelector('#term-pop-audio').hidden = !window.inneruSpeech;
    card.hidden = false;
    const r = span.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    card.style.width = width + 'px';
    let left = Math.min(Math.max(12, r.left + r.width / 2 - width / 2), window.innerWidth - width - 12);
    const height = card.offsetHeight || 170;
    let top = r.bottom + 10;
    if (top + height > window.innerHeight - 12) top = Math.max(12, r.top - height - 10);
    card.style.left = left + 'px';
    card.style.top = top + 'px';
    if (openTerm && openTerm !== span) openTerm.setAttribute('aria-expanded', 'false');
    openTerm = span;
    openBlock = span.closest('p, li, dd, blockquote, figcaption, td');
    span.setAttribute('aria-expanded', 'true');
  }

  /* ---------------------------------------------------------------- marking */
  function unmarkAll() {
    document.querySelectorAll('#main .term').forEach(span => {
      const parent = span.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(span.textContent), span);
      parent.normalize();
    });
    used = new Set();
    close();
  }

  const BLOCKS = '#main p, #main li, #main dd, #main blockquote, #main figcaption, #main td';

  function makeSpan(entry, hit) {
    const span = document.createElement('span');
    span.className = 'term';
    span.setAttribute('role', 'button');
    span.tabIndex = 0;
    span.setAttribute('aria-expanded', 'false');
    span.dataset.termId = entry.key;
    span.textContent = hit;
    return span;
  }

  /* Collect the first occurrence of every still-unused term inside one text node,
     drop overlaps (longest wins), then rewrite the node right to left. Scanning
     only the text after a match used to hide shorter terms that came before it. */
  function markNode(node) {
    const text = node.nodeValue;
    const chosen = [];
    TERMS.forEach(entry => {
      if (used.has(entry.key)) return;
      const rx = new RegExp(entry.rx.source, 'gi');
      const m = rx.exec(text);
      if (!m) return;
      chosen.push({ start: m.index, end: m.index + m[0].length, entry, hit: m[0] });
    });
    if (!chosen.length) return;
    chosen.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const final = [];
    chosen.forEach(h => {
      if (final.some(c => h.start < c.end && c.start < h.end)) return;
      final.push(h);
      used.add(h.entry.key);
    });
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    final.forEach(h => {
      if (h.start > cursor) fragment.append(document.createTextNode(text.slice(cursor, h.start)));
      fragment.append(makeSpan(h.entry, h.hit));
      cursor = h.end;
    });
    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
    if (node.parentNode) node.parentNode.replaceChild(fragment, node);
  }

  function scan() {
    if (!data().on) return;
    if (window.inneruSpeech && window.inneruSpeech.isSpeaking()) return;   /* offsets must stay stable */
    document.querySelectorAll(BLOCKS).forEach(el => {
      if (el.dataset.terms) return;
      if (el.closest('.term, .topbar, nav, footer, aside, .teacher-table, [data-no-terms]')) return;
      if (el.querySelector('script, style')) return;
      el.dataset.terms = '1';
      const nodes = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.nodeValue.trim()) continue;
        if (n.parentElement && n.parentElement.closest('a, button, input, select, label, .term, [data-no-terms]')) continue;
        nodes.push(n);
      }
      nodes.forEach(markNode);
    });
  }

  /* ---------------------------------------------------------------- events */
  document.addEventListener('click', e => {
    const span = e.target.closest ? e.target.closest('.term') : null;
    if (span) { e.preventDefault(); open(span); return; }
    if (pop && !pop.hidden && !e.target.closest('#term-pop')) close();
  });
  document.addEventListener('keydown', e => {
    const span = e.target.closest ? e.target.closest('.term') : null;
    if (span && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(span); return; }
    if (e.key === 'Escape') {
      if (openTerm) { const t = openTerm; close(); t.focus(); }
    }
  });
  window.addEventListener('scroll', () => { if (pop && !pop.hidden) close(); }, { passive: true });

  /* ---------------------------------------------------------------- glossary page */
  function glossaryPage() {
    const groups = CATEGORIES.map(cat => {
      const rows = TERMS.filter(t => t.category === cat).sort((a, b) => a.label.localeCompare(b.label));
      return `<section class="panel glossary-group"><div class="eyebrow">${esc(cat.toUpperCase())}</div>
        <dl class="glossary-list">${rows.map(t => `<dt>${esc(t.label)} <span lang="ar" dir="rtl">${esc(t.arabic)}</span></dt><dd>${esc(t.definition)}</dd>`).join('')}</dl></section>`;
    }).join('');
    layout(`<div class="glossary-page" data-no-terms>
      <div class="eyebrow">REFERENCE</div><h1>Glossary</h1>
      <p class="note">${TERMS.length} key terms from the six systems, with the Arabic term beside each one. Every underlined word in the lessons opens the same definitions.</p>
      ${groups}</div>`, 'dashboard');
  }

  /* ---------------------------------------------------------------- controls + wrapping */
  function tools() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return null;
    let box = topbar.querySelector('#reader-tools');
    if (!box) {
      box = document.createElement('div');
      box.className = 'reader-tools';
      box.id = 'reader-tools';
      topbar.append(box);
    }
    return box;
  }

  function renderToggle() {
    const box = tools();
    if (!box) return;
    let btn = box.querySelector('#glossary-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'glossary-toggle';
      btn.className = 'reader-btn';
      btn.onclick = () => {
        const d = data();
        d.on = !d.on;
        save();
        if (d.on) { scan(); } else { unmarkAll(); }
        renderToggle();
      };
      box.prepend(btn);
    }
    const on = data().on;
    btn.textContent = on ? 'A\u0332 Terms on' : 'Terms off';
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? 'Key terms are underlined: tap one for its definition' : 'Term highlights are hidden';
  }

  const previousLayout = layout;
  layout = function (...args) {
    previousLayout(...args);
    used = new Set();
    scan();
    renderToggle();
  };

  const previousRoute = route;
  window.removeEventListener('hashchange', previousRoute);
  route = function () {
    if (location.hash.slice(1) === 'glossary') {
      glossaryPage();
      window.scrollTo(0, 0);
      document.title = 'InnerU \u00b7 Glossary';
      return;
    }
    close();
    previousRoute();
  };
  window.addEventListener('hashchange', route);

  window.inneruGlossary = { terms: TERMS.length, scan, unmarkAll, isOn: () => data().on };
  route();
})();
