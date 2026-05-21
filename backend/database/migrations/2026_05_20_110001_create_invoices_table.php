<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            // Nomor invoice unik: INV-YYYYMMDD-NNNNN
            $table->string('invoice_number', 25)->unique();

            $table->foreignId('visit_id')
                  ->unique()                       // 1 invoice per kunjungan
                  ->constrained('visits')
                  ->restrictOnDelete();

            $table->foreignId('patient_id')
                  ->constrained('patients')
                  ->restrictOnDelete();

            $table->enum('status', ['menunggu_pembayaran', 'lunas', 'dibatalkan'])
                  ->default('menunggu_pembayaran');

            // Rincian tagihan
            $table->decimal('subtotal', 12, 2)->default(0);      // sebelum diskon
            $table->decimal('discount', 12, 2)->default(0);       // diskon nominal
            $table->decimal('total_amount', 12, 2)->default(0);   // subtotal - discount

            // Data pembayaran (diisi saat lunas)
            $table->enum('payment_method', [
                'tunai', 'bpjs', 'asuransi_swasta', 'debit', 'kredit',
            ])->nullable();

            $table->decimal('payment_amount', 12, 2)->nullable();  // jumlah yang dibayar
            $table->decimal('payment_change', 12, 2)->nullable();  // kembalian

            $table->timestamp('paid_at')->nullable();

            $table->foreignId('paid_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
