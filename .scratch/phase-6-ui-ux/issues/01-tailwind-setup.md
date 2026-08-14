# 01 — Mise en place de Tailwind CSS

**What to build:** Tailwind CSS installé et intégré à la chaîne de build (Vite), avec le mode sombre configuré en stratégie "classe" dès maintenant (même si le bouton de bascule arrive dans un ticket ultérieur, pour ne pas retoucher la configuration deux fois). Aucun composant existant n'est migré dans ce ticket — c'est une fondation, pas une fonctionnalité visible.

**Blocked by:** Aucun — peut démarrer immédiatement

**Status:** ready-for-agent

- [ ] Une classe utilitaire Tailwind appliquée à un élément produit son effet visuel dans l'app
- [ ] Le mode sombre est configuré en stratégie "classe" (pas seulement `prefers-color-scheme`), prêt pour le futur bouton de bascule
- [ ] Le CSS existant (`App.css` et les classes qu'il définit) continue de fonctionner sans régression visuelle
- [ ] `npm run build` et `npm run test` passent toujours dans `client/`
