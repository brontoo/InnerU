import * as THREE from "./assets/three/three.module.js";
import { OrbitControls } from "./assets/three/OrbitControls.js";
import {
  createExcretoryModel,
  STRUCTURES,
} from "./excretory-model.js?v=renal-anatomy-2";
let disposeCurrent = () => {};
export function mountExcretoryExplorer(root) {
  disposeCurrent();
  if (!root?.isConnected) return;
  const stage = root.querySelector(".exc-explorer-stage"),
    list = root.querySelector(".exc-structures"),
    info = root.querySelector(".exc-structure-info"),
    status = root.querySelector(".exc-model-status");
  let renderer,
    scene,
    camera,
    controls,
    model,
    view = "organs",
    selection = null,
    frame,
    resize,
    observer,
    disposed = false,
    spin = false,
    flow = true,
    particles = [];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const matches = (mesh, name) =>
    mesh.userData.structure === name ||
    mesh.userData.structures?.includes(name);
  function frameBounds(bounds, oblique = false) {
    const center = bounds.getCenter(new THREE.Vector3());
    const extent = bounds.getSize(new THREE.Vector3());
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const distance =
      Math.max(extent.y / (2 * tan), extent.x / (2 * tan * camera.aspect)) *
        1.2 +
      extent.z / 2;
    const offset = new THREE.Vector3(oblique ? 0.23 : 0.035, 0.025, 1)
      .normalize()
      .multiplyScalar(Math.max(distance, 1.0));
    controls.target.copy(center);
    camera.position.copy(center.clone().add(offset));
    controls.update();
  }
  function highlight(name) {
    selection = name;
    list
      .querySelectorAll("button")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.structure === name)),
      );
    const item = STRUCTURES[view === "flow" ? "organs" : view].find(
      (s) => s[0] === name,
    );
    info.replaceChildren();
    const h = document.createElement("h3");
    h.textContent = name || "Choose a structure";
    const p = document.createElement("p");
    p.textContent = item
      ? item[1]
      : "Select a label or tap the model to examine its function.";
    info.append(h, p);
    root.querySelector('[data-model-action="focus"]').disabled =
      !name || !renderer || disposed;
    if (!model) return;
    model.meshes.forEach((m) => {
      const on = !name || matches(m, name);
      m.material.transparent = !on;
      m.material.opacity = on ? 1 : 0.14;
      m.material.depthWrite = on;
      m.material.emissive.set(on && name ? 0x4b2119 : 0);
      m.renderOrder = on ? 2 : 0;
    });
  }
  function clearModel() {
    if (!model) return;
    scene.remove(model.group);
    model.group.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) o.material.dispose();
    });
    model.textures?.forEach((texture) => texture.dispose());
    particles.forEach((p) => {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    particles = [];
    model = null;
  }
  function setView(next) {
    view = next;
    selection = null;
    const fallbackImage = root.querySelector(".exc-model-fallback");
    fallbackImage.src =
      next === "nephron"
        ? "assets/excretory-nephron-plate.png"
        : "assets/excretory-science-plate.png";
    fallbackImage.alt =
      next === "nephron"
        ? "Magnified nephron: glomerular tuft inside the capsule, convoluted tubules, loop of Henle, collecting duct and surrounding capillaries."
        : "Kidney cutaway and urinary organs: cortex, medullary pyramids, calyces, pelvis, ureter and bladder.";
    root.querySelectorAll("[data-explorer-tab]").forEach((b) => {
      const active = b.dataset.explorerTab === next;
      b.setAttribute("aria-selected", String(active));
      b.tabIndex = active ? 0 : -1;
    });
    root
      .querySelector("#exc-anatomy-panel")
      .setAttribute("aria-labelledby", "exc-tab-" + next);
    list.innerHTML = STRUCTURES[next === "flow" ? "organs" : next]
      .map(
        ([name]) =>
          `<button type="button" data-structure="${name}" aria-pressed="false">${name}</button>`,
      )
      .join("");
    list
      .querySelectorAll("button")
      .forEach((b) => (b.onclick = () => highlight(b.dataset.structure)));
    root.querySelector(".exc-scale-note").textContent =
      next === "nephron"
        ? "Magnified nephron: the corpuscle and convoluted tubules lie in the cortex; the loop extends into the medulla. Blood and filtrate follow separate routes. Spacing is adjusted for inspection."
        : next === "kidney"
          ? "Coronal cutaway: cortical columns separate medullary pyramids. Urine flows from papillae to minor calyces, major calyces, pelvis and ureter. This anatomy-informed teaching reconstruction is enlarged, not a patient scan."
          : "Anterior view: the patient’s right is on your left, with the right kidney lower. Veins lie anterior to arteries; the pelvis is posterior. A short female urethra is illustrated. Each view is enlarged independently; this is a teaching reconstruction.";
    root.querySelector('[data-model-action="flow"]').hidden = next !== "flow";
    if (renderer) {
      clearModel();
      model = createExcretoryModel(next);
      scene.add(model.group);
      frameBounds(
        new THREE.Box3().setFromObject(model.group),
        next === "kidney",
      );
      if (next === "flow")
        model.paths.forEach((curve, index) => {
          for (let i = 0; i < 4; i++) {
            const mesh = new THREE.Mesh(
              new THREE.SphereGeometry(0.055, 12, 10),
              new THREE.MeshBasicMaterial({ color: 0x67d8cc }),
            );
            scene.add(mesh);
            particles.push({ mesh, curve, offset: i / 4 + index * 0.11 });
          }
        });
    }
    highlight(null);
  }
  root.querySelectorAll("[data-explorer-tab]").forEach((b, i, all) => {
    b.onclick = () => setView(b.dataset.explorerTab);
    b.onkeydown = (e) => {
      let n;
      if (e.key === "ArrowRight") n = (i + 1) % all.length;
      else if (e.key === "ArrowLeft") n = (i + all.length - 1) % all.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = all.length - 1;
      else return;
      e.preventDefault();
      all[n].focus();
      setView(all[n].dataset.explorerTab);
    };
  });
  root.querySelectorAll("[data-model-action]").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.modelAction === "spin") {
          spin = !spin;
          b.setAttribute("aria-pressed", String(spin));
          if (controls) controls.autoRotate = spin;
        } else if (b.dataset.modelAction === "flow") {
          flow = !flow;
          b.setAttribute("aria-pressed", String(flow));
          b.textContent = flow ? "Pause flow" : "Play flow";
        } else if (b.dataset.modelAction === "focus" && camera && selection) {
          const bounds = new THREE.Box3();
          model.meshes
            .filter((mesh) => matches(mesh, selection))
            .forEach((mesh) => bounds.expandByObject(mesh));
          frameBounds(bounds);
        } else if (camera && model) {
          frameBounds(
            new THREE.Box3().setFromObject(model.group),
            view === "kidney",
          );
          highlight(null);
        }
      }),
  );
  setView("organs");
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resize?.disconnect();
    observer?.disconnect();
    controls?.dispose();
    clearModel();
    renderer?.dispose();
    renderer?.domElement.remove();
  };
  disposeCurrent = cleanup;
  const fallback = () => {
    root.querySelector(".exc-model-fallback").hidden = false;
    status.textContent =
      "3D could not start on this device. Explore the labeled structures beside the illustration.";
    root.querySelector('[data-model-action="spin"]').disabled = true;
    root.querySelector('[data-model-action="flow"]').disabled = true;
  };
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    stage.prepend(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.75;
    controls.maxDistance = 9;
    controls.autoRotateSpeed = 0.8;
    scene.add(new THREE.HemisphereLight(0xfff7eb, 0x557783, 2.2));
    const key = new THREE.DirectionalLight(0xffdfd0, 2.4);
    key.position.set(-4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb1dfeb, 1.8);
    rim.position.set(4, 2, -3);
    scene.add(rim);
    const size = () => {
      if (!stage.isConnected) return;
      camera.aspect = stage.clientWidth / stage.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(stage.clientWidth, stage.clientHeight);
      if (model && !selection)
        frameBounds(
          new THREE.Box3().setFromObject(model.group),
          view === "kidney",
        );
    };
    resize = new ResizeObserver(size);
    resize.observe(stage);
    size();
    setView(view);
    status.textContent = "Drag to rotate · scroll to zoom · choose a structure";
    const pointer = new THREE.Vector2(),
      ray = new THREE.Raycaster();
    let start;
    renderer.domElement.onpointerdown = (e) => {
      start = [e.clientX, e.clientY];
    };
    renderer.domElement.onpointerup = (e) => {
      if (!start || Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 6)
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((e.clientY - rect.top) / rect.height) * 2,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray
        .intersectObjects(model.meshes)
        .find((h) => h.object.material.opacity > 0.2);
      if (hit) highlight(hit.object.userData.structure);
    };
    stage.onkeydown = (e) => {
      const angle =
        e.key === "ArrowLeft" ? 0.13 : e.key === "ArrowRight" ? -0.13 : 0;
      if (angle) {
        const delta = camera.position
          .clone()
          .sub(controls.target)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        camera.position.copy(controls.target.clone().add(delta));
        controls.update();
        e.preventDefault();
      } else if (e.key === "+" || e.key === "-") {
        const delta = camera.position
          .clone()
          .sub(controls.target)
          .multiplyScalar(e.key === "+" ? 0.9 : 1.1);
        camera.position.copy(controls.target.clone().add(delta));
        controls.update();
        e.preventDefault();
      }
    };
    let flowTime = 0;
    let lastTime = 0;
    function draw(time = 0) {
      if (disposed) return;
      if (!root.isConnected) {
        cleanup();
        return;
      }
      frame = requestAnimationFrame(draw);
      if (document.hidden) {
        lastTime = time;
        return;
      }
      if (flow && !reduced) flowTime += Math.min(time - lastTime, 64);
      lastTime = time;
      controls.update();
      particles.forEach((p) =>
        p.mesh.position.copy(
          p.curve.getPointAt((flowTime * 0.00015 + p.offset) % 1),
        ),
      );
      renderer.render(scene, camera);
    }
    draw();
    window.inneruExcretoryExplorerState = () => ({
      view,
      selection,
      structures: model?.meshes.flatMap(
        (m) => m.userData.structures || [m.userData.structure],
      ),
      anatomy: model?.anatomy,
      rotatable: !!controls?.enableRotate,
      canvas: !!renderer,
      particleCount: particles.length,
      camera: camera?.position.toArray(),
    });
    observer = new MutationObserver(() => {
      if (!root.isConnected) cleanup();
    });
    observer.observe(document.getElementById("app"), {
      childList: true,
      subtree: true,
    });
  } catch (e) {
    console.error("Excretory explorer:", e);
    cleanup();
    fallback();
  }
}
