<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->string('action');           // create | read | update | delete | login | logout
            $table->string('resource');         // nama model atau path
            $table->string('resource_id')->nullable();
            $table->jsonb('old_data')->nullable();
            $table->jsonb('new_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // Tidak ada updated_at — audit log tidak boleh diubah
        });

        // Rule PostgreSQL: DENY semua UPDATE dan DELETE pada tabel ini
        DB::unprepared('
            CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
            CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
        ');

        // Index untuk query performa
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['user_id', 'created_at']);
            $table->index(['resource', 'resource_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        DB::unprepared('
            DROP RULE IF EXISTS audit_logs_no_update ON audit_logs;
            DROP RULE IF EXISTS audit_logs_no_delete ON audit_logs;
        ');
        Schema::dropIfExists('audit_logs');
    }
};
