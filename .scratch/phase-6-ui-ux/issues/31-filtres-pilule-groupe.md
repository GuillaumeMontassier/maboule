# 31 — Groupement visuel des filtres (pilule-groupe)

**What to build:** Chaque groupe de filtres ("Nature du sol", "Type d'équipement") devient une seule pilule segmentée : un segment libellé non-cliquable à gauche, les segments-options (comportement inchangé, `PillFilterGroup`) à droite, le tout dans un contour `rounded-full` continu (coins arrondis uniquement aux extrémités : segment libellé `rounded-l-full`, dernier segment-option `rounded-r-full`, segments intermédiaires sans arrondi).

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Session `/grill-with-docs` du 2026-08-20 (voir transcript de conversation). Actuellement les pilules de tous les groupes sont à plat dans la même rangée (décision ticket 20), sans aucune indication visuelle que "Stabilisé/cendrée" et "Sable" appartiennent au même groupe que "Découvert"/"Extérieur couvert" — problème signalé par l'utilisateur.

- [ ] Nouveau composant (ex. `PillGroup.tsx` ou extension de `PillFilterGroup.tsx`) : segment libellé `<span>` non-focusable/non-cliquable + les boutons-options existants, dans un conteneur `rounded-full` unique
- [ ] Couleur du segment libellé distincte des pilules actives/inactives, mais dans la même famille neutre (nuance, pas une couleur différente) : `bg-gray-300 text-gray-700` / `dark:bg-gray-600 dark:text-gray-300` (un cran plus soutenu que `PILL_INACTIVE_CLASS`)
- [ ] Coins arrondis uniquement aux extrémités du groupe (segment libellé = coin gauche, dernier segment-option = coin droit), pas sur les segments intermédiaires
- [ ] `aria-label` déjà présent sur chaque pilule-option (`${groupLabel} : ${value}`) conservé tel quel — le segment libellé visuel est redondant avec lui pour un lecteur d'écran, mais reste utile visuellement
- [ ] Aucune régression sur le comportement multi-sélection existant des groupes (indépendant par pilule, ticket 20)
- [ ] Tests de composant : segment libellé non interactif (pas de rôle bouton, pas dans l'ordre de tabulation), rendu correct des coins arrondis aux extrémités

**Out of scope :**
- Le groupe "Accès" (ticket 32, structure différente — 2 segments exclusifs)
- Harmonisation de taille avec le champ de recherche (ticket 33)
