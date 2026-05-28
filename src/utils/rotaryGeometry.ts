import type { TunnelConfig } from "./geometry";

export type ApproachId = "N" | "E" | "S" | "W";
export type RotaryEdgeType = "corridor" | "ring" | "ramp";

export interface RotaryConfig {
	majorDiameter: number;
	minorDiameter: number;
	portalSetback: number;
	corridorOffset: number;
	ringWidth: number;
	ringSamples: number;
	rampSamples: number;
	roadWidth: number;
	medianWidth: number;
	laneWidth: number;
}

export interface RotaryEdge {
	id: string;
	from: string;
	to: string;
	type: RotaryEdgeType;
	path: number[][];
	label: string;
}

export interface RotaryRoute {
	start: ApproachId;
	end: ApproachId;
	path: number[][];
}

export interface RotaryNetwork {
	config: RotaryConfig;
	nodes: Record<string, number[]>;
	edges: RotaryEdge[];
	routes: RotaryRoute[];
	ringPath: number[][];
	innerCorePath: number[][];
	limit: number;
}

export const ROTARY_APPROACHES: ApproachId[] = ["N", "E", "S", "W"];

const APPROACH_ANGLES: Record<ApproachId, number> = {
	E: 0,
	N: Math.PI / 2,
	W: Math.PI,
	S: (3 * Math.PI) / 2,
};

const OUTWARD_DIR: Record<ApproachId, number[]> = {
	N: [0, 1],
	E: [1, 0],
	S: [0, -1],
	W: [-1, 0],
};

const CLOCKWISE_ORDER: ApproachId[] = ["N", "E", "S", "W"];

export function buildRotaryConfig(config: TunnelConfig): RotaryConfig {
	const major = config.rotaryDiameter ?? 250;
	return {
		majorDiameter: major,
		minorDiameter: major * 0.84,
		portalSetback: config.portalSetback,
		corridorOffset: config.roadWidth / 2,
		ringWidth: config.laneWidth,
		ringSamples: 160,
		rampSamples: 18,
		roadWidth: config.roadWidth,
		medianWidth: config.medianWidth,
		laneWidth: config.laneWidth,
	};
}

function ellipsePoint(a: number, b: number, theta: number): number[] {
	return [a * Math.cos(theta), b * Math.sin(theta)];
}

function sampleEllipseArc(
	a: number,
	b: number,
	startTheta: number,
	endTheta: number,
	samples: number,
): number[][] {
	const points: number[][] = [];
	for (let i = 0; i < samples; i++) {
		const t = i / Math.max(1, samples - 1);
		const theta = startTheta + (endTheta - startTheta) * t;
		points.push(ellipsePoint(a, b, theta));
	}
	return points;
}

function sampleLine(p0: number[], p1: number[], samples: number): number[][] {
	const points: number[][] = [];
	for (let i = 0; i < samples; i++) {
		const t = i / Math.max(1, samples - 1);
		points.push([p0[0] * (1 - t) + p1[0] * t, p0[1] * (1 - t) + p1[1] * t]);
	}
	return points;
}

function clockwiseDelta(start: number, end: number): number {
	let delta = start - end;
	while (delta <= 0) delta += Math.PI * 2;
	return delta;
}

function getClockwiseNext(approach: ApproachId): ApproachId {
	const idx = CLOCKWISE_ORDER.indexOf(approach);
	return CLOCKWISE_ORDER[(idx + 1) % CLOCKWISE_ORDER.length];
}

export function buildRotaryNetwork(config: TunnelConfig): RotaryNetwork {
	const cfg = buildRotaryConfig(config);
	const a = cfg.majorDiameter / 2;
	const b = cfg.minorDiameter / 2;
	const nodes: Record<string, number[]> = {};
	const edges: RotaryEdge[] = [];

	for (const approach of ROTARY_APPROACHES) {
		const theta = APPROACH_ANGLES[approach];
		const dir = OUTWARD_DIR[approach];
		const tangent = ellipsePoint(a, b, theta);
		const entryOffset = [
			-dir[1] * cfg.corridorOffset,
			dir[0] * cfg.corridorOffset,
		];
		const exitOffset = [
			dir[1] * cfg.corridorOffset,
			-dir[0] * cfg.corridorOffset,
		];
		const tangentDist = Math.abs(dir[0]) * a + Math.abs(dir[1]) * b;
		const surfacePortalDistance = tangentDist + cfg.portalSetback;
		const portalBase = [
			dir[0] * surfacePortalDistance,
			dir[1] * surfacePortalDistance,
		];

		nodes[`${approach}_entry`] = [
			portalBase[0] + entryOffset[0],
			portalBase[1] + entryOffset[1],
		];
		nodes[`${approach}_exit`] = [
			portalBase[0] + exitOffset[0],
			portalBase[1] + exitOffset[1],
		];
		nodes[`${approach}_ring_in`] = [
			tangent[0] + entryOffset[0],
			tangent[1] + entryOffset[1],
		];
		nodes[`${approach}_ring_out`] = [
			tangent[0] + exitOffset[0],
			tangent[1] + exitOffset[1],
		];

		edges.push({
			id: `${approach}_entry_corridor`,
			from: `${approach}_entry`,
			to: `${approach}_ring_in`,
			type: "corridor",
			path: sampleLine(
				nodes[`${approach}_entry`],
				nodes[`${approach}_ring_in`],
				24,
			),
			label: `${approach} IN corridor`,
		});
		edges.push({
			id: `${approach}_exit_corridor`,
			from: `${approach}_ring_out`,
			to: `${approach}_exit`,
			type: "corridor",
			path: sampleLine(
				nodes[`${approach}_ring_out`],
				nodes[`${approach}_exit`],
				24,
			),
			label: `${approach} OUT corridor`,
		});
		edges.push({
			id: `${approach}_merge_ramp`,
			from: `${approach}_ring_in`,
			to: `${approach}_ring`,
			type: "ramp",
			path: sampleLine(nodes[`${approach}_ring_in`], tangent, cfg.rampSamples),
			label: `${approach} tangential merge`,
		});
		edges.push({
			id: `${approach}_diverge_ramp`,
			from: `${approach}_ring`,
			to: `${approach}_ring_out`,
			type: "ramp",
			path: sampleLine(tangent, nodes[`${approach}_ring_out`], cfg.rampSamples),
			label: `${approach} tangential diverge`,
		});
	}

	const ringPath = sampleEllipseArc(a, b, Math.PI * 2, 0, cfg.ringSamples);
	edges.push({
		id: "shared_clockwise_rotary",
		from: "rotary_ring",
		to: "rotary_ring",
		type: "ring",
		path: ringPath,
		label: "Shared clockwise elliptical rotary",
	});

	const routes: RotaryRoute[] = [];
	for (const start of ROTARY_APPROACHES) {
		for (const end of ROTARY_APPROACHES) {
			if (start === end) continue;
			const startTheta = APPROACH_ANGLES[start];
			const endTheta = APPROACH_ANGLES[end];
			const arc = sampleEllipseArc(
				a,
				b,
				startTheta,
				startTheta - clockwiseDelta(startTheta, endTheta),
				80,
			);
			routes.push({
				start,
				end,
				path: [
					...sampleLine(nodes[`${start}_entry`], nodes[`${start}_ring_in`], 20),
					...sampleLine(
						nodes[`${start}_ring_in`],
						ellipsePoint(a, b, startTheta),
						12,
					).slice(1),
					...arc.slice(1),
					...sampleLine(
						ellipsePoint(a, b, endTheta),
						nodes[`${end}_ring_out`],
						12,
					).slice(1),
					...sampleLine(
						nodes[`${end}_ring_out`],
						nodes[`${end}_exit`],
						20,
					).slice(1),
				],
			});
		}
	}

	const innerCorePath = sampleEllipseArc(
		a - cfg.ringWidth,
		b - cfg.ringWidth,
		0,
		Math.PI * 2,
		160,
	);
	const limit = Math.max(260, a + cfg.portalSetback + 110);

	return { config: cfg, nodes, edges, routes, ringPath, innerCorePath, limit };
}

export function nextClockwiseExit(approach: ApproachId): ApproachId {
	return getClockwiseNext(approach);
}
