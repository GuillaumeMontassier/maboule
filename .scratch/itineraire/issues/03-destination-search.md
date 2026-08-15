# 03 — Recherche de boulodrome par mot-clé

**What to build:** une recherche par mot-clé dans l'UI pour sélectionner un
boulodrome comme destination, sans avoir à le repérer d'abord sur la carte.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Nouveau champ de recherche dans l'UI, branché sur le paramètre `q`
      déjà supporté par `GET /api/boulodromes` (backend existant depuis la
      Phase 3, jusqu'ici non exposé côté frontend).
- [x] Les résultats de recherche s'affichent au fur et à mesure de la
      saisie (ou après validation — au choix de l'implémentation, à
      documenter dans la PR).
- [x] Sélectionner un résultat sélectionne ce boulodrome sur la carte
      exactement comme le fait aujourd'hui un clic sur son marqueur (même
      popup, même état `selectedBoulodrome`).
- [x] Aucun résultat : message clair, pas d'état cassé ou de liste vide
      silencieuse.
- [x] Tests de composant (React Testing Library) : saisie → résultats
      affichés, sélection d'un résultat → boulodrome sélectionné sur la
      carte, aucun résultat → message affiché. Mock de l'appel API
      `fetchBoulodromes` (`client/src/api/boulodromes.ts`), comme le
      `vi.mock` existant sur `client/src/api/cafes.ts` dans
      `BoulodromesMap.test.tsx`.

## Comments

Implémenté dans `client/src/components/BoulodromeSearch.tsx` (recherche sur
soumission du formulaire, pas au fil de la frappe) + intégration dans
`BoulodromesMap.tsx` (`onSelectBoulodrome` réutilise le même chemin qu'un
clic sur un marqueur). Protection contre les réponses tardives via un
compteur `latestRequestId` (même principe que le flag `cancelled` déjà en
place pour le chargement des cafés) : une recherche abandonnée pour une
saisie plus récente n'écrase pas le résultat courant si sa réponse arrive
après coup. Tests de composant dans `BoulodromeSearch.test.tsx` et
`BoulodromesMap.test.tsx` (`fetchBoulodromes` mocké).
