<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bulletin_soin', function (Blueprint $table) {
            $table->integer('id_bulletin', true);
            $table->integer('id_adherent');
            $table->integer('numero_bordereau')->default(0);
            $table->integer('numero_bulletin');
            $table->date('date_soin')->nullable();
            $table->decimal('montant_depense', 10, 2)->nullable();
            $table->string('type_soin', 100)->nullable();
            $table->string('description', 255)->nullable();
            $table->string('etat', 50)->default('En attente');

            $table->foreign('id_adherent')
                  ->references('id_adherent')
                  ->on('adherent')
                  ->onDelete('cascade');

            $table->unique('id_adherent');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulletin_soin');
    }
};
