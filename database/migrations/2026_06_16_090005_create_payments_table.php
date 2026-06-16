<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ride_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->decimal('platform_fee', 10, 2)->default(0);
            $table->decimal('driver_amount', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->string('currency')->default('USD');
            $table->string('payment_method')->nullable();
            $table->string('status');
            $table->string('transaction_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->decimal('applied_commission_rate', 5, 4)->nullable();
            $table->decimal('company_commission', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
