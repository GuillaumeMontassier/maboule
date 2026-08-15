Status: ready-for-agent

# Itinéraire à pied vers un boulodrome

## Problem Statement

Un utilisateur qui a repéré un boulodrome sur la carte n'a aucun moyen, dans
l'app, de savoir comment s'y rendre à pied depuis où il se trouve (ou depuis
un autre point de départ). Il doit sortir de l'app vers un outil de
navigation externe, perdant le contexte (boulodrome sélectionné, cafés à
proximité déjà affichés).

## Solution

Ajouter un Itinéraire à pied entre un point de départ choisi par
l'utilisateur (sa position GPS ou une adresse recherchée) et un boulodrome
(sélectionné par clic sur la carte ou par recherche par mot-clé), calculé
via OpenRouteService et affiché comme un tracé sur la carte avec distance et
durée estimée.

## User Stories

1. En tant qu'utilisateur, je veux voir une option "Itinéraire" quand je
   sélectionne un boulodrome, afin de savoir comment m'y rendre.
2. En tant qu'utilisateur, je veux pouvoir rechercher un boulodrome par mot-clé,
   afin de demander un itinéraire sans avoir à le repérer d'abord sur la
   carte.
3. En tant qu'utilisateur, je veux pouvoir utiliser ma position GPS actuelle
   comme point de départ, afin de ne rien avoir à saisir.
4. En tant qu'utilisateur, je veux pouvoir rechercher une adresse comme point
   de départ, afin de planifier un itinéraire depuis un autre endroit que là
   où je me trouve.
5. En tant qu'utilisateur, je veux voir le tracé de l'itinéraire affiché sur
   la carte, afin de visualiser le trajet à suivre.
6. En tant qu'utilisateur, je veux voir la distance et la durée estimée de
   l'itinéraire, afin de savoir combien de temps le trajet va prendre.
7. En tant qu'utilisateur, je veux être informé clairement quand aucun
   itinéraire n'est trouvé entre les deux points, afin de comprendre que ce
   n'est pas un bug.
8. En tant qu'utilisateur, je veux être informé clairement quand le
   navigateur ne peut pas fournir ma position (permission refusée ou
   fonctionnalité non disponible), afin de savoir que je dois utiliser la
   recherche d'adresse à la place.
9. En tant qu'utilisateur, je veux un message clair quand ma recherche
   d'adresse ne renvoie aucun résultat, afin de reformuler ma recherche.
10. En tant qu'utilisateur, je veux pouvoir choisir parmi plusieurs résultats
    quand ma recherche d'adresse est ambiguë, afin de sélectionner la bonne
    adresse.
11. En tant qu'utilisateur, je veux que l'app reste utilisable si le service
    de routage est temporairement indisponible, afin de ne pas me retrouver
    avec un écran cassé ou vide.
12. En tant qu'utilisateur, je veux que l'itinéraire affiché disparaisse
    quand je change de boulodrome sélectionné ou ferme le popup, afin de ne
    pas accumuler des tracés obsolètes sur la carte.
13. En tant qu'utilisateur, je veux que les messages d'erreur soient en
    français, afin d'avoir une expérience cohérente avec le reste de l'UI.
14. En tant que développeur, je veux que la clé API OpenRouteService reste
    côté serveur uniquement, afin qu'elle ne soit jamais exposée dans le
    bundle client.
15. En tant que développeur, je veux que les endpoints de routage et de
    géocodage suivent les conventions existantes (GeoJSON, validation Zod,
    format d'erreur `{ error }`), afin de garder l'API cohérente.
16. En tant que développeur, je veux que les appels HTTP vers
    OpenRouteService soient isolés derrière un seul module client, afin que
    les tests puissent mocker la frontière réseau sans dupliquer ce mock à
    chaque point d'appel.
17. En tant que développeur, je veux réutiliser les types `Address` /
    `GeoCoordinates` déjà partagés entre `Boulodrome` et `Café`, afin de ne
    pas introduire de types géographiques parallèles pour le point de
    départ.

## Implementation Decisions

- **Vocabulaire** : voir `CONTEXT.md` (Itinéraire, Point de départ) et
  `docs/adr/0001-openrouteservice-over-self-hosted-osrm.md` pour le choix de
  fournisseur.
- **Client OpenRouteService** : un module backend unique qui encapsule les
  appels HTTP vers OpenRouteService, exposant deux opérations : calcul
  d'itinéraire piéton (origine + destination → géométrie, distance, durée)
  et géocodage (adresse → liste de candidats avec coordonnées). C'est la
  seule frontière réseau sortante du feature ; tout le reste du code ne
  parle qu'à ce module, jamais directement à `fetch`/ORS.
- **Endpoint itinéraire** : `GET /api/boulodromes/:id/route?from=<lat>,<lng>`.
  Réutilise `findBoulodromeById` pour résoudre la destination (404 si
  boulodrome inconnu, même pattern que l'endpoint `/cafes`). Le point de
  départ est validé par un schéma Zod (paire de coordonnées). Réponse :
  une unique GeoJSON `Feature` de géométrie `LineString` (et non une
  `FeatureCollection` — il n'y a qu'un itinéraire par requête, contrairement
  aux boulodromes/cafés qui sont pluriels), avec `distanceMeters` et
  `durationSeconds` dans les `properties`.
- **Endpoint géocodage** : `GET /api/geocode?q=<adresse>`, endpoint autonome
  (pas rattaché à un boulodrome). `q` validé par Zod (chaîne non vide).
  Réponse : liste JSON de candidats (`{ label, coordinates }`), triée par
  pertinence. Liste vide quand aucune adresse ne correspond.
- **Gestion d'erreurs** (même format `{ error: string }` que les endpoints
  existants, logging via `console.error`) :
  - Aucun itinéraire trouvé entre les deux points → 404.
  - Aucune adresse trouvée par le géocodage → 404.
  - Plusieurs adresses candidates → 200 avec la liste complète (ce n'est pas
    une erreur, c'est au frontend de proposer un choix).
  - OpenRouteService indisponible, en timeout, ou quota dépassé → 502/503.
  - Permission GPS refusée ou géolocalisation non disponible → géré
    entièrement côté frontend (aucun appel réseau n'est déclenché), pas de
    cas backend correspondant.
  - Pas de retry, pas de fournisseur de repli : hors de portée pour cette
    version.
- **Frontend — sélection de la destination (point B)** : en plus du clic sur
  un marqueur boulodrome existant, une nouvelle recherche par mot-clé
  (nouveau champ de recherche dans l'UI, branché sur le paramètre `q` déjà
  supporté par `GET /api/boulodromes` côté backend depuis la Phase 3, mais
  jusqu'ici non exposé côté frontend).
- **Frontend — sélection du point de départ (point A)** : un panneau
  "Itinéraire" apparaissant lors de la sélection d'un boulodrome, avec deux
  options : "Utiliser ma position" (`navigator.geolocation`) ou une
  recherche d'adresse (appelle le nouvel endpoint de géocodage). Pas de
  sélection par clic sur la carte pour cette version.
- **Frontend — affichage** : le tracé retourné est dessiné comme une
  polyligne Leaflet sur la carte, avec distance et durée affichées à côté.
  Suit la même discipline de nettoyage que les marqueurs cafés existants
  (`BoulodromesMap.tsx`) : le tracé et le marqueur de départ sont retirés à
  la fermeture du popup ou au changement de boulodrome sélectionné, pas
  d'accumulation.
- **Modules API frontend** : `client/src/api/route.ts` et
  `client/src/api/geocode.ts`, wrappers `fetch` suivant le même pattern que
  `client/src/api/cafes.ts` et `client/src/api/boulodromes.ts`.
- **Configuration** : clé API OpenRouteService lue depuis une variable
  d'environnement côté serveur uniquement (jamais exposée au bundle client).

## Testing Decisions

Un bon test vérifie un comportement observable de l'extérieur (requête →
réponse, props → rendu) et ne mocke que la véritable frontière d'E/S — pas
les couches internes.

- **Module client OpenRouteService** : c'est la seule chose mockée côté
  backend. Tout le reste (routes Express, validation Zod, recherche du
  boulodrome en base, conversion GeoJSON) s'exécute réellement dans les
  tests.
- **Fonctions de formatage pures** (mapping réponse ORS → notre format
  GeoJSON, mapping requête → payload ORS) : tests unitaires sans mock,
  entrée/sortie directe — même pattern que `toCafe` /
  `osmCafes.test.ts`.
- **Endpoints `/api/boulodromes/:id/route` et `/api/geocode`** : tests
  d'intégration via `supertest` contre l'app Express réelle (et le vrai
  Postgres/PostGIS local pour la résolution du boulodrome), avec seul le
  module client OpenRouteService mocké — même pattern que
  `app.integration.test.ts` (cas nominal, 404 boulodrome/adresse inconnus,
  400 sur paramètres invalides, 502/503 sur échec du fournisseur).
- **Frontend** : mock de `client/src/api/route.ts` et
  `client/src/api/geocode.ts` (comme le `vi.mock("../api/cafes", ...)`
  existant dans `BoulodromesMap.test.tsx`), tests de composant via React
  Testing Library sur le reste de l'arbre réel — affichage du panneau
  itinéraire, déclenchement par GPS/recherche d'adresse, tracé affiché,
  retrait au changement de sélection.

## Out of Scope

- Itinéraire multi-étapes (ex. avec un arrêt café en chemin) — décision
  explicite, voir grilling Q1.
- Sélection du point de départ par clic sur la carte — décision explicite,
  voir grilling Q6.
- Modes de transport autres que la marche à pied (vélo, voiture) — décision
  explicite, voir grilling Q3.
- OSRM auto-hébergé — voir `docs/adr/0001-openrouteservice-over-self-hosted-osrm.md`.
- Instructions de navigation pas-à-pas (texte) — seuls le tracé, la distance
  et la durée sont affichés.
- Cache des itinéraires, retry, backoff, ou fournisseur de repli en cas de
  panne d'OpenRouteService.
- Restriction géographique explicite du géocodage (au-delà du fait que
  l'app est déjà centrée sur Paris) — non traitée dans ce spec.

## Further Notes

- OpenRouteService offre gratuite : 2000 requêtes/jour, 40/min — largement
  suffisant pour une app à faible trafic, mais à garder en tête en cas de
  pic (ex. démonstration publique).
- Ce spec clôt les deux items restants de la Phase 5 du `ROADMAP.md`
  ("Intégration d'une API de routing" et les tests unitaires associés).
- `CONTEXT.md` et l'ADR-0001 ont été produits pendant la session de
  grilling qui a précédé ce spec ; s'y référer pour le vocabulaire et le
  raisonnement derrière le choix de fournisseur.
