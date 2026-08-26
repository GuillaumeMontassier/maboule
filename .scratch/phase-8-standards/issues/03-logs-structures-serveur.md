# 03 — Logs structurés côté serveur

**What to build:** Remplacer les appels `console.log`/`console.error` disséminés côté serveur par un wrapper de log minimal (niveau + timestamp + champs structurés), sans introduire de nouvelle dépendance pour l'instant — cohérent avec le principe déjà posé dans `CLAUDE.md` pour la gestion d'état frontend ("pas de state management externe tant que le besoin ne s'en fait pas sentir clairement").

**Blocked by:** aucun

**Status:** done

**Origine :** `.scratch/phase-8-standards/spec.md`, écart réel contre la règle `CLAUDE.md` "Bonnes pratiques Express" ("logs structurés plutôt que des console.log disséminés"). Usages actuels sans format ni niveau distinct : `server/src/index.ts:6` (`console.error("uncaughtException", ...)`), `:10` (`console.error("unhandledRejection", ...)`), `:17` (`console.log` démarrage serveur), `server/src/db/migrate.ts:7` (`console.log("Migrations appliquées")`), `server/src/ingestion/run.ts:7,10` et `runCafes.ts:7,10` (logs de progression d'ingestion), `server/src/app.ts` (`console.error(error)` dans les handlers, à adapter aussi si le ticket 02 est fait en premier).

- [x] Un module de log minimal (`server/src/logger.ts`) expose deux niveaux (`info`, `error`), chaque appel produit une ligne JSON structurée (timestamp ISO + niveau + message + champs additionnels optionnels) plutôt qu'une simple concaténation de chaîne. Une valeur `Error` passée en champ additionnel (ex. `{ error }`) est normalisée en `{ name, message, stack }` — sinon `JSON.stringify(new Error(...))` vaut `{}` (propriétés non énumérables) et le détail de l'erreur disparaîtrait du log
- [x] Pas de nouvelle dépendance (pino/winston/etc.) — wrapper autour de `console.log`/`console.error` en interne, remplaçable plus tard sans changer l'API appelante (`logger.info`/`logger.error`)
- [x] Tous les `console.log`/`console.error` de `server/src` (hors tests) migrent vers ce module : `index.ts`, `db/migrate.ts`, `ingestion/run.ts`, `ingestion/runCafes.ts`, et `middleware/errorHandler.ts` (ticket 02) — vérifié par recherche, plus aucune occurrence hors `logger.ts`/`logger.test.ts`
- [x] Aucun changement de comportement fonctionnel (les scripts d'ingestion et migration continuent d'informer sur leur progression, juste dans un format structuré)
- [x] Tests existants toujours verts — 51/51 tests unitaires (dont 7 nouveaux pour `logger.ts`), 38/38 tests d'intégration, typecheck propre

**Durci suite au code review** (deux bugs réels introduits par ce ticket, corrigés avant commit) :
- `JSON.stringify` lève sur une référence circulaire (déjà vu sur des objets d'erreur réseau/driver) — sans filet, `logger.error('uncaughtException', { error })` dans `index.ts` aurait pu faire planter le handler global lui-même sur une erreur mal formée, empêchant le `process.exit(1)` qui suit. Ajout d'un `safeStringify` avec repli sur une ligne minimale (timestamp/level/message) en cas d'échec de sérialisation
- Les champs additionnels étaient fusionnés après `timestamp`/`level`/`message`, donc un appel avec un champ nommé par hasard `message`/`level`/`timestamp` écrasait silencieusement les métadonnées réservées de la ligne de log. Inversé l'ordre de fusion pour que les champs réservés gagnent toujours

**Out of scope :**
- Introduire une vraie librairie de logging (pino, winston) — à reconsidérer seulement si un besoin concret apparaît (ex. export vers un service de logs externe)
- Logs côté frontend (hors périmètre de la règle Express)
