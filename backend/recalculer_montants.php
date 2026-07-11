<?php
/**
 * Script de recalcul des montants des bordereaux et bulletins.
 *
 * Ce script :
 * 1. Recalcule le montant_depense de chaque bulletin depuis ses détails
 * 2. Recalcule le montant_total de chaque bordereau = somme des montant_depense de ses bulletins
 *
 * Exécution : php recalculer_montants.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Bordereau;
use App\Models\BulletinSoin;
use Illuminate\Support\Facades\DB;

echo "=== Recalcul des montants ===\n\n";

$totalBulletinsCorriges = 0;
$totalBordereauxCorriges = 0;

// 1. Recalculer le montant_depense de chaque bulletin depuis ses détails
echo "--- Étape 1 : Recalcul des montant_depense des bulletins ---\n";

$bulletins = BulletinSoin::with('details')->get();
foreach ($bulletins as $bulletin) {
    if ($bulletin->details->isEmpty()) {
        continue; // Pas de détails, on garde la valeur actuelle
    }

    $montantReel = (float) $bulletin->details->sum('montant');
    $montantActuel = (float) $bulletin->montant_depense;

    if (abs($montantReel - $montantActuel) > 0.001) {
        $bulletin->update(['montant_depense' => $montantReel]);
        echo "  Bulletin N°{$bulletin->numero_bulletin} : {$montantActuel} → {$montantReel} DT\n";
        $totalBulletinsCorriges++;
    }
}

echo "  {$totalBulletinsCorriges} bulletin(s) corrigé(s)\n\n";

// 2. Recalculer le montant_total de chaque bordereau
echo "--- Étape 2 : Recalcul des montant_total des bordereaux ---\n";

$bordereaux = Bordereau::with('bulletinSoins')->get();
foreach ($bordereaux as $bordereau) {
    if ($bordereau->bulletinSoins->isEmpty()) {
        continue;
    }

    $montantReel = (float) $bordereau->bulletinSoins->sum('montant_depense');
    $montantActuel = (float) ($bordereau->montant_total ?? 0);

    if (abs($montantReel - $montantActuel) > 0.001) {
        $bordereau->update(['montant_total' => $montantReel]);
        $statut = $bordereau->statut ?? 'inconnu';
        echo "  Bordereau N°{$bordereau->numero_bordereau} [{$statut}] : {$montantActuel} → {$montantReel} DT\n";
        $totalBordereauxCorriges++;
    }
}

echo "  {$totalBordereauxCorriges} bordereau(x) corrigé(s)\n\n";
echo "=== Terminé ! ===\n";
echo "Bulletins corrigés : {$totalBulletinsCorriges}\n";
echo "Bordereaux corrigés : {$totalBordereauxCorriges}\n";
