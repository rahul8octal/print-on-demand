<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;

Route::post('/product/model', [ProductController::class, 'getPublicModel']);
