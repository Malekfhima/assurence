<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulletinSoinRequest;
use App\Models\BulletinSoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BulletinSoinController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BulletinSoin::with('adherent:id_adherent,nom,prenom,matricule');

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
        $bulletin = BulletinSoin::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin créé avec succès.',
            'data' => $bulletin->load('adherent'),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $bulletin = BulletinSoin::with('adherent', 'bordereau')->find($id);

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

        $bulletin->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin modifié avec succès.',
            'data' => $bulletin->load('adherent'),
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

    // Actions spécifiques
    public function valider(int $id): JsonResponse
    {
        $bulletin = BulletinSoin::find($id);

        if (!$bulletin) {
            return response()->json([
                'success' => false,
                'message' => 'Bulletin de soin introuvable.',
            ], 404);
        }

        $bulletin->update(['etat' => 'Validé']);

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin validé.',
            'data' => $bulletin,
        ]);
    }

    public function rejeter(Request $request, int $id): JsonResponse
    {
        $bulletin = BulletinSoin::find($id);

        if (!$bulletin) {
            return response()->json([
                'success' => false,
                'message' => 'Bulletin de soin introuvable.',
            ], 404);
        }

        $motif = $request->get('motif');
        $description = $bulletin->description;
        if ($motif) {
            $description = trim($description ? $description . ' | Rejeté : ' . $motif : 'Rejeté : ' . $motif);
        }

        $bulletin->update([
            'etat' => 'Rejeté',
            'description' => $description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin rejeté.',
            'data' => $bulletin,
        ]);
    }
}
