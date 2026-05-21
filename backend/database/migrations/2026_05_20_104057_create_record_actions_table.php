<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('record_actions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('medical_record_id')
                  ->constrained('medical_records')
                  ->cascadeOnDelete();

            $table->foreignId('medical_action_id')
                  ->constrained('medical_actions')
                  ->restrictOnDelete();

            $table->unsignedSmallInteger('quantity')->default(1);
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('record_actions');
    }
};
