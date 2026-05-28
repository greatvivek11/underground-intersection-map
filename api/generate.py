from http.server import BaseHTTPRequestHandler
import urllib.parse
import sys
import os
import io
import tempfile

# Keep Matplotlib from trying to write cache files into a read-only home dir.
os.environ.setdefault('MPLCONFIGDIR', os.path.join(tempfile.gettempdir(), 'matplotlib'))

# Set Matplotlib backend to non-interactive 'Agg' before importing pyplot
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse request URL and query parameters
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            # Extract configuration parameters with defaults matching the visual specifications
            setback_val = 145.0
            if 'setback' in query_params:
                try:
                    setback_val = float(query_params['setback'][0])
                except ValueError:
                    pass
            
            road_w = 80.0
            if 'roadWidth' in query_params:
                try:
                    road_w = float(query_params['roadWidth'][0])
                except ValueError:
                    pass
            
            lane_width_val = 12.0
            if 'laneWidth' in query_params:
                try:
                    lane_width_val = float(query_params['laneWidth'][0])
                except ValueError:
                    pass

            rotary_diameter_val = 250.0
            if 'rotaryDiameter' in query_params:
                try:
                    rotary_diameter_val = float(query_params['rotaryDiameter'][0])
                except ValueError:
                    pass

            is_dark = False
            if 'dark' in query_params:
                is_dark = query_params['dark'][0].lower() == 'true'
                
            img_format = 'svg'
            if 'format' in query_params:
                img_format = query_params['format'][0].lower()
                if img_format not in ['svg', 'png']:
                    img_format = 'svg'

            # Initialize Matplotlib Figure
            fig, ax = plt.subplots(figsize=(10,10), dpi=300)
            
            # Setup theme colors
            if is_dark:
                bg = "#0B0E14"
                road_fill = "#1E2530"
                road_edge = "#3A4556"
                median_fill = "#2E3B4E"
                grid = "#1A1F2C"
                text = "#E2E8F0"
                muted = "#94A3B8"
            else:
                bg = "#F8F9FA"
                road_fill = "#E2E8F0"
                road_edge = "#94A3B8"
                median_fill = "#CBD5E1"
                grid = "#E5E7EB"
                text = "#0F172A"
                muted = "#475569"

            corridor_color = "#0F62FE"
            ring_color = "#E67E22"
            ramp_color = "#DC2626"
            portal_color = "#1E293B"

            fig.patch.set_facecolor(bg)
            ax.set_facecolor(bg)

            # Grid lines
            ax.grid(color=grid, linestyle='--', linewidth=0.5, zorder=0)

            # Rotary ellipse constants (needed early for extent and corridor calculations)
            a = rotary_diameter_val / 2.0  # major semi-axis (E-W), ft
            b = (rotary_diameter_val * 0.84) / 2.0  # minor semi-axis (N-S), ft

            # Surface roads
            lane_w = 12
            median_w = 8
            half = road_w / 2.0
            # Extend roads to match dedicated corridor length so road always reaches the portals
            extent = max(250, a + setback_val + 15)

            ax.add_patch(
                patches.Rectangle(
                    (-extent, -half),
                    extent * 2,
                    road_w,
                    facecolor=road_fill,
                    edgecolor=road_edge,
                    linewidth=1.2,
                    alpha=0.35,
                    zorder=1
                )
            )

            ax.add_patch(
                patches.Rectangle(
                    (-half, -extent),
                    road_w,
                    extent * 2,
                    facecolor=road_fill,
                    edgecolor=road_edge,
                    linewidth=1.2,
                    alpha=0.35,
                    zorder=1
                )
            )

            # Medians
            ax.add_patch(
                patches.Rectangle(
                    (-extent, -median_w / 2.0),
                    extent * 2,
                    median_w,
                    facecolor=median_fill,
                    edgecolor=road_edge,
                    linewidth=0.8,
                    alpha=0.5,
                    zorder=2
                )
            )

            ax.add_patch(
                patches.Rectangle(
                    (-median_w / 2.0, -extent),
                    median_w,
                    extent * 2,
                    facecolor=median_fill,
                    edgecolor=road_edge,
                    linewidth=0.8,
                    alpha=0.5,
                    zorder=2
                )
            )

            # Rotary geometry
            theta = np.linspace(0, 2*np.pi, 600)

            # Main orange ring — drawn as filled annulus so visual width tracks lane_width_val
            outer_ring = patches.Ellipse(
                (0, 0), width=2 * a, height=2 * b,
                facecolor=ring_color, edgecolor='none', linewidth=0, zorder=5
            )
            inner_ring_fill = patches.Ellipse(
                (0, 0), width=2 * (a - lane_width_val), height=2 * (b - lane_width_val),
                facecolor=bg, edgecolor='none', linewidth=0, zorder=5
            )
            ax.add_patch(outer_ring)
            ax.add_patch(inner_ring_fill)

            # Centreline dashes at mid-lane radius
            ax.plot(
                (a - lane_width_val / 2) * np.cos(theta),
                (b - lane_width_val / 2) * np.sin(theta),
                color="#FDBA74",
                linewidth=2,
                linestyle="--",
                alpha=0.8,
                zorder=6
            )

            # Directional loop arrows
            angles = np.linspace(20, 340, 10)
            for ang in angles:
                r1 = np.deg2rad(ang)
                r2 = np.deg2rad(ang - 18)

                p1 = np.array([a * np.cos(r1), b * np.sin(r1)])
                p2 = np.array([a * np.cos(r2), b * np.sin(r2)])

                arrow = patches.FancyArrowPatch(
                    p1, p2,
                    arrowstyle='-|>',
                    mutation_scale=15,
                    linewidth=2,
                    color=ring_color,
                    zorder=6
                )
                ax.add_patch(arrow)

            # Dedicated corridors (dynamically dependent on the setback parameter)
            # Portal Position = Ellipse Radius + Dedicated Corridor Length (setback_val)
            portal_dist_ns = b + setback_val
            portal_dist_ew = a + setback_val
            # Corridor lateral offset = half the road width so corridors always hug road edges
            co = half  # corridor offset from centreline

            corridors = [
                ((-co, portal_dist_ns), (-co, b)),
                ((co, b), (co, portal_dist_ns)),
                ((co, -portal_dist_ns), (co, -b)),
                ((-co, -b), (-co, -portal_dist_ns)),
                ((portal_dist_ew, co), (a, co)),
                ((a, -co), (portal_dist_ew, -co)),
                ((-a, co), (-portal_dist_ew, co)),
                ((-portal_dist_ew, -co), (-a, -co)),
            ]

            for p1, p2 in corridors:
                ax.plot(
                    [p1[0], p2[0]],
                    [p1[1], p2[1]],
                    linewidth=6,
                    color=corridor_color,
                    solid_capstyle='round',
                    zorder=4
                )

                arrow = patches.FancyArrowPatch(
                    p1, p2,
                    arrowstyle='->',
                    mutation_scale=10,
                    linewidth=1.2,
                    color=ramp_color,
                    zorder=7
                )
                ax.add_patch(arrow)

            # Tangential ramps — tangent points derived parametrically so they move with a, b
            # Normalised ellipse angles (radians) computed from the original a=125, b=105 design.
            # The angles are fixed proportional positions on the ellipse regardless of scale.
            T_NW = 2.243;  T_NE = 0.899;  T_SE = -0.899;  T_SW = -2.243
            T_EN = 0.734;  T_ES = -0.734; T_WS = np.pi + 0.734; T_WN = np.pi - 0.734

            def ep(angle):
                return np.array([a * np.cos(angle), b * np.sin(angle)])

            ramps = [
                (np.array([-co,  b ]), ep(T_NW)),
                (ep(T_NE),             np.array([ co,  b ])),
                (np.array([ co, -b ]), ep(T_SE)),
                (ep(T_SW),             np.array([-co, -b ])),
                (np.array([ a,  co]), ep(T_EN)),
                (ep(T_ES),             np.array([ a, -co])),
                (ep(T_WS),             np.array([-a, -co])),
                (np.array([-a,  co]), ep(T_WN)),
            ]

            for p1, p2 in ramps:
                ax.plot(
                    [p1[0], p2[0]],
                    [p1[1], p2[1]],
                    color=ramp_color,
                    linewidth=4,
                    linestyle='--',
                    zorder=6
                )

            # Portal boxes — position derived from road-width-relative corridor offset (co)
            # Box dimensions scaled so text never clips
            box_w = 48
            box_h = 16
            base_setback_offset_ns = portal_dist_ns + 12
            base_setback_offset_ew = portal_dist_ew + 12
            portal_boxes = [
                # N/S: left lane is at x=-co, right lane at x=+co
                (-co - box_w / 2, base_setback_offset_ns, "N IN"),
                (co - box_w / 2, base_setback_offset_ns, "N OUT"),
                (co - box_w / 2, -base_setback_offset_ns - box_h, "S IN"),
                (-co - box_w / 2, -base_setback_offset_ns - box_h, "S OUT"),
                # E/W: top lane at y=+co, bottom lane at y=-co
                (base_setback_offset_ew, co - box_h / 2, "E IN"),
                (base_setback_offset_ew, -co - box_h / 2, "E OUT"),
                (-base_setback_offset_ew - box_w, -co - box_h / 2, "W IN"),
                (-base_setback_offset_ew - box_w, co - box_h / 2, "W OUT"),
            ]

            for x0, y0, label in portal_boxes:
                rect = patches.Rectangle(
                    (x0, y0),
                    box_w,
                    box_h,
                    facecolor=portal_color,
                    edgecolor="#0F172A",
                    linewidth=1.5,
                    zorder=8
                )
                ax.add_patch(rect)

                ax.text(
                    x0 + box_w / 2,
                    y0 + box_h / 2,
                    label,
                    ha='center',
                    va='center',
                    fontsize=10.5,
                    color='white',
                    fontweight='bold',
                    zorder=9
                )

            bbox_dim = dict(facecolor=bg, edgecolor='none', pad=3, alpha=0.95)

            # Dimension annotations — dynamic labels and positions that track a, b
            # Major diameter arrow placed 40 ft below the ellipse so it never overlaps the ring
            y_major_dim = -(b + 40)
            ax.annotate('', xy=(-a, y_major_dim), xytext=(a, y_major_dim),
                        arrowprops=dict(arrowstyle='<->', lw=1.2, color=muted), zorder=20)
            ax.text(0, y_major_dim, f"Rotary Major Diameter: {int(rotary_diameter_val)} ft",
                    ha='center', va='center', fontsize=10.5, color=muted, zorder=21, bbox=bbox_dim)

            ax.annotate('', xy=(a + setback_val * 0.55, -b), xytext=(a + setback_val * 0.55, b),
                        arrowprops=dict(arrowstyle='<->', lw=1.2, color=muted), zorder=20)
            ax.text(a + setback_val * 0.55, 0, f"Minor Diameter: {int(rotary_diameter_val * 0.84)} ft",
                    rotation=90, ha='center', va='center', fontsize=10.5,
                    color=muted, zorder=21, bbox=bbox_dim)

            # Dedicated Corridor dimension — along the W-OUT lane (below, at y = -(co + 14))
            dc_label_y = -(co + 14)
            ax.annotate('', xy=(-portal_dist_ew, dc_label_y), xytext=(-a, dc_label_y),
                        arrowprops=dict(arrowstyle='<->', lw=1.2, color=muted), zorder=20)
            ax.text((-portal_dist_ew - a) / 2.0, dc_label_y - 10,
                    f"Dedicated Corridor: {int(setback_val)} ft",
                    fontsize=10.5, color=muted, ha='center', va='center',
                    zorder=21, bbox=bbox_dim)
            ax.plot([-portal_dist_ew, -portal_dist_ew], [dc_label_y - 4, -co], color=muted, linewidth=0.8, zorder=19)
            ax.plot([-a, -a], [dc_label_y - 4, -co], color=muted, linewidth=0.8, zorder=19)

            # Surface Road Width — placed midway along the North approach road
            srw_label_y = b + setback_val * 0.5
            ax.annotate('', xy=(-half, srw_label_y), xytext=(half, srw_label_y),
                        arrowprops=dict(arrowstyle='<->', lw=1.2, color="#64748B"),
                        zorder=20)
            ax.text(0, srw_label_y, f"Surface Road Width: {int(road_w)} ft",
                    ha='center', va='center', fontsize=10.5, color="#64748B",
                    zorder=21, bbox=bbox_dim)
            ax.plot([-half, -half], [srw_label_y - 6, srw_label_y + 6], color="#64748B", linewidth=0.8, zorder=19)
            ax.plot([half, half], [srw_label_y - 6, srw_label_y + 6], color="#64748B", linewidth=0.8, zorder=19)

            # Lane Width label over the orange rotary ring (moved to the top North lane)
            lw_arrow_y_start = b - lane_width_val
            lw_arrow_y_end = b
            ax.annotate('', xy=(0, lw_arrow_y_start), xytext=(0, lw_arrow_y_end),
                        arrowprops=dict(arrowstyle='<->', lw=1.2, color="#64748B"),
                        zorder=20)
            ax.text(0, lw_arrow_y_end + 12, f"Lane Width: {int(lane_width_val)} ft",
                    fontsize=10.5, color="#64748B",
                    ha='center', va='center', zorder=21, bbox=bbox_dim)

            # Core Block Label
            ax.text(
                0, 0,
                "SHARED\nELLIPTICAL\nROTARY",
                ha='center',
                va='center',
                fontsize=17,
                fontweight='bold',
                color=text,
                zorder=10,
                bbox=dict(facecolor=bg, edgecolor='none', alpha=0.9, pad=4)
            )

            # Centered title at the very top edge
            title_text = "UNDERGROUND ROTARY INTERSECTION ROUTING"
            subtitle_text = "Large-Circumference Shared Circulation System — Indian LHT"
            
            ax.text(
                0.5, 0.985,
                f"{title_text}\n{subtitle_text}",
                transform=ax.transAxes,
                fontsize=14,
                fontweight='bold',
                color=text,
                va='top',
                ha='center',
                bbox=dict(
                    boxstyle="round,pad=0.7",
                    facecolor=bg,
                    edgecolor=road_edge,
                    linewidth=0.8,
                    alpha=0.95
                )
            )

            # Highlights specs list
            specs = (
                "KEY SCHEMATIC HIGHLIGHTS\n"
                "• 8 Dedicated IN/OUT Tunnel Lanes\n"
                "• Large Elliptical Rotary Chamber\n"
                "• TBM-Compatible Continuous Curvature\n"
                "• Slim Directional Corridor Arrows\n"
                "• Extended Queueing Circumference\n"
                "• Shallow Urban Deployment Objective"
            )

            ax.text(
                0.03, 0.88, specs,
                transform=ax.transAxes,
                fontsize=11.5,
                fontfamily="monospace",
                color=muted,
                va='top',
                ha='left'
            )

            # Legend
            handles = [
                patches.Patch(facecolor=road_fill, edgecolor=road_edge, alpha=0.5, label="Surface Road Layout"),
                plt.Line2D([0], [0], color=corridor_color, lw=6, label="Dedicated Entry/Exit Corridors"),
                plt.Line2D([0], [0], color=ring_color, lw=6, label="Shared Elliptical Rotary"),
                plt.Line2D([0], [0], color=ramp_color, lw=4, linestyle='--', label="Tangential Merge / Diverge Ramps"),
            ]

            legend = ax.legend(
                handles=handles,
                loc="lower left",
                bbox_to_anchor=(0.03, 0.03),
                fontsize=10.5,
                facecolor=bg,
                edgecolor=road_edge,
                framealpha=0.95,
                title="ROTARY TOPOLOGY LEGEND",
                title_fontsize=11
            )
            plt.setp(legend.get_title(), fontweight='bold', color=text)

            # Footer
            ax.text(
                0.5, 0.02,
                "Conceptual Diagram — Elliptical Underground Rotary Circulation Fabric",
                transform=ax.transAxes,
                ha='center',
                va='bottom',
                fontsize=10.0,
                color=muted
            )

            # Dynamic viewport — scales to always fit portals + portal-box labels + margin.
            # Identical formula is mirrored in rotaryGeometry.ts so the SVG vehicle overlay
            # stays aligned with the Matplotlib coordinate system.
            lim = int(max(260, a + setback_val + 110))
            ax.set_xlim(-lim, lim)
            ax.set_ylim(-lim, lim)
            ax.set_aspect('equal')
            ax.set_xticks([])
            ax.set_yticks([])

            plt.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)

            # Save visual buffer
            buf = io.BytesIO()
            if img_format == 'png':
                plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight', dpi=300)
                content_type = 'image/png'
            else:
                plt.savefig(buf, format='svg', facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
                content_type = 'image/svg+xml'
            
            plt.close(fig)
            buf.seek(0)
            img_data = buf.getvalue()
            
            # Send HTTP response headers
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(img_data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'public, max-age=60')
            self.end_headers()
            
            # Write bytes to output stream
            self.wfile.write(img_data)
            
        except Exception as e:
            # Handle server errors and return plain text
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Internal Server Error: {str(e)}".encode('utf-8'))
