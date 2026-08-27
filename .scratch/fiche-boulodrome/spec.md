Status: ready-for-agent

# Fiche boulodrome — déport de la popup de sélection

## Problem Statement

Quand un utilisateur clique sur un boulodrome, la popup Leaflet qui s'ouvre
au-dessus du pin masque les cafés/bars à proximité qui s'affichent
automatiquement au même moment (Phase 4) — l'exploration du voisinage
devient impossible tant que la popup reste ouverte, ce qui va à l'encontre
du but même de cette fonctionnalité.

## Solution

Remplacer la popup Leaflet du boulodrome sélectionné par une **Fiche
boulodrome** déportée hors de la carte, reprenant exactement le même
contenu : desktop, colonne gauche sous la recherche et les filtres ;
mobile, bas d'écran, empilée au-dessus du panneau Itinéraire (`RoutePanel`,
inchangé par ailleurs). Le marqueur sélectionné reçoit une icône distincte
(inspirée du favicon de l'app) pour rester identifiable sans popup
au-dessus. La fermeture (× explicite, clic carte, Échap) et le recentrage
automatique (`flyTo`) sont ajustés en conséquence.

## User Stories

1. En tant qu'utilisateur, je veux voir les cafés/bars à proximité d'un
   boulodrome sélectionné sans qu'ils soient masqués par ses informations,
   afin de pouvoir explorer le voisinage.
2. En tant qu'utilisateur, je veux consulter les infos détaillées d'un
   boulodrome sélectionné (nom, site, adresse, équipement/sol, accès
   libre/payant) dans un endroit stable de l'écran, afin de les lire sans
   qu'elles bougent avec le pan/zoom de la carte.
3. En tant qu'utilisateur desktop, je veux que la fiche apparaisse sous la
   recherche et les filtres, sur la gauche, afin de garder une disposition
   cohérente avec les autres panneaux.
4. En tant qu'utilisateur mobile, je veux que la fiche apparaisse en bas de
   l'écran, au-dessus du panneau Itinéraire, afin de la voir sans qu'elle
   recouvre toute la carte.
5. En tant qu'utilisateur, je veux fermer la fiche via un bouton "×"
   explicite.
6. En tant qu'utilisateur, je veux fermer la fiche en cliquant sur une zone
   vide de la carte, afin de retrouver le comportement habituel d'une
   popup qui se ferme au clic ailleurs.
7. En tant qu'utilisateur clavier, je veux fermer la fiche avec la touche
   Échap.
8. En tant qu'utilisateur, je veux repérer visuellement, sur la carte,
   quel boulodrome est actuellement sélectionné, même sans popup au-dessus
   de son marqueur.
9. En tant qu'utilisateur, je veux que la carte se recentre automatiquement
   sur le boulodrome sélectionné sans que son pin se retrouve caché sous un
   panneau (fiche, RoutePanel, recherche, filtres).
10. En tant qu'utilisateur, je veux que le panneau Itinéraire continue de
    s'afficher automatiquement à la sélection comme aujourd'hui — aucun
    changement de comportement sur ce point.
11. En tant qu'utilisateur de lecteur d'écran, je veux pouvoir repérer la
    fiche par son rôle/label quand j'y navigue, sans que le focus me soit
    arraché du marqueur au moment de la sélection.
12. En tant qu'utilisateur, je veux que cliquer sur un marqueur café pendant
    que la fiche est ouverte ne ferme pas la fiche par erreur (même classe
    de bug que celle déjà corrigée pour l'ancienne popup, cf. Phase 4).
13. En tant qu'utilisateur, je veux que sélectionner un autre boulodrome
    (clic, recherche ou historique) remplace le contenu de la fiche sans
    fermeture/réouverture perturbante.
14. En tant qu'utilisateur clavier, je veux activer un marqueur boulodrome
    au clavier (Entrée/Espace) et voir la fiche s'ouvrir, comme le fait la
    popup aujourd'hui.
15. En tant qu'utilisateur, je veux continuer à ouvrir la popup individuelle
    d'un café/bar en cliquant sur son marqueur, comportement inchangé.
16. En tant qu'utilisateur, je ne veux pas voir d'information nouvelle par
    rapport à ce qu'affichait déjà la popup — ce changement ne fait que
    déplacer l'affichage, pas l'enrichir.

## Implementation Decisions

- **Nouveau composant** `BoulodromeDetailsPanel` : affiche le contenu
  actuellement dans le `<Popup>` boulodrome de `BoulodromesMap.tsx` (nom,
  `siteName` via `distinctSiteName`, adresse, équipement/sol, badge accès
  libre/payant) à l'identique, sans ajout. Un seul composant responsive
  (classes Tailwind par breakpoint), pas de variante desktop/mobile
  séparée — même approche que `BoulodromeSearch`/`RoutePanel`. Réutilise
  les classes de style partagées existantes (`FLOATING_SURFACE_CLASS`) et
  le style de bouton icône (`ICON_BUTTON_CLASS`) pour le bouton de
  fermeture, plutôt que d'introduire un nouveau système visuel.
- **Nouvelle constante de layout** (même famille que
  `constants/routePanelLayout.ts`) portant la géométrie de la fiche
  (largeur/marge/hauteur max), partagée entre ses classes Tailwind et le
  calcul de recentrage ci-dessous — pas de valeurs dupliquées.
- **`BoulodromesMap.tsx`** : suppression complète du `<Popup>` sur le
  `<Marker>` boulodrome. Rendu de `<BoulodromeDetailsPanel>` à côté de
  `<RoutePanel>`, tous deux gatés sur `selectedBoulodromeId` ; ordre
  d'empilement mobile fiche puis RoutePanel (fiche visuellement au-dessus,
  la plus proche du bord bas) ; desktop, colonne gauche sous
  recherche/filtres pour la fiche, RoutePanel conservant sa position bas-gauche
  actuelle (zones distinctes, pas de collision).
- **Icône du marqueur sélectionné** : nouveau `L.divIcon` (aux côtés de
  `cafeIcon`/`routeStartIcon` dans `BoulodromesMap.tsx`), inspiré de
  `public/favicon.svg` (épingle rouge, anneau blanc, boule grise) —
  simplifié pour la taille marqueur (pas de gravure en croix, illisible à
  cette échelle). Appliqué uniquement au marqueur dont l'id correspond à
  `selectedBoulodromeId` ; les autres gardent l'icône Leaflet par défaut
  (`L.Icon.Default`, inchangée).
- **Fermeture** (`use-boulodrome-selection.ts`) : `deselectBoulodrome`
  devient le seul chemin de fermeture, déclenché par trois sources : le
  bouton "×" de la fiche, un clic sur une zone vide de la carte
  (nouveau : aucun handler de ce type n'existe aujourd'hui — à créer,
  ex. `useMapEvent('click', ...)`), et la touche Échap (nouveau listener
  clavier). L'ancien chemin `popupclose` disparaît avec la popup
  boulodrome elle-même. Point d'attention : les marqueurs Leaflet
  propagent leur clic à l'événement `click` de la carte par défaut
  (`bubblingMouseEvents`) — le handler de clic marqueur boulodrome doit
  stopper cette propagation, sous peine de fermer la fiche immédiatement
  après l'avoir ouverte.
- **Recentrage (`flyTo`)** dans `selectBoulodrome` : doit tenir compte de
  l'espace occupé par les panneaux (fiche + RoutePanel + recherche +
  filtres) pour que le pin sélectionné ne finisse pas caché dessous — même
  principe que `computePopupAutoPanPadding` (`lib/popup-auto-pan.ts`),
  probablement via une fonction sœur ou une extension de celle-ci,
  réutilisant les mêmes constantes de layout plutôt que des marges
  déconnectées.
- **Popups café** : inchangées (toujours des `<Popup>` Leaflet
  individuelles, ouvertes au clic). `computePopupAutoPanPadding` doit
  cependant aussi réserver l'espace occupé par la nouvelle fiche (colonne
  gauche desktop / bas d'écran mobile), en plus des marges déjà réservées
  pour RoutePanel et recherche/filtres.
- **Accessibilité** : conteneur de la fiche avec `role="region"` +
  `aria-label` explicite (ex. "Détails du boulodrome sélectionné") ; aucun
  déplacement de focus à l'ouverture ; pas de `aria-live`. Bouton de
  fermeture avec `aria-label` dédié.
- **RoutePanel** : comportement inchangé (montage automatique à la
  sélection, `key={selectedBoulodromeId}`), seule sa position dans l'ordre
  d'empilement visuel change en mobile (désormais sous la fiche).

## Testing Decisions

- Tester le comportement observable (présence/contenu de la fiche dans le
  DOM, icône du marqueur sélectionné, ordre d'empilement fiche/RoutePanel,
  fermeture effective après ×/clic carte/Échap) plutôt que les détails
  d'implémentation internes (pas d'assertion sur l'état interne du hook).
- **Seam principal** : `client/src/components/BoulodromesMap.test.tsx`
  (fichier existant, étendu) — seule la couche API est mockée
  (`fetchCafesNearBoulodrome`, `fetchBoulodromes`, `fetchRoute`,
  `fetchGeocodeCandidates`), jamais Leaflet lui-même, même approche que les
  tests café/itinéraire déjà en place. Nouveaux cas à couvrir : ouverture
  de la fiche au clic/activation clavier d'un marqueur avec le contenu
  attendu ; fiche et RoutePanel tous deux présents et dans l'ordre attendu ;
  fermeture de la fiche sur clic "×", clic carte, et touche Échap ; icône
  distincte du marqueur sélectionné vs un marqueur non sélectionné ; clic
  sur un marqueur café pendant que la fiche est ouverte ne la ferme pas
  (non-régression, même classe de bug que Phase 4).
- **Seam secondaire** : toute fonction pure extraite pour le calcul de
  marge du `flyTo` reçoit son propre fichier `*.test.ts` sous `lib/`, testé
  sans mock ni DOM, même pattern que `popup-auto-pan.test.ts`/
  `site-name.test.ts`.
- Pas de fichier de test dédié pour `BoulodromeDetailsPanel` — même choix
  que pour `RoutePanel`, qui n'en a pas et n'est exercé que via
  `BoulodromesMap.test.tsx`.

## Out of Scope

- Le bouton "Itinéraire" à la demande dans la fiche (qui activerait le
  `RoutePanel` au lieu de son affichage automatique actuel) — décision
  explicitement reportée à une future session (cf. ROADMAP.md, Phase 6).
- Le déport des popups café/bar individuelles — restent des popups Leaflet
  classiques, ouvertes au clic, inchangées.
- Tout enrichissement du contenu de la fiche au-delà de ce qu'affichait
  déjà la popup (ex. nombre de cafés à proximité listé dans la fiche).
- Le mode sombre du fond de carte (sujet distinct, déjà en attente
  ailleurs dans le ROADMAP).

## Further Notes

- Terme canonique ajouté au glossaire (`CONTEXT.md`) : **Fiche
  boulodrome** — à utiliser dans les tickets, le code et les messages de
  commit plutôt que "popup", "card" ou "panneau détail".
- Pas d'ADR nécessaire : décision réversible (mise en page), déjà
  précédée par un cas similaire (`RoutePanel` comme panneau déporté) — ne
  remplit pas les trois critères (difficile à annuler / surprenant / vrai
  arbitrage) requis pour en justifier un.
- Fait vérifié en amont (pas une supposition) : aucun handler de clic
  carte pour désélectionner n'existe aujourd'hui dans le code — à créer
  en prenant soin d'éviter la fermeture immédiate provoquée par le
  bubbling par défaut d'un clic sur un marqueur boulodrome vers
  l'événement `click` de la carte.
- Spec issue d'une session `/grill-with-docs` avec l'auteur du projet
  (2026-08-27).
