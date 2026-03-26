<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\CustomDesign;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CustomDesignController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->get('query');
        $status = $request->get('status');
        
        $designs = CustomDesign::select('id', 'user_id', 'product_id', 'product_title', 'status', 'design_image_url', 'created_at')
            ->with('user')
            ->when($query, function($q) use ($query) {
                return $q->where('product_id', 'like', "%{$query}%");
            })
            ->when($status, function($q) use ($status) {
                return $q->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(3);
            
        return response()->json([
            'success' => true, 
            'data' => $designs->items(),
            'pagination' => [
                'current_page' => $designs->currentPage(),
                'last_page' => $designs->lastPage(),
                'total' => $designs->total(),
                'per_page' => $designs->perPage(),
                'has_next' => $designs->hasMorePages(),
                'has_prev' => !$designs->onFirstPage(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'shop_domain' => 'required|string',
            'product_id' => 'required|string',
            'design_data' => 'required',
        ]);

        $shop = User::where('name', '=', $request->shop_domain)->firstOrFail();
        
        // Handle multiple design images if provided (Front/Back)
        $imageUrls = [];
        foreach(['image', 'image_front', 'image_back'] as $key) {
            if ($request->hasFile($key)) {
                $path = $request->file($key)->store('designs', 'public');
                $imageUrls[$key] = asset(Storage::url($path));
            }
        }

        $designData = $request->design_data;
        if (is_string($designData)) {
            $designData = json_decode($designData, true);
        }

        $design = CustomDesign::create([
            'user_id' => $shop->id,
            'product_id' => $request->product_id,
            'product_title' => $request->product_title,
            'design_data' => $designData,
            'design_image_url' => $imageUrls['image'] ?? $imageUrls['image_front'] ?? $imageUrls['image_back'] ?? '',
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'design' => $design,
            'previews' => $imageUrls
        ]);
    }

    public function show($id)
    {
        $design = CustomDesign::findOrFail($id);

        return response()->json([
            'success' => true,
            'design' => $design,
        ]);
    }

    public function generateDownloadToken($id)
    {
        $design = CustomDesign::findOrFail($id);
        $token = Str::random(40);
        
        // Save to cache for 2 minutes
        Cache::put('design_download_' . $token, $id, 120);
        
        return response()->json([
            'success' => true,
            'token' => $token,
            'endpoint' => '/api/design/' . $id . '/download?token=' . $token
        ]);
    }

    public function downloadZip(Request $request, $id)
    {
        $token = $request->get('token');
        if (!$token || Cache::get('design_download_' . $token) != $id) {
             return response()->json(['success' => false, 'message' => 'Invalid or expired download token'], 403);
        }
        
        // Consume token
        Cache::forget('design_download_' . $token);

        $design = CustomDesign::findOrFail($id);
        $data = $design->design_data;
        if (is_string($data)) {
            $data = json_decode($data, true);
        }

        if (!isset($data['designs'])) {
             return response()->json(['success' => false, 'message' => 'No design data found'], 404);
        }

        $zip = new \ZipArchive();
        $zipName = 'design-' . $id . '-' . time() . '.zip';
        $zipPath = storage_path('app/public/' . $zipName);

        if ($zip->open($zipPath, \ZipArchive::CREATE) !== TRUE) {
            return response()->json(['success' => false, 'message' => 'Could not create ZIP'], 500);
        }

        // Add metadata
        $metadata = [
            'design_id' => $id,
            'product_id' => $design->product_id,
            'user_id' => $design->user_id,
            'created_at' => (string) $design->created_at,
            'version' => $data['version'] ?? 'unknown',
        ];
        $zip->addFromString('metadata.json', json_encode($metadata, JSON_PRETTY_PRINT));

        foreach ($data['designs'] as $side => $sideData) {
            $sideDir = $side . '/';
            $zip->addEmptyDir($side);
            $zip->addEmptyDir($sideDir . 'assets');
            
            // 1. Final composed design (preview)
            if (isset($sideData['preview']) && !empty($sideData['preview'])) {
                $previewData = $sideData['preview'];
                if (str_contains($previewData, 'base64,')) {
                    $previewDataArr = explode('base64,', $previewData);
                    if (count($previewDataArr) > 1) {
                         $zip->addFromString($sideDir . 'composed_output.png', base64_decode($previewDataArr[1]));
                    }
                }
            }

            // 2. Asset extraction from Fabric JSON
            if (isset($sideData['json']) && !empty($sideData['json'])) {
                $fabricJson = $sideData['json'];
                $zip->addFromString($sideDir . 'fabric_design.json', json_encode($fabricJson, JSON_PRETTY_PRINT));
                
                $objects = $fabricJson['objects'] ?? [];
                $imageIdx = 1;
                foreach ($objects as $obj) {
                    if (isset($obj['type']) && $obj['type'] === 'image' && isset($obj['src'])) {
                        $src = $obj['src'];
                        if (str_contains($src, 'data:image')) {
                            $extension = 'png';
                            if (str_contains($src, 'image/jpeg')) $extension = 'jpg';
                            
                            $base64DataArr = explode('base64,', $src);
                            if (count($base64DataArr) > 1) {
                                $zip->addFromString($sideDir . 'assets/user_upload_' . $imageIdx . '.' . $extension, base64_decode($base64DataArr[1]));
                                $imageIdx++;
                            }
                        }
                    }
                }
            }
        }

        $zip->close();

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
}
