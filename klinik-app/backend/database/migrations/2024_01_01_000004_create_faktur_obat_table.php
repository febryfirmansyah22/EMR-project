<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faktur_obat', function (Blueprint $table) {
            $table->id();
            $table->integer('invoice_no');
            $table->date('invoice_date');
            $table->string('supplier_name');
            $table->decimal('price', 15, 2);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['invoice_date']);
            $table->index(['created_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faktur_obat');
    }
};
