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

        if ($bordereau->statut !== 'Envoyé') {
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

        // 5. Mettre à jour chaque bulletin trouvé dans le PDF
        $updated = [];
        $notFound = [];

        foreach ($parsedBulletins as $item) {
            $numero = $item['numero_bulletin'];

            if (!isset($bulletinIndex[$numero])) {
                $notFound[] = $numero;
                continue;
            }

            $bulletin = $bulletinIndex[$numero];

            $updateData = ['etat' => $item['statut']];

            if ($item['montant_rembourse'] !== null && $item['statut'] === 'Validé') {
                $updateData['montant_depense'] = $item['montant_rembourse'];
            }

            $bulletin->update($updateData);
            $updated[] = [
                'id_bulletin'      => $bulletin->id_bulletin,
                'numero_bulletin'  => $numero,
                'etat'             => $item['statut'],
                'montant_rembourse' => $item['montant_rembourse'],
            ];
        }

        // 6. Mettre à jour le bordereau avec le Total Bordereau du PDF
        // Le "montant remboursé" = le Total Bordereau extrait du PDF
        $montantFinal = $totalBordereauPdf;

        // Fallback : si le Total Bordereau n'est pas trouvé, utiliser la somme des bulletins validés
        if ($montantFinal === null) {
            $montantFinal = BulletinSoin::where('id_bordereau', $bordereau->id_bordereau)
                ->where('etat', 'Validé')
                ->sum('montant_depense');
        }

        $bordereau->update([
            'statut'         => 'Traité',
            'fichier_reponse' => $pdfPath,
            'date_reponse'   => now()->toDateString(),
            'montant_total'  => $montantFinal,
        ]);

        $bordereau->load(['bulletinSoins.adherent', 'bulletinSoins.sousAdherent', 'bulletinSoins.details']);

        // Journalisation
        $statsLog = [
            'valides' => count(array_filter($updated, fn($u) => $u['etat'] === 'Validé')),
            'rejetes' => count(array_filter($updated, fn($u) => $u['etat'] === 'Rejeté')),
            'sous_controle' => count(array_filter($updated, fn($u) => $u['etat'] === 'Sous contrôle')),
            'non_trouves' => $notFound,
            'montant_valide' => $montantFinal,
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

}
