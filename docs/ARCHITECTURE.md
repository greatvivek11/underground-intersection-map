# UrbanDeep — System Architecture

This document describes how the web app, geometry engine, and export pipeline fit together.

## Overview

UrbanDeep is a **single-page React application** that presents a scroll-driven argument for micro-tunnel intersections in Indian cities, culminating in an interactive **Simulation Lab**. There is no backend database; state is local to components and URL query params are only used for the export API.

Two runtimes share geometry **constants** but implement the **routing algorithm** separately:

| Runtime | Entry | Output |
|---------|-------|--------|
| Browser (TypeScript) | `src/utils/geometry.ts` | Live 2D canvas + Three.js scene |
| Server / CLI (Python) | `src/visualize_tunnels.py` | Publication-quality SVG/PNG |

## Single source of truth

**`shared/tunnel-config.json`** holds:

- `defaults` — intersection size, portal setback/offset, ramp length, curve gains (`kLeft`, `kRight`), `bezierPoints`, `straightOffset`
- `approaches` — inbound/outbound unit vectors per leg (S/N/E/W)
- `routes` — twelve tunnel movements with type, depth layer, and theme colors

Both consumers load this file at startup. **Do not** duplicate magic numbers in `geometry.ts`, `visualize_tunnels.py`, or `Sandbox.tsx`; use `DEFAULT_TUNNEL_CONFIG` / `buildTunnelConfig()` in TypeScript and `Config` in Python.

### Drift prevention

Run after any geometry change:

```bash
npm run test:geometry
```

`scripts/compare_geometry.py` builds networks with default config in both languages and asserts all node positions and tunnel path vertices match within `1e-5` feet.

## Geometry algorithm (both implementations)

1. Place each approach anchor on the intersection square (`intersectionSize / 2`).
2. Compute **entry** and **exit** portals: setback along inbound direction, offset along LHT left normal.
3. **Divergence** / **merge** nodes: `descentLength` along inbound from entry/exit.
4. For each route in `routes`:
   - **Straight:** linear interpolation between offset divergence and merge points (`straightOffset`).
   - **Left / right:** cubic Bézier with control points at `kLeft` / `kRight` along inbound/outbound directions.
5. Attach descent/ascent ramp edges from entry→div and merge→exit.

The TypeScript API is `getTunnelNetwork(config)` → `{ nodes, edges }`. Python wraps the same graph in a `networkx.DiGraph` inside `TunnelNetwork`.

## Frontend layout

`src/App.tsx` owns global theme (`data-theme`), sticky navigation, and section order:

1. `Hero` — positioning and CTAs  
2. `SurfaceCrisis` — congestion statistics  
3. `GeometricShift` — 12 ft diameter volume calculator  
4. `FeasibilityStudy` — Chart.js radar (flyover vs metro vs micro-tunnel)  
5. `FeasibilityMatrix` — tabbed qualitative pillars  
6. `ScenarioModeler` — ICE vs EV ventilation cost donut  
7. `Sandbox` — Simulation Lab (2D/3D, sliders, export, fullscreen modal)

`ResearchReportModal` fetches markdown from `/indian-urban-tunnel-transit-feasibility-study.md` and renders it with a lightweight client-side parser.

## Simulation Lab

### 2D (`TunnelSimulation2D.tsx`)

Canvas-based engineering schematic: roads, portals, dimension callouts, tunnel paths colored by strata, surface traffic, and animated pods following stitched paths (entry → div → tunnel → merge → exit).

### 3D (`TunnelSimulation3D.tsx`)

Lazy-loaded Three.js module: extruded tubes from path samples, OrbitControls, exponential fog, directional light. Vehicles follow `CatmullRomCurve3` built from the same network edges.

### Config wiring

`Sandbox` keeps `portalSetback` in React state and passes `buildTunnelConfig({ portalSetback })` into both simulators. All other dimensions come from `tunnel-config.json` defaults.

## Export pipeline

```
Browser → GET /api/generate?setback=&dark=&format=
       → api/generate.py (Vercel Python handler)
       → Config + TunnelNetwork + TunnelRenderer
       → Matplotlib → SVG or PNG bytes
```

`api/generate.py` appends the repo root to `sys.path` and imports `src.visualize_tunnels`. Matplotlib uses the `Agg` backend.

**Local dev:** Vite does not serve this API. Use `python3 src/visualize_tunnels.py` or deploy to Vercel for button export.

## Deployment

- **Hosting:** Vercel (see `vercel.json` SPA rewrites to `index.html`, `/api/*` passthrough).
- **Analytics:** `@vercel/analytics/react` in `App.tsx`.
- **Build:** `npm run build` → static assets in `dist/`.

## Styling

Global tokens and blueprint grid live in `src/App.css`. Components use CSS variables (`--primary`, `--border-color`, etc.) toggled by `data-theme="dark" | "light"`. Default theme is dark.

## Python rendering extras

`visualize_tunnels.py` adds presentation-only logic not duplicated in TypeScript:

- `Theme` — light/dark Matplotlib colors  
- `TunnelRenderer` — roads, portals, measurements, decorative cars, legend  
- `Config.depth_layers` — alpha/glow per route type for drawing order  

Path coordinates must still match `geometry.ts`; only styling may differ.

## Core deconfliction (L-2 / L-3)

Perpendicular tunnels cannot share one plan depth without either crossing in XY or using a flyover. This project uses **both**:

1. **`coreOffsetX` / `coreOffsetY`** — world-space shift (feet) so opposing lanes (e.g. S→N vs N→S) do not get mirrored into the same side.
2. **Staggered `depth` per route** — where L-2 or L-3 paths still cross in plan, depths differ by at least `minVerticalSeparationFt` (12 ft for 12 ft tubes). Example: N/S straights at −27 ft, E/W straights at −39 ft; right turns at −52 / −64 / −76 ft.

`npm run test:intersections` asserts no coplanar centerline crossings below that vertical tolerance.

L-1 left turns use shallow outer arcs with zero core offset.

The **Underground** camera preset removes the polar-angle floor so users can orbit below the surface mesh.

## Known limitations

- Research markdown is duplicated in `docs/` and `public/`; the app reads **`public/`** only.
- Export API requires Python + Matplotlib on the deployment target.
- README formerly described a Python-only CLI project; the web app is now the primary interface.

## Related files

- `shared/tunnel-config.json` — edit constants here first  
- `src/utils/geometry.ts` — browser network builder  
- `src/visualize_tunnels.py` — Matplotlib network + renderer  
- `scripts/compare_geometry.py` — alignment test  
- `scripts/export-network-ts.ts` — JSON dump for the test harness  
