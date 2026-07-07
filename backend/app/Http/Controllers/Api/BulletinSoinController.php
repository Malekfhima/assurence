<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulletinSoinRequest;
use App\Models\BulletinSoin;
use App\Models\BulletinSoinDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BulletinSoinController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BulletinSoin::with([
            'adherent:id_adherent,nom,prenom,matricule',
            'sousAdherent:id_sous_adherent,nom,prenom',
            'bordereau:id_bordereau,numero_bordereau',
            'details',
        ]);

        // Recherche multicritère
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_bulletin', 'like', "%{$search}%")
                  ->orWhereHas('adherent', function ($q) use ($search) {
                      $q->where('matricule', 'like', "%{$search}%");
                  });
            });
        }

        // Filtre par état
        if ($etat = $request->get('etat')) {
            $query->where('etat', $etat);
        }

        // Filtre par adhérent
        if ($idAdherent = $request->get('id_adherent')) {
            $query->where('id_adherent', $idAdherent);
        }

        $bulletins = $query->orderBy('date_soin', 'desc')
                           ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $bulletins->items(),
            'meta' => [
                'current_page' => $bulletins->currentPage(),
                'last_page' => $bulletins->lastPage(),
                'total' => $bulletins->total(),
            ],
        ]);
    }

    public function store(BulletinSoinRequest $request): JsonResponse
    {
        $data = $request->validated();
        $detailsData = $data['details'] ?? [];
        unset($data['details']);

        // Forcer null pour les champs optionnels qui arrivent comme chaîne vide
        if (isset($data['id_sous_adherent']) && $data['id_sous_adherent'] === '') {
            $data['id_sous_adherent'] = null;
        }
        if (isset($data['id_bordereau']) && $data['id_bordereau'] === '') {
            $data['id_bordereau'] = null;
        }

        // Gérer l'upload du PDF
        if ($request->hasFile('pdf')) {
            $file = $request->file('pdf');
            $filename = 'bulletin_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('bulletins', $filename, 'public');
            $data['pdf_path'] = $path;
        }

        // Calculer le montant total et la date depuis les détails
        $totalMontant = collect($detailsData)->sum('montant');
        $data['montant_depense'] = $totalMontant;
        if (!isset($data['date_soin']) || empty($data['date_soin'])) {
            $data['date_soin'] = $detailsData[0]['date'] ?? date('Y-m-d');
        }

        $bulletin = BulletinSoin::create($data);

        // Créer les détails
        foreach ($detailsData as $detail) {
            $detail['id_bulletin'] = $bulletin->id_bulletin;
            BulletinSoinDetail::create($detail);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin créé avec succès.',
            'data' => $bulletin->load(['adherent', 'details']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $bulletin = BulletinSoin::with(['adherent', 'bordereau', 'details'])->find($id);

        if (!$bulletin) {
            return response()->json([
                'success' => false,
                'message' => 'Bulletin de soin introuvable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $bulletin,
        ]);
    }

    public function update(BulletinSoinRequest $request, int $id): JsonResponse
    {
        $bulletin = BulletinSoin::find($id);

        if (!$bulletin) {
            return response()->json([
                'success' => false,
                'message' => 'Bulletin de soin introuvable.',
            ], 404);
        }

        $data = $request->validated();
        $detailsData = $data['details'] ?? [];
        unset($data['details']);

        // Forcer null pour les champs optionnels qui arrivent comme chaîne vide
        if (isset($data['id_sous_adherent']) && $data['id_sous_adherent'] === '') {
            $data['id_sous_adherent'] = null;
        }
        if (isset($data['id_bordereau']) && $data['id_bordereau'] === '') {
            $data['id_bordereau'] = null;
        }

        // Gérer l'upload du PDF (remplace l'ancien)
        if ($request->hasFile('pdf')) {
            // Supprimer l'ancien PDF
            if ($bulletin->pdf_path) {
                Storage::disk('public')->delete($bulletin->pdf_path);
            }
            $file = $request->file('pdf');
            $filename = 'bulletin_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('bulletins', $filename, 'public');
            $data['pdf_path'] = $path;
        }

        // Calculer le montant total et la date depuis les détails
        $totalMontant = collect($detailsData)->sum('montant');
        $data['montant_depense'] = $totalMontant;
        if (!isset($data['date_soin']) || empty($data['date_soin'])) {
            $data['date_soin'] = $detailsData[0]['date'] ?? date('Y-m-d');
        }

        $bulletin->update($data);

        // Remplacer les détails
        $bulletin->details()->delete();
        foreach ($detailsData as $detail) {
            $detail['id_bulletin'] = $bulletin->id_bulletin;
            BulletinSoinDetail::create($detail);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin modifié avec succès.',
            'data' => $bulletin->load(['adherent', 'details']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $bulletin = BulletinSoin::find($id);

        if (!$bulletin) {
            return response()->json([
                'success' => false,
                'message' => 'Bulletin de soin introuvable.',
            ], 404);
        }

        // Supprimer le PDF associé
        if ($bulletin->pdf_path) {
            Storage::disk('public')->delete($bulletin->pdf_path);
        }

        $bulletin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bulletin de soin supprimé avec succès.',
        ]);
    }

    public function downloadPdf(Request $request, int $id)
    {
        $bulletin = BulletinSoin::find($id);

        if (!$bulletin || !$bulletin->pdf_path) {
            return response()->json([
                'success' => false,
                'message' => 'PDF introuvable.',
            ], 404);
        }

        if (!Storage::disk('public')->exists($bulletin->pdf_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Le fichier PDF n\'existe plus sur le serveur.',
            ], 404);
        }

        $fullPath = storage_path('app/public/' . $bulletin->pdf_path);
        $filename = 'bulletin_' . $bulletin->numero_bulletin . '.pdf';

        // Si ?download=1, forcer le téléchargement
        if ($request->query('download') === '1') {
            return response()->download($fullPath, $filename, [
                'Content-Type' => 'application/pdf',
            ]);
        }

        return response()->file($fullPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

}


