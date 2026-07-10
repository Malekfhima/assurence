<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('bulletin_soin', 'pdf_path')) {
            return;
        }

        Schema::table('bulletin_soin', function (Blueprint $table) {
            $table->string('pdf_path', 255)->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            $table->dropColumn('pdf_path');
        });
    }
};
