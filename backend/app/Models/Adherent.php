<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Adherent extends Model
{
    protected $table = 'adherent';
    protected $primaryKey = 'id_adherent';
    public $timestamps = false;

    protected $fillable = [
        'matricule', 'nom', 'prenom', 'etat_civil', 'sexe',
        'date_naissance', 'date_adhesion', 'adresse', 'cin',
        'telephone', 'identifiant', 'mot_de_passe', 'statut',
    ];


    public function sousAdherents(): HasMany
    {
        return $this->hasMany(SousAdherent::class, 'id_adherent', 'id_adherent');
    }

    public function bulletinsSoin(): HasMany
    {
        return $this->hasMany(BulletinSoin::class, 'id_adherent', 'id_adherent');
    }
}
