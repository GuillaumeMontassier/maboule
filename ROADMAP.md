# Roadmap — Carte des boulodromes de Paris

> Ce fichier sert de référence pour Claude Code. Toujours s'y référer pour
> savoir quelle phase est en cours et ce qui est prévu ensuite. Ne pas
> anticiper une phase future sans demande explicite — on avance phase par
> phase.

## Statut

**Phase actuelle : Phase 5 — Itinéraire** (Phase 4 terminée)

---

## Phase 0 — Setup & données

- [x] Récupération et nettoyage du dataset du gouvernement (equipements.sports.gouv.fr)
      (boulodromes : adresse, coordonnées)
- [x] Setup du repo : monorepo avec dossiers `client/` (React) et `server/`
      (Express)
- [x] `.gitignore`, licence MIT, mention d'attribution Ville de Paris
      (Licence Ouverte) dans le README
- [x] Setup PostgreSQL + PostGIS en local via Docker
- [x] Modélisation du schéma avec Drizzle (table boulodromes, colonne
      `geometry(Point, 4326)`)
- [x] Mise en place de Vitest (backend et frontend)

## Phase 1 — MVP

- [x] Backend Express + Drizzle : endpoint REST renvoyant les boulodromes
      en GeoJSON
- [x] Frontend React : carte interactive (Leaflet ou MapLibre GL) affichant
      les points
- [x] Tests unitaires : transformation des données en GeoJSON, requêtes
      Drizzle de base
- [x] Déploiement basique (front sur Vercel, back + DB sur Railway)

## Phase 2 — Données : sol, équipement & coordonnées précises

- [x] Identifier dans la source les champs pertinents (dataset
      `data-es-equipement`) : `nature` (Découvert/Couvert) pour le type
      d'équipement, `aire_nature_sol` (ex. "Stabilisé/cendrée") pour la
      nature du sol ; et dans `data-es-installation` : `nom` (nom du site,
      ex. "Jardin du port de l'Arsenal", distinct du nom de l'équipement
      lui-même, ex. "Grand terrain de pétanque")
- [x] Mettre à jour le schéma Drizzle (`server/src/db/schema.ts`) et le
      modèle (`server/src/models/boulodrome.ts`) : nouvelles colonnes
      `ground_type` (← `aire_nature_sol`), `equipment_type` (← `nature`) et
      `site_name` (← `installation.nom`, distinct de `name`) + migration
      (`server/drizzle/0001_green_unicorn.sql`)
- [x] Script d'ingestion (`server/src/ingestion/dataEs.ts`) : mapper ces
      trois champs dans `toBoulodrome`
- [x] Relancer l'ingestion en local pour rafraîchir les boulodromes
      existants avec ces nouveaux champs (`npm run db:migrate` puis
      `npm run ingest` — 64 boulodromes mis à jour)
- [x] Mettre à jour la conversion GeoJSON (`server/src/geojson/boulodromes.ts`)
      pour exposer les nouveaux champs dans les `properties`
- [x] Corriger l'affichage des points sur la carte (`BoulodromesMap.tsx`) :
      la donnée `coordinates` est correcte mais l'affichage actuel ne s'y
      fie pas correctement (positionnement des points à revoir pour se
      baser réellement sur les coordonnées géographiques et non sur
      l'adresse postale) — cause réelle : `dataEs.ts` utilisait les
      coordonnées du site (`installation.coordonnees`, imprécises,
      partagées entre plusieurs équipements) au lieu de celles propres à
      chaque équipement (`equipement.coordonnees`) ; corrigé + ré-ingéré
      (64 boulodromes)
- [x] Frontend : mettre à jour le badge/popup (`BoulodromesMap.tsx`) pour
      afficher le nom du site (`site_name`) en plus du nom de l'équipement,
      ainsi que la nature du sol et le type d'équipement
- [x] Tests unitaires : transformation des nouveaux champs en GeoJSON,
      mapping Data ES → Boulodrome, round-trip DB (test d'intégration)
- [x] Accès libre/payant : champ `acces_libre` (booléen) du dataset
      `data-es-equipement` ("accessible à tous, de manière permanente et
      permettant une pratique sportive, même non encadrée") — colonne
      `free_access` (boolean, nullable) ajoutée au schéma Drizzle
      (`server/drizzle/0002_special_risque.sql`) et au modèle `Boulodrome`,
      mappée dans `dataEs.ts`, exposée dans le GeoJSON, ré-ingérée (64
      boulodromes), badge libre/payant affiché sur la carte
      (`BoulodromesMap.tsx`)
- [x] Tests unitaires : mapping du nouveau champ Data ES → Boulodrome,
      transformation en GeoJSON, round-trip DB (test d'intégration)

## Phase 3 — Recherche & filtres

- [x] Endpoint de recherche par nom/adresse via Drizzle
- [x] Filtres sur les types de terrain, environnement et gratuit/payant (query params API + UI de filtre)
- [x] Premières requêtes spatiales PostGIS (bounding box) — opérateur `&&`
      (recouvrement de bbox, indexé GiST), en SQL brut via Drizzle
      (`server/src/db/boulodromesRepository.ts`)
- [x] Tests unitaires : logique de filtrage, parsing des paramètres de
      recherche — extraits dans `server/src/http/queryParams.ts` puis
      remplacés par les schémas Zod ci-dessous lors du passage à la
      validation stricte
- [x] Mise en place de Swagger/OpenAPI : schémas Zod générés depuis Drizzle (drizzle-zod), puis 
      doc OpenAPI générée depuis ces mêmes schémas (zod-to-openapi ou équivalent) — une seule source de vérité entre validation et documentation
      — validation stricte des query params (400 + détails si invalide),
      doc servie sur `/docs` (Swagger UI) et `/openapi.json`
      (`server/src/schemas/`, `server/src/openapi/`)


## Phase 4 — Enrichissement (cafés/bars)

- [x] Nouvelle table/source de données pour les cafés à proximité —
      OpenStreetMap (Overpass API), tags `amenity=cafe|bar|pub` sur le
      périmètre administratif de Paris (`admin_level=8`), points sans nom
      ignorés à l'import ; nouvelle table `cafes` (`server/src/db/schema.ts`,
      migration `0003_lyrical_carnage.sql`), modèle `Cafe`
      (`server/src/models/cafe.ts`, `Address`/`GeoCoordinates` déplacés
      dans `server/src/models/geo.ts` pour être partagés avec `Boulodrome`),
      ingestion (`server/src/ingestion/osmCafes.ts`, `npm run ingest:cafes`
      — 4482 cafés/bars importés) — licence ODbL (OpenStreetMap
      contributors), distincte de la Licence Ouverte Ville de Paris déjà
      en place pour les boulodromes ; attribution ajoutée au `README.md`
- [x] Requête spatiale `ST_DWithin` ("à X mètres d'un boulodrome") —
      `findCafesNearBoulodrome` (`server/src/db/cafesRepository.ts`) : jointure
      sur un boulodrome par id + filtre `ST_DWithin(cafes.coordinates,
      boulodromes.coordinates, radiusMeters)`, résultats triés par
      `ST_Distance` croissante ; vérifié manuellement contre la vraie base
      (rayons 50/200/1000m sur un boulodrome réel — 0/1/52 cafés, distances
      cohérentes)
- [ ] Tests unitaires : calcul de proximité (mock de coordonnées,
      vérification des seuils de distance)
- [x] Endpoint `GET /api/boulodromes/:id/cafes` — rayon `radius` en mètres,
      paramètre optionnel avec défaut 200m ; validation Zod
      (`server/src/schemas/cafesNearBoulodromeQuery.ts`) + doc OpenAPI
      (`server/src/openapi/document.ts`) sur le même principe que
      `/api/boulodromes` ; réponse GeoJSON (`server/src/geojson/cafes.ts`,
      `distanceMeters` dans les properties) ; 404 si l'id de boulodrome
      n'existe pas (`findBoulodromeById`, `server/src/db/boulodromesRepository.ts`)
      ; vérifié manuellement (serveur local + curl : cas nominal, rayon
      custom, id inconnu → 404, radius invalide → 400)
- [x] Frontend : appel à `GET /api/boulodromes/:id/cafes` (`client/src/api/cafes.ts`)
      déclenché automatiquement au clic sur un boulodrome (`BoulodromesMap.tsx`) ;
      affichage des cafés à proximité sous forme de marqueurs distincts sur
      la carte (emoji par `amenityType` : ☕/🍸/🍺, `L.divIcon`, pas de
      nouveaux assets), avec leur propre popup (nom, distance, adresse si
      connue) ; marqueurs retirés à la fermeture du popup ou au changement de
      boulodrome sélectionné (pas d'accumulation) — vérifié en navigateur
      réel (Playwright) : ouverture/fermeture, changement de boulodrome sans
      accumulation. Bug trouvé et corrigé en cours de route : Leaflet ferme
      par défaut le popup du boulodrome dès qu'un autre popup (celui d'un
      café) s'ouvre par-dessus (`autoClose`) ou dès qu'on clique ailleurs sur
      la carte (`closeOnClick`), ce qui vidait `nearbyCafes` et démontait le
      marqueur café au moment même où on cliquait dessus — corrigé en
      désactivant les deux sur la Popup du boulodrome et en gérant la
      fermeture explicitement (refs Leaflet des marqueurs boulodromes)
- [x] Tests unitaires : endpoint `/api/boulodromes/:id/cafes` (rayon par
      défaut, 404 sur id inconnu) ; logique frontend de synchronisation des
      marqueurs cafés avec le boulodrome sélectionné — côté backend, 4
      nouveaux tests d'intégration (`server/src/app.integration.test.ts`,
      via `supertest` ajouté en devDependency) : rayon par défaut 200m,
      rayon custom, 404 sur id inconnu, 400 sur radius invalide ; côté
      frontend, 3 tests (`client/src/components/BoulodromesMap.test.tsx`) :
      pas d'appel sans sélection, chargement + affichage au clic, retrait
      des marqueurs au changement de boulodrome sélectionné

## Phase 5 — Itinéraire

Spec et découpage en tickets sous `.scratch/itineraire/` (voir
`docs/agents/issue-tracker.md`) : `spec.md` + 5 tickets
(`01-route-endpoint`, `02-geocode-endpoint`, `03-destination-search`,
`04-itinerary-gps`, `05-itinerary-address`). OpenRouteService choisi plutôt
qu'un OSRM auto-hébergé — voir `docs/adr/0001-openrouteservice-over-self-hosted-osrm.md`.

- [x] Ticket 01 — Endpoint `GET /api/boulodromes/:id/route?from=<lat>,<lng>`
      — itinéraire piéton via OpenRouteService ; module client dédié
      (`server/src/routing/openRouteServiceClient.ts`, seule frontière
      réseau sortante, profil piéton) avec fonctions pures de mapping
      testées sans mock (`buildDirectionsRequestBody`, `toRouteFeature`) ;
      validation `from` par schéma Zod (`server/src/schemas/routeQuery.ts`) ;
      réponse GeoJSON `Feature` unique (pas `FeatureCollection`) de
      géométrie `LineString`, `distanceMeters`/`durationSeconds` dans les
      properties (`server/src/schemas/routeProperties.ts`) ; 404
      boulodrome/itinéraire introuvable, 400 paramètre invalide, 502 si
      OpenRouteService échoue/time out/quota dépassé (pas de distinction
      utile avec 503 côté appelant) ; doc OpenAPI
      (`server/src/openapi/document.ts`) ; clé API lue depuis
      `ORS_API_KEY` (serveur uniquement) ; tests d'intégration
      `supertest` (`server/src/app.integration.test.ts`, seul le client
      ORS mocké) : cas nominal, 404 boulodrome inconnu, 404 aucun
      itinéraire, 400 `from` absent/invalide, 502 échec fournisseur ;
      vérifié manuellement (serveur local + curl : cas nominal → 502
      attendu en local faute de clé API réelle, 404 id inconnu, 400
      paramètre invalide, `/openapi.json` expose le nouveau path)
- [ ] Ticket 02 — Endpoint de géocodage `GET /api/geocode?q=<adresse>`
- [ ] Ticket 03 — Frontend : recherche de boulodrome par mot-clé
      (destination de l'itinéraire)
- [ ] Ticket 04 — Frontend : itinéraire depuis la position GPS
- [ ] Ticket 05 — Frontend : itinéraire depuis une adresse recherchée
- [ ] Tests unitaires : formatage des requêtes/réponses de l'API de
      routing (mock de l'appel externe) — fait pour l'endpoint route
      (ticket 01, ci-dessus) ; reste à couvrir pour le géocodage (ticket 02)

## Phase 6 — Contributions utilisateurs

- [ ] Formulaire de suggestion (ajout/modification de boulodrome ou café)
- [ ] Table de modération pour les suggestions en attente
- [ ] Tests unitaires : validation des données soumises, logique de
      modération

## Phase 7 — Refonte graphique (interface façon Google Maps)

Phase transverse, indépendante des phases de données ci-dessus — peut être
réordonnée plus tôt si l'envie de polish visuel prend le pas sur les
prochaines fonctionnalités.

- [ ] Migrer vers Tailwind CSS (à la place du CSS ad hoc actuel dans
      `App.css`) — envisagé comme base commune pour le dark mode (variant
      `dark:`), le responsive (breakpoints utilitaires) et la refonte
      visuelle ci-dessous, plutôt que d'empiler ces trois chantiers sur des
      styles écrits à la main
- [ ] Migrer la carte de Leaflet (tuiles raster) vers MapLibre GL JS (tuiles
      vectorielles) : rendu plus fluide, style personnalisable — déjà
      envisagé dans le choix de stack initial (`CLAUDE.md`)
- [ ] Choisir un fond de carte proche de Google Maps (ex. style MapTiler
      "Streets" ou CARTO Positron/Voyager) — vérifier quotas gratuits/clé API
      ; prévoir une variante de style sombre pour le dark mode
- [ ] Clustering des marqueurs en dé-zoomant (nativement supporté par les
      sources GeoJSON de MapLibre)
- [ ] Redesign des fiches boulodrome (carte flottante façon Google Maps au
      lieu du popup Leaflet par défaut)
- [ ] Redesign des contrôles (zoom, géolocalisation) en boutons flottants
- [ ] Dark mode : thème clair/sombre avec bascule manuelle, valeur initiale
      basée sur `prefers-color-scheme`, choix persisté (ex. `localStorage`)
- [ ] Affichage mobile amélioré : barre de filtres actuelle (fixe en haut à
      droite) repensée en drawer/bottom-sheet sur petit écran, fiches
      boulodrome et contrôles adaptés au tactile, vérification sur
      quelques breakpoints clés
- [ ] Internationalisation FR/EN : sélecteur de langue, traduction des
      libellés UI (filtres, popups, messages de statut/erreur) — choisir une
      lib i18n (ex. react-i18next) ou une solution plus légère selon le
      volume de texte à couvrir
- [ ] Tests unitaires : adapter les tests existants sur `BoulodromesMap` à
      la nouvelle API cartographique, et couvrir les nouveaux comportements
      (bascule dark mode, changement de langue, layout responsive)

---

## Note transverse — Tests

À partir de la Phase 1, chaque nouvelle fonctionnalité s'accompagne de ses
tests unitaires plutôt que de les ajouter après coup. Ne pas cumuler de
dette de tests en fin de projet.