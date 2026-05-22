import { Ban, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function GeometricShift() {
	const [diameter, setDiameter] = useState(12); // Default 12 ft
	const refDiameter = 22; // Reference standard metro tunnel: 22 ft

	// Calculate area / volume ratio
	const calcVol = (d: number) => Math.PI * (d / 2) ** 2 * 1000; // cubic feet per km
	const refVol = calcVol(refDiameter);
	const currentVol = calcVol(diameter);
	const percentReduction = ((refVol - currentVol) / refVol) * 100;

	// SVG scales: map feet to SVG pixels (max diameter 30ft map to 240px)
	const pxRatio = 240 / 30;
	const refRadiusPx = (refDiameter / 2) * pxRatio;
	const currentRadiusPx = (diameter / 2) * pxRatio;

	return (
		<section id="geometric-shift" className="section-container scroll-mt-6">
			<div className="section-header">
				<h2 className="section-title">The 12-Foot Geometric Shift</h2>
				<p className="section-subtitle">
					Excavation volume scales quadratically with radius. Small tunnels
					change the economics of tunneling.
				</p>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
					gap: "2.5rem",
				}}
			>
				{/* Volumetric Slider and SVG */}
				<div
					className="glass-card"
					style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
				>
					<div
						style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
					>
						<h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
							Volumetric Reduction Calculator
						</h3>
						<p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
							Slide to adjust the proposed micro-tunnel diameter and compare
							excavation volumes.
						</p>
					</div>

					{/* Slider input */}
					<div className="slider-group">
						<div className="slider-label">
							<span>Proposed Tunnel Diameter</span>
							<span className="value">
								{diameter.toFixed(1)} ft ({(diameter * 0.3048).toFixed(2)} m)
							</span>
						</div>
						<input
							type="range"
							min="8"
							max="30"
							step="0.5"
							value={diameter}
							onChange={(e) => setDiameter(parseFloat(e.target.value))}
						/>
					</div>

					{/* SVG Comparison Container */}
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							background: "var(--bg-color)",
							border: "1px solid var(--border-color)",
							borderRadius: "0.75rem",
							padding: "2rem",
							height: "280px",
							position: "relative",
						}}
					>
						<svg
							width="260"
							height="260"
							viewBox="0 0 260 260"
							style={{ overflow: "visible" }}
							role="img"
							aria-labelledby="geometric-shift-title"
						>
							<title id="geometric-shift-title">Standard Metro Tunnel</title>
							{/* Outer Reference Tunnel Grid */}
							<circle
								cx="130"
								cy="130"
								r={refRadiusPx}
								fill="none"
								stroke="var(--text-muted)"
								strokeWidth="1.5"
								strokeDasharray="4,4"
								opacity="0.3"
							/>
							<text
								x="130"
								y={130 - refRadiusPx - 10}
								fill="var(--text-muted)"
								fontSize="10"
								textAnchor="middle"
								fontWeight="500"
							>
								Standard Metro: {refDiameter}ft
							</text>

							{/* Inner Proposed Tunnel */}
							<circle
								cx="130"
								cy="130"
								r={currentRadiusPx}
								fill="var(--primary-bg)"
								stroke="var(--primary)"
								strokeWidth="2.5"
								style={{
									transition: "r 0.1s ease",
									filter: "drop-shadow(0 0 4px var(--primary-glow))",
								}}
							/>
							{/* Schematic Inner road plane */}
							<line
								x1={130 - currentRadiusPx * 0.866}
								y1={130 + currentRadiusPx * 0.5}
								x2={130 + currentRadiusPx * 0.866}
								y2={130 + currentRadiusPx * 0.5}
								stroke="var(--primary)"
								strokeWidth="1.5"
								opacity="0.7"
								style={{ transition: "all 0.1s ease" }}
							/>
							<text
								x="130"
								y="135"
								fill="var(--text-main)"
								fontSize="13"
								fontWeight="700"
								textAnchor="middle"
								style={{ transition: "all 0.1s ease" }}
							>
								{diameter}ft
							</text>
						</svg>
					</div>

					{/* Math Output Panel */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "1rem",
							borderTop: "1px solid var(--border-color)",
							paddingTop: "1.5rem",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.25rem",
							}}
						>
							<span
								style={{
									fontSize: "0.8rem",
									color: "var(--text-muted)",
									textTransform: "uppercase",
									letterSpacing: "0.05em",
								}}
							>
								Muck Volume Reduction
							</span>
							<span
								style={{
									fontSize: "1.8rem",
									fontWeight: 800,
									color:
										percentReduction >= 60 ? "var(--left-turn)" : "#f59e0b",
									fontFamily: "var(--font-heading)",
								}}
							>
								{percentReduction.toFixed(1)}%
							</span>
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.25rem",
							}}
						>
							<span
								style={{
									fontSize: "0.8rem",
									color: "var(--text-muted)",
									textTransform: "uppercase",
									letterSpacing: "0.05em",
								}}
							>
								Muck excavated / km
							</span>
							<span
								style={{
									fontSize: "1.4rem",
									fontWeight: 700,
									fontFamily: "var(--font-mono)",
								}}
							>
								{Math.round(currentVol / 27).toLocaleString()} yd³
							</span>
						</div>
					</div>
				</div>

				{/* Regulatory Access Rules */}
				<div
					className="glass-card"
					style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
				>
					<div
						style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
					>
						<h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
							Strict Regulatory Access Rules
						</h3>
						<p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
							To minimize spatial constraints and structural cost, access is
							gated to specific vehicular classes.
						</p>
					</div>

					<div
						style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
					>
						{/* Rule 1: No 2/3 wheelers */}
						<div
							style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}
						>
							<div
								style={{
									background: "var(--right-turn-bg)",
									color: "var(--right-turn)",
									padding: "0.5rem",
									borderRadius: "0.5rem",
									flexShrink: 0,
								}}
							>
								<Ban size={20} />
							</div>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "0.2rem",
								}}
							>
								<span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
									No 2/3 Wheelers (Autos & Bikes)
								</span>
								<span
									style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
								>
									Disrupts constant-velocity flows, increases collision risks,
									and lacks standard autonomous driver-assist integration.
								</span>
							</div>
						</div>

						{/* Rule 2: No HCVs/Buses */}
						<div
							style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}
						>
							<div
								style={{
									background: "var(--right-turn-bg)",
									color: "var(--right-turn)",
									padding: "0.5rem",
									borderRadius: "0.5rem",
									flexShrink: 0,
								}}
							>
								<Ban size={20} />
							</div>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "0.2rem",
								}}
							>
								<span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
									No Heavy Commercial Vehicles (HCVs)
								</span>
								<span
									style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
								>
									Excluding large trucks keeps the structural height profile
									low, reducing the required tunnel lining thickness and saving
									structural costs.
								</span>
							</div>
						</div>

						{/* Rule 3: Yes Private EVs and Shuttles */}
						<div
							style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}
						>
							<div
								style={{
									background: "var(--left-turn-bg)",
									color: "var(--left-turn)",
									padding: "0.5rem",
									borderRadius: "0.5rem",
									flexShrink: 0,
								}}
							>
								<CheckCircle2 size={20} />
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
										color: "var(--left-turn)",
									}}
								>
									Standard Cars & EV Shuttles Only
								</span>
								<span
									style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
								>
									Enables high-speed passenger-throughput. 12-to-16 seater
									electric public shuttles maximize transport equity for non-car
									owners.
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
