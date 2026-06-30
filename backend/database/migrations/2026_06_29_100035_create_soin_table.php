<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('soin')) {
            return;
        }
        Schema::create('soin', function (Blueprint $table) {
            $table->integer('id_soin', true);
            $table->integer('id_bulletin');
            $table->date('date_soin');
            $table->string('type_soin', 100);
            $table->decimal('montant', 10, 2);

            $table->foreign('id_bulletin')
                  ->references('id_bulletin')
                  ->on('bulletin_soin')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('soin');
    }
};
