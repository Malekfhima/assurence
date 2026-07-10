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

        // 1. Essayer pdftotext (rapide, fiable pour les PDF textuels)
        $text = $this->extractTextWithPdftotext($pdfPath);

        // 2. Fallback : smalot/pdfparser en PHP
        if ($text === null) {
            $text = $this->extractTextWithPhpParser($pdfPath);
        }

        if ($text === null || trim($text) === '') {
            $fileSize = filesize($pdfPath);
            throw new \RuntimeException(
                "Impossible d'extraire le texte du PDF. " .
                'Le PDF semble être une image scannée (taille : ' . round($fileSize / 1024) . ' Ko). ' .
                'Veuillez fournir un PDF avec une couche texte (non scanné).'
            );
        }

        return $this->parseBulletinsFromText($text);
    }

    /**
     * Extrait le texte d'un PDF via pdftotext (poppler-utils).
     *
     * Ordre de priorité :
     *   1. -layout : préserve la disposition spatiale, idéal pour les tableaux
     *   2. -raw    : extrait dans l'ordre du flux, utile si -layout échoue
     *   3. sans flag : fallback générique
     */
    private function extractTextWithPdftotext(string $pdfPath): ?string
    {
        $escapedPath = escapeshellarg($pdfPath);
        $nullDevice = $this->isWindows() ? 'nul' : '/dev/null';

        // -layout préserve la mise en page (colonnes), idéal pour les tableaux STIP
        $output = shell_exec("pdftotext -layout {$escapedPath} - 2>{$nullDevice}");

        if ($output === null || $output === false || trim($output) === '') {
            // Fallback : -raw extrait dans l'ordre du flux
            $output = shell_exec("pdftotext -raw {$escapedPath} - 2>{$nullDevice}");
        }

        if ($output === null || $output === false || trim($output) === '') {
            // Fallback : sans flag
            $output = shell_exec("pdftotext {$escapedPath} - 2>{$nullDevice}");
        }

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
     * Retourne un tableau avec :
     *   - 'bulletins'       : la liste des bulletins parsés
     *   - 'total_bordereau' : le montant "Total bordereau" extrait du PDF (ou null si non trouvé)
     *
     * @return array{bulletins: array, total_bordereau: ?float}
     */
    private function parseBulletinsFromText(string $text): array
    {
        $lines = explode("\n", $text);
        $bulletins = [];
        $totalBordereau = null;

        foreach ($lines as $line) {
            $trimmed = trim($line);

            // Ignorer les lignes vides
            if ($trimmed === '') {
                continue;
            }

            // --- DÉTECTION DU TOTAL BORDEREAU ---
            // Ligne comme : "Total bordereau : 12623.945" ou "Total bordereau 12623.945"
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

            // Chercher un numéro de bulletin : lettre + 6 chiffres
            if (!preg_match('/^[\s\d\/]{0,20}\b([A-Z]\d{6})\b/', $trimmed, $matches)) {
                continue;
            }

            $numero = $matches[1];

            // Extraire tous les mots de la ligne
            $parts = preg_split('/\s+/', $trimmed);

            // Ignorer les lignes qui ne contiennent qu'un seul mot
            if (count($parts) < 2) {
                continue;
            }

            // La colonne "Remboursement" est le dernier mot de la ligne
            $lastPart = end($parts);

            // Vérifier aussi l'avant-dernier mot si le dernier est un point
            $value = $this->cleanValue($lastPart);
            if ($value === '.' || $value === '') {
                $value = $this->cleanValue(prev($parts));
            }

            // Déterminer le statut à partir de la valeur de remboursement
            $statut = $this->determineStatus($value);
            $montant = null;

            if ($statut === 'Validé') {
                $montant = (float) str_replace([' ', ','], ['', '.'], $value);
            }

            $bulletins[] = [
                'numero_bulletin'   => $numero,
                'statut'            => $statut,
                'montant_rembourse' => $montant,
            ];
        }

        if (empty($bulletins)) {
            throw new \RuntimeException(
                'Le PDF ne contient pas les données de bulletins attendues au format STIP. ' .
                'Vérifiez que le fichier est bien un Bordereau de Remboursement Maladie valide.'
            );
        }

        return [
            'bulletins'       => $bulletins,
            'total_bordereau' => $totalBordereau,
        ];
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
        $headers = [
            'GROUPE MALADIE',
            'BORDEREAU DE REMBOURSEMENT MALADIE',
            'Bordereau',
            'Contrat',
            'STIP',
            'S T I P',
            'Arrêté',
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
