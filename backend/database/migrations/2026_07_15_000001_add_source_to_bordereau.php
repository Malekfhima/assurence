<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bordereau', function (Blueprint $table) {
            if (!Schema::hasColumn('bordereau', 'source')) {
                $table->string('source', 50)
                      ->nullable()
                      ->after('commentaire')
                      ->comment("Origine du bordereau : 'réclamation' ou null (création directe)");
            }
        });
    }

    public function down(): void
    {
        Schema::table('bordereau', function (Blueprint $table) {
            if (Schema::hasColumn('bordereau', 'source')) {
                $table->dropColumn('source');
            }
        });
    }
};
