# 14 — Marqueurs de boulodromes sans nom accessible distinct

**What to build:** Chaque marqueur de boulodrome a un nom accessible qui l'identifie (nom du boulodrome), au lieu du texte générique `"Marker"` partagé par les 64 marqueurs.

**Blocked by:** aucun

**Status:** done

**Origine :** Audit UI/UX du 2026-08-16 (constat C). L'attribut `alt="Marker"` est la valeur par défaut de l'icône Leaflet (`node_modules/leaflet/dist/images/marker-icon.png`), jamais remplacée par le nom du boulodrome dans `BoulodromesMap.tsx`. Un utilisateur de lecteur d'écran qui explore la carte au clavier entend « bouton, Marker » 64 fois de suite (autant que de boulodromes chargés), sans aucun moyen de savoir lequel correspond à quel boulodrome sans l'activer un par un.

Impact atténué en pratique par l'existence d'un autre chemin clavier valide (barre de recherche + historique, cf. tickets 03/05), mais les marqueurs restent pleinement exposés dans l'ordre de tabulation comme 64 impasses identiques.

- [x] Chaque marqueur de boulodrome expose un nom accessible incluant le nom du boulodrome (`feature.properties.name`), distinct d'un marqueur à l'autre —
      `alt={feature.properties.name}` sur le `Marker` (`client/src/components/BoulodromesMap.tsx`) ; Leaflet
      n'applique `alt` qu'aux icônes `<img>` (`Marker._initIcon`), ce qui est le cas des marqueurs boulodromes
      (icône par défaut, pas de `divIcon`)
- [x] Les marqueurs de cafés à proximité et le marqueur de départ d'itinéraire (piéton) conservent un nom accessible pertinent (nom de l'établissement pour les cafés) — vérifier s'ils ont le même problème avant de les exclure du scope —
      même bug confirmé sur les deux : ce sont des `L.divIcon` (un `<div>`), sur lesquels `alt` n'a aucun effet ;
      `title` (attribut HTML standard, sert de nom accessible de repli en l'absence d'aria-label) ajouté à la place —
      `title={cafe.properties.name}` sur les marqueurs cafés, `title="Point de départ de l'itinéraire"` sur
      `routeStartIcon`
- [x] Aucune régression visuelle (l'icône elle-même ne change pas, seul l'attribut d'accessibilité) — `alt`/`title`
      n'ont aucun effet visuel, seule l'icône (inchangée) est affichée
- [x] Vérifié en navigateur réel (Playwright, arbre d'accessibilité) : deux marqueurs différents exposent deux noms différents —
      capture de l'arbre d'accessibilité en conditions réelles (serveur + client en local) : marqueurs boulodromes
      avec noms distincts ("BOULODROME N°1" / "BOULODROME N°2" / etc. au lieu de "Marker" répété), marqueurs cafés
      nommés individuellement après sélection d'un boulodrome ("La Seine Café", "Les Quais", "Supersonic", "La
      Marguerite", "Les Associés"), marqueur de départ d'itinéraire nommé ("Point de départ de l'itinéraire") après
      recherche d'une adresse de départ

Tests unitaires étendus dans la foulée (`client/src/components/BoulodromesMap.test.tsx`) : nom accessible du
marqueur de départ d'itinéraire (`title`, seul cas qui n'était pas encore couvert par les tests déjà en place pour
les marqueurs boulodromes/cafés depuis le ticket 13).

Implémentation déjà en place au moment de la prise en charge de ce ticket (commit `aa180a4`, groupé avec les
tickets 13/15/16) — travail restant : couverture de test du marqueur de départ d'itinéraire, vérification
Playwright en conditions réelles, mise à jour du tracker.
