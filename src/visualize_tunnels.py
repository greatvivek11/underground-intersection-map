#!/usr/bin/env python3
"""
Underground Tunnel-Routing Visualization System
Models a 4-way urban intersection under Indian Left-Hand Traffic (LHT) rules.
Generates premium, engineering-style 2D schematics in SVG and PNG.
"""

import os
import argparse
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.path import Path
from matplotlib.transforms import Affine2D

# ==============================================================================
# 1. Configuration & Styling System
# ==============================================================================

class Theme:
    """Colors and style tokens for rendering themes."""
    def __init__(self, is_dark=False):
        if is_dark:
            self.bg = "#0B0E14"          # Carbon Black
            self.grid = "#1A1F2C"        # Dark Gray Grid
            self.road_fill = "#1E2530"   # Muted dark slate for roads (alpha-handled in draw)
            self.road_edge = "#3A4556"   # Muted road boundary
            self.median_fill = "#2E3B4E" # Slate-blue medians
            self.lane_dash = "#4E5D73"   # Dash lane color
            self.portal_fill = "#1A1F2C" # Base portal fill
            self.portal_edge = "#00E5FF" # Glowing neon cyan border
            
            # Tunnel Route accent colors (Glowing Neon)
            self.tunnel_straight = "#38BDF8" # Neon Blue
            self.tunnel_left = "#34D399"     # Neon Emerald Green
            self.tunnel_right = "#F87171"    # Neon Crimson/Coral
            self.text = "#E2E8F0"            # White/Slate text
            self.text_muted = "#94A3B8"      # Muted slate text
        else:
            self.bg = "#F8F9FA"          # Off-white / Premium paper
            self.grid = "#E5E7EB"        # Light gray grid
            self.road_fill = "#E2E8F0"   # Light slate for roads (alpha-handled in draw)
            self.road_edge = "#94A3B8"   # Slate road boundary
            self.median_fill = "#CBD5E1" # Muted green-gray medians
            self.lane_dash = "#FFFFFF"   # Lane dashed white
            self.portal_fill = "#334155" # Dark slate portal fill
            self.portal_edge = "#1E293B" # Dark slate border
            
            # Tunnel Route accent colors (High-Contrast Premium)
            self.tunnel_straight = "#2563EB" # Royal Blue
            self.tunnel_left = "#059669"     # Emerald Green
            self.tunnel_right = "#DC2626"    # Deep Crimson Red
            self.text = "#0F172A"            # Dark charcoal text
            self.text_muted = "#64748B"      # Muted slate text


class Config:
    """Dimensional constants and mathematical configuration."""
    # Intersection geometry (in feet)
    road_width = 80.0       # Total width of the road cross-section
    lane_width = 12.0       # Width of an individual lane
    median_width = 8.0      # Width of the center median
    intersection_size = 140.0 # Length of intersection square boundaries
    
    # Portals and setback parameters
    portal_setback = 75.0   # Setback distance from the intersection edge
    portal_offset = 28.0    # Offset from centerline to outer lane edge (4 + 12 + 12 = 28 ft)
    descent_length = 30.0   # Descent/ascent corridor ramp length
    
    # Graphic and curve variables
    k_left = 30.0           # Reduced for tighter, more efficient lefts
    k_right = 55.0          # Optimized for right-hand turns
    bezier_points = 150     # Number of interpolation steps for splines
    
    # Depth Layering Logic
    depth_layers = {
        "left": {"level": -1, "alpha": 1.0, "glow": 2.0},
        "straight": {"level": -2, "alpha": 0.85, "glow": 1.5},
        "right": {"level": -3, "alpha": 0.70, "glow": 1.0}
    }
    
    # Rendering output
    dpi = 300
    figsize = (10, 10)      # Resulting in 3000x3000px resolution


# ==============================================================================
# 2. Geometric Mathematics Module
# ==============================================================================

def get_left_normal(direction):
    """
    Returns the unit normal vector pointing to the left of the direction of travel.
    Under LHT rules, portals are always shifted to the left.
    """
    dx, dy = direction
    # Rotation of 90 degrees counter-clockwise: (-dy, dx)
    return np.array([-dy, dx], dtype=float)


def compute_bezier(p0, p1, p2, p3, n_points=100):
    """
    Computes points along a cubic Bézier curve defined by p0, p1, p2, p3.
    """
    t = np.linspace(0, 1, n_points)[:, np.newaxis]
    curve = (1-t)**3 * p0 + 3*(1-t)**2 * t * p1 + 3*(1-t) * t**2 * p2 + t**3 * p3
    return curve


# ==============================================================================
# 3. Directed Graph Topology Model
# ==============================================================================

class TunnelNetwork:
    """
    Constructs the directed graph using networkx and populates physical coordinates
    for entry/exit portals, descent/ascent ramps, and routing splines.
    """
    def __init__(self, config):
        self.cfg = config
        self.G = nx.DiGraph()
        
        # Directions mapping: Name -> (inbound_vector, outbound_vector)
        # Note: Origin is at (0,0)
        self.approaches = {
            "S": {"in": np.array([0, 1]), "out": np.array([0, -1])},  # From South going North
            "N": {"in": np.array([0, -1]), "out": np.array([0, 1])},  # From North going South
            "E": {"in": np.array([-1, 0]), "out": np.array([1, 0])},  # From East going West
            "W": {"in": np.array([1, 0]), "out": np.array([-1, 0])}   # From West going East
        }
        
        self._build_nodes()
        self._build_edges()
        
    def _build_nodes(self):
        """Calculates coordinates for all infrastructure nodes in LHT."""
        # Calculate portal and ramp nodes for each approach
        half_box = self.cfg.intersection_size / 2.0
        
        for name, vecs in self.approaches.items():
            dir_in = vecs["in"]
            dir_out = vecs["out"]
            norm_in_left = get_left_normal(dir_in)
            norm_out_left = get_left_normal(dir_out)
            
            # Base intersection anchor for this approach
            # S is at (0, -half_box), N at (0, half_box), etc.
            anchor = dir_in * -half_box
            
            # 1. Entry Portal Coordinates:
            # Shifted along the road away from center by setback, and to the left of travel by portal_offset
            entry_pos = anchor - (dir_in * self.cfg.portal_setback) + (norm_in_left * self.cfg.portal_offset)
            
            # 2. Exit Portal Coordinates:
            # Shifted along the road away from center by setback, and to the left of outbound travel
            exit_pos = anchor - (dir_in * self.cfg.portal_setback) + (norm_out_left * self.cfg.portal_offset)
            
            # 3. Descent Node (Divergence node where one-way entry splits into L, S, R):
            # Descent corridor goes straight in the direction of travel
            div_pos = entry_pos + (dir_in * self.cfg.descent_length)
            
            # 4. Ascent Node (Merge node where L, S, R merge before exiting):
            # Ascent corridor goes straight to the exit portal
            merge_pos = exit_pos + (dir_in * self.cfg.descent_length)
            
            # Add nodes to graph with position, approach, and node type attributes
            self.G.add_node(f"{name}_entry", pos=entry_pos, type="entry", approach=name)
            self.G.add_node(f"{name}_div", pos=div_pos, type="div", approach=name)
            self.G.add_node(f"{name}_merge", pos=merge_pos, type="merge", approach=name)
            self.G.add_node(f"{name}_exit", pos=exit_pos, type="exit", approach=name)

    def _build_edges(self):
        """Connects entry tunnels to divergence nodes and creates custom routed edges."""
        # Standard approach ramps (straight lines)
        for name in self.approaches:
            self.G.add_edge(f"{name}_entry", f"{name}_div", type="descent", route_type="straight")
            self.G.add_edge(f"{name}_merge", f"{name}_exit", type="ascent", route_type="straight")
            
        # Core routing rules connecting divergence to merge nodes
        # Left-Hand Traffic routing table:
        # Straight: S->N, N->S, E->W, W->E
        # Left turn: S->W, W->N, N->E, E->S
        # Right turn: S->E, E->N, N->W, W->S
        
        self.routes = [
            ("S", "N", "straight"), ("N", "S", "straight"), ("E", "W", "straight"), ("W", "E", "straight"), # Straights
            ("S", "W", "left"),     ("W", "N", "left"),     ("N", "E", "left"),     ("E", "S", "left"),     # Left Turns
            ("S", "E", "right"),    ("E", "N", "right"),    ("N", "W", "right"),    ("W", "S", "right")     # Right Turns
        ]
        
        for u_app, v_app, r_type in self.routes:
            u_node = f"{u_app}_div"
            v_node = f"{v_app}_merge"
            
            # Calculate procedural splines/paths
            path_pts = self._generate_route_path(u_app, v_app, r_type)
            
            self.G.add_edge(
                u_node, v_node,
                type="tunnel",
                route_type=r_type,
                path=path_pts
            )

    def _generate_route_path(self, start, end, route_type):
        """Generates coordinate arrays representing optimized hybrid tunnel paths."""
        p0 = self.G.nodes[f"{start}_div"]["pos"]
        p3 = self.G.nodes[f"{end}_merge"]["pos"]
        
        d_in = self.approaches[start]["in"]
        d_out = self.approaches[end]["out"]
        
        # Central Offset to reduce congestion at (0,0)
        # Straight-through tunnels will be slightly separated
        offset_val = 6.0
        
        if route_type == "straight":
            # Straight-through with slight lateral offset to reduce central density
            norm = get_left_normal(d_in)
            p0_off = p0 + norm * offset_val
            p3_off = p3 + norm * offset_val
            t_vals = np.linspace(0, 1, self.cfg.bezier_points)[:, np.newaxis]
            return p0_off * (1 - t_vals) + p3_off * t_vals
            
        elif route_type == "left":
            # Hybrid Left: Straight -> Curve -> Straight
            # Minimizes curvature time to save fuel/time
            p1 = p0 + (d_in * self.cfg.k_left)
            p2 = p3 - (d_out * self.cfg.k_left)
            return compute_bezier(p0, p1, p2, p3, self.cfg.bezier_points)
            
        elif route_type == "right":
            # Optimized Right Turn: Uses deeper "pinwheel" logic but straighter entry/exit
            p1 = p0 + (d_in * self.cfg.k_right)
            p2 = p3 - (d_out * self.cfg.k_right)
            return compute_bezier(p0, p1, p2, p3, self.cfg.bezier_points)
            
        return np.array([p0, p3])


# ==============================================================================
# 4. Matplotlib Visual Rendering Engine
# ==============================================================================

class TunnelRenderer:
    """Renders the graphical representation of the surface and underground layers."""
    def __init__(self, network, config, theme):
        self.network = network
        self.cfg = config
        self.theme = theme
        
    def render(self, output_png, output_svg):
        """Executes the visual composition and saves to disk."""
        plt.style.use('default')
        fig, ax = plt.subplots(figsize=self.cfg.figsize, dpi=self.cfg.dpi)
        fig.patch.set_facecolor(self.theme.bg)
        ax.set_facecolor(self.theme.bg)
        
        # Enable engineering grid
        ax.grid(color=self.theme.grid, linestyle='--', linewidth=0.5, zorder=0)
        
        # Limits (adding buffer space for portals and annotations)
        limit = self.cfg.intersection_size / 2.0 + self.cfg.portal_setback + 50.0
        ax.set_xlim(-limit, limit)
        ax.set_ylim(-limit, limit)
        ax.set_aspect('equal')
        
        # Render Layers in explicit z-order
        self._draw_surface_roads(ax)
        self._draw_tunnel_troughs(ax)  # Subtle shadow lines for tunnel structures
        self._draw_tunnels(ax)
        self._draw_portals(ax)
        self._draw_nodes(ax)
        self._draw_measurements(ax)
        self._draw_cars(ax)
        self._draw_decorations(ax)
        
        # Crop margins tightly and save
        plt.subplots_adjust(left=0.02, right=0.98, top=0.98, bottom=0.02)
        
        # Save high-res PNG
        plt.savefig(output_png, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
        # Save vector SVG
        plt.savefig(output_svg, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight', format='svg')
        plt.close()
        
    def _draw_surface_roads(self, ax):
        """Draws the symmetric 4-way surface road layout."""
        w = self.cfg.road_width
        hw = w / 2.0
        hb = self.cfg.intersection_size / 2.0
        tot_len = hb + self.cfg.portal_setback + 40.0
        
        road_params = {
            "facecolor": self.theme.road_fill,
            "edgecolor": self.theme.road_edge,
            "linewidth": 1.2,
            "alpha": 0.35,
            "zorder": 1
        }
        
        # East-West Corridor
        ew_road = patches.Rectangle((-tot_len, -hw), 2 * tot_len, w, **road_params)
        # North-South Corridor
        ns_road = patches.Rectangle((-hw, -tot_len), w, 2 * tot_len, **road_params)
        
        ax.add_patch(ew_road)
        ax.add_patch(ns_road)
        
        # Clean up overlap boundaries (draw central intersection square to unified fill)
        center_box = patches.Rectangle((-hw, -hw), w, w, facecolor=self.theme.road_fill, alpha=0.35, zorder=1.5)
        ax.add_patch(center_box)
        
        # Lane Dividers and Medians
        median_params = {
            "facecolor": self.theme.median_fill,
            "edgecolor": self.theme.road_edge,
            "linewidth": 0.8,
            "alpha": 0.5,
            "zorder": 2
        }
        
        hm = self.cfg.median_width / 2.0
        
        # Draw Medians on all four legs
        ax.add_patch(patches.Rectangle((-tot_len, -hm), tot_len - hw, self.cfg.median_width, **median_params)) # West Median
        ax.add_patch(patches.Rectangle((hw, -hm), tot_len - hw, self.cfg.median_width, **median_params))       # East Median
        ax.add_patch(patches.Rectangle((-hm, hw), self.cfg.median_width, tot_len - hw, **median_params))       # North Median
        ax.add_patch(patches.Rectangle((-hm, -tot_len), self.cfg.median_width, tot_len - hw, **median_params)) # South Median
        
        # Lane Dividers (dashed lines)
        dash_style = (10, 8)
        divider_params = {
            "color": self.theme.lane_dash,
            "linestyle": "--",
            "linewidth": 0.8,
            "dashes": dash_style,
            "alpha": 0.4,
            "zorder": 2
        }
        
        # Lane offsets relative to median edge (e.g. median + 12 ft lane width)
        # In LHT, these help define lane lanes
        l_offset = hm + self.cfg.lane_width
        
        # E-W Lane dividers
        ax.plot([-tot_len, -hw], [l_offset, l_offset], **divider_params)
        ax.plot([-tot_len, -hw], [-l_offset, -l_offset], **divider_params)
        ax.plot([hw, tot_len], [l_offset, l_offset], **divider_params)
        ax.plot([hw, tot_len], [-l_offset, -l_offset], **divider_params)
        
        # N-S Lane dividers
        ax.plot([l_offset, l_offset], [-tot_len, -hw], **divider_params)
        ax.plot([-l_offset, -l_offset], [-tot_len, -hw], **divider_params)
        ax.plot([l_offset, l_offset], [hw, tot_len], **divider_params)
        ax.plot([-l_offset, -l_offset], [hw, tot_len], **divider_params)

    def _draw_tunnel_troughs(self, ax):
        """Draws subtle casing contours beneath tunnels to emphasize the subterranean tubes."""
        for u, v, data in self.network.G.edges(data=True):
            if data["type"] == "tunnel":
                path = data["path"]
                ax.plot(path[:, 0], path[:, 1], color=self.theme.bg, linewidth=7.0, alpha=0.9, zorder=3)
                ax.plot(path[:, 0], path[:, 1], color=self.theme.grid, linewidth=5.0, alpha=0.3, zorder=3.5)

    def _draw_tunnels(self, ax):
        """Renders optimized underground routes with depth-based visual encoding."""
        for u, v, data in self.network.G.edges(data=True):
            r_type = data["route_type"]
            depth_cfg = self.cfg.depth_layers.get(r_type, {"alpha": 1.0, "glow": 1.0})
            
            # Select color and visual properties based on depth layer
            if r_type == "straight":
                color = self.theme.tunnel_straight
                label = "Straight (L-2)"
            elif r_type == "left":
                color = self.theme.tunnel_left
                label = "Left Turn (L-1)"
            else:
                color = self.theme.tunnel_right
                label = "Right Turn (L-3)"
                
            if data["type"] == "tunnel":
                path = data["path"]
                alpha = depth_cfg["alpha"]
                
                # Main tunnel line with depth-encoded alpha
                ax.plot(path[:, 0], path[:, 1], color=color, linewidth=2.5, alpha=alpha, zorder=4, label=label)
                
                # Dynamic directional arrow
                arrow_idx = int(len(path) * 0.6)
                p_curr = path[arrow_idx]
                p_next = path[arrow_idx + 1]
                dp = p_next - p_curr
                dp_len = np.linalg.norm(dp)
                
                if dp_len > 0:
                    ax.annotate(
                        "", 
                        xy=p_next, 
                        xytext=p_curr,
                        arrowprops=dict(
                            arrowstyle="-|>", 
                            color=color, 
                            alpha=alpha,
                            lw=0, 
                            mutation_scale=8.0,
                            shrinkA=0,
                            shrinkB=0
                        ),
                        zorder=4.5
                    )
            
            elif data["type"] in ["descent", "ascent"]:
                # Solid connector lines for the ascent/descent corridors (colored dark slate or muted accent)
                p_start = self.network.G.nodes[u]["pos"]
                p_end = self.network.G.nodes[v]["pos"]
                
                # Descent is drawn in entry-straight color, ascent in straight exit color
                ax.plot(
                    [p_start[0], p_end[0]], 
                    [p_start[1], p_end[1]], 
                    color=self.theme.text_muted, 
                    linestyle=":", 
                    linewidth=2.0, 
                    zorder=3.8
                )

    def _draw_portals(self, ax):
        """Draws highly stylized engineering portals on the left side of roads."""
        for node_id, data in self.network.G.nodes(data=True):
            if data["type"] in ["entry", "exit"]:
                pos = data["pos"]
                app = data["approach"]
                in_out = data["type"]
                
                # Compute tangent angle for portal rotation
                vecs = self.network.approaches[app]
                dir_vec = vecs["in"] if in_out == "entry" else vecs["out"]
                angle = np.degrees(np.arctan2(dir_vec[1], dir_vec[0]))
                
                # Portal layout: Stylized structural gradient wedge/rectangle
                p_width = 14.0
                p_length = 24.0
                
                # Rectangle aligned with the approach orientation
                # Centered over the portal node
                r_dx = -p_length / 2.0
                r_dy = -p_width / 2.0
                
                # Rotated structural box
                portal_box = patches.Rectangle(
                    (r_dx, r_dy), p_length, p_width,
                    facecolor=self.theme.portal_fill,
                    edgecolor=self.theme.portal_edge,
                    linewidth=1.5,
                    zorder=5
                )
                
                # Apply coordinate rotation matrix
                t = Affine2D().rotate_deg(angle).translate(pos[0], pos[1]) + ax.transData
                portal_box.set_transform(t)
                ax.add_patch(portal_box)
                
                # Subtle hatch pattern indicating concrete structural grating inside portals
                hatch_box = patches.Rectangle(
                    (r_dx + 2, r_dy + 2), p_length - 4, p_width - 4,
                    facecolor='none',
                    edgecolor=self.theme.text_muted,
                    hatch='///',
                    linewidth=0,
                    alpha=0.3,
                    zorder=5.2
                )
                hatch_box.set_transform(t)
                ax.add_patch(hatch_box)
                
                # Text labels (Entry / Exit indicators next to portals)
                lbl = "IN" if in_out == "entry" else "OUT"
                offset_vec = get_left_normal(dir_vec) * -12.0 # Offset text opposite to left to avoid road center overlap
                
                ax.text(
                    pos[0] + offset_vec[0], pos[1] + offset_vec[1],
                    f"{app} {lbl}",
                    color=self.theme.text,
                    fontsize=8,
                    fontweight="bold",
                    ha="center",
                    va="center",
                    zorder=6,
                    bbox=dict(facecolor=self.theme.bg, edgecolor='none', alpha=0.8, pad=1.5)
                )

    def _draw_nodes(self, ax):
        """Highlights divergence and merge nodes with styled indicators."""
        for node_id, data in self.network.G.nodes(data=True):
            if data["type"] in ["div", "merge"]:
                pos = data["pos"]
                is_div = data["type"] == "div"
                
                # Node markers (Divergence = splitting outwards, Merge = merging inwards)
                marker_color = self.theme.tunnel_right if is_div else self.theme.tunnel_straight
                symbol = "o"
                
                ax.plot(
                    pos[0], pos[1], 
                    marker=symbol, 
                    markersize=6, 
                    color=marker_color, 
                    markeredgecolor=self.theme.text, 
                    markeredgewidth=1.0, 
                    zorder=5.5
                )
                
                # Label divergence/merge branches minimally
                # e.g., 'S/M'
                lbl = "Div" if is_div else "Mrg"
                ax.text(
                    pos[0] + 8, pos[1] - 3,
                    lbl,
                    color=self.theme.text_muted,
                    fontsize=7,
                    fontstyle="italic",
                    ha="left",
                    va="top",
                    zorder=5.6
                )

    def _draw_measurements(self, ax):
        """Adds dimension lines and labels for engineering clarity."""
        hb = self.cfg.intersection_size / 2.0
        ps = self.cfg.portal_setback
        rw = self.cfg.road_width
        
        meas_color = self.theme.text_muted
        arrow_props = dict(arrowstyle='<->', color=meas_color, lw=0.8, shrinkA=0, shrinkB=0)
        
        # 1. Portal Setback Measurement (South approach as example)
        # Line from intersection edge to portal entry
        y_start = -hb
        y_end = -hb - ps
        x_pos = -self.cfg.portal_offset - 15.0
        
        ax.annotate('', xy=(x_pos, y_start), xytext=(x_pos, y_end), arrowprops=arrow_props)
        ax.text(x_pos - 2, (y_start + y_end)/2, f"{ps} ft Setback", 
                color=meas_color, fontsize=7, rotation=90, va='center', ha='right')

        # 2. Road Width Measurement
        ax.annotate('', xy=(-rw/2, hb + 20), xytext=(rw/2, hb + 20), arrowprops=arrow_props)
        ax.text(0, hb + 25, f"Road Width: {rw} ft", 
                color=meas_color, fontsize=7, ha='center', va='bottom')
        
        # 3. Intersection Box Dimension
        ax.annotate('', xy=(hb + 10, -hb), xytext=(hb + 10, hb), arrowprops=arrow_props)
        ax.text(hb + 15, 0, f"Core: {self.cfg.intersection_size} ft", 
                color=meas_color, fontsize=7, rotation=270, va='center', ha='left')

    def _draw_cars(self, ax):
        """Draws simple car shapes to represent traffic flow in LHT."""
        car_w = 4.5
        car_l = 10.0
        
        # Define lane centers for LHT (Left side of travel)
        # Median half-width is 4ft. Lanes are 12ft wide.
        inner_lane = 4.0 + 6.0  # 10 ft from center
        outer_lane = 4.0 + 12.0 + 6.0 # 22 ft from center
        
        traffic_positions = []
        
        for name, vecs in self.network.approaches.items():
            dir_in = vecs["in"]
            dir_out = vecs["out"]
            norm_in = get_left_normal(dir_in)
            norm_out = get_left_normal(dir_out)
            
            # Inbound cars (towards intersection)
            for dist in [120, 180, 240]:
                # Inner lane
                traffic_positions.append({
                    "pos": (dir_in * -dist) + (norm_in * inner_lane),
                    "angle": np.degrees(np.arctan2(dir_in[1], dir_in[0])),
                    "color": "#94A3B8" if dist % 40 == 0 else "#64748B"
                })
                # Outer lane
                traffic_positions.append({
                    "pos": (dir_in * -(dist+30)) + (norm_in * outer_lane),
                    "angle": np.degrees(np.arctan2(dir_in[1], dir_in[0])),
                    "color": "#475569"
                })
                
            # Outbound cars (away from intersection)
            for dist in [100, 160, 220]:
                traffic_positions.append({
                    "pos": (dir_out * dist) + (norm_out * inner_lane),
                    "angle": np.degrees(np.arctan2(dir_out[1], dir_out[0])),
                    "color": "#334155"
                })

        for car in traffic_positions:
            rect = patches.Rectangle(
                (-car_l/2, -car_w/2), car_l, car_w,
                facecolor=car["color"],
                edgecolor=self.theme.road_edge,
                linewidth=0.5,
                alpha=0.8,
                zorder=2.5
            )
            t = Affine2D().rotate_deg(car["angle"]).translate(car["pos"][0], car["pos"][1]) + ax.transData
            rect.set_transform(t)
            ax.add_patch(rect)

    def _draw_decorations(self, ax):
        """Adds compass rose, legend, title and key technical annotations."""
        # 1. Main Title & Key parameters block
        title_box_params = dict(
            boxstyle="round,pad=0.6",
            facecolor=self.theme.bg,
            edgecolor=self.theme.road_edge,
            linewidth=0.8,
            alpha=0.9
        )
        
        title_text = (
            "UNDERGROUND TUNNEL INTERSECTION ROUTING\n"
            "Concept Design Paradigm — Indian Left-Hand Traffic (LHT)"
        )
        ax.text(
            0.03, 0.95,
            title_text,
            transform=ax.transAxes,
            color=self.theme.text,
            fontsize=11,
            fontweight="bold",
            va="top",
            ha="left",
            zorder=7,
            bbox=title_box_params
        )
        
        # Technical specifications block
        specs_text = (
            "SYSTEM PARAMETERS (v2.0 Optimized):\n"
            "• Tunnel Diameter: 12.0 ft / 3.65 m\n"
            "• Portal Setback (Configured): 75.0 ft\n"
            "• Routing: Depth-Separated Strata (L1-L3)\n"
            "• Geometry: Fuel-Efficient Hybrid Splines\n"
            "• Switching: Offset Central Switching Fabric"
        )
        ax.text(
            0.03, 0.85,
            specs_text,
            transform=ax.transAxes,
            color=self.theme.text_muted,
            fontsize=8.5,
            fontfamily="monospace",
            va="top",
            ha="left",
            zorder=7,
            bbox=dict(facecolor=self.theme.bg, edgecolor='none', alpha=0.85, pad=3)
        )
        
        # Disclaimer
        ax.text(
            0.5, 0.02,
            "DIAGRAM SCHEMATIC NOT TO SCALE • ALL UNITS IN FEET • PROC-GEOM ENGINE v1.0",
            transform=ax.transAxes,
            color=self.theme.text_muted,
            fontsize=7.5,
            fontweight="semibold",
            ha="center",
            va="bottom",
            zorder=7
        )

        # 2. Engineering Compass Rose
        self._draw_compass_rose(ax)
        
        # 3. Custom Structured Legend
        self._draw_legend(ax)

    def _draw_compass_rose(self, ax):
        """Draws an elegant, minimalist vector compass in the top right corner."""
        cx, cy = 0.90, 0.88  # Axes coordinates
        # Background disk
        circ = patches.Circle((cx, cy), 0.05, transform=ax.transAxes, facecolor=self.theme.bg, edgecolor=self.theme.road_edge, linewidth=0.8, alpha=0.9, zorder=7)
        ax.add_patch(circ)
        
        # Draw Arrowheads
        # North Pointing (Dark accent)
        ax.polygon = ax.fill(
            [cx, cx - 0.015, cx, cx],
            [cy, cy, cy + 0.035, cy],
            transform=ax.transAxes,
            color=self.theme.tunnel_right,
            zorder=7.2
        )
        ax.fill(
            [cx, cx + 0.015, cx, cx],
            [cy, cy, cy + 0.035, cy],
            transform=ax.transAxes,
            color=self.theme.text_muted,
            zorder=7.2
        )
        
        # South Pointing
        ax.fill(
            [cx, cx - 0.012, cx, cx],
            [cy, cy, cy - 0.030, cy],
            transform=ax.transAxes,
            color=self.theme.text,
            alpha=0.6,
            zorder=7.2
        )
        ax.fill(
            [cx, cx + 0.012, cx, cx],
            [cy, cy, cy - 0.030, cy],
            transform=ax.transAxes,
            color=self.theme.text_muted,
            alpha=0.6,
            zorder=7.2
        )
        
        # Label "N"
        ax.text(
            cx, cy + 0.040,
            "N",
            transform=ax.transAxes,
            color=self.theme.text,
            fontsize=9,
            fontweight="bold",
            ha="center",
            va="bottom",
            zorder=7.3
        )
        
        # Label LHT driving indicators
        ax.text(
            cx, cy - 0.052,
            "LHT RULES",
            transform=ax.transAxes,
            color=self.theme.text_muted,
            fontsize=6.5,
            fontweight="bold",
            ha="center",
            va="top",
            zorder=7.3
        )

    def _draw_legend(self, ax):
        """Builds a beautiful, custom legend for layout layers and directions."""
        handles = [
            patches.Patch(facecolor=self.theme.road_fill, edgecolor=self.theme.road_edge, alpha=0.5, label="Surface Road Layout"),
            patches.Patch(facecolor=self.theme.portal_fill, edgecolor=self.theme.portal_edge, linewidth=1.5, label="Subterranean Portal Box"),
            plt.Line2D([0], [0], color=self.theme.tunnel_left, lw=2.5, alpha=1.0, label="L-1: Left Turn (Shallow)"),
            plt.Line2D([0], [0], color=self.theme.tunnel_straight, lw=2.5, alpha=0.85, label="L-2: Straight-through (Primary)"),
            plt.Line2D([0], [0], color=self.theme.tunnel_right, lw=2.5, alpha=0.7, label="L-3: Right Turn (Deep Bypass)"),
            plt.Line2D([0], [0], color=self.theme.text_muted, linestyle=":", lw=2.0, label="Transit Ramps (Descent / Ascent)")
        ]
        
        legend = ax.legend(
            handles=handles,
            loc="lower left",
            bbox_to_anchor=(0.03, 0.03),
            facecolor=self.theme.bg,
            edgecolor=self.theme.road_edge,
            framealpha=0.95,
            fontsize=8,
            title="INFRASTRUCTURE DIAGRAM LEGEND",
            title_fontsize=8.5
        )
        legend.set_zorder(7)
        
        plt.setp(legend.get_title(), fontweight='bold', color=self.theme.text)
        for text in legend.get_texts():
            text.set_color(self.theme.text)


# ==============================================================================
# 5. Pipeline Orchestration & CLI
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="Procedural Underground Tunnel-Routing Visualizer.")
    parser.add_argument("--dark", action="store_true", help="Generate dark-mode cyberpunk/blueprint theme instead of light schematic.")
    parser.add_argument("--setback", type=float, default=75.0, help="Configure tunnel portal setback distance in feet (default: 75.0)")
    parser.add_argument("--output-png", type=str, default="tunnel_routing_schematic.png", help="Path to save PNG output diagram.")
    parser.add_argument("--output-svg", type=str, default="tunnel_routing_schematic.svg", help="Path to save SVG vector output.")
    
    args = parser.parse_args()
    
    # Load and adjust configs
    config = Config()
    config.portal_setback = args.setback
    
    # Select theme
    theme = Theme(is_dark=args.dark)
    
    print("--------------------------------------------------")
    print(f"UNDERGROUND INTERSECTION ROUTING SYSTEM ENGINE")
    print("--------------------------------------------------")
    print(f"Rules Standard:   Indian Left-Hand Traffic (LHT)")
    print(f"Portal Setback:   {config.portal_setback} ft")
    print(f"Road Width:       {config.road_width} ft")
    print(f"Theme Mode:       {'DARK (Cyberpunk Blueprint)' if args.dark else 'LIGHT (Sleek Technical)'}")
    print("--------------------------------------------------")
    
    # Build procedural topology models
    print("[1/3] Generating graph structures using NetworkX...")
    network = TunnelNetwork(config)
    
    # Render layout
    print("[2/3] Computing geometric splines & rendering vector matrices...")
    renderer = TunnelRenderer(network, config, theme)
    
    # Save output artifacts
    print(f"[3/3] Exporting visual diagrams...")
    renderer.render(args.output_png, args.output_svg)
    
    print("--------------------------------------------------")
    print(f"SUCCESS: Architectural drawings generated successfully!")
    print(f"• High-resolution PNG saved:  {args.output_png} (3000x3000px, 300 DPI)")
    print(f"• Scalable Vector Graphic:    {args.output_svg} (SVG Vector Format)")
    print("--------------------------------------------------")


if __name__ == "__main__":
    main()
