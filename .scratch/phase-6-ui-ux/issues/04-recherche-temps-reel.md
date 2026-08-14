# 04 — Barre de recherche : recherche en temps réel + sélection clavier

**What to build:** La recherche de boulodrome se déclenche automatiquement pendant la frappe (au lieu d'attendre la soumission du formulaire), et la touche Entrée sélectionne directement le premier résultat affiché.

**Blocked by:** 01 — Mise en place de Tailwind CSS

**Status:** done

- [x] Taper dans le champ de recherche déclenche une requête après un court délai d'inactivité (debounce ~300ms), pas une requête par caractère —
      `client/src/components/BoulodromeSearch.tsx` : `useEffect` déclenché à chaque changement de `query`, `setTimeout(300ms)` dans lequel part la requête, `clearTimeout` en cleanup pour annuler le timer si une nouvelle frappe survient avant son échéance ; la soumission du formulaire (bouton ou Entrée) ne déclenche plus de recherche, elle sert désormais à sélectionner le premier résultat déjà affiché (voir plus bas)
- [x] Aucune requête n'est déclenchée en dessous de 2 caractères saisis —
      `MIN_QUERY_LENGTH = 2` : sous ce seuil, l'effet bascule directement en `status: "idle"` sans poser de timer
- [x] Une réponse qui arrive après qu'une saisie plus récente a été faite est ignorée (pas d'affichage de résultats obsolètes) — même principe que la protection déjà en place sur la version "soumission" —
      même compteur `latestRequestId` que l'implémentation précédente, désormais incrémenté au moment où le `setTimeout` déclenche effectivement la requête (et aussi lors du passage à `idle` sous le seuil de 2 caractères, pour invalider une requête encore en vol dont la réponse ne doit plus s'appliquer)
- [x] Appuyer sur Entrée alors que des résultats sont affichés sélectionne directement le premier résultat de la liste —
      `handleSubmit` appelle désormais `onSelectBoulodrome` sur le premier élément de `state.data.features` si l'état est `success` avec au moins un résultat, sinon ne fait rien ; couvre à la fois la touche Entrée et un clic sur le bouton "Rechercher" (les deux déclenchent la soumission native du formulaire) — vérifié en navigateur (API mockée en l'absence de Postgres local sur cette machine — cf. ticket 02/03) : `form.requestSubmit()` (équivalent de la soumission native déclenchée par Entrée) sélectionne bien le premier résultat, ouvre sa popup et recentre la carte ; un clic direct sur le bouton confirme le même chemin. La touche Entrée simulée par l'outil d'automatisation du navigateur ne déclenche pas la soumission native dans cet environnement précis (limite de l'outil, pas du code) — vérifié en contournant via `requestSubmit()`, qui est le mécanisme exact utilisé par un navigateur réel sur Entrée
- [x] Tests couvrant : déclenchement au fil de la frappe avec debounce, absence de requête sous le seuil de caractères, ignorance d'une réponse tardive obsolète, sélection du premier résultat par Entrée —
      `client/src/components/BoulodromeSearch.test.tsx` réécrit (4 tests, l'ancien test de réponse obsolète adapté au déclenchement par frappe au lieu de soumission) ; tests de `BoulodromesMap.test.tsx` couvrant la recherche mis à jour en conséquence (suppression du clic sur le bouton "Rechercher" supprimé, la saisie suffit désormais à déclencher la recherche)

Revu via `/code-review` : un point relevé et traité — le bouton "Rechercher" restait affiché alors qu'il ne déclenchait plus de recherche (recherche déjà automatique via le debounce), se contentant silencieusement de sélectionner le premier résultat comme Entrée, avec un libellé trompeur. Décision utilisateur : bouton supprimé (recherche 100% automatique, Entrée reste le seul moyen de sélectionner le premier résultat au clavier).
