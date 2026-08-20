# VS Code Dev Containers pour l'environnement de dev

Le développement se fait sur deux machines (Windows 11 personnel, macOS
professionnel), avec des bascules fréquentes (plusieurs fois par semaine) et
une volonté explicite de garder le poste professionnel exempt de dépendances
globales (Node, Postgres...). `docker compose up -d` couvre déjà
Postgres/PostGIS en local, mais Node et les outils client/server restent
installés nativement sur chaque machine. Décision : passer à VS Code Dev
Containers (`devcontainer.json`) pour tout l'environnement de dev — un seul
conteneur pour le workspace npm (`client` + `server`), Postgres/PostGIS
restant un service sidecar référencé via le `docker-compose.yml` existant
(`dockerComposeFile` dans `devcontainer.json`), pas remplacé. Le
`Dockerfile` de prod (multi-stage, Railway) reste séparé et n'est pas
réutilisé pour le dev — ses besoins (build optimisé, `--omit=dev`) sont à
l'opposé de ceux d'un conteneur de dev (dépendances dev, hot reload).

Même raisonnement que documenté sur soochy-v2 (apprentissage délibéré de la
technique + séparation pro/perso sur le poste macOS + fréquence de bascule),
appliqué ici au projet réel plutôt qu'à un scaffold vide — WSL2 et Docker
Desktop sont déjà en place et vérifiés sur les deux machines.

## Considered Options

- **Rester sur `docker compose up -d` (services uniquement) + Node natif** —
  écarté : ne répond pas à l'objectif de zéro dépendance globale sur le
  poste professionnel, seul Postgres est actuellement conteneurisé.
- **Réutiliser le `Dockerfile` de prod comme base du conteneur de dev** —
  écarté : ce Dockerfile est optimisé pour un build de prod minimal
  (`--omit=dev`, pas de client dev server), pas pour de l'itération avec
  hot reload.

## Consequences

- `docker-compose.yml` n'est pas réécrit : le futur `devcontainer.json`
  s'y greffe via `dockerComposeFile` plutôt que de dupliquer la définition
  du service `db`.
- Un nouveau service (ou une image de base) doit être ajouté pour le
  conteneur de dev lui-même (Node + outils), distinct du service `db`
  existant et du `Dockerfile` de prod.
- Pas de synchronisation des données Postgres/PostGIS entre les deux
  machines (attendu, inchangé par cette décision).
- Le scaffolding effectif (`.devcontainer/devcontainer.json`) n'est pas fait
  par cette décision — à traiter comme un chantier séparé, le projet ayant
  déjà du code contrairement à soochy-v2 où la décision précède le
  scaffolding.
