<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\CustomDesign;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CustomDesignController extends Controller
{
    public function index(Request $request)
    {
        $designs = CustomDesign::with('user')->orderBy('created_at', 'desc')->paginate(20);
        return response()->json(['success' => true, 'data' => $designs]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'shop_domain' => 'required|string',
            'product_id' => 'required|string',
            'design_data' => 'required|array',
            'image' => 'required|image|max:10240', // Max 10MB
        ]);

        // Find the shop (User)
        $shop = User::where('name', '=', $request->shop_domain)->firstOrFail();

        // Save the PNG design file to active storage disk
        $path = $request->file('image')->store('designs', 'public');
        $imageUrl = Storage::url($path);

        $design = CustomDesign::create([
            'user_id' => $shop->id,
            'product_id' => $request->product_id,
            'design_data' => $request->design_data,
            'design_image_url' => asset($imageUrl),
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'design' => $design,
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

    public function sync(Request $request, $id)
    {
        $design = CustomDesign::with('user')->findOrFail($id);
        
        // In a real scenario, you would link the design to an ACTUAL Shopify Order.
        // For this manual sync demo/UI, we construct a bridge to PrintfulService.
        $printful = new \App\Services\PrintfulService($design->user);
        
        // Mock order data if the design isn't linked to a real Shopify Order ID yet
        // In POD Studio, the Design URL is what links them in the webhook.
        $mockOrder = (object)[
            'id' => 'MANUAL-' . $design->id,
            'email' => 'customer@example.com',
            'shipping_address' => (object)[
                'name' => 'Demo Customer',
                'address1' => '123 Print St',
                'city' => 'Chatsworth',
                'province_code' => 'CA',
                'country_code' => 'US',
                'zip' => '91311'
            ]
        ];

        $podItems = [[
            'variant_id' => $design->product_id, // Or a mapped variant
            'quantity' => 1,
            'design_url' => $design->design_image_url
        ]];

        $result = $printful->createOrder($mockOrder, $podItems);

        if ($result) {
            $design->update(['status' => 'processing']);
            return response()->json(['success' => true, 'message' => 'Successfully pushed to Printful']);
        }

        return response()->json(['success' => false, 'message' => 'Failed to push to Printful. check logs.'], 500);
    }
}
