<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penjualan_cream', function (Blueprint $table) {
            $table->id();
            $table->integer('transaction_no');
            $table->date('transaction_date');
            $table->string('patient_name');
            $table->string('product_name');
            $table->decimal('selling_price', 15, 2);
            $table->decimal('expense', 15, 2)->default(0);
            $table->enum('payment_method', ['Cash', 'TF']);
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('cash_balance', 15, 2)->default(0);
            $table->decimal('transfer_balance', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['transaction_date']);
            $table->index(['created_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penjualan_cream');
    }
};
