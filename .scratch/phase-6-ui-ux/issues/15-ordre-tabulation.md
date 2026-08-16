# 15 — Ordre de tabulation : les filtres passent avant la recherche

**What to build:** L'ordre de tabulation au clavier suit la hiérarchie visuelle de la page : la barre de recherche (action principale) avant les filtres (secondaires).

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Audit UI/UX du 2026-08-16 (constat D). Premier Tab depuis le chargement de la page → case à cocher « Stabilisé/cendrée » (filtre « Nature du sol »), pas le champ de recherche. En cause : `App.tsx` monte le bloc filtres avant `<BoulodromesMap>` (qui contient `<BoulodromeSearch>`) dans le JSX, alors que visuellement la recherche est l'action principale, positionnée en premier (haut-gauche desktop, au-dessus des filtres en mobile).

Un utilisateur clavier traverse donc 4 cases à cocher + 1 menu déroulant avant d'atteindre l'action qu'un utilisateur voyant identifie en premier.

- [ ] Le premier élément focusable au chargement de la page est le champ de recherche, pas un filtre
- [ ] L'ordre de tabulation reste cohérent après ce changement (pas de saut illogique ailleurs sur la page)
- [ ] Aucune régression sur le comportement des filtres ou de la recherche eux-mêmes (sélection, effet sur les résultats)
- [ ] Vérifié en navigateur réel (Playwright) : trace clavier réelle (appuis Tab successifs) depuis un chargement de page propre
