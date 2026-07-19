<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulletinSoinRequest;
use App\Models\BordereauLog;
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

        // Filtre par état (support single value or array)
        if ($etat = $request->get('etat')) {
            if (is_array($etat)) {
                $query->whereIn('etat', $etat);
            } else {
                $query->where('etat', $etat);
            }
        }

        // Filtre par adhérent
        if ($idAdherent = $request->get('id_adherent')) {
            $query->where('id_adherent', $idAdherent);
        }

        // Filtrer uniquement les bulletins disponibles (non liés à un bordereau)
        if ($request->boolean('available')) {
            $query->whereNull('id_bordereau');
        }

        // Filtrer les bulletins appartenant à des bordereaux traités (pour les réclamations)
        if ($request->boolean('bordereau_traite')) {
            $query->whereNotNull('id_bordereau')
                  ->whereHas('bordereau', function ($q) {
                      $q->where('statut', 'Traité');
                  });
        }

        $bulletins = $query->orderBy('id_bulletin', 'desc')
                           ->paginate(min($request->get('per_page', 20), 9999));

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

        // Récupérer les données extraites du PDF de vérification (BordereauLog)
        $pdfDetails = [];
        if ($bulletin->id_bordereau && $bulletin->numero_bulletin) {
            $log = BordereauLog::where('id_bordereau', $bulletin->id_bordereau)
                ->where('action', 'vérification')
                ->orderBy('created_at', 'desc')
                ->first();

            if ($log && $log->details) {
                $details = is_string($log->details) ? json_decode($log->details, true) : $log->details;
                $etapes = $details['étapes'] ?? $details['etapes'] ?? [];

                foreach ($etapes as $etape) {
                    $correspondances = $etape['détails']['correspondances'] ?? $etape['details']['correspondances'] ?? [];
                    foreach ($correspondances as $corr) {
                        if (($corr['numero_pdf'] ?? '') === $bulletin->numero_bulletin) {
                            $pdfDetails = [
                                'lignes'        => $corr['détails_soins']['lignes_pdf'] ?? $corr['details_soins']['lignes_pdf'] ?? [],
                                'total_frais'   => $corr['détails_soins']['total_frais_pdf'] ?? $corr['details_soins']['total_frais_pdf'] ?? 0,
                                'total_rembourse' => $corr['détails_soins']['total_rembourse_pdf'] ?? $corr['details_soins']['total_rembourse_pdf'] ?? 0,
                                'statut_pdf'    => $corr['statut_pdf'] ?? '',
                                'montant_rembourse_pdf' => $corr['montant_rembourse_pdf'] ?? null,
                            ];
                            break 2;
                        }
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $bulletin,
            'pdf_details' => $pdfDetails,
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

    /**
     * Import en masse de bulletins depuis un fichier Excel parsé côté frontend.
     * Regoit un tableau JSON de bulletins (groupés par N° bulletin) avec leurs détails.
     * Chaque bulletin peut avoir un tableau _details pour les lignes de soins multiples.
     */
    public function importExcel(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bulletins' => 'required|array|min:1',
            'bulletins.*.matricule' => 'required|string|max:50',
            'bulletins.*.numero_bulletin' => 'required|string|max:50',
            'bulletins.*.beneficiaire' => 'nullable|string|max:255',
            'bulletins.*.date' => 'nullable|date',
            'bulletins.*.montant' => 'required|numeric|min:0.01',
            'bulletins.*.type_soin' => 'required|string|max:100',
            'bulletins.*._details' => 'nullable|array',
            'bulletins.*._details.*.date' => 'nullable|date',
            'bulletins.*._details.*.montant' => 'required|numeric|min:0.01',
            'bulletins.*._details.*.type_soin' => 'required|string|max:100',
        ]);

        $results = [
            'success' => [],
            'errors' => [],
            'total' => count($data['bulletins']),
            'imported' => 0,
            'failed' => 0,
        ];

        // Charger tous les adhérents en mémoire pour éviter des requêtes N+1
        $adherents = \App\Models\Adherent::pluck('id_adherent', 'matricule')->toArray();

        foreach ($data['bulletins'] as $index => $item) {
            $matricule = trim($item['matricule']);

            // Vérifier que le matricule existe
            if (!isset($adherents[$matricule])) {
                $results['errors'][] = [
                    'row' => $index + 1,
                    'numero_bulletin' => $item['numero_bulletin'],
                    'message' => "Matricule '{$matricule}' introuvable.",
                ];
                $results['failed']++;
                continue;
            }

            $idAdherent = $adherents[$matricule];

            // Vérifier l'unicité du numéro de bulletin
            $existing = BulletinSoin::where('numero_bulletin', $item['numero_bulletin'])->exists();
            if ($existing) {
                $results['errors'][] = [
                    'row' => $index + 1,
                    'numero_bulletin' => $item['numero_bulletin'],
                    'message' => "Le numéro de bulletin '{$item['numero_bulletin']}' existe déjà.",
                ];
                $results['failed']++;
                continue;
            }

            try {
                \Illuminate\Support\Facades\DB::beginTransaction();

                $dateSoin = $item['date'] ?? date('Y-m-d');

                // Déterminer le sous-adhérent à partir du bénéficiaire (colonne PRESTATAIRE)
                // La colonne peut contenir : "LUI-MEME", "AFEF/CONJOINT", "MOHAMED/FILS", ou un nom simple
                $idSousAdherent = null;
                $beneficiaire = isset($item['beneficiaire']) ? trim($item['beneficiaire']) : '';
                $descriptionBeneficiaire = '';

                if (!empty($beneficiaire)) {
                    // ════════════════════════════════════════════════════════════
                    // ÉTAPE 1 : Vérifier si c'est "lui-même" (pas de sous-adhérent)
                    // ════════════════════════════════════════════════════════════
                    $beneficiaireClean = preg_replace('/[\s\-\/\_\.]/u', '', mb_strtoupper($beneficiaire));
                    $luiMemePatterns = ['LUIMEME', 'LUIMME', 'LUI.MEME', 'LUI', 'MOI', 'PERSONNE'];
                    $isLuiMeme = false;
                    foreach ($luiMemePatterns as $pattern) {
                        if ($beneficiaireClean === $pattern || strpos($beneficiaireClean, $pattern) !== false) {
                            $isLuiMeme = true;
                            break;
                        }
                    }

                    if (!$isLuiMeme) {
                        // ════════════════════════════════════════════════════════
                        // ÉTAPE 2 : Parse le format "NOM/RELATION"
                        // ════════════════════════════════════════════════════════
                        $parts = explode('/', $beneficiaire, 2);
                        $namePart = trim($parts[0]);
                        $relationPart = isset($parts[1]) ? trim($parts[1]) : '';

                        // Charger les sous-adhérents de cet adhérent
                        $sousAdherents = \App\Models\SousAdherent::where('id_adherent', $idAdherent)->get();
                        $found = false;

                        // ─── Sous-étape 2a : Matching par lien de parenté ───
                        if (!empty($relationPart)) {
                            $relationUpper = mb_strtoupper($relationPart);
                            
                            // Mapper les mots-clés vers lien_parente
                            $relationMap = [
                                'CONJOINT' => ['Conjoint'],
                                'CONJOINTE' => ['Conjoint'],
                                'EPOUX' => ['Conjoint'],
                                'EPOUSE' => ['Conjoint'],
                                'FILS' => ['Enfant'],
                                'FILLE' => ['Enfant'],
                                'ENFANT' => ['Enfant'],
                                'ENFANTS' => ['Enfant'],
                                'PERE' => ['Conjoint'],
                                'MERE' => ['Conjoint'],
                            ];

                            $mappedRelations = $relationMap[$relationUpper] ?? [];
                            if (!empty($mappedRelations)) {
                                foreach ($mappedRelations as $lien) {
                                    $candidates = $sousAdherents->where('lien_parente', $lien);
                                    if ($candidates->count() === 1) {
                                        // Un seul sous-adhérent avec ce lien → match direct
                                        $idSousAdherent = $candidates->first()->id_sous_adherent;
                                        $found = true;
                                        break;
                                    } elseif ($candidates->count() > 1 && !empty($namePart)) {
                                        // Plusieurs avec le même lien → préciser avec le prénom/nom
                                        $nameUpper = mb_strtoupper(preg_replace('/[\s]+/', ' ', $namePart));
                                        foreach ($candidates as $sa) {
                                            $saNom = mb_strtoupper(trim(($sa->prenom ?? '') . ' ' . ($sa->nom ?? '')));
                                            $saNom2 = mb_strtoupper(trim(($sa->nom ?? '') . ' ' . ($sa->prenom ?? '')));
                                            if ($nameUpper === $saNom || $nameUpper === $saNom2 ||
                                                strpos($nameUpper, $saNom) !== false || strpos($nameUpper, $saNom2) !== false) {
                                                $idSousAdherent = $sa->id_sous_adherent;
                                                $found = true;
                                                break 2;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // ─── Sous-étape 2b : Fallback par nom seulement ───
                            if (!$found && !empty($namePart)) {
                                $nameUpper = mb_strtoupper(preg_replace('/[\s]+/', ' ', $namePart));
                                foreach ($sousAdherents as $sa) {
                                    $saNom = mb_strtoupper(trim(($sa->prenom ?? '') . ' ' . ($sa->nom ?? '')));
                                    $saNom2 = mb_strtoupper(trim(($sa->nom ?? '') . ' ' . ($sa->prenom ?? '')));
                                    if ($nameUpper === $saNom || $nameUpper === $saNom2 ||
                                        strpos($nameUpper, $saNom) !== false || strpos($nameUpper, $saNom2) !== false) {
                                        $idSousAdherent = $sa->id_sous_adherent;
                                        $found = true;
                                        break;
                                    }
                                }
                            }
                        } else {
                            // ─── Pas de relation → matching par nom uniquement ───
                            $beneficiaireUpper = mb_strtoupper(trim(preg_replace('/\s+/', ' ', $beneficiaire)));
                            foreach ($sousAdherents as $sa) {
                                $saNom = mb_strtoupper(trim(($sa->prenom ?? '') . ' ' . ($sa->nom ?? '')));
                                $saNom2 = mb_strtoupper(trim(($sa->nom ?? '') . ' ' . ($sa->prenom ?? '')));
                                if (strpos($beneficiaireUpper, $saNom) !== false || strpos($beneficiaireUpper, $saNom2) !== false) {
                                    $idSousAdherent = $sa->id_sous_adherent;
                                    break;
                                }
                            }
                        }
                }
                
                // Toujours sauvegarder le texte brut du bénéficiaire (même si "LUI-MEME")
                $descriptionBeneficiaire = $beneficiaire;
            }

            // Construire la description (conserver le bénéficiaire original)
            $description = $descriptionBeneficiaire;

            $bulletin = BulletinSoin::create([
                'id_adherent' => $idAdherent,
                'id_sous_adherent' => $idSousAdherent,
                'numero_bulletin' => $item['numero_bulletin'],
                'date_soin' => $dateSoin,
                'type_soin' => $item['type_soin'],
                'montant_depense' => $item['montant'],
                'description' => $description,
                'etat' => 'En attente',
            ]);

                // Si _details est fourni, créer plusieurs détails
                $detailsList = $item['_details'] ?? [];

                if (!empty($detailsList)) {
                    foreach ($detailsList as $detail) {
                        BulletinSoinDetail::create([
                            'id_bulletin' => $bulletin->id_bulletin,
                            'date' => $detail['date'] ?? $dateSoin,
                            'montant' => $detail['montant'],
                            'type_soin' => $detail['type_soin'],
                        ]);
                    }
                } else {
                    // Fallback : créer un seul détail avec les infos du bulletin
                    BulletinSoinDetail::create([
                        'id_bulletin' => $bulletin->id_bulletin,
                        'date' => $dateSoin,
                        'montant' => $item['montant'],
                        'type_soin' => $item['type_soin'],
                    ]);
                }

                \Illuminate\Support\Facades\DB::commit();

                $results['success'][] = [
                    'row' => $index + 1,
                    'numero_bulletin' => $item['numero_bulletin'],
                    'id_bulletin' => $bulletin->id_bulletin,
                ];
                $results['imported']++;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\DB::rollBack();
                $results['errors'][] = [
                    'row' => $index + 1,
                    'numero_bulletin' => $item['numero_bulletin'],
                    'message' => $e->getMessage(),
                ];
                $results['failed']++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Import terminé : {$results['imported']} bulletin(s) importé(s), {$results['failed']} échec(s).",
            'data' => $results,
        ]);
    }

}


