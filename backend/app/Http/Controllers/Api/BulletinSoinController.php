<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulletinSoinRequest;
use App\Models\BulletinSoin;
use App\Models\BulletinSoinDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BulletinSoinController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BulletinSoin::with([
            'adherent:id_adherent,nom,prenom,matricule',
            'sousAdherent:id_sous_adherent,nom,prenom',
            'details',
        ]);

        // Recherche multicritère
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_bulletin', 'like', "%{$search}%")
                  ->orWhereHas('adherent', function ($q) use ($search) {
                      $q->where('nom', 'like', "%{$search}%")
                        ->orWhere('prenom', 'like', "%{$search}%")
                        ->orWhere('matricule', 'like', "%{$search}%");
                  });
            });
        }

        // Filtre par état
        if ($etat = $request->get('etat')) {
            $query->where('etat', $etat);
        }

        // Filtre par adhérent
        if ($idAdherent = $request->get('id_adherent')) {
            $query->where('id_adherent', $idAdherent);
        }

        $bulletins = $query->orderBy('date_soin', 'desc')
                           ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $bulletins->items(),
            'meta' => [
                'current_page' => $bulletins->currentPage(),
                'last_page' => $bulletins->lastPage(),
                'total' => $bulletins->total(),
            ],
        ]);
    }

    public function store(BulletinSoinRequest $request): JsonResponse
    {
        $data = $request->validated();
        $detailsData = $data['details'] ?? [];
        unset($data['details']);

        // Calculer le montant total depuis les détails
        $totalMontant = collect($detailsData)->sum('montant');
        $data['montant_depense'] = $totalMontant;

        $bulletin = BulletinSoin::create($data);

        // Créer les détails
        foreach ($detailsData as $detail) {
            $detail['id_bulletin'] = $bulletin->id_bulletin;
            BulletinSoinDetail::create($detail);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin créé avec succès.',
            'data' => $bulletin->load(['adherent', 'details']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $bulletin = BulletinSoin::with(['adherent', 'bordereau', 'details'])->find($id);

        if (!$bulletin) {
            return response()->json([
                'success' => false,
                'message' => 'Bulletin de soin introuvable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $bulletin,
        ]);
    }

    public function update(BulletinSoinRequest $request, int $id): JsonResponse
    {
        $bulletin = BulletinSoin::find($id);

        if (!$bulletin) {
            return response()->json([
                'success' => false,
                'message' => 'Bulletin de soin introuvable.',
            ], 404);
        }

        $data = $request->validated();
        $detailsData = $data['details'] ?? [];
        unset($data['details']);

        // Calculer le montant total depuis les détails
        $totalMontant = collect($detailsData)->sum('montant');
        $data['montant_depense'] = $totalMontant;

        $bulletin->update($data);

        // Remplacer les détails
        $bulletin->details()->delete();
        foreach ($detailsData as $detail) {
            $detail['id_bulletin'] = $bulletin->id_bulletin;
            BulletinSoinDetail::create($detail);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin modifié avec succès.',
            'data' => $bulletin->load(['adherent', 'details']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $bulletin = BulletinSoin::find($id);

        if (!$bulletin) {
            return response()->json([
                'success' => false,
                'message' => 'Bulletin de soin introuvable.',
            ], 404);
        }

        $bulletin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin supprimé avec succès.',
        ]);
    }

}

