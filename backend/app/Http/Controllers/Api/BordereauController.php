<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BordereauRequest;
use App\Models\Bordereau;
use App\Models\BordereauLog;
use App\Models\BulletinSoin;
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

        $data = $request->validated();
        $idBulletins = $data['id_bulletins'] ?? [];
        unset($data['id_bulletins']);

        $bordereau->update($data);

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

        // 6. Mettre à jour chaque bulletin trouvé dans le PDF
        $updated = [];
        $notFound = [];

        foreach ($deduplicated as $item) {
            $numero = $item['numero_bulletin'];

            if (!isset($bulletinIndex[$numero])) {
                $notFound[] = $numero;
                continue;
            }

            $bulletin = $bulletinIndex[$numero];

            // Mettre à jour l'état ET le montant_rembourse du bulletin
            // montant_rembourse = le montant remboursé extrait du PDF réponse STIP (pour les validés)
            // montant_depense reste le montant saisi lors de la création du bulletin (inchangé)
            $updateData = ['etat' => $item['statut']];

            // Sauvegarder le montant_rembourse extrait du PDF (pour les validés, null pour les autres)
            if (array_key_exists('montant_rembourse', $item)) {
                $updateData['montant_rembourse'] = $item['montant_rembourse'];
            }

            $bulletin->update($updateData);

            $updated[] = [
                'id_bulletin'      => $bulletin->id_bulletin,
                'numero_bulletin'  => $numero,
                'etat'             => $item['statut'],
                'montant_rembourse' => $item['montant_rembourse'],
            ];
        }

        // 6. Mettre à jour le bordereau
        // - montant_rembourse = Total Bordereau extrait du PDF réponse
        // - montant_total    = somme de tous les bulletins (validés, rejetés, sous contrôle)
        $montantRembourse = $totalBordereauPdf;

        // Fallback : si le Total Bordereau n'est pas trouvé dans le PDF,
        // utiliser la somme des bulletins validés
        if ($montantRembourse === null) {
            $montantRembourse = BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
                ->where('etat', 'Validé')
                ->sum('montant_depense');
        }

        // Recalculer le montant_total = somme de tous les bulletins
        $montantTotal = BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
            ->sum('montant_depense');

        $bordereau->update([
            'statut'             => 'Traité',
            'fichier_reponse'    => $pdfPath,
            'date_reponse'       => now()->toDateString(),
            'montant_total'      => $montantTotal,
            'montant_rembourse'  => $montantRembourse,
        ]);

        $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.sousAdherent', 'bulletinSoins.details']);

        // Journalisation
        $statsLog = [
            'valides' => count(array_filter($updated, fn($u) => $u['etat'] === 'Validé')),
            'rejetes' => count(array_filter($updated, fn($u) => $u['etat'] === 'Rejeté')),
            'sous_controle' => count(array_filter($updated, fn($u) => $u['etat'] === 'Sous contrôle')),
            'non_trouves' => $notFound,
            'montant_valide' => $montantRembourse,
            'total_bordereau_pdf' => $totalBordereauPdf,
            'fichier' => $pdfPath,
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
