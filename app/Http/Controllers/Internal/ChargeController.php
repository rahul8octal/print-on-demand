<?php

namespace App\Http\Controllers\Internal;

use App\Models\Plan;
use App\Models\User;
use App\Services\ShopifyService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Osiset\ShopifyApp\Objects\Values\ShopDomain;
use Osiset\ShopifyApp\Services\ChargeHelper;
use Osiset\ShopifyApp\Util;

class ChargeController extends Controller
{

    protected $chargeHelper;

    public function __construct(ChargeHelper $chargeHelper)
    {
        $this->chargeHelper = $chargeHelper;
    }

    public function index(Request $request, $planId)
    {
        $shop = User::where('name', $request->query('shop'))->first();
        if (!$shop) {
            $shop = $request->user();
        }

        $host = urldecode($request->get('host'));

        if (!$shop) {
            return response()->json(['error' => 'Shop not found'], 404);
        }

        $plan = Plan::find($planId);
        if (!$plan) {
            return response()->json(['error' => 'Plan not found'], 404);
        }

        $chargeData = $this->getPlanUrl(
            $shop,
            $plan,
            $host
        );

        $url = $chargeData['confirmationUrl'] ?? null;

        if ($request->ajax() || $request->expectsJson() || $request->header('Accept') == 'application/json') {
            return response()->json([
                'url' => $url,
                'errors' => $chargeData['userErrors'] ?? []
            ]);
        }


        // Do a fullpage redirect
        if (!$url) {
            return response()->json(['error' => 'Failed to create charge', 'details' => $chargeData['userErrors'] ?? []], 400);
        }

        return View::make(
            'shopify-app::billing.fullpage_redirect',
            [
                'url' => $url,
                'host' => $host,
                'locale' => $request->get('locale'),
                'apiKey' => Util::getShopifyConfig('api_key', ShopDomain::fromNative($request->get('shop') ?? $shop->name)),
            ]
        );
    }

    public function getPlanUrl($shop, $plan, $host)
    {
        $planDetails = $this->chargeHelper->details($plan, $shop, $host);

        if ($planDetails) {
            $planDetails = $planDetails->toArray();
        }

        if ($plan->discount) {
            $planDetails['discount'] = $plan->discount['amount'];
        }

        return $this->createChargeQuery($shop, $planDetails);
    }


    public function createChargeQuery($shop, $payload)
    {
        $query = '
        mutation appSubscriptionCreate(
            $name: String!,
            $returnUrl: URL!,
            $trialDays: Int,
            $test: Boolean,
            $lineItems: [AppSubscriptionLineItemInput!]!
        ) {
            appSubscriptionCreate(
                name: $name,
                returnUrl: $returnUrl,
                trialDays: $trialDays,
                test: $test,
                lineItems: $lineItems
            ) {
                appSubscription {
                    id
                }
                confirmationUrl
                userErrors {
                    field
                    message
                }
            }
        }
        ';

        // Ensure interval has a default value if missing
        $interval = !empty($payload['interval']) ? $payload['interval'] : 'EVERY_30_DAYS';

        $variables = [
            'name' => $payload['name'],
            'returnUrl' => $payload['return_url'],
            'trialDays' => $payload['trial_days'] ?? 0,
            'test' => $payload['test'] ?? true,
            'lineItems' => [
                [
                    'plan' => [
                        'appRecurringPricingDetails' => [
                            'price' => [
                                'amount' => (float) $payload['price'],
                                'currencyCode' => 'USD',
                            ],
                            'interval' => $interval,
                        ]
                    ],
                ]
            ],
        ];

        if (!empty($payload['discount']) && $payload['discount']) {
            $variables['lineItems'][0]['plan']['appRecurringPricingDetails']['discount'] = [
                'value' => [
                    'amount' => (float) $payload['discount'],
                ],
            ];
        }

        if (!empty($payload['capped_amount']) && $payload['capped_amount']) {
            $variables['lineItems'][] = [
                'plan' => [
                    'appUsagePricingDetails' => [
                        'cappedAmount' => [
                            'amount' => (float) $payload['capped_amount'],
                            'currencyCode' => 'USD',
                        ],
                        'terms' => $payload['terms'] ?? 'Usage charges',
                    ]
                ],
            ];
        }

        $shopifyService = new ShopifyService($shop);
        $response = $shopifyService->execute($query, $variables);

        if (isset($response['errors']) && $response['errors']) {
            return ['confirmationUrl' => null];
        }

        return $response['body']['data']['appSubscriptionCreate'] ?? ['confirmationUrl' => null];
    }
}
