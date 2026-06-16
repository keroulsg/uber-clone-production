<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('make');
            $table->string('model');
            $table->year('year');
            $table->string('color');
            $table->string('license_plate');
            $table->string('registration_number')->nullable();
            $table->string('vehicle_class')->default('basic');
            $table->json('features')->nullable();
            $table->string('status')->default('pending');
            $table->boolean('is_active')->default(true);
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
