<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BulletinSoin extends Model
{
    protected $table = 'bulletin_soin';
    protected $primaryKey = 'id_bulletin';
    public $timestamps = false;

    protected $fillable = [
        'id_adherent', 'id_sous_adherent', 'id_bordereau', 'numero_bulletin',
        'date_soin', 'montant_depense', 'type_soin', 'description', 'etat', 'pdf_path',
    ];

    /**
     * Accessor: calcule le montant depuis les détails si chargés,
     * sinon retourne la valeur en base.
     */
    public function getMontantDepenseAttribute($value): float
    {
        if ($this->relationLoaded('details') && $this->details->isNotEmpty()) {
            return (float) $this->details->sum('montant');
        }
        return (float) ($value ?? 0);
    }

    public function adherent(): BelongsTo
    {
        return $this->belongsTo(Adherent::class, 'id_adherent', 'id_adherent');
    }

    public function sousAdherent(): BelongsTo
    {
        return $this->belongsTo(SousAdherent::class, 'id_sous_adherent', 'id_sous_adherent');
    }

    public function details(): HasMany
    {
        return $this->hasMany(BulletinSoinDetail::class, 'id_bulletin', 'id_bulletin');
    }

    public function bordereau(): BelongsTo
    {
        return $this->belongsTo(Bordereau::class, 'id_bordereau', 'id_bordereau');
    }
}
