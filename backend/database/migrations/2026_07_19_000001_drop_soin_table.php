<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('soin');
    }

    public function down(): void
    {
        // La table 'soin' a été remplacée par 'bulletin_soin_detail'.
        // On ne restaure pas la table vide.
    }
};
