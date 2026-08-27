# 02 — Icône dédiée pour le marqueur sélectionné

**What to build:** Le marqueur du boulodrome actuellement sélectionné
affiche une icône dédiée (`L.divIcon`, aux côtés de `cafeIcon`/
`routeStartIcon` dans `BoulodromesMap.tsx`), inspirée de `public/favicon.svg`
(épingle rouge, anneau blanc, boule grise), simplifiée pour la taille
marqueur (pas de gravure en croix, illisible à cette échelle). Tous les
autres marqueurs boulodrome gardent l'icône Leaflet par défaut
(`L.Icon.Default`, inchangée). Sans popup au-dessus du pin (cf. ticket 01),
c'est le seul indice visuel sur la carte du boulodrome sélectionné.

**Blocked by:** 01 — Fiche boulodrome : affichage et fermeture (même zone de
`BoulodromesMap.tsx`, s'appuie sur le handler de clic marqueur retravaillé en
01).

**Status:** ready-for-agent

- [ ] Le marqueur du boulodrome dont l'id correspond à `selectedBoulodromeId`
      utilise le nouveau `divIcon` ; tous les autres gardent l'icône par
      défaut.
- [ ] Changer de sélection déplace bien l'icône dédiée vers le nouveau
      marqueur sélectionné (l'ancien reprend l'icône par défaut).
- [ ] Test ajouté dans `BoulodromesMap.test.tsx` vérifiant que l'icône (ou sa
      classe/html) du marqueur sélectionné diffère de celle d'un marqueur non
      sélectionné.
