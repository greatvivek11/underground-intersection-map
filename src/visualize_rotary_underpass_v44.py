# Underground Rotary Intersection Routing — v4.4
# Generated with ChatGPT collaboration
# Conceptual urban infrastructure visualization engine

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

fig, ax = plt.subplots(figsize=(10,10), dpi=300)

# Theme
bg = "#F8F9FA"
road_fill = "#E2E8F0"
road_edge = "#94A3B8"
median_fill = "#CBD5E1"
grid = "#E5E7EB"

corridor_color = "#0F62FE"
ring_color = "#E67E22"
ramp_color = "#DC2626"
portal_color = "#1E293B"

text = "#0F172A"
muted = "#475569"

fig.patch.set_facecolor(bg)
ax.set_facecolor(bg)

# Grid
ax.grid(color=grid, linestyle='--', linewidth=0.5, zorder=0)

# Surface roads
road_w = 80
lane_w = 12
median_w = 8
half = road_w/2
extent = 250

ax.add_patch(
    patches.Rectangle(
        (-extent,-half),
        extent*2,
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
        (-half,-extent),
        road_w,
        extent*2,
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
        (-extent,-median_w/2),
        extent*2,
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
        (-median_w/2,-extent),
        median_w,
        extent*2,
        facecolor=median_fill,
        edgecolor=road_edge,
        linewidth=0.8,
        alpha=0.5,
        zorder=2
    )
)

# Rotary geometry

a = 125
b = 105

theta = np.linspace(0,2*np.pi,600)

ax.plot(
    a*np.cos(theta),
    b*np.sin(theta),
    color=ring_color,
    linewidth=11,
    zorder=5
)

ax.plot(
    (a-18)*np.cos(theta),
    (b-18)*np.sin(theta),
    color="#FDBA74",
    linewidth=3,
    linestyle="--",
    alpha=0.8,
    zorder=5
)

# Rotary directional arrows
angles = np.linspace(20,340,10)

for ang in angles:
    r1 = np.deg2rad(ang)
    r2 = np.deg2rad(ang-18)

    p1 = np.array([a*np.cos(r1), b*np.sin(r1)])
    p2 = np.array([a*np.cos(r2), b*np.sin(r2)])

    arrow = patches.FancyArrowPatch(
        p1,p2,
        arrowstyle='-|>',
        mutation_scale=15,
        linewidth=2,
        color=ring_color,
        zorder=6
    )
    ax.add_patch(arrow)

# Dedicated corridors
portal_dist = 185

corridors = [
    ((-36, portal_dist), (-36, b)),
    ((36, b), (36, portal_dist)),

    ((36, -portal_dist), (36, -b)),
    ((-36, -b), (-36, -portal_dist)),

    ((portal_dist, 36), (a, 36)),
    ((a, -36), (portal_dist, -36)),

    ((-a, 36), (-portal_dist, 36)),
    ((-portal_dist, -36), (-a, -36)),
]

for p1,p2 in corridors:
    ax.plot(
        [p1[0],p2[0]],
        [p1[1],p2[1]],
        linewidth=6,
        color=corridor_color,
        solid_capstyle='round',
        zorder=4
    )

    arrow = patches.FancyArrowPatch(
        p1,p2,
        arrowstyle='->',
        mutation_scale=10,
        linewidth=1.2,
        color=ramp_color,
        zorder=7
    )
    ax.add_patch(arrow)

# Tangential ramps
ramps = [
    ((-36,b), (-78,82)),
    ((78,82), (36,b)),

    ((36,-b), (78,-82)),
    ((-78,-82), (-36,-b)),

    ((a,36), (92,70)),
    ((92,-70), (a,-36)),

    ((-92,-70), (-a,-36)),
    ((-a,36), (-92,70)),
]

for p1,p2 in ramps:
    ax.plot(
        [p1[0],p2[0]],
        [p1[1],p2[1]],
        color=ramp_color,
        linewidth=4,
        linestyle='--',
        zorder=6
    )

# Portal boxes
portal_boxes = [
    (-52,200,"N IN"),
    (24,200,"N OUT"),

    (24,-214,"S IN"),
    (-52,-214,"S OUT"),

    (200,24,"E IN"),
    (200,-52,"E OUT"),

    (-228,-52,"W IN"),
    (-228,24,"W OUT"),
]

for x0,y0,label in portal_boxes:
    rect = patches.Rectangle(
        (x0,y0),
        28,
        16,
        facecolor=portal_color,
        edgecolor="#0F172A",
        linewidth=1.5,
        zorder=8
    )

    ax.add_patch(rect)

    ax.text(
        x0+14,
        y0+8,
        label,
        ha='center',
        va='center',
        fontsize=8,
        color='white',
        fontweight='bold',
        zorder=9
    )

bbox_dim = dict(facecolor=bg, edgecolor='none', pad=1.5, alpha=0.95)

# Dimensions
ax.annotate('', xy=(-a,-150), xytext=(a,-150),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color=muted), zorder=20)

ax.text(0,-142,"Rotary Major Diameter: 250 ft",
        ha='center', fontsize=8, color=muted, zorder=21, bbox=bbox_dim)

ax.annotate('', xy=(165,-b), xytext=(165,b),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color=muted), zorder=20)

ax.text(172,0,"Minor Diameter: 210 ft",
        rotation=90, va='center', fontsize=8,
        color=muted, zorder=21, bbox=bbox_dim)

ax.annotate('', xy=(72,40), xytext=(72,185),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color=muted), zorder=20)

ax.text(80,115,"Portal Setback:\n145 ft",
        fontsize=8, color=muted, va='center',
        zorder=21, bbox=bbox_dim)

ax.annotate('', xy=(-36,105), xytext=(-36,185),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color=muted), zorder=20)

ax.text(-72,145,"Dedicated Corridor:\n80 ft",
        fontsize=8, color=muted, va='center',
        zorder=21, bbox=bbox_dim)

# Surface dimensions
ax.annotate('', xy=(-40,225), xytext=(40,225),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color="#64748B"),
            zorder=20)

ax.text(0,233,"Surface Road Width: 80 ft",
        ha='center', fontsize=8, color="#64748B",
        zorder=21, bbox=bbox_dim)

ax.annotate('', xy=(118,24), xytext=(118,36),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color="#64748B"),
            zorder=20)

ax.text(126,30,"Lane Width: 12 ft",
        fontsize=8, color="#64748B",
        va='center', zorder=21, bbox=bbox_dim)

# Center label
ax.text(
    0,-2,
    "SHARED\nELLIPTICAL\nROTARY",
    ha='center',
    va='center',
    fontsize=14,
    fontweight='bold',
    color=text,
    zorder=10,
    bbox=dict(facecolor=bg, edgecolor='none', alpha=0.9)
)

# Title
ax.text(
    0.03,0.95,
    "UNDERGROUND ROTARY INTERSECTION ROUTING\nLarge-Circumference Shared Circulation System — Indian LHT",
    transform=ax.transAxes,
    fontsize=11,
    fontweight='bold',
    color=text,
    va='top',
    ha='left',
    bbox=dict(
        boxstyle="round,pad=0.6",
        facecolor=bg,
        edgecolor=road_edge,
        linewidth=0.8,
        alpha=0.95
    )
)

# Specs
specs = (
    "SYSTEM EVOLUTION (v4.4)\n"
    "• 8 Dedicated IN/OUT Tunnel Lanes\n"
    "• Large Elliptical Rotary Chamber\n"
    "• TBM-Compatible Continuous Curvature\n"
    "• Slim Directional Corridor Arrows\n"
    "• Extended Queueing Circumference\n"
    "• Shallow Urban Deployment Objective"
)

ax.text(
    0.03,0.85,specs,
    transform=ax.transAxes,
    fontsize=8.5,
    fontfamily="monospace",
    color=muted,
    va='top',
    ha='left'
)

# Legend
handles = [
    patches.Patch(facecolor=road_fill, edgecolor=road_edge, alpha=0.5, label="Surface Road Layout"),
    plt.Line2D([0],[0], color=corridor_color, lw=6, label="Dedicated Entry/Exit Corridors"),
    plt.Line2D([0],[0], color=ring_color, lw=6, label="Shared Elliptical Rotary"),
    plt.Line2D([0],[0], color=ramp_color, lw=4, linestyle='--', label="Tangential Merge / Diverge Ramps"),
]

legend = ax.legend(
    handles=handles,
    loc="lower left",
    bbox_to_anchor=(0.03,0.03),
    fontsize=8,
    facecolor=bg,
    edgecolor=road_edge,
    framealpha=0.95,
    title="ROTARY TOPOLOGY LEGEND",
    title_fontsize=8.5
)

plt.setp(legend.get_title(), fontweight='bold', color=text)

# Footer
ax.text(
    0.5,0.02,
    "Conceptual Diagram — Elliptical Underground Rotary Circulation Fabric — Not To Scale",
    transform=ax.transAxes,
    ha='center',
    va='bottom',
    fontsize=7.5,
    color=muted
)

ax.set_xlim(-260,260)
ax.set_ylim(-260,260)
ax.set_aspect('equal')
ax.set_xticks([])
ax.set_yticks([])

plt.savefig("rotary_underpass_v44.png", bbox_inches='tight', facecolor=fig.get_facecolor())
plt.savefig("rotary_underpass_v44.svg", bbox_inches='tight', facecolor=fig.get_facecolor())

print("Generated rotary_underpass_v44.png and rotary_underpass_v44.svg")