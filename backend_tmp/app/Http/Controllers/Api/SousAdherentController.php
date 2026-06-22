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
        $query = SousAdherent::query()->with('adherent:id_adherent,nom,prenom,matricule');

        if ($idAdherent = $request->query('id_adherent')) {
            $query->where('id_adherent', $idAdherent);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->orderBy('nom')->paginate($request->integer('per_page', 15))
        );
    }

    public function store(SousAdherentRequest $request): JsonResponse
    {
        $sousAdherent = SousAdherent::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sous-adhérent créé avec succès.',
            'data' => $sousAdherent,
        ], 201);
    }

    public function show(SousAdherent $sousAdherent): JsonResponse
    {
        $sousAdherent->load('adherent');

        return response()->json([
            'success' => true,
            'data' => $sousAdherent,
        ]);
    }

    public function update(SousAdherentRequest $request, SousAdherent $sousAdherent): JsonResponse
    {
        $sousAdherent->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sous-adhérent mis à jour avec succès.',
            'data' => $sousAdherent,
        ]);
    }

    public function destroy(SousAdherent $sousAdherent): JsonResponse
    {
        $sousAdherent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sous-adhérent supprimé avec succès.',
        ]);
    }
}
