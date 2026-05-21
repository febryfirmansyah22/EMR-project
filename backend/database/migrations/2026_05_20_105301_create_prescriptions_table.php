<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();

            // Nomor resep unik: RX-YYYYMMDD-NNNNN
            $table->string('prescription_number', 25)->unique();

            $table->foreignId('visit_id')
                  ->unique()                       // 1 resep per kunjungan
                  ->constrained('visits')
                  ->restrictOnDelete();

            $table->foreignId('doctor_id')
                  ->constrained('doctors')
                  ->restrictOnDelete();

            $table->enum('status', ['menunggu', 'diproses', 'selesai', 'dibatalkan'])
                  ->default('menunggu');

            // Farmasi yang memproses resep
            $table->foreignId('dispensed_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('dispensed_at')->nullable();

            $table->text('notes')->nullable();       // catatan dokter
            $table->text('pharmacist_notes')->nullable(); // catatan farmasi

            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
