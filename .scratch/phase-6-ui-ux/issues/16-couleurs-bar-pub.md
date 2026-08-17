# 16 — Couleurs bar/pub non conformes à spec.md

**What to build:** Les couleurs des marqueurs bar et pub correspondent aux tokens Tailwind décidés dans `.scratch/phase-6-ui-ux/spec.md` (`purple-500` pour bar, `orange-600` pour pub).

**Blocked by:** 08 — Icônes : harmonisation piéton/café/bar/pub

**Status:** done

**Origine :** Audit UI/UX du 2026-08-16 (constat E). `spec.md` fixe bar sur `purple-500` et pub sur `orange-600` — deux familles de teintes nettement séparées, issues d'une session `/grill-with-docs`. L'implémentation (`CAFE_DOT_COLOR_BY_AMENITY` dans `client/src/components/BoulodromesMap.tsx`, confirmée par le ticket 08) utilise `violet-600` et `rose-600` : deux teintes voisines dans la même zone violet/rose du cercle chromatique, plus proches l'une de l'autre que ne l'auraient été purple et orange — ce qui réduit la distinction visuelle entre les deux types que le code couleur est censé fournir.

**Décision retenue pour ce ticket :** aligner le code sur `spec.md` plutôt que documenter la dérive après coup — `spec.md` reflète un choix délibéré (issue d'une session de cadrage), alors que rien dans le ticket 08 n'explique pourquoi l'implémentation s'en est écartée. Si un contributeur préfère conserver `violet-600`/`rose-600` à la revue, mettre `spec.md` à jour dans la même PR plutôt que de laisser les deux sources diverger silencieusement.

- [x] Le marqueur bar utilise `purple-500`, le marqueur pub utilise `orange-600` (`CAFE_DOT_COLOR_BY_AMENITY`, `client/src/components/BoulodromesMap.tsx`)
- [x] Café et piéton (point de départ d'itinéraire) restent inchangés (`amber-600`, `blue-500` — déjà conformes à spec.md ; piéton corrigé de `blue-600` vers `blue-500` dans la foulée pour cohérence totale avec spec.md)
- [x] Le contour blanc commun (`border-white`) et la taille des marqueurs (`iconSize`) restent inchangés — hors scope de ce ticket
- [x] Tests étendus si nécessaire (`BoulodromesMap.test.tsx` couvre déjà la couleur appliquée par type depuis le ticket 08 — valeurs attendues mises à jour)
- [x] Vérifié en navigateur réel (Playwright) : boulodrome Square Courteline (id `data-es:E001I751120018`), 6 cafés à proximité dans un rayon de 200m couvrant les 3 types simultanément — couleurs computées confirmées via `getComputedStyle` : bar `oklch(0.627 0.265 303.9)` (purple-500), pub `oklch(0.646 0.222 41.116)` (orange-600), café `oklch(0.666 0.179 58.318)` (amber-600), conformes aux tokens spec.md

## Comments

Le code (`CAFE_DOT_COLOR_BY_AMENITY`, couleur piéton) et les tests attendus étaient déjà passés à `purple-500`/`orange-600`/`blue-500` dans le commit `aa180a4` (2026-08-16, tickets 13-16 groupés), mais ce ticket n'avait pas été marqué comme terminé et la vérification navigateur restait à faire. Vérification Playwright effectuée le 2026-08-17 : cases cochées, statut passé à `done`.
