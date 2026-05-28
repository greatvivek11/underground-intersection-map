import { useEffect, useRef, useState } from "react";
import type { TunnelConfig } from "../utils/geometry";
import { buildRotaryNetwork, type RotaryRoute } from "../utils/rotaryGeometry";

interface Vehicle {
	id: number;
	route: RotaryRoute;
	progress: number;
	speed: number;
}

const TunnelSimulation2D = ({
	config,
	isDark,
	density,
	speed: simSpeedMultiplier,
}: {
	config: TunnelConfig;
	isDark: boolean;
	density: number;
	speed: number;
}) => {
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const networkRef = useRef(buildRotaryNetwork(config));
	const requestRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);

	// Update network topology when configuration changes
	useEffect(() => {
		networkRef.current = buildRotaryNetwork(config);
	}, [config]);

	// Initialize and maintain vehicles list when density changes
	useEffect(() => {
		const routes = networkRef.current.routes;
		if (routes.length === 0) return;

		setVehicles((prev) => {
			const targetCount = density;
			let newVehicles = [...prev];

			// Truncate if density is lowered
			if (newVehicles.length > targetCount) {
				newVehicles = newVehicles.slice(0, targetCount);
			}

			// Add new vehicles if density is raised
			while (newVehicles.length < targetCount) {
				const randomRoute = routes[Math.floor(Math.random() * routes.length)];
				newVehicles.push({
					id: Math.random(),
					route: randomRoute,
					progress: Math.random(), // Distribute them evenly along paths initially
					speed: 0.05 + Math.random() * 0.05, // Random variation in speed
				});
			}

			return newVehicles;
		});
	}, [density]);

	// Animation tick loop using requestAnimationFrame
	useEffect(() => {
		const animate = (time: number) => {
			if (lastTimeRef.current === 0) {
				lastTimeRef.current = time;
			}
			const delta = (time - lastTimeRef.current) / 1000;
			lastTimeRef.current = time;

			setVehicles((prev) => {
				const routes = networkRef.current.routes;
				return prev.map((vehicle) => {
					// Increment progress along route
					let nextProgress =
						vehicle.progress + vehicle.speed * delta * simSpeedMultiplier * 0.8;

					// If route completed, loop back with a new random destination
					let nextRoute = vehicle.route;
					if (nextProgress >= 1) {
						nextProgress = 0;
						if (routes.length > 0) {
							nextRoute = routes[Math.floor(Math.random() * routes.length)];
						}
					}

					return {
						...vehicle,
						route: nextRoute,
						progress: nextProgress,
					};
				});
			});

			requestRef.current = requestAnimationFrame(animate);
		};

		requestRef.current = requestAnimationFrame(animate);
		return () => {
			cancelAnimationFrame(requestRef.current);
		};
	}, [simSpeedMultiplier]);

	// Helper function to interpolate [x, y] coordinates along a path route
	const getPointAlongPath = (path: number[][], progress: number) => {
		if (path.length === 0) return { x: 0, y: 0 };
		if (path.length === 1) return { x: path[0][0], y: path[0][1] };

		const totalSegments = path.length - 1;
		const floatIdx = progress * totalSegments;
		const idx = Math.floor(floatIdx);
		const nextIdx = Math.min(idx + 1, totalSegments);

		if (idx === nextIdx) {
			return { x: path[idx][0], y: path[idx][1] };
		}

		const t = floatIdx - idx;
		const p0 = path[idx];
		const p1 = path[nextIdx];

		return {
			x: p0[0] + (p1[0] - p0[0]) * t,
			y: p0[1] + (p1[1] - p0[1]) * t,
		};
	};

	// Generate Vercel backend dynamic SVG generator url
	const backgroundUrl = `/api/generate?setback=${config.portalSetback}&roadWidth=${config.roadWidth}&laneWidth=${config.laneWidth}&rotaryDiameter=${config.rotaryDiameter}&dark=${isDark}&format=svg`;

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				background: isDark ? "#0B0E14" : "#F8F9FA",
			}}
		>
			{/* Matplotlib high-fidelity background image */}
			<img
				src={backgroundUrl}
				alt="Underground Rotary Schematic Map"
				style={{
					width: "100%",
					height: "100%",
					objectFit: "contain",
					pointerEvents: "none",
				}}
			/>

			{/* Animate vehicle dots inside standard SVG coordinate overlay */}
			{(() => {
				const lim = networkRef.current.limit;
				return (
					<svg
						viewBox={`${-lim} ${-lim} ${lim * 2} ${lim * 2}`}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							pointerEvents: "none",
						}}
					>
						<title>Vehicle Animation Overlay</title>
						{vehicles.map((vehicle) => {
							const pt = getPointAlongPath(
								vehicle.route.path,
								vehicle.progress,
							);
							// Standard SVG coordinates: invert Y (since Matplotlib has y-up and SVG has y-down)
							return (
								<circle
									key={vehicle.id}
									cx={pt.x}
									cy={-pt.y}
									r="2.8"
									fill="#DC2626"
									stroke="#FFFFFF"
									strokeWidth="0.6"
									style={{ transition: "all 0.03s linear" }}
								/>
							);
						})}
					</svg>
				);
			})()}
		</div>
	);
};

export default TunnelSimulation2D;
