<?php
/**
 * Routeur pour le serveur PHP intégré : php -S localhost:8000 router.php
 * (Le serveur intégré ne lit pas .htaccess, on reproduit donc le routage ici.)
 *
 * Le frontend appelle /api/xxx -> on retire le préfixe /api et on délègue à index.php.
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Retire le préfixe /api éventuel
$route = preg_replace('#^/api/?#', '', $uri);
$route = trim($route, '/');

// Sert un vrai fichier statique s'il existe (hors index.php lui-même)
$file = __DIR__ . '/' . $route;
if ($route !== '' && is_file($file) && basename($file) !== 'index.php' && basename($file) !== 'router.php') {
    return false; // laisse le serveur intégré servir le fichier
}

// Injecte la route et délègue au routeur principal
$_GET['route'] = $route;
require __DIR__ . '/index.php';
