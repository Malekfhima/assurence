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
        'numero_bordereau', 'montant_total', 'date_envoi', 'statut', 'commentaire',
    ];

    protected $casts = [
        'montant_total' => 'decimal:2',
    ];

    protected $appends = ['stats_bulletins'];

    public function getStatsBulletinsAttribute(): array
    {
        if (!$this->relationLoaded('bulletinSoins')) {
            return ['en_attente' => 0, 'valide' => 0, 'rejete' => 0, 'total' => 0];
        }

        $grouped = $this->bulletinSoins->groupBy('etat');
        return [
            'en_attente' => ($grouped->get('En attente', collect()))->count(),
            'valide'     => ($grouped->get('Validé', collect()))->count(),
            'rejete'     => ($grouped->get('Rejeté', collect()))->count(),
            'total'      => $this->bulletinSoins->count(),
        ];
    }

    public function bulletinSoins(): HasMany
    {
        return $this->hasMany(BulletinSoin::class, 'id_bordereau', 'id_bordereau');
    }
}
