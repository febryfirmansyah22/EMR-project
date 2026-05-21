<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('medicine_id')
                  ->constrained('medicines')
                  ->restrictOnDelete();

            // Referensi sumber pergerakan stok
            $table->foreignId('prescription_id')
                  ->nullable()
                  ->constrained('prescriptions')
                  ->nullOnDelete();

            $table->foreignId('created_by')
                  ->constrained('users')
                  ->restrictOnDelete();

            $table->enum('type', ['masuk', 'keluar', 'penyesuaian']); // in/out/adjustment
            $table->integer('quantity');       // positif = masuk, negatif = keluar/penyesuaian
            $table->integer('stock_before');   // snapshot stok sebelum perubahan
            $table->integer('stock_after');    // snapshot stok setelah perubahan
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['medicine_id', 'created_at']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
