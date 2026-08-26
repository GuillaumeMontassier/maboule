# 04 — Extraire la logique de sélection/cafés de `BoulodromesMap.tsx` dans un hook custom

**What to build:** Extraire la logique métier actuellement mélangée au rendu dans `BoulodromesMap.tsx` (325 lignes) — sélection d'un boulodrome, chargement des cafés à proximité, gestion des refs Leaflet des marqueurs — dans un hook custom dédié, sur le modèle de `client/src/hooks/use-boulodrome-history.ts` et `use-theme.ts` déjà en place.

**Blocked by:** aucun

**Status:** done

**Origine :** `.scratch/phase-8-standards/spec.md`, écart réel contre la règle `CLAUDE.md` "Bonnes pratiques React" ("séparer la logique métier de l'affichage : extraire la logique réutilisable dans des hooks custom... plutôt que de tout mettre dans le composant"). `BoulodromesMap.tsx` mélange aujourd'hui : état de sélection (`selectedBoulodromeId`), chargement des cafés à proximité (`nearbyCafes`, effet lignes 85-105), logique de sélection avec recentrage carte et historique (`selectBoulodrome`, lignes 116-141), et le rendu JSX de la carte elle-même — le tout dans un seul composant.

- [x] Un hook custom (`useBoulodromeSelection`, `client/src/hooks/use-boulodrome-selection.ts`) regroupe : l'état `selectedBoulodromeId`, le chargement de `nearbyCafes` (effet + nettoyage sur changement de sélection), et la fonction `selectBoulodrome` (recentrage carte, alimentation de l'historique) — `BoulodromesMap.tsx` consomme ce hook plutôt que de porter cette logique en interne
- [x] Le hook reste testable indépendamment du rendu Leaflet — `mapRef`/`boulodromeMarkers` sont créées par le hook et retournées (jamais recréées), le composant se contente de les passer aux props `ref` de `MapContainer`/`Marker`. Testé avec un double minimal du marqueur/de la carte (`use-boulodrome-selection.test.ts`) plutôt qu'un rendu Leaflet complet
- [x] Aucune régression sur le comportement existant : fermeture explicite de l'ancien popup au changement de sélection, alimentation de l'historique, recentrage animé (`flyTo`), garde sur un boulodrome absent de `features`
- [x] Tests existants (`BoulodromesMap.test.tsx`, 44 tests) toujours verts, inchangés (aucune structure interne testée n'a changé) ; 9 nouveaux tests dédiés au hook
- [x] Vérifié en navigateur réel : sélection via marqueur et via recherche, changement de boulodrome sans accumulation de marqueurs cafés (un seul jeu de marqueurs à la fois), historique toujours alimenté (les deux sélections apparaissent, la plus récente en tête), désélection (fermeture popup) vide bien le panneau Itinéraire et les cafés

**Durci suite au code review** (un bug réel introduit par ce ticket, corrigé avant commit) :
- La fermeture du popup précédent avait été déplacée dans le callback fonctionnel de `setSelectedBoulodromeId` (pour lire la sélection courante sans l'ajouter aux dépendances de `useCallback`) — un `setState` updater n'est exécuté qu'après le reste du corps synchrone de `selectBoulodrome`, donc `marker?.openPopup()` (nouveau marqueur) s'exécutait avant la fermeture de l'ancien popup, au lieu de l'inverse. Revenu à la lecture directe de `selectedBoulodromeId` en fermeture explicite avant le `setState`, avec `selectedBoulodromeId` ajouté aux dépendances de `useCallback`
- Au passage : l'effet de chargement des cafés utilisait `.then()/.catch()` plutôt que `async`/`await` (préférence explicite de `CLAUDE.md`, déjà suivie par `use-boulodromes.ts`) ; le retour du hook n'était pas typé par une interface nommée (`BoulodromeSelection`) ; les callbacks `it()` du nouveau fichier de test n'avaient pas de type de retour explicite — corrigés

**Out of scope :**
- Extraire la gestion du tracé d'itinéraire (`route`/`routePositions`) — état déjà porté séparément par `RoutePanel` via `onRouteChange`, pas mélangé au même degré
- Changer le comportement observable de la carte — refactor de structure interne uniquement
