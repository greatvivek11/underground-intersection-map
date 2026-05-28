import { buildTunnelConfig } from "../src/utils/geometry.ts";
import {
	ROTARY_APPROACHES,
	buildRotaryNetwork,
	nextClockwiseExit,
} from "../src/utils/rotaryGeometry.ts";

const EPS = 1e-6;
const config = buildTunnelConfig({ portalSetback: 145 });
const network = buildRotaryNetwork(config);
const a = network.config.majorDiameter / 2;
const b = network.config.minorDiameter / 2;

function assert(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

for (const [idx, point] of network.ringPath.entries()) {
	const value = point[0] ** 2 / a ** 2 + point[1] ** 2 / b ** 2;
	assert(
		Math.abs(value - 1) < EPS,
		`ring point ${idx} is not on configured ellipse`,
	);
}

for (const approach of ROTARY_APPROACHES) {
	const entryCorridors = network.edges.filter(
		(edge) => edge.id === `${approach}_entry_corridor`,
	);
	const exitCorridors = network.edges.filter(
		(edge) => edge.id === `${approach}_exit_corridor`,
	);
	assert(entryCorridors.length === 1, `${approach} missing entry corridor`);
	assert(exitCorridors.length === 1, `${approach} missing exit corridor`);

	const next = nextClockwiseExit(approach);
	const route = network.routes.find(
		(candidate) => candidate.start === approach && candidate.end === next,
	);
	assert(Boolean(route), `${approach} missing clockwise route to ${next}`);
	assert((route?.path.length ?? 0) > 10, `${approach} route path is empty`);
}

assert(network.routes.length === 12, "rotary network should expose 12 movements");

console.log("Rotary geometry OK");
