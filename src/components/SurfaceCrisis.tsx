import { AlertCircle } from "lucide-react";

export default function SurfaceCrisis() {
	const cities = [
		{ name: "Bengaluru", speed: 14, color: "var(--right-turn)", percent: 14 },
		{ name: "Mumbai", speed: 16, color: "#f59e0b", percent: 16 },
		{ name: "Hyderabad", speed: 20, color: "#f59e0b", percent: 20 },
		{ name: "Delhi", speed: 22, color: "#eab308", percent: 22 },
	];

	return (
		<section id="surface-crisis" className="section-container scroll-mt-6">
			<div className="section-header">
				<h2 className="section-title">The Urban Congestion Crisis</h2>
				<p className="section-subtitle">
					Surface-level interventions in high-density Indian megacities are
					hitting physical and financial walls.
				</p>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
					gap: "2rem",
				}}
			>
				{/* Speed Stats Card */}
				<div
					className="glass-card"
					style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
				>
					<div
						style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
					>
						<h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
							Peak Hour Speeds
						</h3>
						<p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
							Average vehicular movement speed in commercial districts (km/h)
						</p>
					</div>

					<div
						style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
					>
						{cities.map((city) => (
							<div
								key={city.name}
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "0.4rem",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										fontSize: "0.9rem",
										fontWeight: 600,
									}}
								>
									<span>{city.name}</span>
									<span style={{ color: city.color }}>{city.speed} km/h</span>
								</div>
								<div
									style={{
										width: "100%",
										height: "8px",
										background: "rgba(255,255,255,0.05)",
										borderRadius: "10px",
										overflow: "hidden",
									}}
								>
									<div
										style={{
											width: `${city.percent * 3}%`, // Scale slightly for visual effect
											maxWidth: "100%",
											height: "100%",
											background: city.color,
											borderRadius: "10px",
											boxShadow: `0 0 8px ${city.color}`,
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* The Surface Paradox */}
				<div
					className="glass-card"
					style={{
						background:
							"radial-gradient(ellipse at bottom right, rgba(239, 68, 68, 0.05), var(--glass-bg))",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						gap: "1.5rem",
					}}
				>
					<div
						style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
					>
						<div
							style={{
								background: "var(--right-turn-bg)",
								color: "var(--right-turn)",
								padding: "0.5rem",
								borderRadius: "0.5rem",
							}}
						>
							<AlertCircle size={20} />
						</div>
						<h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
							The Surface Paradox
						</h3>
					</div>

					<p
						style={{
							fontSize: "0.95rem",
							color: "var(--text-muted)",
							lineHeight: 1.5,
						}}
					>
						Expanding roads causes <strong>induced demand</strong>, which
						quickly fills new lanes with more traffic. Elevated flyovers—the
						traditional solution—suffer from distinct challenges in the Indian
						context:
					</p>

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "1rem",
							fontSize: "0.85rem",
						}}
					>
						<div
							style={{
								display: "flex",
								gap: "0.75rem",
								alignItems: "flex-start",
							}}
						>
							<div style={{ color: "var(--right-turn)", marginTop: "0.15rem" }}>
								✕
							</div>
							<div>
								<strong>Prolonged Construction Closures:</strong> Casting
								pillars and launching heavy girders takes years, paralyzing
								active commerce and daily traffic below.
							</div>
						</div>
						<div
							style={{
								display: "flex",
								gap: "0.75rem",
								alignItems: "flex-start",
							}}
						>
							<div style={{ color: "var(--right-turn)", marginTop: "0.15rem" }}>
								✕
							</div>
							<div>
								<strong>Shortened Infrastructure Lifespans:</strong> Monsoons,
								high thermal changes, and heavy dynamic axle loads limit
								elevated flyover lifespans to ~50 years.
							</div>
						</div>
						<div
							style={{
								display: "flex",
								gap: "0.75rem",
								alignItems: "flex-start",
							}}
						>
							<div style={{ color: "var(--right-turn)", marginTop: "0.15rem" }}>
								✕
							</div>
							<div>
								<strong>Land and Visual Blight:</strong> Exorbitantly expensive
								land acquisition and massive concrete columns carve up
								neighborhoods, casting shade and trapping surface pollution.
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
