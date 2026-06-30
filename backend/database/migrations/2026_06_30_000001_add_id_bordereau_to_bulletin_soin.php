<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            if (!Schema::hasColumn('bulletin_soin', 'id_bordereau')) {
                $table->integer('id_bordereau')->nullable()->after('id_sous_adherent');
                $table->foreign('id_bordereau')
                      ->references('id_bordereau')
                      ->on('bordereau')
                      ->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            if (Schema::hasColumn('bulletin_soin', 'id_bordereau')) {
                $table->dropForeign(['id_bordereau']);
                $table->dropColumn('id_bordereau');
            }
        });
    }
};
