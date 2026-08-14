# 10 — Dark mode : infrastructure + bouton de bascule

**What to build:** Un bouton de bascule dark mode, placé à côté des contrôles de zoom en bas à droite, qui change le thème de l'application, persiste le choix, et respecte la préférence système par défaut au premier chargement.

**Blocked by:** 07 — Contrôles de carte : zoom en bas à droite

**Status:** ready-for-agent

- [ ] Un bouton visible près des contrôles de zoom bascule entre thème clair et sombre
- [ ] Le choix est mémorisé (`localStorage`) et réappliqué au rechargement de la page
- [ ] Au tout premier chargement (aucun choix mémorisé), le thème initial suit `prefers-color-scheme` du système
- [ ] Au moins le fond de page et le fond de carte réagissent visiblement au changement de thème (preuve que l'infrastructure fonctionne, même si tous les panneaux ne sont pas encore stylés en dark — objet du ticket suivant)
- [ ] Tests couvrant : persistance du choix, valeur initiale basée sur la préférence système en l'absence de choix mémorisé
