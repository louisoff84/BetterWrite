# BetterWrite

Plateforme d'écriture et de publication de livres. Frontend statique compatible GitHub Pages et API REST Express/SQLite.

## Structure
- Frontend : fichiers HTML/CSS/JS à la racine, sans build.
- Backend : Node.js 22+, Express et SQLite dans `/backend`.
- API : authentification JWT, livres/chapitres, publication, lectures, classement hebdomadaire et import de fichiers/Google Drive.

## Configuration du backend
```bash
cd backend
cp .env.example .env
npm install
```
Génère un secret JWT robuste : `openssl rand -base64 48`. Place-le dans `.env`, configure `FRONTEND_ORIGIN`, puis lance `npm start`. En développement : `npm run dev`. L'API écoute sur `0.0.0.0:3000`; configure un reverse proxy HTTPS devant elle. Le dossier `data/` est créé automatiquement.

## Frontend / GitHub Pages
Modifie `config.js` et remplace l'URL d'exemple par l'URL HTTPS publique de ton API. Dans GitHub : Settings → Pages → Deploy from a branch → main → /(root). Le frontend est servi directement depuis la racine.

## Google OAuth
1. Dans Google Cloud Console, crée un projet et active **Google Drive API**.
2. Configure l'écran de consentement OAuth et ajoute les utilisateurs de test si l'application reste en mode test.
3. Crée un identifiant OAuth de type **Application Web**.
4. Ajoute l'URL de callback exacte, par exemple `https://api.example.com/api/import/google/callback`, dans les URI de redirection autorisées.
5. Place `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_REDIRECT_URI` dans `.env`, puis redémarre l'API.

## Routes principales
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/books`, `GET /api/books/:id`
- `POST /api/books/:id/read`, `GET /api/statistics/weekly`
- `GET /api/my/books`, `POST /api/books`, `PATCH /api/my/books/:id`
- `POST /api/my/books/:id/chapters`, `PUT /api/my/books/:id/chapters/:chapterId`
- `POST /api/import/file`, `GET /api/import/google/url`

## Important
Le dépôt contient le socle initial de l'application. Les écrans éditeur, tableau de bord, profil et lecteur doivent être ajoutés/branchés avant de considérer l'expérience complète. Les couvertures doivent être hébergées sur un stockage persistant HTTPS en production. Prévois sauvegardes régulières du fichier SQLite et HTTPS obligatoire.
