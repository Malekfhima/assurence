<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('email', 191)->unique();
            // Stocké en hash (bcrypt). La colonne d'origine était int(250) ce qui
            // ne convient pas pour un mot de passe sécurisé : on utilise varchar.
            $table->string('mot_de_passe', 255);
            $table->rememberToken();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};
