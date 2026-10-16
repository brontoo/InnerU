/* Original action + anatomy scenes for the six everyday system connections. */
(() => {
  'use strict';
  const scenes = [
    {
      file: '01-stairs', title: 'Climbing stairs', tag: 'THE STEP SQUAD',
      teaser: 'Meet the muscle-and-bone team behind every step.',
      alt: 'A student climbs school stairs beside an enlarged knee study showing quadriceps, patella, tendon and lower-leg bones.',
      systems: ['Muscular', 'Skeletal', 'Respiratory', 'Circulatory'],
      connection: 'Hip and knee extensors help lift your body onto the next step. Muscles pull through tendons on bones that act as levers. Breathing and circulation help supply the working muscles.',
      parts: [
        ['Quadriceps', 'The quadriceps on the front of the thigh extend the knee. The gluteal muscles also help extend the hip as you climb.', 75, 23],
        ['Patella', 'The kneecap sits within the quadriceps tendon. It helps the knee extensors act with a greater moment arm.', 82, 42],
        ['Patellar ligament', 'Below the patella, this strong band attaches to the tibial tuberosity. It continues the pull of the quadriceps to the tibia.', 80, 55]
      ],
      clue: 'Muscles pull; bones provide levers. A step takes a team.'
    },
    {
      file: '02-hold-bag', title: 'Holding a school bag', tag: 'THE STEADY CREW',
      teaser: 'The bag stays still. Your muscles stay busy.',
      alt: 'A student holds a school bag with a bent elbow beside a detailed model of the biceps, distal tendon, humerus, radius and ulna.',
      systems: ['Muscular', 'Skeletal', 'Nervous'],
      connection: 'Holding a load still requires muscle tension. With the elbow held at a fixed angle, the elbow flexors can contract approximately isometrically while bones and joints support the load.',
      parts: [
        ['Biceps brachii', 'The biceps and other elbow flexors help balance the load. During a steady hold, they produce force with little change in overall muscle length.', 68, 29],
        ['Distal biceps tendon', 'This tendon transmits biceps tension to the radius. A tendon joins muscle to bone; it does not actively contract.', 73, 53],
        ['Radius & ulna', 'These are the two forearm bones. The radius receives the biceps insertion; the ulna forms the main hinge with the humerus.', 82, 64]
      ],
      clue: 'No visible movement does not mean no muscle work.'
    },
    {
      file: '03-ankle', title: 'A twisted ankle', tag: 'THE ANKLE ALERT',
      teaser: 'One little wobble. A big anatomy clue.',
      alt: 'A student notices an inward ankle wobble beside a lateral ankle model showing tibia, fibula, talus, calcaneus and stabilizing ligaments.',
      systems: ['Skeletal', 'Muscular', 'Nervous'],
      connection: 'Ligaments connect bone to bone and help stabilize the ankle. An excessive inward roll can strain the lateral ligaments. Sensory signals and muscle responses also help you balance.',
      parts: [
        ['Ankle bones', 'The tibia and fibula form a mortise around the talus. The calcaneus, or heel bone, lies below the talus.', 65, 34],
        ['Anterior talofibular ligament', 'This short ligament connects the fibula to the talus. It is commonly stressed during an inversion sprain, especially with the foot pointed downward.', 66, 40],
        ['Calcaneofibular ligament', 'This band connects the fibula to the calcaneus. It helps resist excessive inversion of the hindfoot.', 59, 47]
      ],
      clue: 'Ligaments stabilize joints. Tendons transmit a muscle’s pull.'
    },
    {
      file: '04-lift-bag', title: 'Lifting a school bag', tag: 'THE LIFT CREW',
      teaser: 'Follow the pull from a muscle to a moving bone.',
      alt: 'A student lifts a school satchel beside a detailed bent-elbow study of biceps, triceps and their tendons attaching to forearm bones.',
      systems: ['Muscular', 'Skeletal', 'Nervous'],
      connection: 'As you bend the elbow to lift the bag, elbow flexors such as biceps brachii and brachialis produce the pull. Tendons transfer force to the bones; the opposing triceps can lengthen while still helping control the movement.',
      parts: [
        ['Biceps brachii', 'Biceps assists elbow flexion and turns the palm upward. The brachialis is another important elbow flexor.', 66, 31],
        ['Tendon attachment', 'The distal biceps tendon attaches to the radial tuberosity. This attachment transfers muscle force to the radius.', 73, 57],
        ['Triceps brachii', 'Triceps lies behind the humerus and attaches to the ulnar olecranon. It extends the elbow; its activation during a lift depends on control and load.', 51, 37]
      ],
      clue: 'A bending elbow has a pulling team and an opposing team.'
    },
    {
      file: '05-running', title: 'Running', tag: 'THE OXYGEN RELAY',
      teaser: 'Air to blood to muscle. Pass the oxygen along.',
      alt: 'A student runs beside a magnified systems study with human lungs, a heart, circulation routes and a skeletal muscle bundle.',
      systems: ['Respiratory', 'Circulatory', 'Muscular', 'Skeletal'],
      connection: 'The lungs exchange gases with blood. The heart and blood vessels deliver oxygen to working muscles, where it supports aerobic ATP production. Muscles use ATP to generate force on the skeleton.',
      parts: [
        ['Lungs', 'Oxygen diffuses from alveolar air into pulmonary capillary blood. Carbon dioxide diffuses in the opposite direction.', 71, 25],
        ['Heart', 'The right side pumps blood toward the lungs; the left side pumps toward the body. The two circuits connect in series.', 53, 62],
        ['Skeletal muscle', 'Muscle fibers use ATP for contraction. Oxygen supports aerobic ATP production during sustained activity; contraction also has other energy pathways.', 83, 71]
      ],
      clue: 'The lungs exchange. The heart transports. The muscles use the delivery.'
    },
    {
      file: '06-cooling', title: 'Moving in hot weather', tag: 'THE COOLING CREW',
      teaser: 'Meet your skin’s built-in cooling team.',
      alt: 'A student walks in warm weather beside a skin cutaway showing a coiled sweat gland, surface duct, dermal vessels and fat tissue.',
      systems: ['Integumentary', 'Circulatory', 'Muscular', 'Excretory'],
      connection: 'Working muscles release heat. Skin blood flow helps move heat toward the surface, and evaporating sweat removes heat. Water is lost in sweat, while the kidneys help regulate the body’s water balance.',
      parts: [
        ['Eccrine sweat gland', 'The coiled secretory portion produces sweat. A duct carries it to a pore on the skin surface.', 62, 59],
        ['Dermal blood vessels', 'In warm conditions, increased skin blood flow can help transfer heat from deeper tissues toward the body surface.', 49, 42],
        ['Surface evaporation', 'Evaporation, rather than simply producing sweat, removes heat from the skin. Sweat that drips off provides less evaporative cooling.', 63, 18]
      ],
      clue: 'The sweat has to evaporate to provide its main cooling effect.'
    }
  ];
  const asset = i => 'assets/connection-scenes/' + scenes[i].file + '.webp';
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';
  const lens = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7 10h6m-3-3v6"/></svg>';
  let disposeCurrent = () => {};

  function cardMarkup(i) {
    const s = scenes[i];
    return `<summary><div class="cx-art"><img src="${asset(i)}" width="1536" height="1024" loading="lazy" decoding="async" alt="${s.alt}"><span class="cx-scene-number" aria-hidden="true">0${i+1}</span><span class="cx-discovery-spark" aria-hidden="true">✧</span></div><div class="cx-card-copy"><span class="cx-kicker">${s.tag}</span><h3>${s.title}</h3><p>${s.teaser}</p><span class="cx-reveal"><span class="cx-when-closed">Discover the connection</span><span class="cx-when-open">Connection revealed</span><span class="cx-plus" aria-hidden="true">+</span></span></div></summary><div class="cx-discovery"><div class="cx-system-chips" aria-label="Connected systems">${s.systems.map(x=>`<span>${x}</span>`).join('')}</div><p>${s.connection}</p><button class="cx-lens-button" type="button" data-cx-open="${i}">${lens} Open anatomy lens ${arrow}</button></div>`;
  }

  function dialogMarkup() {
    return `<dialog class="cx-dialog" aria-labelledby="cx-dialog-title"><header><div><span class="cx-kicker">THE EVERYDAY ANATOMY LENS</span><h2 id="cx-dialog-title"></h2></div><button type="button" class="cx-close" data-cx-close autofocus aria-label="Close anatomy lens">Close ×</button></header><div class="cx-lens-layout"><div class="cx-visual-column"><div class="cx-viewport"><div class="cx-canvas"><img width="1536" height="1024" decoding="async" alt=""><span class="cx-focus-ring" aria-hidden="true"><b>1</b></span></div></div><div class="cx-image-tools"><span>Original anatomical teaching study</span><button type="button" data-cx-zoom aria-pressed="false">${lens} Magnify anatomy</button></div><p class="cx-scale-note">Anatomy is enlarged and simplified for learning. The separate studies are not to scale.</p></div><section class="cx-lens-copy" aria-label="Anatomy discoveries"><span class="cx-kicker">LOOK CLOSER / CHOOSE A STRUCTURE</span><div class="cx-parts" role="group" aria-label="Anatomical structures"></div><div class="cx-part-info" role="status" aria-live="polite"><span class="cx-part-count"></span><h3></h3><p></p></div><div class="cx-takeaway"><span class="cx-kicker">YOUR SCIENCE CLUE</span><p></p></div></section></div><footer><button type="button" data-cx-prev>← Previous scene</button><span data-cx-count></span><button type="button" data-cx-next>Next scene →</button></footer></dialog>`;
  }

  function mount() {
    disposeCurrent();
    const main = document.querySelector('main.connections-exhibit');
    if (!main || main.classList.contains('cx-connections')) return;
    const cards = [...main.querySelectorAll('.scenario-card'), ...main.querySelectorAll('.mq-connection')];
    if (cards.length !== 6) return;
    main.classList.add('cx-connections');
    cards.forEach((card, i) => {
      card.classList.add('cx-card');
      card.dataset.cxCard = String(i);
      card.innerHTML = cardMarkup(i);
    });
    main.querySelectorAll('.scenario-section,.mq-connection-section').forEach(section => section.classList.add('cx-section'));
    const title = main.querySelector('.scenario-section .sectiontitle');
    title.insertAdjacentHTML('beforeend', '<div class="cx-gallery-tools"><span>6 EVERYDAY ANATOMY STORIES</span><button type="button" data-cx-motion-toggle aria-pressed="false">Pause visual motion</button></div>');
    main.insertAdjacentHTML('beforeend', dialogMarkup());

    const controller = new AbortController(), events = {signal: controller.signal};
    const dialog = main.querySelector('.cx-dialog'), media = matchMedia('(prefers-reduced-motion: reduce)');
    const parts = dialog.querySelector('.cx-parts'), info = dialog.querySelector('.cx-part-info');
    let active = 0, selected = 0, opener = null, paused = false, zoomed = false, dead = false;

    function motion() {
      const reduced = media.matches || document.body.classList.contains('motionoff');
      main.dataset.cxMotion = reduced || paused ? 'off' : 'on';
      const button = main.querySelector('[data-cx-motion-toggle]');
      button.disabled = reduced;
      button.textContent = reduced ? 'Reduced motion' : paused ? 'Play visual motion' : 'Pause visual motion';
      button.setAttribute('aria-pressed', String(reduced || paused));
    }

    function selectPart(i) {
      selected = i;
      const [name, text, x, y] = scenes[active].parts[i];
      dialog.dataset.cxPart = String(i);
      dialog.style.setProperty('--cx-x', x + '%');
      dialog.style.setProperty('--cx-y', y + '%');
      parts.querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-pressed', String(index === i)));
      info.querySelector('.cx-part-count').textContent = 'ANATOMY DISCOVERY / 0' + (i + 1);
      info.querySelector('h3').textContent = name;
      info.querySelector('p').textContent = text;
      dialog.querySelector('.cx-focus-ring b').textContent = String(i + 1);
    }

    function setZoom(on) {
      zoomed = on;
      dialog.classList.toggle('cx-is-zoomed', on);
      const button = dialog.querySelector('[data-cx-zoom]');
      button.setAttribute('aria-pressed', String(on));
      button.innerHTML = lens + (on ? 'Show full scene' : 'Magnify anatomy');
    }

    function showScene(i) {
      active = i;
      const s = scenes[i], img = dialog.querySelector('.cx-canvas img');
      dialog.dataset.cxScene = String(i);
      dialog.querySelector('h2').textContent = s.title;
      img.src = asset(i);
      img.alt = s.alt;
      parts.innerHTML = s.parts.map(([name], n) => `<button type="button" data-cx-inspect="${n}" aria-pressed="${n === 0}"><b>0${n+1}</b>${name}</button>`).join('');
      dialog.querySelector('.cx-takeaway p').textContent = s.clue;
      dialog.querySelector('[data-cx-count]').textContent = String(i+1).padStart(2, '0') + ' / 06';
      dialog.querySelector('[data-cx-prev]').disabled = i === 0;
      dialog.querySelector('[data-cx-next]').disabled = i === 5;
      selectPart(0);
      setZoom(false);
    }

    main.addEventListener('click', event => {
      const open = event.target.closest('[data-cx-open]');
      if (open) {
        opener = open;
        showScene(+open.dataset.cxOpen);
        dialog.showModal();
        main.classList.add('cx-modal-open');
        return;
      }
      if (event.target.closest('[data-cx-close]')) { dialog.close(); return; }
      const part = event.target.closest('[data-cx-inspect]');
      if (part) { selectPart(+part.dataset.cxInspect); return; }
      if (event.target.closest('[data-cx-prev]') && active > 0) { showScene(active-1); return; }
      if (event.target.closest('[data-cx-next]') && active < 5) { showScene(active+1); return; }
      if (event.target.closest('[data-cx-zoom]')) { setZoom(!zoomed); return; }
      if (event.target.closest('[data-cx-motion-toggle]')) { paused = !paused; motion(); }
    }, events);

    parts.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (selected + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      selectPart(next);
      parts.children[next].focus();
    }, events);
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const buttons = [...dialog.querySelectorAll('button:not([disabled])')], first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }, events);
    dialog.addEventListener('close', () => {
      main.classList.remove('cx-modal-open');
      if (opener?.isConnected) opener.focus({preventScroll: true});
    }, events);
    document.addEventListener('visibilitychange', () => main.classList.toggle('cx-page-hidden', document.hidden), events);
    media.addEventListener('change', motion, events);
    const prefs = new MutationObserver(motion);
    prefs.observe(document.body, {attributes: true, attributeFilter: ['class']});
    const visible = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('cx-in-view', entry.isIntersecting)), {rootMargin: '50px'});
    cards.forEach(card => visible.observe(card));
    const removal = new MutationObserver(() => { if (!main.isConnected) dispose(); });
    removal.observe(document.getElementById('app'), {childList: true});
    function dispose() {
      if (dead) return;
      dead = true;
      controller.abort();
      prefs.disconnect();
      visible.disconnect();
      removal.disconnect();
      if (dialog.open) dialog.close();
    }
    disposeCurrent = dispose;
    motion();
  }

  const previousConnections = connections;
  connections = function () { previousConnections(); mount(); };
  if (document.querySelector('main.connections-exhibit')) mount();
})();
