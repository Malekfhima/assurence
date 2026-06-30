<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sous_adherent')) {
            return;
        }
        Schema::create('sous_adherent', function (Blueprint $table) {
            $table->integer('id_sous_adherent', true);
            $table->integer('id_adherent');
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->date('date_naissance')->nullable();
            $table->string('sexe', 20)->nullable();
            $table->string('lien_parente', 100)->nullable();

            $table->foreign('id_adherent')
                  ->references('id_adherent')
                  ->on('adherent')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sous_adherent');
    }
};
