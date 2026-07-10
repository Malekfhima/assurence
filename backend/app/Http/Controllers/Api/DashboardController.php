<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adherent;
use App\Models\Bordereau;
use App\Models\BulletinSoin;
use App\Models\SousAdherent;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalAdherents = Adherent::count();
        $totalSousAdherents = SousAdherent::count();
        $totalBulletins = BulletinSoin::count();
        $totalBordereaux = Bordereau::count();

        $bulletinsEnAttente = BulletinSoin::where('etat', 'En attente')->count();
        $bulletinsValides = BulletinSoin::where('etat', 'Validé')->count();
        $bulletinsRejetes = BulletinSoin::where('etat', 'Rejeté')->count();
        $bulletinsSousControle = BulletinSoin::where('etat', 'Sous contrôle')->count();

        $montantTotal = BulletinSoin::where('etat', 'Validé')
                                     ->sum('montant_depense');

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
            ],
        ]);
    }
}
