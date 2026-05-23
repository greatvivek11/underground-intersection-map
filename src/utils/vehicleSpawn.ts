/** Spawn vehicles until count reaches target (per animation frame cap). */
export function spawnToTarget<T>(
	current: T[],
	targetCount: number,
	createVehicle: () => T | null,
	maxPerFrame = 4,
): void {
	const deficit = targetCount - current.length;
	if (deficit <= 0) return;

	const batch = Math.min(deficit, maxPerFrame);
	for (let i = 0; i < batch; i++) {
		const vehicle = createVehicle();
		if (vehicle) current.push(vehicle);
	}
}
