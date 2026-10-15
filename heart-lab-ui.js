/* Markup remains usable while the optional WebGL module loads. */
window.InneruHeartLab = {
  markup() {
    return `<section class="circ-heart-stage heart-lab" aria-labelledby="heart-lab-title">
      <header class="heart-lab-heading"><div><span class="circ-heart-kicker">INTERACTIVE ANATOMY STUDIO</span><h2 id="heart-lab-title">Inside the living heart.</h2><p>Turn the heart. Open a chamber. Discover what keeps blood moving forward.</p></div><span class="heart-lab-tag">ROTATE · REVEAL · INVESTIGATE</span></header>
      <div class="heart-lab-modes" role="tablist" aria-label="Heart anatomy investigation">
        <button type="button" role="tab" id="heart-tab-surface" data-heart-mode="surface" aria-selected="true" aria-controls="heart-investigation" tabindex="0"><small>01</small>Surface anatomy</button>
        <button type="button" role="tab" id="heart-tab-cutaway" data-heart-mode="cutaway" aria-selected="false" aria-controls="heart-investigation" tabindex="-1"><small>02</small>Inside the heart</button>
        <button type="button" role="tab" id="heart-tab-valves" data-heart-mode="valves" aria-selected="false" aria-controls="heart-investigation" tabindex="-1"><small>03</small>Valve mechanics</button>
        <button type="button" role="tab" id="heart-tab-flow" data-heart-mode="flow" aria-selected="false" aria-controls="heart-investigation" tabindex="-1"><small>04</small>Blood journey</button>
      </div>
      <div id="heart-investigation" role="tabpanel" aria-labelledby="heart-tab-surface">
        <div class="circ-heart-layout"><div class="heart-lab-visual">
          <div class="circ-heart-viewer" id="heart-canvas" tabindex="0" role="group" aria-label="Rotatable 3D heart. Drag or use arrow keys to turn; plus and minus zoom. Select a structure on the model or use the structure list.">
            <img id="heart-fallback" class="heart-lab-fallback" hidden src="assets/circulatory-missions/03-heart.webp" alt="Anatomical heart cutaway showing chambers, muscular walls, septum and valves.">
            <div class="circ-heart-loading" id="heart-loading" role="status"><span class="circ-loading-orbit" aria-hidden="true">♥</span>Preparing your anatomy studio…</div>
            <div class="heart-view-label"><span id="heart-view-label">ANTERIOR · SURFACE ANATOMY</span><b id="heart-selected-label" hidden></b></div>
            <div class="circ-heart-hotspot" id="heart-hotspot" hidden><span id="heart-hotspot-name"></span></div>
            <div class="circ-heart-platform" aria-hidden="true"></div>
          </div>
          <div class="circ-heart-presets" role="group" aria-label="Heart orientation"><button type="button" data-heart-view="anterior" aria-pressed="true">Anterior</button><button type="button" data-heart-view="posterior" aria-pressed="false">Posterior</button><button type="button" data-heart-view="left" aria-pressed="false">Patient’s left</button><button type="button" data-heart-view="right" aria-pressed="false">Patient’s right</button></div>
          <div class="circ-heart-controls"><button type="button" id="heart-reset">Reset view</button><button type="button" id="heart-focus" disabled>Focus structure</button><button type="button" id="heart-zoom-in" aria-label="Zoom in">＋</button><button type="button" id="heart-zoom-out" aria-label="Zoom out">−</button><button type="button" id="heart-motion" aria-pressed="false">Rotate model</button></div>
          <p class="heart-lab-orientation">Anterior view: the patient’s right appears on your left. Drag to rotate; scroll or pinch to zoom.</p>
        </div><aside class="circ-heart-options">
          <div class="heart-investigation-tools" id="heart-internal-tools" hidden><button type="button" id="heart-shell" aria-pressed="true">Front wall removed</button><button type="button" id="heart-context" aria-pressed="false">Keep surrounding anatomy</button></div>
          <div class="heart-structure-heading"><span>INVESTIGATE A STRUCTURE</span><span id="heart-study-count">0 / 26 discovered</span></div>
          <div class="heart-structure-groups" role="group" aria-label="Anatomical structure category"><button type="button" data-heart-group="chambers" aria-pressed="false">Chambers</button><button type="button" data-heart-group="valves" aria-pressed="false">Valves</button><button type="button" data-heart-group="support" aria-pressed="false">Wall & support</button><button type="button" data-heart-group="vessels" aria-pressed="true">Vessels</button><button type="button" data-heart-group="conduction" aria-pressed="false">Electrical pathway</button></div>
          <div class="circ-vessel-buttons heart-structure-buttons" id="heart-structure-list" role="group" aria-label="Heart structures"></div>
          <div class="circ-vessel-info" id="circ-vessel-info" role="status" aria-live="polite"><b>Choose a structure</b><span>Select a label or tap the model. The selected structure stays clear while surrounding parts fade.</span></div>
          <div class="heart-valve-controls" id="heart-valve-controls" hidden><span class="eyebrow">ONE-WAY VALVES / CONTROL THE PHASE</span><div role="group" aria-label="Cardiac cycle phase"><button type="button" data-heart-phase="filling" aria-pressed="true">Ventricular filling</button><button type="button" data-heart-phase="ejection" aria-pressed="false">Ventricular ejection</button></div><label for="heart-cycle">Explore the cardiac cycle <span id="heart-cycle-label">Filling</span></label><input id="heart-cycle" type="range" min="0" max="100" value="0" step="1"><p id="heart-phase-note">AV valves open; semilunar valves closed. Blood enters relaxed ventricles.</p><small class="heart-cycle-scale">Cycle slowed for study; phase durations are illustrative.</small><button type="button" id="heart-beat" aria-pressed="false">Play cardiac cycle</button></div>
          <div class="heart-flow-controls" id="heart-flow-tools" hidden><div class="heart-flow-heading"><span class="eyebrow">BLOOD JOURNEY</span><b id="heart-route-count">1 / 12</b></div><p id="heart-route-note" role="status">Body → venae cavae → right atrium.</p><div class="heart-route-actions"><button type="button" id="heart-route-prev">← Previous</button><button type="button" id="heart-route-next">Next stop →</button><button type="button" id="heart-flow" aria-pressed="false">Play blood journey</button></div><label for="flow-speed">Journey speed <select id="flow-speed"><option value="1">Normal</option><option value="0.5">Slow</option></select></label><p class="heart-flow-key"><i></i>Lower oxygen <i></i>Higher oxygen · blood cells stay shades of red.</p></div>
          <div class="heart-discovery-note"><span id="circ-vessel-count">0/6 vessels explored</span><small>Surface vessels keep their existing discovery rewards. New internal studies are free practice.</small></div>
          <p class="heart-motion-note" id="heart-motion-note" role="status"></p>
          <p class="circ-heart-error" id="heart-error" role="status" hidden>The 3D view is unavailable here. Use the anatomical illustration, structure buttons and phase controls to keep investigating.</p>
        </aside></div>
        <p class="heart-lab-scale" id="heart-lab-scale">External anatomy: aligned anatomical surface meshes. Colours and vessel ends are adapted for teaching; blood is always a shade of red.</p>
      </div>
      <footer class="heart-lab-credit"><a class="circ-heart-credit" href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noopener">Surface anatomy: DBCLS BodyParts3D 4.3 · CC BY-SA 2.1 Japan ↗</a><span>Internal cutaway and valve details: original anatomical teaching reconstruction.</span></footer>
    </section>`;
  }
};
