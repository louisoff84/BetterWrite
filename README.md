# BetterWrite

BetterWrite est une plateforme web d'écriture et de publication de livres. Le frontend est statique (HTML/CSS/JavaScript vanilla) et peut être hébergé sur GitHub Pages. L'API REST utilise Node.js, Express et SQLite.

## Contenu du dépôt

- `index.html` : accueil, découverte des livres et classement hebdomadaire.
- `login.html`, `register.html` : points d'entrée vers les formulaires d'authentification.
- `dashboard.html` : bibliothèque personnelle de l'auteur.
- `editor.html` : métadonnées du livre, couverture par URL, chapitres et sauvegarde automatique.
- `book.html` : page publique de lecture et partage social.
- `profile.html` : profil auteur et livres publiés.
- `import.html` : import DOCX, TXT, Markdown et Google Drive/Docs.
- `config.js` : contient uniquement l'URL HTTPS de l'API.
- `backend/server.js` : API Express, authentification JWT, stockage SQLite, import et statistiques.

## 1. Déployer le backend (Debian 12/13)

Installe Node.js 22 LTS et les outils de compilation nécessaires à SQLite natif, puis :

```bash
cd backend
cp .env.example .env
npm install
```

Génère un secret JWT fort :

```bash
openssl rand -base64 48
```

Édite `.env` et configure au minimum :

- `PORT=3000`
- `NODE_ENV=production`
- `FRONTEND_ORIGIN=https://louisoff84.github.io`
- `JWT_SECRET` : secret généré ci-dessus (au moins 32 caractères)
- `DATABASE_PATH=./data/betterwrite.sqlite`

Démarre l'API :

```bash
npm start
```

Vérifie le service sur `http://127.0.0.1:3000/api/health`. En production, place Nginx ou Caddy devant Node.js et active HTTPS. Garde le dossier `backend/data` sur un stockage persistant et sauvegarde régulièrement le fichier SQLite.

## 2. Déployer le frontend sur GitHub Pages

1. Ouvre les paramètres du dépôt GitHub.
2. Va dans **Settings → Pages**.
3. Choisis **Deploy from a branch**.
4. Sélectionne la branche `main` et le dossier `/(root)`.
5. Enregistre et attends la publication.

Le frontend sera accessible à l'adresse `https://louisoff84.github.io/BetterWrite/`.

## 3. Configurer l'URL de l'API

Modifie uniquement `config.js` :

```javascript
window.BETTERWRITE_CONFIG = { API_URL: "https://api.ton-domaine.fr" };
```

L'origine du frontend à autoriser dans `FRONTEND_ORIGIN` est `https://louisoff84.github.io` (sans le chemin `/BetterWrite`). Redémarre le backend après modification du fichier `.env`.

## 4. Configurer Google OAuth

1. Ouvre Google Cloud Console et crée un projet.
2. Active **Google Drive API**.
3. Configure l'écran de consentement OAuth. Ajoute les comptes de test si l'application est en mode test.
4. Crée un identifiant OAuth de type **Application Web**.
5. Ajoute l'URI de redirection autorisée, qui doit correspondre exactement à `GOOGLE_REDIRECT_URI`, par exemple `https://api.ton-domaine.fr/api/import/google/callback`.
6. Ajoute les identifiants dans `backend/.env` :

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://api.ton-domaine.fr/api/import/google/callback
```

7. Redémarre l'API. Le navigateur doit autoriser les fenêtres popup pour la connexion Google.

Les secrets ne doivent jamais être ajoutés au frontend ni commités dans Git. Le fichier `.env` est ignoré par Git.

## Routes API principales

| Méthode | Route | Usage |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/users/me` | Profil connecté |
| GET | `/api/books` | Livres publiés |
| GET | `/api/books/:id` | Page publique d'un livre |
| POST | `/api/books/:id/read` | Enregistrer une lecture (limite anti-répétition de 24 h par IP) |
| GET | `/api/statistics/weekly` | Top 10 % des livres lus sur les 7 derniers jours, minimum 1 résultat lorsqu'il existe des livres lus |
| GET/POST | `/api/my/books` | Lister/créer ses livres |
| PATCH/DELETE | `/api/my/books/:id` | Modifier/supprimer un livre |
| POST | `/api/my/books/:id/chapters` | Ajouter un chapitre |
| PUT/DELETE | `/api/my/books/:id/chapters/:chapterId` | Modifier/supprimer un chapitre |
| POST | `/api/import/file` | Import DOCX/TXT/MD |
| GET | `/api/import/google/url` | Démarrer OAuth Google |
| POST | `/api/import/google/document` | Importer un document Drive |

Les routes privées nécessitent l'en-tête `Authorization: Bearer <JWT>`.

## Notes de déploiement

- Utilise HTTPS en production.
- Conserve `.env`, `backend/data/` et les sauvegardes hors du dépôt public.
- Le classement est calculé sur une fenêtre glissante de sept jours.
- Les contenus riches des chapitres sont filtrés côté backend avant stockage.
- La couverture est actuellement renseignée par URL HTTPS ; utilise un stockage objet/CDN persistant si tu souhaites ajouter l'envoi de fichiers image.
- Cette version est un socle applicatif fonctionnel ; avant une ouverture publique à grande échelle, ajoute notamment vérification d'e-mail, récupération de mot de passe, modération, quotas, tests automatisés et surveillance des sauvegardes.
