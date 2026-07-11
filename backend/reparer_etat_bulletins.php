<?php
/**
 * Script de réparation : met à jour l'état (etat) et le montant_rembourse
 * des bulletins du bordereau 11 en ré-analysant le PDF réponse STIP.
 *
 * À exécuter depuis la racine du projet backend :
 *   php reparer_etat_bulletins.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Bordereau;
use App\Models\BulletinSoin;
use App\Services\StipPdfParser;
use Illuminate\Support\Facades\Storage;

$bordereauId = 11;
$bordereau = Bordereau::with('bulletinSoins')->find($bordereauId);

if (!$bordereau) {
    echo "ERREUR : Bordereau $bordereauId introuvable.\n";
    exit(1);
}

if (!$bordereau->fichier_reponse) {
    echo "ERREUR : Aucun fichier réponse pour le bordereau $bordereauId.\n";
    exit(1);
}

$fullPath = Storage::disk('public')->path($bordereau->fichier_reponse);
if (!file_exists($fullPath)) {
    echo "ERREUR : Fichier PDF introuvable : $fullPath\n";
    exit(1);
}

echo "Bordereau #{$bordereau->id_bordereau} : {$bordereau->numero_bordereau}\n";
echo "Statut : {$bordereau->statut}\n";
echo "PDF réponse : {$bordereau->fichier_reponse}\n";
echo "Bulletins en DB : " . $bordereau->bulletinSoins->count() . "\n";

// Parser le PDF
$parser = app(StipPdfParser::class);
$parsedResult = $parser->parse($fullPath);
$parsedBulletins = $parsedResult['bulletins'];
$totalBordereauPdf = $parsedResult['total_bordereau'];

echo "Bulletins dans le PDF : " . count($parsedBulletins) . "\n";
echo "Total Bordereau PDF : " . ($totalBordereauPdf ?? 'NON TROUVÉ') . "\n";

// Indexer les bulletins du PDF par numero_bulletin
// IMPORTANT : garder la PREMIÈRE occurrence seulement (le PDF a des doublons
// où la 2e occurrence a 'En attente' par erreur, ce qui écrase 'Validé')
$pdfIndex = [];
foreach ($parsedBulletins as $item) {
    if (!isset($pdfIndex[$item['numero_bulletin']])) {
        $pdfIndex[$item['numero_bulletin']] = $item;
    }
}

// Pour chaque bulletin en DB, trouver le match dans le PDF et mettre à jour
$updated = 0;
$notFound = [];
$etatCounts = [];

foreach ($bordereau->bulletinSoins as $bs) {
    $numero = $bs->numero_bulletin;
    
    if (!isset($pdfIndex[$numero])) {
        $notFound[] = $numero;
        continue;
    }
    
    $item = $pdfIndex[$numero];
    $updateData = [
        'etat' => $item['statut'],
        'montant_rembourse' => $item['montant_rembourse'],
    ];
    
    $bs->update($updateData);
    $updated++;
    
    $etatCounts[$item['statut']] = ($etatCounts[$item['statut']] ?? 0) + 1;
}

echo "\n--- RÉSULTATS ---\n";
echo "Bulletins mis à jour : $updated\n";
echo "Non trouvés dans le PDF : " . count($notFound) . "\n";
if (!empty($notFound)) {
    echo "Numéros non trouvés : " . implode(', ', $notFound) . "\n";
}
echo "Répartition des états :\n";
foreach ($etatCounts as $etat => $count) {
    echo "  $etat : $count\n";
}

// Recharger et afficher les stats
$bordereau->refresh();
echo "\nNouvelles stats_bulletins : " . json_encode($bordereau->stats_bulletins, JSON_UNESCAPED_UNICODE) . "\n";

echo "\n✓ Terminé.\n";
