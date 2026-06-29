<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BulletinSoinDetail extends Model
{
    protected $table = 'bulletin_soin_detail';
    protected $primaryKey = 'id_detail';
    public $timestamps = false;

    protected $fillable = [
        'id_bulletin', 'date', 'montant',
        'ordonnance', 'type_soin',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'montant' => 'decimal:2',
            'ordonnance' => 'boolean',
        ];
    }

    public function bulletin(): BelongsTo
    {
        return $this->belongsTo(BulletinSoin::class, 'id_bulletin', 'id_bulletin');
    }
}
