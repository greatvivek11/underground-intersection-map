import {
	Compass,
	HardHat,
	Landmark,
	Leaf,
	ShieldAlert,
	Users,
} from "lucide-react";
import { useState } from "react";

export default function FeasibilityMatrix() {
	const [activeTab, setActiveTab] = useState("geo");

	const pillars = [
		{
			id: "geo",
			title: "Geological & Scientific",
			icon: <HardHat size={20} />,
			content: (
				<div
					style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
				>
					<p>
						India's megacities exhibit diverse geological strata, presenting
						varying tunneling challenges:
					</p>
					<div
						style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
					>
						<div
							style={{
								padding: "0.8rem",
								background: "rgba(255,255,255,0.03)",
								borderRadius: "0.5rem",
								borderLeft: "3px solid var(--primary)",
							}}
						>
							<strong style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>
								Delhi Alluvium (Soft Silt/Clay):
							</strong>
							<p
								style={{
									fontSize: "0.85rem",
									color: "var(--text-muted)",
									marginTop: "0.2rem",
								}}
							>
								Fast boring speeds, but loose sands require immediate circular
								lining placement to prevent soil collapse.
							</p>
						</div>
						<div
							style={{
								padding: "0.8rem",
								background: "rgba(255,255,255,0.03)",
								borderRadius: "0.5rem",
								borderLeft: "3px solid var(--left-turn)",
							}}
						>
							<strong style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>
								Mumbai Deccan Trap (Basalt Rock):
							</strong>
							<p
								style={{
									fontSize: "0.85rem",
									color: "var(--text-muted)",
									marginTop: "0.2rem",
								}}
							>
								Hard rock slows down penetration, but is structurally
								self-supporting, reducing standard lining thickness needs.
							</p>
						</div>
						<div
							style={{
								padding: "0.8rem",
								background: "rgba(255,255,255,0.03)",
								borderRadius: "0.5rem",
								borderLeft: "3px solid var(--right-turn)",
							}}
						>
							<strong style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>
								Bengaluru Gneiss (Mixed Granite):
							</strong>
							<p
								style={{
									fontSize: "0.85rem",
									color: "var(--text-muted)",
									marginTop: "0.2rem",
								}}
							>
								Highly abrasive geology that causes rapid wear on TBM
								cutterheads. Requires specialized cutters.
							</p>
						</div>
					</div>
				</div>
			),
		},
		{
			id: "eco",
			title: "Economic & Capital",
			icon: <Landmark size={20} />,
			content: (
				<div
					style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
				>
					<p>
						Financial metrics show significant cost disruption over heavy
						transit schemes:
					</p>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "1rem",
							marginBottom: "0.5rem",
						}}
					>
						<div
							style={{
								padding: "1rem",
								background: "rgba(239, 68, 68, 0.05)",
								border: "1px solid rgba(239, 68, 68, 0.1)",
								borderRadius: "0.5rem",
								textAlign: "center",
							}}
						>
							<span
								style={{
									fontSize: "0.75rem",
									color: "var(--text-muted)",
									textTransform: "uppercase",
								}}
							>
								Traditional Metro
							</span>
							<div
								style={{
									fontSize: "1.25rem",
									fontWeight: 800,
									color: "var(--right-turn)",
									margin: "0.25rem 0",
								}}
							>
								₹300 - 500 Cr
							</div>
							<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
								Average cost per kilometer
							</span>
						</div>
						<div
							style={{
								padding: "1rem",
								background: "rgba(52, 211, 153, 0.05)",
								border: "1px solid rgba(52, 211, 153, 0.1)",
								borderRadius: "0.5rem",
								textAlign: "center",
							}}
						>
							<span
								style={{
									fontSize: "0.75rem",
									color: "var(--text-muted)",
									textTransform: "uppercase",
								}}
							>
								12ft Micro-Tunnel
							</span>
							<div
								style={{
									fontSize: "1.25rem",
									fontWeight: 800,
									color: "var(--left-turn)",
									margin: "0.25rem 0",
								}}
							>
								₹80 - 120 Cr
							</div>
							<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
								Estimated cost per kilometer
							</span>
						</div>
					</div>
					<p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
						<strong>Tolling Integration:</strong> Utilizing Fastag sensors at
						portal entries allows dynamic congestion pricing, matching toll
						costs to peak hour density to ensure private concessions remain
						self-financing.
					</p>
				</div>
			),
		},
		{
			id: "pol",
			title: "Political & Social",
			icon: <Users size={20} />,
			content: (
				<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
					<p>
						The single greatest barrier to building roads in dense Indian cities
						is <strong>Land Acquisition</strong>. Laying flyovers requires
						purchasing property, leading to litigation and delays.
					</p>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "0.75rem",
							marginTop: "0.5rem",
						}}
					>
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								alignItems: "flex-start",
								fontSize: "0.9rem",
							}}
						>
							<div style={{ color: "var(--left-turn)" }}>✔</div>
							<div>
								<strong>Bypassing Surface Property:</strong> Bores go 30-50ft
								beneath public road networks, bypassing private property rights.
							</div>
						</div>
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								alignItems: "flex-start",
								fontSize: "0.9rem",
							}}
						>
							<div style={{ color: "var(--left-turn)" }}>✔</div>
							<div>
								<strong>Zero Disruption to Commerce:</strong> TBMs bore
								continuously below while shops and street traffic function as
								normal above.
							</div>
						</div>
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								alignItems: "flex-start",
								fontSize: "0.9rem",
							}}
						>
							<div style={{ color: "var(--left-turn)" }}>✔</div>
							<div>
								<strong>Visual Integrity:</strong> Removes concrete columns,
								preserving historical architecture.
							</div>
						</div>
					</div>
				</div>
			),
		},
		{
			id: "eco-env",
			title: "Ecology & Environment",
			icon: <Leaf size={20} />,
			content: (
				<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
					<p>
						By moving vehicle flows underground, we preserve surface green
						spaces:
					</p>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "0.75rem",
							fontSize: "0.9rem",
							color: "var(--text-muted)",
						}}
					>
						<div>
							<strong style={{ color: "var(--text-main)" }}>
								• Preserving Urban Forest Cover:
							</strong>{" "}
							Surface widening causes heavy felling of trees. Subterranean
							corridors bypass tree roots and utilities.
						</div>
						<div>
							<strong style={{ color: "var(--text-main)" }}>
								• Noise Mitigation:
							</strong>{" "}
							Trapping tyre friction and engine noise underground reduces
							surface urban noise pollution in residential neighborhoods.
						</div>
						<div>
							<strong style={{ color: "var(--text-main)" }}>
								• Fuel Savings:
							</strong>{" "}
							Shifting stop-start gridlock at intersections to smooth
							constant-speed underpasses reduces vehicular fuel wastage.
						</div>
					</div>
				</div>
			),
		},
		{
			id: "eng",
			title: "Engineering & Safety",
			icon: <Compass size={20} />,
			content: (
				<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
					<p>
						Operating a closed, deep concrete tube introduces unique mechanical
						safety demands:
					</p>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "0.75rem",
							fontSize: "0.9rem",
							color: "var(--text-muted)",
						}}
					>
						<div>
							<strong style={{ color: "var(--text-main)" }}>
								• Hoop Stress Mechanics:
							</strong>{" "}
							Precast concrete segments form interlocking circular rings. The
							circular geometry distributes earth pressure evenly.
						</div>
						<div>
							<strong style={{ color: "var(--text-main)" }}>
								• Single Point of Failure (SPOF):
							</strong>{" "}
							In a 12ft tunnel, a broken car has no shoulder space to park.
							Autonomous fleet monitoring must predict component issues and
							route assets to surface exits before breakdowns occur.
						</div>
						<div>
							<strong style={{ color: "var(--text-main)" }}>
								• Fire Safety:
							</strong>{" "}
							Enclosed systems require fire suppression piping and automated
							emergency escape cross-passageways linking parallel tubes.
						</div>
					</div>
				</div>
			),
		},
		{
			id: "dem",
			title: "Demography & Equity",
			icon: <ShieldAlert size={20} />,
			content: (
				<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
					<p>
						Evaluating mass accessibility in a high-density demographic setting:
					</p>
					<p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
						While dedicated car tunnels could be perceived as exclusive
						infrastructure for wealthy owners, the proposal addresses this
						through <strong>Autonomous Electric Public Shuttles</strong>.
					</p>
					<div
						style={{
							padding: "0.8rem",
							background: "var(--primary-bg)",
							borderRadius: "0.5rem",
							border: "1px solid rgba(0, 229, 255, 0.1)",
						}}
					>
						<strong style={{ color: "var(--primary)", fontSize: "0.85rem" }}>
							High-Frequency Transit Mode:
						</strong>
						<p
							style={{
								fontSize: "0.8rem",
								color: "var(--text-muted)",
								marginTop: "0.2rem",
							}}
						>
							Integrating 12-16 seater mini-buses running at 30-second headway
							frequencies matching subway throughput at a fraction of the cost,
							making sub-surface transit accessible to everyone.
						</p>
					</div>
				</div>
			),
		},
	];

	const currentPillar = pillars.find((p) => p.id === activeTab) || pillars[0];

	return (
		<section id="feasibility-matrix" className="section-container scroll-mt-6">
			<div className="section-header">
				<h2 className="section-title">Multidimensional Feasibility</h2>
				<p className="section-subtitle">
					How the 12-foot utility underpass matches India's geologic, economic,
					and demographic landscape.
				</p>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr",
					gap: "1.5rem",
				}}
			>
				{/* Navigation Tabs */}
				<div
					style={{
						display: "flex",
						gap: "0.5rem",
						overflowX: "auto",
						paddingBottom: "0.5rem",
						borderBottom: "1px solid var(--border-color)",
					}}
				>
					{pillars.map((pillar) => (
						<button
							type="button"
							key={pillar.id}
							onClick={() => setActiveTab(pillar.id)}
							className="btn"
							style={{
								background:
									activeTab === pillar.id ? "var(--primary)" : "var(--bg-card)",
								color:
									activeTab === pillar.id
										? "var(--text-inverse)"
										: "var(--text-main)",
								border:
									activeTab === pillar.id
										? "none"
										: "1px solid var(--border-color)",
								flexShrink: 0,
								fontSize: "0.85rem",
								padding: "0.5rem 1rem",
							}}
						>
							{pillar.icon}
							<span>{pillar.title.split(" ")[0]}</span>
						</button>
					))}
				</div>

				{/* Active Content Panel */}
				<div
					className="glass-card animate-fade-in"
					style={{
						minHeight: "280px",
						display: "flex",
						flexDirection: "column",
						gap: "1rem",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
							borderBottom: "1px solid var(--border-color)",
							paddingBottom: "1rem",
						}}
					>
						<div style={{ color: "var(--primary)" }}>{currentPillar.icon}</div>
						<h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
							{currentPillar.title}
						</h3>
					</div>
					<div style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
						{currentPillar.content}
					</div>
				</div>
			</div>
		</section>
	);
}
