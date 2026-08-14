# 07 — Contrôles de carte : zoom en bas à droite

**What to build:** Les boutons de zoom de la carte sont déplacés en bas à droite de l'écran, avec la même marge que les autres panneaux flottants.

**Blocked by:** 01 — Mise en place de Tailwind CSS

**Status:** done

- [x] Les boutons de zoom (+/-) sont positionnés en bas à droite, à 12px des bords —
      `zoomControl={false}` sur `MapContainer` + `<ZoomControl position="bottomright" />`
      (`client/src/components/BoulodromesMap.tsx`) ; marge par défaut de Leaflet (10px)
      alignée sur les 12px des autres panneaux via une règle ciblée dans `App.css`
      (`.leaflet-bottom.leaflet-right .leaflet-control-zoom`, spécificité (0,3,0) pour
      battre les règles par défaut de `leaflet.css` quel que soit l'ordre d'import) ;
      vérifié en navigateur (API mockée en l'absence de Postgres local sur cette machine
      — cf. ticket 03) : `getBoundingClientRect` sur `.leaflet-control-zoom`, 12px exacts
      du bord droit à 1280px et à 375px de large
- [x] Ils ne chevauchent plus la barre de recherche (collision actuelle en haut à gauche
      résolue) — déplacés du coin haut-gauche par défaut de Leaflet vers bas-droite ;
      vérifié visuellement en desktop et mobile (375px), aucun chevauchement avec la
      barre de recherche ni les filtres
- [x] Le comportement de zoom lui-même (clic +/-, molette, pincement tactile) n'est pas
      modifié — seul le contrôle visuel est repositionné (même composant Leaflet, prop
      `position` uniquement) ; le zoom molette/pincement est une capacité de la carte
      elle-même, indépendante du contrôle de zoom, donc non affectée ; suite de tests
      existante (`BoulodromesMap.test.tsx`, y compris les tests de recentrage qui
      pilotent le zoom via `.leaflet-control-zoom-in`) toujours au vert
