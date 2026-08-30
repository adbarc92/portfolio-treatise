# Elaborate Gear System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 8 decorative gears with ~25-30 mechanically realistic involute gears in 3 depth-layered chains with SVG filter effects for metallic depth.

**Architecture:** Rewrite `src/lib/gears.ts` with involute tooth math, spoke generation, and a multi-chain layout algorithm. Update `src/components/GearBackground.tsx` to render 3 depth layers with SVG filter definitions and propagate rotation through gear train graphs. No other files change.

**Tech Stack:** React 19, TypeScript, SVG (paths + filters), requestAnimationFrame

**Design doc:** `docs/plans/2026-02-28-elaborate-gear-system-design.md`

---

### Task 1: Involute Gear Path Generator

**Files:**
- Rewrite: `src/lib/gears.ts` (replace current contents entirely)

This task creates the core involute tooth profile math. All subsequent tasks depend on this.

**Step 1: Write the involute math types and constants**

Replace the entire contents of `src/lib/gears.ts` with the new type definitions and constants:

```typescript
// --- Types ---

export interface GearSpec {
  teeth: number;
  module: number; // shared by all gears in a chain
  pressureAngleDeg?: number; // default 20
}

export interface PlacedGear {
  cx: number;
  cy: number;
  spec: GearSpec;
  pitchRadius: number;
  outerRadius: number;
  innerRadius: number;
  baseRadius: number;
  teeth: number;
  // rotation state
  parentIndex: number | null; // null = root
  direction: 1 | -1;
  gearRatio: number; // relative to root (root = 1.0)
  phaseOffset: number; // radians
  // rendering
  layer: 'back' | 'mid' | 'front';
}

export interface GearPaths {
  body: string; // outer tooth profile
  hole: string; // center hole
  spokes: string; // spoke cutouts (empty string if no spokes)
}

export interface GearChain {
  gears: PlacedGear[];
  rootSpeed: number; // deg/frame for root gear
}

export interface GearLayout {
  chains: GearChain[];
}

// --- Constants ---

const DEFAULT_PRESSURE_ANGLE = 20; // degrees
const DEG_TO_RAD = Math.PI / 180;
const INVOLUTE_SEGMENTS = 8; // segments per tooth flank
const ADDENDUM_FACTOR = 1.0; // addendum = module * this
const DEDENDUM_FACTOR = 1.25; // dedendum = module * this
const SPOKE_TOOTH_THRESHOLD = 16; // gears with >= this many teeth get spokes
```

**Step 2: Write the involute curve function**

Append to `src/lib/gears.ts`:

```typescript
/**
 * Compute a point on the involute of a circle.
 * t = roll angle parameter (0 = base circle, increases outward)
 * Returns [x, y] relative to gear center (0, 0).
 */
function involutePoint(baseRadius: number, t: number): [number, number] {
  const x = baseRadius * (Math.cos(t) + t * Math.sin(t));
  const y = baseRadius * (Math.sin(t) - t * Math.cos(t));
  return [x, y];
}

/**
 * Compute the involute roll angle t at a given radius r.
 * From: r = baseRadius * sqrt(1 + t^2), solve for t.
 */
function involuteAngleAtRadius(baseRadius: number, r: number): number {
  if (r <= baseRadius) return 0;
  return Math.sqrt((r / baseRadius) ** 2 - 1);
}

/**
 * The polar angle of an involute point at roll parameter t.
 * theta = t - atan(t)  (angle from involute start to the point)
 */
function involutePolarAngle(t: number): number {
  return t - Math.atan(t);
}
```

**Step 3: Write the single-tooth profile generator**

Append to `src/lib/gears.ts`:

```typescript
/**
 * Generate SVG path segments for one tooth of an involute gear.
 * The tooth is centered at angle `toothCenterAngle` (radians).
 * Returns array of "L x y" strings (no M — caller handles that).
 */
function generateToothProfile(
  baseRadius: number,
  pitchRadius: number,
  outerRadius: number,
  rootRadius: number,
  toothCenterAngle: number,
  segments: number,
): string[] {
  const points: string[] = [];

  // Involute roll angles at key radii
  const tOuter = involuteAngleAtRadius(baseRadius, Math.min(outerRadius, outerRadius));
  const tRoot = involuteAngleAtRadius(baseRadius, Math.max(rootRadius, baseRadius));
  const tPitch = involuteAngleAtRadius(baseRadius, pitchRadius);

  // Half angular tooth thickness at pitch circle
  // Standard: tooth thickness at pitch = pi * module / 2
  // Angular: halfThick = (pi / (2 * N)) + inv(alpha)  where inv = tan(a) - a
  const pressureAngle = DEFAULT_PRESSURE_ANGLE * DEG_TO_RAD;
  const invAlpha = Math.tan(pressureAngle) - pressureAngle;
  const N = Math.round((pitchRadius * 2) / (pitchRadius / (pitchRadius / pitchRadius))); // just use the formula directly
  const halfToothAngle = Math.PI / (2 * Math.round(2 * pitchRadius / (pitchRadius / (outerRadius - rootRadius) * ADDENDUM_FACTOR))) + invAlpha;

  // Actually let's use a cleaner approach:
  // At the pitch circle, tooth angular thickness = pi / N (half the pitch)
  // So half-tooth angle = pi / (2*N)
  // The involute polar angle at pitch = involutePolarAngle(tPitch)
  // Tooth center offset = half-tooth angle + involute polar angle at pitch
  const teeth = Math.round(2 * pitchRadius / (baseRadius / Math.cos(pressureAngle) * 2 / (2 * pitchRadius / baseRadius * Math.cos(pressureAngle))));

  // Simplified: pass teeth count separately. We'll refactor to accept it.
  // For now, derive from pitchRadius and module (pitchRadius = m*N/2, but we don't have m here)
  // Let's restructure this function to also take `teeth` as a parameter.

  return points; // placeholder - will be replaced in the actual implementation below
}
```

Actually, let me write this more cleanly. **Replace Step 3 entirely with:**

```typescript
/**
 * Generate the full SVG path for an involute gear.
 * Center at (0, 0) — caller translates.
 */
export function generateInvoluteGearPath(
  teeth: number,
  module: number,
  pressureAngleDeg: number = DEFAULT_PRESSURE_ANGLE,
): string {
  const alpha = pressureAngleDeg * DEG_TO_RAD;
  const pitchRadius = (module * teeth) / 2;
  const baseRadius = pitchRadius * Math.cos(alpha);
  const outerRadius = pitchRadius + module * ADDENDUM_FACTOR;
  const rootRadius = pitchRadius - module * DEDENDUM_FACTOR;

  // Involute roll angle at the outer circle
  const tOuter = involuteAngleAtRadius(baseRadius, outerRadius);

  // Half angular tooth thickness at pitch circle
  // = pi/(2N) + involute_function(alpha)
  // where involute_function(a) = tan(a) - a
  const invFunc = Math.tan(alpha) - alpha;
  const halfToothAnglePitch = Math.PI / (2 * teeth) + invFunc;

  // The involute polar angle at the pitch circle
  const tPitch = involuteAngleAtRadius(baseRadius, pitchRadius);
  const invPolarPitch = involutePolarAngle(tPitch);

  // Angular offset so the involute starts aligned with tooth center
  // The right flank involute polar angle at pitch = invPolarPitch
  // We want right flank at pitch to be at +halfToothAnglePitch from tooth center
  // So offset = halfToothAnglePitch - invPolarPitch  (but this is per-flank, applied as rotation)

  const segments: string[] = [];
  const anglePerTooth = (2 * Math.PI) / teeth;

  for (let i = 0; i < teeth; i++) {
    const toothAngle = i * anglePerTooth;

    // RIGHT flank (involute curve from root to tip)
    const rightFlankOffset = toothAngle + halfToothAnglePitch;
    for (let s = 0; s <= INVOLUTE_SEGMENTS; s++) {
      const t = (tOuter * s) / INVOLUTE_SEGMENTS;
      const [ix, iy] = involutePoint(baseRadius, t);
      const polarAngle = involutePolarAngle(t);
      const angle = rightFlankOffset - polarAngle;
      const r = Math.sqrt(ix * ix + iy * iy);
      const clampedR = Math.min(r, outerRadius);
      const x = clampedR * Math.cos(angle);
      const y = clampedR * Math.sin(angle);
      segments.push(i === 0 && s === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }

    // TIP ARC (small arc at outer radius connecting right to left flank)
    const leftFlankOffset = toothAngle - halfToothAnglePitch;
    const tOuterPolar = involutePolarAngle(tOuter);
    const tipRightAngle = rightFlankOffset - tOuterPolar;
    const tipLeftAngle = leftFlankOffset + tOuterPolar;
    const tipEndX = outerRadius * Math.cos(tipLeftAngle);
    const tipEndY = outerRadius * Math.sin(tipLeftAngle);
    segments.push(`A ${outerRadius} ${outerRadius} 0 0 0 ${tipEndX} ${tipEndY}`);

    // LEFT flank (involute curve from tip back to root, mirrored)
    for (let s = INVOLUTE_SEGMENTS; s >= 0; s--) {
      const t = (tOuter * s) / INVOLUTE_SEGMENTS;
      const [ix, iy] = involutePoint(baseRadius, t);
      const polarAngle = involutePolarAngle(t);
      const angle = leftFlankOffset + polarAngle;
      const r = Math.sqrt(ix * ix + iy * iy);
      const clampedR = Math.min(r, outerRadius);
      const x = clampedR * Math.cos(angle);
      const y = clampedR * Math.sin(angle);
      segments.push(`L ${x} ${y}`);
    }

    // ROOT ARC (arc at root radius to next tooth)
    const nextToothAngle = (i + 1) * anglePerTooth;
    const nextRightOffset = nextToothAngle + halfToothAnglePitch;
    const rootEndX = Math.max(rootRadius, baseRadius) * Math.cos(nextRightOffset);
    const rootEndY = Math.max(rootRadius, baseRadius) * Math.sin(nextRightOffset);
    const effectiveRootR = Math.max(rootRadius, baseRadius);
    segments.push(`A ${effectiveRootR} ${effectiveRootR} 0 0 0 ${rootEndX} ${rootEndY}`);
  }

  segments.push('Z');
  return segments.join(' ');
}
```

**Step 4: Run build to verify no type errors**

Run: `npm run build`
Expected: Successful compilation (may warn about unused exports, but no errors)

**Step 5: Commit**

```bash
git add src/lib/gears.ts
git commit -m "feat: add involute gear tooth profile generator"
```

---

### Task 2: Spoke and Hole Path Generators

**Files:**
- Modify: `src/lib/gears.ts` (append functions)

**Step 1: Write the spoke and hole generators**

Append to `src/lib/gears.ts`:

```typescript
/**
 * Generate SVG path for center hole.
 */
export function generateHolePath(holeRadius: number): string {
  return [
    `M ${-holeRadius} 0`,
    `A ${holeRadius} ${holeRadius} 0 1 0 ${holeRadius} 0`,
    `A ${holeRadius} ${holeRadius} 0 1 0 ${-holeRadius} 0`,
    'Z',
  ].join(' ');
}

/**
 * Generate SVG path for spoke cutouts between hub and rim.
 * Returns empty string for gears with < SPOKE_TOOTH_THRESHOLD teeth.
 */
export function generateSpokePaths(
  teeth: number,
  module: number,
  spokeCount?: number,
): string {
  if (teeth < SPOKE_TOOTH_THRESHOLD) return '';

  const pitchRadius = (module * teeth) / 2;
  const rootRadius = pitchRadius - module * DEDENDUM_FACTOR;
  const holeRadius = pitchRadius * 0.2;
  const hubRadius = holeRadius * 1.8;
  const rimInnerRadius = rootRadius * 0.85;

  const count = spokeCount ?? (teeth >= 28 ? 6 : 4);
  const spokeAngularWidth = (2 * Math.PI) / count * 0.35; // spoke takes 35% of sector
  const windowAngularWidth = (2 * Math.PI) / count - spokeAngularWidth;

  const paths: string[] = [];

  for (let i = 0; i < count; i++) {
    const centerAngle = (i * 2 * Math.PI) / count;
    const startAngle = centerAngle - windowAngularWidth / 2;
    const endAngle = centerAngle + windowAngularWidth / 2;

    // Window: arc at hub -> line to rim -> arc at rim -> line back to hub
    const hx1 = hubRadius * Math.cos(startAngle);
    const hy1 = hubRadius * Math.sin(startAngle);
    const hx2 = hubRadius * Math.cos(endAngle);
    const hy2 = hubRadius * Math.sin(endAngle);
    const rx1 = rimInnerRadius * Math.cos(startAngle);
    const ry1 = rimInnerRadius * Math.sin(startAngle);
    const rx2 = rimInnerRadius * Math.cos(endAngle);
    const ry2 = rimInnerRadius * Math.sin(endAngle);

    paths.push(
      `M ${hx1} ${hy1}`,
      `L ${rx1} ${ry1}`,
      `A ${rimInnerRadius} ${rimInnerRadius} 0 0 1 ${rx2} ${ry2}`,
      `L ${hx2} ${hy2}`,
      `A ${hubRadius} ${hubRadius} 0 0 0 ${hx1} ${hy1}`,
      'Z',
    );
  }

  return paths.join(' ');
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Successful compilation

**Step 3: Commit**

```bash
git add src/lib/gears.ts
git commit -m "feat: add spoke and hole path generators for gear detail"
```

---

### Task 3: Gear Train Graph and Multi-Chain Layout

**Files:**
- Modify: `src/lib/gears.ts` (append chain layout logic)

This is the largest task. It builds the 3 gear chains that snake across the viewport.

**Step 1: Write the chain layout algorithm**

Append to `src/lib/gears.ts`:

```typescript
// --- Chain Layout ---

interface ChainSpec {
  layer: 'back' | 'mid' | 'front';
  rootSpeed: number; // deg per frame
  gearTeeth: number[]; // tooth counts for each gear in chain
  snakeAngles: number[]; // placement angle (deg) from parent for each child
  rootPosition: (w: number, h: number) => [number, number];
}

const CHAIN_SPECS: ChainSpec[] = [
  // Back layer: 8-10 large slow gears, bottom-left to center-right
  {
    layer: 'back',
    rootSpeed: 0.08,
    gearTeeth: [32, 28, 36, 24, 32, 28, 24, 36, 20],
    snakeAngles: [-30, 25, -40, 50, -20, 35, -45, 30],
    rootPosition: (w, h) => [w * 0.08, h * 0.75],
  },
  // Mid layer: 10-12 mixed gears, top-left through center to bottom-right
  {
    layer: 'mid',
    rootSpeed: 0.12,
    gearTeeth: [24, 16, 28, 12, 20, 24, 14, 22, 16, 28, 18],
    snakeAngles: [-20, 40, -35, 55, -15, 30, -50, 25, -30, 45],
    rootPosition: (w, h) => [w * 0.12, h * 0.18],
  },
  // Front layer: 6-8 smaller gears, clustered bottom-right
  {
    layer: 'front',
    rootSpeed: 0.15,
    gearTeeth: [14, 10, 18, 12, 16, 10, 14],
    snakeAngles: [40, -30, 55, -45, 35, -25],
    rootPosition: (w, h) => [w * 0.7, h * 0.65],
  },
];

/**
 * Build a single gear chain from a spec.
 * Module is computed to fit the chain within reasonable bounds.
 */
function buildChain(
  spec: ChainSpec,
  viewportWidth: number,
  viewportHeight: number,
  existingGears: PlacedGear[],
): GearChain {
  const scale = Math.min(viewportWidth, viewportHeight);

  // Module sized so the largest gear in this chain has a reasonable outer radius
  const maxTeeth = Math.max(...spec.gearTeeth);
  const targetMaxRadius = scale * (spec.layer === 'back' ? 0.14 : spec.layer === 'mid' ? 0.10 : 0.06);
  const module = (targetMaxRadius * 2) / (maxTeeth + 2 * ADDENDUM_FACTOR);

  const [rootX, rootY] = spec.rootPosition(viewportWidth, viewportHeight);

  const gears: PlacedGear[] = [];

  for (let i = 0; i < spec.gearTeeth.length; i++) {
    const teeth = spec.gearTeeth[i];
    const pitchRadius = (module * teeth) / 2;
    const alpha = DEFAULT_PRESSURE_ANGLE * DEG_TO_RAD;
    const outerRadius = pitchRadius + module * ADDENDUM_FACTOR;
    const innerRadius = pitchRadius - module * DEDENDUM_FACTOR;
    const baseRadius = pitchRadius * Math.cos(alpha);

    let cx: number, cy: number;
    let direction: 1 | -1;
    let gearRatio: number;
    let phaseOffset = 0;

    if (i === 0) {
      cx = rootX;
      cy = rootY;
      direction = 1;
      gearRatio = 1.0;
    } else {
      const parent = gears[i - 1];
      const parentPitchR = (module * parent.teeth) / 2;
      const centerDist = parentPitchR + pitchRadius;
      let angle = spec.snakeAngles[i - 1] * DEG_TO_RAD;

      cx = parent.cx + centerDist * Math.cos(angle);
      cy = parent.cy + centerDist * Math.sin(angle);

      // Keep gears within viewport bounds (with some overflow allowed)
      const margin = -outerRadius * 0.5; // allow partial overflow
      if (cx < margin) cx = margin + outerRadius;
      if (cx > viewportWidth - margin) cx = viewportWidth - margin - outerRadius;
      if (cy < margin) cy = margin + outerRadius;
      if (cy > viewportHeight - margin) cy = viewportHeight - margin - outerRadius;

      direction = (parent.direction === 1 ? -1 : 1) as 1 | -1;
      gearRatio = parent.gearRatio * (parent.teeth / teeth);

      // Phase offset for correct meshing
      // When two gears mesh, the contact point must align
      const meshAngle = Math.atan2(cy - parent.cy, cx - parent.cx);
      const parentTeethAngle = (2 * Math.PI) / parent.teeth;
      const childTeethAngle = (2 * Math.PI) / teeth;
      phaseOffset = meshAngle + Math.PI / teeth; // half-tooth offset for interleaving
    }

    gears.push({
      cx, cy, spec: { teeth, module },
      pitchRadius, outerRadius, innerRadius, baseRadius, teeth,
      parentIndex: i === 0 ? null : i - 1,
      direction, gearRatio, phaseOffset,
      layer: spec.layer,
    });
  }

  return { gears, rootSpeed: spec.rootSpeed };
}

/**
 * Create the full multi-chain gear layout.
 */
export function createGearLayout(
  viewportWidth: number,
  viewportHeight: number,
): GearLayout {
  const allGears: PlacedGear[] = [];
  const chains: GearChain[] = [];

  for (const spec of CHAIN_SPECS) {
    const chain = buildChain(spec, viewportWidth, viewportHeight, allGears);
    chains.push(chain);
    allGears.push(...chain.gears);
  }

  return { chains };
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Successful compilation

**Step 3: Commit**

```bash
git add src/lib/gears.ts
git commit -m "feat: add multi-chain gear train layout algorithm"
```

---

### Task 4: Pre-compute Gear Paths Helper

**Files:**
- Modify: `src/lib/gears.ts` (append helper)

**Step 1: Add a helper that generates all render-ready data for a placed gear**

Append to `src/lib/gears.ts`:

```typescript
export interface RenderGear {
  placed: PlacedGear;
  bodyPath: string;
  holePath: string;
  spokesPath: string;
}

/**
 * Generate all SVG paths for a placed gear.
 * Paths are generated at origin (0,0) — the component translates via transform.
 */
export function computeGearPaths(gear: PlacedGear): RenderGear {
  const { teeth, module } = gear.spec;
  const holeRadius = gear.pitchRadius * 0.2;

  return {
    placed: gear,
    bodyPath: generateInvoluteGearPath(teeth, module),
    holePath: generateHolePath(holeRadius),
    spokesPath: generateSpokePaths(teeth, module),
  };
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Successful compilation

**Step 3: Commit**

```bash
git add src/lib/gears.ts
git commit -m "feat: add pre-computed gear path helper"
```

---

### Task 5: Rewrite GearBackground Component — SVG Filter Defs

**Files:**
- Rewrite: `src/components/GearBackground.tsx`

This task and the next two rebuild the component in stages. Start with the filter definitions and basic structure.

**Step 1: Write the new component skeleton with SVG filter definitions**

Replace the entire contents of `src/components/GearBackground.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  createGearLayout,
  computeGearPaths,
  type GearLayout,
  type GearChain,
  type RenderGear,
} from '../lib/gears';

// --- Layer visual config ---

interface LayerStyle {
  filter: string;
  strokeWidth: number;
  opacityRange: [number, number]; // [min, max] for variety within layer
}

const LAYER_STYLES: Record<string, LayerStyle> = {
  back: { filter: 'url(#gear-back)', strokeWidth: 0.5, opacityRange: [0.06, 0.08] },
  mid: { filter: 'url(#gear-mid)', strokeWidth: 1.0, opacityRange: [0.10, 0.14] },
  front: { filter: 'url(#gear-front)', strokeWidth: 1.5, opacityRange: [0.12, 0.18] },
};

function getGearColor(layerIndex: number, gearIndex: number): string {
  if (layerIndex === 2) {
    // Front layer: accent colors
    return gearIndex % 2 === 0 ? 'var(--color-gear-accent)' : 'var(--color-gear-accent-2)';
  }
  if (layerIndex === 1 && gearIndex === 0) {
    // Mid layer hero gear
    return 'var(--color-gear-accent)';
  }
  const mod = (gearIndex + layerIndex) % 3;
  if (mod === 0) return 'var(--color-gear-accent)';
  if (mod === 1) return 'var(--color-gear-accent-2)';
  return 'var(--color-gear)';
}

function getGearOpacity(layer: string, gearIndex: number): number {
  const style = LAYER_STYLES[layer];
  const [min, max] = style.opacityRange;
  // Alternate within range for variety
  return gearIndex % 2 === 0 ? max : min;
}

// --- SVG Filter Definitions ---

function FilterDefs() {
  return (
    <defs>
      {/* Back layer: blur only for atmospheric depth */}
      <filter id="gear-back" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>

      {/* Mid layer: subtle blur + specular highlight */}
      <filter id="gear-mid" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
        <feSpecularLighting
          in="blur"
          result="spec"
          specularExponent="20"
          lightingColor="#ffffff"
          surfaceScale="2"
        >
          <fePointLight x="-200" y="-200" z="200" />
        </feSpecularLighting>
        <feComposite in="spec" in2="blur" operator="in" result="specShape" />
        <feComposite
          in="blur"
          in2="specShape"
          operator="arithmetic"
          k1="0" k2="1" k3="0.3" k4="0"
        />
      </filter>

      {/* Front layer: crisp + strong specular + drop shadow */}
      <filter id="gear-front" x="-10%" y="-10%" width="120%" height="120%">
        <feSpecularLighting
          in="SourceGraphic"
          result="spec"
          specularExponent="30"
          lightingColor="#ffffff"
          surfaceScale="3"
        >
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceGraphic" operator="in" result="specShape" />
        <feComposite
          in="SourceGraphic"
          in2="specShape"
          operator="arithmetic"
          k1="0" k2="1" k3="0.4" k4="0"
        />
        <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3" />
      </filter>
    </defs>
  );
}
```

**Step 2: Continue — this is just the defs. The full component render follows in Task 6.**

**Step 3: Run build** (will fail — component is incomplete, that's expected at this step)

**Step 4: Commit** (skip until Task 7 completes the component)

---

### Task 6: GearBackground — Gear Rendering

**Files:**
- Modify: `src/components/GearBackground.tsx` (continue building)

**Step 1: Add the gear rendering and layout state**

Append to `src/components/GearBackground.tsx` (after FilterDefs):

```tsx
// --- Pre-compute layout ---

interface ComputedLayout {
  layout: GearLayout;
  renderGears: RenderGear[][];  // indexed by chain
}

function computeLayout(w: number, h: number): ComputedLayout {
  const layout = createGearLayout(w, h);
  const renderGears = layout.chains.map((chain) =>
    chain.gears.map((gear) => computeGearPaths(gear)),
  );
  return { layout, renderGears };
}

const initialComputed = computeLayout(window.innerWidth, window.innerHeight);

// --- Component ---

export default function GearBackground() {
  const svgRef = useRef<SVGSVGElement>(null);
  const computedRef = useRef<ComputedLayout>(initialComputed);
  const [computed, setComputed] = useState<ComputedLayout>(initialComputed);

  // Rebuild layout on resize
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const next = computeLayout(window.innerWidth, window.innerHeight);
        computedRef.current = next;
        setComputed(next);
      }, 200); // debounce
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timeout);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    let frameId: number;
    let rootAngles: number[] = computed.layout.chains.map(() => 0);

    const animate = (time: number) => {
      const svg = svgRef.current;
      if (!svg) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      const currentComputed = computedRef.current;

      currentComputed.layout.chains.forEach((chain, ci) => {
        rootAngles[ci] += chain.rootSpeed;
        const chainGroup = svg.querySelector<SVGGElement>(`.chain-${ci}`);
        if (!chainGroup) return;

        const gearGroups = chainGroup.querySelectorAll<SVGGElement>('.gear-group');
        chain.gears.forEach((gear, gi) => {
          const group = gearGroups[gi];
          if (!group) return;

          // Compute rotation: root angle * gear ratio * direction + phase offset
          const angle =
            rootAngles[ci] * gear.gearRatio * gear.direction +
            (gear.phaseOffset * 180) / Math.PI;

          group.setAttribute(
            'transform',
            `translate(${gear.cx} ${gear.cy}) rotate(${angle})`,
          );
        });
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [computed]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <FilterDefs />
      {computed.renderGears.map((chainGears, ci) => {
        const chain = computed.layout.chains[ci];
        const layer = chain.gears[0]?.layer ?? 'mid';
        const style = LAYER_STYLES[layer];

        return (
          <g key={ci} className={`chain-${ci}`} filter={style.filter}>
            {chainGears.map((rg, gi) => {
              const fill = getGearColor(ci, gi);
              const opacity = getGearOpacity(layer, gi);

              return (
                <g key={gi} className="gear-group">
                  {/* Gear body */}
                  <path
                    d={rg.bodyPath}
                    fill={fill}
                    opacity={opacity}
                    stroke="var(--color-gear-stroke)"
                    strokeWidth={style.strokeWidth}
                  />
                  {/* Spoke cutouts */}
                  {rg.spokesPath && (
                    <path
                      d={rg.spokesPath}
                      fill="var(--color-bg)"
                      opacity={opacity * 0.9}
                    />
                  )}
                  {/* Center hole */}
                  <path
                    d={rg.holePath}
                    fill="var(--color-bg)"
                    stroke="var(--color-gear-stroke)"
                    strokeWidth={style.strokeWidth * 0.8}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: Successful compilation

**Step 3: Visual verification**

Run: `npm run dev`
Expected: Open browser, see ~27 gears across 3 depth layers, rotating with metallic filter effects. Back gears blurred and dim, front gears crisp and bright.

**Step 4: Commit**

```bash
git add src/components/GearBackground.tsx src/lib/gears.ts
git commit -m "feat: elaborate gear system with involute profiles, 3-layer chains, SVG filters"
```

---

### Task 7: Visual Tuning Pass

**Files:**
- Modify: `src/lib/gears.ts` (adjust chain specs)
- Modify: `src/components/GearBackground.tsx` (adjust filter values)

This task is for iterating on the visual output. Run dev server, inspect the result, and tune:

**Step 1: Start dev server and inspect**

Run: `npm run dev`

Check for:
- Gears rendering correctly (teeth look like involute profiles, not flat)
- Chains meshing plausibly (teeth interleave at contact points)
- Back layer visibly blurred and dim
- Front layer crisp with subtle metallic sheen
- No gears clipped off-screen entirely
- Content still readable over the gear background
- No obvious performance issues (smooth 60fps animation)

**Step 2: Adjust as needed**

Common tuning targets:
- `CHAIN_SPECS` tooth counts and snake angles in `gears.ts` to adjust density/spread
- `LAYER_STYLES` opacity ranges in `GearBackground.tsx`
- Filter `stdDeviation` and `specularExponent` values
- Root speed values (slower = more atmospheric)
- Module scaling factor (larger = bigger gears, fewer fit)

**Step 3: Final build check**

Run: `npm run build`
Expected: Clean build, no errors

**Step 4: Commit**

```bash
git add src/lib/gears.ts src/components/GearBackground.tsx
git commit -m "chore: tune gear visual parameters for balance and readability"
```

---

### Task 8: Lint and Final Verification

**Files:**
- Possibly: `src/lib/gears.ts`, `src/components/GearBackground.tsx` (lint fixes only)

**Step 1: Run linter**

Run: `npm run lint`
Expected: No errors. Fix any that appear.

**Step 2: Run production build**

Run: `npm run build`
Expected: Clean build

**Step 3: Preview production build**

Run: `npm run preview`
Expected: Production build renders identically to dev

**Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: lint fixes for gear system"
```
