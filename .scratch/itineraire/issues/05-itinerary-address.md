# 05 — Itinéraire depuis une adresse recherchée

**What to build:** dans le même panneau "Itinéraire", l'utilisateur peut
saisir une adresse comme point de départ à la place de sa position GPS,
avec un choix parmi plusieurs résultats si l'adresse est ambiguë.

**Blocked by:** Ticket 02 (endpoint `/geocode`), Ticket 04 (panneau
Itinéraire)

**Status:** done

- [x] Nouveau module `client/src/api/geocode.ts` (wrapper `fetch` vers
      `GET /api/geocode`), même pattern que les autres modules `api/`.
- [x] Le panneau "Itinéraire" (ticket 04) propose un champ de recherche
      d'adresse en plus de "Utiliser ma position".
- [x] Un seul résultat : sélectionné automatiquement, itinéraire calculé et
      affiché comme au ticket 04.
- [x] Plusieurs résultats candidats : l'utilisateur choisit parmi la liste
      avant que l'itinéraire ne soit calculé.
- [x] Aucun résultat (404 backend) : message clair, pas d'état cassé.
- [x] Le tracé suit la même discipline de nettoyage qu'au ticket 04
      (retiré à la fermeture du popup ou au changement de boulodrome).
- [x] Tests de composant : mock de `client/src/api/geocode.ts`, scénarios :
      adresse avec un seul résultat → itinéraire affiché directement,
      adresse ambiguë → liste de choix affichée puis sélection → itinéraire
      affiché, adresse sans résultat → message affiché.

## Comments

Implémenté dans `client/src/api/geocode.ts` (`fetchGeocodeCandidates`),
extension de `client/src/components/RoutePanel.tsx` (formulaire de recherche
d'adresse à côté du bouton GPS existant, ajout des états `geocoding` /
`choosing` à la state machine, `requestRoute` factorisé pour être partagé
entre le flux GPS et le flux adresse). Sélection automatique quand
`fetchGeocodeCandidates` renvoie un seul candidat, liste cliquable sinon.
Aucun résultat : traduit en message d'erreur clair côté `fetchGeocodeCandidates`
(404 → `Error`), même pattern que `fetchRoute`. 3 tests de composant ajoutés
dans `BoulodromesMap.test.tsx` (un résultat, ambigu + sélection, aucun
résultat), plus un test de régression (voir revue ci-dessous).

Vérifié manuellement en navigateur réel (Playwright, serveur local + vraie
base Postgres/PostGIS, clé ORS locale invalide) : panneau affichant bien le
champ d'adresse à côté du bouton GPS ; recherche d'adresse → 502 propre côté
UI (clé ORS de test invalide, confirme le chemin d'erreur sans état cassé,
même limite que ticket 04) ; changement de boulodrome sélectionné → panneau
remonté à l'état initial, champ adresse vidé (même discipline que le tracé/
marqueur GPS). Chemins de succès (résultat unique, choix parmi plusieurs)
vérifiés par tests de composant avec `fetchGeocodeCandidates`/`fetchRoute`
mockés, faute de clé ORS valide en local.

Revue via `/code-review` (niveau par défaut) : deux bugs trouvés et corrigés
— (1) passer à l'état `choosing` (adresse ambiguë) n'effaçait pas un tracé
déjà affiché à l'écran, contrairement à toutes les autres transitions
terminales du composant (erreur GPS, erreur géocodage) qui appellent déjà
`onRouteChange(null)` ; corrigé en ajoutant le même appel, avec un test de
régression. (2) `navigator.geolocation.getCurrentPosition` n'avait pas de
`timeout`, et le flag `busy` (qui désactive aussi le nouveau formulaire
d'adresse) incluait déjà l'état `locating` avant ce ticket : un appareil qui
ne renvoie jamais de position bloquerait indéfiniment le repli par adresse
que ce champ existe justement pour offrir. Corrigé en passant `{ timeout:
10_000 }` à `getCurrentPosition` — le message d'erreur `TIMEOUT` existait
déjà dans `geolocationErrorMessage` mais rien ne le déclenchait avant.
Plusieurs simplifications identifiées (mécanismes de garde
anti-réponse-tardive dupliqués entre composants, boilerplate `API_URL` /
mapping de statuts HTTP dupliqué entre les modules `api/`, markup de liste de
résultats dupliqué entre `RoutePanel` et `BoulodromeSearch`) volontairement
laissées telles quelles : elles touchent du code déjà committé de tickets
antérieurs (01-04), hors périmètre de ce ticket — même décision que sur le
ticket 02.
