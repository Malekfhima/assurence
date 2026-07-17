<?php
/**
 * Script de réinitialisation des bordereaux traités.
 *
 * Remet tous les bordereaux ayant le statut 'Traité' à 'Envoyé',
 * et leurs bulletins à 'En attente' avec montant_rembourse à null.
 *
 * Utile après avoir modifié la logique de parsing PDF (ex: inversion frais/rembourse)
 * pour pouvoir re-vérifier les bordereaux avec le nouveau parser.
 *
 * Exécution : php reinitialiser_bordereaux.php
 * Option :    php reinitialiser_bordereaux.php <id_bordereau>
 *             (pour ne traiter qu'un seul bordereau)
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Bordereau;
use App\Models\BordereauLog;
use App\Models\BulletinSoin;

echo "=== Réinitialisation des bordereaux traités ===\n\n";

// Déterminer si on traite un seul bordereau ou tous
$bordereauId = $argv[1] ?? null;

if ($bordereauId) {
    $bordereaux = Bordereau::where('id_bordereau', $bordereauId)
        ->where('statut', 'Traité')
        ->with('bulletinSoins.details')
        ->get();
    if ($bordereaux->isEmpty()) {
        echo "Aucun bordereau traité avec l'ID #{$bordereauId} trouvé.\n";
        exit(1);
    }
    echo "Traitement du bordereau #{$bordereauId} uniquement...\n\n";
} else {
    $bordereaux = Bordereau::where('statut', 'Traité')
        ->whereNotNull('fichier_reponse')
        ->with('bulletinSoins.details')
        ->get();
    echo "Traitement de tous les bordereaux traités...\n";
    echo "  → {$bordereaux->count()} bordereau(x) trouvé(s)\n\n";
}

$totalBordereauxReinitialises = 0;
$totalBulletinsReinitialises = 0;

foreach ($bordereaux as $bordereau) {
    echo "--- Bordereau N°{$bordereau->numero_bordereau} (ID: {$bordereau->id_bordereau}) ---\n";

    // Statistiques avant réinitialisation (déjà chargé via eager loading)
    $nbBulletins = $bordereau->bulletinSoins->count();
    $nbValides = $bordereau->bulletinSoins->where('etat', 'Validé')->count();
    $nbRejetes = $bordereau->bulletinSoins->where('etat', 'Rejeté')->count();
    $nbSousControle = $bordereau->bulletinSoins->where('etat', 'Sous contrôle')->count();
    $ancienMontantRemb = $bordereau->montant_rembourse;

    echo "  📊 Avant : {$nbValides} validé(s), {$nbRejetes} rejeté(s), {$nbSousControle} sous contrôle, " .
         ($ancienMontantRemb !== null ? number_format($ancienMontantRemb, 3, ',', ' ') . ' DT' : '0 DT') . " remboursé\n";

    // 1. Réinitialiser le bordereau
    $bordereau->update([
        'statut'            => 'Envoyé',
        'montant_rembourse' => null,
        'fichier_reponse'   => null,
        'date_reponse'      => null,
    ]);

    // 2. Réinitialiser tous les bulletins
    $nbMisAJour = 0;
    foreach ($bordereau->bulletinSoins as $bulletin) {
        $bulletin->update([
            'etat'              => 'En attente',
            'montant_rembourse' => null,
        ]);

        // 3. Réinitialiser les montant_rembourse des détails
        foreach ($bulletin->details as $detail) {
            $detail->update(['montant_rembourse' => null]);
        }

        $nbMisAJour++;
    }

    // 4. Journalisation
    BordereauLog::create([
        'id_bordereau' => $bordereau->id_bordereau,
        'id_user'      => null,
        'action'       => 'réinitialisation',
        'details'      => [
            'nb_bulletins'          => $nbBulletins,
            'ancien_statut'         => 'Traité',
            'nouveau_statut'        => 'Envoyé',
            'montant_rembourse_effacé' => $ancienMontantRemb !== null,
            'motif'                 => 'Réinitialisation batch après modification du parser PDF (inversion frais/rembourse)',
        ],
    ]);

    echo "  ✅ Réinitialisé → {$nbMisAJour} bulletin(s) remis en attente\n";

    $totalBordereauxReinitialises++;
    $totalBulletinsReinitialises += $nbMisAJour;
}

echo "\n=== Résultat final ===\n";
echo "Bordereaux réinitialisés : {$totalBordereauxReinitialises}\n";
echo "Bulletins réinitialisés  : {$totalBulletinsReinitialises}\n";
echo "=== Terminé ! ===\n";
