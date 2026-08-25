# 35 — Bouton reset global des filtres

**What to build:** Un bouton "Réinitialiser" qui vide les 3 groupes de filtres (Sol, Environnement, Accès) en un clic, toujours visible (jamais caché par le scroll horizontal mobile du ticket 34 — hors de la zone scrollable, ou pinned à une extrémité fixe).

**Blocked by:** 34 (l'emplacement du bouton dépend de la disposition finale de la rangée)

**Status:** done

**Origine :** Session `/grill-with-docs` du 2026-08-20. Actuellement aucun moyen de vider les filtres sans re-cliquer individuellement chaque pilule active.

- [x] Bouton reset dans `App.tsx`, appelle `setGroundTypes([])`, `setEquipmentTypes([])`, `setFreeAccess(undefined)` (adapter selon l'état final de 32)
- [x] Visible/actif uniquement quand au moins un filtre est actif (sinon disabled ou masqué — cohérent avec le pattern déjà utilisé pour la croix d'effacement de la recherche, `hasQuery` dans `BoulodromeSearch.tsx`) — absent du DOM (pas juste `disabled`), même choix que `hasQuery`
- [x] Toujours visible : positionné en dehors de la zone `overflow-x-auto` du ticket 34, pas à l'intérieur de la rangée scrollable — les 3 groupes passent dans un conteneur interne `min-w-0 flex-1 overflow-x-auto`, le bouton reste un frère `shrink-0` en dehors, dans la rangée `fixed` externe
- [x] `aria-label` explicite ("Réinitialiser les filtres")
- [x] Tests de composant : clic vide les 3 groupes, bouton absent/disabled quand aucun filtre actif — 3 tests ajoutés à `App.test.tsx` (absent sans filtre, apparaît au premier filtre actif, réinitialise les 3 groupes + disparaît), 114 tests suite complète verte

**Out of scope :**
- Reset par groupe individuel (écarté en session : avec 1-2 pilules actives max par groupe, re-cliquer la pilule active revient déjà à un reset de groupe)
