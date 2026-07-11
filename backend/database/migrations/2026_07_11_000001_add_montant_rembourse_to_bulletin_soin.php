<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('bulletin_soin', 'montant_rembourse')) {
            Schema::table('bulletin_soin', function (Blueprint $table) {
                $table->decimal('montant_rembourse', 10, 3)
                      ->nullable()
                      ->after('montant_depense')
                      ->comment('Montant remboursé par la STIP extrait du PDF réponse');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('bulletin_soin', 'montant_rembourse')) {
            Schema::table('bulletin_soin', function (Blueprint $table) {
                $table->dropColumn('montant_rembourse');
            });
        }
    }
};
