# 09 — Mise en page générale : audit des chevauchements + finalisation Tailwind

**What to build:** Audit et correction des chevauchements entre panneaux (recherche, historique, filtres, popups, panneau Itinéraire, contrôles de zoom) sur les tailles d'écran mobile et desktop ; migration des derniers composants pas encore passés à Tailwind.

**Blocked by:** 01 — Mise en place de Tailwind CSS, 03 — Barre de recherche : repositionnement responsive, 06 — Filtres : repositionnement responsive, 07 — Contrôles de carte : zoom en bas à droite

**Status:** ready-for-agent

- [ ] Le panneau Itinéraire (RoutePanel) et le contenu des popups (badges libre/payant, distance des cafés) sont migrés vers Tailwind
- [ ] Sur mobile comme sur desktop, aucun panneau flottant ne chevauche un autre panneau flottant dans son état par défaut (recherche + filtres + zoom visibles simultanément)
- [ ] Ouvrir le popup d'un boulodrome avec le panneau Itinéraire affiché ne crée pas de chevauchement illisible sur les petits écrans
- [ ] Vérification manuelle sur au moins 3 largeurs d'écran (mobile étroit, tablette, desktop)
