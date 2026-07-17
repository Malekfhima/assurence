<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bordereau extends Model
{
    protected $table = 'bordereau';
    protected $primaryKey = 'id_bordereau';
    public $timestamps = false;

    protected $fillable = [
        'numero_bordereau', 'montant_total', 'montant_rembourse', 'date_envoi', 'statut', 'commentaire',
        'fichier_reponse', 'date_reponse', 'source',
    ];

    protected $casts = [
        'montant_total'      => 'decimal:3',
        'montant_rembourse'  => 'decimal:3',
    ];

    protected $appends = ['stats_bulletins'];

    public function getStatsBulletinsAttribute(): array
    {
        if (!$this->relationLoaded('bulletinSoins')) {
            return ['en_attente' => 0, 'valide' => 0, 'rejete' => 0, 'sous_controle' => 0, 'total' => 0, 'montant_rembourse' => 0];
        }

        $total = $this->bulletinSoins->count();

        // Pour les bordereaux traités, utiliser les logs de vérification
        // comme source autoritaire (ce qui a été extrait du PDF réponse)
        if ($this->statut === 'Traité') {
            // Chercher le log de vérification le plus récent
            $verificationLog = $this->relationLoaded('logs')
                ? $this->logs?->firstWhere('action', 'vérification')
                : BordereauLog::where('id_bordereau', $this->id_bordereau)
                    ->where('action', 'vérification')
                    ->latest('created_at')
                    ->first();

            if ($verificationLog && $verificationLog->details) {
                $details = $verificationLog->details;
                $valides = (int) ($details['valides'] ?? 0);
                $rejetes = (int) ($details['rejetes'] ?? 0);
                $sousControle = (int) ($details['sous_controle'] ?? 0);
                $enAttente = $total - $valides - $rejetes - $sousControle;

                return [
                    'en_attente'        => max(0, $enAttente),
                    'valide'            => $valides,
                    'rejete'            => $rejetes,
                    'sous_controle'     => $sousControle,
                    'total'             => $total,
                    'montant_rembourse' => (float) ($details['montant_valide'] ?? $this->montant_rembourse ?? 0),
                ];
            }
        }

        // Fallback : grouper par état actuel des bulletins
        $grouped = $this->bulletinSoins->groupBy('etat');

        $montantRembourse = $this->montant_rembourse ?? $this->bulletinSoins
            ->where('etat', 'Validé')
            ->sum('montant_depense');

        return [
            'en_attente'        => ($grouped->get('En attente', collect()))->count(),
            'valide'            => ($grouped->get('Validé', collect()))->count(),
            'rejete'            => ($grouped->get('Rejeté', collect()))->count(),
            'sous_controle'     => ($grouped->get('Sous contrôle', collect()))->count(),
            'total'             => $total,
            'montant_rembourse' => (float) $montantRembourse,
        ];
    }

    public function bulletinSoins(): HasMany
    {
        return $this->hasMany(BulletinSoin::class, 'id_bordereau', 'id_bordereau');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(BordereauLog::class, 'id_bordereau', 'id_bordereau')
                    ->orderBy('created_at', 'desc');
    }
}
