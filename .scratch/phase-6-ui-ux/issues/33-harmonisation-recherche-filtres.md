# 33 — Harmonisation de taille recherche/filtres (corrige le désalignement)

**What to build:** Agrandir les pilules de filtre (padding, taille de texte) pour matcher la hauteur du champ de recherche — un seul gabarit de contrôle dans toute la barre d'outils, au lieu de deux hauteurs différentes actuellement.

**Blocked by:** aucun (peut se faire indépendamment, mais cohérent à livrer avec 31/34 vu qu'ils touchent les mêmes fichiers)

**Status:** ready-for-agent

**Origine :** Session `/grill-with-docs` du 2026-08-20, suite à une capture montrant les filtres mal alignés avec la recherche en plein écran. Cause identifiée dans le code (pas juste visuelle) : `BoulodromeSearch.tsx` (`px-2 py-1.5 text-sm` + bordure, ~32px de haut) et `pillStyles.ts` (`PILL_BASE_CLASS`, `px-3 py-1 text-xs`, sans bordure, ~22-24px de haut) partent du même `top-3` dans `App.tsx` mais ont des hauteurs différentes.

- [ ] Ajuster `PILL_BASE_CLASS` (`client/src/components/pillStyles.ts`) : padding/texte augmentés pour approcher la hauteur du champ de recherche (`py-1.5`/`text-sm` au lieu de `py-1`/`text-xs`, à ajuster au pixel en navigateur)
- [ ] Vérifier l'effet sur tous les usages existants de `PILL_BASE_CLASS` (`PillFilterGroup.tsx`, le nouveau composant pilule-groupe de 31/32) — pas de régression visuelle sur mobile (touch target plus grand = positif)
- [ ] Vérifié en navigateur réel (Playwright) : hauteur des pilules mesurée contre la hauteur du champ de recherche, écart résiduel documenté s'il en reste un, light et dark mode
- [ ] Pas de régression sur les tests de composant existants qui vérifient les classes Tailwind exactes (`PillFilterGroup.test.tsx`, `FreeAccessFilter.test.tsx` si présents)

**Out of scope :**
- Forme "pilule" (`rounded-full`) sur le champ de recherche lui-même — explicitement écarté en session (pattern inhabituel pour un champ de saisie)
