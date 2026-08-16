# 14 — Marqueurs de boulodromes sans nom accessible distinct

**What to build:** Chaque marqueur de boulodrome a un nom accessible qui l'identifie (nom du boulodrome), au lieu du texte générique `"Marker"` partagé par les 64 marqueurs.

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Audit UI/UX du 2026-08-16 (constat C). L'attribut `alt="Marker"` est la valeur par défaut de l'icône Leaflet (`node_modules/leaflet/dist/images/marker-icon.png`), jamais remplacée par le nom du boulodrome dans `BoulodromesMap.tsx`. Un utilisateur de lecteur d'écran qui explore la carte au clavier entend « bouton, Marker » 64 fois de suite (autant que de boulodromes chargés), sans aucun moyen de savoir lequel correspond à quel boulodrome sans l'activer un par un.

Impact atténué en pratique par l'existence d'un autre chemin clavier valide (barre de recherche + historique, cf. tickets 03/05), mais les marqueurs restent pleinement exposés dans l'ordre de tabulation comme 64 impasses identiques.

- [ ] Chaque marqueur de boulodrome expose un nom accessible incluant le nom du boulodrome (`feature.properties.name`), distinct d'un marqueur à l'autre
- [ ] Les marqueurs de cafés à proximité et le marqueur de départ d'itinéraire (piéton) conservent un nom accessible pertinent (nom de l'établissement pour les cafés) — vérifier s'ils ont le même problème avant de les exclure du scope
- [ ] Aucune régression visuelle (l'icône elle-même ne change pas, seul l'attribut d'accessibilité)
- [ ] Vérifié en navigateur réel (Playwright, arbre d'accessibilité) : deux marqueurs différents exposent deux noms différents
