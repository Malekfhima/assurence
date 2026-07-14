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
                'bulletins_en_attente' => $bulletinsEnAttente,
                'bulletins_valides' => $bulletinsValides,
                'bulletins_rejetes' => $bulletinsRejetes,
                'bulletins_sous_controle' => $bulletinsSousControle,
                'montant_total_rembourse' => number_format($montantTotal, 3, '.', ''),
                'annees_disponibles' => $anneesDisponibles,
            ],
        ]);
    }
}
