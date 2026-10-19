/* Ordered route module; original activity implementations are unchanged. */
(()=>{
"use strict";
const titles = [
    "Waste relay",
    "Kidney cartographer",
    "The filtration gate",
    "Reabsorption rescue",
    "Balance lab",
    "Kidney care detective",
  ];
const lessons = [
    {
      page: 40,
      goal: "Connect each excretory organ to its waste and trace urine to the outside.",
      terms: "excretion · lungs · skin · kidneys · ureter · bladder · urethra",
      text: "Excretion removes wastes made by metabolism. Lungs exhale carbon dioxide and water vapour; skin releases water and salts in sweat; kidneys remove dissolved wastes and adjust water, salts and acid–base balance. The liver makes urea from excess amino acids; kidneys excrete it. This is different from removing undigested food.",
      clue: "Urine: kidney → ureter → bladder → urethra → outside.",
      checks: [
        [
          "Which organ primarily releases carbon dioxide?",
          ["Kidneys", "Lungs", "Bladder"],
          1,
          "The lungs exhale carbon dioxide produced during cellular respiration.",
        ],
        [
          "After leaving a kidney, urine enters the…",
          ["Ureter", "Renal artery", "Urethra"],
          0,
          "A ureter carries urine from a kidney to the bladder.",
        ],
        [
          "Which tube carries urine out from the bladder?",
          ["Renal vein", "Ureter", "Urethra"],
          2,
          "The urethra is the final exit; a ureter joins kidney to bladder.",
        ],
      ],
    },
    {
      page: 41,
      goal: "Locate kidney structures and connect each region to its job.",
      terms:
        "renal cortex · renal medulla · renal calyces · renal pelvis · renal artery · renal vein",
      text: "Kidneys are bean-shaped organs containing about one million nephrons each. The outer renal cortex contains glomeruli and convoluted tubules. The inner medulla contains pyramids with loops of Henle and collecting ducts. Urine drains from the pyramid tips through collecting spaces called calyces to the renal pelvis, then to a ureter. Blood uses the renal artery and vein: a different route from urine.",
      clue: "Cortex outside; medulla inside; pelvis collects. The cortex and medulla are regions, not a chain of tubes.",
      checks: [
        [
          "The outer kidney region is the…",
          ["Renal pelvis", "Renal cortex", "Ureter"],
          1,
          "The cortex is the outer tissue of the kidney.",
        ],
        [
          "Where does urine collect before entering the ureter?",
          ["Renal pelvis", "Renal artery", "Glomerulus"],
          0,
          "The renal pelvis funnels urine toward the ureter.",
        ],
        [
          "Which vessel brings blood to the kidney?",
          ["Renal vein", "Urethra", "Renal artery"],
          2,
          "The renal artery brings blood; the renal vein carries it away.",
        ],
      ],
    },
    {
      page: 41,
      goal: "Predict which substances cross the filtration barrier and explain why.",
      terms: "nephron · glomerulus · Bowman’s capsule · filtration · filtrate",
      text: "In each nephron, blood flows through the glomerulus, a tuft of capillaries inside Bowman’s capsule. Blood pressure pushes water and small dissolved substances, including glucose, salts and urea, across a selective filtration barrier into the capsule. Blood cells and most large proteins normally stay in the blood. Filtrate is the collected fluid, not final urine.",
      clue: "Filtration moves fluid from blood into the capsule. Being filtered does not mean a substance must leave in urine.",
      checks: [
        [
          "Which structure receives the first filtrate?",
          ["Bladder", "Bowman’s capsule", "Ureter"],
          1,
          "Bowman’s capsule receives filtrate from the glomerulus.",
        ],
        [
          "Which normally remains in blood?",
          ["Red blood cells", "Water", "Urea"],
          0,
          "Blood cells cannot normally cross the healthy filtration barrier.",
        ],
        [
          "Is filtrate already final urine?",
          [
            "Yes, nothing changes afterward",
            "It is made in the bladder",
            "No, useful material is still reabsorbed",
          ],
          2,
          "Tubules change the filtrate through reabsorption and secretion.",
        ],
      ],
    },
    {
      page: 42,
      goal: "Distinguish filtration, reabsorption and secretion, then account for water.",
      terms:
        "renal tubule · loop of Henle · collecting duct · reabsorption · secretion",
      text: "Filtrate flows through the proximal convoluted tubule, loop of Henle and distal tubule to a collecting duct. Useful glucose, amino acids, minerals and much water return to nearby capillaries by reabsorption. Secretion moves selected substances from blood into the tubule. The remaining fluid becomes urine. Together, both kidneys form about 180 L of filtrate per day in an adult, but only about 1.5 L leaves as urine.",
      clue: "Filtration: blood → capsule. Reabsorption: tubule → blood. Secretion: blood → tubule.",
      checks: [
        [
          "Glucose in filtrate is normally…",
          ["Returned to blood", "Stored in the bladder as sugar", "Exhaled"],
          0,
          "Nearly all filtered glucose is normally reabsorbed.",
        ],
        [
          "Where does urine flow after the collecting ducts and calyces?",
          ["Renal pelvis", "Glomerulus", "Renal artery"],
          0,
          "The collecting route leads to the pelvis, ureter and bladder.",
        ],
        [
          "The loop of Henle helps the kidney…",
          ["Breathe", "Conserve water", "Pump blood"],
          1,
          "It supports a concentration gradient that helps the kidney conserve water.",
        ],
      ],
    },
    {
      page: 42,
      goal: "Explain exercise responses, water conservation and acid–base regulation.",
      terms: "homeostasis · ADH · water balance · hydrogen ions · bicarbonate",
      text: "The textbook asks: can exercise affect the excretory system? Exercise increases carbon dioxide production and sweating. Lungs exhale more carbon dioxide; sweat removes water and salts. When water is scarce, more ADH can increase water reabsorption in the collecting ducts, producing a smaller volume of concentrated urine. Kidneys also regulate acid–base balance by excreting hydrogen ions and handling bicarbonate.",
      clue: "Responses change with the situation. Normal blood pH is about 7.35–7.45; kidney regulation acts over time.",
      checks: [
        [
          "As breathing increases during exercise, which organ releases more CO₂?",
          ["Skin", "Lungs", "Bladder"],
          1,
          "The lungs release carbon dioxide; the skin releases sweat.",
        ],
        [
          "To conserve water, the collecting ducts can…",
          [
            "Reabsorb more water",
            "Stop filtering forever",
            "Turn urea into oxygen",
          ],
          0,
          "Higher ADH increases their water permeability.",
        ],
        [
          "Maintaining suitable internal conditions is called…",
          ["Filtration", "Evaporation", "Homeostasis"],
          2,
          "Regulating water, salts and acid–base balance contributes to homeostasis.",
        ],
      ],
    },
    {
      page: "42–44",
      goal: "Connect disorder mechanisms, causes and treatments using classroom evidence.",
      terms:
        "infection · nephritis · stones · blockage · polycystic kidney disease · cancer · dialysis · transplant",
      text: "Kidney infections may spread from the bladder. Nephritis is inflammation that can affect glomeruli. Stones are crystallized mineral deposits; they may obstruct urine flow. Some blockages are present at birth. Inherited polycystic kidney disease produces fluid-filled cysts; kidney cancer involves uncontrolled cell growth. Diabetes and high blood pressure can also damage kidney function. Dialysis removes wastes from blood outside the body; a transplant supplies a donor kidney, with medication needed to limit rejection.",
      clue: "Match the evidence to a mechanism. These are simplified learning cases, not a tool for diagnosis.",
      checks: [
        [
          "A kidney stone is…",
          ["A hard mineral deposit", "A normal nephron", "A red blood cell"],
          0,
          "Crystallized minerals can form stones and obstruct the urinary tract.",
        ],
        [
          "Nephritis involves…",
          ["More alveoli", "Kidney inflammation", "Extra ureters"],
          1,
          "Inflammation can damage glomeruli and impair filtration.",
        ],
        [
          "Dialysis helps by…",
          [
            "Replacing the lungs",
            "Creating new nephrons",
            "Removing wastes from blood",
          ],
          2,
          "A dialyzer removes wastes and excess fluid but does not create nephrons.",
        ],
      ],
    },
  ];
const finalStages = [
    [
      "Match the waste: carbon dioxide, sweat, urea.",
      ["Lungs → skin → kidneys", "Bladder → bones → lungs"],
      0,
      "The organs remove different metabolic wastes.",
    ],
    [
      "Which is the complete urine route from the capsule?",
      [
        "Capsule → tubules → collecting duct → calyces → pelvis → ureter → bladder → urethra",
        "Capsule → renal vein → bladder → ureter",
      ],
      0,
      "Filtrate is modified in the tubules before urine leaves the kidney.",
    ],
    [
      "Which kidney region contains most glomeruli?",
      ["Medulla", "Cortex"],
      1,
      "Renal corpuscles are in the cortex.",
    ],
    [
      "Which stays in the blood at a healthy glomerulus?",
      ["Blood cells and most large proteins", "All water and urea"],
      0,
      "The filtration barrier retains cells and most large proteins.",
    ],
    [
      "How does reabsorption differ from filtration?",
      [
        "Tubule → blood, rather than blood → capsule",
        "Both mean urine → bladder",
      ],
      0,
      "They have different directions and functions.",
    ],
    [
      "180 L filtered minus 178.5 L returned gives…",
      ["1.5 L urine per day", "178.5 L urine per day"],
      0,
      "Most filtered water returns to blood. This is an approximate adult example.",
    ],
    [
      "After heavy sweating, a higher ADH level generally means…",
      ["Less, more concentrated urine", "More, very dilute urine"],
      0,
      "Higher ADH helps conserve water in the collecting ducts.",
    ],
    [
      "Why can untreated kidney failure be dangerous?",
      [
        "Wastes, fluid and electrolyte disturbances accumulate",
        "The bladder stops making oxygen",
      ],
      0,
      "Dialysis or transplantation may be needed to support kidney function.",
    ],
  ];
lessons.forEach((l) => (l.checks = l.checks.map(mixQ)));
finalStages.forEach((q, i) => (finalStages[i] = mixQ(q)));
let preview = false,
    sessionSteps = new Set();
function progress() {
    if (!state.excretory || typeof state.excretory !== "object")
      state.excretory = {};
    const p = state.excretory;
    p.done = Array.isArray(p.done) ? p.done : [];
    p.steps = p.steps && typeof p.steps === "object" ? p.steps : {};
    p.weak = Array.isArray(p.weak) ? p.weak : [];
    return p;
  }
const done = (id) =>
    preview ? sessionSteps.has(id) : !!progress().steps[id];
function step(id, xp) {
    if (done(id)) return;
    if (preview) {
      sessionSteps.add(id);
      return;
    }
    progress().steps[id] = true;
    save();
    reward("exc-" + id, xp);
  }
const percent = () =>
    Math.round(
      ((progress().done.filter((n) => n >= 1 && n <= 6).length +
        Number(!!progress().mastery)) /
        7) *
        100,
    );
const link = (path, mode = preview) =>
    "#excretory" + path + (mode ? "?preview=1" : "");
const shuffled = (a) =>
    a.map((v, i) => ({ v, i, r: Math.random() })).sort((a, b) => a.r - b.r);
function banner(path) {
    return `<div class="exc-mode-banner ${preview ? "is-preview" : ""}" role="status"><div><b>${preview ? "Preview mode · every activity is open" : "Expedition mode · earn your Balance Key"}</b><span>${preview ? "Try any activity in any order. Your progress, XP and System Keys stay unchanged." : "Complete a challenge and its three checks to secure each fragment."}</span></div><a class="btn line" href="${link(preview ? "" : path, !preview)}">${preview ? "Return to expedition" : "Preview all activities"}</a></div>`;
  }
function explorerMarkup() {
    return `<section class="exc-explorer" aria-labelledby="exc-explorer-title" id="exc-explorer"><div class="exc-section-heading"><div><span class="eyebrow">ANATOMY STUDIO</span><h2 id="exc-explorer-title">Look closer. Follow the flow.</h2><p>Explore anatomical structure, from the urinary organs to a magnified nephron.</p></div><span class="exc-pill">ROTATE · SELECT · DISCOVER</span></div><div class="exc-explorer-tabs" role="tablist" aria-label="Anatomy views">${[
      ["organs", "01", "Urinary organs"],
      ["kidney", "02", "Kidney cutaway"],
      ["nephron", "03", "Nephron"],
      ["flow", "04", "Urine flow"],
    ]
      .map(
        ([id, n, t]) =>
          `<button type="button" role="tab" id="exc-tab-${id}" data-explorer-tab="${id}" aria-controls="exc-anatomy-panel" aria-selected="${id === "organs"}" tabindex="${id === "organs" ? 0 : -1}"><small>${n}</small>${t}</button>`,
      )
      .join(
        "",
      )}</div><div id="exc-anatomy-panel" role="tabpanel" aria-labelledby="exc-tab-organs" class="exc-anatomy-panel"><div><div class="exc-explorer-stage" tabindex="0" role="group" aria-label="Rotatable anatomy model. Drag or use left and right arrows to rotate; plus and minus zoom."><img class="exc-model-fallback" hidden src="assets/excretory-kidney-cutaway.png" alt="Kidney cutaway with cortex, medullary pyramids, calyces, pelvis, renal vessels and ureter."></div><div class="exc-model-controls"><button type="button" data-model-action="spin" aria-pressed="false">Auto rotate</button><button type="button" data-model-action="focus" disabled>Focus structure</button><button type="button" data-model-action="reset">Reset view</button><button type="button" data-model-action="flow" aria-pressed="true" hidden>Pause flow</button></div><p class="exc-model-status" role="status">Loading anatomy studio…</p></div><aside><span class="eyebrow">EXAMINE A STRUCTURE</span><div class="exc-structures" role="group" aria-label="Anatomical structures"></div><div class="exc-structure-info" aria-live="polite"></div><p class="exc-scale-note"></p><div class="exc-legend"><span><i class="artery"></i>Blood entering</span><span><i class="vein"></i>Blood returning</span><span><i class="urine"></i>Urine / filtrate</span></div></aside></div></section>`;
  }
function mountExplorer() {
    const root = document.getElementById("exc-explorer");
    if (root)
      import("./excretory-explorer.js?v=guided-ar-1")
        .then((m) => {
          if (root.isConnected) m.mountExcretoryExplorer(root);
        })
        .catch(() => {
          if (!root.isConnected) return;
          root.querySelector(".exc-model-fallback").hidden = false;
          root.querySelector(".exc-model-status").textContent =
            "The 3D studio could not load. The illustration and lesson activities are still available.";
        });
  }
function landing() {
    const p = progress();
    layout(
      `<div class="exc-world exc-expedition">${banner("")}<section class="exc-hero"><div><span class="eyebrow">WORLD 06 / THE EXCRETORY SYSTEM</span><h1>Small filters.<br><em>Big balance.</em></h1><p>Become the body’s balance keeper. Trace a waste, map a kidney, rescue useful substances and solve the mystery of homeostasis.</p><div class="exc-hero-actions"><a class="btn" href="${link("/mission/" + (preview ? 1 : Math.min(6, p.done.length + 1)))}">${preview ? "Explore mission 01" : p.done.length ? "Continue expedition" : "Start the expedition"} <span aria-hidden="true">→</span></a><button class="exc-hero-secondary" type="button" id="exc-browse-missions">Browse the missions ↓</button></div><div class="exc-hero-stats"><span><b>06</b>MISSIONS</span><span><b>18</b>SCIENCE CHECKS</span><span><b>${p.done.length}/6</b>FRAGMENTS EARNED</span></div></div><figure class="exc-hero-art"><img src="assets/excretory-kidney-cutaway.png" alt="Scientific kidney cutaway: outer cortex, medullary pyramids and central calyces draining to the pelvis and ureter, with the renal artery and vein at the hilum." width="1536" height="1024"><figcaption>Kidney architecture · original scientific illustration</figcaption></figure></section>${explorerMarkup()}<div class="exc-section-heading" id="exc-mission-map"><div><span class="eyebrow">YOUR MISSION BOARD</span><h2>Six discoveries. One balanced body.</h2><p>${preview ? "Every mission and the final challenge can be opened now." : "Follow the route to earn six fragments, or preview any activity freely."}</p></div><div class="exc-map-progress"><span>${p.done.length}/6 complete</span><div class="bar"><i style="width:${(p.done.length / 6) * 100}%"></i></div></div></div><div class="exc-mission-grid">${titles
        .map((title, i) => {
          const complete = p.done.includes(i + 1),
            locked = i > 0 && !p.done.includes(i);
          return `<article class="exc-mission-card ${complete ? "is-complete" : ""}"><div class="exc-card-top"><span>MISSION 0${i + 1}</span><span>${complete ? "✓ SECURED" : preview ? "OPEN PREVIEW" : locked ? "UP NEXT" : "READY"}</span></div>${art.card(i + 1)}<h3>${title}</h3><p>${lessons[i].goal}</p><div class="exc-card-meta"><span>${["SORT + TRACE", "LOCATE + MATCH", "FILTER + EXPLAIN", "RESCUE + CALCULATE", "SIMULATE + INVESTIGATE", "CASE FILES + TREATMENTS"][i]}</span><span>1 fragment</span></div><div class="exc-card-actions">${preview || !locked ? `<a class="btn secondary" href="${link("/mission/" + (i + 1))}">${preview ? "Open activity" : complete ? "Replay mission" : "Start mission"} →</a>` : '<span class="exc-locked">Finish mission 0' + i + " to earn this fragment</span>"}${!preview ? `<a class="textlink" href="${link("/mission/" + (i + 1), true)}">Preview freely ↗</a>` : ""}</div></article>`;
        })
        .join(
          "",
        )}</div><section class="exc-final-card"><div class="exc-final-symbol" aria-hidden="true">◈</div><div><span class="eyebrow">FINAL CHALLENGE / THE BALANCE KEY</span><h2>Keep the body in balance.</h2><p>Connect all six discoveries in eight applied decisions.</p></div><div>${preview || p.done.length >= 6 ? `<a class="btn" href="${link("/mastery")}">${preview ? "Preview final challenge" : "Accept the challenge"} →</a>` : '<span class="exc-locked">Secure all six fragments to earn the Key</span>'}${!preview ? `<a class="textlink" href="${link("/mastery", true)}">Preview final challenge ↗</a>` : ""}</div></section><p class="exc-source-note">Lesson reference: UAE Inspire Science Biology, Grade 10 General, pp. 40–44. Figures and 3D meshes are original simplified teaching illustrations.</p></div>`,
    );
    document.getElementById("exc-browse-missions").onclick = () =>
      document.getElementById("exc-mission-map").scrollIntoView({
        behavior: motionReduced() ? "instant" : "smooth",
        block: "start",
      });
    mountExplorer();
    art.mount(document.querySelector(".exc-world"));
  }
const art = window.InneruExcretoryArt;
function illustration(n) { return art.picture(n); }
function labIllustration(n) { return art.study(n); }
const LABS = {
    1: {
      kind: "sort",
      title: "Send the waste home",
      intro:
        "Select a cargo tile, then its destination. Match all six to activate the waste relay.",
      bins: ["Lungs", "Skin", "Kidneys"],
      items: [
        ["Carbon dioxide", 0, "Lungs remove carbon dioxide in exhaled air."],
        ["Water vapour", 0, "Exhaled air carries water vapour."],
        [
          "Water and salts in sweat",
          1,
          "Sweat glands release water and salts; evaporation helps cooling.",
        ],
        ["Urea", 2, "The liver makes urea; the kidneys remove it from blood."],
        [
          "Excess salts",
          2,
          "Kidneys adjust the amount of salts leaving in urine.",
        ],
        ["Excess water", 2, "Kidneys can remove excess water in urine."],
      ],
    },
    3: {
      kind: "sort",
      title: "Guard the filtration gate",
      intro:
        "You control the healthy glomerular filter. Pass small substances into the capsule and keep cells and most large proteins in blood.",
      bins: ["Into Bowman’s capsule", "Stays in blood"],
      items: [
        ["Water", 0, "Water is filtered; most is reabsorbed later."],
        ["Glucose", 0, "Glucose enters filtrate, then is normally reabsorbed."],
        [
          "Urea",
          0,
          "Small urea molecules enter filtrate. Some urea is reabsorbed, but a net amount leaves in urine.",
        ],
        [
          "Salts",
          0,
          "Small dissolved ions enter filtrate and are adjusted later.",
        ],
        [
          "Large proteins",
          1,
          "Most large plasma proteins stay behind the healthy barrier.",
        ],
        ["Blood cells", 1, "Blood cells remain inside the capillaries."],
      ],
    },
    4: {
      kind: "sort",
      title: "Rescue the useful cargo",
      intro:
        "Recover useful substances into capillaries. Keep the net waste and excess in the urine route.",
      bins: ["Returned to blood", "Net removal in urine"],
      items: [
        [
          "Filtered glucose",
          0,
          "Nearly all filtered glucose is normally returned to blood.",
        ],
        [
          "Most filtered water",
          0,
          "Most filtered water is returned. In the adult example, 178.5 of 180 L returns each day.",
        ],
        ["Amino acids", 0, "Amino acids are useful and normally reabsorbed."],
        [
          "Net urea waste",
          1,
          "A net amount of urea is excreted, even though some urea is reabsorbed.",
        ],
        ["Excess salts", 1, "Salts not needed by the body leave in urine."],
        [
          "Creatinine waste",
          1,
          "Creatinine is mainly filtered and excreted, with some tubular secretion.",
        ],
      ],
    },
  };
const KIDNEY_TARGETS = [
    [
      "Renal cortex",
      "Find the outer tissue where glomeruli begin filtration.",
      "Outer tissue; filtration begins here.",
    ],
    [
      "Renal medulla",
      "Find the inner region with the renal pyramids.",
      "Inner pyramids contain loops and collecting ducts.",
    ],
    [
      "Renal pelvis",
      "Find the collecting funnel that joins the ureter.",
      "The pelvis collects urine from the calyces.",
    ],
    [
      "Renal artery",
      "Find the vessel that brings blood into the kidney.",
      "The renal artery supplies blood, nutrients and wastes.",
    ],
    [
      "Renal vein",
      "Find the vessel that carries blood away.",
      "The renal vein returns blood to circulation.",
    ],
    [
      "Ureter",
      "Find the tube carrying urine toward the bladder.",
      "Urine leaves the pelvis through a ureter.",
    ],
  ];
const CASES = [
    {
      name: "Upstream infection",
      evidence:
        "A bacterial bladder infection spreads upward. Kidney tissue becomes infected, with fever and back pain in the textbook example.",
      answer: "Infection",
      options: ["Infection", "Kidney stone", "Polycystic kidney disease"],
      why: "Bacteria can spread from the bladder to the kidneys. Clinicians may use antibiotics for a bacterial infection.",
    },
    {
      name: "A damaged filter",
      evidence:
        "Inflamed glomeruli allow abnormal amounts of protein and blood cells into urine.",
      answer: "Nephritis",
      options: ["Nephritis", "Kidney stone", "Urinary tract blockage"],
      why: "Glomerular inflammation can damage the filtration barrier. Blood or protein in urine requires medical assessment; it has multiple possible causes.",
    },
    {
      name: "Crystals in the route",
      evidence:
        "A hard mineral deposit forms and may obstruct urine flow through a ureter.",
      answer: "Kidney stone",
      options: ["Kidney stone", "Nephritis", "Kidney cancer"],
      why: "Stones form from crystallized minerals. Depending on the case, treatment may include breaking up or removing the stone.",
    },
    {
      name: "A narrowed passage",
      evidence:
        "A malformation present at birth obstructs normal urine flow. Untreated obstruction can damage the kidney.",
      answer: "Urinary tract blockage",
      options: [
        "Urinary tract blockage",
        "Infection",
        "Polycystic kidney disease",
      ],
      why: "A structural obstruction can prevent normal drainage. Kidney stones can also cause blockage, but this case describes a congenital malformation.",
    },
    {
      name: "An inherited pattern",
      evidence:
        "An inherited condition produces many fluid-filled cysts, which can reduce kidney function.",
      answer: "Polycystic kidney disease",
      options: ["Polycystic kidney disease", "Kidney cancer", "Infection"],
      why: "Polycystic kidney disease is inherited. Cysts can enlarge the kidneys and reduce their function.",
    },
    {
      name: "Uncontrolled growth",
      evidence:
        "Cells lining kidney tubules multiply without normal control. A mass may develop and spread.",
      answer: "Kidney cancer",
      options: ["Kidney cancer", "Nephritis", "Kidney stone"],
      why: "Cancer involves uncontrolled cell growth. It differs from cysts, inflammation and a mineral deposit.",
    },
  ];
function challengeHead(title, intro, tag = "INTERACTIVE LAB") {
    return `<div class="exc-challenge-heading"><div><span class="eyebrow">${tag}</span><h2>${title}</h2></div><span class="exc-pill">${preview ? "TRY IT FREELY" : "+20 XP"}</span></div><p class="exc-prompt">${intro}</p>`;
  }
function lab(n) {
    const d = LABS[n];
    if (d)
      return `<section class="panel exc-lab" id="exc-main-lab">${challengeHead(d.title, d.intro)}<div class="exc-game-status"><span id="exc-lab-step">0 / ${d.items.length} cargo placed</span><span id="exc-combo">Build your accuracy streak</span></div><div class="exc-lab-diagram">${labIllustration(n)}</div><div class="exc-chips" role="group" aria-label="Cargo to sort">${shuffled(
        d.items,
      )
        .map(
          ({ v, i }) =>
            `<button type="button" class="exc-chip" data-exc-item="${i}" aria-pressed="false">${esc(v[0])}</button>`,
        )
        .join(
          "",
        )}</div><div class="exc-bins">${d.bins.map((bin, i) => `<button type="button" class="exc-bin" data-exc-bin="${i}"><span class="exc-bin-symbol" aria-hidden="true">${i === 0 ? "↗" : "↓"}</span><strong>${bin}</strong><span class="exc-bin-list" id="exc-bin-${i}"></span></button>`).join("")}</div><p class="exc-hint">Drag a cargo tile to its destination, or tap a tile then a destination. Keyboard: Tab, then Enter.</p><div id="exc-lab-feedback" class="exc-lab-feedback" role="status" aria-live="polite">Your first cargo is waiting.</div>${art.process(n)}<button type="button" class="exc-replay" data-replay>Reset this challenge ↻</button></section>${bonus(n)}`;
    if (n === 2)
      return `<section class="panel exc-lab" id="exc-main-lab">${challengeHead("Map the kidney", "Read the clue, then select the matching labeled structure. Each correct location reveals its job.")}<div class="exc-game-status"><span id="exc-lab-step">0 / 6 structures located</span></div>${art.study(2)}<p class="exc-active-clue" id="exc-map-clue">${KIDNEY_TARGETS[0][1]}</p><div class="exc-map-labels">${shuffled(
        KIDNEY_TARGETS,
      )
        .map(
          ({ v, i }) =>
            `<button type="button" data-kidney-label="${i}">${v[0]}</button>`,
        )
        .join(
          "",
        )}</div><div id="exc-lab-feedback" class="exc-lab-feedback" role="status" aria-live="polite">Select a structure to reveal its function.</div><button type="button" class="exc-replay" data-replay>Reset this challenge ↻</button></section>`;
    if (n === 5) return balanceLab();
    return `<section class="panel exc-lab" id="exc-main-lab">${challengeHead("Open the case files", "Use the evidence to identify the mechanism. Visit the six case files in any order; solve each to finish the investigation.")}<div class="exc-game-status"><span id="exc-lab-step">0 / 6 cases explained</span></div>${art.study(6)}<div class="exc-case-tabs" role="group" aria-label="Case files">${CASES.map((c, i) => `<button type="button" data-case-tab="${i}" aria-pressed="${i === 0}">File 0${i + 1}</button>`).join("")}</div><div id="exc-case-content"></div><div id="exc-lab-feedback" class="exc-lab-feedback" role="status" aria-live="polite">Choose a case, study its evidence, then explain the mechanism.</div><button type="button" class="exc-replay" data-replay>Reset this challenge ↻</button></section>${bonus(6)}`;
  }
function bonus(n) {
    if (n === 1)
      return `<section class="panel exc-bonus"><span class="eyebrow">SIDE QUEST / TRACE THE EXIT</span><h2>Build the urine route</h2><p>Choose each structure in order, from the kidney to outside the body.</p>${art.routeFigure()}<ol class="exc-seq" id="exc-seq"></ol><div class="exc-chips">${shuffled(
        ["Kidney", "Ureter", "Urinary bladder", "Urethra", "Outside"],
      )
        .map(
          ({ v, i }) =>
            `<button type="button" data-exc-step="${i}">${v}</button>`,
        )
        .join(
          "",
        )}</div><p id="exc-route-feedback" role="status"></p><button class="exc-replay" type="button" id="exc-route-reset">Clear the route ↻</button></section>`;
    if (n === 4)
      return `<section class="panel exc-bonus"><span class="eyebrow">SIDE QUEST / THE WATER AUDIT</span><h2>Where did 180 litres go?</h2><p>An approximate adult example: both kidneys form <b>180 L of filtrate</b> in a day. <b>178.5 L</b> of the water returns to blood.</p><div class="exc-water-bar"><span style="width:99.17%">Water returned to blood</span><i aria-label="Remaining water forms urine"></i></div><form id="exc-audit"><label for="exc-audit-answer">180 − 178.5 = how many litres of urine?</label><div class="exc-answer-row"><input id="exc-audit-answer" type="number" min="0" step="0.1" required placeholder="Litres"><button class="btn secondary" type="submit">Check the balance</button></div><p id="exc-audit-feedback" role="status"></p></form><details><summary>Compare filtration, reabsorption and secretion</summary>${illustration(4)}<p>Filtration: blood → capsule. Reabsorption: tubule → blood. Secretion: blood → tubule. All contribute to the final urine.</p></details></section>`;
    return `<section class="panel exc-bonus"><span class="eyebrow">SIDE QUEST / TREATMENT STUDIO</span><h2>Two approaches. Different jobs.</h2><div class="exc-treatment-cards"><article><figure class="ea-treatment-figure">${art.picture(7)}<button type="button" data-ea-open="7">Inspect the dialyzer ⤢</button></figure><h3>Dialysis</h3><p>Blood passes through a dialyzer, where a membrane separates it from dialysis fluid. Wastes and excess fluid are removed; blood returns to the body.</p><small>The textbook example describes sessions of about 3–4 hours, three times weekly; real schedules vary.</small></article><article><figure class="ea-treatment-figure">${art.picture(2)}<button type="button" data-ea-open="2">Inspect the donor organ ⤢</button></figure><h3>Kidney transplant</h3><p>A healthy donor kidney provides kidney function. The recipient needs anti-rejection medicines and ongoing follow-up.</p></article></div><fieldset class="exc-treatment-question"><legend>Which treatment uses a filtering device outside the body?</legend><button type="button" data-treatment="dialysis">Dialysis</button><button type="button" data-treatment="transplant">Transplant</button></fieldset><p id="exc-treatment-feedback" role="status"></p><details><summary>Think deeper: inherited or acquired?</summary><p>Polycystic kidney disease is inherited. Infection and effects of diabetes or high blood pressure are acquired examples. Blockages can have different causes. Explain how one example could reduce filtration or drainage.</p></details></section>`;
  }
const BALANCE_CASES = [
    {
      id: "hot",
      title: "After a hot run",
      text: "Heavy sweating has removed water and salts. Choose a response that conserves water.",
      target: "high",
      why: "Higher ADH makes the collecting ducts more permeable to water. More water returns to blood, so urine volume is smaller and concentration is higher.",
    },
    {
      id: "drink",
      title: "After excess water intake",
      text: "A healthy, hydrated body has more water than it needs. Choose the response that removes the excess.",
      target: "low",
      why: "Lower ADH reduces water reabsorption in the collecting ducts. More, dilute urine can remove extra water.",
    },
    {
      id: "rest",
      title: "A balanced rest day",
      text: "Water intake and losses are balanced. Compare the moderate setting with the two extremes.",
      target: "moderate",
      why: "The kidneys adjust to the body’s needs. This simplified model shows relative changes, not a measured hormone dose or a fluid prescription.",
    },
  ];
function balanceLab() {
    return `<section class="panel exc-lab" id="exc-main-lab">${challengeHead("Control the water response", "Change ADH, predict the kidney’s response, then test your setting in all three situations.")}<div class="exc-game-status"><span id="exc-lab-step">0 / 3 situations balanced</span></div><div class="exc-case-tabs" role="group" aria-label="Water balance situations">${BALANCE_CASES.map((c, i) => `<button type="button" data-balance-case="${i}" aria-pressed="${i === 0}">${c.title}</button>`).join("")}</div>${art.study(5)}<p class="exc-active-clue" id="exc-balance-clue">${BALANCE_CASES[0].text}</p><label class="exc-slider-label" for="adh-level">Relative ADH signal <b id="adh-value">Moderate</b></label><input type="range" id="adh-level" min="0" max="100" value="50" step="5" aria-describedby="exc-adh-note"><div class="exc-slider-scale"><span>Low</span><span>Moderate</span><span>High</span></div>${art.process(5)}<div class="exc-sim-results" role="status"><div><span>Water returned</span><b id="adh-reabsorb">Moderate</b><meter id="exc-water-meter" min="0" max="100" value="50">50</meter></div><div><span>Urine volume</span><b id="adh-volume">Intermediate</b></div><div><span>Concentration</span><b id="adh-conc">Intermediate</b></div></div><p id="exc-adh-note" class="exc-science-note">A qualitative comparison. The slider is not a hormone dose; outputs are not clinical measurements.</p><button type="button" class="btn secondary" id="exc-test-balance">Test this response →</button><div id="exc-lab-feedback" class="exc-lab-feedback" role="status" aria-live="polite">Move the slider, then test your response.</div><button type="button" class="exc-replay" data-replay>Reset this challenge ↻</button></section><section class="panel exc-bonus"><span class="eyebrow">SIDE QUEST / THINK LIKE A SCIENTIST</span><h2>Exercise, acidity and a week of urine</h2><div class="exc-ph-task">${art.acidBaseFigure()}<p>If the blood becomes too acidic, which kidney response helps?</p><button type="button" data-ph="wrong">Retain more hydrogen ions</button><button type="button" data-ph="correct">Excrete hydrogen ions; conserve bicarbonate</button><p id="exc-ph-feedback" role="status"></p></div><form id="exc-weekly"><label for="exc-weekly-answer">The lesson’s adult average is 1.5 L urine each day. How much in 7 days?</label><div class="exc-answer-row"><input id="exc-weekly-answer" type="number" min="0" step="0.1" required placeholder="Litres per week"><button class="btn secondary">Calculate</button></div><p id="exc-weekly-feedback" role="status"></p></form><details><summary>Plan an exercise investigation</summary><p>Compare breathing rate before and after the same light activity, and describe changes in sweating. Keep duration, conditions and measurement method consistent. Predict the kidney response using the lesson. Do not infer kidney function from a short classroom observation.</p><label for="exc-investigation">Your prediction and the evidence you would collect</label><textarea id="exc-investigation" rows="3" placeholder="After activity, I predict… I would measure…"></textarea><button type="button" class="exc-replay" id="exc-journal-save">${preview ? "Keep note for this preview" : "Save investigation note"}</button><p id="exc-journal-status" role="status"></p></details></section>`;
  }
function wireLab(n, finish) {
    const feedback = document.getElementById("exc-lab-feedback"),
      count = document.getElementById("exc-lab-step");
    const complete = () => {
      step(n + "-lab", 20);
      count.textContent = preview
        ? "✓ Challenge completed in preview"
        : "✓ DISCOVERY SAVED";
      finish();
    };
    const d = LABS[n];
    if (d) {
      let selected = null,
        placed = 0,
        streak = 0;
      const chips = [...document.querySelectorAll("[data-exc-item]")];
      chips.forEach(
        (b) =>
          (b.onclick = () => {
            selected = +b.dataset.excItem;
            chips.forEach((c) =>
              c.setAttribute("aria-pressed", String(c === b)),
            );
            feedback.textContent =
              "Cargo selected: " +
              d.items[selected][0] +
              ". Choose its destination.";
          }),
      );
      document.querySelectorAll("[data-exc-bin]").forEach(
        (bin) =>
          (bin.onclick = () => {
            if (selected === null) {
              feedback.textContent = "Select a cargo tile first.";
              return;
            }
            const item = d.items[selected];
            if (item[1] !== +bin.dataset.excBin) {
              streak = 0;
              feedback.textContent = "Try another route. " + item[2];
              document.getElementById("exc-combo").textContent =
                "New attempt · no points lost";
              return;
            }
            const chip = chips.find((c) => +c.dataset.excItem === selected);
            chip.disabled = true;
            chip.setAttribute("aria-pressed", "false");
            const entry = document.createElement("span");
            entry.className = "exc-cargo-placed";
            entry.textContent = item[0];
            bin.querySelector(".exc-bin-list").append(entry);
            feedback.textContent = "✓ " + item[2];
            placed++;
            streak++;
            selected = null;
            count.textContent =
              placed + " / " + d.items.length + " cargo placed";
            document.getElementById("exc-combo").textContent =
              streak > 1 ? streak + " correct in a row" : "Good start";
            if (placed === d.items.length) complete();
          }),
      );
      chips.forEach((chip) => {
        chip.draggable = true;
        chip.ondragstart = (event) => {
          if (chip.disabled) {
            event.preventDefault();
            return;
          }
          chip.click();
          event.dataTransfer.setData("text/plain", chip.dataset.excItem);
          event.dataTransfer.effectAllowed = "move";
        };
      });
      document.querySelectorAll("[data-exc-bin]").forEach((bin) => {
        bin.ondragover = (event) => {
          if (selected === null) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          bin.classList.add("is-drop-target");
        };
        bin.ondragleave = () => bin.classList.remove("is-drop-target");
        bin.ondrop = (event) => {
          event.preventDefault();
          bin.classList.remove("is-drop-target");
          if (
            selected !== null &&
            event.dataTransfer.getData("text/plain") === String(selected)
          )
            bin.click();
        };
      });
    }
    if (n === 2) {
      let target = 0;
      document.querySelectorAll("[data-kidney-label]").forEach(
        (b) =>
          (b.onclick = () => {
            if (+b.dataset.kidneyLabel !== target) {
              feedback.textContent =
                "Not this structure. " + KIDNEY_TARGETS[target][1];
              return;
            }
            feedback.textContent =
              "✓ " +
              KIDNEY_TARGETS[target][0] +
              ": " +
              KIDNEY_TARGETS[target][2];
            b.disabled = true;
            b.classList.add("is-solved");
            target++;
            count.textContent = target + " / 6 structures located";
            document.getElementById("exc-map-clue").textContent =
              target < 6
                ? KIDNEY_TARGETS[target][1]
                : "All structures mapped. Compare them in the 3D studio.";
            if (target === 6) complete();
          }),
      );
    }
    if (n === 5) {
      let current = 0;
      const solved = new Set(),
        slider = document.getElementById("adh-level");
      const level = () =>
        +slider.value < 35 ? "low" : +slider.value > 65 ? "high" : "moderate";
      const update = () => {
        const v = level();
        document.getElementById("adh-value").textContent =
          v[0].toUpperCase() + v.slice(1);
        document.getElementById("adh-reabsorb").textContent =
          v === "high" ? "More" : v === "low" ? "Less" : "Moderate";
        document.getElementById("adh-volume").textContent =
          v === "high" ? "Smaller" : v === "low" ? "Larger" : "Intermediate";
        document.getElementById("adh-conc").textContent =
          v === "high"
            ? "More concentrated"
            : v === "low"
              ? "More dilute"
              : "Intermediate";
        document.getElementById("exc-water-meter").value = slider.value;
      };
      slider.oninput = update;
      document.querySelectorAll("[data-balance-case]").forEach(
        (b) =>
          (b.onclick = () => {
            current = +b.dataset.balanceCase;
            document
              .querySelectorAll("[data-balance-case]")
              .forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
            document.getElementById("exc-balance-clue").textContent =
              BALANCE_CASES[current].text;
            feedback.textContent =
              "Compare the outputs, then test the response.";
          }),
      );
      document.getElementById("exc-test-balance").onclick = () => {
        const c = BALANCE_CASES[current];
        if (level() !== c.target) {
          feedback.textContent =
            "Adjust and try again. " +
            (c.target === "high"
              ? "This situation calls for conserving water."
              : c.target === "low"
                ? "This situation calls for removing excess water."
                : "Use the moderate signal for the balanced situation.");
          return;
        }
        solved.add(current);
        feedback.textContent = "✓ " + c.why;
        document
          .querySelector('[data-balance-case="' + current + '"]')
          .classList.add("is-solved");
        count.textContent = solved.size + " / 3 situations balanced";
        if (solved.size === 3) complete();
      };
      update();
    }
    if (n === 6) {
      let current = 0;
      const solved = new Set();
      function show() {
        const c = CASES[current];
        document.getElementById("exc-case-content").innerHTML =
          `<div class="exc-case-file">${art.caseFigure(current)}<span class="eyebrow">EVIDENCE FILE 0${current + 1}</span><h3>${c.name}</h3><p>${c.evidence}</p><div class="exc-case-options">${shuffled(
            c.options,
          )
            .map(
              ({ v }) =>
                `<button type="button" data-case-answer="${esc(v)}" ${solved.has(current) ? "disabled" : ""}>${v}</button>`,
            )
            .join(
              "",
            )}</div>${solved.has(current) ? '<p class="exc-case-explanation">✓ ' + c.why + "</p>" : ""}${preview ? "<details><summary>Preview the explanation</summary><p>" + c.why + "</p></details>" : ""}</div>`;
        document.querySelectorAll("[data-case-answer]").forEach(
          (b) =>
            (b.onclick = () => {
              if (b.dataset.caseAnswer !== c.answer) {
                feedback.textContent = "Re-read the evidence: " + c.evidence;
                return;
              }
              solved.add(current);
              feedback.textContent = "✓ " + c.why;
              document
                .querySelector('[data-case-tab="' + current + '"]')
                .classList.add("is-solved");
              count.textContent = solved.size + " / 6 cases explained";
              show();
              if (solved.size === 6) complete();
            }),
        );
      }
      document.querySelectorAll("[data-case-tab]").forEach(
        (b) =>
          (b.onclick = () => {
            current = +b.dataset.caseTab;
            document
              .querySelectorAll("[data-case-tab]")
              .forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
            feedback.textContent = "Study this case and match its mechanism.";
            show();
          }),
      );
      show();
    }
    document
      .querySelectorAll("[data-replay]")
      .forEach((b) => (b.onclick = () => mission(n)));
    wireBonus(n);
  }
function wireBonus(n) {
    if (n === 1) {
      const route = [
        "Kidney",
        "Ureter",
        "Urinary bladder",
        "Urethra",
        "Outside",
      ];
      let chosen = 0;
      document.querySelectorAll("[data-exc-step]").forEach(
        (b) =>
          (b.onclick = () => {
            const feedback = document.getElementById("exc-route-feedback");
            if (+b.dataset.excStep !== chosen) {
              feedback.textContent =
                "Think about what comes after " +
                (chosen ? route[chosen - 1] : "the starting organ") +
                ".";
              return;
            }
            b.disabled = true;
            const li = document.createElement("li");
            li.textContent = route[chosen];
            document.getElementById("exc-seq").append(li);
            chosen++;
            feedback.textContent =
              chosen === 5
                ? "✓ The exit route is complete: urine, not blood, uses these structures."
                : "✓ Now choose the next structure.";
            if (chosen === 5) step("1-route", 10);
          }),
      );
      document.getElementById("exc-route-reset").onclick = () => {
        chosen = 0;
        document.getElementById("exc-seq").replaceChildren();
        document
          .querySelectorAll("[data-exc-step]")
          .forEach((b) => (b.disabled = false));
        document.getElementById("exc-route-feedback").textContent =
          "Start with the kidney.";
      };
    }
    const calculation = (form, input, output, answer, id, why) => {
      document.getElementById(form).onsubmit = (e) => {
        e.preventDefault();
        const value = document.getElementById(input).value;
        if (value === "" || Math.abs(Number(value) - answer) > 0.001) {
          document.getElementById(output).textContent = "Try again. " + why;
          return;
        }
        document.getElementById(output).textContent =
          "✓ " + answer + " L. " + why;
        step(id, 10);
      };
    };
    if (n === 4)
      calculation(
        "exc-audit",
        "exc-audit-answer",
        "exc-audit-feedback",
        1.5,
        "4-audit",
        "180 − 178.5 = 1.5. Most filtered water is reabsorbed.",
      );
    if (n === 5) {
      calculation(
        "exc-weekly",
        "exc-weekly-answer",
        "exc-weekly-feedback",
        10.5,
        "5-weekly",
        "1.5 × 7 = 10.5. Daily urine volume varies with the person and conditions.",
      );
      document.querySelectorAll("[data-ph]").forEach(
        (b) =>
          (b.onclick = () => {
            document.getElementById("exc-ph-feedback").textContent =
              b.dataset.ph === "correct"
                ? "✓ Excreting H⁺ and conserving bicarbonate helps counter excess acidity. Bicarbonate supports buffering; reabsorbing it does not make blood more acidic."
                : "Retaining hydrogen ions would worsen excess acidity. Try the other response.";
            window.InneruEvidence?.record({id:'excretory:5:ph',system:'excretory',mission:5,kind:'activity',title:'Acid-base response',prompt:'Which kidney response helps when blood becomes too acidic?',answer:(window.InneruLocale?InneruLocale.source(b):b.textContent).trim(),expected:(window.InneruLocale?InneruLocale.source(document.querySelector('[data-ph="correct"]')):document.querySelector('[data-ph="correct"]').textContent).trim(),correct:b.dataset.ph==='correct'});
            if (b.dataset.ph === "correct") step("5-ph", 10);
          }),
      );
      document.getElementById("exc-investigation").value = preview
        ? ""
        : progress().investigation || "";
      document.getElementById("exc-journal-save").onclick = () => {
        const note = document
          .getElementById("exc-investigation")
          .value.trim()
          .slice(0, 2000);
        if (!preview) {
          window.InneruEvidence?.record({id:'excretory:investigation-note',system:'excretory',mission:5,kind:'written',title:'Exercise investigation plan',prompt:'Predict the exercise response and describe the evidence you would collect.',answer:note,correct:null,feedback:'A student investigation note. Teacher review required.'});
          progress().investigation = note;
          save();
        }
        document.getElementById("exc-journal-status").textContent = preview
          ? "Note kept on this preview page only."
          : "Investigation note saved on this device.";
      };
    }
    if (n === 6)
      document.querySelectorAll("[data-treatment]").forEach(
        (b) =>
          (b.onclick = () => {
            document.getElementById("exc-treatment-feedback").textContent =
              b.dataset.treatment === "dialysis"
                ? "✓ A dialyzer removes wastes and excess fluid from blood. A transplant supplies a donor kidney."
                : "A transplant places a healthy donor kidney in the body. Try the external filtering treatment.";
            window.InneruEvidence?.record({id:'excretory:6:treatment',system:'excretory',mission:6,kind:'activity',title:'Kidney treatment',prompt:'Choose the external filtering treatment.',answer:(window.InneruLocale?InneruLocale.source(b):b.textContent).trim(),expected:(window.InneruLocale?InneruLocale.source(document.querySelector('[data-treatment="dialysis"]')):document.querySelector('[data-treatment="dialysis"]').textContent).trim(),correct:b.dataset.treatment==='dialysis'});
            if (b.dataset.treatment === "dialysis") step("6-treatment", 10);
          }),
      );
  }
function questionMarkup(q, i, n, final = false) {
    const id = final ? "final-" + i : n + "-q" + i;
    return `<div class="resp-question" ${final ? "data-exc-final" : "data-exc-question"}="${i}"><span class="eyebrow">${final ? "DECISION " + (i + 1) + " / 8" : ["RECALL", "APPLY", "REASON"][i]}</span><h3>${q[0]}</h3>${art.question(n,i,final)}<div class="resp-choices">${q[1].map((a, j) => `<button type="button" data-choice="${j}" ${done(id) ? "disabled" : ""}>${a}</button>`).join("")}</div><div class="resp-feedback" role="status" aria-live="polite">${done(id) ? "✓ " + q[3] : ""}</div>${preview ? `<details class="exc-preview-answer"><summary>Preview answer and explanation</summary><p><b>${q[1][q[2]]}</b> — ${q[3]}</p></details>` : ""}</div>`;
  }
function wireQuestions(questions, n, finish, final = false) {
    document
      .querySelectorAll(final ? "[data-exc-final]" : "[data-exc-question]")
      .forEach((el) => {
        const i = Number(final ? el.dataset.excFinal : el.dataset.excQuestion),
          q = questions[i],
          id = final ? "final-" + i : n + "-q" + i;
        el.querySelectorAll("[data-choice]").forEach(
          (b) =>
            (b.onclick = () => {
              const good = +b.dataset.choice === q[2];
              window.InneruEvidence?.record({id:'excretory:'+id,system:'excretory',mission:final?0:n,kind:final?'final':'check',title:final?'Final decision '+(i+1):'Science check '+(i+1),prompt:q[0],answer:(window.InneruLocale?InneruLocale.source(b):b.textContent).trim(),expected:q[1][q[2]],correct:good,feedback:q[3]});
              el.querySelector(".resp-feedback").textContent = good
                ? "✓ " + q[3]
                : "Try again. " + q[3];
              el.classList.toggle("resp-wrong", !good);
              if (!preview && !final) {
                const p = progress();
                p.weak = good
                  ? p.weak.filter((x) => x !== id)
                  : [...new Set([...p.weak, id])];
                save();
              }
              if (good) {
                b.classList.add("resp-correct");
                el.querySelectorAll("[data-choice]").forEach(
                  (c) => (c.disabled = true),
                );
                step(id, final ? 8 : 7);
                finish();
              }
            }),
        );
      });
  }
function mission(n) {
    const p = progress();
    if (!Number.isInteger(n) || n < 1 || n > 6) {
      location.hash = link("");
      return;
    }
    if (!preview && n > 1 && !p.done.includes(n - 1)) {
      layout(
        `<div class="exc-world">${banner("/mission/" + n)}<section class="panel"><span class="eyebrow">MISSION 0${n}</span><h1>Explore it now, or earn your way here.</h1><p>This expedition mission opens after mission 0${n - 1}. Preview mode lets you see and try everything immediately.</p><a class="btn" href="${link("/mission/" + n, true)}">Preview this activity →</a> <a class="textlink" href="${link("")}">Back to mission board</a></section></div>`,
      );
      return;
    }
    const d = lessons[n - 1];
    layout(
      `<div class="exc-world exc-expedition">${banner("/mission/" + n)}<a class="textlink" href="${link("")}">← Mission board</a><header class="exc-mission-header"><div><span class="eyebrow">WORLD 06 / MISSION 0${n}</span><h1>${titles[n - 1]}</h1><p>${d.goal}</p></div><div class="exc-fragment"><span aria-hidden="true">◈</span><b>FRAGMENT 0${n}</b><small>${preview ? "Preview" : p.done.includes(n) ? "Secured" : "Earn through discovery"}</small></div></header><nav class="exc-phase-nav" aria-label="Mission sections"><button type="button" data-jump="exc-learn">01 · Learn</button><button type="button" data-jump="exc-main-lab">02 · Play</button><button type="button" data-jump="exc-checks">03 · Check</button></nav><div class="exc-mission-layout"><div class="exc-mission-content"><section class="panel exc-lesson" id="exc-learn"><span class="eyebrow">THE SCIENCE / TEXTBOOK P. ${d.page}</span><h2>Your field briefing</h2><p>${d.text}</p><div class="exc-key-idea"><b>Keep this in mind</b><p>${d.clue}</p></div></section>${lab(n)}<section class="panel resp-checks exc-checks" id="exc-checks"><div class="exc-challenge-heading"><div><span class="eyebrow">CHECK YOUR UNDERSTANDING</span><h2>Connect the discovery</h2></div><span class="exc-pill">${preview ? "ANSWERS AVAILABLE" : "3 × 7 XP"}</span></div>${d.checks.map((q, i) => questionMarkup(q, i, n)).join("")}<div id="exc-finish"></div></section></div><aside class="exc-mission-sidebar"><section class="panel"><span class="eyebrow">YOUR FLIGHT PLAN</span><h3>Mission 0${n}</h3><div id="exc-mission-checklist"></div><hr><h4>Key terms</h4><p class="exc-keywords">${d.terms}</p><a class="textlink" href="${link("/studio")}">Open anatomy studio ↗</a></section><nav class="panel exc-side-missions" aria-label="Other excretory missions"><span class="eyebrow">EXPEDITION ROUTE</span>${titles.map((title, i) => `<a href="${link("/mission/" + (i + 1), preview || (i > 0 && !p.done.includes(i)))}" ${i + 1 === n ? 'aria-current="page"' : ""}><span>0${i + 1}</span>${title}</a>`).join("")}<a href="${link("/mastery", preview || p.done.length < 6)}"><span>◈</span>Final challenge</a></nav></aside></div><nav class="exc-bottom-nav" aria-label="Mission navigation"><a class="textlink" href="${link(n > 1 ? "/mission/" + (n - 1) : "")}">← ${n > 1 ? "Previous mission" : "Mission board"}</a><a class="textlink" href="${link(n < 6 ? "/mission/" + (n + 1) : "/mastery", preview || (n < 6 ? !p.done.includes(n) : p.done.length < 6))}">${n < 6 ? "Next mission" : "Final challenge"} →</a></nav></div>`,
    );
    const finish = () => {
      const labDone = done(n + "-lab"),
        checks = d.checks.filter((_, i) => done(n + "-q" + i)).length;
      document.getElementById("exc-mission-checklist").innerHTML =
        `<p>${labDone ? "✓" : "○"} Interactive challenge</p><p>${checks === 3 ? "✓" : "○"} ${checks}/3 science checks</p><div class="bar"><i style="width:${((checks + Number(labDone)) / 4) * 100}%"></i></div>`;
      if (labDone && checks === 3) {
        if (!preview && !p.done.includes(n)) {
          p.done.push(n);
          p.done.sort((a, b) => a - b);
          save();
          reward("exc-mission-" + n, 25);
        }
        document.getElementById("exc-finish").innerHTML =
          `<div class="exc-complete"><span aria-hidden="true">◈</span><h3>${preview ? "Preview challenge complete" : "Balance fragment 0" + n + " secured"}</h3><p>${preview ? "No student progress or XP was changed." : "Your discovery is saved. Continue to the next mission."}</p><a class="btn secondary" href="${link(n < 6 ? "/mission/" + (n + 1) : "/mastery")}">${n < 6 ? "Next mission" : "Final challenge"} →</a></div>`;
      } else
        document.getElementById("exc-finish").innerHTML =
          `<p class="exc-finish-status">${preview ? "Browse freely, or try the challenge and checks." : "Complete the interactive challenge and all three checks to secure this fragment."}</p>`;
    };
    art.mount(document.querySelector(".exc-world"));
    wireLab(n, finish);
    wireQuestions(d.checks, n, finish);
    document.querySelectorAll("[data-jump]").forEach(
      (b) =>
        (b.onclick = () =>
          document.getElementById(b.dataset.jump).scrollIntoView({
            behavior: motionReduced() ? "instant" : "smooth",
            block: "start",
          })),
    );
    finish();
  }
function mastery() {
    const p = progress();
    if (!preview && p.done.length < 6) {
      location.hash = link("");
      return;
    }
    layout(
      `<div class="exc-world exc-expedition">${banner("/mastery")}<a class="textlink" href="${link("")}">← Mission board</a><header class="exc-mission-header"><div><span class="eyebrow">FINAL CHALLENGE / THE BALANCE KEY</span><h1>Restore the balance.</h1><p>Eight decisions connect the organs, filtration, reabsorption, exercise and kidney care.</p></div><div class="exc-fragment"><span aria-hidden="true">◈</span><b>THE BALANCE KEY</b></div></header><div class="exc-final-progress" role="status" id="exc-final-progress"></div><section class="panel resp-checks exc-checks">${finalStages.map((q, i) => questionMarkup(q, i, 0, true)).join("")}<div id="exc-mastered"></div></section></div>`,
    );
    const finish = () => {
      const count = finalStages.filter((_, i) => done("final-" + i)).length;
      document.getElementById("exc-final-progress").textContent =
        count + " / 8 decisions connected";
      if (count === 8) {
        if (!preview && !p.mastery) {
          p.mastery = true;
          save();
          reward("exc-key", 50);
        }
        document.getElementById("exc-mastered").innerHTML =
          `<div class="exc-complete"><span aria-hidden="true">◈</span><h2>${preview ? "Final challenge previewed" : "Balance restored!"}</h2><p>${preview ? "The real Balance Key is earned in expedition mode. No progress or XP changed." : "You earned the Excretory System Key. Your body-system discoveries are connected."}</p><a class="btn secondary" href="${link("")}">Return to the mission board →</a></div>`;
      }
    };
    art.mount(document.querySelector(".exc-world"));
    wireQuestions(finalStages, 0, finish, true);
    finish();
  }
const priorRoute=InneruRouteModules.renderer;
const moduleRoute=function () {
    const [h, query = ""] = location.hash.slice(1).split("?");
    preview =
      h.startsWith("excretory") &&
      new URLSearchParams(query).get("preview") === "1";
    sessionSteps = new Set();
    if (h === "excretory" || h === "excretory/studio") {
      landing();
      if (h.endsWith("/studio"))
        requestAnimationFrame(() =>
          document
            .getElementById("exc-explorer")
            ?.scrollIntoView({ block: "start" }),
        );
    } else if (h.startsWith("excretory/mission/"))
      mission(Number(h.split("/")[2]));
    else if (h === "excretory/mastery") mastery();
    else priorRoute();
    if (h !== "excretory/studio") window.scrollTo(0, 0);
  };
InneruRouteModules.registerRenderer(moduleRoute);
})();
