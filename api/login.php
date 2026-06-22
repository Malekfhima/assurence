<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->email) && isset($data->mot_de_passe)) {
    $email = $data->email;
    $mot_de_passe = $data->mot_de_passe;

    // Récupérer l'utilisateur par email uniquement
    $stmt = $pdo->prepare("SELECT * FROM user WHERE email = ?");
    $stmt->execute([$email]);
    $userRecord = $stmt->fetch();

    // Vérifier le mot de passe (supporte bcrypt ET texte brut)
    $passwordOk = false;
    if ($userRecord) {
        if (password_verify($mot_de_passe, $userRecord['mot_de_passe'])) {
            // Mot de passe hashé avec bcrypt
            $passwordOk = true;
        } elseif ($userRecord['mot_de_passe'] === $mot_de_passe) {
            // Mot de passe en texte brut (fallback)
            $passwordOk = true;
        }
    }

    if ($passwordOk) {
        $token = base64_encode($userRecord['id'] . ':' . time() . ':assurance_secret');
        echo json_encode([
            "success" => true,
            "message" => "Connexion réussie.",
            "token"   => $token,
            "user"    => ["id" => $userRecord['id'], "email" => $userRecord['email']]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Email ou mot de passe incorrect."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Données manquantes."]);
}

?>
