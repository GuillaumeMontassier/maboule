# 03 — Logs structurés côté serveur

**What to build:** Remplacer les appels `console.log`/`console.error` disséminés côté serveur par un wrapper de log minimal (niveau + timestamp + champs structurés), sans introduire de nouvelle dépendance pour l'instant — cohérent avec le principe déjà posé dans `CLAUDE.md` pour la gestion d'état frontend ("pas de state management externe tant que le besoin ne s'en fait pas sentir clairement").

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** `.scratch/phase-8-standards/spec.md`, écart réel contre la règle `CLAUDE.md` "Bonnes pratiques Express" ("logs structurés plutôt que des console.log disséminés"). Usages actuels sans format ni niveau distinct : `server/src/index.ts:6` (`console.error("uncaughtException", ...)`), `:10` (`console.error("unhandledRejection", ...)`), `:17` (`console.log` démarrage serveur), `server/src/db/migrate.ts:7` (`console.log("Migrations appliquées")`), `server/src/ingestion/run.ts:7,10` et `runCafes.ts:7,10` (logs de progression d'ingestion), `server/src/app.ts` (`console.error(error)` dans les handlers, à adapter aussi si le ticket 02 est fait en premier).

- [ ] Un module de log minimal (ex. `server/src/logger.ts`) expose au moins deux niveaux (`info`, `error`), chaque appel produit une ligne structurée (timestamp + niveau + message + champs additionnels optionnels) plutôt qu'une simple concaténation de chaîne
- [ ] Pas de nouvelle dépendance (pino/winston/etc.) à ce stade — wrapper autour de `console` en interne, remplaçable plus tard sans changer l'API appelante si le besoin apparaît
- [ ] Tous les `console.log`/`console.error` de `server/src` (hors tests) migrent vers ce module : `index.ts`, `db/migrate.ts`, `ingestion/run.ts`, `ingestion/runCafes.ts`, et les handlers d'erreur de `app.ts`/du middleware du ticket 02
- [ ] Aucun changement de comportement fonctionnel (les scripts d'ingestion et migration continuent d'informer sur leur progression, juste dans un format structuré)
- [ ] Tests existants toujours verts

**Out of scope :**
- Introduire une vraie librairie de logging (pino, winston) — à reconsidérer seulement si un besoin concret apparaît (ex. export vers un service de logs externe)
- Logs côté frontend (hors périmètre de la règle Express)
