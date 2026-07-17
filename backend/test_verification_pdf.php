<?php
/**
 * Script de test : Vérifie l'extraction du montant remboursé par soin
 * à partir du PDF STIP.
 *
 * Exécution : php test_verification_pdf.php
 *             php test_verification_pdf.php chemin/vers/fichier.pdf
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\StipPdfParser;

// ─── 1. Déterminer le fichier PDF à tester ────────────────────────────

$pdfPath = $argv[1] ?? null;

if (!$pdfPath) {
    // Chercher un PDF réponse dans la base de données
    try {
        $bordereau = \App\Models\Bordereau::whereNotNull('fichier_reponse')
            ->latest('id_bordereau')
            ->first();
    } catch (\Exception $e) {
        $bordereau = null;
    }

    if ($bordereau && $bordereau->fichier_reponse) {
        $pdfPath = \Illuminate\Support\Facades\Storage::disk('public')->path($bordereau->fichier_reponse);
        echo "📄 Utilisation du PDF réponse du bordereau N°{$bordereau->numero_bordereau}\n";
    } else {
        // Fallback : chercher dans annex/
        $annexDir = __DIR__ . '/../annex';
        if (is_dir($annexDir)) {
            $files = glob($annexDir . '/*.pdf');
            if (!empty($files)) {
                $pdfPath = $files[0];
                echo "📄 Utilisation du PDF : " . basename($pdfPath) . "\n";
            }
        }
    }
}

if (!$pdfPath || !file_exists($pdfPath)) {
    echo "❌ Aucun fichier PDF trouvé.\n";
    echo "Usage : php test_verification_pdf.php <chemin_vers_pdf>\n";
    exit(1);
}

echo "📄 Fichier : " . basename($pdfPath) . "\n";
echo "📏 Taille   : " . round(filesize($pdfPath) / 1024, 1) . " Ko\n\n";

// ─── 2. Parser le PDF ────────────────────────────────────────────────

$parser = app(StipPdfParser::class);

echo "⏳ Parsing du PDF...\n";

try {
    $startTime = microtime(true);
    $result = $parser->parse($pdfPath);
    $elapsed = round((microtime(true) - $startTime) * 1000, 0);
    echo "✅ PDF parsé en {$elapsed} ms\n\n";
} catch (\RuntimeException $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
    exit(1);
}

// ─── 3. Afficher les résultats ───────────────────────────────────────

$bulletins = $result['bulletins'] ?? [];
$totalBordereau = $result['total_bordereau'] ?? null;
$detailsParBulletin = $result['details_par_bulletin'] ?? [];

echo "═══════════════════════════════════════════════════════\n";
echo "  RÉSULTATS DU PARSING\n";
echo "═══════════════════════════════════════════════════════\n\n";

echo "📊 Statistiques générales :\n";
echo "   Bulletins trouvés        : " . count($bulletins) . "\n";
echo "   Bulletins avec détails   : " . count($detailsParBulletin) . "\n";
echo "   Total Bordereau (PDF)    : " . ($totalBordereau !== null ? number_format($totalBordereau, 3, ',', ' ') . ' DT' : 'NON TROUVÉ') . "\n\n";

// ─── 4. Afficher les bulletins du tableau récapitulatif ──────────────

echo "═══════════════════════════════════════════════════════\n";
echo "  LISTE DES BULLETINS (tableau récapitulatif)\n";
echo "═══════════════════════════════════════════════════════\n\n";

printf("  %-15s %-12s %-15s\n", "N° Bulletin", "Statut", "Mt Remboursé");
echo str_repeat("  ", 42) . "\n";

foreach ($bulletins as $b) {
    $montantStr = $b['montant_rembourse'] !== null
        ? number_format($b['montant_rembourse'], 3, ',', ' ') . ' DT'
        : 'N/A';
    printf("  %-15s %-12s %-15s\n", $b['numero_bulletin'], $b['statut'], $montantStr);
}

echo "\n";

// ─── 5. Afficher les DÉTAILS par bulletin (soins individuels) ────────

echo "═══════════════════════════════════════════════════════\n";
echo "  DÉTAILS PAR BULLETIN (RELEVE INDIVIDUEL)\n";
echo "═══════════════════════════════════════════════════════\n\n";

if (empty($detailsParBulletin)) {
    echo "  ⚠️  Aucune section RELEVE INDIVIDUEL trouvée dans le PDF.\n";
    echo "     Les montants remboursés par soin ne seront PAS extraits.\n\n";
} else {
    foreach ($detailsParBulletin as $numero => $detailData) {
        echo "── Bulletin N°{$numero} ──────────────────────────\n\n";

        $lignes = $detailData['lignes'] ?? [];
        $totalFrais = $detailData['total_frais'] ?? null;
        $totalRembourse = $detailData['total_rembourse'] ?? null;

        if (empty($lignes)) {
            echo "  Aucun détail de soin.\n\n";
            continue;
        }

        // En-tête du tableau
        printf("  %-8s %-12s %-12s %-12s\n", "Rubrique", "Frais", "Remboursé", "Taux");
        echo "  " . str_repeat("─", 48) . "\n";

        foreach ($lignes as $ligne) {
            $taux = $ligne['frais'] > 0
                ? round(($ligne['rembourse'] / $ligne['frais']) * 100, 0) . '%'
                : '-';

            printf(
                "  %-8s %10s  %10s  %10s\n",
                $ligne['rubrique'],
                number_format($ligne['frais'], 3, ',', ' ') . ' DT',
                number_format($ligne['rembourse'], 3, ',', ' ') . ' DT',
                $taux
            );
        }

        echo "  " . str_repeat("─", 48) . "\n";
        if ($totalFrais !== null) {
            printf("  %-8s %10s\n", "Totaux", number_format($totalFrais, 3, ',', ' ') . ' DT');
        }
        if ($totalRembourse !== null) {
            printf("  %-8s %10s\n", "Remb.", number_format($totalRembourse, 3, ',', ' ') . ' DT');
        }
        echo "\n";
    }
}

// ─── 6. Test de l'algorithme updateBulletinDetails (mock) ────────────

echo "═══════════════════════════════════════════════════════\n";
echo "  SIMULATION : Mise à jour des détails\n";
echo "═══════════════════════════════════════════════════════\n\n";

if (!empty($detailsParBulletin)) {
    echo "  Les détails ci-dessus seront mis à jour dans la base de données\n";
    echo "  lors de la vérification via l'API.\n\n";

    foreach ($detailsParBulletin as $numero => $detailData) {
        $lignes = $detailData['lignes'] ?? [];
        $totalLignes = count($lignes);
        $totalRembourse = $detailData['total_rembourse'] ?? 0;

        // Simuler l'algorithme de matching
        echo "  Bulletin N°{$numero} : {$totalLignes} soin(s), " .
             "remboursement total = " . number_format($totalRembourse, 3, ',', ' ') . " DT\n";

        // Simulation du matching par rubrique
        $soinsSimules = [];
        foreach ($lignes as $ligne) {
            $rubrique = $ligne['rubrique'];
            if (!isset($soinsSimules[$rubrique])) {
                $soinsSimules[$rubrique] = [
                    'frais' => 0,
                    'rembourse' => 0,
                    'nb_lignes' => 0,
                ];
            }
            $soinsSimules[$rubrique]['frais'] += $ligne['frais'];
            $soinsSimules[$rubrique]['rembourse'] += $ligne['rembourse'];
            $soinsSimules[$rubrique]['nb_lignes']++;
        }

        echo "  Après accumulation par rubrique :\n";
        foreach ($soinsSimules as $rub => $data) {
            $taux = $data['frais'] > 0
                ? ' (' . round(($data['rembourse'] / $data['frais']) * 100, 0) . '%)'
                : '';
            echo "    {$rub} : frais=" . number_format($data['frais'], 3, ',', ' ') .
                 " DT → remb=" . number_format($data['rembourse'], 3, ',', ' ') . " DT{$taux}";
            if ($data['nb_lignes'] > 1) {
                echo " ({$data['nb_lignes']} lignes accumulées)";
            }
            echo "\n";
        }
        echo "\n";
    }
} else {
    echo "  ⚠️  Aucun détail à simuler.\n\n";
}

// ─── 7. Résumé ───────────────────────────────────────────────────────

echo "═══════════════════════════════════════════════════════\n";
echo "  RÉSUMÉ\n";
echo "═══════════════════════════════════════════════════════\n\n";

$nbAvecDetails = count($detailsParBulletin);
$nbSansDetails = count($bulletins) - $nbAvecDetails;
$nbLignes = array_sum(array_map(fn($d) => count($d['lignes'] ?? []), $detailsParBulletin));

echo "  ✓ {$nbAvecDetails} bulletin(s) avec détails de soins extraits\n";
echo "  ✓ {$nbLignes} ligne(s) de détail extraite(s) du RELEVE INDIVIDUEL\n";
if ($nbSansDetails > 0) {
    echo "  ⚠️  {$nbSansDetails} bulletin(s) sans détails (pas de section RELEVE dans le PDF)\n";
}
if ($totalBordereau !== null) {
    echo "  ✓ Total Bordereau extrait : " . number_format($totalBordereau, 3, ',', ' ') . " DT\n";
}
echo "\n";

// ─── 8. Vérification de cohérence ────────────────────────────────────

echo "═══════════════════════════════════════════════════════\n";
echo "  VÉRIFICATION DE COHÉRENCE\n";
echo "═══════════════════════════════════════════════════════\n\n";

$totalBulletinsValides = 0;
$sommeRembourseParBulletin = 0;

foreach ($bulletins as $b) {
    if ($b['statut'] === 'Validé') {
        $totalBulletinsValides++;
        $sommeRembourseParBulletin += $b['montant_rembourse'] ?? 0;
    }
}

if ($totalBordereau !== null) {
    $diff = abs($totalBordereau - $sommeRembourseParBulletin);
    if ($diff < 0.01) {
        echo "  ✅ Somme des montants remboursés = Total Bordereau : ";
    } else {
        echo "  ⚠️  Différence entre somme et Total Bordereau : ";
    }
    echo number_format($sommeRembourseParBulletin, 3, ',', ' ') . " DT vs " .
         number_format($totalBordereau, 3, ',', ' ') . " DT\n";
}

// Vérifier si les détails par bulletin sont cohérents
foreach ($detailsParBulletin as $numero => $dd) {
    $sommeFrais = array_sum(array_map(fn($l) => $l['frais'], $dd['lignes']));
    $sommeRemb = array_sum(array_map(fn($l) => $l['rembourse'], $dd['lignes']));
    
    if ($dd['total_frais'] !== null && abs($sommeFrais - $dd['total_frais']) > 0.01) {
        echo "  ⚠️  Bulletin N°{$numero} : somme frais ({$sommeFrais}) ≠ total attendu ({$dd['total_frais']})\n";
    }
    if ($dd['total_rembourse'] !== null && abs($sommeRemb - $dd['total_rembourse']) > 0.01) {
        echo "  ⚠️  Bulletin N°{$numero} : somme remb ({$sommeRemb}) ≠ total attendu ({$dd['total_rembourse']})\n";
    }
}

echo "\n✅ Test terminé.\n";
