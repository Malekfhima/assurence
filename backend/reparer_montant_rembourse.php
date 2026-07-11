<?php
/**
 * Script de correction des montant_rembourse des bulletins à partir du PDF réponse STIP.
 *
 * Ce script parcourt tous les bordereaux traités qui ont un fichier PDF réponse,
 * re-parse le PDF et met à jour le montant_rembourse de chaque bulletin.
 *
 * Exécution : php reparer_montant_rembourse.php
 * Option :    php reparer_montant_rembourse.php <id_bordereau>
 *             (pour ne traiter qu'un seul bordereau)
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Bordereau;
use App\Models\BulletinSoin;
use App\Services\StipPdfParser;
use Illuminate\Support\Facades\Storage;

echo "=== Correction des montant_rembourse des bulletins ===\n\n";

$parser = app(StipPdfParser::class);

// Déterminer si on traite un seul bordereau ou tous
$bordereauId = $argv[1] ?? null;

if ($bordereauId) {
    $bordereaux = Bordereau::where('id_bordereau', $bordereauId)->get();
    if ($bordereaux->isEmpty()) {
        echo "Bordereau #{$bordereauId} introuvable.\n";
        exit(1);
    }
    echo "Traitement du bordereau #{$bordereauId} uniquement...\n\n";
} else {
    $bordereaux = Bordereau::where('statut', 'Traité')
        ->whereNotNull('fichier_reponse')
        ->get();
    echo "Traitement de tous les bordereaux traités avec PDF réponse...\n\n";
}

$totalBulletinsCorriges = 0;
$totalBordereauxCorriges = 0;

foreach ($bordereaux as $bordereau) {
    echo "--- Bordereau N°{$bordereau->numero_bordereau} (ID: {$bordereau->id_bordereau}) ---\n";

    // Vérifier que le fichier PDF existe
    $disk = Storage::disk('public');
    $pdfPath = $bordereau->fichier_reponse;

    if (!$pdfPath || !$disk->exists($pdfPath)) {
        echo "  ❌ Fichier PDF réponse introuvable : {$pdfPath}\n\n";
        continue;
    }

    $fullPath = $disk->path($pdfPath);

    // Parser le PDF
    try {
        $parsedResult = $parser->parse($fullPath);
    } catch (\RuntimeException $e) {
        echo "  ❌ Erreur d'analyse du PDF : " . $e->getMessage() . "\n\n";
        continue;
    }

    $parsedBulletins = $parsedResult['bulletins'];
    $totalBordereauPdf = $parsedResult['total_bordereau'];

    if (empty($parsedBulletins)) {
        echo "  ❌ Aucun bulletin trouvé dans le PDF.\n\n";
        continue;
    }

    echo "  📄 PDF parsé : " . count($parsedBulletins) . " bulletin(s) trouvé(s)\n";
    if ($totalBordereauPdf !== null) {
        echo "  💰 Total bordereau (PDF) : " . number_format($totalBordereauPdf, 3, ',', ' ') . " DT\n";
    }

    // Indexer les bulletins du bordereau par numero_bulletin
    $bordereau->load('bulletinSoins');
    $bulletinIndex = [];
    foreach ($bordereau->bulletinSoins as $bs) {
        $bulletinIndex[$bs->numero_bulletin] = $bs;
    }

    // Mettre à jour chaque bulletin
    $nbCorriges = 0;
    $nbNonTrouves = 0;

    foreach ($parsedBulletins as $item) {
        $numero = $item['numero_bulletin'];
        $statut = $item['statut'];
        $montantRembourse = $item['montant_rembourse'];

        if (!isset($bulletinIndex[$numero])) {
            echo "  ⚠️  Bulletin N°{$numero} non trouvé dans le bordereau\n";
            $nbNonTrouves++;
            continue;
        }

        $bulletin = $bulletinIndex[$numero];
        $ancienMontant = $bulletin->montant_rembourse;
        $ancienEtat = $bulletin->etat;

        $bulletin->update([
            'etat' => $statut,
            'montant_rembourse' => $montantRembourse,
        ]);

        $montantStr = $montantRembourse !== null
            ? number_format($montantRembourse, 3, ',', ' ') . ' DT'
            : 'N/A (0 DT)';

        $ancienMontantStr = $ancienMontant !== null
            ? number_format($ancienMontant, 3, ',', ' ') . ' DT'
            : 'vide';

        echo "  ✅ Bulletin N°{$numero} : {$ancienEtat}→{$statut} | montant_rembourse : {$ancienMontantStr} → {$montantStr}\n";
        $nbCorriges++;
    }

    // Mettre à jour le montant_rembourse du bordereau (Total Bordereau du PDF)
    $montantRembourseTotal = $totalBordereauPdf;
    if ($montantRembourseTotal === null) {
        // Fallback : somme des montant_rembourse des bulletins validés
        $montantRembourseTotal = BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
            ->where('etat', 'Validé')
            ->sum('montant_rembourse');
    }

    $bordereau->update(['montant_rembourse' => $montantRembourseTotal]);
    $totalStr = number_format($montantRembourseTotal, 3, ',', ' ') . ' DT';
    echo "  💰 Bordereau mis à jour : montant_rembourse = {$totalStr}\n";

    $totalBulletinsCorriges += $nbCorriges;
    $totalBordereauxCorriges++;
    echo "\n";
}

echo "=== Résultat final ===\n";
echo "Bordereaux traités : {$totalBordereauxCorriges}\n";
echo "Bulletins corrigés : {$totalBulletinsCorriges}\n";
echo "=== Terminé ! ===\n";
