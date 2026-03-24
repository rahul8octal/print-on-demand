<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

use Illuminate\Support\Facades\Log;
use App\Models\User;

class OrdersCreateJob implements ShouldQueue
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

        Log::info('Order Created for ' . $this->shopDomain, [
            'order_id' => $this->data->id,
            'order_number' => $this->data->order_number,
        ]);

        if (isset($this->data->line_items)) {
            foreach ($this->data->line_items as $item) {
                $properties = $item->properties ?? [];
                foreach ($properties as $property) {
                    if ($property->name === 'Design URL') {
                        Log::info('POD item detected in order.', [
                            'design_url' => $property->value,
                            'order_id' => $this->data->id
                        ]);
                        // Phase 5: Send order to Print Provider
                    }
                }
            }
        }
    }
}
