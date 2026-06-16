<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('license_number')->nullable();
            $table->boolean('is_online')->default(false);
            $table->boolean('is_approved')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('status')->default('pending');
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->integer('total_rides')->default(0);
            $table->decimal('total_earnings', 12, 2)->default(0);
            $table->decimal('current_balance', 12, 2)->default(0);
            $table->decimal('acceptance_rate', 5, 2)->default(0);
            $table->decimal('completion_rate', 5, 2)->default(0);
            $table->string('payout_method')->nullable();
            $table->string('payout_phone')->nullable();
            $table->string('payout_account_name')->nullable();
            $table->string('profile_photo_url')->nullable();
            $table->string('license_front_image')->nullable();
            $table->string('license_back_image')->nullable();
            $table->string('identity_front_image')->nullable();
            $table->string('identity_back_image')->nullable();
            $table->string('criminal_record')->nullable();
            $table->json('verification_document')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('gender')->nullable();
            $table->boolean('female_only')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
