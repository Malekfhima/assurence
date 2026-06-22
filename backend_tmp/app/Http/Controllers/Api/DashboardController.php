<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adherent;
use App\Models\Bordereau;
use App\Models\BulletinSoin;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Statistiques affichées sur le tableau de bord.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_adherents' => Adherent::count(),
                'bulletins_traites' => BulletinSoin::where('etat', 'Traité')->count(),
                'total_bulletins' => BulletinSoin::count(),
                'total_bordereaux' => Bordereau::count(),
                'montant_total_rembourse' => (float) BulletinSoin::where('etat', 'Traité')
                    ->sum('montant_depense'),
            ],
        ]);
    }
}
