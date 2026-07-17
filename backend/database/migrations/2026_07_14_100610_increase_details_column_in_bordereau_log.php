<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Passer la colonne 'details' de TEXT à MEDIUMTEXT pour supporter
        // les logs de vérification détaillés (jusqu'à 106 bulletins avec détails de soins)
        DB::statement('ALTER TABLE bordereau_log MODIFY COLUMN details MEDIUMTEXT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE bordereau_log MODIFY COLUMN details TEXT NULL');
    }
};
