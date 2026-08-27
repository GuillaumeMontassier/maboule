# 06 — Scaffolder `.devcontainer/devcontainer.json`

**What to build:** Scaffolder l'environnement VS Code Dev Containers pour le workspace `client`/`server`, décidé dans `docs/adr/0003-vscode-dev-containers-for-dev-environment.md` — un seul conteneur pour Node/npm (workspace complet), Postgres/PostGIS restant un service sidecar référencé via le `docker-compose.yml` existant (`dockerComposeFile`) plutôt que dupliqué.

**Blocked by:** aucun

**Status:** done

**Origine :** ROADMAP.md, hors périmètre de l'audit standards (Phase 7) mais logé au même endroit comme prochain chantier d'environnement de dev, suite à `docs/adr/0003-vscode-dev-containers-for-dev-environment.md`.

- [x] `.devcontainer/docker-compose.yml` ajoute un service `app` (image `mcr.microsoft.com/devcontainers/javascript-node:22`, Node 22 comme le `Dockerfile` de prod) sans dupliquer le service `db` existant — `.devcontainer/devcontainer.json` référence les deux fichiers (`../docker-compose.yml` + `docker-compose.yml`) via `dockerComposeFile`
- [x] `DATABASE_URL` réécrit au niveau du service `app` (`db:5432` au lieu de `localhost:5432` de `server/.env`, qui ne désigne pas le service `db` depuis ce conteneur) — sans danger : `dotenv-cli` ne réécrit jamais une variable déjà présente dans l'environnement, donc cette valeur a priorité sur celle de `server/.env` sans avoir à maintenir deux fichiers `.env` selon le contexte (natif vs conteneur)
- [x] `ORS_API_KEY` non dupliqué dans le compose du dev container — reste porté uniquement par `server/.env` (secret, pas de raison de le committer)
- [x] `postCreateCommand: npm install` à la racine (installe les workspaces `client`/`server` en une fois à l'ouverture du conteneur)
- [x] Ports serveur (3000) et client Vite (5173) déclarés via `forwardPorts`/`portsAttributes` ; port Postgres (5432) déjà publié par le `docker-compose.yml` racine, pas dupliqué
- [x] `README.md` : note courte dans "Démarrage rapide" pointant vers cette alternative, sans dupliquer les étapes déjà documentées (reprise à partir de l'étape 3 — migrations — après ouverture du conteneur)

**Vérification manuelle :** non faite dans cette session (pas de VS Code + extension Dev Containers disponible dans cet environnement d'exécution) — à vérifier par l'auteur du projet à la prochaine ouverture du repo dans VS Code ("Reopen in Container"), sur les deux machines mentionnées dans l'ADR (Windows/WSL2 et macOS).

**Out of scope :**
- Dockerfile dédié pour le conteneur de dev (l'image de base `javascript-node` officielle suffit, pas de build custom nécessaire)
- Synchronisation des données Postgres/PostGIS entre les deux machines (attendu, inchangé par l'ADR)
