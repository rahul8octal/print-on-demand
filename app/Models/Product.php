<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Model implements HasMedia
{

    use InteractsWithMedia;

    const MEDIA = '3dModel';

    protected $table = "products";

    protected $fillable = [
        'user_id',
        'product_id',
        'is_active',
        'model_url',
        'shopify_file_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'product_model',
        'product_name',
    ];

    //    protected $with = ['media'];

    public function getProductModelAttribute()
    {
        $media = $this->getMedia(self::MEDIA)->first();
        return $media?->getFullUrl() ?? null;
    }

    public function getProductNameAttribute()
    {
        $mediable = $this->getMedia(self::MEDIA)->first();
        return $mediable?->file_name ?? null;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function scopeOfShop($query, $shopId)
    {
        return $query->where('user_id', $shopId);
    }
}
