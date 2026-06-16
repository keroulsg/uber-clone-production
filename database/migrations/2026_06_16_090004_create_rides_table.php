<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rides', function (Blueprint $table) {
            $table->id();
            $table->string('booking_id')->nullable()->unique();
            $table->foreignId('rider_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('vehicle_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('pickup_latitude', 10, 7);
            $table->decimal('pickup_longitude', 10, 7);
            $table->string('pickup_address');
            $table->decimal('destination_latitude', 10, 7);
            $table->decimal('destination_longitude', 10, 7);
            $table->string('destination_address');
            $table->string('status');
            $table->decimal('estimated_distance', 8, 2)->nullable();
            $table->integer('estimated_duration')->nullable();
            $table->decimal('estimated_fare', 10, 2)->nullable();
            $table->decimal('actual_distance', 8, 2)->nullable();
            $table->integer('actual_duration')->nullable();
            $table->decimal('actual_fare', 10, 2)->nullable();
            $table->decimal('surge_multiplier', 4, 2)->nullable()->default(1.00);
            $table->string('payment_method')->nullable();
            $table->string('payment_status')->nullable();
            $table->text('route_polyline')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('dropped_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_by')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->boolean('female_driver_preferred')->default(false);
            $table->boolean('female_driver_unavailable')->default(false);
            $table->boolean('fallback_available')->default(false);
            $table->boolean('fallback_to_any_driver_accepted')->default(false);
            $table->decimal('driver_pickup_distance_km', 8, 2)->nullable();
            $table->timestamp('waiting_started_at')->nullable();
            $table->boolean('rating_by_rider')->default(false);
            $table->boolean('rating_by_driver')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rides');
    }
};
