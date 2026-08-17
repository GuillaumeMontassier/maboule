# 04 — Extraire la logique de sélection/cafés de `BoulodromesMap.tsx` dans un hook custom

**What to build:** Extraire la logique métier actuellement mélangée au rendu dans `BoulodromesMap.tsx` (325 lignes) — sélection d'un boulodrome, chargement des cafés à proximité, gestion des refs Leaflet des marqueurs — dans un hook custom dédié, sur le modèle de `client/src/hooks/use-boulodrome-history.ts` et `use-theme.ts` déjà en place.

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** `.scratch/phase-8-standards/spec.md`, écart réel contre la règle `CLAUDE.md` "Bonnes pratiques React" ("séparer la logique métier de l'affichage : extraire la logique réutilisable dans des hooks custom... plutôt que de tout mettre dans le composant"). `BoulodromesMap.tsx` mélange aujourd'hui : état de sélection (`selectedBoulodromeId`), chargement des cafés à proximité (`nearbyCafes`, effet lignes 85-105), logique de sélection avec recentrage carte et historique (`selectBoulodrome`, lignes 116-141), et le rendu JSX de la carte elle-même — le tout dans un seul composant.

- [ ] Un hook custom (ex. `useBoulodromeSelection`) regroupe : l'état `selectedBoulodromeId`, le chargement de `nearbyCafes` (effet + nettoyage sur changement de sélection), et la fonction `selectBoulodrome` (recentrage carte, alimentation de l'historique) — `BoulodromesMap.tsx` consomme ce hook plutôt que de porter cette logique en interne
- [ ] Le hook reste testable indépendamment du rendu Leaflet (pas de dépendance directe à `L.Map`/`L.Marker` dans sa logique de sélection/chargement — les refs Leaflet nécessaires sont passées ou retournées, pas recréées)
- [ ] Aucune régression sur le comportement existant : fermeture explicite de l'ancien popup au changement de sélection, alimentation de l'historique, recentrage animé (`flyTo`), garde sur un boulodrome absent de `features` (cf. commentaire existant `BoulodromesMap.tsx:107-115`)
- [ ] Tests existants (`BoulodromesMap.test.tsx`) toujours verts, adaptés seulement si la structure interne testée change (pas les comportements vérifiés)
- [ ] Vérifié en navigateur réel : sélection via marqueur et via recherche, changement de boulodrome sans accumulation de marqueurs cafés, historique toujours alimenté

**Out of scope :**
- Extraire la gestion du tracé d'itinéraire (`route`/`routePositions`) — état déjà porté séparément par `RoutePanel` via `onRouteChange`, pas mélangé au même degré
- Changer le comportement observable de la carte — refactor de structure interne uniquement
