<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('generic_name')->nullable();
            $table->string('unit');          // tablet, kapsul, botol, sachet, ampul
            $table->string('category')->nullable(); // antibiotik, analgesik, dll
            $table->decimal('price', 12, 2)->default(0); // harga jual per unit
            $table->integer('stock')->default(0);
            $table->integer('min_stock')->default(10); // threshold peringatan
            $table->date('expiry_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('name');
            $table->index('generic_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
