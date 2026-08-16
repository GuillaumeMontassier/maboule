# 16 — Couleurs bar/pub non conformes à spec.md

**What to build:** Les couleurs des marqueurs bar et pub correspondent aux tokens Tailwind décidés dans `.scratch/phase-6-ui-ux/spec.md` (`purple-500` pour bar, `orange-600` pour pub).

**Blocked by:** 08 — Icônes : harmonisation piéton/café/bar/pub

**Status:** ready-for-agent

**Origine :** Audit UI/UX du 2026-08-16 (constat E). `spec.md` fixe bar sur `purple-500` et pub sur `orange-600` — deux familles de teintes nettement séparées, issues d'une session `/grill-with-docs`. L'implémentation (`CAFE_DOT_COLOR_BY_AMENITY` dans `client/src/components/BoulodromesMap.tsx`, confirmée par le ticket 08) utilise `violet-600` et `rose-600` : deux teintes voisines dans la même zone violet/rose du cercle chromatique, plus proches l'une de l'autre que ne l'auraient été purple et orange — ce qui réduit la distinction visuelle entre les deux types que le code couleur est censé fournir.

**Décision retenue pour ce ticket :** aligner le code sur `spec.md` plutôt que documenter la dérive après coup — `spec.md` reflète un choix délibéré (issue d'une session de cadrage), alors que rien dans le ticket 08 n'explique pourquoi l'implémentation s'en est écartée. Si un contributeur préfère conserver `violet-600`/`rose-600` à la revue, mettre `spec.md` à jour dans la même PR plutôt que de laisser les deux sources diverger silencieusement.

- [ ] Le marqueur bar utilise `purple-500`, le marqueur pub utilise `orange-600` (`CAFE_DOT_COLOR_BY_AMENITY`, `client/src/components/BoulodromesMap.tsx`)
- [ ] Café et piéton (point de départ d'itinéraire) restent inchangés (`amber-600`, `blue-500` — déjà conformes à spec.md ; piéton actuellement `blue-600`, à corriger vers `blue-500` dans la foulée pour cohérence totale avec spec.md)
- [ ] Le contour blanc commun (`border-white`) et la taille des marqueurs (`iconSize`) restent inchangés — hors scope de ce ticket
- [ ] Tests étendus si nécessaire (`BoulodromesMap.test.tsx` couvre déjà la couleur appliquée par type depuis le ticket 08 — mettre à jour les valeurs attendues)
- [ ] Vérifié en navigateur réel (Playwright) : cluster réel avec plusieurs types visibles simultanément, couleurs conformes aux tokens spec.md
