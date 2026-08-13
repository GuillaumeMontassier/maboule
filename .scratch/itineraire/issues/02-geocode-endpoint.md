# 02 — Endpoint de géocodage d'adresse

**What to build:** un endpoint backend qui transforme une adresse recherchée
en une liste de coordonnées candidates via OpenRouteService. Vérifiable
indépendamment du frontend (curl / Swagger UI sur `/docs`).

**Blocked by:** None — can start immediately (touche le même module client
OpenRouteService que le ticket 01 — pas de dépendance logique, mais possible
conflit de merge si développés en parallèle sans coordination)

**Status:** done

- [x] Le module client OpenRouteService (créé ou complété au ticket 01)
      expose une opération de géocodage — toujours la seule frontière
      réseau sortante, jamais d'appel direct à OpenRouteService ailleurs
      dans le code.
- [x] `GET /api/geocode?q=<adresse>` : `q` validé par un schéma Zod
      (chaîne non vide).
- [x] Réponse 200 : liste JSON de candidats (`{ label, coordinates }`),
      triée par pertinence — y compris quand il y a plusieurs candidats
      (ce n'est pas une erreur, c'est au frontend de proposer un choix).
- [x] 404 si aucune adresse ne correspond ; 400 si `q` est absent ou vide ;
      502/503 si OpenRouteService échoue, time out, ou renvoie un quota
      dépassé. Même format d'erreur `{ error: string }` que les endpoints
      existants, logué via `console.error`.
- [x] Doc OpenAPI générée depuis les mêmes schémas Zod, exposée sur
      `/docs` et `/openapi.json`.
- [x] Tests unitaires sans mock sur les fonctions pures de
      formatage/mapping (requête → payload ORS, réponse ORS → notre
      format de candidats).
- [x] Tests d'intégration `supertest` contre l'app Express réelle, avec
      seul le module client OpenRouteService mocké : cas nominal (un
      candidat), plusieurs candidats, 404 aucun résultat, 400 `q` invalide,
      502/503 échec fournisseur.
- [x] Réutilise la même variable d'environnement pour la clé API
      OpenRouteService que le ticket 01 (côté serveur uniquement).

## Comments

Implémenté dans `server/src/routing/openRouteServiceClient.ts`
(`fetchGeocodeCandidates`, `buildGeocodeSearchParams`, `toGeocodeCandidates`,
`AddressNotFoundError`), `server/src/schemas/geocodeQuery.ts` (`q`),
`server/src/schemas/geocodeCandidate.ts` (schémas OpenAPI
`GeocodeCandidate`/`GeocodeCandidateList`), endpoint dans `server/src/app.ts`.

Différence avec `/route` (ticket 01) : ORS expose le géocodage (Pelias) en
GET avec la clé API en query param `api_key`, pas en en-tête `Authorization`
comme pour les directions (POST) — les deux frontières réseau restent
isolées dans le même module client mais avec des mécanismes d'auth
différents, documentés en commentaire. Autre différence : "aucun résultat"
n'est pas un code d'erreur ORS distinct côté géocodage (contrairement aux
codes 2009/2010 des directions) — Pelias renvoie un 200 avec une liste de
features vide, qu'on traduit nous-mêmes en `AddressNotFoundError` (404) dans
`toGeocodeCandidates`. Toute autre réponse non-`ok` est traduite en 502
(même convention uniforme que `/route`, non vérifiée contre un vrai quota
dépassé/panne réelle — seulement contre un 401 avec clé API locale vide).

Vérifié manuellement (serveur local + curl) : 400 `q` absent, 400 `q` vide,
502 sur `q` valide (clé API locale vide → 401 ORS), `/openapi.json` expose
bien `/api/geocode`.

Revue via `/code-review` (niveau medium) : deux observations de
simplification remontées, toutes deux hors scope de ce ticket — (1)
`fetchGeocodeCandidates` duplique le boilerplate AbortController/timeout de
`fetchWalkingRoute` (ticket 01, code déjà committé) plutôt que d'en extraire
un helper partagé ; (2) le handler `/api/boulodromes` (Phase 3, hors scope
itinéraire) construit encore sa réponse 400 à la main au lieu d'utiliser
`rejectIfInvalid`. Aucun bug trouvé. Les deux sont volontairement laissées
telles quelles pour ne pas retoucher du code d'un ticket déjà terminé/hors
périmètre ; à envisager si un ticket futur touche ces zones.
