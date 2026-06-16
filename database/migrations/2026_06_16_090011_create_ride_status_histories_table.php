<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ride_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ride_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ride_status_histories');
    }
};
