<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->timestamp('rider_completed_dismissed_at')->nullable()->after('rating_by_driver');
            $table->timestamp('driver_completed_dismissed_at')->nullable()->after('rider_completed_dismissed_at');
        });
    }

    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropColumn(['rider_completed_dismissed_at', 'driver_completed_dismissed_at']);
        });
    }
};
