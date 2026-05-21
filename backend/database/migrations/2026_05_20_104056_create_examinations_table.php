<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examinations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('visit_id')
                  ->unique()                      // 1 pemeriksaan per kunjungan
                  ->constrained('visits')
                  ->cascadeOnDelete();

            $table->foreignId('nurse_id')          // perawat yang memeriksa
                  ->constrained('users')
                  ->restrictOnDelete();

            // Tanda-tanda vital
            $table->decimal('weight', 5, 2)->nullable();            // kg
            $table->decimal('height', 5, 2)->nullable();            // cm
            $table->unsignedSmallInteger('blood_pressure_systolic')->nullable();   // mmHg
            $table->unsignedSmallInteger('blood_pressure_diastolic')->nullable();  // mmHg
            $table->unsignedSmallInteger('pulse')->nullable();       // denyut/menit
            $table->decimal('temperature', 4, 1)->nullable();        // °C
            $table->unsignedSmallInteger('respiratory_rate')->nullable(); // napas/menit
            $table->decimal('oxygen_saturation', 4, 1)->nullable();  // %
            $table->decimal('blood_sugar', 6, 2)->nullable();        // mg/dL (opsional)

            $table->text('notes')->nullable();     // catatan perawat
            $table->timestamp('examined_at')->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examinations');
    }
};
