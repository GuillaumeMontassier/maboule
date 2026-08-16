# 17 — Légende du code couleur des marqueurs café/bar/pub/piéton

**What to build:** Une légende discrète (texte + pastille de couleur, pas seulement la couleur) explique ce que représente chaque couleur de marqueur, visible sans avoir à ouvrir une popup.

**Blocked by:** 08 — Icônes : harmonisation piéton/café/bar/pub, 16 — Couleurs bar/pub non conformes à spec.md

**Status:** ready-for-agent

**Origine :** Audit UI/UX du 2026-08-16 (constat F). Le ticket 08 harmonise les 4 types (piéton, café, bar, pub) en un point coloré à contour blanc, mais rien dans l'interface n'indique ce que chaque couleur signifie — l'utilisateur doit ouvrir une popup pour l'apprendre par élimination. Sur une carte qui peut afficher des dizaines de points à la fois, une légende rendrait le code lisible d'un coup d'œil. Reposer uniquement sur la teinte pénalise aussi les daltoniens (pas de forme ni de texte distinctif entre les points) ; la légende texte+couleur compense ce point sans changer les marqueurs eux-mêmes.

- [ ] Une légende liste les 4 types (café, bar, pub, et le marqueur de départ d'itinéraire) avec leur couleur et un libellé texte — piéton peut être omis si son marqueur n'apparaît que dans un contexte déjà explicite (itinéraire en cours), à trancher à l'implémentation
- [ ] La légende est visible sans interaction (pas cachée derrière un menu), mais ne chevauche aucun autre panneau flottant (recherche, filtres, RoutePanel, contrôles de zoom) — cf. ticket 09/12 sur les chevauchements
- [ ] La légende est lisible en thème clair et sombre (cf. ticket 11)
- [ ] Vérifié en navigateur réel (Playwright) : légende visible et lisible à 375px et 1280px, dans les deux thèmes, sans chevauchement
