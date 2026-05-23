import { Download, Maximize2, Minimize2, Settings, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import TunnelSimulation2D from "./TunnelSimulation2D";

const TunnelSimulation3D = lazy(() => import("./TunnelSimulation3D"));

// ── Module-level helpers (no remounting on parent re-render) ──────

function Spinner() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "1rem",
				color: "var(--text-muted)",
			}}
		>
			<div
				style={{
					width: "32px",
					height: "32px",
					border: "3px solid var(--border-color)",
					borderTopColor: "var(--primary)",
					borderRadius: "50%",
					animation: "spin 1s linear infinite",
				}}
			/>
			<span style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
				LOADING 3D ENGINE...
			</span>
		</div>
	);
}

function SliderRow({
	label,
	value,
	displayValue,
	min,
	max,
	step,
	onChange,
}: {
	label: string;
	value: number;
	displayValue: string;
	min: number;
	max: number;
	step: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="slider-group" style={{ flex: "1 1 160px" }}>
			<div className="slider-label">
				<span>{label}</span>
				<span className="value">{displayValue}</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) =>
					onChange(
						step < 1
							? parseFloat(e.target.value)
							: parseInt(e.target.value, 10),
					)
				}
			/>
		</div>
	);
}

interface SimConfig {
	intersectionSize: number;
	portalSetback: number;
	portalOffset: number;
	descentLength: number;
	roadWidth: number;
	medianWidth: number;
	laneWidth: number;
	kLeft: number;
	kRight: number;
	bezierPoints: number;
}

function SimCanvas({
	viewType,
	isDark,
	config,
	density,
	speed,
	height,
}: {
	viewType: string;
	isDark: boolean;
	config: SimConfig;
	density: number;
	speed: number;
	height: string;
}) {
	return (
		<div
			style={{
				width: "100%",
				height,
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
					density={density}
					speed={speed}
				/>
			) : (
				<Suspense fallback={<Spinner />}>
					<TunnelSimulation3D
						config={config}
						isDark={isDark}
						density={density}
						speed={speed}
					/>
				</Suspense>
			)}
		</div>
	);
}

function ViewToggle({
	viewType,
	setViewType,
}: {
	viewType: string;
	setViewType: (v: string) => void;
}) {
	return (
		<div
			style={{
				display: "flex",
				background: "var(--bg-color)",
				border: "1px solid var(--border-color)",
				borderRadius: "0.5rem",
				padding: "0.25rem",
			}}
		>
			{(["2d", "3d"] as const).map((v) => (
				<button
					key={v}
					type="button"
					className="btn"
					onClick={() => setViewType(v)}
					style={{
						background: viewType === v ? "var(--primary)" : "transparent",
						color: viewType === v ? "var(--text-inverse)" : "var(--text-main)",
						border: "none",
						fontSize: "0.75rem",
						padding: "0.35rem 0.75rem",
						borderRadius: "0.35rem",
					}}
				>
					{v === "2d" ? "2D Schematic" : "3D Strata View"}
				</button>
			))}
		</div>
	);
}

// ── Main Sandbox component ────────────────────────────────────────
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
	const [viewType, setViewType] = useState("2d");
	const [isExporting, setIsExporting] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	// Lock body scroll + Escape-to-close when modal is open
	useEffect(() => {
		if (!isExpanded) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsExpanded(false);
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener("keydown", onKey);
		};
	}, [isExpanded]);

	const config: SimConfig = {
		intersectionSize: 140.0,
		portalSetback,
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
			const link = document.createElement("a");
			link.href = url;
			link.target = "_blank";
			link.download = `tunnel_routing_schematic_${portalSetback}ft_${
				isDark ? "dark" : "light"
			}.${format}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (e) {
			console.error(e);
		} finally {
			setIsExporting(false);
		}
	};

	// Shared sliders — used in both inline card and modal footer
	const sliders = (
		<>
			<SliderRow
				label="Portal Setback"
				value={portalSetback}
				displayValue={`${portalSetback} ft`}
				min={40}
				max={150}
				step={5}
				onChange={setPortalSetback}
			/>
			<SliderRow
				label="Traffic Density"
				value={trafficDensity}
				displayValue={`${trafficDensity} cars`}
				min={10}
				max={70}
				step={2}
				onChange={setTrafficDensity}
			/>
			<SliderRow
				label="Sim Speed"
				value={simSpeed}
				displayValue={`${simSpeed.toFixed(1)}×`}
				min={0.5}
				max={3}
				step={0.1}
				onChange={setSimSpeed}
			/>
		</>
	);

	// Shared card header bar
	const cardHeader = (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				flexWrap: "wrap",
				gap: "0.75rem",
				borderBottom: "1px solid var(--border-color)",
				paddingBottom: "1rem",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
				<span className="badge badge-primary">ACTIVE LABORATORY</span>
				<span
					style={{
						fontSize: "0.82rem",
						color: "var(--text-muted)",
						fontFamily: "var(--font-mono)",
					}}
				>
					{viewType === "2d"
						? "2D Engine: HTML5 Canvas"
						: "3D Engine: WebGL (Three.js)"}
				</span>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
				<ViewToggle viewType={viewType} setViewType={setViewType} />
				<button
					id="sandbox-expand-btn"
					type="button"
					className="sandbox-expand-btn"
					onClick={() => setIsExpanded(true)}
					aria-label="Expand simulation to full screen"
					title="Expand (full screen)"
				>
					<Maximize2 size={14} />
				</button>
			</div>
		</div>
	);

	// ── Expanded modal via portal ─────────────────────────────────
	const modal = isExpanded
		? createPortal(
				<button
					className="sandbox-modal-backdrop"
					onClick={(e) => {
						if (e.target === e.currentTarget) setIsExpanded(false);
					}}
					onKeyDown={(e) => {
						if (e.key === "Escape" || e.key === "Enter") {
							if (e.target === e.currentTarget) setIsExpanded(false);
						}
					}}
					aria-label="Close modal"
					type="button"
				>
					<div className="sandbox-modal-panel">
						{/* Modal header */}
						<div
							style={{
								padding: "1.25rem 1.5rem 1rem",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: "0.75rem",
								borderBottom: "1px solid var(--border-color)",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
								}}
							>
								<span className="badge badge-primary">ACTIVE LABORATORY</span>
								<span
									style={{
										fontSize: "0.82rem",
										color: "var(--text-muted)",
										fontFamily: "var(--font-mono)",
									}}
								>
									{viewType === "2d"
										? "2D Engine: HTML5 Canvas"
										: "3D Engine: WebGL (Three.js)"}
								</span>
							</div>
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
							>
								<ViewToggle viewType={viewType} setViewType={setViewType} />
								<button
									id="sandbox-modal-close"
									type="button"
									className="sandbox-expand-btn"
									onClick={() => setIsExpanded(false)}
									aria-label="Close expanded view"
									title="Close (Esc)"
								>
									<X size={15} />
								</button>
							</div>
						</div>

						{/* Canvas — explicit height so Three.js clientHeight is non-zero at init */}
						<div style={{ padding: "1rem 1.5rem", flex: 1, minHeight: 0 }}>
							<SimCanvas
								viewType={viewType}
								isDark={isDark}
								config={config}
								density={trafficDensity}
								speed={simSpeed}
								height="calc(100dvh - 240px)"
							/>
						</div>

						{/* Footer: sliders + export + theme */}
						<div
							style={{
								padding: "1rem 1.5rem 1.25rem",
								borderTop: "1px solid var(--border-color)",
								display: "flex",
								flexWrap: "wrap",
								gap: "2rem",
								alignItems: "flex-end",
								background: "rgba(0,0,0,0.18)",
							}}
						>
							<div
								style={{
									flex: "1 1 480px",
									display: "flex",
									gap: "2rem",
									flexWrap: "wrap",
								}}
							>
								{sliders}
							</div>

							<div
								style={{
									display: "flex",
									gap: "0.6rem",
									flexShrink: 0,
									flexWrap: "wrap",
								}}
							>
								<button
									type="button"
									className="btn btn-outline"
									onClick={() => handleExport("svg")}
									disabled={isExporting}
									style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem" }}
								>
									<Download size={13} />
									<span>SVG</span>
								</button>
								<button
									type="button"
									className="btn btn-outline"
									onClick={() => handleExport("png")}
									disabled={isExporting}
									style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem" }}
								>
									<Download size={13} />
									<span>PNG</span>
								</button>
								<button
									type="button"
									onClick={toggleTheme}
									className="btn btn-secondary"
									style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem" }}
								>
									<Minimize2 size={13} />
									<span>{isDark ? "Light" : "Dark"}</span>
								</button>
							</div>
						</div>
					</div>
				</button>,
				document.body,
			)
		: null;

	// ── Normal inline card layout ─────────────────────────────────
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
				{/* Canvas card */}
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
					{cardHeader}
					<SimCanvas
						viewType={viewType}
						isDark={isDark}
						config={config}
						density={trafficDensity}
						speed={simSpeed}
						height="520px"
					/>
				</div>

				{/* Configuration controllers */}
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
						{sliders}
					</div>

					{/* Python export */}
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

					{/* Toggle theme */}
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

			{/* Portal modal — mounted at document.body */}
			{modal}
		</section>
	);
}
