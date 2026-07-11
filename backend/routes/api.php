<?php

use App\Http\Controllers\Api\AdherentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BordereauController;
use App\Http\Controllers\Api\BulletinSoinController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SousAdherentController;
use Illuminate\Support\Facades\Route;

// --- Authentification ---
Route::post('/login', [AuthController::class, 'login'])->name('login');

// --- Routes protégées par Sanctum ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // --- Dashboard ---
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // --- CRUD Adhérents ---
    Route::get('/adherents', [AdherentController::class, 'index']);
    Route::post('/adherents', [AdherentController::class, 'store']);
    Route::get('/adherents/by-matricule/{matricule}', [AdherentController::class, 'byMatricule']);
    Route::get('/adherents/{id}', [AdherentController::class, 'show']);
    Route::get('/adherents/{id}/full', [AdherentController::class, 'full']);
    Route::put('/adherents/{id}', [AdherentController::class, 'update']);
    Route::delete('/adherents/{id}', [AdherentController::class, 'destroy']);

    // --- CRUD Sous-adhérents ---
    Route::get('/sous-adherents', [SousAdherentController::class, 'index']);
    Route::post('/sous-adherents', [SousAdherentController::class, 'store']);
    Route::get('/sous-adherents/{id}', [SousAdherentController::class, 'show']);
    Route::put('/sous-adherents/{id}', [SousAdherentController::class, 'update']);
    Route::delete('/sous-adherents/{id}', [SousAdherentController::class, 'destroy']);

    // --- CRUD Bulletins de soin ---
    Route::get('/bulletins', [BulletinSoinController::class, 'index']);
    Route::post('/bulletins', [BulletinSoinController::class, 'store']);
    Route::get('/bulletins/{id}', [BulletinSoinController::class, 'show']);
    Route::match(['put', 'post'], '/bulletins/{id}', [BulletinSoinController::class, 'update']);
    Route::delete('/bulletins/{id}', [BulletinSoinController::class, 'destroy']);
    Route::get('/bulletins/{id}/pdf', [BulletinSoinController::class, 'downloadPdf']);


    // --- CRUD Bordereaux ---
    Route::get('/bordereaux', [BordereauController::class, 'index']);
    Route::post('/bordereaux', [BordereauController::class, 'store']);
    Route::get('/bordereaux/{id}', [BordereauController::class, 'show']);
    Route::get('/bordereaux/{id}/search', [BordereauController::class, 'search']);
    Route::put('/bordereaux/{id}', [BordereauController::class, 'update']);
    Route::delete('/bordereaux/{id}', [BordereauController::class, 'destroy']);

    // Envoyer un bordereau
    Route::post('/bordereaux/{id}/envoyer', [BordereauController::class, 'envoyer']);

    // Vérification du bordereau par PDF STIP uniquement
    Route::post('/bordereaux/{id}/verifier-pdf', [BordereauController::class, 'verifierPdf']);

    // Historique des actions du bordereau
    Route::get('/bordereaux/{id}/logs', [BordereauController::class, 'logs']);

    // Téléchargement du PDF réponse STIP
    Route::get('/bordereaux/{id}/reponse-pdf', [BordereauController::class, 'reponsePdf']);

    // Re-parser le PDF réponse pour corriger les montant_rembourse des bulletins (backfill)
    Route::post('/bordereaux/{id}/reparer-montants', [BordereauController::class, 'reparerMontantRembourse']);
});

