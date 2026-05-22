import { Analytics } from "@vercel/analytics/react";
import {
	FileText,
	Github,
	Globe,
	Map as MapIcon,
	Menu,
	Moon,
	Sun,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import FeasibilityMatrix from "./components/FeasibilityMatrix";
import FeasibilityStudy from "./components/FeasibilityStudy";
import GeometricShift from "./components/GeometricShift";
import Hero from "./components/Hero";
import ResearchReportModal from "./components/ResearchReportModal";
import Sandbox from "./components/Sandbox";
import ScenarioModeler from "./components/ScenarioModeler";
import SurfaceCrisis from "./components/SurfaceCrisis";

export default function App() {
	const [isDark, setIsDark] = useState(true);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [reportModalOpen, setReportModalOpen] = useState(false);

	const toggleTheme = () => {
		setIsDark(!isDark);
	};

	useEffect(() => {
		document.documentElement.setAttribute(
			"data-theme",
			isDark ? "dark" : "light",
		);
		document.body.style.backgroundColor = isDark ? "#080A10" : "#F4F6F9";
	}, [isDark]);

	const scrollToId = (id: string) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: "smooth" });
		}
		setMobileMenuOpen(false);
	};

	const navItems = [
		{ label: "Surface Crisis", id: "surface-crisis" },
		{ label: "12ft Paradigm", id: "geometric-shift" },
		{ label: "Comparative Study", id: "comparative-analysis" },
		{ label: "Feasibility Matrix", id: "feasibility-matrix" },
		{ label: "Propulsion Modeler", id: "scenario-modeler" },
		{ label: "Simulation Lab", id: "simulation-sandbox" },
	];

	return (
		<div style={{ position: "relative", minHeight: "100vh" }}>
			{/* Background blueprint grid overlay */}
			<div className="grid-overlay" />

			{/* Glassmorphic Sticky Header */}
			<header
				style={{
					position: "sticky",
					top: 0,
					zIndex: 100,
					background: isDark
						? "rgba(8, 10, 16, 0.7)"
						: "rgba(244, 246, 249, 0.75)",
					backdropFilter: "blur(16px)",
					borderBottom: "1px solid var(--border-color)",
					padding: "1rem 1.5rem",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					transition: "background-color 0.4s ease, border-color 0.4s ease",
				}}
			>
				<button
					type="button"
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						cursor: "pointer",
						background: "none",
						border: "none",
						padding: 0,
					}}
					onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
				>
					<div
						style={{
							background: "var(--primary)",
							color: "var(--text-inverse)",
							padding: "0.4rem",
							borderRadius: "0.5rem",
							boxShadow: "0 0 10px var(--primary-glow)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<MapIcon size={18} />
					</div>
					<span
						style={{
							fontFamily: "var(--font-heading)",
							fontSize: "1.25rem",
							fontWeight: 800,
							letterSpacing: "-0.02em",
							background:
								"linear-gradient(135deg, var(--text-main) 60%, var(--primary))",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						}}
					>
						UrbanDeep
					</span>
				</button>

				{/* Desktop Navigation Link anchors */}
				<nav
					className="desktop-only"
					style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}
				>
					{navItems.map((item) => (
						<button
							type="button"
							key={item.id}
							onClick={() => scrollToId(item.id)}
							style={{
								background: "none",
								border: "none",
								color: "var(--text-muted)",
								fontFamily: "var(--font-heading)",
								fontSize: "0.85rem",
								fontWeight: 600,
								cursor: "pointer",
								transition: "color 0.2s ease",
							}}
							onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.currentTarget.style.color = "var(--primary)";
							}}
							onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.currentTarget.style.color = "var(--text-muted)";
							}}
						>
							{item.label}
						</button>
					))}

					{/* Research Report Button */}
					<button
						type="button"
						onClick={() => setReportModalOpen(true)}
						className="btn btn-outline"
						style={{
							padding: "0.4rem 0.8rem",
							fontSize: "0.8rem",
							borderRadius: "0.5rem",
							display: "flex",
							alignItems: "center",
							gap: "0.3rem",
						}}
					>
						<FileText size={14} />
						<span>Research</span>
					</button>

					{/* Divider */}
					<div
						style={{
							width: "1px",
							height: "18px",
							background: "var(--border-color)",
						}}
					/>

					{/* GitHub Link */}
					<a
						href="https://github.com/greatvivek11"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: "var(--text-muted)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							transition: "color 0.2s ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = "var(--primary)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "var(--text-muted)";
						}}
						title="GitHub Profile"
					>
						<Github size={18} />
					</a>

					{/* Personal Website Link */}
					<a
						href="https://vivekkaushik.in"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: "var(--text-muted)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							transition: "color 0.2s ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = "var(--primary)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "var(--text-muted)";
						}}
						title="Personal Portfolio"
					>
						<Globe size={18} />
					</a>

					{/* Divider */}
					<div
						style={{
							width: "1px",
							height: "18px",
							background: "var(--border-color)",
						}}
					/>

					{/* Theme toggler */}
					<button
						type="button"
						onClick={toggleTheme}
						className="btn btn-secondary"
						style={{
							padding: "0.5rem",
							borderRadius: "0.5rem",
							width: "32px",
							height: "32px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{isDark ? <Sun size={16} /> : <Moon size={16} />}
					</button>
				</nav>

				{/* Mobile menu trigger */}
				<div
					className="mobile-only"
					style={{ display: "none", gap: "0.75rem", alignItems: "center" }}
				>
					<button
						type="button"
						onClick={toggleTheme}
						className="btn btn-secondary"
						style={{ padding: "0.4rem", borderRadius: "0.5rem" }}
					>
						{isDark ? <Sun size={14} /> : <Moon size={14} />}
					</button>
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="btn btn-secondary"
						style={{ padding: "0.4rem", borderRadius: "0.5rem" }}
					>
						{mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
					</button>
				</div>
			</header>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div
					style={{
						position: "fixed",
						top: "60px",
						left: 0,
						right: 0,
						background: "var(--bg-card)",
						borderBottom: "1px solid var(--border-color)",
						zIndex: 99,
						display: "flex",
						flexDirection: "column",
						padding: "1.5rem",
						gap: "1rem",
						animation: "fadeIn 0.2s ease forwards",
					}}
				>
					{navItems.map((item) => (
						<button
							type="button"
							key={item.id}
							onClick={() => scrollToId(item.id)}
							style={{
								background: "none",
								border: "none",
								color: "var(--text-main)",
								textAlign: "left",
								fontSize: "1rem",
								fontWeight: 600,
								padding: "0.5rem 0",
								borderBottom: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							{item.label}
						</button>
					))}
					<button
						type="button"
						onClick={() => {
							setReportModalOpen(true);
							setMobileMenuOpen(false);
						}}
						style={{
							background: "none",
							border: "none",
							color: "var(--primary)",
							textAlign: "left",
							fontSize: "1rem",
							fontWeight: 600,
							padding: "0.5rem 0",
							borderBottom: "1px solid rgba(255,255,255,0.03)",
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
						}}
					>
						<FileText size={16} />
						<span>Gemini Research Report</span>
					</button>
					<div
						style={{
							display: "flex",
							gap: "1.5rem",
							paddingTop: "0.5rem",
							alignItems: "center",
						}}
					>
						<a
							href="https://github.com/greatvivek11"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								color: "var(--text-muted)",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								fontSize: "0.9rem",
								fontWeight: 500,
								textDecoration: "none",
							}}
						>
							<Github size={18} />
							<span>GitHub</span>
						</a>
						<a
							href="https://vivekkaushik.in"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								color: "var(--text-muted)",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								fontSize: "0.9rem",
								fontWeight: 500,
								textDecoration: "none",
							}}
						>
							<Globe size={18} />
							<span>Website</span>
						</a>
					</div>
				</div>
			)}

			{/* Main Guided Scroll Layout */}
			<main className="page-container">
				<Hero onOpenReport={() => setReportModalOpen(true)} />
				<SurfaceCrisis />
				<GeometricShift />
				<FeasibilityStudy onOpenReport={() => setReportModalOpen(true)} />
				<FeasibilityMatrix />
				<ScenarioModeler />

				{/* We place the Simulator here as the final cumulative Sandbox Lab */}
				<Sandbox isDark={isDark} toggleTheme={toggleTheme} />
			</main>

			{/* Footer */}
			<footer
				style={{
					borderTop: "1px solid var(--border-color)",
					padding: "3rem 1.5rem",
					marginTop: "6rem",
					background: isDark
						? "rgba(8, 10, 16, 0.95)"
						: "rgba(244, 246, 249, 0.95)",
					textAlign: "center",
					display: "flex",
					flexDirection: "column",
					gap: "0.75rem",
					alignItems: "center",
				}}
			>
				<span
					style={{
						fontSize: "0.85rem",
						fontWeight: 700,
						fontFamily: "var(--font-heading)",
						color: "var(--text-main)",
					}}
				>
					UrbanDeep | Small-Diameter Underground Transit Framework
				</span>
				<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
					Indian Metro Feasibility Study Research Grounded by Gemini 3.5 Flash
				</span>

				{/* Footer Socials & Report links */}
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: "1.5rem",
						margin: "0.5rem 0",
					}}
				>
					<a
						href="https://github.com/greatvivek11"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: "var(--text-muted)",
							display: "flex",
							alignItems: "center",
							gap: "0.4rem",
							fontSize: "0.8rem",
							fontWeight: 600,
							textDecoration: "none",
							transition: "color 0.2s ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = "var(--primary)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "var(--text-muted)";
						}}
					>
						<Github size={14} />
						<span>GitHub Profile</span>
					</a>
					<a
						href="https://vivekkaushik.in"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: "var(--text-muted)",
							display: "flex",
							alignItems: "center",
							gap: "0.4rem",
							fontSize: "0.8rem",
							fontWeight: 600,
							textDecoration: "none",
							transition: "color 0.2s ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = "var(--primary)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "var(--text-muted)";
						}}
					>
						<Globe size={14} />
						<span>Vivek Kaushik</span>
					</a>
					<button
						type="button"
						onClick={() => setReportModalOpen(true)}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: "var(--text-muted)",
							display: "flex",
							alignItems: "center",
							gap: "0.4rem",
							fontSize: "0.8rem",
							fontWeight: 600,
							textDecoration: "none",
							padding: 0,
							transition: "color 0.2s ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = "var(--primary)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "var(--text-muted)";
						}}
					>
						<FileText size={14} />
						<span>Read Full Research Report</span>
					</button>
				</div>

				<span
					style={{
						fontSize: "0.7rem",
						color: "var(--text-muted)",
						fontFamily: "var(--font-mono)",
						marginTop: "0.5rem",
					}}
				>
					PROC-GEOM ENGINE v2.0 &bull; WEBGL CANVAS VIRTUALIZATION
				</span>
			</footer>

			{/* Research Report Modal */}
			<ResearchReportModal
				isOpen={reportModalOpen}
				onClose={() => setReportModalOpen(false)}
				isDark={isDark}
			/>

			{/* Responsive media-query styles inject */}
			<style>{`
				@media (max-width: 768px) {
					.desktop-only { display: none !important; }
					.mobile-only { display: flex !important; }
				}
			`}</style>
			<Analytics />
		</div>
	);
}
