import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { createRoot } from 'react-dom/client';
import { fabric } from 'fabric';
import axios from 'axios';

// Styles directly injected into the storefront (Theme Extension)
const styles = `
.custom-designer-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 12px 24px;
    border-radius: 999px;
    border: 1px solid #4f46e5;
    background: #4f46e5;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    margin-bottom: 16px;
}
.custom-designer-btn:hover {
    background: #4338ca;
}
.custom-designer-btn.is-disabled {
    pointer-events: none;
    opacity: 0.6;
}

.designer-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    animation: fadeIn 0.3s ease-out;
}

.designer-modal {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    width: 95%; max-width: 1100px;
    height: 90vh; max-height: 800px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex; flex-direction: column; overflow: hidden;
    animation: slideUp 0.3s ease-out;
    position: relative;
}

.designer-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex; justify-content: space-between; align-items: center;
    background: white;
}

.designer-header h2 { margin: 0; font-size: 20px; color: #111827; }

.designer-layout {
    display: flex; flex: 1; overflow: hidden;
}

.designer-toolbar {
    width: 320px;
    background: #f9fafb;
    border-right: 1px solid #e5e7eb;
    padding: 24px;
    display: flex; flex-direction: column;
    overflow-y: auto;
}

.designer-canvas-wrapper {
    flex: 1;
    display: flex; align-items: center; justify-content: center;
    background: #f3f4f6;
    position: relative;
    overflow: hidden;
}

.tshirt-backdrop {
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    width: 500px;
    height: 600px;
    position: relative;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    background-color: white;
}

.btn-secondary {
    display: inline-block; width: 100%;
    padding: 10px; border-radius: 8px;
    background: #fff; border: 1px solid #d1d5db;
    cursor: pointer; text-align: center;
    font-weight: 500; font-size: 14px;
    transition: all 0.2s;
    margin-bottom: 12px;
}
.btn-secondary:hover { background: #f3f4f6; }

.btn-danger {
    display: inline-block; width: 100%;
    padding: 10px; border-radius: 8px;
    background: #fee2e2; border: 1px solid #fecaca;
    color: #dc2626; cursor: pointer; text-align: center;
    font-weight: 500; font-size: 14px;
    transition: all 0.2s;
}
.btn-danger:hover { background: #fecaca; }

.btn-primary {
    display: inline-block; width: 100%;
    padding: 14px; border-radius: 8px;
    background: #4f46e5; border: none;
    color: #fff; cursor: pointer; text-align: center;
    font-weight: 600; font-size: 16px;
    transition: all 0.2s;
    margin-top: 16px;
}
.btn-primary:hover { background: #4338ca; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-icon {
    background: transparent; border: none; cursor: pointer;
    font-size: 20px; color: #6b7280; padding: 4px; border-radius: 50%;
}
.btn-icon:hover { background: #f3f4f6; color: #111827; }

.tool-group { margin-bottom: 24px; }
.tool-group h3 { font-size: 16px; margin: 0 0 8px 0; color: #111827; }
.subtitle { font-size: 14px; color: #6b7280; margin: 0 0 16px 0; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

const injectStyles = () => {
    if (!document.getElementById("designer-styles")) {
        const style = document.createElement("style");
        style.id = "designer-styles";
        style.innerHTML = styles;
        document.head.appendChild(style);
    }
};

const ThemeDesigner = memo(({ productId, shopUrl }) => {
    const [status, setStatus] = useState({ loading: true, active: false });
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);

    const canvasRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [productImage, setProductImage] = useState(null);

    injectStyles();

    // Fetch whether this product is POD customizable
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Determine API base url from the injected script or environment
                const appUrl = (window.appConfig && window.appConfig.appUrl) || "https://print-on-demand.test";
                // Get configured POD products
                const response = await axios.get(`${appUrl}/api/pod/catalog`);
                if (response.data?.success) {
                    const podIds = response.data.ids || [];
                    // Shopify theme 'product.id' comes as a number or string
                    if (podIds.includes(parseInt(productId, 10)) || podIds.includes(`gid://shopify/Product/${productId}`)) {
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

    // Get current selected variant image from Theme (hacky DOM reading on storefronts)
    useEffect(() => {
        if (isDesignerOpen) {
            const imgEl = document.querySelector('.product__media img') || document.querySelector('.product-single__photo') || document.querySelector('img.gallery__image');
            if (imgEl && imgEl.src) {
                setProductImage(imgEl.src);
            }
        }
    }, [isDesignerOpen]);

    // Canvas init
    useEffect(() => {
        if (isDesignerOpen && canvasRef.current && !canvas) {
            const initCanvas = new fabric.Canvas(canvasRef.current, {
                width: 500,
                height: 600,
                backgroundColor: 'transparent',
            });

            // Simulated T-Shirt print area boundary
            const printBoundary = new fabric.Rect({
                left: 100, top: 100, width: 300, height: 400,
                fill: 'transparent', stroke: '#4f46e5', strokeWidth: 2,
                strokeDashArray: [10, 5], selectable: false, evented: false,
            });
            initCanvas.add(printBoundary);
            setCanvas(initCanvas);
        }

        return () => {
            if (!isDesignerOpen && canvas) {
                canvas.dispose();
                setCanvas(null);
            }
        };
    }, [isDesignerOpen]);

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
            // Hide boundary
            const objects = canvas.getObjects();
            const boundary = objects.find(o => o.type === 'rect' && !o.selectable);
            if (boundary) boundary.set({ opacity: 0 });
            canvas.renderAll();

            const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });

            // Restore boundary
            if (boundary) boundary.set({ opacity: 1 });
            canvas.renderAll();

            // Store design temporarily by making API call to our app backend
            const blob = await (await fetch(dataUrl)).blob();
            const formData = new FormData();
            formData.append('image', blob, 'design.png');
            formData.append('product_id', productId);
            formData.append('shop_domain', shopUrl || '');

            const appUrl = (window.appConfig && window.appConfig.appUrl) || "https://print-on-demand.test";

            // Make dummy call to get design saved and create property in cart
            const res = await axios.post(`${appUrl}/api/design`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const designUrl = res.data?.design?.design_image_url || 'Custom Design Generated';

            // Add to cart via Shopify AJAX API
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
                            properties: {
                                '💡 Custom Design': designUrl,
                            }
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
            alert("Error saving design. Please try again.");
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

            {isDesignerOpen && (
                <>
                    <div className="designer-modal-overlay" onClick={() => setIsDesignerOpen(false)}></div>
                    <div className="designer-modal" style={{ zIndex: 9999999, position: 'fixed', top: '5vh', left: '2.5vw' }}>

                        <div className="designer-header">
                            <h2>Studio Designer</h2>
                            <button className="btn-icon" onClick={() => setIsDesignerOpen(false)}>✕</button>
                        </div>

                        <div className="designer-layout">

                            <div className="designer-toolbar">
                                <div className="tool-group">
                                    <h3>Tools</h3>
                                    <p className="subtitle">Upload artwork to the print area.</p>
                                    <label className="btn-secondary">
                                        Upload Artwork (PNG/JPG)
                                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                    </label>
                                </div>

                                <div className="tool-group">
                                    <button className="btn-danger" onClick={deleteSelected}>Delete Selected</button>
                                </div>

                                <div className="tool-group" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                    <button className="btn-primary" onClick={handleSaveAndAddToCart} disabled={isSaving}>
                                        {isSaving ? 'Saving & Adding...' : 'Add To Cart'}
                                    </button>
                                </div>
                            </div>

                            <div className="designer-canvas-wrapper">
                                <div className="tshirt-backdrop" style={{
                                    backgroundImage: `url(${productImage || ''})`
                                }}>
                                    <canvas ref={canvasRef}></canvas>
                                </div>
                            </div>

                        </div>
                    </div>
                </>
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
            shopUrl={container.dataset.shopUrl}
        />
    );
}
