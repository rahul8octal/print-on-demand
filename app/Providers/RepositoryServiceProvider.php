<?php

namespace App\Providers;

use App\Interfaces\Internal\FeatureRepositoryInterface;
use App\Interfaces\Internal\PlanRepositoryInterface;
use App\Interfaces\Internal\SettingRepositoryInterface;
use App\Interfaces\Internal\ShopRepositoryInterface;
use App\Interfaces\ProductRepositoryInterface;
use App\Repositories\Internal\FeatureRepository;
use App\Repositories\Internal\PlanRepository;
use App\Repositories\Internal\SettingRepository;
use App\Repositories\Internal\ShopRepository;
use App\Repositories\ProductRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(ShopRepositoryInterface::class, ShopRepository::class);
        $this->app->bind(SettingRepositoryInterface::class, SettingRepository::class);
        $this->app->bind(PlanRepositoryInterface::class, PlanRepository::class);
        $this->app->bind(FeatureRepositoryInterface::class, FeatureRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, ProductRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
