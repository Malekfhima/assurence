<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            // Drop the existing foreign key with 'set null'
            $table->dropForeign('bulletin_soin_bordereau_fk');

            // Re-add with 'cascade' so bulletins are deleted when bordereau is deleted
            $table->foreign('id_bordereau', 'bulletin_soin_bordereau_fk')
                  ->references('id_bordereau')
                  ->on('bordereau')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('bulletin_soin', function (Blueprint $table) {
            $table->dropForeign('bulletin_soin_bordereau_fk');

            // Restore original 'set null' behavior
            $table->foreign('id_bordereau', 'bulletin_soin_bordereau_fk')
                  ->references('id_bordereau')
                  ->on('bordereau')
                  ->onDelete('set null');
        });
    }
};
