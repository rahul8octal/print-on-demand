<?php

use App\Http\Controllers\CustomDesignController;
use App\Http\Controllers\DesignAssetController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;


Route::post('/product/model', [ProductController::class, 'getPublicModel']);
Route::get('/pod/catalog', [ProductController::class, 'returnPodCatalog']);

Route::post('/design', [CustomDesignController::class, 'store']);
Route::get('/design/assets', [DesignAssetController::class, 'index']);
Route::get('/design/{id}', [CustomDesignController::class, 'show']);
Route::get('/design/{id}/download', [CustomDesignController::class, 'downloadZip'])->name('design.download');
