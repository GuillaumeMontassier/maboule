# 34 — Disposition responsive des filtres (scroll mobile, pleine largeur desktop)

**What to build:**
- **Mobile** (< 768px) : tous les groupes de filtres + le bouton reset (ticket 35) sur une seule ligne, scroll horizontal (`overflow-x-auto`), pas de retour à la ligne
- **Desktop** (≥ 768px) : les filtres quittent leur position actuelle "à côté de la recherche" (`md:left-[300px]`) et passent sur leur propre ligne, pleine largeur, sous la barre de recherche

**Blocked by:** 31, 32 (change la largeur totale de la rangée de filtres, donc la logique de disposition doit être pensée avec le rendu final)

**Status:** done

**Origine :** Session `/grill-with-docs` du 2026-08-20. Objectif explicite de l'utilisateur : garder un maximum de visibilité sur les filtres (pas de contenu cité derrière un retour à la ligne imprévisible ou un scroll caché). Avec les pilules-groupe (31/32), la rangée est plus large qu'aujourd'hui — elle tiendrait à côté de la recherche sur un desktop large (1280px+) mais pas forcément sur un laptop/tablette (1024px) ; passer en pleine largeur sous la recherche évite ce cas limite plutôt que de le gérer au cas par cas.

- [x] `App.tsx` : bloc filtres passe de "à côté de la recherche" à "pleine largeur, sous la recherche", sur desktop comme sur mobile (même position relative aux deux tailles, seule la largeur/le scroll changent)
- [x] Mobile : `overflow-x-auto` sur le conteneur des groupes, pas de `flex-wrap`
- [x] Desktop : rangée pleine largeur, un seul groupe de filtres visible sans scroll aux largeurs desktop courantes (vérifié en navigateur, pas juste supposé)
- [x] Mettre à jour `client/src/constants/searchFiltersLayout.ts` (`MOBILE_SEARCH_FILTERS_HEIGHT_PX`) si la nouvelle disposition change la hauteur mesurée du bloc recherche+filtres empilé en mobile (utilisé pour l'auto-pan des popups, ticket 12)
- [x] Vérifié en navigateur réel (Playwright) : 375px (scroll horizontal fonctionnel, pas de contenu tronqué), 768px et 1280px (pleine largeur, pas de scroll nécessaire), aucun chevauchement avec les autres panneaux (recherche, popups, contrôles de zoom)

**Détails d'implémentation :** `App.tsx` — le conteneur des filtres passe de `top-14 left-1/2 w-[280px] -translate-x-1/2 flex-wrap` + overrides `md:` (côte à côte) à une seule classe `fixed top-14 left-3 right-3 flex-row flex-nowrap items-center gap-1.5 overflow-x-auto`, appliquée identiquement aux deux tailles d'écran — c'est le contenu (scroll ou non) qui diffère selon la largeur disponible, pas la position. `shrink-0` ajouté sur le conteneur de chaque groupe (`PillFilterGroup.tsx`, `AccessFilter.tsx`) : sans lui, `flex-nowrap` aurait compressé les pilules au lieu de les laisser déborder dans la zone de scroll.

Conséquence sur `popup-auto-pan.ts` (ticket 12) : la recherche et les filtres sont désormais empilés à *toutes* les tailles d'écran (plus seulement en mobile), donc la marge haute réservée pour l'auto-pan des popups Leaflet ne peut plus retomber sur la petite marge par défaut (16px) en desktop — elle doit refléter le nouvel empilement aux deux tailles. Mesuré en navigateur (Playwright, `getBoundingClientRect`) : 103px à 375px (barre de défilement horizontale native incluse), 88px à 768px et 1280px (pas de débordement, donc pas de barre). Arrondis à la hausse en `MOBILE_SEARCH_FILTERS_HEIGHT_PX = 105` et `DESKTOP_SEARCH_FILTERS_HEIGHT_PX = 90` (nouvelle constante, remplace l'ancien fallback `16` codé en dur). Revérifié en cliquant un marqueur proche du haut de la carte en mobile (375px) : popup entièrement visible, aucun chevauchement avec la rangée de filtres ni le RoutePanel en bas.

Suite de tests client verte (110 tests, y compris `popup-auto-pan.test.ts` mis à jour avec les nouvelles valeurs), `tsc -b` sans erreur.

**Out of scope :**
- Le contenu des groupes eux-mêmes (31/32)
