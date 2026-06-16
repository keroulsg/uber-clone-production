<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_debts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ride_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->decimal('amount', 10, 2);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_debts');
    }
};
