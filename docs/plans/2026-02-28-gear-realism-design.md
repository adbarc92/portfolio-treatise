# Realistic Gear Train Design

## Overview

Replace the current decorative gear background with a mechanically realistic gear train. Involute tooth profiles, proper meshing geometry, and a connected chain of ~15-20 gears snaking across the viewport as a single unified mechanical system.

## Gear Math

### Standard Parameters

- **Module (m):** Scales gear size. Pitch diameter = m * N. All meshing gears share the same module.
- **Pressure angle (alpha):** 20 degrees. Defines the involute curve shape.
- **Tooth count (N):** Varies per gear (8-36). Determines size and gear ratio.

### Derived Dimensions

- Pitch radius = m * N / 2
- Base circle radius = pitch radius * cos(alpha)
- Addendum (tooth height above pitch) = m
- Dedendum (tooth depth below pitch) = 1.25 * m
- Center distance between meshing gears = m * (N1 + N2) / 2

### Involute Tooth Profile

The involute of a circle is the curve traced by the end of a taut string unwinding from a base circle. For each tooth:

- Two involute flanks (left and right) from base circle to addendum circle
- Tip arc connecting the two flanks at the addendum
- Root fillet arc at the dedendum for stress relief and visual realism
- Involute curve approximated as ~8-10 line segments per flank

Full gear path = N teeth concatenated into a closed SVG path.

### Phase Synchronization

When gear A meshes with gear B:
- Angular velocity B = angular velocity A * (N_A / N_B)
- Direction B = opposite of direction A
- Phase offset computed from the mesh contact point so teeth interleave correctly

## Gear Train Graph

### Structure

- Tree of gear nodes (no cycles)
- Root gear is the driver (constant angular velocity)
- Every other gear derives rotation from its parent via gear ratio
- Rotation computed from root each frame (multiplication, not accumulation — no drift)

### Chain Layout Algorithm

1. Start with root gear near one viewport edge
2. For each child: compute center distance = m * (N_parent + N_child) / 2
3. Place child at a chosen angle from parent (angle guides the chain's snake path)
4. Snake path defined by a series of placement angles traversing the viewport
5. Vary tooth counts: large slow gears (28-36 teeth), medium (16-24), small fast (8-12)

### Target Layout

- ~15-20 gears in one continuous chain
- Chain snakes across viewport (e.g., bottom-left through center to top-right)
- Mix of sizes for visual interest and varying rotation speeds
- Module value scaled from viewport size so chain always fits
- Chain path recomputed on window resize

## SVG Rendering

### Path Generation

- Each tooth: left involute → tip arc → right involute → root fillet
- ~8-10 segments per involute flank (visually smooth)
- Full gear = closed SVG path of N concatenated teeth
- Center hole as separate circular path

### Visual Style

- Same color scheme: `--color-gear`, `--color-gear-accent`, `--color-gear-accent-2`
- Subtle stroke outlines for technical drawing quality
- Low opacity for content readability
- One or two accent-colored gears as focal points

### Animation

- Single `requestAnimationFrame` loop
- Root gear angle incremented per frame
- All other angles computed from root via gear train (no accumulation)
- Direct DOM manipulation (setAttribute on rotate transform)
- Slow deliberate speed — atmosphere, not distraction

### Performance

- Gear SVG paths are static (regenerated only on resize)
- Only rotate transforms change per frame
- ~15-20 `<g>` elements with 2 paths each ≈ 40 path elements total

## Files Changed

- **Replace:** `src/lib/gears.ts` — involute math, gear train graph, chain layout
- **Modify:** `src/components/GearBackground.tsx` — use new data structures and rotation propagation
- **No changes** to layout, pages, content pipeline, routing, or styles
