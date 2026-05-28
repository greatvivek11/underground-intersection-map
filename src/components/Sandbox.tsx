import { Download, Maximize2, Minimize2, Settings, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { buildTunnelConfig, type TunnelConfig } from "../utils/geometry";
import TunnelSimulation2D from "./TunnelSimulation2D";
import type { CameraPreset } from "./TunnelSimulation3D";

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
	valueColor,
}: {
	label: string;
	value: number;
	displayValue: string;
	min: number;
	max: number;
	step: number;
	onChange: (v: number) => void;
	valueColor?: string;
}) {
	return (
		<div className="slider-group" style={{ flex: "1 1 40px" }}>
			<div className="slider-label">
				<span>{label}</span>
				<span
					className="value"
					style={
						valueColor ? { color: valueColor, fontWeight: "bold" } : undefined
					}
				>
					{displayValue}
				</span>
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

function CameraPresetToggle({
	preset,
	setPreset,
}: {
	preset: CameraPreset;
	setPreset: (v: CameraPreset) => void;
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
			{(["orbit", "underground"] as const).map((v) => (
				<button
					key={v}
					type="button"
					className="btn"
					onClick={() => setPreset(v)}
					style={{
						background: preset === v ? "var(--primary)" : "transparent",
						color: preset === v ? "var(--text-inverse)" : "var(--text-main)",
						border: "none",
						fontSize: "0.7rem",
						padding: "0.35rem 0.6rem",
						borderRadius: "0.35rem",
					}}
				>
					{v === "orbit" ? "Orbit" : "Underground"}
				</button>
			))}
		</div>
	);
}

function SimCanvas({
	viewType,
	isDark,
	config,
	density,
	speed,
	height,
	cameraPreset,
}: {
	viewType: string;
	isDark: boolean;
	config: TunnelConfig;
	density: number;
	speed: number;
	height: string;
	cameraPreset: CameraPreset;
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
						cameraPreset={cameraPreset}
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
	const [portalSetback, setPortalSetback] = useState(300);
	const [roadWidth, setRoadWidth] = useState(120);
	const [laneWidth, setLaneWidth] = useState(12);
	const [rotaryDiameter, setRotaryDiameter] = useState(250);
	const [trafficDensity, setTrafficDensity] = useState(10);
	const [simSpeed, setSimSpeed] = useState(1);
	const [viewType, setViewType] = useState("2d");
	const [camera3DPreset, setCamera3DPreset] = useState<CameraPreset>("orbit");
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

	const config = buildTunnelConfig({
		portalSetback,
		roadWidth,
		laneWidth,
		rotaryDiameter,
	});

	const downloadBlob = (blob: Blob, filename: string) => {
		const href = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = href;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(href);
	};

	const handleExport = async (format: "svg" | "png") => {
		setIsExporting(true);
		try {
			const url = `/api/generate?setback=${portalSetback}&roadWidth=${roadWidth}&laneWidth=${laneWidth}&rotaryDiameter=${rotaryDiameter}&dark=${isDark}&format=${format}`;
			const response = await fetch(url);
			const contentType = response.headers.get("content-type") ?? "";
			if (!response.ok || !contentType.startsWith("image/")) {
				throw new Error("The Python export API is not available.");
			}
			const blob = await response.blob();
			downloadBlob(
				blob,
				`tunnel_routing_schematic_${portalSetback}ft_${
					isDark ? "dark" : "light"
				}.${format}`,
			);
		} catch (e) {
			console.error(e);
			window.alert(
				`Failed to export ${format.toUpperCase()}. Please ensure the local backend server is running (run 'npm run dev:backend' in your terminal).`,
			);
		} finally {
			setIsExporting(false);
		}
	};

	// Shared sliders — used in both inline card and modal footer
	const slopeValue = (25 / portalSetback) * 100;
	let slopeColor = "#EF4444"; // Red
	let slopeSafety = "Critical (Unsafe)";
	if (slopeValue <= 8.5) {
		slopeColor = "#22C55E"; // Green
		slopeSafety = "Safe";
	} else if (slopeValue <= 15) {
		slopeColor = "#F97316"; // Orange
		slopeSafety = "Marginal";
	}

	let rotaryColor = "#EF4444"; // Red
	let rotarySafety = "Congested (Unsafe)";
	if (rotaryDiameter >= 250 && rotaryDiameter <= 400) {
		rotaryColor = "#22C55E"; // Green
		rotarySafety = "Optimal (Safe)";
	} else if (rotaryDiameter > 400) {
		rotaryColor = "#F97316"; // Orange
		rotarySafety = "Inefficient (High Construction Cost & Travel Time)";
	}

	const sliders = (
		<>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.25rem",
					width: "100%",
				}}
			>
				<SliderRow
					label="Dedicated Corridor"
					value={portalSetback}
					displayValue={`${portalSetback} ft`}
					min={90}
					max={300}
					step={5}
					onChange={setPortalSetback}
					valueColor={slopeColor}
				/>
				<div
					style={{
						fontSize: "0.74rem",
						marginTop: "-0.5rem",
						marginBottom: "0.75rem",
						display: "flex",
						justifyContent: "space-between",
						color: "var(--text-muted)",
						padding: "0 0.25rem",
					}}
				>
					<span>Est. Ramp Slope (at 25ft depth):</span>
					<span style={{ color: slopeColor, fontWeight: "bold" }}>
						{slopeValue.toFixed(1)}% — {slopeSafety}
					</span>
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.25rem",
					width: "100%",
				}}
			>
				<SliderRow
					label="Rotary Major Diameter"
					value={rotaryDiameter}
					displayValue={`${rotaryDiameter} ft`}
					min={200}
					max={500}
					step={10}
					onChange={setRotaryDiameter}
					valueColor={rotaryColor}
				/>
				<div
					style={{
						fontSize: "0.74rem",
						marginTop: "-0.5rem",
						marginBottom: "0.75rem",
						display: "flex",
						justifyContent: "space-between",
						color: "var(--text-muted)",
						padding: "0 0.25rem",
					}}
				>
					<span>Underpass Safety & Cost Metric:</span>
					<span style={{ color: rotaryColor, fontWeight: "bold" }}>
						{rotarySafety}
					</span>
				</div>
			</div>

			<SliderRow
				label="Rotary Lane Width"
				value={laneWidth}
				displayValue={`${laneWidth} ft`}
				min={12}
				max={20}
				step={1}
				onChange={setLaneWidth}
			/>

			<SliderRow
				label="Surface Road Width"
				value={roadWidth}
				displayValue={`${roadWidth} ft`}
				min={50}
				max={120}
				step={5}
				onChange={setRoadWidth}
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
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					gap: "0.35rem",
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

			<div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
				<ViewToggle viewType={viewType} setViewType={setViewType} />
				{viewType === "3d" && (
					<CameraPresetToggle
						preset={camera3DPreset}
						setPreset={setCamera3DPreset}
					/>
				)}
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
										? "2D Engine: Python Matplotlib + SVG Overlay"
										: "3D Engine: WebGL (Three.js)"}
								</span>
							</div>
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
							>
								<ViewToggle viewType={viewType} setViewType={setViewType} />
								{viewType === "3d" && (
									<CameraPresetToggle
										preset={camera3DPreset}
										setPreset={setCamera3DPreset}
									/>
								)}
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

						{/* Split Layout Container */}
						<div
							style={{
								flex: 1,
								minHeight: 0,
								display: "flex",
								padding: "1rem 1.5rem",
								gap: "1.5rem",
							}}
						>
							{/* Left side: Canvas Area */}
							<div
								style={{
									flex: 1,
									height: "100%",
									minHeight: 0,
									display: "flex",
									position: "relative",
								}}
							>
								<SimCanvas
									viewType={viewType}
									isDark={isDark}
									config={config}
									density={trafficDensity}
									speed={simSpeed}
									cameraPreset={camera3DPreset}
									height="100%"
								/>
							</div>

							{/* Right side: Sidebar Controls Panel */}
							<div
								style={{
									width: "320px",
									flexShrink: 0,
									display: "flex",
									flexDirection: "column",
									gap: "1.5rem",
									padding: "1.25rem",
									background: "var(--bg-card)",
									borderRadius: "1rem",
									border: "1px solid var(--border-color)",
									overflowY: "auto",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										borderBottom: "1px solid var(--border-color)",
										paddingBottom: "0.75rem",
									}}
								>
									<Settings size={18} style={{ color: "var(--primary)" }} />
									<h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
										Routing Controls
									</h3>
								</div>

								{/* Sliders list vertically aligned */}
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "1.25rem",
									}}
								>
									{sliders}
								</div>

								{/* Theme and Export actions at the bottom */}
								<div
									style={{
										marginTop: "auto",
										display: "flex",
										flexDirection: "column",
										gap: "0.75rem",
										borderTop: "1px solid var(--border-color)",
										paddingTop: "1.25rem",
									}}
								>
									<button
										type="button"
										onClick={toggleTheme}
										className="btn btn-secondary"
										style={{
											fontSize: "0.8rem",
											width: "100%",
											display: "inline-flex",
											gap: "0.5rem",
											justifyContent: "center",
										}}
									>
										<Minimize2 size={13} />
										<span>
											Switch to {isDark ? "Light Paper" : "Dark Cyberpunk"}
										</span>
									</button>
									<div
										style={{
											display: "grid",
											gridTemplateColumns: "1fr 1fr",
											gap: "0.6rem",
										}}
									>
										<button
											type="button"
											className="btn btn-outline"
											onClick={() => handleExport("svg")}
											disabled={isExporting}
											style={{ fontSize: "0.8rem" }}
										>
											<Download size={13} />
											<span>SVG</span>
										</button>
										<button
											type="button"
											className="btn btn-outline"
											onClick={() => handleExport("png")}
											disabled={isExporting}
											style={{ fontSize: "0.8rem" }}
										>
											<Download size={13} />
											<span>PNG</span>
										</button>
									</div>
								</div>
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
					Tune geometrical setbacks and traffic density to test the rotary
					underpass circulation concept.
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
						cameraPreset={camera3DPreset}
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
						<p
							style={{
								fontSize: "0.78rem",
								color: "var(--text-muted)",
								lineHeight: 1.5,
								padding: "0.75rem",
								background: "rgba(255,255,255,0.03)",
								borderRadius: "0.5rem",
								borderLeft: "3px solid var(--primary)",
							}}
						>
							<strong style={{ color: "var(--text-main)" }}>
								Rotary topology:
							</strong>{" "}
							The 2D schematic uses a shared clockwise elliptical loop around a
							retained structural core. 3D and export remain on the earlier
							layered geometry until the rotary model is migrated there.
						</p>
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
							Download the current layered reference drawings generated by the
							backend Matplotlib engine. Rotary export is not migrated yet.
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
