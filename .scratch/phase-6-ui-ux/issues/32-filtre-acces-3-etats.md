# 32 — Filtre "Accès" à 2 segments exclusifs (réactive le 3ᵉ état de ticket 20)

**What to build:** Remplacer le toggle simple `FreeAccessFilter` ("Accès libre" actif/inactif, 2 états) par un groupe "Accès" à 2 segments mutuellement exclusifs : "Libre" et "Restreint". Cliquer un segment l'active et désactive l'autre s'il était actif ; recliquer le segment actif le désélectionne (retour à "pas de filtre" = tous les boulodromes, libres et restreints). Même traitement pilule-groupe que ticket 31 (libellé "Accès" + 2 segments).

**Blocked by:** 31 (réutilise le composant pilule-groupe)

**Status:** done

**Origine :** Session `/grill-with-docs` du 2026-08-20. Ticket 20 avait remplacé un `<select>` à 3 états (Tous / Accès libre / Accès payant-restreint) par une pilule toggle à 2 états, faisant disparaître l'option "accès restreint uniquement" de l'UI — décision reconsidérée : un boulodrome est soit libre, soit restreint, jamais les deux, donc l'exclusion mutuelle entre 2 segments visibles couvre les 3 états (aucun actif = tous, l'un ou l'autre actif = filtré) sans les inconvénients d'un bouton cyclique à 3 états (discutés et écartés en session : états cachés, coût de désélection à 2 clics, accessibilité).

Le **backend gère déjà les 3 états** (`freeAccess: true | false | undefined`), avec tests d'intégration dédiés (`server/src/db/boulodromesRepository.integration.test.ts:243-272` — filtre "accès libre", filtre "accès restreint", pas de filtre). Aucun changement serveur nécessaire.

- [x] Remplacer `FreeAccessFilter.tsx` par un composant à 2 segments exclusifs ("Libre" / "Restreint") sous le libellé de groupe "Accès" (pas besoin de répéter "Accès" dans les segments, même logique que "Sol" → "Stabilisé/cendrée"/"Sable") — nouveau `AccessFilter.tsx`, `FreeAccessFilter.tsx` supprimé
- [x] État local : `freeAccess: boolean | undefined` (inchangé côté `App.tsx`/`fetchBoulodromes` — c'est déjà le type actuel, seule l'UI change)
- [x] Logique d'exclusion mutuelle : sélectionner "Libre" met `freeAccess = true` (et jamais `false` en même temps) ; sélectionner "Restreint" met `freeAccess = false` ; recliquer le segment actif remet `freeAccess = undefined`
- [x] `aria-pressed` sur chaque segment reflète son propre état (pas un `role="radiogroup"` — cohérent avec le choix ticket 20 d'éviter les rôles ARIA groupés sur `display: contents`, cf. `PillFilterGroup.tsx`)
- [x] Tests de composant : clic sur "Libre" active Libre et jamais Restreint simultanément, clic sur "Restreint" inverse, reclic sur le segment actif revient à "pas de filtre", `freeAccess` transmis correctement au parent (`onChange`) — `AccessFilter.test.tsx`, 6 tests
- [x] Vérifier qu'aucun test existant ne référence encore `FreeAccessFilter`/l'ancien comportement toggle simple — aucun `FreeAccessFilter.test.tsx` n'existait ; les 2 tests `App.test.tsx` ciblant l'ancienne pilule toggle ont été adaptés aux nouveaux segments, + 1 test ajouté pour la bascule Libre→Restreint (111 tests, suite complète verte)

**Out of scope :**
- Tout changement backend (déjà prêt)

**Note d'implémentation :** `PillFilterGroup` n'est pas réutilisé tel quel — sa logique de sélection (`toggle` sur `selected: string[]`) modélise une multi-sélection indépendante par option, incompatible avec une exclusion mutuelle à 2 segments sans adaptateur avec état perdu. `AccessFilter.tsx` est donc un composant dédié, qui réutilise en revanche les tokens de style partagés (`PILL_GROUP_CONTAINER_CLASS`, `PILL_GROUP_LABEL_CLASS`, `PILL_SEGMENT_BASE_CLASS`, `PILL_ACTIVE_CLASS`/`PILL_INACTIVE_CLASS`, `pillStyles.ts`) pour garantir le même traitement visuel que ticket 31 — vérifié en navigateur réel (light + dark), aucune différence de traitement avec les groupes Sol/Environnement.
