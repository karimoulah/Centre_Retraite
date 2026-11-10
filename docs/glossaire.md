# Glossaire des sigles et termes

Classé par thème. Chaque entrée explique le terme tel qu'il est utilisé dans ce projet.

## Gestion de projet

**PO (Product Owner)** : la personne qui représente le centre, décide des priorités et valide chaque démo.

**Sprint** : une période de travail courte (1 à 2 semaines ici) qui se termine par une démo au PO. Le projet compte 5 sprints.

**Backlog** : la liste ordonnée de tout ce qu'il reste à faire.

**Ticket** : une tâche précise du backlog, numérotée (par exemple S1-08 : sprint 1, tâche 8).

**DoD (Definition of Done, définition de terminé)** : la liste des conditions pour qu'un ticket soit considéré fini (code relu, tests verts, documentation à jour).

**Rétrospective** : réunion de fin de sprint pour décider quoi améliorer.

**Démo** : présentation au PO de ce qui fonctionne réellement à la fin du sprint.

**MVP (Minimum Viable Product)** : la plus petite version utile du produit.

**Priorités C et S** : niveaux de priorité du cahier des exigences. Les exigences de priorité C (confort) puis S (souhaitable) sont coupées en premier si le temps manque.

## Développement

**API (Application Programming Interface)** : l'ensemble des adresses par lesquelles le frontend demande des données au backend.

**REST** : style d'API où chaque ressource (utilisateur, page) a une adresse et où l'on utilise les verbes HTTP (GET, POST, PATCH).

**HTTP / HTTPS** : protocole du web ; la version S chiffre les échanges.

**CRUD (Create, Read, Update, Delete)** : les quatre opérations de base sur une donnée.

**DTO (Data Transfer Object)** : description de la forme exacte des données acceptées par une route, avec leurs règles de validation.

**ORM (Object-Relational Mapping)** : outil qui permet de manipuler la base de données avec du code plutôt que du SQL. Ici : Prisma.

**SQL** : langage des bases de données relationnelles.

**Migration** : fichier qui décrit un changement de structure de la base (ajout d'une table, d'une colonne). Versionné dans Git.

**Seed (graine)** : script qui remplit la base avec des données de départ (rôles, compte administrateur, menu).

**CMS (Content Management System)** : système qui permet de modifier le contenu du site sans toucher au code. Ici : un module du backend.

**RAG (Retrieval-Augmented Generation)** : technique du chatbot qui cherche d'abord des passages dans les documents du centre puis répond en citant ses sources.

**SPA (Single-Page Application)** : site dont les pages changent sans rechargement complet. Notre frontend React en est une.

**SSR / CSR** : rendu côté serveur ou côté navigateur. Nous utilisons le rendu côté navigateur.

**Webhook** : appel automatique envoyé par un service externe (le paiement) à notre API quand un événement survient.

**Idempotence** : propriété d'une opération qui, répétée plusieurs fois, a le même effet qu'une seule fois (indispensable pour les paiements).

**Monolithe modulaire** : une seule application, découpée en modules internes bien séparés.

**Swagger / OpenAPI** : standard et outil qui génèrent automatiquement la documentation interactive de l'API (page `/api/docs`).

**Linter (ESLint)** : outil qui repère les erreurs de style et les erreurs probables dans le code.

**Prettier** : outil qui formate le code automatiquement.

**TypeScript (TS)** : JavaScript avec des types, qui détecte des erreurs avant l'exécution.

**Test unitaire** : test d'un petit morceau de code isolé.

**Test e2e (end-to-end, de bout en bout)** : test qui parcourt l'application comme un utilisateur.

**Mock** : faux composant utilisé dans un test (par exemple une fausse base de données).

## Outils et technologies

**Node.js** : environnement qui exécute JavaScript hors du navigateur. Version 22 pour ce projet.

**npm** : gestionnaire de paquets de Node.

**NestJS** : cadre de travail du backend.

**React** : bibliothèque du frontend.

**Vite** : outil de développement et de construction du frontend.

**Vitest** : outil de tests du frontend.

**Playwright** : outil de tests e2e qui pilote un vrai navigateur.

**Prisma** : l'ORM du projet.

**PostgreSQL** : la base de données.

**Docker / docker compose** : outil qui lance des services (comme PostgreSQL) dans des conteneurs isolés.

**Mailpit** : faux serveur de courriel local pour voir les messages envoyés en développement.

**Git** : gestion des versions du code. **GitHub** : site qui héberge le dépôt.

**PR (Pull Request)** : demande de fusion d'une branche dans `main`, avec relecture.

**CI (Continuous Integration, intégration continue)** : vérifications automatiques (lint, tests, build) à chaque pull request. **CD (Continuous Deployment)** : mise en ligne automatisée.

**Codespaces** : environnement de développement hébergé par GitHub, utile si votre Mac est trop ancien.

**SSH** : connexion sécurisée par clés, utilisée par Git.

**Squash and merge** : fusion qui regroupe tous les commits d'une branche en un seul.

**Rebase** : remettre sa branche à jour par-dessus la dernière version de `main`.

## Sécurité

**JWT (JSON Web Token)** : jeton signé qui prouve l'identité de l'utilisateur. Le jeton d'accès est court (15 minutes), le jeton de rafraîchissement dure plus longtemps.

**Cookie HttpOnly** : cookie illisible par JavaScript, ce qui protège le jeton de rafraîchissement.

**RBAC (Role-Based Access Control)** : contrôle d'accès par rôle (ADMIN, FINANCE, MODERATOR, EDITOR).

**Garde (guard)** : code NestJS qui autorise ou refuse une requête avant qu'elle atteigne la route.

**Hachage (bcrypt)** : transformation irréversible du mot de passe avant stockage.

**CORS** : règle du navigateur qui limite quels sites peuvent appeler l'API.

**Throttling** : limitation du nombre de tentatives, contre les attaques par force brute.

**Journal d'audit** : registre en ajout seul des actions sensibles (qui, quoi, quand).

**Secret** : mot de passe ou clé qui ne doit jamais être dans le code.

## Finances et métier

**Registre (ledger)** : liste des écritures financières. Les écritures ne sont jamais modifiées ; une erreur se corrige par une contre-écriture.

**Contrepassation** : écriture inverse qui annule une écriture erronée.

**Centimes entiers** : les montants sont stockés en nombre entier de centimes pour éviter les erreurs d'arrondi.

**Fiche de contributeur** : document récapitulatif des dons. Ce n'est pas un reçu fiscal officiel.

## Accessibilité

**a11y** : abréviation d'« accessibilité » (11 lettres entre le a et le y).

**WCAG** : règles internationales d'accessibilité du web.

**Lien d'évitement (skip link)** : lien caché qui permet au clavier de sauter directement au contenu.

**aria-current, ARIA** : attributs qui décrivent l'interface aux lecteurs d'écran.
