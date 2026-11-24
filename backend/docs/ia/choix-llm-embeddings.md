# Choix du LLM et des embeddings (T-11)

Décision prise au sprint 2 pour l'assistant conversationnel du site public (EP9). Elle sera confirmée au sprint 3 en mesurant les réponses sur le jeu d'évaluation de 50 questions (T-12).

## Besoin

L'assistant répond en français aux questions des aînés et de leurs proches, à partir du seul contenu publié sur le site (pages gérées dans Payload). Le corpus est petit : une trentaine de pages, soit quelques dizaines de milliers de mots. Les réponses doivent être simples, citer la page source et dire « je ne sais pas » quand le site ne contient pas l'information. Aucune donnée personnelle n'est envoyée au fournisseur : on n'indexe que du contenu public, et l'interface invite à ne pas écrire de renseignements personnels.

Critères, par ordre d'importance : qualité du français, fidélité au contexte (pas d'invention), coût mensuel, latence, conditions d'utilisation des données, simplicité d'intégration.

## Options comparées

**Option A — Claude Haiku 5.5 (Anthropic) pour la génération, Voyage 4 pour les embeddings.** Haiku 5.5 est le petit modèle rapide d'Anthropic. Il coûte 0,10 $ US par million de jetons en entrée et 0,50 $ en sortie pour les requêtes de moins de 100 000 jetons. Nos requêtes en sont très loin : quelques extraits plus la question. Voyage 4 est un modèle d'embeddings multilingue à 0,06 $ par million de jetons ; il existe aussi une version « lite » à 0,02 $. Ses vecteurs se règlent à 1024 dimensions. C'est le fournisseur d'embeddings que recommande Anthropic.

**Option B — Mistral (Small 4 et mistral-embed).** Mistral est une entreprise européenne, avec un très bon français. Mistral Small 4 coûte environ 0,15 $ en entrée et 0,60 $ en sortie par million de jetons (selon la page de prix consultée). mistral-embed coûte 0,10 $ par million de jetons. Un seul fournisseur couvre les deux usages.

**Option C — OpenAI (modèle « mini » et text-embedding-3-small).** text-embedding-3-small coûte 0,02 $ par million de jetons et produit des vecteurs de 1536 dimensions, qu'on peut raccourcir. Cette option est éprouvée et très documentée. Son modèle d'embeddings n'est pas spécialisé multilingue, et son générateur ne se distingue pas sur nos critères.

## Coût estimé

Indexation : 50 000 jetons pour tout le site, à refaire à chaque modification de page. Le coût est inférieur à un cent, quelle que soit l'option.

Questions : avec 1 000 questions par mois, chacune envoyant environ 2 000 jetons (extraits du site) et recevant environ 300 jetons, on obtient 2 millions de jetons en entrée et 0,3 million en sortie. Avec l'option A, cela fait environ 0,35 $ US par mois. Avec l'option B, environ 0,50 $. Le coût n'est donc pas un critère décisif ; la qualité et la fidélité le sont.

## Décision

On retient l'option A : **Claude Haiku 5.5** pour les réponses et **Voyage `voyage-4`** (1024 dimensions, `input_type` « document » à l'indexation et « query » à la recherche) pour les embeddings.

- Haiku 5.5 tient bien les consignes de fidélité au contexte (répondre seulement à partir des extraits, citer, refuser poliment), pour un coût négligeable à notre volume.
- Voyage 4 est multilingue. Comme le corpus est minuscule, prendre la version complète plutôt que la « lite » ne change presque rien au coût.
- Les vecteurs de 1024 dimensions restent légers dans pgvector, avec un index HNSW en distance cosinus.

L'option B reste la solution de repli si les mesures du sprint 3 montrent un français moins naturel ou si l'hébergement européen devient une exigence.

## Conséquences dans le code

Le fournisseur est derrière une interface : `EmbeddingsProvider` pour les embeddings, et plus tard un équivalent pour la génération. Changer d'option ne demande qu'un nouvel adaptateur, puis une réindexation complète, car les vecteurs de deux modèles ne se mélangent pas.

En développement et dans les tests, un fournisseur local et déterministe remplace l'API ; il fonctionne sans clé et sans réseau. Les variables d'environnement sont `EMBEDDINGS_DRIVER` (`voyage` ou `fake`), `VOYAGE_API_KEY` et, au sprint 3, `ANTHROPIC_API_KEY`.

Les prix sont ceux affichés publiquement en novembre 2026, en dollars américains. Ils seront revérifiés avant la mise en production.
