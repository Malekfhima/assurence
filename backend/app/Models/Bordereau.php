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
        'fichier_reponse', 'date_reponse',
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

        $grouped = $this->bulletinSoins->groupBy('etat');

        // Utiliser le montant_rembourse stocké en base (Total Bordereau du PDF réponse)
        // si disponible, sinon fallback sur la somme des bulletins validés
        $montantRembourse = $this->montant_rembourse ?? $this->bulletinSoins
            ->where('etat', 'Validé')
            ->sum('montant_depense');

        return [
            'en_attente'        => ($grouped->get('En attente', collect()))->count(),
            'valide'            => ($grouped->get('Validé', collect()))->count(),
            'rejete'            => ($grouped->get('Rejeté', collect()))->count(),
            'sous_controle'     => ($grouped->get('Sous contrôle', collect()))->count(),
            'total'             => $this->bulletinSoins->count(),
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
