<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BordereauRequest;
use App\Models\Bordereau;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BordereauController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Bordereau::with('bulletinSoin.adherent:id_adherent,nom,prenom,matricule');

        // Filtre par adhérent (via le bulletin de soin lié)
        if ($idAdherent = $request->get('id_adherent')) {
            $query->whereHas('bulletinSoin', function ($q) use ($idAdherent) {
                $q->where('id_adherent', $idAdherent);
            });
        }

        $bordereaux = $query->orderBy('id_bordereau', 'desc')
                            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $bordereaux->items(),
            'meta' => [
                'current_page' => $bordereaux->currentPage(),
                'last_page' => $bordereaux->lastPage(),
                'total' => $bordereaux->total(),
            ],
        ]);
    }

    public function store(BordereauRequest $request): JsonResponse
    {
        $bordereau = Bordereau::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Bordereau créé avec succès.',
            'data' => $bordereau->load('bulletinSoin.adherent'),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $bordereau = Bordereau::with('bulletinSoin.adherent')->find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $bordereau,
        ]);
    }

    public function update(BordereauRequest $request, int $id): JsonResponse
    {
        $bordereau = Bordereau::find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        $bordereau->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Bordereau modifié avec succès.',
            'data' => $bordereau->load('bulletinSoin.adherent'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $bordereau = Bordereau::find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        $bordereau->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bordereau supprimé avec succès.',
        ]);
    }
}
