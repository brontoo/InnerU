/* Original anatomy-informed surfaces. Each view is enlarged independently. */
import * as THREE from "./assets/three/three.module.js";
export const STRUCTURES = {
  organs: [
    [
      "Right kidney",
      "Filters blood through about one million nephrons. The right kidney normally sits slightly lower than the left.",
    ],
    [
      "Left kidney",
      "Filters blood and helps control water, salts and acid–base balance.",
    ],
    [
      "Renal artery",
      "Brings blood containing nutrients and wastes to each kidney. Red indicates an arterial route.",
    ],
    [
      "Renal vein",
      "Returns blood from the kidneys to the circulation. Blue indicates a venous route; the blood itself is red.",
    ],
    [
      "Ureters",
      "Two muscular tubes move urine from the renal pelvises to the bladder.",
    ],
    [
      "Urinary bladder",
      "Stores urine; it does not filter blood or make urine.",
    ],
    ["Urethra", "Carries urine from the bladder to the outside of the body."],
  ],
  kidney: [
    [
      "Renal cortex",
      "Outer tissue containing the renal corpuscles and convoluted tubules. Filtration begins here.",
    ],
    [
      "Renal medulla",
      "Inner tissue arranged in pyramids. Loops of Henle and collecting ducts help concentrate urine.",
    ],
    [
      "Renal calyces",
      "Cup-shaped collecting spaces receive urine from the tips of the medullary pyramids.",
    ],
    [
      "Renal pelvis",
      "The central collecting funnel joins the calyces to the ureter.",
    ],
    ["Renal artery", "Brings blood into the kidney at the hilum."],
    ["Renal vein", "Carries blood away from the kidney at the hilum."],
    ["Ureter", "Carries urine away from the pelvis toward the bladder."],
  ],
  nephron: [
    [
      "Glomerulus",
      "A tuft of capillaries. Blood pressure drives water and small solutes through the filtration barrier. Cells and most large proteins remain in the blood.",
    ],
    [
      "Bowman’s capsule",
      "A cup surrounding the glomerulus. It receives the filtrate, which is not yet final urine.",
    ],
    ["Afferent arteriole", "Brings blood into the glomerulus."],
    [
      "Efferent arteriole",
      "Carries blood out of the glomerulus toward the surrounding capillary network. Both arterioles carry blood, not urine.",
    ],
    [
      "Proximal tubule",
      "A convoluted tubule that reabsorbs most filtered water and salts, and normally nearly all filtered glucose and amino acids.",
    ],
    [
      "Loop of Henle",
      "Descending and ascending limbs help establish the medullary concentration gradient.",
    ],
    [
      "Distal tubule",
      "Adjusts salts and acid–base balance through reabsorption and secretion.",
    ],
    [
      "Collecting duct",
      "Receives fluid from nephrons and carries it toward the pelvis. ADH changes its water permeability.",
    ],
    [
      "Peritubular capillaries",
      "Surround the tubules. Receive reabsorbed water and useful solutes; also supply substances for secretion.",
    ],
  ],
};
STRUCTURES.organs.splice(
  2,
  0,
  [
    "Abdominal aorta",
    "The main artery in the abdomen gives rise to the renal arteries. Only the segment supplying the kidneys is shown.",
  ],
  [
    "Inferior vena cava",
    "The renal veins drain into this large vein, which returns blood toward the heart. It lies to the patient’s right of the aorta.",
  ],
);
STRUCTURES.organs.splice(6, 0, [
  "Renal pelvis",
  "The collecting funnel lies behind the renal vessels at the hilum and continues into the ureter.",
]);
STRUCTURES.kidney.unshift([
  "Renal capsule",
  "A thin fibrous covering surrounds the kidney. The anterior half is opened in this coronal cutaway.",
]);
STRUCTURES.kidney.splice(
  3,
  0,
  [
    "Renal columns",
    "Extensions of cortical tissue run between the medullary pyramids.",
  ],
  [
    "Renal papillae",
    "The tip of each medullary pyramid releases urine into a minor calyx.",
  ],
  ["Minor calyces", "Small cups embrace the papillae and receive their urine."],
  [
    "Major calyces",
    "Several minor calyces join larger collecting branches, which drain into the pelvis.",
  ],
  [
    "Renal sinus",
    "A central space containing collecting structures, vessels and fat. The cutaway shows a small region of its supporting fat.",
  ],
);
/* Anatomy-informed surface models, not patient-specific scan reconstructions.
   Coordinates use an anterior view: patient's right is viewer's left.
   Macroscopic and microscopic views are enlarged independently. */
const C = {
  kidney: 0x98514b,
  capsule: 0xcb9383,
  cortex: 0xc77b70,
  medulla: 0xa1515e,
  column: 0xd59b88,
  papilla: 0xcd8a78,
  pelvis: 0xe4cc9f,
  urine: 0xd8bb88,
  artery: 0xb84149,
  vein: 0x507fa0,
  tubule: 0xdca781,
  glomerulus: 0xbc4c53,
};
const ANATOMY = {
  right: { center: [-0.92, 0.81, 0.02], hilum: [-0.76, 0.77, 0.01], side: -1 },
  left: { center: [0.92, 0.99, 0], hilum: [0.76, 0.95, 0], side: 1 },
  aorta: [0.13, 0, -0.18],
  venaCava: [-0.13, 0, 0.02],
  bladderCenter: [0, -1.46, 0.12],
  bladderNeck: [0, -1.81, 0.1],
};
function surfaceTexture() {
  const size = 192,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const grain =
        (hash - Math.floor(hash)) * 0.65 +
        0.35 * (Math.sin(x * 0.19 + Math.sin(y * 0.08)) * 0.5 + 0.5);
      const v = Math.round(115 + grain * 28),
        i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}
export function createExcretoryModel(view) {
  const group = new THREE.Group(),
    meshes = [],
    paths = [],
    textures = [];
  const tissue = surfaceTexture();
  textures.push(tissue);
  function add(geometry, color, name, options = {}) {
    const material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.16,
      clearcoatRoughness: 0.48,
      bumpMap: tissue,
      bumpScale: options.bumpScale ?? 0.012,
      vertexColors: !!geometry.attributes.color,
      ...options,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.userData.structure = name;
    if (name === "Minor calyces" || name === "Major calyces")
      mesh.userData.structures = [name, "Renal calyces"];
    group.add(mesh);
    meshes.push(mesh);
    return mesh;
  }
  function ellipsoid(name, color, p, size, options = {}) {
    const m = add(new THREE.SphereGeometry(1, 48, 32), color, name, options);
    m.position.set(...p);
    m.scale.set(...size);
    return m;
  }
  function tube(name, color, points, r = 0.05, options = {}) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      false,
      "centripetal",
    );
    const radialSegments = 20;
    const segments = Math.max(40, points.length * 9),
      g = new THREE.TubeGeometry(curve, segments, r, radialSegments, false);
    if (options.radius) {
      const position = g.attributes.position;
      for (let i = 0; i <= segments; i++) {
        const center = curve.getPointAt(i / segments),
          scale = options.radius(i / segments) / r;
        for (let j = 0; j <= radialSegments; j++) {
          const k = i * (radialSegments + 1) + j;
          const p = new THREE.Vector3()
            .fromBufferAttribute(position, k)
            .sub(center)
            .multiplyScalar(scale)
            .add(center);
          position.setXYZ(k, p.x, p.y, p.z);
        }
      }
      g.computeVertexNormals();
    }
    const { radius, ...materialOptions } = options;
    const mesh = add(g, color, name, materialOptions);
    return { mesh, curve };
  }
  function kidneyPoint(x, y, z, scale = 1) {
    const medial = Math.max(0, x),
      notch = 0.285 * Math.exp(-Math.pow(y / 0.48, 2)) * Math.pow(medial, 1.15);
    return new THREE.Vector3(
      (x * 0.5 - notch - 0.035 * (1 - y * y)) * scale,
      y * 0.78 * scale,
      z * 0.285 * (1 - 0.14 * Math.max(0, x)) * scale,
    );
  }
  function kidneySurface(name, p, mirror = false, scale = 1, rearOnly = false) {
    const g = new THREE.SphereGeometry(
      1,
      96,
      64,
      0,
      Math.PI * 2,
      rearOnly ? Math.PI / 2 : 0,
      rearOnly ? Math.PI / 2 : Math.PI,
    );
    if (rearOnly) g.rotateX(Math.PI / 2);
    const position = g.attributes.position,
      colors = [];
    for (let i = 0; i < position.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(position, i),
        q = kidneyPoint(v.x, v.y, v.z, scale);
      position.setXYZ(i, q.x, q.y, q.z);
      const c = new THREE.Color(C.kidney);
      c.multiplyScalar(
        0.94 +
          0.06 * Math.sin(v.y * 8 + v.x * 5) * Math.sin(v.z * 9) +
          (0.07 * (v.y + 1)) / 2,
      );
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const m = add(g, 0xffffff, name, { roughness: 0.43, clearcoat: 0.22 });
    m.position.set(...p);
    if (mirror) m.scale.x = -1;
    return m;
  }
  function outline(scale = 1) {
    return Array.from({ length: 128 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2,
        p = kidneyPoint(Math.cos(a), Math.sin(a), 0, scale);
      return new THREE.Vector2(p.x, p.y);
    });
  }
  function faceShape(points) {
    const s = new THREE.Shape();
    s.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((p) => s.lineTo(p.x, p.y));
    s.closePath();
    return s;
  }
  function lumenEnd(name, color, point, r, axis) {
    const ring = add(
      new THREE.TorusGeometry(r * 0.88, r * 0.12, 8, 32),
      color,
      name,
      { bumpScale: 0 },
    );
    ring.position.set(...point);
    ring.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(...axis).normalize(),
    );
    return ring;
  }
  if (view === "organs" || view === "flow") {
    kidneySurface("Right kidney", ANATOMY.right.center);
    kidneySurface("Left kidney", ANATOMY.left.center, true);
    // Main vessels supply genuine origins for renal vessels. Only relevant segments are shown.
    tube(
      "Abdominal aorta",
      C.artery,
      [
        [0.13, 1.83, -0.18],
        [0.13, 1.35, -0.18],
        [0.13, 0.86, -0.18],
        [0.13, 0.26, -0.18],
        [0.12, -0.22, -0.18],
      ],
      0.1,
      { radius: (t) => 0.105 - 0.02 * t },
    );
    tube(
      "Inferior vena cava",
      C.vein,
      [
        [-0.13, -0.22, 0.02],
        [-0.13, 0.4, 0.02],
        [-0.13, 0.95, 0.02],
        [-0.12, 1.4, 0.02],
        [-0.11, 1.84, 0.02],
      ],
      0.115,
      { radius: (t) => 0.1 + 0.026 * t },
    );
    lumenEnd(
      "Abdominal aorta",
      C.artery,
      [0.13, 1.83, -0.18],
      0.105,
      [0, 1, 0],
    );
    lumenEnd(
      "Inferior vena cava",
      C.vein,
      [-0.11, 1.84, 0.02],
      0.126,
      [0, 1, 0],
    );
    for (const [side, landmark] of [
      [-1, ANATOMY.right],
      [1, ANATOMY.left],
    ]) {
      const [x, y] = landmark.hilum;
      // At the hilum: vein anterior, artery intermediate, pelvis posterior.
      const arteryEnd = [x, y + 0.025, -0.005],
        veinEnd = [x, y + 0.005, 0.16],
        pelvis = [x, y - 0.1, -0.12];
      tube(
        "Renal artery",
        C.artery,
        [
          [0.13, y + 0.08, -0.18],
          [side * 0.3, y + 0.07, -0.17],
          [side * 0.52, y + 0.045, -0.05],
          arteryEnd,
        ],
        0.045,
        { radius: (t) => 0.055 - 0.014 * t },
      );
      tube(
        "Renal vein",
        C.vein,
        [
          veinEnd,
          [side * 0.52, y, 0.16],
          [side * 0.25, y - 0.04, 0.16],
          [-0.13, y - 0.03, 0.02],
        ],
        0.064,
        { radius: (t) => 0.064 + 0.005 * t },
      );
      ellipsoid("Renal pelvis", C.pelvis, pelvis, [0.12, 0.12, 0.08], {
        roughness: 0.6,
      });
      const ureterStart = [x, y - 0.15, -0.12],
        bladderEntry = [side * 0.19, -1.6, -0.125];
      const ureter = tube(
        "Ureters",
        C.urine,
        [
          ureterStart,
          [side * 0.66, y - 0.47, -0.12],
          [side * 0.58, -0.1, -0.1],
          [side * 0.47, -0.69, -0.085],
          [side * 0.32, -1.15, -0.075],
          bladderEntry,
        ],
        0.029,
        { radius: (t) => 0.033 - 0.007 * Math.sin(t * Math.PI) },
      );
      paths.push(ureter.curve);
    }
    // Rounded dome, broad upper body and a narrowing inferior neck; posterolateral ureter entry.
    const bladder = new THREE.SphereGeometry(1, 72, 48),
      position = bladder.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i),
        y = position.getY(i),
        z = position.getZ(i);
      const taper =
        y < -0.25 ? 1 - 0.57 * Math.pow((-y - 0.25) / 0.75, 1.3) : 1;
      position.setXYZ(i, x * 0.48 * taper, y * 0.4, z * 0.32 * taper);
    }
    bladder.computeVertexNormals();
    const b = add(bladder, 0xc9907d, "Urinary bladder", {
      roughness: 0.6,
      bumpScale: 0.017,
    });
    b.position.set(...ANATOMY.bladderCenter);
    ellipsoid(
      "Urinary bladder",
      0xba7967,
      [0, -1.81, 0.1],
      [0.095, 0.12, 0.078],
      { roughness: 0.58 },
    );
    const urethra = tube(
      "Urethra",
      0xd0ab86,
      [
        [0, -1.84, 0.1],
        [0, -1.99, 0.105],
        [0, -2.34, 0.12],
      ],
      0.045,
      { radius: (t) => 0.05 - 0.012 * t },
    );
    paths.push(urethra.curve);
    lumenEnd("Urethra", 0xc59378, [0, -2.34, 0.12], 0.038, [0, -1, 0.06]);
  } else if (view === "kidney") {
    // Coronal open face; the remaining posterior surface preserves the organ volume.
    const scale = 1.76;
    kidneySurface("Renal capsule", [0, 0, 0], false, scale, true);
    const outer = outline(scale),
      inner = outline(scale).map(
        (p) => new THREE.Vector2(p.x * 0.79 - 0.035, p.y * 0.86),
      );
    const ring = faceShape(outer);
    ring.holes.push(new THREE.Path(inner.slice().reverse()));
    const cortex = add(
      new THREE.ExtrudeGeometry(ring, {
        depth: 0.06,
        bevelEnabled: true,
        bevelSize: 0.015,
        bevelThickness: 0.018,
        bevelSegments: 3,
        curveSegments: 24,
      }),
      C.cortex,
      "Renal cortex",
      { roughness: 0.72, bumpScale: 0.024 },
    );
    cortex.position.z = 0.03;
    // Deep renal sinus and cortical columns between the medullary pyramids.
    const bed = add(
      new THREE.ShapeGeometry(faceShape(inner)),
      C.column,
      "Renal columns",
      { roughness: 0.7, bumpScale: 0.017 },
    );
    bed.position.z = 0.038;
    const specs = [
      [-0.12, 1.0, 0.23],
      [-0.45, 0.82, 0.22],
      [-0.62, 0.47, 0.22],
      [-0.65, 0.03, 0.22],
      [-0.57, -0.44, 0.23],
      [-0.37, -0.82, 0.22],
      [0.04, -0.97, 0.22],
      [0.31, 0.72, 0.14],
    ];
    ellipsoid("Renal sinus", 0xe4cbb0, [0.15, 0, 0.04], [0.27, 0.72, 0.06], {
      roughness: 0.8,
      bumpScale: 0.018,
    });
    const papillae = [];
    for (const [x, y, w] of specs) {
      const base = new THREE.Vector2(x, y),
        tip = new THREE.Vector2(0.15, y * 0.45),
        direction = tip.clone().sub(base).normalize(),
        cross = new THREE.Vector2(-direction.y, direction.x).multiplyScalar(w);
      const l = base.clone().add(cross),
        r = base.clone().sub(cross),
        shape = new THREE.Shape();
      shape.moveTo(l.x, l.y);
      shape.quadraticCurveTo(
        base.x - direction.x * 0.09,
        base.y - direction.y * 0.09,
        r.x,
        r.y,
      );
      shape.quadraticCurveTo(
        (r.x + tip.x) / 2 + 0.025,
        (r.y + tip.y) / 2,
        tip.x,
        tip.y,
      );
      shape.quadraticCurveTo((l.x + tip.x) / 2, (l.y + tip.y) / 2, l.x, l.y);
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: 0.115,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: 4,
        curveSegments: 16,
      });
      const pyramid = add(g, C.medulla, "Renal medulla", {
        roughness: 0.61,
        bumpScale: 0.013,
      });
      pyramid.position.z = 0.05;
      for (let j = -3; j <= 3; j++) {
        const start = base.clone().add(cross.clone().multiplyScalar(j / 4));
        tube(
          "Renal medulla",
          0xbc7772,
          [
            [start.x, start.y, 0.207],
            [(start.x + tip.x) / 2, (start.y + tip.y) / 2, 0.209],
            [tip.x, tip.y, 0.208],
          ],
          0.004,
          { bumpScale: 0 },
        );
      }
      const papilla = [tip.x, tip.y, 0.2];
      ellipsoid("Renal papillae", C.papilla, papilla, [0.049, 0.055, 0.045]);
      papillae.push(papilla);
    }
    // Minor cups embrace individual papillae; major calyces join the central pelvis.
    papillae.forEach(([x, y, z]) => {
      const stem = [0.25, y > 0.16 ? 0.35 : y < -0.16 ? -0.35 : 0, 0.235],
        cup = tube(
          "Minor calyces",
          C.pelvis,
          [[x + 0.015, y, z + 0.012], [x + 0.06, y, 0.237], stem],
          0.039,
          { radius: (t) => 0.063 - 0.03 * t, roughness: 0.61 },
        );
      lumenEnd(
        "Minor calyces",
        0xebd4ae,
        [x + 0.015, y, z + 0.012],
        0.06,
        [1, 0, 0.1],
      );
    });
    for (const y of [0.35, 0, -0.35])
      tube(
        "Major calyces",
        C.pelvis,
        [
          [0.23, y, 0.235],
          [0.32, y * 0.7, 0.23],
          [0.39, y * 0.3, 0.23],
        ],
        0.074,
        { radius: (t) => 0.055 + 0.028 * t, roughness: 0.63 },
      );
    const pelvis = add(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.042, -0.33),
          new THREE.Vector2(0.08, -0.18),
          new THREE.Vector2(0.155, 0.03),
          new THREE.Vector2(0.18, 0.22),
          new THREE.Vector2(0.15, 0.33),
        ],
        48,
      ),
      C.pelvis,
      "Renal pelvis",
      { side: THREE.DoubleSide, roughness: 0.65 },
    );
    pelvis.position.set(0.36, -0.12, 0.16);
    pelvis.rotation.z = 0.31;
    pelvis.scale.z = 0.7;
    tube(
      "Ureter",
      C.urine,
      [
        [0.46, -0.4, 0.15],
        [0.6, -0.7, 0.06],
        [0.58, -1.14, 0.03],
        [0.56, -1.58, 0.03],
      ],
      0.06,
      { radius: (t) => 0.07 - 0.022 * t, roughness: 0.63 },
    );
    tube(
      "Renal artery",
      C.artery,
      [
        [1.14, 0.28, 0.14],
        [0.85, 0.24, 0.12],
        [0.56, 0.2, 0.1],
        [0.32, 0.27, 0.13],
      ],
      0.075,
      { radius: (t) => 0.085 - 0.018 * t },
    );
    tube(
      "Renal vein",
      C.vein,
      [
        [0.32, 0.07, 0.38],
        [0.62, 0.03, 0.4],
        [0.9, 0.05, 0.4],
        [1.17, 0.1, 0.38],
      ],
      0.095,
      { radius: (t) => 0.08 + 0.014 * t },
    );
    for (const y of [0.65, -0.63])
      tube(
        "Renal artery",
        0xb94e57,
        [
          [0.4, 0.23, 0.14],
          [0.13, y * 0.5, 0.13],
          [-0.28, y, 0.13],
        ],
        0.023,
      );
  } else {
    // Enlarged open renal corpuscle and a continuous 3D renal tubule.
    const center = new THREE.Vector3(-0.84, 0.91, 0.02);
    const cap = add(
      new THREE.SphereGeometry(
        0.42,
        56,
        40,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      ),
      0xe4c8a3,
      "Bowman’s capsule",
      { side: THREE.DoubleSide, roughness: 0.55 },
    );
    cap.rotation.x = Math.PI / 2;
    cap.position.copy(center);
    const rim = add(
      new THREE.TorusGeometry(0.414, 0.023, 10, 64),
      0xebd5b7,
      "Bowman’s capsule",
    );
    rim.position.copy(center);
    const entry = [-1.035, 1.09, 0.11],
      exit = [-0.65, 1.1, 0.08];
    // Multiple curved capillary loops connect the afferent and efferent vascular poles.
    for (let k = 0; k < 9; k++) {
      const points = [entry];
      const angle = (k / 9) * Math.PI * 2;
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2,
          rx = 0.17 + 0.045 * Math.sin(k * 1.8),
          ry = 0.19 + 0.035 * Math.cos(k * 1.4);
        points.push([
          center.x + Math.cos(a + angle) * rx,
          center.y + Math.sin(a + angle) * ry,
          0.075 + 0.1 * Math.sin(a * 2 + k * 0.8),
        ]);
      }
      points.push(exit);
      tube("Glomerulus", C.glomerulus, points, 0.018, {
        roughness: 0.51,
        bumpScale: 0.004,
      });
    }
    tube(
      "Afferent arteriole",
      C.artery,
      [[-1.43, 1.2, 0.02], [-1.26, 1.2, 0.04], [-1.11, 1.14, 0.08], entry],
      0.06,
      { radius: (t) => 0.065 - 0.014 * t },
    );
    const efferent = tube(
      "Efferent arteriole",
      0xad4553,
      [exit, [-0.53, 1.27, 0.04], [-0.31, 1.23, -0.16]],
      0.036,
      { radius: (t) => 0.044 - 0.012 * t },
    );
    // Proximal and distal convolutions are three-dimensional, not flat zigzags.
    tube(
      "Proximal tubule",
      C.tubule,
      [
        [-0.68, 0.57, 0.02],
        [-0.51, 0.46, 0.02],
        [-0.28, 0.63, 0.13],
        [-0.23, 0.91, 0.08],
        [0.03, 0.73, -0.04],
        [-0.06, 0.41, -0.09],
        [-0.32, 0.31, 0.08],
        [-0.43, 0.15, 0.04],
      ],
      0.076,
      { radius: (t) => 0.078 - 0.015 * t, roughness: 0.64 },
    );
    tube(
      "Loop of Henle",
      0xddb792,
      [
        [-0.43, 0.15, 0.04],
        [-0.44, -0.28, 0.025],
        [-0.43, -0.8, 0.015],
        [-0.4, -1.21, 0.01],
        [-0.27, -1.35, 0.01],
        [-0.08, -1.3, 0.01],
        [0.04, -1.1, 0.01],
        [0.05, -0.64, 0],
        [0.04, -0.13, 0.02],
        [0.09, 0.22, 0.04],
      ],
      0.045,
      {
        radius: (t) => (t < 0.7 ? 0.036 : 0.036 + (t - 0.7) * 0.09),
        roughness: 0.68,
      },
    );
    tube(
      "Distal tubule",
      0xdca481,
      [
        [0.09, 0.22, 0.04],
        [0.3, 0.43, 0.09],
        [0.17, 0.75, 0.13],
        [0.21, 1.02, 0.04],
        [0.5, 1.11, -0.05],
        [0.65, 0.88, 0.01],
        [0.59, 0.65, 0.09],
        [0.88, 0.55, 0.06],
      ],
      0.061,
      { roughness: 0.62 },
    );
    const duct = tube(
      "Collecting duct",
      0xd8bb87,
      [
        [0.88, 1.41, 0.05],
        [0.88, 0.55, 0.06],
        [0.9, -0.39, 0.06],
        [0.92, -1.5, 0.08],
      ],
      0.1,
      { radius: (t) => 0.081 + 0.02 * t, roughness: 0.66 },
    );
    lumenEnd("Collecting duct", 0xe4c99e, [0.88, 1.41, 0.05], 0.081, [0, 1, 0]);
    lumenEnd(
      "Collecting duct",
      0xe4c99e,
      [0.92, -1.5, 0.08],
      0.101,
      [0, -1, 0],
    );
    // Peritubular plexus follows convolutions; parallel vasa recta follow the long loop.
    tube(
      "Peritubular capillaries",
      C.vein,
      [
        [-0.31, 1.23, -0.16],
        [0.12, 1.29, -0.16],
        [0.53, 1.24, -0.16],
        [0.65, 0.85, -0.17],
        [0.44, 0.6, -0.18],
        [0.13, 0.54, -0.19],
        [-0.23, 0.49, -0.17],
        [-0.58, 0.26, -0.16],
      ],
      0.016,
      { bumpScale: 0.002 },
    );
    for (let j = 0; j < 4; j++) {
      const x = -0.58 + j * 0.2;
      tube(
        "Peritubular capillaries",
        j % 2 ? 0x5e86a0 : 0xad6870,
        [
          [x, 0.43, -0.17],
          [x - 0.04, 0.08, -0.16],
          [x, -0.53, -0.15],
          [x + 0.015, -1.31, -0.14],
          [x + 0.08, -1.4, -0.14],
          [x + 0.14, -1.26, -0.14],
          [x + 0.14, -0.52, -0.15],
          [x + 0.16, 0.3, -0.17],
        ],
        0.012,
        { bumpScale: 0 },
      );
    }
    for (let j = 0; j < 3; j++)
      tube(
        "Peritubular capillaries",
        0x688ca4,
        [
          [-0.58, 0.25 + j * 0.17, -0.16],
          [-0.21, 0.21 + j * 0.19, -0.17],
          [0.12, 0.35 + j * 0.12, -0.18],
          [0.56, 0.48 + j * 0.17, -0.17],
        ],
        0.013,
        { bumpScale: 0.002 },
      );
  }
  group.updateMatrixWorld(true);
  return {
    group,
    meshes,
    paths,
    textures,
    anatomy: view === "organs" || view === "flow" ? ANATOMY : null,
  };
}
