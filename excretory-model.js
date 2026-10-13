/* Original, simplified anatomical meshes. Each view has its own scale. */
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
const C = {
  kidney: 0xb95858,
  cortex: 0xe99684,
  medulla: 0xb54e61,
  urine: 0xe7bd68,
  artery: 0xcc4e5c,
  vein: 0x5486b9,
  tube: 0xe4a878,
  capsule: 0xf4d6b0,
};
export function createExcretoryModel(view) {
  const group = new THREE.Group();
  const meshes = [];
  const paths = [];
  function add(geometry, color, name) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.03,
      }),
    );
    mesh.userData.structure = name;
    mesh.name = name;
    group.add(mesh);
    meshes.push(mesh);
    return mesh;
  }
  function ellipsoid(name, color, x, y, z, sx, sy, sz) {
    const m = add(new THREE.SphereGeometry(1, 40, 28), color, name);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  }
  function tube(name, color, points, r = 0.065) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const m = add(new THREE.TubeGeometry(curve, 72, r, 12, false), color, name);
    return { mesh: m, curve };
  }
  function kidneyShape() {
    const s = new THREE.Shape();
    s.moveTo(0.3, 0.7);
    s.bezierCurveTo(-0.05, 1.04, -0.72, 0.88, -0.73, 0.16);
    s.bezierCurveTo(-0.85, -0.64, -0.2, -1.03, 0.28, -0.64);
    s.bezierCurveTo(0.48, -0.39, 0.01, -0.28, 0.01, -0.01);
    s.bezierCurveTo(0.01, 0.22, 0.57, 0.4, 0.3, 0.7);
    return s;
  }
  function bean(name, color, x, y, z, mirror = false, depth = 0.38) {
    const g = new THREE.ExtrudeGeometry(kidneyShape(), {
      depth,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 0.075,
      bevelThickness: 0.07,
      curveSegments: 40,
    });
    g.translate(0, 0, -depth / 2);
    const m = add(g, color, name);
    m.position.set(x, y, z);
    if (mirror) m.scale.x = -1;
    return m;
  }
  function wholeKidney(name, x, y, mirror) {
    // Closed, convex bean surface from concentric contour rings, not a flat extrusion.
    const boundary = kidneyShape().getSpacedPoints(112),
      positions = [],
      indices = [];
    const rings = 18,
      N = boundary.length;
    for (let side = 0; side < 2; side++)
      for (let j = 0; j <= rings; j++) {
        const r = Math.sin(((j / rings) * Math.PI) / 2);
        for (const p of boundary)
          positions.push(
            -0.2 + (p.x + 0.2) * r,
            p.y * r,
            (side === 0 ? 1 : -1) *
              Math.cos(((j / rings) * Math.PI) / 2) *
              0.34,
          );
      }
    const offset = (rings + 1) * N;
    for (let side = 0; side < 2; side++)
      for (let j = 0; j < rings; j++)
        for (let k = 0; k < N; k++) {
          const a = side * offset + j * N + k,
            b = side * offset + j * N + ((k + 1) % N),
            c = a + N,
            d = b + N;
          indices.push(
            ...(side === 0 ? [a, b, c, b, d, c] : [a, c, b, b, c, d]),
          );
        }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const m = add(g, C.kidney, name);
    m.position.set(x, y, 0);
    if (mirror) m.scale.x = -1;
    return m;
  }
  if (view === "organs" || view === "flow") {
    // Anterior view: patient's right is at the viewer's left.
    wholeKidney("Right kidney", -0.77, 0.68, false);
    wholeKidney("Left kidney", 0.77, 0.87, true);
    ellipsoid("Urinary bladder", 0xd99786, 0, -1.13, 0, 0.48, 0.34, 0.29);
    const left = tube(
      "Ureters",
      C.urine,
      [
        [-0.75, 0.43, 0.05],
        [-0.56, 0.13, 0.05],
        [-0.5, -0.47, 0.05],
        [-0.26, -1.05, 0.04],
      ],
      0.052,
    );
    const right = tube(
      "Ureters",
      C.urine,
      [
        [0.75, 0.62, 0.05],
        [0.56, 0.17, 0.05],
        [0.5, -0.47, 0.05],
        [0.26, -1.05, 0.04],
      ],
      0.052,
    );
    const exit = tube(
      "Urethra",
      C.urine,
      [
        [0, -1.38, 0],
        [0, -1.61, 0],
        [0, -1.83, 0],
      ],
      0.07,
    );
    paths.push(left.curve, right.curve, exit.curve);
    for (const side of [-1, 1]) {
      const y = side === -1 ? 0.68 : 0.87;
      tube(
        "Renal artery",
        C.artery,
        [
          [side * 0.06, y + 0.05, 0.16],
          [side * 0.34, y + 0.08, 0.16],
          [side * 0.77, y + 0.06, 0.15],
        ],
        0.065,
      );
      tube(
        "Renal vein",
        C.vein,
        [
          [side * 0.77, y - 0.07, 0.21],
          [side * 0.34, y - 0.11, 0.21],
          [side * 0.06, y - 0.09, 0.21],
        ],
        0.072,
      );
    }
  } else if (view === "kidney") {
    const cortex = bean("Renal cortex", C.cortex, 0, 0, 0, false, 0.24);
    cortex.scale.set(1.7, 1.7, 1);
    // Broad planar cut face with individual pyramids converging toward calyces.
    for (const [x, y, width] of [
      [-0.25, 1.19, 0.3],
      [-0.76, 0.85, 0.32],
      [-0.98, 0.28, 0.33],
      [-0.92, -0.38, 0.34],
      [-0.64, -0.98, 0.32],
      [-0.12, -1.18, 0.27],
    ]) {
      const tip = new THREE.Vector2(-0.1, y * 0.43),
        base = new THREE.Vector2(x, y),
        direction = tip.clone().sub(base).normalize(),
        cross = new THREE.Vector2(-direction.y, direction.x).multiplyScalar(
          width,
        );
      const l = base.clone().add(cross),
        r = base.clone().sub(cross);
      const pyramid = new THREE.Shape();
      pyramid.moveTo(l.x, l.y);
      pyramid.quadraticCurveTo(
        base.x - direction.x * 0.07,
        base.y - direction.y * 0.07,
        r.x,
        r.y,
      );
      pyramid.quadraticCurveTo(
        (r.x + tip.x) / 2,
        (r.y + tip.y) / 2,
        tip.x,
        tip.y,
      );
      pyramid.quadraticCurveTo((l.x + tip.x) / 2, (l.y + tip.y) / 2, l.x, l.y);
      const g = new THREE.ExtrudeGeometry(pyramid, {
        depth: 0.09,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.025,
        bevelSegments: 3,
        curveSegments: 12,
      });
      const m = add(g, C.medulla, "Renal medulla");
      m.position.z = 0.19;
      tube(
        "Renal calyces",
        C.urine,
        [
          [tip.x, tip.y, 0.34],
          [0.02, y * 0.3, 0.34],
          [0.13, y * 0.2, 0.34],
        ],
        0.07,
      );
      // Fine radial collecting texture contained within each medullary pyramid.
      for (const f of [-0.55, 0, 0.55]) {
        const start = base.clone().add(cross.clone().multiplyScalar(f));
        tube(
          "Renal medulla",
          0xcd7781,
          [
            [start.x, start.y, 0.33],
            [(start.x + tip.x) / 2, (start.y + tip.y) / 2, 0.33],
            [tip.x, tip.y, 0.33],
          ],
          0.008,
        );
      }
    }
    ellipsoid("Renal pelvis", C.urine, 0.03, 0, 0.27, 0.25, 0.5, 0.12);
    tube(
      "Ureter",
      C.urine,
      [
        [0.1, -0.25, 0.3],
        [0.37, -0.65, 0.2],
        [0.43, -1.55, 0.15],
      ],
      0.09,
    );
    tube(
      "Renal artery",
      C.artery,
      [
        [1.08, 0.25, 0.42],
        [0.63, 0.27, 0.42],
        [0.14, 0.15, 0.4],
      ],
      0.085,
    );
    tube(
      "Renal vein",
      C.vein,
      [
        [0.14, -0.04, 0.44],
        [0.67, -0.03, 0.44],
        [1.12, 0.01, 0.44],
      ],
      0.105,
    );
  } else {
    // Corpuscle, proximal tubule, loop, distal tubule and collecting duct.
    const cap = add(
      new THREE.SphereGeometry(
        0.4,
        40,
        28,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      ),
      C.capsule,
      "Bowman’s capsule",
    );
    cap.rotation.x = Math.PI / 2;
    cap.material.side = THREE.DoubleSide;
    cap.position.set(-0.83, 0.92, 0);
    const coil = [];
    for (let i = 0; i <= 85; i++) {
      const a = (i / 85) * Math.PI * 8;
      coil.push([
        -0.83 + Math.cos(a) * 0.22,
        0.93 + Math.sin(a) * 0.19,
        0.15 + Math.sin(a * 1.9) * 0.09,
      ]);
    }
    tube("Glomerulus", C.artery, coil, 0.036);
    tube(
      "Afferent arteriole",
      C.artery,
      [
        [-1.47, 1.19, 0.1],
        [-1.17, 1.18, 0.12],
        [-0.93, 1.03, 0.15],
      ],
      0.07,
    );
    tube(
      "Efferent arteriole",
      C.artery,
      [
        [-0.74, 1.05, 0.15],
        [-0.59, 1.32, 0.12],
        [-0.31, 1.26, 0.1],
      ],
      0.042,
    );
    tube(
      "Proximal tubule",
      C.tube,
      [
        [-0.65, 0.64, 0],
        [-0.36, 0.51, 0],
        [-0.18, 0.83, 0],
        [0.08, 0.51, 0],
        [-0.1, 0.24, 0],
        [-0.35, 0.38, 0],
        [-0.48, 0.12, 0],
      ],
      0.085,
    );
    tube(
      "Loop of Henle",
      C.tube,
      [
        [-0.48, 0.12, 0],
        [-0.48, -0.58, 0],
        [-0.44, -1.27, 0],
        [-0.15, -1.42, 0],
        [0.11, -1.18, 0],
        [0.11, -0.48, 0],
        [0.1, 0.14, 0],
      ],
      0.06,
    );
    tube(
      "Distal tubule",
      C.tube,
      [
        [0.1, 0.14, 0],
        [0.4, 0.32, 0],
        [0.4, 0.62, 0],
        [0.13, 0.88, 0],
        [0.46, 1.07, 0],
        [0.66, 0.75, 0],
        [0.98, 0.57, 0],
      ],
      0.07,
    );
    tube(
      "Collecting duct",
      C.urine,
      [
        [0.98, 1.35, 0],
        [0.98, 0.57, 0],
        [0.98, -0.58, 0],
        [0.98, -1.5, 0],
      ],
      0.11,
    );
    tube(
      "Peritubular capillaries",
      C.vein,
      [
        [-0.31, 1.26, -0.19],
        [0.7, 1.4, -0.19],
        [0.67, 0.04, -0.19],
        [0.53, -1.45, -0.19],
        [-0.68, -1.53, -0.19],
        [-0.78, -0.18, -0.19],
        [-1.02, 0.46, -0.19],
      ],
      0.028,
    );
    for (const y of [-0.5, -0.1, 0.3, 0.6])
      tube(
        "Peritubular capillaries",
        C.vein,
        [
          [-0.73, y, -0.18],
          [-0.1, y + 0.08, -0.18],
          [0.65, y, -0.18],
        ],
        0.02,
      );
  }
  return { group, meshes, paths };
}
