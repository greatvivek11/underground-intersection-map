# Underground Tunnel Intersection Routing System

This project implements a sophisticated visualization system for a 4-way urban intersection, designed under Indian Left-Hand Traffic (LHT) rules. It functions as a conceptual "mobility router" or "vehicular network graph," generating premium, engineering-style 2D schematics in both SVG and PNG formats. The system focuses on optimizing subterranean traffic flow with advanced routing logic and visual clarity.

## Key Features (Version 2.0 Optimized)

The visualization incorporates several advanced engineering and design principles:

*   **Indian Left-Hand Traffic (LHT) Paradigm:** Accurately models portal placement and traffic flow according to LHT rules.
*   **Depth-Separated Strata (L1-L3):** Tunnels are visually represented across three depth layers to manage structural complexity and reduce central congestion:
    *   **L-1 (Shallow):** Optimized for Left Turn Tunnels.
    *   **L-2 (Primary):** Main corridors for Straight-through Tunnels.
    *   **L-3 (Deep Bypass):** For Right Turn Tunnels that require the most clearance.
*   **Fuel-Efficient Hybrid Splines:** Routing paths utilize a hybrid of straight segments and smooth Bezier curves. This design prioritizes the absolute shortest path while maintaining engineering requirements for high-speed transition curves, optimizing for cumulative time and fuel savings.
*   **Offset Central Switching Fabric:** Straight-through tunnels are subtly offset from the absolute center to reduce intersection density and improve structural clearances in the core.
*   **Comprehensive Visual Elements:**
    *   Detailed measurement callouts for portal setback, road width, and intersection core dimensions.
    *   Traffic car symbols to simulate live flow on surface lanes.
    *   Support for both `LIGHT (Sleek Technical)` and `DARK (Cyberpunk Blueprint)` themes.

## Project Structure

*   `src/`: Contains the core Python script for generating the visualizations.
    *   `visualize_tunnels.py`: The main script that defines the geometry, network topology, and rendering logic.
*   `docs/`: Contains supporting documentation and feasibility studies.
    *   `urban_tunneling_summary.md`: An executive summary outlining the core paradigm, engineering constraints, and urban application of micro-tunnels.
*   `artefacts/`: Stores the generated output diagrams.
    *   `tunnel_routing_schematic.png`: High-resolution PNG output.
    *   `tunnel_routing_schematic.svg`: Scalable Vector Graphic (SVG) output.
*   `requirements.txt`: Lists all Python dependencies required to run the project.

## Setup Guide

To set up and run the project, follow these steps:

### Prerequisites

*   Python 3.x
*   `pip` (Python package installer)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd underground-intersection-map
    ```
2.  **Create a virtual environment (recommended):**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Usage

Run the visualization script from the project root.

```bash
python3 src/visualize_tunnels.py [OPTIONS]
```

### Command-Line Arguments

*   `--dark`: Generate a dark-mode cyberpunk/blueprint theme instead of the default light schematic.
    *   Example: `--dark`
*   `--setback <distance>`: Configure the tunnel portal setback distance in feet.
    *   Default: `75.0` ft
    *   Example: `--setback 100.0`
*   `--output-png <path>`: Specify the path to save the PNG output diagram.
    *   Default: `tunnel_routing_schematic.png`
    *   Example: `--output-png my_diagram.png`
*   `--output-svg <path>`: Specify the path to save the SVG vector output.
    *   Default: `tunnel_routing_schematic.svg`
    *   Example: `--output-svg my_diagram.svg`

### Examples

**Generate a light-themed diagram with default settings:**

```bash
python3 src/visualize_tunnels.py
```

**Generate a dark-themed diagram with a custom setback:**

```bash
python3 src/visualize_tunnels.py --dark --setback 120.0 --output-png artefacts/dark_schematic.png
```

This project provides a robust framework for conceptualizing and visualizing complex underground urban mobility solutions, prioritizing both engineering realism and efficient traffic flow.