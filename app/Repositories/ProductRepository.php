<?php

namespace App\Repositories;

use App\Interfaces\ProductRepositoryInterface;
use App\Models\Product;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;

class ProductRepository implements ProductRepositoryInterface
{

    public function all()
    {
        $products = Product::ofShop(AuthId())->get();

        return $products;
    }


    public function store($input)
    {
        $shopId = Auth::id();
        $shop = User::find($shopId);
        $plan = $shop->plan ?? null;

        // Check plan limits
        $isPro = $plan && str($plan->slug ?? '')->lower() === 'pro';
        // Default to 0 limit if no plan and no override
        $limit = $plan->product_limit ?? $shop->product_limit ?? 0;

        if (!$isPro) {
            $currentCount = Product::ofShop($shopId)->count();
            if ($currentCount >= $limit) {
                throw new Exception("You have reached your plan's product limit. Please upgrade to add more products.");
            }
        }

        try {
            $input['user_id'] = Auth::id();

            $product = Product::create($input);

            // Handle media storage from request, provided file object, or provided path
            if (isset($input['model_file']) && $input['model_file'] instanceof \Illuminate\Http\UploadedFile) {
                $product->addMedia($input['model_file'])->toMediaCollection(Product::MEDIA, config('app.media_disc'));
            } elseif (isset($input['model_path']) && file_exists($input['model_path'])) {
                $product->addMedia($input['model_path'])->toMediaCollection(Product::MEDIA, config('app.media_disc'));
            } elseif (request()->hasFile('model')) {
                $product->addMediaFromRequest('model')->toMediaCollection(Product::MEDIA, config('app.media_disc'));
            }

            return $product;
        } catch (Exception $exception) {
            throw new Exception($exception->getMessage());
        }
    }

    public function read($id)
    {
        return Product::ofShop(AuthId())->with('user')->findOrFail($id);
    }

    public function update($id, $input)
    {

        $product = Product::ofShop(AuthId())->findOrFail($id);

        $data = $input instanceof \Illuminate\Http\Request ? $input->all() : $input;
        $product->update($data);

        // Replace model if new one uploaded
        if (($input instanceof \Illuminate\Http\Request && $input->hasFile('model')) || request()->hasFile('model')) {

            // Remove old model
            $product->clearMediaCollection(Product::MEDIA);

            // Upload new model
            $product->addMediaFromRequest('model')
                ->toMediaCollection(Product::MEDIA, config('app.media_disc'));
        }
        return $product;
    }

    public function delete($id)
    {
        $product = Product::ofShop(AuthId())->findOrFail($id);

        if ($product->shopify_file_id) {
            $shop = $product->user;
            if ($shop) {
                $query = <<<'GQL'
                mutation fileDelete($fileIds: [ID!]!) {
                  fileDelete(fileIds: $fileIds) {
                    deletedFileIds
                    userErrors {
                      field
                      message
                    }
                  }
                }
                GQL;

                $variables = [
                    'fileIds' => [$product->shopify_file_id]
                ];

                try {
                    $shop->api()->graph($query, $variables);
                } catch (Exception $e) {
                    \Illuminate\Support\Facades\Log::info($e->getMessage());
                }
            }
        }

        $product->clearMediaCollection(Product::MEDIA);

        $product->delete();

        return true;
    }

    public function updateStatus($id)
    {
        $product = Product::ofShop(AuthId())->findOrFail($id);

        $product->update([
            'is_active' => !$product->is_active,
        ]);

        return true;
    }

    public function getModel($input)
    {
        $this->enforceProductLimitForShop(AuthId());

        $getModel = Product::ofShop(AuthId())
            ->with('user')
            ->where('product_id', $input['product_id'])
            ->where('is_active', true)
            ->first();

        if (!$getModel) {
            return null;
        }

        return $getModel;
    }

    /**
     * Disable products beyond the plan limit for the given shop.
     */
    public function enforceProductLimitForShop($shopId): void
    {
        if (!$shopId) {
            return;
        }

        $shop = User::find($shopId);
        if (!$shop) {
            return;
        }

        $plan = $shop->plan ?? null;

        // No limit for Pro plan; skip enforcement
        if ($plan && str($plan->slug ?? '')->lower() === 'pro') {
            return;
        }

        $limit = $plan->product_limit ?? $shop->product_limit ?? 0;

        // If limit is 0, we ENFORCE it (deactivate all).
        if ($limit < 0) {
            return;
        }

        $products = Product::ofShop($shopId)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        foreach ($products as $index => $product) {
            if ($index >= $limit && $product->is_active) {
                $product->update(['is_active' => false]);
            }
        }
    }
}
