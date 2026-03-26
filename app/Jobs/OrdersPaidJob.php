<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

use App\Models\User;
use Illuminate\Support\Facades\Log;

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
    }
}
