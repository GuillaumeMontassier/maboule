# 24 — La liste de recherche (résultats/historique) ne se referme pas après sélection

**What to build:** Sélectionner un boulodrome dans la liste déroulante de la barre de recherche (résultat de recherche ou entrée d'historique) referme la liste, sur tous les breakpoints.

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Audit UI/UX du 2026-08-17. Reproduit à 1280px et 375px, chargement de page propre : focus le champ de recherche (l'historique s'affiche), cliquer une entrée d'historique → le boulodrome est bien sélectionné (popup ouverte, carte recentrée), mais la liste déroulante reste affichée par-dessus la carte, immobile, jusqu'à ce que l'utilisateur clique explicitement ailleurs sur la page. Même comportement en tapant une recherche puis en cliquant un résultat.

En cause (`client/src/components/BoulodromeSearch.tsx:148-160`) : la liste n'est affichée que si `isFocused` est vrai (`onFocus`/`onBlur` posés sur le conteneur englobant champ + liste), et `handleBlur` ne repasse `isFocused` à `false` que si le focus quitte entièrement le conteneur (`!event.currentTarget.contains(event.relatedTarget)`). Or cliquer un item de la liste (résultat ou historique) déplace le focus sur le `<button>` de cet item — qui est un descendant du même conteneur. Le focus ne quitte donc jamais le widget au moment de la sélection, `isFocused` reste `true`, et rien d'autre ne referme la liste après un `onSelect` réussi.

En mobile (375px), ce comportement est aggravé par le ticket 25 : la liste ouverte reste en outre visuellement coincée sous le bloc filtres, rendant le blocage particulièrement visible (la quasi-totalité du haut d'écran reste couverte par une liste obsolète après chaque sélection).

- [ ] Sélectionner un résultat de recherche referme la liste de résultats
- [ ] Sélectionner une entrée d'historique referme la liste d'historique
- [ ] Le comportement déjà couvert par le ticket 04 (flèche/Entrée clavier) et le ticket 05 (affichage au focus, champ vide) n'est pas régressé — la liste doit toujours s'afficher normalement au focus initial, seule la fermeture après sélection change
- [ ] Vérifié en navigateur réel (Playwright) : sélection d'un résultat de recherche et d'une entrée d'historique, à 375px et 1280px, depuis un chargement de page propre — liste absente immédiatement après la sélection
