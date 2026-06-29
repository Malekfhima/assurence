<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adherent', function (Blueprint $table) {
            $table->integer('id_adherent', true);
            $table->integer('matricule');
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('etat_civil', 50)->nullable();
            $table->string('sexe', 20)->nullable();
            $table->date('date_naissance')->nullable();
            $table->date('date_adhesion')->nullable();
            $table->string('adresse', 255)->nullable();
            $table->integer('cin')->nullable();
            $table->string('telephone', 20)->nullable();
            $table->string('identifiant', 100)->nullable();
            $table->string('mot_de_passe', 255)->nullable();
            $table->string('statut', 100)->default('Actif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adherent');
    }
};
