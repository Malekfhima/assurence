<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bordereau', function (Blueprint $table) {
            if (!Schema::hasColumn('bordereau', 'montant_rembourse')) {
                $table->decimal('montant_rembourse', 10, 3)
                      ->nullable()
                      ->after('montant_total')
                      ->comment('Total Bordereau extrait du PDF de réponse STIP');
            }
        });

        // Migrer les données existantes : pour les bordereaux traités,
        // le montant_rembourse = l'actuel montant_total (qui avait été
        // écrasé par le Total Bordereau du PDF), et on recalcule
        // montant_total comme la somme de tous les bulletins.
        if (Schema::hasColumn('bordereau', 'montant_rembourse') && Schema::hasColumn('bordereau', 'montant_total')) {
            $bordereaux = DB::table('bordereau')
                ->where('statut', 'Traité')
                ->get();

            foreach ($bordereaux as $b) {
                // L'ancien montant_total est en fait le Total Bordereau du PDF
                $montantRembourse = $b->montant_total;

                // Recalculer le vrai montant_total = somme des montant_depense des bulletins
                $montantTotal = DB::table('bulletin_soin')
                    ->where('id_bordereau', $b->id_bordereau)
                    ->sum('montant_depense');

                DB::table('bordereau')
                    ->where('id_bordereau', $b->id_bordereau)
                    ->update([
                        'montant_rembourse' => $montantRembourse,
                        'montant_total'     => $montantTotal,
                    ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('bordereau', 'montant_rembourse')) {
            Schema::table('bordereau', function (Blueprint $table) {
                $table->dropColumn('montant_rembourse');
            });
        }
    }
};
