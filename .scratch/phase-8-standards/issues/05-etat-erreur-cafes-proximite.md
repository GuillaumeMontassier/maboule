# 05 — Trancher le traitement de l'état chargement/erreur des cafés à proximité

**What to build:** Décider si le chargement des cafés à proximité (`nearbyCafes` dans `BoulodromesMap.tsx`) doit suivre la règle `CLAUDE.md` "3 états explicites" (chargement/erreur/succès exposés) comme le reste de l'app, ou si le comportement actuel — échec silencieux, retombe sur `null` sans rien signaler — reste une exception assumée. Appliquer la décision, et si c'est une exception, la documenter comme telle plutôt que de la laisser comme un simple oubli.

**Blocked by:** aucun

**Status:** done

**Origine :** `.scratch/phase-8-standards/spec.md`. À l'origine (Phase 4) dans `BoulodromesMap.tsx:96-100` : `fetchCafesNearBoulodrome(...).catch(() => { if (!cancelled) setNearbyCafes(null); })`, avec le commentaire "Best-effort : un probleme sur les cafes ne doit pas empecher d'afficher la popup du boulodrome lui-meme." Cette logique a depuis été déplacée dans `client/src/hooks/use-boulodrome-selection.ts` (ticket 04). C'est un écart réel par rapport à la règle des 3 états (pas d'état "erreur" distinct de "pas encore chargé"/"vide"), mais le commentaire suggère un choix délibéré au moment de l'écriture plutôt qu'un oubli — ce ticket tranche plutôt que d'imposer un comportement sans vérifier l'intention d'origine.

## Answer

Option (a) retenue, tranchée avec l'auteur du projet : le silencieux-échec reste volontaire. La popup boulodrome ne doit jamais dépendre de la disponibilité des cafés à proximité, qui ne sont qu'une information secondaire affichée dessus — un souci réseau/serveur côté cafés ne doit dégrader ni bloquer la fonctionnalité principale (afficher le boulodrome). C'est donc une exception assumée à la règle des 3 états, pas un oubli.

- [x] Décision prise et notée ci-dessus (option a)
- [x] Commentaire existant renforcé dans `use-boulodrome-selection.ts` pour expliciter que c'est une exception assumée à la règle des 3 états, avec la raison et un renvoi vers ce ticket
- [ ] ~~Si (b) est choisi : l'état ajouté n'empêche à aucun moment l'affichage de la popup du boulodrome elle-même~~ — non applicable, option (a) retenue
- [ ] ~~Tests adaptés en conséquence si le comportement change~~ — non applicable, aucun changement de comportement (commentaire uniquement)
- [ ] ~~Vérifié en navigateur réel si (b)~~ — non applicable

**Out of scope :**
- Retry automatique ou mécanisme de nouvelle tentative — hors périmètre de cette décision
