<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Supprimer l'index id_adherent s'il existe (requête brute)
        try {
            DB::statement('ALTER TABLE bulletin_soin DROP INDEX id_adherent');
        } catch (\Exception $e) {
            // L'index n'existe peut-être pas, on ignore
        }

        Schema::table('bulletin_soin', function (Blueprint $table) {
            // Supprimer numero_bordereau qui est déplacé vers la table bordereau
            if (Schema::hasColumn('bulletin_soin', 'numero_bordereau')) {
                $table->dropColumn('numero_bordereau');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            if (!Schema::hasColumn('bulletin_soin', 'numero_bordereau')) {
                $table->integer('numero_bordereau')->default(0)->after('id_sous_adherent');
            }
            $table->unique('id_adherent');
        });
    }
};
