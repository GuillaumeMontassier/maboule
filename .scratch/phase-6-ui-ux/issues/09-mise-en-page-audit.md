# 09 — Mise en page générale : audit des chevauchements + finalisation Tailwind

**What to build:** Audit et correction des chevauchements entre panneaux (recherche, historique, filtres, popups, panneau Itinéraire, contrôles de zoom) sur les tailles d'écran mobile et desktop ; migration des derniers composants pas encore passés à Tailwind.

**Blocked by:** 01 — Mise en place de Tailwind CSS, 03 — Barre de recherche : repositionnement responsive, 06 — Filtres : repositionnement responsive, 07 — Contrôles de carte : zoom en bas à droite

**Status:** done

- [x] Le panneau Itinéraire (RoutePanel) et le contenu des popups (badges libre/payant, distance des cafés) sont migrés vers Tailwind —
      `RoutePanel.tsx` reprend le même chrome visuel que les autres panneaux
      (`rounded-lg border-gray-300 bg-white shadow-sm`, cf.
      `STATUS_CARD_CLASS` de `BoulodromeSearch.tsx`) ; badges de popup
      (`BoulodromesMap.tsx`) migrés vers les couleurs Tailwind exactes
      correspondant aux anciennes valeurs hex (`green-100`/`green-800`,
      `amber-100`/`amber-800`) et factorisés dans une constante
      `POPUP_BADGE_CLASS` partagée entre le badge libre/payant et le nouveau
      badge de distance des cafés ; règles `.route-panel*` et `.access-badge*`
      supprimées d'`App.css`
- [x] Sur mobile comme sur desktop, aucun panneau flottant ne chevauche un autre panneau flottant dans son état par défaut (recherche + filtres + zoom visibles simultanément) —
      vérifié en navigateur (Playwright, API/DB réelles) à 375px/768px/1280px :
      `getBoundingClientRect` sur recherche, filtres et contrôle de zoom, aucun
      chevauchement aux trois largeurs
- [x] Ouvrir le popup d'un boulodrome avec le panneau Itinéraire affiché ne crée pas de chevauchement illisible sur les petits écrans —
      bug trouvé : l'auto-pan de Leaflet ignore `RoutePanel` (overlay React
      par-dessus la carte, invisible du mécanisme d'auto-pan qui ne connaît
      que les limites du conteneur carte) ; un popup ouvert près du bord
      bas-gauche pouvait donc se retrouver visuellement sous le panneau
      (z-index plus élevé) au lieu d'être repoussé par l'auto-pan. Corrigé via
      `autoPanPaddingTopLeft`/`autoPanPaddingBottomRight` sur les popups
      (boulodrome et café), calculés à partir d'une géométrie du panneau
      centralisée dans `client/src/constants/routePanelLayout.ts` (largeur,
      marge, hauteur max mesurée dans l'état le plus grand du panneau — choix
      d'une adresse ambiguë) plutôt que des constantes déconnectées ;
      `RoutePanel` gagne aussi un `max-w-[calc(100vw-96px)]` pour ne jamais
      chevaucher les contrôles de zoom sur les écrans les plus étroits ;
      vérifié en navigateur réel : aucun chevauchement popup/RoutePanel sur
      une douzaine de marqueurs différents testés à 375px, y compris dans
      l'état le plus grand du panneau
- [x] Vérification manuelle sur au moins 3 largeurs d'écran (mobile étroit, tablette, desktop) —
      375px / 768px / 1280px, cf. points ci-dessus

Revu via `/code-review` : deux signalements écartés après vérification empirique (CSS `calc()`
compilé correctement par Tailwind v4 malgré l'absence d'espaces autour de `-` dans la classe
arbitraire — confirmé en inspectant le CSS généré ; clic réel sur un marqueur transfère le focus
et ferme le dropdown de recherche avant l'ouverture du popup — confirmé en navigateur, donc pas de
chevauchement popup/dropdown possible dans ce flux). Deux corrections apportées : classes Tailwind
du badge de popup dupliquées entre libre/payant et distance des cafés, factorisées
(`POPUP_BADGE_CLASS`) ; marge d'auto-pan des popups reliée à la géométrie réelle du RoutePanel via
une constante partagée (`client/src/constants/routePanelLayout.ts`) plutôt que des valeurs
déconnectées. Point non traité : `cafeIcon()` reconstruit un `L.DivIcon` à chaque rendu au lieu
d'être mémoïsé par type d'établissement — préexistant au ticket 08, hors scope de cet audit.
