<?php
require_once __DIR__ . '/config.php';

$stmt = $pdo->query("
    SELECT 
        bs.*,
        a.nom,
        a.prenom,
        a.matricule
    FROM bulletin_soin bs
    LEFT JOIN adherent a ON bs.id_adherent = a.id_adherent
    ORDER BY bs.id_bulletin DESC
");
$bulletins = $stmt->fetchAll();

// Formater les données avec l'objet adherent imbriqué
$formatted = array_map(function($b) {
    return [
        'id_bulletin'      => $b['id_bulletin'],
        'numero_bulletin'  => $b['numero_bulletin'],
        'date_soin'        => $b['date_soin'],
        'montant_depense'  => $b['montant_depense'],
        'type_soin'        => $b['type_soin'],
        'description'      => $b['description'],
        'etat'             => $b['etat'],
        'numero_bordereau' => $b['numero_bordereau'],
        'adherent'         => [
            'nom'       => $b['nom'],
            'prenom'    => $b['prenom'],
            'matricule' => $b['matricule']
        ]
    ];
}, $bulletins);

echo json_encode([
    "success" => true,
    "data"    => $formatted
]);
?>
