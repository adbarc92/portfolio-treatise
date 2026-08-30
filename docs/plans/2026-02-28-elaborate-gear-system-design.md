# Elaborate Gear System Background Design

## Overview

Enhance the portfolio gear background from 8 decorative gears to ~25-30 mechanically realistic involute gears arranged in 3 depth-layered chains with SVG filter effects for a metallic mechanical illustration feel.

Builds on the involute gear math from `2026-02-28-gear-realism-design.md` and adds multi-chain layout, spoke detail, and SVG filter-based depth/lighting.

## Gear Math

### Involute Tooth Profile

- **Module (m):** Scaled from viewport size. Shared by all meshing gears within a chain.
- **Pressure angle:** 20 degrees.
- **Tooth counts:** 8-36 per gear.
- **Pitch radius** = m * N / 2
- **Base circle radius** = pitch radius * cos(20deg)
- **Addendum** = m (tooth height above pitch circle)
- **Dedendum** = 1.25 * m (tooth depth below pitch circle)
- **Center distance** between meshing gears = m * (N1 + N2) / 2
- **Involute flanks:** ~8-10 line segments per side, tip arc, root fillet arc.

### Phase Synchronization

- Angular velocity B = angular velocity A * (N_A / N_B)
- Direction alternates at each mesh
- Phase offset computed from mesh contact point for correct tooth interleaving

### Spoke Generation

- Gears with >=16 teeth: 4-6 spokes (thin arcs between hub and rim, forming cutout windows)
- Gears with <16 teeth: solid web (no spokes — too small for cutouts)
- Spoke path: two radial lines + two arcs forming each window

## Multi-Chain Layout

### 3 Depth Layers

**Back layer (z=1):**
- 1 chain of ~8-10 large slow gears
- Opacity 0.06-0.08
- Gaussian blur (stdDeviation 1.5) for atmospheric depth
- Snake path: bottom-left toward center-right
- Tooth counts biased toward 24-36

**Mid layer (z=2):**
- 1 chain of ~10-12 mixed-size gears
- Opacity 0.10-0.14
- Subtle blur (stdDeviation 0.5) + specular lighting highlight
- Snake path: top-left through center to bottom-right
- One "hero gear" with accent color at slightly higher opacity
- Tooth counts mixed: 12-28

**Front layer (z=3):**
- 1 chain of ~6-8 smaller gears
- Opacity 0.12-0.18, sharpest detail
- No blur, strong specular lighting + drop shadow
- Clustered in one viewport region (e.g., bottom-right) to avoid overwhelming content
- Tooth counts biased toward 8-18

**Total: ~25-30 gears across 3 chains.**

### Chain Layout Algorithm

1. Define snake path as a series of placement angles for each layer
2. Place root gear near a viewport edge
3. Each subsequent gear placed at center distance from parent, at the next snake angle
4. Alternate tooth counts for visual variety (large -> small -> medium)
5. Collision detection: if new gear overlaps a gear from another chain, nudge placement angle
6. Module value scaled from viewport so chains always fit

## SVG Filter Effects

### Filter Definitions (in `<defs>`)

```xml
<filter id="gear-back">
  <feGaussianBlur stdDeviation="1.5" />
</filter>

<filter id="gear-mid">
  <feGaussianBlur stdDeviation="0.5" result="blur" />
  <feSpecularLighting result="spec" specularExponent="20" lighting-color="#ffffff">
    <fePointLight x="-100" y="-100" z="200" />
  </feSpecularLighting>
  <feComposite in="spec" in2="blur" operator="in" result="specShape" />
  <feComposite in="blur" in2="specShape" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0" />
</filter>

<filter id="gear-front">
  <feSpecularLighting result="spec" specularExponent="30" lighting-color="#ffffff">
    <fePointLight x="-100" y="-100" z="300" />
  </feSpecularLighting>
  <feComposite in="spec" in2="SourceGraphic" operator="in" result="specShape" />
  <feComposite in="SourceGraphic" in2="specShape" operator="arithmetic" k1="0" k2="1" k3="0.4" k4="0" />
  <feDropShadow dx="1" dy="1" stdDeviation="2" flood-opacity="0.3" />
</filter>
```

### Color & Stroke

- Same CSS variables: `--color-gear`, `--color-gear-accent`, `--color-gear-accent-2`
- Front-layer gears use accent colors
- Stroke treatment: front 1.5px, mid 1.0px, back 0.5px (`--color-gear-stroke`)
- Hero gear in mid layer: `--color-gear-accent` at +0.04 opacity boost

## Animation

### Frame Loop

- Single `requestAnimationFrame` loop
- Each chain has a root gear with constant angular velocity
- All other gear angles computed from root via gear ratio multiplication (no drift)
- Direct DOM manipulation: `setAttribute` on `<g>` rotate transforms
- ~28 setAttribute calls per frame

### Speed

- Back layer roots: ~0.08 deg/frame (slowest, largest gears)
- Mid layer root: ~0.12 deg/frame
- Front layer root: ~0.15 deg/frame (fastest, smallest gears)
- Overall feel: slow, deliberate, atmospheric

### Resize Handling

- Debounced resize listener rebuilds all chain layouts
- Module recalculated from new viewport dimensions
- Gear count stays constant, positions adjust to fill viewport

## Performance

- SVG paths are static (regenerated only on resize)
- Only rotate transforms change per frame
- Filters defined once in `<defs>`, GPU-composited by browser
- ~30 `<g>` elements, each with gear path + hole path + spoke paths ≈ ~90 path elements
- Fallback option: disable back-layer filters on low-end devices if needed

## Files Changed

- **Replace:** `src/lib/gears.ts` — involute math, spoke generation, multi-chain layout, gear train graph
- **Modify:** `src/components/GearBackground.tsx` — 3-layer rendering, SVG filter defs, multi-chain animation loop
- **No changes** to layout, pages, content pipeline, routing, or styles
