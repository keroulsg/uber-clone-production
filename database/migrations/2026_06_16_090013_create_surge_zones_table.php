<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surge_zones', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('bounds')->nullable();
            $table->decimal('center_latitude', 10, 7)->nullable();
            $table->decimal('center_longitude', 10, 7)->nullable();
            $table->decimal('radius_km', 8, 2)->nullable();
            $table->decimal('multiplier', 4, 2)->default(1.00);
            $table->boolean('is_active')->default(true);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surge_zones');
    }
};
