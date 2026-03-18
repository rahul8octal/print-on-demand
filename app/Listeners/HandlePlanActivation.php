<?php

namespace App\Listeners;

use Osiset\ShopifyApp\Messaging\Events\PlanActivatedEvent;

class HandlePlanActivation
{
    public function __construct(){}
    public function handle(PlanActivatedEvent $event): void
    {
       $shop = $event->shop;
       $shop->trial_ends_at = null;
       $shop->save();
    }
}
