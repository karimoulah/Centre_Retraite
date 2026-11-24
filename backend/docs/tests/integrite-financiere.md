# Intégrité financière (ENF-03) — résultats

Suite : `test/e2e/financial-integrity.e2e-spec.ts` (`pnpm test:e2e financial-integrity --verbose`), sur PostgreSQL 16 réel.

Chaque règle est vérifiée deux fois : par l'API, puis directement en base, où un déclencheur ou une contrainte la refuse même si le code applicatif se trompait.

| Règle | API | Base de données | Résultat |
| --- | --- | --- | --- |
| Une écriture validée est immuable | PATCH, DELETE, pièce, 2e validation → 409 | UPDATE de chaque colonne et DELETE refusés (déclencheur `entries_rules`) | Réussi |
| Deux validations simultanées | une 200, une 409 (verrou de ligne) | — | Réussi |
| Contrepassation exacte | montant opposé, solde net = 0 | montant différent refusé | Réussi |
| Contrepassation unique | deux demandes simultanées : une 201, une 409 | 2e contrepassation refusée (index unique `reverses_id`) | Réussi |
| Contrepassation d'un brouillon | 409 | refusée | Réussi |
| Catégorie du bon sens | 422 `CATEGORY_DIRECTION_MISMATCH` | INSERT et UPDATE refusés | Réussi |
| Approbateur ≠ saisisseur | 403 `SELF_APPROVAL` | contrainte `entries_approver_not_author` | Réussi |
| Dépense au-delà du seuil | validation refusée sans approbation (409) | — | Réussi |

Résultat de l'exécution : 9 tests, 9 réussis.
