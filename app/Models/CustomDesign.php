<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomDesign extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'product_title',
        'design_data',
        'design_image_url',
        'status',
    ];

    protected $casts = [
        'design_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
