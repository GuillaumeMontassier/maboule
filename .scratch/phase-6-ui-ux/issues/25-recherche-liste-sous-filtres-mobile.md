# 25 — Mobile : la liste de recherche (résultats/historique) est cachée et inaccessible sous les filtres

**What to build:** Sur un viewport mobile, la liste déroulante de la barre de recherche (résultats ou historique) reste entièrement visible et cliquable, sans être recouverte par le bloc filtres.

**Blocked by:** aucun (indépendant du ticket 24, mais son impact pratique est réduit une fois le ticket 24 corrigé — la liste ne reste alors ouverte que brièvement, le temps de choisir un item)

**Status:** done

**Origine :** Audit UI/UX du 2026-08-17. Reproduit à 375×700, chargement de page propre : focus le champ de recherche (historique) ou taper une requête (résultats) → la liste s'affiche, mais le bloc filtres (`Stabilisé/cendrée`, `Sable`, `Découvert`, `Extérieur couvert`, `Accès libre`, positionné en `fixed top-14 ... z-[1000]` sous la barre de recherche en mobile, cf. ticket 06) est peint par-dessus une bonne partie de la liste, qui n'a pas de `z-index` explicite (`z-index: auto`) — donc perdante face aux `z-[1000]` des filtres. Mesuré : liste en `y: 52→126` (74px de haut), filtres en `y: 56→110` (54px), soit un recouvrement quasi total de la hauteur visible de la liste.

Conséquence constatée avec Playwright : un item de la liste positionné sous les filtres n'est ni lisible, ni cliquable (le clic atterrit sur le bouton de filtre superposé plutôt que sur l'item de liste — reproduit avec le filtre "Accès libre" interceptant le clic destiné à un résultat de recherche).

- [x] En mobile (< 768px), la liste de résultats/historique reste entièrement visible par-dessus (ou repoussée sous) le bloc filtres — plus aucun recouvrement partiel
- [x] Un item de la liste reste cliquable/tapable sur toute sa surface, quelle que soit sa position par rapport au bloc filtres
- [x] Aucune régression sur le positionnement desktop (≥ 768px, recherche et filtres côte à côte, cf. ticket 06) où ce recouvrement ne se produit pas
- [x] Vérifié en navigateur réel (Playwright) : ouverture de la liste de résultats puis de la liste d'historique à 375px, chaque item visible et cliquable, comparé avant/après

## Fix

Root cause confirmé : le widget de recherche (`BoulodromeSearch.tsx`, div
englobante) et le bloc filtres (`App.tsx`) sont tous deux `position: fixed`
avec le même `z-[1000]`. À égalité de z-index, l'ordre de peinture (= ordre
du DOM) départage, et le bloc filtres — rendu après le widget de recherche
dans `App.tsx` — gagnait systématiquement.

Fix appliqué : bump du z-index du wrapper de recherche à `z-[1100]`
(`BoulodromeSearch.tsx`), pour qu'il domine toujours le bloc filtres
indépendamment de l'ordre du DOM. Aucun changement sur le bloc filtres
lui-même, ni sur `ThemeToggle`/`RoutePanel` (pas de chevauchement
géométrique réaliste avec ces deux-là). Commentaire ajouté sur le wrapper
et correction du commentaire devenu inexact dans `App.tsx` (qui affirmait
à tort qu'aucun chevauchement ne se produisait).

## Vérification (Playwright, session du 2026-08-17)

**Mobile (375×700), liste de résultats** (requête "terrain") :
- `<ul>` résultats : `y: 52→292` (240px, plusieurs résultats visibles).
- Bloc filtres : `y: 56→110` (identique à la mesure de l'audit initial).
- `elementFromPoint` à (150,65), (150,80), (150,100) — tous dans la zone de
  chevauchement — résolvent tous vers un item `<button>` de la liste de
  résultats, plus jamais vers un bouton de filtre.
- Clic réel sur le point (150,80) : sélectionne bien le boulodrome "TEP
  LOUIS BRAILLE" (popup carte ouvert, panneau itinéraire affiché), aucun
  filtre activé par erreur.

**Mobile (375×700), liste d'historique** (5 entrées seedées en
localStorage, champ vide focus) :
- `<ul>` historique : `y: 52→292`.
- Mêmes points de test (150,65)/(150,80)/(150,100) — tous résolvent vers un
  item de l'historique ("Site A — TERRAIN DE PETANQUE A"), pas vers un
  filtre.

**Desktop (1280×800)** : widget de recherche `x: 12→292`, bloc filtres
`x: 300→774` — toujours côte à côte, aucun chevauchement, positions
inchangées par rapport à ticket 06. Aucune régression.

**Non-régression** : `npm run test` (client) — 94/94 tests passent ;
`tsc -b --noEmit` et `npm run lint` (oxlint) sans erreur.
