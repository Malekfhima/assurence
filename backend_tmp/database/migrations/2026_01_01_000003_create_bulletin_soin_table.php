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
            $table->integer('numero_bordereau');
            $table->integer('numero_bulletin');
            $table->date('date_soin')->nullable();
            $table->decimal('montant_depense', 10, 2)->nullable();
            $table->string('type_soin', 100)->nullable();
            $table->string('description', 255)->nullable();
            $table->string('etat', 50)->nullable();

            // NB : le schéma d'origine définissait une UNIQUE KEY sur id_adherent
            // (un seul bulletin par adhérent), ce qui est très probablement un bug.
            // On utilise un index simple pour autoriser plusieurs bulletins.
            $table->index('id_adherent');
            $table->foreign('id_adherent')
                ->references('id_adherent')->on('adherent')
                ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulletin_soin');
    }
};
