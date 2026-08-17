# 26 — Marqueurs de boulodromes : noms accessibles majoritairement non distincts malgré le ticket 14

**What to build:** Le nom accessible (`alt`) de chaque marqueur de boulodrome permet réellement de distinguer un boulodrome d'un autre au clavier/lecteur d'écran, pas seulement de distinguer un marqueur d'un `<img>` générique sans nom.

**Blocked by:** aucun

**Status:** done

**Origine :** Audit UI/UX du 2026-08-17. Le ticket 14 (« Marqueurs de boulodromes sans nom accessible distinct ») a ajouté `alt={feature.properties.name}` (`client/src/components/BoulodromesMap.tsx:186`) pour sortir du fallback Leaflet générique `"Marker"`, identique pour les 64 marqueurs. Mais `properties.name` est un champ de type d'équipement générique (ex. "TERRAIN DE PETANQUE", "BOULODROME"), pas un identifiant de site — la donnée distinctive existe déjà ailleurs dans le même objet (`properties.siteName`, déjà utilisée en popup ligne 239 et dans l'historique de recherche depuis le ticket 23) mais n'est pas utilisée pour l'`alt`.

Mesuré sur les 64 boulodromes réels de la base : 21 valeurs de `name` distinctes seulement, dont "TERRAIN DE PETANQUE" partagée par 32 marqueurs et "BOULODROME" par 8 autres — 50 marqueurs sur 64 (78 %) partagent une valeur d'`alt` non unique. Un utilisateur clavier/lecteur d'écran qui tabule la liste des marqueurs rencontre donc la même annonce "TERRAIN DE PETANQUE" 32 fois de suite, sans aucun moyen de savoir lequel est lequel avant de l'activer — l'objectif énoncé par le titre même du ticket 14 n'est donc que partiellement atteint.

- [x] L'`alt` de chaque marqueur de boulodrome permet de le distinguer des autres dans l'immense majorité des cas — `accessibleMarkerName` (`client/src/components/BoulodromesMap.tsx`) combine `name`, `siteName` (quand il diffère) et la rue
- [x] Les rares doublons résiduels ne sont pas un blocant pour ce ticket — best effort assumé, aucune garantie d'unicité absolue
- [x] Aucune régression sur le ticket 13 (activation clavier) et le ticket 14 (`alt` renseigné pour tous les marqueurs) — suite complète (101 tests) revérifiée verte
- [x] Tests étendus : `BoulodromesMap.test.tsx` vérifie que deux boulodromes de `name` identique mais de `siteName`/rue différents obtiennent un `alt` différent, et qu'une rue vide n'ajoute pas de virgule traînante
- [x] Vérifié en navigateur réel (Playwright) : sur les 38 marqueurs réels partageant aujourd'hui le préfixe `name` "TERRAIN DE PETANQUE"/"TERRAIN DE PETANQUE COUVERT"/"TERRAIN DE PETANQUE N°…", les 38 `alt` obtenus sont uniques

Revu via `/code-review` : la logique « n'afficher `siteName` que s'il diffère de `name` » était dupliquée à trois endroits (popup, nom accessible du marqueur, historique de recherche) — extraite dans `client/src/lib/site-name.ts` (`distinctSiteName`, testé isolément), et réutilisée aux trois endroits. `accessibleMarkerName` ignore aussi désormais une rue vide/blanche (évite une virgule traînante lue par un lecteur d'écran) plutôt que de la concaténer sans condition.

Noté, hors scope ici : le reviewer a aussi relevé deux points côté `BoulodromeSearch.tsx` sans lien avec ce ticket (déjà couverts par les tickets 24/25, non touchés par ce diff) — un cas résiduel où `suppressReopenOnFocusRef` n'est pas réinitialisé si la sélection se fait au clavier sans perte de focus, et la fermeture inconditionnelle de la liste avant l'échec silencieux de `selectBoulodrome` sur un résultat filtré (déjà noté et assumé au ticket 24).
