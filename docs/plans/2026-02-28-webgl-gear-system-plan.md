# WebGL 3D Gear System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the SVG gear background with a Three.js WebGL scene featuring 3D extruded involute gears with PBR materials, real-time lighting, bloom, depth of field, and exotic gear types.

**Architecture:** Keep existing involute math in `gears.ts`, add a point-export function. Create 4 new lib files for Three.js scene, meshes, materials, and animation. Rewrite `GearBackground.tsx` to render a canvas and manage the Three.js lifecycle.

**Tech Stack:** Three.js (WebGLRenderer, ExtrudeGeometry, MeshStandardMaterial, EffectComposer, UnrealBloomPass, BokehPass), React 19, TypeScript

**Design doc:** `docs/plans/2026-02-28-webgl-gear-system-design.md`

---

### Task 1: Install Three.js and Add Profile Point Export

**Files:**
- Modify: `src/lib/gears.ts` (add one new exported function)
- Modify: `package.json` (add `three` dependency)

**Step 1: Install Three.js**

Run: `npm install three`
Run: `npm install -D @types/three`

**Step 2: Add profile point export to gears.ts**

Add this function to the end of `src/lib/gears.ts`, just before the `computeGearPaths` function:

```typescript
/**
 * Return the involute gear profile as an array of [x, y] points (at origin).
 * Used by Three.js gear mesh generation to construct a Shape.
 */
export function getInvoluteProfilePoints(
  teeth: number,
  mod: number,
  pressureAngleDeg: number = DEFAULT_PRESSURE_ANGLE,
): [number, number][] {
  const alpha = pressureAngleDeg * DEG;
  const pitchR = (mod * teeth) / 2;
  const baseR = pitchR * Math.cos(alpha);
  const outerR = pitchR + ADDENDUM_FACTOR * mod;
  const rootR = Math.max(pitchR - DEDENDUM_FACTOR * mod, baseR * 0.95);

  const invAlpha = Math.tan(alpha) - alpha;
  const halfToothAngle = Math.PI / (2 * teeth) + invAlpha;

  const tRoot = baseR > rootR ? 0 : involuteAngleAtRadius(baseR, Math.max(rootR, baseR));
  const tOuter = involuteAngleAtRadius(baseR, outerR);

  const toothAngle = (2 * Math.PI) / teeth;
  const effectiveRootR = Math.max(rootR, baseR);
  const points: [number, number][] = [];

  for (let i = 0; i < teeth; i++) {
    const toothCenterAngle = i * toothAngle;

    // Right flank (root to tip)
    for (let s = 0; s <= INVOLUTE_SEGMENTS; s++) {
      const t = tRoot + (tOuter - tRoot) * (s / INVOLUTE_SEGMENTS);
      const [ix, iy] = involutePoint(baseR, t);
      const r = Math.sqrt(ix * ix + iy * iy);
      const ptAngle = Math.atan2(iy, ix);
      const finalAngle = ptAngle + toothCenterAngle + halfToothAngle - involutePolarAngle(t);
      points.push([r * Math.cos(finalAngle), r * Math.sin(finalAngle)]);
    }

    // Tip arc: sample a few points along the outer radius
    const lastRight = points[points.length - 1];
    const rightTipAngle = Math.atan2(lastRight[1], lastRight[0]);
    // Compute left flank tip position
    const tOuterPolar = involutePolarAngle(tOuter);
    const leftTipAngle = -Math.atan2(
      ...(() => {
        const [ix, iy] = involutePoint(baseR, tOuter);
        const ptAngle = Math.atan2(iy, ix);
        const finalAngle = -ptAngle + toothCenterAngle - halfToothAngle + tOuterPolar;
        return [outerR * Math.sin(finalAngle), outerR * Math.cos(finalAngle)] as [number, number];
      })(),
    );
    // Actually, let's simplify: just add 2 interpolated points along the tip arc
    const leftFlankTipAngle = (() => {
      const [ix, iy] = involutePoint(baseR, tOuter);
      const r = Math.sqrt(ix * ix + iy * iy);
      const ptAngle = Math.atan2(iy, ix);
      return -ptAngle + toothCenterAngle - halfToothAngle + involutePolarAngle(tOuter);
    })();
    const tipArcSpan = leftFlankTipAngle - rightTipAngle;
    for (let s = 1; s <= 2; s++) {
      const a = rightTipAngle + tipArcSpan * (s / 3);
      points.push([outerR * Math.cos(a), outerR * Math.sin(a)]);
    }

    // Left flank (tip to root, mirrored)
    for (let s = INVOLUTE_SEGMENTS; s >= 0; s--) {
      const t = tRoot + (tOuter - tRoot) * (s / INVOLUTE_SEGMENTS);
      const [ix, iy] = involutePoint(baseR, t);
      const r = Math.sqrt(ix * ix + iy * iy);
      const ptAngle = Math.atan2(iy, ix);
      const finalAngle = -ptAngle + toothCenterAngle - halfToothAngle + involutePolarAngle(t);
      points.push([r * Math.cos(finalAngle), r * Math.sin(finalAngle)]);
    }

    // Root arc: interpolate along root circle to next tooth
    if (i < teeth - 1) {
      const nextToothCenter = (i + 1) * toothAngle;
      const nextRightStart = nextToothCenter + halfToothAngle;
      const curLeftEnd = Math.atan2(points[points.length - 1][1], points[points.length - 1][0]);
      // Compute the start angle of next tooth's right flank at root
      const nextStartPt = (() => {
        const t = tRoot;
        const [ix, iy] = involutePoint(baseR, t);
        const r = Math.sqrt(ix * ix + iy * iy);
        const ptAngle = Math.atan2(iy, ix);
        const finalAngle = ptAngle + nextToothCenter + halfToothAngle - involutePolarAngle(t);
        return finalAngle;
      })();
      // Add one midpoint on the root arc
      const midAngle = (curLeftEnd + nextStartPt) / 2;
      points.push([effectiveRootR * Math.cos(midAngle), effectiveRootR * Math.sin(midAngle)]);
    }
  }

  return points;
}
```

**Actually — the tip arc computation above is getting overly complicated.** The implementer should take a simpler approach: extract the point-generation logic from the existing `generateInvoluteGearPath` function. That function already computes all the right/left flank points correctly. Instead of building SVG path strings, return the raw `[x, y]` coordinates.

**Simplified approach for the implementer:**

Refactor `generateInvoluteGearPath` to internally use a shared point-generation function, then export that function. Or more simply: parse-free approach — just duplicate the loop logic but push `[x, y]` tuples instead of SVG commands. The exact implementation is left to the implementer, but the key contract is:

```typescript
export function getInvoluteProfilePoints(
  teeth: number,
  mod: number,
  pressureAngleDeg?: number,
): [number, number][];
```

Returns a closed polygon of points tracing the full gear profile at origin. Points should be in order around the gear (clockwise or counter-clockwise, consistent).

**Step 3: Run build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/gears.ts
git commit -m "feat: install three.js and add profile point export"
```

---

### Task 2: Gear Materials

**Files:**
- Create: `src/lib/gear-materials.ts`

Create PBR material definitions and a procedural environment map.

**Step 1: Write gear-materials.ts**

```typescript
import * as THREE from 'three';

export interface GearMaterials {
  steel: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  darkIron: THREE.MeshStandardMaterial;
  hub: THREE.MeshStandardMaterial; // slightly different from body
  envMap: THREE.Texture;
}

/**
 * Generate a simple procedural environment map for metallic reflections.
 * Uses a gradient cube texture — no external HDRI needed.
 */
function createEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  // Create a simple scene with gradient background for env map
  const envScene = new THREE.Scene();
  const topColor = new THREE.Color(0x111122);
  const bottomColor = new THREE.Color(0x000000);
  const midColor = new THREE.Color(0x0a0a1a);

  // Use a large sphere with gradient material as environment
  const envGeo = new THREE.SphereGeometry(100, 32, 16);
  const envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: topColor },
      midColor: { value: midColor },
      bottomColor: { value: bottomColor },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 color = h > 0.0
          ? mix(midColor, topColor, h)
          : mix(midColor, bottomColor, -h);
        // Add subtle bright spots for specular reflections
        float spot1 = smoothstep(0.95, 1.0, dot(normalize(vWorldPosition), normalize(vec3(-1, 1, 0.5))));
        float spot2 = smoothstep(0.97, 1.0, dot(normalize(vWorldPosition), normalize(vec3(1, 0.5, -0.3))));
        color += vec3(0.15) * spot1 + vec3(0.08) * spot2;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  const envMesh = new THREE.Mesh(envGeo, envMat);
  envScene.add(envMesh);

  const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
  pmremGenerator.dispose();
  envGeo.dispose();
  envMat.dispose();

  return envMap;
}

/**
 * Create all gear materials with a shared environment map.
 */
export function createGearMaterials(renderer: THREE.WebGLRenderer): GearMaterials {
  const envMap = createEnvMap(renderer);

  const steel = new THREE.MeshStandardMaterial({
    color: 0x8090a0,
    metalness: 0.85,
    roughness: 0.35,
    envMap,
    envMapIntensity: 0.8,
  });

  const brass = new THREE.MeshStandardMaterial({
    color: 0xc8a44e,
    metalness: 0.9,
    roughness: 0.25,
    envMap,
    envMapIntensity: 1.0,
  });

  const darkIron = new THREE.MeshStandardMaterial({
    color: 0x3a3d4a,
    metalness: 0.7,
    roughness: 0.5,
    envMap,
    envMapIntensity: 0.5,
  });

  const hub = new THREE.MeshStandardMaterial({
    color: 0x6a6d7a,
    metalness: 0.8,
    roughness: 0.4,
    envMap,
    envMapIntensity: 0.7,
  });

  return { steel, brass, darkIron, hub, envMap };
}

/**
 * Dispose all materials and textures.
 */
export function disposeGearMaterials(materials: GearMaterials): void {
  materials.steel.dispose();
  materials.brass.dispose();
  materials.darkIron.dispose();
  materials.hub.dispose();
  materials.envMap.dispose();
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Clean (file not imported yet, but should compile standalone)

**Step 3: Commit**

```bash
git add src/lib/gear-materials.ts
git commit -m "feat: add PBR gear materials with procedural environment map"
```

---

### Task 3: Standard Gear Mesh Generation

**Files:**
- Create: `src/lib/gear-meshes.ts`

Convert involute profile points to Three.js ExtrudeGeometry with bevels, hub, bolt holes, and spoke cutouts.

**Step 1: Write the standard gear mesh generator**

```typescript
import * as THREE from 'three';
import { getInvoluteProfilePoints, type PlacedGear } from './gears';
import type { GearMaterials } from './gear-materials';

/**
 * Create a Three.js Shape from involute profile points.
 */
function profileToShape(points: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();
  return shape;
}

/**
 * Create spoke window holes in a shape.
 * Returns an array of Path objects to use as holes in the Shape.
 */
function createSpokeHoles(
  teeth: number,
  mod: number,
  spokeCount: number,
): THREE.Path[] {
  if (teeth < 16) return [];

  const pitchR = (mod * teeth) / 2;
  const rootR = pitchR - 1.25 * mod;
  const holeRadius = rootR * 0.3;
  const hubR = holeRadius + (rootR - holeRadius) * 0.25;
  const rimR = rootR - mod * 0.5;

  if (rimR <= hubR + mod * 0.5) return [];

  const windowAngle = (2 * Math.PI) / spokeCount;
  const spokeHalfWidth = windowAngle * 0.15;
  const windowHalfAngle = windowAngle / 2 - spokeHalfWidth;

  const holes: THREE.Path[] = [];

  for (let i = 0; i < spokeCount; i++) {
    const centerAngle = i * windowAngle;
    const a0 = centerAngle - windowHalfAngle;
    const a1 = centerAngle + windowHalfAngle;

    const path = new THREE.Path();
    // Inner arc start
    path.moveTo(hubR * Math.cos(a0), hubR * Math.sin(a0));
    // Line to outer
    path.lineTo(rimR * Math.cos(a0), rimR * Math.sin(a0));
    // Outer arc
    path.absarc(0, 0, rimR, a0, a1, false);
    // Line back to inner
    path.lineTo(hubR * Math.cos(a1), hubR * Math.sin(a1));
    // Inner arc (reverse)
    path.absarc(0, 0, hubR, a1, a0, true);

    holes.push(path);
  }

  return holes;
}

export interface GearMeshGroup {
  group: THREE.Group;
  gear: PlacedGear;
}

/**
 * Create a 3D gear mesh group (body + hub + bolt holes) for a placed gear.
 */
export function createStandardGearMesh(
  gear: PlacedGear,
  material: THREE.MeshStandardMaterial,
  materials: GearMaterials,
): GearMeshGroup {
  const group = new THREE.Group();
  const { teeth, module: mod } = gear;

  // --- Gear body (extruded involute profile) ---
  const points = getInvoluteProfilePoints(teeth, mod);
  const shape = profileToShape(points);

  // Add spoke holes to shape
  const spokeCount = teeth >= 28 ? 6 : teeth >= 16 ? 4 : 0;
  const spokeHoles = createSpokeHoles(teeth, mod, spokeCount);
  spokeHoles.forEach((hole) => shape.holes.push(hole));

  // Gear thickness proportional to pitch radius
  const thickness = gear.pitchRadius * 0.25;
  const bevelSize = mod * 0.15;

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize: bevelSize,
    bevelSegments: 2,
    curveSegments: 1,
  });

  // Center the extrusion on Z axis
  bodyGeo.translate(0, 0, -thickness / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, material);
  group.add(bodyMesh);

  // --- Hub (cylinder at center, slightly taller) ---
  const holeRadius = gear.pitchRadius * 0.2;
  const hubRadius = holeRadius * 1.5;
  const hubHeight = thickness * 1.4;
  const hubGeo = new THREE.CylinderGeometry(hubRadius, hubRadius, hubHeight, 24);
  hubGeo.rotateX(Math.PI / 2); // Align with Z axis
  const hubMesh = new THREE.Mesh(hubGeo, materials.hub);
  group.add(hubMesh);

  // --- Center bore (dark cylinder to simulate hole) ---
  const boreGeo = new THREE.CylinderGeometry(holeRadius, holeRadius, hubHeight * 1.1, 16);
  boreGeo.rotateX(Math.PI / 2);
  const boreMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0f,
    metalness: 0.3,
    roughness: 0.8,
  });
  const boreMesh = new THREE.Mesh(boreGeo, boreMat);
  group.add(boreMesh);

  // --- Bolt holes (small dark circles on gear face) ---
  const boltCount = spokeCount > 0 ? spokeCount : 4;
  const boltRadius = mod * 0.3;
  const boltOrbitR = hubRadius + (gear.innerRadius - hubRadius) * 0.4;
  const boltGeo = new THREE.CylinderGeometry(boltRadius, boltRadius, thickness * 1.05, 8);
  boltGeo.rotateX(Math.PI / 2);

  for (let i = 0; i < boltCount; i++) {
    const angle = (i * 2 * Math.PI) / boltCount;
    const boltMesh = new THREE.Mesh(boltGeo, boreMat);
    boltMesh.position.set(
      boltOrbitR * Math.cos(angle),
      boltOrbitR * Math.sin(angle),
      0,
    );
    group.add(boltMesh);
  }

  // --- Keyway (small notch in bore) ---
  const keyWidth = holeRadius * 0.3;
  const keyDepth = holeRadius * 0.15;
  const keyGeo = new THREE.BoxGeometry(keyWidth, keyDepth, hubHeight * 1.05);
  const keyMesh = new THREE.Mesh(keyGeo, boreMat);
  keyMesh.position.set(0, holeRadius + keyDepth / 2, 0);
  group.add(keyMesh);

  return { group, gear };
}

/**
 * Dispose all geometries and materials in a gear mesh group.
 */
export function disposeGearMesh(gearMesh: GearMeshGroup): void {
  gearMesh.group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (child.material instanceof THREE.Material) {
        // Only dispose non-shared materials
        if (child.material.color && child.material.color.getHex() === 0x0a0a0f) {
          child.material.dispose();
        }
      }
    }
  });
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: May have minor type issues to fix — resolve them.

**Step 3: Commit**

```bash
git add src/lib/gear-meshes.ts
git commit -m "feat: add standard 3D gear mesh generation with hub, bolts, keyway"
```

---

### Task 4: Exotic Gear Types — Helical, Bevel, Planetary

**Files:**
- Modify: `src/lib/gear-meshes.ts` (add exotic gear creators)

**Step 1: Add helical gear mesh**

Append to `gear-meshes.ts`:

```typescript
/**
 * Create a helical gear — same profile but with twisted extrusion.
 * The twist is achieved by manually rotating vertices along the Z axis.
 */
export function createHelicalGearMesh(
  gear: PlacedGear,
  material: THREE.MeshStandardMaterial,
  materials: GearMaterials,
  helixAngleDeg: number = 18,
): GearMeshGroup {
  // Start with a standard gear mesh
  const result = createStandardGearMesh(gear, material, materials);

  // Apply twist to the gear body (first child mesh)
  const bodyMesh = result.group.children[0] as THREE.Mesh;
  const geo = bodyMesh.geometry;
  const positions = geo.attributes.position;
  const thickness = gear.pitchRadius * 0.25;
  const helixRad = helixAngleDeg * (Math.PI / 180);

  for (let i = 0; i < positions.count; i++) {
    const z = positions.getZ(i);
    // Twist angle proportional to Z position
    const twist = (z / thickness) * helixRad;
    const x = positions.getX(i);
    const y = positions.getY(i);
    const cos = Math.cos(twist);
    const sin = Math.sin(twist);
    positions.setXY(i, x * cos - y * sin, x * sin + y * cos);
  }

  positions.needsUpdate = true;
  geo.computeVertexNormals();

  return result;
}
```

**Step 2: Add bevel gear pair**

Append to `gear-meshes.ts`:

```typescript
/**
 * Create a bevel gear pair — two conical gears meshing at 90 degrees.
 * Returns a group containing both gears.
 */
export function createBevelPair(
  gear1: PlacedGear,
  gear2: PlacedGear,
  material1: THREE.MeshStandardMaterial,
  material2: THREE.MeshStandardMaterial,
  materials: GearMaterials,
): { group: THREE.Group; gear1Mesh: THREE.Group; gear2Mesh: THREE.Group } {
  const group = new THREE.Group();

  // Create standard gear meshes for each
  const mesh1 = createStandardGearMesh(gear1, material1, materials);
  const mesh2 = createStandardGearMesh(gear2, material2, materials);

  // Apply conical taper to gear body vertices (narrower on one end)
  [mesh1, mesh2].forEach((m) => {
    const bodyMesh = m.group.children[0] as THREE.Mesh;
    const geo = bodyMesh.geometry;
    const positions = geo.attributes.position;
    const thickness = m.gear.pitchRadius * 0.25;

    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i);
      // Taper: full size at z=-thickness/2, 70% at z=+thickness/2
      const taper = 1.0 - 0.3 * ((z + thickness / 2) / thickness);
      const x = positions.getX(i);
      const y = positions.getY(i);
      positions.setXY(i, x * taper, y * taper);
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
  });

  // Position gear2 at 90 degrees to gear1
  mesh1.group.position.set(0, 0, 0);
  const centerDist = gear1.pitchRadius + gear2.pitchRadius;
  mesh2.group.position.set(centerDist * 0.7, 0, 0);
  mesh2.group.rotation.set(0, Math.PI / 2, 0); // Rotate 90 degrees

  group.add(mesh1.group);
  group.add(mesh2.group);

  return { group, gear1Mesh: mesh1.group, gear2Mesh: mesh2.group };
}
```

**Step 3: Add planetary gear set**

Append to `gear-meshes.ts`:

```typescript
export interface PlanetarySet {
  group: THREE.Group;
  sunMesh: THREE.Group;
  planetMeshes: THREE.Group[];
  planetCarrier: THREE.Group; // Group that orbits, contains planets
  ringMesh: THREE.Group;
  sunTeeth: number;
  planetTeeth: number;
  ringTeeth: number;
}

/**
 * Create a planetary gear set: sun + 3 planets + ring gear.
 * Ring teeth = sun teeth + 2 * planet teeth.
 */
export function createPlanetarySet(
  cx: number,
  cy: number,
  mod: number,
  sunTeeth: number,
  materials: GearMaterials,
): PlanetarySet {
  const planetTeeth = Math.round((sunTeeth * 0.75));
  const ringTeeth = sunTeeth + 2 * planetTeeth;

  const group = new THREE.Group();
  const planetCount = 3;

  // --- Sun gear ---
  const sunPitchR = (mod * sunTeeth) / 2;
  const sunGear: PlacedGear = {
    teeth: sunTeeth,
    module: mod,
    cx: 0, cy: 0,
    spec: { teeth: sunTeeth, module: mod },
    pitchRadius: sunPitchR,
    outerRadius: sunPitchR + mod,
    innerRadius: sunPitchR - 1.25 * mod,
    baseRadius: sunPitchR * Math.cos(20 * Math.PI / 180),
    parentIndex: null,
    layer: 'mid',
    phaseOffset: 0,
    gearRatio: 1,
    direction: 1,
  };
  const sunResult = createStandardGearMesh(sunGear, materials.brass, materials);
  group.add(sunResult.group);

  // --- Planet carrier (invisible group that rotates) ---
  const planetCarrier = new THREE.Group();
  group.add(planetCarrier);

  // --- Planet gears ---
  const planetPitchR = (mod * planetTeeth) / 2;
  const orbitR = sunPitchR + planetPitchR; // center distance sun-planet
  const planetMeshes: THREE.Group[] = [];

  for (let i = 0; i < planetCount; i++) {
    const angle = (i * 2 * Math.PI) / planetCount;
    const planetGear: PlacedGear = {
      teeth: planetTeeth,
      module: mod,
      cx: 0, cy: 0,
      spec: { teeth: planetTeeth, module: mod },
      pitchRadius: planetPitchR,
      outerRadius: planetPitchR + mod,
      innerRadius: planetPitchR - 1.25 * mod,
      baseRadius: planetPitchR * Math.cos(20 * Math.PI / 180),
      parentIndex: 0,
      layer: 'mid',
      phaseOffset: 0,
      gearRatio: sunTeeth / planetTeeth,
      direction: -1,
    };
    const planetResult = createStandardGearMesh(planetGear, materials.steel, materials);
    planetResult.group.position.set(
      orbitR * Math.cos(angle),
      orbitR * Math.sin(angle),
      0,
    );
    planetCarrier.add(planetResult.group);
    planetMeshes.push(planetResult.group);
  }

  // --- Ring gear (internal teeth — approximated as a thick ring) ---
  const ringPitchR = (mod * ringTeeth) / 2;
  const ringOuterR = ringPitchR + mod * 2;
  const ringInnerR = ringPitchR - mod;

  // Create ring as a hollow cylinder (torus-like shape)
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, ringOuterR, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, ringInnerR, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);

  const ringThickness = sunPitchR * 0.2;
  const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
    depth: ringThickness,
    bevelEnabled: true,
    bevelSize: mod * 0.1,
    bevelThickness: mod * 0.1,
    bevelSegments: 1,
    curveSegments: 64,
  });
  ringGeo.translate(0, 0, -ringThickness / 2);
  const ringMesh = new THREE.Mesh(ringGeo, materials.darkIron);
  const ringGroup = new THREE.Group();
  ringGroup.add(ringMesh);
  group.add(ringGroup);

  // Position the whole set
  group.position.set(cx, cy, 0);

  return {
    group,
    sunMesh: sunResult.group,
    planetMeshes,
    planetCarrier,
    ringMesh: ringGroup,
    sunTeeth,
    planetTeeth,
    ringTeeth,
  };
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Clean or minor fixable issues

**Step 3: Commit**

```bash
git add src/lib/gear-meshes.ts
git commit -m "feat: add helical gears, bevel pair, and planetary gear set"
```

---

### Task 5: Scene Setup — Renderer, Camera, Lights, Post-Processing

**Files:**
- Create: `src/lib/gear-scene.ts`

**Step 1: Write the scene setup module**

```typescript
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export interface GearScene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  composer: EffectComposer;
}

/**
 * Initialize the Three.js scene, camera, lights, and post-processing.
 */
export function initScene(canvas: HTMLCanvasElement): GearScene {
  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true, // transparent background so page bg shows through if needed
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // --- Scene ---
  const scene = new THREE.Scene();
  scene.background = null; // transparent — CSS background handles page color

  // --- Camera ---
  // Narrow FOV, slight tilt from vertical
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(30, aspect, 1, 5000);

  // Position above, looking down at slight angle (~12 deg from vertical)
  const sceneRadius = Math.min(window.innerWidth, window.innerHeight) * 0.5;
  camera.position.set(0, 0, sceneRadius * 2.5);
  camera.lookAt(0, 0, 0);
  // Tilt slightly by adjusting up vector or rotating
  camera.position.y = sceneRadius * 0.5; // slight upward offset
  camera.lookAt(0, 0, 0);

  // --- Lights ---
  // Key light: warm white from upper-left
  const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
  keyLight.position.set(-sceneRadius, sceneRadius * 1.5, sceneRadius * 2);
  scene.add(keyLight);

  // Fill light: cool blue from lower-right
  const fillLight = new THREE.PointLight(0x6688aa, 0.3);
  fillLight.position.set(sceneRadius, -sceneRadius * 0.5, sceneRadius);
  scene.add(fillLight);

  // Ambient
  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambient);

  // Rim light: edge highlights from behind
  const rimLight = new THREE.DirectionalLight(0x8899bb, 0.4);
  rimLight.position.set(0, 0, -sceneRadius * 2);
  scene.add(rimLight);

  // --- Post-processing ---
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,  // strength
    0.5,  // radius
    0.85, // threshold
  );
  composer.addPass(bloomPass);

  // Depth of field
  const bokehPass = new BokehPass(scene, camera, {
    focus: sceneRadius * 2.5, // focus on mid layer
    aperture: 0.002,
    maxblur: 0.005,
  });
  composer.addPass(bokehPass);

  // Output
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return { renderer, scene, camera, composer };
}

/**
 * Handle viewport resize.
 */
export function resizeScene(gearScene: GearScene, width: number, height: number): void {
  const { renderer, camera, composer } = gearScene;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
}

/**
 * Clean up all Three.js resources.
 */
export function destroyScene(gearScene: GearScene): void {
  gearScene.composer.dispose();
  gearScene.renderer.dispose();
  gearScene.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Clean (imports may need path adjustments for Three.js addons — fix as needed)

**Step 3: Commit**

```bash
git add src/lib/gear-scene.ts
git commit -m "feat: add Three.js scene setup with camera, lights, and post-processing"
```

---

### Task 6: Animation Loop

**Files:**
- Create: `src/lib/gear-animation.ts`

**Step 1: Write the animation module**

```typescript
import * as THREE from 'three';
import type { GearScene } from './gear-scene';
import type { GearMeshGroup } from './gear-meshes';
import type { PlanetarySet } from './gear-meshes';
import type { GearChain } from './gears';

interface ChainAnimation {
  chain: GearChain;
  meshGroups: THREE.Group[]; // one per gear in chain
  rootAngle: number;
}

interface BevelAnimation {
  gear1Mesh: THREE.Group;
  gear2Mesh: THREE.Group;
  speed: number;
  angle: number;
}

interface PlanetaryAnimation {
  set: PlanetarySet;
  sunSpeed: number; // deg/frame
  sunAngle: number;
}

export interface AnimationState {
  chains: ChainAnimation[];
  bevelPairs: BevelAnimation[];
  planetarySets: PlanetaryAnimation[];
  running: boolean;
}

/**
 * Create the animation state from the scene's gear data.
 */
export function createAnimationState(
  chains: { chain: GearChain; meshGroups: THREE.Group[] }[],
  bevelPairs: { gear1Mesh: THREE.Group; gear2Mesh: THREE.Group; speed: number }[],
  planetarySets: { set: PlanetarySet; sunSpeed: number }[],
): AnimationState {
  return {
    chains: chains.map((c) => ({
      chain: c.chain,
      meshGroups: c.meshGroups,
      rootAngle: 0,
    })),
    bevelPairs: bevelPairs.map((b) => ({
      ...b,
      angle: 0,
    })),
    planetarySets: planetarySets.map((p) => ({
      ...p,
      sunAngle: 0,
    })),
    running: true,
  };
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Start the animation loop.
 */
export function startAnimation(
  gearScene: GearScene,
  state: AnimationState,
): void {
  const clock = new THREE.Clock();

  state.running = true;

  gearScene.renderer.setAnimationLoop(() => {
    if (!state.running) return;

    const delta = clock.getDelta();
    const speed = delta * 60; // normalize to 60fps baseline

    // --- Standard gear chains ---
    for (const chainAnim of state.chains) {
      chainAnim.rootAngle += chainAnim.chain.rootSpeed * speed;

      for (let i = 0; i < chainAnim.chain.gears.length; i++) {
        const gear = chainAnim.chain.gears[i];
        const meshGroup = chainAnim.meshGroups[i];
        if (!meshGroup) continue;

        const angleDeg =
          chainAnim.rootAngle * gear.gearRatio * gear.direction +
          gear.phaseOffset;

        // Gears rotate around Z axis (they lie in X-Y plane, camera looks down Z)
        meshGroup.rotation.z = angleDeg * DEG_TO_RAD;
      }
    }

    // --- Bevel pairs ---
    for (const bevel of state.bevelPairs) {
      bevel.angle += bevel.speed * speed;
      bevel.gear1Mesh.rotation.z = bevel.angle * DEG_TO_RAD;
      // Gear2 rotates around a different axis (perpendicular)
      bevel.gear2Mesh.rotation.x = -bevel.angle * DEG_TO_RAD;
    }

    // --- Planetary sets ---
    for (const planetary of state.planetarySets) {
      planetary.sunAngle += planetary.sunSpeed * speed;
      const sunRad = planetary.sunAngle * DEG_TO_RAD;
      const { set } = planetary;

      // Sun rotates
      set.sunMesh.rotation.z = sunRad;

      // Planet carrier orbits: carrier speed = sun_speed * sun_teeth / (sun + ring)
      const carrierRatio = set.sunTeeth / (set.sunTeeth + set.ringTeeth);
      set.planetCarrier.rotation.z = planetary.sunAngle * carrierRatio * DEG_TO_RAD;

      // Each planet spins on its own axis
      const planetSelfRatio = set.sunTeeth / set.planetTeeth;
      const planetSelfAngle = planetary.sunAngle * planetSelfRatio;
      for (const planetMesh of set.planetMeshes) {
        planetMesh.rotation.z = -planetSelfAngle * DEG_TO_RAD;
      }

      // Ring: very slow counter-rotation (or stationary)
      set.ringMesh.rotation.z = -planetary.sunAngle * 0.02 * DEG_TO_RAD;
    }

    // Render
    gearScene.composer.render();
  });
}

/**
 * Stop the animation loop.
 */
export function stopAnimation(
  gearScene: GearScene,
  state: AnimationState,
): void {
  state.running = false;
  gearScene.renderer.setAnimationLoop(null);
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Clean

**Step 3: Commit**

```bash
git add src/lib/gear-animation.ts
git commit -m "feat: add gear animation loop with chain, bevel, and planetary support"
```

---

### Task 7: Rewrite GearBackground Component

**Files:**
- Rewrite: `src/components/GearBackground.tsx`

This is the integration task — wire everything together.

**Step 1: Rewrite the component**

```tsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createGearLayout, computeGearPaths } from '../lib/gears';
import { initScene, resizeScene, destroyScene, type GearScene } from '../lib/gear-scene';
import { createGearMaterials, disposeGearMaterials, type GearMaterials } from '../lib/gear-materials';
import {
  createStandardGearMesh,
  createHelicalGearMesh,
  createBevelPair,
  createPlanetarySet,
  type GearMeshGroup,
  type PlanetarySet,
} from '../lib/gear-meshes';
import {
  createAnimationState,
  startAnimation,
  stopAnimation,
  type AnimationState,
} from '../lib/gear-animation';

// Indices within each chain where we swap in exotic types
// Mid layer: indices 2,5 become helical; index 4 replaced by planetary
// Front layer: indices 1,2 replaced by bevel pair
const HELICAL_INDICES = { mid: [2, 5] };
const PLANETARY_INDEX = { mid: 4 }; // replaced by planetary set
const BEVEL_INDICES = { front: [1, 2] }; // pair replaced by bevel

export default function GearBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GearScene | null>(null);
  const materialsRef = useRef<GearMaterials | null>(null);
  const animStateRef = useRef<AnimationState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Init scene ---
    const gearScene = initScene(canvas);
    sceneRef.current = gearScene;

    // --- Materials ---
    const materials = createGearMaterials(gearScene.renderer);
    materialsRef.current = materials;

    // --- Layout ---
    const layout = createGearLayout(window.innerWidth, window.innerHeight);

    // Map viewport coords to scene coords
    // Center viewport at origin, scale to match camera frustum
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mapX = (x: number) => x - vw / 2;
    const mapY = (y: number) => -(y - vh / 2); // flip Y

    // Layer Z depths
    const layerZ = { back: -80, mid: 0, front: 80 };

    // Material per layer
    const layerMaterial = {
      back: materials.darkIron,
      mid: materials.steel,
      front: materials.steel,
    };

    // --- Build gear meshes ---
    const chainAnimData: { chain: typeof layout.back; meshGroups: THREE.Group[] }[] = [];
    const bevelAnimData: { gear1Mesh: THREE.Group; gear2Mesh: THREE.Group; speed: number }[] = [];
    const planetaryAnimData: { set: PlanetarySet; sunSpeed: number }[] = [];

    for (const layerName of ['back', 'mid', 'front'] as const) {
      const chain = layout[layerName];
      const meshGroups: THREE.Group[] = [];
      const z = layerZ[layerName];
      const baseMat = layerMaterial[layerName];

      const skipIndices = new Set<number>();

      // --- Planetary (mid layer) ---
      if (layerName === 'mid') {
        const pIdx = PLANETARY_INDEX.mid;
        if (pIdx < chain.gears.length) {
          const gear = chain.gears[pIdx];
          const pSet = createPlanetarySet(
            mapX(gear.cx), mapY(gear.cy),
            gear.module, 12, materials,
          );
          pSet.group.position.z = z;
          gearScene.scene.add(pSet.group);
          planetaryAnimData.push({ set: pSet, sunSpeed: chain.rootSpeed * gear.gearRatio });
          skipIndices.add(pIdx);
        }
      }

      // --- Bevel pair (front layer) ---
      if (layerName === 'front' && BEVEL_INDICES.front.length >= 2) {
        const [i1, i2] = BEVEL_INDICES.front;
        if (i1 < chain.gears.length && i2 < chain.gears.length) {
          const g1 = chain.gears[i1];
          const g2 = chain.gears[i2];
          const bevel = createBevelPair(g1, g2, materials.brass, materials.steel, materials);
          bevel.group.position.set(mapX(g1.cx), mapY(g1.cy), z);
          gearScene.scene.add(bevel.group);
          bevelAnimData.push({
            gear1Mesh: bevel.gear1Mesh,
            gear2Mesh: bevel.gear2Mesh,
            speed: chain.rootSpeed * g1.gearRatio,
          });
          skipIndices.add(i1);
          skipIndices.add(i2);
        }
      }

      // --- Standard and helical gears ---
      for (let i = 0; i < chain.gears.length; i++) {
        if (skipIndices.has(i)) {
          meshGroups.push(new THREE.Group()); // placeholder
          continue;
        }

        const gear = chain.gears[i];
        const isHelical = layerName === 'mid' && HELICAL_INDICES.mid.includes(i);
        const isAccent = (layerName === 'front' && i % 2 === 0) ||
                         (layerName === 'mid' && i === 0);
        const mat = isAccent ? materials.brass : baseMat;

        let gearMesh: GearMeshGroup;
        if (isHelical) {
          gearMesh = createHelicalGearMesh(gear, mat, materials);
        } else {
          gearMesh = createStandardGearMesh(gear, mat, materials);
        }

        gearMesh.group.position.set(mapX(gear.cx), mapY(gear.cy), z);
        gearScene.scene.add(gearMesh.group);
        meshGroups.push(gearMesh.group);
      }

      chainAnimData.push({ chain, meshGroups });
    }

    // --- Start animation ---
    const animState = createAnimationState(chainAnimData, bevelAnimData, planetaryAnimData);
    animStateRef.current = animState;
    startAnimation(gearScene, animState);

    // --- Resize handler ---
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeScene(gearScene, window.innerWidth, window.innerHeight);
      }, 200);
    };
    window.addEventListener('resize', onResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      if (animStateRef.current) {
        stopAnimation(gearScene, animStateRef.current);
      }
      if (materialsRef.current) {
        disposeGearMaterials(materialsRef.current);
      }
      destroyScene(gearScene);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Clean compile. Fix any import path or type issues.

**Step 3: Visual check**

Run: `npm run dev`
Expected: 3D gears visible in browser, rotating, with metallic materials and lighting. Back gears dimmer and blurred via DoF, front gears crisp with bloom highlights.

**Step 4: Commit**

```bash
git add src/components/GearBackground.tsx
git commit -m "feat: rewrite GearBackground as WebGL 3D scene with Three.js"
```

---

### Task 8: Visual Tuning and Polish

**Files:**
- Modify: `src/lib/gear-scene.ts` (camera, lights, post-processing values)
- Modify: `src/lib/gear-materials.ts` (material colors, roughness, metalness)
- Modify: `src/lib/gear-meshes.ts` (extrusion depth, bevel sizes)
- Modify: `src/lib/gear-animation.ts` (speeds)
- Modify: `src/components/GearBackground.tsx` (layout mapping, exotic gear placement)

**Step 1: Run dev server and assess**

Run: `npm run dev`

Check for:
- Gears rendering at correct positions across viewport
- 3D depth visible (beveled edges, thickness)
- Metallic materials reflecting environment
- Bloom on specular highlights (subtle, not blown out)
- Back-layer gears slightly out of focus
- Planetary set animating correctly (sun spins, planets orbit + self-rotate)
- Bevel pair meshing at 90 degrees
- Helical gears have visible twist
- Content pages still readable with gear background
- No gears entirely off-screen
- Smooth animation (check fps in dev tools)

**Step 2: Common tuning targets**

- Camera position and FOV (too zoomed in/out)
- Light intensities and positions
- Bloom strength/threshold (too much glow vs too subtle)
- DoF focus distance and aperture
- Material roughness (too shiny vs too matte)
- Gear thickness (too thick = obscures content, too thin = no 3D feel)
- Animation speed (too fast = distracting, too slow = static)
- Viewport-to-scene coordinate mapping (gears centered vs spread)
- Tone mapping exposure

**Step 3: Commit tuning changes**

```bash
git add -u
git commit -m "chore: tune 3D gear scene visuals — camera, lights, materials, speeds"
```

---

### Task 9: Lint, Build, and Final Verification

**Files:**
- Possibly all `src/lib/gear-*.ts` and `src/components/GearBackground.tsx` (lint fixes)

**Step 1: Run linter**

Run: `npm run lint`
Fix any issues.

**Step 2: Production build**

Run: `npm run build`
Expected: Clean build. Note the bundle size — Three.js will add ~150KB gzipped.

**Step 3: Preview production build**

Run: `npm run preview`
Check: Production build renders identically to dev.

**Step 4: Commit fixes**

```bash
git add -u
git commit -m "chore: lint fixes and final verification"
```
