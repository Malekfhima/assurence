<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SousAdherentRequest;
use App\Models\SousAdherent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SousAdherentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SousAdherent::with('adherent');

        if ($idAdherent = $request->get('id_adherent')) {
            $query->where('id_adherent', $idAdherent);
        }

        $sousAdherents = $query->orderBy('nom')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $sousAdherents->items(),
            'meta' => [
                'current_page' => $sousAdherents->currentPage(),
                'last_page' => $sousAdherents->lastPage(),
                'total' => $sousAdherents->total(),
            ],
        ]);
    }

    public function store(SousAdherentRequest $request): JsonResponse
    {
        $sousAdherent = SousAdherent::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sous-adhérent créé avec succès.',
            'data' => $sousAdherent->load('adherent'),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $sousAdherent = SousAdherent::with('adherent')->find($id);

        if (!$sousAdherent) {
            return response()->json([
                'success' => false,
                'message' => 'Sous-adhérent introuvable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $sousAdherent,
        ]);
    }

    public function update(SousAdherentRequest $request, int $id): JsonResponse
    {
        $sousAdherent = SousAdherent::find($id);

        if (!$sousAdherent) {
            return response()->json([
                'success' => false,
                'message' => 'Sous-adhérent introuvable.',
            ], 404);
        }

        $sousAdherent->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sous-adhérent modifié avec succès.',
            'data' => $sousAdherent->load('adherent'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $sousAdherent = SousAdherent::find($id);

        if (!$sousAdherent) {
            return response()->json([
                'success' => false,
                'message' => 'Sous-adhérent introuvable.',
            ], 404);
        }

        $sousAdherent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sous-adhérent supprimé avec succès.',
        ]);
    }
}
