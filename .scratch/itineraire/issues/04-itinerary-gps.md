# 04 — Itinéraire depuis la position GPS

**What to build:** depuis un boulodrome sélectionné, l'utilisateur peut
demander un itinéraire à pied depuis sa position GPS actuelle, affiché sur
la carte avec distance et durée. C'est le cœur démontrable du feature
"Itinéraire".

**Blocked by:** Ticket 01 (endpoint `/route`)

**Status:** done

- [x] Nouveau module `client/src/api/route.ts` (wrapper `fetch` vers
      `GET /api/boulodromes/:id/route`), même pattern que
      `client/src/api/cafes.ts` / `client/src/api/boulodromes.ts`.
- [x] Un panneau "Itinéraire" apparaît quand un boulodrome est sélectionné,
      avec une option "Utiliser ma position".
- [x] Au clic, récupère la position via `navigator.geolocation`, appelle
      l'endpoint `/route`, et dessine le tracé retourné comme une
      polyligne Leaflet sur la carte, avec distance et durée affichées à
      côté.
- [x] Permission GPS refusée ou géolocalisation non disponible : message
      clair côté frontend, aucun appel réseau déclenché.
- [x] Aucun itinéraire trouvé (404 backend) ou service indisponible
      (502/503 backend) : message d'erreur clair, pas d'état cassé.
- [x] Le tracé et le marqueur de départ sont retirés à la fermeture du
      popup ou au changement de boulodrome sélectionné — même discipline
      de nettoyage que les marqueurs cafés existants (pas d'accumulation).
- [x] Tests de composant : mock de `client/src/api/route.ts` (comme le
      `vi.mock` existant sur `client/src/api/cafes.ts`), scénarios :
      demande d'itinéraire → tracé affiché, permission GPS refusée →
      message affiché, changement de boulodrome → tracé retiré.

## Comments

Implémenté dans `client/src/api/route.ts` (`fetchRoute`), `client/src/components/RoutePanel.tsx`
(panneau "Itinéraire" + `navigator.geolocation`), intégration dans
`BoulodromesMap.tsx` (état `route`, `Polyline` + marqueur de départ Leaflet,
panneau monté/démonté via `key={selectedBoulodromeId}` pour suivre la même
durée de vie que les marqueurs cafés). Tracé dérivé directement de
`route.geometry.coordinates` (premier point = position de départ), pas de
second état à synchroniser séparément.

Revue via `/code-review` (six agents, deux axes) : bug trouvé et corrigé —
course entre le démontage de `RoutePanel` (changement de boulodrome pendant
qu'une requête GPS/route est en vol) et la résolution tardive de cette
requête, qui pouvait redessiner le tracé de l'ancien boulodrome sur la carte
après coup ; corrigé avec un ref `isCurrent` vérifié avant chaque appel à
`onRouteChange` dans les callbacks async (même besoin que le flag `cancelled`
de `BoulodromesMap` ou le `latestRequestId` de `BoulodromeSearch`, mais ici
sur des callbacks déclenchés par un clic plutôt que par un effet). Deuxième
bug corrigé : une erreur de géolocalisation sur une deuxième demande (après
un premier itinéraire déjà affiché) n'effaçait pas le tracé existant — panneau
et carte pouvaient afficher des états contradictoires. Deux tests de
régression ajoutés pour ces deux cas. Nettoyage mineur au passage : conversion
GeoJSON→Leaflet factorisée (`toLatLng`, dupliquée 3x), classe CSS
`.route-start-marker` fusionnée avec `.cafe-marker` (règles identiques).

Vérifié manuellement en navigateur réel (Playwright, geolocation Chromium
mockée) : sélection d'un boulodrome → panneau "Itinéraire" affiché ; clic sur
"Utiliser ma position" → appel réseau vers `/route` (502 observé en local, clé
ORS de test invalide — confirme au passage que le message d'erreur
502/503 s'affiche proprement sans état cassé, cf. commentaire ticket 01) ;
changement de boulodrome sélectionné → panneau remonté à l'état initial (pas
de fuite d'état de l'ancien boulodrome). Chemin de succès (tracé affiché) et
refus de permission GPS vérifiés par tests de composant avec `fetchRoute`
mocké plutôt qu'en navigateur réel, faute de clé ORS valide en local.
