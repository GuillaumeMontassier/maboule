# 13 — Activation clavier d'un marqueur incomplète (pas de panneau Itinéraire, pas de cafés, pas d'historique)

**What to build:** Activer un marqueur de boulodrome au clavier (Tab + Entrée) doit déclencher exactement la même logique de sélection qu'un clic souris.

**Blocked by:** aucun

**Status:** done

**Origine :** Audit UI/UX du 2026-08-16 (constat B). Chaque marqueur de boulodrome est focusable (Leaflet en fait un `<img role="button" tabindex="0">`) et répond à Entrée. Mais Leaflet ouvre son popup par son propre mécanisme interne, sans déclencher le `onClick` React attaché au marqueur (`eventHandlers={{ click: () => selectBoulodrome(id) }}` dans `BoulodromesMap.tsx`) — donc sans passer par `selectBoulodrome()`.

Conséquence, reproduite par comparaison directe (page rechargée, même marqueur) :
- Clavier (Tab jusqu'au marqueur, Entrée) → popup ouverte, mais **aucun panneau Itinéraire affiché**, **aucun café à proximité chargé**, **aucun ajout à l'historique de recherche**
- Souris (clic sur le même marqueur) → popup ouverte **et** panneau Itinéraire affiché, cafés chargés, historique mis à jour

Trois comportements pourtant garantis pour une sélection à la souris par les tickets 04, 05 et le flux Phase 4 (cafés à proximité).

- [x] Activer un marqueur de boulodrome au clavier (Entrée ou Espace) déclenche `selectBoulodrome(id)`, exactement comme un clic souris —
      ecouteur `keypress` explicite ajoute sur chaque `Marker` (`client/src/components/BoulodromesMap.tsx`),
      en plus du `click` deja present ; se declenche sur Entree et Espace (`preventDefault` sur Espace pour
      eviter le defilement de page, comportement par defaut du navigateur sur un element focusable non-formulaire) —
      la version initiale ne gerait qu'Entree, en desaccord avec ce critere d'acceptation lui-meme et avec le
      mixin `role="button"` pose par Leaflet (WAI-ARIA attend les deux touches) ; corrige suite a une relecture
      de code (cf. Comments)
- [x] Après activation clavier : le panneau Itinéraire s'affiche, les cafés à proximité se chargent, le boulodrome est ajouté à l'historique — vérifié par comparaison directe avec le comportement souris (même marqueur, même résultat)
- [x] Aucune régression sur le comportement au clic souris existant (tickets 04, 05, Phase 4)
- [x] Tests couvrant : activation clavier d'un marqueur déclenche le même chemin que `selectBoulodrome` —
      `client/src/components/BoulodromesMap.test.tsx` : activation clavier (Entrée) déclenche la même
      sélection qu'un clic souris ; activation clavier (Espace) idem ; une touche autre qu'Entrée ou
      Espace ne déclenche rien
- [x] Vérifié en navigateur réel (Playwright) : trace clavier réelle (Tab jusqu'au marqueur, Entrée), comparée à un clic souris sur le même marqueur depuis un chargement de page propre —
      les deux chemins produisent le même résultat (panneau Itinéraire affiché, café à proximité chargé,
      boulodrome place en tête de l'historique) ; Espace revérifié séparément (marqueur focusé, Espace réel
      via Playwright) : popup ouverte, panneau Itinéraire affiché, `window.scrollY` resté à 0 (le
      défilement par défaut du navigateur est bien empêché)

## Comments

Relecture de code (`/code-review aa180a4^..1a97eac`, ciblée sur `BoulodromesMap.tsx`/`.test.tsx`) a
signalé que l'implémentation ne gérait qu'Entrée, en désaccord avec le critère d'acceptation ci-dessus
qui demandait explicitement Entrée *ou* Espace. Corrigé : la touche Espace déclenche maintenant aussi
`selectBoulodrome(id)`, avec `preventDefault` pour éviter le défilement de page.

Un second signalement de la même relecture (le mixin interne de Leaflet, lié sur le même événement
`keypress`/`click`, referme le popup si on ré-active un marqueur déjà sélectionné juste avant que notre
gestionnaire ne le rouvre — ce qui rend impossible une fermeture par ré-activation du marqueur) a été
vérifié mais **pas corrigé** : reproduit à l'identique avec un double clic souris sur le même marqueur
(mécanisme préexistant, non introduit par ce ticket, et aucun critère d'acceptation ne demande de
fermeture par ré-activation — cf. `selectBoulodrome`, qui rouvre toujours la popup sans condition).
