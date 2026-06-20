<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_types', function (Blueprint $table) {
            $table->decimal('commission_rate', 5, 2)->nullable()->after('minimum_fare');
            $table->decimal('fuel_multiplier', 5, 2)->default(1.0)->after('commission_rate');
            $table->boolean('vip_enabled')->default(false)->after('is_active');
            $table->decimal('vip_base_fare', 10, 2)->nullable()->after('vip_enabled');
            $table->decimal('vip_multiplier', 5, 2)->default(1.0)->after('vip_base_fare');
            $table->decimal('vip_commission_rate', 5, 2)->nullable()->after('vip_multiplier');
            $table->decimal('vip_priority_multiplier', 5, 2)->default(1.0)->after('vip_commission_rate');
            $table->boolean('female_driver_enabled')->default(false)->after('vip_priority_multiplier');
            $table->decimal('female_base_fare', 10, 2)->nullable()->after('female_driver_enabled');
            $table->decimal('female_multiplier', 5, 2)->default(1.0)->after('female_base_fare');
            $table->decimal('female_commission_rate', 5, 2)->nullable()->after('female_multiplier');
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_types', function (Blueprint $table) {
            $table->dropColumn([
                'commission_rate', 'fuel_multiplier',
                'vip_enabled', 'vip_base_fare', 'vip_multiplier', 'vip_commission_rate', 'vip_priority_multiplier',
                'female_driver_enabled', 'female_base_fare', 'female_multiplier', 'female_commission_rate',
            ]);
        });
    }
};
