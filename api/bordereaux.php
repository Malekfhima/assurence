<?php
require_once __DIR__ . '/config.php';

$stmt = $pdo->query("
    SELECT 
        b.*,
        COUNT(bs.id_bulletin) as nbr_bulletins
    FROM bordereau b
    LEFT JOIN bulletin_soin bs ON b.id_bulletin = bs.id_bulletin
    GROUP BY b.id_bordereau
    ORDER BY b.id_bordereau DESC
");
$bordereaux = $stmt->fetchAll();

echo json_encode([
    "success" => true,
    "data"    => $bordereaux
]);
?>
