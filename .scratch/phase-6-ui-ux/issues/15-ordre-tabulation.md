# 15 — Ordre de tabulation : les filtres passent avant la recherche

**What to build:** L'ordre de tabulation au clavier suit la hiérarchie visuelle de la page : la barre de recherche (action principale) avant les filtres (secondaires).

**Blocked by:** aucun

**Status:** done

**Origine :** Audit UI/UX du 2026-08-16 (constat D). Premier Tab depuis le chargement de la page → case à cocher « Stabilisé/cendrée » (filtre « Nature du sol »), pas le champ de recherche. En cause : `App.tsx` monte le bloc filtres avant `<BoulodromesMap>` (qui contient `<BoulodromeSearch>`) dans le JSX, alors que visuellement la recherche est l'action principale, positionnée en premier (haut-gauche desktop, au-dessus des filtres en mobile).

Un utilisateur clavier traverse donc 4 cases à cocher + 1 menu déroulant avant d'atteindre l'action qu'un utilisateur voyant identifie en premier.

- [x] Le premier élément focusable au chargement de la page est le champ de recherche, pas un filtre (en pratique le bouton de bascule dark mode passe en premier, ajouté par le ticket 10 après la rédaction de ce ticket — cohérent avec la hiérarchie visuelle : contrôle global persistant, positionné avant même la recherche ; la recherche reste bien avant les filtres)
- [x] L'ordre de tabulation reste cohérent après ce changement (pas de saut illogique ailleurs sur la page)
- [x] Aucune régression sur le comportement des filtres ou de la recherche eux-mêmes (sélection, effet sur les résultats)
- [x] Vérifié en navigateur réel (Playwright) : trace clavier réelle (Tab, Tab, Tab...) depuis un chargement de page propre → bouton dark mode, puis champ de recherche, puis (le cas échéant) les entrées d'historique, avant les filtres

## Comments

Déjà implémenté dans `App.tsx` (commentaire explicite référençant le ticket 15, lignes 43-51 : `<BoulodromesMap>` — qui contient la recherche — rendu avant le bloc filtres dans le JSX) mais pas marqué comme terminé et jamais vérifié en navigateur. Vérification Playwright effectuée le 2026-08-17 (audit UI/UX) : cases cochées, statut passé à `done`.
