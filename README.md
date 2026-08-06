# maboule — Carte des boulodromes de Paris

> **English summary** — A portfolio project mapping petanque courts
> (*boulodromes*) in Paris on an interactive map, built on French government
> open data. Stack: React + TypeScript on the frontend, Node.js/Express on
> the backend, PostgreSQL + PostGIS for geospatial storage. Also used as a
> learning project (author is experienced with Vue.js/Python/MongoDB, new to
> React and PostGIS) and as an opportunity to learn to work with
> [Claude Code](https://claude.com/claude-code) as an AI pair-programming
> tool. The project is currently in an early setup phase. Documentation
> below is in French; ask if an English version would help.

---

## Présentation

Carte interactive des boulodromes de Paris, construite à partir de données
publiques. Le projet a un triple objectif : produire un outil réellement
utilisable, servir de terrain d'apprentissage sur des technos moins
familières à l'auteur — React côté frontend, PostgreSQL/PostGIS côté
données géospatiales —, et explorer l'utilisation de
[Claude Code](https://claude.com/claude-code) comme outil de développement
assisté par IA.

## Stack technique

- **Frontend** : React + TypeScript, carte via Leaflet ou MapLibre GL
- **Backend** : Node.js / Express
- **Base de données** : PostgreSQL + PostGIS (extension géospatiale)
- **ORM** : Drizzle (migrations via `drizzle-kit`)
- **Tests** : Vitest (backend et frontend)
- **Format d'échange géographique** : GeoJSON

## Statut du projet

Le projet est en cours de développement, une version MVP sera disponible prochainement.

## Démarrage rapide

Prérequis : Node.js, Docker.

1. **Base de données** (PostgreSQL + PostGIS via Docker)

   ```bash
   cp .env.example .env
   docker compose up -d
   ```

2. **Dépendances** (installe les workspaces `client/` et `server/`)

   ```bash
   npm install
   ```

3. **Backend** — configuration et migrations

   ```bash
   cp server/.env.example server/.env
   cd server
   npm run db:migrate
   ```

4. **Import des données** (récupère les boulodromes parisiens depuis Data ES
   et les insère en base)

   ```bash
   npm run ingest
   ```

5. **Lancer les serveurs de dev** (dans deux terminaux séparés)

   ```bash
   # server/
   npm run dev

   # client/
   npm run dev
   ```

## Données & attribution

Les données des boulodromes sont récupérées via l'API **Data ES**
(`equipements.sports.gouv.fr`), la base nationale des équipements sportifs
tenue par le ministère chargé des Sports, filtrée sur les installations
parisiennes. Ces données sont publiées sous **Licence Ouverte / Open Licence
(Etalab)**.

Une intégration complémentaire avec le portail open data de la **Ville de
Paris** (opendata.paris.fr, également sous Licence Ouverte) est envisagée
pour une phase ultérieure.

Les données des cafés/bars/pubs proviennent d'**OpenStreetMap** (via
l'API Overpass), sous licence **ODbL (Open Database License)** :
`© les contributeurs d'OpenStreetMap`.

## Licence

Code sous licence [MIT](./LICENSE).
