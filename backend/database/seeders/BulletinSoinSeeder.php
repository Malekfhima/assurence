<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BulletinSoinSeeder extends Seeder
{
    public function run(): void
    {
        // S'assurer qu'il existe au moins un adhérent avec un ID stable pour les tests
        $adherent1 = DB::table('adherent')->where('matricule', 1001)->first();
        if (!$adherent1) {
            $adherent1Id = DB::table('adherent')->insertGetId([
                'matricule' => 1001,
                'nom' => 'Ben Ali',
                'prenom' => 'Mohamed',
                'etat_civil' => 'M',
                'sexe' => 'H',
                'date_naissance' => '1985-03-15',
                'date_adhesion' => '2024-01-10',
                'adresse' => '15 Rue de la Liberté, Tunis',
                'cin' => 12345678,
                'telephone' => '98765432',
                'statut' => 'Actif',
            ]);
        } else {
            $adherent1Id = $adherent1->id_adherent;
        }

        $adherent2 = DB::table('adherent')->where('matricule', 1002)->first();
        if (!$adherent2) {
            $adherent2Id = DB::table('adherent')->insertGetId([
                'matricule' => 1002,
                'nom' => 'Trabelsi',
                'prenom' => 'Fatma',
                'etat_civil' => 'M',
                'sexe' => 'F',
                'date_naissance' => '1990-07-22',
                'date_adhesion' => '2024-02-15',
                'adresse' => '5 Avenue Habib Bourguiba, Sfax',
                'cin' => 23456789,
                'telephone' => '98765433',
                'statut' => 'Actif',
            ]);
        } else {
            $adherent2Id = $adherent2->id_adherent;
        }

        // Insérer les bulletins (un seul par adhérent à cause de la contrainte unique)
        DB::table('bulletin_soin')->insert([
            'id_adherent' => $adherent1Id,
            'id_sous_adherent' => null,
            'numero_bulletin' => 1001,
            'description' => 'Consultation médicale générale',
            'etat' => 'En attente',
        ]);

        DB::table('bulletin_soin')->insert([
            'id_adherent' => $adherent2Id,
            'id_sous_adherent' => null,
            'numero_bulletin' => 1002,
            'description' => 'Hospitalisation - Chirurgie',
            'etat' => 'Validé',
        ]);

        $this->command->info('Bulletins de soin insérés avec succès.');
    }
}
