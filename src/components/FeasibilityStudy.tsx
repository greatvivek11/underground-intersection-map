import { BarChart3, ChevronRight, Shield } from "lucide-react";

export default function FeasibilityStudy() {
	const metrics = [
		{
			name: "Capital Cost",
			key: "CapEx",
			desc: "Lower scores mean lower initial cost per kilometer.",
		},
		{
			name: "Time to Build",
			key: "Time",
			desc: "Lower scores mean faster boring and deployment.",
		},
		{
			name: "Land Acquisition",
			key: "Land",
			desc: "Lower scores mean less public displacement and legal hurdles.",
		},
		{
			name: "Capacity (Throughput)",
			key: "Capacity",
			desc: "Higher scores mean greater passenger movement capacity.",
		},
		{
			name: "Eco Disruption",
			key: "Eco",
			desc: "Lower scores mean less tree-cutting, noise, and carbon idling.",
		},
	];

	// Radar Data (out of 10, lower is better for cost/time/land/eco, higher better for capacity)
	// We'll normalize so center = 0, edge = 10.
	const dataSets = [
		{
			label: "Elevated Flyovers",
			values: [6, 7, 9, 4, 8],
			color: "#64748b",
			fill: "rgba(100, 116, 139, 0.1)",
		},
		{
			label: "Mass Metro Rail",
			values: [10, 9, 6, 10, 5],
			color: "#f59e0b",
			fill: "rgba(245, 158, 11, 0.1)",
		},
		{
			label: "12ft Micro-Tunnel",
			values: [4, 4, 1, 6, 2],
			color: "var(--primary)",
			fill: "var(--primary-bg)",
		},
	];

	// SVG Radar Constants
	const size = 300;
	const center = size / 2;
	const radius = 100;
	const numAxes = 5;

	const getCoordinates = (index: number, value: number) => {
		const angle = (index * 2 * Math.PI) / numAxes - Math.PI / 2; // start from top
		const valRatio = value / 10;
		const x = center + radius * valRatio * Math.cos(angle);
		const y = center + radius * valRatio * Math.sin(angle);
		return { x, y };
	};

	// Generate web background grid rings
	const rings = [2, 4, 6, 8, 10];

	return (
		<section
			id="comparative-analysis"
			className="section-container scroll-mt-6"
		>
			<div className="section-header">
				<h2 className="section-title">Comparative Infrastructure Analysis</h2>
				<p className="section-subtitle">
					Evaluating the performance trade-offs of micro-tunnel underpasses
					against traditional public works.
				</p>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
					gap: "2.5rem",
					alignItems: "center",
				}}
			>
				{/* Radar Chart Visual */}
				<div
					className="glass-card"
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "1.5rem",
						padding: "2.5rem",
					}}
				>
					<h3
						style={{ fontSize: "1.1rem", fontWeight: 700, textAlign: "center" }}
					>
						Multidimensional Infrastructure Comparison
					</h3>

					<div style={{ width: size, height: size, position: "relative" }}>
						<svg
							width={size}
							height={size}
							viewBox={`0 0 ${size} ${size}`}
							style={{ overflow: "visible" }}
						>
							<title>Infrastructure Comparison</title>
							{/* Web Rings */}
							{rings.map((ring) => {
								const points = Array.from({ length: numAxes })
									.map((_, i) => {
										const coords = getCoordinates(i, ring);
										return `${coords.x},${coords.y}`;
									})
									.join(" ");

								return (
									<polygon
										key={ring}
										points={points}
										fill="none"
										stroke="var(--border-color)"
										strokeWidth="0.8"
										strokeDasharray={ring === 10 ? "none" : "2,2"}
									/>
								);
							})}

							{/* Axis lines */}
							{Array.from({ length: numAxes }).map((_, i) => {
								const endCoords = getCoordinates(i, 10);
								const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
								// Position labels slightly outside the 10-ring
								const labelDist = radius + 22;
								const lx = center + labelDist * Math.cos(angle);
								const ly = center + labelDist * Math.sin(angle);

								const labelAlign =
									Math.cos(angle) > 0.1
										? "start"
										: Math.cos(angle) < -0.1
											? "end"
											: "middle";

								return (
									<g key={metrics[i].key}>
										<line
											x1={center}
											y1={center}
											x2={endCoords.x}
											y2={endCoords.y}
											stroke="var(--border-color)"
											strokeWidth="0.8"
										/>
										<text
											x={lx}
											y={ly + 4}
											fill="var(--text-muted)"
											fontSize="9.5"
											fontWeight="600"
											textAnchor={labelAlign}
										>
											{metrics[i].name}
										</text>
									</g>
								);
							})}

							{/* Datasets Polygons */}
							{dataSets.map((dataset) => {
								const points = dataset.values
									.map((val, i) => {
										const coords = getCoordinates(i, val);
										return `${coords.x},${coords.y}`;
									})
									.join(" ");

								return (
									<g key={dataset.label}>
										<polygon
											points={points}
											fill={dataset.fill}
											stroke={dataset.color}
											strokeWidth={
												dataset.label === "12ft Micro-Tunnel" ? "2.5" : "1.5"
											}
											style={{ transition: "all 0.3s ease" }}
										/>
										{/* Points dots */}
										{dataset.values.map((val, vIdx) => {
											const metricsItem = metrics[vIdx];
											if (!metricsItem) return null;
											const coords = getCoordinates(vIdx, val);
											return (
												<circle
													key={`dot-${metricsItem.key}-${dataset.label}`}
													cx={coords.x}
													cy={coords.y}
													r={
														dataset.label === "12ft Micro-Tunnel" ? "3.5" : "2"
													}
													fill={dataset.color}
												/>
											);
										})}
									</g>
								);
							})}
						</svg>
					</div>

					{/* Chart Legend */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "0.4rem",
							fontSize: "0.8rem",
							width: "100%",
							borderTop: "1px solid var(--border-color)",
							paddingTop: "1rem",
							marginTop: "0.5rem",
						}}
					>
						{dataSets.map((dataset) => (
							<div
								key={dataset.label}
								style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
							>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "3px",
										background: dataset.color,
										boxShadow:
											dataset.label === "12ft Micro-Tunnel"
												? "0 0 8px var(--primary)"
												: "none",
									}}
								/>
								<span
									style={{
										fontWeight:
											dataset.label === "12ft Micro-Tunnel" ? 700 : 500,
									}}
								>
									{dataset.label}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Evaluation Summary Cards */}
				<div
					style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
				>
					<div
						className="glass-card"
						style={{ display: "flex", gap: "1rem", padding: "1.5rem" }}
					>
						<div
							style={{
								background: "rgba(100, 116, 139, 0.1)",
								color: "#64748b",
								padding: "0.5rem",
								borderRadius: "0.5rem",
								height: "fit-content",
							}}
						>
							<Shield size={18} />
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.2rem",
							}}
						>
							<span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
								Elevated Flyovers: High Land Disputes
							</span>
							<p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
								Traditional defaults are quick to build but offer minimal
								capacity extension, are visually disruptive, and cause prolonged
								gridlock during surface construction.
							</p>
						</div>
					</div>

					<div
						className="glass-card"
						style={{ display: "flex", gap: "1rem", padding: "1.5rem" }}
					>
						<div
							style={{
								background: "rgba(245, 158, 11, 0.1)",
								color: "#f59e0b",
								padding: "0.5rem",
								borderRadius: "0.5rem",
								height: "fit-content",
							}}
						>
							<BarChart3 size={18} />
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.2rem",
							}}
						>
							<span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
								Mass Metro Rail: Extreme Capital Burden
							</span>
							<p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
								Maximum passenger volume displacement, but demands massive CapEx
								(up to ₹500 Cr/km) and takes decades of political and
								environmental execution.
							</p>
						</div>
					</div>

					<div
						className="glass-card"
						style={{
							display: "flex",
							gap: "1rem",
							padding: "1.5rem",
							borderLeft: "4px solid var(--primary)",
							background: "var(--primary-bg)",
						}}
					>
						<div
							style={{
								background: "var(--primary-bg)",
								color: "var(--primary)",
								padding: "0.5rem",
								borderRadius: "0.5rem",
								height: "fit-content",
								boxShadow: "0 0 10px var(--primary-glow)",
							}}
						>
							<ChevronRight size={18} />
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.2rem",
							}}
						>
							<span
								style={{
									fontWeight: 700,
									fontSize: "0.95rem",
									color: "var(--primary)",
								}}
							>
								12ft Micro-Tunnel: The Optimal Balance
							</span>
							<p style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
								Bypasses surface property entirely, reduces CapEx by 70%
								compared to standard transit tunnels, and can be launching
								immediately from surface parking lots.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
