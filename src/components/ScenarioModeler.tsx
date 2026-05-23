import { Landmark, Wind } from "lucide-react";
import { useState } from "react";

export default function ScenarioModeler() {
	const [policy, setPolicy] = useState("mixed"); // 'mixed' or 'ev'

	// Cost distributions
	// mixed: Boring=60, Vent=25, Safety=15
	// ev: Boring=80, Vent=5, Safety=15
	const data =
		policy === "mixed"
			? {
					boring: 60,
					vent: 25,
					safety: 15,
					ventCost: "₹40 Cr / km",
					safetyLevel: "High (ICE Exhaust / Fuel)",
				}
			: {
					boring: 80,
					vent: 5,
					safety: 15,
					ventCost: "₹5 Cr / km",
					safetyLevel: "Moderate (Battery Fires Only)",
				};

	// SVG donut chart constants — 260 px gives enough margin for per-slice labels
	const size = 260;
	const radius = 65;
	const strokeWidth = 22;
	const center = size / 2; // 130
	const circumference = 2 * Math.PI * radius;

	// Segments – include a short `name` for the in-chart labels
	const segments =
		policy === "mixed"
			? [
					{
						value: 60,
						color: "var(--primary)",
						label: "Boring (60%)",
						name: "Boring",
					},
					{
						value: 25,
						color: "#f59e0b",
						label: "Ventilation (25%)",
						name: "Ventilation",
					},
					{
						value: 15,
						color: "var(--text-muted)",
						label: "Safety (15%)",
						name: "Safety",
					},
				]
			: [
					{
						value: 80,
						color: "var(--primary)",
						label: "Boring (80%)",
						name: "Boring",
					},
					{
						value: 5,
						color: "var(--left-turn)",
						label: "Ventilation (5%)",
						name: "Vent.",
					},
					{
						value: 15,
						color: "var(--text-muted)",
						label: "Safety (15%)",
						name: "Safety",
					},
				];

	// Pre-compute label positions at each segment's arc midpoint.
	// The SVG has CSS transform: rotate(-90deg), so an SVG angle θ equals
	// the visual clockwise angle from 12 o'clock — no extra offset needed.
	let labelAccum = 0;
	const sliceLabelData = segments.map((seg) => {
		const midAngleRad = ((labelAccum + seg.value / 2) / 100) * 2 * Math.PI;
		// Push tiny slices further out to avoid ring overlap
		const lRadius = radius + strokeWidth / 2 + (seg.value < 12 ? 28 : 20);
		const lx = center + lRadius * Math.cos(midAngleRad);
		const ly = center + lRadius * Math.sin(midAngleRad);
		labelAccum += seg.value;
		return { ...seg, lx, ly };
	});

	let accumulatedPercent = 0;

	return (
		<section id="scenario-modeler" className="section-container scroll-mt-6">
			<div className="section-header">
				<h2 className="section-title">
					The EV Advantage & Ventilation Paradox
				</h2>
				<p className="section-subtitle">
					Allowing Internal Combustion Engines (ICE) requires massive
					ventilation shafts. Mandating EV-only unlocks the project's true
					viability.
				</p>
			</div>

			<div
				className="glass-card"
				style={{
					background:
						"linear-gradient(135deg, var(--bg-card) 60%, rgba(0, 229, 255, 0.03))",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						flexWrap: "wrap",
						gap: "3rem",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					{/* Controls & Metrics */}
					<div
						style={{
							flex: "1 1 350px",
							display: "flex",
							flexDirection: "column",
							gap: "2rem",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.75rem",
							}}
						>
							<h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
								Choose Tunnel Propulsion Policy
							</h3>
							<p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
								Toggle the operational policy to see the direct impact on CapEx
								distribution and air engineering constraints.
							</p>
						</div>

						{/* Toggle Switch */}
						<div
							style={{
								display: "flex",
								background: "var(--bg-color)",
								border: "1px solid var(--border-color)",
								borderRadius: "0.75rem",
								padding: "0.4rem",
								width: "100%",
								maxWidth: "350px",
							}}
						>
							<button
								type="button"
								onClick={() => setPolicy("mixed")}
								className="btn"
								style={{
									flex: 1,
									background:
										policy === "mixed" ? "var(--primary)" : "transparent",
									color:
										policy === "mixed"
											? "var(--text-inverse)"
											: "var(--text-main)",
									border: "none",
									fontSize: "0.85rem",
									padding: "0.5rem",
								}}
							>
								Mixed (ICE + EV)
							</button>
							<button
								type="button"
								onClick={() => setPolicy("ev")}
								className="btn"
								style={{
									flex: 1,
									background:
										policy === "ev" ? "var(--primary)" : "transparent",
									color:
										policy === "ev"
											? "var(--text-inverse)"
											: "var(--text-main)",
									border: "none",
									fontSize: "0.85rem",
									padding: "0.5rem",
								}}
							>
								EV-Only Corridor
							</button>
						</div>

						{/* Metrics Dashboard */}
						<div
							style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
						>
							<div
								style={{
									background: "var(--bg-color)",
									border: "1px solid var(--border-color)",
									borderRadius: "0.75rem",
									padding: "1rem",
									display: "flex",
									alignItems: "center",
									gap: "1rem",
								}}
							>
								<div
									style={{
										background:
											policy === "mixed"
												? "rgba(245, 158, 11, 0.1)"
												: "var(--left-turn-bg)",
										color: policy === "mixed" ? "#f59e0b" : "var(--left-turn)",
										padding: "0.5rem",
										borderRadius: "0.5rem",
									}}
								>
									<Wind size={20} />
								</div>
								<div style={{ display: "flex", flexDirection: "column" }}>
									<span
										style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
									>
										Ventilation Infrastructure CapEx
									</span>
									<strong
										style={{
											fontSize: "1.25rem",
											color:
												policy === "mixed" ? "#f59e0b" : "var(--left-turn)",
										}}
									>
										{data.ventCost}
									</strong>
								</div>
							</div>

							<div
								style={{
									background: "var(--bg-color)",
									border: "1px solid var(--border-color)",
									borderRadius: "0.75rem",
									padding: "1rem",
									display: "flex",
									alignItems: "center",
									gap: "1rem",
								}}
							>
								<div
									style={{
										background:
											policy === "mixed"
												? "rgba(239, 68, 68, 0.1)"
												: "var(--left-turn-bg)",
										color:
											policy === "mixed"
												? "var(--right-turn)"
												: "var(--left-turn)",
										padding: "0.5rem",
										borderRadius: "0.5rem",
									}}
								>
									<Landmark size={20} />
								</div>
								<div style={{ display: "flex", flexDirection: "column" }}>
									<span
										style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
									>
										Tunnel Safety Profile
									</span>
									<strong style={{ fontSize: "1rem" }}>
										{data.safetyLevel}
									</strong>
								</div>
							</div>
						</div>
					</div>

					{/* SVG Donut Chart */}
					<div
						style={{
							flex: "1 1 300px",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "1.5rem",
						}}
					>
						<h4
							style={{
								fontSize: "0.9rem",
								color: "var(--text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							Cost Distribution / KM
						</h4>

						<div style={{ position: "relative", width: size, height: size }}>
							<svg
								width={size}
								height={size}
								viewBox={`0 0 ${size} ${size}`}
								style={{ transform: "rotate(-90deg)", overflow: "visible" }}
							>
								<title>Cost Distribution / KM</title>

								{/* Donut ring segments */}
								{segments.map((seg) => {
									const segLength = (seg.value / 100) * circumference;
									const dashArray = `${segLength} ${circumference - segLength}`;
									const dashOffset =
										circumference * (1 - accumulatedPercent / 100);
									accumulatedPercent += seg.value;
									return (
										<circle
											key={seg.label}
											cx={center}
											cy={center}
											r={radius}
											fill="transparent"
											stroke={seg.color}
											strokeWidth={strokeWidth}
											strokeDasharray={dashArray}
											strokeDashoffset={dashOffset}
											style={{
												transition:
													"stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease",
											}}
										/>
									);
								})}

								{/* Per-slice labels – counter-rotated 90° to cancel the SVG's -90° CSS rotation */}
								{sliceLabelData.map((sl) => (
									<g
										key={`lbl-${sl.label}`}
										transform={`rotate(90, ${sl.lx}, ${sl.ly})`}
										style={{
											transition: "opacity 0.4s ease",
										}}
									>
										{/* category name */}
										<text
											x={sl.lx}
											y={sl.ly - 7}
											textAnchor="middle"
											dominantBaseline="middle"
											fill={sl.color}
											fontSize={sl.value < 10 ? 8 : 9}
											fontWeight="600"
											opacity="0.85"
										>
											{sl.name}
										</text>
										{/* percentage value */}
										<text
											x={sl.lx}
											y={sl.ly + 7}
											textAnchor="middle"
											dominantBaseline="middle"
											fill={sl.color}
											fontSize={sl.value < 10 ? 10 : 12}
											fontWeight="800"
										>
											{sl.value}%
										</text>
									</g>
								))}
							</svg>

							{/* Static center label */}
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
									pointerEvents: "none",
									gap: "2px",
								}}
							>
								<span
									style={{
										fontSize: "0.6rem",
										color: "var(--text-muted)",
										textTransform: "uppercase",
										letterSpacing: "0.1em",
									}}
								>
									CapEx
								</span>
								<span
									style={{
										fontSize: "0.6rem",
										color: "var(--text-muted)",
										textTransform: "uppercase",
										letterSpacing: "0.1em",
									}}
								>
									/ km
								</span>
							</div>
						</div>

						{/* Legend – driven from segments array so it stays in sync */}
						<div
							style={{
								display: "flex",
								gap: "1.25rem",
								fontSize: "0.8rem",
								fontWeight: 600,
								flexWrap: "wrap",
								justifyContent: "center",
							}}
						>
							{segments.map((seg) => (
								<div
									key={seg.label}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.4rem",
									}}
								>
									<div
										style={{
											width: "10px",
											height: "10px",
											borderRadius: "2px",
											background: seg.color,
											flexShrink: 0,
										}}
									/>
									<span style={{ color: "var(--text-muted)" }}>
										{seg.name === "Vent." ? "Ventilation" : seg.name}
									</span>
									<span style={{ color: seg.color, fontWeight: 800 }}>
										{seg.value}%
									</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Conclusion box */}
				<div
					style={{
						borderTop: "1px solid var(--border-color)",
						paddingTop: "1.5rem",
						marginTop: "2rem",
						fontSize: "0.9rem",
						color: "var(--text-muted)",
						lineHeight: 1.5,
					}}
				>
					{policy === "mixed" ? (
						<p>
							Allowing standard internal combustion engines (ICE) creates a
							heavy air toxicity problem. Passenger vehicles burn fuel producing
							carbon monoxide and heat. To clear this exhaust, massive
							mechanical ventilation shafts must emerge at the surface every 1.5
							km, which incurs high surface land acquisition costs in dense
							areas.
						</p>
					) : (
						<p style={{ color: "var(--text-main)" }}>
							🏆{" "}
							<strong style={{ color: "var(--left-turn)" }}>
								The EV Cheat Code:
							</strong>{" "}
							Restricting access exclusively to electric passenger cars and
							public EV shuttles removes toxic exhaust entirely. The heavy
							mechanical air-scrubbing stacks are eliminated, ventilation costs
							fall by 80%, and the underground corridor requires zero surface
							penetrations.
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
