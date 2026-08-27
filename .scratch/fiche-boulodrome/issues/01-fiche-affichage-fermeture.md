# 01 — Fiche boulodrome : affichage et fermeture

**What to build:** Cliquer ou activer au clavier (Entrée/Espace) un marqueur
boulodrome ouvre la **Fiche boulodrome** — nouveau composant
`BoulodromeDetailsPanel`, positionné selon le breakpoint (desktop : colonne
gauche, sous la recherche et les filtres ; mobile : bas d'écran, empilée
au-dessus du `RoutePanel`) — au lieu du `<Popup>` Leaflet actuel. Le contenu
de la fiche reprend exactement celui du popup existant (nom, `siteName` si
distinct, adresse, équipement/sol, badge accès libre/payant), sans ajout.

La fiche se ferme via trois chemins équivalents : un bouton "×" explicite, un
clic sur une zone vide de la carte, ou la touche Échap — dans les trois cas,
`selectedBoulodromeId` repasse à `null` (même chemin que `deselectBoulodrome`
aujourd'hui, mais plus déclenché par l'événement `popupclose` de Leaflet qui
disparaît avec le popup). Sélectionner un autre boulodrome (clic, recherche,
historique) remplace directement le contenu de la fiche sans fermeture
intermédiaire visible.

Point d'attention technique : les marqueurs Leaflet propagent leur clic à
l'événement `click` de la carte par défaut (`bubblingMouseEvents`) — le
handler de clic du marqueur boulodrome doit stopper cette propagation, sous
peine que le nouveau handler de clic carte ferme la fiche immédiatement après
son ouverture. De même, cliquer un marqueur café (affiché par-dessus la zone
du boulodrome sélectionné) ne doit pas fermer la fiche.

Ce ticket, à lui seul, corrige déjà le bug rapporté (popup masquant les
cafés/bars à proximité) : le `<Popup>` boulodrome disparaît complètement de
`BoulodromesMap.tsx`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Sélectionner un boulodrome (clic ou activation clavier) affiche la
      Fiche avec le même contenu que l'ancien popup ; le `<Popup>` Leaflet du
      boulodrome n'existe plus dans le code.
- [ ] Desktop : fiche positionnée sous la recherche et les filtres, colonne
      gauche. Mobile : fiche en bas d'écran, empilée au-dessus du
      `RoutePanel` (qui garde sa position actuelle).
- [ ] Fermeture effective via le bouton "×", un clic sur une zone vide de la
      carte, et la touche Échap — les trois désélectionnent le boulodrome.
- [ ] Cliquer un marqueur café pendant que la fiche est ouverte ne ferme pas
      la fiche (non-régression, même classe de bug que Phase 4).
- [ ] Sélectionner un autre boulodrome remplace le contenu de la fiche sans
      clignotement ni fermeture/réouverture intermédiaire visible.
- [ ] La fiche porte `role="region"` et un `aria-label` explicite ; le focus
      clavier reste sur le marqueur après activation (pas de vol de focus).
- [ ] Tests ajoutés dans `BoulodromesMap.test.tsx` couvrant les points
      ci-dessus (seule la couche API est mockée, pas Leaflet).
