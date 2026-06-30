<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BulletinSoin;
use App\Models\Soin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SoinController extends Controller
{
    public function index(int $idBulletin): JsonResponse
    {
        $bulletin = BulletinSoin::find($idBulletin);
        if (!$bulletin) {
            return response()->json(['success' => false, 'message' => 'Bulletin introuvable.'], 404);
        }

        $soins = Soin::where('id_bulletin', $idBulletin)->orderBy('date_soin', 'desc')->get();

        return response()->json(['success' => true, 'data' => $soins]);
    }

    public function store(Request $request, int $idBulletin): JsonResponse
    {
        $bulletin = BulletinSoin::find($idBulletin);
        if (!$bulletin) {
            return response()->json(['success' => false, 'message' => 'Bulletin introuvable.'], 404);
        }

        $validated = $request->validate([
            'date_soin' => 'required|date',
            'type_soin' => 'required|string|max:100',
            'montant' => 'required|numeric|min:0',
        ]);

        $validated['id_bulletin'] = $idBulletin;

        $soin = Soin::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Soin ajouté avec succès.',
            'data' => $soin,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $soin = Soin::find($id);
        if (!$soin) {
            return response()->json(['success' => false, 'message' => 'Soin introuvable.'], 404);
        }

        $validated = $request->validate([
            'date_soin' => 'required|date',
            'type_soin' => 'required|string|max:100',
            'montant' => 'required|numeric|min:0',
        ]);

        $soin->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Soin modifié avec succès.',
            'data' => $soin,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $soin = Soin::find($id);
        if (!$soin) {
            return response()->json(['success' => false, 'message' => 'Soin introuvable.'], 404);
        }

        $soin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Soin supprimé avec succès.',
        ]);
    }
}
