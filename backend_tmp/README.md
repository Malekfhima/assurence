# STIPE Assurance — Backend API (Laravel)

API REST Laravel pour la gestion d'assurance santé (adhérents, sous-adhérents,
bulletins de soins, bordereaux d'envoi) consommée par le frontend React.

## ⚠️ Important

Ce dossier contient **uniquement les fichiers de logique métier** (migrations,
modèles, contrôleurs, requests, routes, seeders, config). Il faut les intégrer
dans un squelette Laravel complet.

## Installation

1. Générer un squelette Laravel 11 (nécessite PHP ≥ 8.2 et Composer) :

   ```bash
   composer create-project laravel/laravel temp-laravel "11.*"
   ```

2. Copier le contenu de ce dossier `backend/` par-dessus le squelette généré
   (en écrasant `composer.json`, `bootstrap/app.php`, `routes/`, etc.), puis :

   ```bash
   cd backend
   composer install
   composer require laravel/sanctum
   cp .env.example .env
   php artisan key:generate
   ```

3. Configurer la base de données dans `.env` (déjà pré-rempli pour XAMPP :
   base `assurance_group`, utilisateur `root`, mot de passe vide).

4. La base `assurance_group` existe déjà (voir `../db/assurance_group.sql`).
   - Si vous repartez de zéro : `php artisan migrate --seed`
   - Si la base existe déjà : exécutez seulement le seeder pour créer l'admin :
     `php artisan db:seed`

   > Note : la colonne `user.mot_de_passe` doit être de type `VARCHAR(255)`
   > pour stocker le hash bcrypt (la définition d'origine `int(250)` ne convient pas).

5. Lancer le serveur :

   ```bash
   php artisan serve   # http://localhost:8000
   ```

## Authentification

- `POST /api/login` — `{ "email": "...", "mot_de_passe": "..." }` → renvoie un `token` Sanctum
- `POST /api/logout` — (Bearer token requis)
- `GET  /api/me` — utilisateur courant

Admin par défaut (via seeder) : `admin@stipe.tn` / `admin123`

## Endpoints (Bearer token requis)

| Méthode | URL | Description |
|--------|-----|-------------|
| GET    | `/api/dashboard/stats` | Statistiques du tableau de bord |
| GET/POST | `/api/adherents` | Liste / création d'adhérents (`?search=`, `?statut=`) |
| GET/PUT/DELETE | `/api/adherents/{id}` | Détail / màj / suppression |
| ...    | `/api/sous-adherents` | CRUD sous-adhérents (`?id_adherent=`) |
| ...    | `/api/bulletins` | CRUD bulletins de soins (`?search=`, `?etat=`) |
| ...    | `/api/bordereaux` | CRUD bordereaux (`?search=`, `?statut=`) |

## Connexion depuis React

Mettre à jour `src/Login.js` pour appeler `http://localhost:8000/api/login`,
stocker le `token` (localStorage) et l'envoyer en header
`Authorization: Bearer <token>` sur les requêtes suivantes.
