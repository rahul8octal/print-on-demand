<?php

use App\Http\Controllers\Internal\DashboardController;
use App\Http\Controllers\Internal\PlanController;
use App\Http\Controllers\Internal\SettingController;
use App\Http\Controllers\Internal\ShopController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TestController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'shops'], function () {
    Route::get('/auth', [ShopController::class, 'auth']);
    Route::get('/designs', [\App\Http\Controllers\CustomDesignController::class, 'index']);
    Route::get('/designs/{id}/token', [\App\Http\Controllers\CustomDesignController::class, 'generateDownloadToken']);
    Route::post('/designs/{id}/sync', [\App\Http\Controllers\CustomDesignController::class, 'sync']);
});

Route::get('test-import-products', [TestController::class, 'importProducts']);

Route::group(['prefix' => 'product'], function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/shopify', [ProductController::class, 'shopifyProducts']);
    Route::post('/toggle-pod', [ProductController::class, 'togglePod']);
    Route::post('/upload', [ProductController::class, 'store']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::post('/{id}/update', [ProductController::class, 'update']);
    Route::delete('/{id}', [ProductController::class, 'destroy']);
    Route::post('/{id}/update_status', [ProductController::class, 'updateStatus']);
    Route::post('/model', [ProductController::class, 'getModel']);
});


Route::group(['prefix' => 'dashboard'], function () {
    Route::get('/', [DashboardController::class, 'index']);
    Route::post('/update-current-tab', [DashboardController::class, 'updateCurrentTab']);
});

Route::group(['prefix' => 'settings'], function () {
    Route::get('/', [SettingController::class, 'index']);
    Route::post('/', [SettingController::class, 'store']);
    Route::get('{group}/{key}', [SettingController::class, 'show']);
});

Route::group(['prefix' => 'plans'], function () {
    Route::get('/', [PlanController::class, 'index']);
    Route::get('/onboard', [PlanController::class, 'completeOnboard']);
});
