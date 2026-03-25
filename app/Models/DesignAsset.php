<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DesignAsset extends Model
{
    protected $fillable = ['type', 'category', 'name', 'content', 'config', 'status'];

    protected $casts = [
        'config' => 'array',
        'status' => 'boolean'
    ];
}
