<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bordereau', function (Blueprint $table) {
            if (!Schema::hasColumn('bordereau', 'fichier_reponse')) {
                $table->string('fichier_reponse', 255)->nullable()->after('commentaire');
            }
            if (!Schema::hasColumn('bordereau', 'date_reponse')) {
                $table->date('date_reponse')->nullable()->after('fichier_reponse');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bordereau', function (Blueprint $table) {
            if (Schema::hasColumn('bordereau', 'fichier_reponse')) {
                $table->dropColumn('fichier_reponse');
            }
            if (Schema::hasColumn('bordereau', 'date_reponse')) {
                $table->dropColumn('date_reponse');
            }
        });
    }
};
