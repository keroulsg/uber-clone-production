<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ride_driver_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ride_id')->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ride_driver_offers');
    }
};
