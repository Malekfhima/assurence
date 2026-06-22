<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdherentRequest;
use App\Models\Adherent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdherentController extends Controller
{
    /**
     * Liste paginée des adhérents avec recherche.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Adherent::query()->withCount('sousAdherents');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%")
                    ->orWhere('matricule', 'like', "%{$search}%")
                    ->orWhere('cin', 'like', "%{$search}%");
            });
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        $adherents = $query->orderBy('nom')
            ->paginate($request->integer('per_page', 15));

        return response()->json($adherents);
    }

    public function store(AdherentRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->filled('mot_de_passe')) {
            $data['mot_de_passe'] = Hash::make($request->input('mot_de_passe'));
        }

        $adherent = Adherent::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Adhérent créé avec succès.',
            'data' => $adherent,
        ], 201);
    }

    public function show(Adherent $adherent): JsonResponse
    {
        $adherent->load(['sousAdherents', 'bulletins']);

        return response()->json([
            'success' => true,
            'data' => $adherent,
        ]);
    }

    public function update(AdherentRequest $request, Adherent $adherent): JsonResponse
    {
        $data = $request->validated();

        if ($request->filled('mot_de_passe')) {
            $data['mot_de_passe'] = Hash::make($request->input('mot_de_passe'));
        }

        $adherent->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Adhérent mis à jour avec succès.',
            'data' => $adherent,
        ]);
    }

    public function destroy(Adherent $adherent): JsonResponse
    {
        $adherent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Adhérent supprimé avec succès.',
        ]);
    }
}
