<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Re-add montant_depense if it was dropped by a previous migration
        if (!Schema::hasColumn('bulletin_soin', 'montant_depense')) {
            Schema::table('bulletin_soin', function (Blueprint $table) {
                $table->decimal('montant_depense', 10, 2)->default(0)->after('id_sous_adherent');
            });
        }

        // Add montant_total to bordereau
        if (!Schema::hasColumn('bordereau', 'montant_total')) {
            Schema::table('bordereau', function (Blueprint $table) {
                $table->decimal('montant_total', 10, 2)->default(0)->after('numero_bordereau');
            });
        }
    }

    public function down(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            if (Schema::hasColumn('bulletin_soin', 'montant_depense')) {
                $table->dropColumn('montant_depense');
            }
        });

        Schema::table('bordereau', function (Blueprint $table) {
            if (Schema::hasColumn('bordereau', 'montant_total')) {
                $table->dropColumn('montant_total');
            }
        });
    }
};
