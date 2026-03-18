<?php

namespace App\Http\Controllers;

use App\Exceptions\UnprocessableInputException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TestController extends Controller
{
    public function importProducts(Request $request)
    {
        /** @var \App\Models\User $shop */
        $shop = Auth::user();
        $apiVersion = config('shopify-app.api_version');
        
        $response = $shop->api()->rest('GET', "/admin/api/{$apiVersion}/products.json", ["limit" => 250]);

        if ($response['errors']) {
            $errorMessage = is_string($response['body']) ? $response['body'] : json_encode($response['body']);
            throw new UnprocessableInputException('Shopify API Error: ' . $errorMessage, 401);
        }

        $products = @$response['body']->container['products'];

        return $this->sendResponse($products, "Product retrieved successfully");
    }
}
