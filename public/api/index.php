<?php
/**
 * Routeur principal de l'API.
 * Endpoints (préfixe /public/api) :
 *   POST   /login
 *   POST   /logout
 *   GET    /me
 *   GET    /adherents
 *   GET    /adherents/{id}
 *   GET    /bulletins
 *   GET    /bordereaux
 *   GET    /dashboard/stats
 */

require __DIR__ . '/db.php';

// ---- Déterminer la route demandée ----
$method = $_SERVER['REQUEST_METHOD'];

// Récupère le chemin après /api/ quel que soit le mode (htaccess ?route= ou PATH_INFO ou URI brute)
$route = '';
if (isset($_GET['route'])) {
    $route = $_GET['route'];
} elseif (isset($_SERVER['PATH_INFO'])) {
    $route = $_SERVER['PATH_INFO'];
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    // Retire tout ce qui précède /api/
    if (preg_match('#/api/?(.*)$#', $uri, $m)) {
        $route = $m[1];
    }
}
$route = trim($route, '/');
$segments = $route === '' ? [] : explode('/', $route);
$resource = $segments[0] ?? '';

// ---- Dispatch ----
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
        } else {
            if (isset($segments[1])) {
                getAdherent((int)$segments[1]);
            } else {
                listAdherents();
            }
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
//  Handlers
// =====================================================================

function handleLogin()
{
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

    // Vérifie le mot de passe : supporte le hash bcrypt OU le texte brut (pour les anciennes données de test).
    $stored = (string)$user['mot_de_passe'];
    $isValid = false;
    if (password_verify($motDePasse, $stored)) {
        $isValid = true;
    } elseif (hash_equals($stored, (string)$motDePasse)) {
        $isValid = true;
    }

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
    // Sous-adhérents liés
    $sub = getPdo()->prepare("SELECT * FROM sous_adherent WHERE id_adherent = ?");
    $sub->execute([$id]);
    $adherent['sous_adherents'] = $sub->fetchAll();
    jsonResponse(["success" => true, "data" => $adherent]);
}

function listBulletins()
{
    // Jointure pour récupérer les infos de l'adhérent (utilisé par le frontend)
    $sql = "SELECT b.*, a.nom, a.prenom, a.matricule
            FROM bulletin_soin b
            LEFT JOIN adherent a ON a.id_adherent = b.id_adherent
            ORDER BY b.date_soin DESC";
    $rows = getPdo()->query($sql)->fetchAll();

    // Restructure pour exposer un objet "adherent" imbriqué
    $data = array_map(function ($row) {
        $row['adherent'] = [
            'nom'       => $row['nom'],
            'prenom'    => $row['prenom'],
            'matricule' => $row['matricule'],
        ];
        unset($row['nom'], $row['prenom'], $row['matricule']);
        return $row;
    }, $rows);

    jsonResponse(["success" => true, "data" => $data]);
}

function listBordereaux()
{
    $sql = "SELECT * FROM bordereau ORDER BY id_bordereau DESC";
    $rows = getPdo()->query($sql)->fetchAll();
    jsonResponse(["success" => true, "data" => $rows]);
}

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
            "total_adherents"          => $totalAdherents,
            "bulletins_traites"        => $bulletinsTraites,
            "total_bordereaux"         => $totalBordereaux,
            "montant_total_rembourse"  => number_format($montantTotal, 2, '.', ''),
        ],
    ]);
}

// =====================================================================
//  Adherents CRUD
// =====================================================================

function createAdherent()
{
    $data = getJsonInput();
    $matricule = $data['matricule'] ?? null;
    $nom = $data['nom'] ?? null;
    $prenom = $data['prenom'] ?? null;
    $etat_civil = $data['etat_civil'] ?? null;
    $sexe = $data['sexe'] ?? null;
    $date_naissance = $data['date_naissance'] ?? null;
    $date_adhesion = $data['date_adhesion'] ?? null;
    $adresse = $data['adresse'] ?? null;
    $cin = $data['cin'] ?? null;
    $telephone = $data['telephone'] ?? null;
    $statut = $data['statut'] ?? 'Actif';

    if (!$matricule || !$nom || !$prenom) {
        jsonResponse(["success" => false, "message" => "Données obligatoires manquantes."], 422);
    }

    $pdo = getPdo();
    $stmt = $pdo->prepare("INSERT INTO adherent (matricule, nom, prenom, etat_civil, sexe, date_naissance, date_adhesion, adresse, cin, telephone, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$matricule, $nom, $prenom, $etat_civil, $sexe, $date_naissance, $date_adhesion, $adresse, $cin, $telephone, $statut]);
    $id_adherent = $pdo->lastInsertId();

    if (isset($data['sous_adherents']) && is_array($data['sous_adherents'])) {
        foreach ($data['sous_adherents'] as $sub) {
            $sub_nom = $sub['nom'] ?? '';
            $sub_prenom = $sub['prenom'] ?? '';
            $sub_date_naissance = !empty($sub['date_naissance']) ? $sub['date_naissance'] : null;
            $sub_sexe = $sub['sexe'] ?? null;
            $sub_lien_parente = $sub['lien_parente'] ?? null;
            if ($sub_nom && $sub_prenom) {
                $sub_stmt = $pdo->prepare("INSERT INTO sous_adherent (id_adherent, nom, prenom, date_naissance, sexe, lien_parente) VALUES (?, ?, ?, ?, ?, ?)");
                $sub_stmt->execute([$id_adherent, $sub_nom, $sub_prenom, $sub_date_naissance, $sub_sexe, $sub_lien_parente]);
            }
        }
    }

    jsonResponse(["success" => true, "message" => "Adhérent créé avec succès.", "id_adherent" => $id_adherent]);
}

function updateAdherent($id)
{
    $data = getJsonInput();
    $matricule = $data['matricule'] ?? null;
    $nom = $data['nom'] ?? null;
    $prenom = $data['prenom'] ?? null;
    $etat_civil = $data['etat_civil'] ?? null;
    $sexe = $data['sexe'] ?? null;
    $date_naissance = $data['date_naissance'] ?? null;
    $date_adhesion = $data['date_adhesion'] ?? null;
    $adresse = $data['adresse'] ?? null;
    $cin = $data['cin'] ?? null;
    $telephone = $data['telephone'] ?? null;
    $statut = $data['statut'] ?? 'Actif';

    if (!$matricule || !$nom || !$prenom) {
        jsonResponse(["success" => false, "message" => "Données obligatoires manquantes."], 422);
    }

    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_adherent FROM adherent WHERE id_adherent = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Adhérent introuvable."], 404);
    }

    $stmt = $pdo->prepare("UPDATE adherent SET matricule = ?, nom = ?, prenom = ?, etat_civil = ?, sexe = ?, date_naissance = ?, date_adhesion = ?, adresse = ?, cin = ?, telephone = ?, statut = ? WHERE id_adherent = ?");
    $stmt->execute([$matricule, $nom, $prenom, $etat_civil, $sexe, $date_naissance, $date_adhesion, $adresse, $cin, $telephone, $statut, $id]);

    if (isset($data['sous_adherents']) && is_array($data['sous_adherents'])) {
        $pdo->prepare("DELETE FROM sous_adherent WHERE id_adherent = ?")->execute([$id]);
        foreach ($data['sous_adherents'] as $sub) {
            $sub_nom = $sub['nom'] ?? '';
            $sub_prenom = $sub['prenom'] ?? '';
            $sub_date_naissance = !empty($sub['date_naissance']) ? $sub['date_naissance'] : null;
            $sub_sexe = $sub['sexe'] ?? null;
            $sub_lien_parente = $sub['lien_parente'] ?? null;
            if ($sub_nom && $sub_prenom) {
                $sub_stmt = $pdo->prepare("INSERT INTO sous_adherent (id_adherent, nom, prenom, date_naissance, sexe, lien_parente) VALUES (?, ?, ?, ?, ?, ?)");
                $sub_stmt->execute([$id, $sub_nom, $sub_prenom, $sub_date_naissance, $sub_sexe, $sub_lien_parente]);
            }
        }
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

    $stmt = $pdo->prepare("DELETE FROM adherent WHERE id_adherent = ?");
    $stmt->execute([$id]);

    jsonResponse(["success" => true, "message" => "Adhérent supprimé avec succès."]);
}

// =====================================================================
//  Bulletins de Soin CRUD
// =====================================================================

function createBulletin()
{
    $data = getJsonInput();
    $id_adherent = $data['id_adherent'] ?? null;
    $numero_bordereau = $data['numero_bordereau'] ?? 0;
    $numero_bulletin = $data['numero_bulletin'] ?? null;
    $date_soin = !empty($data['date_soin']) ? $data['date_soin'] : null;
    $montant_depense = $data['montant_depense'] ?? null;
    $type_soin = $data['type_soin'] ?? null;
    $description = $data['description'] ?? null;
    $etat = $data['etat'] ?? 'En attente';

    if (!$id_adherent || !$numero_bulletin) {
        jsonResponse(["success" => false, "message" => "Données obligatoires manquantes."], 422);
    }

    $pdo = getPdo();
    
    $check = $pdo->prepare("SELECT id_bulletin FROM bulletin_soin WHERE id_adherent = ?");
    $check->execute([$id_adherent]);
    if ($check->fetch()) {
        jsonResponse(["success" => false, "message" => "Cet adhérent possède déjà un bulletin de soin (règle d'unicité de la base de données)."], 422);
    }

    $stmt = $pdo->prepare("INSERT INTO bulletin_soin (id_adherent, numero_bordereau, numero_bulletin, date_soin, montant_depense, type_soin, description, etat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id_adherent, $numero_bordereau, $numero_bulletin, $date_soin, $montant_depense, $type_soin, $description, $etat]);
    $id_bulletin = $pdo->lastInsertId();

    jsonResponse(["success" => true, "message" => "Bulletin de soin créé avec succès.", "id_bulletin" => $id_bulletin]);
}

function updateBulletin($id)
{
    $data = getJsonInput();
    $id_adherent = $data['id_adherent'] ?? null;
    $numero_bordereau = $data['numero_bordereau'] ?? 0;
    $numero_bulletin = $data['numero_bulletin'] ?? null;
    $date_soin = !empty($data['date_soin']) ? $data['date_soin'] : null;
    $montant_depense = $data['montant_depense'] ?? null;
    $type_soin = $data['type_soin'] ?? null;
    $description = $data['description'] ?? null;
    $etat = $data['etat'] ?? 'En attente';

    if (!$id_adherent || !$numero_bulletin) {
        jsonResponse(["success" => false, "message" => "Données obligatoires manquantes."], 422);
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
    $stmt->execute([$id_adherent, $numero_bordereau, $numero_bulletin, $date_soin, $montant_depense, $type_soin, $description, $etat, $id]);

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

    $stmt = $pdo->prepare("DELETE FROM bulletin_soin WHERE id_bulletin = ?");
    $stmt->execute([$id]);

    jsonResponse(["success" => true, "message" => "Bulletin de soin supprimé avec succès."]);
}

// =====================================================================
//  Bordereaux d'Envoi CRUD
// =====================================================================

function createBordereau()
{
    $data = getJsonInput();
    $id_bulletin = $data['id_bulletin'] ?? null;
    $numero_bordereau = $data['numero_bordereau'] ?? null;
    $date_envoi = !empty($data['date_envoi']) ? $data['date_envoi'] : null;
    $statut = $data['statut'] ?? 'En attente';
    $commentaire = $data['commentaire'] ?? null;

    if (!$id_bulletin || !$numero_bordereau) {
        jsonResponse(["success" => false, "message" => "Données obligatoires manquantes."], 422);
    }

    $pdo = getPdo();

    $check = $pdo->prepare("SELECT id_bordereau FROM bordereau WHERE id_bulletin = ?");
    $check->execute([$id_bulletin]);
    if ($check->fetch()) {
        jsonResponse(["success" => false, "message" => "Ce bulletin de soin est déjà associé à un autre bordereau."], 422);
    }

    $stmt = $pdo->prepare("INSERT INTO bordereau (id_bulletin, numero_bordereau, date_envoi, statut, commentaire) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id_bulletin, $numero_bordereau, $date_envoi, $statut, $commentaire]);
    $id_bordereau = $pdo->lastInsertId();

    jsonResponse(["success" => true, "message" => "Bordereau d'envoi créé avec succès.", "id_bordereau" => $id_bordereau]);
}

function updateBordereau($id)
{
    $data = getJsonInput();
    $id_bulletin = $data['id_bulletin'] ?? null;
    $numero_bordereau = $data['numero_bordereau'] ?? null;
    $date_envoi = !empty($data['date_envoi']) ? $data['date_envoi'] : null;
    $statut = $data['statut'] ?? 'En attente';
    $commentaire = $data['commentaire'] ?? null;

    if (!$id_bulletin || !$numero_bordereau) {
        jsonResponse(["success" => false, "message" => "Données obligatoires manquantes."], 422);
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
        jsonResponse(["success" => false, "message" => "Ce bulletin de soin est déjà associé à un autre bordereau."], 422);
    }

    $stmt = $pdo->prepare("UPDATE bordereau SET id_bulletin = ?, numero_bordereau = ?, date_envoi = ?, statut = ?, commentaire = ? WHERE id_bordereau = ?");
    $stmt->execute([$id_bulletin, $numero_bordereau, $date_envoi, $statut, $commentaire, $id]);

    jsonResponse(["success" => true, "message" => "Bordereau d'envoi modifié avec succès."]);
}

function deleteBordereau($id)
{
    $pdo = getPdo();
    $stmt = $pdo->prepare("SELECT id_bordereau FROM bordereau WHERE id_bordereau = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(["success" => false, "message" => "Bordereau introuvable."], 404);
    }

    $stmt = $pdo->prepare("DELETE FROM bordereau WHERE id_bordereau = ?");
    $stmt->execute([$id]);

    jsonResponse(["success" => true, "message" => "Bordereau d'envoi supprimé avec succès."]);
}
