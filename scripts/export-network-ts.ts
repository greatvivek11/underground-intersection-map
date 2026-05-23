/**
 * Serializes the TypeScript tunnel network to stdout (used by compare_geometry.py).
 */
import { buildTunnelConfig, getTunnelNetwork } from "../src/utils/geometry.ts";

const network = getTunnelNetwork(buildTunnelConfig());
process.stdout.write(JSON.stringify(network));
