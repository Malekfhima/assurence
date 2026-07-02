<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdherentRequest;
use App\Models\Adherent;
use App\Models\BulletinSoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdherentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Adherent::withCount('sousAdherents');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('matricule', 'like', "%{$search}%")
                  ->orWhere('cin', 'like', "%{$search}%");
            });
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

    /**
     * Endpoint optimisé : retourne en une seule requête toutes les données
     * d'un adhérent (infos, sous-adhérents, bulletins de l'adhérent et
     * des sous-adhérents avec le bordereau associé).
     */
    public function full(int $id): JsonResponse
    {
        $adherent = Adherent::with('sousAdherents')->find($id);

        if (!$adherent) {
            return response()->json([
                'success' => false,
                'message' => 'Adhérent introuvable.',
            ], 404);
        }

        // Récupérer les IDs des sous-adhérents pour inclure leurs bulletins
        $sousAdherentIds = $adherent->sousAdherents->pluck('id_sous_adherent')->toArray();

        // Charger les bulletins de l'adhérent ET des sous-adhérents
        $bulletins = BulletinSoin::with([
            'adherent:id_adherent,nom,prenom,matricule',
            'sousAdherent:id_sous_adherent,nom,prenom',
            'bordereau:id_bordereau,numero_bordereau,montant_total,date_envoi,statut,commentaire',
            'details',
        ])
            ->where(function ($q) use ($id, $sousAdherentIds) {
                $q->where('id_adherent', $id);
                if (!empty($sousAdherentIds)) {
                    $q->orWhereIn('id_sous_adherent', $sousAdherentIds);
                }
            })
            ->orderBy('date_soin', 'desc')
            ->orderBy('id_bulletin', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'adherent' => $adherent,
                'sous_adherents' => $adherent->sousAdherents,
                'bulletins' => $bulletins,
            ],
        ]);
    }
}
