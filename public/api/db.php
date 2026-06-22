<?php
/**
 * Connexion à la base de données + helpers communs pour l'API.
 */

// ---- CORS (autorise le frontend React en dev sur localhost:3000) ----
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Répondre immédiatement aux requêtes préliminaires (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// ---- Connexion PDO ----
$DB_HOST = '127.0.0.1';
$DB_NAME = 'assurance_group';
$DB_USER = 'root'; // Utilisateur par défaut sous XAMPP
$DB_PASS = '';     // Mot de passe par défaut sous XAMPP

function getPdo()
{
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
                $DB_USER,
                $DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            jsonResponse([
                "success" => false,
                "message" => "Erreur de connexion à la base de données."
            ], 500);
        }
    }
    return $pdo;
}

// ---- Helpers de réponse ----
function jsonResponse($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function getJsonInput()
{
    $raw = file_get_contents("php://input");
    return json_decode($raw, true) ?: [];
}

// ---- Authentification par token simple ----
// Le token est un base64 de "id_user:email". Suffisant pour un test local.
function makeToken($user)
{
    return base64_encode($user['id'] . ':' . $user['email']);
}

function getBearerToken()
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
        return trim($m[1]);
    }
    return null;
}

function requireAuth()
{
    $token = getBearerToken();
    if (!$token) {
        jsonResponse(["success" => false, "message" => "Non authentifié."], 401);
    }
    $decoded = base64_decode($token, true);
    if ($decoded === false || strpos($decoded, ':') === false) {
        jsonResponse(["success" => false, "message" => "Token invalide."], 401);
    }
    [$id, $email] = explode(':', $decoded, 2);
    $stmt = getPdo()->prepare("SELECT id, email FROM user WHERE id = ? AND email = ?");
    $stmt->execute([$id, $email]);
    $user = $stmt->fetch();
    if (!$user) {
        jsonResponse(["success" => false, "message" => "Session expirée."], 401);
    }
    return $user;
}
