# 36 — Carte : chargement par viewport (bbox), fin du dézoom au filtre

**What to build:** Le fetch des boulodromes passe d'un fetch complet (filtré) sur changement de filtre à un fetch par zone visible (`GET /api/boulodromes?bbox=west,south,east,north`) déclenché au pan/zoom (`moveend`), avec les filtres de pilules appliqués côté client sur les données déjà chargées plutôt que par un nouveau fetch. `BoulodromesMap` ne doit plus être démonté/remonté à chaque chargement, quelle qu'en soit la cause.

**Blocked by:** aucun (indépendant de 31-35, mais touche `App.tsx` donc à rebaser si fait en parallèle)

**Status:** done

**Origine :** Session `/grill-with-docs` du 2026-08-20, voir [docs/adr/0004-viewport-bbox-fetching-for-boulodromes-map.md](../../../docs/adr/0004-viewport-bbox-fetching-for-boulodromes-map.md). Cause réelle du "dézoom au filtre" signalé par l'utilisateur : `App.tsx` repasse en `status: 'loading'` à chaque changement de filtre, ce qui démonte `<BoulodromesMap>` (rendu conditionnel) puis le remonte avec `center={PARIS_CENTER} zoom={12}` figés en dur — le zoom/pan de l'utilisateur n'est jamais préservé. Le endpoint bbox existe déjà côté serveur depuis la Phase 3 (`server/src/db/boulodromesRepository.ts`, opérateur PostGIS `&&`) mais n'est pas utilisé par le client.

- [x] `client/src/api/boulodromes.ts` : `BoulodromesFilters` gagne un paramètre `bbox` (`{west, south, east, north}`), sérialisé dans la query string
- [x] `App.tsx` (ou un hook dédié `useBoulodromes.ts`, cohérent avec les conventions CLAUDE.md) : le fetch se déclenche sur changement de bbox (listener `moveend` de la carte), pas sur changement de filtre — les filtres (groundTypes/equipmentTypes/freeAccess) s'appliquent en sélecteur côté client sur les données déjà chargées, sans déclencher de nouveau fetch — `client/src/hooks/use-boulodromes.ts`, `client/src/components/BoundsWatcher.tsx`
- [x] `BoulodromesMap` (ou son parent) ne doit plus être démonté/remonté sur un nouveau chargement — remplacé le rendu conditionnel `loading`/`success`/`error` qui masquait tout le composant par un état de chargement affiché en overlay/indicateur, carte toujours montée
- [x] Debounce sur `moveend` (300ms, `UI_DEBOUNCE_MS` — `client/src/constants/debounce.ts`, désormais partagée avec `SEARCH_DEBOUNCE_MS`/`BoulodromeSearch.tsx` plutôt que dupliquée)
- [x] Vue initiale : conservé `center={PARIS_CENTER} zoom={12}`
- [x] Pendant un nouveau fetch bbox : les marqueurs déjà chargés restent affichés jusqu'à l'arrivée des nouvelles données (`useBoulodromes` ne vide jamais `rawData`, seul `isFetching` bascule)
- [x] **Recherche/historique** : `onSelectBoulodrome`/`BoulodromeHistoryEntry` portent désormais les coordonnées du résultat, utilisées pour le `flyTo` indépendamment de la présence d'un marqueur dans `features` — voir `client/src/lib/boulodrome-selection.ts` (`toBoulodromeHistoryEntry`)
- [x] `BoulodromeHistoryEntry` (`use-boulodrome-history.ts`) gagne un champ `coordinates`
- [x] Tests : `use-boulodromes.test.ts` (debounce/dédup bbox, filtrage client-side, pas de fetch sur changement de filtre), `BoulodromesMap.test.tsx` (rapport bbox initial + debounce moveend, sélection/flyTo hors bbox, réouverture du popup une fois le marqueur chargé)
- [x] Vérifié en navigateur réel (serveur + DB locaux, via le Browser pane — pas de Playwright configuré sur ce projet) : pan/zoom déclenche un fetch avec le bon bbox, filtrer ne redéclenche pas de fetch réseau, zoom/pan préservés après un changement de filtre (bug initial confirmé corrigé), sélection d'un résultat de recherche distant (Lyon) recentre correctement la carte et charge son marqueur

**Out of scope :**
- Garde-fou sur un bbox trop large (zoom très dézoomé) — non nécessaire à l'échelle actuelle (64 lignes au total, cf. ADR 0004)
- Le fetch des cafés à proximité (`fetchCafesNearBoulodrome`, rayon autour d'un boulodrome sélectionné) — indépendant, non affecté

**Note d'implémentation :** deux limites connues, volontairement laissées telles quelles (revue via `/code-review`) :
- Un historique de recherche déjà stocké en localStorage avant ce ticket (donc sans `coordinates`) est purgé au lieu d'être migré — pas de valeur par défaut sensée pour `coordinates`, contrairement à `siteName` (ticket 23). Impact limité (5 entrées max, facilement reconstituées en recherchant à nouveau).
- Sélectionner un résultat de recherche/historique qu'un filtre de pilule actif exclut (pas juste le bbox) recentre la carte et charge le panneau Itinéraire/cafés, mais aucun marqueur ne s'affichera tant que le filtre reste actif (la recherche ignore déjà les filtres par conception). Non testé spécifiquement.
