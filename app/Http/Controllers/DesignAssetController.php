<?php

namespace App\Http\Controllers;

use App\Models\DesignAsset;
use Illuminate\Http\Request;

class DesignAssetController extends Controller
{
    public function index()
    {
        $assets = DesignAsset::where('status', true)->get();
        
        // Group by type first, then category
        $fonts = $assets->where('type', 'font')->values();
        $graphics = $assets->where('type', 'graphic')->groupBy('category');
        $presets = $assets->where('type', 'preset')->groupBy('category');

        return response()->json([
            'success' => true,
            'fonts' => $fonts,
            'graphics' => $graphics,
            'presets' => $presets
        ]);
    }
}
