import tunnelSpec from "../../shared/tunnel-config.json";

export const DEPTH_EXAGGERATION =
	(tunnelSpec as { depthExaggeration?: number }).depthExaggeration ?? 1.35;
