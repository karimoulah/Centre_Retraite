# Les Aînés — frontend

Frontend de la plateforme du Centre d'accompagnement des retraités : portail public dont le contenu se modifie sans développeur, back-office de l'équipe (membres, adhésions, finances, rapports, communications) et console de contenu.

Projet de maîtrise en génie logiciel (UQAM). L'API (NestJS) vit dans un dépôt séparé ; ce dépôt la consomme.

## Technologies

- **Next.js 15** (App Router) avec React 19 et TypeScript strict.
- **Payload CMS 3**, intégré à Next : console de contenu sur `/admin`, tables dans le schéma `payload` de PostgreSQL 16.
- **Qualité** : ESLint, Prettier, `tsc --noEmit`, intégration continue avec GitHub Actions.
- **Outillage local** : Docker Compose (PostgreSQL), Node.js 22, npm.

## Structure du dépôt

```
frontend/              l'application Next.js + Payload
  src/app/(site)/      portail public
  src/app/(auth)/      connexion, mot de passe oublié
  src/app/(backoffice)/ back-office de l'équipe (/backoffice)
  src/app/(payload)/   console Payload (/admin), générée
  src/collections/     collections Payload
docker/                script d'initialisation de la base
.github/               intégration continue et modèle de pull request
docker-compose.yml     PostgreSQL
```

## Démarrage rapide

Prérequis : Node.js 22, npm, Git et Docker (ou PostgreSQL 16 installé autrement).

```
docker compose up -d db
cd frontend
cp .env.example .env
npm install
npm run dev
```

Adresses en développement :

- Site : http://localhost:5173
- Console du contenu : http://localhost:5173/admin (la première visite propose de créer le compte administrateur)
- API NestJS, appelée par le navigateur via `/backend/*` : `API_URL` dans `frontend/.env`

## Commandes utiles

Dans `frontend/` : `npm run lint`, `npm run typecheck`, `npm run build`, `npm run generate:types` après un changement de collection Payload.

## Façon de travailler

- Une branche par tâche depuis `main` : `feat/<ID>-<slug>`, `fix/<ID>-<slug>` ou `chore/<ID>-<slug>` (par exemple `feat/F3-02-cms-pages`).
- Commits petits et fréquents, au format Conventional Commits en anglais avec l'ID de la tâche : `feat(site): add hero block [F3-02]`.
- Chaque changement passe par une pull request relue par l'autre développeur ; la CI doit être verte avant la fusion.
- Aucun secret dans le code : les valeurs sensibles vont dans `frontend/.env`, jamais commité.
