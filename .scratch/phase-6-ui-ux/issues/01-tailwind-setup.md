# 01 — Mise en place de Tailwind CSS

**What to build:** Tailwind CSS installé et intégré à la chaîne de build (Vite), avec le mode sombre configuré en stratégie "classe" dès maintenant (même si le bouton de bascule arrive dans un ticket ultérieur, pour ne pas retoucher la configuration deux fois). Aucun composant existant n'est migré dans ce ticket — c'est une fondation, pas une fonctionnalité visible.

**Blocked by:** Aucun — peut démarrer immédiatement

**Status:** done

- [x] Une classe utilitaire Tailwind appliquée à un élément produit son effet visuel dans l'app —
      vérifié en navigateur (dev server) : classe temporaire appliquée à `.filters-bar` dans
      `App.tsx`, effet visuel confirmé, puis retirée (ticket fondation, pas de migration de
      composant)
- [x] Le mode sombre est configuré en stratégie "classe" (pas seulement `prefers-color-scheme`), prêt pour le futur bouton de bascule —
      `@custom-variant dark (&:where(.dark, .dark *));` dans `client/src/index.css` (approche
      Tailwind v4, remplace le `darkMode: 'class'` de `tailwind.config.js` en v3) ; vérifié en
      navigateur en togglant `.dark` sur `<html>` via la console — la couleur `dark:` s'applique
      et se retire correctement
- [x] Le CSS existant (`App.css` et les classes qu'il définit) continue de fonctionner sans régression visuelle —
      vérifié visuellement (dev server) : cards de filtres (fond blanc, bordure, ombre) inchangées
- [x] `npm run build` et `npm run test` passent toujours dans `client/` — build OK, 30/30 tests
      passent

Mis en œuvre : `@tailwindcss/vite` + `tailwindcss` en devDependencies, plugin ajouté à
`client/vite.config.ts`, entrée `@import "tailwindcss";` dans `client/src/index.css`. Ajout de
`.claude/launch.json` pour prévisualiser le serveur de dev.
