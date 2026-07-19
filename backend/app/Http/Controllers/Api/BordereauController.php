<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BordereauRequest;
use App\Models\Bordereau;
use App\Models\BordereauLog;
use App\Models\BulletinSoin;
use App\Models\BulletinSoinDetail;
use App\Services\StipPdfParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BordereauController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Bordereau::with(['bulletinSoins.adherent:id_adherent,nom,prenom,matricule', 'bulletinSoins.sousAdherent:id_sous_adherent,nom,prenom', 'bulletinSoins.details', 'logs']);

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

        // Vérifier qu'aucun des bulletins sélectionnés n'est déjà lié à un bordereau
        $bulletinsDejaLies = BulletinSoin::whereIn('id_bulletin', $idBulletins)
            ->whereNotNull('id_bordereau')
            ->pluck('numero_bulletin')
            ->toArray();

        if (!empty($bulletinsDejaLies)) {
            return response()->json([
                'success' => false,
                'message' => 'Certains bulletins sont déjà liés à un autre bordereau : N°' . implode(', N°', $bulletinsDejaLies),
            ], 422);
        }

        $bordereau = Bordereau::create($data);

        // Associer les bulletins sélectionnés au bordereau
        // et les remettre en "En attente" car ils ne sont pas encore traités
        BulletinSoin::whereIn('id_bulletin', $idBulletins)
                    ->update([
                        'id_bordereau' => $bordereau->id_bordereau,
                        'etat'         => 'En attente',
                    ]);

        // Calculer le montant total à partir des bulletins associés
        $montantTotal = BulletinSoin::whereIn('id_bulletin', $idBulletins)->sum('montant_depense');
        $bordereau->update(['montant_total' => $montantTotal]);

        // Journalisation
        BordereauLog::create([
            'id_bordereau' => $bordereau->id_bordereau,
            'id_user'      => $request->user()?->id,
            'action'       => 'création',
            'details'      => [
                'numero_bordereau' => $bordereau->numero_bordereau,
                'nb_bulletins'     => count($idBulletins),
                'montant_total'    => $montantTotal,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bordereau créé avec succès.',
            'data' => $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.details']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $bordereau = Bordereau::with(['bulletinSoins.adherent', 'bulletinSoins.sousAdherent', 'bulletinSoins.details', 'logs'])->find($id);

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

        // Un bordereau traité ne peut plus être modifié
        if ($bordereau->statut === 'Traité') {
            return response()->json([
                'success' => false,
                'message' => 'Un bordereau traité ne peut plus être modifié.',
            ], 422);
        }

        $data = $request->validated();

        // Ne dissocier/réassocier les bulletins QUE si le champ id_bulletins
        // a été explicitement fourni dans la requête (sinon, on ne touche pas aux bulletins)
        $hasBulletins = $request->has('id_bulletins');
        if ($hasBulletins) {
            $idBulletins = $data['id_bulletins'] ?? [];
            unset($data['id_bulletins']);

            // Dissocier les anciens bulletins
            BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
                        ->update(['id_bordereau' => null]);

            // Associer les nouveaux bulletins
            // et les remettre en "En attente" car ils ne sont pas encore traités
            if (!empty($idBulletins)) {
                BulletinSoin::whereIn('id_bulletin', $idBulletins)
                            ->update([
                                'id_bordereau' => $bordereau->id_bordereau,
                                'etat'         => 'En attente',
                            ]);

                // Recalculer le montant total
                $montantTotal = BulletinSoin::whereIn('id_bulletin', $idBulletins)->sum('montant_depense');
            } else {
                $montantTotal = 0;
            }

            $bordereau->update(['montant_total' => $montantTotal]);
        } else {
            unset($data['id_bulletins']);
        }

        $bordereau->update($data);

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

        // Remettre tous les bulletins liés en "En attente"
        // car le bordereau n'est pas encore traité (en attente du PDF réponse STIP)
        BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
                    ->update(['etat' => 'En attente']);

        // Journalisation
        BordereauLog::create([
            'id_bordereau' => $bordereau->id_bordereau,
            'id_user'      => request()->user()?->id,
            'action'       => 'envoi',
            'details'      => [
                'date_envoi' => now()->toDateString(),
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bordereau envoyé avec succès.',
            'data' => $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.details']),
        ]);
    }

    /**
     * Récupérer l'historique des actions pour un bordereau.
     */
    public function logs(int $id): JsonResponse
    {
        $bordereau = Bordereau::find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        $logs = BordereauLog::with('user')
            ->where('id_bordereau', $id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id'         => $log->id_log,
                    'action'     => $log->action,
                    'details'    => $log->details,
                    'user'       => $log->user ? [
                        'id'    => $log->user->id,
                        'email' => $log->user->email,
                    ] : null,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Vérifier le bordereau à partir d'un fichier PDF STIP uniquement.
     * Extrait automatiquement les bulletins et leurs statuts (Validé/Rejeté/Sous contrôle) depuis le PDF.
     */
    public function verifierPdf(Request $request, int $id): JsonResponse
    {
        $bordereau = Bordereau::with('bulletinSoins.adherent')->find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        if ($bordereau->statut !== 'Envoyé' && $bordereau->statut !== 'Traité') {
            return response()->json([
                'success' => false,
                'message' => 'Le bordereau doit être envoyé avant de pouvoir le vérifier avec un PDF de réponse.',
            ], 400);
        }

        // 1. Validation du fichier PDF
        if (!$request->hasFile('pdf')) {
            return response()->json([
                'success' => false,
                'message' => 'Veuillez uploader le fichier PDF de réponse STIP.',
            ], 400);
        }

        $file = $request->file('pdf');

        // Valider l'extension et le type MIME
        if (strtolower($file->getClientOriginalExtension()) !== 'pdf' || $file->getMimeType() !== 'application/pdf') {
            return response()->json([
                'success' => false,
                'message' => 'Le fichier doit être au format PDF.',
            ], 400);
        }

        // Limiter la taille à 20 Mo
        $maxSize = 20 * 1024; // KB
        if ($file->getSize() > $maxSize * 1024) {
            return response()->json([
                'success' => false,
                'message' => 'Le fichier PDF ne doit pas dépasser 20 Mo.',
            ], 400);
        }

        // 2. Sauvegarder le PDF
        $filename = 'verification_bordereau_' . $bordereau->id_bordereau . '_' . time() . '.pdf';
        $pdfPath = $file->storeAs('reponses_bordereaux', $filename, 'public');
        $fullPath = Storage::disk('public')->path($pdfPath);

        // 3. Parser le PDF
        $parser = app(StipPdfParser::class);

        try {
            $parsedResult = $parser->parse($fullPath);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'analyse du PDF : ' . $e->getMessage(),
            ], 422);
        }

        $parsedBulletins = $parsedResult['bulletins'];
        $totalBordereauPdf = $parsedResult['total_bordereau'];
        $detailsParBulletin = $parsedResult['details_par_bulletin'] ?? [];

        if (empty($parsedBulletins)) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun bulletin trouvé dans le PDF.',
            ], 422);
        }

        // 4. Indexer les bulletins du bordereau par leur numero_bulletin
        $bulletinIndex = [];
        foreach ($bordereau->bulletinSoins as $bs) {
            $bulletinIndex[$bs->numero_bulletin] = $bs;
        }

        // 5. Dédupliquer les bulletins parsés du PDF
        // Le PDF peut contenir plusieurs lignes pour un même numéro de bulletin
        // (ex: lignes de détail qui commencent par le même numéro).
        // On ne garde que la PREMIÈRE occurrence pour éviter d'écraser
        // un statut 'Validé'/'Rejeté'/'Sous contrôle' par 'En attente'.
        $deduplicated = [];
        foreach ($parsedBulletins as $item) {
            $num = $item['numero_bulletin'];
            if (!isset($deduplicated[$num])) {
                $deduplicated[$num] = $item;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // CONSTRUCTION DES ÉTAPES POUR LE LOG DÉTAILLÉ
        // ═══════════════════════════════════════════════════════════
        $etapesLog = [];
        $etapeIndex = 1;

        // ÉTAPE 1 : Analyse du PDF
        $etapeAnalyse = [
            'étape' => $etapeIndex++,
            'titre' => 'Analyse du PDF réponse STIP',
            'détails' => [
                'fichier'              => basename($fullPath),
                'total_bulletins_pdf'  => count($parsedBulletins),
                'bulletins_dédupliqués' => count($deduplicated),
                'total_bordereau_pdf'  => $totalBordereauPdf,
                'bulletins_trouvés'    => collect($parsedBulletins)->map(fn($b) => [
                    'numero'  => $b['numero_bulletin'],
                    'statut'  => $b['statut'],
                    'montant' => $b['montant_rembourse'],
                ])->values()->toArray(),
            ],
        ];
        $etapesLog[] = $etapeAnalyse;

        // ÉTAPE 2 : Mise en correspondance des bulletins
        $etapeCorrespondance = [
            'étape' => $etapeIndex++,
            'titre' => 'Mise en correspondance des bulletins (PDF ⇔ Base de données)',
            'détails' => [
                'bulletins_en_base' => $bordereau->bulletinSoins->map(fn($b) => [
                    'id_bulletin'     => $b->id_bulletin,
                    'numero'          => $b->numero_bulletin,
                    'etat_actuel'     => $b->etat,
                    'montant_depense' => (float) $b->montant_depense,
                    'adherent'        => $b->adherent?->nom . ' ' . $b->adherent?->prenom,
                ])->values()->toArray(),
                'correspondances' => [],
            ],
        ];

        // 6. Mettre à jour chaque bulletin trouvé dans le PDF
        $updated = [];
        $notFound = [];
        $totalDetailsUpdated = 0;
        $totalDetailsCreated = 0;
        $detailsParBulletinLog = []; // Pour le log détaillé

        foreach ($deduplicated as $item) {
            $numero = $item['numero_bulletin'];

            if (!isset($bulletinIndex[$numero])) {
                $notFound[] = $numero;
                $etapeCorrespondance['détails']['correspondances'][] = [
                    'numero_pdf'   => $numero,
                    'statut_pdf'   => $item['statut'],
                    'correspondance' => '❌ Non trouvé dans le bordereau',
                ];
                continue;
            }

            $bulletin = $bulletinIndex[$numero];

            // Mettre à jour l'état ET le montant_rembourse du bulletin
            $updateData = ['etat' => $item['statut']];
            if (array_key_exists('montant_rembourse', $item)) {
                $updateData['montant_rembourse'] = $item['montant_rembourse'];
            }

            $bulletin->update($updateData);

            // Mettre à jour les détails par soin si disponibles dans le PDF
            $bulletinsDetailsUpdated = 0;
            $bulletinsDetailsCreated = 0;
            $detailLog = null;

            if (isset($detailsParBulletin[$numero])) {
                $resultatDetails = $this->updateBulletinDetails($bulletin, $detailsParBulletin[$numero]);
                $bulletinsDetailsUpdated = $resultatDetails['updated'];
                $bulletinsDetailsCreated = $resultatDetails['created'];

                // Construire le log des détails pour ce bulletin
                $detailLog = [
                    'lignes_pdf'        => collect($detailsParBulletin[$numero]['lignes'])->map(fn($l) => [
                        'rubrique'  => $l['rubrique'],
                        'frais'     => $l['frais'],
                        'rembourse' => $l['rembourse'],
                    ])->values()->toArray(),
                    'total_frais_pdf'   => $detailsParBulletin[$numero]['total_frais'],
                    'total_rembourse_pdf' => $detailsParBulletin[$numero]['total_rembourse'],
                    'details_updated'   => $bulletinsDetailsUpdated,
                    'details_created'   => $bulletinsDetailsCreated,
                ];
            }

            $totalDetailsUpdated += $bulletinsDetailsUpdated;
            $totalDetailsCreated += $bulletinsDetailsCreated;

            $updated[] = [
                'id_bulletin'        => $bulletin->id_bulletin,
                'numero_bulletin'    => $numero,
                'etat'               => $item['statut'],
                'montant_rembourse'  => $item['montant_rembourse'],
                'details_updated'    => $bulletinsDetailsUpdated,
                'details_created'    => $bulletinsDetailsCreated,
            ];

            $matchEntry = [
                'numero_pdf'         => $numero,
                'statut_pdf'         => $item['statut'],
                'montant_rembourse_pdf' => $item['montant_rembourse'],
                'correspondance'     => '✅ Correspondance trouvée',
                'adherent'           => $bulletin->adherent?->nom . ' ' . $bulletin->adherent?->prenom,
                'ancien_etat'        => $bulletin->getOriginal('etat'),
                'nouvel_etat'        => $item['statut'],
            ];
            if ($detailLog) {
                $matchEntry['détails_soins'] = $detailLog;
            }
            $etapeCorrespondance['détails']['correspondances'][] = $matchEntry;
        }

        $etapesLog[] = $etapeCorrespondance;

        // ─── Calculer les montants avant de construire l'étape 3 ───
        $montantRembourse = $totalBordereauPdf;
        if ($montantRembourse === null) {
            $montantRembourse = BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
                ->where('etat', 'Validé')
                ->sum('montant_depense');
        }
        $montantTotal = BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
            ->sum('montant_depense');

        // ÉTAPE 3 : Résumé de l'opération
        $etapeResume = [
            'étape' => $etapeIndex++,
            'titre' => 'Résumé de la vérification',
            'détails' => [
                'bulletins_traités'     => count($updated),
                'bulletins_non_trouvés' => $notFound,
                'valides'               => count(array_filter($updated, fn($u) => $u['etat'] === 'Validé')),
                'rejetés'               => count(array_filter($updated, fn($u) => $u['etat'] === 'Rejeté')),
                'sous_contrôle'         => count(array_filter($updated, fn($u) => $u['etat'] === 'Sous contrôle')),
                'total_bordereau_pdf'   => $totalBordereauPdf,
                'montant_total'         => $montantTotal,
                'montant_rembourse'     => $montantRembourse,
            ],
        ];
        $etapesLog[] = $etapeResume;

        // 6. Mettre à jour le bordereau
        $bordereau->update([
            'statut'             => 'Traité',
            'fichier_reponse'    => $pdfPath,
            'date_reponse'       => now()->toDateString(),
            'montant_total'      => $montantTotal,
            'montant_rembourse'  => $montantRembourse,
        ]);

        $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.sousAdherent', 'bulletinSoins.details']);

        // Journalisation AVEC étapes détaillées
        $statsLog = [
            'valides' => count(array_filter($updated, fn($u) => $u['etat'] === 'Validé')),
            'rejetes' => count(array_filter($updated, fn($u) => $u['etat'] === 'Rejeté')),
            'sous_controle' => count(array_filter($updated, fn($u) => $u['etat'] === 'Sous contrôle')),
            'non_trouves' => $notFound,
            'montant_valide' => $montantRembourse,
            'total_bordereau_pdf' => $totalBordereauPdf,
            'fichier' => $pdfPath,
            'details_maj' => $totalDetailsUpdated,
            'details_crees' => $totalDetailsCreated,
            // NOUVEAU : Étapes détaillées pour affichage pas-à-pas
            'étapes' => $etapesLog,
        ];

        BordereauLog::create([
            'id_bordereau' => $bordereau->id_bordereau,
            'id_user'      => $request->user()?->id,
            'action'       => 'vérification',
            'details'      => $statsLog,
        ]);

        $responseData = [
            'success' => true,
            'message' => 'Bordereau vérifié avec succès. ' . count($updated) . ' bulletin(s) mis à jour.',
            'data' => $bordereau,
            'updated_bulletins' => $updated,
        ];

        if (!empty($notFound)) {
            $responseData['warnings'] = [
                'not_found' => $notFound,
                'message' => count($notFound) . ' bulletin(s) du PDF non trouvé(s) dans ce bordereau.',
            ];
        }

        return response()->json($responseData);
    }

    /**
     * Re-parse le PDF réponse déjà stocké pour mettre à jour les montant_rembourse
     * de chaque bulletin. Utile pour les bordereaux traités avant l'ajout de la colonne.
     */
    public function reparerMontantRembourse(int $id): JsonResponse
    {
        $bordereau = Bordereau::with('bulletinSoins.adherent')->find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        if (!$bordereau->fichier_reponse) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun fichier PDF réponse associé à ce bordereau.',
            ], 400);
        }

        $disk = Storage::disk('public');
        $fullPath = $disk->path($bordereau->fichier_reponse);

        if (!$disk->exists($bordereau->fichier_reponse)) {
            return response()->json([
                'success' => false,
                'message' => 'Le fichier PDF réponse est introuvable sur le serveur.',
            ], 404);
        }

        // Parser le PDF
        $parser = app(StipPdfParser::class);

        try {
            $parsedResult = $parser->parse($fullPath);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'analyse du PDF : ' . $e->getMessage(),
            ], 422);
        }

        $parsedBulletins = $parsedResult['bulletins'];
        $detailsParBulletin = $parsedResult['details_par_bulletin'] ?? [];

        if (empty($parsedBulletins)) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun bulletin trouvé dans le PDF.',
            ], 422);
        }

        // Indexer les bulletins
        $bulletinIndex = [];
        foreach ($bordereau->bulletinSoins as $bs) {
            $bulletinIndex[$bs->numero_bulletin] = $bs;
        }

        // Dédupliquer les bulletins parsés du PDF (même raison que dans verifierPdf)
        $deduplicated = [];
        foreach ($parsedBulletins as $item) {
            $num = $item['numero_bulletin'];
            if (!isset($deduplicated[$num])) {
                $deduplicated[$num] = $item;
            }
        }

        // Mettre à jour chaque bulletin (une seule fois par numero)
        $updated = [];
        $notFound = [];

        foreach ($deduplicated as $item) {
            $numero = $item['numero_bulletin'];

            if (!isset($bulletinIndex[$numero])) {
                $notFound[] = $numero;
                continue;
            }

            $bulletin = $bulletinIndex[$numero];

            $updateData = [
                'etat' => $item['statut'],
                'montant_rembourse' => $item['montant_rembourse'],
            ];

            $bulletin->update($updateData);

            // Mettre à jour les détails par soin si disponibles dans le PDF
            if (isset($detailsParBulletin[$numero])) {
                $this->updateBulletinDetails($bulletin, $detailsParBulletin[$numero]);
            }

            $updated[] = [
                'id_bulletin'      => $bulletin->id_bulletin,
                'numero_bulletin'  => $numero,
                'etat'             => $item['statut'],
                'montant_rembourse' => $item['montant_rembourse'],
            ];
        }

        // Mettre à jour le bordereau
        $montantRembourse = $parsedResult['total_bordereau'];
        if ($montantRembourse === null) {
            $montantRembourse = BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
                ->where('etat', 'Validé')
                ->sum('montant_rembourse');
        }

        $bordereau->update(['montant_rembourse' => $montantRembourse]);

        // Journalisation
        BordereauLog::create([
            'id_bordereau' => $bordereau->id_bordereau,
            'id_user'      => request()->user()?->id,
            'action'       => 'correction_montant_rembourse',
            'details'      => [
                'nb_bulletins'     => count($updated),
                'nb_non_trouves'   => count($notFound),
                'montant_rembourse' => $montantRembourse,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => count($updated) . ' bulletin(s) mis à jour avec le montant_rembourse du PDF réponse.',
            'data' => [
                'updated' => $updated,
                'not_found' => $notFound,
            ],
        ]);
    }

    /**
     * Met à jour les BulletinSoinDetail d'un bulletin à partir des lignes parsées du PDF.
     *
     * Algorithme de matching :
     *   1. Match par Rubrique (type_soin) : on ajoute le rembourse au détail existant
     *      (plusieurs lignes PDF avec la même rubrique accumulent leur rembourse)
     *   2. Match par Frais (montant) : si la rubrique ne correspond à aucun détail,
     *      on compare le montant (frais) pour trouver un détail non utilisé
     *   3. Création : si aucun matching, créer un nouveau détail
     *
     * @param  BulletinSoin  $bulletin
     * @param  array  $detailData  ['lignes' => [...], 'total_frais' => ?, 'total_rembourse' => ?]
     * @return array  ['updated' => int, 'created' => int]
     */
    private function updateBulletinDetails($bulletin, array $detailData): array
    {
        $updated = 0;
        $created = 0;
        $bulletinsNumero = $bulletin->numero_bulletin ?? '?';

        \Illuminate\Support\Facades\Log::info("[updateBulletinDetails] Début pour le bulletin N°{$bulletinsNumero} - " . count($detailData['lignes'] ?? []) . ' ligne(s) PDF');

        try {
            // Remettre à zéro les montant_rembourse avant de recalculer
            $bulletin->details()->update(['montant_rembourse' => null]);
            \Illuminate\Support\Facades\Log::info("[updateBulletinDetails] Bulletin N°{$bulletinsNumero} → montant_rembourse réinitialisés à null pour tous les détails");

            // Recharger les détails existants
            $existingDetails = $bulletin->details()->get();
            \Illuminate\Support\Facades\Log::info("[updateBulletinDetails] Bulletin N°{$bulletinsNumero} → " . count($existingDetails) . ' détail(s) existant(s) en DB');

            // Indexer les détails par type_soin pour un accès rapide
            $detailsParType = [];
            foreach ($existingDetails as $d) {
                $key = strtolower(trim($d->type_soin ?? ''));
                if (!isset($detailsParType[$key])) {
                    $detailsParType[$key] = [];
                }
                $detailsParType[$key][] = $d;
            }
            \Illuminate\Support\Facades\Log::info("[updateBulletinDetails] Bulletin N°{$bulletinsNumero} → " . count($detailsParType) . ' type(s) de soin indexés : ' . implode(', ', array_keys($detailsParType)));

            // Trackers
            $usedDetailIds = [];
            $remainingPdfIndices = [];

            // ═══════════════════════════════════════════════════════════
            // ÉTAPE 1 : Match par Rubrique (type_soin)
            // ═══════════════════════════════════════════════════════════
            \Illuminate\Support\Facades\Log::info("[updateBulletinDetails] --- ÉTAPE 1 : Match par Rubrique ---");

            foreach ($detailData['lignes'] as $idx => $ligne) {
                $rubrique = strtolower(trim($ligne['rubrique']));
                $ligneFrais = number_format($ligne['frais'], 3, ',', ' ');
                $ligneRemb = number_format($ligne['rembourse'], 3, ',', ' ');
                $matched = false;

                \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]   Ligne #{$idx} : Rubrique={$ligne['rubrique']}, Frais={$ligneFrais} DT, Remb={$ligneRemb} DT");

                if (isset($detailsParType[$rubrique])) {
                    \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]     → Rubrique '{$ligne['rubrique']}' trouvée dans les détails DB");

                    foreach ($detailsParType[$rubrique] as $detail) {
                        $detailId = $detail->id_detail;
                        $dejaUtilise = in_array($detailId, $usedDetailIds, true);

                        $montantActuel = (float) ($dejaUtilise ? $detail->montant_rembourse : 0);
                        $nouveauRembourse = $montantActuel + $ligne['rembourse'];

                        if ($dejaUtilise) {
                            \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]     → Détail #{$detailId} déjà utilisé, ACCUMULATION : {$montantActuel} + {$ligne['rembourse']} = " . number_format($nouveauRembourse, 3, ',', ' ') . " DT");
                        } else {
                            \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]     → Match avec détail #{$detailId} (type_soin='{$detail->type_soin}', montant=" . number_format((float)$detail->montant, 3, ',', ' ') . " DT) → rembourse = {$ligneRemb} DT");
                        }

                        $detailUpdate = ['montant_rembourse' => $nouveauRembourse];

                        if (!$dejaUtilise) {
                            if ($detail->montant === null || (float) $detail->montant === 0.0) {
                                $detailUpdate['montant'] = $ligne['frais'];
                                \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]       → Montant du détail nul, mis à jour à {$ligneFrais} DT");
                            }
                            $usedDetailIds[] = $detailId;
                        }

                        $detail->update($detailUpdate);
                        $matched = true;
                        $updated++;
                        break;
                    }
                } else {
                    \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]     → Rubrique '{$ligne['rubrique']}' NON trouvée dans les détails DB, passage en ÉTAPE 2");
                }

                if (!$matched) {
                    $remainingPdfIndices[] = $idx;
                }
            }

            \Illuminate\Support\Facades\Log::info("[updateBulletinDetails] Fin ÉTAPE 1 : {$updated} ligne(s) matchée(s), " . count($remainingPdfIndices) . ' ligne(s) restante(s)');

            // ═══════════════════════════════════════════════════════════
            // ÉTAPE 2 : Match par Frais (montant)
            // ═══════════════════════════════════════════════════════════
            $unusedDetails = [];
            foreach ($existingDetails as $d) {
                if (!in_array($d->id_detail, $usedDetailIds, true)) {
                    $unusedDetails[$d->id_detail] = $d;
                }
            }

            if (!empty($remainingPdfIndices)) {
                \Illuminate\Support\Facades\Log::info("[updateBulletinDetails] --- ÉTAPE 2 : Match par Frais (" . count($unusedDetails) . ' détail(s) non utilisé(s) disponible(s)) ---');
            }

            foreach ($remainingPdfIndices as $idx) {
                $ligne = $detailData['lignes'][$idx];
                $ligneFrais = $ligne['frais'];
                $ligneRembourse = $ligne['rembourse'];
                $ligneRubrique = $ligne['rubrique'];
                $ligneFraisStr = number_format($ligneFrais, 3, ',', ' ');
                $ligneRembStr = number_format($ligneRembourse, 3, ',', ' ');
                $matched = false;

                \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]   Ligne #{$idx} : Rubrique={$ligneRubrique}, Frais={$ligneFraisStr} DT, Remb={$ligneRembStr} DT → recherche par Frais");

                foreach ($unusedDetails as $udId => $detail) {
                    $detailMontant = (float) $detail->montant;
                    $detailMontantStr = number_format($detailMontant, 3, ',', ' ');

                    \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]     Comparaison avec détail #{$udId} : montant={$detailMontantStr} DT vs frais={$ligneFraisStr} DT");

                    if (abs($detailMontant - $ligneFrais) < 0.01) {
                        \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]     ✅ MATCH par Frais ! Détail #{$udId} (type_soin='{$detail->type_soin}' → '{$ligneRubrique}') → rembourse = {$ligneRembStr} DT");

                        $detail->update([
                            'montant_rembourse' => $ligneRembourse,
                            'type_soin'         => $ligneRubrique,
                        ]);
                        unset($unusedDetails[$udId]);
                        $matched = true;
                        $updated++;
                        break;
                    } else {
                        $ecart = number_format(abs($detailMontant - $ligneFrais), 3, ',', ' ');
                        \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]     ❌ Pas de match : écart de {$ecart} DT > 0.01");
                    }
                }

                if (!$matched) {
                    // ═══════════════════════════════════════════════════
                    // ÉTAPE 3 : Créer un NOUVEAU détail
                    // ═══════════════════════════════════════════════════
                    \Illuminate\Support\Facades\Log::info("[updateBulletinDetails]     → Aucun match par Frais, CRÉATION d'un nouveau détail : type_soin='{$ligneRubrique}', montant={$ligneFraisStr} DT, remb={$ligneRembStr} DT");

                    BulletinSoinDetail::create([
                        'id_bulletin'       => $bulletin->id_bulletin,
                        'type_soin'         => $ligneRubrique,
                        'montant'           => $ligne['frais'],
                        'montant_rembourse' => $ligne['rembourse'],
                        'date'              => $bulletin->date_soin ?? now()->toDateString(),
                    ]);
                    $created++;
                }
            }

            // --- CONTROLE DE COHÉRENCE ---
            $this->verifierCoherenceDetail($bulletin, $detailData);

            \Illuminate\Support\Facades\Log::info("[updateBulletinDetails] Bulletin N°{$bulletinsNumero} terminé : {$updated} mis à jour, {$created} créé(s)");

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('[updateBulletinDetails] Erreur bulletin ' . ($bulletin->numero_bulletin ?? '?') . ': ' . $e->getMessage());
        }

        return ['updated' => $updated, 'created' => $created];
    }

    /**
     * Vérifie que la somme des montant_rembourse des détails correspond
     * au total attendu du PDF (NET A REGLER).
     * Log dans BordereauLog si incohérence.
     *
     * @return bool  true si cohérent, false sinon
     */
    private function verifierCoherenceDetail($bulletin, array $detailData): bool
    {
        $totalAttendu = $detailData['total_rembourse'] ?? null;
        if ($totalAttendu === null) return true;

        $totalCalcule = (float) $bulletin->details()->sum('montant_rembourse');
        $ecart = abs($totalCalcule - $totalAttendu);

        if ($ecart <= 0.01) return true;

        $detailsList = $bulletin->details()->get()->map(fn($d) => [
            'id' => $d->id_detail,
            'type_soin' => $d->type_soin,
            'montant' => $d->montant,
            'montant_rembourse' => $d->montant_rembourse,
        ])->toArray();

        // Log dans BordereauLog via le bordereau parent
        $bordereauId = $bulletin->id_bordereau;
        if ($bordereauId) {
            try {
                BordereauLog::create([
                    'id_bordereau' => $bordereauId,
                    'id_user'      => null,
                    'action'       => 'incoherence_details',
                    'details'      => [
                        'bulletin'         => $bulletin->numero_bulletin,
                        'total_attendu'    => $totalAttendu,
                        'total_calcule'    => $totalCalcule,
                        'ecart'            => $ecart,
                        'details'          => $detailsList,
                    ],
                ]);
            } catch (\Exception $e) {
                // Ne pas bloquer si le log échoue
            }
        }

        \Illuminate\Support\Facades\Log::warning(sprintf(
            'INCOHERENCE bulletin %s: attendu=%.3f calcule=%.3f ecart=%.3f details=%s',
            $bulletin->numero_bulletin ?? '?',
            $totalAttendu,
            $totalCalcule,
            $ecart,
            json_encode($detailsList)
        ));

        return false;
    }

    /**
     * Réinitialise l'état d'un bordereau traité et de ses bulletins.
     * Remet le statut du bordereau à "Envoyé", et les bulletins à "En attente"
     * avec montant_rembourse à null (et dans les détails aussi).
     */
    public function reinitialiserEtat(int $id): JsonResponse
    {
        $bordereau = Bordereau::with('bulletinSoins.details')->find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        if ($bordereau->statut !== 'Traité') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les bordereaux avec le statut "Traité" peuvent être réinitialisés.',
            ], 400);
        }

        // 1. Réinitialiser le bordereau
        $bordereau->update([
            'statut'            => 'Envoyé',
            'montant_rembourse' => null,
            'fichier_reponse'   => null,
            'date_reponse'      => null,
        ]);

        $nbBulletins = 0;

        // 2. Réinitialiser tous les bulletins
        foreach ($bordereau->bulletinSoins as $bulletin) {
            $bulletin->update([
                'etat'              => 'En attente',
                'montant_rembourse' => null,
            ]);

            // 3. Réinitialiser les montant_rembourse des détails
            foreach ($bulletin->details as $detail) {
                $detail->update(['montant_rembourse' => null]);
            }

            $nbBulletins++;
        }

        // Journalisation
        BordereauLog::create([
            'id_bordereau' => $bordereau->id_bordereau,
            'id_user'      => request()->user()?->id,
            'action'       => 'réinitialisation',
            'details'      => [
                'nb_bulletins'          => $nbBulletins,
                'ancien_statut'         => 'Traité',
                'nouveau_statut'        => 'Envoyé',
                'montant_rembourse_effacé' => true,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Bordereau réinitialisé avec succès. {$nbBulletins} bulletin(s) remis en attente.",
            'data'    => $bordereau->fresh()->load(['bulletinSoins.adherent', 'bulletinSoins.sousAdherent', 'bulletinSoins.details']),
        ]);
    }

    /**
     * Télécharge le fichier PDF réponse STIP associé à un bordereau.
     */
    public function reponsePdf(int $id): StreamedResponse|JsonResponse
    {
        $bordereau = Bordereau::find($id);

        if (!$bordereau) {
            return response()->json([
                'success' => false,
                'message' => 'Bordereau introuvable.',
            ], 404);
        }

        if (!$bordereau->fichier_reponse) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun fichier PDF réponse associé à ce bordereau.',
            ], 404);
        }

        $disk = Storage::disk('public');

        if (!$disk->exists($bordereau->fichier_reponse)) {
            return response()->json([
                'success' => false,
                'message' => 'Le fichier PDF réponse est introuvable sur le serveur.',
            ], 404);
        }

        return $disk->download($bordereau->fichier_reponse, 'reponse_bordereau_' . $bordereau->numero_bordereau . '.pdf');
    }

}
