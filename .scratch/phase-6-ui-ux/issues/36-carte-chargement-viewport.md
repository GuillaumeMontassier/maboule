# 36 — Carte : chargement par viewport (bbox), fin du dézoom au filtre

**What to build:** Le fetch des boulodromes passe d'un fetch complet (filtré) sur changement de filtre à un fetch par zone visible (`GET /api/boulodromes?bbox=west,south,east,north`) déclenché au pan/zoom (`moveend`), avec les filtres de pilules appliqués côté client sur les données déjà chargées plutôt que par un nouveau fetch. `BoulodromesMap` ne doit plus être démonté/remonté à chaque chargement, quelle qu'en soit la cause.

**Blocked by:** aucun (indépendant de 31-35, mais touche `App.tsx` donc à rebaser si fait en parallèle)

**Status:** ready-for-agent

**Origine :** Session `/grill-with-docs` du 2026-08-20, voir [docs/adr/0004-viewport-bbox-fetching-for-boulodromes-map.md](../../../docs/adr/0004-viewport-bbox-fetching-for-boulodromes-map.md). Cause réelle du "dézoom au filtre" signalé par l'utilisateur : `App.tsx` repasse en `status: 'loading'` à chaque changement de filtre, ce qui démonte `<BoulodromesMap>` (rendu conditionnel) puis le remonte avec `center={PARIS_CENTER} zoom={12}` figés en dur — le zoom/pan de l'utilisateur n'est jamais préservé. Le endpoint bbox existe déjà côté serveur depuis la Phase 3 (`server/src/db/boulodromesRepository.ts`, opérateur PostGIS `&&`) mais n'est pas utilisé par le client.

- [ ] `client/src/api/boulodromes.ts` : `BoulodromesFilters` gagne un paramètre `bbox` (`{west, south, east, north}`), sérialisé dans la query string
- [ ] `App.tsx` (ou un hook dédié `useBoulodromes.ts`, cohérent avec les conventions CLAUDE.md) : le fetch se déclenche sur changement de bbox (listener `moveend` de la carte), pas sur changement de filtre — les filtres (groundTypes/equipmentTypes/freeAccess) s'appliquent en sélecteur côté client sur les données déjà chargées, sans déclencher de nouveau fetch
- [ ] `BoulodromesMap` (ou son parent) ne doit plus être démonté/remonté sur un nouveau chargement — remplacer le rendu conditionnel `loading`/`success`/`error` qui masque tout le composant par un état de chargement affiché en overlay/indicateur, carte toujours montée
- [ ] Debounce sur `moveend` (300ms, cohérent avec `SEARCH_DEBOUNCE_MS` déjà utilisé dans `BoulodromeSearch.tsx`)
- [ ] Vue initiale : conserver `center={PARIS_CENTER} zoom={12}` (pas de dézoom monde — dataset uniquement parisien, cette vue montre déjà les 64 boulodromes)
- [ ] Pendant un nouveau fetch bbox : garder les marqueurs déjà chargés affichés jusqu'à l'arrivée des nouvelles données (pas de vidage immédiat, pas de clignotement)
- [ ] **Recherche/historique** : `BoulodromeSearch.tsx` fait déjà son propre fetch plein-dataset (`q=...`, indépendant du bbox) — faire remonter les coordonnées du résultat sélectionné jusqu'au `flyTo` (`BoulodromesMap.tsx:146` cherche actuellement le boulodrome par id dans `features`, le jeu bbox-scopé, ce qui échouerait silencieusement pour un résultat hors du viewport actuel) plutôt que de dépendre du jeu de données chargé
- [ ] `BoulodromeHistoryEntry` (`use-boulodrome-history.ts`) gagne un champ coordonnées (actuellement seulement `id`/`name`/`siteName`), pour la même raison — un boulodrome de l'historique est typiquement hors du viewport actuel
- [ ] Tests : hook/logique de fetch-par-bbox (debounce, pas de fetch tant que bbox inchangé), filtrage client-side sur les données chargées, `flyTo` fonctionne pour un résultat de recherche/historique hors du viewport actuel chargé (mock)
- [ ] Vérifié en navigateur réel (Playwright) : pan/zoom déclenche un fetch avec le bon bbox, filtrer ne redéclenche pas de fetch réseau, zoom/pan préservés après un changement de filtre, sélection d'un résultat de recherche distant recentre correctement la carte

**Out of scope :**
- Garde-fou sur un bbox trop large (zoom très dézoomé) — non nécessaire à l'échelle actuelle (64 lignes au total, cf. ADR 0004)
- Le fetch des cafés à proximité (`fetchCafesNearBoulodrome`, rayon autour d'un boulodrome sélectionné) — indépendant, non affecté
