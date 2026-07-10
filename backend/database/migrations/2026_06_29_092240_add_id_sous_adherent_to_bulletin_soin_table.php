<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('bulletin_soin', 'id_sous_adherent')) {
            return;
        }

        Schema::table('bulletin_soin', function (Blueprint $table) {
            $table->integer('id_sous_adherent')->nullable()->after('id_adherent');
            $table->foreign('id_sous_adherent')
                  ->references('id_sous_adherent')
                  ->on('sous_adherent')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            $table->dropForeign(['id_sous_adherent']);
            $table->dropColumn('id_sous_adherent');
        });
    }
};
