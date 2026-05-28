# Rotary Underpass Design Note

## Status

This is a conceptual engineering schematic, not a construction drawing. The current implementation models a shallow elliptical tunnel loop for a managed EV shuttle or controlled fleet. It is not intended for uncontrolled mixed private traffic.

## Design Goal

The rotary topology replaces depth-separated route weaving with one shared clockwise circulation loop. Instead of sending straight, left, and right movements through separate tunnel layers, vehicles enter a dedicated approach corridor, merge tangentially onto the rotary, circulate clockwise, and diverge at the target exit.

For Indian left-hand traffic, clockwise circulation keeps entry and exit movements aligned with low-angle tangential merges and diverges.

## Topology

- Four surface approaches: north, east, south, and west.
- Eight portals: one inbound and one outbound portal per approach.
- Eight dedicated approach corridors: inbound corridors connect portals to the rotary; outbound corridors return vehicles to the surface.
- One shared elliptical circulation ring: Configurable major diameter (250 ft to 500 ft) and a proportional minor diameter (always 84% of major diameter).
- Configurable lane width: Between 12 ft (minimum safe operation width) and 20 ft (maximum efficient capital expenditure envelope).
- Tangential ramps: short merge/diverge connectors between corridors and the shared loop.
- Retained inner core: the area inside the ellipse is assumed to remain mostly unexcavated ground.

## Retained Core Assumption

The center of the ellipse should not be read as an excavated underground hall or service chamber. Leaving the interior mostly unexcavated is the lower-cost and more structurally conservative assumption:

- excavation is limited to the ring tube plus approach corridors;
- the retained ground helps avoid a large cavern-like roof span;
- the design avoids recreating the station-box cost problem that small-diameter tunneling is meant to reduce.

Future versions may add small service niches, sumps, refuge points, or ventilation rooms only where a safety or civil design requires them. Those should be treated as localized additions, not as the default use of the whole core.

## Configuration Rationales and Safety Standards

### 1. Ramp Slope and Portal Setback Rationale
The portal setback represents the dedicated descending/ascending ramp length before merging underground. Under a target vertical depth clearance of 25 ft:
- **Slope Equation**: `Slope % = (25 / Setback) * 100`
- **Safe Limit (<= 8.5%)**: Slopes of 8% or less conform to standard highway gradient designs (IRC standards), allowing safe vehicle stopping distances and low powertrain strain during climbs.
- **Marginal Limit (8.5% to 15%)**: Steep grades require additional traction controls and slower descent speeds, but are acceptable in compact urban underpasses with limited space.
- **Critical/Unsafe Limit (> 15%)**: Dangerous runaway risks for heavy vehicles, poor traction under wet conditions, and high energy/thermal overhead for electric vehicles.

### 2. Rotary Major Diameter Safety Bounds
- **Optimal (250 ft to 400 ft)**: Provides sufficient horizontal queuing space to prevent merges from backing up into the entry portals while maintaining a compact footprint that minimizes excavation cost and crossing times.
- **Unsafe (< 250 ft)**: Extremely tight turning radii increase rollover hazards and congestion. Queuing space becomes highly limited, leading to immediate system-wide gridlock if an entry/exit gets clogged.
- **Inefficient (> 400 ft)**: Prohibitive excavation costs and longer crossing times, reducing the overall throughput advantage of the single-intersection layout.

## Advantages

- Simpler plan geometry than a multi-layer interchange.
- Continuous curvature and tangential transitions.
- Larger horizontal queueing circumference.
- Fewer plan-view crossings.
- Potentially shallower deployment than deep stacked right-turn bypasses.

## Open Engineering Risks

- Merge/diverge capacity may become the governing bottleneck.
- A blocked vehicle on the shared loop can affect multiple movements.
- Emergency evacuation and fire compartmenting need a separate safety concept.
- EV battery fire, ventilation, smoke control, and responder access remain unresolved.
- Flood protection and pumped drainage are mandatory in monsoon-prone cities.
- The 145 ft portal setback is a visual/default control. Comfortable grades to a useful tunnel depth may require longer approach ramps, likely in the 180-250 ft range depending on target depth and allowable gradient.
- Turning radius, clearance envelope, speed, and vehicle dynamics still need validation against the intended fleet.

## Implementation Boundary

The web app uses the rotary topology as the single unified model:

- **2D Schematic** (`api/generate.py`): Matplotlib rendering of the elliptical ring, lane-width patches, approach corridors, ramp connectors, and all dimension labels. All parameters (major diameter, lane width, portal setback) are fully configurable and drive viewport scaling automatically.
- **Vehicle Simulation** (`src/utils/rotaryGeometry.ts`): The React SVG overlay uses the same parametric geometry as the Python backend, ensuring the vehicle paths stay consistent with the rendered schematic at all slider values.
- **Layered Tunnel Model (DEPRECATED)**: The earlier three-layer vertical stratification approach (L1–L3) has been retired. The rotary underpass is the sole proposed solution documented and visualised by this project.
