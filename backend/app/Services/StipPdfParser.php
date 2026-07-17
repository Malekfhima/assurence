<?php

namespace App\Services;

use Smalot\PdfParser\Parser as PdfParser;

class StipPdfParser
{
    /**
     * Parse un fichier PDF STIP (Bordereau de Remboursement Maladie)
     * et retourne la liste des bulletins avec leur statut et montant de remboursement,
     * ainsi que le Total Bordereau présent dans le PDF.
     *
     * Le PDF contient un tableau avec les colonnes :
     *   - Bulletin       : numéro du bulletin (ex: I145278, J862318)
     *   - Date de soin   : date du soin
     *   - Remboursement  : montant remboursé (ex: 292.068) ou statut (Rejeté, S/Contrôle)
     *
     * En bas du PDF, une ligne "Total bordereau : XXXX.XXX" donne le total.
     *
     * @param  string  $pdfPath  Chemin absolu vers le fichier PDF
     * @return array{bulletins: array<int, array{numero_bulletin: string, statut: string, montant_rembourse: ?float}>, total_bordereau: ?float}
     */
    public function parse(string $pdfPath): array
    {
        // Vérifier que le fichier existe
        if (!file_exists($pdfPath)) {
            throw new \RuntimeException('Le fichier PDF est introuvable sur le serveur.');
        }

        // 1. Extraction principale : pdftotext -layout (conserve la disposition en colonnes)
        //    Utilisé pour le tableau récapitulatif des bulletins
        $textLayout = $this->extractTextWithFlag($pdfPath, '-layout');

        // 2. Extraction secondaire : pdftotext -raw (ordre de lecture)
        //    Utilisé pour les sections "RELEVE INDIVIDUEL" où -layout déforme les colonnes
        $textRaw = $this->extractTextWithFlag($pdfPath, '-raw');

        // 3. Fallback commun : smalot/pdfparser en PHP
        if ($textLayout === null) {
            $textLayout = $this->extractTextWithPhpParser($pdfPath);
            $textRaw = $textLayout; // fallback, pas de distinction layout/raw
        }

        if ($textLayout === null || trim($textLayout) === '') {
            $fileSize = filesize($pdfPath);
            throw new \RuntimeException(
                "Impossible d'extraire le texte du PDF. " .
                'Le PDF semble être une image scannée (taille : ' . round($fileSize / 1024) . ' Ko). ' .
                'Veuillez fournir un PDF avec une couche texte (non scanné).'
            );
        }

        // Si -raw a échoué, utiliser -layout comme fallback pour les détails aussi
        if ($textRaw === null) {
            $textRaw = $textLayout;
        }

        return $this->parseBulletinsFromText($textLayout, $textRaw);
    }

    /**
     * Extrait le texte d'un PDF via pdftotext (poppler-utils) avec un flag donné.
     *
     * @param  string  $pdfPath
     * @param  string  $flag  '-layout', '-raw', ou ''
     * @return string|null
     */
    private function extractTextWithFlag(string $pdfPath, string $flag): ?string
    {
        $escapedPath = escapeshellarg($pdfPath);
        $nullDevice = $this->isWindows() ? 'nul' : '/dev/null';
        $output = shell_exec("pdftotext {$flag} {$escapedPath} - 2>{$nullDevice}");
        return ($output !== null && $output !== false && trim($output) !== '') ? $output : null;
    }

    /**
     * Extrait le texte d'un PDF via smalot/pdfparser (fallback PHP).
     */
    private function extractTextWithPhpParser(string $pdfPath): ?string
    {
        try {
            $parser = new PdfParser();
            $pdf = $parser->parseFile($pdfPath);
            $text = $pdf->getText();

            if ($text !== null && trim($text) !== '') {
                return $text;
            }
        } catch (\Exception $e) {
            // Le parser PHP a échoué, on retourne null
        }

        return null;
    }

    /**
     * Vérifie si le système d'exploitation est Windows.
     */
    private function isWindows(): bool
    {
        return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
    }

    /**
     * Analyse le texte brut extrait pour trouver :
     *   - Les lignes de bulletins STIP
     *   - La ligne "Total bordereau"
     *
     * Format attendu (pdftotext -layout) :
     *   I145278 04/06/2026 695 LAAJILI ABDELHAMID LAAJILI AFEF 292.068
     *   J862318 28/03/2026 859 ZRELLI MED ZRELLI MANEL Rejeté
     *   ...
     *   Total bordereau : 12623.945
     *
     * @param  string  $textLayout  Texte extrait en mode -layout (pour le tableau récapitulatif)
     * @param  string  $textRaw     Texte extrait en mode -raw (pour les sections RELEVE INDIVIDUEL)
     * @return array{bulletins: array, total_bordereau: ?float, details_par_bulletin: array}
     */
    private function parseBulletinsFromText(string $textLayout, string $textRaw): array
    {
        // Nettoyer les caractères d'encodage (é/è -> e) pour que les regex fonctionnent
        $text = str_replace("\u{FFFD}", 'e', $textLayout);
        $text = preg_replace('/[\x80-\x9F\x7F]/', '', $text);

        $lines = explode("\n", $text);
        $bulletins = [];
        $totalBordereau = null;
        $textPreview = mb_substr($text, 0, 600);

        foreach ($lines as $line) {
            $trimmed = trim($line);

            // Ignorer les lignes vides
            if ($trimmed === '') {
                continue;
            }

            // --- DÉTECTION DU TOTAL BORDEREAU ---
            if (preg_match('/^Total\s+bordereau\s*:?\s*([\d\s,.]+)$/i', $trimmed, $totalMatch)) {
                $totalValue = str_replace([' ', ','], ['', '.'], trim($totalMatch[1]));
                if (is_numeric($totalValue)) {
                    $totalBordereau = (float) $totalValue;
                }
                continue;
            }

            // Ligne comme : "Arrêté le présent bordereau à la somme de : XXXX.XXX"
            if ($totalBordereau === null && preg_match('/Arrêté.*à\s+la\s+somme\s+(de\s+)?:?\s*([\d\s,.]+)/i', $trimmed, $totalMatch)) {
                $totalValue = str_replace([' ', ','], ['', '.'], trim($totalMatch[2]));
                if (is_numeric($totalValue)) {
                    $totalBordereau = (float) $totalValue;
                }
                continue;
            }

            // Ignorer les lignes qui ne contiennent qu'une date (jj/mm/aaaa)
            if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $trimmed)) {
                continue;
            }

            // Ignorer les lignes d'en-tête, pied de page, et métadonnées
            if ($this->isHeaderOrFooterLine($trimmed)) {
                continue;
            }

            // --- DÉTECTION DU NUMÉRO DE BULLETIN ---
            $numero = $this->findNumeroBulletin($trimmed);

            if ($numero === null) {
                continue;
            }

            // Extraire tous les mots de la ligne
            $parts = preg_split('/\s+/', $trimmed);

            // Ignorer les lignes qui ne contiennent qu'un seul mot
            if (count($parts) < 2) {
                continue;
            }

            // Déterminer la valeur de la colonne "Remboursement" (statut ou montant)
            // C'est généralement le dernier mot de la ligne (pour pdftotext -layout)
            $lastPart = end($parts);
            $value = $this->cleanValue($lastPart);
            if ($value === '.' || $value === '') {
                $value = $this->cleanValue(prev($parts));
            }

            // Déterminer le statut à partir de la valeur de remboursement
            $statut = $this->determineStatus($value);
            $montant = null;

            if ($statut === 'Validé') {
                $numericValue = str_replace([' ', ','], ['', '.'], $value);
                if (is_numeric($numericValue)) {
                    $montant = (float) $numericValue;
                }
            }

            $bulletins[] = [
                'numero_bulletin'   => $numero,
                'statut'            => $statut,
                'montant_rembourse' => $montant,
            ];
        }

        if (empty($bulletins)) {
            $message = 'Le PDF ne contient pas les données de bulletins attendues au format STIP. ';
            $message .= "Vérifiez que le fichier est bien un Bordereau de Remboursement Maladie valide.\n\n";
            $message .= "--- Début du texte extrait (600 premiers caractères) ---\n";
            $message .= $textPreview . "\n";
            $message .= '--- Fin du texte extrait ---';

            throw new \RuntimeException($message);
        }

        // Extraire les détails par bulletin depuis les sections "RELEVE INDIVIDUEL DE REMBOURSEMENT"
        // Utiliser le texte -raw (ordre de lecture) pour un mapping rubrique->montant fiable
        $textRawCleaned = str_replace("\u{FFFD}", 'e', $textRaw);
        $textRawCleaned = preg_replace('/[\x80-\x9F\x7F]/', '', $textRawCleaned);
        $detailsParBulletin = $this->parseDetailsFromText($textRawCleaned);

        return [
            'bulletins'            => $bulletins,
            'total_bordereau'      => $totalBordereau,
            'details_par_bulletin' => $detailsParBulletin,
        ];
    }

    /**
     * Parse les sections "RELEVE INDIVIDUEL DE REMBOURSEMENT" du texte PDF
     * pour extraire le détail par soin de chaque bulletin validé.
     *
     * Format attendu (pdftotext -layout) :
     *
     *   Adhérent       695        LAAJILI ABDELHAMID                             Bulletin N°          I145278
     *   Rubrique     Libellé                              Observations                        Frais        Rembours.
     *   C2     1     CONSULTATION SPECIALISTE                                                    70,000            40,000
     *   OPM    0     OPTIQUE MONTURE                      PLAFOND RUBRIQUE ANNUEL ATTEINT       350,000         150,000
     *   PH     0     PHARMACIE                                                                    2,298             2,068
     *                                                                 Totaux :          622,298             292,068
     *         NET A REGLER       292,068
     *
     * @param  string  $text  Texte brut extrait du PDF
     * @return array  Indexé par numero_bulletin, chaque élément contient 'lignes', 'total_frais', 'total_rembourse'
     */
    /**
     * Parse les sections "RELEVE INDIVIDUEL DE REMBOURSEMENT" à partir du texte extrait
     * en mode -raw (pdftotext -raw).
     *
     * Dans le mode -raw, chaque rubrique est sur DEUX lignes consécutives :
     *   Ligne 1 : CODE [...texte...] MONTANT_REMBOURS   (ex: "C2 40,000" ou "OPM PLAFOND... 150,000")
     *   Ligne 2 : N LIBELLE MONTANT_FRAIS               (ex: "1 CONSULTATION SPECIALISTE 70,000")
     *
     * @param  string  $text  Texte brut extrait en mode -raw
     * @return array           Indexé par numero_bulletin
     */
    private function parseDetailsFromText(string $text): array
    {
        $detailsParBulletin = [];

        // Détecter chaque section "RELEVE INDIVIDUEL DE REMBOURSEMENT"
        // Dans le mode -raw, le titre est sur une seule ligne
        $sections = preg_split('/^RELEVE\s+INDIVIDUEL\s+DE\s+REMBOURSEMENT\s*$/m', $text);
        if (count($sections) <= 1) {
            // Fallback: le titre peut être sans $ de fin de ligne
            $sections = preg_split('/RELEVE\s+INDIVIDUEL(?:\s+DE\s+REMBOURSEMENT)?/i', $text);
        }

        // Ignorer le texte avant la première section
        array_shift($sections);

        // Rubriques à ignorer (faux positifs)
        $ignoreCodes = ['RUBRIQUE', 'LIBELLE', 'OBSERVATIONS', 'FRAIS', 'REMBOURS',
                        'TOTAUX', 'NET', 'PATIENT', 'MATRICULE', 'BULLETIN',
                        'BORDEREAU', 'GROUPE', 'CONTRAT', 'STIP', 'ADHERENT',
                        'TOTAL', 'DATE', 'RELEVE', 'INDIVIDUEL', 'REMBOURSEMENT'];

        foreach ($sections as $section) {
            $lines = explode("\n", $section);

            // Chercher le numéro de bulletin (première ligne après le titre qui est un code bulletin)
            $numeroBulletin = null;
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if ($trimmed === '') continue;
                // Format raw: le bulletin est souvent sur la ligne juste après RELEVE
                if (preg_match('/\b([A-Z]\d{6})\b/', $trimmed, $m)) {
                    $numeroBulletin = $m[1];
                    break;
                }
            }
            if ($numeroBulletin === null) continue;

            // Parser les lignes de détail en mode raw (deux lignes par rubrique)
            $lignes = [];
            $totalFrais = null;
            $totalRembourse = null;
            $enAttenteRubrique = false; // true après avoir vu une ligne code+rembourse
            $currentRembourse = null;
            $currentRubrique = null;

            foreach ($lines as $line) {
                $trimmed = trim($line);
                if ($trimmed === '') {
                    $enAttenteRubrique = false;
                    continue;
                }

                // Ignorer les lignes d'en-tête et métadonnées
                if (preg_match('/^(Bordereau|Bulletin|Contrat|Adherent|Matricule|Patient|GROUPE|S T I P|Date de soins?|Date de remboursement)/i', $trimmed)) {
                    $enAttenteRubrique = false;
                    continue;
                }

                // Détecter "Totaux"
                $totauxMatched = false;
                if (preg_match('/^Totaux?\s*:/i', $trimmed)) {
                    $totauxMatched = true;
                    if (preg_match_all('/(\d+[\.,]\d{3}(?:[\.,]\d{3})*|[\d]+[\.,]\d+)/', $trimmed, $m)) {
                        $all = array_map(fn($n) => (float) str_replace([',', ' '], ['.', ''], $n), $m[0]);
                        $c = count($all);
                        if ($c >= 2) { 
                            // Mode -layout : les deux nombres sont sur la même ligne
                            // Ordre inversé : REMBOURSE FRAIS
                            $totalFrais = $all[$c-1]; 
                            $totalRembourse = $all[$c-2]; 
                        } elseif ($c === 1) {
                            // Mode -raw : un seul nombre, c'est le REMBOURSE
                            // Le FRAIS sera sur la ligne suivante
                            $totalRembourse = $all[0];
                        }
                    }
                    $enAttenteRubrique = false;
                }

                // Mode -raw : la ligne après "Totaux" contient le FRAIS total
                // (c'est une ligne avec un seul nombre, sans texte)
                if (!$totauxMatched && $totalRembourse !== null && $totalFrais === null && preg_match('/^[\d.,\s]+$/', $trimmed)) {
                    $trimmedClean = trim($trimmed);
                    if (preg_match('/^(\d+[\.,]\d{3}(?:[\.,]\d{3})*|[\d]+[\.,]\d+)$/', $trimmedClean, $mSingle)) {
                        $totalFrais = (float) str_replace([',', ' '], ['.', ''], $mSingle[1]);
                    }
                    $enAttenteRubrique = false;
                    continue;
                }

                // Si c'était la ligne "Totaux", on continue (ne pas traiter comme rubrique)
                if ($totauxMatched) {
                    continue;
                }

                // Détecter "NET A REGLER" + nombre (total rembourse)
                if (preg_match('/^NET\s+A\s+REGLER\s+([\d.,]+)/i', $trimmed, $mNet)) {
                    if ($totalRembourse === null) {
                        $totalRembourse = (float) str_replace([',', ' '], ['.', ''], $mNet[1]);
                    }
                    $enAttenteRubrique = false;
                    continue;
                }

                // Détecter une ligne avec juste des nombres (totaux en ligne séparée)
                if (preg_match('/^[\d.,\s]+$/', $trimmed)) {
                    $enAttenteRubrique = false;
                    continue;
                }

                // --- DÉTECTION : ligne avec code rubrique ---
                // DEUX FORMATS possibles :
                //
                // Format A (pdftotext -raw) : DEUX lignes consécutives
                //   Ligne 1 : "C2 40,000"  ou  "OPM PLAFOND... 150,000"  ou  "PH 2,068"
                //   Ligne 2 : "1 CONSULTATION SPECIALISTE 70,000"  (contient le FRAIS)
                //
                // Format B (pdftotext -layout / smalot) : UNE SEULE ligne
                //   "C2     1     CONSULTATION SPECIALISTE   70,000            40,000"
                //   (code + libellé + FRAIS + REMBOURSE sur la même ligne)
                //
                if (preg_match('/^\s*([A-Z][A-Z.0-9]{0,5})\b/', $trimmed, $rm)) {
                    $code = strtoupper(trim($rm[1]));
                    if (!in_array($code, $ignoreCodes)) {
                        // Vérifier que la ligne contient au moins un nombre
                        if (preg_match_all('/(\d+[\.,]\d{3}(?:[\.,]\d{3})*|[\d]+[\.,]\d+)/', $trimmed, $mNums)) {
                            $nums = array_map(fn($n) => (float) str_replace([',', ' '], ['.', ''], $n), $mNums[0]);

                            if (count($nums) >= 2) {
                                // FORMAT B (1 ligne) : frais ET rembourse sur cette même ligne
                                // Le dernier nombre = FRAIS, l'avant-dernier = REMBOURSE (inversé)
                                $lignes[] = [
                                    'rubrique'  => $code,
                                    'frais'     => end($nums),
                                    'rembourse' => $nums[count($nums) - 2],
                                ];
                            } else {
                                // FORMAT A (2 lignes) : un seul nombre = frais
                                // Attendre la ligne suivante pour le rembourse
                                $currentRubrique = $code;
                                $currentFrais = end($nums); // dernier nombre = frais (inversé)
                                $enAttenteRubrique = true;
                                continue;
                            }
                        }
                    }
                }

                // --- LIGNE DE REMBOURSE (après une ligne rubrique) ---
                // Format: "1 CONSULTATION SPECIALISTE 70,000" ou "0 PHARMACIE 2,298"
                // Le dernier nombre est le REMBOURSE (inversé)
                if ($enAttenteRubrique && $currentRubrique !== null) {
                    if (preg_match_all('/(\d+[\.,]\d{3}(?:[\.,]\d{3})*|[\d]+[\.,]\d+)/', $trimmed, $mNums)) {
                        $nums = array_map(fn($n) => (float) str_replace([',', ' '], ['.', ''], $n), $mNums[0]);
                        $rembourse = end($nums); // dernier nombre = rembourse (inversé)

                        $lignes[] = [
                            'rubrique'  => $currentRubrique,
                            'frais'     => $currentFrais,
                            'rembourse' => $rembourse,
                        ];
                    }
                }

                $enAttenteRubrique = false;
            }

            if (!empty($lignes)) {
                $detailsParBulletin[$numeroBulletin] = [
                    'lignes'           => $lignes,
                    'total_frais'      => $totalFrais,
                    'total_rembourse'  => $totalRembourse,
                ];
            }
        }

        return $detailsParBulletin;
    }

    /**
     * Parse une ligne de détail de soin extraite d'une section "RELEVE INDIVIDUEL".
     *
     * Format attendu: CODE  N  LIBELLE  [OBSERVATIONS]  FRAIS  REMBOURS
     * Exemple: "C2     1     CONSULTATION SPECIALISTE   70,000            40,000"
     *
     * @param  string  $line
     * @return array|null  ['rubrique' => string, 'frais' => float, 'rembourse' => float] ou null
     */
    private function parseDetailLine(string $line): ?array
    {
        // Extraire les nombres décimaux à la fin de la ligne (Frais et Rembours.)
        // Les nombres peuvent être au format "70,000" ou "70.000"
        if (!preg_match_all('/(\d+[\.,]\d{3}(?:[\.,]\d{3})*|[\d]+[\.,]\d+)/', $line, $matches)) {
            return null;
        }

        $numbers = $matches[0];
        if (count($numbers) < 2) {
            return null;
        }

        // Les deux derniers nombres sont Rembours puis Frais (inversé).
        $rembourse = (float) str_replace([',', ' '], ['.', ''], $numbers[count($numbers) - 2]);
        $frais = (float) str_replace([',', ' '], ['.', ''], $numbers[count($numbers) - 1]);

        // Extraire le code rubrique (premier mot avant les nombres)
        // Le code est généralement 1-6 caractères majuscules, points autorisés (ex: S.DENT)
        // On prend le premier groupe de lettres/chiffres/points au début de la ligne
        if (!preg_match('/^\s*([A-Z][A-Z.0-9]{0,5})\b/', $line, $codeMatch)) {
            return null;
        }

        $rubrique = trim($codeMatch[1]);

        // Ignorer les lignes qui ne sont pas des codes rubrique valides
        // (ex: lignes d'en-tête, lignes trop courtes, etc.)
        if (strlen($rubrique) < 1 || in_array($rubrique, ['Rubrique', 'Libellé', 'Observations', 'Frais', 'Rembours'])) {
            return null;
        }

        return [
            'rubrique'  => $rubrique,
            'frais'     => $frais,
            'rembourse' => $rembourse,
        ];
    }


    /**
     * Cherche un numéro de bulletin STIP dans une ligne de texte.
     *
     * Format STIP standard : lettre majuscule + 6 chiffres (ex: I145278, J862318).
     * Supporte aussi les variantes : N°I145278, N.I145278, I 145278, etc.
     *
     * IMPORTANT : Ne PAS utiliser \b (word boundary) AVANT le numéro de bulletin,
     * car certains extracteurs PDF collent la date au numéro (ex: 28/03/2026I145278).
     * Dans ce cas, il n'y a pas de word boundary entre 6 (chiffre) et I (lettre).
     *
     * @param  string  $line  Ligne de texte nettoyée
     * @return string|null    Le numéro de bulletin trouvé, ou null
     */
    private function findNumeroBulletin(string $line): ?string
    {
        // Pattern 1 : format standard avec préfixe optionnel "N°" ou "N."
        //   Ex: I145278, N°I145278, N.I145278, 28/03/2026I145278
        //   Utilise \b après le numéro pour gérer la ponctuation (.,;)
        //   PAS de \b avant car la date peut être collée (2026I145278)
        if (preg_match('/(?:N[°.e\s]*)?([A-Z]\d{6})\b/', $line, $matches)) {
            return $matches[1];
        }

        // Pattern 2 : lettre + espace + 6 chiffres (certains extracteurs ajoutent un espace)
        //   Ex: I 145278
        if (preg_match('/(?:N[°.e\s]*)?([A-Z])\s+(\d{6})\b/', $line, $matches)) {
            return $matches[1] . $matches[2];
        }

        // Pattern 3 : retirer tous les espaces et réessayer (PHP parser peut espacer les caractères)
        //   Ex: texte extrait comme "I 1 4 5 2 7 8" devient "I145278"
        $noSpaces = preg_replace('/\s+/', '', $line);
        if (preg_match('/([A-Z]\d{6,8})(?:\D|$)/', $noSpaces, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Vérifie si une ligne est un en-tête, pied de page ou métadonnée à ignorer.
     */
    private function isHeaderOrFooterLine(string $line): bool
    {
        // Pages : "Page 1 / 5"
        if (preg_match('/^Page\s+\d+\s*\/\s*\d+/i', $line)) {
            return true;
        }

        // Ligne d'en-tête du tableau contenant "Bulletin"
        if (preg_match('/^(Bulletin|Date de soin|Adhésion|Adhérent|Patient|Remboursement)\b/i', $line)) {
            return true;
        }

        // En-têtes de section (sans "Total" car on veut détecter "Total bordereau")
        // Note : "Arrêté" n'est pas dans la liste car on capture le total via
        // "Arrêté le présent bordereau à la somme de : XXXX.XXX" dans parseBulletinsFromText
        $headers = [
            'GROUPE MALADIE',
            'BORDEREAU DE REMBOURSEMENT MALADIE',
            'Bordereau',
            'Contrat',
            'STIP',
            'S T I P',
        ];

        foreach ($headers as $header) {
            if (str_starts_with($line, $header)) {
                return true;
            }
        }

        // Lignes de séparation (tirets, points, soulignés)
        if (preg_match('/^[\-\._=]{3,}$/', $line)) {
            return true;
        }

        return false;
    }

    /**
     * Nettoie une valeur extraite (gère les problèmes d'encodage).
     */
    private function cleanValue(string $value): string
    {
        // Remplacer le caractère de remplacement Unicode (U+FFFD) par 'e'
        $value = str_replace("\u{FFFD}", 'e', $value);

        // Supprimer les espaces insécables et autres caractères invisibles
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);

        return trim($value);
    }

    /**
     * Détermine le statut du bulletin à partir de la valeur de la colonne Remboursement.
     */
    private function determineStatus(string $value): string
    {
        $lower = strtolower(trim($value));

        // Rejeté
        if (str_contains($lower, 'rejet')) {
            return 'Rejeté';
        }

        // Sous contrôle - toutes les variantes contiennent "contr"
        if (str_contains($lower, 'contr')) {
            return 'Sous contrôle';
        }

        // Montant numérique => Validé
        $numericValue = str_replace([' ', ','], ['', '.'], $value);
        if (is_numeric($numericValue)) {
            return 'Validé';
        }

        // Valeur non reconnue => En attente par défaut
        return 'En attente';
    }
}
