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
        $query = BulletinSoin::query()
            ->with('adherent:id_adherent,nom,prenom,matricule');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_bulletin', 'like', "%{$search}%")
                    ->orWhere('type_soin', 'like', "%{$search}%")
                    ->orWhereHas('adherent', function ($a) use ($search) {
                        $a->where('nom', 'like', "%{$search}%")
                            ->orWhere('prenom', 'like', "%{$search}%")
                            ->orWhere('matricule', 'like', "%{$search}%");
                    });
            });
        }

        if ($etat = $request->query('etat')) {
            $query->where('etat', $etat);
        }

        return response()->json(
            $query->orderByDesc('date_soin')->paginate($request->integer('per_page', 15))
        );
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

    public function show(BulletinSoin $bulletin): JsonResponse
    {
        $bulletin->load(['adherent', 'bordereau']);

        return response()->json([
            'success' => true,
            'data' => $bulletin,
        ]);
    }

    public function update(BulletinSoinRequest $request, BulletinSoin $bulletin): JsonResponse
    {
        $bulletin->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin mis à jour avec succès.',
            'data' => $bulletin->load('adherent'),
        ]);
    }

    public function destroy(BulletinSoin $bulletin): JsonResponse
    {
        $bulletin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin supprimé avec succès.',
        ]);
    }
}
