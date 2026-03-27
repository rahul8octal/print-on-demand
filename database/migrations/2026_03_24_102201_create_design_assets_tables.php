<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('design_assets', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'font', 'element', 'preset'
            $table->string('category'); // 'Shapes', 'Love', 'Patterns', 'Display', 'Handwriting'
            $table->string('name')->nullable();
            $table->text('content'); // font name or image_url
            $table->json('config')->nullable(); // For presets (curve, scale, etc.)
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('design_assets');
    }
};
