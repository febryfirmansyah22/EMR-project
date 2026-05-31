<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('observasi_umum', function (Blueprint $table) {
            $table->id();
            $table->integer('transaction_no');
            $table->date('transaction_date');
            $table->string('patient_name');
            $table->decimal('price', 15, 2);
            $table->enum('payment_method', ['Cash', 'QRIS/TF']);
            $table->decimal('running_total', 15, 2)->default(0);
            $table->decimal('deposit_amount', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['transaction_date']);
            $table->index(['created_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observasi_umum');
    }
};
