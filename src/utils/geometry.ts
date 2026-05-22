// Geometry Utilities for Underground Tunnel Intersection routing
// Mirrors the logic inside visualize_tunnels.py

export interface TunnelConfig {
	intersectionSize: number;
	portalSetback: number;
	portalOffset: number;
	descentLength: number;
	roadWidth: number;
	medianWidth: number;
	laneWidth: number;
	bezierPoints?: number;
	kLeft: number;
	kRight: number;
}

export interface TunnelEdge {
	from: string;
	to: string;
	type: "descent" | "ascent" | "tunnel";
	routeType: string;
	path: number[][];
	level: number;
	depth: number;
	colorDark?: string;
	colorLight?: string;
	label?: string;
}

export const APPROACHES: Record<
	string,
	{ name: string; in: number[]; out: number[] }
> = {
	S: { name: "South", in: [0, 1], out: [0, -1] },
	N: { name: "North", in: [0, -1], out: [0, 1] },
	E: { name: "East", in: [-1, 0], out: [1, 0] },
	W: { name: "West", in: [1, 0], out: [-1, 0] },
};

export const ROUTES = [
	// Straights (L-2)
	{
		start: "S",
		end: "N",
		type: "straight",
		level: -2,
		depth: -30,
		colorDark: "#38BDF8",
		colorLight: "#2563EB",
		label: "L-2: Straight (Primary)",
	},
	{
		start: "N",
		end: "S",
		type: "straight",
		level: -2,
		depth: -30,
		colorDark: "#38BDF8",
		colorLight: "#2563EB",
		label: "L-2: Straight (Primary)",
	},
	{
		start: "E",
		end: "W",
		type: "straight",
		level: -2,
		depth: -30,
		colorDark: "#38BDF8",
		colorLight: "#2563EB",
		label: "L-2: Straight (Primary)",
	},
	{
		start: "W",
		end: "E",
		type: "straight",
		level: -2,
		depth: -30,
		colorDark: "#38BDF8",
		colorLight: "#2563EB",
		label: "L-2: Straight (Primary)",
	},

	// Left Turns (L-1)
	{
		start: "S",
		end: "W",
		type: "left",
		level: -1,
		depth: -15,
		colorDark: "#34D399",
		colorLight: "#059669",
		label: "L-1: Left Turn (Shallow)",
	},
	{
		start: "W",
		end: "N",
		type: "left",
		level: -1,
		depth: -15,
		colorDark: "#34D399",
		colorLight: "#059669",
		label: "L-1: Left Turn (Shallow)",
	},
	{
		start: "N",
		end: "E",
		type: "left",
		level: -1,
		depth: -15,
		colorDark: "#34D399",
		colorLight: "#059669",
		label: "L-1: Left Turn (Shallow)",
	},
	{
		start: "E",
		end: "S",
		type: "left",
		level: -1,
		depth: -15,
		colorDark: "#34D399",
		colorLight: "#059669",
		label: "L-1: Left Turn (Shallow)",
	},

	// Right Turns (L-3)
	{
		start: "S",
		end: "E",
		type: "right",
		level: -3,
		depth: -45,
		colorDark: "#F87171",
		colorLight: "#DC2626",
		label: "L-3: Right Turn (Deep)",
	},
	{
		start: "E",
		end: "N",
		type: "right",
		level: -3,
		depth: -45,
		colorDark: "#F87171",
		colorLight: "#DC2626",
		label: "L-3: Right Turn (Deep)",
	},
	{
		start: "N",
		end: "W",
		type: "right",
		level: -3,
		depth: -45,
		colorDark: "#F87171",
		colorLight: "#DC2626",
		label: "L-3: Right Turn (Deep)",
	},
	{
		start: "W",
		end: "S",
		type: "right",
		level: -3,
		depth: -45,
		colorDark: "#F87171",
		colorLight: "#DC2626",
		label: "L-3: Right Turn (Deep)",
	},
];

// Returns unit normal vector pointing to the left of travel direction (LHT)
export function getLeftNormal(dir: number[]): number[] {
	const [dx, dy] = dir;
	return [-dy, dx]; // 90-degree counter-clockwise rotation
}

// Computes points along a cubic Bezier curve defined by p0, p1, p2, p3
export function computeBezier(
	p0: number[],
	p1: number[],
	p2: number[],
	p3: number[],
	nPoints = 100,
): number[][] {
	const points = [];
	for (let i = 0; i < nPoints; i++) {
		const t = i / (nPoints - 1);
		const mt = 1 - t;

		const x =
			mt ** 3 * p0[0] +
			3 * mt ** 2 * t * p1[0] +
			3 * mt * t ** 2 * p2[0] +
			t ** 3 * p3[0];

		const y =
			mt ** 3 * p0[1] +
			3 * mt ** 2 * t * p1[1] +
			3 * mt * t ** 2 * p2[1] +
			t ** 3 * p3[1];

		points.push([x, y]);
	}
	return points;
}

// Compute the coordinates for all layout infrastructure nodes & paths
export function getTunnelNetwork(config: TunnelConfig): {
	nodes: Record<string, number[]>;
	edges: TunnelEdge[];
} {
	const nodes: Record<string, number[]> = {};
	const halfBox = config.intersectionSize / 2.0;

	// 1. Build Nodes
	Object.keys(APPROACHES).forEach((name) => {
		const vecs = APPROACHES[name];
		const dirIn = vecs.in;
		const dirOut = vecs.out;
		const normInLeft = getLeftNormal(dirIn);
		const normOutLeft = getLeftNormal(dirOut);

		const anchor = [dirIn[0] * -halfBox, dirIn[1] * -halfBox];

		// Entry Portal
		const entryPos = [
			anchor[0] -
				dirIn[0] * config.portalSetback +
				normInLeft[0] * config.portalOffset,
			anchor[1] -
				dirIn[1] * config.portalSetback +
				normInLeft[1] * config.portalOffset,
		];

		// Exit Portal
		const exitPos = [
			anchor[0] -
				dirIn[0] * config.portalSetback +
				normOutLeft[0] * config.portalOffset,
			anchor[1] -
				dirIn[1] * config.portalSetback +
				normOutLeft[1] * config.portalOffset,
		];

		// Divergence (Entry Ramp bottom)
		const divPos = [
			entryPos[0] + dirIn[0] * config.descentLength,
			entryPos[1] + dirIn[1] * config.descentLength,
		];

		// Merge (Exit Ramp bottom)
		const mergePos = [
			exitPos[0] + dirIn[0] * config.descentLength,
			exitPos[1] + dirIn[1] * config.descentLength,
		];

		nodes[`${name}_entry`] = entryPos;
		nodes[`${name}_exit`] = exitPos;
		nodes[`${name}_div`] = divPos;
		nodes[`${name}_merge`] = mergePos;
	});

	// 2. Build Paths for Tunnels
	const edges: TunnelEdge[] = [];

	// Descent & Ascent Ramps (Straight lines)
	Object.keys(APPROACHES).forEach((name) => {
		edges.push({
			from: `${name}_entry`,
			to: `${name}_div`,
			type: "descent",
			routeType: "straight",
			path: [nodes[`${name}_entry`], nodes[`${name}_div`]],
			level: 0,
			depth: 0,
		});

		edges.push({
			from: `${name}_merge`,
			to: `${name}_exit`,
			type: "ascent",
			routeType: "straight",
			path: [nodes[`${name}_merge`], nodes[`${name}_exit`]],
			level: 0,
			depth: 0,
		});
	});

	// Core routed tunnels
	ROUTES.forEach((route) => {
		const uNode = `${route.start}_div`;
		const vNode = `${route.end}_merge`;

		const p0 = nodes[uNode];
		const p3 = nodes[vNode];

		const dIn = APPROACHES[route.start].in;
		const dOut = APPROACHES[route.end].out;

		let pathPts: number[][] = [];

		if (route.type === "straight") {
			// Offset straight tunnels to reduce intersection center overlap
			const offsetVal = 6.0;
			const norm = getLeftNormal(dIn);
			const p0Off = [p0[0] + norm[0] * offsetVal, p0[1] + norm[1] * offsetVal];
			const p3Off = [p3[0] + norm[0] * offsetVal, p3[1] + norm[1] * offsetVal];

			pathPts = [];
			const nPoints = config.bezierPoints || 100;
			for (let i = 0; i < nPoints; i++) {
				const t = i / (nPoints - 1);
				const x = p0Off[0] * (1 - t) + p3Off[0] * t;
				const y = p0Off[1] * (1 - t) + p3Off[1] * t;
				pathPts.push([x, y]);
			}
		} else if (route.type === "left") {
			// Left turn cubic spline
			const p1 = [p0[0] + dIn[0] * config.kLeft, p0[1] + dIn[1] * config.kLeft];
			const p2 = [
				p3[0] - dOut[0] * config.kLeft,
				p3[1] - dOut[1] * config.kLeft,
			];
			pathPts = computeBezier(p0, p1, p2, p3, config.bezierPoints || 100);
		} else if (route.type === "right") {
			// Right turn cubic spline
			const p1 = [
				p0[0] + dIn[0] * config.kRight,
				p0[1] + dIn[1] * config.kRight,
			];
			const p2 = [
				p3[0] - dOut[0] * config.kRight,
				p3[1] - dOut[1] * config.kRight,
			];
			pathPts = computeBezier(p0, p1, p2, p3, config.bezierPoints || 100);
		}

		edges.push({
			from: uNode,
			to: vNode,
			type: "tunnel",
			routeType: route.type,
			path: pathPts,
			level: route.level,
			depth: route.depth,
			colorDark: route.colorDark,
			colorLight: route.colorLight,
			label: route.label,
		});
	});

	return { nodes, edges };
}
