# Sprint 1 — Tickets détaillés (9 → 20 novembre 2026)

**Objectif du sprint** : un squelette qui tourne de bout en bout (dépôt, base, CI), une connexion sécurisée avec rôles et journal d'audit, et un site public dont le menu et les pages se modifient sans redéploiement.

**Démo au PO : vendredi 20 novembre.** Deux développeurs, environ 8 jours chacun, chacun sur sa propre machine (voir `guide-demarrage.md`, section 3).

## Répartition

| Ticket | Titre | Qui | Jours |
|---|---|---|---|
| S1-01 | Dépôt GitHub et protections | Dev1 | 0,5 |
| S1-02 | Tableau de suivi et seconde copie | Dev2 | 0,5 |
| S1-03 | PostgreSQL local | Dev1 | 0,5 |
| S1-04 | Backend démarré et première migration | Dev1 | 1 |
| S1-05 | Frontend relié à l'API | Dev2 | 0,5 |
| S1-06 | Intégration continue | Dev1 | 0,5 |
| S1-07 | Tests Playwright de base | Dev2 | 0,5 |
| S1-08 | API Utilisateurs et rôles | Dev1 | 1,5 |
| S1-09 | Authentification | Dev1 | 2 |
| S1-10 | Contrôle d'accès par rôle | Dev1 | 1 |
| S1-11 | Journal d'audit | Dev1 | 1 |
| S1-12 | Écrans de connexion et de gestion des comptes | Dev1 | 1,5 |
| S1-13 | CMS : modèles et API | Dev2 | 2 |
| S1-14 | Navigation du site public | Dev2 | 1,5 |
| S1-15 | Console d'administration des pages | Dev2 | 2,5 |
| S1-16 | Préparation et déroulé de la démo | Les deux | 0,5 chacun |

Dev1 porte l'identité et la sécurité (le plus risqué techniquement), Dev2 porte le CMS et le site public (le plus visible). Charge totale : environ 8 jours chacun, marge faible. Si le retard s'installe, couper d'abord S1-07 puis les écrans de S1-12 les moins essentiels, jamais l'authentification ni le contrôle d'accès.

## Convention pour tous les tickets
Chaque développeur travaille sur sa machine et partage uniquement via GitHub. Une branche par ticket (`feat/S1-XX-nom`), une pull request relue par l'autre, CI verte, squash and merge. Définition de terminé : voir le guide, section 10.

---

## Dev1

### S1-01 Dépôt GitHub et protections (0,5 j)
**Pourquoi** : tout le reste dépend d'un dépôt partagé et protégé.
**Étapes**
1. Créer le dépôt privé `centre-retraites`, inviter Dev2.
2. Pousser le dépôt de départ (guide, section 2).
3. Protéger `main` : pull request obligatoire, 1 relecture, CI requise (la CI sera activée en S1-06).
4. Ajouter le gabarit de pull request (déjà fourni).
**Critères d'acceptation** : un push direct sur `main` est refusé ; Dev2 peut cloner.

### S1-03 PostgreSQL local (0,5 j, à faire aussi par Dev2 sur sa machine)
**Étapes** : suivre le guide, section 4 (Docker, sinon Homebrew, sinon Codespaces). Créer `centre_dev` et `centre_test` sur sa propre machine (chaque développeur le fait de son côté).
**Critères** : `psql ... -c "select 1;"` répond pour les deux bases.
**Risque** : Docker ne démarre pas sur l'ancien macOS ; basculer sur Homebrew le jour même, ne pas perdre de temps.

### S1-04 Backend démarré et première migration (1 j)
**Étapes**
1. `cd backend && cp ../.env.example .env && npm install && npx prisma generate`.
2. Créer la première migration : `npx prisma migrate dev --name init_identite_audit` (tables User, Role, UserRole, AuditLog déjà décrites dans `schema.prisma`).
3. Commiter le dossier `prisma/migrations`.
4. `npm run start:dev`, vérifier `/api/v1/health` et `/api/docs`.
5. Prévenir Dev2 : il fait `git pull`, puis `npx prisma migrate dev` sur sa machine, ce qui crée les mêmes tables dans sa base locale.
**Critères** : health renvoie `database: up` ; la migration est dans `main`.
**Attention** : `prisma generate` et `migrate` n'ont pas pu être testés dans l'environnement qui a préparé le dépôt (réseau filtré). Si une erreur apparaît ici, elle vient probablement du réseau ou de la version Prisma ; consulter le guide, section 11.

### S1-06 Intégration continue (0,5 j)
**Étapes** : le workflow `.github/workflows/ci.yml` est fourni. Pousser une branche, ouvrir une pull request, vérifier que les deux jobs (backend, frontend) passent. Puis ajouter ces jobs comme « required checks » dans la protection de `main`.
**Critères** : une pull request avec un test cassé est bloquée.

### S1-08 API Utilisateurs et rôles (1,5 j)
**Étapes**
1. `npm install bcryptjs` et `npm install -D @types/bcryptjs`.
2. Générer le module : `npx nest g module users` puis service et contrôleur.
3. DTO avec class-validator : `CreateUserDto` (email, mot de passe d'au moins 12 caractères, prénom, nom, rôles), `UpdateUserDto`.
4. Routes : `POST /users`, `GET /users`, `GET /users/:id`, `PATCH /users/:id`, désactivation par `PATCH` (pas de suppression physique).
5. Hachage du mot de passe avec bcryptjs (coût 12). Ne jamais renvoyer `passwordHash` dans une réponse.
6. Script de graine `prisma/seed.ts` : rôles `ADMIN`, `FINANCE`, `MODERATOR`, `EDITOR` et un compte administrateur initial dont le mot de passe vient de `SEED_ADMIN_PASSWORD` (jamais écrit dans le code).
7. Tests unitaires du service (mot de passe haché, email unique).
**Critères** : un utilisateur créé apparaît dans Swagger ; la réponse ne contient jamais le hachage ; doublon d'email refusé avec un code 409.

### S1-09 Authentification (2 j)
**Étapes**
1. `npm install @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/throttler cookie-parser` (et les types).
2. `POST /auth/login` : vérifie email et mot de passe, renvoie un jeton d'accès court (15 minutes) dans le corps, et place un jeton de rafraîchissement (7 jours) dans un cookie `HttpOnly`, `Secure` en production, `SameSite=Strict`.
3. `POST /auth/refresh` et `POST /auth/logout`.
4. `GET /auth/me` renvoie l'utilisateur courant et ses rôles.
5. Limiter les essais : 5 tentatives par minute sur `/auth/login` (throttler).
6. Message d'erreur identique pour « email inconnu » et « mauvais mot de passe ».
7. Secrets `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` lus depuis l'environnement, validés au démarrage.
8. Tests : connexion réussie, mauvais mot de passe, jeton expiré, compte désactivé refusé.
**Critères** : après déconnexion le rafraîchissement est refusé ; le cookie n'est pas lisible par JavaScript.

### S1-10 Contrôle d'accès par rôle (1 j)
**Étapes**
1. Garde globale JWT : toutes les routes sont protégées par défaut.
2. Décorateur `@Public()` pour les routes ouvertes (santé, connexion, pages publiques).
3. Décorateur `@Roles('ADMIN', ...)` et garde de rôles.
4. Chaque refus renvoie 403 et alimente le journal d'audit (voir S1-11).
5. Tests : un éditeur ne peut pas créer un utilisateur ; un administrateur le peut.
**Critères** : le contrôle est fait côté serveur, jamais seulement dans l'interface.

### S1-11 Journal d'audit (1 j)
**Étapes**
1. Service `AuditService.log(acteur, action, type, id, détails)` qui écrit dans la table `AuditLog`.
2. Journaliser : connexion réussie et échouée, création et modification d'utilisateur, refus d'accès (403), modification de page (appelé par S1-13).
3. Table en ajout seul : aucune route de modification ni de suppression.
4. `GET /audit` réservé à `ADMIN`, avec pagination et filtre par date.
**Critères** : un refus d'accès apparaît dans le journal avec l'acteur et l'heure.

### S1-12 Écrans de connexion et de gestion des comptes (1,5 j)
**Étapes**
1. Page `/connexion` : formulaire accessible (étiquettes, erreurs lues par les lecteurs d'écran).
2. Stockage du jeton d'accès en mémoire (pas dans `localStorage`), rafraîchissement automatique via le cookie.
3. Routes protégées par rôle côté interface (pour l'ergonomie seulement).
4. Écran administrateur : liste des utilisateurs, création, désactivation, attribution des rôles.
5. Écran du journal d'audit en lecture seule.
6. Tests Vitest sur le formulaire.
**Critères** : un éditeur ne voit pas l'écran des comptes ; l'écran fonctionne au clavier.
**Dépendance** : S1-09 et S1-10 fusionnés.

---

## Dev2

### S1-02 Tableau de suivi et poste de Dev2 (0,5 j)
**Étapes**
1. Créer un tableau GitHub Projects avec les colonnes À faire, En cours, En relecture, Terminé et y saisir les 16 tickets.
2. Accepter l'invitation au dépôt, configurer la clé SSH, cloner le dépôt sur sa machine (guide, section 3) et installer PostgreSQL (S1-03).
3. Créer `backend/.env` comme dans le guide : mêmes ports que Dev1, base locale `centre_dev`.
**Critères** : Dev2 pousse une branche et ouvre une pull request.

### S1-05 Frontend relié à l'API (0,5 j)
**Étapes** : `cd frontend && npm install`, lancer avec `npm run dev` (ports 3000 et 5173, comme Dev1). Vérifier la ligne « API : ok » sur la page d'accueil. Vérifier que le proxy `/api` fonctionne.
**Critères** : la page affiche l'état de l'API locale ; `npm run lint && npm test && npm run build` passent.

### S1-07 Tests Playwright de base (0,5 j)
**Étapes** : `cd e2e && npm install && npx playwright install chromium && npm test` avec le front et l'API lancés. Les deux tests fournis (page d'accueil, lien d'évitement) doivent passer ; en ajouter un sur la navigation une fois S1-14 prêt.
**Risque** : Playwright peut ne pas fonctionner sur un macOS ancien ; exécuter dans Codespaces. Ticket coupable en dernier recours.

### S1-13 CMS : modèles et API (2 j)
**Étapes**
1. Attendre la migration de S1-04, puis modifier `schema.prisma` (annoncer à Dev1) : modèle `Page` (id, slug unique, titre, contenu texte, statut `DRAFT` ou `PUBLISHED`, dates) et modèle `MenuItem` (id, libellé, ordre, visible, pageId optionnel).
2. `npx prisma migrate dev --name cms_pages_menu`.
3. Graine : menu initial (Accueil, Le centre, Activités, Actualités, Contact) et une page d'accueil publiée.
4. Routes publiques : `GET /public/menu` (éléments visibles, triés) et `GET /public/pages/:slug` (publiées seulement, 404 sinon).
5. Routes d'administration (rôle `ADMIN` ou `EDITOR`) : créer, modifier, publier, dépublier une page ; créer, renommer, réordonner, masquer une entrée de menu.
6. Chaque modification écrit dans le journal d'audit (S1-11).
7. Tests : une page brouillon n'est pas visible publiquement.
**Critères** : renommer une entrée de menu via l'API change `GET /public/menu` sans redémarrage.
**Dépendances** : S1-04 pour la base ; S1-10 et S1-11 pour les routes protégées et l'audit (en attendant, protéger par une garde provisoire retirée ensuite).

### S1-14 Navigation du site public (1,5 j)
**Étapes**
1. `PublicLayout` charge le menu via `/api/v1/public/menu`.
2. Route `/:slug` qui charge la page et affiche son contenu en texte.
3. Menu adaptatif : bouton « Menu » sur mobile, liens visibles sur ordinateur.
4. Accessibilité : lien d'évitement (déjà là), `aria-current` sur la page active, contraste suffisant, navigation clavier complète, gros caractères lisibles pour un public senior.
5. États de chargement et d'erreur (page introuvable).
6. Tests Vitest sur le menu et la page 404.
**Critères** : sur un écran de téléphone, le menu s'ouvre et se ferme au clavier.

### S1-15 Console d'administration des pages (2,5 j)
**Étapes**
1. Écran protégé (rôles `ADMIN` et `EDITOR`) : liste des pages avec statut.
2. Formulaire de création et d'édition (titre, slug, contenu).
3. Boutons publier et dépublier.
4. Écran du menu : renommer, réordonner (boutons monter et descendre, au clavier), masquer.
5. Retour visuel après sauvegarde ; confirmation avant dépublication.
6. Tests Vitest sur le formulaire ; un test Playwright qui modifie un libellé de menu et le retrouve sur le site public.
**Critères** : on renomme une entrée et on publie une page sans toucher au code ni redéployer.
**Dépendance** : S1-09 (connexion) pour accéder à la console ; en attendant, utiliser un jeton généré à la main.

---

## Les deux : S1-16 Préparation et déroulé de la démo (jeudi 19 novembre, 0,5 j chacun)
**Étapes**
1. Base propre : sur la machine qui présente la démo, recréer `centre_dev`, appliquer les migrations, lancer la graine.
2. Préparer deux comptes : administrateur et éditeur.
3. Répéter le déroulé ci-dessous en moins de 10 minutes.
4. Noter les écarts à signaler au PO (ce qui n'est pas prêt) plutôt que de les cacher.

**Déroulé de démo**
1. Montrer le dépôt, la CI verte et les protections (1 min).
2. Se connecter en administrateur : liste des comptes, création d'un éditeur (2 min).
3. Se connecter en éditeur : l'écran des comptes est inaccessible ; montrer le refus dans le journal d'audit côté administrateur (2 min).
4. Renommer et réordonner une entrée de menu, masquer une autre (2 min).
5. Rédiger puis publier une page ; la voir apparaître sur le site public sans redéploiement (2 min).
6. Site public sur téléphone (fenêtre étroite) et au clavier seul (1 min).

---

## Planning jour par jour

| Jour | Dev1 | Dev2 |
|---|---|---|
| Lun 9 nov | S1-01, S1-03 | S1-02, début S1-05 |
| Mar 10 | S1-04 (migration poussée en fin de journée) | S1-05, S1-07 |
| Mer 11 | S1-06, début S1-08 | S1-13 (modèles, migration, graine) |
| Jeu 12 | S1-08 | S1-13 (routes publiques) |
| Ven 13 | S1-08 fin, début S1-09 | S1-13 (routes admin) |
| Lun 16 | S1-09 | S1-14 |
| Mar 17 | S1-09 fin, S1-10 | S1-14, début S1-15 |
| Mer 18 | S1-10 fin, S1-11 | S1-15 |
| Jeu 19 | S1-12, S1-16 | S1-15, S1-16 |
| Ven 20 | Démo, rétrospective | Démo, rétrospective |

Points de synchronisation : fin du mardi 10 (migration initiale fusionnée, sinon Dev2 est bloqué) ; mercredi 18 (authentification fusionnée, sinon la console de S1-15 ne peut pas se connecter). Un point de dix minutes chaque matin : ce que j'ai fait, ce que je fais, ce qui me bloque.

## Risques du sprint
- Environnement : vieux macOS (esbuild, Docker, Playwright). Plan B pour la machine concernée : Codespaces, décidé dès le lundi si un blocage dure plus de deux heures.
- `prisma generate` et `migrate` non testés avant le démarrage réel : à valider dès S1-04.
- Dev2 dépend de Dev1 pour la base (mardi) et l'authentification (mercredi) : pour éviter l'attente, Dev2 commence par ce qui est indépendant (S1-05, S1-07, modèles CMS).
- Charge serrée : appliquer la règle de coupe énoncée plus haut.

## Rétrospective (vendredi 20, 30 minutes)
Trois questions : qu'est-ce qui a bien marché, qu'est-ce qui a bloqué, qu'est-ce qu'on change pour le sprint 2. Ajuster la vélocité avant de planifier le sprint 2 (23 novembre).
