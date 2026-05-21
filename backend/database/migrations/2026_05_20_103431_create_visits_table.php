<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();

            // Nomor unik kunjungan: KNJ-20260520-00001
            $table->string('visit_number', 25)->unique();

            // Nomor antrean per poli per hari (1, 2, 3 ...)
            $table->unsignedSmallInteger('queue_number');

            // Relasi utama
            $table->foreignId('patient_id')
                  ->constrained('patients')
                  ->restrictOnDelete();

            $table->foreignId('poli_id')
                  ->constrained('polis')
                  ->restrictOnDelete();

            // Dokter bisa dikosongkan saat pendaftaran, diisi nanti
            $table->foreignId('doctor_id')
                  ->nullable()
                  ->constrained('doctors')
                  ->nullOnDelete();

            // Petugas yang mendaftarkan
            $table->foreignId('registered_by')
                  ->constrained('users')
                  ->restrictOnDelete();

            $table->date('visit_date');

            // Keluhan pasien (teks bebas, tidak dienkripsi — diisi admin/pasien)
            $table->text('complaint')->nullable();

            // Alur status kunjungan (8 status)
            $table->enum('status', [
                'terdaftar',
                'menunggu_pemeriksaan_awal',
                'menunggu_dokter',
                'sedang_diperiksa',
                'menunggu_obat',
                'menunggu_pembayaran',
                'selesai',
                'batal',
            ])->default('terdaftar');

            $table->text('notes')->nullable();  // catatan admin
            $table->timestamps();

            // Index untuk query antrean & pencarian
            $table->index(['visit_date', 'poli_id']);
            $table->index(['visit_date', 'status']);
            $table->index(['patient_id', 'visit_date']);

            // Nomor antrean unik per poli per hari
            $table->unique(['poli_id', 'visit_date', 'queue_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
