<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Handle existing null values before making columns required
        DB::table('adherent')->whereNull('adresse')->update(['adresse' => '']);
        DB::table('adherent')->whereNull('telephone')->update(['telephone' => '']);

        Schema::table('adherent', function (Blueprint $table) {
            $table->string('adresse', 500)->nullable(false)->change();
            $table->string('telephone', 30)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('adherent', function (Blueprint $table) {
            $table->string('adresse', 255)->nullable()->change();
            $table->string('telephone', 20)->nullable()->change();
        });
    }
};
