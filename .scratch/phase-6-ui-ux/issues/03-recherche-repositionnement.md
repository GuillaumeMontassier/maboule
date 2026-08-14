# 03 — Barre de recherche : repositionnement responsive

**What to build:** La barre de recherche de boulodrome se repositionne selon la taille d'écran : centrée en haut sur mobile, alignée à gauche sur desktop.

**Blocked by:** 01 — Mise en place de Tailwind CSS

**Status:** done

- [x] En dessous de 768px de large, la barre de recherche est centrée horizontalement —
      `left-1/2 -translate-x-1/2` sur le conteneur (`client/src/components/BoulodromeSearch.tsx`),
      annulé à partir du breakpoint `md` de Tailwind ; vérifié en navigateur (dev server, API
      mockée en l'absence de Postgres local sur cette machine — cf. ticket 02) : centrage exact
      confirmé par mesure de `getBoundingClientRect` à 375px et 767px de large
- [x] À 768px et au-delà, la barre de recherche est alignée à gauche (comportement actuel) —
      `md:left-3 md:translate-x-0` ; vérifié : `left: 12px` exactement à 768px de large (breakpoint
      `md` par défaut de Tailwind, qui correspond au 768px du spec sans configuration dédiée)
- [x] Le composant est migré vers Tailwind (plus de dépendance aux règles CSS dédiées dans `App.css`) —
      classes utilitaires Tailwind sur tous les éléments du composant, règles `.boulodrome-search*`
      supprimées d'`App.css`
- [x] Aucune régression sur la recherche elle-même (soumission, affichage des résultats) —
      vérifié en navigateur (soumission, affichage des résultats, sélection d'un résultat) ; test
      existant (`BoulodromeSearch.test.tsx`) toujours au vert

Revu via `/code-review` : deux corrections apportées (curseur `pointer` manquant sur les boutons de
résultat, disparu avec la règle CSS supprimée ; classes Tailwind de la card "statut" dupliquées
trois fois, factorisées en une constante partagée). Deux points relevés mais non traités car hors
scope de ce ticket : chevauchement avec `.filters-bar` sur mobile (couvert par les tickets 06/09) et
largeur `280px` en valeur arbitraire dupliquée avec `.route-panel` (prématuré tant qu'un seul
composant est migré vers Tailwind).
