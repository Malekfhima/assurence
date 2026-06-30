<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bordereau')) {
            return;
        }
        Schema::create('bordereau', function (Blueprint $table) {
            $table->integer('id_bordereau', true);
            $table->integer('id_bulletin');
            $table->integer('numero_bordereau');
            $table->date('date_envoi')->nullable();
            $table->string('statut', 50)->nullable();
            $table->string('commentaire', 255)->nullable();

            $table->foreign('id_bulletin')
                  ->references('id_bulletin')
                  ->on('bulletin_soin')
                  ->onDelete('cascade');

            $table->unique('id_bulletin');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bordereau');
    }
};
