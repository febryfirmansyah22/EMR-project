<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('visit_id')
                  ->unique()                      // 1 rekam medis per kunjungan
                  ->constrained('visits')
                  ->cascadeOnDelete();

            $table->foreignId('doctor_id')
                  ->constrained('doctors')
                  ->restrictOnDelete();

            /**
             * SOAP — semua dienkripsi sesuai CLAUDE.md & UU PDP.
             * Data tersimpan sebagai ciphertext di database.
             * Tipe `text` diperlukan karena ciphertext lebih panjang dari nilai aslinya.
             */
            $table->text('soap_subjective')->nullable();   // S: Anamnesis, keluhan, riwayat
            $table->text('soap_objective')->nullable();    // O: Pemeriksaan fisik, lab
            $table->text('soap_assessment')->nullable();   // A: Penegakan diagnosis
            $table->text('soap_plan')->nullable();         // P: Terapi, edukasi, rujukan
            $table->text('doctor_notes')->nullable();      // Catatan tambahan dokter

            $table->timestamps();

            $table->index('doctor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_records');
    }
};
