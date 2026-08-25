# 34 — Disposition responsive des filtres (scroll mobile, pleine largeur desktop)

**What to build:**
- **Mobile** (< 768px) : tous les groupes de filtres + le bouton reset (ticket 35) sur une seule ligne, scroll horizontal (`overflow-x-auto`), pas de retour à la ligne
- **Desktop** (≥ 768px) : les filtres quittent leur position actuelle "à côté de la recherche" (`md:left-[300px]`) et passent sur leur propre ligne, pleine largeur, sous la barre de recherche

**Blocked by:** 31, 32 (change la largeur totale de la rangée de filtres, donc la logique de disposition doit être pensée avec le rendu final)

**Status:** done

**Origine :** Session `/grill-with-docs` du 2026-08-20. Objectif explicite de l'utilisateur : garder un maximum de visibilité sur les filtres (pas de contenu cité derrière un retour à la ligne imprévisible ou un scroll caché). Avec les pilules-groupe (31/32), la rangée est plus large qu'aujourd'hui — elle tiendrait à côté de la recherche sur un desktop large (1280px+) mais pas forcément sur un laptop/tablette (1024px) ; passer en pleine largeur sous la recherche évite ce cas limite plutôt que de le gérer au cas par cas.

- [x] `App.tsx` : bloc filtres passe de "à côté de la recherche" à "pleine largeur, sous la recherche", sur desktop comme sur mobile (même position relative aux deux tailles, seule la largeur/le scroll changent) — une seule classe partagée (`top-14 left-3 right-3`, aucun override `md:`), position garantie identique aux deux tailles plutôt que juste vérifiée
- [x] Mobile : `overflow-x-auto` sur le conteneur des groupes, pas de `flex-wrap`
- [x] Desktop : rangée pleine largeur, un seul groupe de filtres visible sans scroll aux largeurs desktop courantes (vérifié en navigateur, pas juste supposé) — 768px et 1280px : `scrollWidth === clientWidth`, pas de scroll
- [x] Mettre à jour `client/src/constants/searchFiltersLayout.ts` (`MOBILE_SEARCH_FILTERS_HEIGHT_PX`) si la nouvelle disposition change la hauteur mesurée du bloc recherche+filtres empilé en mobile (utilisé pour l'auto-pan des popups, ticket 12) — 300 → 90 (mesuré : 88px), `popup-auto-pan.test.ts` mis à jour en conséquence
- [x] Vérifié en navigateur réel : 375px (scroll horizontal fonctionnel — `scrollWidth` 741px > `clientWidth` 351px, `scrollLeft` révèle "Accès" en entier, pas de contenu tronqué), 768px et 1280px (pleine largeur, pas de scroll nécessaire), aucun chevauchement avec les autres panneaux (contrôles de zoom : filtres jusqu'à 88px, zoom à partir de 607px ; dropdown de recherche : `z-[1100]` passe toujours au-dessus des filtres `z-[1000]`, précédent ticket 25 inchangé), light et dark mode

**Out of scope :**
- Le contenu des groupes eux-mêmes (31/32)
