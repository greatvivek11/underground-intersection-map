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

	// SVG donut chart constants
	const size = 200;
	const radius = 65;
	const strokeWidth = 24;
	const center = size / 2;
	const circumference = 2 * Math.PI * radius;

	// Calculate segment parameters
	const segments =
		policy === "mixed"
			? [
					{ value: 60, color: "var(--primary)", label: "Boring (60%)" },
					{ value: 25, color: "#f59e0b", label: "Ventilation (25%)" },
					{ value: 15, color: "var(--text-muted)", label: "Safety (15%)" },
				]
			: [
					{ value: 80, color: "var(--primary)", label: "Boring (80%)" },
					{ value: 5, color: "var(--left-turn)", label: "Ventilation (5%)" },
					{ value: 15, color: "var(--text-muted)", label: "Safety (15%)" },
				];

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
								style={{ transform: "rotate(-90deg)" }}
							>
								<title>Cost Distribution / KM</title>
								{segments.map((seg) => {
									const dashOffset =
										circumference - (seg.value / 100) * circumference;
									const dashArray = `${circumference} ${circumference}`;
									const offsetPercent =
										(accumulatedPercent / 100) * circumference;
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
											strokeDashoffset={dashOffset - offsetPercent}
											style={{
												transition:
													"stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease",
											}}
										/>
									);
								})}
							</svg>
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
								}}
							>
								<span
									style={{
										fontSize: "0.75rem",
										color: "var(--text-muted)",
										textTransform: "uppercase",
									}}
								>
									Ventilation
								</span>
								<span
									style={{
										fontSize: "1.75rem",
										fontWeight: 800,
										fontFamily: "var(--font-heading)",
									}}
								>
									{policy === "mixed" ? "25%" : "5%"}
								</span>
							</div>
						</div>

						{/* Legend */}
						<div
							style={{
								display: "flex",
								gap: "1.5rem",
								fontSize: "0.8rem",
								fontWeight: 600,
							}}
						>
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
							>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "3px",
										background: "var(--primary)",
									}}
								/>
								<span>Boring</span>
							</div>
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
							>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "3px",
										background:
											policy === "mixed" ? "#f59e0b" : "var(--left-turn)",
									}}
								/>
								<span>Ventilation</span>
							</div>
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
							>
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "3px",
										background: "var(--text-muted)",
									}}
								/>
								<span>Safety/Lining</span>
							</div>
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
