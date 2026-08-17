# 30 — Extraire un token de surface flottante partagé (RoutePanel/ThemeToggle/cards de recherche)

**What to build:** Extraire un token partagé (ex. `FLOATING_SURFACE_CLASS`) pour l'habillage "panneau flottant" — fond blanc/`gray-800`, bordure `gray-300`/`gray-600`, coins arrondis, `shadow-sm` — actuellement réimplémenté indépendamment à 3 endroits : `RoutePanel`, `ThemeToggle`, et `SURFACE_CLASS`/`STATUS_CARD_CLASS` dans `BoulodromeSearch.tsx`.

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Audit design system du 2026-08-17 (`/design-system audit`). Trois définitions quasi identiques du même concept visuel : `RoutePanel.tsx:167` (`rounded-lg border border-gray-300 bg-white ... shadow-sm dark:border-gray-600 dark:bg-gray-800 ...`), `ThemeToggle.tsx:21` (même famille de classes), et `SURFACE_CLASS`/`STATUS_CARD_CLASS` dans `BoulodromeSearch.tsx:30-35` (`rounded-lg` vs `rounded-md` selon l'endroit, sinon même intention). Un changement futur de radius ou d'ombre nécessiterait aujourd'hui de modifier 3 endroits en espérant n'en oublier aucun.

- [ ] Un seul token partagé porte le style de "surface flottante" (fond, bordure, radius, ombre — light et dark) réutilisé par `RoutePanel`, `ThemeToggle` et `BoulodromeSearch`
- [ ] Le padding, qui diffère légitimement selon l'usage (`RoutePanel` vs cards de résultats), reste un modificateur par composant plutôt que d'être intégré au token
- [ ] Aucun changement visuel constaté sur les 3 composants concernés après migration
- [ ] Vérifié en navigateur réel : capture des 3 composants en light/dark mode avant/après, aucune différence visuelle

**Out of scope :**
- Changer le radius, la couleur ou l'ombre actuels — ce ticket ne fait que factoriser l'existant, pas le redesigner
