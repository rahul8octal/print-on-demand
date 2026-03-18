<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanFeatureSeeder extends Seeder
{
    /**
     * Seed default plans with their associated features.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('feature_plan')->truncate();
        DB::table('features')->truncate();
        DB::table('plans')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $featuresData = [
            // Generic features
            [
                'name' => 'Products',
                'slug' => 'configure-3d-product',
                'type' => 'text',
                'display_order' => 1,
                'hidden_feature' => false,
            ],
            [
                'name' => 'Upload & Manage 3D Product Models',
                'slug' => '3d-configurator',
                'type' => 'bool',
                'display_order' => 4,
                'hidden_feature' => false,
            ],
            [
                'name' => 'Real-Time 3D Viewer',
                'slug' => '3d-viewer',
                'type' => 'bool',
                'display_order' => 5,
                'hidden_feature' => false,
            ],
            [
                'name' => 'AR Preview (Augmented Reality)',
                'slug' => 'augmented-reality',
                'type' => 'bool',
                'display_order' => 6,
                'hidden_feature' => false,
            ],
            [
                'name' => 'Integration support',
                'slug' => 'integration-support',
                'type' => 'bool',
                'display_order' => 7,
                'hidden_feature' => false,
            ],
        ];

        $featureModels = [];
        foreach ($featuresData as $featureData) {
            $feature = Feature::create($featureData);
            $featureModels[$feature->slug] = $feature;
        }

        $plansData = [
            [
                'type' => 'RECURRING',
                'name' => 'Starter Plan',
                'slug' => 'free',
                'description' => 'et started with 3D product visualization and showcase your products in an interactive way.',
                'public' => true,
                'price' => 0.00,
                'interval' => null,
                'capped_amount' => 0,
                'terms' => '',
                'trial_days' => 0,
                'test' => true,
                'on_install' => true,
                'discount' => null,
                'product_limit' => 2,
            ],
            [
                'type' => 'RECURRING',
                'name' => 'Growth Plan',
                'slug' => 'unlimited',
                'description' => 'Scale your store with unlimited 3D models and immersive product experiences',
                'public' => true,
                'price' => 34.99,
                'interval' => null,
                'capped_amount' => 0,
                'terms' => '',
                'trial_days' => 0,
                'test' => true,
                'on_install' => false,
                'product_limit' => 10000,
                'discount' => [
                    'amount' => 10,
                ],
            ],
        ];

        $planFeatureMap = [
            'free' => [
                ['slug' => 'configure-3d-product', 'value' => '2 Products'],
                ['slug' => '3d-configurator', 'value' => 1],
                ['slug' => '3d-viewer', 'value' => 1],
                ['slug' => 'augmented-reality', 'value' => 1],
                ['slug' => 'integration-support', 'value' => 1],
            ],
            'unlimited' => [
                ['slug' => 'configure-3d-product', 'value' => 'UNLIMITED Products'],
                ['slug' => '3d-configurator', 'value' => 1],
                ['slug' => '3d-viewer', 'value' => 1],
                ['slug' => 'augmented-reality', 'value' => 1],
                ['slug' => 'integration-support', 'value' => 1],
            ],
        ];

        foreach ($plansData as $planData) {
            $plan = Plan::create($planData);

            foreach ($planFeatureMap[$plan->slug] ?? [] as $featureData) {
                $feature = $featureModels[$featureData['slug']] ?? null;

                if (!$feature) {
                    continue;
                }

                $plan->features()->attach($feature->id, ['value' => $featureData['value']]);
            }
        }

        cache()->forget('plans.public.normalized');
        Plan::pluck('id')->each(function ($planId) {
            cache()->forget("plans.assigned.{$planId}");
        });
    }
}
