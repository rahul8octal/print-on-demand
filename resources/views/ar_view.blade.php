<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AR View</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
    <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>

    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f6f6f7;
        }

        .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            height: 100dvh;
            /* Use dynamic viewport height for mobile browsers */
            position: relative;
            overflow: hidden;
            /* Prevent scrolling */
        }

        model-viewer {
            width: 100%;
            height: 100%;
            background-color: #ffffff;
            --poster-color: #ffffff;
        }

        /* Top Header Icons */
        .header-bar {
            position: absolute;
            top: 10px;
            top: max(10px, env(safe-area-inset-top) + 10px);
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            padding: 0 16px;
            z-index: 10000;
            pointer-events: none;
        }

        .icon-button {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #5f6368;
            pointer-events: auto;
        }

        .icon-button svg {
            width: 24px;
            height: 24px;
        }

        .icon-button:active {
            background-color: rgba(0, 0, 0, 0.05);
        }

        /* Custom AR Button (Google Style) */
        .ar-button {
            background-color: white;
            border-radius: 24px;
            /* Pill shape */
            border: 1px solid #dadce0;
            position: absolute;
            bottom: 110px;
            /* Moved up to make room for banner */
            bottom: max(110px, env(safe-area-inset-bottom) + 90px);
            left: 50%;
            transform: translateX(-50%);
            padding: 0 24px;
            height: 48px;
            font-family: "Google Sans", Roboto, Arial, sans-serif;
            font-weight: 500;
            font-size: 14px;
            box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #1a73e8;
            /* Google Blue */
            z-index: 10000;
            white-space: nowrap;
        }

        .ar-button:active {
            background-color: #f1f3f4;
            box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
        }

        .ar-button svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
        }

        /* Bottom Banner Style */
        .bottom-banner {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 16px 24px;
            padding-bottom: max(16px, env(safe-area-inset-bottom));
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
            z-index: 10001;
            font-family: "Google Sans", Roboto, Arial, sans-serif;
        }

        .banner-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow: hidden;
        }

        .banner-title {
            font-size: 16px;
            font-weight: 500;
            color: #202124;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .banner-subtitle {
            font-size: 13px;
            color: #70757a;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .visit-button {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 18px;
            font-weight: 500;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
            text-decoration: none;
            flex-shrink: 0;
            margin-left: 16px;
        }

        .visit-button:hover {
            background-color: #1765cc;
        }
    </style>
</head>

<body>
    <div class="container">
        @php
            $isGlb = str_contains(strtolower($modelUrl), '.glb') || str_contains(strtolower($modelUrl), '.gltf');
        @endphp

        <div id="loading-overlay"
            style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: white; z-index: 1000;">
            <div class="spinner"
                style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1a73e8; border-radius: 50%; animation: spin 1s linear infinite;">
            </div>
        </div>

        <style>
            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }

                100% {
                    transform: rotate(360deg);
                }
            }
        </style>

        @if($isGlb)
            @php
               $isMetal = ($product->product_type ?? '') === 'metal';
           @endphp

              <model-viewer id="main-viewer" src="{{ $modelUrl }}" alt="3D Model" ar ar-modes="webxr scene-viewer quick-look"
                ar-placement="floor" ar-scale="auto" camera-controls auto-rotate interaction-prompt="auto"
                interaction-prompt-style="wiggle" enable-pan shadow-intensity="1.5" shadow-softness="0.5" autoplay
                 environment-image="{{ asset('textures/potsdamer_platz_1k.hdr') }}" exposure="1.0" tone-mapping="neutral" style="width: 100%; height: 100%; touch-action: none;">
                <button slot="ar-button" class="ar-button" id="ar-button">
                    <svg viewBox="0 0 24 24">
                        <path
                            d="M19 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1M7 21l-4-4m0 4l4-4M17 3l4 4m0-4l-4 4" />
                    </svg>
                    View in your space
                </button>
            </model-viewer>

            @php
                $displayTitle = request()->get('product_name') ?? ($product->title ?? '3D Product');
                $storeUrl = request()->get('store_url') ?? (isset($product->user) ? 'https://' . $product->user->name : '#');
                $domain = parse_url($storeUrl, PHP_URL_HOST) ?? $storeUrl;
            @endphp

            @if(!request()->is('ar/demo/*'))
                <div class="bottom-banner">
                    <div class="banner-info">
                        <h1 class="banner-title">{{ $displayTitle }}</h1>
                        <p class="banner-subtitle">{{ $domain }}</p>
                    </div>
                    <a href="{{ $storeUrl }}" class="visit-button">Visit</a>
                </div>
            @endif
        @else
            <div id="unsupported-msg"
                style="text-align: center; padding: 20px; z-index: 1001; position: relative; background: white; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%;">
                <h2 style="color: #5f6368;">AR Not Supported</h2>
                <p style="color: #5f6368; max-width: 300px; margin: 0 auto 20px;">
                    This product format is not compatible with direct mobile AR. Please use a GLB model for
                    AR functionality.
                </p>
                @if(!$modelUrl)
                    <p style="color: red;">Warning: Model URL is empty!</p>
                @endif
                <button onclick="handleBack()"
                    style="color: #1a73e8; background: transparent; cursor: pointer; font-weight: 500; border: 1px solid #1a73e8; padding: 10px 20px; border-radius: 4px;">Go
                    Back</button>
            </div>
            <script>document.getElementById('loading-overlay').style.display = 'none';</script>
        @endif

        <script>
            const viewer = document.getElementById('main-viewer');
            const overlay = document.getElementById('loading-overlay');

            function handleBack() {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = "/";
                }
            }

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const isAndroid = /Android/i.test(navigator.userAgent);
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

            // Ensure absolute model URL
            let modelUrl = "{{ $modelUrl }}";
            if (modelUrl && !modelUrl.startsWith('http')) {
                const url = new URL(modelUrl, window.location.origin);
                modelUrl = url.href;
            }


            let modelLoaded = false;
            let modelError = false;
            const productType = "{{ $product->product_type ?? 'furniture' }}";

            function hexToRgba(hex) {
                hex = hex.replace('#', '');
                if (hex.length === 3) {
                    hex = hex.split('').map(char => char + char).join('');
                }

                const srgbToLinear = (c) => {
                    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
                };

                const r = srgbToLinear(parseInt(hex.substring(0, 2), 16) / 255);
                const g = srgbToLinear(parseInt(hex.substring(2, 4), 16) / 255);
                const b = srgbToLinear(parseInt(hex.substring(4, 6), 16) / 255);

                return [r, g, b, 1.0];
            }

            function applyColors() {
                if (!viewer || !viewer.model) return;

                const decodeConfig = (encodedStr) => {
                    try {
                        return decodeURIComponent(escape(atob(encodedStr)));
                    } catch (e) {
                        return encodedStr;
                    }
                };

                let searchParams = new URLSearchParams(window.location.search);
                const variant = searchParams.get('v');
                if (variant) {
                    const decoded = decodeConfig(variant);
                    const variantParams = new URLSearchParams(decoded);
                    variantParams.forEach((v, k) => {
                        searchParams.append(k, v);
                    });
                }

                searchParams.forEach((value, key) => {
                    if (key.startsWith('c_')) {
                        const targetName = key.replace('c_', '').toLowerCase().trim();
                        const color = hexToRgba(value);

                        viewer.model.materials.forEach(material => {
                            const matName = (material.name || "").toLowerCase().trim();
                            if (matName === targetName) {
                                material.pbrMetallicRoughness.setBaseColorFactor(color);
                                // Clear texture to ensure color is visible
                                if (material.pbrMetallicRoughness.baseColorTexture) {
                                    material.pbrMetallicRoughness.baseColorTexture.setTexture(null);
                                }
                            }
                        });
                    }
                });
            }

            if (viewer) {
                viewer.addEventListener('load', () => {
                    modelLoaded = true;
                    overlay.style.display = 'none';
                    applyColors();
                });

                viewer.addEventListener('error', (e) => {
                    console.error('Error loading model:', e);
                    modelError = true;
                    overlay.innerHTML = '<div style="color: red; padding: 20px; text-align: center; z-index: 1005; background: white; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;"><h2>Error loading 3D model</h2><br><button onclick="handleBack()" style="color: #1a73e8; background: transparent; cursor: pointer; border: 1px solid #1a73e8; padding: 10px 20px; border-radius: 4px;">Go Back</button></div>';
                });

                setTimeout(() => {
                    if (!modelLoaded && !modelError && overlay.style.display !== 'none') {
                        overlay.style.display = 'none';
                    }
                }, 10000);
            }

            const arButton = document.getElementById('ar-button');
            if (arButton && viewer) {
                arButton.addEventListener('click', async (e) => {
                    e.preventDefault();

                    if (isIOS) {
                        const originalText = arButton.innerText;
                        arButton.innerText = "Opening AR...";

                        try {
                            // Export current state to GLB blob
                            const blob = await viewer.exportScene({ binary: true });
                            const url = URL.createObjectURL(blob);

                            // Swap src temporarily
                            const originalSrc = viewer.src;
                            viewer.src = url;

                            // Give it a moment to process the src change
                            await new Promise(resolve => setTimeout(resolve, 150));

                            viewer.activateAR();

                            // Restore original src after a delay
                            setTimeout(() => {
                                viewer.src = originalSrc;
                                arButton.innerText = originalText;
                            }, 3000);
                            return;
                        } catch (err) {
                            console.error("AR Export failed:", err);
                        }
                    }

                    const hasCustomizations = window.location.search.includes('c_') || window.location.search.includes('v=');

                    if (isAndroid && !hasCustomizations) {
                        triggerAndroidAR();
                    } else {
                        viewer.activateAR();
                    }
                });
            }

            function triggerAndroidAR() {
                let secureModelUrl = modelUrl;
                if (secureModelUrl.startsWith('http://')) {
                    secureModelUrl = secureModelUrl.replace('http://', 'https://');
                }

                const title = "{{ $displayTitle }}";
                const link = "{{ $storeUrl }}";

                const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(secureModelUrl)}&title=${encodeURIComponent(title)}&link=${encodeURIComponent(link)}&resizable=true&mode=ar_preferred&enable_ar_scaling=true&initial_rescale=true#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(link)};end;`;

                window.location.href = intentUrl;
            }
        </script>
    </div>
</body>

</html>