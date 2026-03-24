<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use App\Services\PrintfulService;

class OrdersPaidJob implements ShouldQueue
{
    use Queueable;

    public $shopDomain;
    public $data;

    /**
     * Create a new job instance.
     */
    public function __construct(string $shopDomain, \stdClass $data)
    {
        $this->shopDomain = $shopDomain;
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $shop = User::where('name', '=', $this->shopDomain)->first();
        
        if (!$shop) {
            return;
        }

        Log::info('Order successfully PAID for ' . $this->shopDomain, [
            'order_id' => $this->data->id,
        ]);

        $podItems = [];

        // Check each line item for custom properties mapped from Phase 2 / Phase 4
        if (isset($this->data->line_items)) {
            foreach ($this->data->line_items as $item) {
                $properties = $item->properties ?? [];
                foreach ($properties as $property) {
                    if ($property->name === 'Design URL' && !empty($property->value)) {
                        $podItems[] = [
                            'variant_id' => $item->variant_id,
                            'quantity' => $item->quantity,
                            'design_url' => $property->value
                        ];
                        break;
                    }
                }
            }
        }

        if (count($podItems) > 0) {
            Log::info("POD Items detected. Forwarding Order #{$this->data->id} to Printful.");
            
            $printful = new PrintfulService($shop);
            $printfulResponse = $printful->createOrder($this->data, $podItems);
            
            if ($printfulResponse) {
                Log::info("Successfully pushed Order #{$this->data->id} to Provider.");
                // Sync Order Status: Mark designs as processing
                foreach ($podItems as $item) {
                    \App\Models\CustomDesign::where('design_image_url', '=', $item['design_url'])
                        ->update(['status' => 'processing']);
                }
            } else {
                Log::warning("Failed to push Order #{$this->data->id} to Print Provider.");
            }
        }
    }
}
