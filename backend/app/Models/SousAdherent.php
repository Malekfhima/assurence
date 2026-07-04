<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SousAdherent extends Model
{
    protected $table = 'sous_adherent';
    protected $primaryKey = 'id_sous_adherent';
    public $timestamps = false;

    protected $fillable = [
        'id_adherent', 'nom', 'prenom', 'date_naissance', 'sexe', 'lien_parente',
    ];

    protected $appends = ['display_lien_parente'];

    public function adherent(): BelongsTo
    {
        return $this->belongsTo(Adherent::class, 'id_adherent', 'id_adherent');
    }

    public function bulletinsSoin(): HasMany
    {
        return $this->hasMany(BulletinSoin::class, 'id_sous_adherent', 'id_sous_adherent');
    }

    public function getDisplayLienParenteAttribute(): ?string
    {
        if ($this->lien_parente === 'Enfant') {
            if ($this->sexe === 'Homme') {
                return 'Fils';
            }
            if ($this->sexe === 'Femme') {
                return 'Fille';
            }
        }

        return $this->lien_parente;
    }
}
