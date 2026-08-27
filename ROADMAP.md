# Roadmap — Carte des boulodromes de Paris

> Ce fichier sert de référence pour Claude Code. Toujours s'y référer pour
> savoir quelle phase est en cours et ce qui est prévu ensuite. Ne pas
> anticiper une phase future sans demande explicite — on avance phase par
> phase.

## Statut

**Phase actuelle : Phase 6 — Refonte UI/UX (interface professionnelle)** (Phase 5 terminée)

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
- [x] Ticket 02 — Endpoint de géocodage `GET /api/geocode?q=<adresse>` —
      module client ORS étendu (`fetchGeocodeCandidates`,
      `buildGeocodeSearchParams`, `toGeocodeCandidates`,
      `AddressNotFoundError` dans `server/src/routing/openRouteServiceClient.ts`)
      ; contrairement aux directions (POST, clé API en en-tête), le
      géocodage ORS (Pelias) est en GET avec la clé en query param
      `api_key` — mécanismes d'auth différents documentés en commentaire
      dans le même module ; "aucun résultat" n'est pas un code d'erreur ORS
      distinct côté géocodage (200 + liste vide), traduit en 404 côté
      backend (`AddressNotFoundError`) ; validation `q` (chaîne non vide)
      via `server/src/schemas/geocodeQuery.ts` ; doc OpenAPI
      (`server/src/schemas/geocodeCandidate.ts`) ; tests unitaires sans
      mock sur le formatage/mapping + tests d'intégration `supertest`
      (cas nominal, plusieurs candidats, 404 aucun résultat, 400 `q`
      invalide, 502/503 échec fournisseur) ; vérifié manuellement (curl :
      400 `q` absent/vide, 502 avec clé API locale vide, `/openapi.json`
      expose `/api/geocode`)
- [x] Ticket 03 — Frontend : recherche de boulodrome par mot-clé
      (destination de l'itinéraire) — `client/src/components/BoulodromeSearch.tsx`,
      recherche déclenchée à la soumission du formulaire (pas au fil de la
      frappe), branchée sur le paramètre `q` de `GET /api/boulodromes`
      (backend existant depuis la Phase 3, jusqu'ici non exposé côté
      frontend) ; sélectionner un résultat réutilise le même chemin qu'un
      clic sur un marqueur (`onSelectBoulodrome`) ; réponses tardives
      ignorées via un compteur `latestRequestId` (même principe que le
      flag `cancelled` du chargement des cafés) ; message clair si aucun
      résultat ; tests de composant (`BoulodromeSearch.test.tsx`,
      `BoulodromesMap.test.tsx`, `fetchBoulodromes` mocké)
- [x] Ticket 04 — Frontend : itinéraire depuis la position GPS — nouveau
      module `client/src/api/route.ts` (`fetchRoute`, même pattern que
      `cafes.ts`/`boulodromes.ts`) ; panneau "Itinéraire"
      (`client/src/components/RoutePanel.tsx`) affiché au boulodrome
      sélectionné, option "Utiliser ma position" (`navigator.geolocation`)
      → appel `/route` → tracé dessiné en polyligne Leaflet avec marqueur
      de départ, distance et durée affichées ; permission GPS refusée,
      géolocalisation indisponible, ou itinéraire introuvable (404/502/503) :
      message clair, aucun état cassé ; tracé et panneau retirés à la
      fermeture du popup ou au changement de boulodrome sélectionné (même
      discipline de nettoyage que les marqueurs cafés, panneau monté via
      `key={selectedBoulodromeId}`) ; tests de composant (mock de
      `fetchRoute`) ; vérifié manuellement en navigateur réel (Playwright,
      géolocalisation Chromium mockée). Revue via `/code-review` (six
      agents) : deux bugs corrigés — course entre démontage du panneau et
      résolution tardive d'une requête GPS/route en vol (ref `isCurrent`
      avant chaque `onRouteChange`), et une erreur de géolocalisation sur
      une deuxième demande qui n'effaçait pas le tracé déjà affiché
- [x] Ticket 05 — Frontend : itinéraire depuis une adresse recherchée —
      champ adresse dans `RoutePanel.tsx`, géocodage via
      `client/src/api/geocode.ts` (`fetchGeocodeCandidates`,
      `GET /api/geocode`) ; un seul candidat → itinéraire calculé
      directement, plusieurs candidats → liste de choix affichée ; flux GPS
      et flux adresse convergent vers `requestRoute` (point de départ en
      coordonnées) pour partager la gestion de l'état
      (loading/succès/erreur) ; timeout de 10s ajouté sur la géolocalisation
      (son absence bloquait aussi le repli par adresse, le formulaire étant
      désactivé tant que `busy`) ; tracé effacé en cas de nouvelle recherche
      d'adresse ou d'échec, pour éviter un désaccord entre le panneau et la
      carte ; tests de composant (`BoulodromesMap.test.tsx`)
- [x] Tests unitaires : formatage des requêtes/réponses de l'API de
      routing (mock de l'appel externe) — fait pour l'endpoint route
      (ticket 01) et pour le géocodage (ticket 02, ci-dessus)

## Phase 6 — Refonte UI/UX (interface professionnelle)

Objectif : faire passer l'app d'un prototype fonctionnel à une interface
soignée, cohérente entre desktop et mobile, avec un niveau de finition
professionnel. Cette phase reprend et raffine des éléments déjà posés dans
les phases précédentes (recherche, filtres, icônes cafés/bars) plutôt que
d'ajouter de nouvelles fonctionnalités métier.

Décisions détaillées sous `.scratch/phase-6-ui-ux/spec.md` (issue d'une
session `/grill-with-docs`) — migration vers Tailwind CSS choisie comme
fondation commune pour le responsive, le dark mode et cette refonte, voir
`docs/adr/0002-tailwind-for-phase-6-refonte.md`. Deux points restent
explicitement en attente d'une future session : la sémantique exacte du
bouton "Itinéraire" et le choix du fond de carte en dark mode.

**Barre de recherche**
- [x] Repositionnement : centrée en mobile, alignée à gauche en desktop
- [ ] Affichage de l'historique de recherche au focus (avant toute saisie)
- [x] Résultats en temps réel à chaque caractère saisi (debounce à prévoir
      côté implémentation pour éviter une requête par lettre)
- [x] Touche "Entrée" sélectionne le premier résultat de la liste

**Sélection d'un lieu**
- [x] Recentrage automatique de la carte sur l'élément sélectionné
- [ ] Ajout d'un bouton "Itinéraire" dans la card du lieu, qui active le
      mode itinéraire de l'app et place le focus dans le champ "point de
      départ"

**Filtres**
- [ ] Repositionnement desktop : à côté de la barre de recherche
- [ ] Repositionnement mobile : sous la barre de recherche

**Contrôles de carte**
- [ ] Déplacement des boutons zoom (+/-) en bas à droite de l'écran

**Icônes**
- [x] Harmonisation des icônes piéton/café/bar/pub : un point avec contour
      blanc, la couleur variant selon le type d'établissement (au lieu des
      icônes actuelles hétérogènes) — `L.divIcon` avec un `<span>` stylé en
      classes Tailwind statiques (`bg-blue-600`/`bg-amber-600`/
      `bg-violet-600`/`bg-rose-600`, `rounded-full`, `border-2 border-white`)
      plutôt que dynamiques, pour que le scanner JIT de Tailwind les détecte
      malgré l'injection via `html:` (hors de l'arbre JSX) ;
      `client/src/components/BoulodromesMap.tsx`, taille de marqueur
      (`iconSize`) et classes `.cafe-marker`/`.route-start-marker`
      inchangées ; tests étendus (`BoulodromesMap.test.tsx`) pour vérifier
      la couleur appliquée par type

**Mise en page générale**
- [x] Audit et correction des chevauchements entre panneaux (recherche,
      filtres, popups, contrôles de zoom) sur toutes les tailles d'écran —
      `RoutePanel` et le contenu des popups (badge libre/payant, distance des
      cafés) migrés vers Tailwind, dans le même style que les autres panneaux
      (`rounded-lg border-gray-300 bg-white shadow-sm`) ; géométrie du panneau
      (largeur/marge/hauteur max) centralisée dans
      `client/src/constants/routePanelLayout.ts`, partagée avec
      `BoulodromesMap.tsx` plutôt que dupliquée en constantes déconnectées ;
      `RoutePanel` gagne un `max-w-[calc(100vw-96px)]` pour ne jamais
      chevaucher les contrôles de zoom (bas-droite) sur les écrans les plus
      étroits ; bug trouvé et corrigé : l'auto-pan de Leaflet, qui ne connaît
      que les limites du conteneur carte, ignorait `RoutePanel` (overlay React
      par-dessus la carte) — un popup ouvert près du bord bas-gauche pouvait
      donc se retrouver visuellement sous le panneau (z-index plus élevé) au
      lieu d'être repoussé par l'auto-pan ; corrigé via
      `autoPanPaddingTopLeft`/`autoPanPaddingBottomRight` sur les popups
      (boulodrome et café), calculés à partir de `ROUTE_PANEL_LAYOUT` —
      vérifié en navigateur réel (Playwright) à 375px/768px/1280px : aucun
      chevauchement entre recherche/filtres/zoom en état par défaut, ni entre
      popup et `RoutePanel` sur une douzaine de marqueurs testés à chaque
      largeur, y compris dans l'état le plus grand du panneau (choix d'une
      adresse ambiguë)

**Dark mode**
- [ ] Mise en place d'un mode sombre (palette, fond de carte adapté,
      contraste des icônes et popups)

**Tests**
- [ ] Tests unitaires/composants sur le nouveau comportement de recherche
      (debounce, sélection au clavier, historique)

## Phase 7 — Alignement aux standards de code (CLAUDE.md)

Suite à l'ajout des sections "Bonnes pratiques React" et "Bonnes pratiques
Express" dans `CLAUDE.md`, audit du code existant contre ces règles.
Spec et découpage en tickets sous `.scratch/phase-8-standards/` (voir
`docs/agents/issue-tracker.md`) : `spec.md` + 5 tickets. La plupart des
règles React (composants fonctionnels, typage des props, pas de `any`,
couche `client/src/api/`, 3 états async, a11y de base) sont déjà respectées
par le code actuel et ne génèrent pas de ticket — seuls les écarts réels
sont listés ci-dessous. La règle de layering Express ("routes → controllers
→ services") a été corrigée dans `CLAUDE.md` pour refléter le repository
pattern déjà en place plutôt que d'être imposée au code (décision prise en
triage, cf. `.scratch/phase-8-standards/spec.md`).

- [ ] Ticket 01 — Découper `server/src/app.ts` en routers par ressource,
      repository pattern conservé (pas de couche controllers/services)
- [ ] Ticket 02 — Middleware d'erreur centralisé côté serveur
- [ ] Ticket 03 — Logs structurés côté serveur (wrapper léger, pas de
      nouvelle dépendance pour l'instant)
- [ ] Ticket 04 — Extraire la logique de sélection/chargement des cafés de
      `BoulodromesMap.tsx` dans un hook custom
- [x] Ticket 05 — Trancher et appliquer le traitement de l'état de
      chargement/erreur des cafés à proximité (silencieux assumé vs. exposé)
      — décidé avec l'auteur du projet : silencieux-échec conservé comme
      exception assumée à la règle des 3 états (la popup boulodrome ne doit
      jamais dépendre de la disponibilité des cafés, information secondaire) ;
      commentaire renforcé dans `client/src/hooks/use-boulodrome-selection.ts`
      pour l'expliciter, aucun changement de comportement

Ajout hors périmètre de l'audit standards ci-dessus, mais logé ici comme
prochain chantier d'environnement de dev (cf.
`docs/adr/0003-vscode-dev-containers-for-dev-environment.md`) :

- [x] Ticket 06 — Scaffolder `.devcontainer/devcontainer.json` (VS Code Dev
      Containers) pour le workspace `client`/`server`, référençant le
      `docker-compose.yml` existant (service `db`) via `dockerComposeFile`
      plutôt que de le dupliquer — `.devcontainer/docker-compose.yml` ajoute
      un service `app` (image `mcr.microsoft.com/devcontainers/javascript-node:22`,
      même version Node que le `Dockerfile` de prod), `DATABASE_URL` réécrit
      pour viser le service `db` plutôt que `localhost` (sans danger,
      `dotenv-cli` ne réécrit jamais une variable déjà présente dans
      l'environnement — priorité sur `server/.env`) ; `postCreateCommand: npm
      install` à l'ouverture ; note ajoutée dans `README.md` ; vérification
      manuelle (ouverture réelle dans VS Code) non faite dans cette session,
      à faire par l'auteur du projet — voir
      `.scratch/phase-8-standards/issues/06-devcontainer-scaffold.md`

## Phase 8 — Contributions utilisateurs

- [ ] Formulaire de suggestion (ajout/modification de boulodrome ou café)
- [ ] Table de modération pour les suggestions en attente
- [ ] Tests unitaires : validation des données soumises, logique de
      modération

---

## Note transverse — Tests

À partir de la Phase 1, chaque nouvelle fonctionnalité s'accompagne de ses
tests unitaires plutôt que de les ajouter après coup. Ne pas cumuler de
dette de tests en fin de projet.
