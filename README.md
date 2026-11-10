# Centre d'accompagnement des retraités — dépôt de départ

Pile : React 18 + Vite (frontend), NestJS 11 + Prisma 6 (backend), PostgreSQL 16, GitHub Actions.

Démarrage complet, pas à pas : `docs/guide-demarrage.md`.
Tickets du sprint 1 (9 → 20 novembre 2026) : `docs/sprint-1-tickets.md`. Sigles et termes : `docs/glossaire.md`.

Commandes rapides (chaque développeur sur sa machine) :
```
docker compose up -d db            # ou PostgreSQL via Homebrew
cd backend && cp ../.env.example .env && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```
