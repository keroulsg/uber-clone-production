<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->decimal('base_fare', 10, 2);
            $table->decimal('per_km_rate', 10, 2);
            $table->decimal('per_minute_rate', 10, 2);
            $table->decimal('minimum_fare', 10, 2);
            $table->decimal('cancellation_fee', 10, 2)->default(0);
            $table->integer('seating_capacity')->default(4);
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_types');
    }
};
