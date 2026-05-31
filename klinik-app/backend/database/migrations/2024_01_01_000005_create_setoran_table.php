<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('setoran', function (Blueprint $table) {
            $table->id();
            $table->date('deposit_date');
            $table->enum('source', ['Observasi Umum', 'Penjualan Cream', 'Lainnya']);
            $table->decimal('amount', 15, 2);
            $table->enum('method', ['Cash', 'Transfer'])->nullable();
            $table->text('note')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['deposit_date']);
            $table->index(['source']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setoran');
    }
};
