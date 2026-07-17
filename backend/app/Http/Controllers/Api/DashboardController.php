<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adherent;
use App\Models\Bordereau;
use App\Models\BulletinSoin;
use App\Models\SousAdherent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $annee = $request->get('annee');

        // Query builders with optional year filter
        // Note: Adherents and sous-adherents are not year-filtered since their
        // counts are cumulative and not time-bound statistics.
        $totalAdherents = Adherent::count();
        $totalSousAdherents = SousAdherent::count();

        $bulletinQuery = BulletinSoin::query();
        $bordereauQuery = Bordereau::query();
        $montantQuery = Bordereau::where('statut', 'Traité')
                                   ->whereNotNull('montant_rembourse');

        if ($annee) {
            // For bulletins, filter by date_soin
            $bulletinQuery->whereYear('date_soin', $annee);

            // For bordereaux, filter by date_envoi
            $bordereauQuery->whereYear('date_envoi', $annee);
            $montantQuery->whereYear('date_envoi', $annee);
        }


        $totalBulletins = $bulletinQuery->count();
        $totalBordereaux = $bordereauQuery->count();
        $totalReclamations = (clone $bordereauQuery)->where('source', 'réclamation')->count();

        $bulletinsEnAttente = (clone $bulletinQuery)->where('etat', 'En attente')->count();
        $bulletinsValides = (clone $bulletinQuery)->where('etat', 'Validé')->count();
        $bulletinsRejetes = (clone $bulletinQuery)->where('etat', 'Rejeté')->count();
        $bulletinsSousControle = (clone $bulletinQuery)->where('etat', 'Sous contrôle')->count();

        $montantTotal = $montantQuery->sum('montant_rembourse');

        // Get available years from bulletins (for the year selector)
        $anneesDisponibles = BulletinSoin::selectRaw('DISTINCT YEAR(date_soin) as annee')
            ->whereNotNull('date_soin')
            ->orderBy('annee', 'desc')
            ->pluck('annee')
            ->toArray();

        // Also include years from bordereaux
        $anneesBordereaux = Bordereau::selectRaw('DISTINCT YEAR(date_envoi) as annee')
            ->whereNotNull('date_envoi')
            ->orderBy('annee', 'desc')
            ->pluck('annee')
            ->toArray();

        // Merge and keep unique, sorted descending
        $anneesDisponibles = array_values(array_unique(array_merge($anneesDisponibles, $anneesBordereaux)));
        rsort($anneesDisponibles);

        // If no data yet, include current year
        if (empty($anneesDisponibles)) {
            $anneesDisponibles = [(int) date('Y')];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_adherents' => $totalAdherents,
                'total_sous_adherents' => $totalSousAdherents,
                'total_bulletins' => $totalBulletins,
                'total_bordereaux' => $totalBordereaux,
                'total_reclamations' => $totalReclamations,
                'bulletins_en_attente' => $bulletinsEnAttente,
                'bulletins_valides' => $bulletinsValides,
                'bulletins_rejetes' => $bulletinsRejetes,
                'bulletins_sous_controle' => $bulletinsSousControle,
                'montant_total_rembourse' => number_format($montantTotal, 3, '.', ''),
                'annees_disponibles' => $anneesDisponibles,
            ],
        ]);
    }

    /**
     * Retourne les statistiques mensuelles pour les graphiques.
     * Pour chaque mois de l'année, donne le nombre total de bulletins,
     * le nombre de bulletins validés, rejetés, etc.
     *
     * Optimisé : une seule requête SQL avec GROUP BY.
     */
    public function monthlyBreakdown(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        // Une seule requête groupée par mois
        $rows = BulletinSoin::selectRaw('
            MONTH(date_soin) as mois,
            COUNT(*) as total,
            SUM(CASE WHEN etat = "Validé" THEN 1 ELSE 0 END) as valides,
            SUM(CASE WHEN etat = "Rejeté" THEN 1 ELSE 0 END) as rejetes,
            SUM(CASE WHEN etat = "Sous contrôle" THEN 1 ELSE 0 END) as sous_controle,
            SUM(CASE WHEN etat = "En attente" THEN 1 ELSE 0 END) as en_attente,
            SUM(CASE WHEN etat = "Validé" THEN COALESCE(montant_depense, 0) ELSE 0 END) as montant
        ')
            ->whereYear('date_soin', $annee)
            ->groupByRaw('MONTH(date_soin)')
            ->get()
            ->keyBy('mois');

        $moisLabels = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
        ];

        $monthlyData = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $r = $rows->get($mois);
            $monthlyData[] = [
                'mois'          => $mois,
                'mois_label'    => $moisLabels[$mois],
                'total'         => (int) ($r->total ?? 0),
                'valides'       => (int) ($r->valides ?? 0),
                'rejetes'       => (int) ($r->rejetes ?? 0),
                'sous_controle' => (int) ($r->sous_controle ?? 0),
                'en_attente'    => (int) ($r->en_attente ?? 0),
                'montant'       => number_format((float) ($r->montant ?? 0), 3, '.', ''),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'annee'         => (int) $annee,
                'total_annee'   => array_sum(array_column($monthlyData, 'total')),
                'valides_annee' => array_sum(array_column($monthlyData, 'valides')),
                'mois'          => $monthlyData,
            ],
        ]);
    }
}
