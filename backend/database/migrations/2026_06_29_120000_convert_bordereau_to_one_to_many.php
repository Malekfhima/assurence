<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Supprimer la contrainte étrangère si elle existe
        try {
            DB::statement('ALTER TABLE bordereau DROP FOREIGN KEY bordereau_ibfk_1');
        } catch (\Exception $e) {
            // Peut-être déjà supprimée
        }
        // Supprimer l'index unique
        try {
            DB::statement('ALTER TABLE bordereau DROP INDEX id_bulletin');
        } catch (\Exception $e) {
            // Peut-être déjà supprimé
        }
        // Supprimer la colonne
        try {
            DB::statement('ALTER TABLE bordereau DROP COLUMN id_bulletin');
        } catch (\Exception $e) {
            // Peut-être déjà supprimée
        }
    }

    public function down(): void
    {
        Schema::table('bordereau', function (Blueprint $table) {
            $table->integer('id_bulletin')->nullable()->after('id_bordereau');
            $table->unique('id_bulletin');
            $table->foreign('id_bulletin')
                  ->references('id_bulletin')
                  ->on('bulletin_soin')
                  ->onDelete('cascade');
        });
    }
};
