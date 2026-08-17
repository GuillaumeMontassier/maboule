# 26 — Marqueurs de boulodromes : noms accessibles majoritairement non distincts malgré le ticket 14

**What to build:** Le nom accessible (`alt`) de chaque marqueur de boulodrome permet réellement de distinguer un boulodrome d'un autre au clavier/lecteur d'écran, pas seulement de distinguer un marqueur d'un `<img>` générique sans nom.

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Audit UI/UX du 2026-08-17. Le ticket 14 (« Marqueurs de boulodromes sans nom accessible distinct ») a ajouté `alt={feature.properties.name}` (`client/src/components/BoulodromesMap.tsx:186`) pour sortir du fallback Leaflet générique `"Marker"`, identique pour les 64 marqueurs. Mais `properties.name` est un champ de type d'équipement générique (ex. "TERRAIN DE PETANQUE", "BOULODROME"), pas un identifiant de site — la donnée distinctive existe déjà ailleurs dans le même objet (`properties.siteName`, déjà utilisée en popup ligne 239 et dans l'historique de recherche depuis le ticket 23) mais n'est pas utilisée pour l'`alt`.

Mesuré sur les 64 boulodromes réels de la base : 21 valeurs de `name` distinctes seulement, dont "TERRAIN DE PETANQUE" partagée par 32 marqueurs et "BOULODROME" par 8 autres — 50 marqueurs sur 64 (78 %) partagent une valeur d'`alt` non unique. Un utilisateur clavier/lecteur d'écran qui tabule la liste des marqueurs rencontre donc la même annonce "TERRAIN DE PETANQUE" 32 fois de suite, sans aucun moyen de savoir lequel est lequel avant de l'activer — l'objectif énoncé par le titre même du ticket 14 n'est donc que partiellement atteint.

- [ ] L'`alt` de chaque marqueur de boulodrome permet de le distinguer des autres dans l'immense majorité des cas (ex. combiner `siteName`/`name` avec la rue, sur le modèle déjà utilisé par la popup ligne 238-243 et par l'historique de recherche du ticket 23 — l'`alt` étant du texte brut sans mise en forme, une simple concaténation lisible suffit)
- [ ] Les rares doublons résiduels (deux sites différents avec un nom et une rue identiques, s'il en existe) ne sont pas un blocant pour ce ticket — best effort, pas de garantie d'unicité absolue
- [ ] Aucune régression sur le comportement déjà couvert par le ticket 13 (activation clavier Entrée/Espace) et le ticket 14 (l'`alt` reste renseigné pour tous les marqueurs)
- [ ] Tests étendus : `BoulodromesMap.test.tsx` couvre déjà la présence d'un `alt` non générique depuis le ticket 14 — étendre pour vérifier que deux boulodromes de `name` identique mais de `siteName`/adresse différents obtiennent un `alt` différent
- [ ] Vérifié en navigateur réel (Playwright) : sur un échantillon de marqueurs partageant aujourd'hui le même `name` générique, confirmer que leurs `alt` respectifs diffèrent
