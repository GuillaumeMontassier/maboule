# 02 — Sélection d'un lieu : recentrage automatique de la carte

**What to build:** Cliquer un marqueur de boulodrome sur la carte, ou sélectionner un boulodrome via la recherche, recentre automatiquement la carte sur ce boulodrome avec une animation fluide plutôt qu'un saut instantané.

**Blocked by:** Aucun — peut démarrer immédiatement

**Status:** done

- [x] Cliquer un marqueur de boulodrome anime la carte vers ce boulodrome (pas de saut instantané) —
      `map.flyTo(marker.getLatLng(), targetZoom)` dans `selectBoulodrome`
      (`client/src/components/BoulodromesMap.tsx`), instance carte capturée via le `ref` de
      `MapContainer` (react-leaflet v5 : le ref pointe directement l'instance Leaflet)
- [x] Sélectionner un boulodrome depuis la recherche déclenche le même recentrage que le clic sur un marqueur —
      `selectBoulodrome` est le seul chemin de sélection (marqueur et recherche), donc même logique
      de recentrage dans les deux cas par construction
- [x] Si le zoom courant est déjà ≥ 15, il est conservé ; sinon la carte monte à 16 —
      `targetZoom = currentZoom >= 15 ? currentZoom : 16`
- [x] Changer de boulodrome sélectionné pendant qu'une animation est en cours ne laisse pas la carte dans un état incohérent —
      Leaflet interrompt lui-même l'animation `flyTo` précédente en début de nouvel appel (`_stop()`
      appelé au début de `flyTo`) ; vérifié par test (double clic sans attendre entre les deux)
- [x] Tests couvrant : conservation du zoom si déjà ≥ 15, montée à 16 sinon, déclenchement identique marqueur/recherche —
      4 tests ajoutés dans `client/src/components/BoulodromesMap.test.tsx` (describe
      "recentrage automatique"), en espionnant `L.Map.prototype.flyTo` (Leaflet réel, pas mocké —
      `flyTo` retombe sur un `setView` synchrone en l'absence de support CSS3D dans jsdom)

Vérification en navigateur réel non faite pour ce ticket : l'image Docker `postgis/postgis:17-3.5`
n'a pas de manifeste `linux/arm64/v8` sur cette machine, la base locale ne démarre donc pas
(limitation d'environnement préexistante, sans lien avec ce ticket). Comportement validé via les
tests ci-dessus, qui exercent la vraie bibliothèque Leaflet (pas de mock de `flyTo`).
