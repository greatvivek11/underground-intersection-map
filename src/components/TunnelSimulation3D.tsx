import { useEffect, useRef } from "react";
// @ts-expect-error
import * as THREE from "three";
// @ts-expect-error
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { TunnelConfig, TunnelEdge } from "../utils/geometry";
import { APPROACHES, getTunnelNetwork } from "../utils/geometry";
import { DEPTH_EXAGGERATION } from "../utils/planView";
import { spawnToTarget } from "../utils/vehicleSpawn";

export type CameraPreset = "orbit" | "underground";

interface CurveData {
	curve: THREE.CatmullRomCurve3;
	type: "descent" | "ascent" | "tunnel";
	routeType: string;
	depth: number;
}

interface Vehicle3D {
	mesh: THREE.Mesh;
	curve: THREE.CatmullRomCurve3;
	t: number;
	speed: number;
}

function layoutToWorld(
	x: number,
	yLayout: number,
	depthFt: number,
): THREE.Vector3 {
	return new THREE.Vector3(x, depthFt * DEPTH_EXAGGERATION, -yLayout);
}

function edgeToPoints3D(edge: TunnelEdge): THREE.Vector3[] {
	if (edge.type === "descent" || edge.type === "ascent") {
		const pStart = edge.path[0];
		const pEnd = edge.path[1];
		return [
			layoutToWorld(pStart[0], pStart[1], 0),
			layoutToWorld(pEnd[0], pEnd[1], edge.depth),
		];
	}
	return edge.path.map((pt) => layoutToWorld(pt[0], pt[1], edge.depth));
}

function applyCameraPreset(
	preset: CameraPreset,
	camera: THREE.PerspectiveCamera,
	controls: OrbitControls,
	limit: number,
) {
	const targetY = -22 * DEPTH_EXAGGERATION;
	controls.target.set(0, targetY, 0);

	if (preset === "underground") {
		camera.position.set(0, targetY - 35, limit * 0.45);
		controls.maxPolarAngle = Math.PI;
		controls.minPolarAngle = 0;
	} else {
		camera.position.set(limit * 1.3, limit * 1.5, limit * 1.5);
		controls.maxPolarAngle = Math.PI * 0.49;
		controls.minPolarAngle = 0.15;
	}
	controls.update();
}

export default function TunnelSimulation3D({
	config,
	isDark,
	density,
	speed,
	cameraPreset = "orbit",
}: {
	config: TunnelConfig;
	isDark: boolean;
	density: number;
	speed: number;
	cameraPreset?: CameraPreset;
}) {
	const mountRef = useRef<HTMLDivElement | null>(null);
	const densityRef = useRef(density);
	const speedRef = useRef(speed);
	const controlsRef = useRef<OrbitControls | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const limitRef = useRef(0);

	densityRef.current = density;
	speedRef.current = speed;

	useEffect(() => {
		const container = mountRef.current;
		if (!container) return;

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(isDark ? 0x0b0e14 : 0xf8f9fa);
		scene.fog = new THREE.FogExp2(isDark ? 0x0b0e14 : 0xf8f9fa, 0.0012);

		const limit = config.intersectionSize / 2.0 + config.portalSetback + 50.0;

		const camera = new THREE.PerspectiveCamera(
			45,
			container.clientWidth / container.clientHeight,
			1,
			4000,
		);

		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.shadowMap.enabled = true;
		container.appendChild(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.minDistance = 40;
		controls.maxDistance = limit * 4;
		controlsRef.current = controls;
		cameraRef.current = camera;
		limitRef.current = limit;
		applyCameraPreset(cameraPreset, camera, controls, limit);

		const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.4 : 0.7);
		scene.add(ambientLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.55 : 0.9);
		dirLight.position.set(120, 280, 180);
		scene.add(dirLight);

		const underLight = new THREE.DirectionalLight(
			0x88ccff,
			isDark ? 0.35 : 0.25,
		);
		underLight.position.set(0, -120, 0);
		scene.add(underLight);

		const gridSize = limit * 2.2;
		const gridHelper = new THREE.GridHelper(
			gridSize,
			40,
			isDark ? 0x1a1f2c : 0xcbd5e1,
			isDark ? 0x121722 : 0xe2e8f0,
		);
		gridHelper.position.y = 0;
		scene.add(gridHelper);

		// Semi-transparent surface so underground strata stay visible
		const rw = config.roadWidth;
		const roadLen = config.intersectionSize / 2.0 + config.portalSetback + 40.0;
		const roadMaterial = new THREE.MeshStandardMaterial({
			color: isDark ? 0x1e2530 : 0xe2e8f0,
			roughness: 0.8,
			transparent: true,
			opacity: isDark ? 0.22 : 0.35,
			depthWrite: false,
		});

		const ewRoad = new THREE.Mesh(
			new THREE.BoxGeometry(roadLen * 2, 0.2, rw),
			roadMaterial,
		);
		ewRoad.position.set(0, 0.1, 0);
		scene.add(ewRoad);

		const nsRoad = new THREE.Mesh(
			new THREE.BoxGeometry(rw, 0.2, roadLen * 2),
			roadMaterial,
		);
		nsRoad.position.set(0, 0.1, 0);
		scene.add(nsRoad);

		const network = getTunnelNetwork(config);
		const curves: CurveData[] = [];
		const fullRouteCurves: THREE.CatmullRomCurve3[] = [];
		const tunnelGroup = new THREE.Group();
		scene.add(tunnelGroup);

		network.edges.forEach((edge: TunnelEdge) => {
			const points3D = edgeToPoints3D(edge);
			const curve = new THREE.CatmullRomCurve3(points3D);
			curves.push({
				curve,
				type: edge.type,
				routeType: edge.routeType,
				depth: edge.depth,
			});

			if (edge.type === "tunnel") {
				const start = edge.from.split("_")[0];
				const end = edge.to.split("_")[0];
				const rampIn = network.edges.find(
					(e) => e.from === `${start}_entry` && e.to === `${start}_div`,
				);
				const rampOut = network.edges.find(
					(e) => e.from === `${end}_merge` && e.to === `${end}_exit`,
				);
				if (rampIn && rampOut) {
					const stitched = [
						...edgeToPoints3D(rampIn),
						...edgeToPoints3D(edge).slice(1),
						...edgeToPoints3D(rampOut).slice(1),
					];
					fullRouteCurves.push(
						new THREE.CatmullRomCurve3(stitched, false, "catmullrom", 0.2),
					);
				}

				const tubeColor = isDark
					? edge.routeType === "straight"
						? 0x00e5ff
						: edge.routeType === "left"
							? 0x34d399
							: 0xf87171
					: edge.routeType === "straight"
						? 0x2563eb
						: edge.routeType === "left"
							? 0x059669
							: 0xdc2626;

				const tubeGeo = new THREE.TubeGeometry(curve, 64, 1.75, 8, false);
				const tubeMat = new THREE.MeshStandardMaterial({
					color: tubeColor,
					emissive: tubeColor,
					emissiveIntensity: isDark ? 0.4 : 0.12,
					transparent: true,
					opacity: isDark ? 0.55 : 0.65,
					roughness: 0.25,
				});
				tunnelGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
			} else {
				const points = curve.getPoints(20);
				const rampGeo = new THREE.BufferGeometry().setFromPoints(points);
				const rampMat = new THREE.LineDashedMaterial({
					color: isDark ? 0x94a3b8 : 0x64748b,
					dashSize: 3,
					gapSize: 2,
				});
				const rampLine = new THREE.Line(rampGeo, rampMat);
				rampLine.computeLineDistances();
				tunnelGroup.add(rampLine);
			}
		});

		Object.keys(APPROACHES).forEach((name) => {
			for (const suffix of ["entry", "exit"] as const) {
				const pos = network.nodes[`${name}_${suffix}`];
				const portalGeo = new THREE.BoxGeometry(24, 6, 14);
				const portalMat = new THREE.MeshStandardMaterial({
					color: isDark ? 0x1e293b : 0x334155,
					roughness: 0.6,
				});
				const mesh = new THREE.Mesh(portalGeo, portalMat);
				mesh.position.set(pos[0], -3, -pos[1]);
				scene.add(mesh);
			}
		});

		const activeVehicles: Vehicle3D[] = [];
		const vehicleGeo = new THREE.SphereGeometry(1.6, 8, 8);

		const pickRouteCurve = () => {
			if (fullRouteCurves.length === 0) return null;
			return fullRouteCurves[
				Math.floor(Math.random() * fullRouteCurves.length)
			];
		};

		const updateVehicles = () => {
			spawnToTarget(activeVehicles, densityRef.current, () => {
				const curve = pickRouteCurve();
				if (!curve) return null;

				const tunnels = curves.filter((c) => c.type === "tunnel");
				const rCurve =
					tunnels[Math.floor(Math.random() * tunnels.length)] ?? tunnels[0];
				const vColor = isDark
					? rCurve?.routeType === "straight"
						? 0x00e5ff
						: rCurve?.routeType === "left"
							? 0x34d399
							: 0xf87171
					: rCurve?.routeType === "straight"
						? 0x2563eb
						: rCurve?.routeType === "left"
							? 0x059669
							: 0xdc2626;

				const vehicleMat = new THREE.MeshStandardMaterial({
					color: vColor,
					emissive: vColor,
					emissiveIntensity: isDark ? 1.0 : 0.25,
				});
				const vMesh = new THREE.Mesh(vehicleGeo, vehicleMat);
				scene.add(vMesh);

				return {
					mesh: vMesh,
					curve,
					t: 0,
					speed: (Math.random() * 0.0015 + 0.0025) * speedRef.current,
				};
			});

			for (let i = activeVehicles.length - 1; i >= 0; i--) {
				const v = activeVehicles[i];
				v.t += v.speed;
				if (v.t >= 1) {
					scene.remove(v.mesh);
					if (v.mesh.material instanceof THREE.Material) {
						v.mesh.material.dispose();
					}
					activeVehicles.splice(i, 1);
				} else {
					v.mesh.position.copy(v.curve.getPointAt(v.t));
				}
			}
		};

		let animationId: number;
		const animate = () => {
			controls.update();
			updateVehicles();
			renderer.render(scene, camera);
			animationId = requestAnimationFrame(animate);
		};
		animate();

		const handleResize = () => {
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		};
		window.addEventListener("resize", handleResize);

		return () => {
			controlsRef.current = null;
			cameraRef.current = null;
			cancelAnimationFrame(animationId);
			window.removeEventListener("resize", handleResize);
			scene.traverse((object: THREE.Object3D) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					const mat = object.material;
					if (Array.isArray(mat)) {
						for (const m of mat) m.dispose();
					} else mat.dispose();
				}
			});
			controls.dispose();
			renderer.dispose();
			if (container.contains(renderer.domElement)) {
				container.removeChild(renderer.domElement);
			}
		};
	}, [config, isDark, cameraPreset]);

	useEffect(() => {
		const controls = controlsRef.current;
		const camera = cameraRef.current;
		if (!controls || !camera) return;
		applyCameraPreset(cameraPreset, camera, controls, limitRef.current);
	}, [cameraPreset]);

	return (
		<div
			ref={mountRef}
			style={{
				width: "100%",
				height: "100%",
				position: "absolute",
				top: 0,
				left: 0,
				cursor: "grab",
			}}
		/>
	);
}
