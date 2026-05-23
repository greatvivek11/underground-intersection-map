#!/usr/bin/env python3
"""
Compare tunnel network coordinates from visualize_tunnels.py and geometry.ts.
Exits 0 when all tunnel paths and nodes match within tolerance.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.visualize_tunnels import Config, TunnelNetwork  # noqa: E402

TOLERANCE = 1e-5


def serialize_python_network(network: TunnelNetwork) -> dict:
    nodes = {
        name: network.G.nodes[name]["pos"].tolist()
        for name in network.G.nodes
    }
    edges = []
    for u, v, attrs in network.G.edges(data=True):
        if attrs.get("type") != "tunnel":
            continue
        path = attrs["path"]
        edges.append(
            {
                "from": u,
                "to": v,
                "path": path.tolist() if hasattr(path, "tolist") else path,
            }
        )
    edges.sort(key=lambda e: (e["from"], e["to"]))
    return {"nodes": nodes, "edges": edges}


def load_ts_network() -> dict:
    result = subprocess.run(
        ["npx", "tsx", "scripts/export-network-ts.ts"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        print("Failed to run TypeScript geometry export:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout)


def max_path_delta(a: list, b: list) -> float:
    arr_a = np.array(a, dtype=float)
    arr_b = np.array(b, dtype=float)
    if arr_a.shape != arr_b.shape:
        return float("inf")
    return float(np.max(np.abs(arr_a - arr_b)))


def compare_networks(py_data: dict, ts_data: dict) -> list[str]:
    errors: list[str] = []

    py_nodes = py_data["nodes"]
    ts_nodes = ts_data["nodes"]
    if set(py_nodes) != set(ts_nodes):
        errors.append(
            f"Node key mismatch. Python: {sorted(py_nodes)} TS: {sorted(ts_nodes)}"
        )
        return errors

    for key in sorted(py_nodes):
        delta = max_path_delta([py_nodes[key]], [ts_nodes[key]])
        if delta > TOLERANCE:
            errors.append(f"Node {key} delta {delta:.2e} > {TOLERANCE}")

    py_edges = {(e["from"], e["to"]): e["path"] for e in py_data["edges"]}
    ts_edges = {(e["from"], e["to"]): e["path"] for e in ts_data["edges"]}

    if set(py_edges) != set(ts_edges):
        errors.append("Tunnel edge key mismatch between Python and TypeScript.")
        return errors

    for key in sorted(py_edges):
        delta = max_path_delta(py_edges[key], ts_edges[key])
        if delta > TOLERANCE:
            errors.append(f"Edge {key} max path delta {delta:.2e} > {TOLERANCE}")

    return errors


def main() -> None:
    config = Config()
    py_network = TunnelNetwork(config)
    py_data = serialize_python_network(py_network)
    ts_raw = load_ts_network()
    ts_data = {
        "nodes": ts_raw["nodes"],
        "edges": sorted(
            [
                {"from": e["from"], "to": e["to"], "path": e["path"]}
                for e in ts_raw["edges"]
                if e.get("type") == "tunnel"
            ],
            key=lambda e: (e["from"], e["to"]),
        ),
    }

    errors = compare_networks(py_data, ts_data)
    if errors:
        print("Geometry alignment FAILED:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    print(
        f"Geometry alignment OK ({len(py_data['nodes'])} nodes, "
        f"{len(py_data['edges'])} tunnel edges, tolerance {TOLERANCE})."
    )


if __name__ == "__main__":
    main()
