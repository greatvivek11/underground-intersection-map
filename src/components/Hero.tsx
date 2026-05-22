import { ArrowDown, FileText, Milestone } from "lucide-react";

interface HeroProps {
	onOpenReport: () => void;
}

export default function Hero({ onOpenReport }: HeroProps) {
	const handleScrollDown = () => {
		const el = document.getElementById("surface-crisis");
		if (el) {
			el.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<section
			className="glass-card animate-fade-in"
			style={{
				marginTop: "2rem",
				padding: "4rem 2rem",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
				position: "relative",
				overflow: "hidden",
				gap: "2.5rem",
			}}
		>
			{/* Background glow effects */}
			<div
				style={{
					position: "absolute",
					top: "-10%",
					left: "50%",
					transform: "translateX(-50%)",
					width: "350px",
					height: "150px",
					background: "var(--primary-glow)",
					filter: "blur(100px)",
					borderRadius: "50%",
					opacity: 0.25,
					pointerEvents: "none",
				}}
			/>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.75rem",
					alignItems: "center",
				}}
			>
				<div
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "0.5rem",
						background: "var(--primary-bg)",
						color: "var(--primary)",
						padding: "0.4rem 1rem",
						borderRadius: "100px",
						fontSize: "0.85rem",
						fontWeight: 600,
						border: "1px solid rgba(0, 229, 255, 0.15)",
						marginBottom: "1rem",
					}}
				>
					<Milestone size={14} />
					<span>PROPOSAL v2.0 OPTIMIZED</span>
				</div>

				<h1
					style={{
						fontFamily: "var(--font-heading)",
						fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
						fontWeight: 800,
						lineHeight: 1.1,
						letterSpacing: "-0.03em",
						maxWidth: "900px",
						background:
							"linear-gradient(135deg, var(--text-main) 60%, var(--primary))",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
					}}
				>
					Standardized Subterranean Grids for Indian Metros
				</h1>

				<p
					style={{
						fontSize: "clamp(1rem, 2vw, 1.25rem)",
						color: "var(--text-muted)",
						maxWidth: "700px",
						lineHeight: 1.5,
						marginTop: "0.5rem",
					}}
				>
					Evaluating small-diameter (12-foot) dedicated electric utility
					underpasses to resolve intersection bottlenecks without surface
					disruptions.
				</p>
			</div>

			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "2rem",
					justifyContent: "center",
					width: "100%",
					maxWidth: "800px",
					borderTop: "1px solid var(--border-color)",
					paddingTop: "2rem",
					marginTop: "1rem",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "0.25rem",
					}}
				>
					<span
						style={{
							fontSize: "1.75rem",
							fontWeight: 800,
							color: "var(--primary)",
							fontFamily: "var(--font-heading)",
						}}
					>
						-80%
					</span>
					<span
						style={{
							fontSize: "0.8rem",
							color: "var(--text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
						}}
					>
						Excavation Earth
					</span>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "0.25rem",
						borderLeft: "1px solid var(--border-color)",
						paddingLeft: "2rem",
					}}
				>
					<span
						style={{
							fontSize: "1.75rem",
							fontWeight: 800,
							color: "var(--left-turn)",
							fontFamily: "var(--font-heading)",
						}}
					>
						EV Only
					</span>
					<span
						style={{
							fontSize: "0.8rem",
							color: "var(--text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
						}}
					>
						Propulsion Rule
					</span>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "0.25rem",
						borderLeft: "1px solid var(--border-color)",
						paddingLeft: "2rem",
					}}
				>
					<span
						style={{
							fontSize: "1.75rem",
							fontWeight: 800,
							color: "var(--right-turn)",
							fontFamily: "var(--font-heading)",
						}}
					>
						L1 - L3
					</span>
					<span
						style={{
							fontSize: "0.8rem",
							color: "var(--text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
						}}
					>
						Depth Strata
					</span>
				</div>
			</div>

			<div
				style={{
					display: "flex",
					gap: "1rem",
					flexWrap: "wrap",
					justifyContent: "center",
					marginTop: "1rem",
				}}
			>
				<button
					type="button"
					className="btn btn-primary"
					onClick={handleScrollDown}
				>
					<span>Explore Case Study</span>
					<ArrowDown size={16} />
				</button>
				<button
					type="button"
					className="btn btn-secondary"
					onClick={onOpenReport}
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
					}}
				>
					<FileText size={16} />
					<span>Read Deep Research</span>
				</button>
			</div>
		</section>
	);
}
