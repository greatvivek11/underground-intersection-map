import { useEffect, useRef } from "react";
// @ts-expect-error
import * as THREE from "three";
// @ts-expect-error
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { TunnelConfig, TunnelEdge } from "../utils/geometry";
import { APPROACHES, getTunnelNetwork } from "../utils/geometry";

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

export default function TunnelSimulation3D({
	config,
	isDark,
	density,
	speed,
}: {
	config: TunnelConfig;
	isDark: boolean;
	density: number;
	speed: number;
}) {
	const mountRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const container = mountRef.current;
		if (!container) return;

		// --- 1. Scene Setup ---
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(isDark ? 0x0b0e14 : 0xf8f9fa);

		// Fog for depth styling
		scene.fog = new THREE.FogExp2(isDark ? 0x0b0e14 : 0xf8f9fa, 0.0015);

		// --- 2. Camera Setup ---
		const camera = new THREE.PerspectiveCamera(
			45,
			container.clientWidth / container.clientHeight,
			1,
			2000,
		);
		// Position camera at an engineering isometric angle
		const limit = config.intersectionSize / 2.0 + config.portalSetback + 50.0;
		camera.position.set(limit * 1.3, limit * 1.5, limit * 1.5);

		// --- 3. Renderer Setup ---
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.shadowMap.enabled = true;
		container.appendChild(renderer.domElement);

		// --- 4. Controls Setup ---
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground plane
		controls.minDistance = 50;
		controls.maxDistance = limit * 3;

		// --- 5. Lighting ---
		const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.35 : 0.65);
		scene.add(ambientLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.45 : 0.85);
		dirLight.position.set(200, 400, 200);
		dirLight.castShadow = true;
		scene.add(dirLight);

		// --- 6. Environment Grids & Surface Roads ---
		// Ground plane representation (surface)
		const gridSize = limit * 2.2;
		const gridDivisions = 40;
		const gridHelper = new THREE.GridHelper(
			gridSize,
			gridDivisions,
			isDark ? 0x1a1f2c : 0xcbd5e1,
			isDark ? 0x121722 : 0xe2e8f0,
		);
		gridHelper.position.y = 0;
		scene.add(gridHelper);

		// Road Planes (Surface Layout)
		const rw = config.roadWidth;
		const roadLen = config.intersectionSize / 2.0 + config.portalSetback + 40.0;
		const roadMaterial = new THREE.MeshStandardMaterial({
			color: isDark ? 0x1e2530 : 0xe2e8f0,
			roughness: 0.8,
			metalness: 0.1,
			transparent: true,
			opacity: 0.4,
		});

		const ewRoadGeo = new THREE.BoxGeometry(roadLen * 2, 0.2, rw);
		const ewRoad = new THREE.Mesh(ewRoadGeo, roadMaterial);
		ewRoad.position.set(0, 0.1, 0);
		scene.add(ewRoad);

		const nsRoadGeo = new THREE.BoxGeometry(rw, 0.2, roadLen * 2);
		const nsRoad = new THREE.Mesh(nsRoadGeo, roadMaterial);
		nsRoad.position.set(0, 0.1, 0);
		scene.add(nsRoad);

		// --- 7. Subterranean Tunnels Construction ---
		const network = getTunnelNetwork(config);
		const curves: CurveData[] = [];
		const tunnelGroup = new THREE.Group();
		scene.add(tunnelGroup);

		network.edges.forEach((edge: TunnelEdge) => {
			// Convert layout 2D path to 3D curve coordinates
			// Layout x -> Three.js x
			// Layout y -> Three.js z
			// Depth -> Three.js y (negative for underground)
			const points3D = [];

			if (edge.type === "descent" || edge.type === "ascent") {
				const pStart = edge.path[0];
				const pEnd = edge.path[1];

				// Linear path mapping
				points3D.push(new THREE.Vector3(pStart[0], 0, -pStart[1]));
				points3D.push(new THREE.Vector3(pEnd[0], edge.depth, -pEnd[1]));
			} else {
				// Tunnels (Bezier splines)
				edge.path.forEach((pt) => {
					points3D.push(new THREE.Vector3(pt[0], edge.depth, -pt[1]));
				});
			}

			const curve = new THREE.CatmullRomCurve3(points3D);
			curves.push({
				curve: curve,
				type: edge.type,
				routeType: edge.routeType,
				depth: edge.depth,
			});

			// Construct glowing 3D Tubes for Tunnels
			if (edge.type === "tunnel") {
				const tubeGeo = new THREE.TubeGeometry(curve, 64, 2.8, 8, false);

				// High-fidelity glowing conduit material
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

				const tubeMat = new THREE.MeshStandardMaterial({
					color: tubeColor,
					emissive: tubeColor,
					emissiveIntensity: isDark ? 0.35 : 0.1,
					transparent: true,
					opacity: isDark ? 0.25 : 0.45,
					wireframe: false,
					roughness: 0.3,
				});

				const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
				tunnelGroup.add(tubeMesh);
			} else {
				// Ramps (Simple dash-wire representation)
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

		// --- 8. Portal Structures ---
		const portalGroup = new THREE.Group();
		scene.add(portalGroup);

		Object.keys(APPROACHES).forEach((name) => {
			const entry = network.nodes[`${name}_entry`];
			const exit = network.nodes[`${name}_exit`];

			const makePortalBox = (pos: number[]) => {
				const portalGeo = new THREE.BoxGeometry(24, 6, 14);
				const portalMat = new THREE.MeshStandardMaterial({
					color: isDark ? 0x1e293b : 0x334155,
					roughness: 0.6,
					metalness: 0.3,
				});
				const mesh = new THREE.Mesh(portalGeo, portalMat);
				mesh.position.set(pos[0], -3, -pos[1]);
				portalGroup.add(mesh);
			};

			makePortalBox(entry);
			makePortalBox(exit);
		});

		// --- 9. Vehicle Particle System ---
		const activeVehicles: Vehicle3D[] = [];
		const vehicleGeo = new THREE.SphereGeometry(1.8, 8, 8);

		const updateVehicles = () => {
			// Maintain density count
			if (activeVehicles.length < density && Math.random() < 0.1) {
				// Filter routes to choose from
				const tunnels = curves.filter((c) => c.type === "tunnel");
				const rCurve = tunnels[Math.floor(Math.random() * tunnels.length)];

				// Get matching entry and exit ramps
				// Find S->N
				// Find S_entry -> S_div
				// Find N_merge -> N_exit
				const _startApp =
					rCurve.curve.points[0].x > 200
						? "E"
						: rCurve.curve.points[0].x < -200
							? "W"
							: rCurve.curve.points[0].z > 200
								? "S"
								: rCurve.curve.points[0].z < -200
									? "N"
									: "";
				// procedural fallback: stitch full Vector3 points path
				const _stitchedPoints = [...rCurve.curve.points];

				const vColor = isDark
					? rCurve.routeType === "straight"
						? 0x00e5ff
						: rCurve.routeType === "left"
							? 0x34d399
							: 0xf87171
					: rCurve.routeType === "straight"
						? 0x2563eb
						: rCurve.routeType === "left"
							? 0x059669
							: 0xdc2626;

				const vehicleMat = new THREE.MeshStandardMaterial({
					color: vColor,
					emissive: vColor,
					emissiveIntensity: isDark ? 1.0 : 0.2,
				});

				const vMesh = new THREE.Mesh(vehicleGeo, vehicleMat);
				scene.add(vMesh);

				activeVehicles.push({
					mesh: vMesh,
					curve: rCurve.curve,
					t: 0,
					speed: (Math.random() * 0.002 + 0.003) * speed,
				});
			}

			// Move vehicles
			for (let i = activeVehicles.length - 1; i >= 0; i--) {
				const v = activeVehicles[i];
				v.t += v.speed;

				if (v.t >= 1) {
					scene.remove(v.mesh);
					v.mesh.geometry.dispose();
					v.mesh.material.dispose();
					activeVehicles.splice(i, 1);
				} else {
					const pt = v.curve.getPointAt(v.t);
					v.mesh.position.copy(pt);
				}
			}
		};

		// --- 10. Render & Animation Loop ---
		let animationId: number;
		const animate = () => {
			controls.update();
			updateVehicles();
			renderer.render(scene, camera);
			animationId = requestAnimationFrame(animate);
		};
		animate();

		// Resize Handler
		const handleResize = () => {
			if (!container) return;
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		};
		window.addEventListener("resize", handleResize);

		// Clean up on unmount
		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener("resize", handleResize);

			// Clean up meshes and textures
			scene.traverse((object: THREE.Object3D) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						object.material.forEach((m: THREE.Material) => {
							m.dispose();
						});
					} else {
						object.material.dispose();
					}
				}
			});
			controls.dispose();
			renderer.dispose();
			if (container.contains(renderer.domElement)) {
				container.removeChild(renderer.domElement);
			}
		};
	}, [config, isDark, density, speed]);

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
