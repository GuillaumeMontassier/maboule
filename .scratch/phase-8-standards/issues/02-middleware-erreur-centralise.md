# 02 — Middleware d'erreur centralisé côté serveur

**What to build:** Remplacer les blocs `try/catch` dupliqués dans chaque handler de route par un middleware d'erreur Express unique — les handlers `throw`/`next(error)` au lieu de catcher individuellement, le middleware centralisé traduit chaque type d'erreur connu (`RouteNotFoundError` → 404, `AddressNotFoundError` → 404, `OpenRouteServiceUnavailableError` → 502, tout le reste → 500 message générique) en réponse HTTP, avec `console.error` pour le détail non exposé au client.

**Blocked by:** 01 (découpage en routers — éviter de modifier `app.ts` en parallèle sur les deux tickets)

**Status:** done

**Origine :** `.scratch/phase-8-standards/spec.md`, écart réel contre la règle `CLAUDE.md` "Bonnes pratiques Express" ("centraliser la gestion des erreurs dans un middleware dédié plutôt que des try/catch dispersés"). Pattern actuel dupliqué à l'identique sur 4 handlers dans `server/src/app.ts` (lignes 91-93, 119-121, 144-158, 172-183) : chaque route catch elle-même ses erreurs et distingue les types d'erreur connus. Le code de traduction erreur → statut HTTP est déjà cohérent (voir `spec.md`, "déjà conforme") — ce ticket ne change pas ce mapping, seulement où il vit.

- [x] Un middleware d'erreur Express unique (signature à 4 arguments, monté en dernier) centralise la traduction erreur → réponse HTTP, remplaçant les `try/catch` individuels des routes déplacées au ticket 01 — `server/src/middleware/errorHandler.ts`, monté après les deux routers dans `app.ts`. Express 5 forwarde automatiquement les rejets de promesse des handlers `async` vers ce middleware (pas besoin de `next(error)` explicite dans les routes)
- [x] Le mapping erreur → code HTTP reste identique à l'existant : `RouteNotFoundError`/`AddressNotFoundError` → 404 avec `error.message`, `OpenRouteServiceUnavailableError` → 502 avec `error.message`. Pour le cas générique ("tout le reste"), les 4 handlers avaient chacun un message 500 différent avant ce ticket (ex. "Erreur lors de la récupération des boulodromes" vs "...du calcul de l'itinéraire") ; centraliser dans un seul middleware implique un message unique — choix : `"Erreur inattendue côté serveur"`, déjà le texte utilisé pour ce cas dans la doc OpenAPI (`server/src/openapi/document.ts`) sur les 4 endpoints, donc aucune incohérence introduite avec la doc publiée. Aucun test n'exerçait le texte des anciens messages 500 génériques (vérifié par recherche dans les tests existants)
- [x] `console.error` conservé côté serveur pour le cas 500 générique (diagnostic), toujours absent de la réponse client — couvert par un test dédié (`server/src/middleware/errorHandler.test.ts`)
- [x] Les endpoints sans erreur métier spécifique (`/api/boulodromes`, `/api/boulodromes/:id/cafes`) passent aussi par le middleware plutôt que de garder leur propre `catch` — plus aucun `try/catch` dans `server/src/routes/*.routes.ts`
- [x] Tests d'intégration existants (`server/src/app.integration.test.ts`) toujours verts sans changement de leurs assertions (mêmes codes HTTP, mêmes corps de réponse pour chaque cas d'erreur déjà testé) — 38/38 passent. Ajout de `server/src/middleware/errorHandler.test.ts` (5 tests unitaires sur le mapping erreur → HTTP) ; 44/44 tests unitaires passent, typecheck propre

**Out of scope :**
- Changer les codes HTTP ou les messages d'erreur existants — ce ticket ne fait que déplacer la logique, pas la modifier
