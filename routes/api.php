<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;


Route::post('/product/model', [ProductController::class, 'getPublicModel']);
Route::get('/pod/catalog', [ProductController::class, 'returnPodCatalog']);

Route::post('/design', [\App\Http\Controllers\CustomDesignController::class, 'store']);
Route::get('/design/{id}', [\App\Http\Controllers\CustomDesignController::class, 'show']);
