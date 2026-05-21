<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('prescription_id')
                  ->constrained('prescriptions')
                  ->cascadeOnDelete();

            $table->foreignId('medicine_id')
                  ->constrained('medicines')
                  ->restrictOnDelete();

            $table->unsignedSmallInteger('quantity');     // jumlah obat yang diresepkan
            $table->string('dosage', 30);                 // "3x1", "2x2", "1x1"
            $table->string('instructions', 100)->nullable(); // "sesudah makan", "sebelum tidur"
            $table->text('notes')->nullable();

            // Harga saat resep dibuat (snapshot, supaya laporan historis akurat)
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
