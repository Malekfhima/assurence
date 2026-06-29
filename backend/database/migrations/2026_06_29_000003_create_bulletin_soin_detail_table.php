<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bulletin_soin_detail', function (Blueprint $table) {
            $table->integer('id_detail', true);
            $table->integer('id_bulletin');
            $table->date('date')->nullable();
            $table->decimal('montant', 10, 2)->default(0);
            $table->boolean('ordonnance')->default(false);
            $table->string('type_soin', 100)->nullable();

            $table->foreign('id_bulletin')
                  ->references('id_bulletin')
                  ->on('bulletin_soin')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulletin_soin_detail');
    }
};
