#!/usr/bin/env python3
"""Fail if same-depth tunnel centerlines intersect in plan (2D segments)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.visualize_tunnels import Config, TunnelNetwork  # noqa: E402

SPEC = json.loads((ROOT / "shared" / "tunnel-config.json").read_text())
MIN_SEP = float(SPEC.get("minVerticalSeparationFt", 12))


def cross(o: tuple[float, float], a: tuple[float, float], b: tuple[float, float]) -> float:
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def segments_intersect(
    a: tuple[float, float],
    b: tuple[float, float],
    c: tuple[float, float],
    d: tuple[float, float],
) -> bool:
    return (
        cross(a, b, c) * cross(a, b, d) < 0
        and cross(c, d, a) * cross(c, d, b) < 0
    )


def main() -> None:
    net = TunnelNetwork(Config())
    tunnels: list[tuple[str, str, str, object, float]] = []
    for u, v, data in net.G.edges(data=True):
        if data.get("type") == "tunnel":
            tunnels.append(
                (u, v, data["route_type"], data["path"], float(data["depth"]))
            )

    hits: list[str] = []
    for i in range(len(tunnels)):
        for j in range(i + 1, len(tunnels)):
            if abs(tunnels[i][4] - tunnels[j][4]) >= MIN_SEP:
                continue
            p1, p2 = tunnels[i][3], tunnels[j][3]
            for si in range(len(p1) - 1):
                a, b = tuple(p1[si]), tuple(p1[si + 1])
                for sj in range(len(p2) - 1):
                    c, d = tuple(p2[sj]), tuple(p2[sj + 1])
                    if segments_intersect(a, b, c, d):
                        hits.append(
                            f"{tunnels[i][2]} depth {tunnels[i][4]:.0f}ft: "
                            f"{tunnels[i][0]}→{tunnels[i][1]} x "
                            f"{tunnels[j][0]}→{tunnels[j][1]}"
                        )
                        break
                else:
                    continue
                break

    if hits:
        print(f"FAIL: {len(hits)} coplanar segment intersection(s) (sep < {MIN_SEP}ft):")
        for h in hits:
            print(f"  {h}")
        sys.exit(1)
    print(f"OK: no coplanar segment intersections (vertical sep >= {MIN_SEP}ft)")


if __name__ == "__main__":
    main()
