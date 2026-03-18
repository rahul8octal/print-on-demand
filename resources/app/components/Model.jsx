import { useEffect, useRef, useMemo, useState } from "react";
import { useFBX, useGLTF, Line, Html } from "@react-three/drei";
import * as THREE from "three";

export default function Model(props) {
    const { modelPath, extension: manualExtension } = props;
    const extension = useMemo(() => {
        if (manualExtension) return manualExtension.toLowerCase();
        if (!modelPath) return null;

        let targetPath = modelPath;
        // If it's our proxy URL, look at the nested 'url' param
        if (modelPath.includes('view-model?url=')) {
            try {
                const urlParams = new URL(modelPath, window.location.origin).searchParams;
                const proxyUrl = urlParams.get('url');
                if (proxyUrl) targetPath = proxyUrl;
            } catch (e) {}
        }

        const cleanPath = targetPath.split('?')[0];
        return cleanPath.split('.').pop()?.toLowerCase();
    }, [modelPath, manualExtension]);

    if (extension === 'fbx') {
        return <FBXModel {...props} />;
    } else if (extension === 'glb' || extension === 'gltf') {
        return <GLBModel {...props} />;
    }

    // Default to FBX or return null if not supported
    return <FBXModel {...props} />;
}

function FBXModel(props) {
    const fbx = useFBX(props.modelPath);
    return <ModelContent object={fbx} {...props} />;
}

function GLBModel(props) {
    const { scene } = useGLTF(props.modelPath);
    return <ModelContent object={scene} {...props} />;
}

function ModelContent({
    object,
    onPartsLoaded,
    selectedParts = [],
    onSelect,
    colors = {},
    showHighlight = true,
    showOnlySelected = false,
    showDimensions = false,
    width,
    height,
    depth,
    dimensionUnit,
}) {
    const groupRef = useRef(null);
    const initialColors = useRef({});
    const [modelReady, setModelReady] = useState(false);
    const [originalSize, setOriginalSize] = useState(null);

    // Enable shadows and collect groups
    useEffect(() => {
        if (!object) {
            return;
        }

        const groups = {};
        let meshCount = 0;

        object.traverse((child) => {
            if (child.isMesh) {
                meshCount++;
                child.castShadow = true;
                child.receiveShadow = true;

                // Handle Material
                if (!child.material) {
                    child.material = new THREE.MeshStandardMaterial({ color: "#cccccc" });
                }

                const materials = Array.isArray(child.material) ? child.material : [child.material];

                // Store initial color if we haven't already
                if (!initialColors.current[child.name]) {
                    const firstMat = materials[0];
                    if (firstMat && firstMat.color) {
                        try {
                            initialColors.current[child.name] = firstMat.color.clone();
                        } catch (e) {
                            initialColors.current[child.name] = new THREE.Color("#cccccc");
                        }
                    } else {
                        initialColors.current[child.name] = new THREE.Color("#cccccc");
                    }
                }

                // Build group by parent
                const parent = child.parent?.name || "ungrouped";
                if (!groups[parent]) groups[parent] = [];

                groups[parent].push({
                    uuid: child.uuid,
                    name: child.name,
                    materialName: materials[0]?.name || null
                });
            }
        });

        onPartsLoaded(groups);
    }, [object, onPartsLoaded]);

    // Apply dynamic colors
    useEffect(() => {
        if (!object) return;

        object.traverse((child) => {
            if (!child.isMesh) return;

            const customColor = colors[child.name];
            if (!customColor) return;

            const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];

            materials.forEach((mat) => {
                if (!mat) return;

                // Remove texture influence
                mat.map = null;

                // Force standard material
                if (!(mat instanceof THREE.MeshStandardMaterial)) {
                    mat = new THREE.MeshStandardMaterial();
                    child.material = mat;
                }

                mat.color.set(customColor);
                mat.needsUpdate = true;
            });
        });
    }, [object, colors]);


    // Selection highlight
    useEffect(() => {
        if (!object) return;

        object.traverse((child) => {
            if (!child.isMesh) return;

            const selected = selectedParts.includes(child.name);

            const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];

            materials.forEach((mat, index) => {
                if (!mat) return;

                // 🔥 Force StandardMaterial for emissive to work
                if (!(mat instanceof THREE.MeshStandardMaterial)) {
                    const newMat = new THREE.MeshStandardMaterial({
                        color: mat.color ? mat.color.clone() : new THREE.Color("#cccccc"),
                    });
                    materials[index] = newMat;
                    mat = newMat;
                }

                if (selected && showHighlight) {
                    mat.emissive.set("#ffff55");
                    mat.emissiveIntensity = 1;
                } else {
                    mat.emissive.set("#000000");
                    mat.emissiveIntensity = 0;
                }

                mat.needsUpdate = true;
            });

            child.material = materials.length === 1 ? materials[0] : materials;
        });
    }, [object, selectedParts, showHighlight]);


    useEffect(() => {
        if (!object) return;

        if (!showOnlySelected || selectedParts.length === 0) {
            object.traverse((child) => {
                if (child.isMesh) {
                    child.visible = true;
                }
            });
            return;
        }

        object.traverse((child) => {
            if (!child.isMesh) return;
            child.visible = selectedParts.includes(child.name);
        });
    }, [object, selectedParts, showOnlySelected]);

    // Auto scale and center logic
    useEffect(() => {
        if (!object) return;

        // 1. Reset object transforms so we can measure the "raw" model
        object.position.set(0, 0, 0);
        object.scale.setScalar(1);
        object.rotation.set(0, 0, 0);
        object.updateMatrixWorld(true);

        // 2. Compute bounding box based ONLY on meshes
        const box = new THREE.Box3();
        let hasPayload = false;

        object.traverse((child) => {
            if (child.isMesh && child.geometry) {
                if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();

                // Get world-space box for this mesh
                const meshBox = child.geometry.boundingBox.clone();
                meshBox.applyMatrix4(child.matrixWorld);

                box.union(meshBox);
                hasPayload = true;
            }
        });

        if (hasPayload) {
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxSide = Math.max(size.x, size.y, size.z);

            if (maxSide > 0 && isFinite(maxSide)) {
                // Target 100 units for a comfortable fit within the view box
                const scale = 100 / maxSide;
                object.scale.setScalar(scale);

                // 3. Explicitly center the object
                // This ensures both GLB and FBX sit perfectly at (0,0,0)
                object.position.x = -center.x * scale;
                object.position.y = -box.min.y * scale;
                object.position.z = -center.z * scale;

                object.updateMatrixWorld(true);
            } else {
                console.warn(`Model has invalid size: maxSide=${maxSide}`);
            }
            // Store original size for dimensions
            setOriginalSize(size);
        } else {
            console.log("Model has no payload (meshes)");
        }
        setModelReady(true);
    }, [object]);

    return (
        <group
            ref={groupRef}
            onPointerDown={(e) => {
                e.stopPropagation();
                if (!showHighlight) return;
                if (e.object) {
                    onSelect?.(e.object.name);
                }
            }}
        >
            <primitive object={object} />
            {modelReady && showDimensions && object && originalSize && (
                <DimensionLines
                    object={object}
                    originalSize={originalSize}
                    manualWidth={width}
                    manualHeight={height}
                    manualDepth={depth}
                    manualUnit={dimensionUnit}
                />
            )}
        </group>
    );
}

function DimensionLines({ object, originalSize, manualWidth, manualHeight, manualDepth, manualUnit }) {
    // Calculate visual bounding box based only on meshes to be precise
    const box = useMemo(() => {
        const b = new THREE.Box3();
        object.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const meshBox = child.geometry.boundingBox.clone();
                meshBox.applyMatrix4(child.matrixWorld);
                b.union(meshBox);
            }
        });
        return b;
    }, [object]);

    const { min, max } = box;
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    const formatDim = (val, manualVal) => {
        const numManual = parseFloat(manualVal);
        if (!isNaN(numManual) && numManual > 0) {
            return `${numManual} ${manualUnit || 'in'}`;
        }
        return `${(val * 39.3701).toFixed(2)} in`;
    };

    const color = "#2563eb"; // Shopify Primary Blue
    const lineWidth = 1.5;
    const offset = maxDim * 0.15; // 15% of max dimension for offset
    const tickSize = maxDim * 0.05; // 5% of max dimension for ticks
    const labelOffset = offset * 1.5; // Positioning labels slightly beyond the lines

    return (
        <group>
            {/* Height Line (Vertical) */}
            <group>
                <Line
                    points={[[max.x + offset, min.y, max.z], [max.x + offset, max.y, max.z]]}
                    color={color}
                    lineWidth={lineWidth}
                    dashed={true}
                    dashScale={2}
                    gapSize={1}
                />
                {/* Ticks for Height */}
                <Line points={[[max.x + offset - tickSize, min.y, max.z], [max.x + offset + tickSize, min.y, max.z]]} color={color} lineWidth={lineWidth} />
                <Line points={[[max.x + offset - tickSize, max.y, max.z], [max.x + offset + tickSize, max.y, max.z]]} color={color} lineWidth={lineWidth} />

                <Html position={[max.x + labelOffset, (min.y + max.y) / 2, max.z]} center>
                    <div style={{
                        background: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1.5px solid #2563eb',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: '#1e40af',
                        fontWeight: 600,
                        pointerEvents: 'none'
                    }}>
                        {formatDim(originalSize.y, manualHeight)}
                    </div>
                </Html>
            </group>

            {/* Width Line (Horizontal Front) */}
            <group>
                <Line
                    points={[[min.x, max.y + offset, max.z], [max.x, max.y + offset, max.z]]}
                    color={color}
                    lineWidth={lineWidth}
                    dashed={true}
                    dashScale={2}
                    gapSize={1}
                />
                {/* Ticks for Width */}
                <Line points={[[min.x, max.y + offset - tickSize, max.z], [min.x, max.y + offset + tickSize, max.z]]} color={color} lineWidth={lineWidth} />
                <Line points={[[max.x, max.y + offset - tickSize, max.z], [max.x, max.y + offset + tickSize, max.z]]} color={color} lineWidth={lineWidth} />

                <Html position={[(min.x + max.x) / 2, max.y + labelOffset, max.z]} center>
                    <div style={{
                        background: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1.5px solid #2563eb',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: '#1e40af',
                        fontWeight: 600,
                        pointerEvents: 'none'
                    }}>
                        {formatDim(originalSize.x, manualWidth)}
                    </div>
                </Html>
            </group>

            {/* Depth Line (Side Top) */}
            <group>
                <Line
                    points={[[max.x, max.y + offset, min.z], [max.x, max.y + offset, max.z]]}
                    color={color}
                    lineWidth={lineWidth}
                    dashed={true}
                    dashScale={2}
                    gapSize={1}
                />
                {/* Ticks for Depth */}
                <Line points={[[max.x, max.y + offset - tickSize, min.z], [max.x, max.y + offset + tickSize, min.z]]} color={color} lineWidth={lineWidth} />
                <Line points={[[max.x, max.y + offset - tickSize, max.z], [max.x, max.y + offset + tickSize, max.z]]} color={color} lineWidth={lineWidth} />

                <Html position={[max.x, max.y + labelOffset, (min.z + max.z) / 2]} center>
                    <div style={{
                        background: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1.5px solid #2563eb',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: '#1e40af',
                        fontWeight: 600,
                        pointerEvents: 'none'
                    }}>
                        {formatDim(originalSize.z, manualDepth)}
                    </div>
                </Html>
            </group>
        </group>
    );
}

