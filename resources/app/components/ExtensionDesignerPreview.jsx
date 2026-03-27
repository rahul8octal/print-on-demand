import React, { useState, useEffect, useRef, memo } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { fabric } from 'fabric';
import WebFont from 'webfontloader';

// Styles directly injected into the storefront (Theme Extension)
const styles = `
:root {
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --bg-main: #f8fafc;
    --bg-paper: #ffffff;
    --bg-dark: #0f172a;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --border: #e2e8f0;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.custom-designer-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 14px 28px;
    border-radius: 12px;
    border: none;
    background: var(--primary);
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    margin-bottom: 20px;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}
.custom-designer-btn:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}
.custom-designer-btn.is-disabled {
    pointer-events: none;
    opacity: 0.6;
}

.designer-modal-overlay {
    position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    background: rgba(15, 23, 42, 0.7) !important;
    backdrop-filter: blur(8px) !important;
    z-index: 2147483646 !important;
    animation: fadeIn 0.3s ease;
}

.designer-modal {
    background: var(--bg-paper) !important;
    border-radius: 24px !important;
    width: 95vw !important; max-width: 1440px !important;
    height: 90vh !important;
    display: flex !important; flex-direction: column !important; overflow: hidden !important;
    position: fixed !important; top: 5vh !important; left: 50% !important; 
    transform: translateX(-50%) !important;
    box-shadow: var(--shadow-lg) !important;
    z-index: 2147483647 !important;
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.designer-header {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-paper);
    display: flex;
    align-items: center;
}
.designer-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.designer-layout {
    display: flex; flex: 1; overflow: hidden; background: var(--bg-main);
}

.designer-category-sidebar {
    width: 100px;
    background: var(--bg-dark);
    display: flex; flex-direction: column;
    align-items: center; padding: 32px 0;
    gap: 16px;
}

.category-btn {
    width: 72px; height: 72px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #94a3b8; background: transparent; border: none;
    cursor: pointer; border-radius: 16px; font-size: 11px; font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); gap: 8px;
}
.category-btn:hover { color: #f8fafc; background: rgba(255,255,255,0.08); transform: scale(1.05); }
.category-btn.is-active { color: #ffffff; background: var(--primary); box-shadow: 0 8px 16px rgba(99, 102, 241, 0.4); transform: scale(1.05); }
.category-item-icon { font-size: 24px; }

.designer-toolbar {
    width: 380px;
    background: var(--bg-paper);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}

.tool-section { padding: 32px; }

.view-switcher {
    display: inline-flex; gap: 6px; padding: 6px; border-radius: 14px; background: #ffffff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid var(--border);
}

.view-btn {
    padding: 10px 24px; border-radius: 10px; border: none;
    background: transparent; font-size: 14px; font-weight: 600; cursor: pointer;
    color: var(--text-secondary); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.view-btn.is-active { background: #ffffff; color: var(--primary); box-shadow: var(--shadow-sm); }

.designer-footer {
    padding: 20px 32px;
    background: #ffffff;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
    z-index: 20;
}
.footer-actions {
    display: flex; align-items: center; gap: 24px;
}

.layer-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: #ffffff; border: 1px solid var(--border);
    border-radius: 12px; margin-bottom: 12px; font-size: 14px;
    cursor: pointer; transition: all 0.2s;
}
.layer-item:hover { border-color: var(--primary); background: #f8fafc; }
.layer-item.is-selected { border-color: var(--primary); background: #eef2ff; box-shadow: 0 0 0 1px var(--primary); }
.layer-item .layer-type { color: var(--text-secondary); font-size: 11px; text-transform: uppercase; font-weight: 700; }

.property-group {
    background: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid var(--border);
    margin-top: 24px;
}

.label-sm { font-size: 12px; color: var(--text-secondary); font-weight: 700; margin-bottom: 10px; display: block; text-transform: uppercase; letter-spacing: 0.05em; }

.input-ctrl {
    width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border);
    font-size: 14px; color: var(--text-primary); transition: all 0.2s;
    background: #ffffff; margin-bottom: 20px; outline: none;
}
.input-ctrl:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }

.clipart-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.clipart-item {
    aspect-ratio: 1; border: 1px solid var(--border); border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); padding: 12px; background: #fff;
}
.clipart-item:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: var(--shadow-md); }
.clipart-item img { max-width: 100%; max-height: 100%; object-fit: contain; }

.quick-design-card {
    border: 1px solid var(--border); border-radius: 14px; padding: 16px;
    margin-bottom: 16px; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    background: #fff; text-align: left; display: flex; align-items: center; gap: 16px;
}
.quick-design-card:hover { border-color: var(--primary); transform: translateX(4px); box-shadow: var(--shadow-md); }

.control-row {
    display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-end;
}
.control-row > div { flex: 1; }

.designer-canvas-wrapper {
    flex: 1; display: flex; flex-direction: column;
    padding: 60px; overflow: hidden; align-items: center; justify-content: center;
    position: relative;
}

.tshirt-backdrop {
    background-size: contain; background-repeat: no-repeat;
    background-position: center;
    position: relative; width: 600px; height: 700px;
    background-color: white; border-radius: 24px;
    box-shadow: 0 30px 60px -12px rgba(0,0,0,0.15);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-secondary {
    display: flex; align-items: center; justify-content: center; width: 100%;
    padding: 12px; border-radius: 10px;
    background: #fff; border: 1px solid var(--border);
    cursor: pointer; text-align: center;
    font-weight: 600; font-size: 14px; color: var(--text-primary);
    transition: all 0.2s;
}
.btn-secondary:hover { background: #f1f5f9; border-color: #cbd5e1; }

.btn-danger {
    display: inline-block; width: 100%;
    padding: 12px; border-radius: 10px;
    background: #fef2f2; border: 1px solid #fee2e2;
    color: #ef4444; cursor: pointer; text-align: center;
    font-weight: 600; font-size: 14px;
    transition: all 0.2s;
}
.btn-danger:hover { background: #fee2e2; }

.align-btn-group {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;
}

.btn-small {
    padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border);
    background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-primary);
    display: flex; align-items: center; gap: 8px; justify-content: center;
    transition: all 0.2s;
}
.btn-small:hover { border-color: var(--primary); color: var(--primary); background: #f5f3ff; }

.btn-primary {
    display: inline-block; width: 100%;
    padding: 16px; border-radius: 14px;
    background: var(--primary); border: none;
    color: #fff; cursor: pointer; text-align: center;
    font-weight: 700; font-size: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}
.btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-icon-close {
    position: absolute; top: 24px; right: 24px;
    background: var(--bg-paper); border: 1px solid var(--border); cursor: pointer;
    font-size: 18px; color: var(--text-secondary); padding: 10px; border-radius: 50%;
    z-index: 10; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; box-shadow: var(--shadow-sm);
}
.btn-icon-close:hover { background: #fef2f2; color: #ef4444; border-color: #fee2e2; transform: rotate(90deg); }

.font-search-container { position: sticky; top: 0; background: #fff; z-index: 5; padding-bottom: 20px; }
.font-category-chips { 
    display: flex; gap: 10px; overflow-x: auto; margin: 0 -32px 24px; padding: 0 32px 12px; 
    scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
}
.font-category-chips::-webkit-scrollbar { height: 4px; display: block; }
.font-category-chips::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
.category-chip { 
    white-space: nowrap; padding: 8px 18px; border-radius: 99px; 
    background: #f1f5f9; font-size: 13px; font-weight: 600; color: var(--text-secondary); 
    border: 1px solid transparent; cursor: pointer; transition: all 0.2s;
}
.category-chip:hover { background: #e2e8f0; color: var(--text-primary); }
.category-chip.is-active { background: var(--primary); color: #fff; }

.font-list-item { 
    display: flex; align-items: center; justify-content: space-between; 
    padding: 16px 4px; border-bottom: 1px solid #f1f5f9; cursor: pointer;
    transition: all 0.2s;
}
.font-list-item:hover { transform: translateX(4px); color: var(--primary); }
.font-list-item span:first-child { font-size: 16px; }

input[type="range"] {
    -webkit-appearance: none; width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; outline: none;
}
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 18px; height: 18px; background: var(--primary); border-radius: 50%; cursor: pointer;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); transition: all 0.2s;
}
input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.2); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
`;

const injectStyles = () => {
    if (!document.getElementById("designer-styles")) {
        const style = document.createElement("style");
        style.id = "designer-styles";
        style.innerHTML = styles;
        document.head.appendChild(style);
    }
};

const ThemeDesigner = memo(({ productId, shopUrl, productTitle }) => {
    const [status, setStatus] = useState({ loading: true, active: false });
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('text'); // 'upload', 'text', 'layers', 'clipart', 'templates'
    const [activeView, setActiveView] = useState('front'); // 'front', 'back'
    const [viewDesigns, setViewDesigns] = useState({ front: null, back: null });

    const [assets, setAssets] = useState({ fonts: [], graphics: {}, presets: {} });
    const [fontSearch, setFontSearch] = useState('');
    const [activeFontCategory, setActiveFontCategory] = useState('All');

    const canvasRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [productImages, setProductImages] = useState({ front: null, back: null });
    const [selectedObject, setSelectedObject] = useState(null);
    const [layers, setLayers] = useState([]);

    useEffect(() => {
        if (isDesignerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isDesignerOpen]);

    const [objProps, setObjProps] = useState({
        text: '',
        color: '#000000',
        fontSize: 24,
        fontFamily: 'Inter',
        opacity: 1,
        angle: 0,
    });

    injectStyles();

    // Setup custom delete control for Fabric
    const setupCustomControls = () => {
        const deleteIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff4d4d' %3E%3Cpath d='M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z'/%3E%3C/svg%3E";
        const img = document.createElement('img');
        img.src = deleteIcon;

        fabric.Object.prototype.controls.deleteControl = new fabric.Control({
            x: 0.5,
            y: -0.5,
            offsetY: -16,
            offsetX: 16,
            cursorStyle: 'pointer',
            mouseUpHandler: deleteObject,
            render: renderIcon(img),
            cornerSize: 24
        });
    };

    function deleteObject(eventData, transform) {
        const target = transform.target;
        const canvas = target.canvas;
        canvas.remove(target);
        canvas.requestRenderAll();
    }

    function renderIcon(img) {
        return function(ctx, left, top, styleOverride, fabricObject) {
            const size = this.cornerSize;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            ctx.drawImage(img, -size/2, -size/2, size, size);
            ctx.restore();
        };
    }

    // Fetch whether this product is POD customizable
    useEffect(() => {
        setupCustomControls();
        const fetchStatus = async () => {
            try {
                // Determine API base url from the injected script or environment
                const appUrl = (window.appConfig && window.appConfig.appUrl) || "https://print-on-demand.test";
                // Get configured POD products
                const response = await axios.get(`${appUrl}/api/pod/catalog`);
                if (response.data?.success) {
                    const podIds = (response.data.ids || []).map(id => String(id));
                    const currentProductId = String(productId);
                    
                    if (podIds.includes(currentProductId) || podIds.includes(`gid://shopify/Product/${currentProductId}`)) {
                        setStatus({ loading: false, active: true });
                    } else {
                        setStatus({ loading: false, active: false });
                    }
                } else {
                    setStatus({ loading: false, active: false });
                }
            } catch (error) {
                console.error("Error fetching POD status", error);
                setStatus({ loading: false, active: false });
            }
        };

        if (productId) {
            fetchStatus();
        } else {
            setStatus({ loading: false, active: false });
        }
    }, [productId]);

    // Handle Perspective/View switching
    const ensureBoundary = (targetCanvas = canvas) => {
        if (!targetCanvas) return;
        const exists = targetCanvas.getObjects().find(o => o.id === 'print-boundary');
        if (!exists) {
            const rect = new fabric.Rect({
                left: 154, top: 90, 
                width: 290, height: 420,
                fill: 'transparent',
                stroke: '#6366f1', strokeDashArray: [5, 5], strokeWidth: 1.5,
                selectable: false, evented: false,
                id: 'print-boundary'
            });
            targetCanvas.add(rect);
            rect.sendToBack();
        }
    };

    const handleViewSwitch = async (newView) => {
        if (!canvas || newView === activeView) return;

        // 1. Snapshot current design (both JSON and High-Quality Composite)
        const oldView = activeView;
        const currentJson = canvas.toJSON(['id', 'selectable']);
        const currentImage = productImages[oldView];
        
        // Hide boundary for clean snapshot
        const boundary = canvas.getObjects().find(o => o.id === 'print-boundary');
        if (boundary) boundary.set({ opacity: 0 });
        canvas.renderAll();
        
        // Capture with Backdrop for realism
        let compositeSnapshot = '';
        try {
            if (currentImage) {
                await new Promise((resolve) => {
                    fabric.Image.fromURL(currentImage, (img) => {
                        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                        img.set({
                            scaleX: scale,
                            scaleY: scale,
                            left: (canvas.width - img.width * scale) / 2,
                            top: (canvas.height - img.height * scale) / 2,
                            selectable: false
                        });
                        canvas.add(img);
                        img.sendToBack();
                        canvas.renderAll();
                        
                        compositeSnapshot = canvas.toDataURL({ format: 'png', multiplier: 1 });
                        
                        canvas.remove(img);
                        resolve();
                    }, { crossOrigin: 'anonymous' });
                    setTimeout(resolve, 2000); // Fail-safe
                });
            } else {
                compositeSnapshot = canvas.toDataURL({ format: 'png', multiplier: 1 });
            }
        } catch (err) {
            compositeSnapshot = canvas.toDataURL({ format: 'png', multiplier: 1 });
        }
        
        if (boundary) boundary.set({ opacity: 1 });
        canvas.renderAll();

        // 2. Clear canvas objects (except boundary)
        canvas.getObjects().forEach(o => {
            if (o.id !== 'print-boundary') canvas.remove(o);
        });

        // 3. Update state with both JSON and snapshot
        setViewDesigns(prev => {
            const updated = { ...prev, [oldView]: { json: currentJson, preview: compositeSnapshot } };
            
            // 4. Load the target design if it exists
            const nextSide = updated[newView];
            if (nextSide && nextSide.json) {
                canvas.loadFromJSON(nextSide.json, () => {
                    ensureBoundary();
                    canvas.renderAll();
                });
            } else {
                ensureBoundary(); 
                canvas.renderAll();
            }
            return updated;
        });

        setActiveView(newView);
    };

    // Fetch Assets dynamically (Fonts, Shapes, etc.)
    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const configUrl = window.appConfig?.appUrl;
                // Detect if running on localhost/test or need tunnel
                const finalAppUrl = configUrl || "https://print-on-demand.test";
                
                console.log("Fetching assets from:", `${finalAppUrl}/api/design/assets`);
                
                const res = await axios.get(`${finalAppUrl}/api/design/assets`);
                if (res.data?.success) {
                    setAssets(res.data);
                } else {
                    console.error("Failed to load assets: JSON success false");
                }
            } catch (err) { 
                console.error("Asset API Connection Error:", err.message);
                // Fallback attempt to current origin if on tunnel
                if (window.location.hostname.includes('ngrok') || window.location.hostname.includes('valet')) {
                     // try local relative
                }
            }
        };
        fetchAssets();
    }, []);

    // Get current product images from Theme
    useEffect(() => {
        if (isDesignerOpen) {
            const allImgs = Array.from(document.querySelectorAll('.product__media img, .product-single__photo, img.gallery__image'));
            if (allImgs.length > 0) {
                setProductImages({
                    front: allImgs[0].src,
                    back: allImgs.length > 1 ? allImgs[1].src : allImgs[0].src
                });
            }
        }
    }, [isDesignerOpen]);

    // Canvas init
    useEffect(() => {
        if (isDesignerOpen && canvasRef.current && !canvas) {
            const initCanvas = new fabric.Canvas(canvasRef.current, {
                width: 600,
                height: 700,
                backgroundColor: 'transparent',
            });

            // Boundary
            ensureBoundary(initCanvas);
            setCanvas(initCanvas);

            // Events
            const syncLayers = () => {
                setLayers(initCanvas.getObjects().filter(o => o.id !== 'print-boundary').reverse());
            };

            initCanvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
            initCanvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
            initCanvas.on('selection:cleared', () => setSelectedObject(null));
            
            initCanvas.on('object:added', syncLayers);
            initCanvas.on('object:removed', syncLayers);

            setCanvas(initCanvas);
        }

        return () => {
            if (!isDesignerOpen && canvas) {
                canvas.dispose();
                setCanvas(null);
            }
        };
    }, [isDesignerOpen]);

    // Handle property sync
    useEffect(() => {
        if (selectedObject) {
            setObjProps({
                text: selectedObject.text || '',
                color: selectedObject.fill || '#000000',
                fontSize: selectedObject.fontSize || 24,
                fontFamily: selectedObject.fontFamily || 'Inter',
                opacity: selectedObject.opacity || 1,
                angle: selectedObject.angle || 0,
            });
        }
    }, [selectedObject]);

    const handleAddClipart = (url) => {
        if (!canvas) return;
        fabric.Image.fromURL(url, (img) => {
            img.scaleToWidth(150);
            img.set({
                left: 150, top: 150,
                cornerColor: '#4f46e5', borderColor: '#4f46e5',
                cornerSize: 10, transparentCorners: false,
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        }, { crossOrigin: 'anonymous' });
    };

    const handleFlip = (direction) => {
        if (!selectedObject || !canvas) return;
        if (direction === 'h') selectedObject.set('flipX', !selectedObject.flipX);
        else selectedObject.set('flipY', !selectedObject.flipY);
        canvas.renderAll();
    };

    const handleAddText = (font = 'Inter') => {
        if (!canvas) return;
        
        // Load font before adding text
        WebFont.load({
            google: { families: [font] },
            active: () => {
                const text = new fabric.IText('Add text here', {
                    left: 200, top: 200,
                    fontSize: 40,
                    fill: objProps.color || '#000000',
                    fontFamily: font,
                    cornerColor: '#6366f1', borderColor: '#6366f1',
                    cornerSize: 10, transparentCorners: false,
                });
                canvas.add(text);
                if (text.controls.deleteControl) {
                     // ensure custom controls set up
                }
                canvas.setActiveObject(text);
                canvas.requestRenderAll();
            }
        });
    };

    const handleAlignCenter = () => {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
            activeObj.centerH();
            canvas.renderAll();
        }
    };

    const handleAlignMiddle = () => {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
            activeObj.centerV();
            canvas.renderAll();
        }
    };

    const updateObjectProp = (prop, value) => {
        if (!selectedObject) return;
        selectedObject.set(prop, value);
        canvas.renderAll();
        setObjProps(prev => ({ ...prev, [prop]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            const data = f.target.result;
            fabric.Image.fromURL(data, (img) => {
                if (img.width > 250) img.scaleToWidth(250);
                img.set({
                    left: 125, top: 150,
                    cornerColor: '#4f46e5', borderColor: '#4f46e5',
                    cornerSize: 12, transparentCorners: false,
                });
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const deleteSelected = () => {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.type !== 'rect') {
            canvas.remove(activeObj);
        }
    };

    const handleSaveAndAddToCart = async () => {
        if (!canvas) return;
        setIsSaving(true);

        try {
            // Hide boundary for clean export
            const boundary = canvas.getObjects().find(o => o.id === 'print-boundary');
            if (boundary) boundary.set({ opacity: 0 });
            canvas.renderAll();

            // 1. Capture a high-quality composite preview including the product
            const currentProductImage = productImages[activeView];
            let dataUrl = '';
            try {
                if (currentProductImage) {
                    await new Promise((resolve, reject) => {
                        fabric.Image.fromURL(currentProductImage, (img) => {
                            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                            img.set({
                                scaleX: scale,
                                scaleY: scale,
                                left: (canvas.width - img.width * scale) / 2,
                                top: (canvas.height - img.height * scale) / 2,
                                selectable: false
                            });
                            canvas.add(img);
                            img.sendToBack();
                            canvas.renderAll();
                            resolve();
                        }, { crossOrigin: 'anonymous' });
                        setTimeout(() => reject(new Error("Image Timeout")), 5000);
                    });
                }
                dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
            } catch (canvasErr) {
                console.warn("Canvas Composite Failed (CORS?), falling back to design-only export:", canvasErr);
                // Fallback: Remove product and try export again
                const allObjects = canvas.getObjects();
                const bgImg = allObjects.find(o => o.type === 'image' && o.src === currentProductImage);
                if (bgImg) canvas.remove(bgImg);
                dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
            }
            if (boundary) boundary.set({ opacity: 1 });
            canvas.renderAll();

            // 2. Gather all design states for BOTH sides
            const currentJson = canvas.toJSON(['id', 'selectable']);
            const finalDesigns = { 
                ...viewDesigns, 
                [activeView]: { json: currentJson, preview: dataUrl } 
            };

            const appUrl = (window.appConfig && window.appConfig.appUrl) || "https://print-on-demand.test";
            const formData = new FormData();
            formData.append('product_id', productId);
            formData.append('product_title', productTitle || '');
            formData.append('shop_domain', shopUrl || '');
            
            // Upload current side
            const blob = await (await fetch(dataUrl)).blob();
            formData.append(`image_${activeView}`, blob, `${activeView}.png`);
            
            // Upload other side if it was designed
            const otherView = activeView === 'front' ? 'back' : 'front';
            if (viewDesigns[otherView] && viewDesigns[otherView].preview) {
                const otherBlob = await (await fetch(viewDesigns[otherView].preview)).blob();
                formData.append(`image_${otherView}`, otherBlob, `${otherView}.png`);
            }

            formData.append('design_data', JSON.stringify({
                version: '1.7',
                designs: finalDesigns,
                last_view: activeView
            }));

            const res = await axios.post(`${appUrl}/api/design`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // 3. Prepare Cart Properties
            const previews = res.data?.previews || {};
            const cartProperties = { '_design_id': res.data?.design?.id };
            if (previews.image_front) cartProperties['Front Design'] = previews.image_front;
            if (previews.image_back) cartProperties['Back Design'] = previews.image_back;
            
            if (!previews.image_front && !previews.image_back) {
                cartProperties['Custom Design'] = res.data?.design?.design_image_url || dataUrl;
            }

            // 4. Add to cart via Shopify AJAX API
            const variantInput = document.querySelector('input[name="id"]');
            const qtyInput = document.querySelector('input[name="quantity"]') || { value: 1 };
            const variantId = variantInput ? variantInput.value : null;

            if (variantId) {
                await fetch(window.Shopify.routes.root + 'cart/add.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: [{
                            id: parseInt(variantId),
                            quantity: parseInt(qtyInput.value),
                            properties: cartProperties
                        }]
                    })
                });

                // Trigger theme minicart
                document.dispatchEvent(new CustomEvent('cart:updated'));
                window.location.href = '/cart';
            } else {
                alert("Please select a valid variant first.");
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Unknown error";
            alert(`Error saving design: ${msg}. Please check your connection.`);
        } finally {
            setIsSaving(false);
            setIsDesignerOpen(false);
        }
    };

    if (status.loading || !status.active) return null;

    return (
        <>
            <button className="custom-designer-btn" onClick={(e) => { e.preventDefault(); setIsDesignerOpen(true); }}>
                ✨ Customize Design
            </button>

            {isDesignerOpen && createPortal(
                <>
                    <div className="designer-modal-overlay" onClick={() => setIsDesignerOpen(false)}></div>
                    <div className="designer-modal">
                        <button className="btn-icon-close" onClick={() => setIsDesignerOpen(false)}>✕</button>

                        <div className="designer-header">
                            <h2>Custom Studio Design</h2>
                        </div>

                        <div className="designer-layout">
                            <div className="designer-category-sidebar">
                                <button className={`category-btn ${activeCategory === 'upload' ? 'is-active' : ''}`} onClick={() => setActiveCategory('upload')}>
                                    <div className="category-item-icon">📂</div> Upload
                                </button>
                                <button className={`category-btn ${activeCategory === 'text' ? 'is-active' : ''}`} onClick={() => setActiveCategory('text')}>
                                    <div className="category-item-icon">✍️</div> Add text
                                </button>
                                <button className={`category-btn ${activeCategory === 'clipart' ? 'is-active' : ''}`} onClick={() => setActiveCategory('clipart')}>
                                    <div className="category-item-icon">🎨</div> Graphics
                                </button>
                                <button className={`category-btn ${activeCategory === 'templates' ? 'is-active' : ''}`} onClick={() => setActiveCategory('templates')}>
                                    <div className="category-item-icon">💎</div> Templates
                                </button>
                                <button className={`category-btn ${activeCategory === 'layers' ? 'is-active' : ''}`} onClick={() => setActiveCategory('layers')}>
                                    <div className="category-item-icon">📁</div> Layers
                                </button>
                            </div>

                            <div className="designer-toolbar">
                                <div className="tool-section" style={{ paddingTop: 0 }}>
                                    {activeCategory === 'upload' && (
                                        <div className="tool-group">
                                            <h3 style={{ margin: '20px 0 16px', fontSize: '18px' }}>Upload</h3>
                                            <p className="subtitle">Upload high-quality PNG or JPG files.</p>
                                            <label className="btn-secondary">
                                                Upload Artwork
                                                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                            </label>
                                        </div>
                                    )}

                                    {activeCategory === 'text' && (
                                        <>
                                            <div className="font-search-container">
                                                <h3 style={{ margin: '20px 0 16px', fontSize: '18px' }}>Add text</h3>
                                                <input type="text" className="input-ctrl" 
                                                       placeholder="🔍 Search for fonts" 
                                                       value={fontSearch}
                                                       onChange={(e) => setFontSearch(e.target.value)} />
                                            </div>

                                            <div className="font-category-chips">
                                                {['All', 'Display', 'Handwriting', 'Monospace', 'Serif'].map(cat => (
                                                    <div key={cat} 
                                                         className={`category-chip ${activeFontCategory === cat ? 'is-active' : ''}`}
                                                         onClick={() => setActiveFontCategory(cat)}>
                                                        {cat}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="tool-group">
                                                <h3 style={{ textTransform: 'none', fontSize: '15px' }}>Fonts</h3>
                                                <div className="font-list">
                                                    {assets.fonts
                                                     .filter(f => activeFontCategory === 'All' || f.category === activeFontCategory)
                                                     .filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase()))
                                                     .map(font => (
                                                        <div key={font.id} className="font-list-item" onClick={() => {
                                                            if (selectedObject && selectedObject.type === 'i-text') {
                                                                updateObjectProp('fontFamily', font.content);
                                                            } else {
                                                                handleAddText(font.content);
                                                            }
                                                        }}>
                                                            <span style={{ fontFamily: font.content }}>{font.name}</span>
                                                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>∨</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeCategory === 'clipart' && (
                                        <>
                                            {Object.entries(assets.graphics).map(([catName, items]) => (
                                                <div key={catName} className="tool-group">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                        <h3 style={{ textTransform: 'none', fontSize: '18px', margin: 0 }}>{catName}</h3>
                                                        <span style={{ fontSize: '13px', color: '#6366f1', cursor: 'pointer' }}>+ Show more</span>
                                                    </div>
                                                    <div className="clipart-grid">
                                                        {items.map((item) => (
                                                            <div key={item.id} className="clipart-item" onClick={() => handleAddClipart(item.content)}>
                                                                <img src={item.content} alt={item.name} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {activeCategory === 'templates' && (
                                        <div className="tool-group">
                                            <h3 style={{ margin: '20px 0 16px', fontSize: '18px' }}>Quick Designs</h3>
                                            <div className="templates-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                                {Object.values(assets.presets).flat().filter(p => p.category !== 'Curved Text').map((tpl) => (
                                                    <div key={tpl.id} className="quick-design-card" 
                                                         style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
                                                         onClick={() => handleAddClipart(tpl.content)}>
                                                        <img src={tpl.content} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{tpl.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeCategory === 'layers' && (
                                        <div className="tool-group">
                                            <h3 style={{ margin: '20px 0 16px', fontSize: '18px' }}>Layers</h3>
                                            {layers.length === 0 ? (
                                                <p className="subtitle">No layers added yet.</p>
                                            ) : (
                                                layers.map((layer, idx) => (
                                                    <div key={idx} 
                                                         className={`layer-item ${selectedObject === layer ? 'is-selected' : ''}`}
                                                         onClick={() => { canvas.setActiveObject(layer); canvas.requestRenderAll(); }}>
                                                        <span>{layer.text ? (layer.text.substring(0, 15) + '...') : 'Image'}</span>
                                                        <span className="layer-type">{layer.type}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {selectedObject && (
                                        <div className="property-group">
                                            <div className="tool-group" style={{ marginBottom: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Selection Settings</h3>
                                                    <button className="btn-small" onClick={deleteSelected} style={{ padding: '6px 12px', borderColor: '#fee2e2', color: '#ef4444' }}>
                                                        Delete
                                                    </button>
                                                </div>

                                                {selectedObject.type === 'i-text' && (
                                                    <>
                                                        <label className="label-sm">Content</label>
                                                        <textarea className="input-ctrl" 
                                                                  rows={3}
                                                                  style={{ minHeight: '80px', resize: 'vertical' }}
                                                                  value={objProps.text} 
                                                                  onChange={(e) => updateObjectProp('text', e.target.value)} />
                                                        
                                                        <label className="label-sm">Font Family</label>
                                                        <select className="input-ctrl" 
                                                                value={objProps.fontFamily} 
                                                                onChange={(e) => updateObjectProp('fontFamily', e.target.value)}>
                                                            <option value="Inter">Inter</option>
                                                            {assets.fonts.map(f => <option key={f.id} value={f.content}>{f.name}</option>)}
                                                        </select>
                                                    </>
                                                )}

                                                <label className="label-sm">Appearance</label>
                                                <div className="control-row">
                                                    <div>
                                                        <label className="label-sm" style={{ fontSize: '10px', color: '#94a3b8' }}>Color</label>
                                                        <input type="color" className="input-ctrl" 
                                                               style={{ height: '44px', padding: '4px', cursor: 'pointer' }}
                                                               value={objProps.color} 
                                                               onChange={(e) => updateObjectProp('fill', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="label-sm" style={{ fontSize: '10px', color: '#94a3b8' }}>Rotation</label>
                                                        <input type="number" className="input-ctrl" 
                                                               style={{ height: '44px' }}
                                                               value={Math.round(objProps.angle)} 
                                                               onChange={(e) => updateObjectProp('angle', parseInt(e.target.value))} />
                                                    </div>
                                                </div>

                                                <label className="label-sm">Opacity ({Math.round(objProps.opacity * 100)}%)</label>
                                                <div style={{ marginBottom: '24px', padding: '0 4px' }}>
                                                    <input type="range" min="0" max="1" step="0.01" 
                                                           value={objProps.opacity} 
                                                           onChange={(e) => updateObjectProp('opacity', parseFloat(e.target.value))} />
                                                </div>

                                                <label className="label-sm">Manipulation</label>
                                                <div className="align-btn-group">
                                                    <button className="btn-small" onClick={() => handleFlip('h')}>Flip H</button>
                                                    <button className="btn-small" onClick={() => handleFlip('v')}>Flip V</button>
                                                    <button className="btn-small" onClick={handleAlignCenter}>⇎ Center</button>
                                                    <button className="btn-small" onClick={handleAlignMiddle}>⇕ Middle</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="designer-canvas-wrapper" style={{ flexDirection: 'column' }}>
                                <div className="tshirt-backdrop" style={{
                                    backgroundImage: `url(${productImages[activeView] || ''})`
                                }}>
                                    <canvas ref={canvasRef}></canvas>
                                </div>
                            </div>
                        </div>

                        <div className="designer-footer">
                            <div className="view-switcher">
                                <button className={`view-btn ${activeView === 'front' ? 'is-active' : ''}`} onClick={() => handleViewSwitch('front')}>Front View</button>
                                <button className={`view-btn ${activeView === 'back' ? 'is-active' : ''}`} onClick={() => handleViewSwitch('back')}>Back View</button>
                            </div>

                            <div className="footer-actions">
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Price</span>
                                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>$50.00</span>
                                </div>
                                <button className="btn-primary" 
                                        onClick={handleSaveAndAddToCart} 
                                        disabled={isSaving}
                                        style={{ width: '200px', padding: '14px 28px' }}>
                                    {isSaving ? 'Processing...' : 'Add To Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
});

export default ThemeDesigner;

// Shopify extension mount point
const container = document.getElementById('designer-extension-root');
if (container) {
    const root = createRoot(container);
    root.render(
        <ThemeDesigner
            productId={container.dataset.productId}
            productTitle={container.dataset.productTitle}
            shopUrl={container.dataset.shopUrl}
        />
    );
}
