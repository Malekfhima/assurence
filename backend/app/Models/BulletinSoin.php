<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BulletinSoin extends Model
{
    protected $table = 'bulletin_soin';
    protected $primaryKey = 'id_bulletin';
    public $timestamps = false;

    protected $fillable = [
        'id_adherent', 'id_sous_adherent', 'numero_bordereau', 'numero_bulletin',
        'date_soin', 'montant_depense', 'type_soin', 'description', 'etat', 'pdf_path',
    ];

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

    public function bordereau(): HasOne
    {
        return $this->hasOne(Bordereau::class, 'id_bulletin', 'id_bulletin');
    }
}
