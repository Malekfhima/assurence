<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Soin extends Model
{
    protected $table = 'soin';
    protected $primaryKey = 'id_soin';
    public $timestamps = false;

    protected $fillable = [
        'id_bulletin', 'date_soin', 'type_soin', 'montant',
    ];

    public function bulletinSoin(): BelongsTo
    {
        return $this->belongsTo(BulletinSoin::class, 'id_bulletin', 'id_bulletin');
    }
}
