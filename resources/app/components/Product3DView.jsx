import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Center, Html, Environment } from "@react-three/drei";
import * as THREE from 'three';
import Model from "./Model";

function Loader({ progress = 0 }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                background: "rgba(229, 237, 239, 0.6)", // optional overlay bg
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: "#9ca3af",
                                animation: "pulse 1.4s infinite ease-in-out both",
                                animationDelay: `${i * 0.16}s`,
                            }}
                        />
                    ))}
                </div>

                <style>
                    {`
            @keyframes pulse {
              0%, 80%, 100% { opacity: 0.4; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1); }
            }
          `}
                </style>

                <div style={{ fontFamily: "serif", fontSize: "14px", fontWeight: "bold", color: "#000" }}>
                    LOADING... {progress}%
                </div>
            </div>
        </div>
    );
}

// auto rotate camera

function CameraController({ focusedPart, controlsRef }) {
    const { camera, scene } = useThree();
    const [isAnimating, setIsAnimating] = useState(false);
    const [target, setTarget] = useState({ pos: null, lookAt: null });

    useEffect(() => {
        if (!focusedPart || focusedPart.length === 0) {
            return;
        }

        const box = new THREE.Box3();
        let found = false;

        // Traverse scene to find meshes with names in focusedPart
        scene.traverse((child) => {
            if (child.isMesh && focusedPart.includes(child.name)) {
                box.expandByObject(child);
                found = true;
            }
        });

        if (found) {
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);

            const fov = THREE.MathUtils.degToRad(camera.fov);

            let dist = maxDim / (2 * Math.tan(fov / 2));

            dist *= 1.5;

            dist = Math.max(dist, 10);

            const dir = new THREE.Vector3(0, 0, 1); // camera direction
            const newPos = center.clone().add(dir.multiplyScalar(dist));

            setTarget({ pos: newPos, lookAt: center });
            setIsAnimating(true);
        }

    }, [focusedPart, scene]);

    useFrame((state, delta) => {
        if (!isAnimating || !target.pos || !controlsRef.current) return;

        const step = 4 * delta;
        camera.position.lerp(target.pos, step);
        controlsRef.current.target.lerp(target.lookAt, step);
        controlsRef.current.update();

        if (camera.position.distanceTo(target.pos) < 0.5 && controlsRef.current.target.distanceTo(target.lookAt) < 0.5) {
            setIsAnimating(false);
        }
    });

    return null;
}

export default function Product3DView({
    modelUrl,
    onPartsLoaded,
    selectedParts,
    onSelect,
    effectiveColors,
    showPickModel,
    showOnlySelected,
    canvasRef,
    height = "600px",
    isPreviewMode = false,
    isAutoRotate = false,
    focusedPart,
    showDimensions,
    width,
    height_dim, // renamed from height because height is used for canvas height
    depth,
    dimension_unit,
    extension,
    productType = 'furniture'
}) {
    const controlsRef = useRef();

    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isLoading) return;

        const interval = setInterval(() => {
            setProgress((p) => (p >= 95 ? 95 : p + 1));
        }, 20);

        return () => clearInterval(interval);
    }, [isLoading]);

    return (
        <div
            style={{ width: "100%", height, position: 'relative' }}
        >
            {isLoading && <Loader progress={progress} />}
            <Canvas
                shadows
                camera={{ position: [0, 50, 150], fov: 50 }}
                style={{ background: "#e5edef" }}
                gl={{ 
                    preserveDrawingBuffer: true, 
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1,
                    outputColorSpace: THREE.SRGBColorSpace
                }}
                ref={canvasRef}
            >

                 <ambientLight intensity={productType === 'metal' ? 0.3 : 0.4} />

                 <hemisphereLight
                    skyColor="#ffffff"
                    groundColor="#444444"
                    intensity={productType === 'metal' ? 0.7 : 0.5}
                />

                {/* Environment for metal reflections */}
                {productType === 'metal' && (
                    <Environment files={(process.env.MIX_APP_URL || '') + "/textures/potsdamer_platz_1k.hdr"} />
                )}

                   {/* Environment for metal and jewelry reflections */}
                {/* {(productType === 'metal' || productType === 'jewelry') && (
                    <Suspense fallback={null}>
                        <Environment 
                            files={(() => {
                                const path = "/textures/potsdamer_platz_1k.hdr";
                                // Use relative path in local dev to avoid CORS issues with ngrok
                                if (typeof window !== 'undefined' && (window.location.hostname.includes('.test') || window.location.hostname === 'localhost')) {
                                    return path;
                                }
                                return (process.env.MIX_APP_URL || '') + path;
                            })()} 
                        />
                    </Suspense>
                )} */}

                 {/* Key Light (Stronger, from front-right) */}
                <directionalLight
                    position={[100, 100, 80]}
                    intensity={productType === 'metal' ? 1.5 : 1.2}
                />

                {/* Fill Light (Softer, from front-left) */}
                <directionalLight
                    position={[-100, 50, 100]}
                    intensity={productType === 'metal' ? 0.8 : 0.6}
                />

                {/* Top Light (For highlights on the top) */}
                <directionalLight
                    position={[0, 150, 0]}
                    intensity={productType === 'metal' ? 0.6 : 0.4}
                />

                {/* Subtle front point light to ensure front visibility */}
                <pointLight position={[0, 50, 120]} intensity={productType === 'metal' ? 0.7 : 0.5} />

                {/* Lower Light (Specifically for legs and underside) */}
                <pointLight position={[0, 10, 100]} intensity={productType === 'metal' ? 0.5 : 0.8} />

                <Model
                    modelPath={modelUrl}
                    extension={extension}
                    onPartsLoaded={(parts) => {
                        onPartsLoaded?.(parts);
                        setProgress(100);
                        setIsLoading(false);
                    }}
                    selectedParts={selectedParts}
                    onSelect={onSelect}
                    colors={effectiveColors}
                    showHighlight={showPickModel}
                    showOnlySelected={showOnlySelected}
                    showDimensions={showDimensions}
                    width={width}
                    height={height_dim}
                    depth={depth}
                    dimensionUnit={dimension_unit}
                />


                <ContactShadows
                    opacity={0.4}
                    scale={200}
                    blur={2.5}
                    far={40}
                    resolution={256}
                />

                <CameraController focusedPart={focusedPart} controlsRef={controlsRef} />

                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    autoRotate={isAutoRotate}
                    autoRotateSpeed={0.8}
                    // enablePan={false}
                    target={[0, 45, 0]}
                />
            </Canvas>
        </div>
    );
}

