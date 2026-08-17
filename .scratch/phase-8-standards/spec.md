# Spec — Phase 8 : Alignement aux standards de code

## Contexte

`CLAUDE.md` a été mis à jour avec deux nouvelles sections, "Bonnes
pratiques React" et "Bonnes pratiques Express" (2026-08-17). Cette phase
audite le code existant contre ces règles et corrige les écarts réels —
elle ne réimplémente pas ce qui est déjà conforme.

## Décision de triage

La règle Express initiale ("routes → controllers → services → Drizzle") ne
correspondait pas au code réel : `server/src/app.ts` contient tous les
endpoints dans un seul fichier, et l'accès aux données passe déjà par un
repository pattern (`server/src/db/boulodromesRepository.ts`,
`cafesRepository.ts`, `server/src/routing/openRouteServiceClient.ts`) —
tesé, fonctionnel, sans couche controllers/services.

Décision (tranchée avec l'auteur du projet) : garder le repository
pattern, ne pas introduire de couche controllers/services séparée. Seul le
découpage en routers par ressource est retenu comme écart réel à corriger
(actuellement tout dans `app.ts`). `CLAUDE.md` a été corrigé en conséquence
pour décrire l'architecture réellement en place plutôt que de l'imposer au
code après coup.

## Audit — écarts trouvés vs règles déjà respectées

**Déjà conforme, aucun ticket :**
- Composants fonctionnels uniquement (aucun composant classe)
- Un composant par fichier, PascalCase
- Typage des props par interface dédiée — aucun `any` trouvé (`grep -rn
  ": any\b" client/src` → vide)
- Appels réseau déjà centralisés dans `client/src/api/*.ts` (un fichier par
  ressource) — la ligne `CLAUDE.md` qui citait `services/api.ts` (chemin
  inexistant) a été corrigée pour citer le vrai chemin
- États async à 3 valeurs (chargement/erreur/succès) déjà en place dans
  `BoulodromeSearch.tsx` (`SearchState`) et `RoutePanel.tsx` (`RouteState`)
- Validation Zod systématique côté serveur (query params, body) — en place
  depuis la Phase 3
- Codes HTTP cohérents (400/404/500/502) — déjà utilisés de façon
  différenciée dans `app.ts`
- Pas de stack trace ni message interne brut renvoyé au client — les
  handlers de `app.ts` distinguent erreurs typées (`RouteNotFoundError`,
  `AddressNotFoundError`, `OpenRouteServiceUnavailableError`, message
  contrôlé) d'un message générique fixe sur 500 (`console.error` côté
  serveur uniquement pour le détail)
- Variables sensibles via environnement (`ORS_API_KEY`) — déjà le cas
- Accessibilité de base — couverte par les tickets a11y de la Phase 6
  (13, 14, 15, 28)

**Écarts réels, tickets créés ci-dessous :**
- Pas de découpage en routers par ressource (tout dans `app.ts`) — ticket 01
- Pas de middleware d'erreur centralisé (try/catch dupliqué par route dans
  `app.ts`) — ticket 02
- `console.log`/`console.error` disséminés côté serveur (`index.ts`,
  scripts d'ingestion, `migrate.ts`), pas de format structuré — ticket 03
- Logique métier (sélection de boulodrome, chargement des cafés à
  proximité) non extraite dans un hook custom dans `BoulodromesMap.tsx`,
  contrairement à `use-boulodrome-history.ts`/`use-theme.ts` déjà en place
  — ticket 04
- Le chargement des cafés à proximité (`nearbyCafes`) ne suit pas le
  pattern à 3 états : une erreur retombe silencieusement sur `null` sans
  état "erreur" exposé — écart réel par rapport à la règle, mais peut-être
  un choix délibéré (commentaire existant : "un probleme sur les cafes ne
  doit pas empecher d'afficher la popup du boulodrome") — ticket 05 tranche
  la question plutôt que d'imposer un des deux comportements sans
  discussion

## Ordre de traitement

Ticket 02 dépend du découpage en routers du ticket 01 (éviter de modifier
`app.ts` en parallèle sur les deux tickets). Les tickets 03, 04, 05 sont
indépendants et peuvent être pris dans n'importe quel ordre.
