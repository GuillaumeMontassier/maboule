# 05 — Barre de recherche : historique de recherche

**What to build:** Au focus du champ de recherche, avant toute saisie, l'utilisateur voit la liste des derniers boulodromes qu'il a sélectionnés. Cliquer un élément de cette liste sélectionne directement ce boulodrome.

**Blocked by:** 01 — Mise en place de Tailwind CSS

**Status:** done

- [x] Mettre le focus sur le champ de recherche quand il est vide affiche l'historique des boulodromes récemment sélectionnés (nom du boulodrome, pas juste le texte tapé) —
      nouveau hook `client/src/hooks/use-boulodrome-history.ts`, état local initialisé depuis `localStorage` ; `BoulodromeSearch` affiche la liste (même composant `SelectableList` que les résultats de recherche, cf. revue ci-dessous) quand le champ a le focus et est vide (`isFocused && query.trim().length === 0`)
- [x] L'historique est limité à 5 entrées, sans doublon (sélectionner un boulodrome déjà présent le remonte en tête plutôt que de le dupliquer) —
      `normalizeHistory` déduplique par id (garde la première occurrence) et tronque à `MAX_ENTRIES = 5`, appliqué à la fois en écriture (`addToHistory`) et en lecture (`readStoredHistory`, cf. revue)
- [x] L'historique persiste entre les rechargements de page (`localStorage`) —
      clé `boulodrome-search-history`, lecture/écriture protégées par try/catch (quota, navigation privée, contenu corrompu → historique vide plutôt qu'un crash)
- [x] Cliquer une entrée de l'historique sélectionne directement le boulodrome correspondant, sans étape de confirmation supplémentaire —
      bouton d'entrée d'historique appelle directement `onSelectBoulodrome(id)`, même chemin qu'un résultat de recherche
- [x] Sélectionner un boulodrome par n'importe quel moyen (marqueur, recherche, historique) alimente l'historique —
      `selectBoulodrome` dans `BoulodromesMap.tsx` est le point unique par lequel passent les trois moyens de sélection ; `addToHistory` y est appelé une fois le marqueur résolu (donc jamais pour un résultat de recherche référençant un boulodrome filtré/invisible)
- [x] Tests couvrant : affichage au focus sur champ vide, limite de 5 + dédoublonnage, sélection directe au clic —
      `client/src/hooks/use-boulodrome-history.test.ts` (7 tests : vide par défaut, ajout, dédoublonnage, limite à 5, persistance entre montages, contenu corrompu, normalisation d'un contenu localStorage déjà hors invariants) ; `client/src/components/BoulodromeSearch.test.tsx` (4 tests ajoutés : affichage au focus, masquage à la saisie, masquage au blur, sélection au clic) ; `client/src/components/BoulodromesMap.test.tsx` (4 tests ajoutés : alimentation par marqueur, alimentation par recherche, sélection directe depuis l'historique, persistance entre deux montages) — vérifié aussi en navigateur réel (API mockée en l'absence de Postgres local sur cette machine, cf. ticket 04) : sélection d'un boulodrome → historique affiché au focus → rechargement de page → historique toujours présent → clic sur l'entrée → sélection directe (popup + recentrage + panneau itinéraire) ; navigation clavier (Tab) dans l'historique vérifiée séparément, cf. revue ci-dessous

Effet de bord découvert en cours de route : Node 26+ expose un `localStorage`
global expérimental qui masque celui de jsdom sans le flag
`--localstorage-file`, laissant `window.localStorage` à `undefined` dans les
tests. Corrigé par un polyfill en mémoire (`client/src/setupTests.ts`,
référencé via `test.setupFiles` dans `vite.config.ts`) — indépendant de ce
ticket mais nécessaire pour que les tests `localStorage` passent sur cette
machine.

Revu via `/code-review` (8 angles, effort high) : trois points corrigés,
deux notés mais laissés tels quels (décision assumée, pas un oubli).

Corrigés :
- **Navigation clavier cassée** : le `onBlur` du champ masquait la liste
  d'historique avant que le focus (Tab) n'atteigne un de ses boutons — le
  navigateur perdait alors le focus (retombait sur `<body>`), rendant
  l'historique inatteignable au clavier. Vérifié en navigateur réel avant/
  après (le bug était bien reproductible : `document.activeElement`
  retombait sur `<body>` après un `Tab` depuis le champ). Corrigé en suivant
  le focus/blur au niveau du conteneur entier plutôt que du seul champ
  (`onBlur` vérifie `relatedTarget` via `event.currentTarget.contains(...)`,
  pattern standard pour les listes déroulantes accessibles) — supprime aussi
  le besoin du `onMouseDown preventDefault` ad hoc sur les boutons
  d'historique, la même logique couvrant désormais souris et clavier.
- **Duplication de markup** : la liste d'historique et la liste de résultats
  de recherche étaient quasi identiques (même chrome, mêmes classes
  Tailwind) sans être factorisées. Extrait en composant partagé
  `SelectableList` dans `BoulodromeSearch.tsx`.
- **Invariants non réappliqués à la lecture** : `readStoredHistory`
  validait la forme des entrées mais pas la limite à 5 ni l'absence de
  doublon (contenu `localStorage` en théorie déjà conforme puisqu'écrit par
  `addToHistory`, mais pas garanti si édité manuellement ou écrit par une
  version différente de l'app). `normalizeHistory` est maintenant partagée
  entre lecture et écriture.
- **Nommage de fichier** : `useBoulodromeHistory.ts` ne respectait pas la
  règle kebab-case du `CLAUDE.md` racine pour les fichiers non-composants.
  Renommé en `use-boulodrome-history.ts`.

Notés, non corrigés (décision assumée) :
- Le polyfill `localStorage` de test (`setupTests.ts`) ne lève jamais
  d'exception, donc les branches `catch` du hook (quota dépassé, navigation
  privée) restent non couvertes par les tests. Risque limité aux tests
  seulement (un vrai navigateur a toujours un vrai `localStorage`) ; hors
  scope de ce ticket.
- `selectBoulodrome` (`BoulodromesMap.tsx`) cumule désormais trois
  responsabilités (état popup, recentrage caméra, écriture de l'historique)
  sans moyen de désactiver l'écriture d'historique pour un appelant futur.
  Aucun appelant actuel n'en a besoin ; à réévaluer si un troisième mode de
  sélection apparaît (ex. lien profond).
