# 01 — Découper `app.ts` en routers par ressource

**What to build:** Extraire les endpoints de `server/src/app.ts` (185 lignes, tout dans un seul fichier) vers un router Express par ressource — `boulodromes.routes.ts` (`GET /api/boulodromes`, `GET /api/boulodromes/:id/cafes`, `GET /api/boulodromes/:id/route`), `geocode.routes.ts` (`GET /api/geocode`) — montés depuis `app.ts`, qui ne garde que la config globale (`cors`, `/health`, `/docs`, `/openapi.json`) et le montage des routers.

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** `.scratch/phase-8-standards/spec.md`, écart réel identifié contre la règle `CLAUDE.md` "Bonnes pratiques Express" ("un router par ressource/domaine... monté depuis un point d'entrée central"). Endpoints actuels tous dans `app.ts` : `server/src/app.ts:55` (`/health`), `:62` (`/openapi.json`), `:65` (`/docs`), `:67` (`/api/boulodromes`), `:97` (`/api/boulodromes/:id/cafes`), `:125` (`/api/boulodromes/:id/route`), `:162` (`/api/geocode`).

- [ ] Les endpoints `/api/boulodromes`, `/api/boulodromes/:id/cafes` et `/api/boulodromes/:id/route` sont déplacés dans un router dédié (ex. `server/src/routes/boulodromes.routes.ts`)
- [ ] L'endpoint `/api/geocode` est déplacé dans son propre router (ex. `server/src/routes/geocode.routes.ts`)
- [ ] `app.ts` ne garde que `cors`, `/health`, `/docs`, `/openapi.json`, et le montage des deux routers — aucune logique métier ni accès repository directement dans `app.ts`
- [ ] Aucun changement de comportement (mêmes chemins, mêmes réponses, mêmes codes HTTP) — les imports de repositories/clients externes (`db/boulodromesRepository.ts`, `db/cafesRepository.ts`, `routing/openRouteServiceClient.ts`) et le schéma OpenAPI restent inchangés
- [ ] Tests d'intégration existants (`server/src/app.integration.test.ts`) toujours verts sans modification de leur contenu (seuls les imports éventuels changent si le test importe directement `app.ts`)

**Out of scope :**
- Introduire une couche `controllers`/`services` — décision de triage (`spec.md`) : le repository pattern actuel est conservé tel quel, seul le découpage en routers est demandé
