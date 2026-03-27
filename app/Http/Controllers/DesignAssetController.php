<?php

namespace App\Http\Controllers;

use App\Models\DesignAsset;
use Illuminate\Http\Request;

class DesignAssetController extends Controller
{
    public function index()
    {
        $assets = DesignAsset::where('status', true)->get();
        
        $assets->each(function($asset) {
            if (str_ends_with($asset->content, '.svg')) {
                $path = public_path($asset->content);
                if (file_exists($path)) {
                    $asset->content_raw = file_get_contents($path);
                }
            }
        });

        // Group by type first, then category
        $fonts = $assets->where('type', 'font')->values();
        $elements = $assets->where('type', 'element')->groupBy('category');
        $presets = $assets->where('type', 'preset')->groupBy('category');

        return response()->json([
            'success' => true,
            'fonts' => $fonts,
            'elements' => $elements,
            'presets' => $presets
        ]);
    }
}
