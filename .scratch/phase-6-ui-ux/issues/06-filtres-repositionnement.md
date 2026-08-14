# 06 — Filtres : repositionnement responsive

**What to build:** Les filtres (nature du sol, type d'équipement, accès libre/payant) se repositionnent selon la taille d'écran, en cohérence avec la nouvelle position de la barre de recherche.

**Blocked by:** 01 — Mise en place de Tailwind CSS, 03 — Barre de recherche : repositionnement responsive

**Status:** done

- [x] En desktop, les filtres sont affichés à droite de la barre de recherche, sur la même rangée horizontale —
      conteneur des filtres (`client/src/App.tsx`) en `md:top-3 md:left-[300px]` (barre de recherche à
      `left-3`/12px + 280px de large + 8px de marge) ; vérifié en navigateur à 1280px : rectangles mesurés via
      `getBoundingClientRect`, barre de recherche `x:12 y:12 w:280 h:34`, filtres `x:300 y:12` — même rangée,
      aucun chevauchement
- [x] En mobile, les filtres sont affichés sous la barre de recherche, avec la même largeur qu'elle —
      conteneur centré comme la barre de recherche (`left-1/2 -translate-x-1/2 w-[280px]`), `top-14` (56px,
      sous les 34px de la barre + marge) ; vérifié à 500px et 375px de large : mêmes `x`/`width` que la barre
      de recherche sur les deux, `top` du bloc filtres juste après le `bottom` de la barre (46px → 56px)
- [x] Les composants de filtre sont migrés vers Tailwind — `CheckboxFilter.tsx` et `FreeAccessFilter.tsx`
      migrés (classes utilitaires reproduisant `.checkbox-filter` : `rounded-lg border border-gray-300
      bg-white px-3 py-2 shadow-sm`), règles `.filters-bar` et `.checkbox-filter*` supprimées d'`App.css`
- [x] Aucune régression sur le comportement des filtres (sélection, effet sur les résultats affichés) —
      vérifié en navigateur (API mockée en l'absence de Postgres local sur cette machine, cf. ticket 03) :
      cochage d'une case déclenche bien un nouveau fetch avec le filtre appliqué ; suite de tests existante
      (`App.test.tsx`, sélection sur les trois filtres) toujours au vert

Revu via `/code-review` : un point relevé, non traité (même famille que le point laissé ouvert sur le
ticket 03) — la position des filtres (`top-14`, `md:left-[300px]`) est dérivée à la main de la géométrie de
la barre de recherche (`top-3`, `left-3`, `w-[280px]`) sans valeur partagée ; si cette dernière change, les
filtres se désaligneront silencieusement. Prématuré tant qu'un seul autre composant partage cette contrainte
de position.
