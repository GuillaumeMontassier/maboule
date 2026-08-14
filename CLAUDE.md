# Projet : Carte des boulodromes de Paris

## Contexte
Portfolio project : carte interactive des infrastructures de pétanque à Paris,
basée sur l'open data de la Ville de Paris. Objectif double : produire un
outil utilisable, ET monter en compétence sur des technos que je maîtrise
moins bien (PostgreSQL/PostGIS, React).

## Stack technique
- **Frontend** : React + TypeScript, carte via Leaflet ou MapLibre GL
- **Backend** : Node.js / Express
- **Base de données** : PostgreSQL + PostGIS (extension géospatiale)
- **ORM** : Drizzle (choisi plutôt que Prisma, qui ne supporte pas nativement
  les types géométriques PostGIS — voir les requêtes spatiales poussées
  probablement en SQL brut via Drizzle)
- **Tests** : Vitest pour les tests unitaires (backend et frontend)
- **Licence** : MIT, avec attribution à la Ville de Paris (Licence Ouverte)
  pour les données open data
- **Format d'échange** : GeoJSON pour tout ce qui est géographique

## Roadmap
La roadmap complète du projet (phases, fonctionnalités, tests associés à
chaque phase) est dans `ROADMAP.md` à la racine du repo. Toujours s'y
référer pour savoir où on en est et ce qui est prévu pour la suite — ne pas
anticiper une phase sans qu'elle soit explicitement demandée.

## Phase actuelle : Phase 5 — Itinéraire (Phase 4 terminée)
Objectifs de cette phase :
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
- [x] Tests unitaires : calcul de proximité (mock de coordonnées,
      vérification des seuils de distance) — 4 tests d'intégration ajoutés
      dans `cafesRepository.integration.test.ts` (`findCafesNearBoulodrome`) :
      inclusion/exclusion selon le rayon (200m vs 100m, seuils de distance),
      tri par distance croissante, `distanceMeters` cohérent (tolérance sur
      la conversion degrés/mètres utilisée pour placer les cafés de test),
      liste vide sur un id de boulodrome inconnu
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

## Conventions de code
- Structure de dossiers claire : séparer `client/` (React) et `server/`
  (Express) à la racine
- TypeScript partout où c'est possible, y compris côté backend
- Nommage des fichiers : kebab-case pour les fichiers, PascalCase pour les
  composants React
- Commits atomiques, un commit = une étape logique de la roadmap
- Ne jamais commit directement sur `main` : toujours créer une branche de
  travail (ex. `feat/<sujet>`) pour le travail en cours, même en l'absence
  de dépôt distant/PR

## Important : pédagogie
Ce projet sert aussi à apprendre. Sur toute techno nouvelle pour moi
(PostGIS notamment, patterns React, MapLibre/Leaflet) :
- Explique brièvement le *pourquoi* d'un choix technique, pas seulement le
  code
- Pour les requêtes PostGIS (ex: `ST_DWithin`, `ST_Distance`), commente ce
  que fait la requête et pourquoi cette approche plutôt qu'une autre
- Préfère des étapes courtes et vérifiables à un gros bloc de code généré
  d'un coup — je veux pouvoir relire et comprendre avant de passer à la
  suite

## Commandes utiles
- `docker compose up -d` : lance PostgreSQL/PostGIS en local
- `npm run dev` (dans `client/` et `server/`) : lance les serveurs de dev
- `npm run test` (dans `client/` et `server/`) : lance les tests Vitest
  unitaires (sans dépendance externe)
- `npm run test:integration` (dans `server/`) : tests contre le vrai
  Postgres/PostGIS local (nécessite `docker compose up -d`)
- `npm run db:generate` / `npm run db:migrate` (dans `server/`) : migrations
  DB via drizzle-kit
- (à compléter au fur et à mesure : lint...)

## Hors scope pour l'instant
Ne pas anticiper les phases suivantes (recherche, filtres, cafés à
proximité, itinéraire, suggestions utilisateurs) sauf si explicitement
demandé — on avance phase par phase.

## Agent skills

### Issue tracker

Issues et specs vivent sous forme de fichiers markdown locaux dans
`.scratch/`. Voir `docs/agents/issue-tracker.md`.

### Triage labels

Labels canoniques par défaut (`needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, `wontfix`). Voir
`docs/agents/triage-labels.md`.

### Domain docs

Single-context — un `CONTEXT.md` + `docs/adr/` à la racine du repo. Voir
`docs/agents/domain.md`.