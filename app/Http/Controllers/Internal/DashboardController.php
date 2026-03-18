<?php

namespace App\Http\Controllers\Internal;

use App\Helpers\ShopifyHelper;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ShopifyService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();

        $liveThemeId = $dynamicLoginAppBlockEnabled = $dynamicLoginAppBlockApiToken = $dynamicLoginAppBlockApiConfigured = false;
        $appPreviewBlockEnabled = false;

        $productCount = Product::where('user_id', $shop->id)->count();

        try {
            $dynamicLoginAppBlock = $this->getShopThemeExtensionData(
                $shop,
                trim(config('shopify-app.theme_extension_id'))
            );

            $liveThemeId = data_get($dynamicLoginAppBlock, 'liveThemeId');

            if (data_get($dynamicLoginAppBlock, 'type')) {
                $dynamicLoginAppBlockEnabled = !data_get($dynamicLoginAppBlock, 'disabled', false);
            }

            // Check for 3D-app Preview block (app block)
            $appPreviewBlock = $this->getShopThemeExtensionData(
                $shop,
                'AR-preview'
            );

            if (data_get($appPreviewBlock, 'type')) {
                $appPreviewBlockEnabled = !data_get($appPreviewBlock, 'disabled', false);
            }

        } catch (\Throwable $e) {
            info("DASHBOARD_ERROR: " . $e->getMessage());
            report($e);
        }
        return preparedResponse([
            'liveThemeId' => $liveThemeId,
            'frontEndLoginHelperEnabled' => $dynamicLoginAppBlockEnabled,
            'frontEndLoginHelperApiConfigured' => $dynamicLoginAppBlockApiConfigured,
            'themeExtensionId' => trim(config('shopify-app.theme_extension_id')),
            'appPreviewBlockEnabled' => $appPreviewBlockEnabled,
            'currentTab' => $shop->current_tab,
            'productCount' => $productCount
        ]);
    }

    public function getShopThemeExtensionData($shop, $appSearchTarget)
    {
        $shopifyService = new ShopifyService($shop);

        $response = $shopifyService->getThemes(
            'first: 1, roles: [MAIN]',
            'first: 5, filenames: ["config/settings_data.json", "templates/product.json"]',
        );

        $theme = data_get($response, 'body.data.themes.edges.0.node') ?: [];
        $files = collect(data_get($theme, 'files.nodes') ?: []);

        $settingsDataFile = $files->firstWhere('filename', 'config/settings_data.json');
        $productJsonFile = $files->firstWhere('filename', 'templates/product.json');

        $settingsBlocks = [];
        $sectionBlocks = [];

        // Process settings_data.json (for App Embeds)
        if ($settingsDataFile) {
            $content = data_get($settingsDataFile, 'body.content');
            $schemaData = ShopifyHelper::prepareThemeSchemaFileJson($content);
            $settingsBlocks = data_get($schemaData, 'current.blocks') ?: [];
        }

        // Process templates/product.json (for App Blocks in sections)
        if ($productJsonFile) {
            $content = data_get($productJsonFile, 'body.content');
            $productData = ShopifyHelper::prepareThemeSchemaFileJson($content);
            $sections = data_get($productData, 'sections') ?: [];

            foreach ($sections as $section) {
                $sectionBlocks = array_merge($sectionBlocks, data_get($section, 'blocks') ?: []);
            }
        }


        $appThemeExtensionBlock = null;
        $searchTarget = trim($appSearchTarget);

        if ($searchTarget === 'AR-preview') {
            // Search only in Section Blocks (App Blocks)
            foreach ($sectionBlocks as $appBlock) {
                $type = data_get($appBlock, 'type') ?: "";
                if (str($type)->contains('AR-preview')) {
                    $appThemeExtensionBlock = $appBlock;
                    break;
                }
            }
        } else {
            // Search only in Settings Blocks (App Embeds)
            // Strict match for App Embed UUID to match the toggle
            foreach ($settingsBlocks as $appBlock) {
                $type = data_get($appBlock, 'type') ?: "";
                if ($searchTarget && str($type)->contains($searchTarget)) {
                    $appThemeExtensionBlock = $appBlock;
                    break;
                }
            }
        }

        // Ensure we return an array even if empty, but preserve keys if found
        if (!$appThemeExtensionBlock) {
            $appThemeExtensionBlock = [];
        }

        $appThemeExtensionBlock['liveThemeId'] = getResourceId(data_get($theme, 'id'));
        return $appThemeExtensionBlock;
    }

    public function updateCurrentTab(Request $request)
    {
        $request->validate([
            'current_tab' => 'required'
        ]);

        $shop = $request->user();
        $shop->update([
            'current_tab' => $request->current_tab
        ]);

        return preparedResponse([
            'message' => 'Current tab updated successfully',
            'current_tab' => $shop->current_tab
        ]);
    }
}
