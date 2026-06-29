<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('user')->updateOrInsert(
            ['email' => 'admin@stipe.tn'],
            [
                'email' => 'admin@stipe.tn',
                'mot_de_passe' => Hash::make('admin123'),
            ]
        );

        $this->command->info('Admin user created: admin@stipe.tn / admin123');
    }
}
