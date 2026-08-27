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

Point d'attention technique : les marqueurs et tracés interactifs (marqueur
boulodrome, café, départ, polyligne d'itinéraire) propagent leur clic à
l'événement `click` de la carte par défaut (`bubblingMouseEvents`), sous
peine que le nouveau handler de clic carte ferme la fiche immédiatement après
son ouverture ou pendant qu'on consulte un café/le tracé affiché.

Ce ticket, à lui seul, corrige déjà le bug rapporté (popup masquant les
cafés/bars à proximité) : le `<Popup>` boulodrome disparaît complètement de
`BoulodromesMap.tsx`.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Sélectionner un boulodrome (clic ou activation clavier) affiche la
      Fiche avec le même contenu que l'ancien popup ; le `<Popup>` Leaflet du
      boulodrome n'existe plus dans le code.
- [x] Desktop : fiche positionnée sous la recherche et les filtres, colonne
      gauche. Mobile : fiche en bas d'écran, empilée au-dessus du
      `RoutePanel` (qui garde sa position actuelle).
- [x] Fermeture effective via le bouton "×", un clic sur une zone vide de la
      carte, et la touche Échap — les trois désélectionnent le boulodrome.
- [x] Cliquer un marqueur café pendant que la fiche est ouverte ne ferme pas
      la fiche (non-régression, même classe de bug que Phase 4).
- [x] Sélectionner un autre boulodrome remplace le contenu de la fiche sans
      clignotement ni fermeture/réouverture intermédiaire visible.
- [x] La fiche porte `role="region"` et un `aria-label` explicite ; le focus
      clavier reste sur le marqueur après activation (pas de vol de focus).
- [x] Tests ajoutés dans `BoulodromesMap.test.tsx` couvrant les points
      ci-dessus (seule la couche API est mockée, pas Leaflet).

## Comments

Implémenté via `BoulodromeDetailsPanel` (nouveau composant) +
`MapClickDeselect` (nouveau composant, clic carte) + touche Échap gérée dans
`use-boulodrome-selection.ts`. Revue via `/code-review` : deux bugs trouvés et
corrigés avant commit —

1. le point d'attention "stopper la propagation" avait été implémenté au coup
   par coup sur chaque marqueur (boulodrome/café/départ), oubliant la
   polyligne du tracé d'itinéraire elle-même — cliquer directement sur le
   tracé affiché fermait la fiche. Corrigé en centralisant la détection dans
   `MapClickDeselect` (inspection de la classe CSS `leaflet-interactive` que
   Leaflet pose lui-même sur tout calque interactif, marqueurs et Path
   confondus) plutôt que de dupliquer `L.DomEvent.stopPropagation` sur chaque
   calque présent et futur.
2. la touche Échap fermait la fiche (et démontait le `RoutePanel`, perdant sa
   recherche d'adresse/liste de candidats en cours) même quand le focus était
   dans un champ de saisie du `RoutePanel` — corrigé en ignorant Échap quand
   `document.activeElement` est un `INPUT`/`TEXTAREA`.

Les deux corrections sont couvertes par des tests de régression dans
`BoulodromesMap.test.tsx`. Vérifié aussi en navigateur réel (Playwright) :
desktop 1280px, mobile 375px, les trois chemins de fermeture, et les deux
bugs ci-dessus après correction.
