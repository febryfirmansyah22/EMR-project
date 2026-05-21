<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('record_diagnoses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('medical_record_id')
                  ->constrained('medical_records')
                  ->cascadeOnDelete();

            $table->foreignId('diagnosis_id')
                  ->constrained('diagnoses')
                  ->restrictOnDelete();

            // Diagnosis primer/sekunder
            $table->enum('type', ['primer', 'sekunder'])->default('primer');

            $table->timestamps();

            $table->unique(['medical_record_id', 'diagnosis_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('record_diagnoses');
    }
};
