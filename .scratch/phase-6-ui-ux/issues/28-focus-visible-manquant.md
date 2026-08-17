# 28 — Aucun indicateur de focus visible sur les contrôles interactifs

**What to build:** Ajouter un anneau de focus clavier clairement visible, cohérent entre tous les contrôles interactifs de l'app (champ de recherche et sa croix d'effacement, pilules de filtre, boutons du `RoutePanel`, `ThemeToggle`, items de `SelectableList` — historique, résultats de recherche, candidats d'adresse), en light et dark mode.

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Audit design system du 2026-08-17 (`/design-system audit`). Vérifié par `grep -rn "focus" client/src` : aucune classe `focus:`/`focus-visible:` nulle part dans le code (les seules occurrences sont des commentaires, des appels JS `.focus()`, ou des tests) — confirmé aussi dans `App.css`/`index.css`. La navigation clavier elle-même fonctionne déjà (ordre de tabulation ticket 15, activation Entrée/Espace des marqueurs ticket 13, noms accessibles ticket 14), mais rien ne montre visuellement où se trouve le focus pendant cette navigation — problème transversal, invisible en usage souris, bloquant pour un audit WCAG 2.4.7 (Focus Visible).

- [ ] Chaque contrôle interactif (input, bouton, pilule, item de liste cliquable) affiche un indicateur de focus clairement visible au clavier (Tab), distinct du style hover, en light et dark mode
- [ ] Traitement cohérent entre les différents types de contrôle plutôt qu'un style par composant — candidat naturel : un token partagé (ex. `FOCUS_RING_CLASS`), sur le même principe que `client/src/components/pillStyles.ts`
- [ ] Aucune régression sur les comportements clavier déjà en place (ordre de tabulation ticket 15, activation clavier des marqueurs ticket 13, noms accessibles ticket 14)
- [ ] Vérifié en navigateur réel (Playwright ou manuel) : navigation Tab complète de l'app, capture visuelle du focus sur au moins un exemple de chaque type de contrôle, en light et dark mode

**Out of scope :**
- Refonte des couleurs ou du contraste des contrôles eux-mêmes (hors périmètre de ce ticket, qui ne traite que la visibilité du focus)
