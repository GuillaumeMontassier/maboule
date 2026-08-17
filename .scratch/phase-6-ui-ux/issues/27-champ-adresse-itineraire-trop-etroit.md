# 27 — RoutePanel : champ adresse de départ trop étroit, placeholder illisible

**What to build:** Le champ de saisie d'adresse dans le panneau Itinéraire (`RoutePanel`) est assez large pour que son contenu (placeholder ou texte tapé) reste lisible, sans être écrasé par le bouton "Rechercher l'adresse" à côté.

**Blocked by:** aucun

**Status:** done

**Origine :** Audit UI/UX du 2026-08-17. Le `RoutePanel` a une largeur fixe de 280px (`client/src/components/RoutePanel.tsx:167`, `w-[280px]`). Le formulaire adresse (`flex gap-1.5`, ligne 178) contient un `<input>` en `flex-1 min-w-0` (ligne 186) et un bouton "Rechercher l'adresse" en `w-auto whitespace-nowrap` (ligne 191-193) : le texte du bouton ne pouvant pas passer à la ligne, il capte la largeur dont il a besoin en priorité, ne laissant que ~104px à l'input sur les ~256px utiles du panneau (280px moins padding et gap).

Mesuré en navigateur (Playwright, 1280px) : `input[aria-label="Adresse de départ"]` fait 104px de large pour un placeholder "Rechercher une adresse de départ…" qui en occuperait largement plus de 300px — le placeholder est tronqué au point d'être illisible ("Rechercher u"), et l'espace disponible pour taper une vraie adresse ("12 rue de la Paix, 75002 Paris…") est insuffisant pour voir ce qu'on écrit.

- [x] Le champ adresse reste lisible (placeholder et saisie) sans être écrasé par le bouton "Rechercher l'adresse" — implémenté en remplaçant le libellé texte du bouton par une icône loupe (`lucide-react`, `Search`) dans un bouton carré 36×36px, `aria-label`/`title` conservant le texte complet "Rechercher l'adresse" pour l'accessibilité (même pattern que `ThemeToggle`)
- [x] Aucune régression sur le reste du `RoutePanel` (bouton "Utiliser ma position", liste de suggestions d'adresse, largeur globale du panneau et son `autoPanPaddingBottomRight` associé au ticket 09/12) — largeur du panneau inchangée (280px), aucune autre modification
- [x] Vérifié en navigateur réel (Playwright) : largeur du champ adresse mesurée après correctif — 104px → 212px à 1280px, 104px → 211px à 375px ; placeholder et saisie ("12 rue de la Paix, 75002 Paris") pleinement lisibles aux deux tailles, aucun chevauchement avec les contrôles de zoom
