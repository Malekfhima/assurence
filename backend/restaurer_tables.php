<?php
/**
 * Script de restauration des tables SQL manquantes
 * 
 * Ce script recrée les tables supprimées : cache, jobs, personal_access_tokens, soin
 * et la table de suivi des migrations.
 * 
 * Exécution : php restaurer_tables.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== Restauration des tables manquantes ===\n\n";

// Étape 1 : Créer la table migrations si elle n'existe pas
echo "[1/5] Création de la table 'migrations'...\n";
if (!Schema::hasTable('migrations')) {
    DB::statement('
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration VARCHAR(255) NOT NULL,
            batch INT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ');
    echo "  ✓ Table 'migrations' créée\n";
} else {
    echo "  - Table 'migrations' existe déjà\n";
}

// Étape 2 : Enregistrer toutes les migrations déjà appliquées
echo "\n[2/5] Enregistrement des migrations existantes...\n";

// Liste de toutes les migrations
$allMigrations = [
    '0001_01_01_000000_create_users_table',
    '0001_01_01_000001_create_cache_table',
    '0001_01_01_000002_create_jobs_table',
    '2026_06_23_094139_create_personal_access_tokens_table',
    '2026_06_23_100000_create_adherent_table',
    '2026_06_23_100001_create_sous_adherent_table',
    '2026_06_23_100002_create_bulletin_soin_table',
    '2026_06_23_100003_create_bordereau_table',
    '2026_06_29_000001_update_adherent_contact_fields',
    '2026_06_29_000002_add_sous_adherent_to_bulletin_soin',
    '2026_06_29_000003_create_bulletin_soin_detail_table',
    '2026_06_29_000004_add_pdf_to_bulletin_soin',
    '2026_06_29_092240_add_id_sous_adherent_to_bulletin_soin_table',
    '2026_06_29_100035_create_soin_table',
    '2026_06_29_102611_update_bulletin_soin_columns',
    '2026_06_29_120000_convert_bordereau_to_one_to_many',
    '2026_06_30_000001_add_id_bordereau_to_bulletin_soin',
    '2026_06_30_000001_drop_ordonnance_from_bulletin_soin_detail',
    '2026_06_30_000002_add_montant_total_to_bordereau_and_fix_bulletin_soin',
    '2026_06_30_000002_update_bulletin_soin_uniques',
    '2026_07_03_092048_change_numero_bulletin_and_bordereau_to_string',
    '2026_07_03_100000_change_bordereau_foreign_to_cascade',
    '2026_07_06_000001_add_reponse_to_bordereau',
    '2026_07_06_000002_create_bordereau_log_table',
    '2026_07_10_000001_add_montant_rembourse_to_bordereau',
];

// Déterminer le prochain numéro de batch
$maxBatch = DB::table('migrations')->max('batch') ?? 0;
$existingMigrations = DB::table('migrations')->pluck('migration')->toArray();

$inserted = 0;
foreach ($allMigrations as $migration) {
    if (!in_array($migration, $existingMigrations)) {
        DB::table('migrations')->insert([
            'migration' => $migration,
            'batch' => $maxBatch + 1,
        ]);
        $inserted++;
    }
}
echo "  ✓ {$inserted} migration(s) enregistrée(s)\n";

// Étape 3 : Exécuter les migrations manquantes
echo "\n[3/5] Création de la table 'cache'...\n";
if (!Schema::hasTable('cache')) {        DB::statement('
            CREATE TABLE IF NOT EXISTS cache (
                `key` VARCHAR(255) PRIMARY KEY,
                `value` MEDIUMTEXT NOT NULL,
                `expiration` BIGINT NOT NULL,
                INDEX idx_expiration (`expiration`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ');
        echo "  ✓ Table 'cache' créée\n";
        DB::statement('
            CREATE TABLE IF NOT EXISTS cache_locks (
                `key` VARCHAR(255) PRIMARY KEY,
                `owner` VARCHAR(255) NOT NULL,
                `expiration` BIGINT NOT NULL,
                INDEX idx_expiration_locks (`expiration`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ');
    echo "  ✓ Table 'cache_locks' créée\n";
} else {
    echo "  - Table 'cache' existe déjà\n";
}

echo "\n[4/5] Création de la table 'jobs'...\n";
if (!Schema::hasTable('jobs')) {        DB::statement('
            CREATE TABLE IF NOT EXISTS jobs (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                queue VARCHAR(255) NOT NULL,
                payload LONGTEXT NOT NULL,
                attempts SMALLINT UNSIGNED NOT NULL,
                reserved_at INT UNSIGNED NULL,
                available_at INT UNSIGNED NOT NULL,
                created_at INT UNSIGNED NOT NULL,
                INDEX idx_queue (`queue`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ');
    echo "  ✓ Table 'jobs' créée\n";
    DB::statement('
        CREATE TABLE IF NOT EXISTS job_batches (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            total_jobs INT NOT NULL,
            pending_jobs INT NOT NULL,
            failed_jobs INT NOT NULL,
            failed_job_ids LONGTEXT NOT NULL,
            options MEDIUMTEXT NULL,
            cancelled_at INT NULL,
            created_at INT NOT NULL,
            finished_at INT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ');
    echo "  ✓ Table 'job_batches' créée\n";
    DB::statement('
        CREATE TABLE IF NOT EXISTS failed_jobs (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(255) NOT NULL UNIQUE,
            connection VARCHAR(100) NOT NULL,
            queue VARCHAR(100) NOT NULL,
            payload LONGTEXT NOT NULL,
            exception LONGTEXT NOT NULL,
            failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_connection_queue_failed (connection, queue, failed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ');
    echo "  ✓ Table 'failed_jobs' créée\n";
} else {
    echo "  - Table 'jobs' existe déjà\n";
}

echo "\n[5/5] Création des tables 'personal_access_tokens' et 'soin'...\n";
if (!Schema::hasTable('personal_access_tokens')) {        DB::statement('
            CREATE TABLE IF NOT EXISTS personal_access_tokens (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                tokenable_type VARCHAR(255) NOT NULL,
                tokenable_id BIGINT UNSIGNED NOT NULL,
                name TEXT NOT NULL,
                token VARCHAR(64) NOT NULL UNIQUE,
                abilities TEXT NULL,
                last_used_at TIMESTAMP NULL,
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                INDEX idx_tokenable (tokenable_type, tokenable_id),
                INDEX idx_expires_at (`expires_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ');
    echo "  ✓ Table 'personal_access_tokens' créée\n";
} else {
    echo "  - Table 'personal_access_tokens' existe déjà\n";
}

if (!Schema::hasTable('soin')) {
    DB::statement('
        CREATE TABLE IF NOT EXISTS soin (
            id_soin INT AUTO_INCREMENT PRIMARY KEY,
            id_bulletin INT NOT NULL,
            date_soin DATE NOT NULL,
            type_soin VARCHAR(100) NOT NULL,
            montant DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (id_bulletin) REFERENCES bulletin_soin(id_bulletin) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ');
    echo "  ✓ Table 'soin' créée\n";
} else {
    echo "  - Table 'soin' existe déjà\n";
}

// Vérification finale
echo "\n=== Vérification finale ===\n";
$tables = DB::select('SHOW TABLES');
echo "Tables dans la base de données :\n";
$expectedTables = ['adherent', 'bordereau', 'bordereau_log', 'bulletin_soin', 'bulletin_soin_detail', 
                   'cache', 'cache_locks', 'failed_jobs', 'job_batches', 'jobs', 
                   'migrations', 'personal_access_tokens', 'soin', 'sous_adherent', 'user'];

foreach ($tables as $table) {
    $tableName = reset($table);
    echo ($tableName ? "  ✓ {$tableName}\n" : "");
}

foreach ($expectedTables as $expected) {
    $found = false;
    foreach ($tables as $table) {
        if (reset($table) === $expected) {
            $found = true;
            break;
        }
    }
    if (!$found) {
        echo "  ✗ {$expected} MANQUANTE !\n";
    }
}

echo "\n=== Restauration terminée ! ===\n";
