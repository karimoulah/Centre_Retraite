# Les Aînés — API

API de la plateforme du Centre d'accompagnement des retraités : comptes et rôles de l'équipe, adhésions, membres et consentements, journal d'audit, formulaire de contact et envoi des courriels. Le frontend (Next.js + Payload) la consomme.

Projet de maîtrise en génie logiciel (UQAM).

## Technologies

- **NestJS 11** et TypeScript strict, validation **Zod** (messages en français).
- **PostgreSQL 16** (schéma `app`) avec **TypeORM** ; migrations en SQL, appliquées au démarrage.
- **Redis 7** et **BullMQ** : courriels envoyés par un processus séparé, avec reprises.
- Courriels : Mailpit en développement, Brevo en production.
- Sécurité : sessions en cookies httpOnly (JWT 1 h + jeton de rafraîchissement révocable), mots de passe Argon2, verrouillage après 5 échecs, Turnstile sur les formulaires publics, limites de requêtes, contrôle d'origine, helmet.
- Tests : Jest (unitaires) et tests de bout en bout sur une vraie base.

## Structure

```
src/
  config/           variables d'environnement validées au démarrage
  common/           erreurs, pagination, transactions, gardes, sécurité
  database/         entités, migrations, seeds
  infrastructure/   courriel, Redis, Turnstile, journalisation
  modules/          auth, users, settings, memberships, members, audit, contact, notifications, health
  main.ts           API
  worker.ts         processus d'envoi des courriels
test/               tests de bout en bout et fabriques de données
```

## Démarrage rapide

Prérequis : Node.js 22, pnpm 10 et Docker.

```
docker compose up -d
cp .env.example .env
pnpm install
pnpm seed:demo          # comptes et données de démonstration
pnpm start:dev          # API
pnpm start:worker:dev   # courriels (autre terminal)
```

Adresses en développement :

- API : http://localhost:3000/api/v1
- Documentation Swagger : http://localhost:3000/api/docs
- Courriels reçus (Mailpit) : http://localhost:8025

Comptes de démonstration (mot de passe `Motdepasse123!`) : `admin@`, `finance@`, `temoignages@`, `membre@`, `direction@` et `bloque@lesaines.test`.

Pour brancher le frontend : `API_MODE=live` et `API_URL=http://localhost:3000/api/v1` dans `frontend/.env`.

## Commandes utiles

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` (base de test du `docker-compose`, port 5433), `pnpm build`, `pnpm migration:generate`, `pnpm seed` (premier administrateur en production).

## Façon de travailler

- Une branche par tâche : `feat/<ID>-<slug>` (par exemple `feat/B3-01-membership-submit`).
- Commits au format Conventional Commits en anglais avec l'ID de la tâche : `feat(memberships): add public form [B3-01]`.
- Chaque changement passe par une pull request relue ; la CI doit être verte avant la fusion.
- Aucun secret dans le code : les valeurs sensibles vont dans `.env`, jamais commité.
