# Antagonistic elbow movement lab

The original `#mq-pairs` foundation activity is replaced by **Two muscles. One
moving team.** It is rendered in the same position between contraction/relaxation
and the everyday muscle roles. The existing mission illustrations are untouched.

`muscle-pair.js` owns the angle slider, animation clock, anatomy explanations and
three discovery challenges. `muscle-pair-view.js` supplies an on-demand Three.js
view with OrbitControls. `muscle-pair-model.js` supplies the anatomical mesh rig.
No framework, model service or new runtime package is required.

## Anatomy and movement

- The left clavicle, scapula, humerus, radius and ulna are extracted from the
  existing BodyParts3D skeletal atlas. Two biceps heads and three triceps heads
  come from the muscular atlas. The approximately 0.48 MB GLB contains only this
  arm anatomy. `build-arm-asset.py` decodes quantized/interleaved accessors, bakes
  transforms and removes distal muscle tips replaced by generated tendon routes.
- The shoulder and humerus stay fixed. Radius and ulna share one elbow hinge,
  rotating from 0 to 130 degrees of flexion. Their vertices and bone lengths do
  not change. The forearm stays supinated; pronation is not simulated.
- The biceps insertion is on the medial proximal radius; the triceps insertion
  is on the olecranon of the ulna. Both markers use actual atlas bone-surface
  vertices. Dynamic tube endpoints follow those exact rigid forearm coordinates.
- Biceps belly length decreases during flexion; triceps belly length increases.
  Longitudinal deformation and radial expansion illustrate changing muscle shape.
  Muscle-head meshes preserve the recognisable atlas anatomy. Proximal attachment
  regions remain supported by the fixed upper-arm anatomy.
- Tendon routes retain their lengths as the joint moves. The biceps route uses
  a nearly straight quadratic curve; the triceps route solves for a fixed-length
  quadratic curve around a posterior elbow guide. Gold arrows indicate pull
  toward the muscle. A target arc and beacon indicate a challenge's angle zone.
- Activation follows the **direction of motion**, including when a slider moves
  backward while already bent. It is not inferred from the absolute angle. A
  paused pose labels both muscles “At this pose” rather than claiming either
  must be actively contracting. The last movement is recorded independently.

This is a reconstruction for anatomy teaching, not a validated force/torque or
musculoskeletal simulation. The scientific notes explain active unloaded motion,
other elbow flexors, coactivation and eccentric biceps action when lowering a
load. Sources: BodyParts3D (attribution in `assets/muscular/ATTRIBUTION.md`) and
OpenStax *Anatomy and Physiology 2e*, upper-limb muscles.

## Guided discovery

All three challenges and their questions can be opened in any order:

1. Identify biceps as the active flexor, then bend into the 100–120 degree zone.
2. Identify triceps as the active extensor, then straighten into 10–30 degrees.
3. Inspect the tendons and identify their muscle-to-bone connection.

A correct answer and the corresponding observation earn one discovery star.
Repeated actions do not duplicate stars. Stars belong to the current activity
visit; lesson XP, rewards, mission gates and saved learner progress are unchanged.
Free exploration remains available throughout.

The initial SVG is a live anatomical fallback, with a hinge, paired muscles,
fascicle lines and fixed-length tendon curves. It remains fully interactive if
WebGL or the GLB cannot load. Reduced motion shows the requested endpoint without
an automatic transition. Keyboard range input works for anatomy and challenges.
On phones the anatomy view stays visible while the controls scroll below it.
The controllers, observers, animation frames and GPU resources are disposed on
route changes. Rendering pauses outside the viewport or in a hidden document.

## Verification

Run `python3 _dev-tools/verify-arm-lab.py` with Python Playwright and Chromium.
It starts its own local server, uses isolated browser storage and checks actual
bone/tendon geometry, movement direction, animation/pause, challenge rules,
transparent selection, progress preservation, mobile, reduced motion, SVG fallback
and failed-asset recovery. The shared studio has its independent regression suite
in `verify-muscle-studio.py`.
