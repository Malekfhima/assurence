<?php
/**
 * Routeur principal de l'API STIPE Assurance.
 */

require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

$route = '';
if (isset($_GET['route'])) {
    $route = $_GET['route'];
} elseif (isset($_SERVER['PATH_INFO'])) {
    $route = $_SERVER['PATH_INFO'];
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/api/?(.*)$#', $uri, $m)) {
        $route = $m[1];
    }
}
$route = trim($route, '/');
$segments = $route === '' ? [] : explode('/', $route);
$resource = $segments[0] ?? '';

switch ($resource) {
    case 'login':
        handleLogin();
        break;

    case 'logout':
        requireAuth();
        jsonResponse(["success" => true, "message" => "Déconnexion réussie."]);
        break;

    case 'me':
        $user = requireAuth();
        jsonResponse(["success" => true, "data" => $user]);
        break;

    case 'adherents':
        requireAuth();
        if ($method === 'POST') {
            createAdherent();
        } elseif ($method === 'PUT' && isset($segments[1])) {
            updateAdherent((int)$segments[1]);
        } elseif ($method === 'DELETE' && isset($segments[1])) {
            deleteAdherent((int)$segments[1]);
        } elseif (isset($segments[1])) {
            getAdherent((int)$segments[1]);
        } else {
            listAdherents();
        }
        break;

    case 'sous-adherents':
        requireAuth();
        if ($method === 'POST') {
            createSousAdherent();
        } elseif ($method === 'PUT' && isset($segments[1])) {
            updateSousAdherent((int)$segments[1]);
        } elseif ($method === 'DELETE' && isset($segments[1])) {
            deleteSousAdherent((int)$segments[1]);
        } elseif (isset($segments[1])) {
            getSousAdherent((int)$segments[1]);
        } else {
            listSousAdherents();
        }
        break;

    case 'bulletins':
        requireAuth();
        if ($method === 'POST') {
            createBulletin();
        } elseif ($method === 'PUT' && isset($segments[1])) {
            updateBulletin((int)$segments[1]);
        } elseif ($method === 'DELETE' && isset($segments[1])) {
            deleteBulletin((int)$segments[1]);
        } else {
            listBulletins();
        }
        break;

    case 'bordereaux':
        requireAuth();
        if ($method === 'POST') {
            createBordereau();
        } elseif ($method === 'PUT' && isset($segments[1])) {
            updateBordereau((int)$segments[1]);
        } elseif ($method === 'DELETE' && isset($segments[1])) {
            deleteBordereau((int)$segments[1]);
        } else {
            listBordereaux();
        }
        break;

    case 'dashboard':
        requireAuth();
        if (($segments[1] ?? '') === 'stats') {
            dashboardStats();
        } else {
            jsonResponse(["success" => false, "message" => "Endpoint inconnu."], 404);
        }
        break;

    default:
        jsonResponse([
            "success" => false,
            "message" => "Endpoint introuvable : /$route"
        ], 404);
}

// =====================================================================
//  Auth
// =====================================================================

function handleLogin()
{
    $data = getJsonInput();
    $email = $data['email'] ?? null;
    $motDePasse = $data['mot_de_passe'] ?? null;

    if (!$email || !$motDePasse) {
        jsonResponse(["success" => false, "message" => "Données manquantes."], 422);
    }

    $pdo = getPdo();

    // Admin par défaut (dev) : si absent, on le crée automatiquement.
    if ($email === 'admin@stipe.tn') {
        $check = $pdo->prepare("SELECT id FROM user WHERE email = ?");
        $check->execute([$email]);
        if (!$check->fetch()) {
            $hash = password_hash('admin123', PASSWORD_BCRYPT);
            $insert = $pdo->prepare("INSERT INTO user (email, mot_de_passe) VALUES (?, ?)");
            $insert->execute([$email, $hash]);
        }
    }

    $stmt = $pdo->prepare("SELECT * FROM user WHERE email = ?");
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
}

// =====================================================================
//  Adhérents
// =====================================================================

function listAdherents()
{
    $search = $_GET['search'] ?? null;
    $sql = "SELECT * FROM adherent";
    $params = [];
    if ($search) {
        $sql .= " WHERE nom LIKE ? OR prenom LIKE ? OR matricule LIKE ? OR cin LIKE ?";
        $like = "%$search%";
        $params = [$like, $like, $like, $like];
    }
    $sql .= " ORDER BY nom ASC";
    $stmt = getPdo()->prepare($sql);
    $stmt->execute($params);
    jsonResponse(["success" => true, "data" => $stmt->fetchAll()]);
}

function getAdherent($id)
{
    $stmt = getPdo()->prepare("SELECT * FROM adherent WHERE id_adherent = ?");
    $stmt->execute([$id]);
    $adherent = $stmt->fetch();
    if (!$adherent) {
        jsonResponse(["success" => false, "message" => "Adhérent introuvable."], 404);
    }
    $sub = getPdo()->prepare("SELECT * FROM sous_adherent WHERE id_adherent = ? ORDER BY nom ASC");
    $sub->execute([$id]);
    $adherent['sous_adherents'] = $sub->fetchAll();
    jsonResponse(["success" => true, "data" => $adherent]);
}

function createAdherent()
{
    $data = getJsonInput();
    $matricule = $data['matricule'] ?? null;
    $nom = $data['nom'] ?? null;
    $prenom = $data['prenom'] ?? null;

    if (!$matricule || !$nom || !$prenom) {
        jsonResponse(["success" => false, "message" => "Matricule, nom et prénom sont obligatoires."], 422);
    }

    $pdo = getPdo();
    $stmt = $pdo->prepare("INSERT INTO adherent (matricule, nom, prenom, etat_civil, sexe, date_naissance, date_adhesion, adresse, cin, telephone, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $matricule, $nom, $prenom,
        $data['etat_civil'] ?? null,
        $data['sexe'] ?? null,
        !empty($data['date_naissance']) ? $data['date_naissance'] : null,
        !empty($data['date_adhesion']) ? $data['date_adhesion'] : null,
        $data['adresse'] ?? null,
        $data['cin'] ?? null,
        $data['telephone'] ?? null,
        $data['statut'] ?? 'Actif',
    ]);
    $id_adherent = $pdo->lastInsertId();
    saveSousAdherents($pdo, $id_adherent, $data['sous_adherents'] ?? []);

    jsonResponse(["success" => true, "message" => "Adhérent créé avec succès.", "id_adherent" => $id_adherent]);
}

function updateAdherent($id)
{
    $data = getJsonInput();
    $matricule = $data['matricule'] ?? null;
    $nom = $data['nom'] ?? null;
    $prenom = $data['prenom'] ?? null;

    if (!$matricule || !$nom || !$prenom) {
        jsonResponse(["success" => false, "message" => "Matricule, nom et prénom sont obligatoires."], 422);
    }

    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_adherent FROM adherent WHERE id_adherent = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Adhérent introuvable."], 404);
    }

    $stmt = $pdo->prepare("UPDATE adherent SET matricule = ?, nom = ?, prenom = ?, etat_civil = ?, sexe = ?, date_naissance = ?, date_adhesion = ?, adresse = ?, cin = ?, telephone = ?, statut = ? WHERE id_adherent = ?");
    $stmt->execute([
        $matricule, $nom, $prenom,
        $data['etat_civil'] ?? null,
        $data['sexe'] ?? null,
        !empty($data['date_naissance']) ? $data['date_naissance'] : null,
        !empty($data['date_adhesion']) ? $data['date_adhesion'] : null,
        $data['adresse'] ?? null,
        $data['cin'] ?? null,
        $data['telephone'] ?? null,
        $data['statut'] ?? 'Actif',
        $id,
    ]);

    if (isset($data['sous_adherents']) && is_array($data['sous_adherents'])) {
        $pdo->prepare("DELETE FROM sous_adherent WHERE id_adherent = ?")->execute([$id]);
        saveSousAdherents($pdo, $id, $data['sous_adherents']);
    }

    jsonResponse(["success" => true, "message" => "Adhérent modifié avec succès."]);
}

function deleteAdherent($id)
{
    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_adherent FROM adherent WHERE id_adherent = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Adhérent introuvable."], 404);
    }
    $pdo->prepare("DELETE FROM adherent WHERE id_adherent = ?")->execute([$id]);
    jsonResponse(["success" => true, "message" => "Adhérent supprimé avec succès."]);
}

function saveSousAdherents($pdo, $id_adherent, $sousAdherents)
{
    if (!is_array($sousAdherents)) {
        return;
    }
    $stmt = $pdo->prepare("INSERT INTO sous_adherent (id_adherent, nom, prenom, date_naissance, sexe, lien_parente) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($sousAdherents as $sub) {
        $sub_nom = trim($sub['nom'] ?? '');
        $sub_prenom = trim($sub['prenom'] ?? '');
        if ($sub_nom && $sub_prenom) {
            $stmt->execute([
                $id_adherent,
                $sub_nom,
                $sub_prenom,
                !empty($sub['date_naissance']) ? $sub['date_naissance'] : null,
                $sub['sexe'] ?? null,
                $sub['lien_parente'] ?? null,
            ]);
        }
    }
}

// =====================================================================
//  Sous-adhérents
// =====================================================================

function listSousAdherents()
{
    $idAdherent = $_GET['id_adherent'] ?? null;
    $sql = "SELECT sa.*, a.nom AS adherent_nom, a.prenom AS adherent_prenom, a.matricule
            FROM sous_adherent sa
            LEFT JOIN adherent a ON a.id_adherent = sa.id_adherent";
    $params = [];
    if ($idAdherent) {
        $sql .= " WHERE sa.id_adherent = ?";
        $params[] = $idAdherent;
    }
    $sql .= " ORDER BY sa.nom ASC";
    $stmt = getPdo()->prepare($sql);
    $stmt->execute($params);
    jsonResponse(["success" => true, "data" => $stmt->fetchAll()]);
}

function getSousAdherent($id)
{
    $stmt = getPdo()->prepare("SELECT * FROM sous_adherent WHERE id_sous_adherent = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        jsonResponse(["success" => false, "message" => "Sous-adhérent introuvable."], 404);
    }
    jsonResponse(["success" => true, "data" => $row]);
}

function createSousAdherent()
{
    $data = getJsonInput();
    $id_adherent = $data['id_adherent'] ?? null;
    $nom = trim($data['nom'] ?? '');
    $prenom = trim($data['prenom'] ?? '');

    if (!$id_adherent || !$nom || !$prenom) {
        jsonResponse(["success" => false, "message" => "Adhérent, nom et prénom sont obligatoires."], 422);
    }

    $pdo = getPdo();
    $check = $pdo->prepare("SELECT id_adherent FROM adherent WHERE id_adherent = ?");
    $check->execute([$id_adherent]);
    if (!$check->fetch()) {
        jsonResponse(["success" => false, "message" => "Adhérent introuvable."], 404);
    }

    $stmt = $pdo->prepare("INSERT INTO sous_adherent (id_adherent, nom, prenom, date_naissance, sexe, lien_parente) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id_adherent, $nom, $prenom,
        !empty($data['date_naissance']) ? $data['date_naissance'] : null,
        $data['sexe'] ?? null,
        $data['lien_parente'] ?? null,
    ]);

    jsonResponse(["success" => true, "message" => "Sous-adhérent créé avec succès.", "id_sous_adherent" => $pdo->lastInsertId()]);
}

function updateSousAdherent($id)
{
    $data = getJsonInput();
    $id_adherent = $data['id_adherent'] ?? null;
    $nom = trim($data['nom'] ?? '');
    $prenom = trim($data['prenom'] ?? '');

    if (!$id_adherent || !$nom || !$prenom) {
        jsonResponse(["success" => false, "message" => "Adhérent, nom et prénom sont obligatoires."], 422);
    }

    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_sous_adherent FROM sous_adherent WHERE id_sous_adherent = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Sous-adhérent introuvable."], 404);
    }

    $stmt = $pdo->prepare("UPDATE sous_adherent SET id_adherent = ?, nom = ?, prenom = ?, date_naissance = ?, sexe = ?, lien_parente = ? WHERE id_sous_adherent = ?");
    $stmt->execute([
        $id_adherent, $nom, $prenom,
        !empty($data['date_naissance']) ? $data['date_naissance'] : null,
        $data['sexe'] ?? null,
        $data['lien_parente'] ?? null,
        $id,
    ]);

    jsonResponse(["success" => true, "message" => "Sous-adhérent modifié avec succès."]);
}

function deleteSousAdherent($id)
{
    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_sous_adherent FROM sous_adherent WHERE id_sous_adherent = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Sous-adhérent introuvable."], 404);
    }
    $pdo->prepare("DELETE FROM sous_adherent WHERE id_sous_adherent = ?")->execute([$id]);
    jsonResponse(["success" => true, "message" => "Sous-adhérent supprimé avec succès."]);
}

// =====================================================================
//  Bulletins de soin
// =====================================================================

function listBulletins()
{
    $sql = "SELECT b.*, a.nom, a.prenom, a.matricule
            FROM bulletin_soin b
            LEFT JOIN adherent a ON a.id_adherent = b.id_adherent
            ORDER BY b.date_soin DESC, b.id_bulletin DESC";
    $rows = getPdo()->query($sql)->fetchAll();

    $data = array_map(function ($row) {
        $row['adherent'] = [
            'id_adherent' => $row['id_adherent'],
            'nom'         => $row['nom'],
            'prenom'      => $row['prenom'],
            'matricule'   => $row['matricule'],
        ];
        unset($row['nom'], $row['prenom'], $row['matricule']);
        return $row;
    }, $rows);

    jsonResponse(["success" => true, "data" => $data]);
}

function createBulletin()
{
    $data = getJsonInput();
    $id_adherent = $data['id_adherent'] ?? null;
    $numero_bulletin = $data['numero_bulletin'] ?? null;

    if (!$id_adherent || !$numero_bulletin) {
        jsonResponse(["success" => false, "message" => "Adhérent et numéro de bulletin sont obligatoires."], 422);
    }

    $pdo = getPdo();
    $check = $pdo->prepare("SELECT id_bulletin FROM bulletin_soin WHERE id_adherent = ?");
    $check->execute([$id_adherent]);
    if ($check->fetch()) {
        jsonResponse(["success" => false, "message" => "Cet adhérent possède déjà un bulletin de soin."], 422);
    }

    $stmt = $pdo->prepare("INSERT INTO bulletin_soin (id_adherent, numero_bordereau, numero_bulletin, date_soin, montant_depense, type_soin, description, etat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id_adherent,
        $data['numero_bordereau'] ?? 0,
        $numero_bulletin,
        !empty($data['date_soin']) ? $data['date_soin'] : null,
        $data['montant_depense'] ?? null,
        $data['type_soin'] ?? null,
        $data['description'] ?? null,
        $data['etat'] ?? 'En attente',
    ]);

    jsonResponse(["success" => true, "message" => "Bulletin de soin créé avec succès.", "id_bulletin" => $pdo->lastInsertId()]);
}

function updateBulletin($id)
{
    $data = getJsonInput();
    $id_adherent = $data['id_adherent'] ?? null;
    $numero_bulletin = $data['numero_bulletin'] ?? null;

    if (!$id_adherent || !$numero_bulletin) {
        jsonResponse(["success" => false, "message" => "Adhérent et numéro de bulletin sont obligatoires."], 422);
    }

    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_bulletin FROM bulletin_soin WHERE id_bulletin = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Bulletin de soin introuvable."], 404);
    }

    $check = $pdo->prepare("SELECT id_bulletin FROM bulletin_soin WHERE id_adherent = ? AND id_bulletin != ?");
    $check->execute([$id_adherent, $id]);
    if ($check->fetch()) {
        jsonResponse(["success" => false, "message" => "Cet adhérent possède déjà un autre bulletin de soin."], 422);
    }

    $stmt = $pdo->prepare("UPDATE bulletin_soin SET id_adherent = ?, numero_bordereau = ?, numero_bulletin = ?, date_soin = ?, montant_depense = ?, type_soin = ?, description = ?, etat = ? WHERE id_bulletin = ?");
    $stmt->execute([
        $id_adherent,
        $data['numero_bordereau'] ?? 0,
        $numero_bulletin,
        !empty($data['date_soin']) ? $data['date_soin'] : null,
        $data['montant_depense'] ?? null,
        $data['type_soin'] ?? null,
        $data['description'] ?? null,
        $data['etat'] ?? 'En attente',
        $id,
    ]);

    jsonResponse(["success" => true, "message" => "Bulletin de soin modifié avec succès."]);
}

function deleteBulletin($id)
{
    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_bulletin FROM bulletin_soin WHERE id_bulletin = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Bulletin de soin introuvable."], 404);
    }
    $pdo->prepare("DELETE FROM bulletin_soin WHERE id_bulletin = ?")->execute([$id]);
    jsonResponse(["success" => true, "message" => "Bulletin de soin supprimé avec succès."]);
}

// =====================================================================
//  Bordereaux d'envoi
// =====================================================================

function listBordereaux()
{
    $sql = "SELECT b.*, bs.numero_bulletin, bs.date_soin, a.nom, a.prenom, a.matricule
            FROM bordereau b
            LEFT JOIN bulletin_soin bs ON bs.id_bulletin = b.id_bulletin
            LEFT JOIN adherent a ON a.id_adherent = bs.id_adherent
            ORDER BY b.id_bordereau DESC";
    $rows = getPdo()->query($sql)->fetchAll();

    $data = array_map(function ($row) {
        $row['bulletin'] = [
            'id_bulletin'     => $row['id_bulletin'],
            'numero_bulletin' => $row['numero_bulletin'],
            'date_soin'       => $row['date_soin'],
            'adherent'        => [
                'nom'       => $row['nom'],
                'prenom'    => $row['prenom'],
                'matricule' => $row['matricule'],
            ],
        ];
        unset($row['numero_bulletin'], $row['date_soin'], $row['nom'], $row['prenom'], $row['matricule']);
        return $row;
    }, $rows);

    jsonResponse(["success" => true, "data" => $data]);
}

function createBordereau()
{
    $data = getJsonInput();
    $id_bulletin = $data['id_bulletin'] ?? null;
    $numero_bordereau = $data['numero_bordereau'] ?? null;

    if (!$id_bulletin || !$numero_bordereau) {
        jsonResponse(["success" => false, "message" => "Bulletin et numéro de bordereau sont obligatoires."], 422);
    }

    $pdo = getPdo();
    $check = $pdo->prepare("SELECT id_bordereau FROM bordereau WHERE id_bulletin = ?");
    $check->execute([$id_bulletin]);
    if ($check->fetch()) {
        jsonResponse(["success" => false, "message" => "Ce bulletin est déjà associé à un bordereau."], 422);
    }

    $stmt = $pdo->prepare("INSERT INTO bordereau (id_bulletin, numero_bordereau, date_envoi, statut, commentaire) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $id_bulletin,
        $numero_bordereau,
        !empty($data['date_envoi']) ? $data['date_envoi'] : null,
        $data['statut'] ?? 'En attente',
        $data['commentaire'] ?? null,
    ]);

    jsonResponse(["success" => true, "message" => "Bordereau créé avec succès.", "id_bordereau" => $pdo->lastInsertId()]);
}

function updateBordereau($id)
{
    $data = getJsonInput();
    $id_bulletin = $data['id_bulletin'] ?? null;
    $numero_bordereau = $data['numero_bordereau'] ?? null;

    if (!$id_bulletin || !$numero_bordereau) {
        jsonResponse(["success" => false, "message" => "Bulletin et numéro de bordereau sont obligatoires."], 422);
    }

    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_bordereau FROM bordereau WHERE id_bordereau = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Bordereau introuvable."], 404);
    }

    $check = $pdo->prepare("SELECT id_bordereau FROM bordereau WHERE id_bulletin = ? AND id_bordereau != ?");
    $check->execute([$id_bulletin, $id]);
    if ($check->fetch()) {
        jsonResponse(["success" => false, "message" => "Ce bulletin est déjà associé à un autre bordereau."], 422);
    }

    $stmt = $pdo->prepare("UPDATE bordereau SET id_bulletin = ?, numero_bordereau = ?, date_envoi = ?, statut = ?, commentaire = ? WHERE id_bordereau = ?");
    $stmt->execute([
        $id_bulletin,
        $numero_bordereau,
        !empty($data['date_envoi']) ? $data['date_envoi'] : null,
        $data['statut'] ?? 'En attente',
        $data['commentaire'] ?? null,
        $id,
    ]);

    jsonResponse(["success" => true, "message" => "Bordereau modifié avec succès."]);
}

function deleteBordereau($id)
{
    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_bordereau FROM bordereau WHERE id_bordereau = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Bordereau introuvable."], 404);
    }
    $pdo->prepare("DELETE FROM bordereau WHERE id_bordereau = ?")->execute([$id]);
    jsonResponse(["success" => true, "message" => "Bordereau supprimé avec succès."]);
}

// =====================================================================
//  Dashboard
// =====================================================================

function dashboardStats()
{
    $pdo = getPdo();
    $totalAdherents = (int)$pdo->query("SELECT COUNT(*) FROM adherent")->fetchColumn();
    $bulletinsTraites = (int)$pdo->query("SELECT COUNT(*) FROM bulletin_soin")->fetchColumn();
    $totalBordereaux = (int)$pdo->query("SELECT COUNT(*) FROM bordereau")->fetchColumn();
    $montantTotal = (float)$pdo->query("SELECT COALESCE(SUM(montant_depense), 0) FROM bulletin_soin")->fetchColumn();

    jsonResponse([
        "success" => true,
        "data" => [
            "total_adherents"         => $totalAdherents,
            "bulletins_traites"       => $bulletinsTraites,
            "total_bordereaux"        => $totalBordereaux,
            "montant_total_rembourse" => number_format($montantTotal, 2, '.', ''),
        ],
    ]);
}
