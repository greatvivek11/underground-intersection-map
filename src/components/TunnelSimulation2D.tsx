import { useCallback, useEffect, useRef } from "react";
import type { TunnelConfig, TunnelEdge } from "../utils/geometry";
import { APPROACHES, getTunnelNetwork } from "../utils/geometry";
import { spawnToTarget } from "../utils/vehicleSpawn";

interface Vehicle2D {
	path: number[][];
	progress: number;
	speed: number;
	color: string;
	width: number;
	length: number;
}

interface TunnelNetwork {
	nodes: Record<string, number[]>;
	edges: TunnelEdge[];
}

const TunnelSimulation2D = ({
	config,
	isDark,
	density,
	speed,
}: {
	config: TunnelConfig;
	isDark: boolean;
	density: number;
	speed: number;
}) => {
	// Setup refs
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const vehiclesRef = useRef<Vehicle2D[]>([]);
	const densityRef = useRef(density);
	const speedRef = useRef(speed);

	densityRef.current = density;
	speedRef.current = speed;

	// Helper function
	const getLeftNormal = useCallback((dir: number[]) => {
		return [-dir[1], dir[0]];
	}, []);

	// Particle System Update Logic
	const updateVehicles = useCallback(
		(
			network: TunnelNetwork,
			targetDensity: number,
			simSpeedMultiplier: number,
		) => {
			const vehicles = vehiclesRef.current;

			// Stitch a complete list of 12 routes
			const tunnelRoutes = network.edges.filter(
				(edge) => edge.type === "tunnel",
			);

			spawnToTarget(vehicles, targetDensity, () => {
				const route =
					tunnelRoutes[Math.floor(Math.random() * tunnelRoutes.length)];
				const start = route.from.split("_")[0];
				const end = route.to.split("_")[0];

				const entryPos = network.nodes[`${start}_entry`];
				const divPos = network.nodes[`${start}_div`];
				const mergePos = network.nodes[`${end}_merge`];
				const exitPos = network.nodes[`${end}_exit`];

				const fullPath = [entryPos, divPos, ...route.path, mergePos, exitPos];

				const colors = ["#00E5FF", "#34D399", "#F87171", "#F1F5F9"];

				return {
					path: fullPath,
					progress: 0,
					speed: (Math.random() * 0.4 + 0.8) * simSpeedMultiplier * 1.5,
					color: colors[Math.floor(Math.random() * colors.length)],
					width: 3.5,
					length: 7.5,
				};
			});

			if (vehicles.length > targetDensity) {
				vehicles.length = targetDensity;
			}

			vehiclesRef.current = vehicles
				.map((v) => {
					v.progress += v.speed;
					return v;
				})
				.filter((v) => v.progress < v.path.length - 1);
		},
		[],
	);

	// Draw Moving Vehicles
	const drawVehicles = useCallback(
		(
			ctx: CanvasRenderingContext2D,
			tx: (x: number) => number,
			ty: (y: number) => number,
			ts: (size: number) => number,
			isDark: boolean,
		) => {
			const vehicles = vehiclesRef.current;

			vehicles.forEach((v) => {
				const idx = Math.floor(v.progress);
				const nextIdx = Math.min(idx + 1, v.path.length - 1);

				const pCurr = v.path[idx];
				const pNext = v.path[nextIdx];

				if (!pCurr || !pNext) return;

				// Linear interpolation for sub-frame smoothness
				const tSub = v.progress - idx;
				const x = pCurr[0] + (pNext[0] - pCurr[0]) * tSub;
				const y = pCurr[1] + (pNext[1] - pCurr[1]) * tSub;

				const dx = pNext[0] - pCurr[0];
				const dy = pNext[1] - pCurr[1];
				const angle = Math.atan2(-dy, dx); // canvas inverted y

				ctx.save();
				ctx.translate(tx(x), ty(y));
				ctx.rotate(angle);

				// Shadow/Glow
				ctx.shadowBlur = isDark ? 6 : 2;
				ctx.shadowColor = v.color;

				// Vehicle base body (EV pod)
				ctx.fillStyle = v.color;
				const vw = ts(v.width);
				const vl = ts(v.length);
				ctx.fillRect(-vl / 2, -vw / 2, vl, vw);

				ctx.shadowBlur = 0; // Reset shadow

				// Draw Headlights (Cyan/White beams pointing right)
				ctx.fillStyle = "#FFFFFF";
				ctx.globalAlpha = 0.5;
				ctx.beginPath();
				ctx.moveTo(vl / 2, -vw / 4);
				ctx.lineTo(vl / 2 + ts(8), -vw / 2 - ts(3));
				ctx.lineTo(vl / 2 + ts(8), vw / 2 + ts(3));
				ctx.lineTo(vl / 2, vw / 4);
				ctx.fill();

				// Tail lights (red)
				ctx.fillStyle = "#EF4444";
				ctx.globalAlpha = 0.9;
				ctx.fillRect(-vl / 2, -vw / 3, ts(1), ts(1));
				ctx.fillRect(-vl / 2, vw / 3 - ts(1), ts(1), ts(1));

				ctx.restore();
				ctx.globalAlpha = 1.0;
			});
		},
		[],
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		vehiclesRef.current = [];

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let animationId: number;

		// Theme values (sync with visualize_tunnels.py)
		const theme = isDark
			? {
					bg: "#0B0E14",
					grid: "#1A1F2C",
					roadFill: "rgba(30, 37, 48, 0.45)",
					roadEdge: "#3A4556",
					medianFill: "#2E3B4E",
					laneDash: "#4E5D73",
					portalFill: "#1A1F2C",
					portalEdge: "#00E5FF",
					tunnelStraight: "#38BDF8",
					tunnelLeft: "#34D399",
					tunnelRight: "#F87171",
					text: "#E2E8F0",
					textMuted: "#94A3B8",
				}
			: {
					bg: "#F8F9FA",
					grid: "#E5E7EB",
					roadFill: "rgba(226, 232, 240, 0.5)",
					roadEdge: "#94A3B8",
					medianFill: "#CBD5E1",
					laneDash: "#FFFFFF",
					portalFill: "#334155",
					portalEdge: "#1E293B",
					tunnelStraight: "#2563EB",
					tunnelLeft: "#059669",
					tunnelRight: "#DC2626",
					text: "#0F172A",
					textMuted: "#64748B",
				};

		// Calculate dimensions
		const network = getTunnelNetwork(config);
		const limit = config.intersectionSize / 2.0 + config.portalSetback + 50.0;

		const resizeCanvas = () => {
			if (!canvas.parentElement) return;
			canvas.width = canvas.parentElement.clientWidth * window.devicePixelRatio;
			canvas.height =
				canvas.parentElement.clientHeight * window.devicePixelRatio;
			canvas.style.width = "100%";
			canvas.style.height = "100%";
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		// Main Loop
		const draw = () => {
			// Clear background
			ctx.fillStyle = theme.bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Coordinate scaling variables
			const viewSize = Math.min(canvas.width, canvas.height);
			const scale = (viewSize * 0.9) / (2 * limit); // 5% border padding
			const centerX = canvas.width / 2;
			const centerY = canvas.height / 2;

			// Coordinate converter helper
			const tx = (x: number) => centerX + x * scale;
			const ty = (y: number) => centerY - y * scale; // Invert y-axis for standard math space
			const ts = (size: number) => size * scale;

			// Draw grid
			ctx.strokeStyle = theme.grid;
			ctx.lineWidth = 0.5;
			const gridSpacing = 50;
			for (
				let x = -Math.floor(limit / gridSpacing) * gridSpacing;
				x <= limit;
				x += gridSpacing
			) {
				ctx.beginPath();
				ctx.moveTo(tx(x), 0);
				ctx.lineTo(tx(x), canvas.height);
				ctx.stroke();
			}
			for (
				let y = -Math.floor(limit / gridSpacing) * gridSpacing;
				y <= limit;
				y += gridSpacing
			) {
				ctx.beginPath();
				ctx.moveTo(0, ty(y));
				ctx.lineTo(canvas.width, ty(y));
				ctx.stroke();
			}

			// Draw surface road layout
			const rw = config.roadWidth;
			const hw = rw / 2.0;
			const hb = config.intersectionSize / 2.0;
			const roadLen = hb + config.portalSetback + 40.0;

			ctx.fillStyle = theme.roadFill;
			ctx.strokeStyle = theme.roadEdge;
			ctx.lineWidth = 1.2;

			// East-West road
			ctx.fillRect(tx(-roadLen), ty(hw), ts(2 * roadLen), ts(rw));
			ctx.strokeRect(tx(-roadLen), ty(hw), ts(2 * roadLen), ts(rw));

			// North-South road
			ctx.fillRect(tx(-hw), ty(roadLen), ts(rw), ts(2 * roadLen));
			ctx.strokeRect(tx(-hw), ty(roadLen), ts(rw), ts(2 * roadLen));

			// Central junction square (clear edge overlays)
			ctx.fillRect(tx(-hw), ty(hw), ts(rw), ts(rw));

			// Draw medians
			ctx.fillStyle = theme.medianFill;
			const mw = config.medianWidth;
			const hmw = mw / 2.0;

			ctx.fillRect(tx(-roadLen), ty(hmw), ts(roadLen - hw), ts(mw)); // West
			ctx.strokeRect(tx(-roadLen), ty(hmw), ts(roadLen - hw), ts(mw));

			ctx.fillRect(tx(hw), ty(hmw), ts(roadLen - hw), ts(mw)); // East
			ctx.strokeRect(tx(hw), ty(hmw), ts(roadLen - hw), ts(mw));

			ctx.fillRect(tx(-hmw), ty(roadLen), ts(mw), ts(roadLen - hw)); // North
			ctx.strokeRect(tx(-hmw), ty(roadLen), ts(mw), ts(roadLen - hw));

			ctx.fillRect(tx(-hmw), ty(-hw), ts(mw), ts(roadLen - hw)); // South
			ctx.strokeRect(tx(-hmw), ty(-hw), ts(mw), ts(roadLen - hw));

			// Dashed lane lines
			ctx.strokeStyle = theme.laneDash;
			ctx.lineWidth = 1.0;
			ctx.setLineDash([8, 8]);
			const lOffset = hmw + config.laneWidth;

			// E-W lane dividers
			ctx.beginPath();
			ctx.moveTo(tx(-roadLen), ty(lOffset));
			ctx.lineTo(tx(-hw), ty(lOffset));
			ctx.moveTo(tx(-roadLen), ty(-lOffset));
			ctx.lineTo(tx(-hw), ty(-lOffset));
			ctx.moveTo(tx(hw), ty(lOffset));
			ctx.lineTo(tx(roadLen), ty(lOffset));
			ctx.moveTo(tx(hw), ty(-lOffset));
			ctx.lineTo(tx(roadLen), ty(-lOffset));
			ctx.stroke();

			// N-S lane dividers
			ctx.beginPath();
			ctx.moveTo(tx(lOffset), ty(-roadLen));
			ctx.lineTo(tx(lOffset), ty(-hw));
			ctx.moveTo(tx(-lOffset), ty(-roadLen));
			ctx.lineTo(tx(-lOffset), ty(-hw));
			ctx.moveTo(tx(lOffset), ty(hw));
			ctx.lineTo(tx(lOffset), ty(roadLen));
			ctx.moveTo(tx(-lOffset), ty(hw));
			ctx.lineTo(tx(-lOffset), ty(roadLen));
			ctx.stroke();

			ctx.setLineDash([]); // Reset dashed lines

			const drawEdgePath = (path: number[][], drawFn: () => void) => {
				ctx.beginPath();
				ctx.moveTo(tx(path[0][0]), ty(path[0][1]));
				for (let i = 1; i < path.length; i++) {
					ctx.lineTo(tx(path[i][0]), ty(path[i][1]));
				}
				drawFn();
			};

			// Draw tunnel casings (troughs)
			network.edges.forEach((edge) => {
				if (edge.type === "tunnel") {
					const path = edge.path;
					ctx.strokeStyle = theme.bg;
					ctx.lineWidth = 7.0;
					drawEdgePath(path, () => ctx.stroke());
					ctx.strokeStyle = theme.grid;
					ctx.lineWidth = 5.0;
					drawEdgePath(path, () => ctx.stroke());
				}
			});

			// Draw active tunnels
			network.edges.forEach((edge) => {
				let color = theme.textMuted;
				if (edge.type === "tunnel") {
					if (edge.routeType === "straight") color = theme.tunnelStraight;
					else if (edge.routeType === "left") color = theme.tunnelLeft;
					else if (edge.routeType === "right") color = theme.tunnelRight;
				}

				ctx.strokeStyle = color;
				ctx.lineWidth = edge.type === "tunnel" ? 2.5 : 1.5;
				ctx.setLineDash(edge.type !== "tunnel" ? [2, 4] : []);

				drawEdgePath(edge.path, () => ctx.stroke());
			});
			ctx.setLineDash([]); // Reset

			updateVehicles(network, densityRef.current, speedRef.current);
			drawVehicles(ctx, tx, ty, ts, isDark);

			// Draw Portals
			ctx.lineWidth = 1.5;
			Object.keys(APPROACHES).forEach((name) => {
				const entry = network.nodes[`${name}_entry`];
				const exit = network.nodes[`${name}_exit`];

				const dirIn = APPROACHES[name].in;
				const dirOut = APPROACHES[name].out;

				// Helper to draw portal box
				const drawPortalBox = (pos: number[], dir: number[], label: string) => {
					ctx.save();
					ctx.translate(tx(pos[0]), ty(pos[1]));
					const angle = Math.atan2(-dir[1], dir[0]); // negative y because canvas y is down
					ctx.rotate(angle);

					// Draw outer casing
					ctx.fillStyle = theme.portalFill;
					ctx.strokeStyle = theme.portalEdge;
					const pw = ts(14);
					const pl = ts(24);
					ctx.fillRect(-pl / 2, -pw / 2, pl, pw);
					ctx.strokeRect(-pl / 2, -pw / 2, pl, pw);

					// Hatch lines
					ctx.strokeStyle = theme.textMuted;
					ctx.lineWidth = 0.5;
					ctx.globalAlpha = 0.2;
					for (let step = -10; step <= 10; step += 4) {
						ctx.beginPath();
						ctx.moveTo(ts(step) - pl / 4, -pw / 2);
						ctx.lineTo(ts(step) + pl / 4, pw / 2);
						ctx.stroke();
					}
					ctx.globalAlpha = 1.0;
					ctx.restore();

					// Label
					ctx.fillStyle = theme.text;
					ctx.font = "bold 8px sans-serif";
					ctx.textAlign = "center";
					const norm = getLeftNormal(dir);
					// Offset text to avoid drawing on roads
					const offX = pos[0] - norm[0] * 12;
					const offY = pos[1] - norm[1] * 12;
					ctx.fillText(label, tx(offX), ty(offY));
				};

				drawPortalBox(entry, dirIn, `${name} IN`);
				drawPortalBox(exit, dirOut, `${name} OUT`);
			});

			// Draw divergence / merge node dots
			Object.keys(APPROACHES).forEach((name) => {
				const div = network.nodes[`${name}_div`];
				const mrg = network.nodes[`${name}_merge`];

				// Divergence node (Split)
				ctx.fillStyle = theme.tunnelRight;
				ctx.strokeStyle = theme.text;
				ctx.lineWidth = 1.0;
				ctx.beginPath();
				ctx.arc(tx(div[0]), ty(div[1]), 3.5, 0, 2 * Math.PI);
				ctx.fill();
				ctx.stroke();

				// Merge node
				ctx.fillStyle = theme.tunnelStraight;
				ctx.beginPath();
				ctx.arc(tx(mrg[0]), ty(mrg[1]), 3.5, 0, 2 * Math.PI);
				ctx.fill();
				ctx.stroke();
			});

			// Draw Measurements callouts (minimally styled)
			ctx.strokeStyle = theme.textMuted;
			ctx.fillStyle = theme.textMuted;
			ctx.lineWidth = 0.8;
			ctx.font = "8px monospace";

			// Portal setback measurement
			const xPos = -config.portalOffset - 15;
			const yStart = -hb;
			const yEnd = -hb - config.portalSetback;

			ctx.beginPath();
			ctx.moveTo(tx(xPos), ty(yStart));
			ctx.lineTo(tx(xPos), ty(yEnd));
			ctx.stroke();
			// Arrowheads
			ctx.beginPath();
			ctx.moveTo(tx(xPos) - 3, ty(yStart) + 5);
			ctx.lineTo(tx(xPos), ty(yStart));
			ctx.lineTo(tx(xPos) + 3, ty(yStart) + 5);
			ctx.moveTo(tx(xPos) - 3, ty(yEnd) - 5);
			ctx.lineTo(tx(xPos), ty(yEnd));
			ctx.lineTo(tx(xPos) + 3, ty(yEnd) - 5);
			ctx.stroke();
			ctx.save();
			ctx.translate(tx(xPos) - 5, ty((yStart + yEnd) / 2));
			ctx.rotate(-Math.PI / 2);
			ctx.textAlign = "center";
			ctx.fillText(`${config.portalSetback}ft Setback`, 0, 0);
			ctx.restore();

			// Road width measurement (Top)
			ctx.beginPath();
			ctx.moveTo(tx(-hw), ty(hb + 15));
			ctx.lineTo(tx(hw), ty(hb + 15));
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(tx(-hw) + 5, ty(hb + 15) - 3);
			ctx.lineTo(tx(-hw), ty(hb + 15));
			ctx.lineTo(tx(-hw) + 5, ty(hb + 15) + 3);
			ctx.moveTo(tx(hw) - 5, ty(hb + 15) - 3);
			ctx.lineTo(tx(hw), ty(hb + 15));
			ctx.lineTo(tx(hw) - 5, ty(hb + 15) + 3);
			ctx.stroke();
			ctx.textAlign = "center";
			ctx.fillText(`Road: ${config.roadWidth}ft`, tx(0), ty(hb + 20));

			animationId = requestAnimationFrame(draw);
		};

		animationId = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener("resize", resizeCanvas);
		};
	}, [config, isDark, updateVehicles, drawVehicles, getLeftNormal]);

	return (
		<canvas
			ref={canvasRef}
			style={{ display: "block", width: "100%", height: "100%" }}
		/>
	);
};

export default TunnelSimulation2D;
