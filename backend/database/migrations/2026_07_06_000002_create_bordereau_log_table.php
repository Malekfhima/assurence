<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bordereau_log', function (Blueprint $table) {
            $table->integer('id_log', true);
            $table->integer('id_bordereau');
            $table->integer('id_user')->nullable();
            $table->string('action', 50); // 'création', 'envoi', 'vérification', 'suppression'
            $table->text('details')->nullable(); // JSON avec les infos détaillées
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('id_bordereau')
                  ->references('id_bordereau')
                  ->on('bordereau')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bordereau_log');
    }
};
