# 05 — Trancher le traitement de l'état chargement/erreur des cafés à proximité

**What to build:** Décider si le chargement des cafés à proximité (`nearbyCafes` dans `BoulodromesMap.tsx`) doit suivre la règle `CLAUDE.md` "3 états explicites" (chargement/erreur/succès exposés) comme le reste de l'app, ou si le comportement actuel — échec silencieux, retombe sur `null` sans rien signaler — reste une exception assumée. Appliquer la décision, et si c'est une exception, la documenter comme telle plutôt que de la laisser comme un simple oubli.

**Blocked by:** aucun

**Status:** needs-triage

**Origine :** `.scratch/phase-8-standards/spec.md`. `BoulodromesMap.tsx:96-100` : `fetchCafesNearBoulodrome(...).catch(() => { if (!cancelled) setNearbyCafes(null); })`, avec le commentaire "Best-effort : un probleme sur les cafes ne doit pas empecher d'afficher la popup du boulodrome lui-meme." C'est un écart réel par rapport à la règle des 3 états (pas d'état "erreur" distinct de "pas encore chargé"/"vide"), mais le commentaire suggère un choix délibéré au moment de l'écriture (Phase 4) plutôt qu'un oubli — ce ticket tranche plutôt que d'imposer un comportement sans vérifier l'intention d'origine.

- [ ] Décision prise et notée dans ce ticket (`## Answer` ou équivalent) : soit (a) le silencieux-échec reste volontaire — la popup boulodrome ne doit jamais dépendre de la disponibilité des cafés — auquel cas le commentaire existant est renforcé pour expliciter que c'est une exception assumée à la règle des 3 états, avec la raison ; soit (b) un état "erreur" minimal et discret est ajouté (ex. une ligne de texte dans la popup, sans bloquer son affichage)
- [ ] Si (b) est choisi : l'état ajouté n'empêche à aucun moment l'affichage de la popup du boulodrome elle-même (contrainte d'origine préservée)
- [ ] Tests adaptés en conséquence si le comportement change (`BoulodromesMap.test.tsx`)
- [ ] Vérifié en navigateur réel si (b) : simuler un échec de `fetchCafesNearBoulodrome`, confirmer l'affichage du nouvel état sans régression sur la popup

**Out of scope :**
- Retry automatique ou mécanisme de nouvelle tentative — hors périmètre de cette décision
