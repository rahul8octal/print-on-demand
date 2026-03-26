<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductModuleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_model' => $this->product_model,
            'product_name' => $this->product_name,
            'is_active' => $this->is_active,
            'user' => UserResource::make($this->user),
            'model_url' => $this->model_url,
        ];
    }
}
