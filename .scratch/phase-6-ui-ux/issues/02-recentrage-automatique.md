# 02 — Sélection d'un lieu : recentrage automatique de la carte

**What to build:** Cliquer un marqueur de boulodrome sur la carte, ou sélectionner un boulodrome via la recherche, recentre automatiquement la carte sur ce boulodrome avec une animation fluide plutôt qu'un saut instantané.

**Blocked by:** Aucun — peut démarrer immédiatement

**Status:** ready-for-agent

- [ ] Cliquer un marqueur de boulodrome anime la carte vers ce boulodrome (pas de saut instantané)
- [ ] Sélectionner un boulodrome depuis la recherche déclenche le même recentrage que le clic sur un marqueur
- [ ] Si le zoom courant est déjà ≥ 15, il est conservé ; sinon la carte monte à 16
- [ ] Changer de boulodrome sélectionné pendant qu'une animation est en cours ne laisse pas la carte dans un état incohérent
- [ ] Tests couvrant : conservation du zoom si déjà ≥ 15, montée à 16 sinon, déclenchement identique marqueur/recherche
