<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdherentRequest;
use App\Models\Adherent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdherentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Adherent::withCount('sousAdherents');

        if ($search = $request->get('search')) {
            $query->where('matricule', 'like', "%{$search}%");
        }

        if ($statut = $request->get('statut')) {
            $query->where('statut', $statut);
        }

        $adherents = $query->orderBy('nom')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $adherents->items(),
            'meta' => [
                'current_page' => $adherents->currentPage(),
                'last_page' => $adherents->lastPage(),
                'total' => $adherents->total(),
                'per_page' => $adherents->perPage(),
            ],
        ]);
    }

    public function store(AdherentRequest $request): JsonResponse
    {
        $adherent = Adherent::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Adhérent créé avec succès.',
            'data' => $adherent->load('sousAdherents'),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $adherent = Adherent::with('sousAdherents')->find($id);

        if (!$adherent) {
            return response()->json([
                'success' => false,
                'message' => 'Adhérent introuvable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $adherent,
        ]);
    }

    public function update(AdherentRequest $request, int $id): JsonResponse
    {
        $adherent = Adherent::find($id);

        if (!$adherent) {
            return response()->json([
                'success' => false,
                'message' => 'Adhérent introuvable.',
            ], 404);
        }

        $adherent->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Adhérent modifié avec succès.',
            'data' => $adherent->load('sousAdherents'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $adherent = Adherent::find($id);

        if (!$adherent) {
            return response()->json([
                'success' => false,
                'message' => 'Adhérent introuvable.',
            ], 404);
        }

        $adherent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Adhérent supprimé avec succès.',
        ]);
    }

    public function byMatricule(string $matricule): JsonResponse
    {
        $adherent = Adherent::with('sousAdherents')
            ->where('matricule', $matricule)
            ->first();

        if (!$adherent) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun adhérent trouvé avec ce matricule.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $adherent,
        ]);
    }
}
