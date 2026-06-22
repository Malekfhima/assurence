<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Administrateur par défaut.
        // Identifiants : admin@stipe.tn / admin123
        User::updateOrCreate(
            ['email' => 'admin@stipe.tn'],
            ['mot_de_passe' => Hash::make('admin123')]
        );
    }
}
