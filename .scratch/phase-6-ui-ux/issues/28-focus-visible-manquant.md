# 28 — Aucun indicateur de focus visible sur les contrôles interactifs

**What to build:** Ajouter un anneau de focus clavier clairement visible, cohérent entre tous les contrôles interactifs de l'app (champ de recherche et sa croix d'effacement, pilules de filtre, boutons du `RoutePanel`, `ThemeToggle`, items de `SelectableList` — historique, résultats de recherche, candidats d'adresse), en light et dark mode.

**Blocked by:** aucun

**Status:** done

**Origine :** Audit design system du 2026-08-17 (`/design-system audit`). Vérifié par `grep -rn "focus" client/src` : aucune classe `focus:`/`focus-visible:` nulle part dans le code (les seules occurrences sont des commentaires, des appels JS `.focus()`, ou des tests) — confirmé aussi dans `App.css`/`index.css`. La navigation clavier elle-même fonctionne déjà (ordre de tabulation ticket 15, activation Entrée/Espace des marqueurs ticket 13, noms accessibles ticket 14), mais rien ne montre visuellement où se trouve le focus pendant cette navigation — problème transversal, invisible en usage souris, bloquant pour un audit WCAG 2.4.7 (Focus Visible).

- [x] Chaque contrôle interactif (input, bouton, pilule, item de liste cliquable) affiche un indicateur de focus clairement visible au clavier (Tab), distinct du style hover, en light et dark mode
- [x] Traitement cohérent entre les différents types de contrôle plutôt qu'un style par composant — token partagé `FOCUS_RING_CLASS` (`client/src/components/focusStyles.ts`), sur le même principe que `pillStyles.ts`
- [x] Aucune régression sur les comportements clavier déjà en place (ordre de tabulation ticket 15, activation clavier des marqueurs ticket 13, noms accessibles ticket 14) — suite de tests client (101 tests) verte après implémentation
- [x] Vérifié en navigateur réel (Playwright, serveur + DB locaux, données réelles) : navigation Tab complète de l'app (recherche + croix, pilules de filtre, `ThemeToggle`, boutons `RoutePanel`, items de `SelectableList` — résultats de recherche et candidats d'adresse), en light et dark mode

**Bug trouvé et corrigé en cours de route :** l'anneau de focus des items de liste (résultats de recherche, historique, candidats d'adresse) était coupé sur 3 côtés (haut/gauche/droite), quasi invisible — ces boutons touchent les bords de leur conteneur `overflow-y-auto`, qui rogne tout ce qui dépasse sa propre boîte, or `FOCUS_RING_CLASS` dessine l'anneau avec un `outline-offset` positif (donc en dehors de la boîte du bouton). Corrigé avec une variante `FOCUS_RING_INSET_CLASS` (`outline-offset` négatif, anneau entièrement contenu dans la boîte du bouton) appliquée aux boutons de `SelectableList` (item principal + croix de suppression d'historique) et à la liste de candidats d'adresse de `RoutePanel` ; les autres contrôles (non concernés par un ancêtre `overflow`) gardent `FOCUS_RING_CLASS`. Revérifié visuellement après correctif (light et dark) : anneau entièrement visible sur les 4 côtés.

**Out of scope :**
- Refonte des couleurs ou du contraste des contrôles eux-mêmes (hors périmètre de ce ticket, qui ne traite que la visibilité du focus)
