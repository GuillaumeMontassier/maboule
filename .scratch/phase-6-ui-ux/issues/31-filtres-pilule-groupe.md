# 31 — Groupement visuel des filtres (pilule-groupe)

**What to build:** Chaque groupe de filtres ("Sol", "Environnement") devient une seule pilule segmentée : un segment libellé non-cliquable à gauche, les segments-options (comportement inchangé, `PillFilterGroup`) à droite, le tout dans un contour `rounded-full` continu (coins arrondis uniquement aux extrémités : segment libellé `rounded-l-full`, dernier segment-option `rounded-r-full`, segments intermédiaires sans arrondi).

**Blocked by:** aucun

**Status:** done

**Origine :** Session `/grill-with-docs` du 2026-08-20 (voir transcript de conversation). Actuellement les pilules de tous les groupes sont à plat dans la même rangée (décision ticket 20), sans aucune indication visuelle que "Stabilisé/cendrée" et "Sable" appartiennent au même groupe que "Découvert"/"Extérieur couvert" — problème signalé par l'utilisateur.

- [x] `PillFilterGroup.tsx` étendu : segment libellé `<span>` non-focusable/non-cliquable + les boutons-options existants, dans un conteneur `inline-flex overflow-hidden rounded-full` unique (clip plutôt que calculer quel segment arrondir — plus simple, généralise si un groupe gagne plus de 2 options)
- [x] Couleur du segment libellé (`PILL_GROUP_LABEL_CLASS`, `pillStyles.ts`) : `bg-gray-300 text-gray-700` / `dark:bg-gray-600 dark:text-gray-300` — nuance distincte des pilules actives/inactives dans la même famille neutre, vérifiée en navigateur (light + dark)
- [x] Coins arrondis uniquement aux extrémités du groupe via `overflow-hidden` sur le conteneur (pas de calcul par segment)
- [x] `aria-label` de chaque pilule-option inchangé
- [x] Aucune régression sur le comportement multi-sélection existant (test dédié + suite complète verte, 104 tests)
- [x] Tests de composant (`PillFilterGroup.test.tsx`) : segment libellé rendu en `<span>` (pas de rôle bouton), `tabIndex === -1`, sélection multi-pilule indépendante conservée

**Bug trouvé et corrigé en cours de route :** l'anneau de focus des pilules-options (`FOCUS_RING_CLASS`, offset positif) aurait été rogné par le nouveau `overflow-hidden` du conteneur — même problème que celui déjà identifié et corrigé sur les listes scrollables au ticket 28. Basculé sur `FOCUS_RING_INSET_CLASS` (déjà introduite au ticket 28) pour ces boutons ; `PILL_BASE_CLASS` (`rounded-full`) ne convenait plus non plus pour les segments (le coin arrondi devait venir du conteneur, pas du bouton, et un simple `rounded-none` en fin de chaîne n'aurait pas gagné la cascade Tailwind contre le `rounded-full` déjà présent dans la constante partagée) — nouvelle constante `PILL_SEGMENT_BASE_CLASS` sans arrondi, dédiée aux segments. Vérifié visuellement (Playwright) : anneau pleinement contenu dans le segment, aucun rognage, light et dark mode.

**Out of scope :**
- Le groupe "Accès" (ticket 32, structure différente — 2 segments exclusifs)
- Harmonisation de taille avec le champ de recherche (ticket 33)
