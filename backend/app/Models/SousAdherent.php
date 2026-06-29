<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SousAdherent extends Model
{
    protected $table = 'sous_adherent';
    protected $primaryKey = 'id_sous_adherent';
    public $timestamps = false;

    protected $fillable = [
        'id_adherent', 'nom', 'prenom', 'date_naissance', 'sexe', 'lien_parente',
    ];

    public function adherent(): BelongsTo
    {
        return $this->belongsTo(Adherent::class, 'id_adherent', 'id_adherent');
    }
}
