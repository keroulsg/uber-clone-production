<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('drivers')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('method'); // cash, instapay, vodafone_cash, bank_transfer, card, fawry, paymob, other
            $table->string('reference')->nullable();
            $table->text('note')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('status')->default('pending'); // pending, awaiting_verification, approved, rejected, failed, cancelled
            $table->string('provider')->nullable();
            $table->string('provider_reference')->nullable();
            $table->string('provider_transaction_id')->nullable();
            $table->string('verification_status')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('webhook_payload')->nullable();
            $table->decimal('gateway_fee', 10, 2)->nullable();
            $table->decimal('net_amount', 10, 2)->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_settlements');
    }
};
