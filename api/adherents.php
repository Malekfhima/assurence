<?php
require_once __DIR__ . '/config.php';

$stmt = $pdo->query("SELECT * FROM adherent ORDER BY matricule ASC");
$adherents = $stmt->fetchAll();

echo json_encode([
    "success" => true,
    "data"    => $adherents
]);
?>
