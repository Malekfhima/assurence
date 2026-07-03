<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BordereauRequest;
use App\Models\Bordereau;
use App\Models\BulletinSoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BordereauController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Bordereau::with(['bulletinSoins.adherent:id_adherent,nom,prenom,matricule', 'bulletinSoins.sousAdherent:id_sous_adherent,nom,prenom', 'bulletinSoins.details']);

        // Filtre par adhérent (via les bulletins de soin liés)
        if ($idAdherent = $request->get('id_adherent')) {
            $query->whereHas('bulletinSoins', function ($q) use ($idAdherent) {
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
        $data = $request->validated();
        $idBulletins = $data['id_bulletins'];
        unset($data['id_bulletins']);

        $bordereau = Bordereau::create($data);

        // Associer les bulletins sélectionnés au bordereau
        BulletinSoin::whereIn('id_bulletin', $idBulletins)
                    ->update(['id_bordereau' => $bordereau->id_bordereau]);

        // Calculer le montant total à partir des bulletins associés
        $montantTotal = BulletinSoin::whereIn('id_bulletin', $idBulletins)->sum('montant_depense');
        $bordereau->update(['montant_total' => $montantTotal]);

        return response()->json([
            'success' => true,
            'message' => 'Bordereau créé avec succès.',
            'data' => $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.details']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $bordereau = Bordereau::with(['bulletinSoins.adherent', 'bulletinSoins.sousAdherent', 'bulletinSoins.details'])->find($id);

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

        $data = $request->validated();
        $idBulletins = $data['id_bulletins'] ?? [];
        unset($data['id_bulletins']);

        $bordereau->update($data);

        // Dissocier les anciens bulletins
        BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
                    ->update(['id_bordereau' => null]);

        // Associer les nouveaux bulletins
        if (!empty($idBulletins)) {
            BulletinSoin::whereIn('id_bulletin', $idBulletins)
                        ->update(['id_bordereau' => $bordereau->id_bordereau]);

            // Recalculer le montant total
            $montantTotal = BulletinSoin::whereIn('id_bulletin', $idBulletins)->sum('montant_depense');
        } else {
            $montantTotal = 0;
        }

        $bordereau->update(['montant_total' => $montantTotal]);

        return response()->json([
            'success' => true,
            'message' => 'Bordereau modifié avec succès.',
            'data' => $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.details']),
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

        // Supprimer les bulletins liés (la cascade au niveau DB supprime les détails)
        BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
                    ->delete();

        $bordereau->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bordereau supprimé avec succès.',
        ]);
    }
}
