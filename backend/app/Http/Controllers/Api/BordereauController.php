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
        $query = Bordereau::query()
            ->with('bulletin.adherent:id_adherent,nom,prenom,matricule');

        if ($search = $request->query('search')) {
            $query->where('numero_bordereau', 'like', "%{$search}%");
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        return response()->json(
            $query->orderByDesc('date_envoi')->paginate($request->integer('per_page', 15))
        );
    }

    public function store(BordereauRequest $request): JsonResponse
    {
        $bordereau = Bordereau::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Bordereau créé avec succès.',
            'data' => $bordereau->load('bulletin'),
        ], 201);
    }

    public function show(Bordereau $bordereau): JsonResponse
    {
        $bordereau->load('bulletin.adherent');

        return response()->json([
            'success' => true,
            'data' => $bordereau,
        ]);
    }

    public function update(BordereauRequest $request, Bordereau $bordereau): JsonResponse
    {
        $bordereau->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Bordereau mis à jour avec succès.',
            'data' => $bordereau->load('bulletin'),
        ]);
    }

    public function destroy(Bordereau $bordereau): JsonResponse
    {
        $bordereau->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bordereau supprimé avec succès.',
        ]);
    }
}
