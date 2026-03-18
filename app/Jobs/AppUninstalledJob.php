<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\WebVital;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Actions\CancelCurrentPlan;
use Osiset\ShopifyApp\Contracts\Commands\Shop as IShopCommand;
use Osiset\ShopifyApp\Contracts\Queries\Shop as IShopQuery;
use Osiset\ShopifyApp\Messaging\Events\AppUninstalledEvent;
use Osiset\ShopifyApp\Objects\Values\ShopDomain;

class AppUninstalledJob extends \Osiset\ShopifyApp\Messaging\Jobs\AppUninstalledJob
{
    /**
     * Execute the job.
     *
     * @param IShopCommand      $shopCommand             The commands for shops.
     * @param IShopQuery        $shopQuery               The querier for shops.
     * @param CancelCurrentPlan $cancelCurrentPlanAction The action for cancelling the current plan.
     *
     * @return bool
     */
    public function handle(
        IShopCommand $shopCommand,
        IShopQuery $shopQuery,
        CancelCurrentPlan $cancelCurrentPlanAction
    ): bool {
        // Convert the domain
        $domain = ShopDomain::fromNative($this->domain);
        $shopDomain = $domain->toNative();

        Log::info("App uninstalled for shop: {$shopDomain}. Performing hard delete of all data.");

        // Get the shop
        $shop = $shopQuery->getByDomain($domain);
        if (!$shop) {
            return true;
        }
        $shopId = $shop->getId();

        // 1. Get the eloquent model for deletions
        $shopModel = User::find($shopId->toNative());

        if ($shopModel) {
            $shopIdNative = $shopId->toNative();

            // 1. Delete Charges explicitly from database just in case relationship is bugged
            try {
                \DB::table('charges')->where('user_id', $shopIdNative)->delete();
            } catch (\Exception $e) {
                Log::error("Failed to delete charges via DB: " . $e->getMessage());
            }

            // 2. Hard delete product related data
            try {
                $shopModel->products()->each(function ($product) {
                    $product->clearMediaCollection($product::MEDIA);
                    $product->forceDelete(); // Use forceDelete to bypass soft deletes if any
                });
            } catch (\Exception $e) {
                Log::error("Failed to delete products: " . $e->getMessage());
            }

            // 4. Delete Settings
            try {
                $shopModel->settings()->delete();
            } catch (\Exception $e) {
                Log::error("Failed settings delete: " . $e->getMessage());
            }

            // 5. Delete Web Vitals
            try {
                WebVital::where('shop', $shopDomain)->delete();
            } catch (\Exception $e) {
                Log::error("Failed web vitals delete: " . $e->getMessage());
            }

            // 6. Clear shop cache
            \Illuminate\Support\Facades\Cache::forget("shop_{$shopDomain}");

            // 7. Cancel plan and clean token using package actions
            try {
                $cancelCurrentPlanAction($shopId);
                $shopCommand->clean($shopId);
            } catch (\Exception $e) {
                Log::error("Package cleanup failed: " . $e->getMessage());
            }

            // 8. Finally hard delete the shop itself
            $shopModel->forceDelete();

            event(new AppUninstalledEvent($shop));
        }

        return true;
    }
}
