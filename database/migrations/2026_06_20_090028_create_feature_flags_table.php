<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category');
            $table->boolean('is_enabled')->default(true);
            $table->boolean('visible_in_admin')->default(true);
            $table->integer('sort_order')->default(0);
            $table->decimal('rollout_percentage', 5, 2)->nullable();
            $table->string('environment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
    }
};
