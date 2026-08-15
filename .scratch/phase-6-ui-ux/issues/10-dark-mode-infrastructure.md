# 10 — Dark mode : infrastructure + bouton de bascule

**What to build:** Un bouton de bascule dark mode, placé à côté des contrôles de zoom en bas à droite, qui change le thème de l'application, persiste le choix, et respecte la préférence système par défaut au premier chargement.

**Blocked by:** 07 — Contrôles de carte : zoom en bas à droite

**Status:** done

- [x] Un bouton visible près des contrôles de zoom bascule entre thème clair et sombre —
      `ThemeToggle.tsx`, positionné en `fixed` bas-droite (`right-3 bottom-24`) : au-dessus des
      contrôles de zoom Leaflet (bas-droite, ticket 07) avec une marge généreuse plutôt qu'un
      calcul au pixel près (la hauteur du contrôle Leaflet varie selon le support tactile détecté,
      ~52px en souris / ~64px en tactile) ; vérifié en navigateur (Playwright, mode tactile —
      l'hypothèse la plus large) : aucun chevauchement
- [x] Le choix est mémorisé (`localStorage`) et réappliqué au rechargement de la page — hook
      `useTheme` (`client/src/hooks/use-theme.ts`), clé `theme`, sur le même modèle que
      `useBoulodromeHistory` (try/catch autour des accès `localStorage`, échec silencieux) ;
      persisté uniquement lors d'une bascule explicite (pas au montage, cf. point suivant) ;
      vérifié en navigateur (Playwright) : bascule, rechargement, le thème choisi persiste
- [x] Au tout premier chargement (aucun choix mémorisé), le thème initial suit
      `prefers-color-scheme` du système — `window.matchMedia('(prefers-color-scheme: dark)')`
      consulté uniquement en l'absence de choix mémorisé ; **la valeur initiale n'est pas
      persistée en localStorage au montage** (uniquement lors d'une bascule explicite) — sinon la
      préférence système se figerait dès la première visite et cesserait d'être suivie pour un
      utilisateur qui n'a jamais touché le bouton ; un script inline dans `index.html` applique le
      thème avant le premier rendu React (même logique que `useTheme`, dupliquée car ce script
      doit s'exécuter de façon synchrone avant le bundle JS différé) pour éviter un flash clair au
      chargement ; `document.documentElement.style.colorScheme` suit aussi le thème (pas seulement
      la classe `.dark`) pour que les contrôles natifs (champs de recherche, scrollbars) suivent le
      choix explicite plutôt que de rester sur la préférence OS ; vérifié en navigateur
      (Playwright, `page.emulateMedia`) dans les deux sens (clair/sombre), y compris l'absence de
      classe `.dark` au tout premier rendu (avant montage React)
- [x] Au moins le fond de page et le fond de carte réagissent visiblement au changement de thème
      — classe `.dark` posée/retirée sur `<html>` (variant Tailwind `dark:` déjà préparé au ticket
      01, `@custom-variant dark` dans `index.css`) ; fond de `<body>` (`dark:bg-gray-900` dans
      `index.css`) et fond du conteneur Leaflet (`.leaflet-container`, `App.css` — visible aux
      bords/zooms faibles, derrière les tuiles) réagissent tous les deux ; le fournisseur de
      tuiles lui-même n'a pas de variante sombre et reste hors périmètre (cf. spec phase 6,
      décision reportée "Fond de carte en dark mode") ; reste des panneaux (recherche, filtres,
      popups) non stylés en dark, objet du ticket suivant
- [x] Tests couvrant : persistance du choix, valeur initiale basée sur la préférence système en
      l'absence de choix mémorisé — `use-theme.test.ts` : préférence système (clair/sombre) sans
      choix mémorisé, bascule + classe `.dark` sur `<html>`, persistance entre deux montages
      (rechargement) ; mock de `window.matchMedia` ajouté globalement dans `setupTests.ts`
      (défaut : préférence claire) pour que les composants montés dans les autres tests (qui
      n'exercent pas ce mécanisme) continuent de fonctionner sans le mocker individuellement
