import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import Product3DView from './Product3DView';
import { QRCodeSVG } from 'qrcode.react';

/* Styles (move to CSS file in production) */
const styles = `
.view3d-btn {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 8px 18px 8px 8px;
    border-radius: 999px;
    border: 1px solid #cfd6ff;
    background: #fff;
    color: #000;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.view3d-btn:hover {
    background: #f6f8ff;
}

.view3d-btn.is-loading {
    pointer-events: none;
    opacity: 0.6;
}

.view3d-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
}

.view3d-icon svg {
    width: 18px;
    height: 18px;
    fill: #fff;
}

.view3d-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000;
    animation: fadeIn 0.3s ease-out;
}

.view3d-modal-container {
    background: #fff;
    border-radius: 20px;
    width: 95%;
    max-width: 1000px;
    height: 90vh;
    max-height: 700px;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
}

.view3d-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.view3d-modal-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.view3d-main-panel {
    flex: 1;
    background: #f9fafb;
    position: relative;
    display: flex;
    flex-direction: column;
}

.view3d-side-panel {
    width: 340px;
    border-left: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    background: #fff;
}

.view3d-options-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.view3d-modal-close {
    cursor: pointer;
    background: #f3f4f6;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.view3d-modal-close:hover {
    background: #e5e7eb;
}

.view3d-modal-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin: 0;
}

.view3d-viewer-container {
    flex: 1;
    width: 100%;
}

.view3d-option-group {
    margin-bottom: 24px;
}

.view3d-option-label {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
}

.view3d-option-name {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.view3d-option-selected {
    font-size: 13px;
    color: #6b7280;
    font-weight: 400;
}

.view3d-color-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.view3d-color-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    border: 2px solid transparent;
    transition: all 0.2s;
    padding: 2px;
    background-clip: content-box;
}

.view3d-color-circle.is-active {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px #fff inset;
}

.view3d-color-circle:hover {
    transform: scale(1.1);
}

.view3d-qr-footer {
    padding: 20px;
    border-top: 1px solid #f3f4f6;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.view3d-qr-text {
    font-size: 12px;
    color: #6b7280;
    text-align: center;
    line-height: 1.4;
}

.view3d-mobile-ar-btn {
    width: 100%;
    padding: 16px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 12px;
    fontWeight: 600;
    font-size: 16px;
    cursor: pointer;
    margin-top: auto;
}

@media (max-width: 768px) {
    .view3d-modal-content {
        flex-direction: column;
    }
    .view3d-side-panel {
        width: 100%;
        height: auto;
        border-left: none;
        border-top: 1px solid #f3f4f6;
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.view3d-qr-card {
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
}

.view3d-mobile-action-btn {
    width: 100%;
    background: #008060;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 24px;
    transition: background 0.2s;
}

.view3d-mobile-action-btn:hover {
    background: #006e52;
}

.view3d-qr-caption {
    font-size: 13px;
    color: #6d7175;
    text-align: center;
    margin-bottom: 32px;
}

.view3d-info-box {
    background: #f6f6f7;
    border-radius: 12px;
    padding: 16px;
    text-align: left;
}

.view3d-info-title {
    font-size: 13px;
    font-weight: 700;
    color: #202223;
    margin-bottom: 8px;
    display: block;
}

.view3d-info-text {
    font-size: 12px;
    color: #6d7175;
    line-height: 1.5;
    margin: 0;
}

.view3d-viewer-controls {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    z-index: 10;
}

.view3d-control-btn {
    pointer-events: auto;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
}

.view3d-control-btn:hover {
    background: #f9fafb;
    transform: translateY(-1px);
}

.view3d-control-btn.is-active {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
}

.view3d-control-btn svg {
    width: 16px;
    height: 16px;
}
`;

/* Inject styles once */
const injectStyles = () => {
    if (!document.getElementById("view3d-styles")) {
        const style = document.createElement("style");
        style.id = "view3d-styles";
        style.innerHTML = styles;
        document.head.appendChild(style);
    }
};

const ThemePreview = memo(({ productId, shopId }) => {
    const [status, setStatus] = useState({ loading: true, active: false, data: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDimensions, setShowDimensions] = useState(false);
    const [isAutoRotate, setIsAutoRotate] = useState(true);
    const [productType, setProductType] = useState('furniture');
    const modelViewerRef = useRef(null);

    injectStyles();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const appUrl = process.env.MIX_APP_URL || "";
                if (!appUrl) {
                    console.error("MIX_APP_URL is not defined");
                    setStatus({ loading: false, active: false, data: null });
                    return;
                }
                const response = await axios.post(`${appUrl}/api/product/model`, {
                    product_id: productId
                });
                const data = response.data?.data;
                setProductType(data?.product_type || 'furniture');

                setStatus({
                    loading: false,
                    active: !!(data && data.is_active),
                    data: data
                });
            } catch (error) {
                console.error("Error fetching product status:", error);
                setStatus({ loading: false, active: false, data: null });
            }
        };

        if (productId) {
            fetchStatus();
        } else {
            setStatus({ loading: false, active: false, data: null });
        }
    }, [productId]);

    const handleARClick = () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);
        const appBaseUrl = process.env.MIX_APP_URL || "";

        if (isMobile) {
            if (isAndroid && status.data?.model_url) {
                let secureModelUrl = status.data.model_url;
                if (secureModelUrl.startsWith('http://')) {
                    secureModelUrl = secureModelUrl.replace('http://', 'https://');
                }
                const title = status.data.shopify_details?.title || "3D Product";
                const link = window.location.href;
                const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(secureModelUrl)}&title=${encodeURIComponent(title)}&link=${encodeURIComponent(link)}&resizable=true&mode=ar_preferred&enable_ar_scaling=true&initial_rescale=true#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(link)};end;`;
                window.location.href = intentUrl;
            } else {
                window.location.href = `${appBaseUrl}/ar/${productId}`;
            }
        } else {
            setIsModalOpen(true);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const qrData = useMemo(() => {
        if (!status.data) return "";
        const appBaseUrl = process.env.MIX_APP_URL || "";
        return `${appBaseUrl}/ar/${productId}`;
    }, [status.data, productId]);

    if (status.loading || !status.active) return null;

    return (
        <>
            <button
                id="hello_btn"
                className="view3d-btn"
                onClick={handleARClick}
            >
                <span className="view3d-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2L3 6.5v11L12 22l9-4.5v-11L12 2zm0 2.2l6.5 3.2L12 10.6 5.5 7.4 12 4.2zm-7 5.5L11 13v7.1L5 17.6V9.7zm14 0v7.9l-6 2.5V13l6-3.3z" />
                    </svg>
                </span>
                3D AR Viewer
            </button>

            {isModalOpen && (
                <div className="view3d-modal-overlay" onClick={handleModalClose}>
                    <div className="view3d-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="view3d-modal-header">
                            <h2 className="view3d-modal-title">
                                {status.data?.shopify_details?.title || "3D Product Viewer"}
                            </h2>
                            <button className="view3d-modal-close" onClick={handleModalClose}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="view3d-modal-content">
                            <div className="view3d-main-panel">
                                <div className="view3d-viewer-container">
                                    <Product3DView
                                        modelUrl={status.data?.model_url}
                                        height="100%"
                                        isPreviewMode={true}
                                        isAutoRotate={isAutoRotate}
                                        showDimensions={showDimensions}
                                        width={status.data?.width}
                                        height_dim={status.data?.height}
                                        depth={status.data?.depth}
                                        productType={productType}
                                        dimension_unit={status.data?.dimension_unit}
                                    />
                                    <div className="view3d-viewer-controls">
                                        <button
                                            className={`view3d-control-btn ${showDimensions ? 'is-active' : ''}`}
                                            onClick={() => setShowDimensions(!showDimensions)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M7 10v4M17 10v4M21 12H3" />
                                            </svg>
                                            Dimensions
                                        </button>
                                        <button
                                            className={`view3d-control-btn ${isAutoRotate ? 'is-active' : ''}`}
                                            onClick={() => setIsAutoRotate(!isAutoRotate)}
                                        >
                                            Rotation product
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                                <polyline points="21 3 21 8 16 8" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="view3d-side-panel" style={{ width: '360px' }}>
                                <div className="view3d-options-scroll" style={{ padding: '32px 28px' }}>
                                    <div className="view3d-qr-card">
                                        <QRCodeSVG value={qrData} size={200} level="H" />
                                    </div>

                                    <button
                                        className="view3d-mobile-action-btn"
                                        onClick={() => qrData && window.open(qrData, '_blank')}
                                    >
                                        View on Mobile
                                    </button>

                                    <p className="view3d-qr-caption">Scan this QR code with your phone's camera</p>

                                    <div className="view3d-info-box">
                                        <span className="view3d-info-title">What is AR?</span>
                                        <p className="view3d-info-text">
                                            Augmented Reality (AR) enhances our real world by overlaying computer-generated digital content, like images, sounds, or text, onto our physical surroundings, creating interactive experiences.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

export default ThemePreview;

/* Shopify extension mount */
const container = document.getElementById('ar-extension-root');

if (container) {
    const root = createRoot(container);

    root.render(
        <ThemePreview
            productId={container.dataset.productId}
            shopId={container.dataset.shopId}
        />
    );
}
