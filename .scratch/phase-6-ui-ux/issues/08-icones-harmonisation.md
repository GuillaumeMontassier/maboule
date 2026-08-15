# 08 — Icônes : harmonisation piéton/café/bar/pub

**What to build:** Les icônes du marqueur de départ d'itinéraire (piéton) et des établissements à proximité (café/bar/pub) passent d'emoji à un point coloré à contour blanc commun, la couleur distinguant le type.

**Blocked by:** 01 — Mise en place de Tailwind CSS

**Status:** done

- [x] Les 4 types (piéton, café, bar, pub) ont chacun une couleur de point distincte et un contour blanc commun
      (`bg-blue-600`/`bg-amber-600`/`bg-violet-600`/`bg-rose-600`, `BoulodromesMap.tsx`)
- [x] Les emoji actuels (🚶/☕/🍸/🍺) ne sont plus utilisés pour ces marqueurs
- [x] Les marqueurs restent lisibles à la même taille qu'aujourd'hui sur la carte (`iconSize` inchangé, `[24, 24]`)
- [x] Les marqueurs de boulodrome eux-mêmes ne sont pas concernés par ce ticket (hors périmètre)
