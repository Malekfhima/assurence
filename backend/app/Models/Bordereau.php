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

    public function bulletinSoins(): HasMany
    {
        return $this->hasMany(BulletinSoin::class, 'id_bordereau', 'id_bordereau');
    }
}
