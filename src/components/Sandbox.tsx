 import { Download, Settings } from "lucide-react";
import { useState } from "react";
import TunnelSimulation2D from "./TunnelSimulation2D";
import TunnelSimulation3D from "./TunnelSimulation3D";

export default function Sandbox({
	isDark,
	toggleTheme,
}: {
	isDark: boolean;
	toggleTheme: () => void;
}) {
	const [portalSetback, setPortalSetback] = useState(75);
	const [trafficDensity, setTrafficDensity] = useState(30);
	const [simSpeed, setSimSpeed] = useState(1);
	const [viewType, setViewType] = useState("2d"); // '2d' or '3d'
	const [isExporting, setIsExporting] = useState(false);

	// Configuration constants matching visualize_tunnels.py
	const config = {
		intersectionSize: 140.0,
		portalSetback: portalSetback,
		portalOffset: 28.0,
		descentLength: 30.0,
		roadWidth: 80.0,
		medianWidth: 8.0,
		laneWidth: 12.0,
		kLeft: 30.0,
		kRight: 55.0,
		bezierPoints: 100,
	};

	const handleExport = async (format: "svg" | "png") => {
		setIsExporting(true);
		try {
			const url = `/api/generate?setback=${portalSetback}&dark=${isDark}&format=${format}`;
			// Open in new tab or trigger direct download
			const link = document.createElement("a");
			link.href = url;
			link.target = "_blank";
			link.download = `tunnel_routing_schematic_${portalSetback}ft_${isDark ? "dark" : "light"}.${format}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (e) {
			console.error(e);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<section
			id="simulation-sandbox"
			className="section-container scroll-mt-6"
			style={{ marginBottom: "4rem" }}
		>
			<div className="section-header">
				<h2 className="section-title">The Simulation Sandbox</h2>
				<p className="section-subtitle">
					Tune geometrical setbacks and traffic density to test performance of
					the sub-surface routing.
				</p>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
					gap: "2rem",
					alignItems: "start",
				}}
			>
				{/* Workspace Canvas (Left or Center) */}
				<div
					className="glass-card"
					style={{
						padding: "1.25rem",
						display: "flex",
						flexDirection: "column",
						gap: "1.25rem",
						gridColumn: "span 2",
					}}
				>
					{/* Header Bar */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							gap: "1rem",
							borderBottom: "1px solid var(--border-color)",
							paddingBottom: "1rem",
						}}
					>
						<div
							style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
						>
							<span className="badge badge-primary">ACTIVE LABORATORY</span>
							<span
								style={{
									fontSize: "0.85rem",
									color: "var(--text-muted)",
									fontFamily: "var(--font-mono)",
								}}
							>
								{viewType === "2d"
									? "2D Engine: HTML5 Canvas"
									: "3D Engine: WebGL (Three.js)"}
							</span>
						</div>

						{/* Selector Toggle */}
						<div
							style={{
								display: "flex",
								background: "var(--bg-color)",
								border: "1px solid var(--border-color)",
								borderRadius: "0.5rem",
								padding: "0.25rem",
							}}
						>
							<button
								type="button"
								onClick={() => setViewType("2d")}
								className="btn"
								style={{
									background:
										viewType === "2d" ? "var(--primary)" : "transparent",
									color:
										viewType === "2d"
											? "var(--text-inverse)"
											: "var(--text-main)",
									border: "none",
									fontSize: "0.75rem",
									padding: "0.35rem 0.75rem",
									borderRadius: "0.35rem",
								}}
							>
								2D Schematic
							</button>
							<button
								type="button"
								onClick={() => setViewType("3d")}
								className="btn"
								style={{
									background:
										viewType === "3d" ? "var(--primary)" : "transparent",
									color:
										viewType === "3d"
											? "var(--text-inverse)"
											: "var(--text-main)",
									border: "none",
									fontSize: "0.75rem",
									padding: "0.35rem 0.75rem",
									borderRadius: "0.35rem",
								}}
							>
								3D Strata View
							</button>
						</div>
					</div>

					{/* Rendering Container */}
					<div
						style={{
							width: "100%",
							height: "520px",
							background: isDark ? "#0B0E14" : "#F8F9FA",
							border: "1px solid var(--border-color)",
							borderRadius: "0.75rem",
							overflow: "hidden",
							position: "relative",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						{viewType === "2d" ? (
							<TunnelSimulation2D
								config={config}
								isDark={isDark}
								density={trafficDensity}
								speed={simSpeed}
							/>
						) : (
							<TunnelSimulation3D
								config={config}
								isDark={isDark}
								density={trafficDensity}
								speed={simSpeed}
							/>
						)}
					</div>
				</div>

				{/* Configuration Controllers (Right side) */}
				<div
					className="glass-card"
					style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
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
						<Settings size={20} style={{ color: "var(--primary)" }} />
						<h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
							Routing Controls
						</h3>
					</div>

					<div
						style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
					>
						{/* Slider 1: Portal Setback */}
						<div className="slider-group">
							<div className="slider-label">
								<span>Portal Setback</span>
								<span className="value">{portalSetback} ft</span>
							</div>
							<input
								type="range"
								min="40"
								max="150"
								step="5"
								value={portalSetback}
								onChange={(e) => setPortalSetback(parseInt(e.target.value, 10))}
							/>
							<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
								Ramp setback from intersection edge. Slashes collision
								conflicts, increases descent slope.
							</span>
						</div>

						{/* Slider 2: Traffic Density */}
						<div className="slider-group">
							<div className="slider-label">
								<span>Traffic Density</span>
								<span className="value">{trafficDensity} cars</span>
							</div>
							<input
								type="range"
								min="10"
								max="70"
								step="2"
								value={trafficDensity}
								onChange={(e) =>
									setTrafficDensity(parseInt(e.target.value, 10))
								}
							/>
							<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
								Number of active automated EV pods traveling on splines.
							</span>
						</div>

						{/* Slider 3: Simulation Speed */}
						<div className="slider-group">
							<div className="slider-label">
								<span>Simulation Speed</span>
								<span className="value">{simSpeed.toFixed(1)}x</span>
							</div>
							<input
								type="range"
								min="0.5"
								max="3"
								step="0.1"
								value={simSpeed}
								onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
							/>
						</div>
					</div>

					{/* Matplotlib Python Engine Export Block */}
					<div
						style={{
							borderTop: "1px solid var(--border-color)",
							paddingTop: "1.5rem",
							display: "flex",
							flexDirection: "column",
							gap: "1rem",
						}}
					>
						<h4
							style={{
								fontSize: "0.85rem",
								fontWeight: 700,
								color: "var(--text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							Python Engine Export
						</h4>
						<p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
							Download the official engineering drawings generated by the
							backend Matplotlib engine with the parameters above.
						</p>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "0.75rem",
							}}
						>
							<button
								type="button"
								className="btn btn-outline"
								onClick={() => handleExport("svg")}
								disabled={isExporting}
								style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
							>
								<Download size={14} />
								<span>Export SVG</span>
							</button>
							<button
								type="button"
								className="btn btn-outline"
								onClick={() => handleExport("png")}
								disabled={isExporting}
								style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
							>
								<Download size={14} />
								<span>Export PNG</span>
							</button>
						</div>
					</div>

					{/* Toggle Theme inline for convenience */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							borderTop: "1px solid var(--border-color)",
							paddingTop: "1.5rem",
						}}
					>
						<span
							style={{
								fontSize: "0.85rem",
								fontWeight: 600,
								color: "var(--text-muted)",
							}}
						>
							Lab Grid Theme
						</span>
						<button
							type="button"
							onClick={toggleTheme}
							className="btn btn-secondary"
							style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem" }}
						>
							Switch to {isDark ? "Light Paper" : "Dark Cyberpunk"}
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
