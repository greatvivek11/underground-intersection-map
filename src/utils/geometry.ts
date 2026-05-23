// Geometry utilities for underground tunnel intersection routing.
// Constants: shared/tunnel-config.json | Algorithm mirrored in visualize_tunnels.py

import tunnelSpec from "../../shared/tunnel-config.json";

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

export interface TunnelRoute {
	start: string;
	end: string;
	type: "straight" | "left" | "right";
	level: number;
	depth: number;
	/** World-space X offset (ft) applied to the full tunnel centerline in the core */
	coreOffsetX?: number;
	/** World-space Y offset (ft) applied to the full tunnel centerline in the core */
	coreOffsetY?: number;
	colorDark: string;
	colorLight: string;
	label: string;
}

export interface ApproachVectors {
	name: string;
	in: number[];
	out: number[];
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

const { defaults, approaches, routes } = tunnelSpec;

export const STRAIGHT_OFFSET = defaults.straightOffset;

export const DEFAULT_TUNNEL_CONFIG: TunnelConfig = {
	intersectionSize: defaults.intersectionSize,
	portalSetback: defaults.portalSetback,
	portalOffset: defaults.portalOffset,
	descentLength: defaults.descentLength,
	roadWidth: defaults.roadWidth,
	medianWidth: defaults.medianWidth,
	laneWidth: defaults.laneWidth,
	kLeft: defaults.kLeft,
	kRight: defaults.kRight,
	bezierPoints: defaults.bezierPoints,
};

export function buildTunnelConfig(
	overrides: Partial<TunnelConfig> = {},
): TunnelConfig {
	return { ...DEFAULT_TUNNEL_CONFIG, ...overrides };
}

export const APPROACHES = approaches as Record<string, ApproachVectors>;

export const ROUTES = routes as TunnelRoute[];

export function getLeftNormal(dir: number[]): number[] {
	const [dx, dy] = dir;
	return [-dy, dx];
}

/** World-space shift so same-depth routes do not share centerline crossings. */
export function applyRouteSeparation(
	path: number[][],
	route: TunnelRoute,
): number[][] {
	const ox = route.coreOffsetX ?? 0;
	const oy = route.coreOffsetY ?? 0;
	if (ox === 0 && oy === 0) return path;
	return path.map((p) => [p[0] + ox, p[1] + oy]);
}

export function computeBezier(
	p0: number[],
	p1: number[],
	p2: number[],
	p3: number[],
	nPoints = defaults.bezierPoints,
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

export function getTunnelNetwork(config: TunnelConfig): {
	nodes: Record<string, number[]>;
	edges: TunnelEdge[];
} {
	const nodes: Record<string, number[]> = {};
	const halfBox = config.intersectionSize / 2.0;
	const nPoints = config.bezierPoints ?? defaults.bezierPoints;

	Object.keys(APPROACHES).forEach((name) => {
		const vecs = APPROACHES[name];
		const dirIn = vecs.in;
		const dirOut = vecs.out;
		const normInLeft = getLeftNormal(dirIn);
		const normOutLeft = getLeftNormal(dirOut);

		const anchor = [dirIn[0] * -halfBox, dirIn[1] * -halfBox];

		const entryPos = [
			anchor[0] -
				dirIn[0] * config.portalSetback +
				normInLeft[0] * config.portalOffset,
			anchor[1] -
				dirIn[1] * config.portalSetback +
				normInLeft[1] * config.portalOffset,
		];

		const exitPos = [
			anchor[0] -
				dirIn[0] * config.portalSetback +
				normOutLeft[0] * config.portalOffset,
			anchor[1] -
				dirIn[1] * config.portalSetback +
				normOutLeft[1] * config.portalOffset,
		];

		const divPos = [
			entryPos[0] + dirIn[0] * config.descentLength,
			entryPos[1] + dirIn[1] * config.descentLength,
		];

		const mergePos = [
			exitPos[0] + dirIn[0] * config.descentLength,
			exitPos[1] + dirIn[1] * config.descentLength,
		];

		nodes[`${name}_entry`] = entryPos;
		nodes[`${name}_exit`] = exitPos;
		nodes[`${name}_div`] = divPos;
		nodes[`${name}_merge`] = mergePos;
	});

	const edges: TunnelEdge[] = [];

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

	ROUTES.forEach((route) => {
		const uNode = `${route.start}_div`;
		const vNode = `${route.end}_merge`;

		const p0 = nodes[uNode];
		const p3 = nodes[vNode];

		const dIn = APPROACHES[route.start].in;
		const dOut = APPROACHES[route.end].out;

		let pathPts: number[][] = [];

		if (route.type === "straight") {
			pathPts = [];
			for (let i = 0; i < nPoints; i++) {
				const t = i / (nPoints - 1);
				pathPts.push([
					p0[0] * (1 - t) + p3[0] * t,
					p0[1] * (1 - t) + p3[1] * t,
				]);
			}
		} else if (route.type === "left") {
			const p1 = [p0[0] + dIn[0] * config.kLeft, p0[1] + dIn[1] * config.kLeft];
			const p2 = [
				p3[0] - dOut[0] * config.kLeft,
				p3[1] - dOut[1] * config.kLeft,
			];
			pathPts = computeBezier(p0, p1, p2, p3, nPoints);
		} else if (route.type === "right") {
			const p1 = [
				p0[0] + dIn[0] * config.kRight,
				p0[1] + dIn[1] * config.kRight,
			];
			const p2 = [
				p3[0] - dOut[0] * config.kRight,
				p3[1] - dOut[1] * config.kRight,
			];
			pathPts = computeBezier(p0, p1, p2, p3, nPoints);
		}

		pathPts = applyRouteSeparation(pathPts, route);

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
