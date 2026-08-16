# 13 — Activation clavier d'un marqueur incomplète (pas de panneau Itinéraire, pas de cafés, pas d'historique)

**What to build:** Activer un marqueur de boulodrome au clavier (Tab + Entrée) doit déclencher exactement la même logique de sélection qu'un clic souris.

**Blocked by:** aucun

**Status:** ready-for-agent

**Origine :** Audit UI/UX du 2026-08-16 (constat B). Chaque marqueur de boulodrome est focusable (Leaflet en fait un `<img role="button" tabindex="0">`) et répond à Entrée. Mais Leaflet ouvre son popup par son propre mécanisme interne, sans déclencher le `onClick` React attaché au marqueur (`eventHandlers={{ click: () => selectBoulodrome(id) }}` dans `BoulodromesMap.tsx`) — donc sans passer par `selectBoulodrome()`.

Conséquence, reproduite par comparaison directe (page rechargée, même marqueur) :
- Clavier (Tab jusqu'au marqueur, Entrée) → popup ouverte, mais **aucun panneau Itinéraire affiché**, **aucun café à proximité chargé**, **aucun ajout à l'historique de recherche**
- Souris (clic sur le même marqueur) → popup ouverte **et** panneau Itinéraire affiché, cafés chargés, historique mis à jour

Trois comportements pourtant garantis pour une sélection à la souris par les tickets 04, 05 et le flux Phase 4 (cafés à proximité).

- [ ] Activer un marqueur de boulodrome au clavier (Entrée ou Espace) déclenche `selectBoulodrome(id)`, exactement comme un clic souris
- [ ] Après activation clavier : le panneau Itinéraire s'affiche, les cafés à proximité se chargent, le boulodrome est ajouté à l'historique — vérifié par comparaison directe avec le comportement souris (même marqueur, même résultat)
- [ ] Aucune régression sur le comportement au clic souris existant (tickets 04, 05, Phase 4)
- [ ] Tests couvrant : activation clavier d'un marqueur déclenche le même chemin que `selectBoulodrome`
- [ ] Vérifié en navigateur réel (Playwright) : trace clavier réelle (Tab jusqu'au marqueur, Entrée), comparée à un clic souris sur le même marqueur depuis un chargement de page propre
