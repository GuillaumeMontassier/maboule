# 24 — La liste de recherche (résultats/historique) ne se referme pas après sélection

**What to build:** Sélectionner un boulodrome dans la liste déroulante de la barre de recherche (résultat de recherche ou entrée d'historique) referme la liste, sur tous les breakpoints.

**Blocked by:** aucun

**Status:** done

**Origine :** Audit UI/UX du 2026-08-17. Reproduit à 1280px et 375px, chargement de page propre : focus le champ de recherche (l'historique s'affiche), cliquer une entrée d'historique → le boulodrome est bien sélectionné (popup ouverte, carte recentrée), mais la liste déroulante reste affichée par-dessus la carte, immobile, jusqu'à ce que l'utilisateur clique explicitement ailleurs sur la page. Même comportement en tapant une recherche puis en cliquant un résultat.

En cause (`client/src/components/BoulodromeSearch.tsx:148-160`) : la liste n'est affichée que si `isFocused` est vrai (`onFocus`/`onBlur` posés sur le conteneur englobant champ + liste), et `handleBlur` ne repasse `isFocused` à `false` que si le focus quitte entièrement le conteneur (`!event.currentTarget.contains(event.relatedTarget)`). Or cliquer un item de la liste (résultat ou historique) déplace le focus sur le `<button>` de cet item — qui est un descendant du même conteneur. Le focus ne quitte donc jamais le widget au moment de la sélection, `isFocused` reste `true`, et rien d'autre ne referme la liste après un `onSelect` réussi.

En mobile (375px), ce comportement est aggravé par le ticket 25 : la liste ouverte reste en outre visuellement coincée sous le bloc filtres, rendant le blocage particulièrement visible (la quasi-totalité du haut d'écran reste couverte par une liste obsolète après chaque sélection).

- [x] Sélectionner un résultat de recherche referme la liste de résultats —
      nouvel état `dismissedAfterSelect`, orthogonal à `isFocused`, mis à
      `true` par un point d'entrée unique `selectAndClose` (utilisé par le
      clic sur un résultat, le clic sur une entrée d'historique, et Entrée
      sur le premier résultat) ; réinitialisé à `false` en tête de l'effet
      de debounce (toute frappe rouvre la possibilité d'afficher une liste)
      et sur un vrai refocus du widget
- [x] Sélectionner une entrée d'historique referme la liste d'historique — même mécanisme
- [x] Le comportement déjà couvert par le ticket 04 (flèche/Entrée clavier) et le ticket 05 (affichage au focus, champ vide) n'est pas régressé — suite complète (94 tests) revérifiée verte après le correctif
- [x] Vérifié en navigateur réel (Playwright) : sélection d'un résultat de recherche et d'une entrée d'historique, à 375px et 1280px, depuis un chargement de page propre — liste absente immédiatement après la sélection. À 375px, le clic sur un résultat de recherche est intercepté par les pastilles de filtre qui chevauchent visuellement la liste (symptôme du ticket 25, hors scope ici) : contourné par un clic programmatique pour valider le comportement de fermeture lui-même

Revu via `/code-review` : deux points relevés.

Corrigé :
- **Focus perdu vers `document.body` après sélection** : `selectAndClose`
  fermait la liste (et donc retirait du DOM le `<button>` cliqué/activé au
  clavier) sans jamais recadrer le focus, contrairement au handler frère
  de suppression d'historique qui gère déjà exactement ce cas. Corrigé en
  appelant `inputRef.current?.focus()` dans `selectAndClose`, avec un garde
  (`suppressReopenOnFocusRef`) pour empêcher ce focus programmatique de
  rouvrir la liste qu'on vient de fermer (l'`onFocus` du conteneur
  réinitialise sinon `dismissedAfterSelect` sur tout focus, y compris
  celui-ci) — vérifié à la fois par un test (`document.activeElement`) et
  en navigateur réel (Playwright, clic natif qui focus bien le bouton
  avant le click).

Noté, non corrigé (décision assumée) :
- **Liste fermée même si la sélection ne fait rien** : `selectAndClose`
  ferme la liste inconditionnellement avant que le parent
  (`BoulodromesMap.selectBoulodrome`) ait pu échouer silencieusement
  (`if (!marker) return;`, cas d'un résultat de recherche référençant un
  boulodrome filtré/invisible — cf. commentaire déjà présent au ticket 05).
  Pas une régression de ce ticket : avant le correctif, la liste ne se
  fermait jamais dans *aucun* cas, succès ou échec confondus ; ce ticket ne
  change donc pas la qualité du feedback sur un échec silencieux, il fixe
  uniquement le cas majoritaire (succès). Corriger l'échec silencieux
  demanderait de faire remonter un statut de succès/échec depuis
  `onSelectBoulodrome` (actuellement `void`), hors scope ici.
