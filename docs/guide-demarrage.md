# Guide de démarrage de A à Z

Ce guide suppose que vous êtes deux développeurs (Dev1 et Dev2), **chacun sur sa propre machine**. Chaque commande est à copier dans le Terminal. Ne sautez aucune étape : c'est un projet neuf.

## 1. Vérifier la machine

```
node -v        # doit afficher v22.x
npm -v         # 10.x
git --version
psql --version # si PostgreSQL est installé via Homebrew
docker -v      # peut échouer sur un vieux macOS : ce n'est pas bloquant
```

**Attention à l'ancien macOS.** Votre machine a déjà produit l'erreur `dyld: Symbol not found: _SecTrustCopyCertificateChain` avec esbuild. Le frontend de ce dépôt contient déjà le contournement (`"overrides": { "esbuild": "0.21.5" }` dans `frontend/package.json`). Si une autre erreur `dyld` apparaît, passez à GitHub Codespaces (voir 5.3).

Node 22 : si `node -v` affiche une autre version, installez nvm (`brew install nvm`) puis `nvm install 22 && nvm use 22`. Le fichier `.nvmrc` à la racine l'indique.

## 2. Dépôt GitHub (Dev1)

1. Sur github.com, créer le dépôt privé `centre-retraites`.
2. Dans *Settings → Collaborators*, inviter Dev2.
3. Dans *Settings → Branches*, protéger `main` : pull request obligatoire, 1 relecture, les tests CI doivent passer.
4. Dans le dossier du projet sur la machine :
```
git init -b main
git add .
git commit -m "chore: dépôt de départ"
git remote add origin git@github.com:<compte>/centre-retraites.git
git push -u origin main
```

## 3. Un développeur, une machine

Chaque développeur travaille sur **sa propre machine**, avec sa propre copie du dépôt et sa propre base PostgreSQL locale. Les deux machines n'échangent que par GitHub : le code et les migrations Prisma passent par les pull requests, les données non (chacun a sa base).

Comme les machines sont séparées, les deux utilisent les **mêmes ports et les mêmes noms** : backend 3000, frontend 5173, base `centre_dev`, base de tests `centre_test`. Aucune adaptation de port n'est nécessaire.

Sur chaque machine :
```
mkdir -p ~/projets && cd ~/projets
git clone git@github.com:<compte>/centre-retraites.git
cd centre-retraites
git config user.name "Votre nom"
git config user.email "votre@courriel.com"
```
Clé SSH : `ssh-keygen -t ed25519`, puis ajouter la clé publique (`cat ~/.ssh/id_ed25519.pub`) dans GitHub, *Settings → SSH and GPG keys*. Test : `ssh -T git@github.com`.

Fichier `backend/.env` (identique des deux côtés, jamais commité) :
```
DATABASE_URL=postgresql://centre:centre@localhost:5432/centre_dev
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
```
Pour garder la même base de départ chez les deux, tout le monde utilise la graine (`npx prisma db seed`, ticket S1-08) : les données de démonstration sont ainsi identiques sans être partagées.

Si l'une des deux machines ne peut pas faire tourner le projet (vieux macOS), son propriétaire utilise GitHub Codespaces pour cette machine uniquement.

## 4. PostgreSQL

### Option A : Docker (si Docker Desktop fonctionne)
```
docker compose up -d db
docker compose ps        # l'état doit être "healthy"
```
Le script `docker/init-db.sql` crée `centre_test` ; la base `centre_dev` est créée par la configuration du conteneur. L'utilisateur est `centre`, mot de passe `centre`.

### Option B : Homebrew (si Docker ne démarre pas)
```
brew install postgresql@16
brew services start postgresql@16
psql postgres -c "CREATE USER centre WITH PASSWORD 'centre' CREATEDB;"
for b in centre_dev centre_test; do psql postgres -c "CREATE DATABASE $b OWNER centre;"; done
```
Si `brew` refuse de compiler sur votre macOS ancien, passez à l'option C.

### Option C : GitHub Codespaces
Dans GitHub, bouton *Code → Codespaces → Create*. Le terminal du navigateur est un Linux récent où Node, Docker et PostgreSQL fonctionnent. Chaque développeur ouvre son propre Codespace.

Test de connexion : `psql postgresql://centre:centre@localhost:5432/centre_dev -c "select 1;"`

## 5. Lancer le projet

### Backend
```
cd ~/projets/centre-retraites/backend
cp ../.env.example .env
npm install
npx prisma generate
npm run start:dev
```
Vérifier : http://localhost:3000/api/v1/health doit répondre `{"status":"ok","database":"up",...}` et http://localhost:3000/api/docs affiche Swagger.

### Frontend
```
cd ~/projets/centre-retraites/frontend
npm install
npm run dev
```
Ouvrir http://localhost:5173 : la page affiche « API : ok (base up) ».

## 6. Commandes de qualité (à lancer avant chaque pull request)

Backend : `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`.
Frontend : `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
Playwright (une fois le front et l'API lancés) : `cd e2e && npm install && npx playwright install chromium && npm test`. Sur un vieux macOS, Playwright peut échouer : lancez-le dans Codespaces ou laissez la CI le faire.

## 7. Flux Git quotidien

```
git switch main && git pull
git switch -c feat/S1-08-utilisateurs-roles
# ... travail ...
git add -A && git commit -m "feat(users): API utilisateurs et rôles (S1-08)"
git push -u origin feat/S1-08-utilisateurs-roles
```
Ouvrir la pull request sur GitHub, remplir le gabarit, demander la relecture à l'autre développeur, attendre la CI verte, puis « Squash and merge ». Supprimer la branche. Une branche = un ticket. Messages de commit au format `type(portée): résumé (ticket)` avec les types `feat`, `fix`, `chore`, `docs`, `test`.

Rebaser avant de pousser si `main` a bougé : `git fetch && git rebase origin/main`.

## 8. Règles Prisma (source de conflits n°1)

- Une seule personne modifie `schema.prisma` à la fois. Annoncez-le à l'autre avant.
- Créer une migration : `npx prisma migrate dev --name <nom_explicite>`. Le dossier `prisma/migrations` est commité.
- Ne jamais modifier une migration déjà fusionnée sur `main`. En cas de besoin, créer une nouvelle migration.
- Après un `git pull` qui contient une migration : `npx prisma migrate dev` puis `npx prisma generate`.
- Conflit de migration : le deuxième à fusionner rebase, supprime sa migration locale, la recrée.

## 9. Secrets

Aucun mot de passe ni clé dans le code. Les valeurs vont dans `.env` (local) et dans *GitHub → Settings → Secrets* (CI/déploiement). Changer les valeurs `changer-moi-*` du `.env.example` par de longues chaînes aléatoires : `openssl rand -hex 32`.

## 10. Définition de terminé (DoD)

Un ticket est terminé quand : le code est fusionné via pull request relue, la CI est verte, les tests du ticket existent, le comportement est vérifié à la main, la documentation (README ou Swagger) est à jour, et aucun secret n'a été commité.

## 11. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `dyld: Symbol not found` | binaire trop récent pour macOS | override esbuild déjà présent ; sinon Codespaces |
| `Cannot connect to the Docker daemon` | Docker Desktop fermé ou impossible | `open -a Docker`, sinon Homebrew ou Codespaces |
| `EADDRINUSE :::3000` | port déjà pris | `lsof -i :3000` puis `kill <PID>`, ou changer `PORT` |
| `P1001 Can't reach database` | PostgreSQL arrêté ou mauvaise URL | vérifier `DATABASE_URL` et `brew services list` / `docker compose ps` |
| `P3009 failed migrations` | migration en échec | corriger puis `npx prisma migrate resolve` ou recréer la base de dev |
| `ENOENT package.json` | mauvais dossier | `cd backend` ou `cd frontend` |
| `Environment variable not found: DATABASE_URL` | `.env` manquant | copier `.env.example` |
| `prisma generate` échoue avec 403 | réseau filtré | réessayer sur un autre réseau ou Codespaces |

## 12. Aide-mémoire

```
docker compose up -d db | docker compose down
npm run start:dev | npm run dev
npx prisma studio              # explorer la base dans le navigateur
npx prisma migrate dev --name x
git switch -c feat/S1-XX-nom
```
