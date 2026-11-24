# Idempotence du webhook Stripe (US-24, ENF-03) — résultats

Suite : `test/e2e/webhook-replay.e2e-spec.ts` (`pnpm test:e2e webhook-replay --verbose`), sur PostgreSQL 16 réel, événements signés comme ceux de Stripe.

Mécanisme : l'identifiant de l'événement Stripe est la clé d'idempotence (clé primaire de `app.webhook_events`). L'enregistrement de l'événement et ses effets (paiement confirmé, contributeur, écriture validée, courriel) sont écrits dans la même transaction ; le paiement est verrouillé (`FOR UPDATE`) pendant le traitement. Un événement déjà vu répond 200 sans rien faire ; un événement dont le traitement échoue n'est pas enregistré, et Stripe le renvoie.

Livraisons successives : le même événement envoyé 10 fois de suite donne 10 réponses 200, un événement enregistré, un paiement confirmé, une écriture et un courriel. Réussi.

Livraisons simultanées : 10 envois en parallèle donnent 10 réponses 200, dont 9 marquées « déjà traité », et toujours un seul paiement confirmé, une écriture et un courriel. Réussi.

Événements différents pour un même paiement : 10 identifiants d'événement distincts (par exemple `completed` puis `async_payment_succeeded`) donnent quand même une seule écriture et un seul courriel, car un paiement déjà confirmé n'est plus traité. Réussi.

Résultat de l'exécution : 3 tests, 3 réussis.
