<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PrintfulService
{
    protected string $apiUrl = 'https://api.printful.com';
    protected ?string $apiKey;
    protected ?\App\Models\User $shop;

    public function __construct(?\App\Models\User $shop = null)
    {
        $this->shop = $shop;
        
        if ($shop) {
             // Try to get from settings table: group='pod', key='printful_api_key'
             $setting = \App\Models\Setting::where('user_id', $shop->id)
                ->where('group', 'pod')
                ->where('key', 'printful_api_key')
                ->first();
             
             $this->apiKey = $setting->value ?? env('PRINTFUL_API_KEY');
        } else {
             $this->apiKey = env('PRINTFUL_API_KEY');
        }
    }

    /**
     * Create a new order in Printful based on Shopify Order
     *
     * @param \stdClass $shopifyOrder
     * @param array $podItems List of format: [['variant_id' => 123, 'quantity' => 1, 'design_url' => '...']]
     * @return array|bool
     */
    public function createOrder(\stdClass $shopifyOrder, array $podItems)
    {
        if (empty($this->apiKey)) {
            Log::warning('Printful API Key is not configured. Skipping POD order creation.');
            return false;
        }

        $shipping = $shopifyOrder->shipping_address ?? null;
        if (!$shipping) {
            Log::error("Cannot create Printful order: missing shipping address for Shopify Order #{$shopifyOrder->id}");
            return false;
        }

        $items = [];
        foreach ($podItems as $item) {
            // Mapping Shopify Variant to Printful: In a production app, you might have a mapping table.
            // For this flow, we assume the variant_id or external_id is correctly set or mapped.
            $items[] = [
                'external_variant_id' => (string) $item['variant_id'],
                'quantity' => (int) $item['quantity'],
                'files' => [
                    [
                        'url' => (string) $item['design_url'],
                        'position' => 'front', // Default to front placement
                    ]
                ]
            ];
        }

        $name = $shipping->name ?? (($shipping->first_name ?? '') . ' ' . ($shipping->last_name ?? ''));

        $payload = [
            'external_id' => (string) $shopifyOrder->id,
            'shipping' => 'STANDARD',
            'recipient' => [
                'name' => trim($name),
                'address1' => $shipping->address1 ?? '',
                'address2' => $shipping->address2 ?? '',
                'city' => $shipping->city ?? '',
                'state_code' => $shipping->province_code ?? '',
                'country_code' => $shipping->country_code ?? '',
                'zip' => $shipping->zip ?? '',
                'phone' => $shipping->phone ?? '',
                'email' => $shopifyOrder->email ?? '',
            ],
            'items' => $items,
        ];

        try {
            $response = Http::withToken($this->apiKey)
                ->post("{$this->apiUrl}/orders", $payload);

            if ($response->successful()) {
                Log::info("Printful order successfully created for Shopify Order #{$shopifyOrder->id}");
                return $response->json();
            } else {
                Log::error("Printful API Error for Order #{$shopifyOrder->id}: " . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Exception when creating Printful order #{$shopifyOrder->id}: " . $e->getMessage());
            return false;
        }
    }
}
