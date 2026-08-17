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
- **Documentation API** : Swagger/OpenAPI à partir de la Phase 2, généré
  depuis des schémas Zod (`drizzle-zod` + `zod-to-openapi`) — voir
  `ROADMAP.md`
- **Licence** : MIT, avec attribution à la Ville de Paris (Licence Ouverte)
  pour les données open data
- **Format d'échange** : GeoJSON pour tout ce qui est géographique

## Roadmap
La roadmap complète du projet (phases, fonctionnalités, tests associés à
chaque phase) est dans `ROADMAP.md` à la racine du repo. Toujours s'y
référer pour savoir où on en est et ce qui est prévu pour la suite — ne pas
anticiper une phase sans qu'elle soit explicitement demandée.

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

## Bonnes pratiques React
- Composants fonctionnels uniquement, avec hooks — jamais de composants
  classe
- Un composant par fichier, nommé en PascalCase (`BoulodromeCard.tsx`)
- Séparer la logique métier de l'affichage : extraire la logique réutilisable
  dans des hooks custom (`useBoulodromes.ts`) plutôt que de tout mettre dans
  le composant
- Typer les props de chaque composant avec une interface TypeScript dédiée,
  jamais de `any`
- Ne jamais appeler `fetch`/l'API directement dans un composant : passer par
  la couche dédiée déjà en place (`client/src/api/*.ts`, un fichier par
  ressource — `boulodromes.ts`, `cafes.ts`, `geocode.ts`, `route.ts`)
- Gérer explicitement 3 états pour toute donnée asynchrone : chargement,
  erreur, succès — jamais juste "ça marche ou ça plante silencieusement"
- Respecter les règles des hooks (pas de hook dans une condition/boucle) et
  éviter les `useEffect` superflus — si une valeur peut être calculée
  directement au rendu, ne pas passer par un `useEffect` + `useState`
- Accessibilité de base : `alt` sur les images, `aria-label` sur les boutons
  qui n'ont qu'une icône (ex: bouton itinéraire, zoom)
- Pas de state management externe (Redux, Zustand) tant que le besoin ne
  s'en fait pas sentir clairement — rester sur `useState`/`useContext` pour
  un projet de cette taille

## Bonnes pratiques Express
- Pas de couche `controllers`/`services` séparée : les handlers de route
  appellent directement la couche repository (`server/src/db/*Repository.ts`)
  ou les clients externes (`server/src/routing/*Client.ts`) — repository
  pattern déjà en place, à conserver tel quel plutôt que d'ajouter une
  couche d'indirection supplémentaire
- Un router par ressource/domaine (`boulodromes.routes.ts`,
  `cafes.routes.ts`), monté depuis un point d'entrée central — plutôt que
  tous les endpoints dans un seul `app.ts`
- Valider systématiquement les entrées (body, params, query) avec Zod avant
  tout traitement — ne jamais faire confiance à ce qui arrive du client
- Centraliser la gestion des erreurs dans un middleware dédié plutôt que des
  `try/catch` dispersés avec des formats de réponse différents partout
- Ne jamais renvoyer une stack trace ou un message d'erreur interne brut au
  client, surtout en production
- Codes HTTP cohérents et corrects (200/201 succès, 400 requête invalide,
  404 non trouvé, 500 erreur serveur) — ne pas tout renvoyer en 200
- Toute variable sensible (connexion DB, clés API) via variables
  d'environnement, jamais en dur dans le code
- Logs structurés plutôt que des `console.log` disséminés sans organisation
  — même basique, préparer le terrain pour un vrai logger plus tard

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
  DB
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