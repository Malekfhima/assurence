<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BulletinSoin extends Model
{
    use HasFactory;

    protected $table = 'bulletin_soin';

    protected $primaryKey = 'id_bulletin';

    public $timestamps = false;

    protected $fillable = [
        'id_adherent',
        'numero_bordereau',
        'numero_bulletin',
        'date_soin',
        'montant_depense',
        'type_soin',
        'description',
        'etat',
    ];

    protected $casts = [
        'id_adherent' => 'integer',
        'numero_bordereau' => 'integer',
        'numero_bulletin' => 'integer',
        'date_soin' => 'date:Y-m-d',
        'montant_depense' => 'decimal:2',
    ];

    public function adherent(): BelongsTo
    {
        return $this->belongsTo(Adherent::class, 'id_adherent', 'id_adherent');
    }

    public function bordereau(): HasOne
    {
        return $this->hasOne(Bordereau::class, 'id_bulletin', 'id_bulletin');
    }
}
