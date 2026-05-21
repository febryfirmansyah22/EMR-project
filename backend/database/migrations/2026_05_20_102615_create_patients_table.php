<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();

            // Identitas utama
            $table->string('medical_record_number', 20)->unique(); // RM-2026-00001
            $table->string('name', 150);
            $table->text('nik');                          // encrypted — NIK 16 digit
            $table->date('birth_date');
            $table->string('birth_place', 100)->nullable();
            $table->enum('gender', ['laki-laki', 'perempuan']);
            $table->string('blood_type', 3)->nullable();  // A, B, AB, O

            // Kontak (encrypted)
            $table->text('address');                      // encrypted
            $table->text('phone');                        // encrypted
            $table->string('email', 150)->nullable();

            // Data sosial
            $table->string('religion', 30)->nullable();
            $table->enum('marital_status', ['belum_menikah', 'menikah', 'cerai_hidup', 'cerai_mati'])->nullable();
            $table->string('occupation', 100)->nullable();
            $table->string('education', 50)->nullable();

            // Kontak darurat (encrypted JSON)
            $table->text('emergency_contact')->nullable(); // encrypted { name, relationship, phone }

            // Asuransi / jaminan
            $table->enum('insurance_type', ['umum', 'bpjs', 'asuransi_swasta'])->default('umum');
            $table->string('insurance_number', 50)->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Index untuk pencarian cepat
            $table->index('name');
            $table->index('medical_record_number');
            $table->index('birth_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
