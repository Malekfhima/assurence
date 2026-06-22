<?php

use App\Http\Controllers\Api\AdherentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BordereauController;
use App\Http\Controllers\Api\BulletinSoinController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SousAdherentController;
use Illuminate\Support\Facades\Route;

// --- Authentification ---
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // --- Tableau de bord ---
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // --- Ressources CRUD ---
    // Le binding {adherent} etc. correspond aux clés personnalisées définies
    // dans les modèles (id_adherent, id_bulletin, ...).
    Route::apiResource('adherents', AdherentController::class)
        ->parameters(['adherents' => 'adherent']);

    Route::apiResource('sous-adherents', SousAdherentController::class)
        ->parameters(['sous-adherents' => 'sousAdherent']);

    Route::apiResource('bulletins', BulletinSoinController::class)
        ->parameters(['bulletins' => 'bulletin']);

    Route::apiResource('bordereaux', BordereauController::class)
        ->parameters(['bordereaux' => 'bordereau']);
});
