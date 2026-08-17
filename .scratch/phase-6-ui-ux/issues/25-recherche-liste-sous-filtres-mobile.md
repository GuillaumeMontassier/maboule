# 25 — Mobile : la liste de recherche (résultats/historique) est cachée et inaccessible sous les filtres

**What to build:** Sur un viewport mobile, la liste déroulante de la barre de recherche (résultats ou historique) reste entièrement visible et cliquable, sans être recouverte par le bloc filtres.

**Blocked by:** aucun (indépendant du ticket 24, mais son impact pratique est réduit une fois le ticket 24 corrigé — la liste ne reste alors ouverte que brièvement, le temps de choisir un item)

**Status:** ready-for-agent

**Origine :** Audit UI/UX du 2026-08-17. Reproduit à 375×700, chargement de page propre : focus le champ de recherche (historique) ou taper une requête (résultats) → la liste s'affiche, mais le bloc filtres (`Stabilisé/cendrée`, `Sable`, `Découvert`, `Extérieur couvert`, `Accès libre`, positionné en `fixed top-14 ... z-[1000]` sous la barre de recherche en mobile, cf. ticket 06) est peint par-dessus une bonne partie de la liste, qui n'a pas de `z-index` explicite (`z-index: auto`) — donc perdante face aux `z-[1000]` des filtres. Mesuré : liste en `y: 52→126` (74px de haut), filtres en `y: 56→110` (54px), soit un recouvrement quasi total de la hauteur visible de la liste.

Conséquence constatée avec Playwright : un item de la liste positionné sous les filtres n'est ni lisible, ni cliquable (le clic atterrit sur le bouton de filtre superposé plutôt que sur l'item de liste — reproduit avec le filtre "Accès libre" interceptant le clic destiné à un résultat de recherche).

- [ ] En mobile (< 768px), la liste de résultats/historique reste entièrement visible par-dessus (ou repoussée sous) le bloc filtres — plus aucun recouvrement partiel
- [ ] Un item de la liste reste cliquable/tapable sur toute sa surface, quelle que soit sa position par rapport au bloc filtres
- [ ] Aucune régression sur le positionnement desktop (≥ 768px, recherche et filtres côte à côte, cf. ticket 06) où ce recouvrement ne se produit pas
- [ ] Vérifié en navigateur réel (Playwright) : ouverture de la liste de résultats puis de la liste d'historique à 375px, chaque item visible et cliquable, comparé avant/après
