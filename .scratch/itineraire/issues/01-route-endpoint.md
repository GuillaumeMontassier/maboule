# 01 — Endpoint d'itinéraire piéton entre deux points

**What to build:** un endpoint backend qui calcule un itinéraire à pied entre
un point de départ et un boulodrome via OpenRouteService, et le renvoie au
format GeoJSON avec distance et durée. Vérifiable indépendamment du
frontend (curl / Swagger UI sur `/docs`).

**Blocked by:** None — can start immediately

**Status:** done

- [x] Un module client OpenRouteService encapsule l'appel HTTP de routage
      (profil piéton) — c'est la seule frontière réseau sortante pour ce
      ticket ; rien d'autre dans le code ne parle directement à
      OpenRouteService.
- [x] `GET /api/boulodromes/:id/route?from=<lat>,<lng>` : résout le
      boulodrome via `findBoulodromeById` (comme l'endpoint `/cafes`
      existant), valide `from` via un schéma Zod (paire de coordonnées).
- [x] Réponse 200 : une unique GeoJSON `Feature` (pas une
      `FeatureCollection`) de géométrie `LineString`, avec
      `distanceMeters` et `durationSeconds` dans les `properties`.
- [x] 404 si le boulodrome est inconnu ; 404 si aucun itinéraire n'est
      trouvé entre les deux points ; 400 si `from` est absent ou invalide ;
      502/503 si OpenRouteService échoue, time out, ou renvoie un quota
      dépassé. Même format d'erreur `{ error: string }` que les endpoints
      existants, logué via `console.error`.
- [x] Doc OpenAPI générée depuis les mêmes schémas Zod, exposée sur
      `/docs` et `/openapi.json`, même principe que les endpoints
      existants.
- [x] Tests unitaires sans mock sur les fonctions pures de
      formatage/mapping (requête → payload ORS, réponse ORS → notre
      format GeoJSON) — même pattern que `toCafe` / `osmCafes.test.ts`.
- [x] Tests d'intégration `supertest` contre l'app Express réelle et le
      vrai Postgres/PostGIS local (pour la résolution du boulodrome), avec
      seul le module client OpenRouteService mocké — même pattern que
      `app.integration.test.ts` : cas nominal, 404 boulodrome inconnu,
      404 aucun itinéraire, 400 paramètre invalide, 502/503 échec
      fournisseur.
- [x] Clé API OpenRouteService lue depuis une variable d'environnement
      côté serveur uniquement.

## Comments

Implémenté dans `server/src/routing/openRouteServiceClient.ts`
(`fetchWalkingRoute`, `buildDirectionsRequestBody`, `toRouteFeature`),
`server/src/schemas/routeQuery.ts` (`from`), `server/src/schemas/routeProperties.ts`
(schémas OpenAPI `LineStringGeometry`/`RouteProperties`/`RouteFeature`), endpoint
dans `server/src/app.ts`. 502 uniforme pour panne/timeout/quota ORS (pas de
distinction 503 utile côté appelant, décision documentée en commentaire).
Les codes d'erreur ORS "point/itinéraire introuvable" (2009/2010) utilisés
pour distinguer le 404 métier du 502 fournisseur sont documentés d'après la
doc ORS mais non vérifiés contre un appel réel (clé API locale vide) — à
confirmer si un vrai cas "aucun itinéraire" se présente en usage réel.
Revue via `/code-review` (deux axes Standards/Spec + relecture bugs) :
duplication du bloc de validation params+query factorisée (`rejectIfInvalid`
dans `app.ts`, partagée avec `/cafes`) ; bug corrigé sur le timeout ORS (ne
couvrait que la réception des en-têtes, pas la lecture du corps) ; bug
corrigé sur la validation de `from` (`Number("")` vaut `0`, un segment vide
comme `48.8566,` passait silencieusement). Vérifié manuellement (serveur
local + curl) : `/health`, 404 boulodrome inconnu, 400 `from` absent/invalide,
502 sur échec ORS réel (401, clé API vide), `/openapi.json` expose bien le
nouveau path.
