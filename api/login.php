<?php
require __DIR__ . '/db.php';

$data = getJsonInput();
$email = $data['email'] ?? null;
$motDePasse = $data['mot_de_passe'] ?? null;

if (!$email || !$motDePasse) {
    jsonResponse(["success" => false, "message" => "Données manquantes."], 422);
}

$stmt = getPdo()->prepare("SELECT * FROM user WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    jsonResponse(["success" => false, "message" => "Email ou mot de passe incorrect."], 401);
}

$stored = (string)$user['mot_de_passe'];
$isValid = password_verify($motDePasse, $stored) || hash_equals($stored, (string)$motDePasse);

if (!$isValid) {
    jsonResponse(["success" => false, "message" => "Email ou mot de passe incorrect."], 401);
}

unset($user['mot_de_passe']);
jsonResponse([
    "success" => true,
    "message" => "Connexion réussie.",
    "token"   => makeToken($user),
    "user"    => $user,
]);
