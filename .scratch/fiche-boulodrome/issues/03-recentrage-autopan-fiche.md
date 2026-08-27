# 03 — Recentrage et auto-pan tenant compte de la fiche

**What to build:** Le recentrage automatique de la carte (`flyTo`, dans
`selectBoulodrome`) et l'auto-pan des popups café (`computePopupAutoPanPadding`,
`lib/popup-auto-pan.ts`) réservent désormais l'espace occupé par la Fiche
boulodrome (colonne gauche desktop / bas d'écran mobile), en plus des marges
déjà réservées pour `RoutePanel` et le bloc recherche/filtres. Objectif :
qu'aucun pin sélectionné ni aucune popup café ne se retrouve visuellement
caché sous un panneau.

Nouvelle constante de layout pour la fiche (même famille que
`constants/routePanelLayout.ts`), partagée entre les classes Tailwind de
`BoulodromeDetailsPanel` (ticket 01) et ce calcul de marge — pas de valeurs
dupliquées entre les deux usages.

**Blocked by:** 01 — Fiche boulodrome : affichage et fermeture (a besoin de
la géométrie finale de la fiche, posée par ce ticket, pour calculer les
marges).

**Status:** ready-for-agent

- [ ] Nouvelle constante de layout pour la fiche (largeur/marge/hauteur max),
      réutilisée à la fois pour son positionnement CSS et pour le calcul de
      marge ci-dessous.
- [ ] `computePopupAutoPanPadding` (ou une fonction sœur) réserve l'espace de
      la fiche en plus des marges déjà réservées pour RoutePanel et
      recherche/filtres.
- [ ] Le `flyTo` déclenché à la sélection d'un boulodrome applique cette
      marge, pour que le pin sélectionné n'atterrisse pas sous un panneau.
- [ ] Tests unitaires purs ajoutés sous `lib/*.test.ts` pour la nouvelle
      logique de marge, sans mock ni DOM (même pattern que
      `popup-auto-pan.test.ts`).
