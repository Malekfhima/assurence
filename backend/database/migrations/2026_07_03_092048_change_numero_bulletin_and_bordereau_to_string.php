<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        try {
            Schema::table('bulletin_soin', function (Blueprint $table) {
                $table->string('numero_bulletin', 50)->change();
            });
        } catch (\Exception $e) {
            // Déjà modifié, ignorer
        }

        try {
            Schema::table('bordereau', function (Blueprint $table) {
                $table->string('numero_bordereau', 50)->change();
            });
        } catch (\Exception $e) {
            // Déjà modifié, ignorer
        }
    }

    public function down(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            $table->integer('numero_bulletin')->change();
        });

        Schema::table('bordereau', function (Blueprint $table) {
            $table->integer('numero_bordereau')->change();
        });
    }
};
