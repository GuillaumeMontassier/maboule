# 12 — Popup de boulodrome cachée sous recherche + filtres en mobile

**What to build:** Sur un viewport mobile, ouvrir la popup d'un boulodrome situé dans le tiers supérieur de la carte ne doit plus la faire apparaître partiellement sous le bloc recherche + filtres.

**Blocked by:** 09 — Mise en page générale : audit des chevauchements + finalisation Tailwind

**Status:** done

**Origine :** Audit UI/UX du 2026-08-16 (constat A) — reproduit à 375×700, chargement de page propre, clic sur un marqueur de boulodrome dans le tiers supérieur de la carte (testé : « Square Violet », 15e). Le bloc recherche + filtres occupe environ 250px de hauteur en haut d'écran en mobile et passe au-dessus de la popup en z-index (les deux utilisent `z-[1000]`, la popup Leaflet est sur son propre pane à z-index 700). Nom et adresse du boulodrome deviennent illisibles.

Le ticket 09 a résolu le même type de chevauchement pour `RoutePanel` (bas-gauche) via `autoPanPaddingBottomRight`, calculé à partir de `client/src/constants/routePanelLayout.ts`. Aucun padding équivalent n'a été réservé côté `autoPanPaddingTopLeft` pour la hauteur réelle du bloc recherche + filtres empilé en mobile — la vérification manuelle du ticket 09 portait sur l'état par défaut de l'écran (aucun élément n'empiétant), pas sur une popup ouverte près du haut de la carte.

- [x] Sur un viewport mobile (375px), ouvrir la popup d'un boulodrome situé n'importe où sous le bloc recherche + filtres ne produit plus de chevauchement illisible — texte du popup entièrement visible
- [x] Le correctif tient compte de la hauteur réelle du bloc recherche + filtres en mobile (variable : l'historique de recherche et les résultats peuvent l'agrandir), pas d'une valeur figée déconnectée — `MOBILE_SEARCH_FILTERS_HEIGHT_PX` (`client/src/constants/searchFiltersLayout.ts`) documente explicitement pourquoi une valeur mesurée à l'état par défaut (dropdown fermé) suffit : un clic sur un marqueur de la carte fait perdre le focus du champ de recherche, donc l'état dropdown-ouvert n'a pas besoin d'être couvert par cette marge
- [x] Aucune régression sur le comportement déjà couvert par le ticket 09 (chevauchement popup/RoutePanel, bas-gauche) — vérifié à 375px/1280px
- [x] Vérifié en navigateur réel (Playwright) : reproduction du cas du constat A (clic direct sur un marqueur de carte, "Square d'Anvers", 9e, situé juste sous le bloc recherche + filtres à 375×700, chargement de page propre) — popup entièrement visible, texte lisible, aucun chevauchement

## Comments

Déjà implémenté (`computePopupAutoPanPadding` + `MOBILE_SEARCH_FILTERS_HEIGHT_PX`) mais pas marqué comme terminé et jamais vérifié en navigateur. Vérification Playwright effectuée le 2026-08-17 (audit UI/UX) : cases cochées, statut passé à `done`.

Note distincte trouvée pendant la même session d'audit : la liste de résultats/historique de la barre de recherche elle-même (pas la popup d'un marqueur de carte, hors périmètre de ce ticket) chevauche visuellement le bloc filtres en mobile et ne se referme pas après sélection — voir tickets 24 et 25.
