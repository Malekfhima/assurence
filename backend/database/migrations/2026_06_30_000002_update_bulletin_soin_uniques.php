<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Supprimer l'ancienne contrainte unique qui limitait à 1 bulletin par adhérent
        try {
            DB::statement('ALTER TABLE bulletin_soin DROP INDEX bulletin_soin_id_adherent_unique');
        } catch (\Exception $e) {
            // L'index n'existe peut-être pas déjà, ce n'est pas bloquant
        }

        // Ajouter une contrainte unique sur numero_bulletin
        try {
            Schema::table('bulletin_soin', function (Blueprint $table) {
                $table->unique('numero_bulletin', 'bulletin_soin_numero_bulletin_unique');
            });
        } catch (\Exception $e) {
            // L'index peut déjà exister
        }
    }

    public function down(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            $table->dropUnique('bulletin_soin_numero_bulletin_unique');
        });
    }
};
