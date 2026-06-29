<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bordereau extends Model
{
    protected $table = 'bordereau';
    protected $primaryKey = 'id_bordereau';
    public $timestamps = false;

    protected $fillable = [
        'id_bulletin', 'numero_bordereau', 'date_envoi', 'statut', 'commentaire',
    ];

    public function bulletinSoin(): BelongsTo
    {
        return $this->belongsTo(BulletinSoin::class, 'id_bulletin', 'id_bulletin');
    }
}
