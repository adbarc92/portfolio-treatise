# WebGL 3D Gear System Background Design

## Overview

Replace the SVG gear background with a full WebGL 3D scene using Three.js. True 3D extruded involute gears with PBR metallic materials, real-time lighting, bloom, depth of field, and exotic gear types (helical, bevel, planetary). Camera tilted ~12 degrees from vertical to show gear thickness and edge bevels.

Builds on the existing involute math in `src/lib/gears.ts` for 2D profile generation, then extrudes into 3D geometry.

## 3D Gear Geometry

### Base Gear Mesh

- Take involute 2D profile points from existing `generateInvoluteGearPath` logic
- Convert to Three.js `Shape` (array of Vector2 points)
- Extrude via `ExtrudeGeometry`:
  - `depth`: proportional to gear pitch radius (large gears thicker)
  - `bevelEnabled: true`, `bevelThickness` and `bevelSize` for chamfered edges
  - `bevelSegments: 2` for smooth chamfer

### Per-Gear Detail Elements (child meshes)

- **Hub/boss:** `CylinderGeometry` at center, slightly taller than gear body, same material
- **Bolt holes:** 4-6 small `CylinderGeometry` dark cylinders on gear face, evenly spaced around hub
- **Keyway:** Small `BoxGeometry` notch cut into the center bore
- **Spokes:** Existing spoke window cutouts extruded as through-holes (or rendered as recessed areas)
- **Rim lip:** Slightly thicker ring at the outer edge via a torus or additional extrusion

### Exotic Gear Types

**Helical gears (2-3 in mid layer):**
- Same involute profile but `ExtrudeGeometry` with `extrudePath` as a helical curve
- Alternative: apply a twist via custom vertex shader or manual vertex manipulation post-extrusion
- Teeth spiral along the depth axis at ~15-20 degree helix angle

**Bevel gear pair (1 pair in front layer):**
- Conical gear geometry: scale the profile from full size at one face to reduced size at the other
- Two gears rendered at 90 degrees to each other, meshing at intersection
- One horizontal, one vertical

**Planetary gear set (1 in mid layer, hero element):**
- **Sun gear:** Small central gear, drives the system
- **Planet gears:** 3 gears orbiting the sun, meshing with both sun and ring
- **Ring gear:** Large internal gear (teeth face inward), stationary or slow counter-rotation
- All derived from involute profiles with correct tooth counts for meshing:
  - Ring teeth = Sun teeth + 2 * Planet teeth
  - Example: Sun 12T, Planet 9T, Ring 30T
- Planets orbit at rate: sun_speed * sun_teeth / (sun_teeth + ring_teeth)

## Materials (PBR)

All materials use `MeshStandardMaterial`.

### Steel (primary)
- `color: #8090a0` (blue-grey)
- `metalness: 0.85`
- `roughness: 0.35`
- Applied to most standard spur gears

### Brass (accent)
- `color: #c8a44e` (matching `--color-gear-accent`)
- `metalness: 0.9`
- `roughness: 0.25`
- Applied to hero gears, planetary sun gear, select front-layer gears

### Dark Iron (back layer)
- `color: #3a3d4a` (dark grey)
- `metalness: 0.7`
- `roughness: 0.5`
- Applied to all back-layer gears

### Environment Map
- Generated procedurally via `PMREMGenerator` from a simple gradient or minimal scene
- Alternatively: tiny embedded HDRI (< 50KB) for studio reflections
- Critical for making metallic materials look realistic

## Lighting

- **Key light:** `DirectionalLight`, upper-left, warm white `#fff5e6`, intensity 1.5
- **Fill light:** `PointLight`, lower-right, cool blue `#6688aa`, intensity 0.3
- **Ambient:** `AmbientLight`, intensity 0.15, neutral
- **Rim light (optional):** `DirectionalLight` from behind, low intensity, creates edge highlights

## Post-Processing (EffectComposer)

- **RenderPass:** Base scene render
- **UnrealBloomPass:** Subtle bloom on specular highlights (`strength: 0.3`, `radius: 0.5`, `threshold: 0.85`)
- **BokehPass:** Depth of field — back-layer gears slightly out of focus (`focus` set to mid-layer depth, `aperture: 0.002`, `maxblur: 0.005`)
- **OutputPass:** Final tone mapping output
- **Tone mapping:** `ACESFilmicToneMapping` on renderer for cinematic contrast

## Camera

- **Type:** `PerspectiveCamera`
- **FOV:** 30 degrees (narrow, reduces distortion)
- **Position:** Above scene, tilted ~12 degrees from vertical
  - Looking at scene center
  - Position: `(0, sceneHeight * 0.9, sceneDepth * 0.2)` approximately
- **No orbit controls** — fixed camera, background only
- **Near/far:** Set to encompass full gear layout with margin

## Scene Layout

### Layer Depth (Z-axis)

- Back: z = -50 (farthest from camera)
- Mid: z = 0 (center)
- Front: z = 50 (closest to camera)

### Gear Positions

- Reuse existing `createGearLayout()` for X/Y positions
- Map viewport coordinates to Three.js world units (scale factor from viewport to scene)
- 3 chains: back (~9 gears), mid (~11 gears), front (~7 gears) = ~27 standard gears
- Plus exotic types:
  - 2-3 helical gears replace standard gears in mid layer
  - 1 bevel pair replaces 2 standard gears in front layer
  - 1 planetary set (sun + 3 planets + ring = 5 visual elements) replaces 1 gear in mid layer
- Total visual gear elements: ~32

## Animation

### Rotation

- Single `requestAnimationFrame` via Three.js renderer
- Root gear of each chain: constant angular velocity (same speeds as current: 0.08, 0.12, 0.15 deg/frame)
- Child gears: angle = rootAngle * gearRatio * direction + phaseOffset
- Gears rotate around their local Y-axis (vertical from camera perspective)

### Helical Gears

- Same rotation as standard gears — twist is baked into geometry

### Bevel Gear Pair

- One gear rotates around Y-axis, the other around X-axis (or Z-axis)
- Gear ratio 1:1 (same tooth count), perpendicular axes

### Planetary Set

- Sun gear: rotates at its chain speed
- Planet gears: orbit around sun at `sun_speed * sun_teeth / (sun_teeth + ring_teeth)`
- Each planet also rotates on its own axis at `sun_speed * sun_teeth / planet_teeth` (opposite direction)
- Ring gear: stationary or very slow counter-rotation

### Frame Management

- `renderer.setAnimationLoop(animate)` — Three.js managed loop
- Delta-time for frame-rate independence
- Gear train math: multiplication from root (no drift)

## React Integration

- `GearBackground.tsx` renders a `<canvas>` element (replaces `<svg>`)
- `useEffect` on mount:
  - Create Three.js `WebGLRenderer` attached to canvas
  - Create scene, camera, lights, post-processing
  - Generate gear meshes and add to scene
  - Start animation loop
- `useEffect` cleanup: dispose all geometries, materials, textures, renderer
- Resize handler: update camera aspect ratio, renderer size, post-processing resolution
- Canvas styled identically to previous SVG: `position: fixed, top: 0, left: 0, 100vw x 100vh, z-index: 0, pointer-events: none`

## File Architecture

### New Dependency

`three` (includes TypeScript types). Three.js addons used for post-processing (imported from `three/addons/postprocessing/*`).

### Files

- **Keep:** `src/lib/gears.ts` — Add new export `getInvoluteProfilePoints(teeth, module)` returning `[number, number][]` for Three.js Shape construction. Keep existing SVG path functions (may be useful for fallback).
- **Create:** `src/lib/gear-scene.ts` — Scene setup: renderer, camera, lights, post-processing, environment map. Exports `initScene(canvas)`, `destroyScene()`, `resizeScene(w, h)`.
- **Create:** `src/lib/gear-meshes.ts` — Geometry generation: standard gear extrusion, helical twist, bevel pair, planetary set, detail elements (hub, bolts, keyway). Exports `createGearMesh(gear, material)`, `createHelicalGearMesh(...)`, `createBevelPair(...)`, `createPlanetarySet(...)`.
- **Create:** `src/lib/gear-materials.ts` — PBR material definitions and environment map. Exports `createGearMaterials(envMap)`.
- **Create:** `src/lib/gear-animation.ts` — Animation loop: rotation propagation, planetary orbit, frame timing. Exports `createAnimationLoop(scene, chains)`, `startAnimation()`, `stopAnimation()`.
- **Rewrite:** `src/components/GearBackground.tsx` — Canvas element + Three.js lifecycle.

### No Changes

Layout.tsx, NavBar.tsx, pages, content pipeline, routing, styles, index.css.

## Performance Notes

- ~32 gear meshes, each with ~500-2000 triangles = ~30K-60K triangles total. Trivial for WebGL.
- Post-processing adds 2-3 full-screen passes. Manageable.
- Environment map generation is one-time cost on init.
- Geometry generated once, only transforms update per frame.
- Three.js handles draw call batching internally.
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` to cap at 2x for performance.
