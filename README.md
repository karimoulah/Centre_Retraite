
# Plateforme du Centre d'accompagnement des retraités

Plateforme web du Centre : site public à contenu modifiable sans développeur, gestion des membres et des adhésions, témoignages modérés, dons et registre financier, rapports, fiches de contributeur, courriels d'anniversaire et assistant (chatbot) qui répond avec ses sources.

Projet de maîtrise en génie logiciel (UQAM), réalisé par deux développeurs. Mise en ligne prévue le 24 décembre 2026.

## Technologies

- **Frontend** : React 18 avec TypeScript (React Router 6, tests avec Vitest et Testing Library). Le projet est compilé et servi en développement par Vite.
- **Backend** : NestJS 11 avec TypeScript, en monolithe modulaire. API REST documentée avec Swagger (OpenAPI).
- **Base de données** : PostgreSQL 16, accessible par Prisma 6 (ORM et migrations).
- **Qualité** : ESLint et Prettier, tests unitaires (Jest, Vitest), tests de bout en bout (Playwright), intégration continue avec GitHub Actions.
- **Outillage local** : Docker Compose (PostgreSQL et Mailpit, un faux serveur de courriel pour le développement), Node.js 22.

## Structure du dépôt

```
backend/              le serveur NestJS
  src/                le code (config, health, prisma, modules à venir)
  prisma/             schema.prisma et migrations
  test/               tests de bout en bout du serveur
frontend/             l'application React + TypeScript
  src/                pages, mises en page, tests
e2e/                  tests Playwright (navigateur réel)
docker/               script d'initialisation de la base
docs/                 guide de démarrage, tickets du sprint 1, glossaire
.github/              intégration continue et modèle de pull request
docker-compose.yml    PostgreSQL et Mailpit
.env.example          modèle des réglages (à copier en backend/.env)
```

## Démarrage rapide

Prérequis : Node.js 22, npm, Git et Docker (ou PostgreSQL 16 installé autrement). Le détail pas à pas, avec le dépannage, est dans `docs/guide-demarrage.md`.

1. Démarrer la base de données, depuis la racine du dépôt :
   ```
   docker compose up -d db
   ```
2. Lancer le backend :
   ```
   cd backend
   cp ../.env.example .env
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run start:dev
   ```
3. Lancer le frontend, dans un autre terminal :
   ```
   cd frontend
   npm install
   npm run dev
   ```

Adresses en développement :

- Site : http://localhost:5173
- API (état du système) : http://localhost:3000/api/v1/health
- Documentation de l'API : http://localhost:3000/api/docs
- Courriels de test (Mailpit) : http://localhost:8025, si le service est démarré

## Commandes utiles

Backend (dans `backend/`) : `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`, `npx prisma studio` pour explorer la base.

Frontend (dans `frontend/`) : `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Tests de bout en bout (dans `e2e/`, avec le site et l'API lancés) : `npm install`, `npx playwright install chromium`, `npm test`.

Ces contrôles tournent aussi automatiquement à chaque pull request.

## Façon de travailler

- Une branche par ticket, nommée `type/ticket-description` (par exemple `feat/S1-08-utilisateurs-roles`).
- Messages de commit au format `type(portée): résumé (ticket)`, avec les types `feat`, `fix`, `chore`, `docs` et `test`.
- Chaque changement passe par une pull request relue par l'autre développeur. La branche `main` est protégée et la CI doit être verte avant la fusion.
- Aucun secret dans le code : les valeurs sensibles vont dans `backend/.env`, qui n'est jamais commité.
- Un seul développeur modifie `schema.prisma` à la fois, et chaque changement de schéma s'accompagne d'une migration (`npx prisma migrate dev --name nom_explicite`).

## Documentation

- `docs/guide-demarrage.md` : mise en place complète, étape par étape.
- `docs/sprint-1-tickets.md` : tickets du sprint 1 (9 au 20 novembre 2026).
- `docs/glossaire.md` : sigles et termes du projet.

## Avancement

Sprint 1 en cours : dépôt, base de données et première migration en place, suivis de l'authentification, des rôles, du journal d'audit et du CMS (pages et menu). Les cinq sprints se terminent par une démonstration au PO ; la feuille de route complète couvre les finances, les adhésions, les témoignages, les anniversaires et le chatbot.
