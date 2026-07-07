<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BordereauRequest;
use App\Models\Bordereau;
use App\Models\BulletinSoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        // Filtre par année et mois (sur date_envoi)
        if ($annee = $request->get('annee')) {
            $query->whereYear('date_envoi', $annee);
        }
        if ($mois = $request->get('mois')) {
            $query->whereMonth('date_envoi', $mois);
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

        // Supprimer les fichiers de réponse associés
        if ($bordereau->fichier_reponse) {
            Storage::disk('public')->delete($bordereau->fichier_reponse);
        }

        // Supprimer les bulletins liés (leurs détails seront supprimés en cascade par la DB)
        BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)->delete();

        $bordereau->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bordereau supprimé avec succès.',
        ]);
    }

    /**
     * Envoyer le bordereau (changer le statut en "Envoyé").
     */
    public function envoyer(int $id): JsonResponse
    {
        $bordereau = Bordereau::find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        if ($bordereau->statut === 'Envoyé') {
            return response()->json([
                'success' => false,
                'message' => 'Ce bordereau a déjà été envoyé.',
            ], 400);
        }

        if ($bordereau->statut === 'Traité') {
            return response()->json([
                'success' => false,
                'message' => 'Ce bordereau a déjà été traité.',
            ], 400);
        }

        $bordereau->update([
            'statut' => 'Envoyé',
            'date_envoi' => now()->toDateString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bordereau envoyé avec succès.',
            'data' => $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.details']),
        ]);
    }

    /**
     * Réception de la réponse : uploader un fichier CSV (ou Excel) qui définit
     * le statut de chaque bulletin (Validé/Rejeté), et optionnellement un PDF.
     */
    public function reponse(Request $request, int $id): JsonResponse
    {
        $bordereau = Bordereau::with('bulletinSoins')->find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        if ($bordereau->statut !== 'Envoyé') {
            return response()->json([
                'success' => false,
                'message' => 'Le bordereau doit être envoyé avant de recevoir une réponse.',
            ], 400);
        }

        // 1. Upload du fichier de données (CSV obligatoire)
        if (!$request->hasFile('fichier_donnees')) {
            return response()->json([
                'success' => false,
                'message' => 'Veuillez uploader un fichier CSV contenant les statuts des bulletins.',
            ], 400);
        }

        $fichierDonnees = $request->file('fichier_donnees');
        $extension = $fichierDonnees->getClientOriginalExtension();

        if (!in_array(strtolower($extension), ['csv', 'txt'])) {
            return response()->json([
                'success' => false,
                'message' => 'Le fichier de données doit être au format CSV (.csv ou .txt).',
            ], 400);
        }

        // Lire et parser le fichier CSV
        $handle = fopen($fichierDonnees->getRealPath(), 'r');
        if (!$handle) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de lire le fichier.',
            ], 500);
        }

        // En-tête attendue : numero_bulletin (ou id_bulletin), etat (Validé/Rejeté)
        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json([
                'success' => false,
                'message' => 'Fichier CSV invalide : en-tête manquante.',
            ], 400);
        }

        $header = array_map('trim', $header);
        $headerLower = array_map('strtolower', $header);

        // Déterminer les colonnes
        $colId = null;
        $colEtat = null;
        $colMontant = null;

        foreach ($headerLower as $i => $col) {
            if (in_array($col, ['numero_bulletin', 'id_bulletin', 'numéro', 'num', 'numero'])) {
                $colId = $i;
            } elseif (in_array($col, ['etat', 'statut', 'status', 'état'])) {
                $colEtat = $i;
            } elseif (in_array($col, ['montant', 'montant_rembourse', 'rembourse'])) {
                $colMontant = $i;
            }
        }

        if ($colId === null || $colEtat === null) {
            fclose($handle);
            return response()->json([
                'success' => false,
                'message' => 'Le fichier CSV doit contenir les colonnes "numero_bulletin" (ou "id_bulletin") et "etat" (ou "statut").',
            ], 400);
        }

        // Parser les lignes
        $errors = [];
        $updated = [];
        $bulletinIndex = [];

        // Indexer les bulletins du bordereau par leur numéro
        foreach ($bordereau->bulletinSoins as $bs) {
            $bulletinIndex[$bs->numero_bulletin] = $bs;
        }

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < max($colId, $colEtat) + 1) continue;

            $numeroBulletin = trim($row[$colId]);
            $etat = trim(ucfirst(strtolower($row[$colEtat])));

            if (empty($numeroBulletin) || empty($etat)) continue;

            // Normaliser l'état
            $etatNormalise = match (strtolower($etat)) {
                'validé', 'valide', 'accepté', 'accepte', 'remboursé', 'rembourse' => 'Validé',
                'rejeté', 'rejete', 'refusé', 'refuse' => 'Rejeté',
                default => null,
            };

            if ($etatNormalise === null) {
                $errors[] = "Statut invalide pour le bulletin N°{$numeroBulletin} : '{$etat}' (attendu: Validé ou Rejeté)";
                continue;
            }

            if (!isset($bulletinIndex[$numeroBulletin])) {
                $errors[] = "Bulletin N°{$numeroBulletin} introuvable dans ce bordereau.";
                continue;
            }

            $bulletin = $bulletinIndex[$numeroBulletin];

            // Mettre à jour l'état
            $updateData = ['etat' => $etatNormalise];
            
            // Si un montant remboursé est fourni
            if ($colMontant !== null && isset($row[$colMontant]) && is_numeric(trim($row[$colMontant]))) {
                $montant = (float) trim($row[$colMontant]);
                if ($etatNormalise === 'Validé') {
                    $updateData['montant_depense'] = $montant;
                }
            }

            $bulletin->update($updateData);
            $updated[] = [
                'id_bulletin' => $bulletin->id_bulletin,
                'numero_bulletin' => $bulletin->numero_bulletin,
                'etat' => $etatNormalise,
                'adherent' => $bulletin->adherent ? "{$bulletin->adherent->nom} {$bulletin->adherent->prenom}" : null,
            ];
        }

        fclose($handle);

        if (empty($updated)) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun bulletin valide trouvé dans le fichier.',
                'errors' => $errors,
            ], 400);
        }

        // 2. Upload du fichier réponse (PDF optionnel)
        $fichierReponsePath = null;
        if ($request->hasFile('fichier_reponse')) {
            $file = $request->file('fichier_reponse');
            $filename = 'reponse_bordereau_' . $bordereau->id_bordereau . '_' . time() . '.' . $file->getClientOriginalExtension();
            $fichierReponsePath = $file->storeAs('reponses_bordereaux', $filename, 'public');
        }

        // 3. Toujours sauvegarder le fichier CSV des données
        $csvFilename = 'donnees_bordereau_' . $bordereau->id_bordereau . '_' . time() . '.' . $fichierDonnees->getClientOriginalExtension();
        $fichierDonnees->storeAs('reponses_bordereaux', $csvFilename, 'public');

        // 4. Mettre à jour le bordereau
        $bordereau->update([
            'statut' => 'Traité',
            'fichier_reponse' => $fichierReponsePath ?: 'reponses_bordereaux/' . $csvFilename,
            'date_reponse' => now()->toDateString(),
        ]);

        // 5. Recalculer le montant total (somme des bulletins validés uniquement)
        $montantValide = BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
            ->where('etat', 'Validé')
            ->sum('montant_depense');
        
        $bordereau->update(['montant_total' => $montantValide]);

        $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.sousAdherent', 'bulletinSoins.details']);

        $responseData = [
            'success' => true,
            'message' => 'Réponse traitée avec succès. ' . count($updated) . ' bulletin(s) mis à jour.',
            'data' => $bordereau,
            'updated_bulletins' => $updated,
        ];

        if (!empty($errors)) {
            $responseData['warnings'] = $errors;
        }

        return response()->json($responseData);
    }
}
