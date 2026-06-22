<?php
require_once __DIR__ . '/../config.php';


$stmt = $pdo->query("SELECT COUNT(*) as total_adherents FROM adherent");
$adherentsCount = $stmt->fetch()['total_adherents'];

$stmt = $pdo->query("SELECT COUNT(*) as bulletins_traites FROM bulletin_soin WHERE etat = 'Traité'");
$bulletinsCount = $stmt->fetch()['bulletins_traites'];

$stmt = $pdo->query("SELECT COUNT(*) as total_bordereaux FROM bordereau");
$bordereauxCount = $stmt->fetch()['total_bordereaux'];

$stmt = $pdo->query("SELECT COALESCE(SUM(montant_depense), 0) as montant_total_rembourse FROM bulletin_soin");
$montantTotal = $stmt->fetch()['montant_total_rembourse'];

echo json_encode([
    "success" => true,
    "data" => [
        "total_adherents"         => (int)$adherentsCount,
        "bulletins_traites"       => (int)$bulletinsCount,
        "total_bordereaux"        => (int)$bordereauxCount,
        "montant_total_rembourse" => (float)$montantTotal
    ]
]);
?>
