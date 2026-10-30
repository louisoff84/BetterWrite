# BetterWrite

BetterWrite est une plateforme d'écriture, de publication et de découverte de livres. **Le frontend et l'API tournent maintenant sur un seul serveur** : Node.js/Express sert les pages HTML, CSS, JavaScript et les routes REST sur la même origine. SQLite conserve les données sur un volume persistant.

## Architecture

```text
Internet
   |
   | HTTPS : betterwrite.ton-domaine.fr
   v
Nginx (certificat TLS, port 443)
   |
   | HTTP local : 127.0.0.1:3000
   v
Docker / Node.js + Express
   |-- Frontend statique (/, *.html, *.js, *.css, /assets/*)
   |-- API REST (/api/*)
   |-- SQLite (/data/betterwrite.sqlite)
   '-- Import Google Drive (OAuth facultatif)
```

Il n'y a plus besoin de GitHub Pages, d'un hébergement frontend séparé, ni de CORS entre le site et l'API. Le fichier `config.js` utilise une URL API vide : les appels sont donc envoyés vers le même domaine que la page.

## Fonctionnalités

- Comptes, connexion et sessions JWT.
- Tableau de bord auteur et gestion des livres.
- Éditeur de chapitres avec sauvegarde automatique.
- Brouillons et publication de livres.
- Pages publiques partageables et profils auteurs.
- Compteur de lectures avec limitation anti-répétition sur 24 heures.
- Classement des 10 % de livres les plus lus sur les sept derniers jours (au moins un livre si des livres ont été lus).
- Import de fichiers DOCX, TXT et Markdown.
- Import Google Docs/Drive facultatif avec OAuth.
- SQLite persistant, limitation de débit, Helmet et filtrage HTML des chapitres.

## Déploiement sur un serveur Debian 12

Prérequis : un serveur Debian 12, un nom de domaine pointant vers son IP, Docker Engine avec le plugin Compose, et les ports 80/443 ouverts.

### 1. Installer Docker

Si Docker est déjà installé, passe directement à l'étape suivante.

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
```

### 2. Récupérer le projet et configurer les secrets

```bash
sudo mkdir -p /opt/betterwrite
sudo chown "$USER":"$USER" /opt/betterwrite
git clone https://github.com/louisoff84/BetterWrite.git /opt/betterwrite
cd /opt/betterwrite
cp backend/.env.example backend/.env
mkdir -p data
```

Génère une clé JWT aléatoire et injecte-la dans le fichier d'environnement :

```bash
JWT_SECRET="$(openssl rand -hex 48)"
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
```

Édite ensuite `backend/.env` et remplace :
- `APP_ORIGIN` par l'origine publique, par exemple `https://betterwrite.ton-domaine.fr`.
- `GOOGLE_REDIRECT_URI` par `https://betterwrite.ton-domaine.fr/api/import/google/callback`.
- Laisse `FRONTEND_ORIGIN=` vide : frontend et API partagent la même origine.
- Les paramètres Google peuvent rester vides si tu ne souhaites pas activer l'import Drive.

### 3. Démarrer BetterWrite

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f betterwrite
```

Vérifie le service localement :

```bash
curl http://127.0.0.1:3000/api/health
```

Le conteneur redémarre automatiquement. Les données SQLite sont conservées dans `/opt/betterwrite/data`, indépendamment du cycle de vie du conteneur.

### 4. Configurer Nginx et HTTPS

Installe Nginx et Certbot :

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Copie la configuration fournie, puis remplace chaque occurrence de `betterwrite.example.com` par ton vrai domaine :

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/betterwrite
sudo nano /etc/nginx/sites-available/betterwrite
```

Active le site : le fichier fourni est volontairement en HTTP uniquement pour permettre à Certbot de créer le certificat et le bloc HTTPS automatiquement.

```bash
sudo ln -s /etc/nginx/sites-available/betterwrite /etc/nginx/sites-enabled/betterwrite
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d betterwrite.ton-domaine.fr
```

Après émission du certificat, vérifie et recharge Nginx :

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Le site et l'API seront accessibles sur la même origine :
- Site : `https://betterwrite.ton-domaine.fr/`
- Santé API : `https://betterwrite.ton-domaine.fr/api/health`

### 5. Mettre à jour le site

```bash
cd /opt/betterwrite
git pull
docker compose up -d --build
```

### 6. Sauvegarder la base SQLite

Effectue une sauvegarde régulière du dossier `data`. Pour une copie cohérente de SQLite en fonctionnement, utilise la commande de sauvegarde SQLite depuis le conteneur :

```bash
cd /opt/betterwrite
docker compose exec betterwrite node -e "const D=require('better-sqlite3');const db=new D('/data/betterwrite.sqlite');db.backup('/data/backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite').then(()=>{db.close();console.log('Backup OK')})"
```

Copie ensuite les sauvegardes hors du serveur. Ne publie jamais `backend/.env` ni le contenu du dossier `data`.

## Google Drive OAuth (facultatif)

1. Crée un projet dans Google Cloud Console.
2. Active Google Drive API et configure l'écran de consentement OAuth.
3. Crée un identifiant OAuth de type application Web.
4. Ajoute cette URI de redirection autorisée : `https://betterwrite.ton-domaine.fr/api/import/google/callback`.
5. Renseigne `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans `backend/.env`.
6. Vérifie `APP_ORIGIN` et `GOOGLE_REDIRECT_URI`, puis redémarre :

```bash
docker compose up -d
```

## Routes API principales

| Méthode | Route | Usage |
|---|---|---|
| GET | `/api/health` | Santé du serveur |
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/users/me` | Profil connecté |
| GET | `/api/books` | Livres publiés |
| GET | `/api/books/:id` | Page publique d'un livre |
| POST | `/api/books/:id/read` | Enregistrer une lecture |
| GET | `/api/statistics/weekly` | Classement hebdomadaire |
| GET/POST | `/api/my/books` | Lister/créer ses livres |
| PATCH/DELETE | `/api/my/books/:id` | Modifier/supprimer un livre |
| POST | `/api/import/file` | Import DOCX/TXT/MD |
| GET | `/api/import/google/url` | Démarrer Google OAuth |
| POST | `/api/import/google/document` | Importer un document Drive |

Les routes privées nécessitent `Authorization: Bearer <JWT>`.

## Développement local

```bash
cd backend
cp .env.example .env
# Configure JWT_SECRET (au moins 32 caractères) et DATABASE_PATH.
npm install
npm start
```

Le serveur sert le frontend à l'adresse `http://localhost:3000`. Ouvre cette URL, et non le fichier HTML directement.

## Notes de production

- Utilise HTTPS et un vrai nom de domaine.
- Conserve le dossier `data` sur un disque persistant et sauvegarde-le hors serveur.
- Le dossier `backend` et le dossier `data` ne sont pas servis en HTTP.
- La couverture de livre est actuellement fournie par URL HTTPS.
- Avant une ouverture publique à grande échelle, prévois notamment vérification d'e-mail, récupération de mot de passe, modération, quotas, tests automatisés et surveillance des sauvegardes.
