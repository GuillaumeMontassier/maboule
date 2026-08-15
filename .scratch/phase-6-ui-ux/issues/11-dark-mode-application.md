# 11 — Dark mode : application aux panneaux, popups et icônes

**What to build:** Tous les panneaux de l'interface (recherche, historique, filtres, panneau Itinéraire, popups) et les icônes s'adaptent correctement au thème sombre activé par le bouton de bascule.

**Blocked by:** 08 — Icônes : harmonisation piéton/café/bar/pub, 09 — Mise en page générale : audit des chevauchements + finalisation Tailwind, 10 — Dark mode : infrastructure + bouton de bascule

**Status:** done

- [x] En thème sombre, tous les panneaux flottants (recherche, filtres, panneau Itinéraire, popups)
      ont un fond et un texte lisibles et cohérents avec la palette sombre — variantes `dark:`
      ajoutées sur `BoulodromeSearch.tsx` (champ, historique/résultats via `STATUS_CARD_CLASS`),
      `RoutePanel.tsx` (conteneur, champs, boutons, liste de candidats d'adresse),
      `CheckboxFilter.tsx` et `FreeAccessFilter.tsx` (fieldset/label + `<select>`) ; les popups
      Leaflet (boulodrome et café) posent un problème différent des autres panneaux : leur chrome
      (`.leaflet-popup-content-wrapper`, `.leaflet-popup-tip`, bouton de fermeture) est généré par
      Leaflet lui-même, pas du JSX, donc hors de portée de Tailwind — `leaflet.css` fixe un fond
      blanc et un texte foncé en dur sur ces éléments, réécrits en sombre via un bloc CSS classique
      (`html.dark .leaflet-popup-*`) dans `App.css`, sur le même principe déjà en place pour
      `.leaflet-container` (ticket 10) ; badges de contenu des popups (accès libre/payant, distance
      des cafés) reçoivent aussi leurs variantes `dark:` (`bg-*-900`/`text-*-200`)
- [x] Le contour blanc des icônes (piéton/café/bar/pub) reste blanc en thème sombre (pas
      d'adaptation de sa couleur) — déjà le cas avant ce ticket : `dotMarkerHtml`
      (`BoulodromesMap.tsx`) utilise `border-white` sans variante `dark:`, donc invariant par
      thème ; vérifié visuellement (Playwright, thème sombre) sur les marqueurs café/bar
- [x] Aucun élément ne devient illisible (contraste insuffisant) en passant du thème clair au
      thème sombre — messages de chargement/erreur plein écran (`.status`/`.status-error` dans
      `App.css`, sans couleur de texte explicite auparavant, donc noir sur fond sombre) reçoivent
      aussi une variante `dark:` par cohérence, bien que hors de la liste explicite des panneaux du
      ticket
- [x] Vérification manuelle des deux thèmes sur mobile et desktop — Playwright, viewport desktop
      (1280×900) et mobile (390×844, iPhone) : recherche + résultats, filtres, panneau Itinéraire,
      popup boulodrome + popup café superposées, bascule clair/sombre ; aucune régression observée
      en thème clair (captures avant/après identiques)
