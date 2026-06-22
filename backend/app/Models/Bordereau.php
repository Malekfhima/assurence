<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bordereau extends Model
{
    use HasFactory;

    protected $table = 'bordereau';

    protected $primaryKey = 'id_bordereau';

    public $timestamps = false;

    protected $fillable = [
        'id_bulletin',
        'numero_bordereau',
        'date_envoi',
        'statut',
        'commentaire',
    ];

    protected $casts = [
        'id_bulletin' => 'integer',
        'numero_bordereau' => 'integer',
        'date_envoi' => 'date:Y-m-d',
    ];

    public function bulletin(): BelongsTo
    {
        return $this->belongsTo(BulletinSoin::class, 'id_bulletin', 'id_bulletin');
    }
}
