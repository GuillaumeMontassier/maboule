# 37 — Le message de chargement fait clignoter la carte à chaque pan/zoom

**What to build:** Remplacer le bloc `.status`/`.status-error` (`App.css`, `height: 100vh`, flux normal) par une petite carte flottante (famille `FLOATING_SURFACE_CLASS`, ticket 30), et distinguer le premier chargement (bloquant, aucune donnée à montrer) du rechargement en arrière-plan déclenché par pan/zoom (silencieux en cas de succès, indicateur transitoire en cas d'échec seulement).

**Blocked by:** aucun

**Status:** done

**Origine :** Session `/grill-with-docs` du 2026-08-25, suite à un signalement utilisateur après le ticket 36 (chargement de la carte par viewport/bbox) : la carte clignote à chaque déplacement/zoom. Cause vérifiée dans le code, pas juste visuelle : `.status`/`.status-error` (`client/src/App.css:19-38`) datent de l'architecture *avant* le ticket 36, où ce bloc plein-écran remplaçait la carte (rendu conditionnel `loading`/`success`/`error`). Le ticket 36 a rendu `BoulodromesMap` toujours monté mais n'a jamais adapté ce bloc — désormais `isFetching`/`error` (`client/src/hooks/use-boulodromes.ts`) passent à vrai à *chaque* fetch bbox, y compris chaque `moveend` debouncé (pan/zoom), pas seulement le tout premier chargement. Le bloc `height: 100vh` s'insère alors en flux normal avant `<BoulodromesMap>`, repoussant la carte (elle aussi `100vh`) hors de l'écran à chaque rechargement. Les marqueurs eux-mêmes ne clignotent pas (`rawData`/`features` ne sont jamais vidés pendant un fetch, cf. ticket 36) — le problème est isolé à ce bloc. Voir l'addendum sur [ADR 0004](../../../docs/adr/0004-viewport-bbox-fetching-for-boulodromes-map.md), qui avait anticipé ce risque sous "Considered Options" sans en préciser la cause exacte.

- [x] `.status`/`.status-error` (`client/src/App.css`) supprimés — plus aucun bloc `height: 100vh` pour l'état de chargement/erreur
- [x] Premier chargement (aucune donnée reçue depuis le montage) : petite carte flottante (`FLOATING_SURFACE_CLASS`) affichée pendant le chargement, remplacée par la même carte en style d'erreur (`STATUS_ERROR_TEXT_CLASS`, `client/src/components/surfaceStyles.ts`) si le premier fetch échoue
- [x] Rechargement en arrière-plan (pan/zoom, un premier chargement déjà réussi) :
  - [x] Succès : aucun indicateur, aucun changement visible hormis les marqueurs qui se mettent à jour
  - [x] Échec : carte flottante transitoire (même famille visuelle), disparaît automatiquement dès qu'un fetch ultérieur réussit — pas de timeout arbitraire, le prochain pan/zoom retente naturellement
  - [x] Les marqueurs déjà chargés restent affichés pendant et après un échec de rechargement (déjà le comportement de `useBoulodromes`, non régressé)
- [x] `useBoulodromes` (`client/src/hooks/use-boulodromes.ts`) distingue explicitement "premier chargement" de "rechargement" via un état `BoulodromesState` discriminé (`initial-loading`/`initial-error`/`ready`), pas `rawData.features.length === 0`
- [x] Tests : `use-boulodromes.test.ts` (22 tests — transitions d'état, `describeBoulodromesState` colocalisée avec le type dont la carte flottante d'`App.tsx` derive son affichage, y compris le cas limite d'un message d'erreur vide), `App.test.tsx` (chargement/erreur initiaux, disparition du message une fois chargé)
- [x] Vérifié en navigateur réel (serveur + DB locaux) : plus de flash plein-écran en panoramique/zoom répété (confirmé via `document.body.scrollHeight === window.innerHeight`), carte transitoire d'erreur qui apparaît puis se retire au prochain succès, premier chargement en échec, light et dark mode

**Out of scope :**
- Revoir le choix bbox-scope lui-même (ADR 0004) — la cause du clignotement est un bug d'implémentation (bloc jamais adapté au montage permanent de la carte), pas un défaut de l'approche
- Annonce accessible (`aria-live`) de l'état de chargement — aucun précédent dans le codebase actuel, laissé pour un ticket dédié si besoin
- Position exacte (pixel) de la nouvelle carte flottante — choisie en implémentation, cohérente avec les panneaux existants (recherche, filtres, `RoutePanel`, `ThemeToggle`)
