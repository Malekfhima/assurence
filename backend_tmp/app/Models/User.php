<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'user';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'email',
        'mot_de_passe',
    ];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    /**
     * La colonne du mot de passe s'appelle `mot_de_passe` et non `password`.
     * On indique à l'authentification Laravel quelle colonne utiliser.
     */
    public function getAuthPassword(): string
    {
        return $this->mot_de_passe;
    }

    protected function casts(): array
    {
        return [
            'mot_de_passe' => 'hashed',
        ];
    }
}
