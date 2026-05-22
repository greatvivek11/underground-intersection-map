import { Download, FileDown, FileText, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ResearchReportModalProps {
	isOpen: boolean;
	onClose: () => void;
	isDark: boolean;
}

export default function ResearchReportModal({
	isOpen,
	onClose,
	isDark,
}: ResearchReportModalProps) {
	const [content, setContent] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		if (isOpen) {
			setLoading(true);
			fetch("/indian-urban-tunnel-transit-feasibility-study.md")
				.then((res) => {
					if (!res.ok) {
						throw new Error("Failed to load the research report.");
					}
					return res.text();
				})
				.then((data) => {
					setContent(data);
					setLoading(false);
				})
				.catch((err) => {
					setError(err.message);
					setLoading(false);
				});

			// Prevent background scrolling
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	// Close on Escape key press
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	if (!isOpen) return null;

	// Simple Markdown to HTML parser for standard headings, paragraphs, tables, and ASCII charts
	const parseMarkdown = (md: string) => {
		const lines = md.split("\n");
		const elements: JSX.Element[] = [];
		let insideList = false;
		let listItems: string[] = [];
		let insidePre = false;
		let preLines: string[] = [];
		let insideTable = false;
		let tableLines: string[] = [];

		const renderList = (items: string[], key: string) => (
			<ul
				key={key}
				style={{
					paddingLeft: "1.5rem",
					margin: "1rem 0",
					display: "flex",
					flexDirection: "column",
					gap: "0.5rem",
					color: "var(--text-main)",
				}}
			>
				{items.map((item, idx) => (
					<li
						// biome-ignore lint/suspicious/noArrayIndexKey: order is stable
						key={`${key}-${idx}`}
						style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: formatted list item
						dangerouslySetInnerHTML={{ __html: item }}
					/>
				))}
			</ul>
		);

		const renderPre = (lines: string[], key: string) => {
			const text = lines.join("\n");
			const isAsciiDiagram =
				text.includes("│") || text.includes("──►") || text.includes("▼");
			return (
				<pre
					key={key}
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: isAsciiDiagram ? "0.75rem" : "0.85rem",
						lineHeight: 1.4,
						overflowX: "auto",
						background: isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.04)",
						border: "1px solid var(--border-color)",
						padding: "1.25rem",
						borderRadius: "0.75rem",
						margin: "1.5rem 0",
						whiteSpace: "pre",
						color: isDark ? "#38bdf8" : "var(--primary)",
						boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
					}}
				>
					<code>{text}</code>
				</pre>
			);
		};

		const renderTable = (lines: string[], key: string) => {
			if (lines.length < 2) return null;

			const headerCols = lines[0]
				.split("|")
				.map((c) => c.trim())
				.filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

			const alignCols = lines[1]
				.split("|")
				.map((c) => c.trim())
				.filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
				.map((col) => {
					if (col.startsWith(":") && col.endsWith(":")) return "center";
					if (col.endsWith(":")) return "right";
					return "left";
				});

			const dataRows = lines.slice(2).map((line) => {
				return line
					.split("|")
					.map((c) => c.trim())
					.filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
			});

			return (
				<div
					key={key}
					style={{
						overflowX: "auto",
						margin: "1.5rem 0",
						borderRadius: "0.75rem",
						border: "1px solid var(--border-color)",
						background: isDark
							? "rgba(15, 19, 30, 0.4)"
							: "rgba(255, 255, 255, 0.8)",
						boxShadow: "var(--shadow-sm)",
					}}
				>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "0.85rem",
							textAlign: "left",
							color: "var(--text-main)",
						}}
					>
						<thead>
							<tr
								style={{
									borderBottom: "2px solid var(--border-color)",
									background: isDark
										? "rgba(255, 255, 255, 0.02)"
										: "rgba(0, 0, 0, 0.02)",
								}}
							>
								{headerCols.map((col, idx) => (
									<th
										// biome-ignore lint/suspicious/noArrayIndexKey: table columns are static
										key={`th-${idx}`}
										style={{
											padding: "0.75rem 1rem",
											fontWeight: 750,
											fontFamily: "var(--font-heading)",
											color: "var(--primary)",
											textAlign: (alignCols[idx] || "left") as
												| "left"
												| "right"
												| "center",
											borderRight:
												idx < headerCols.length - 1
													? "1px solid var(--border-color)"
													: "none",
										}}
										// biome-ignore lint/security/noDangerouslySetInnerHtml: formatted table header
										dangerouslySetInnerHTML={{ __html: formatInline(col) }}
									/>
								))}
							</tr>
						</thead>
						<tbody>
							{dataRows.map((row, rowIdx) => (
								<tr
									// biome-ignore lint/suspicious/noArrayIndexKey: table rows are static
									key={`tr-${rowIdx}`}
									style={{
										borderBottom:
											rowIdx < dataRows.length - 1
												? "1px solid var(--border-color)"
												: "none",
										background:
											rowIdx % 2 === 1
												? isDark
													? "rgba(255, 255, 255, 0.01)"
													: "rgba(0, 0, 0, 0.01)"
												: "transparent",
									}}
								>
									{row.map((col, colIdx) => (
										<td
											// biome-ignore lint/suspicious/noArrayIndexKey: table cells are static
											key={`td-${rowIdx}-${colIdx}`}
											style={{
												padding: "0.75rem 1rem",
												lineHeight: 1.5,
												textAlign: (alignCols[colIdx] || "left") as
													| "left"
													| "right"
													| "center",
												borderRight:
													colIdx < row.length - 1
														? "1px solid var(--border-color)"
														: "none",
											}}
											// biome-ignore lint/security/noDangerouslySetInnerHtml: formatted table cell
											dangerouslySetInnerHTML={{ __html: formatInline(col) }}
										/>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
		};

		// Helper to format inline markdown (bold, links)
		const formatInline = (text: string) => {
			return text
				.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
				.replace(/\*(.*?)\*/g, "<em>$1</em>")
				.replace(
					/`(.*?)`/g,
					"<code style='font-family: var(--font-mono); font-size: 0.9em; background: rgba(0,0,0,0.1); padding: 0.1rem 0.3rem; borderRadius: 0.25rem;'>$1</code>",
				)
				.replace(
					/\[(.*?)\]\((.*?)\)/g,
					"<a href='$2' target='_blank' rel='noopener noreferrer' style='color: var(--primary); text-decoration: underline;'>$1</a>",
				);
		};

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			// Handle Table triggers
			if (trimmed.startsWith("|")) {
				if (insideList) {
					elements.push(renderList(listItems, `list-${i}`));
					listItems = [];
					insideList = false;
				}
				if (insidePre) {
					elements.push(renderPre(preLines, `pre-${i}`));
					preLines = [];
					insidePre = false;
				}
				insideTable = true;
				tableLines.push(line);
				continue;
			}

			// If we were inside a table but hit a non-table line, flush table
			if (insideTable && !trimmed.startsWith("|")) {
				const tbl = renderTable(tableLines, `table-${i}`);
				if (tbl) elements.push(tbl);
				tableLines = [];
				insideTable = false;
			}

			// Handle Preformatted block triggers or ASCII diagrams (which are lines of specific characters or starts with multiple spaces)
			const isPreformattedLine =
				line.startsWith("    ") &&
				!line.trim().startsWith("*") &&
				!line.trim().startsWith("-") &&
				!/^[0-9]+\./.test(line.trim());

			const isAsciiBorder =
				line.includes("────") ||
				line.includes("┌──") ||
				line.includes("├──") ||
				line.includes("│   ") ||
				line.includes("▲   ") ||
				line.includes("▼   ");

			if (isPreformattedLine || isAsciiBorder) {
				if (insideList) {
					elements.push(renderList(listItems, `list-${i}`));
					listItems = [];
					insideList = false;
				}
				insidePre = true;
				preLines.push(line);
				continue;
			}

			if (
				insidePre &&
				!isPreformattedLine &&
				!isAsciiBorder &&
				line.trim() !== ""
			) {
				// We hit a normal line, flush pre block
				elements.push(renderPre(preLines, `pre-${i}`));
				preLines = [];
				insidePre = false;
			}

			if (trimmed.startsWith("# ")) {
				if (insideList) {
					elements.push(renderList(listItems, `list-${i}`));
					listItems = [];
					insideList = false;
				}
				elements.push(
					<h1
						key={`h1-${i}`}
						style={{
							fontSize: "2rem",
							fontWeight: 800,
							margin: "2.5rem 0 1rem 0",
							borderBottom: "2px solid var(--border-color)",
							paddingBottom: "0.5rem",
							color: "var(--text-main)",
						}}
					>
						{trimmed.slice(2)}
					</h1>,
				);
			} else if (trimmed.startsWith("## ")) {
				if (insideList) {
					elements.push(renderList(listItems, `list-${i}`));
					listItems = [];
					insideList = false;
				}
				elements.push(
					<h2
						key={`h2-${i}`}
						style={{
							fontSize: "1.5rem",
							fontWeight: 700,
							margin: "2rem 0 1rem 0",
							color: "var(--primary)",
						}}
					>
						{trimmed.slice(3)}
					</h2>,
				);
			} else if (trimmed.startsWith("### ")) {
				if (insideList) {
					elements.push(renderList(listItems, `list-${i}`));
					listItems = [];
					insideList = false;
				}
				elements.push(
					<h3
						key={`h3-${i}`}
						style={{
							fontSize: "1.2rem",
							fontWeight: 700,
							margin: "1.5rem 0 0.75rem 0",
							color: "var(--text-main)",
						}}
					>
						{trimmed.slice(4)}
					</h3>,
				);
			} else if (
				trimmed.startsWith("- ") ||
				trimmed.startsWith("* ") ||
				trimmed.startsWith("• ")
			) {
				insideList = true;
				listItems.push(formatInline(trimmed.slice(2)));
			} else if (trimmed === "") {
				if (insideList) {
					elements.push(renderList(listItems, `list-${i}`));
					listItems = [];
					insideList = false;
				}
				// Skip empty lines or insert a small spacer
			} else {
				if (insideList) {
					elements.push(renderList(listItems, `list-${i}`));
					listItems = [];
					insideList = false;
				}

				if (insidePre) {
					preLines.push(line);
				} else {
					// Fallback table checks for any remaining non-standard layout elements
					const isTableRow =
						trimmed.includes(" │ ") ||
						(trimmed.includes("  ") &&
							trimmed.split("  ").length > 3 &&
							(trimmed.includes("₹") ||
								trimmed.includes("M") ||
								trimmed.includes("CapEx") ||
								trimmed.includes("Metro")));

					if (isTableRow) {
						elements.push(
							<div
								key={`table-row-${i}`}
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "0.85rem",
									padding: "0.5rem 0.75rem",
									background: isDark
										? "rgba(255,255,255,0.02)"
										: "rgba(0,0,0,0.02)",
									borderBottom: "1px solid var(--border-color)",
									whiteSpace: "pre-wrap",
								}}
							>
								{trimmed}
							</div>,
						);
					} else {
						elements.push(
							<p
								key={`p-${i}`}
								style={{
									fontSize: "1rem",
									lineHeight: 1.6,
									margin: "0.8rem 0",
									color: "var(--text-main)",
								}}
								// biome-ignore lint/security/noDangerouslySetInnerHtml: formatted paragraph
								dangerouslySetInnerHTML={{ __html: formatInline(line) }}
							/>,
						);
					}
				}
			}
		}

		// Flush any remaining blocks
		if (insideList) {
			elements.push(renderList(listItems, "list-final"));
		}
		if (insidePre) {
			elements.push(renderPre(preLines, "pre-final"));
		}
		if (insideTable) {
			const tbl = renderTable(tableLines, "table-final");
			if (tbl) elements.push(tbl);
		}

		return elements;
	};

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(8, 10, 16, 0.8)",
				backdropFilter: "blur(12px)",
				zIndex: 1000,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				padding: "2rem 1rem",
				animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
			}}
		>
			<div
				className="glass-card"
				style={{
					width: "100%",
					maxWidth: "960px",
					height: "100%",
					maxHeight: "90vh",
					display: "flex",
					flexDirection: "column",
					padding: 0,
					borderRadius: "1.25rem",
					overflow: "hidden",
					boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
					border: "1px solid var(--border-color)",
					background: isDark
						? "rgba(15, 19, 30, 0.95)"
						: "rgba(255, 255, 255, 0.95)",
				}}
			>
				{/* Modal Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "1.25rem 2rem",
						borderBottom: "1px solid var(--border-color)",
						background: isDark
							? "rgba(8, 10, 16, 0.4)"
							: "rgba(244, 246, 249, 0.5)",
					}}
				>
					<div
						style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
					>
						<div
							style={{
								background: "var(--primary-bg)",
								color: "var(--primary)",
								padding: "0.4rem",
								borderRadius: "0.5rem",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<FileText size={18} />
						</div>
						<div>
							<h3
								style={{
									fontSize: "1.1rem",
									fontWeight: 800,
									color: "var(--text-main)",
								}}
							>
								Gemini Deep Research Report
							</h3>
							<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
								Indian Urban Tunnel Transit Feasibility Study
							</span>
						</div>
					</div>

					<div
						style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
					>
						{/* Downloads */}
						<div
							style={{ display: "flex", gap: "0.5rem" }}
							className="desktop-only"
						>
							<a
								href="/indian-urban-tunnel-transit-feasibility-study.docx"
								download
								className="btn btn-secondary"
								style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
							>
								<Download size={14} />
								<span>DOCX</span>
							</a>
							<a
								href="/indian-urban-tunnel-transit-feasibility-study.md"
								download
								className="btn btn-secondary"
								style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
							>
								<FileDown size={14} />
								<span>Markdown</span>
							</a>
						</div>

						{/* Close button */}
						<button
							type="button"
							onClick={onClose}
							style={{
								background: "none",
								border: "none",
								color: "var(--text-muted)",
								cursor: "pointer",
								padding: "0.4rem",
								borderRadius: "0.5rem",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								transition: "all 0.2s ease",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = "var(--text-main)";
								e.currentTarget.style.background = isDark
									? "rgba(255,255,255,0.05)"
									: "rgba(0,0,0,0.05)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = "var(--text-muted)";
								e.currentTarget.style.background = "none";
							}}
						>
							<X size={20} />
						</button>
					</div>
				</div>

				{/* Modal Content Area */}
				<div
					style={{
						flex: 1,
						overflowY: "auto",
						padding: "2rem 3rem",
						scrollBehavior: "smooth",
					}}
				>
					{loading && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
								gap: "1rem",
								color: "var(--text-muted)",
							}}
						>
							<Loader2
								className="animate-spin"
								size={32}
								style={{ animation: "spin 1s linear infinite" }}
							/>
							<span>Loading deep research study...</span>
						</div>
					)}

					{error && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
								gap: "1rem",
								color: "var(--right-turn)",
								textAlign: "center",
							}}
						>
							<span>⚠️ {error}</span>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="btn btn-secondary"
							>
								Retry
							</button>
						</div>
					)}

					{!loading && !error && (
						<article style={{ maxWidth: "800px", margin: "0 auto" }}>
							{/* Document Warning Notice */}
							<div
								style={{
									borderLeft: "4px solid var(--primary)",
									background: "var(--primary-bg)",
									padding: "1rem 1.25rem",
									borderRadius: "0 0.5rem 0.5rem 0",
									marginBottom: "2rem",
									fontSize: "0.85rem",
									color: "var(--text-main)",
									lineHeight: 1.5,
								}}
							>
								<strong>Engineering Feasibility Study Benchmark:</strong> This
								document compiles multi-layered geotechnical and economic
								analysis comparing micro-tunnels to mass rail infrastructure in
								Indian megacities. You can download the full report in Microsoft
								Word format or raw Markdown using the buttons in the header.
							</div>

							{parseMarkdown(content)}
						</article>
					)}
				</div>

				{/* Mobile Download Footer */}
				<div
					className="mobile-only"
					style={{
						display: "none",
						gap: "0.5rem",
						padding: "1rem 1.5rem",
						borderTop: "1px solid var(--border-color)",
						background: isDark
							? "rgba(8, 10, 16, 0.8)"
							: "rgba(244, 246, 249, 0.8)",
					}}
				>
					<a
						href="/indian-urban-tunnel-transit-feasibility-study.docx"
						download
						className="btn btn-secondary"
						style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
					>
						<Download size={14} />
						<span>DOCX</span>
					</a>
					<a
						href="/indian-urban-tunnel-transit-feasibility-study.md"
						download
						className="btn btn-secondary"
						style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
					>
						<FileDown size={14} />
						<span>MD</span>
					</a>
				</div>
			</div>
			{/* Add standard media-queries inside inline style tags to handle CSS overrides */}
			<style>{`
				@media (max-width: 768px) {
					.desktop-only { display: none !important; }
					.mobile-only { display: flex !important; }
				}
			`}</style>
		</div>
	);
}
