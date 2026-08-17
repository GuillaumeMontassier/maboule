# 29 — Extraire un token/composant Button partagé (4 traitements ad hoc)

**What to build:** Extraire un token ou petit composant `Button` couvrant les 4 traitements visuels de bouton actuellement dupliqués sans réutilisation à travers l'app : pilule (déjà factorisée dans `pillStyles.ts`, à intégrer au même effort), bordé-neutre (`RoutePanel` — "Utiliser ma position" / "Rechercher l'adresse"), item de liste à plat (`SelectableList` — historique, résultats de recherche, candidats d'adresse), icône seule (croix d'effacement/suppression).

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Audit design system du 2026-08-17 (`/design-system audit`). Aucun composant `Button` n'existe dans `client/src/components/` ; chaque bouton compose sa propre chaîne de classes Tailwind au point d'usage. Exemple de duplication : `RoutePanel.tsx:173` et `RoutePanel.tsx:191` répètent quasiment à l'identique `w-full cursor-pointer rounded-md border border-gray-300 bg-gray-100 px-2 py-1.5 disabled:cursor-default disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700`. Pas un bug visible aujourd'hui — chaque bouton s'affiche correctement — mais un risque de dérive qui grossit à chaque nouveau bouton ajouté.

- [ ] Un token ou petit composant partagé existe pour chacune des variantes de bouton observées (pilule / bordé-neutre / liste-à-plat / icône-seule) plutôt que des chaînes de classes recopiées à chaque usage
- [ ] Les usages actuels (pilules de filtre, boutons `RoutePanel`, items de `SelectableList`, croix d'effacement/suppression dans `BoulodromeSearch`) migrent vers ce token sans changement visuel ni comportemental
- [ ] L'état disabled (piloté par `busy` dans `RoutePanel`) reste géré de façon cohérente à travers les variantes qui en ont besoin
- [ ] Si le ticket 28 (focus visible) est traité avant celui-ci, le nouveau token de bouton l'intègre nativement plutôt que de le retraiter séparément — sinon, prévoir le point d'extension pour l'accueillir ensuite
- [ ] Tests de composant existants (`RoutePanel.test.tsx`, `BoulodromeSearch.test.tsx`, etc.) toujours verts, adaptés seulement si la structure DOM change
- [ ] Vérifié en navigateur réel : rendu inchangé des 4 variantes en light/dark mode

**Out of scope :**
- Introduire de nouvelles variantes de bouton non observées dans l'app actuelle
