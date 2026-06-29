<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'user';

    public $timestamps = false;

    protected $fillable = [
        'email',
        'mot_de_passe',
    ];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'mot_de_passe' => 'hashed',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->mot_de_passe;
    }
}
