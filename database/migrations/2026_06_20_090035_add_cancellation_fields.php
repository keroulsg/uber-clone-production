<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->foreignId('cancellation_reason_id')->nullable()->after('cancellation_reason')->constrained('cancellation_reasons')->nullOnDelete();
            $table->text('cancellation_comment')->nullable()->after('cancellation_reason_id');
        });

        Schema::table('ride_status_histories', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropForeign(['cancellation_reason_id']);
            $table->dropColumn(['cancellation_reason_id', 'cancellation_comment']);
        });

        Schema::table('ride_status_histories', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });
    }
};
